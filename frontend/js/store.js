import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
  setDoc,
  deleteDoc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

const productsCol = collection(db, "products");
const customersCol = collection(db, "customers");
const ordersCol = collection(db, "orders");
const couponsCol = collection(db, "coupons");
const settingsDoc = doc(db, "settings", "global");

// PRODUCTS
export async function listProducts() {
  const q = query(productsCol, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getProduct(id) {
  const ref = doc(db, "products", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Produto não encontrado");
  return { id: snap.id, ...snap.data() };
}

export async function createProduct(data) {
  const now = new Date();
  return addDoc(productsCol, {
    ...data,
    createdAt: now
  });
}

export async function deleteProduct(productId) {
  const ref = doc(db, "products", productId);
  await deleteDoc(ref);
}

// SETTINGS
export async function getSettings() {
  const ref = doc(db, "settings", "global"); // 🔥 nome fixo
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function saveSettings(data) {
  const ref = doc(db, "settings", "global"); // 🔥 nome fixo
  await setDoc(ref, data, { merge: true });
}

// CUSTOMERS
export async function createCustomer(data) {
  const now = new Date();
  return addDoc(customersCol, { ...data, createdAt: now });
}

export async function listCustomers() {
  const q = query(customersCol, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// COUPONS
export async function createCoupon(data) {
  const now = new Date();
  let expiresAt = null;
  if (data.expiresAt) {
    expiresAt = new Date(data.expiresAt);
  }
  return addDoc(couponsCol, { ...data, expiresAt, createdAt: now });
}

export async function listCoupons() {
  const q = query(couponsCol, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ORDERS
export async function createOrder(data) {
  const now = new Date();
  return addDoc(ordersCol, { ...data, createdAt: now });
}

export async function listOrders() {
  const q = query(ordersCol, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// BUSCAR CUPOM PELO CÓDIGO
export async function getCoupon(code) {
  const snap = await getDocs(couponsCol);

  let coupon = null;

  snap.forEach((docSnap) => {
    const data = docSnap.data();

    if (data.code?.toUpperCase() === code.toUpperCase()) {
      coupon = {
        id: docSnap.id,
        ...data,
        uses: data.uses ?? 0,       // ← garante que venha corretamente
        expiresAt: data.expiresAt || null
      };
    }
  });

  return coupon;
}

// MARCAR CUPOM COMO USADO
export async function useCoupon(code) {
  const snap = await getDocs(couponsCol);

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

  await updateDoc(ref, {
    uses: increment(1)   // ← mais seguro, mais rápido e não sobrescreve nada
  });
}

// ATUALIZAR CUPOM MANUAL
export async function updateCoupon(id, data) {
  const ref = doc(db, "coupons", id);
  await setDoc(ref, data, { merge: true });
}
