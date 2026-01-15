# 🚀 Deploy no Railway - Guia Completo

## ✅ Pré-requisitos

- [x] Repositório Git no GitHub
- [x] Conta no Railway (pagamento realizado)
- [x] Firebase projeto criado
- [x] Mercado Pago configurado

---

## 📋 Passo 1: Preparar o Repositório

### 1.1 Verificar Git e Push

```bash
# Confira o status
git status

# Adicionar todas as mudanças
git add .

# Commit
git commit -m "Preparar para deploy no Railway"

# Push para sua branch
git push origin v2.0
```

### 1.2 Estrutura de Arquivos Confirmada ✓

- ✓ `.gitignore` - Exclui `.env` e credenciais
- ✓ `railway.json` - Configuração do Railway
- ✓ `package.json` (raiz) - Scripts de inicialização
- ✓ `backend/package.json` - Scripts de inicialização
- ✓ `backend/server.js` - Validação de variáveis e Firebase inicializado
- ✓ `backend/firebase-admin.js` - Suporta múltiplas formas de autenticação

---

## 🔧 Passo 2: Configurar no Railway

### 2.1 Conectar GitHub

1. Acesse [railway.app](https://railway.app)
2. Clique em **"New Project"**
3. Selecione **"Deploy from GitHub repo"**
4. Selecione o repositório `hathorimports`
5. Railway fará o deploy automático

### 2.2 Acessar Dashboard do Projeto

- Seu projeto estará em: https://railway.app/project/[PROJECT_ID]
- Status do build será mostrado em tempo real
- Logs disponíveis em **"Logs"**

---

## 🔐 Passo 3: Configurar Variáveis de Ambiente

### 3.1 No Railway Dashboard

1. Clique no seu projeto → Aba **"Variables"**
2. Adicione cada variável abaixo:

```
PORT=4000
NODE_ENV=production

# ===== FIREBASE =====
FIREBASE_PROJECT_ID=hathorimports-b1155
FIREBASE_AUTH_DOMAIN=hathorimports-b1155.firebaseapp.com
FIREBASE_STORAGE_BUCKET=hathorimports-b1155.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=1074936726732
FIREBASE_APP_ID=1:1074936726732:web:731aeaf94a6ea3ba512e69
FIREBASE_MEASUREMENT_ID=G-2MSD70J3XK

# ===== FIREBASE SERVICE ACCOUNT JSON =====
# COPIE O CONTEÚDO COMPLETO do arquivo firebase-service-account.json
# Vá em: Variables → Raw Editor → Cole todo o JSON
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":...}

# Alternativa: Se usar arquivo (não recomendado no Railway)
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# ===== MERCADO PAGO (PRODUÇÃO) =====
# Obtenha credenciais em: https://www.mercadopago.com.br/developers/panel
# Selecione "Produção" (não Sandbox!)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxx...
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxxx...
MERCADOPAGO_WEBHOOK_SECRET=xxxxxxx...

# ===== URLs MERCADO PAGO =====
# Substitua por sua URL do Railway após deploy
MERCADOPAGO_SUCCESS_URL=https://seu-app-railway.app/payment-success.html
MERCADOPAGO_FAILURE_URL=https://seu-app-railway.app/payment-failure.html
MERCADOPAGO_PENDING_URL=https://seu-app-railway.app/payment-pending.html

# ===== BACKEND URL =====
BACKEND_URL=https://seu-app-railway.app

# ===== CLOUDINARY =====
CLOUDINARY_CLOUD_NAME=dwdxkkniu

# ===== CORS =====
ALLOWED_ORIGINS=https://seu-dominio.com,https://seu-app-railway.app

# ===== HUGGING FACE API =====
HF_API_KEY=sua-chave-aqui
HF_MODEL=deepseek-ai/DeepSeek-V3.2:novita
```

### 3.2 Como Adicionar o Firebase Service Account JSON

**⚠️ IMPORTANTE: Use o Raw Editor para melhor compatibilidade**

1. Na aba **"Variables"**, clique em **"Raw Editor"** (canto superior direito)
2. Cole as variáveis em formato JSON:

```json
{
  "FIREBASE_SERVICE_ACCOUNT_JSON": "{\"type\": \"service_account\", \"project_id\": \"hathorimports-b1155\", ...}",
  "MERCADOPAGO_ACCESS_TOKEN": "APP_USR-..."
}
```

Ou use o método mais simples:

1. Vá em **"Variables"** (UI normal)
2. Crie uma nova variável: `FIREBASE_SERVICE_ACCOUNT_JSON`
3. Copie o conteúdo completo do arquivo `firebase-service-account.json`
4. Cole como valor (todo o JSON entre `{}`)

---

## 🌐 Passo 4: Obter URL da Aplicação

### 4.1 URL Pública do Railway

1. Após o deploy, vá em **"Deployments"**
2. O deployment bem-sucedido terá uma URL como:
   ```
   https://hathor-imports-production.up.railway.app
   ```

### 4.2 Atualizar Variáveis com a URL Real

1. Vá em **Variables**
2. Atualize as URLs com a URL real do Railway:
   - `BACKEND_URL=https://hathor-imports-production.up.railway.app`
   - `MERCADOPAGO_SUCCESS_URL=https://hathor-imports-production.up.railway.app/payment-success.html`
   - `MERCADOPAGO_FAILURE_URL=https://hathor-imports-production.up.railway.app/payment-failure.html`
   - `MERCADOPAGO_PENDING_URL=https://hathor-imports-production.up.railway.app/payment-pending.html`
   - `ALLOWED_ORIGINS=https://hathor-imports-production.up.railway.app`

3. Railway vai fazer redeploy automaticamente

---

## 🔄 Passo 5: Configurar Webhooks

### 5.1 Mercado Pago Webhooks

1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers/panel/app)
2. Vá em **Webhooks**
3. Configure a URL:
   ```
   https://seu-app-railway.app/api/payment/webhook
   ```
4. Selecione os eventos:
   - `payment.created`
   - `payment.updated`
   - `merchant_order.created`
   - `merchant_order.updated`

### 5.2 Firebase Realtime Database Rules

Configure em Firebase Console:
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "users": {
      "$uid": {
        ".read": "auth.uid == $uid || root.child('users').child(auth.uid).child('admin').val() === true",
        ".write": "auth.uid == $uid || root.child('users').child(auth.uid).child('admin').val() === true"
      }
    },
    "products": {
      ".read": true,
      ".write": "root.child('users').child(auth.uid).child('admin').val() === true"
    }
  }
}
```

---

## 📊 Passo 6: Monitorar e Testar

### 6.1 Ver Logs em Tempo Real

```bash
# Via CLI Railway
railway logs

# Ou na Dashboard → Logs
```

### 6.2 Testar Endpoints

```bash
# Health check
curl https://seu-app-railway.app/api/health

# Teste de autenticação
curl -X POST https://seu-app-railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### 6.3 Verificar Firebase

1. Firebase Console → Banco de Dados → Verifique se consegue ler/escrever
2. Cloud Functions → Verifique logs

---

## 🚨 Troubleshooting

### Erro: "FIREBASE_SERVICE_ACCOUNT_JSON is required"

```
✓ Solução: Adicione a variável em Railway → Variables
✓ Certifique-se que é o conteúdo completo do JSON
✓ Verifique se não tem quebras de linha extras
```

### Erro: "Cannot find module 'dotenv'"

```
✓ Solução: Railway nunca rodou `npm install`?
✓ Verifique logs do build
✓ Manual rebuild: Dashboard → Deployments → Rebuild
```

### Erro: "Mercado Pago authentication failed"

```
✓ Verifique se usa credenciais de PRODUÇÃO (não Sandbox)
✓ TOKEN deve começar com "APP_USR-" não "TEST-"
✓ Salve e aguarde redeploy automático
```

### Servidor inicia mas não responde

```
✓ Verifique PORT em Variables (deve ser 4000 ou deixar vazio)
✓ Confira ALLOWED_ORIGINS inclui a URL do Railway
✓ Veja se Firebase consegue conectar (logs)
```

---

## 🔐 Segurança em Produção

1. **Credenciais:**
   - ✓ Nunca faça commit de `.env`
   - ✓ Use apenas variáveis de ambiente do Railway
   - ✓ Rotacione chaves regularmente

2. **Firebase:**
   - ✓ Configure regras de segurança no Firestore
   - ✓ Ative autenticação obrigatória

3. **Mercado Pago:**
   - ✓ Use credenciais de PRODUÇÃO
   - ✓ Valide assinatura de webhooks

4. **Rate Limiting:**
   - ✓ Configurado em `server.js`
   - ✓ 100 req/15min (global)
   - ✓ 5 tentativas login/15min

---

## 📱 Deploy do Frontend (Opcional)

Para servir o frontend também no Railway (recomendado):

1. Configure um segundo serviço Railway para o frontend
2. Use um domínio customizado
3. Ou serve o frontend como static files do backend

---

## 🎯 Próximos Passos

- [ ] Configurar domínio customizado (opcional)
- [ ] Adicionar certificado SSL/TLS (automático no Railway)
- [ ] Configurar backups do Firebase
- [ ] Monitorar métricas e logs
- [ ] Testar fluxo completo de pagamento
- [ ] Realizar backup das credenciais

---

**Último atualizado:** 14/01/2026
**Versão:** 1.0
