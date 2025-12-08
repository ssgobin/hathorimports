import * as cheerio from "cheerio";
import { pipeline } from "@xenova/transformers";

let model = null;
async function getModel() {
  if (!model) {
    model = await pipeline("text-generation", "Xenova/TinyLlama-1.1B-Chat-v1.0");
  }
  return model;
}

function isImagemValida(src) {
  if (!src) return false;
  return /\.(jpg|jpeg|png|webp)(\?|$)/i.test(src);
}

export async function importFromHtml(html) {
  const $ = cheerio.load(html);

  const rawTitle =
    $("title").text().trim() ||
    $("h1").text().trim() ||
    "Produto Importado";

  const images = [];
  $("img").each((_, e) => {
    let src =
      $(e).attr("src") ||
      $(e).attr("data-src") ||
      $(e).attr("data-original");

    if (!src) return;
    if (!src.startsWith("http")) src = "https:" + src;

    if (isImagemValida(src) && !images.includes(src)) {
      images.push(src);
    }
  });

  const imgs = images.slice(0, 15);

  // IA para o título
  const llm = await getModel();
  const out = await llm(
    `Crie um nome curto e profissional para este produto:\n${rawTitle}\nNome:`,
    { max_new_tokens: 40 }
  );

  let title =
    out[0].generated_text.split("Nome:")[1]?.trim() || rawTitle;

  return {
    rawTitle,
    title,
    images: imgs
  };
}
