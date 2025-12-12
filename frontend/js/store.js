/**
 * Store.js - wrapper do Firestore (Firebase)
 * O Firebase é carregado dinamicamente (lazy-load) para melhorar a performance
 */

// Cache para Firebase (carrega uma única vez)
let firebasePromise = null;

async function getFirebase() {
  if (!firebasePromise) {
    firebasePromise = import('./firebase-init.js');
  }
  return firebasePromise;
}

// PRODUTOS
export async function listProducts() {
  const fb = await getFirebase();
  const q = fb.query(fb.productsCol, fb.orderBy("createdAt", "desc"));
  const snap = await fb.getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getProduct(id) {
  const fb = await getFirebase();
  const ref = fb.doc(fb.db, "products", id);
  const snap = await fb.getDoc(ref);
  if (!snap.exists()) throw new Error("Produto não encontrado");
  return { id: snap.id, ...snap.data() };
}

export async function createProduct(data) {
  const fb = await getFirebase();
  const now = new Date();
  return fb.addDoc(fb.productsCol, {
    ...data,
    createdAt: now
  });
}

export async function deleteProduct(productId) {
  const fb = await getFirebase();
  const ref = fb.doc(fb.db, "products", productId);
  return fb.deleteDoc(ref);
}

export async function updateProductPrice(productId, newPrice) {
  const fb = await getFirebase();
  const ref = fb.doc(fb.db, "products", productId);
  return fb.updateDoc(ref, { price: newPrice });
}

export async function updateProductTitle(productId, newTitle) {
  const fb = await getFirebase();
  const ref = fb.doc(fb.db, "products", productId);
  return fb.updateDoc(ref, { title: newTitle });
}

export async function updateProductPromotion(productId, promotion) {
  const fb = await getFirebase();
  const ref = fb.doc(fb.db, "products", productId);
  return fb.updateDoc(ref, { promotion });
}

export async function saveProduct(productId, data) {
  const fb = await getFirebase();
  const ref = fb.doc(fb.db, "products", productId);
  return fb.setDoc(ref, data, { merge: true });
}

// CONFIGURAÇÕES
export async function getSettings() {
  const fb = await getFirebase();
  const ref = fb.doc(fb.db, "settings", "global");
  const snap = await fb.getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function saveSettings(data) {
  const fb = await getFirebase();
  const ref = fb.doc(fb.db, "settings", "global");
  return fb.setDoc(ref, data, { merge: true });
}

// CLIENTES
export async function createCustomer(data) {
  const fb = await getFirebase();
  const now = new Date();
  return fb.addDoc(fb.customersCol, { ...data, createdAt: now });
}

export async function listCustomers() {
  const fb = await getFirebase();
  const q = fb.query(fb.customersCol, fb.orderBy("createdAt", "desc"));
  const snap = await fb.getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getCustomer(customerId) {
  const fb = await getFirebase();
  const ref = fb.doc(fb.db, "customers", customerId);
  const snap = await fb.getDoc(ref);
  if (!snap.exists()) throw new Error("Cliente não encontrado");
  return { id: snap.id, ...snap.data() };
}

export async function updateCustomerBalance(customerId, amount) {
  const fb = await getFirebase();
  const ref = fb.doc(fb.db, "customers", customerId);
  return fb.updateDoc(ref, { balance: fb.increment(amount) });
}

// CUPONS
export async function createCoupon(data) {
  const fb = await getFirebase();
  const now = new Date();
  let expiresAt = null;
  if (data.expiresAt) {
    expiresAt = new Date(data.expiresAt);
  }
  return fb.addDoc(fb.couponsCol, { ...data, expiresAt, createdAt: now });
}

export async function listCoupons() {
  const fb = await getFirebase();
  const q = fb.query(fb.couponsCol, fb.orderBy("createdAt", "desc"));
  const snap = await fb.getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getCoupon(code) {
  const fb = await getFirebase();
  const snap = await fb.getDocs(fb.couponsCol);

  let coupon = null;

  snap.forEach((docSnap) => {
    const data = docSnap.data();

    if (data.code?.toUpperCase() === code.toUpperCase()) {
      coupon = {
        id: docSnap.id,
        ...data,
        uses: data.uses ?? 0,
        expiresAt: data.expiresAt || null
      };
    }
  });

  return coupon;
}

export async function useCoupon(code) {
  const fb = await getFirebase();
  const snap = await fb.getDocs(fb.couponsCol);

  let couponDoc = null;

  snap.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.code?.toUpperCase() === code.toUpperCase()) {
      couponDoc = docSnap;
    }
  });

  if (!couponDoc) return;

  const ref = couponDoc.ref;
  console.log(ref);

  return fb.updateDoc(ref, {
    uses: fb.increment(1)
  });
}

export async function updateCoupon(id, data) {
  const fb = await getFirebase();
  const ref = fb.doc(fb.db, "coupons", id);
  return fb.setDoc(ref, data, { merge: true });
}

export async function deleteCoupon(couponId) {
  const fb = await getFirebase();
  const ref = fb.doc(fb.db, "coupons", couponId);
  return fb.deleteDoc(ref);
}

// PEDIDOS
export async function createOrder(data) {
  const fb = await getFirebase();
  const now = new Date();
  return fb.addDoc(fb.ordersCol, { ...data, createdAt: now });
}

export async function listOrders() {
  const fb = await getFirebase();
  const q = fb.query(fb.ordersCol, fb.orderBy("createdAt", "desc"));
  const snap = await fb.getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
