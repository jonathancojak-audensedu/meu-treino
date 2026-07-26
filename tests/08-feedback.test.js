const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path').join(__dirname, '..') + '/';
const html = fs.readFileSync(path + 'index.html', 'utf8');
const js = fs.readFileSync(path + 'app.js', 'utf8');

function boot(storage){
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://exemplo.github.io/treino/', pretendToBeVisual: true });
  const w = dom.window;
  w.HTMLElement.prototype.scrollIntoView = function(){};
  w.scrollTo = function(){};
  w.navigator.vibrate = () => true;
  w.Audio = function(){ return {loop:false, volume:1, play:()=>Promise.resolve(), pause:()=>{}}; };
  w.caches = {keys: () => Promise.resolve(['meu-treino-v9'])};
  if(storage) for(const k of Object.keys(storage)) w.localStorage.setItem(k, storage[k]);
  w.eval(js);
  return w;
}
const wait = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const check = (label, cond) => { if(!cond) fails++; console.log((cond ? '  ok   ' : '  FALHA') + '  ' + label); };

(async () => {
  const perfilFake = {nome:'Fulano de Tal Segredo', dias:'4', objetivo:'hipertrofia', local:'academia', tempo:'60', dores:[]};
  const w = boot({mt_profile: JSON.stringify(perfilFake)});
  const $ = id => w.document.getElementById(id);
  await wait(150);

  console.log('\n== link de feedback ==');
  const el = $('btn-feedback');
  check('elemento existe', !!el);
  check('abre em nova aba', el.getAttribute('target') === '_blank');
  check('tem rel=noopener', el.getAttribute('rel') === 'noopener');

  const href = el.getAttribute('href');
  check('aponta para o numero certo no wa.me', href.indexOf('https://wa.me/5581986501624?text=') === 0);

  const texto = decodeURIComponent(href.split('?text=')[1]);
  check('mensagem tem cabecalho identificavel', texto.includes('Feedback do Meu Treino'));
  check('mensagem tem a versao do service worker', texto.includes('meu-treino-v9'));
  check('mensagem informa que roda no navegador (nao instalado)', texto.includes('Modo: navegador'));
  check('mensagem tem o user agent completo', texto.includes(w.navigator.userAgent));
  check('nada do nome do perfil vaza pra mensagem', !texto.includes('Fulano de Tal Segredo'));
  check('nenhuma palavra de dado pessoal aparece', !/perfil|treino conclu|hist(o|ó)rico registrado/i.test(texto.replace('Feedback do Meu Treino', '')));

  console.log('\n== reabrir ajustes recalcula o link ==');
  $('nav-settings').click();
  await wait(30);
  check('href continua valido apos reabrir', $('btn-feedback').getAttribute('href').indexOf('https://wa.me/5581986501624') === 0);

  console.log('\n' + (fails ? fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
