const CACHE_NAME = 'breathing-app-v2.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/pwa-installer.js',
    '/update-manager.js',
    '/manifest.json',
    '/version.json',
    '/icon-512x512.png',
    '/icon-384x384.png',
    '/icon-192x192.png',
    '/icon-144x144.png',
    '/icon-96x96.png',
    '/icon-72x72.png',
    '/icon-48x48.png',
    '/apple-touch-icon-180x180.png',
    '/apple-touch-icon-152x152.png',
    '/apple-touch-icon-120x120.png',
    '/favicon-32x32.png',
    '/favicon-16x16.png'
];

self.addEventListener('install', event => {
    console.log('Service Worker: Installation en cours...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Mise en cache des ressources');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('Service Worker: Installation terminée');
            })
    );
    
    // Ne pas forcer skipWaiting automatiquement - attendre le signal
});

self.addEventListener('activate', event => {
    console.log('Service Worker: Activation en cours...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME && cacheName.startsWith('breathing-app-')) {
                        console.log('Service Worker: Suppression de l\'ancien cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Activation terminée');
            // Prendre le contrôle immédiatement
            return self.clients.claim();
        })
    );
});

// Écouter les messages pour forcer la mise à jour
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('Service Worker: Skip waiting demandé');
        self.skipWaiting();
    }
});

self.addEventListener('fetch', event => {
    // Ne pas mettre en cache version.json pour toujours avoir la dernière version
    if (event.request.url.includes('version.json')) {
        event.respondWith(
            fetch(event.request, {
                cache: 'no-cache'
            }).catch(() => {
                // Si hors ligne, retourner la version en cache si disponible
                return caches.match(event.request);
            })
        );
        return;
    }
    
    // Stratégie cache-first pour les autres ressources
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    // Retourner depuis le cache
                    return response;
                }
                
                // Sinon, récupérer depuis le réseau
                return fetch(event.request)
                    .then(response => {
                        // Ne pas mettre en cache les requêtes non-GET ou les réponses d'erreur
                        if (!event.request.url.startsWith('http') || 
                            event.request.method !== 'GET' ||
                            !response || 
                            response.status !== 200 || 
                            response.type !== 'basic') {
                            return response;
                        }
                        
                        // Cloner la réponse pour la mettre en cache
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    });
            })
            .catch(() => {
                // Si hors ligne et pas en cache, retourner une page d'erreur si c'est une navigation
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            })
    );
});