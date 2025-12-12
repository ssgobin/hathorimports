// TRATAMENTO CENTRALIZADO DE ERROS

// Classe customizada para erros da aplicação
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.timestamp = new Date().toISOString();

    // Preserva stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Middleware para tratamento centralizado de erros
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';
  const code = err.code || 'INTERNAL_ERROR';
  const timestamp = err.timestamp || new Date().toISOString();

  // Log do erro
  console.error(`[ERROR ${statusCode}] ${code} - ${message}`);
  if (err.stack && process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Resposta ao cliente
  const response = {
    error: {
      code,
      message,
      statusCode,
      timestamp,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  };

  res.status(statusCode).json(response);
}

// Middleware para capturar erros em rotas não definidas
export function notFoundHandler(req, res, next) {
  const error = new AppError(
    `Rota não encontrada: ${req.method} ${req.path}`,
    404,
    'NOT_FOUND'
  );
  next(error);
}

// Wrapper para async/await em routes
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
