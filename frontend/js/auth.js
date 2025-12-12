import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import { getUserData } from "./user.js";
import { firebaseConfig } from "./firebase-config.js";

console.log("AUTH MODULE LOADED:", import.meta.url);

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// SALVAR USUÁRIO LOCAL
async function cacheUser(user) {
  if (!user) {
    localStorage.removeItem("user");
    return;
  }

  const data = await getUserData(user.uid);
  localStorage.setItem("user", JSON.stringify(data));
}

// OBSERVADOR DE LOGIN
export function watchAuth(callback) {
  onAuthStateChanged(auth, async (user) => {
    await cacheUser(user);
    callback(user);
  });
}

// PROTEGER PÁGINAS NORMAIS
export function requireAuth() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      return (window.location.href = "./login.html");
    }
    await cacheUser(user);
  });
}

// PROTEGER PÁGINAS DE ADMIN
export function requireAdmin() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return (window.location.href = "./login.html");

    const data = await getUserData(user.uid);

    if (!data || data.role !== "admin") {
      return (window.location.href = "./index.html");
    }

    await cacheUser(user);
  });
}

// BOTÕES
export function handleAuthButtons() {
  const logoutBtn = document.getElementById("logoutBtn");
  const loginLink = document.getElementById("loginLink");

  onAuthStateChanged(auth, (user) => {
    if (logoutBtn) logoutBtn.style.display = user ? "inline-flex" : "none";
    if (loginLink) loginLink.style.display = user ? "none" : "inline-flex";
  });
}

export function logout() {
  localStorage.removeItem("user");
  signOut(auth);
}

export function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function registerWithEmail(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

