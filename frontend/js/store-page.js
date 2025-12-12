import { listProducts } from "./store.js";
import { handleAuthButtons } from "./auth.js";
import { logout } from "./auth.js";

import { showSpinner, hideSpinner } from "./spinner.js";
import { showToast } from "./toast.js";
import { observeLazyImages } from "./lazy-load.js";

const yearSpan = document.getElementById("year");
if (yearSpan) yearSpan.textContent = new Date().getFullYear();

const listEl = document.getElementById("productList");
const countEl = document.getElementById("productCount");

handleAuthButtons();

// Paginação
const ITEMS_PER_PAGE = 12;
let allProducts = [];
let currentPage = 1;
let filteredProducts = [];

function renderPagination() {
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageProducts = filteredProducts.slice(start, end);

  if (!listEl) return;

  if (!pageProducts.length) {
    listEl.innerHTML = "<p style='color:#6b7280;font-size:0.9rem;'>Nenhum produto encontrado.</p>";
    if (countEl) countEl.textContent = '0 itens';
    return;
  }

  listEl.innerHTML = pageProducts.map((p) => {
    const img =
      (p.images && p.images[0]) ||
      "https://placehold.co/600x400/000000/FFFFFF?text=Hathor+Imports";

    const hasPromo = p.promo && p.promo > 0;
    const original = Number(p.price || 0);
    const final = hasPromo
      ? (original - (original * p.promo) / 100)
      : original;

    return `
    <article class="product-card">

      ${hasPromo ? `
        <span class="product-discount-badge">-${p.promo}%</span>
      ` : ""}

      <div class="product-thumb">
        <img data-src="${img}" src="https://placehold.co/600x400/000000/FFFFFF?text=Hathor+Imports" alt="${p.title}" loading="lazy">
      </div>

      <div class="product-info">
        <h3 class="product-title">${p.title}</h3>

        ${hasPromo
          ? `
              <div>
                <span class="product-old-price">R$ ${original.toFixed(2)}</span><br>
                <span class="product-new-price">R$ ${final.toFixed(2)}</span>
              </div>
            `
          : `<p class="product-price">R$ ${original.toFixed(2)}</p>`
        }

        <a class="product-link" href="./product.html?id=${p.id}">Abrir produto</a>
      </div>

    </article>
  `;
  }).join("");

  // Atualizar contador
  if (countEl) {
    countEl.textContent = filteredProducts.length + (filteredProducts.length === 1 ? " item" : " itens");
  }

  // Renderizar controles de paginação
  renderPaginationControls(totalPages);

  // Lazy load das imagens
  observeLazyImages();
}

function renderPaginationControls(totalPages) {
  let paginationEl = document.getElementById('paginationControls');
  
  if (!paginationEl) {
    // Criar elemento de paginação se não existir
    paginationEl = document.createElement('div');
    paginationEl.id = 'paginationControls';
    paginationEl.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:12px;margin-top:32px;';
    listEl.parentElement.appendChild(paginationEl);
  }

  if (totalPages <= 1) {
    paginationEl.innerHTML = '';
    return;
  }

  let html = '';

  // Botão Anterior
  if (currentPage > 1) {
    html += `<button class="pagination-btn" onclick="window.goToPreviousPage()">← Anterior</button>`;
  }

  // Indicador de página
  html += `<span style="color:#aaa;font-size:0.9rem;">Página <strong>${currentPage}</strong> de <strong>${totalPages}</strong></span>`;

  // Botão Próxima
  if (currentPage < totalPages) {
    html += `<button class="pagination-btn" onclick="window.goToNextPage()">Próxima →</button>`;
  }

  paginationEl.innerHTML = html;
}

// Funções globais para navegação
window.goToPreviousPage = function() {
  if (currentPage > 1) {
    currentPage--;
    renderPagination();
    window.scrollTo({ top: listEl.offsetTop - 100, behavior: 'smooth' });
  }
};

window.goToNextPage = function() {
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  if (currentPage < totalPages) {
    currentPage++;
    renderPagination();
    window.scrollTo({ top: listEl.offsetTop - 100, behavior: 'smooth' });
  }
};

async function load() {
  try {
    showSpinner();
    allProducts = await listProducts();
    filteredProducts = allProducts;
    currentPage = 1;
    renderPagination();
    hideSpinner();
  } catch (err) {
    console.error(err);
    if (listEl) listEl.innerHTML = "<p style='color:#ef4444;'>Erro ao carregar produtos.</p>";
    hideSpinner();
    showToast('Erro ao carregar produtos', 'error');
  }
}

document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await logout();
  window.location.href = "./login.html"; // redireciona após sair
});

load();
