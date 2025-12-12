// ROTAS DE IMPORTAÇÃO

import { Router } from 'express';
import { importYupooController, importAndSaveController } from '../controllers/import.controller.js';
import { validateUrl } from '../middleware/validation.middleware.js';

const router = Router();

// POST /api/import/yupoo
// Importa produto de uma URL do Yupoo
router.post('/yupoo', validateUrl, importYupooController);

// POST /api/import/yupoo/save - importa e persiste localmente (JSON)
router.post('/yupoo/save', validateUrl, importAndSaveController);

export default router;
