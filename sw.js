/* Service worker do Meu Treino.
   Suba o numero da versao sempre que alterar index.html, algum arquivo em
   js/ ou css/, ou o manifest. Se um arquivo novo entrar em js/ ou css/ e
   ficar de fora do SHELL, o service worker nao instala e o offline quebra.
   Caminhos relativos para funcionar em subpasta do GitHub Pages. */
const VERSION = 'meu-treino-v27';

const SHELL = [
  './',
  './index.html',
  './css/app.css',
  './js/main.js',
  './js/catalog.js',
  './js/generator.js',
  './js/store.js',
  './js/ui.js',
  './js/history.js',
  './js/session.js',
  './js/onboarding.js',
  './manifest.webmanifest',
  './silence.wav',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;

  const url = new URL(req.url);
  if(url.origin !== self.location.origin){
    // fontes e links externos: tenta a rede, cai no cache se ja tiver passado por aqui
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // navegacao: rede primeiro para pegar atualizacoes, cache como plano B offline
  if(req.mode === 'navigate'){
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put('./index.html', copy));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // demais arquivos proprios: cache primeiro, revalidando em segundo plano
  event.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy));
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
