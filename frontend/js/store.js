import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  query,
  where,
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

  const payload = {
    title: data.title,
    price: data.price,
    images: data.images || [],
    category: data.category,
    categoryLabel: data.categoryLabel,
    source: data.source || "manual",

    brand: data.brand || "Genérico",
    model: data.model || null,
    rawPriceYuan: data.rawPriceYuan || null,

    createdAt: now
  };

  console.log("🧾 PRODUTO SALVO:", payload);

  return addDoc(productsCol, payload);
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

// PRODUTOS EM DESTAQUE
export async function listFeaturedProducts() {
  const q = query(
    productsCol,
    where("destaque", "==", true),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// PRODUTOS POR CATEGORIA
export async function listProductsByCategory(category) {
  const q = query(
    productsCol,
    where("category", "==", category),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

const CACHE_KEY = "products_cache";
const CACHE_TIME = 1000 * 60 * 5; // 5 minutos

export async function listProductsCached() {
  const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");

  if (cached && (Date.now() - cached.time < CACHE_TIME)) {
    return cached.data;
  }

  const q = query(productsCol, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  localStorage.setItem(CACHE_KEY, JSON.stringify({
    time: Date.now(),
    data
  }));

  return data;
}

const PRODUCTS_CACHE_KEY = "products_cache_v1";
const PRODUCTS_CACHE_TTL = 1000 * 60 * 5; // 5 minutos

export async function prefetchProducts() {
  try {
    const cached = JSON.parse(localStorage.getItem(PRODUCTS_CACHE_KEY) || "null");

    if (cached && Date.now() - cached.time < PRODUCTS_CACHE_TTL) {
      return; // cache ainda válido
    }

    const q = query(productsCol, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    localStorage.setItem(
      PRODUCTS_CACHE_KEY,
      JSON.stringify({
        time: Date.now(),
        data
      })
    );

  } catch (err) {
    console.warn("Prefetch falhou:", err.message);
  }
}

export function getCachedProducts() {
  const cached = JSON.parse(localStorage.getItem(PRODUCTS_CACHE_KEY) || "null");
  if (!cached) return null;
  return cached.data;
}

const ENABLE_PRELOAD_LOG = true; // 🔥 mude para false em produção

export function preloadProductImages(products, limit = 12) {
  if (!Array.isArray(products)) return;

  if (ENABLE_PRELOAD_LOG) {
    console.group("🖼️ [PRELOAD] Iniciando preload de imagens");
    console.log("Produtos recebidos:", products.length);
    console.log("Limite aplicado:", limit);
  }

  products
    .slice(0, limit)
    .forEach((p, index) => {
      const imgs = p.images || [];

      if (ENABLE_PRELOAD_LOG) {
        console.group(`📦 Produto ${index + 1}: ${p.title || p.id}`);
      }

      imgs.slice(0, 2).forEach((src, imgIndex) => {
        if (!src) return;

        if (ENABLE_PRELOAD_LOG) {
          console.log(`➡️ Preload imagem ${imgIndex + 1}:`, src);
        }

        const img = new Image();

        img.onload = () => {
          if (ENABLE_PRELOAD_LOG) {
            console.log("✅ Imagem carregada:", src);
          }
        };

        img.onerror = () => {
          if (ENABLE_PRELOAD_LOG) {
            console.warn("❌ Erro ao carregar imagem:", src);
          }
        };

        img.src = src;
      });

      if (ENABLE_PRELOAD_LOG) {
        console.groupEnd();
      }
    });

  if (ENABLE_PRELOAD_LOG) {
    console.groupEnd();
    console.log("🟢 [PRELOAD] Finalizado");
  }
}
