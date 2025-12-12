// PADRÕES DE LIMPEZA DE TÍTULO - CENTRALIZADOS

export const PATTERNS = {
  CHINESE: /[\u4e00-\u9fff]/g,
  CODES: /\b[A-Z]{2,}\d{3,}-\d{3,}\b/gi,
  BATCH_WORDS: /\b(OG|PK|LJR|Top|Batch|Version|VT|New|C Batch)\b/gi,
  PIPES: /\|/g,
  WATERMARK: /又拍图片管家/gi,
  WHITESPACE: /\s+/g,
  PRICE_YUAN: /¥\s*([\d.]+)/i,
  PRICE_Y: /([\d.]+)\s*y/i
};

// Extrai tokens de marca/série do título (ex: "New", "VT", "Pro", etc)
// Tokens válidos são palavras que costumam acompanhar nomes de produtos
function extractProductTokens(text) {
  if (!text || typeof text !== 'string') return [];
  
  const validTokens = [
    'new', 'air', 'jordan', 'aj1', 'dunk', 'force', 'react', 'blazer', 'cortez',
    'pro', 'max', 'zoom', 'vt', 'sb', 'travis', 'cactus', 'jack', 'low', 'high',
    'mid', 'plus', 'og', 'retro', 'classic', 'vintage', 'edition', 'special',
    'premium', 'elite', 'x', 'collaboration', 'limited'
  ];
  
  const words = text.toLowerCase().split(/[\s\|]+/).filter(w => w.length > 0);
  return words.filter(w => validTokens.includes(w.replace(/[^\w]/g, '')));
}

/**
 * Limpa título removendo caracteres chineses, códigos de lote e símbolos
 * Preserva palavras-chave que indicam o produto (ex: "New VT Dunk")
 * @param {string} rawTitle - Título bruto
 * @returns {string} Título limpo
 */
export function cleanTitle(rawTitle) {
  if (!rawTitle || typeof rawTitle !== 'string') {
    return 'Sneaker Importado';
  }

  let title = rawTitle;

  // 1) Extrai tokens válidos ANTES de remover chinês/símbolos
  // (para preservar a ordem e contexto)
  const tokens = extractProductTokens(title);

  // 2) Remove chinês
  title = title.replace(PATTERNS.CHINESE, ' ');

  // 3) Remove conteúdo entre colchetes COM PREÇO (ex: 【￥220Y】, [￥220Y])
  // Prerva colchetes com texto apenas inglês/números (ex: [New], [OG])
  title = title.replace(/\[￥|【￥/gi, '[PRICE').replace(/\[.*?Y\]|【.*?Y】/gi, ' ');
  title = title.replace(/【[^\u4e00-\u9fff]*?】/g, ' ');

  // 4) Remove pipes e watermarks
  title = title.replace(PATTERNS.PIPES, ' ');
  title = title.replace(PATTERNS.WATERMARK, '');

  // 5) Remove tokens de preço (¥, ￥, Y, y)
  title = title.replace(/¥|￥/g, ' ');
  title = title.replace(/\b\d+[.,]?\d*\s*[yY]\b/g, ' ');
  title = title.replace(/\b\d+[.,]?\d*\s*[Rr]\$\b/g, ' ');

  // 6) Remove códigos de produto (ex: HQ8487-400)
  title = title.replace(PATTERNS.CODES, ' ');

  // 7) Normaliza espaços
  title = title.replace(PATTERNS.WHITESPACE, ' ').trim();

  // 8) Se temos tokens extraídos, usa; senão retorna o que sobrou
  if (tokens.length > 0) {
    // Capitaliza cada token e junta
    const cleaned = tokens.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' ');
    return cleaned || title || 'Sneaker Importado';
  }

  return title || 'Sneaker Importado';
}

/**
 * Extrai preço em Yuan do texto
 * @param {string} text - Texto contendo o preço
 * @returns {number|null} Preço extraído ou null
 */
export function extractPrice(text) {
  if (!text || typeof text !== 'string') return null;

  const originalText = text;

  // Tenta formato: ¥200 ou ￥200
  let match = text.match(PATTERNS.PRICE_YUAN);
  if (match) {
    const p = parseFloat(match[1]);
    if (p && p > 0) return p;
  }

  // Tenta formato: 200Y ou 200 y
  match = text.match(PATTERNS.PRICE_Y);
  if (match) {
    const p = parseFloat(match[1]);
    if (p && p > 0) return p;
  }

  // Tenta buscar qualquer número próximo a ¥ ou ￥ (mais agressivo)
  match = text.match(/(?:¥|￥)\s*(\d+(?:[.,]\d{1,2})?)/);
  if (match) {
    const num = match[1].replace(',', '.');
    const p = parseFloat(num);
    if (p && p > 0) return p;
  }

  // Tenta formato reverso: 260¥ ou 260￥
  match = text.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:¥|￥)/);
  if (match) {
    const num = match[1].replace(',', '.');
    const p = parseFloat(num);
    if (p && p > 0) return p;
  }

  return null;
}

/**
 * Valida se uma URL de imagem é válida
 * @param {string} src - URL da imagem
 * @returns {boolean} True se válida
 */
export function isValidImage(src) {
  if (!src || typeof src !== 'string') return false;

  // Completa URL relativa
  if (!src.startsWith('http')) src = 'https:' + src;

  const s = src.toLowerCase();

  // Filtra logos e watermarks
  if (s.includes('logo') || s.includes('watermark') || s.includes('icon')) {
    return false;
  }

  // Valida extensão
  return /\.(jpg|jpeg|png|webp)/.test(s);
}
