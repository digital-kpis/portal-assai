// Portal Digital Maracanã — Service Worker
// Fase 2: PWA com cache offline

const CACHE_NAME = 'portal-maracana-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
];

// Instala e faz cache dos assets principais
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS.filter(function(url) {
        return !url.startsWith('https://fonts');
      }));
    }).catch(function() {})
  );
  self.skipWaiting();
});

// Ativa e limpa caches antigos
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Estratégia: Network First, fallback para cache
self.addEventListener('fetch', function(event) {
  // Ignora requisições não-GET e APIs externas (GitHub, etc.)
  if (event.request.method !== 'GET') return;
  var url = event.request.url;
  if (url.includes('api.github.com') || url.includes('wa.me')) return;

  event.respondWith(
    fetch(event.request).then(function(response) {
      // Clona e armazena no cache se for uma resposta válida
      if (response && response.status === 200 && response.type === 'basic') {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
      }
      return response;
    }).catch(function() {
      // Se falhar, tenta servir do cache
      return caches.match(event.request).then(function(cached) {
        if (cached) return cached;
        // Fallback final: retorna o index.html
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
