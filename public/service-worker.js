const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/assets/css/style.css",
    "/assets/js/index.js",
    "/assets/js/db.js",
    "/assets/images/icons/icon-192x192.png",
    "/assets/images/icons/icon-512x512.png",
    "/manifest.webmanifest",
    "https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css",
    "https://cdn.jsdelivr.net/npm/chart.js@2.8.0"
];

const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

// install service worker
self.addEventListener("install", (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log("Your files were pre-cached successfully!");
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// activate service worker
self.addEventListener("activate", (e) => {
    e.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log("Removing old cache data", key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// fetch information from cache
self.addEventListener("fetch", (e) => {
    if (e.request.url.includes("/api/")) {
        console.log('[Service Worker] Fetch(data)', e.request.url);
        e.respondWith(
            caches
                .open(DATA_CACHE_NAME).then(cache => {
                    return fetch(e.request)
                        .then(res => {
                            // if successful, clone and store into cache
                            if (res.status === 200) {
                                cache.put(e.request.url, res.clone());
                            }

                            return res;
                            // if network request fails, get from cache instead
                        }).catch(err => cache.match(e.request));
                }).catch(err => console.log(err))
        );
        return;
    }
    // if no api, then use static assets
    e.respondWith(
        caches.match(e.request)
            .then(res => res || fetch(e.request))
    );
});