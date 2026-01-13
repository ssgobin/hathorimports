import express from "express";
import { verifyFirebaseToken, requireAdmin } from "../firebase-admin.js";

const router = express.Router();

/**
 * GET /api/auth/config
 * Retorna configuração pública do Firebase para o frontend
 * Não requer autenticação
 */
router.get("/config", (req, res) => {
  try {
    const config = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
      measurementId: process.env.FIREBASE_MEASUREMENT_ID
    };

    res.json(config);
  } catch (error) {
    console.error("[Auth Config] Erro:", error.message);
    res.status(500).json({ error: "Erro ao obter configuração" });
  }
});

/**
 * GET /api/auth/verify
 * Verifica se o token do usuário é válido
 * Requer autenticação
 */
router.get("/verify", verifyFirebaseToken, (req, res) => {
  try {
    res.json({
      valid: true,
      user: req.user
    });
  } catch (error) {
    console.error("[Auth Verify] Erro:", error.message);
    res.status(500).json({ error: "Erro ao verificar token" });
  }
});

/**
 * GET /api/auth/check-admin
 * Verifica se o usuário é admin
 * Requer autenticação
 */
router.get("/check-admin", verifyFirebaseToken, requireAdmin, (req, res) => {
  try {
    res.json({
      isAdmin: true,
      user: req.userData
    });
  } catch (error) {
    console.error("[Auth Check Admin] Erro:", error.message);
    res.status(500).json({ error: "Erro ao verificar admin" });
  }
});

export default router;

// Made with Bob
