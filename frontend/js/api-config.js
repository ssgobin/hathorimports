/**
 * API Configuration
 * Define a URL base da API do backend
 * 
 * Em produção: https://seu-backend.railway.app
 * Em desenvolvimento: http://localhost:4000
 */

const API_URL = (() => {
  if (typeof process !== 'undefined' && process.env.VITE_API_URL) {
    // Vercel/Build time
    return process.env.VITE_API_URL;
  }
  
  // Browser environment
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:4000';
  }
  
  // Production (Vercel)
  return window.location.origin === 'http://localhost:3000' 
    ? 'http://localhost:4000'
    : 'https://seu-backend.railway.app'; // Substitua com sua URL
})();

export default API_URL;
