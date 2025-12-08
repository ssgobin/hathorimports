import { loginWithEmail } from "./auth.js";

const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");
const btn = document.getElementById("loginBtn");

btn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const pass = passInput.value.trim();

  if (!email) return alert("Digite seu e-mail.");
  if (!pass) return alert("Digite sua senha.");

  try {
    await loginWithEmail(email, pass);
    window.location.href = "./index.html";
  } catch (err) {
    alert("Erro ao entrar: " + err.message);
  }
});
