import { notify } from "./notifications.js";
import { getCoupon } from "./store.js";

// ===== GERENCIAMENTO DO CARRINHO =====

/**
 * Obtém o carrinho do localStorage
 * Retorna array de itens agrupados por ID com quantidade
 */
export function getCart() {
  const rawCart = JSON.parse(localStorage.getItem("cart") || "[]");
  
  // Agrupar itens por ID
  const grouped = {};
  rawCart.forEach(item => {
    if (grouped[item.id]) {
      grouped[item.id].quantity++;
    } else {
      grouped[item.id] = { ...item, quantity: 1 };
    }
  });
  
  return Object.values(grouped);
}

/**
 * Salva o carrinho no localStorage
 */
export function saveCart(cart) {
  // Desagrupar para salvar
  const ungrouped = [];
  cart.forEach(item => {
    for (let i = 0; i < item.quantity; i++) {
      const { quantity, ...itemWithoutQty } = item;
      ungrouped.push(itemWithoutQty);
    }
  });
  
  localStorage.setItem("cart", JSON.stringify(ungrouped));
  updateCartBadge();
}

/**
 * Adiciona produto ao carrinho
 */
export function addToCart(product) {
  const rawCart = JSON.parse(localStorage.getItem("cart") || "[]");
  rawCart.push(product);
  localStorage.setItem("cart", JSON.stringify(rawCart));
  updateCartBadge();
}

/**
 * Remove produto do carrinho
 */
export function removeFromCart(productId) {
  const cart = getCart();
  const updated = cart.filter(item => item.id !== productId);
  saveCart(updated);
}

/**
 * Atualiza quantidade de um produto
 */
export function updateQuantity(productId, newQuantity) {
  if (newQuantity < 1) {
    removeFromCart(productId);
    return;
  }
  
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (item) {
    item.quantity = newQuantity;
    saveCart(cart);
  }
}

/**
 * Limpa o carrinho
 */
export function clearCart() {
  localStorage.removeItem("cart");
  localStorage.removeItem("appliedCoupon");
  updateCartBadge();
}

/**
 * Obtém quantidade total de itens
 */
export function getCartCount() {
  const rawCart = JSON.parse(localStorage.getItem("cart") || "[]");
  return rawCart.length;
}

/**
 * Atualiza badge do carrinho no header
 */
export function updateCartBadge() {
  const count = getCartCount();
  const badges = document.querySelectorAll('.cart-badge');
  
  badges.forEach(badge => {
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  });
}

// ===== CUPONS DE DESCONTO =====

let appliedCoupon = null;

/**
 * Aplica cupom de desconto
 */
export async function applyCoupon(code) {
  try {
    const coupon = await getCoupon(code);
    
    if (!coupon) {
      notify.error("Cupom não encontrado", "Cupom Inválido");
      return null;
    }
    
    if (!coupon.active) {
      notify.error("Este cupom não está mais ativo", "Cupom Inválido");
      return null;
    }
    
    // Verificar validade
    if (coupon.expiresAt) {
      const expiryDate = coupon.expiresAt.toDate ? coupon.expiresAt.toDate() : new Date(coupon.expiresAt);
      if (expiryDate < new Date()) {
        notify.error("Este cupom expirou", "Cupom Expirado");
        return null;
      }
    }
    
    // Verificar usos
    if (coupon.maxUses && coupon.uses >= coupon.maxUses) {
      notify.error("Este cupom atingiu o limite de usos", "Cupom Esgotado");
      return null;
    }
    
    appliedCoupon = coupon;
    localStorage.setItem("appliedCoupon", JSON.stringify(coupon));
    notify.success(`Cupom ${code} aplicado com sucesso!`, "Cupom Aplicado");
    
    return coupon;
  } catch (error) {
    console.error("Erro ao aplicar cupom:", error);
    notify.error("Erro ao validar cupom", "Erro");
    return null;
  }
}

/**
 * Remove cupom aplicado
 */
export function removeCoupon() {
  appliedCoupon = null;
  localStorage.removeItem("appliedCoupon");
  notify.info("Cupom removido", "Cupom");
}

/**
 * Obtém cupom aplicado
 */
export function getAppliedCoupon() {
  if (appliedCoupon) return appliedCoupon;
  
  const stored = localStorage.getItem("appliedCoupon");
  if (stored) {
    appliedCoupon = JSON.parse(stored);
    return appliedCoupon;
  }
  
  return null;
}

// ===== CÁLCULOS =====

/**
 * Calcula subtotal do carrinho
 */
export function calculateSubtotal() {
  const cart = getCart();
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

/**
 * Calcula desconto do cupom
 */
export function calculateDiscount(subtotal) {
  const coupon = getAppliedCoupon();
  if (!coupon) return 0;
  
  if (coupon.type === 'percent') {
    return subtotal * (coupon.value / 100);
  } else {
    return coupon.value;
  }
}

/**
 * Calcula frete (simulado)
 */
export function calculateShipping(subtotal) {
  // Frete grátis acima de R$ 500
  if (subtotal >= 500) return 0;
  
  // Frete fixo
  return 30;
}

/**
 * Calcula total final
 */
export function calculateTotal() {
  const subtotal = calculateSubtotal();
  const discount = calculateDiscount(subtotal);
  const shipping = calculateShipping(subtotal);
  
  return Math.max(0, subtotal - discount + shipping);
}

/**
 * Obtém resumo do carrinho
 */
export function getCartSummary() {
  const subtotal = calculateSubtotal();
  const discount = calculateDiscount(subtotal);
  const shipping = calculateShipping(subtotal);
  const total = calculateTotal();
  
  return {
    subtotal,
    discount,
    shipping,
    total,
    itemCount: getCartCount(),
    coupon: getAppliedCoupon()
  };
}

// ===== INICIALIZAÇÃO =====
updateCartBadge();

// Exportar para uso global
window.cartUtils = {
  getCart,
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  applyCoupon,
  removeCoupon,
  getCartSummary
};
