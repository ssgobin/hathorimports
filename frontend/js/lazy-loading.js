/**
 * Sistema de Lazy Loading de Imagens
 * Carrega imagens apenas quando estão prestes a entrar no viewport
 */

class LazyLoader {
  constructor(options = {}) {
    this.options = {
      rootMargin: options.rootMargin || '50px',
      threshold: options.threshold || 0.01,
      loadingClass: options.loadingClass || 'lazy-loading',
      loadedClass: options.loadedClass || 'lazy-loaded',
      errorClass: options.errorClass || 'lazy-error',
      placeholderSrc: options.placeholderSrc || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ECarregando...%3C/text%3E%3C/svg%3E'
    };

    this.observer = null;
    this.images = new Set();
    this.init();
  }

  init() {
    // Verifica se o navegador suporta IntersectionObserver
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver não suportado. Carregando todas as imagens.');
      this.loadAllImages();
      return;
    }

    // Cria o observer
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        rootMargin: this.options.rootMargin,
        threshold: this.options.threshold
      }
    );

    // Observa todas as imagens lazy
    this.observeImages();
  }

  observeImages() {
    const lazyImages = document.querySelectorAll('img[data-src], img[data-srcset]');
    
    lazyImages.forEach(img => {
      this.images.add(img);
      img.classList.add(this.options.loadingClass);
      
      // Define placeholder se a imagem não tiver src
      if (!img.src || img.src === window.location.href) {
        img.src = this.options.placeholderSrc;
      }
      
      this.observer.observe(img);
    });

    console.log(`🖼️ Lazy Loading: ${lazyImages.length} imagens observadas`);
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        this.loadImage(img);
        this.observer.unobserve(img);
      }
    });
  }

  loadImage(img) {
    const src = img.dataset.src;
    const srcset = img.dataset.srcset;

    if (!src && !srcset) {
      console.warn('Imagem sem data-src ou data-srcset:', img);
      return;
    }

    // Cria uma nova imagem para pré-carregar
    const tempImg = new Image();

    tempImg.onload = () => {
      // Aplica a imagem carregada
      if (src) img.src = src;
      if (srcset) img.srcset = srcset;

      // Remove atributos data
      delete img.dataset.src;
      delete img.dataset.srcset;

      // Atualiza classes
      img.classList.remove(this.options.loadingClass);
      img.classList.add(this.options.loadedClass);

      // Dispara evento customizado
      img.dispatchEvent(new CustomEvent('lazyloaded', { detail: { src } }));
    };

    tempImg.onerror = () => {
      console.error('Erro ao carregar imagem:', src || srcset);
      img.classList.remove(this.options.loadingClass);
      img.classList.add(this.options.errorClass);
      
      // Define imagem de erro
      img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23ffebee" width="400" height="300"/%3E%3Ctext fill="%23c62828" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EErro ao carregar%3C/text%3E%3C/svg%3E';
      
      // Dispara evento de erro
      img.dispatchEvent(new CustomEvent('lazyerror', { detail: { src } }));
    };

    // Inicia o carregamento
    if (srcset) {
      tempImg.srcset = srcset;
    }
    if (src) {
      tempImg.src = src;
    }
  }

  loadAllImages() {
    // Fallback para navegadores sem IntersectionObserver
    const lazyImages = document.querySelectorAll('img[data-src], img[data-srcset]');
    
    lazyImages.forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
        delete img.dataset.src;
      }
      if (img.dataset.srcset) {
        img.srcset = img.dataset.srcset;
        delete img.dataset.srcset;
      }
      img.classList.add(this.options.loadedClass);
    });
  }

  // Adiciona novas imagens ao observer
  observe(element) {
    if (element instanceof HTMLImageElement) {
      this.images.add(element);
      element.classList.add(this.options.loadingClass);
      if (this.observer) {
        this.observer.observe(element);
      } else {
        this.loadImage(element);
      }
    } else {
      // Observa todas as imagens dentro do elemento
      const images = element.querySelectorAll('img[data-src], img[data-srcset]');
      images.forEach(img => this.observe(img));
    }
  }

  // Remove imagens do observer
  unobserve(element) {
    if (this.observer) {
      this.observer.unobserve(element);
    }
    this.images.delete(element);
  }

  // Destrói o observer
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.images.clear();
  }

  // Força o carregamento de uma imagem específica
  forceLoad(img) {
    if (img.dataset.src || img.dataset.srcset) {
      this.loadImage(img);
      if (this.observer) {
        this.observer.unobserve(img);
      }
    }
  }

  // Força o carregamento de todas as imagens pendentes
  forceLoadAll() {
    this.images.forEach(img => {
      if (img.dataset.src || img.dataset.srcset) {
        this.loadImage(img);
      }
    });
    
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Instância global
let lazyLoader = null;

// Inicializa automaticamente quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    lazyLoader = new LazyLoader();
  });
} else {
  lazyLoader = new LazyLoader();
}

// Exporta para uso em outros módulos
export { LazyLoader, lazyLoader };

// Também disponibiliza globalmente
window.LazyLoader = LazyLoader;
window.lazyLoader = lazyLoader;

// Made with Bob
