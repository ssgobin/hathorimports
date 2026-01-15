import { listProducts, getCachedProducts } from "./store.js";
import { handleAuthButtons } from "./auth.js";

// ===== INICIALIZAÇÃO =====
handleAuthButtons();

const yearSpan = document.getElementById("year");
if (yearSpan) yearSpan.textContent = new Date().getFullYear();

// ===== ELEMENTOS DO DOM =====
const storeList = document.getElementById("storeList");
const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearch");
const filterCategory = document.getElementById("filterCategory");
const filterBrand = document.getElementById("filterBrand");
const filterModel = document.getElementById("filterModel");
const filterPrice = document.getElementById("filterPrice");
const filterPromo = document.getElementById("filterPromo");
const clearFiltersBtn = document.getElementById("clearFilters");
const sortSelect = document.getElementById("sortSelect");
const resultsCount = document.getElementById("resultsCount");
const activeFiltersContainer = document.getElementById("activeFilters");

// ===== ESTADO DA APLICAÇÃO =====
let allProducts = [];
let filteredProducts = [];
let currentFilters = {
  search: "",
  category: "",
  brand: "",
  model: "",
  price: "",
  promoOnly: false,
};

// ===== LOADING SKELETON =====
function showLoadingSkeleton() {
  const skeletonHTML = Array(6)
    .fill(0)
    .map(
      () => `
    <div class="skeleton-card">
      <div class="skeleton-image"></div>
      <div class="skeleton-text"></div>
      <div class="skeleton-text short"></div>
      <div class="skeleton-text shorter"></div>
    </div>
  `
    )
    .join("");

  storeList.innerHTML = `<div class="loading-skeleton">${skeletonHTML}</div>`;
}

// ===== EMPTY STATE =====
function showEmptyState(message = "Nenhum produto encontrado") {
  storeList.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">🔍</div>
      <h3>${message}</h3>
      <p>Tente ajustar os filtros ou fazer uma nova busca</p>
      <button onclick="document.getElementById('clearFilters').click()">
        Limpar Filtros
      </button>
    </div>
  `;
}

// ===== CARREGAR PRODUTOS =====
async function loadProducts() {
  try {
    showLoadingSkeleton();

    // Tenta usar cache primeiro
    const cached = getCachedProducts();
    if (cached && cached.length) {
      allProducts = cached;
    } else {
      allProducts = await listProducts();
    }

    populateFilterOptions();
    applyFiltersAndSort();
  } catch (error) {
    console.error("❌ Erro ao carregar produtos:", error);
    storeList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3>Erro ao carregar produtos</h3>
        <p>${error.message}</p>
        <button onclick="location.reload()">Tentar Novamente</button>
      </div>
    `;
  }
}

// ===== POPULAR OPÇÕES DE FILTROS =====
function populateFilterOptions() {
  const brands = new Set();
  const models = new Set();

  allProducts.forEach((p) => {
    if (p.brand) brands.add(p.brand);
    if (p.model) models.add(p.model);
  });

  // Marcas
  filterBrand.innerHTML =
    '<option value="">Todas</option>' +
    [...brands]
      .sort()
      .map((b) => `<option value="${b}">${b}</option>`)
      .join("");

  // Modelos
  filterModel.innerHTML =
    '<option value="">Todos</option>' +
    [...models]
      .sort()
      .map((m) => `<option value="${m}">${m}</option>`)
      .join("");
}

// ===== APLICAR FILTROS =====
function applyFilters() {
  filteredProducts = allProducts.filter((product) => {
    // Busca por texto
    if (currentFilters.search) {
      const searchLower = currentFilters.search.toLowerCase();
      const matchesSearch =
        product.title?.toLowerCase().includes(searchLower) ||
        product.brand?.toLowerCase().includes(searchLower) ||
        product.model?.toLowerCase().includes(searchLower) ||
        product.categoryLabel?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;
    }

    // Categoria
    if (
      currentFilters.category &&
      product.category !== currentFilters.category
    ) {
      return false;
    }

    // Marca
    if (currentFilters.brand && product.brand !== currentFilters.brand) {
      return false;
    }

    // Modelo
    if (currentFilters.model && product.model !== currentFilters.model) {
      return false;
    }

    // Faixa de preço
    if (currentFilters.price) {
      const price = Number(product.price || 0);
      const [min, max] = currentFilters.price
        .split("-")
        .map((p) => (p === "+" ? Infinity : Number(p)));

      if (price < min || price > max) {
        return false;
      }
    }

    // Apenas promoções
    if (currentFilters.promoOnly) {
      const original = Number(product.originalPrice || product.price || 0);
      const final = Number(product.price || 0);
      if (original <= final) return false;
    }

    return true;
  });

  return filteredProducts;
}

// ===== ORDENAR PRODUTOS =====
function sortProducts(products) {
  const sorted = [...products];
  const sortType = sortSelect.value;

  switch (sortType) {
    case "newest":
      sorted.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      break;

    case "oldest":
      sorted.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateA - dateB;
      });
      break;

    case "price-asc":
      sorted.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
      break;

    case "price-desc":
      sorted.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
      break;

    case "name-asc":
      sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      break;

    case "name-desc":
      sorted.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
      break;
  }

  return sorted;
}

// ===== APLICAR FILTROS E ORDENAÇÃO =====
function applyFiltersAndSort() {
  const filtered = applyFilters();
  const sorted = sortProducts(filtered);

  updateActiveFilters();
  updateResultsCount(sorted.length);
  renderProducts(sorted);
}

// ===== ATUALIZAR FILTROS ATIVOS =====
function updateActiveFilters() {
  const tags = [];

  if (currentFilters.search) {
    tags.push({ label: `Busca: "${currentFilters.search}"`, key: "search" });
  }
  if (currentFilters.category) {
    const categoryLabel =
      filterCategory.options[filterCategory.selectedIndex].text;
    tags.push({ label: categoryLabel, key: "category" });
  }
  if (currentFilters.brand) {
    tags.push({ label: currentFilters.brand, key: "brand" });
  }
  if (currentFilters.model) {
    tags.push({ label: currentFilters.model, key: "model" });
  }
  if (currentFilters.price) {
    const priceLabel = filterPrice.options[filterPrice.selectedIndex].text;
    tags.push({ label: priceLabel, key: "price" });
  }
  if (currentFilters.promoOnly) {
    tags.push({ label: "Em promoção", key: "promoOnly" });
  }

  if (tags.length === 0) {
    activeFiltersContainer.innerHTML = "";
    return;
  }

  activeFiltersContainer.innerHTML = tags
    .map(
      (tag) => `
    <span class="filter-tag">
      ${tag.label}
      <button onclick="window.removeFilter('${tag.key}')" aria-label="Remover filtro">×</button>
    </span>
  `
    )
    .join("");
}

// ===== REMOVER FILTRO INDIVIDUAL =====
window.removeFilter = function (key) {
  switch (key) {
    case "search":
      searchInput.value = "";
      currentFilters.search = "";
      clearSearchBtn.classList.remove("visible");
      break;
    case "category":
      filterCategory.value = "";
      currentFilters.category = "";
      break;
    case "brand":
      filterBrand.value = "";
      currentFilters.brand = "";
      break;
    case "model":
      filterModel.value = "";
      currentFilters.model = "";
      break;
    case "price":
      filterPrice.value = "";
      currentFilters.price = "";
      break;
    case "promoOnly":
      filterPromo.checked = false;
      currentFilters.promoOnly = false;
      break;
  }

  applyFiltersAndSort();
};

// ===== ATUALIZAR CONTADOR =====
function updateResultsCount(count) {
  resultsCount.innerHTML = `<strong>${count}</strong> produto${
    count !== 1 ? "s" : ""
  } encontrado${count !== 1 ? "s" : ""}`;
}

// ===== RENDERIZAR PRODUTOS =====
function renderProducts(products) {
  if (!products.length) {
    showEmptyState();
    return;
  }

  storeList.innerHTML = products
    .map((p) => {
      const img =
        (p.images && p.images[0]) ||
        "https://placehold.co/600x400?text=Hathor+Imports";
      const original = Number(p.originalPrice || p.price || 0);
      const final = Number(p.price || p.finalPrice || original);
      const hasPromo = original > final;
      const desconto = hasPromo
        ? Math.round(((original - final) / original) * 100)
        : 0;

      return `
      <a href="./product.html?id=${p.id}" class="product-link">
        <article class="product-card ${hasPromo ? "promo" : ""} fade-in">
          ${hasPromo ? `<div class="promo-badge">${desconto}% OFF</div>` : ""}
          
          <img 
            src="${img}" 
            class="product-thumb" 
            alt="${p.title || "Produto"}"
            loading="lazy"
            onerror="this.src='https://placehold.co/600x400?text=Sem+Imagem'"
          />
          
          <div class="product-info">
            <h3>${p.title || "Produto sem título"}</h3>
            
            ${
              p.brand
                ? `<p style="font-size:0.85rem;color:rgba(255,255,255,0.6);margin-bottom:8px;">${
                    p.brand
                  }${p.model ? ` · ${p.model}` : ""}</p>`
                : ""
            }

            ${
              hasPromo
                ? `
              <p class="old-price">R$ ${original.toFixed(2)}</p>
              <p class="new-price">R$ ${final.toFixed(2)}</p>
              <p class="save-tag">Economize ${desconto}% 🤑</p>
            `
                : `
              <p class="product-price">R$ ${final.toFixed(2)}</p>
            `
            }
          </div>
        </article>
      </a>
    `;
    })
    .join("");
}

// ===== EVENT LISTENERS =====

// Busca com debounce
let searchTimeout;
searchInput.addEventListener("input", (e) => {
  const value = e.target.value.trim();

  // Mostra/esconde botão de limpar
  if (value) {
    clearSearchBtn.classList.add("visible");
  } else {
    clearSearchBtn.classList.remove("visible");
  }

  // Debounce de 300ms
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentFilters.search = value;
    applyFiltersAndSort();
  }, 300);
});

// Limpar busca
clearSearchBtn.addEventListener("click", () => {
  searchInput.value = "";
  currentFilters.search = "";
  clearSearchBtn.classList.remove("visible");
  applyFiltersAndSort();
});

// Filtros
filterCategory.addEventListener("change", (e) => {
  currentFilters.category = e.target.value;
  applyFiltersAndSort();
});

filterBrand.addEventListener("change", (e) => {
  currentFilters.brand = e.target.value;

  // Atualiza modelos disponíveis baseado na marca
  const models = new Set();
  allProducts.forEach((p) => {
    if (
      (!currentFilters.brand || p.brand === currentFilters.brand) &&
      p.model
    ) {
      models.add(p.model);
    }
  });

  filterModel.innerHTML =
    '<option value="">Todos</option>' +
    [...models]
      .sort()
      .map((m) => `<option value="${m}">${m}</option>`)
      .join("");

  currentFilters.model = "";
  applyFiltersAndSort();
});

filterModel.addEventListener("change", (e) => {
  currentFilters.model = e.target.value;
  applyFiltersAndSort();
});

filterPrice.addEventListener("change", (e) => {
  currentFilters.price = e.target.value;
  applyFiltersAndSort();
});

filterPromo.addEventListener("change", (e) => {
  currentFilters.promoOnly = e.target.checked;
  applyFiltersAndSort();
});

// Ordenação
sortSelect.addEventListener("change", () => {
  applyFiltersAndSort();
});

// Limpar todos os filtros
clearFiltersBtn.addEventListener("click", () => {
  searchInput.value = "";
  filterCategory.value = "";
  filterBrand.value = "";
  filterModel.value = "";
  filterPrice.value = "";
  filterPromo.checked = false;
  clearSearchBtn.classList.remove("visible");

  currentFilters = {
    search: "",
    category: "",
    brand: "",
    model: "",
    price: "",
    promoOnly: false,
  };

  populateFilterOptions();
  applyFiltersAndSort();
});

// ===== INICIALIZAÇÃO =====
loadProducts();
