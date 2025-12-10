import { listProducts } from "./store.js";
import { handleAuthButtons } from "./auth.js";

import { logout } from "./auth.js";


const yearSpan = document.getElementById("year");
if (yearSpan) yearSpan.textContent = new Date().getFullYear();

const listEl = document.getElementById("productList");
const countEl = document.getElementById("productCount");


handleAuthButtons();

async function load() {
  const products = await listProducts();
  const destaque = products.filter((p) => p.destaque);

  const track = document.getElementById("highlightTrack");
  if (!destaque.length) {
    track.innerHTML = "<p>Nenhum produto em destaque.</p>";
    return;
  }

  track.innerHTML = destaque.map((p) => {
    const original = Number(p.originalPrice || p.price || 0);
    const final = Number(p.price || p.finalPrice || original);
    const hasPromo = original > final;
    const desconto = hasPromo ? Math.round(((original - final) / original) * 100) : 0;

    return `
<article class="product-card ${hasPromo ? "promo" : ""}">
  ${hasPromo ? `<div class="promo-badge">Promoção</div>` : ""}
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
</article>
`;


  }).join("");

  const btnL = document.querySelector(".nav-btn.left");
  const btnR = document.querySelector(".nav-btn.right");

  btnL.onclick = () => track.scrollLeft -= 300;
  btnR.onclick = () => track.scrollLeft += 300;
}




document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await logout();
  window.location.href = "./login.html"; // redireciona após sair
});


load();
