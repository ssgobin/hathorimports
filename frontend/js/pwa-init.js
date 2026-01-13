/**
 * Inicialização PWA - Service Worker e Manifest
 */

// Registra o Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        "/service-worker.js",
        {
          scope: "/",
        }
      );

      console.log("✅ Service Worker registrado:", registration.scope);

      // Verifica atualizações
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        console.log("🔄 Nova versão do Service Worker encontrada");

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            // Nova versão disponível
            showUpdateNotification();
          }
        });
      });

      // Recarrega quando o novo SW assumir o controle
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    } catch (error) {
      console.error("❌ Erro ao registrar Service Worker:", error);
    }
  });
}

// Mostra notificação de atualização disponível
function showUpdateNotification() {
  const notification = document.createElement("div");
  notification.className = "update-notification";
  notification.innerHTML = `
    <div class="update-content">
      <p>🎉 Nova versão disponível!</p>
      <button onclick="updateApp()" class="btn-update">Atualizar</button>
      <button onclick="dismissUpdate()" class="btn-dismiss">Depois</button>
    </div>
  `;
  document.body.appendChild(notification);

  // Adiciona estilos
  const style = document.createElement("style");
  style.textContent = `
    .update-notification {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #1a1a1a;
      color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    }
    
    .update-content {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .update-content p {
      margin: 0;
      font-weight: 500;
    }
    
    .btn-update, .btn-dismiss {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }
    
    .btn-update {
      background: #4CAF50;
      color: white;
    }
    
    .btn-update:hover {
      background: #45a049;
    }
    
    .btn-dismiss {
      background: transparent;
      color: #999;
      border: 1px solid #333;
    }
    
    .btn-dismiss:hover {
      background: #333;
      color: white;
    }
    
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @media (max-width: 768px) {
      .update-notification {
        left: 20px;
        right: 20px;
        bottom: 20px;
      }
      
      .update-content {
        flex-direction: column;
        text-align: center;
      }
    }
  `;
  document.head.appendChild(style);
}

// Atualiza o app
window.updateApp = function () {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }
    });
  }
};

// Dispensa a notificação
window.dismissUpdate = function () {
  const notification = document.querySelector(".update-notification");
  if (notification) {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }
};

// Detecta quando o app está offline/online
window.addEventListener("online", () => {
  console.log("🌐 Conexão restaurada");
  showToast("Conexão restaurada!", "success");
});

window.addEventListener("offline", () => {
  console.log("📡 Sem conexão - modo offline");
  showToast(
    "Você está offline. Algumas funcionalidades podem estar limitadas.",
    "warning"
  );
});

// Helper para mostrar toast (se disponível)
function showToast(message, type = "info") {
  if (window.showNotification) {
    window.showNotification(message, type);
  } else {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
}

// Prompt de instalação PWA
let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  // Previne o prompt automático
  e.preventDefault();
  deferredPrompt = e;

  // Mostra botão de instalação customizado
  showInstallButton();
});

function showInstallButton() {
  const installButton = document.createElement("button");
  installButton.className = "install-pwa-button";
  installButton.innerHTML = "📱 Instalar App";
  installButton.onclick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(
        `Usuário ${
          outcome === "accepted" ? "aceitou" : "recusou"
        } instalar o app`
      );
      deferredPrompt = null;
      installButton.remove();
    }
  };

  // Adiciona estilos
  const style = document.createElement("style");
  style.textContent = `
    .install-pwa-button {
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 25px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      z-index: 9999;
      transition: all 0.3s ease;
      animation: pulse 2s infinite;
    }
    
    .install-pwa-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(102, 126, 234, 0.6);
    }
    
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
    }
    
    @media (max-width: 768px) {
      .install-pwa-button {
        left: 50%;
        transform: translateX(-50%);
        bottom: 80px;
      }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(installButton);
}

// Detecta quando o app foi instalado
window.addEventListener("appinstalled", () => {
  console.log("✅ PWA instalado com sucesso!");
  showToast("App instalado com sucesso! 🎉", "success");
  deferredPrompt = null;

  const installButton = document.querySelector(".install-pwa-button");
  if (installButton) {
    installButton.remove();
  }
});

// Verifica se está rodando como PWA
function isPWA() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

if (isPWA()) {
  console.log("🚀 Rodando como PWA");
  document.body.classList.add("pwa-mode");
}

console.log("✅ PWA inicializado");

// Made with Bob
