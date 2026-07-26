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
  w.caches = {keys: () => Promise.resolve([])};
  if(storage) for(const k of Object.keys(storage)) w.localStorage.setItem(k, storage[k]);
  w.eval(js);
  return w;
}
const wait = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const check = (label, cond) => { if(!cond) fails++; console.log((cond ? '  ok   ' : '  FALHA') + '  ' + label); };
const perto = (a, b, tol) => Math.abs(a - b) < (tol || 0.05);

(async () => {
  const w = boot();
  const $ = id => w.document.getElementById(id);
  await wait(120);

  console.log('\n== calcularSaude (funcao pura) ==');
  check('sem idade retorna null', w.MT.saude({idade:'', altura:'180', peso:'80', sexo:'masculino'}) === null);
  check('sem altura retorna null', w.MT.saude({idade:'30', altura:'', peso:'80', sexo:'masculino'}) === null);
  check('sem peso retorna null', w.MT.saude({idade:'30', altura:'180', peso:'', sexo:'masculino'}) === null);

  const homem = w.MT.saude({idade:'30', altura:'180', peso:'80', sexo:'masculino'});
  check('imc do homem calculado certo', perto(homem.imc, 24.69, 0.01));
  check('classificacao peso saudavel', homem.imcLabel === 'peso saudável');
  check('faixa de peso saudavel calculada certo', perto(homem.pesoMin, 59.94, 0.01) && perto(homem.pesoMax, 80.68, 0.01));
  check('tmb masculino (mifflin +5) certo', perto(homem.tmb, 1780, 0.5));
  check('tmb de referencia usa peso do meio da faixa', perto(homem.tmbSaudavel, 1683.08, 0.5));

  const mulher = w.MT.saude({idade:'25', altura:'165', peso:'60', sexo:'feminino'});
  check('tmb feminino (mifflin -161) certo', perto(mulher.tmb, 1345.25, 0.5));

  const semSexo = w.MT.saude({idade:'40', altura:'170', peso:'90', sexo:''});
  check('imc alto classifica como obesidade', semSexo.imcLabel === 'obesidade');
  check('sem sexo usa media das constantes', perto(semSexo.tmb, 1684.5, 0.5));

  const limite = w.MT.saude({idade:'30', altura:'100', peso:'18.5', sexo:'masculino'});
  check('imc exatamente 18.5 conta como peso saudavel, nao abaixo do peso', limite.imcLabel === 'peso saudável');

  console.log('\n== painel na tela de Dados corporais ==');
  $('nav-settings').click();
  await wait(20);
  $('btn-corpo').click();
  await wait(40);
  check('painel de resultados comeca vazio sem dados', $('c-resultados').innerHTML.trim() === '');

  $('c-idade').value = '30';
  $('c-idade').dispatchEvent(new w.Event('input', {bubbles:true}));
  $('c-altura').value = '180';
  $('c-altura').dispatchEvent(new w.Event('input', {bubbles:true}));
  $('c-peso').value = '80';
  $('c-peso').dispatchEvent(new w.Event('input', {bubbles:true}));
  await wait(20);

  const texto = $('c-resultados').textContent;
  check('mostra o imc calculado', texto.includes('24,7') || texto.includes('IMC'));
  check('mostra a faixa de peso saudavel', texto.includes('kg'));
  check('mostra a tmb estimada', texto.includes('kcal/dia'));
  check('mostra o aviso de que nao substitui avaliacao profissional', texto.includes('não substituem avaliação'));

  $('sheet-body').querySelector('[data-sexo="masculino"]').click();
  await wait(20);
  check('resultado recalcula ao marcar sexo', $('c-resultados').textContent.includes('kcal/dia'));

  console.log('\n' + (fails ? fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
