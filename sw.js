const cachableItems = [
    '/',
    '/manifest.json',
    '/favicon.ico',
    '/favicon-16x16.png',
    '/favicon-32x32.png',
    '/images/android-chrome-192x192.png',
    '/images/android-chrome-512x512.png',
    '/index.html',
    '/js/app.js',
    '/pages/home.html',
    '/pages/about.html',
    '/pages/tos.html',
    '/version.txt'
]
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open('app-cache').then(function(cache) {
            return cache.addAll(cachableItems);
        })
    );
});

self.addEventListener('activate', () => {
    self.clients.claim();
});

self.addEventListener('message', (event) => {
  console.log(`message: ${event.data?.text()}`);
});

self.addEventListener('push', (event) => {
  console.log(`push :${event.data?.text()}`);
});

let useCache = true;
self.addEventListener('fetch', function(event) {
    return new Promise((resolve) => {
        const fullUrl = new URL(event.request.url);
        const pageUrl = event.request.url.substring(fullUrl.protocol.length + fullUrl.hostname.length + 2);
        getLastUpdate(pageUrl).then((result) => {
            const lastUpdate = result;
            const oneDay = 86400000; // 24 hours as milliseconds
            const diff = Date.now() - lastUpdate;
            if (diff > oneDay) {
                fetch(event.request).then((response) => {
                    caches.open('app-cache').then((cache) => {
                        cache.put(event.request, response.clone());
                        console.log('Cache updated: ' + event.request.url);
                        setLastUpdate(pageUrl);
                    });
                });
            }
            resolve(caches.match(event.request));
        });
    });
});

let browserIndexDb = indexedDB.open('db', 1);
browserIndexDb.onupgradeneeded = function() {
  let db = browserIndexDb.result;
  if (!db.objectStoreNames.contains('lastUpdate')) {
    db.createObjectStore('lastUpdate');
  }
};
browserIndexDb.onsuccess = function(e) {
    cachableItems.forEach((item) => {
        setLastUpdate(item);
    });
}
browserIndexDb.onerror = function() {
    console.log('Error: ' + browserIndexDb.error);
}
function getLastUpdate(pageUrl) {
    return new Promise((resolve, reject) => {   
        let db = browserIndexDb.result;
        let transaction = db.transaction('lastUpdate', 'readwrite');
        let store = transaction.objectStore('lastUpdate');
        let request = store.get(pageUrl);

        request.onsuccess = function() {
            resolve(request.result);

        request.onerror = function() {
            reject('Error:' + request.error);
        }
    }});
}
function setLastUpdate(pageUrl) {
    let db = browserIndexDb.result;
    let transaction = db.transaction('lastUpdate', 'readwrite');
    let store = transaction.objectStore('lastUpdate');
    store.put(Date.now(), pageUrl);
}