import admin from "firebase-admin";
import { createWriteStream, unlinkSync } from "fs";
import { pipeline } from "stream/promises";
import { randomBytes } from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Faz download de uma imagem do Yupoo e faz upload para o Firebase Storage
 * @param {string} yupooUrl - URL da imagem no Yupoo
 * @returns {Promise<string>} - URL pública da imagem no Firebase Storage
 */
export async function uploadImageToFirebase(yupooUrl) {
  const tempFileName = `temp-${randomBytes(16).toString("hex")}.jpg`;
  const tempFilePath = path.join(__dirname, "uploads", tempFileName);

  try {
    console.log(`📥 Baixando imagem: ${yupooUrl}`);

    // 1. Fazer download da imagem do Yupoo
    const response = await fetch(yupooUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://yupoo.com/",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`Falha ao baixar imagem: HTTP ${response.status}`);
    }

    // 2. Salvar temporariamente no disco
    const fileStream = createWriteStream(tempFilePath);
    await pipeline(response.body, fileStream);

    console.log(`💾 Imagem salva temporariamente: ${tempFileName}`);

    // 3. Fazer upload para o Firebase Storage
    const bucket = admin.storage().bucket();
    const firebaseFileName = `products/${Date.now()}-${randomBytes(8).toString(
      "hex"
    )}.jpg`;

    await bucket.upload(tempFilePath, {
      destination: firebaseFileName,
      metadata: {
        contentType: "image/jpeg",
        metadata: {
          source: "yupoo",
          originalUrl: yupooUrl,
        },
      },
    });

    console.log(`☁️ Upload concluído: ${firebaseFileName}`);

    // 4. Tornar a imagem pública e obter URL
    const file = bucket.file(firebaseFileName);
    await file.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${firebaseFileName}`;

    // 5. Limpar arquivo temporário
    try {
      unlinkSync(tempFilePath);
    } catch (err) {
      console.warn(
        `⚠️ Não foi possível deletar arquivo temporário: ${err.message}`
      );
    }

    console.log(`✅ Imagem disponível em: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    // Limpar arquivo temporário em caso de erro
    try {
      unlinkSync(tempFilePath);
    } catch (err) {
      // Ignorar erro ao deletar
    }

    console.error(`❌ Erro ao processar imagem ${yupooUrl}:`, error.message);
    throw error;
  }
}

/**
 * Faz upload de múltiplas imagens em paralelo
 * @param {string[]} yupooUrls - Array de URLs do Yupoo
 * @param {number} maxConcurrent - Número máximo de uploads simultâneos
 * @returns {Promise<string[]>} - Array de URLs públicas no Firebase Storage
 */
export async function uploadMultipleImages(yupooUrls, maxConcurrent = 3) {
  const results = [];
  const errors = [];

  console.log(
    `📦 Iniciando upload de ${yupooUrls.length} imagens (${maxConcurrent} por vez)`
  );

  // Processar em lotes para não sobrecarregar
  for (let i = 0; i < yupooUrls.length; i += maxConcurrent) {
    const batch = yupooUrls.slice(i, i + maxConcurrent);
    const batchPromises = batch.map(async (url) => {
      try {
        const firebaseUrl = await uploadImageToFirebase(url);
        return { success: true, url: firebaseUrl };
      } catch (error) {
        console.error(`❌ Falha ao fazer upload de ${url}:`, error.message);
        return { success: false, error: error.message, originalUrl: url };
      }
    });

    const batchResults = await Promise.all(batchPromises);

    batchResults.forEach((result) => {
      if (result.success) {
        results.push(result.url);
      } else {
        errors.push(result);
      }
    });

    console.log(`✅ Lote ${Math.floor(i / maxConcurrent) + 1} concluído`);
  }

  if (errors.length > 0) {
    console.warn(`⚠️ ${errors.length} imagens falharam no upload`);
  }

  console.log(
    `🎉 Upload concluído: ${results.length}/${yupooUrls.length} imagens`
  );

  return results;
}
