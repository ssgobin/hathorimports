import admin from "firebase-admin";
import "dotenv/config";
import { readFileSync } from "fs";

let firebaseApp;

/**
 * Inicializa o Firebase Admin SDK
 * Usa credenciais do arquivo JSON ou variáveis de ambiente
 */
export function initializeFirebaseAdmin() {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Opção 1: Usar arquivo de credenciais (RECOMENDADO)
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (serviceAccountPath) {
      console.log(
        "[Firebase Admin] Carregando credenciais do arquivo:",
        serviceAccountPath
      );
      const serviceAccount = JSON.parse(
        readFileSync(serviceAccountPath, "utf8")
      );

      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      console.log(
        "[Firebase Admin] Inicializado com sucesso usando arquivo de credenciais"
      );
      return firebaseApp;
    }

    // Opção 2: Usar variáveis de ambiente individuais
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (
      projectId &&
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_CLIENT_EMAIL
    ) {
      console.log("[Firebase Admin] Usando credenciais do .env");
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
        projectId: projectId,
      });

      console.log("[Firebase Admin] Inicializado com sucesso");
      return firebaseApp;
    }

    // Opção 3: Fallback com apenas projectId
    if (projectId) {
      console.warn(
        "[Firebase Admin] Usando apenas Project ID (funcionalidade limitada)"
      );
      firebaseApp = admin.initializeApp({
        projectId: projectId,
      });

      console.log("[Firebase Admin] Inicializado com Project ID");
      return firebaseApp;
    }

    throw new Error(
      "Nenhuma credencial do Firebase configurada. Configure FIREBASE_SERVICE_ACCOUNT_PATH no .env"
    );
  } catch (error) {
    console.error("[Firebase Admin] Erro ao inicializar:", error.message);
    throw error;
  }
}

/**
 * Retorna a instância do Firestore
 */
export function getFirestore() {
  if (!firebaseApp) {
    initializeFirebaseAdmin();
  }
  return admin.firestore();
}

/**
 * Retorna a instância do Auth
 */
export function getAuth() {
  if (!firebaseApp) {
    initializeFirebaseAdmin();
  }
  return admin.auth();
}

/**
 * Middleware para verificar token JWT do Firebase
 */
export async function verifyFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    console.log("[Auth] Verificando token...");
    console.log(
      "[Auth] Authorization header:",
      authHeader ? "Presente" : "Ausente"
    );

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("[Auth] Token não fornecido ou formato inválido");
      return res.status(401).json({
        error: "Token de autenticação não fornecido",
      });
    }

    const token = authHeader.split("Bearer ")[1];
    console.log(
      "[Auth] Token recebido (primeiros 20 chars):",
      token.substring(0, 20) + "..."
    );

    const decodedToken = await getAuth().verifyIdToken(token);
    console.log(
      "[Auth] Token verificado com sucesso para:",
      decodedToken.email
    );

    // Adiciona informações do usuário à requisição
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
    };

    next();
  } catch (error) {
    console.error("[Auth] Erro ao verificar token:", error.message);
    console.error("[Auth] Erro completo:", error);
    return res.status(403).json({
      error: "Token inválido ou expirado",
      details: error.message,
    });
  }
}

/**
 * Middleware para verificar se o usuário é admin
 */
export async function requireAdmin(req, res, next) {
  try {
    console.log("[Auth] Verificando permissões de admin...");

    if (!req.user) {
      console.log("[Auth] req.user não existe");
      return res.status(401).json({
        error: "Usuário não autenticado",
      });
    }

    console.log("[Auth] Buscando dados do usuário:", req.user.uid);
    const db = getFirestore();
    const userDoc = await db.collection("users").doc(req.user.uid).get();

    if (!userDoc.exists) {
      console.log("[Auth] Documento do usuário não existe no Firestore");
      return res.status(403).json({
        error: "Usuário não encontrado",
      });
    }

    const userData = userDoc.data();
    console.log("[Auth] Dados do usuário:", {
      email: userData.email,
      role: userData.role,
    });

    if (userData.role !== "admin") {
      console.log("[Auth] Usuário não é admin. Role:", userData.role);
      return res.status(403).json({
        error: "Acesso negado. Apenas administradores.",
        userRole: userData.role,
      });
    }

    console.log("[Auth] Usuário é admin! Acesso permitido.");
    // Adiciona dados do usuário à requisição
    req.userData = userData;
    next();
  } catch (error) {
    console.error("[Auth] Erro ao verificar admin:", error.message);
    console.error("[Auth] Stack:", error.stack);
    return res.status(500).json({
      error: "Erro ao verificar permissões",
      details: error.message,
    });
  }
}

export default admin;

// Made with Bob
