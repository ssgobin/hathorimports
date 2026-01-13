/**
 * Service Worker - Hathor Imports PWA
 * Versão: 1.0.0
 */

const CACHE_NAME = 'hathor-imports-v1';
const RUNTIME_CACHE = 'hathor-runtime-v1';

// Arquivos para cache inicial (offline-first)
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/store.html',
  '/cart.html',
  '/login.html',
  '/assets/style.css',
  '/assets/store-styles.css',
  '/assets/cart-styles.css',
  '/assets/hathor-logo.png',
  '/js/store.js',
  '/js/cart.js',
  '/js/auth.js',
  '/js/notifications.js',
  '/js/lazy-loading.js',
  '/components/header.html'
];

// Instalação - cacheia arquivos essenciais
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache aberto, adicionando arquivos...');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Arquivos cacheados com sucesso');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Erro ao cachear arquivos:', error);
      })
  );
});

// Ativação - limpa caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('[SW] Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker ativado');
        return self.clients.claim();
      })
  );
});

// Fetch - estratégia de cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requisições de outros domínios (exceto APIs conhecidas)
  if (url.origin !== location.origin && 
      !url.origin.includes('firebaseio.com') &&
      !url.origin.includes('googleapis.com')) {
    return;
  }

  // Estratégia para diferentes tipos de requisição
  if (request.method !== 'GET') {
    // Não cacheia POST, PUT, DELETE, etc
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    // API: Network First (tenta rede, fallback para cache)
    event.respondWith(networkFirst(request));
  } else if (request.destination === 'image') {
    // Imagens: Cache First (cache, fallback para rede)
    event.respondWith(cacheFirst(request));
  } else {
    // HTML, CSS, JS: Stale While Revalidate
    event.respondWith(staleWhileRevalidate(request));
  }
});

/**
 * Network First - Tenta rede primeiro, fallback para cache
 * Ideal para APIs e dados dinâmicos
 */
async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  
  try {
    const response = await fetch(request);
    
    // Cacheia resposta bem-sucedida
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Rede falhou, buscando no cache:', request.url);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Retorna resposta offline
    return new Response(
      JSON.stringify({ 
        error: 'Você está offline',
        offline: true 
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 503
      }
    );
  }
}

/**
 * Cache First - Busca no cache primeiro, fallback para rede
 * Ideal para imagens e assets estáticos
 */
async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Erro ao buscar:', request.url);
    
    // Retorna imagem placeholder para imagens
    if (request.destination === 'image') {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect fill="#f0f0f0" width="400" height="300"/><text fill="#999" x="50%" y="50%" text-anchor="middle" dy=".3em">Offline</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    
    throw error;
  }
}

/**
 * Stale While Revalidate - Retorna cache e atualiza em background
 * Ideal para HTML, CSS, JS
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => {
      console.log('[SW] Falha ao atualizar:', request.url);
    });
  
  // Retorna cache imediatamente se disponível
  return cachedResponse || fetchPromise;
}

// Mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

// Sincronização em background (quando voltar online)
self.addEventListener('sync', (event) => {
  console.log('[SW] Sincronização em background:', event.tag);
  
  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart());
  }
});

async function syncCart() {
  // Implementar sincronização do carrinho quando voltar online
  console.log('[SW] Sincronizando carrinho...');
}

// Notificações push (futuro)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'Nova notificação',
    icon: '/assets/hathor-logo.png',
    badge: '/assets/hathor-logo.png',
    vibrate: [200, 100, 200],
    data: data
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Hathor Imports', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

console.log('[SW] Service Worker carregado');

// Made with Bob
