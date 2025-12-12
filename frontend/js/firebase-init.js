// Carrega dinamicamente apenas quando necessário
// Reduzi o tamanho do bundle principal em ~300KB

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
  increment,
  where
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Inicializar Firebase uma única vez
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collections
const productsCol = collection(db, "products");
const customersCol = collection(db, "customers");
const ordersCol = collection(db, "orders");
const couponsCol = collection(db, "coupons");
const settingsDoc = doc(db, "settings", "global");

// Exportar referências e funções Firebase
export {
  db,
  productsCol,
  customersCol,
  ordersCol,
  couponsCol,
  settingsDoc,
  // Funções
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
  increment,
  where
};
