// import { precacheAndRoute } from 'workbox-precaching'

declare let self: ServiceWorkerGlobalScope

// precacheAndRoute(self.__WB_MANIFEST)

console.log('service worker 注册成功')

self.addEventListener('install', (event: ExtendableEvent) => {
    console.log('Service Worker installed');
    self.postMessage({ type: 'log', message: 'Service Worker installed' });
});

self.addEventListener('activate', (event: ExtendableEvent) => {
    console.log('Service Worker activated');
    self.postMessage({ type: 'log', message: 'Service Worker activated' });
});

self.addEventListener('fetch', event => {
    console.log('service worker 抓取请求成功: ' + event.request.url)
})