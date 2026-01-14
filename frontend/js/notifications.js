/**
 * Sistema de Notificações Toast
 * Hathor Imports
 */

// ===== ESTILOS =====
const toastStyles = `
  .toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 12px;
    pointer-events: none;
  }

  .toast {
    min-width: 300px;
    max-width: 400px;
    padding: 16px 20px;
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    gap: 12px;
    pointer-events: all;
    animation: slideIn 0.3s ease-out;
    backdrop-filter: blur(10px);
  }

  .toast.removing {
    animation: slideOut 0.3s ease-out forwards;
  }

  .toast-icon {
    font-size: 24px;
    flex-shrink: 0;
  }

  .toast-content {
    flex: 1;
  }

  .toast-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 4px;
    color: #fff;
  }

  .toast-message {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.4;
  }

  .toast-close {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    font-size: 20px;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .toast-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  /* Tipos de toast */
  .toast.success {
    border-left: 4px solid #10b981;
  }

  .toast.error {
    border-left: 4px solid #ef4444;
  }

  .toast.warning {
    border-left: 4px solid #f59e0b;
  }

  .toast.info {
    border-left: 4px solid #3b82f6;
  }

  /* Animações */
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

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }

  /* Responsivo */
  @media (max-width: 480px) {
    .toast-container {
      top: 10px;
      right: 10px;
      left: 10px;
    }

    .toast {
      min-width: auto;
      max-width: none;
    }
  }
`;

// ===== INJETAR ESTILOS =====
function injectStyles() {
  if (document.getElementById('toast-styles')) return;
  
  const styleEl = document.createElement('style');
  styleEl.id = 'toast-styles';
  styleEl.textContent = toastStyles;
  document.head.appendChild(styleEl);
}

// ===== CRIAR CONTAINER =====
function getOrCreateContainer() {
  let container = document.getElementById('toast-container');
  
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  return container;
}

// ===== ÍCONES POR TIPO =====
const icons = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️'
};

// ===== CRIAR TOAST =====
function createToast(options) {
  const {
    type = 'info',
    title = '',
    message = '',
    duration = 4000,
    closable = true
  } = options;

  injectStyles();
  const container = getOrCreateContainer();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-content">
      ${title ? `<div class="toast-title">${title}</div>` : ''}
      <div class="toast-message">${message}</div>
    </div>
    ${closable ? '<button class="toast-close" aria-label="Fechar">×</button>' : ''}
  `;

  container.appendChild(toast);

  // Botão de fechar
  if (closable) {
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => removeToast(toast));
  }

  // Auto-remover
  if (duration > 0) {
    setTimeout(() => removeToast(toast), duration);
  }

  return toast;
}

// ===== REMOVER TOAST =====
function removeToast(toast) {
  if (!toast || toast.classList.contains('removing')) return;
  
  toast.classList.add('removing');
  
  setTimeout(() => {
    toast.remove();
    
    // Remove container se vazio
    const container = document.getElementById('toast-container');
    if (container && container.children.length === 0) {
      container.remove();
    }
  }, 300);
}

// ===== API PÚBLICA =====
export const notify = {
  success: (message, title = 'Sucesso!', options = {}) => {
    return createToast({
      type: 'success',
      title,
      message,
      ...options
    });
  },

  error: (message, title = 'Erro!', options = {}) => {
    return createToast({
      type: 'error',
      title,
      message,
      duration: 6000, // Erros ficam mais tempo
      ...options
    });
  },

  warning: (message, title = 'Atenção!', options = {}) => {
    return createToast({
      type: 'warning',
      title,
      message,
      ...options
    });
  },

  info: (message, title = '', options = {}) => {
    return createToast({
      type: 'info',
      title,
      message,
      ...options
    });
  },

  custom: (options) => {
    return createToast(options);
  }
};

// ===== FUNÇÃO AUXILIAR PARA COMPATIBILIDADE =====
export function showNotification(message, type = 'info', title = '') {
  const typeMap = {
    'success': 'success',
    'error': 'error',
    'warning': 'warning',
    'info': 'info'
  };
  
  const mappedType = typeMap[type] || 'info';
  
  return notify[mappedType](message, title || undefined);
}

// ===== ATALHOS GLOBAIS =====
window.notify = notify;
window.showNotification = showNotification;

// ===== EXEMPLOS DE USO =====
/*
// Sucesso simples
notify.success('Produto adicionado ao carrinho!');

// Erro com título customizado
notify.error('Não foi possível processar o pagamento', 'Erro no Pagamento');

// Aviso
notify.warning('Seu carrinho está vazio');

// Info
notify.info('Novos produtos foram adicionados ao catálogo');

// Customizado
notify.custom({
  type: 'success',
  title: 'Pedido Confirmado',
  message: 'Seu pedido #1234 foi confirmado com sucesso!',
  duration: 5000,
  closable: true
});

// Notificação permanente (até fechar manualmente)
notify.info('Leia nossos termos de uso', 'Importante', { duration: 0 });
*/

export default notify;
