// CONTROLLER DE IMPORTAÇÃO

import { importFromYupoo } from '../services/yupoo.service.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.middleware.js';
import fs from 'fs/promises';
import path from 'path';


// Controller para importação de Yupoo
export const importYupooController = asyncHandler(async (req, res) => {
  const { url } = req.body;

  console.log('[IMPORT] Requisição recebida para:', url);

  const result = await importFromYupoo(url);

  res.status(200).json({
    success: true,
    data: result,
    message: 'Produto importado com sucesso'
  });
});

// Importa e salva o produto localmente (JSON), devolvendo o caminho salvo e as imagens
export const importAndSaveController = asyncHandler(async (req, res) => {
  const { url, defaultPrice } = req.body;
  if (!url) throw new AppError('URL é obrigatória', 400, 'URL_REQUIRED');

  const result = await importFromYupoo(url);

  const payload = {
    title: result.title,
    rawTitle: result.rawTitle,
    price: result.price || defaultPrice || 0,
    priceYuan: result.priceYuan || null,
    images: result.images || [],
    description: result.description || '',
    source: 'yupoo',
    sourceUrl: result.sourceUrl,
    importedAt: result.importedAt
  };

  // Cria pasta imports se não existir
  const importsDir = path.join(process.cwd(), 'imports');
  await fs.mkdir(importsDir, { recursive: true });

  const fileName = `product_${Date.now()}.json`;
  const filePath = path.join(importsDir, fileName);

  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');

  res.status(200).json({ success: true, savedFile: filePath, data: payload });
});
