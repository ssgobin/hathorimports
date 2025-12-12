export function observeLazyImages(selector = 'img[data-src]') {
  const images = document.querySelectorAll(selector);
  if (!images.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
      io.unobserve(img);
    });
  }, { rootMargin: '200px' });

  images.forEach(img => io.observe(img));
}
