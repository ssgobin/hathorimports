// SERVIÇO DE IMPORTAÇÃO DO YUPOO

import axios from 'axios';
import * as cheerio from 'cheerio';
import { cleanTitle, extractPrice, isValidImage } from '../utils/cleaners.js';
import { AppError } from '../middleware/errorHandler.middleware.js';

// Faz requisição para URL do Yupoo com fallback para proxy
async function fetchYupooHtml(url) {
  try {
    console.log('[YUPOO] Tentando acesso direto:', url);

    const response = await axios.get(url, {
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    return response.data;
  } catch (directError) {
    console.log('[YUPOO] Acesso direto falhou. Tentando proxy...');

    try {
      const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
      const response = await axios.get(proxyUrl, { timeout: 20000 });
      return response.data;
    } catch (proxyError) {
      console.error('[YUPOO] Proxy também falhou');
      throw new AppError(
        'Falha ao acessar URL do Yupoo. Verifique a URL e tente novamente.',
        503,
        'YUPOO_FETCH_FAILED'
      );
    }
  }
}

// Extrai imagens válidas do HTML
function extractImages(html) {
  const $ = cheerio.load(html);
  const images = [];

  $('img').each((i, el) => {
    let src =
      $(el).attr('data-src') ||
      $(el).attr('data-original') ||
      $(el).attr('src');

    if (src && isValidImage(src)) {
      // Completa URL relativa
      if (!src.startsWith('http')) src = 'https:' + src;
      images.push(src);
    }
  });

  // Remove duplicatas
  return [...new Set(images)];
}

// Tenta extrair preço a partir do DOM/HTML quando não está no título
function findPriceInHtml(html, $) {
  console.log('[YUPOO] Buscando preço no HTML...');
  const candidates = [];
  try {
    // 1) Procura elementos com classes/ids que contenham 'price' ou 'yuan'
    $('*[class*="price" i], *[id*="price" i], *[class*="yuan" i], *[id*="yuan" i]').each((i, el) => {
      const text = $(el).text();
      if (text && text.length < 200) {
        console.log('[YUPOO] Candidato (elemento price):', text);
        candidates.push(text);
      }
    });

    // 2) Procura meta tags que possam conter preço
    const metaPrice = $('meta[property="product:price:amount"]').attr('content') || $('meta[name="price"]').attr('content');
    if (metaPrice) {
      console.log('[YUPOO] Candidato (meta tag):', metaPrice);
      candidates.push(metaPrice);
    }

    // 3) Busca regex específica no HTML bruto (¥NÚMERO, ￥NÚMERO, NÚMERO¥, NÚMERO￥)
    const priceMatches = html.match(/(?:¥|￥)\s*(\d+(?:[.,]\d{1,2})?)|(\d+(?:[.,]\d{1,2})?)\s*(?:¥|￥)/gi);
    if (priceMatches) {
      console.log('[YUPOO] Matches de preço encontrados:', priceMatches);
      candidates.push(...priceMatches);
    }

    // 4) Fallback: todo o HTML
    candidates.push(html);

    // Tenta extrair usando a função extractPrice para cada candidato
    for (const txt of candidates) {
      if (!txt) continue;
      const p = extractPrice(String(txt));
      if (p && !isNaN(p) && p > 0) {
        console.log('[YUPOO] Preço encontrado no candidato:', p);
        return p;
      }
    }
    
    console.log('[YUPOO] Nenhum preço encontrado em nenhum candidato');
  } catch (e) {
    console.error('[YUPOO] Erro ao buscar preço no HTML:', e.message);
  }

  return null;
}

// Função principal de importação do Yupoo
export async function importFromYupoo(url) {
  if (!url) {
    throw new AppError('URL é obrigatória', 400, 'URL_REQUIRED');
  }

  console.log('[YUPOO] Iniciando importação:', url);

  try {
    // Busca HTML
    const html = await fetchYupooHtml(url);

    // Parse com cheerio
    const $ = cheerio.load(html);

    // Extrai título bruto
    const rawTitle = $('title').text().trim() || 'Produto Importado';
    console.log('[YUPOO] Título bruto:', rawTitle);

    // Limpa título
    const title = cleanTitle(rawTitle);
    console.log('[YUPOO] Título limpo:', title);

    // Extrai preço (tenta título primeiro, depois procura no HTML/dom)
    let priceYuan = extractPrice(rawTitle);
    if (!priceYuan) {
      priceYuan = findPriceInHtml(html, $);
    }
    console.log('[YUPOO] Preço em Yuan:', priceYuan);

    // Extrai imagens
    const images = extractImages(html);
    console.log('[YUPOO] Imagens encontradas:', images.length);

    // Extrai descrição (se existir)
    const description = $('meta[name="description"]').attr('content') || '';

    // Formata resultado (inclui rawTitle para referência)
    const result = {
      rawTitle,
      title,
      price: priceYuan || 0,
      priceYuan,
      images,
      imageCount: images.length,
      description,
      sourceUrl: url,
      importedAt: new Date().toISOString()
    };

    console.log('[YUPOO] Importação concluída com sucesso');
    return result;
  } catch (err) {
    if (err.code === 'YUPOO_FETCH_FAILED') {
      throw err;
    }

    console.error('[YUPOO] Erro durante importação:', err.message);
    throw new AppError(
      'Erro ao processar produto Yupoo: ' + err.message,
      400,
      'YUPOO_IMPORT_ERROR'
    );
  }
}
