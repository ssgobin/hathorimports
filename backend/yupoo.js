import axios from "axios";
import * as cheerio from "cheerio";

/* -------------------------------------------------
   CLEANERS
--------------------------------------------------*/
function removeChinese(t) {
  return t.replace(/[\u4e00-\u9fff]/g, " ");
}
function removeCodes(t) {
  return t.replace(/\b[A-Z]{2,}\d{3,}-\d{3,}\b/gi, " ");
}
function removeBatchWords(t) {
  return t.replace(/\b(OG|PK|LJR|Top|Batch|Version|VT|New|C Batch)\b/gi, " ");
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
  t = t.replace(/\|\s*又拍图片管家/gi, "");
  t = t.replace(/[|]/g, " ");
  return normalizeSpaces(t) || "Sneaker Importado";
}

/* -------------------------------------------------
   VALID IMAGE FILTER
--------------------------------------------------*/
function isValidImage(src) {
  if (!src) return false;
  if (!src.startsWith("http")) src = "https:" + src;
  const s = src.toLowerCase();
  if (s.includes("logo") || s.includes("watermark") || s.includes("icon"))
    return false;
  return /\.(jpg|jpeg|png|webp)/.test(s);
}

/* -------------------------------------------------
   FETCH HTML
--------------------------------------------------*/
async function fetchYupooHtml(url) {
  try {
    const res = await axios.get(url, {
      timeout: 20000,
      headers: {
        "User-Agent": "Mozilla/5.0",
      }
    });
    return res.data;
  } catch (err) {
    console.log("[YUPOO] Falhou. Tentando proxy...");
    const p = "https://api.allorigins.win/raw?url=" + encodeURIComponent(url);
    const r = await axios.get(p, { timeout: 20000 });
    return r.data;
  }
}

/* -------------------------------------------------
   PRICE DETECTOR (SEM IA)
--------------------------------------------------*/
function detectPrice(rawTitle) {
  // ¥260
  let m = rawTitle.match(/¥\s*([\d.]+)/i);
  if (m) return parseFloat(m[1]);

  // 260Y, 260 y, 【260Y】
  m = rawTitle.match(/([\d.]+)\s*y/i);
  if (m) return parseFloat(m[1]);

  return null;
}

/* -------------------------------------------------
   MAIN FUNCTION
--------------------------------------------------*/
export async function importFromYupoo(url) {
  console.log("[YUPOO] Importando:", url);

  const html = await fetchYupooHtml(url);
  const $ = cheerio.load(html);

  const rawTitle = $("title").text().trim() || "Produto Importado";

  // LIMPEZA DO TÍTULO (SEM IA)
  const finalTitle = fallbackCleanTitle(rawTitle);

  // PREÇO BRUTO
  const rawPriceYuan = detectPrice(rawTitle);

  // IMAGENS
  const images = [];
  $("img").each((i, el) => {
    let src =
      $(el).attr("data-src") ||
      $(el).attr("data-original") ||
      $(el).attr("src");

    if (!src) return;
    if (!src.startsWith("http")) src = "https:" + src;
    if (isValidImage(src) && !images.includes(src)) images.push(src);
  });

  // CATEGORIA SIMPLES
  const cat = finalTitle.toLowerCase();
  let category = "sneakers";
  let categoryLabel = "Tênis";

  if (cat.includes("hoodie") || cat.includes("shirt") || cat.includes("camisa")) {
    category = "roupas";
    categoryLabel = "Roupas";
  }
  if (cat.includes("bag") || cat.includes("bolsa")) {
    category = "bolsas";
    categoryLabel = "Bolsas";
  }

  return {
    rawTitle,
    title: finalTitle,
    rawPriceYuan,
    images: images.slice(0, 15),
    category,
    categoryLabel,
    finalPriceBRL: null // cálculo agora é do admin-page.js via localStorage
  };
}
