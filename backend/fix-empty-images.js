/**
 * Script para limpar imagens vazias dos produtos no Firebase
 * Remove URLs do Yupoo que estão bloqueadas
 */

import admin from "firebase-admin";
import { readFileSync } from "fs";

// Carregar credenciais do Firebase
const serviceAccount = JSON.parse(
  readFileSync("./firebase-service-account.json", "utf8")
);

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function fixEmptyImages() {
  try {
    console.log("🔍 Buscando produtos...");

    const productsSnapshot = await db.collection("products").get();

    if (productsSnapshot.empty) {
      console.log("❌ Nenhum produto encontrado");
      return;
    }

    console.log(`📦 ${productsSnapshot.size} produtos encontrados\n`);

    let fixedCount = 0;
    let totalImagesRemoved = 0;

    for (const doc of productsSnapshot.docs) {
      const product = doc.data();
      const productId = doc.id;

      console.log(`\n📦 ${product.title || productId}`);

      // Verificar se tem array de imagens
      if (!product.images || !Array.isArray(product.images)) {
        console.log(`   ⚠️  Sem array de imagens`);
        continue;
      }

      const originalLength = product.images.length;
      console.log(`   📸 Total: ${originalLength} imagens`);

      // Mostrar cada imagem
      product.images.forEach((img, idx) => {
        const isCloudinary =
          img && typeof img === "string" && img.includes("cloudinary");
        console.log(
          `   ${idx + 1}. ${
            isCloudinary ? "✅ Cloudinary" : "❌ Yupoo/Outro"
          }: ${img?.substring(0, 60)}...`
        );
      });

      // Filtrar apenas URLs do Cloudinary (remover Yupoo que está bloqueado)
      const validImages = product.images.filter(
        (img) => img && typeof img === "string" && img.includes("cloudinary")
      );

      const removedCount = originalLength - validImages.length;
      console.log(`   🔄 Após filtro: ${validImages.length} imagens`);

      // Se removeu alguma imagem, atualizar no Firebase
      if (removedCount > 0) {
        await db.collection("products").doc(productId).update({
          images: validImages,
        });

        fixedCount++;
        totalImagesRemoved += removedCount;

        console.log(`✅ ${product.title || productId}`);
        console.log(
          `   Antes: ${originalLength} imagens | Depois: ${validImages.length} imagens`
        );
        console.log(`   Removidas: ${removedCount} URLs do Yupoo\n`);
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log(`✅ Limpeza concluída!`);
    console.log(`📊 Produtos corrigidos: ${fixedCount}`);
    console.log(`🗑️  Total de URLs do Yupoo removidas: ${totalImagesRemoved}`);
    console.log("=".repeat(50));
  } catch (error) {
    console.error("❌ Erro ao limpar imagens:", error);
  } finally {
    process.exit(0);
  }
}

// Executar
fixEmptyImages();
