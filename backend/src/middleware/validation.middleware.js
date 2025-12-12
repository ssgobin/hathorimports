// MIDDLEWARE DE VALIDAÇÃO

import validator from 'validator';

// Whitelist de domínios permitidos para scraping
const ALLOWED_DOMAINS = ['yupoo.com'];

// Middleware para validar URL de importação
export function validateUrl(req, res, next) {
  try {
    const { url } = req.body;

    // Valida se URL foi fornecida
    if (!url) {
      return res.status(400).json({
        error: 'URL é obrigatória',
        code: 'URL_REQUIRED'
      });
    }

    // Valida formato de URL
    if (!validator.isURL(url)) {
      return res.status(400).json({
        error: 'URL inválida. Forneça uma URL válida.',
        code: 'INVALID_URL_FORMAT'
      });
    }

    // Valida domínio
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      const isAllowed = ALLOWED_DOMAINS.some(domain => hostname.includes(domain));

      if (!isAllowed) {
        return res.status(403).json({
          error: `Domínio não permitido. Domínios aceitos: ${ALLOWED_DOMAINS.join(', ')}`,
          code: 'DOMAIN_NOT_ALLOWED'
        });
      }
    } catch (err) {
      return res.status(400).json({
        error: 'URL inválida',
        code: 'URL_PARSE_ERROR'
      });
    }

    // Valida comprimento da URL
    if (url.length > 2048) {
      return res.status(400).json({
        error: 'URL muito longa (máximo 2048 caracteres)',
        code: 'URL_TOO_LONG'
      });
    }

    next();
  } catch (err) {
    console.error('[VALIDATION ERROR]', err);
    res.status(500).json({
      error: 'Erro ao validar requisição',
      code: 'VALIDATION_ERROR'
    });
  }
}

// Middleware para validar JSON
export function validateJSON(req, res, next) {
  if (req.is('application/json') === false && Object.keys(req.body).length > 0) {
    return res.status(400).json({
      error: 'Content-Type deve ser application/json',
      code: 'INVALID_CONTENT_TYPE'
    });
  }
  next();
}
