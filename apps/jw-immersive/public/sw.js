/* eslint-disable no-undef */

const STATIC_CACHE = "atlasit-static-v1.0.0";
const DYNAMIC_CACHE = "atlasit-dynamic-v1.0.0";

// Resources to cache immediately
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/favicon.svg",
  "/social-card.svg",
  "/robots.txt",
  "/_headers",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Install event");
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("[SW] Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activate event");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log("[SW] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip cross-origin requests
  if (url.origin !== location.origin) return;

  // Handle API requests differently
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return fetch(request)
          .then((response) => {
            // Cache successful responses
            if (response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // Return cached version if available
            return cache.match(request);
          });
      })
    );
    return;
  }

  // Handle static assets and pages
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return caches.open(DYNAMIC_CACHE).then((cache) => {
        return fetch(request)
          .then((response) => {
            // Cache successful responses
            if (response.status === 200 && response.type === "basic") {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // Return offline fallback for navigation requests
            if (request.mode === "navigate") {
              return caches.match("/");
            }
          });
      });
    })
  );
});

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync:", event.tag);

  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implement background sync logic here
  console.log("[SW] Performing background sync");
}

// Push notifications
self.addEventListener("push", (event) => {
  console.log("[SW] Push received:", event);

  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      vibrate: [100, 50, 100],
      data: data.data,
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification click:", event);
  event.notification.close();

  event.waitUntil(clients.openWindow(event.notification.data?.url || "/"));
});
