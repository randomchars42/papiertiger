import { VERSION } from './constants.js';
const ASSET_CACHE_NAME = `${VERSION}`;
const APP_STATIC_RESOURCES = [
    "../index.html",
    "../style.css",
    "../js/app.js",
    "../js/ui.js",
    "../js/translate.js",
    "../js/texts.js",
    "../js/constants.js",
    "../icon.svg",
    "../manifest.json",
    "../data/list.json",
    "../data/rd.json",
    "../data/zna.json",
    "../lang/de.json",
    "../lang/en.json",
];
self.addEventListener('install', event => {
    console.log(`service worker version ${VERSION}: installing...`);
    event.waitUntil((async () => {
        const cache = await caches.open(ASSET_CACHE_NAME);
        cache.addAll(APP_STATIC_RESOURCES);
    })());
});
self.addEventListener('activate', event => {
    console.log(`service worker version ${VERSION}: activated...`);
    event.waitUntil((async () => {
        const names = await caches.keys();
        await Promise.all(names.map((name) => {
            console.log(`inspecting cache "${name}"`);
            if (name !== ASSET_CACHE_NAME) {
                console.log(`deleting old cache "${name}"`);
                return caches.delete(name);
            }
        }));
        await self.clients.claim();
    })());
});
self.addEventListener('fetch', (event) => {
    console.log('intercepting fetch');
    if (event.request.mode === "navigate") {
        event.respondWith(caches.match("./index.html"));
        return;
    }
    event.respondWith((async () => {
        const cache = await caches.open(ASSET_CACHE_NAME);
        console.log(`intercepting fetch for "${event.request.url}"`);
        const cachedResponse = await cache.match(event.request.url);
        if (cachedResponse) {
            fetch(event.request).then(response => {
                cache.put(event.request, response.clone());
            });
            console.log(`using cached file for "${event.request.url}"`);
            return cachedResponse;
        }
        return new Response(null, { status: 404 });
    })());
});
