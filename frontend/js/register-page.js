import { registerWithEmail } from "./auth.js";
import { setUserData } from "./user.js";

const nameInput = document.getElementById("name");
const whatsappInput = document.getElementById("whatsapp");
const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");
const btn = document.getElementById("registerBtn");

btn.addEventListener("click", async () => {
  const name = nameInput?.value.trim() || "";
  const email = emailInput.value.trim();
  const pass = passInput.value.trim();

  // Validações
  if (!name) return alert("Digite seu nome completo.");
  if (name.length < 3) return alert("Nome deve ter pelo menos 3 caracteres.");
  if (name.toLowerCase() === "cliente novo") {
    return alert("Por favor, digite seu nome real, não 'Cliente Novo'.");
  }
  if (!email) return alert("Digite seu e-mail.");
  if (!pass) return alert("Digite sua senha.");
  if (pass.length < 6)
    return alert("A senha deve ter pelo menos 6 caracteres.");

  try {
    const cred = await registerWithEmail(email, pass);

    const userData = {
      uid: cred.user.uid,
      email,
      name: nameInput?.value.trim() || "",
      whatsapp: whatsappInput?.value.trim() || "",
      role: "customer",
      createdAt: new Date().toISOString(),
    };

    console.log("📝 Salvando dados do usuário:", userData);

    await setUserData(cred.user.uid, userData);

    console.log("✅ Usuário cadastrado com sucesso!");
    alert("Cadastro realizado!");
    window.location.href = "./index.html";
  } catch (err) {
    console.error("❌ Erro ao cadastrar:", err);
    alert("Erro ao cadastrar: " + err.message);
  }
});
