import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { importFromYupoo } from "./yupoo.js";
import {
  initializeFirebaseAdmin,
  verifyFirebaseToken,
  requireAdmin,
  getFirestore,
} from "./firebase-admin.js";
import { deleteImage } from "./cloudinary-config.js";
import authRoutes from "./routes/auth.js";
import paymentRoutes from "./routes/payment.js";
import logger from "./logger.js";

const app = express();

// ============================================
// SEGURANÇA E PERFORMANCE
// ============================================

// Helmet - Segurança HTTP headers (CSP desabilitado para compatibilidade)
app.use(
  helmet({
    contentSecurityPolicy: false, // Desabilitado - causa problemas com onclick e scripts inline
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Compressão gzip
app.use(compression());

// Rate limiting global (mais permissivo em desenvolvimento)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === "production" ? 100 : 1000, // 1000 em dev, 100 em prod
  message: { error: "Muitas requisições. Tente novamente mais tarde." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Rate limiting para rotas de autenticação (mais restritivo)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas
  message: {
    error: "Muitas tentativas de login. Tente novamente em 15 minutos.",
  },
  skipSuccessfulRequests: true,
});

// Rate limiting para webhooks (mais permissivo)
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 50, // 50 requisições
  message: { error: "Muitas requisições de webhook." },
});

// Logging HTTP com Morgan
const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// Middleware para medir tempo de resposta
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.logRequest(req, res, duration);
  });
  next();
});

// ============================================
// CORS
// ============================================
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000", "http://localhost:4000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite requisições sem origin (mobile apps, Postman, etc)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn("CORS bloqueado", { origin });
        callback(new Error("Origem não permitida pelo CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// INICIALIZAÇÃO
// ============================================

// Inicializa Firebase Admin
try {
  initializeFirebaseAdmin();
  logger.info("Firebase Admin inicializado com sucesso");
} catch (error) {
  logger.error("Erro ao inicializar Firebase Admin", { error: error.message });
}

// Serve frontend
const frontendDir = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendDir));

// ============================================
// ROTAS DE AUTENTICAÇÃO (com rate limiting)
// ============================================
app.use("/api/auth", authLimiter, authRoutes);

// ============================================
// ROTAS DE PAGAMENTO (webhook com rate limiting separado)
// ============================================
app.use("/api/payment/webhook", webhookLimiter);
app.use("/api/payment", paymentRoutes);
// ============================================
// ROTAS PÚBLICAS
// ============================================

// Health check detalhado
app.get("/api/health", (req, res) => {
  const healthData = {
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: "MB",
    },
    version: process.env.npm_package_version || "1.0.0",
  };

  logger.info("Health check realizado", healthData);
  res.json(healthData);
});

// Métricas (apenas em desenvolvimento)
if (process.env.NODE_ENV !== "production") {
  app.get("/api/metrics", (req, res) => {
    res.json({
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });
}

// ============================================
// ROTAS PROTEGIDAS (ADMIN)
// ============================================

// Rota da IA + scrape Yupoo (requer admin)
app.post(
  "/api/import-yupoo",
  verifyFirebaseToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { url } = req.body;

      if (!url) {
        logger.warn("Tentativa de importação sem URL", {
          user: req.user?.email,
        });
        return res.status(400).json({ error: "URL obrigatória" });
      }

      logger.info("Iniciando importação Yupoo", {
        user: req.user.email,
        url,
      });

      const result = await importFromYupoo(url);

      logger.logEvent("YUPOO_IMPORT_SUCCESS", {
        user: req.user.email,
        url,
        productId: result.id,
      });

      return res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      logger.logError(err, {
        context: "import-yupoo",
        user: req.user?.email,
        url: req.body?.url,
      });

      return res.status(500).json({
        error: err.message || "Erro interno ao importar produto",
      });
    }
  }
);

// Rota para deletar produto (requer admin)
app.delete(
  "/api/products/:productId",
  verifyFirebaseToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { productId } = req.params;

      if (!productId) {
        return res.status(400).json({ error: "ID do produto obrigatório" });
      }

      logger.info("Iniciando exclusão de produto", {
        user: req.user.email,
        productId,
      });

      const db = getFirestore();
      const productRef = db.collection("products").doc(productId);
      const productDoc = await productRef.get();

      if (!productDoc.exists) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      const productData = productDoc.data();

      // Deletar imagens do Cloudinary
      if (productData.images && Array.isArray(productData.images)) {
        for (const imageUrl of productData.images) {
          // Verificar se é URL do Cloudinary
          if (imageUrl.includes("cloudinary.com")) {
            try {
              // Extrair public_id da URL
              // Exemplo: https://res.cloudinary.com/cloud/image/upload/v1/hathor-imports/products/product-123-0.jpg
              const urlParts = imageUrl.split("/");
              const filename = urlParts[urlParts.length - 1].split(".")[0]; // product-123-0
              const folder = urlParts.slice(-3, -1).join("/"); // hathor-imports/products
              const publicId = `${folder}/${filename}`;

              await deleteImage(publicId);
              console.log(`✅ Imagem deletada do Cloudinary: ${publicId}`);
            } catch (error) {
              console.error(
                `⚠️  Erro ao deletar imagem do Cloudinary:`,
                error.message
              );
              // Continua mesmo se falhar (não bloqueia a exclusão do produto)
            }
          }
        }
      }

      // Deletar produto do Firestore
      await productRef.delete();

      logger.logEvent("PRODUCT_DELETED", {
        user: req.user.email,
        productId,
        title: productData.title,
      });

      return res.json({
        success: true,
        message: "Produto e imagens deletados com sucesso",
      });
    } catch (err) {
      logger.logError(err, {
        context: "delete-product",
        user: req.user?.email,
        productId: req.params?.productId,
      });

      return res.status(500).json({
        error: err.message || "Erro interno ao deletar produto",
      });
    }
  }
);

// ============================================
// TRATAMENTO DE ERROS GLOBAL
// ============================================
app.use((err, req, res, next) => {
  logger.logError(err, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  res.status(err.status || 500).json({
    error: err.message || "Erro interno do servidor",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Rota 404
app.use((req, res) => {
  logger.warn("Rota não encontrada", {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });
  res.status(404).json({ error: "Rota não encontrada" });
});

// ============================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  const startupInfo = {
    port: PORT,
    environment: process.env.NODE_ENV || "development",
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
  };

  logger.info("Servidor iniciado", startupInfo);

  console.log("\n============================================");
  console.log(`   🚀 Hathor Imports Backend`);
  console.log("   ============================================");
  console.log(`   Servidor: http://localhost:${PORT}`);
  console.log(`   Frontend: http://localhost:${PORT}/index.html`);
  console.log(`   Admin: http://localhost:${PORT}/admin.html`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Ambiente: ${process.env.NODE_ENV || "development"}`);
  console.log(`   Logs: backend/logs/`);
  console.log("   ============================================\n");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM recebido, encerrando servidor graciosamente");
  server.close(() => {
    logger.info("Servidor encerrado");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT recebido, encerrando servidor graciosamente");
  server.close(() => {
    logger.info("Servidor encerrado");
    process.exit(0);
  });
});

// Tratamento de erros não capturados
process.on("uncaughtException", (error) => {
  logger.error("Exceção não capturada", {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Promise rejeitada não tratada", {
    reason,
    promise,
  });
});
