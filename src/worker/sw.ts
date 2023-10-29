import { precacheAndRoute } from 'workbox-precaching'

precacheAndRoute(self.__WB_MANIFEST);

// NOTE: We must export or import at least one thing so we are not in
// the "global" scope, but in a module scope which is re-declarable.
//
// The error from tsserver is: 2451: Cannot redeclare block-scoped
// variable 'self'.
//
// Even tho this is not really a module and cannot be: ServiceWorkers
// cannot be modules.

export type Version = number

const version: Version = 0

if (process.env.NODE_ENV === 'development') {
  console.debug({ version })
}

// NOTE: The default context is just Worker and we need to be the more specific ServiceWorker
declare let self: ServiceWorkerGlobalScope

const errorResponse = textResponse('error', 500)

self.addEventListener('install', (e: ExtendableEvent) => {
  e.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (e: ExtendableEvent) => {
  e.waitUntil(self.clients.claim())
})

self.addEventListener('message', (e: ExtendableMessageEvent) => {
  try {
    console.debug('received a message', e.data, e)
  } catch (err) {
    console.error('error processing message', e.data, err)
  }
})

// self.addEventListener('fetch', (e: FetchEvent) => {
//   try {
//     const url = new URL(e.request.url)

//     if (url.pathname === '/sw/ping') {
//       return e.respondWith(textResponse('pong'))
//     }

//     // NOTE: if we forget to proxy then all is lost
//     return e.respondWith(fetch(e.request))
//   } catch (e: any) {
//     console.log("%c Line:50 🍰 e", "color:#fca650", e);
//     console.error('error capturing fetch', e)
//     e.respondWith(errorResponse)
//   }
// })

function textResponse (text: string, status = 200): Response {
  return new Response(text, {
    status,
    headers: {
      'content-type': 'text/plain'
    }
  })
}

// async function postMessageToAllClients ({ type, args }: { type: string, args: unknown[] }): Promise<void> {
//   const clients = await self.clients.matchAll()
//   clients.forEach(client => {
//     client.postMessage({ type, args })
//   })
// }
