// CBT PRO X - Advanced Resilient Service Worker
const CACHE_NAME = "cbt-pro-assets-v1";
const API_CACHE_NAME = "cbt-pro-api-v1";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/src/main.tsx",
  "/src/index.css"
];

// On Installation: cache the core app shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching core application shell...");
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// On Activation: clean up stale cache databases to prevent storage bloat
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache !== API_CACHE_NAME) {
            console.log(`[Service Worker] Pruning obsolete cache: ${cache}`);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Interceptor: handle offline fallbacks for CBT assets and exams API
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // 1. API Caching Strategy (Network-First with Cache-Fallback)
  if (requestUrl.pathname.startsWith("/api/exams") || requestUrl.pathname.startsWith("/api/timetable")) {
    // Only apply caching to GET requests
    if (event.request.method === "GET") {
      event.respondWith(
        fetch(event.request)
          .then((response) => {
            // Clone the response and save to API cache
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(API_CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            console.log(`[Service Worker] Offline fallback triggered for API endpoint: ${requestUrl.pathname}`);
            return caches.match(event.request).then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If there's no cached version of the questions, return a friendly offline JSON response
              return new Response(
                JSON.stringify({
                  error: true,
                  offline: true,
                  message: "You are currently offline. This content is not pre-cached yet."
                }),
                {
                  headers: { "Content-Type": "application/json" }
                }
              );
            });
          })
      );
    }
    return;
  }

  // 2. Static Assets (JS, CSS, Images, Icons) Caching Strategy (Cache-First or Stale-While-Revalidate)
  const isStaticAsset = 
    requestUrl.pathname.endsWith(".js") || 
    requestUrl.pathname.endsWith(".css") || 
    requestUrl.pathname.endsWith(".png") || 
    requestUrl.pathname.endsWith(".jpg") || 
    requestUrl.pathname.endsWith(".svg") || 
    requestUrl.pathname.includes("/assets/") ||
    requestUrl.pathname.includes("@fs");

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Serve from cache, and optionally update in background (Stale-While-Revalidate)
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, networkResponse);
                });
              }
            })
            .catch(() => {
              // Ignore failure to fetch in background when offline
            });
          return cachedResponse;
        }

        // Cache miss: fetch from network and store for future requests
        return fetch(event.request).then((response) => {
          if (response.status === 200 || response.status === 0) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // 3. Default Page Navigation (HTML app shell) - Network-First falling back to root "/"
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match("/").then((rootResponse) => {
          return rootResponse || caches.match("/index.html");
        });
      })
    );
    return;
  }
});
