/* 
sw.js is the Service Worker of the Progressive Web App.
When installed, this JavaScript file will be run in the background to cache all the assets needed for the app to work offline and intercept `fetch()` requests.
*/

// Choose whether the cache will be used or not (should be true)
const useCache = true;
// List all items that should be cached. All assets for all pages must be listed here for the app to work offline.
const cachableItems = [
    '/',
    '/manifest.json',
    '/favicon.ico',
    '/favicon-16x16.png',
    '/favicon-32x32.png',
    '/images/android-chrome-192x192.png',
    '/images/android-chrome-512x512.png',
    '/images/screenshot-1.png',
    '/images/screenshot-2.png',
    '/index.html',
    '/js/app.js',
    '/pages/home.html',
    '/pages/about.html',
    '/pages/tos.html',
    '/pages/404.html',
    '/version.txt'
]

// When the user installs the PWA, add the cachable items to the cache
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open('app-cache').then(function(cache) {
            return cache.addAll(cachableItems);
        })
    );
});

// Immediately claim the pages so that the service worker takes control of the pages
self.addEventListener('activate', () => {
    self.clients.claim();
});

// Log messages/push notifications to the console. These can be generated from dev tools in the browser for debugging
self.addEventListener('message', (event) => {
  console.log(`message: ${event.data?.text()}`);
});

self.addEventListener('push', (event) => {
  console.log(`push :${event.data?.text()}`);
});


// When the user requests a page, check if it is fresh in the cache (<1d old). If it is, check if it's stale and either return it or update then add it to the cache before returning the fresh copy.
self.addEventListener('fetch', (event) => {
    if (!useCache) {
        return fetch(event.request);
    }
    const fullUrl = new URL(event.request.url);
    let pageUrl = fullUrl.pathname;
    if (pageUrl == '/') {
        if (fullUrl.searchParams.has('p'))
            // Getting here means the user has tried to directly visit a specific page. IE:/ clicking a link in an email or in browser history
            // redirect to index and let app.js handle the page request
            pageUrl = '/index.html';
    }
    const oneDay = 86400000; // 24 hours as milliseconds
    event.respondWith(
        getLastUpdate(pageUrl).then((lastUpdateResult) => {
            const diff = Date.now() - lastUpdateResult;
            //Check for stale cache
            if (diff > oneDay) {
                // Fetch a fresh copy and update the cache
                return fetch(event.request).then((response) => {
                    caches.open('app-cache').then((cache) => {
                        // Response is cloned because it's a stream (once read, it's gone)
                        cache.put(event.request, response.clone());
                        console.log('Cache updated: ' + event.request.url);
                        setLastUpdate(pageUrl);
                    });
                    // Return the Response object to the browser
                    return response;
                }).catch(() => {
                    // If the fetch fails, return the cached page if we have one
                    return caches.match(pageUrl).then((response) => {
                        if (!response)
                            throw Error('Not found in cache: ' + pageUrl);

                        return response;
                    });
                });
            }
            else {
                // If the cache is fresh, return the page as is
                return caches.match(pageUrl).then((response) => {
                        if (!response)
                            throw Error('Not found in cache: ' + pageUrl);
                        
                        return response;
                    });
            }
        })
        .catch(() => {
            // If the page is not found anywhere, return the 404 page
            return caches.match('/pages/404.html').then((response) => {
                // Have to create a new Response object because they're immutable so we can't edit the one we get from the cache
                // This is a 404, so we have to set the status code to 404
                return new Response(response.body, {
                    status: 404,
                    statusText: 'Not found',
                    headers: response.headers
                });
        })})
    );
});

/*
self.addEventListener('fetch', function(event) {
    return new Promise((resolve, reject) => {
        if (!useCache) {
            fetch(event.request).then((response) => {
                resolve(response);
            }).catch((error) => {
                console.log('Error fetching: ' + error);
                reject(error);
            });
        }
        else {
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
                    }).catch((error) => {
                        console.log('Error fetching: ' + error);
                    }).finally(() => {
                        // To get here, either cache is false or the lastUpdate was more than 24 hours ago
                        getFromCache(event.request).then((response) => {
                            if (response)
                                resolve(response);
                            else
                                reject('Not found in cache: ' + event.request.url);
                        }, (fail) => {
                            console.log('----' + fail);
                            reject(fail);
                        }).catch((error) => {
                            console.log(error);
                            reject(error + '. Not found in cache: ' + event.request.url);
                        });
                    });
                }
                else
                {
                    //To get here, the lastUpdate was less than 24 hours ago and useCache is true
                    getFromCache(event.request).then((response) => {
                        if (response)
                            resolve(response);
                        else
                            reject('Not found in cache: ' + event.request.url);
                    }, (fail) => {
                        console.log('----' + fail);
                        reject(fail);
                    }).catch((error) => {
                        console.log(error);
                        reject(error + '. Not found in cache: ' + event.request.url);
                    });
                }
            });
        }
    }).catch((error) => {
        console.log('Error: ' + error);
    });
});

function getFromCache(request) {
    return new Promise((resolve, fail) => {
        caches.match(request).then((response) => {
            if (response)
                resolve(response);
            else
                fail('Not found in cache: ' + request.url);
        }).catch((error) => {
            fail(error);
        });
    });
}
*/
// -- This is the IndexDB interface --
// IndexDB uses callbacks instead of promises
// -----------------------------------


// Open the database
let browserIndexDb = indexedDB.open('db', 1);

// Add the onupgradeneeded callback to create the schema
browserIndexDb.onupgradeneeded = function() {
  let db = browserIndexDb.result;
  if (!db.objectStoreNames.contains('lastUpdate')) {
    db.createObjectStore('lastUpdate');
  }
};

// On success of opening the database, add the last update time for each cachable item
browserIndexDb.onsuccess = function(e) {
    cachableItems.forEach((item) => {
        setLastUpdate(item);
    });
}

// Log any errors to console. This should be replaced with something informing the user.
browserIndexDb.onerror = function() {
    console.log('Error: ' + browserIndexDb.error);
}

// Make it easy to get the last update time for a "page" (cachableItem)
function getLastUpdate(pageUrl) {
    // Return a promise to wrap the callback-based indexedDB
    return new Promise((resolve, reject) => {   
        let db = browserIndexDb.result;
        let transaction = db.transaction('lastUpdate', 'readwrite');
        let store = transaction.objectStore('lastUpdate');
        // Request the last update time for the given page
        let request = store.get(pageUrl);

        request.onsuccess = function() {
            // When callback hit, resolve the promise with the result
            resolve(request.result);

        request.onerror = function() {
            reject('Error:' + request.error);
        }
    }});
}

// Make it easy to set the last update time for a "page" (cachableItem), no promises needed because we don't need to wait for a result
function setLastUpdate(pageUrl) {
    let db = browserIndexDb.result;
    let transaction = db.transaction('lastUpdate', 'readwrite');
    let store = transaction.objectStore('lastUpdate');
    store.put(Date.now(), pageUrl);
}