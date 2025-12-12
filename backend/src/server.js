import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// Imports locais
import importRoutes from './routes/import.routes.js';
import {
  errorHandler,
  notFoundHandler
} from './middleware/errorHandler.middleware.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CONFIGURAÇÕES INICIAIS
// Variáveis de ambiente
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');

console.log(`[SERVER] Iniciando em modo: ${NODE_ENV}`);
console.log(`[SERVER] Portas permitidas: ${ALLOWED_ORIGINS.join(', ')}`);

// MIDDLEWARE GLOBAL
// Compressão de respostas
app.use(compression());

// CORS restritivo
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  optionsSuccessStatus: 200,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requisições/janela
  message: 'Muitas requisições deste IP. Tente novamente mais tarde.',
  standardHeaders: true, // Retorna rate limit info no header
  legacyHeaders: false
});

app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// SERVER FRONTEND
const frontendDir = path.join(__dirname, '..', '..', 'frontend');
app.use(express.static(frontendDir, {
  maxAge: NODE_ENV === 'production' ? '1d' : 0,
  etag: false
}));

// ROTAS DA API
app.use('/api/import', importRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ROTA RAIZ (SPA)
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// TRATAMENTO DE ERROS
// 404 - Rota não encontrada
app.use(notFoundHandler);

// Erro global
app.use(errorHandler);

// INICIAR SERVIDOR
app.listen(PORT, () => {
  console.log(`[SERVER] Rodando na porta ${PORT}`);
  console.log(`Frontend disponível em http://localhost:${PORT}`);
  console.log(`API disponível em http://localhost:${PORT}/api`);
  console.log(`Health check em http://localhost:${PORT}/api/health`);
});

// TRATAMENTO DE EXCEÇÕES NÃO CAPTURADAS
process.on('unhandledRejection', (reason, promise) => {
  console.error('[ERROR] Promise rejection não tratada:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[ERROR] Exceção não capturada:', err);
  process.exit(1);
});
