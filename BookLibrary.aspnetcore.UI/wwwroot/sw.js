﻿var CACHE_NAME = 'booklibrary-aspnetcore-cache-v1.1';
var OFFLINE_URL = 'offline.html';

var urlsToCache = [
    '/',
    '/css/dist/styles.vendor.css',
    '/css/site.css',
    '/js/dist/scripts.vendor.js',
    '/js/dist/scripts.app.js',
    OFFLINE_URL
]

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(function (registration) {
        //registration was successful
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        showNotification();
    }).catch(function (err) {
        // registration failed
        console.log('ServiceWorker registration failed: ', err);
    });
}

function showNotification() {
    if (!("Notification" in window)) {
        console.log("This browser does not support notifications");
    }
    else if (Notification.permission === "granted") {
        getNotification();
    }
    else if (Notification.permission !== 'denied' || Notification.permission === "default") {
        Notification.requestPermission(function (permission) {
            if (permission === "granted") {
                getNotification();
            }
        });
    }
}

function getNotification() {
    var notification = new Notification('Welcome to BookLibrary!', {
        body: 'This is a sample notification from BookLibrary',
        image: 'books.png',
        icon: 'android-chrome-192x192.png',
        badge: 'android-chrome-192x192.png',
    });
    notification.addEventListener('click', event => {
        event.currentTarget.close();
    });
}

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    )
});

self.addEventListener('activate', function (event) {
    var cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (cacheName) {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', function (event) {
    if (event.request.method !== 'POST') {
        event.respondWith(
            caches.match(event.request)
                .then(function (response) {

                    if (response) {
                        return response;
                    }

                    var fetchRequest = event.request.clone();

                    return fetch(fetchRequest)
                        .then(function (response) {
                            if (!response || response.status !== 200 || response.type !== 'basic') {
                                return response;
                            }

                            var responseToCache = response.clone();

                            caches.open(CACHE_NAME)
                                .then(function (cache) {
                                    cache.put(event.request, responseToCache);
                                });
                            return response;
                        })
                        .catch(error => {
                            console.log('Fetch failed; returning offline page instead.', error);
                            return caches.match(new Request(OFFLINE_URL));
                        });
                })
        );
    }
});