// CARRINHO LOCAL STORAGE
export function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}

export function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

export function addToCart(product) {
  const cart = getCart();
  cart.push(product);
  saveCart(cart);
}

// REMOVER ITEM DO CARRINHO
export function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  renderCart();
}

// RENDERIZAR O CARRINHO
const list = document.getElementById("cartItems");
const totalEl = document.getElementById("cartTotal");
const totalFinalEl = document.getElementById("cartTotalFinal");

export function renderCart() {
  if (!list) return;

  const cart = getCart();

  if (cart.length === 0) {
    list.innerHTML = `
      <p style="text-align:center;color:#666;margin-top:20px;">
        Seu carrinho está vazio.
      </p>`;
    totalEl.textContent = "0,00";
    if (totalFinalEl) totalFinalEl.textContent = "0,00";
    return;
  }

  list.innerHTML = cart
    .map((item, i) => {
      const img = item.images?.[0] || "https://placehold.co/200x200";
      return `
        <div class="cart-item">
          <img src="${img}" alt="${item.title}" />

          <div class="cart-info">
            <h3>${item.title}</h3>
            <p class="price">R$ ${item.price.toFixed(2)}</p>
          </div>

          <button class="cart-remove" data-index="${i}">
            🗑️
          </button>
        </div>
      `;
    })
    .join("");

  // Remover item
  document.querySelectorAll(".cart-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.index);
      removeFromCart(idx);
    });
  });

  // Totais
  const total = cart.reduce((acc, item) => acc + item.price, 0);
  totalEl.textContent = total.toFixed(2).replace(".", ",");
  if (totalFinalEl) totalFinalEl.textContent = total.toFixed(2).replace(".", ",");
}

// Inicializa automaticamente
renderCart();
