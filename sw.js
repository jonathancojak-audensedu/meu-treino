/* Service worker do Meu Treino.
   Suba o numero da versao sempre que alterar index.html, algum arquivo em
   js/ ou css/, ou o manifest. Se um arquivo novo entrar em js/ ou css/ e
   ficar de fora do SHELL, o service worker nao instala e o offline quebra.
   Caminhos relativos para funcionar em subpasta do GitHub Pages. */
const VERSION = 'meu-treino-v51';

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

  /* Navegacao sai do MESMO cache que os modulos js, e nao da rede.
     Servir o html pela rede parecia melhor (atualiza mais rapido), mas
     misturava html novo com js do cache antigo por uma carga inteira: o
     html trazia um botao que o js daquela versao ainda nao sabia atender,
     e a tela abria quebrada. Vindo os dois do cache VERSION, eles nunca se
     desencontram. A versao nova entra quando o service worker novo ativa,
     e o app recarrega sozinho nesse momento (ver registrarServiceWorker
     em js/main.js). */
  if(req.mode === 'navigate'){
    event.respondWith(
      caches.match('./index.html').then(cached => {
        const network = fetch(req).then(res => {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put('./index.html', copy));
          return res;
        }).catch(() => cached);
        return cached || network;
      })
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
