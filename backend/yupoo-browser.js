import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import puppeteerCore from "puppeteer";
import { uploadToCloudinary } from "./cloudinary-config.js";

puppeteer.use(StealthPlugin());

export async function scrapeYupooBrowser(url) {
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: puppeteerCore.executablePath(),
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--window-size=1366,768",
    ],
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
  );

  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9",
  });

  await page.goto(url, {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  await autoScroll(page);

  const html = await page.content();
  await browser.close();

  return html;
}

export async function downloadAndUploadImages(imageUrls, productId, albumUrl) {
  console.log(`🚀 Processando ${imageUrls.length} imagens...`);

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: puppeteerCore.executablePath(),
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--window-size=1920,1080",
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
  );

  const cloudinaryUrls = [];
  const maxImages = Math.min(imageUrls.length, 12);

  try {
    await page.goto(albumUrl, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    await autoScroll(page);
    await new Promise((resolve) => setTimeout(resolve, 3000));

    for (let i = 0; i < maxImages; i++) {
      try {
        const imageData = await page.evaluate((index) => {
          const images = Array.from(document.querySelectorAll("img")).filter(
            (img) => {
              const src = img.src || img.dataset.src || img.dataset.original;
              if (!src) return false;
              const s = src.toLowerCase();
              return (
                !s.includes("logo") &&
                !s.includes("watermark") &&
                !s.includes("icon") &&
                (s.includes(".jpg") ||
                  s.includes(".jpeg") ||
                  s.includes(".png") ||
                  s.includes(".webp"))
              );
            }
          );

          if (!images[index]) {
            return { success: false, error: "Imagem não encontrada" };
          }

          const img = images[index];
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);

          try {
            const base64 = canvas.toDataURL("image/jpeg", 0.95).split(",")[1];
            return {
              success: true,
              base64,
              width: canvas.width,
              height: canvas.height,
            };
          } catch (e) {
            return { success: false, error: e.message };
          }
        }, i);

        if (
          !imageData.success ||
          !imageData.base64 ||
          imageData.width === 0 ||
          imageData.height === 0
        ) {
          cloudinaryUrls.push(imageUrls[i]);
          continue;
        }

        const buffer = Buffer.from(imageData.base64, "base64");

        if (buffer.length < 1024) {
          cloudinaryUrls.push(imageUrls[i]);
          continue;
        }

        const cloudinaryResult = await uploadToCloudinary(
          buffer,
          `${productId}-${i}`
        );

        if (cloudinaryResult.success) {
          cloudinaryUrls.push(cloudinaryResult.url);
        } else {
          cloudinaryUrls.push(imageUrls[i]);
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        cloudinaryUrls.push(imageUrls[i]);
      }
    }
  } catch (error) {
    console.error("❌ Erro no processamento:", error.message);
  } finally {
    await browser.close();
  }

  // Filtrar APENAS URLs do Cloudinary (remover Yupoo automaticamente)
  const cloudinaryOnly = cloudinaryUrls.filter(
    (url) => url && typeof url === "string" && url.includes("cloudinary")
  );

  console.log(`✅ ${cloudinaryOnly.length} imagens do Cloudinary (URLs do Yupoo removidas automaticamente)`);

  return cloudinaryOnly;
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 400;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= document.body.scrollHeight - 800) {
          clearInterval(timer);
          resolve();
        }
      }, 300);
    });
  });
}
