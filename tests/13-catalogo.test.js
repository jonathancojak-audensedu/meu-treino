const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path').join(__dirname, '..') + '/';
const html = fs.readFileSync(path + 'index.html', 'utf8');
// instrumentacao anexada na mesma execucao (Store e const, so e visivel dentro
// do proprio eval que o declara), pra contar quantas vezes Store.set('favoritos')
// dispara por um unico clique, sem depender de mockar localStorage ou window
const js = fs.readFileSync(path + 'app.js', 'utf8') +
  "\nwindow.__contadorFav = 0;\nconst __origStoreSet = Store.set.bind(Store);\n" +
  "Store.set = function(k, v){ if(k === 'favoritos') window.__contadorFav++; return __origStoreSet(k, v); };\n";

const dias = n => new Date(Date.now() - n * 86400000).toISOString();
const HISTORICO = [
  {id:'h1', name:'Superiores A', tag:'DIA 1', block:'a', date: dias(0), duration:600, volume:900, setsDone:3,
    exercises:[{exId:'agachamento_sumo', name:'Agachamento sumô', type:'reps', sets:[{w:'60', r:'8'}]}]}
];

function boot(storage){
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://exemplo.github.io/treino/', pretendToBeVisual: true });
  const w = dom.window;
  w.HTMLElement.prototype.scrollIntoView = function(){};
  w.scrollTo = function(){};
  w.navigator.vibrate = () => true;
  w.Audio = function(){ return {loop:false, volume:1, play:()=>Promise.resolve(), pause:()=>{}}; };
  w.caches = {keys: () => Promise.resolve([])};
  if(storage) for(const k of Object.keys(storage)) w.localStorage.setItem(k, storage[k]);
  w.eval(js);
  return w;
}
const wait = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const check = (label, cond) => { if(!cond) fails++; console.log((cond ? '  ok   ' : '  FALHA') + '  ' + label); };

(async () => {
  const w = boot({mt_history: JSON.stringify(HISTORICO)});
  const MT = w.MT;
  const $ = id => w.document.getElementById(id);
  const ev = (el, type) => el.dispatchEvent(new w.Event(type, {bubbles:true}));
  await wait(120);

  console.log('\n== catalogo: todo exercicio tem metadados, pelo menos 150 ==');
  const exIds = Object.keys(MT.EX);
  check('catalogo tem pelo menos 150 exercicios', exIds.length >= 150);
  const semMeta = exIds.filter(id => !MT.META[id]);
  check('todo exercicio de EX tem entrada em META (' + semMeta.length + ' faltando)', semMeta.length === 0);
  const metaIds = Object.keys(MT.META);
  const semEx = metaIds.filter(id => !MT.EX[id]);
  check('todo exercicio de META tem entrada em EX (' + semEx.length + ' sobrando)', semEx.length === 0);

  console.log('\n== catalogo: metadados minimamente validos ==');
  const invalidos = metaIds.filter(id => {
    const m = MT.META[id];
    return !m.p || typeof m.m !== 'object' || !Array.isArray(m.e) || !Array.isArray(m.s) || !(m.c >= 1);
  });
  check('nenhum META com campo obrigatorio faltando (' + invalidos.length + ')', invalidos.length === 0);

  console.log('\n== gerador continua valido com o catalogo maior ==');
  const progCorpo = MT.gerar({experiencia:'iniciante', dias:3, tempo:45, local:'corpo', objetivo:'hipertrofia', dores:[], prioridade:[], nome:'T'});
  check('perfil de peso corporal gera 3 dias validos', progCorpo.length === 3 && progCorpo.every(d => d.items.length >= 3));
  const progCasa = MT.gerar({experiencia:'intermediario', dias:4, tempo:60, local:'casa', objetivo:'saude', dores:[], prioridade:[], nome:'T'});
  check('perfil de casa gera 4 dias validos', progCasa.length === 4 && progCasa.every(d => d.items.length >= 3));

  console.log('\n== seletor: chips filtram a lista ==');
  $('daylist').querySelector('[data-open="lowerA"]').click();
  await wait(20);
  $('btn-begin').click();
  await wait(20);
  $('exlist').querySelector('[data-addex]').click();
  await wait(40);
  check('chips aparecem no topo', $('ex-chips').querySelectorAll('[data-chip]').length === 8);
  $('ex-chips').querySelector('[data-chip="pernas"]').click();
  await wait(20);
  const gruposMostrados = [...$('ex-options').querySelectorAll('.opt[data-v] .om')]
    .map(el => el.textContent.split(' · ')[0]);
  check('chip "Pernas" so mostra quadriceps/panturrilha', gruposMostrados.length > 0 && gruposMostrados.every(g => g === 'quadríceps' || g === 'panturrilha'));
  check('chip fica marcado como selecionado', $('ex-chips').querySelector('[data-chip="pernas"]').classList.contains('sel'));
  $('ex-chips').querySelector('[data-chip="pernas"]').click();
  await wait(20);
  check('clicar de novo desmarca o chip', !$('ex-chips').querySelector('[data-chip="pernas"]').classList.contains('sel'));

  console.log('\n== seletor: recentes aparecem sem precisar buscar ==');
  check('usados recentemente aparece com o exercicio do historico', $('ex-options').textContent.includes('Usados recentemente') && $('ex-options').textContent.includes('Agachamento sumô'));

  console.log('\n== seletor: favoritar persiste e aparece em Favoritos ==');
  check('sem favorito nenhum ainda', Object.keys(MT.favoritos).length === 0);
  const estrela = $('ex-options').querySelector('[data-star="agachamento_sumo"]');
  estrela.click();
  await wait(20);
  check('favoritar grava no estado', MT.favoritos['agachamento_sumo'] === true);
  check('estrela fica marcada', $('ex-options').querySelector('[data-star="agachamento_sumo"]').classList.contains('fav'));
  check('secao Favoritos aparece', $('ex-options').textContent.includes('Favoritos'));

  const salvo = JSON.parse(w.localStorage.getItem('mt_favoritos'));
  check('favorito persistido no localStorage', !!salvo && salvo['agachamento_sumo'] === true);

  $('ex-options').querySelector('[data-star="agachamento_sumo"]').click();
  await wait(20);
  check('desfavoritar remove do estado', !MT.favoritos['agachamento_sumo']);

  console.log('\n== dois toques: recente aparece direto e escolhe o exercicio ==');
  const recente = $('ex-options').querySelector('.opt[data-v="agachamento_sumo"]');
  check('exercicio recente clicavel sem digitar nada', !!recente);
  recente.click();
  await wait(30);
  check('sheet fecha ao escolher', !$('sheet-backdrop').classList.contains('show'));
  check('exercicio foi adicionado a sessao', w.MT.session.items.some(it => it.ex === 'agachamento_sumo'));

  console.log('\n== reabrir o seletor varias vezes nao acumula handler de clique (regressao) ==');
  // sheet-body e o campo de busca sao elementos persistentes: so o innerHTML
  // e trocado a cada abertura, o elemento em si continua o mesmo. se o codigo
  // usasse addEventListener em vez de atribuicao (.onclick/.oninput), cada
  // abertura empilharia mais um handler e um unico clique na estrela
  // dispararia Store.set('favoritos') uma vez por handler acumulado.
  for(let i = 0; i < 5; i++){
    $('exlist').querySelector('[data-addex]').click();
    await wait(20);
    $('sheet-body').querySelector('.closebtn').click();
    await wait(10);
  }
  $('exlist').querySelector('[data-addex]').click();
  await wait(30);
  check('sem favorito no supino reto ainda', !MT.favoritos['supino_reto']);
  const estrelaSupino = $('ex-options').querySelector('[data-star="supino_reto"]');
  check('estrela do supino reto aparece na lista completa', !!estrelaSupino);
  w.__contadorFav = 0;
  estrelaSupino.click();
  await wait(20);
  check('um unico clique dispara Store.set("favoritos") exatamente uma vez, mesmo depois de reabrir 5x', w.__contadorFav === 1);
  check('favoritar funciona depois de reabrir o seletor varias vezes', MT.favoritos['supino_reto'] === true);
  w.__contadorFav = 0;
  $('ex-options').querySelector('[data-star="supino_reto"]').click();
  await wait(20);
  check('desfavoritar tambem dispara Store.set uma unica vez', w.__contadorFav === 1);
  check('desfavoritar tambem funciona depois de reabrir varias vezes', !MT.favoritos['supino_reto']);

  console.log('\n' + (fails ? fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
