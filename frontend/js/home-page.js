import { handleAuthButtons } from "./auth.js";
import { logout } from "./auth.js";
import { prefetchProducts, preloadProductImages } from "./store.js";



handleAuthButtons();

import { listFeaturedProducts } from "./store.js";

const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();


async function loadHighlight() {
  const destaque = await listFeaturedProducts();


  const track = document.getElementById("highlightTrack");
  const btnL = document.querySelector(".nav-btn.left");
  const btnR = document.querySelector(".nav-btn.right");

  if (!destaque.length) {
    track.innerHTML = "<p>Nenhum produto destacado.</p>";
    btnL.style.display = "none";
    btnR.style.display = "none";
    return;
  }

  track.innerHTML = destaque
    .map((p) => {
      const original = Number(p.originalPrice || p.price || 0);
      const final = Number(p.price || p.finalPrice || original);
      const hasPromo = original > final;
      const desconto = hasPromo ? Math.round(((original - final) / original) * 100) : 0;
      const img = (p.images && p.images[0]) ||
        "https://placehold.co/600x400?text=Hathor+Imports";


      return `
<div class="product-card ${hasPromo ? "promo" : ""}" style="min-width:220px;">
  ${hasPromo ? `<div class="promo-badge">${desconto}% OFF</div>` : ""}
  <img src="${img}" class="product-thumb" />

  <div class="product-info">
    <h3>${p.title}</h3>

    ${hasPromo ? `
      <p class="old-price">R$ ${original.toFixed(2)}</p>
      <p class="new-price">R$ ${final.toFixed(2)}</p>
      <p class="save-tag">Economize ${desconto}% 🤑</p>
    ` : `
      <p class="product-price">R$ ${final.toFixed(2)}</p>
    `}
  </div>

  <a href="./product.html?id=${p.id}" class="product-link">Ver detalhes</a>
</div>
`;

    }).join("");

  btnL.onclick = () => track.scrollBy({ left: -260, behavior: "smooth" });
  btnR.onclick = () => track.scrollBy({ left: 260, behavior: "smooth" });

}

document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await logout();
  window.location.href = "./login.html";
});

loadHighlight();

setTimeout(async () => {
  await prefetchProducts();

  const cached = JSON.parse(
    localStorage.getItem("products_cache_v1") || "null"
  );

  if (cached?.data?.length) {
    preloadProductImages(cached.data, 12);
  }
}, 900);


