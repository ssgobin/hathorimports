# 🚀 GUIA PASSO A PASSO - Deploy em Produção

## ⏱️ Tempo total: ~30 minutos

---

# PARTE 1: BACKEND NO RAILWAY

## Passo 1: Preparar seu Railway
**Tempo: 2 minutos**

1. Acesse [railway.app](https://railway.app)
2. Faça login com GitHub
3. Clique em **"+ New Project"**
4. Selecione **"Deploy from GitHub repo"**

---

## Passo 2: Conectar seu repositório
**Tempo: 3 minutos**

1. Selecione seu repositório `hathorimports`
2. Selecione a branch **`main`**
3. Railway vai começar o deploy automaticamente
4. Aguarde até aparecer ✅ Build completo

---

## Passo 3: Adicionar Variáveis de Ambiente (IMPORTANTE!)
**Tempo: 10 minutos**

1. No Railway Dashboard, clique em seu projeto
2. Vá na aba **"Variables"**
3. Clique em **"+ New Variable"**
4. Adicione uma de cada vez:

### Firebase (Copie exatamente do seu Console Firebase):
```
FIREBASE_PROJECT_ID=hathorimports-b1155
FIREBASE_AUTH_DOMAIN=hathorimports-b1155.firebaseapp.com
FIREBASE_STORAGE_BUCKET=hathorimports-b1155.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=1074936726732
FIREBASE_APP_ID=1:1074936726732:web:731aeaf94a6ea3ba512e69
FIREBASE_MEASUREMENT_ID=G-2MSD70J3XK
```

### Firebase Service Account JSON (⚠️ CRÍTICO):
1. Vá em Firebase Console → Project Settings → Service Account
2. Clique em "Generate New Private Key"
3. Um arquivo `.json` vai fazer download
4. **No Railway:**
   - Crie variável: `FIREBASE_SERVICE_ACCOUNT_JSON`
   - Copie TODO o conteúdo do arquivo `.json`
   - Cole como valor

### Mercado Pago (Não Sandbox!):
```
MERCADOPAGO_ACCESS_TOKEN=APP_USR-... (copie de https://www.mercadopago.com.br/developers/panel)
MERCADOPAGO_PUBLIC_KEY=APP_USR-...
MERCADOPAGO_WEBHOOK_SECRET=...
```

### URLs (Ainda não sabe? Depois volta aqui):
```
PORT=4000
NODE_ENV=production
BACKEND_URL=https://seu-backend-railway.app (vai descobrir no passo 4)
ALLOWED_ORIGINS=https://seu-frontend-vercel.app (vai descobrir na Parte 2)
```

### Outros:
```
CLOUDINARY_CLOUD_NAME=dwdxkkniu
HF_API_KEY=sua-chave
HF_MODEL=deepseek-ai/DeepSeek-V3.2:novita
```

---

## Passo 4: Descobrir sua URL do Backend
**Tempo: 1 minuto**

1. No Railway, vá em **"Deployments"**
2. Procure por um com status ✅ (verde)
3. Clique nele
4. Copie a URL (vai ser algo como: `https://hathor-imports-production.up.railway.app`)
5. **Guarde essa URL!** Você vai precisar para o frontend

---

## Passo 5: Testar se o Backend está funcionando
**Tempo: 2 minutos**

Abra seu navegador e acesse:
```
https://sua-url-backend.railway.app/api/health
```

Se retornar JSON com `status: "ok"`, ✅ **Backend está funcionando!**

---

---

# PARTE 2: FRONTEND NO VERCEL

## Passo 6: Preparar Vercel
**Tempo: 2 minutos**

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com GitHub
3. Clique em **"Add New..."** → **"Project"**

---

## Passo 7: Importar repositório
**Tempo: 2 minutos**

1. Busque por `hathorimports`
2. Clique em **"Import"**

---

## Passo 8: Configurar projeto
**Tempo: 5 minutos**

Na página de configuração:

### Framework Preset:
```
Other (frontend é HTML estático)
```

### Root Directory:
```
frontend
```

### Environment Variables:
Clique em **"Add Environment Variable"**

1. **Name:** `VITE_API_URL`
   **Value:** `https://sua-url-backend-railway.app` (que você copiou no Passo 4)

2. Clique em **"Deploy"**

---

## Passo 9: Aguardar Deploy
**Tempo: 3 minutos**

Vercel vai fazer o build e deploy automaticamente.

Quando aparecer ✅ **"Production"**, seu frontend está no ar!

Copie a URL (vai ser algo como: `https://hathor-imports.vercel.app`)

---

## Passo 10: Testar se o Frontend está funcionando
**Tempo: 1 minuto**

1. Acesse sua URL do Vercel
2. Verifique se carrega corretamente
3. Abra o console do navegador (F12)
4. Não deve ter erros de CORS

---

---

# PARTE 3: CONECTAR TUDO

## Passo 11: Atualizar Variáveis do Backend
**Tempo: 3 minutos**

Agora que você tem a URL do frontend:

1. **No Railway**, vá em **"Variables"**
2. Procure por `ALLOWED_ORIGINS`
3. Atualize o valor:
   ```
   https://seu-frontend-vercel.app
   ```
4. Railway vai redeploy automaticamente

---

## Passo 12: Atualizar Mercado Pago
**Tempo: 2 minutos**

1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers/panel/app)
2. Vá em **"Webhooks"**
3. Configure a URL:
   ```
   https://seu-backend-railway.app/api/payment/webhook
   ```
4. Selecione os eventos:
   - `payment.created`
   - `payment.updated`

---

## Passo 13: Verificar Conexão Frontend ↔ Backend
**Tempo: 2 minutos**

1. Abra seu frontend no navegador
2. Tente fazer login
3. Abra o Network tab (F12)
4. Veja as requisições indo para `seu-backend-railway.app`
5. Se funcionar: ✅ **TUDO CONECTADO!**

---

---

# CHECKLIST FINAL

- [ ] Backend rodando no Railway (URL testada)
- [ ] Frontend rodando no Vercel (URL testada)
- [ ] Firebase conectado ao backend
- [ ] Mercado Pago configurado em PRODUÇÃO
- [ ] CORS configurado corretamente
- [ ] Webhooks do Mercado Pago funcionando
- [ ] Frontend conecta ao backend
- [ ] Login funciona
- [ ] Pagamentos funcionam

---

# 🆘 PROBLEMAS COMUNS

### "CORS error"
**Solução:** Verifique se `ALLOWED_ORIGINS` no Railway inclui sua URL do Vercel

### "Firebase error: config is not defined"
**Solução:** Verifique se `FIREBASE_SERVICE_ACCOUNT_JSON` está correto no Railway

### "Cannot connect to backend"
**Solução:** Verifique se `VITE_API_URL` no Vercel está correto

### "Payment webhook not working"
**Solução:** Configure o webhook no Mercado Pago com a URL do backend (incluindo `/api/payment/webhook`)

---

**Pronto! Sua app está em produção! 🎉**

URLs finais:
- Frontend: `https://seu-frontend.vercel.app`
- Backend: `https://seu-backend.railway.app`
