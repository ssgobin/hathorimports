import {
  createProduct,
  listProducts,
  deleteProduct,
  getSettings,
  saveSettings,
  createCustomer,
  listCustomers,
  createCoupon,
  listCoupons,
  createOrder,
  listOrders,
} from "./store.js";

import { requireAuth, handleAuthButtons, logout } from "./auth.js";

import { notify } from "./notifications.js";

// 🔥 FIREBASE
import {
  getFirestore,
  doc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import {
  getDocs,
  collection,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

import { requireAdmin } from "./auth.js";
requireAdmin();

handleAuthButtons();

/* =====================================================
   SIDEBAR
===================================================== */
const menuItems = document.querySelectorAll(".admin-menu-item");
const views = document.querySelectorAll(".admin-view");
const titleEl = document.getElementById("adminTitle");
let pendingImport = null;

menuItems.forEach((btn) => {
  btn.addEventListener("click", () => {
    const viewId = btn.dataset.view;
    menuItems.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    views.forEach((v) => v.classList.remove("active"));
    const target = document.getElementById(viewId);
    if (target) target.classList.add("active");

    titleEl.textContent = btn.textContent.trim();
  });
});

/* =====================================================
   LOGOUT
===================================================== */
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) logoutBtn.addEventListener("click", () => logout());

/* =====================================================
   DASHBOARD
===================================================== */
const metricTotalProducts = document.getElementById("metricTotalProducts");
const metricAvgPrice = document.getElementById("metricAvgPrice");
const metricLastImport = document.getElementById("metricLastImport");
const dashboardLog = document.getElementById("dashboardLog");

function dashLog(msg) {
  dashboardLog.textContent += msg + "\n";
  dashboardLog.scrollTop = dashboardLog.scrollHeight;
}

/* =====================================================
   PRODUCTS
===================================================== */
const listEl = document.getElementById("productList");

let cachedProducts = [];

async function loadProducts(updateDashboard = false) {
  const items = await listProducts();
  cachedProducts = items;

  if (listEl) {
    if (!items.length) {
      listEl.innerHTML =
        "<p style='color:#6b7280;font-size:0.85rem;'>Nenhum produto cadastrado ainda.</p>";
    } else {
      listEl.innerHTML = items
        .map((p) => {
          const img =
            (p.images && p.images[0]) ||
            "https://placehold.co/200x200?text=Hathor";

          const original = Number(p.originalPrice || p.price || 0);
          const final = Number(p.price || original);
          const hasPromo = original > final;

          return `
      <div class="admin-product-card ${hasPromo ? "promo" : ""}">

        ${hasPromo ? `<div class="promo-admin-badge">PROMO</div>` : ""}

        <img src="${img}" alt="${p.title}" class="admin-prod-img" />

        <div class="admin-prod-info">
          <h3>${p.title}</h3>

          ${
            hasPromo
              ? `
            <p class="old-price">De: R$ ${original.toFixed(2)}</p>
            <p class="new-price">Por: R$ ${final.toFixed(2)}</p>
          `
              : `
            <p class="normal-price">R$ ${final.toFixed(2)}</p>
          `
          }
        </div>

        <div class="admin-actions">
          <button class="btn-edit admin-edit-btn" data-id="${p.id}">
            Editar
          </button>

          <button class="btn-edit admin-delete-btn" data-id="${p.id}">
            Excluir
          </button>

          <button class="btn-destaque" onclick="toggleDestaque('${p.id}')">
            ${p.destaque ? "Tirar Destaque" : "Destaque"}
          </button>
        </div>

      </div>
    `;
        })
        .join("");

      listEl.querySelectorAll(".admin-delete-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          if (!confirm("Deseja realmente excluir este produto?")) return;
          await deleteProduct(id);
          dashLog("Produto excluído: " + id);
          loadProducts(true);
        });
      });

      // DESTACAR PRODUTO ⭐
      listEl.querySelectorAll(".admin-highlight-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          const prod = cachedProducts.find((p) => p.id === id);
          const ref = doc(db, "products", id);

          await updateDoc(ref, {
            destaque: !prod.destaque, // alterna true/false
          });

          dashLog("Alterado destaque do produto: " + prod.title);
          loadProducts(true);
        });
      });
    }
  }

  if (updateDashboard) {
    const total = items.length;
    const avg =
      total === 0
        ? 0
        : items.reduce((acc, p) => acc + Number(p.price || 0), 0) / total;

    metricTotalProducts.textContent = total;
    metricAvgPrice.textContent = "R$ " + avg.toFixed(2).replace(".", ",");

    let last = "-";
    if (items.length) {
      const created = items[0].createdAt;
      if (created && created.toDate)
        last = created.toDate().toLocaleString("pt-BR");
    }
    metricLastImport.textContent = last;
  }

  await populateSelectsForOrders();
}

/* =====================================================
   SETTINGS
===================================================== */
let appSettings = null;

const cfgWhatsapp = document.getElementById("cfgWhatsapp");
const cfgCotacao = document.getElementById("cfgCotacao");
const cfgFrete = document.getElementById("cfgFrete");
const cfgDeclaracao = document.getElementById("cfgDeclaracao");
const cfgMargemPercent = document.getElementById("cfgMargemPercent");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");

async function loadSettings() {
  const s = await getSettings();
  appSettings = s || {};
  if (!s) return;

  cfgWhatsapp.value = s.whatsapp || "";
  cfgCotacao.value = s.cotacao || "";
  cfgFrete.value = s.fretePadrao || "";
  cfgDeclaracao.value = s.declaracaoPadrao || "";
  cfgMargemPercent.value = s.margemPercent || "";
}

if (saveSettingsBtn) {
  saveSettingsBtn.addEventListener("click", async () => {
    const data = {
      whatsapp: cfgWhatsapp.value.trim(),
      cotacao: parseFloat(cfgCotacao.value || "0") || 0.75,
      fretePadrao: parseFloat(cfgFrete.value || "0") || 80,
      declaracaoPadrao: parseFloat(cfgDeclaracao.value || "0") || 30,
      margemPercent: parseFloat(cfgMargemPercent.value || "0") || 30,
    };

    await saveSettings(data);
    appSettings = data;
    dashLog("Configurações salvas.");
    notify.success("Configurações salvas com sucesso!");
  });
}

/* =====================================================
   IMPORTAÇÃO YUPOO
===================================================== */
const urlInput = document.getElementById("yupooUrl");
const defaultPriceInput = document.getElementById("defaultPrice");
const statusBox = document.getElementById("importStatus");
const importBtn = document.getElementById("importBtn");

function logStatus(msg) {
  statusBox.textContent += msg + "\n";
  statusBox.scrollTop = statusBox.scrollHeight;
  dashLog(msg);
}

/* =====================================================
   FUNÇÃO DE CÁLCULO DE PREÇO
===================================================== */
function arredondaPreco(preco) {
  // transforma em múltiplo de 5
  const multiplo5 = Math.round(preco / 5) * 5;
  // finaliza com 0.99
  return multiplo5 + 0.99;
}

async function calcularPreco(rawYuan, finalBRL, defaultPrice) {
  const s = await getSettings(); // 🔥 Firestore
  if (!s) return Number(defaultPrice || 0);

  const COT = Number(s.cotacao || 0.75);
  const FRETE = Number(s.fretePadrao || 80);
  const DECL = Number(s.declaracaoPadrao || 60);
  const MARGEM = Number(s.margemPercent || 40);

  if (!rawYuan || rawYuan <= 0) return Number(defaultPrice || 0);

  const baseBRL = rawYuan * COT;
  const totalSemMargem = baseBRL + FRETE + DECL;
  const totalComMargem = totalSemMargem * (1 + MARGEM / 100);

  const arredondado = Math.round(totalComMargem * 100) / 100;
  return arredondaPreco(arredondado);
}

/* =====================================================
   FUNÇÃO DE DETECÇÃO DE CATEGORIA
===================================================== */
// =====================================================
// FUNÇÃO DE DETECÇÃO DE CATEGORIA (USANDO IA + TÍTULO)
// =====================================================
function detectarCategoria(title, rawCategory) {
  const t = (title || "").toLowerCase();
  const c = (rawCategory || "").toLowerCase();

  // 1) PRIORIDADE: categoria vinda da IA (backend)
  if (c === "sneakers" || c === "sneaker" || c === "shoe" || c === "shoes") {
    return { category: "sneakers", label: "Tênis" };
  }

  if (c === "shirt" || c === "tshirt" || c === "camisa" || c === "t-shirt") {
    return { category: "shirt", label: "Camisa" };
  }

  if (c === "bag" || c === "bolsa") {
    return { category: "bag", label: "Bolsa" };
  }

  // 2) SE A IA NÃO MANDAR NADA USÁVEL, CAI NO TITULO
  if (
    t.includes("tênis") ||
    t.includes("sneaker") ||
    t.includes("dunk") ||
    t.includes("aj1") ||
    t.includes("air jordan") ||
    t.includes("shoe")
  ) {
    return { category: "sneakers", label: "Tênis" };
  }

  if (t.includes("camisa") || t.includes("shirt") || t.includes("t-shirt")) {
    return { category: "shirt", label: "Camisa" };
  }

  if (t.includes("bolsa") || t.includes("bag")) {
    return { category: "bag", label: "Bolsa" };
  }

  // fallback
  return { category: "others", label: "Outros" };
}

/* =====================================================
   FUNÇÃO IMPORTAR
===================================================== */
async function importar() {
  const url = urlInput.value.trim();
  const defaultPrice = parseFloat(defaultPriceInput.value || "0") || 0;

  if (!url) {
    notify.warning("Cole o link da Yupoo para importar");
    return;
  }

  // Validação básica de URL
  if (!url.startsWith("http")) {
    notify.error("URL inválida. Deve começar com http:// ou https://");
    return;
  }

  statusBox.textContent = "";
  logStatus("Importando álbum...");

  // Desabilita botão durante importação
  if (importBtn) {
    importBtn.disabled = true;
    importBtn.textContent = "Importando...";
  }

  try {
    // Obter token de autenticação
    const token = localStorage.getItem("authToken");

    if (!token) {
      logStatus(
        "❌ Token de autenticação não encontrado. Faça login novamente."
      );
      notify.error(
        "Você precisa fazer login novamente",
        "Erro de Autenticação"
      );
      return;
    }

    const res = await fetch("/api/import-yupoo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMsg = errorData.error || `Erro HTTP ${res.status}`;

      logStatus(`❌ Erro na API: ${errorMsg}`);
      notify.error(`Erro ao importar: ${errorMsg}`, "Erro na Importação");
      return;
    }

    const result = await res.json();

    // Verifica se a resposta tem a estrutura esperada
    if (!result.success || !result.data) {
      logStatus("❌ Resposta inválida da API");
      notify.error("Resposta inválida do servidor", "Erro na Importação");
      return;
    }

    const data = result.data;

    logStatus("Título bruto: " + (data.rawTitle || "N/A"));
    logStatus("Título final: " + (data.title || "Sem título"));
    logStatus("Fotos encontradas: " + (data.images?.length || 0));

    // Validações
    if (!data.images || data.images.length === 0) {
      logStatus("⚠️ Nenhuma imagem encontrada");
      notify.warning("Nenhuma imagem foi encontrada no álbum", "Atenção");
    }

    const rawPrice = data.rawPriceYuan || null;
    const finalPrice = await calcularPreco(
      rawPrice,
      data.finalPriceBRL,
      defaultPrice
    );

    if (!finalPrice || finalPrice <= 0) {
      logStatus("Preço não calculado. Usando preço padrão.");
    }

    const { category, label } = detectarCategoria(data.title, data.category);

    pendingImport = {
      title: data.title || "Produto Importado",
      price: finalPrice || defaultPrice,
      rawPriceYuan: rawPrice,
      images: data.images || [],
      category,
      categoryLabel: label,
      brand: data.brand || "Genérico",
      model: data.model || null,
    };

    // Preencher modal
    document.getElementById("previewTitle").value = pendingImport.title;
    document.getElementById("previewPrice").value = pendingImport.price;
    document.getElementById("previewCategory").value = pendingImport.category;
    document.getElementById("previewBrand").value = pendingImport.brand || "";
    document.getElementById("previewModel").value = pendingImport.model || "";

    // Imagens
    const imgBox = document.getElementById("previewImages");
    if (pendingImport.images.length > 0) {
      imgBox.innerHTML = pendingImport.images
        .slice(0, 6)
        .map(
          (src) =>
            `<img src="${src}"
                  style="width:90px;height:90px;object-fit:cover;border-radius:8px"
                  onerror="this.src='https://placehold.co/90x90?text=Erro'"
                  alt="Preview" />`
        )
        .join("");
    } else {
      imgBox.innerHTML = "<p style='color:#888'>Nenhuma imagem disponível</p>";
    }

    // Abrir modal
    document.getElementById("previewModal").classList.remove("hidden");
    logStatus("✅ Importação concluída! Revise os dados antes de salvar.");
    notify.success(
      "Produto importado! Revise os dados antes de salvar.",
      "Importação Concluída"
    );
  } catch (error) {
    console.error("❌ Erro ao importar:", error);
    logStatus(`❌ Erro: ${error.message}`);
    notify.error(
      `Erro ao importar produto: ${error.message}`,
      "Erro na Importação"
    );
  } finally {
    // Reabilita botão
    if (importBtn) {
      importBtn.disabled = false;
      importBtn.textContent = "Importar";
    }
  }
}

if (importBtn) importBtn.addEventListener("click", importar);

/* =====================================================
   CLIENTES
===================================================== */

let cachedCustomers = [];
const customersList = document.getElementById("customersList");

async function loadCustomers() {
  if (!customersList) return;

  customersList.innerHTML = "Carregando clientes...";

  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("role", "==", "customer"));
    const snap = await getDocs(q);

    const customers = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    cachedCustomers = customers;

    console.log(`📋 ${customers.length} cliente(s) carregado(s)`);

    if (!customers.length) {
      customersList.innerHTML =
        "<p class='admin-list-item'>Nenhum cliente cadastrado.</p>";
      return;
    }

    // Ordenar por data de criação (mais recente primeiro)
    customers.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    customersList.innerHTML = customers
      .map((c) => {
        const createdDate = c.createdAt
          ? new Date(c.createdAt).toLocaleDateString("pt-BR")
          : "Data desconhecida";

        return `
        <div class="admin-list-item">
          <strong>${c.name || "Sem nome"}</strong><br/>
          📧 ${c.email || "-"}<br/>
          📱 ${c.whatsapp || "-"}<br/>
          <span style="font-size:0.75rem;color:#aaa">
            Cadastrado em: ${createdDate}
          </span>
        </div>
      `;
      })
      .join("");

    populateSelectsForOrders();
  } catch (error) {
    console.error("❌ Erro ao carregar clientes:", error);
    customersList.innerHTML =
      "<p class='admin-list-item' style='color:red;'>Erro ao carregar clientes. Verifique o console.</p>";
  }
}

document
  .getElementById("createCustomerBtn")
  ?.addEventListener("click", async () => {
    const name = customerName.value.trim();
    if (!name) return alert("Informe o nome.");

    await createCustomer({
      name,
      email: customerEmail.value.trim(),
      whatsapp: customerWhatsapp.value.trim(),
      notes: customerNotes.value.trim(),
      role: "customer", // 🔥 garante que aparece na listagem
      createdAt: new Date().toISOString(),
    });

    dashLog("Cliente cadastrado: " + name);

    customerName.value = "";
    customerEmail.value = "";
    customerWhatsapp.value = "";
    customerNotes.value = "";

    loadCustomers();
  });

// Botão de atualizar lista de clientes
document
  .getElementById("refreshCustomersBtn")
  ?.addEventListener("click", () => {
    console.log("🔄 Atualizando lista de clientes...");
    loadCustomers();
  });

/* =====================================================
   CUPONS
===================================================== */
let cachedCoupons = [];
const couponsList = document.getElementById("couponsList");

async function loadCoupons() {
  const coupons = await listCoupons();
  cachedCoupons = coupons;

  if (!coupons.length) {
    couponsList.innerHTML =
      "<p class='admin-list-item'>Nenhum cupom cadastrado.</p>";
    return;
  }

  couponsList.innerHTML = coupons
    .map((c) => {
      const created = c.createdAt?.toDate?.()
        ? c.createdAt.toDate().toLocaleString("pt-BR")
        : "";

      const expires = c.expiresAt?.toDate?.()
        ? c.expiresAt.toDate().toLocaleDateString("pt-BR")
        : "sem validade";

      const typeLabel =
        c.type === "percent" ? c.value + "% OFF" : "R$ " + c.value.toFixed(2);

      return `
        <div class="admin-list-item">
          <strong>${c.code}</strong> — ${typeLabel} — ${
        c.active ? "Ativo" : "Inativo"
      }<br/>
          <span>Validade: ${expires}</span><br/>
          <span style='font-size:0.75rem;color:#888'>Criado em ${created}</span>
        </div>
      `;
    })
    .join("");

  await populateSelectsForOrders();
}

document
  .getElementById("createCouponBtn")
  ?.addEventListener("click", async () => {
    const code = couponCode.value.trim().toUpperCase();
    if (!code) return alert("Informe o código.");

    const value = parseFloat(couponValue.value || "0") || 0;
    if (!value) return alert("Informe o valor.");

    await createCoupon({
      code,
      type: couponType.value,
      value,
      maxUses: parseInt(couponMaxUses.value || "0") || 0,
      expiresAt: couponExpires.value || null,
      active: couponActive.checked,
    });

    dashLog("Cupom criado: " + code);

    couponCode.value = "";
    couponValue.value = "";
    couponMaxUses.value = "";
    couponExpires.value = "";
    couponActive.checked = true;

    loadCoupons();
  });

/* =====================================================
   PEDIDOS
===================================================== */
let cachedOrders = [];
const ordersList = document.getElementById("ordersList");

async function populateSelectsForOrders() {
  if (orderCustomer) {
    orderCustomer.innerHTML = cachedCustomers.length
      ? cachedCustomers
          .map((c) => `<option value="${c.id}">${c.name}</option>`)
          .join("")
      : "<option value=''>Cadastre um cliente primeiro</option>";
  }

  if (orderProduct) {
    orderProduct.innerHTML = cachedProducts.length
      ? cachedProducts
          .map(
            (p) =>
              `<option value="${p.id}" data-price="${p.price}">${p.title}</option>`
          )
          .join("")
      : "<option value=''>Cadastre um produto primeiro</option>";
  }

  if (orderCoupon) {
    orderCoupon.innerHTML =
      "<option value=''>Nenhum</option>" +
      cachedCoupons
        .map((c) => `<option value="${c.code}">${c.code}</option>`)
        .join("");
  }
}

async function loadOrders() {
  const orders = await listOrders();
  cachedOrders = orders;

  if (!orders.length) {
    ordersList.innerHTML =
      "<p class='admin-list-item'>Nenhum pedido cadastrado.</p>";
    return;
  }

  ordersList.innerHTML = orders
    .map((o) => {
      // Suportar tanto pedidos antigos quanto novos do Mercado Pago
      const customerName =
        o.customer?.name || o.customerName || "Cliente não identificado";
      const total = o.total || 0;
      const status = o.status || "pending";
      const orderId = o.orderId || o.id;

      // Formatar data
      let created = "";
      if (o.createdAt) {
        if (typeof o.createdAt === "string") {
          created = new Date(o.createdAt).toLocaleString("pt-BR");
        } else if (o.createdAt?.toDate) {
          created = o.createdAt.toDate().toLocaleString("pt-BR");
        }
      }

      // Status em português
      const statusMap = {
        pending: "Pendente",
        approved: "Aprovado",
        rejected: "Rejeitado",
        cancelled: "Cancelado",
        processing: "Processando",
      };
      const statusText = statusMap[status] || status;

      // Ícone de status
      const statusIcon = {
        pending: "⏳",
        approved: "✅",
        rejected: "❌",
        cancelled: "🚫",
        processing: "⚙️",
      };
      const icon = statusIcon[status] || "📦";

      return `
        <div class="admin-list-item order-click" data-id="${
          o.id
        }" style="cursor:pointer;">
          <div style="display:flex;justify-content:space-between;align-items:start;">
            <div>
              <strong>${icon} ${customerName}</strong>
              <br/>
              <span style="color:#059669;font-weight:600;">R$ ${Number(
                total
              ).toFixed(2)}</span>
              <br/>
              <span style="font-size:0.85rem;color:#6b7280;">
                Status: <strong>${statusText}</strong>
              </span>
              ${
                o.customer?.email
                  ? `<br/><span style="font-size:0.8rem;color:#888;">📧 ${o.customer.email}</span>`
                  : ""
              }
              ${
                o.customer?.whatsapp
                  ? `<br/><span style="font-size:0.8rem;color:#888;">📱 ${o.customer.whatsapp}</span>`
                  : ""
              }
            </div>
            <div style="text-align:right;font-size:0.75rem;color:#888;">
              <div>${orderId}</div>
              <div>${created}</div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  attachOrderClickEvents();
}

document
  .getElementById("createOrderBtn")
  ?.addEventListener("click", async () => {
    if (!orderCustomer.value || !orderProduct.value || !orderTotal.value)
      return alert("Selecione cliente, produto e informe total.");

    const customer = cachedCustomers.find((c) => c.id === orderCustomer.value);
    const product = cachedProducts.find((p) => p.id === orderProduct.value);

    await createOrder({
      customerId: customer.id,
      customerName: customer.name,
      productId: product.id,
      productTitle: product.title,
      couponCode: orderCoupon.value || null,
      total: parseFloat(orderTotal.value),
      status: orderStatus.value,
      paymentMethod: orderPayment.value,
    });

    dashLog("Pedido registrado: " + customer.name);
    orderTotal.value = "";
    loadOrders();
  });

/* =====================================================
   INIT
===================================================== */
loadSettings();
loadCustomers();
loadCoupons();
loadProducts(true);
loadOrders();

/* =====================================================
   MODAL DO PEDIDO
===================================================== */
const modal = document.getElementById("orderModal");
const modalCustomer = document.getElementById("modalCustomer");
const modalWhatsapp = document.getElementById("modalWhatsapp");
const modalCep = document.getElementById("modalCep");
const modalAddress = document.getElementById("modalAddress");
const modalTotal = document.getElementById("modalTotal");
const modalItems = document.getElementById("modalItems");
const modalStatus = document.getElementById("modalStatus");
const modalSaveBtn = document.getElementById("modalSaveBtn");
const modalCloseBtn = document.getElementById("modalCloseBtn");

let currentOrderId = null;

function openOrderModal(order) {
  // Suportar tanto pedidos antigos quanto novos do Mercado Pago
  const customerName =
    order.customer?.name || order.customerName || "Não informado";
  const customerEmail = order.customer?.email || order.customerEmail || "-";
  const customerWhatsapp =
    order.customer?.whatsapp || order.customerWhatsapp || "-";

  // Dados de endereço
  const shipping = order.shipping || order.address || {};
  const cep = shipping.cep || order.cep || "-";

  // Montar endereço completo
  let addressText = "-";
  if (shipping.street) {
    addressText = `${shipping.street}, ${shipping.number || "S/N"}`;
    if (shipping.complement) addressText += ` - ${shipping.complement}`;
    addressText += ` – ${shipping.district || ""}, ${shipping.city || ""} / ${
      shipping.state || ""
    }`;
  }

  // Preencher campos do modal
  document.getElementById("modalCustomer").textContent = customerName;
  document.getElementById("modalWhatsapp").textContent = customerWhatsapp;
  document.getElementById("modalCep").textContent = cep;
  document.getElementById("modalAddress").textContent = addressText;
  document.getElementById("modalTotal").textContent = (
    order.total || 0
  ).toFixed(2);

  // Adicionar email se existir
  const modalCustomerEl = document.getElementById("modalCustomer");
  if (customerEmail !== "-") {
    modalCustomerEl.innerHTML = `${customerName}<br/><small style="color:#888;">📧 ${customerEmail}</small>`;
  }

  // MÉTODO DE PAGAMENTO
  const paymentMethod = order.paymentMethod || "Mercado Pago";
  document.getElementById("modalPayment").textContent = paymentMethod;
  document.getElementById("modalPaymentMethod").value = paymentMethod;

  // ITENS
  const list = document.getElementById("modalItems");
  list.innerHTML = "";

  if (Array.isArray(order.items) && order.items.length > 0) {
    order.items.forEach((item) => {
      const li = document.createElement("li");
      const qty = item.quantity || item.qty || 1;
      const title = item.name || item.title || "Produto";
      const price = item.price || 0;
      const subtotal = qty * price;

      li.innerHTML = `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;">
          <div>
            <strong>${qty}x ${title}</strong>
            <br/>
            <small style="color:#888;">R$ ${price.toFixed(2)} cada</small>
          </div>
          <div style="text-align:right;">
            <strong style="color:#059669;">R$ ${subtotal.toFixed(2)}</strong>
          </div>
        </div>
      `;
      list.appendChild(li);
    });
  } else {
    list.innerHTML = "<li>Nenhum item.</li>";
  }

  // STATUS
  const statusMap = {
    pending: "pending",
    approved: "approved",
    rejected: "rejected",
    cancelled: "cancelled",
    processing: "processing",
    pendente: "pending",
  };
  const currentStatus = statusMap[order.status] || order.status || "pending";
  document.getElementById("modalStatus").value = currentStatus;

  // IDs do pedido
  if (order.orderId || order.preferenceId) {
    const idsDiv = document.createElement("div");
    idsDiv.style.cssText =
      "margin-top:10px;padding:10px;background:#f3f4f6;border-radius:8px;font-size:0.85rem;";
    idsDiv.innerHTML = `
      ${
        order.orderId
          ? `<div><strong>Order ID:</strong> ${order.orderId}</div>`
          : ""
      }
      ${
        order.preferenceId
          ? `<div><strong>Preference ID:</strong> ${order.preferenceId}</div>`
          : ""
      }
    `;
    list.appendChild(idsDiv);
  }

  // MOSTRAR MODAL
  document.getElementById("orderModal").classList.remove("hidden");

  // SALVAR ALTERAÇÕES
  document.getElementById("modalSaveBtn").onclick = async () => {
    try {
      console.log("🔄 Salvando alterações do pedido:", order.id);

      const newStatus = document.getElementById("modalStatus").value;
      const newPayment = document.getElementById("modalPaymentMethod").value;

      console.log("📝 Novo status:", newStatus);
      console.log("💳 Novo método de pagamento:", newPayment);

      const ref = doc(db, "orders", order.id);
      await setDoc(
        ref,
        {
          status: newStatus,
          paymentMethod: newPayment,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      console.log("✅ Pedido atualizado com sucesso!");

      Swal.fire("OK!", "Pedido atualizado com sucesso.", "success");
      document.getElementById("orderModal").classList.add("hidden");
      loadOrders();
    } catch (error) {
      console.error("❌ Erro ao salvar pedido:", error);
      Swal.fire(
        "Erro!",
        "Não foi possível atualizar o pedido: " + error.message,
        "error"
      );
    }
  };

  document.getElementById("modalCloseBtn").onclick = () => {
    document.getElementById("orderModal").classList.add("hidden");
  };
}

/* =====================================================
   EVENTOS
===================================================== */
function attachOrderClickEvents() {
  document.querySelectorAll(".order-click").forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.dataset.id;
      const order = cachedOrders.find((o) => o.id === id);
      if (order) openOrderModal(order);
    });
  });
}

/* =====================================================
   MODAL EDITAR PRODUTO
===================================================== */

import { updateDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const productModal = document.getElementById("productModal");
const editTitle = document.getElementById("editTitle");
const editPrice = document.getElementById("editPrice");
const editFinalPrice = document.getElementById("editFinalPrice");
const saveProductBtn = document.getElementById("saveProductBtn");
const closeProductModal = document.getElementById("closeProductModal");

// tenta achar pelos dois ids possíveis
const editPromo =
  document.getElementById("editPromoPercent") ||
  document.getElementById("editPromo");

const editPriceInput = document.getElementById("editPrice");

let currentProductId = null;

function calcFinal(original, promo) {
  if (!promo || promo <= 0) return Number(original).toFixed(2);
  const n = original - (original * promo) / 100;
  return n.toFixed(2);
}

function openProductModal(prod) {
  currentProductId = prod.id;

  editTitle.value = prod.title;
  const basePrice = Number(prod.originalPrice ?? prod.price);

  editPriceInput.value = basePrice.toFixed(2);
  editPromo.value = prod.promoPercent || 0;

  updateFinalPriceDisplay(); // recalcular quando abrir

  productModal.classList.remove("hidden");
}

closeProductModal.addEventListener("click", () => {
  productModal.classList.add("hidden");
});

if (editPromo) {
  editPromo.addEventListener("input", () => {
    const p = Number(editPriceInput.value);
    const promo = Number(editPromo.value);
    editFinalPrice.textContent = "R$ " + calcFinal(p, promo);
  });
}

document.addEventListener("click", async (e) => {
  if (!e.target.matches("#saveProductBtn")) return;
  if (!currentProductId) return;

  const title = editTitle.value.trim();
  const inputPrice = Number(editPriceInput.value);
  const promoPercent = Number(editPromo?.value || 0);

  const ref = doc(db, "products", currentProductId);

  const prod = cachedProducts.find((p) => p.id === currentProductId);

  // ✔️ Garante que originalPrice SEMPRE exista
  const originalPrice = Number(prod.originalPrice ?? prod.price);

  let newFinalPrice = originalPrice;

  if (promoPercent > 0) {
    newFinalPrice = Number(
      (originalPrice - (originalPrice * promoPercent) / 100).toFixed(2)
    );
  }

  await updateDoc(ref, {
    title,
    originalPrice,
    promoPercent,
    price: newFinalPrice,
    brand: prod.brand || "Genérico",
    model: prod.model || null,
  });

  Swal.fire("Sucesso!", "Produto atualizado!", "success");

  productModal.classList.add("hidden");
  loadProducts(true);
});

/* abrir modal ao clicar no botão editar */
listEl.addEventListener("click", (e) => {
  if (e.target.classList.contains("admin-edit-btn")) {
    const id = e.target.dataset.id;
    const prod = cachedProducts.find((p) => p.id === id);
    if (prod) openProductModal(prod);
  }
});

function updateFinalPriceDisplay() {
  const inputPrice = Number(editPriceInput.value || 0);
  const promoPercent = Number(editPromo.value || 0);

  let finalPrice = inputPrice;
  if (promoPercent > 0) {
    finalPrice = inputPrice - (inputPrice * promoPercent) / 100;
  }

  if (editFinalPrice) {
    editFinalPrice.textContent = "R$ " + finalPrice.toFixed(2);
  }
}
window.toggleDestaque = async (id) => {
  const ref = doc(db, "products", id);

  const prod = cachedProducts.find((p) => p.id === id);
  const newValue = !prod.destaque;

  await updateDoc(ref, { destaque: newValue });
  loadProducts();
};

document.getElementById("confirmImportBtn").onclick = async () => {
  if (!pendingImport) return;

  await createProduct({
    title: document.getElementById("previewTitle").value.trim(),
    price: Number(document.getElementById("previewPrice").value),
    rawPriceYuan: pendingImport.rawPriceYuan,
    images: pendingImport.images,
    category: document.getElementById("previewCategory").value,
    categoryLabel: pendingImport.categoryLabel,
    brand: document.getElementById("previewBrand").value.trim() || "Genérico",
    model: document.getElementById("previewModel").value.trim() || null,
    source: "yupoo",
  });

  pendingImport = null;
  document.getElementById("previewModal").classList.add("hidden");

  Swal.fire("Sucesso!", "Produto importado com sucesso!", "success");
  loadProducts(true);
};

document.getElementById("cancelImportBtn").onclick = () => {
  pendingImport = null;
  document.getElementById("previewModal").classList.add("hidden");
};
