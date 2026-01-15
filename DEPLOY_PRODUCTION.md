# 🚀 Backend no Railway + Frontend no Vercel

## Backend - Railway

### 1. Deploy no Railway
```bash
# Já está configurado no railway.json
# Conectar repo no Railway dashboard
# Ele vai detectar o backend automaticamente
```

### 2. Variáveis de Ambiente Railway
```
PORT=4000
NODE_ENV=production

# Firebase
FIREBASE_PROJECT_ID=hathorimports-b1155
FIREBASE_AUTH_DOMAIN=hathorimports-b1155.firebaseapp.com
FIREBASE_STORAGE_BUCKET=hathorimports-b1155.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=1074936726732
FIREBASE_APP_ID=1:1074936726732:web:731aeaf94a6ea3ba512e69
FIREBASE_MEASUREMENT_ID=G-2MSD70J3XK
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_PUBLIC_KEY=APP_USR-...
MERCADOPAGO_WEBHOOK_SECRET=...
MERCADOPAGO_SUCCESS_URL=https://seu-frontend.vercel.app/payment-success.html
MERCADOPAGO_FAILURE_URL=https://seu-frontend.vercel.app/payment-failure.html
MERCADOPAGO_PENDING_URL=https://seu-frontend.vercel.app/payment-pending.html

# URLs
BACKEND_URL=https://seu-backend.railway.app
ALLOWED_ORIGINS=https://seu-frontend.vercel.app

# Cloudinary
CLOUDINARY_CLOUD_NAME=dwdxkkniu

# Hugging Face
HF_API_KEY=sua-chave-aqui
HF_MODEL=deepseek-ai/DeepSeek-V3.2:novita
```

---

## Frontend - Vercel

### 1. Preparar Frontend
```bash
cd frontend

# Criar arquivo .env.local
echo "VITE_API_URL=https://seu-backend.railway.app" > .env.local
```

### 2. Deploy no Vercel

**Opção A: Via CLI**
```bash
npm install -g vercel
cd frontend
vercel login
vercel --prod
```

**Opção B: Conectar GitHub**
1. Vá para [vercel.com](https://vercel.com)
2. Clique em "New Project"
3. Selecione o repo `hathorimports`
4. Selecione a pasta `frontend`
5. Adicione as variáveis:
   - `VITE_API_URL`: `https://seu-backend.railway.app`

### 3. Configurar arquivo frontend para usar API do Backend

No seu `frontend/js/firebase-config.js` ou onde faz chamadas para o backend:

```javascript
const API_URL = process.env.VITE_API_URL || 'http://localhost:4000';

// Exemplo de chamada
fetch(`${API_URL}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
```

---

## URLs Finais

Após deploy:
- **Backend:** `https://seu-backend.railway.app`
- **Frontend:** `https://seu-frontend.vercel.app`

---

## Checklist

- [ ] Backend está rodando no Railway
- [ ] Frontend está deployado no Vercel
- [ ] Variáveis de ambiente configuradas
- [ ] Frontend conecta ao backend
- [ ] CORS está liberado para Vercel no backend
- [ ] Webhooks Mercado Pago configurados

---

**Pronto! Sua app está em produção! 🎉**
