import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import puppeteerCore from "puppeteer"; // 👈 IMPORTANTE !!!

puppeteer.use(StealthPlugin());

export async function scrapeYupooBrowser(url) {
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: puppeteerCore.executablePath(), // 👈 AQUI ESTÁ O FIX REAL
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--window-size=1366,768"
    ]
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
  );

  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9"
  });

  console.log("Acessando álbum Yupoo...");
  await page.goto(url, {
    waitUntil: "networkidle2",
    timeout: 60000
  });

  await autoScroll(page);

  const html = await page.content();
  await browser.close();
  return html;
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise(resolve => {
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
