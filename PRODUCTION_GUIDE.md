# 🚀 GUIA DE PRODUÇÃO - HATHOR IMPORTS

## 📋 Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Configuração do Ambiente](#configuração-do-ambiente)
3. [Deploy](#deploy)
4. [Monitoramento](#monitoramento)
5. [Manutenção](#manutenção)
6. [Troubleshooting](#troubleshooting)

---

## 🔧 Pré-requisitos

### Servidor
- **Node.js**: v18+ (recomendado v20 LTS)
- **npm**: v9+
- **Memória RAM**: Mínimo 2GB (recomendado 4GB)
- **Disco**: Mínimo 10GB livre
- **Sistema Operacional**: Linux (Ubuntu 22.04 LTS recomendado)

### Serviços Externos
- ✅ Firebase Project configurado
- ✅ Mercado Pago conta de produção
- ✅ Domínio próprio (opcional mas recomendado)
- ✅ Certificado SSL (Let's Encrypt gratuito)

---

## ⚙️ Configuração do Ambiente

### 1. Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/hathorimports.git
cd hathorimports
```

### 2. Instalar Dependências

```bash
cd backend
npm install --production
```

### 3. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e configure:

```bash
cp .env.example .env
nano .env
```

**Variáveis OBRIGATÓRIAS para produção:**

```env
# Ambiente
NODE_ENV=production
PORT=4000

# Firebase Admin (use credenciais de PRODUÇÃO)
FIREBASE_PROJECT_ID=seu-projeto-prod
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@seu-projeto-prod.iam.gserviceaccount.com

# Firebase Web Config
FIREBASE_API_KEY=sua-api-key-prod
FIREBASE_AUTH_DOMAIN=seu-projeto-prod.firebaseapp.com
FIREBASE_STORAGE_BUCKET=seu-projeto-prod.firebasestorage.app

# Mercado Pago (PRODUÇÃO - não use credenciais de teste!)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-seu-token-de-producao
MERCADOPAGO_PUBLIC_KEY=APP_USR-sua-public-key-de-producao
MERCADOPAGO_WEBHOOK_SECRET=seu-webhook-secret-prod

# URLs de retorno (use seu domínio real)
MERCADOPAGO_SUCCESS_URL=https://seudominio.com/payment-success.html
MERCADOPAGO_FAILURE_URL=https://seudominio.com/payment-failure.html
MERCADOPAGO_PENDING_URL=https://seudominio.com/payment-pending.html

# Segurança (GERE VALORES ÚNICOS E SEGUROS!)
JWT_SECRET=$(openssl rand -base64 32)

# CORS (adicione seu domínio)
ALLOWED_ORIGINS=https://seudominio.com,https://www.seudominio.com

# Logs
LOG_LEVEL=info

# Rate Limiting (ajuste conforme necessário)
RATE_LIMIT_GLOBAL=100
RATE_LIMIT_AUTH=5
RATE_LIMIT_WEBHOOK=50
```

### 4. Configurar Firewall

```bash
# Permitir apenas portas necessárias
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## 🚀 Deploy

### Opção 1: Deploy Manual com PM2 (Recomendado)

#### 1. Instalar PM2 globalmente

```bash
sudo npm install -g pm2
```

#### 2. Criar arquivo de configuração PM2

Crie `ecosystem.config.js` na raiz do projeto:

```javascript
module.exports = {
  apps: [{
    name: 'hathor-imports',
    cwd: './backend',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false
  }]
};
```

#### 3. Iniciar aplicação

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 4. Configurar Nginx como Reverse Proxy

Instale o Nginx:

```bash
sudo apt update
sudo apt install nginx
```

Crie configuração do site:

```bash
sudo nano /etc/nginx/sites-available/hathorimports
```

Cole a configuração:

```nginx
server {
    listen 80;
    server_name seudominio.com www.seudominio.com;

    # Redirecionar para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seudominio.com www.seudominio.com;

    # Certificados SSL (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seudominio.com/privkey.pem;

    # Configurações SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Logs
    access_log /var/log/nginx/hathorimports-access.log;
    error_log /var/log/nginx/hathorimports-error.log;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    # Proxy para backend
    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Servir arquivos estáticos
    location / {
        root /var/www/hathorimports/frontend;
        try_files $uri $uri/ /index.html;
        
        # Cache para assets
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Service Worker (não cachear)
    location = /service-worker.js {
        root /var/www/hathorimports/frontend;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Manifest
    location = /manifest.json {
        root /var/www/hathorimports/frontend;
        add_header Cache-Control "no-cache";
    }
}
```

Ative o site:

```bash
sudo ln -s /etc/nginx/sites-available/hathorimports /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. Configurar SSL com Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seudominio.com -d www.seudominio.com
```

### Opção 2: Deploy com Docker

#### 1. Criar Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copiar package files
COPY backend/package*.json ./backend/

# Instalar dependências
RUN cd backend && npm ci --production

# Copiar código
COPY backend ./backend
COPY frontend ./frontend

# Expor porta
EXPOSE 4000

# Iniciar aplicação
CMD ["node", "backend/server.js"]
```

#### 2. Criar docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "4000:4000"
    env_file:
      - backend/.env
    restart: unless-stopped
    volumes:
      - ./backend/logs:/app/backend/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

#### 3. Deploy

```bash
docker-compose up -d
```

---

## 📊 Monitoramento

### 1. Logs

#### Ver logs em tempo real:

```bash
# PM2
pm2 logs hathor-imports

# Logs da aplicação
npm run logs

# Logs de erro
npm run logs:error

# Nginx
sudo tail -f /var/log/nginx/hathorimports-access.log
sudo tail -f /var/log/nginx/hathorimports-error.log
```

### 2. Métricas PM2

```bash
pm2 monit
pm2 status
pm2 info hathor-imports
```

### 3. Health Check

```bash
curl https://seudominio.com/api/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "timestamp": "2026-01-13T19:00:00.000Z",
  "environment": "production",
  "uptime": 3600,
  "memory": {
    "used": 150,
    "total": 200,
    "unit": "MB"
  },
  "version": "1.0.0"
}
```

### 4. Configurar Alertas

Instale ferramentas de monitoramento:

- **UptimeRobot**: Monitora disponibilidade (gratuito)
- **Sentry**: Rastreamento de erros
- **New Relic**: APM completo
- **Datadog**: Monitoramento de infraestrutura

---

## 🔧 Manutenção

### Atualizar Aplicação

```bash
# 1. Fazer backup
pm2 save
cp backend/.env backend/.env.backup

# 2. Baixar atualizações
git pull origin main

# 3. Instalar dependências
cd backend && npm install --production

# 4. Reiniciar aplicação
pm2 restart hathor-imports

# 5. Verificar status
pm2 status
curl https://seudominio.com/api/health
```

### Backup

#### Backup Automático (Cron)

Crie script de backup:

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/hathorimports"

# Criar diretório
mkdir -p $BACKUP_DIR

# Backup do código
tar -czf $BACKUP_DIR/code_$DATE.tar.gz /var/www/hathorimports

# Backup do .env
cp /var/www/hathorimports/backend/.env $BACKUP_DIR/env_$DATE.backup

# Backup dos logs
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz /var/www/hathorimports/backend/logs

# Remover backups antigos (manter últimos 7 dias)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.backup" -mtime +7 -delete

echo "Backup concluído: $DATE"
```

Adicione ao cron:

```bash
chmod +x backup.sh
crontab -e

# Adicione: Backup diário às 3h da manhã
0 3 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1
```

### Limpeza de Logs

```bash
# Limpar logs antigos (manter últimos 30 dias)
find backend/logs -name "*.log" -mtime +30 -delete

# Ou use o script npm
npm run clean:logs
```

---

## 🐛 Troubleshooting

### Aplicação não inicia

```bash
# Verificar logs
pm2 logs hathor-imports --lines 100

# Verificar variáveis de ambiente
pm2 env hathor-imports

# Reiniciar
pm2 restart hathor-imports
```

### Erro 502 Bad Gateway

```bash
# Verificar se o backend está rodando
pm2 status
curl http://localhost:4000/api/health

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Alto uso de memória

```bash
# Ver uso de memória
pm2 monit

# Reiniciar aplicação
pm2 restart hathor-imports

# Ajustar limite de memória no ecosystem.config.js
max_memory_restart: '1G'
```

### Webhooks do Mercado Pago não funcionam

1. Verificar URL do webhook no painel do Mercado Pago
2. Verificar logs: `npm run logs | grep webhook`
3. Testar manualmente: `curl -X POST https://seudominio.com/api/payment/webhook`
4. Verificar firewall e rate limiting

---

## 📈 Otimizações de Performance

### 1. Habilitar HTTP/2

Já configurado no Nginx acima (`http2`)

### 2. Configurar CDN

Use Cloudflare (gratuito) para:
- Cache de assets estáticos
- Proteção DDoS
- SSL/TLS
- Compressão Brotli

### 3. Otimizar Imagens

```bash
# Instalar ferramentas
npm install -g sharp-cli

# Otimizar imagens
sharp -i frontend/assets/*.png -o frontend/assets/optimized/ --webp
```

### 4. Monitorar Performance

```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun --collect.url=https://seudominio.com
```

---

## 🔒 Segurança

### Checklist de Segurança

- [x] HTTPS habilitado
- [x] Helmet.js configurado
- [x] Rate limiting ativo
- [x] CORS configurado
- [x] Variáveis de ambiente seguras
- [x] Firewall configurado
- [ ] Backups automáticos
- [ ] Monitoramento de erros
- [ ] Logs centralizados
- [ ] Atualizações automáticas de segurança

### Atualizações de Segurança

```bash
# Verificar vulnerabilidades
npm audit

# Corrigir automaticamente
npm audit fix

# Atualizar dependências
npm update
```

---

## 📞 Suporte

Em caso de problemas:

1. Verificar logs: `pm2 logs`
2. Verificar health: `curl /api/health`
3. Consultar documentação
4. Abrir issue no GitHub

---

**Última atualização:** 13/01/2026
**Versão:** 1.0.0