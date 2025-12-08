import { getProduct } from "./store.js";
import { handleAuthButtons } from "./auth.js";
import { addToCart } from "./cart.js";

const container = document.getElementById("productDetail");

document.getElementById("year").textContent = new Date().getFullYear();
handleAuthButtons();

function waLink(title, price) {
  const msg = encodeURIComponent(
    `Olá! Tenho interesse no produto: ${title} (R$ ${price.toFixed(2)}).`
  );
  return `https://wa.me/5519994004912?text=${msg}`;
}

async function loadProduct() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  if (!id) {
    container.innerHTML = "<p>ID inválido.</p>";
    return;
  }

  const p = await getProduct(id);
  const price = Number(p.price || 0);
  const imgs = p.images || [];
  const main = imgs[0] || "https://placehold.co/800x600?text=Hathor+Imports";

  container.classList.remove("loading");

  container.innerHTML = `
    <div class="product-container">

      <div class="gallery">
        <img src="${main}" class="product-main-img" id="mainImg"/>

        <div class="thumbs">
          ${imgs
            .slice(0, 6)
            .map(
              (src) =>
                `<img src="${src}" class="thumb" onclick="document.getElementById('mainImg').src='${src}'"/>`
            )
            .join("")}
        </div>
      </div>

      <div class="summary">
        <h1 class="product-title">${p.title}</h1>
        <p class="product-price">R$ ${price.toFixed(2)}</p>

        <button id="btnAddCart" class="btn-big btn-cart">Adicionar ao Carrinho 🛒</button>

      </div>

    </div>
  `;

  document.getElementById("btnAddCart").onclick = () => {
    addToCart({ id, title: p.title, price, images: p.images });
    alert("Adicionado ao carrinho!");
  };
}

loadProduct();
