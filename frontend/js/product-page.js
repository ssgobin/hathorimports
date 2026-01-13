import { getProduct, listProducts } from "./store.js";
import { handleAuthButtons } from "./auth.js";
import { addToCart } from "./cart-improved.js";
import { notify } from "./notifications.js";

// ===== INICIALIZAÇÃO =====
handleAuthButtons();
document.getElementById("year").textContent = new Date().getFullYear();

// ===== ESTADO =====
let currentProduct = null;
let currentQuantity = 1;
let currentImageIndex = 0;

// ===== ELEMENTOS DO DOM =====
const container = document.getElementById("productDetail");

// ===== LOADING STATE =====
function showLoading() {
  container.innerHTML = `
    <div class="product-loading">
      <div class="loading-spinner"></div>
      <p style="color: rgba(255,255,255,0.6);">Carregando produto...</p>
    </div>
  `;
}

// ===== ERROR STATE =====
function showError(message) {
  container.innerHTML = `
    <div class="product-loading">
      <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
      <h2 style="color: #fff; margin-bottom: 8px;">Erro ao Carregar Produto</h2>
      <p style="color: rgba(255,255,255,0.6); margin-bottom: 20px;">${message}</p>
      <button onclick="location.href='./store.html'" style="padding: 12px 24px; background: #ff007a; border: none; border-radius: 8px; color: #fff; cursor: pointer; font-weight: 600;">
        Voltar para Loja
      </button>
    </div>
  `;
}

// ===== BREADCRUMB =====
function renderBreadcrumb(product) {
  return `
    <nav class="breadcrumb">
      <a href="./index.html">Início</a>
      <span class="breadcrumb-separator">›</span>
      <a href="./store.html">Loja</a>
      <span class="breadcrumb-separator">›</span>
      ${
        product.categoryLabel
          ? `
        <a href="./store.html?category=${product.category}">${product.categoryLabel}</a>
        <span class="breadcrumb-separator">›</span>
      `
          : ""
      }
      <span class="breadcrumb-current">${product.title}</span>
    </nav>
  `;
}

// ===== GALERIA DE IMAGENS =====
function renderGallery(images) {
  const mainImage =
    images[currentImageIndex] ||
    "https://placehold.co/800x800?text=Sem+Imagem";

  return `
    <div class="product-gallery">
      <div class="main-image-container">
        <img
          src="${mainImage}"
          alt="${currentProduct.title}"
          class="product-main-img"
          id="mainImg"
          onclick="openLightbox('${mainImage}')"
        />
        <div class="image-zoom-hint">🔍 Clique para ampliar</div>
      </div>
      
      ${
        images.length > 1
          ? `
        <div class="product-thumbs">
          ${images
            .map(
              (img, index) => `
            <img
              src="${img}"
              alt="Imagem ${index + 1}"
              class="thumb ${index === currentImageIndex ? "active" : ""}"
              onclick="changeImage(${index})"
              loading="lazy"
            />
          `
            )
            .join("")}
        </div>
      `
          : ""
      }
    </div>
  `;
}

// ===== INFORMAÇÕES DO PRODUTO =====
function renderProductInfo(product) {
  const original = Number(product.originalPrice || product.price || 0);
  const final = Number(product.price || 0);
  const hasPromo = original > final;
  const discount = hasPromo
    ? Math.round(((original - final) / original) * 100)
    : 0;
  const installments = Math.floor(final / 12);

  return `
    <div class="product-info">
      
      ${
        hasPromo
          ? `
        <div class="product-badge">
          🔥 ${discount}% OFF
        </div>
      `
          : ""
      }

      <h1 class="product-title">${product.title}</h1>

      <div class="product-meta">
        ${
          product.brand
            ? `
          <div class="meta-item">
            <span>Marca:</span>
            <strong>${product.brand}</strong>
          </div>
        `
            : ""
        }
        ${
          product.model
            ? `
          <div class="meta-item">
            <span>Modelo:</span>
            <strong>${product.model}</strong>
          </div>
        `
            : ""
        }
        ${
          product.categoryLabel
            ? `
          <div class="meta-item">
            <span>Categoria:</span>
            <strong>${product.categoryLabel}</strong>
          </div>
        `
            : ""
        }
      </div>

      <div class="price-section">
        ${
          hasPromo
            ? `
          <div class="price-original">De: R$ ${original.toFixed(2)}</div>
        `
            : ""
        }
        <div class="price-current">R$ ${final.toFixed(2)}</div>
        <div class="price-installments">
          ou 12x de R$ ${installments.toFixed(2)} sem juros
        </div>
        ${
          hasPromo
            ? `
          <div class="price-savings">
            💰 Você economiza R$ ${(original - final).toFixed(2)}
          </div>
        `
            : ""
        }
      </div>

      <div class="quantity-selector">
        <div class="quantity-label">Quantidade:</div>
        <div class="quantity-controls">
          <button class="quantity-btn" onclick="decreaseQuantity()" id="btnDecrease">
            −
          </button>
          <span class="quantity-value" id="quantityValue">${currentQuantity}</span>
          <button class="quantity-btn" onclick="increaseQuantity()">
            +
          </button>
        </div>
      </div>

      <div class="action-buttons">
        <button class="btn-add-cart" onclick="handleAddToCart()">
          🛒 Adicionar ao Carrinho
        </button>
        <a 
          href="${generateWhatsAppLink(product, final)}" 
          target="_blank"
          class="btn-whatsapp"
        >
          💬 Comprar via WhatsApp
        </a>
      </div>

      ${
        product.description
          ? `
        <div class="product-description">
          <div class="description-title">Descrição</div>
          <div class="description-text">${product.description}</div>
        </div>
      `
          : ""
      }

    </div>
  `;
}

// ===== PRODUTOS RELACIONADOS =====
async function renderRelatedProducts(currentProductId, category) {
  try {
    const allProducts = await listProducts();
    const related = allProducts
      .filter((p) => p.id !== currentProductId && p.category === category)
      .slice(0, 4);

    if (related.length === 0) return "";

    return `
      <div class="related-products">
        <h2 class="related-title">Produtos Relacionados</h2>
        <div class="related-grid">
          ${related
            .map((p) => {
              const img =
                (p.images && p.images[0]) ||
                "https://placehold.co/300x300";
              const price = Number(p.price || 0);
              return `
              <a href="./product.html?id=${p.id}" class="product-card">
                <img src="${img}" alt="${
                p.title
              }" loading="lazy" style="width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:12px;margin-bottom:12px;">
                <h3 style="font-size:14px;margin-bottom:8px;color:#fff;">${
                  p.title
                }</h3>
                <p style="font-size:16px;font-weight:700;color:#ff007a;">R$ ${price.toFixed(
                  2
                )}</p>
              </a>
            `;
            })
            .join("")}
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Erro ao carregar produtos relacionados:", error);
    return "";
  }
}

// ===== FUNÇÕES DE CONTROLE =====
window.changeImage = function (index) {
  currentImageIndex = index;
  const mainImg = document.getElementById("mainImg");
  const thumbs = document.querySelectorAll(".thumb");

  if (mainImg && currentProduct.images[index]) {
    mainImg.src = currentProduct.images[index];

    thumbs.forEach((thumb, i) => {
      thumb.classList.toggle("active", i === index);
    });
  }
};

window.openLightbox = function (imageSrc) {
  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.innerHTML = `
    <div class="lightbox-content">
      <button class="lightbox-close" onclick="this.parentElement.parentElement.remove()">×</button>
      <img src="${imageSrc}" alt="Imagem ampliada">
    </div>
  `;

  lightbox.onclick = (e) => {
    if (e.target === lightbox) {
      lightbox.remove();
    }
  };

  document.body.appendChild(lightbox);
};

window.increaseQuantity = function () {
  if (currentQuantity < 10) {
    currentQuantity++;
    updateQuantityDisplay();
  }
};

window.decreaseQuantity = function () {
  if (currentQuantity > 1) {
    currentQuantity--;
    updateQuantityDisplay();
  }
};

function updateQuantityDisplay() {
  const quantityValue = document.getElementById("quantityValue");
  const btnDecrease = document.getElementById("btnDecrease");

  if (quantityValue) {
    quantityValue.textContent = currentQuantity;
  }

  if (btnDecrease) {
    btnDecrease.disabled = currentQuantity <= 1;
  }
}

// ===== ADICIONAR AO CARRINHO =====
window.handleAddToCart = function () {
  if (!currentProduct) return;

  const final = Number(currentProduct.price || 0);
  const mainImage =
    currentProduct.images && currentProduct.images[0]
      ? currentProduct.images[0]
      : "https://placehold.co/300x300?text=Sem+Imagem";

  for (let i = 0; i < currentQuantity; i++) {
    addToCart({
      id: currentProduct.id,
      name: currentProduct.title,
      title: currentProduct.title,
      description: currentProduct.description || "",
      price: final,
      image: mainImage,
      images: currentProduct.images || [mainImage],
      brand: currentProduct.brand || "",
      model: currentProduct.model || "",
      category: currentProduct.category || "",
      categoryLabel: currentProduct.categoryLabel || "",
    });
  }

  notify.success(
    `${currentQuantity}x ${currentProduct.title} adicionado${
      currentQuantity > 1 ? "s" : ""
    } ao carrinho!`,
    "Produto Adicionado"
  );

  // Reset quantidade
  currentQuantity = 1;
  updateQuantityDisplay();
};

// ===== GERAR LINK WHATSAPP =====
function generateWhatsAppLink(product, price) {
  const message = encodeURIComponent(
    `Olá! Tenho interesse no produto:\n\n` +
      `📦 ${product.title}\n` +
      `💰 R$ ${price.toFixed(2)}\n` +
      `🔗 ${window.location.href}\n\n` +
      `Gostaria de mais informações!`
  );

  // Substitua pelo número real do WhatsApp
  const phoneNumber = "5519994004912";

  return `https://wa.me/${phoneNumber}?text=${message}`;
}

// ===== CARREGAR PRODUTO =====
async function loadProduct() {
  try {
    showLoading();

    const params = new URLSearchParams(location.search);
    const id = params.get("id");

    if (!id) {
      showError("ID do produto não fornecido");
      return;
    }

    currentProduct = await getProduct(id);

    if (!currentProduct) {
      showError("Produto não encontrado");
      return;
    }

    // Garantir que images é um array
    if (!currentProduct.images || !Array.isArray(currentProduct.images)) {
      currentProduct.images = [];
    }

    // Renderizar página
    const relatedHTML = await renderRelatedProducts(
      id,
      currentProduct.category
    );

    container.innerHTML = `
      ${renderBreadcrumb(currentProduct)}
      <div class="product-page">
        <div class="product-container">
          ${renderGallery(currentProduct.images)}
          ${renderProductInfo(currentProduct)}
        </div>
        ${relatedHTML}
      </div>
    `;

    // Atualizar título da página
    document.title = `${currentProduct.title} · Hathor Imports`;
  } catch (error) {
    console.error("❌ Erro ao carregar produto:", error);
    showError(error.message || "Erro ao carregar produto");
    notify.error("Não foi possível carregar o produto", "Erro");
  }
}

// ===== INICIALIZAR =====
loadProduct();

// Made with Bob
