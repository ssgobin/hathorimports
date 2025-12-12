// Carrega SweetAlert2 dinamicamente e retorna o objeto Swal
let _swalPromise = null;

export async function getSwal() {
  // Se já houver global, usa direto
  if (typeof window !== 'undefined' && window.Swal) return window.Swal;

  if (!_swalPromise) {
    // Import ESM build do CDN
    _swalPromise = import('https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js')
      .then((m) => m.default || m.Swal || m);
  }

  return _swalPromise;
}
