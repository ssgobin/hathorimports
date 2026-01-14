/**
 * Checkout Melhorado com Integração WhatsApp e Mercado Pago
 * Hathor Imports
 */

import { getCart, getCartSummary, clearCart } from "./cart-improved.js";
import { showNotification } from "./notifications.js";
import {
  processPaymentWithMercadoPago,
  initMercadoPagoIntegration,
} from "./mercadopago-integration.js";

// ===== CONFIGURAÇÃO =====
const WHATSAPP_NUMBER = "5519981050194"; // Número do WhatsApp da loja

// ===== ESTADO =====
let selectedPaymentMethod = "";
let customerData = {
  name: "",
  whatsapp: "",
  email: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
};

// ===== ELEMENTOS DOM =====
const form = document.getElementById("checkout-form");
const paymentOptions = document.querySelectorAll(".payment-option");
const btnSearchCep = document.getElementById("btn-search-cep");
const btnWhatsApp = document.getElementById("btn-whatsapp");
const btnSaveOrder = document.getElementById("btn-save-order");

// ===== FORMATAR VALORES =====
export function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatPhone(value) {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
}

function formatCEP(value) {
  const numbers = value.replace(/\D/g, "");
  return numbers.replace(/(\d{5})(\d{3})/, "$1-$2");
}

// ===== RENDERIZAR RESUMO =====
export function renderOrderSummary() {
  const cart = getCart();
  const summary = getCartSummary();
  const summaryItemsEl = document.getElementById("summary-items");
  const subtotalEl = document.getElementById("summary-subtotal");
  const discountEl = document.getElementById("summary-discount");
  const shippingEl = document.getElementById("summary-shipping");
  const totalEl = document.getElementById("summary-total");
  const discountRow = document.getElementById("discount-row");

  // Renderizar itens
  if (cart.length === 0) {
    summaryItemsEl.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: rgba(255,255,255,0.6);">
        <div style="font-size: 48px; margin-bottom: 16px;">🛒</div>
        <p>Seu carrinho está vazio</p>
      </div>
    `;
    return;
  }

  summaryItemsEl.innerHTML = cart
    .map(
      (item) => `
    <div class="summary-item">
      <img src="${item.image}" alt="${item.name}" class="summary-item-image">
      <div class="summary-item-info">
        <div class="summary-item-name">${item.name}</div>
        <div class="summary-item-details">Quantidade: ${item.quantity}</div>
      </div>
      <div class="summary-item-price">
        ${formatCurrency(item.price * item.quantity)}
      </div>
    </div>
  `
    )
    .join("");

  // Atualizar valores
  subtotalEl.textContent = formatCurrency(summary.subtotal);
  shippingEl.textContent =
    summary.shipping === 0 ? "Grátis" : formatCurrency(summary.shipping);
  totalEl.textContent = formatCurrency(summary.total);

  // Mostrar/ocultar desconto
  if (summary.discount > 0) {
    discountRow.style.display = "flex";
    discountEl.textContent = `- ${formatCurrency(summary.discount)}`;
  } else {
    discountRow.style.display = "none";
  }
}

// ===== BUSCAR CEP =====
async function searchCEP() {
  const cepInput = document.getElementById("input-cep");
  const cepLoading = document.getElementById("cep-loading");
  const cep = cepInput.value.replace(/\D/g, "");

  console.log("🔍 Buscando CEP:", cep);

  if (cep.length !== 8) {
    showNotification("CEP deve ter 8 dígitos", "error");
    console.error("❌ CEP inválido:", cep);
    return;
  }

  // Mostrar indicador de carregamento
  if (cepLoading) {
    cepLoading.style.display = "inline";
  }

  try {
    console.log("📡 Tentando ViaCEP...");
    // Tentar ViaCEP primeiro
    let data = await fetchViaCEP(cep);

    // Se ViaCEP falhar, tentar API alternativa
    if (!data) {
      console.log("⚠️ ViaCEP falhou, tentando BrasilAPI...");
      data = await fetchBrasilAPI(cep);
    }

    if (!data) {
      console.error("❌ Nenhuma API retornou dados para o CEP:", cep);
      showNotification("CEP não encontrado em nenhuma base de dados", "error");
      return;
    }

    console.log("✅ Dados encontrados:", data);

    // Preencher campos
    document.getElementById("input-street").value =
      data.logradouro || data.street || "";
    document.getElementById("input-district").value =
      data.bairro || data.neighborhood || "";
    document.getElementById("input-city").value =
      data.localidade || data.city || "";
    document.getElementById("input-state").value = data.uf || data.state || "";

    // Focar no campo número
    document.getElementById("input-number").focus();

    showNotification("Endereço encontrado!", "success");
  } catch (error) {
    console.error("❌ Erro crítico ao buscar CEP:", error);
    console.error("Stack trace:", error.stack);
    showNotification(`Erro ao buscar CEP: ${error.message}`, "error");
  } finally {
    // Esconder indicador de carregamento
    if (cepLoading) {
      cepLoading.style.display = "none";
    }
  }
}

// Buscar CEP via ViaCEP
async function fetchViaCEP(cep) {
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      method: "GET",
      mode: "cors",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error("ViaCEP retornou erro:", response.status);
      return null;
    }

    const data = await response.json();

    if (data.erro) {
      console.error("CEP não encontrado no ViaCEP");
      return null;
    }

    return data;
  } catch (error) {
    console.error("Erro ao buscar no ViaCEP:", error);
    return null;
  }
}

// Buscar CEP via BrasilAPI (alternativa)
async function fetchBrasilAPI(cep) {
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`, {
      method: "GET",
      mode: "cors",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error("BrasilAPI retornou erro:", response.status);
      return null;
    }

    const data = await response.json();

    // Converter formato BrasilAPI para formato ViaCEP
    return {
      logradouro: data.street,
      bairro: data.neighborhood,
      localidade: data.city,
      uf: data.state,
      cep: data.cep,
    };
  } catch (error) {
    console.error("Erro ao buscar no BrasilAPI:", error);
    return null;
  }
}

// ===== VALIDAR FORMULÁRIO =====
function validateForm() {
  const errors = [];

  // Nome
  const name = document.getElementById("input-name").value.trim();
  if (!name || name.length < 3) {
    errors.push("Nome completo é obrigatório (mínimo 3 caracteres)");
  }

  // WhatsApp
  const whatsapp = document
    .getElementById("input-whatsapp")
    .value.replace(/\D/g, "");
  if (!whatsapp || whatsapp.length < 10) {
    errors.push("WhatsApp válido é obrigatório");
  }

  // CEP
  const cep = document.getElementById("input-cep").value.replace(/\D/g, "");
  if (!cep || cep.length !== 8) {
    errors.push("CEP válido é obrigatório");
  }

  // Endereço
  const street = document.getElementById("input-street").value.trim();
  const number = document.getElementById("input-number").value.trim();
  const district = document.getElementById("input-district").value.trim();
  const city = document.getElementById("input-city").value.trim();
  const state = document.getElementById("input-state").value.trim();

  if (!street) errors.push("Rua é obrigatória");
  if (!number) errors.push("Número é obrigatório");
  if (!district) errors.push("Bairro é obrigatório");
  if (!city) errors.push("Cidade é obrigatória");
  if (!state) errors.push("Estado é obrigatório");

  // Método de pagamento
  if (!selectedPaymentMethod) {
    errors.push("Selecione um método de pagamento");
  }

  if (errors.length > 0) {
    showNotification(errors[0], "error");
    return false;
  }

  return true;
}

// ===== COLETAR DADOS DO FORMULÁRIO =====
function collectFormData() {
  return {
    name: document.getElementById("input-name").value.trim(),
    whatsapp: document
      .getElementById("input-whatsapp")
      .value.replace(/\D/g, ""),
    email: document.getElementById("input-email").value.trim(),
    cep: document.getElementById("input-cep").value.replace(/\D/g, ""),
    street: document.getElementById("input-street").value.trim(),
    number: document.getElementById("input-number").value.trim(),
    complement: document.getElementById("input-complement").value.trim(),
    district: document.getElementById("input-district").value.trim(),
    city: document.getElementById("input-city").value.trim(),
    state: document.getElementById("input-state").value.trim(),
    paymentMethod: selectedPaymentMethod,
  };
}

// ===== GERAR MENSAGEM WHATSAPP =====
function generateWhatsAppMessage() {
  const cart = getCart();
  const summary = getCartSummary();
  const data = collectFormData();

  let message = `🛍️ *NOVO PEDIDO - HATHOR IMPORTS*\n\n`;

  // Dados do cliente
  message += `👤 *CLIENTE*\n`;
  message += `Nome: ${data.name}\n`;
  message += `WhatsApp: ${formatPhone(data.whatsapp)}\n`;
  if (data.email) message += `Email: ${data.email}\n`;
  message += `\n`;

  // Endereço
  message += `📍 *ENDEREÇO DE ENTREGA*\n`;
  message += `${data.street}, ${data.number}`;
  if (data.complement) message += ` - ${data.complement}`;
  message += `\n${data.district}\n`;
  message += `${data.city} - ${data.state}\n`;
  message += `CEP: ${formatCEP(data.cep)}\n`;
  message += `\n`;

  // Itens do pedido
  message += `🛒 *ITENS DO PEDIDO*\n`;
  cart.forEach((item, index) => {
    message += `${index + 1}. ${item.name}\n`;
    message += `   Qtd: ${item.quantity}x | Valor: ${formatCurrency(
      item.price
    )}\n`;
  });
  message += `\n`;

  // Resumo financeiro
  message += `💰 *RESUMO FINANCEIRO*\n`;
  message += `Subtotal: ${formatCurrency(summary.subtotal)}\n`;

  if (summary.discount > 0) {
    const coupon = localStorage.getItem("appliedCoupon");
    message += `Desconto (${coupon}): -${formatCurrency(summary.discount)}\n`;
  }

  message += `Frete: ${
    summary.shipping === 0 ? "GRÁTIS" : formatCurrency(summary.shipping)
  }\n`;
  message += `*TOTAL: ${formatCurrency(summary.total)}*\n`;
  message += `\n`;

  // Método de pagamento
  message += `💳 *PAGAMENTO*\n`;
  message += `Método: ${data.paymentMethod}\n`;

  return encodeURIComponent(message);
}

// ===== ENVIAR PARA WHATSAPP =====
function sendToWhatsApp() {
  if (!validateForm()) return;

  const message = generateWhatsAppMessage();
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

  // Abrir WhatsApp
  window.open(whatsappUrl, "_blank");

  // Limpar carrinho após envio
  setTimeout(() => {
    clearCart();
    showNotification("Pedido enviado! Aguarde nosso contato.", "success");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);
  }, 1000);
}
// ===== PROCESSAR PAGAMENTO VIA MERCADO PAGO =====
async function processWithMercadoPago() {
  if (!validateForm()) return;

  const data = collectFormData();

  const customerData = {
    name: data.name,
    email: data.email,
    whatsapp: data.whatsapp,
  };

  const shippingData = {
    cep: data.cep,
    street: data.street,
    number: data.number,
    complement: data.complement,
    district: data.district,
    city: data.city,
    state: data.state,
  };

  try {
    const result = await processPaymentWithMercadoPago(
      customerData,
      shippingData
    );

    if (result.success) {
      showNotification("Redirecionando para pagamento...", "success");
    } else {
      showNotification(result.error || "Erro ao processar pagamento", "error");
    }
  } catch (error) {
    console.error("Erro ao processar pagamento:", error);
    showNotification("Erro ao processar pagamento. Tente novamente.", "error");
  }
}

// ===== SALVAR PEDIDO (OPCIONAL) =====
async function saveOrder() {
  if (!validateForm()) return;

  const cart = getCart();
  const summary = getCartSummary();
  const data = collectFormData();

  const order = {
    customer: {
      name: data.name,
      whatsapp: data.whatsapp,
      email: data.email,
    },
    address: {
      cep: data.cep,
      street: data.street,
      number: data.number,
      complement: data.complement,
      district: data.district,
      city: data.city,
      state: data.state,
    },
    items: cart,
    summary: {
      subtotal: summary.subtotal,
      discount: summary.discount,
      shipping: summary.shipping,
      total: summary.total,
    },
    paymentMethod: data.paymentMethod,
    coupon: localStorage.getItem("appliedCoupon"),
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  try {
    // Aqui você pode salvar no Firebase ou backend
    console.log("Pedido salvo:", order);

    showNotification("Pedido salvo com sucesso!", "success");

    // Enviar para WhatsApp também
    sendToWhatsApp();
  } catch (error) {
    console.error("Erro ao salvar pedido:", error);
    showNotification("Erro ao salvar pedido. Tente novamente.", "error");
  }
}

// ===== EVENT LISTENERS =====
export function initCheckout() {
  // Renderizar resumo inicial
  renderOrderSummary();

  // Verificar se há itens no carrinho
  const cart = getCart();
  if (cart.length === 0) {
    btnWhatsApp.disabled = true;
    btnSaveOrder.disabled = true;
  }

  // Seleção de método de pagamento
  paymentOptions.forEach((option) => {
    option.addEventListener("click", () => {
      paymentOptions.forEach((opt) => opt.classList.remove("selected"));
      option.classList.add("selected");
      selectedPaymentMethod = option.dataset.method;
    });
  });

  // Buscar CEP
  if (btnSearchCep) {
    btnSearchCep.addEventListener("click", searchCEP);
  }

  // Formatação automática de campos
  const whatsappInput = document.getElementById("input-whatsapp");
  if (whatsappInput) {
    whatsappInput.addEventListener("input", (e) => {
      e.target.value = formatPhone(e.target.value);
    });
  }

  const cepInput = document.getElementById("input-cep");

  // Botão Mercado Pago
  const btnMercadoPago = document.getElementById("btn-mercadopago");
  if (btnMercadoPago) {
    btnMercadoPago.addEventListener("click", (e) => {
      e.preventDefault();
      processWithMercadoPago();
    });
  }

  // Inicializar Mercado Pago SDK
  initMercadoPagoIntegration().catch((err) => {
    console.warn("Mercado Pago não disponível:", err);
  });

  // Variável para armazenar o timeout do debounce
  let cepSearchTimeout = null;

  if (cepInput) {
    cepInput.addEventListener("input", (e) => {
      // Formatar CEP
      e.target.value = formatCEP(e.target.value);

      // Limpar timeout anterior
      if (cepSearchTimeout) {
        clearTimeout(cepSearchTimeout);
      }

      // Obter CEP sem formatação
      const cep = e.target.value.replace(/\D/g, "");

      // Se tiver 8 dígitos, buscar automaticamente após 500ms
      if (cep.length === 8) {
        cepSearchTimeout = setTimeout(() => {
          console.log("🔍 Buscando CEP automaticamente:", cep);
          searchCEP();
        }, 500); // Aguarda 500ms após parar de digitar
      }
    });

    // Buscar ao pressionar Enter (mantido para compatibilidade)
    cepInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        // Limpar timeout se existir
        if (cepSearchTimeout) {
          clearTimeout(cepSearchTimeout);
        }
        searchCEP();
      }
    });
  }

  // Botão WhatsApp
  if (btnWhatsApp) {
    btnWhatsApp.addEventListener("click", (e) => {
      e.preventDefault();
      sendToWhatsApp();
    });
  }

  // Botão Salvar Pedido
  if (btnSaveOrder) {
    btnSaveOrder.addEventListener("click", (e) => {
      e.preventDefault();
      saveOrder();
    });
  }

  // Prevenir submit do formulário
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      sendToWhatsApp();
    });
  }
}

// ===== INICIALIZAR =====
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCheckout);
} else {
  initCheckout();
}

// Made with Bob
