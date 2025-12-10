import axios from "axios";
import * as cheerio from "cheerio";

/* -------------------------------------------------
   CONFIG DE PREÇO
--------------------------------------------------*/
const COT = 0.75;
const MARGEM = 1.3;
const FRETE = 80;
const DECL = 100;

/* -------------------------------------------------
   HELPERS DE LIMPEZA
--------------------------------------------------*/
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

/* -------------------------------------------------
   FILTRO DE IMAGENS
--------------------------------------------------*/
function isValidImage(src) {
  if (!src) return false;
  if (!src.startsWith("http")) src = "https:" + src;

  const s = src.toLowerCase();
  if (s.includes("logo") || s.includes("watermark") || s.includes("icon")) return false;
  return /\.(jpg|jpeg|png|webp)/.test(s);
}

/* -------------------------------------------------
   SCRAPER DO HTML
--------------------------------------------------*/
async function fetchYupooHtml(url) {
  try {
    const res = await axios.get(url, {
      timeout: 20000,
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "text/html",
        "Referer": "https://www.google.com/"
      }
    });
    return res.data;
  } catch (err) {
    console.log("[YUPOO] Axios bloqueado, usando proxy...", err.message);
    const proxyUrl = "https://api.allorigins.win/raw?url=" + encodeURIComponent(url);
    const prox = await axios.get(proxyUrl, { timeout: 20000 });
    return prox.data;
  }
}

/* -------------------------------------------------
   HUGGING FACE – OPENAI COMPATIBLE
--------------------------------------------------*/
async function callHuggingFace(prompt) {
  const apiKey = process.env.HF_API_KEY;
  if (!apiKey) {
    console.warn("[HF] Sem HF_API_KEY → fallback ativado.");
    return null;
  }

  try {
    const response = await axios.post(
      "https://router.huggingface.co/v1/chat/completions",
      {
        model: "deepseek-ai/DeepSeek-V3.2:novita",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.3
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 20000
      }
    );

    return response.data.choices[0].message.content;

  } catch (err) {
    console.error("[HF] Erro:", err.response?.data || err.message);
    return null;
  }
}

/* -------------------------------------------------
   ANÁLISE VIA IA
--------------------------------------------------*/
async function analyzeTitleWithAI(rawTitle) {
  const apiKey = process.env.HF_API_KEY;
  if (!apiKey) {
    console.warn("[HF] HF_API_KEY não definido. IA desativada.");
    return null;
  }

  console.log("\n======================");
  console.log("🧠 [HF] IA - INICIANDO ANÁLISE...");
  console.log("Título bruto:", rawTitle);
  console.log("======================\n");

  const prompt = `
Você é uma IA especialista em entender produtos de álbuns da Yupoo.

A partir do título bruto do álbum (que pode ter emojis, chinês, códigos, valores etc),
retorne APENAS um JSON com o formato EXATO abaixo, sem texto antes ou depois:

{
  "title": "Título final curto e padronizado (PT/EN)",
  "brand": "Marca principal (Nike, Adidas, NB, Yeezy...) ou 'Genérico'",
  "category": "sneakers | roupas | acessorios | bolsas | oculos | relogios | outros",
  "subtype": "Modelo específico (Dunk Low, Jordan 4, Hoodie, Bag)",
  "priceYuan": 260
}

Regras:
- Extraia preço do título se encontrar: ¥260, ￥169, 169, 280, etc.
- NÃO invente valores. Use apenas o que realmente aparecer.
- Se não encontrar nenhum valor, deixe priceYuan = null.
- Retorne apenas JSON puro.
- Não quero coisas em chinês, não quero as batches, não quero códigos de produto.
- Se for um tênis, descubra o nome exato do modelo (por exemplo: Dunk StrangeLove)

Título bruto: "${rawTitle}"
JSON:
`;

  try {
    const raw = await callHuggingFace(prompt);
    if (!raw) return null;

    console.log("🟦 [HF] Texto bruto retornado:");
    console.log(raw);

    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");

    if (start === -1 || end === -1) {
      console.log("⚠️ [HF] IA não retornou JSON. Usando fallback.");
      return null;
    }

    const jsonStr = raw.slice(start, end + 1);
    console.log("🟫 [HF] JSON extraído:", jsonStr);

    const parsed = JSON.parse(jsonStr);

    console.log("🟩 [HF] JSON interpretado:", parsed);

    return parsed;

  } catch (err) {
    console.error("❌ [HF] ERRO GRAVE:", err.message);
    return null;
  }
}

/* -------------------------------------------------
   NORMALIZAÇÃO DE CATEGORIA
--------------------------------------------------*/
function normalizeCategory(aiCat, title) {
  const t = title.toLowerCase();
  let category = "sneakers";
  let label = "Sneakers";

  if (aiCat) {
    const c = aiCat.toLowerCase();
    if (c.includes("roup")) return { category: "roupas", categoryLabel: "Roupas" };
    if (c.includes("acess")) return { category: "acessorios", categoryLabel: "Acessórios" };
    if (c.includes("bag") || c.includes("bolsa"))
      return { category: "bolsas", categoryLabel: "Bolsas" };
    if (c.includes("glasses") || c.includes("oculos"))
      return { category: "oculos", categoryLabel: "Óculos" };
    if (c.includes("watch") || c.includes("relog"))
      return { category: "relogios", categoryLabel: "Relógios" };
  }

  // fallback heurístico
  if (t.includes("hoodie") || t.includes("moletom") || t.includes("camiseta"))
    return { category: "roupas", categoryLabel: "Roupas" };

  if (t.includes("bag") || t.includes("bolsa"))
    return { category: "bolsas", categoryLabel: "Bolsas" };

  return { category, categoryLabel: label };
}

/* -------------------------------------------------
   FUNÇÃO PRINCIPAL
--------------------------------------------------*/
export async function importFromYupoo(url) {
  console.log("[YUPOO] Importando:", url);

  const html = await fetchYupooHtml(url);
  const $ = cheerio.load(html);

  const rawTitle = $("title").text().trim() || "Produto Importado";

  // IA
  const ai = await analyzeTitleWithAI(rawTitle);

  // preço da IA
  let rawPriceYuan = ai?.priceYuan || null;

  // fallback regex
  if (!rawPriceYuan) {
    const priceMatch = rawTitle.match(/¥\s*([\d.,]+)/);
    rawPriceYuan = priceMatch
      ? parseFloat(priceMatch[1].replace(",", "."))
      : null;

    if (rawPriceYuan) console.log("💰 [REGEX] Preço detectado:", rawPriceYuan);
  }

  if (!rawPriceYuan) console.log("⚠️ Nenhum preço encontrado.");

  // título
  const cleanedFallback = fallbackCleanTitle(rawTitle);
  const finalTitle = ai?.title?.trim() || cleanedFallback;

  // categoria
  const { category, categoryLabel } = normalizeCategory(ai?.category, finalTitle);

  // imagens
  const images = [];
  $("img").each((i, e) => {
    let src =
      $(e).attr("data-src") ||
      $(e).attr("data-original") ||
      $(e).attr("src");

    if (!src) return;
    if (!src.startsWith("http")) src = "https:" + src;

    if (isValidImage(src) && !images.includes(src)) images.push(src);
  });

  // preço final em BRL
  const finalPriceBRL = rawPriceYuan
    ? Math.round(((rawPriceYuan * COT) * MARGEM + FRETE + DECL) * 100) / 100
    : null;

  return {
    rawTitle,
    title: finalTitle,
    brand: ai?.brand || null,
    subtype: ai?.subtype || null,
    category,
    categoryLabel,
    images: images.slice(0, 12),
    rawPriceYuan,
    finalPriceBRL
  };
}
