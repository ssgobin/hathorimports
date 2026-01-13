# 🔧 TROUBLESHOOTING - HATHOR IMPORTS

## 🐛 Problemas Comuns e Soluções

### 1. Botões não funcionam (onclick)

**Sintomas:**

- Botão "Adicionar ao Carrinho" não responde
- Outros botões com `onclick` não funcionam
- Console mostra erro de CSP

**Causa:**
Content Security Policy (CSP) muito restritivo bloqueando eventos inline

**Solução Temporária (Desenvolvimento):**
Desabilite o Helmet temporariamente para testar:

```javascript
// backend/server.js - linha 26
// Comente temporariamente:
// app.use(helmet({...}));
```

**Solução Permanente:**
O CSP já está configurado com `'unsafe-inline'` para scripts. Se ainda houver problemas:

1. **Verifique o console do navegador (F12)**
2. **Procure por erros de CSP**
3. **Se necessário, adicione ao CSP:**

```javascript
// backend/server.js
scriptSrc: [
  "'self'",
  "'unsafe-inline'",
  "'unsafe-eval'",
  // ... outros
],
```

### 2. Admin não carrega abas

**Sintomas:**

- Apenas Dashboard funciona
- Outras abas não abrem
- Console mostra erro de import

**Solução:**
Verifique se `updateOrder` foi removido dos imports:

```javascript
// frontend/js/admin-page.js - linha 1-13
// NÃO deve ter updateOrder na lista
import {
  createProduct,
  listProducts,
  // ... outros
  listOrders, // ← sem vírgula depois
} from "./store.js";
```

### 3. Firebase não conecta

**Sintomas:**

- Erro de CSP para `.map` files
- Firebase SDK não carrega
- Firestore não funciona

**Solução:**
Verifique se `www.gstatic.com` está no CSP:

```javascript
// backend/server.js
connectSrc: [
  "'self'",
  "https://www.gstatic.com",  // ← Necessário para .map files
  "https://*.firebaseio.com",
  "https://*.googleapis.com",
  "https://firestore.googleapis.com",
],
```

### 4. Mercado Pago não funciona

**Sintomas:**

- Botão de pagamento não aparece
- Erro ao criar preferência
- Webhook retorna erro

**Soluções:**

**A) Credenciais incorretas:**

```bash
# Verifique backend/.env
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...  # Deve começar com APP_USR
MERCADOPAGO_PUBLIC_KEY=APP_USR-...    # Deve começar com APP_USR
```

**B) SDK não carrega:**

```javascript
// Verifique CSP em backend/server.js
scriptSrc: [
  "https://sdk.mercadopago.com",  // ← Necessário
],
```

**C) Webhook não recebe notificações:**

- Configure URL pública no painel do Mercado Pago
- Use ngrok para testes locais:

```bash
ngrok http 4000
# Use a URL do ngrok no painel MP
```

### 5. Imagens não carregam

**Sintomas:**

- Imagens quebradas
- Erro 404 para imagens
- CSP bloqueia imagens

**Solução:**
Verifique CSP para imagens:

```javascript
// backend/server.js
imgSrc: ["'self'", "data:", "https:", "http:"],
```

### 6. Logs não aparecem

**Sintomas:**

- Pasta `logs/` vazia
- Nenhum arquivo de log criado

**Solução:**

```bash
# Verifique permissões
cd backend
mkdir -p logs
chmod 755 logs

# Verifique variável de ambiente
echo $LOG_LEVEL  # Deve ser info, warn, error ou debug
```

### 7. Rate Limiting bloqueando requisições

**Sintomas:**

- Erro "Muitas requisições"
- Status 429
- Não consegue fazer login

**Solução Temporária:**

```javascript
// backend/server.js - Aumente os limites
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // ← Aumente para desenvolvimento
});
```

**Solução Permanente:**
Configure limites diferentes para dev/prod:

```javascript
const max = process.env.NODE_ENV === "production" ? 100 : 1000;
```

### 8. Service Worker causando problemas

**Sintomas:**

- Página não atualiza
- Arquivos antigos sendo servidos
- Mudanças não aparecem

**Solução:**

```javascript
// No console do navegador (F12):
navigator.serviceWorker.getRegistrations().then((registrations) => {
  registrations.forEach((reg) => reg.unregister());
});

// Depois limpe o cache:
// Chrome: Ctrl+Shift+Delete
// Firefox: Ctrl+Shift+Delete
```

### 9. PWA não instala

**Sintomas:**

- Botão de instalação não aparece
- Erro no manifest.json
- Ícones não carregam

**Solução:**

```bash
# Verifique manifest.json
curl http://localhost:4000/manifest.json

# Verifique ícones
curl -I http://localhost:4000/assets/hathor-logo.png

# Verifique HTTPS (necessário para PWA)
# Em produção, use certificado SSL válido
```

### 10. Servidor não inicia

**Sintomas:**

- Erro ao executar `npm start`
- Porta já em uso
- Módulos não encontrados

**Soluções:**

**A) Porta em uso:**

```bash
# Linux/Mac
lsof -ti:4000 | xargs kill -9

# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

**B) Módulos faltando:**

```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

**C) Erro de sintaxe:**

```bash
# Verifique logs
npm start 2>&1 | tee error.log
```

## 🔍 Comandos Úteis de Debug

### Verificar logs em tempo real:

```bash
# Logs combinados
tail -f backend/logs/combined.log

# Apenas erros
tail -f backend/logs/error.log

# PM2 logs
pm2 logs hathor-imports
```

### Testar endpoints:

```bash
# Health check
curl http://localhost:4000/api/health

# Listar produtos (requer autenticação)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:4000/api/products
```

### Verificar variáveis de ambiente:

```bash
cd backend
cat .env | grep -v "^#" | grep -v "^$"
```

### Limpar cache e reiniciar:

```bash
# Limpar logs
npm run clean:logs

# Limpar cache
npm run clean:cache

# Reiniciar servidor
pm2 restart hathor-imports
```

## 📞 Ainda com problemas?

1. **Verifique o console do navegador (F12)**

   - Aba Console: erros JavaScript
   - Aba Network: requisições falhando
   - Aba Application: Service Worker, Cache

2. **Verifique os logs do servidor**

   ```bash
   tail -f backend/logs/combined.log
   ```

3. **Teste em modo incógnito**

   - Elimina problemas de cache
   - Testa sem extensões

4. **Verifique versões**

   ```bash
   node --version  # Deve ser v18+
   npm --version   # Deve ser v9+
   ```

5. **Reinstale dependências**
   ```bash
   cd backend
   rm -rf node_modules
   npm install
   ```

## 🆘 Suporte

Se nenhuma solução funcionar:

1. Abra o console do navegador (F12)
2. Copie TODOS os erros
3. Verifique os logs do servidor
4. Documente os passos para reproduzir
5. Abra uma issue com todas as informações

---

**Última atualização:** 13/01/2026
