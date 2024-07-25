var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { VERSION } from './constants.js';
const ASSET_CACHE_NAME = `${VERSION}`;
const APP_STATIC_RESOURCES = [
    "../index.html",
    "../style.css",
    "../js/app.js",
    "../js/ui.js",
    "../js/translate.js",
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
    event.waitUntil((() => __awaiter(void 0, void 0, void 0, function* () {
        const cache = yield caches.open(ASSET_CACHE_NAME);
        cache.addAll(APP_STATIC_RESOURCES);
    }))());
});
self.addEventListener('activate', event => {
    console.log(`service worker version ${VERSION}: activated...`);
    event.waitUntil((() => __awaiter(void 0, void 0, void 0, function* () {
        const names = yield caches.keys();
        yield Promise.all(names.map((name) => {
            console.log(`inspecting cache "${name}"`);
            if (name !== ASSET_CACHE_NAME) {
                console.log(`deleting old cache "${name}"`);
                return caches.delete(name);
            }
        }));
        yield self.clients.claim();
    }))());
});
self.addEventListener('fetch', (event) => {
    console.log('intercepting fetch');
    if (event.request.mode === "navigate") {
        event.respondWith(caches.match("./index.html"));
        return;
    }
    event.respondWith((() => __awaiter(void 0, void 0, void 0, function* () {
        const cache = yield caches.open(ASSET_CACHE_NAME);
        console.log(`intercepting fetch for "${event.request.url}"`);
        const cachedResponse = yield cache.match(event.request.url);
        if (cachedResponse) {
            fetch(event.request).then(response => {
                cache.put(event.request, response.clone());
            });
            console.log(`using cached file for "${event.request.url}"`);
            return cachedResponse;
        }
        return new Response(null, { status: 404 });
    }))());
});
