/* Helper compartilhado pelos testes desde que o app virou módulos ES (item 1.1
   do ROADMAP). jsdom não executa <script type="module">, então em vez de
   rodar o HTML inteiro no jsdom (como antes), cada boot() importa js/main.js
   direto pelo Node (import() dinâmico) depois de apontar document/window/etc
   pro jsdom da vez.

   Como só existe um globalThis por processo, dois jsdom "ao mesmo tempo" no
   mesmo arquivo de teste podem se contaminar: um setInterval deixado rodando
   numa janela antiga (cronômetro do treino, descanso) pode disparar depois
   que os globais já apontam pra janela nova. Por padrão boot() fecha e limpa
   a janela anterior antes de abrir a próxima. Se um teste precisa de duas
   janelas vivas ao mesmo tempo, passe {manterAnterior:true} e chame usar(w)
   antes de voltar a interagir com uma janela mais antiga. */
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const { register } = require('node:module');
const { pathToFileURL } = require('node:url');

/* propaga o ?boot=N do ponto de entrada pra toda a árvore de import() dentro
   de js/, senão um módulo importado estaticamente (não main.js) fica em
   cache do Node entre boot()s e vaza estado de uma janela de teste pra outra */
register('./_loader.mjs', pathToFileURL(__filename));

const REPO = path.join(__dirname, '..') + '/';
const HTML = fs.readFileSync(REPO + 'index.html', 'utf8');
const MAIN_JS = path.join(REPO, 'js', 'main.js');

let contadorBoot = 0;
let janelaAnterior = null;

const wait = ms => new Promise(r => setTimeout(r, ms));

// Object.defineProperty em vez de atribuição direta: o Node moderno já tem
// um global.navigator próprio (do fetch/undici), definido só com getter,
// sem setter. "global.navigator = w.navigator" falha calada nesse caso e
// o app acaba lendo o navigator do Node em vez do jsdom.
function usar(w){
  const globais = {window: w, document: w.document, navigator: w.navigator, localStorage: w.localStorage, caches: w.caches, URL: w.URL, Blob: w.Blob, Audio: w.Audio};
  for(const nome of Object.keys(globais)){
    Object.defineProperty(global, nome, {value: globais[nome], configurable: true, writable: true, enumerable: true});
  }
  return w;
}

function fechar(w){
  if(!w) return;
  try{ w.MT && w.MT._pararTimers && w.MT._pararTimers(); }catch(e){ /* ignora */ }
  try{ w.close(); }catch(e){ /* ignora */ }
}

async function boot(storage, customizar, opcoes){
  opcoes = opcoes || {};
  if(janelaAnterior && !opcoes.manterAnterior){
    fechar(janelaAnterior);
    janelaAnterior = null;
  }

  const dom = new JSDOM(HTML, { runScripts: 'outside-only', url: 'https://exemplo.github.io/treino/', pretendToBeVisual: true });
  const w = dom.window;
  w.HTMLElement.prototype.scrollIntoView = function(){};
  w.scrollTo = function(){};
  w.navigator.vibrate = () => true;
  w.Audio = function(){ return {loop:false, volume:1, play:()=>Promise.resolve(), pause:()=>{}}; };
  w.caches = {keys: () => Promise.resolve([])};
  if(storage) for(const k of Object.keys(storage)) w.localStorage.setItem(k, storage[k]);
  if(customizar) customizar(w);

  usar(w);
  await import(MAIN_JS + '?boot=' + (contadorBoot++));
  await wait(150);

  janelaAnterior = w;
  return w;
}

function criarCheck(){
  let fails = 0;
  const check = (label, cond) => { if(!cond) fails++; console.log((cond ? '  ok   ' : '  FALHA') + '  ' + label); };
  Object.defineProperty(check, 'fails', {get: () => fails});
  return check;
}

const seletor = w => id => w.document.getElementById(id);
const disparar = (w, elemento, tipo) => elemento.dispatchEvent(new w.Event(tipo, {bubbles: true}));

module.exports = { boot, usar, fechar, wait, criarCheck, seletor, disparar, REPO };
