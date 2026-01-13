# 🧪 Guia de Testes - Mercado Pago (Modo Sandbox)

## 📋 Índice

1. [Configuração Inicial](#configuração-inicial)
2. [Obter Credenciais de Teste](#obter-credenciais-de-teste)
3. [Configurar ngrok para Webhooks](#configurar-ngrok-para-webhooks)
4. [Cartões de Teste](#cartões-de-teste)
5. [Fluxo de Teste Completo](#fluxo-de-teste-completo)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 Configuração Inicial

### 1. Obter Credenciais de Teste

1. **Acesse o painel de desenvolvedores:**

   - URL: https://www.mercadopago.com.br/developers/panel/app
   - Faça login com sua conta Mercado Pago

2. **Selecione ou crie uma aplicação:**

   - Se não tiver, clique em "Criar aplicação"
   - Nome: `Hathor Imports`
   - Categoria: `Fashion`

3. **Obtenha as credenciais de TESTE:**
   - No menu lateral, clique em **"Credenciais"**
   - Selecione a aba **"Credenciais de teste"**
   - Copie:
     - ✅ **Access Token** (começa com `TEST-`)
     - ✅ **Public Key** (começa com `TEST-`)

### 2. Configurar Variáveis de Ambiente

Edite o arquivo `backend/.env`:

```env
# MERCADO PAGO - MODO TESTE (SANDBOX)
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890123456-123456-abcdef1234567890abcdef1234567890-123456789
MERCADOPAGO_PUBLIC_KEY=TEST-12345678-1234-1234-1234-123456789012
```

**⚠️ IMPORTANTE:** As credenciais devem começar com `TEST-` para funcionar no modo sandbox!

---

## 🌐 Configurar ngrok para Webhooks

O Mercado Pago precisa enviar notificações de pagamento para seu servidor. Como você está testando localmente, use o **ngrok** para criar um túnel público.

### Instalação do ngrok

```bash
# Opção 1: Via npm (recomendado)
npm install -g ngrok

# Opção 2: Via Homebrew (macOS)
brew install ngrok

# Opção 3: Download direto
# https://ngrok.com/download
```

### Uso do ngrok

1. **Inicie seu servidor backend:**

   ```bash
   cd backend
   npm start
   # Servidor rodando em http://localhost:4000
   ```

2. **Em outro terminal, inicie o ngrok:**

   ```bash
   ngrok http 4000
   ```

3. **Copie a URL HTTPS gerada:**

   ```
   Forwarding  https://abc123def456.ngrok-free.app -> http://localhost:4000
                      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                      Copie esta URL
   ```

4. **Atualize o .env com a URL do ngrok:**

   ```env
   BACKEND_URL=https://abc123def456.ngrok-free.app
   ```

5. **Configure o webhook no Mercado Pago:**
   - Acesse: https://www.mercadopago.com.br/developers/panel/app
   - Vá em **"Webhooks"** ou **"Notificações"**
   - Adicione a URL: `https://abc123def456.ngrok-free.app/api/payment/webhook`
   - Selecione eventos: **"Pagamentos"**
   - Salve

**💡 Dica:** A URL do ngrok muda toda vez que você reinicia. Atualize o .env e o webhook sempre que reiniciar o ngrok.

---

## 💳 Cartões de Teste

Use estes cartões para simular diferentes cenários de pagamento:

### ✅ Pagamento APROVADO

| Cartão               | Número                | CVV  | Validade | Resultado   |
| -------------------- | --------------------- | ---- | -------- | ----------- |
| **Mastercard**       | `5031 4332 1540 6351` | 123  | 11/25    | ✅ Aprovado |
| **Visa**             | `4509 9535 6623 3704` | 123  | 11/25    | ✅ Aprovado |
| **American Express** | `3711 803032 57522`   | 1234 | 11/25    | ✅ Aprovado |

### ❌ Pagamento RECUSADO

| Cartão                 | Número                | CVV | Validade | Motivo               |
| ---------------------- | --------------------- | --- | -------- | -------------------- |
| **Saldo Insuficiente** | `5031 7557 3453 0604` | 123 | 11/25    | Fundos insuficientes |
| **Dados Inválidos**    | `5031 4332 1540 6351` | 000 | 11/25    | CVV inválido         |
| **Cartão Inválido**    | `4111 1111 1111 1111` | 123 | 11/25    | Número inválido      |

### ⏳ Pagamento PENDENTE

| Cartão       | Número                | CVV | Validade | Resultado                      |
| ------------ | --------------------- | --- | -------- | ------------------------------ |
| **Pendente** | `5031 4332 1540 6351` | 123 | 11/25    | ⏳ Pendente (valor específico) |

**Nota:** Para simular pagamento pendente, use valores específicos como R$ 1.234,56

### 📝 Dados do Titular (Qualquer um serve)

- **Nome:** APRO (aprovado) ou OTHE (outros)
- **CPF:** 12345678909
- **Email:** test_user_123456@testuser.com
- **Telefone:** (11) 98765-4321

---

## 🧪 Fluxo de Teste Completo

### Passo 1: Preparar Ambiente

```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: ngrok
ngrok http 4000

# Terminal 3: Frontend (se necessário)
cd frontend
# Abra index.html no navegador ou use Live Server
```

### Passo 2: Testar Pagamento Aprovado

1. **Adicione produtos ao carrinho:**

   - Navegue até a loja: `http://localhost:4000/store.html`
   - Adicione alguns produtos
   - Vá para o carrinho: `http://localhost:4000/cart.html`

2. **Finalize o pedido:**

   - Clique em "Finalizar Pedido"
   - Preencha os dados pessoais
   - Preencha o endereço de entrega

3. **Pague com cartão de teste:**

   - Use o cartão: `5031 4332 1540 6351`
   - CVV: `123`
   - Validade: `11/25`
   - Nome: `APRO`
   - CPF: `12345678909`

4. **Verifique o resultado:**
   - Você será redirecionado para `payment-success.html`
   - Verifique o console do backend para logs
   - Verifique se o webhook foi recebido

### Passo 3: Testar Pagamento Recusado

1. **Repita o processo acima**
2. **Use cartão recusado:** `5031 7557 3453 0604`
3. **Verifique redirecionamento para:** `payment-failure.html`

### Passo 4: Testar Pagamento Pendente

1. **Repita o processo**
2. **Use valor específico:** R$ 1.234,56
3. **Use cartão:** `5031 4332 1540 6351`
4. **Verifique redirecionamento para:** `payment-pending.html`

---

## 🔍 Verificar Logs

### Backend Logs

```bash
# No terminal do backend, você verá:
✅ Preferência criada: pref-123456789
📬 Webhook recebido: { type: 'payment', data: { id: '123456789' } }
✅ Pagamento aprovado: 123456789
```

### ngrok Logs

```bash
# No terminal do ngrok, você verá:
POST /api/payment/webhook    200 OK
```

### Mercado Pago Dashboard

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Vá em **"Atividade de teste"** ou **"Test payments"**
3. Veja todos os pagamentos de teste realizados

---

## 🐛 Troubleshooting

### Problema: "Credenciais inválidas"

**Solução:**

- Verifique se as credenciais começam com `TEST-`
- Confirme que copiou corretamente do painel
- Reinicie o servidor após alterar o .env

### Problema: "Webhook não está sendo recebido"

**Solução:**

1. Verifique se o ngrok está rodando
2. Confirme a URL no painel do Mercado Pago
3. Teste manualmente: `curl -X POST https://sua-url.ngrok.io/api/payment/webhook`
4. Verifique os logs do ngrok

### Problema: "Pagamento não redireciona"

**Solução:**

- Verifique as URLs de retorno no .env
- Confirme que as páginas existem: `payment-success.html`, `payment-failure.html`, `payment-pending.html`
- Verifique o console do navegador para erros

### Problema: "Erro ao criar preferência"

**Solução:**

- Verifique se o servidor está rodando
- Confirme que o endpoint `/api/payment/create-preference` está acessível
- Verifique os dados enviados no body da requisição
- Veja os logs do backend para detalhes do erro

---

## 📊 Checklist de Teste

Use este checklist para garantir que tudo está funcionando:

- [ ] Credenciais de teste configuradas no .env
- [ ] Backend rodando em http://localhost:4000
- [ ] ngrok rodando e URL atualizada no .env
- [ ] Webhook configurado no painel do Mercado Pago
- [ ] Páginas de retorno criadas (success, failure, pending)
- [ ] Teste de pagamento aprovado ✅
- [ ] Teste de pagamento recusado ❌
- [ ] Teste de pagamento pendente ⏳
- [ ] Webhook recebido e processado
- [ ] Logs do backend funcionando
- [ ] Redirecionamentos funcionando

---

## 🎯 Próximos Passos

Após testar com sucesso no modo sandbox:

1. **Obtenha credenciais de produção:**

   - Vá em "Credenciais de produção"
   - Copie Access Token e Public Key (começam com `APP_USR-`)

2. **Atualize o .env para produção:**

   ```env
   MERCADOPAGO_ACCESS_TOKEN=APP_USR-seu-token-de-producao
   MERCADOPAGO_PUBLIC_KEY=APP_USR-sua-chave-de-producao
   BACKEND_URL=https://seu-dominio.com
   ```

3. **Configure webhook de produção:**

   - Use a URL real do seu servidor
   - Não use ngrok em produção

4. **Teste com cartões reais:**
   - Use seus próprios cartões
   - Faça compras de teste com valores baixos

---

## 📞 Suporte

- **Documentação Oficial:** https://www.mercadopago.com.br/developers/pt/docs
- **Status da API:** https://status.mercadopago.com/
- **Suporte:** https://www.mercadopago.com.br/developers/pt/support

---

**Feito com ❤️ por Bob**
