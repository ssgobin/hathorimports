import { handleAuthButtons } from "./auth.js";
import { logout } from "./auth.js";
import { prefetchProducts, preloadProductImages } from "./store.js";
import { notify } from "./notifications.js";

handleAuthButtons();

import { listFeaturedProducts } from "./store.js";

const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

async function loadHighlight() {
  const track = document.getElementById("highlightTrack");
  const btnL = document.querySelector(".nav-btn.left");
  const btnR = document.querySelector(".nav-btn.right");

  if (!track) {
    console.error("Elemento highlightTrack não encontrado");
    return;
  }

  try {
    // Mostra loading
    track.innerHTML =
      "<p style='text-align:center;color:#888;'>Carregando produtos...</p>";

    const destaque = await listFeaturedProducts();

    if (!destaque || destaque.length === 0) {
      track.innerHTML =
        "<p style='text-align:center;color:#888;'>Nenhum produto em destaque no momento.</p>";
      if (btnL) btnL.style.display = "none";
      if (btnR) btnR.style.display = "none";
      return;
    }

    track.innerHTML = destaque
      .map((p) => {
        const original = Number(p.originalPrice || p.price || 0);
        const final = Number(p.price || p.finalPrice || original);
        const hasPromo = original > final;
        const desconto = hasPromo
          ? Math.round(((original - final) / original) * 100)
          : 0;
        const img =
          (p.images && p.images[0]) ||
          "https://placehold.co/600x400?text=Hathor+Imports";

        return `
      <a href="./product.html?id=${p.id}" class="product-link">
        <div class="product-card ${
          hasPromo ? "promo" : ""
        }" style="min-width:220px;">
          ${hasPromo ? `<div class="promo-badge">${desconto}% OFF</div>` : ""}
          <img src="${img}"
               class="product-thumb"
               alt="${p.title || "Produto"}"
               loading="lazy"
               onerror="this.src='https://placehold.co/600x400?text=Sem+Imagem'" />

          <div class="product-info">
            <h3>${p.title || "Produto sem título"}</h3>

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
        </div>
      </a>
    `;
      })
      .join("");

    // Configura botões de navegação
    if (btnL && btnR) {
      btnL.style.display = "block";
      btnR.style.display = "block";
      btnL.onclick = () => track.scrollBy({ left: -260, behavior: "smooth" });
      btnR.onclick = () => track.scrollBy({ left: 260, behavior: "smooth" });
    }
  } catch (error) {
    console.error("Erro ao carregar produtos em destaque:", error);
    track.innerHTML = `
      <p style='text-align:center;color:#ff6b6b;'>
        Erro ao carregar produtos.
        <button onclick="location.reload()" style="margin-left:10px;padding:5px 10px;cursor:pointer;">
          Tentar novamente
        </button>
      </p>
    `;
    if (btnL) btnL.style.display = "none";
    if (btnR) btnR.style.display = "none";
  }
}

document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await logout();
  window.location.href = "./login.html";
});

loadHighlight();
