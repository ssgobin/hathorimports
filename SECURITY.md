# 🔐 Guia de Segurança - Hathor Imports

## ⚠️ IMPORTANTE: Mudanças de Segurança Implementadas

Este documento descreve as melhorias de segurança implementadas na **Fase 1** do projeto.

## 🚨 Vulnerabilidades Corrigidas

### 1. Credenciais Expostas no Frontend

**Antes (❌ INSEGURO):**
```javascript
// frontend/js/firebase-config.js
export const firebaseConfig = {
  apiKey: "AIzaSy...",  // ❌ Exposto publicamente
  authDomain: "...",
  projectId: "..."
};
```

**Depois (✅ SEGURO):**
```javascript
// As credenciais agora vêm do backend via API
export async function getFirebaseConfig() {
  const response = await fetch('/api/auth/config');
  return await response.json();
}
```

### 2. Endpoints Desprotegidos

**Antes (❌ INSEGURO):**
```javascript
// Qualquer pessoa podia importar produtos
app.post("/api/import-yupoo", async (req, res) => {
  // Sem verificação de autenticação
});
```

**Depois (✅ SEGURO):**
```javascript
// Apenas admins autenticados podem importar
app.post("/api/import-yupoo", 
  verifyFirebaseToken,  // Verifica token
  requireAdmin,         // Verifica se é admin
  async (req, res) => {
    // Código protegido
  }
);
```

## 🛡️ Camadas de Segurança Implementadas

### Camada 1: Autenticação (verifyFirebaseToken)

Verifica se o usuário está autenticado através do token JWT do Firebase.

```javascript
// Uso em rotas protegidas
app.get("/api/protected", verifyFirebaseToken, (req, res) => {
  // req.user contém: { uid, email, emailVerified }
  res.json({ message: "Acesso autorizado" });
});
```

**Como funciona:**
1. Cliente envia token no header: `Authorization: Bearer <token>`
2. Backend valida token com Firebase Admin SDK
3. Se válido, adiciona dados do usuário em `req.user`
4. Se inválido, retorna erro 403

### Camada 2: Autorização (requireAdmin)

Verifica se o usuário autenticado tem permissão de administrador.

```javascript
// Uso em rotas administrativas
app.post("/api/admin-only", 
  verifyFirebaseToken,
  requireAdmin,
  (req, res) => {
    // Apenas admins chegam aqui
  }
);
```

**Como funciona:**
1. Busca documento do usuário no Firestore: `users/{uid}`
2. Verifica se `role === "admin"`
3. Se sim, permite acesso
4. Se não, retorna erro 403

### Camada 3: CORS Configurado

Apenas origens permitidas podem fazer requisições.

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4000',
  'https://seu-dominio.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origem não permitida'));
    }
  }
}));
```

### Camada 4: Variáveis de Ambiente

Todas as credenciais sensíveis estão em `.env` (não commitado).

```env
# .env (NÃO COMMITAR!)
HF_API_KEY=sua_chave_secreta
FIREBASE_PRIVATE_KEY=...
JWT_SECRET=string_muito_segura
```

## 🔑 Como Criar um Usuário Admin

### Opção 1: Via Firebase Console

1. Acesse Firebase Console
2. Vá em **Authentication** e crie um usuário
3. Copie o UID do usuário
4. Vá em **Firestore Database**
5. Crie documento em `users/{uid}`:
```json
{
  "email": "admin@hathorimports.com",
  "name": "Administrador",
  "role": "admin",
  "createdAt": "2026-01-13T00:00:00.000Z"
}
```

### Opção 2: Via Código (Script)

Crie um arquivo `backend/create-admin.js`:

```javascript
import admin from 'firebase-admin';
import { initializeFirebaseAdmin, getFirestore } from './firebase-admin.js';

async function createAdmin(email, password, name) {
  initializeFirebaseAdmin();
  const auth = admin.auth();
  const db = getFirestore();

  // Cria usuário no Authentication
  const userRecord = await auth.createUser({
    email,
    password,
    emailVerified: true
  });

  // Cria documento no Firestore
  await db.collection('users').doc(userRecord.uid).set({
    email,
    name,
    role: 'admin',
    createdAt: new Date().toISOString()
  });

  console.log('✅ Admin criado:', userRecord.uid);
}

// Uso: node create-admin.js
createAdmin('admin@hathorimports.com', 'senha_segura', 'Admin');
```

Execute:
```bash
node backend/create-admin.js
```

## 🔒 Boas Práticas de Segurança

### ✅ O que FAZER

1. **Sempre use HTTPS em produção**
2. **Nunca commite arquivos `.env`**
3. **Gere JWT_SECRET aleatório e forte**
4. **Rotacione secrets periodicamente**
5. **Use tokens de curta duração**
6. **Valide TODAS as entradas do usuário**
7. **Implemente rate limiting**
8. **Monitore logs de segurança**
9. **Mantenha dependências atualizadas**
10. **Use Firebase Security Rules**

### ❌ O que NÃO FAZER

1. **Nunca exponha API keys no frontend**
2. **Nunca confie em dados do cliente**
3. **Nunca use senhas fracas**
4. **Nunca desabilite CORS em produção**
5. **Nunca ignore erros de autenticação**
6. **Nunca logue informações sensíveis**
7. **Nunca use `eval()` ou código dinâmico**
8. **Nunca armazene senhas em plain text**

## 🧪 Testando Segurança

### Teste 1: Endpoint Protegido sem Token

```bash
curl -X POST http://localhost:4000/api/import-yupoo \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

# Esperado: 401 Unauthorized
```

### Teste 2: Endpoint Protegido com Token Inválido

```bash
curl -X POST http://localhost:4000/api/import-yupoo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token_invalido" \
  -d '{"url":"https://example.com"}'

# Esperado: 403 Forbidden
```

### Teste 3: Usuário Não-Admin

```bash
# Com token válido mas usuário sem role admin
curl -X POST http://localhost:4000/api/import-yupoo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_VALIDO_NAO_ADMIN" \
  -d '{"url":"https://example.com"}'

# Esperado: 403 Forbidden - "Apenas administradores"
```

### Teste 4: Admin Válido

```bash
# Com token válido de admin
curl -X POST http://localhost:4000/api/import-yupoo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_VALIDO_ADMIN" \
  -d '{"url":"https://example.yupoo.com/albums/123"}'

# Esperado: 200 OK com dados do produto
```

## 🚨 Incidentes de Segurança

Se você descobrir uma vulnerabilidade:

1. **NÃO** abra uma issue pública
2. Entre em contato diretamente com a equipe
3. Forneça detalhes técnicos
4. Aguarde correção antes de divulgar

## 📋 Checklist de Segurança para Deploy

Antes de fazer deploy em produção:

- [ ] Todas as variáveis de ambiente configuradas
- [ ] `NODE_ENV=production` definido
- [ ] Novo `JWT_SECRET` gerado (mínimo 32 caracteres)
- [ ] HTTPS configurado e forçado
- [ ] CORS configurado com domínios corretos
- [ ] Firebase Security Rules configuradas
- [ ] Rate limiting implementado
- [ ] Logs de segurança configurados
- [ ] Backup do banco de dados configurado
- [ ] Monitoramento de erros ativo (Sentry)
- [ ] Certificado SSL válido
- [ ] Headers de segurança configurados (Helmet.js)

## 🔐 Firebase Security Rules

Configure regras no Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Produtos: leitura pública, escrita apenas admin
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null 
                   && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Usuários: cada um acessa apenas seus dados
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Pedidos: usuário vê apenas seus pedidos
    match /orders/{orderId} {
      allow read: if request.auth != null 
                  && (resource.data.customerId == request.auth.uid 
                      || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow create: if request.auth != null;
      allow update: if request.auth != null 
                    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## 📚 Recursos Adicionais

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Firebase Security Best Practices](https://firebase.google.com/docs/rules/basics)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Última atualização:** 13/01/2026  
**Versão:** 1.0.0