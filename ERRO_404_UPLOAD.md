# 🔴 ERRO 404 - Upload de Produto

## Causa do Erro

Você está recebendo `404` ao tentar fazer upload porque:

1. **Frontend usa `http://localhost:4000`** (hardcoded)
   - Mas você está em Vercel (produção)
   - Precisa usar a URL do backend do Railway

2. **Há referências diretas ao localhost** no código do frontend

---

## ✅ Solução

### Passo 1: Verificar arquivo `api-config.js`

Seu arquivo `frontend/js/api-config.js` deve ter:

```javascript
const API_URL = (() => {
  if (typeof process !== 'undefined' && process.env.VITE_API_URL) {
    return process.env.VITE_API_URL;
  }
  
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:4000';
  }
  
  return 'https://seu-backend.railway.app';
})();

export default API_URL;
```

### Passo 2: Usar API_URL em todos os endpoints

Em `frontend/js/store.js`, adicione no início:
```javascript
import API_URL from "./api-config.js";
```

Depois procure por `http://localhost:4000` e substitua por `${API_URL}`:

**Antes:**
```javascript
const response = await fetch(
  `http://localhost:4000/api/products/${productId}`,
  {
    method: "DELETE",
```

**Depois:**
```javascript
const response = await fetch(
  `${API_URL}/api/products/${productId}`,
  {
    method: "DELETE",
```

### Passo 3: Variável de Ambiente no Vercel

1. Vá em seu projeto Vercel
2. Settings → Environment Variables
3. Adicione:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://seu-backend-railway.app` (sua URL real)
4. Redeploy

### Passo 4: Testar

1. Vá no console do navegador (F12)
2. Cole e execute:
```javascript
const API_URL = window.location.origin === 'http://localhost:3000' 
  ? 'http://localhost:4000'
  : 'https://seu-backend.railway.app';
console.log('API URL:', API_URL);
```

3. Deve retornar sua URL do Railway (não localhost)

---

## 🔍 Se o erro persistir

### Verificar CORS

O backend precisa ter a URL do Vercel em `ALLOWED_ORIGINS`:

1. Vá em Railway Dashboard
2. Variables
3. `ALLOWED_ORIGINS` deve incluir sua URL Vercel:
   ```
   https://seu-frontend.vercel.app
   ```

### Verificar rota no Backend

Certifique-se que a rota `/api/products/:id` existe no backend.

Se não existir, precisa criar:

```javascript
// backend/routes/products.js
router.delete("/products/:id", verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // Deletar de Firebase e Cloudinary
    // ...
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 📝 Resumo

| Problema | Solução |
|----------|---------|
| 404 ao deletar produto | Usar `API_URL` config, não hardcoded |
| Frontend não conecta ao backend | Verificar `VITE_API_URL` no Vercel |
| CORS error | Adicionar URL Vercel em `ALLOWED_ORIGINS` Railway |
| Rota não existe | Criar rota de produtos no backend |

---

**Tem mais dúvidas? Me avisa! 🚀**
