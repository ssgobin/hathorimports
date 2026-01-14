import axios from "axios";
import * as cheerio from "cheerio";
import {
  scrapeYupooBrowser,
  downloadAndUploadImages,
} from "./yupoo-browser.js";

const COT = 0.75;
const MARGEM = 1.3;
const FRETE = 80;
const DECL = 100;

function removeChinese(t) {
  return t.replace(/[\u4e00-\u9fff]/g, " ");
}

function removeCodes(t) {
  return t.replace(/\b[A-Z]{2,}\d{3,}-\d{3,}\b/g, " ");
}

function removeBatchWords(t) {
  return t.replace(/\b(OG|PK|LJR|Top|Batch|Version|VT|New)\b/gi, " ");
}

function normalizeSpaces(t) {
  return t.replace(/\s+/g, " ").trim();
}

function fallbackCleanTitle(rawTitle) {
  let t = rawTitle;
  t = removeChinese(t);
  t = removeBatchWords(t);
  t = removeCodes(t);
  t = normalizeSpaces(t);
  return t || "Sneaker Importado";
}

function isValidImage(src) {
  if (!src) return false;
  if (!src.startsWith("http")) src = "https:" + src;
  const s = src.toLowerCase();
  if (s.includes("logo") || s.includes("watermark") || s.includes("icon"))
    return false;
  return /\.(jpg|jpeg|png|webp)/.test(s);
}

async function fetchYupooHtml(url) {
  try {
    const res = await axios.get(url, {
      timeout: 20000,
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "text/html",
        Referer: "https://www.google.com/",
      },
    });
    return res.data;
  } catch (err) {
    const proxyUrl =
      "https://api.allorigins.win/raw?url=" + encodeURIComponent(url);
    const prox = await axios.get(proxyUrl, { timeout: 20000 });
    return prox.data;
  }
}

async function callHuggingFace(prompt) {
  const apiKey = process.env.HF_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await axios.post(
      "https://router.huggingface.co/v1/chat/completions",
      {
        model: "deepseek-ai/DeepSeek-V3.2:novita",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 20000,
      }
    );
    return response.data.choices[0].message.content;
  } catch (err) {
    console.error("❌ IA falhou:", err.message);
    return null;
  }
}

async function analyzeTitleWithAI(rawTitle) {
  const apiKey = process.env.HF_API_KEY;
  if (!apiKey) return null;

  const prompt = `Você é uma IA especialista em análise de produtos Yupoo.
Interprete o título e retorne APENAS um JSON válido:

{
  "title": "Título limpo e comercial",
  "brand": "Marca (Nike, Adidas, Jordan, etc) ou 'Genérico'",
  "category": "sneakers | roupas | acessorios | bolsas | oculos | relogios | outros",
  "subtype": "Modelo específico",
  "priceYuan": 260
}

REGRAS:
- Retorne SOMENTE o JSON
- Ignore batches (PK, LJR, OG, etc)
- Ignore códigos de produto
- Extraia preço se houver (¥260, 169, etc)
- Se não houver preço → priceYuan = null

TÍTULO: "${rawTitle}"

JSON:`;

  try {
    const raw = await callHuggingFace(prompt);
    if (!raw) return null;

    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");

    if (start === -1 || end === -1) return null;

    const jsonStr = raw.slice(start, end + 1);
    const parsed = JSON.parse(jsonStr);

    return parsed;
  } catch (err) {
    return null;
  }
}

function normalizeCategory(aiCat, title) {
  const t = title.toLowerCase();
  let category = "sneakers";
  let label = "Sneakers";

  if (aiCat) {
    const c = aiCat.toLowerCase();
    if (c.includes("roup"))
      return { category: "roupas", categoryLabel: "Roupas" };
    if (c.includes("acess"))
      return { category: "acessorios", categoryLabel: "Acessórios" };
    if (c.includes("bag") || c.includes("bolsa"))
      return { category: "bolsas", categoryLabel: "Bolsas" };
    if (c.includes("glasses") || c.includes("oculos"))
      return { category: "oculos", categoryLabel: "Óculos" };
    if (c.includes("watch") || c.includes("relog"))
      return { category: "relogios", categoryLabel: "Relógios" };
  }

  if (t.includes("hoodie") || t.includes("moletom") || t.includes("camiseta"))
    return { category: "roupas", categoryLabel: "Roupas" };
  if (t.includes("bag") || t.includes("bolsa"))
    return { category: "bolsas", categoryLabel: "Bolsas" };

  return { category, categoryLabel: label };
}

function detectBrandByTitle(title) {
  const t = title.toLowerCase();
  if (t.includes("nike") || t.includes("air max") || t.includes("air force"))
    return "Nike";
  if (t.includes("jordan") || t.includes("aj")) return "Jordan";
  if (t.includes("adidas") || t.includes("yeezy")) return "Adidas";
  if (t.includes("new balance") || t.includes("nb")) return "New Balance";
  if (t.includes("puma")) return "Puma";
  if (t.includes("asics")) return "Asics";
  if (t.includes("oakley")) return "Oakley";
  return "Genérico";
}

export async function importFromYupoo(url) {
  console.log("📦 Importando produto...");

  let html;
  try {
    html = await scrapeYupooBrowser(url);
  } catch (puppeteerError) {
    html = await fetchYupooHtml(url);
  }

  const $ = cheerio.load(html);
  const rawTitle = $("title").text().trim() || "Produto Importado";

  const ai = await analyzeTitleWithAI(rawTitle);

  let rawPriceYuan = ai?.priceYuan || null;
  if (!rawPriceYuan) {
    const priceMatch = rawTitle.match(/¥\s*([\d.,]+)/);
    rawPriceYuan = priceMatch
      ? parseFloat(priceMatch[1].replace(",", "."))
      : null;
  }

  const cleanedFallback = fallbackCleanTitle(rawTitle);
  let finalTitle = ai?.title?.trim() || cleanedFallback;

  finalTitle = removeChinese(finalTitle);
  finalTitle = normalizeSpaces(finalTitle);

  if (!finalTitle || finalTitle.length < 3) {
    finalTitle = cleanedFallback;
  }

  const { category, categoryLabel } = normalizeCategory(
    ai?.category,
    finalTitle
  );

  const yupooImages = [];
  $("img").each((i, e) => {
    let src =
      $(e).attr("data-src") || $(e).attr("data-original") || $(e).attr("src");
    if (!src) return;
    if (!src.startsWith("http")) src = "https:" + src;
    if (isValidImage(src) && !yupooImages.includes(src)) yupooImages.push(src);
  });

  const productId = Date.now().toString();

  let images = [];
  try {
    images = await downloadAndUploadImages(yupooImages, productId, url);
  } catch (error) {
    console.error("❌ Erro no upload:", error.message);
    images = yupooImages.slice(0, 12);
  }

  const finalPriceBRL = rawPriceYuan
    ? Math.round((rawPriceYuan * COT * MARGEM + FRETE + DECL) * 100) / 100
    : null;

  const brand = ai?.brand || detectBrandByTitle(finalTitle);

  console.log(`✅ Produto importado: ${finalTitle}`);

  return {
    id: productId,
    rawTitle,
    title: finalTitle,
    brand,
    model: ai?.subtype || null,
    category,
    categoryLabel,
    images: images,
    originalYupooImages: yupooImages.slice(0, 12),
    rawPriceYuan,
    finalPriceBRL,
  };
}
