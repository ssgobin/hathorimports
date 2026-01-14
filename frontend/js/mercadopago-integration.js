/**
 * Integração Mercado Pago - Frontend
 * Hathor Imports
 */

import { getCart, getCartSummary, clearCart } from "./cart-improved.js";
import { showNotification } from "./notifications.js";

// ===== CONFIGURAÇÃO =====
const BACKEND_URL = window.location.origin;
let mercadoPagoPublicKey = null;
let mp = null;

/**
 * Inicializar Mercado Pago SDK
 */
async function initMercadoPago() {
  try {
    // Buscar public key do backend
    const response = await fetch(
      `${BACKEND_URL}/api/payment/config/public-key`
    );
    const data = await response.json();

    if (!data.success || !data.publicKey) {
      console.warn("⚠️  Public Key do Mercado Pago não configurada");
      return false;
    }

    mercadoPagoPublicKey = data.publicKey;

    // Inicializar SDK do Mercado Pago
    if (window.MercadoPago) {
      mp = new window.MercadoPago(mercadoPagoPublicKey);
      console.log("✅ Mercado Pago SDK inicializado");
      return true;
    } else {
      console.error("❌ SDK do Mercado Pago não carregado");
      return false;
    }
  } catch (error) {
    console.error("❌ Erro ao inicializar Mercado Pago:", error);
    return false;
  }
}

/**
 * Criar preferência de pagamento
 */
async function createPaymentPreference(customerData, shippingData) {
  try {
    const cart = getCart();
    const summary = getCartSummary();

    if (cart.length === 0) {
      throw new Error("Carrinho vazio");
    }

    // Preparar dados do pedido
    const orderData = {
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
        description: `${item.name} - Quantidade: ${item.quantity}`,
      })),

      customer: {
        name: customerData.name,
        email: customerData.email,
        whatsapp: customerData.whatsapp,
      },

      shipping: shippingData,

      externalReference: `ORDER-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`,
    };

    console.log("📦 Criando preferência de pagamento...");
    console.log("👤 Dados do cliente:", customerData);
    console.log("📍 Dados de envio:", shippingData);
    console.log("🛒 Itens do carrinho:", cart);
    console.log(
      "📄 Dados completos do pedido:",
      JSON.stringify(orderData, null, 2)
    );

    // Enviar para backend
    const response = await fetch(
      `${BACKEND_URL}/api/payment/create-preference`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      }
    );

    const data = await response.json();

    console.log(
      "📥 Resposta recebida do backend:",
      JSON.stringify(data, null, 2)
    );

    if (!data.success) {
      throw new Error(data.error || "Erro ao criar preferência de pagamento");
    }

    console.log("✅ Preferência criada:", data.preferenceId);
    console.log("🔗 initPoint:", data.initPoint);
    console.log("🔗 sandboxInitPoint:", data.sandboxInitPoint);

    return {
      success: true,
      preferenceId: data.preferenceId,
      initPoint: data.initPoint,
      sandboxInitPoint: data.sandboxInitPoint,
    };
  } catch (error) {
    console.error("❌ Erro ao criar preferência:", error);
    throw error;
  }
}

/**
 * Abrir Checkout do Mercado Pago
 */
async function openMercadoPagoCheckout(customerData, shippingData) {
  try {
    // Verificar se SDK está inicializado
    if (!mp) {
      const initialized = await initMercadoPago();
      if (!initialized) {
        throw new Error("Mercado Pago não está configurado");
      }
    }

    // Mostrar loading
    showLoading("Preparando pagamento...");

    // Criar preferência
    const preference = await createPaymentPreference(
      customerData,
      shippingData
    );

    // Ocultar loading
    hideLoading();

    // Redirecionar para o checkout do Mercado Pago
    // Usar sandboxInitPoint para testes, initPoint para produção
    const checkoutUrl = preference.sandboxInitPoint || preference.initPoint;

    console.log("🔍 Verificando URLs de checkout:");
    console.log("  - sandboxInitPoint:", preference.sandboxInitPoint);
    console.log("  - initPoint:", preference.initPoint);
    console.log("  - URL escolhida:", checkoutUrl);

    if (!checkoutUrl) {
      console.error("❌ Nenhuma URL de checkout foi retornada!");
      console.error("Dados da preferência:", preference);
      throw new Error("URL do checkout não foi retornada");
    }

    console.log(
      "🚀 Redirecionando para checkout do Mercado Pago:",
      checkoutUrl
    );
    console.log("⏳ Aguardando 1 segundo antes de redirecionar...");

    // Aguardar 1 segundo para garantir que os logs sejam visíveis
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("➡️  Executando redirecionamento agora...");
    // Redirecionar para a página de pagamento
    window.location.href = checkoutUrl;
  } catch (error) {
    hideLoading();
    console.error("❌ Erro ao abrir checkout:", error);
    showNotification(error.message || "Erro ao processar pagamento", "error");
    throw error;
  }
}

/**
 * Processar pagamento via Mercado Pago
 */
export async function processPaymentWithMercadoPago(
  customerData,
  shippingData
) {
  try {
    await openMercadoPagoCheckout(customerData, shippingData);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Verificar status de pagamento
 */
export async function checkPaymentStatus(paymentId) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/payment/${paymentId}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Erro ao verificar pagamento");
    }

    return data.payment;
  } catch (error) {
    console.error("❌ Erro ao verificar pagamento:", error);
    throw error;
  }
}

/**
 * Mostrar loading overlay
 */
function showLoading(message = "Carregando...") {
  const overlay = document.createElement("div");
  overlay.id = "mp-loading-overlay";
  overlay.className = "loading-overlay";
  overlay.innerHTML = `
    <div class="loading-content">
      <div class="loading-spinner"></div>
      <div class="loading-text">${message}</div>
    </div>
  `;
  document.body.appendChild(overlay);
}

/**
 * Ocultar loading overlay
 */
function hideLoading() {
  const overlay = document.getElementById("mp-loading-overlay");
  if (overlay) {
    overlay.remove();
  }
}

/**
 * Carregar SDK do Mercado Pago
 */
export function loadMercadoPagoSDK() {
  return new Promise((resolve, reject) => {
    // Verificar se já está carregado
    if (window.MercadoPago) {
      resolve();
      return;
    }

    // Criar script tag
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;

    script.onload = () => {
      console.log("✅ SDK do Mercado Pago carregado");
      resolve();
    };

    script.onerror = () => {
      console.error("❌ Erro ao carregar SDK do Mercado Pago");
      reject(new Error("Erro ao carregar SDK do Mercado Pago"));
    };

    document.head.appendChild(script);
  });
}

/**
 * Inicializar integração
 */
export async function initMercadoPagoIntegration() {
  try {
    // Carregar SDK
    await loadMercadoPagoSDK();

    // Inicializar com public key
    await initMercadoPago();

    return true;
  } catch (error) {
    console.error("❌ Erro ao inicializar Mercado Pago:", error);
    return false;
  }
}
