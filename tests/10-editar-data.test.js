const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path').join(__dirname, '..') + '/';
const html = fs.readFileSync(path + 'index.html', 'utf8');
const js = fs.readFileSync(path + 'app.js', 'utf8');

const dias = n => new Date(Date.now() - n * 86400000);
const iso = d => d.toISOString();

const HISTORICO = [
  {id:'h1', name:'Superiores A', tag:'DIA 1', block:'a', date: iso(dias(0)), duration:600, volume:900, setsDone:3, exercises:[]},
  {id:'h2', name:'Inferiores A', tag:'DIA 2', block:'a', date: iso(dias(5)), duration:600, volume:800, setsDone:3, exercises:[]},
  {id:'h3', name:'Superiores B', tag:'DIA 3', block:'a', date: iso(dias(10)), duration:600, volume:700, setsDone:3, exercises:[]}
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
  const $ = id => w.document.getElementById(id);
  await wait(120);

  console.log('\n== abrir edicao de data ==');
  $('nav-history').click();
  await wait(20);
  $('histlist').querySelector('[data-hist="h2"]').click();
  await wait(20);
  $('histlist').querySelector('[data-editdata="h2"]').click();
  await wait(30);
  check('folha de edicao abre', $('sheet-backdrop').classList.contains('show'));
  check('campo de data existe', !!$('ed-data'));
  check('campo de hora existe', !!$('ed-hora'));

  const dOriginal = new Date(w.MT.history.find(h => h.id === 'h2').date);
  const pad = n => String(n).padStart(2, '0');
  check('data pre-preenchida com o valor atual', $('ed-data').value === dOriginal.getFullYear() + '-' + pad(dOriginal.getMonth()+1) + '-' + pad(dOriginal.getDate()));

  console.log('\n== salvar nova data reordena o historico ==');
  // h2 tinha 5 dias atras; movendo pra 20 dias atras ela deve virar a mais antiga
  const novaData = dias(20);
  $('ed-data').value = novaData.getFullYear() + '-' + pad(novaData.getMonth()+1) + '-' + pad(novaData.getDate());
  $('ed-data').dispatchEvent(new w.Event('input', {bubbles:true}));
  $('ed-hora').value = '08:00';
  $('ed-hora').dispatchEvent(new w.Event('input', {bubbles:true}));
  $('ed-salvar').click();
  await wait(50);

  check('folha fecha depois de salvar', !$('sheet-backdrop').classList.contains('show'));
  const ordemDepois = w.MT.history.map(h => h.id);
  check('h2 virou o mais antigo (ultima posicao)', ordemDepois[ordemDepois.length - 1] === 'h2');
  check('h1 continua o mais recente', ordemDepois[0] === 'h1');
  const h2Depois = w.MT.history.find(h => h.id === 'h2');
  check('hora salva corretamente', new Date(h2Depois.date).getHours() === 8);

  console.log('\n== nao deixa salvar data no futuro ==');
  $('histlist').querySelector('[data-hist="h1"]').click();
  await wait(20);
  $('histlist').querySelector('[data-editdata="h1"]').click();
  await wait(30);
  const futuro = new Date(Date.now() + 5 * 86400000);
  const maxAttr = $('ed-data').getAttribute('max');
  check('input de data tem max de hoje (bloqueia futuro na UI)', !!maxAttr);
  // forca um valor invalido direto no input pra testar a validacao em JS tambem
  $('ed-data').value = futuro.getFullYear() + '-' + pad(futuro.getMonth()+1) + '-' + pad(futuro.getDate());
  $('ed-hora').value = '10:00';
  const antesDoSalvar = JSON.stringify(w.MT.history);
  $('ed-salvar').click();
  await wait(30);
  check('nao gravou a data futura', JSON.stringify(w.MT.history) === antesDoSalvar);

  console.log('\n' + (fails ? fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
