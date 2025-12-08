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
  listOrders
} from "./store.js";

import {
  requireAuth,
  handleAuthButtons,
  logout
} from "./auth.js";

// 🔥 FIREBASE
import {
  getFirestore,
  doc,
  setDoc
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
const listEl = document.getElementById("adminProductList");
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
            "https://placehold.co/200x200/000/FFF?text=Hathor";
          const price = Number(p.price || 0).toFixed(2);
          const cat = p.categoryLabel || "Sneakers";

          return `
            <div class="admin-product-item">
              <img src="${img}">
              <div class="admin-product-meta" style="color: #000000">
                <h4>${p.title}</h4>
                <span>R$ ${price}</span>
                <span>${cat}</span>
              </div>
              <div class="admin-product-actions">
                <button class="admin-edit-btn" data-id="${p.id}">Editar</button>
                <button class="admin-delete-btn" data-id="${p.id}">Excluir</button>
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
      margemPercent: parseFloat(cfgMargemPercent.value || "0") || 30
    };

    await saveSettings(data);
    appSettings = data;
    dashLog("Configurações salvas.");
    alert("Configurações salvas!");
  });
}

/* =====================================================
   SETTINGS LOCAIS (localStorage)
===================================================== */

function loadLocalConfig() {
  function getNumber(key, fallback) {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const cleaned = String(raw).replace(",", "."); // aceita 0,77 ou 0.77
    const n = parseFloat(cleaned);
    return isNaN(n) ? fallback : n;
  }

  return {
    cot: getNumber("cfgCot", 0.75),
    frete: getNumber("cfgFrete", 80),
    decl: getNumber("cfgDecl", 60),
    margem: getNumber("cfgMargem", 40)
  };
}


// preencher campos visuais
function renderLocalConfig() {
  const s = loadLocalConfig();
  document.getElementById("localCot").value = s.cot;
  document.getElementById("localFrete").value = s.frete;
  document.getElementById("localDecl").value = s.decl;
  document.getElementById("localMargem").value = s.margem;
}

document.getElementById("saveLocalSettings").addEventListener("click", () => {
  localStorage.setItem("cfgCot", document.getElementById("localCot").value);
  localStorage.setItem("cfgFrete", document.getElementById("localFrete").value);
  localStorage.setItem("cfgDecl", document.getElementById("localDecl").value);
  localStorage.setItem("cfgMargem", document.getElementById("localMargem").value);

  dashLog("Configurações locais atualizadas.");
  alert("Configurações locais salvas!");
});

renderLocalConfig();


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


function calcularPreco(rawYuan, finalBRL, defaultPrice) {
  // se não vier valor em Yuan, usa o preço manual
  if (!rawYuan || rawYuan <= 0) return Number(defaultPrice || 0);

  const cfg = loadLocalConfig();

  const baseBRL = rawYuan * cfg.cot;
  const totalSemMargem = baseBRL + cfg.frete + cfg.decl;
  const totalComMargem = totalSemMargem * (1 + cfg.margem / 100);

  // arredonda pra 2 casas antes da estética
  const final = Math.round(totalComMargem * 100) / 100;

  return arredondaPreco(final);
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

  if (!url) return alert("Cole o link da Yupoo.");

  statusBox.textContent = "";
  logStatus("Importando álbum...");

  const res = await fetch("/api/import-yupoo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url })
  });

  if (!res.ok) {
    logStatus("Erro na API: " + res.status);
    return;
  }

  const data = await res.json();

  logStatus("Título bruto: " + data.rawTitle);
  logStatus("Título final: " + data.title);
  logStatus("Fotos: " + data.images.length);

  const rawPrice = data.rawPriceYuan || null;
  const finalPrice = calcularPreco(rawPrice, data.finalPriceBRL, defaultPrice);

  const { category, label } = detectarCategoria(data.title, data.category);

  await createProduct({
    title: data.title,
    price: finalPrice,
    rawPriceYuan: rawPrice,
    images: data.images,
    category,
    categoryLabel: label,
    source: "yupoo",
    createdAt: new Date()
  });

  logStatus("Produto salvo com sucesso!");
  loadProducts(true);
}

if (importBtn) importBtn.addEventListener("click", importar);

/* =====================================================
   CLIENTES
===================================================== */
let cachedCustomers = [];
const customersList = document.getElementById("customersList");

async function loadCustomers() {
  const customers = await listCustomers();
  cachedCustomers = customers;

  if (!customersList) return;

  if (!customers.length) {
    customersList.innerHTML =
      "<p class='admin-list-item'>Nenhum cliente cadastrado.</p>";
    return;
  }

  customersList.innerHTML = customers
    .map((c) => {
      const created =
        c.createdAt?.toDate?.()
          ? c.createdAt.toDate().toLocaleString("pt-BR")
          : "";

      return `
        <div class="admin-list-item">
          <strong>${c.name}</strong> · ${c.whatsapp || "-"}<br/>
          ${c.email ? c.email + "<br/>" : ""}
          ${c.notes ? "<span>" + c.notes + "</span>" : ""}
          <br/><span style='font-size:0.75rem;color:#999'>${created}</span>
        </div>
      `;
    })
    .join("");

  await populateSelectsForOrders();
}

document.getElementById("createCustomerBtn")?.addEventListener("click", async () => {
  const name = customerName.value.trim();
  if (!name) return alert("Informe o nome.");

  await createCustomer({
    name,
    email: customerEmail.value.trim(),
    whatsapp: customerWhatsapp.value.trim(),
    notes: customerNotes.value.trim()
  });

  dashLog("Cliente cadastrado: " + name);

  customerName.value = "";
  customerEmail.value = "";
  customerWhatsapp.value = "";
  customerNotes.value = "";

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

      const expires =
        c.expiresAt?.toDate?.()
          ? c.expiresAt.toDate().toLocaleDateString("pt-BR")
          : "sem validade";

      const typeLabel =
        c.type === "percent"
          ? c.value + "% OFF"
          : "R$ " + c.value.toFixed(2);

      return `
        <div class="admin-list-item">
          <strong>${c.code}</strong> — ${typeLabel} — ${c.active ? "Ativo" : "Inativo"}<br/>
          <span>Validade: ${expires}</span><br/>
          <span style='font-size:0.75rem;color:#888'>Criado em ${created}</span>
        </div>
      `;
    })
    .join("");

  await populateSelectsForOrders();
}

document.getElementById("createCouponBtn")?.addEventListener("click", async () => {
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
    active: couponActive.checked
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
      cachedCoupons.map((c) => `<option value="${c.code}">${c.code}</option>`).join("");
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
      const created = o.createdAt?.toDate?.()
        ? o.createdAt.toDate().toLocaleString("pt-BR")
        : "";

      return `
        <div class="admin-list-item order-click" data-id="${o.id}">
          <strong>${o.customerName}</strong>
          — R$ ${Number(o.total).toFixed(2)}
          <br/>
          <span>Status: ${o.status}</span>
          <br/>
          <span style="font-size:0.75rem;color:#888">${created}</span>
        </div>
      `;
    })
    .join("");

  attachOrderClickEvents();
}

document.getElementById("createOrderBtn")?.addEventListener("click", async () => {
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
    paymentMethod: orderPayment.value
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
  document.getElementById("modalCustomer").textContent = order.customerName || "-";
  document.getElementById("modalWhatsapp").textContent = order.customerWhatsapp || "-";
  document.getElementById("modalCep").textContent = order.cep || "-";

  if (order.address && typeof order.address === "object") {
    const a = order.address;
    document.getElementById("modalAddress").textContent =
      `${a.street}, ${a.number} – ${a.district}, ${a.city} / ${a.state}`;
  } else {
    document.getElementById("modalAddress").textContent = "-";
  }

  document.getElementById("modalTotal").textContent = (order.total || 0).toFixed(2);

  // MÉTODO DE PAGAMENTO (exibir + preencher select)
  document.getElementById("modalPayment").textContent = order.paymentMethod || "-";
  document.getElementById("modalPaymentMethod").value = order.paymentMethod || "PIX";

  // ITENS
  const list = document.getElementById("modalItems");
  list.innerHTML = "";

  if (Array.isArray(order.items) && order.items.length > 0) {
    order.items.forEach(item => {
      const li = document.createElement("li");
      li.textContent = `${item.qty || 1}x ${item.title} — R$ ${item.price.toFixed(2)}`;
      list.appendChild(li);
    });
  } else {
    list.innerHTML = "<li>Nenhum item.</li>";
  }

  // STATUS
  document.getElementById("modalStatus").value = order.status || "pendente";

  // MOSTRAR MODAL
  document.getElementById("orderModal").classList.remove("hidden");

  // SALVAR ALTERAÇÕES
  document.getElementById("modalSaveBtn").onclick = async () => {
    const newStatus = document.getElementById("modalStatus").value;
    const newPayment = document.getElementById("modalPaymentMethod").value;

    await updateOrder(order.id, {
      status: newStatus,
      paymentMethod: newPayment,
      updatedAt: new Date().toISOString()
    });

    Swal.fire("OK!", "Pedido atualizado com sucesso.", "success");
    document.getElementById("orderModal").classList.add("hidden");
    loadOrders();
  };

  document.getElementById("modalCloseBtn").onclick = () => {
    document.getElementById("orderModal").classList.add("hidden");
  };
}



modalCloseBtn.onclick = () => {
  modal.classList.add("hidden");
};

modalSaveBtn.onclick = async () => {
  if (!currentOrderId) return;

  const ref = doc(db, "orders", currentOrderId);

  await setDoc(ref, { status: modalStatus.value }, { merge: true });

  Swal.fire({
    icon: "success",
    title: "Status atualizado!",
    timer: 1500
  });

  modal.classList.add("hidden");
  loadOrders();
};

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
const editPromo = document.getElementById("editPromo");
const editFinalPrice = document.getElementById("editFinalPrice");
const saveProductBtn = document.getElementById("saveProductBtn");
const closeProductModal = document.getElementById("closeProductModal");

let currentProductId = null;

function calcFinal(price, promo) {
  if (!promo || promo <= 0) return Number(price).toFixed(2);
  const n = price - (price * promo) / 100;
  return n.toFixed(2);
}

function openProductModal(prod) {
  currentProductId = prod.id;

  editTitle.value = prod.title;
  editPrice.value = prod.price;
  editPromo.value = prod.promoPercent || 0;

  editFinalPrice.textContent = "R$ " + calcFinal(prod.price, prod.promoPercent || 0);

  productModal.classList.remove("hidden");
}

closeProductModal.addEventListener("click", () => {
  productModal.classList.add("hidden");
});

editPromo.addEventListener("input", () => {
  const p = Number(editPrice.value);
  const promo = Number(editPromo.value);
  editFinalPrice.textContent = "R$ " + calcFinal(p, promo);
});

saveProductBtn.addEventListener("click", async () => {
  const title = editTitle.value.trim();
  const price = Number(editPrice.value);
  const promo = Number(editPromo.value);

  const ref = doc(db, "products", currentProductId);

  await updateDoc(ref, {
    title,
    price,
    promoPercent: promo > 0 ? promo : null,
    originalPrice: promo > 0 ? price : null
  });

  Swal.fire("OK!", "Produto atualizado com sucesso!", "success");

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
