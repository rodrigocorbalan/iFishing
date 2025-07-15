// sw.js
const CACHE_NAME = 'ifishing-cache-v1';
const urlsToCache = [
  '/', // Cache the root (index.html)
  'index.html',
  'calendario.html',
  'wishlist.html',
  'css/styles.css',
  'js/api.js',
  'js/map.js',
  'js/ui.js',
  'js/calendario.js',
  'js/wishlist.js',
  'js/calendar_year_view.js',
  'img/fishing.png',
  // Adicione aqui todos os tamanhos dos ícones que você criou no manifest.json
  'img/fishing-72x72.png',
  'img/fishing-96x96.png',
  'img/fishing-128x128.png',
  'img/fishing-144x144.png',
  'img/fishing-152x152.png',
  'img/fishing-192x192.png',
  'img/fishing-384x384.png',
  'img/fishing-512x512.png',
  // Adicione também os recursos externos que você quer cachear (Font Awesome, Leaflet, TailwindCSS)
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://api.mapbox.com/mapbox.js/plugins/leaflet-fullscreen/v1.0.1/Leaflet.fullscreen.min.js',
  'https://api.mapbox.com/mapbox.js/plugins/leaflet-fullscreen/v1.0.1/leaflet.fullscreen.css',
  'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.11/main.min.css',
  'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.11/main.min.js',
  'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.11/locales/pt-br.js'
];

// Instalação do Service Worker - cacheia os recursos estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Ativação do Service Worker - limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Intercepta requisições de rede
self.addEventListener('fetch', (event) => {
  // Evita interceptar requisições para o Apps Script ou outras APIs (não queremos cachear dados dinâmicos)
  if (event.request.url.includes('script.google.com') || event.request.url.includes('maps.googleapis.com')) {
    return fetch(event.request); // Apenas passa a requisição adiante, não cacheia
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna o recurso do cache, se encontrado
        if (response) {
          return response;
        }
        // Se não, busca na rede
        return fetch(event.request).then((networkResponse) => {
          // Adiciona o novo recurso ao cache (apenas requisições GET bem sucedidas)
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
      .catch(() => {
        // Caso a requisição falhe (offline) e não esteja no cache
        // Você pode adicionar uma página offline aqui, por exemplo:
        // return caches.match('offline.html');
        console.log("Offline e recurso não encontrado no cache para:", event.request.url);
      })
  );
});