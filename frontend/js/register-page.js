import { registerWithEmail } from "./auth.js";
import { setUserData } from "./user.js";

const nameInput = document.getElementById("name");
const whatsappInput = document.getElementById("whatsapp");
const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");
const btn = document.getElementById("registerBtn");

btn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const pass = passInput.value.trim();

  if (!email) return alert("Digite seu e-mail.");
  if (!pass) return alert("Digite sua senha.");
  if (pass.length < 6)
    return alert("A senha deve ter pelo menos 6 caracteres.");

  try {
    const cred = await registerWithEmail(email, pass);

    await setUserData(cred.user.uid, {
      uid: cred.user.uid,
      email,
      name: nameInput?.value.trim() || "",
      whatsapp: whatsappInput?.value.trim() || "",
      role: "customer",
      createdAt: new Date().toISOString(),
    });

    alert("Cadastro realizado!");
    window.location.href = "./index.html";
  } catch (err) {
    alert("Erro ao cadastrar: " + err.message);
  }
});

// Made with Bob
