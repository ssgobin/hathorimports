# 🔧 Configuração do Mercado Pago - Hathor Imports

Este guia explica como configurar a integração com Mercado Pago no projeto.

## 📋 Pré-requisitos

1. Conta no Mercado Pago (criar em: https://www.mercadopago.com.br)
2. Aplicação criada no painel de desenvolvedores

## 🚀 Passo a Passo

### 1. Criar Aplicação no Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Clique em "Criar aplicação"
3. Preencha os dados:
   - **Nome**: Hathor Imports
   - **Descrição**: E-commerce de sneakers e streetwear
   - **Categoria**: Fashion
4. Clique em "Criar aplicação"

### 2. Obter Credenciais

Após criar a aplicação, você terá acesso a:

#### Credenciais de Teste (Sandbox)
- **Public Key**: `TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Access Token**: `TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

#### Credenciais de Produção
- **Public Key**: `APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Access Token**: `APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### 3. Configurar Variáveis de Ambiente

Edite o arquivo `backend/.env` e adicione:

```env
# Mercado Pago - Credenciais de Produção
MERCADOPAGO_ACCESS_TOKEN=APP_USR-seu-access-token-aqui
MERCADOPAGO_PUBLIC_KEY=APP_USR-sua-public-key-aqui

# URLs de retorno (ajuste conforme seu domínio)
MERCADOPAGO_SUCCESS_URL=http://localhost:4000/payment-success.html
MERCADOPAGO_FAILURE_URL=http://localhost:4000/payment-failure.html
MERCADOPAGO_PENDING_URL=http://localhost:4000/payment-pending.html

# URL do backend (para webhooks)
BACKEND_URL=http://localhost:4000
```

### 4. Configurar Webhooks (Notificações)

1. No painel do Mercado Pago, vá em "Webhooks"
2. Adicione uma nova URL de notificação:
   - **URL**: `https://seu-dominio.com/api/payment/webhook`
   - **Eventos**: Selecione "Pagamentos"
3. Salve a configuração

**Importante**: Para desenvolvimento local, use ferramentas como:
- [ngrok](https://ngrok.com/) - Túnel HTTP para localhost
- [localtunnel](https://localtunnel.github.io/www/) - Alternativa ao ngrok

Exemplo com ngrok:
```bash
ngrok http 4000
# Use a URL gerada (ex: https://abc123.ngrok.io) no webhook
```

### 5. Testar em Ambiente de Teste

Para testar sem cobranças reais:

1. Use as credenciais de **TESTE** no `.env`
2. Use cartões de teste do Mercado Pago:
   - **Aprovado**: 5031 4332 1540 6351
   - **Recusado**: 5031 7557 3453 0604
   - **Pendente**: 5031 4332 1540 6351 (com valor específico)
3. CVV: qualquer 3 dígitos
4. Data de vencimento: qualquer data futura
5. Nome: APRO (aprovado), CONT (pendente), OTHE (recusado)

### 6. URLs de Teste

Cartões de teste completos:

| Status | Cartão | Nome | CVV | Validade |
|--------|--------|------|-----|----------|
| Aprovado | 5031 4332 1540 6351 | APRO | 123 | 11/25 |
| Recusado | 5031 7557 3453 0604 | OTHE | 123 | 11/25 |
| Pendente | 5031 4332 1540 6351 | CONT | 123 | 11/25 |

Mais cartões: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/testing

## 🔐 Segurança

### Boas Práticas

1. **Nunca exponha o Access Token no frontend**
   - Sempre use o backend para criar preferências
   - Apenas a Public Key pode ser usada no frontend

2. **Valide webhooks**
   - Implemente validação de assinatura
   - Verifique a origem das notificações

3. **Use HTTPS em produção**
   - Mercado Pago requer HTTPS para webhooks
   - Obtenha certificado SSL (Let's Encrypt é gratuito)

4. **Proteja suas credenciais**
   - Nunca commite o arquivo `.env`
   - Use variáveis de ambiente no servidor

## 📊 Monitoramento

### Logs do Backend

O backend registra todas as operações:

```
✅ Preferência de pagamento criada: 123456789-abc-def
📬 Webhook recebido: { type: 'payment', data: { id: '123' } }
💳 Status do pagamento 123: approved
```

### Painel do Mercado Pago

Acesse: https://www.mercadopago.com.br/activities

- Visualize todos os pagamentos
- Veja detalhes de transações
- Acompanhe estornos e disputas

## 🧪 Testando a Integração

### 1. Criar Preferência de Pagamento

```bash
curl -X POST http://localhost:4000/api/payment/create-preference \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "id": "item-1",
        "name": "Nike Air Jordan 1",
        "quantity": 1,
        "price": 899.90,
        "image": "https://example.com/image.jpg"
      }
    ],
    "customer": {
      "name": "João Silva",
      "email": "joao@example.com",
      "whatsapp": "11999999999"
    },
    "shipping": {
      "cep": "01310100",
      "street": "Av Paulista",
      "number": "1000"
    }
  }'
```

### 2. Buscar Informações de Pagamento

```bash
curl http://localhost:4000/api/payment/123456789
```

### 3. Obter Public Key

```bash
curl http://localhost:4000/api/payment/config/public-key
```

## 🚨 Troubleshooting

### Erro: "Access Token inválido"
- Verifique se copiou o token completo
- Confirme que está usando o token correto (teste ou produção)
- Regenere o token no painel se necessário

### Webhook não está sendo chamado
- Verifique se a URL está acessível publicamente
- Use ngrok para desenvolvimento local
- Confirme que o webhook está configurado no painel

### Pagamento não é processado
- Verifique os logs do backend
- Confirme que os dados do pedido estão corretos
- Teste com cartões de teste primeiro

## 📚 Documentação Oficial

- [Documentação Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs)
- [Checkout Pro](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/landing)
- [Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)
- [Cartões de Teste](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/testing)

## 💡 Dicas

1. **Comece com ambiente de teste**
   - Teste toda a integração antes de ir para produção
   - Use cartões de teste para simular diferentes cenários

2. **Implemente tratamento de erros**
   - Pagamentos podem falhar por diversos motivos
   - Sempre forneça feedback claro ao usuário

3. **Monitore os webhooks**
   - Configure alertas para falhas
   - Implemente retry logic se necessário

4. **Documente o fluxo**
   - Mantenha registro de como os pagamentos são processados
   - Documente casos especiais e exceções

## 🎯 Próximos Passos

Após configurar o Mercado Pago:

1. ✅ Testar em ambiente de desenvolvimento
2. ✅ Implementar páginas de sucesso/falha
3. ✅ Configurar webhooks em produção
4. ✅ Obter certificado SSL
5. ✅ Fazer deploy em servidor de produção
6. ✅ Testar com pagamentos reais (valores baixos)
7. ✅ Monitorar primeiras transações

---

**Desenvolvido com ❤️ por Bob**