/**
 * Script de Teste - Mercado Pago
 * Testa a configuração e criação de preferências
 */

import dotenv from "dotenv";
import { createPaymentPreference } from "./mercadopago-config.js";

dotenv.config();

console.log("🧪 Testando configuração do Mercado Pago...\n");

// Verificar credenciais
console.log("📋 Verificando credenciais:");
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
const publicKey = process.env.MERCADOPAGO_PUBLIC_KEY;

if (!accessToken || !publicKey) {
  console.error("❌ Credenciais não configuradas!");
  console.log("\n📝 Configure as variáveis no arquivo .env:");
  console.log("   MERCADOPAGO_ACCESS_TOKEN=TEST-...");
  console.log("   MERCADOPAGO_PUBLIC_KEY=TEST-...");
  process.exit(1);
}

// Verificar se são credenciais de teste
const isTestMode =
  accessToken.startsWith("TEST-") && publicKey.startsWith("TEST-");
console.log(`   Access Token: ${accessToken.substring(0, 20)}...`);
console.log(`   Public Key: ${publicKey.substring(0, 20)}...`);
console.log(`   Modo: ${isTestMode ? "🧪 TESTE (Sandbox)" : "🚀 PRODUÇÃO"}`);

if (!isTestMode) {
  console.warn("\n⚠️  ATENÇÃO: Você está usando credenciais de PRODUÇÃO!");
  console.warn("   Para testes, use credenciais que começam com TEST-");
}

console.log("\n✅ Credenciais configuradas corretamente!\n");

// Testar criação de preferência
console.log("🔧 Testando criação de preferência de pagamento...\n");

const testOrder = {
  items: [
    {
      id: "test-001",
      title: "Produto de Teste",
      description: "Teste de integração Mercado Pago",
      quantity: 1,
      price: 100.0,
    },
  ],
  payer: {
    name: "João da Silva",
    email: "test_user_123456@testuser.com",
    phone: {
      areaCode: "11",
      number: "987654321",
    },
  },
  backUrls: {
    success: "http://localhost:4000/payment-success.html",
    failure: "http://localhost:4000/payment-failure.html",
    pending: "http://localhost:4000/payment-pending.html",
  },
  externalReference: `TEST-${Date.now()}`,
  notificationUrl: "http://localhost:4000/api/payment/webhook",
};

try {
  console.log("📦 Dados do pedido de teste:");
  console.log(JSON.stringify(testOrder, null, 2));
  console.log("\n⏳ Criando preferência...\n");

  const preference = await createPaymentPreference(testOrder);

  console.log("✅ Preferência criada com sucesso!\n");
  console.log("📋 Detalhes da preferência:");
  console.log(`   ID: ${preference.preferenceId}`);
  console.log(`   Init Point: ${preference.initPoint}`);

  if (preference.sandboxInitPoint) {
    console.log(`   Sandbox Init Point: ${preference.sandboxInitPoint}`);
  }

  console.log("\n🎉 Teste concluído com sucesso!");
  console.log("\n📝 Próximos passos:");
  console.log("   1. Inicie o servidor: npm start");
  console.log("   2. Configure o ngrok: ngrok http 4000");
  console.log("   3. Atualize BACKEND_URL no .env com a URL do ngrok");
  console.log("   4. Configure o webhook no painel do Mercado Pago");
  console.log("   5. Teste o fluxo completo no frontend");
  console.log("\n💳 Cartões de teste:");
  console.log("   Aprovado: 5031 4332 1540 6351");
  console.log("   Recusado: 5031 7557 3453 0604");
  console.log("   CVV: 123 | Validade: 11/25");
} catch (error) {
  console.error("\n❌ Erro ao criar preferência:");
  console.error(`   ${error.message}`);

  if (error.cause) {
    console.error("\n📋 Detalhes do erro:");
    console.error(JSON.stringify(error.cause, null, 2));
  }

  console.log("\n🔍 Possíveis soluções:");
  console.log("   1. Verifique se as credenciais estão corretas");
  console.log(
    "   2. Confirme que são credenciais de TESTE (começam com TEST-)"
  );
  console.log("   3. Verifique sua conexão com a internet");
  console.log(
    "   4. Consulte a documentação: https://www.mercadopago.com.br/developers"
  );

  process.exit(1);
}

// Made with Bob
