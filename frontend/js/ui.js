import { showToast as _showToast } from './toast.js';
import { showSpinner as _showSpinner, hideSpinner as _hideSpinner } from './spinner.js';

export function initUI() {
  if (!document.getElementById('loadingSpinner')) {
    const spinner = document.createElement('div');
    spinner.id = 'loadingSpinner';
    spinner.className = 'spinner hidden';
    spinner.innerHTML = `
      <div class="spinner-ring" aria-hidden="true"></div>
      <div class="spinner-text">Carregando...</div>
    `;
    document.body.appendChild(spinner);
  }
}

export const showToast = _showToast;
export const showSpinner = _showSpinner;
export const hideSpinner = _hideSpinner;
