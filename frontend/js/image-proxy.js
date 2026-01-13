/**
 * Helper para fazer proxy de imagens do Yupoo através do backend
 * Resolve o problema de bloqueio HTTP 567 do Yupoo
 */

/**
 * Converte uma URL do Yupoo para usar o proxy do backend
 * @param {string} url - URL original da imagem do Yupoo
 * @returns {string} - URL do proxy ou placeholder se inválida
 */
export function getProxiedImageUrl(url) {
  if (!url) return "https://placehold.co/600x400?text=Sem+Imagem";

  // Se não for do Yupoo, retorna a URL original
  if (!url.includes("yupoo.com")) {
    return url;
  }

  // Retorna a URL do proxy
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

/**
 * Converte um array de URLs para usar o proxy
 * @param {string[]} urls - Array de URLs originais
 * @returns {string[]} - Array de URLs com proxy
 */
export function getProxiedImageUrls(urls) {
  if (!Array.isArray(urls)) return [];
  return urls.map(getProxiedImageUrl);
}

// Made with Bob
