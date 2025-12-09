import { listProducts } from "./store.js";
import { handleAuthButtons } from "./auth.js";

import { logout } from "./auth.js";


const yearSpan = document.getElementById("year");
if (yearSpan) yearSpan.textContent = new Date().getFullYear();

const listEl = document.getElementById("productList");
const countEl = document.getElementById("productCount");

handleAuthButtons();

async function load() {
  try {
    const products = await listProducts();
    if (countEl) {
      countEl.textContent = products.length + (products.length === 1 ? " item" : " itens");
    }
    if (!listEl) return;
    if (!products.length) {
      listEl.innerHTML = "<p style='color:#6b7280;font-size:0.9rem;'>Nenhum produto cadastrado ainda.</p>";
      return;
    }
    listEl.innerHTML = products.map((p) => {
      const img =
        (p.images && p.images[0]) ||
        "https://placehold.co/600x400/000000/FFFFFF?text=Hathor+Imports";

      const hasPromo = p.promoPercent && p.promoPercent > 0;
      const original = Number(p.price || 0);
      const final = hasPromo
        ? (original - (original * p.promoPercent) / 100)
        : original;

      return `
    <article class="product-card">

      ${hasPromo ? `
        <span class="product-discount-badge">-${p.promoPercent}%</span>
      ` : ""}

      <div class="product-thumb">
        <img src="${img}" alt="${p.title}">
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

  } catch (err) {
    console.error(err);
    if (listEl) listEl.innerHTML = "<p style='color:#ef4444;'>Erro ao carregar produtos.</p>";
  }
}

document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await logout();
  window.location.href = "./login.html"; // redireciona após sair
});


load();
