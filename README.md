# 🛍️ Hathor Imports

Sistema completo de e-commerce para importação e venda de sneakers e streetwear premium.

## 🚀 Melhorias Implementadas - Fase 1

### ✅ Bugs Corrigidos

1. **Bug crítico em `store-page.js`**
   - Corrigida variável `img` não definida (linha 35)
   - Adicionado fallback para imagens ausentes
   - Implementado lazy loading nas imagens

### 🔐 Segurança

2. **Credenciais Firebase movidas para backend**
   - Credenciais removidas do código frontend
   - Criado endpoint `/api/auth/config` para fornecer configuração
   - Implementado Firebase Admin SDK no backend
   - Adicionados middlewares de autenticação e autorização

3. **Sistema de autenticação robusto**
   - Middleware `verifyFirebaseToken` para validar tokens
   - Middleware `requireAdmin` para proteger rotas administrativas
   - Endpoints protegidos com autenticação JWT

### 🛡️ Tratamento de Erros

4. **Tratamento de erros completo**
   - Try-catch em todas as funções async
   - Feedback visual para usuários
   - Logs detalhados no console
   - Mensagens de erro amigáveis
   - Estados de loading durante requisições

### 📁 Estrutura Melhorada

5. **Organização do código**
   - Criada pasta `backend/routes/` para rotas
   - Arquivo `firebase-admin.js` para configuração centralizada
   - Arquivo `.env.example` com todas as variáveis documentadas

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ 
- Conta Firebase (Firestore + Authentication)
- Conta Hugging Face (para IA de análise de produtos)

### Passo a Passo

1. **Clone o repositório**
```bash
git clone <seu-repositorio>
cd hathorimports
```

2. **Instale as dependências do backend**
```bash
cd backend
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` e preencha:
- `HF_API_KEY`: Sua chave da Hugging Face
- `FIREBASE_*`: Credenciais do Firebase
- `JWT_SECRET`: String aleatória segura
- Outras configurações conforme necessário

4. **Inicie o servidor**
```bash
npm start
```

O servidor estará disponível em `http://localhost:4000`

## 🔧 Configuração do Firebase

### Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto ou use um existente
3. Ative **Authentication** (Email/Password)
4. Ative **Firestore Database**
5. Ative **Storage** (para imagens)

### Credenciais Web (Frontend)

Em **Project Settings > General**:
- Copie as credenciais do Firebase Web App
- Cole no arquivo `.env` do backend

### Service Account (Backend - Opcional)

Para funcionalidades avançadas:
1. Vá em **Project Settings > Service Accounts**
2. Clique em "Generate New Private Key"
3. Salve o arquivo JSON
4. Configure `FIREBASE_SERVICE_ACCOUNT_PATH` no `.env`

## 🗂️ Estrutura do Projeto

```
hathorimports/
├── backend/
│   ├── routes/
│   │   └── auth.js          # Rotas de autenticação
│   ├── firebase-admin.js    # Configuração Firebase Admin
│   ├── server.js            # Servidor Express
│   ├── yupoo.js             # Scraper Yupoo + IA
│   ├── .env                 # Variáveis de ambiente (não commitado)
│   ├── .env.example         # Template de variáveis
│   └── package.json
│
├── frontend/
│   ├── js/
│   │   ├── firebase-config.js  # Config Firebase (busca do backend)
│   │   ├── auth.js             # Autenticação
│   │   ├── store.js            # Lógica de produtos
│   │   ├── admin-page.js       # Painel admin
│   │   ├── home-page.js        # Página inicial
│   │   └── ...
│   ├── assets/
│   ├── components/
│   └── *.html
│
├── .gitignore
└── README.md
```

## 🔌 API Endpoints

### Públicos

- `GET /api/health` - Health check
- `GET /api/auth/config` - Configuração Firebase

### Protegidos (requer autenticação)

- `GET /api/auth/verify` - Verifica token
- `GET /api/auth/check-admin` - Verifica se é admin

### Admin (requer autenticação + role admin)

- `POST /api/import-yupoo` - Importa produto da Yupoo

## 🧪 Testando

### Testar servidor
```bash
curl http://localhost:4000/api/health
```

### Testar configuração Firebase
```bash
curl http://localhost:4000/api/auth/config
```

### Testar importação (requer token)
```bash
curl -X POST http://localhost:4000/api/import-yupoo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"url":"https://example.yupoo.com/albums/123"}'
```

## 🔐 Segurança

### Boas Práticas Implementadas

✅ Credenciais no backend (não expostas no frontend)  
✅ Validação de tokens JWT  
✅ Middleware de autorização  
✅ CORS configurado  
✅ Variáveis de ambiente  
✅ Tratamento de erros robusto  
✅ Logs de segurança  

### Próximos Passos de Segurança

- [ ] Rate limiting
- [ ] Helmet.js para headers de segurança
- [ ] Validação de entrada com Joi/Zod
- [ ] HTTPS em produção
- [ ] Rotação de secrets

## 📝 Variáveis de Ambiente

Veja `.env.example` para lista completa. Principais:

```env
# Servidor
PORT=4000
NODE_ENV=development

# Hugging Face (IA)
HF_API_KEY=sua_chave_aqui

# Firebase
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...

# Segurança
JWT_SECRET=string_aleatoria_segura
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4000
```

## 🐛 Troubleshooting

### Erro: "Firebase Admin não inicializado"
- Verifique se as variáveis `FIREBASE_*` estão no `.env`
- Confirme que o projeto Firebase existe

### Erro: "Token inválido"
- Verifique se o usuário está autenticado
- Token pode ter expirado (reautentique)

### Erro: "Acesso negado. Apenas administradores"
- Usuário precisa ter `role: "admin"` no Firestore
- Crie documento em `users/{uid}` com `{ role: "admin" }`

### Erro ao importar da Yupoo
- Verifique se `HF_API_KEY` está configurada
- URL da Yupoo pode estar bloqueada (use proxy)
- Verifique logs do servidor para detalhes

## 🚀 Deploy

### Recomendações

- **Backend**: Railway, Render, Fly.io
- **Frontend**: Vercel, Netlify, Firebase Hosting
- **Banco**: Firebase Firestore (já configurado)

### Checklist de Deploy

- [ ] Configurar variáveis de ambiente no serviço
- [ ] Alterar `NODE_ENV=production`
- [ ] Gerar novo `JWT_SECRET` seguro
- [ ] Configurar domínio em `ALLOWED_ORIGINS`
- [ ] Ativar HTTPS
- [ ] Configurar Firebase para produção

## 📊 Próximas Melhorias (Fase 2 e 3)

### Fase 2 - Importantes
- [ ] Sistema de busca e filtros
- [ ] Responsividade mobile
- [ ] Loading states e skeletons
- [ ] Sistema de avaliações
- [ ] Notificações por email

### Fase 3 - Melhorias
- [ ] Testes automatizados
- [ ] CI/CD com GitHub Actions
- [ ] Monitoramento (Sentry)
- [ ] Analytics
- [ ] PWA

## 📄 Licença

Projeto privado - Hathor Imports © 2026

## 👨‍💻 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do servidor
2. Consulte este README
3. Verifique o arquivo `.env.example`

---

**Desenvolvido com ❤️ para Hathor Imports**