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
  if(storage) for(const k of Object.keys(storage)) w.localStorage.setItem(k, storage[k]);
  w.eval(js);
  return w;
}
const wait = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const check = (label, cond) => { if(!cond) fails++; console.log((cond ? '  ok   ' : '  FALHA') + '  ' + label); };

(async () => {
  const w = boot();
  const $ = id => w.document.getElementById(id);
  const cards = () => [...$('exlist').querySelectorAll('.excard[data-uid]')];
  const nomes = () => cards().map(c => c.querySelector('.exname').textContent);
  const uidAt = pos => cards()[pos].dataset.uid;
  const abrirEdicao = async () => {
    $('daylist').querySelector('[data-open="lowerA"]').click();
    await wait(20);
    $('btn-editprog').click();
    await wait(20);
  };
  await wait(120);

  console.log('\n== abrir previa e entrar em edicao ==');
  $('daylist').querySelector('[data-open="lowerA"]').click();
  await wait(20);
  check('botao editar treino aparece na previa', $('btn-editprog').style.display !== 'none');
  const baseCount = w.MT.program.find(d => d.key === 'lowerA').items.length;

  $('btn-editprog').click();
  await wait(20);
  check('barra de edicao aparece', $('editbar').style.display === 'flex');
  check('barra de comecar some', $('startbar').style.display === 'none');
  check('cards de edicao carregam os exercicios do dia', cards().length === baseCount);
  const ordemOriginal = nomes();

  console.log('\n== reordenar ==');
  const primeiroNome = ordemOriginal[0];
  $('card-' + uidAt(0)).querySelector('[data-move="' + uidAt(0) + '|1"]').click();
  await wait(20);
  check('exercicio desceu uma posicao', nomes()[1] === primeiroNome);
  check('nome do segundo lugar agora e o antigo primeiro', nomes()[1] === ordemOriginal[0]);

  console.log('\n== ajustar series, reps e descanso ==');
  const duracaoInicial = $('sess-timer').textContent;
  const alvoUid = uidAt(0);
  const seriesAntes = +$('card-' + alvoUid).querySelector('.editval').textContent;
  $('card-' + alvoUid).querySelector('[data-addset="' + alvoUid + '"]').click();
  await wait(20);
  check('series aumentaram', +$('card-' + alvoUid).querySelector('.editval').textContent === seriesAntes + 1);

  const repsInput = $('card-' + alvoUid).querySelector('[data-editreps="' + alvoUid + '"]');
  repsInput.value = '20-25';
  repsInput.dispatchEvent(new w.Event('input', {bubbles:true}));
  await wait(20);

  const restBtn = $('card-' + alvoUid).querySelector('[data-restep="' + alvoUid + '|15"]');
  restBtn.click();
  await wait(20);
  check('duracao estimada recalcula ao mudar series/descanso', $('sess-timer').textContent !== duracaoInicial);

  console.log('\n== cancelar descarta tudo ==');
  $('btn-canceledit').click();
  await wait(30);
  check('pede confirmacao porque houve mudanca', $('sheet-body').textContent.includes('Descartar'));
  $('sheet-body').querySelector('[data-r="1"]').click();
  await wait(30);
  check('voltou pra home', $('screen-home').classList.contains('active'));
  check('nao gravou overrides', !w.MT.overrides.lowerA);
  check('home nao marca como personalizado', !$('daylist').textContent.includes('personalizado'));

  await abrirEdicao();
  check('ordem original preservada apos cancelar', JSON.stringify(nomes()) === JSON.stringify(ordemOriginal));

  console.log('\n== cancelar sem mudanca nao pede confirmacao ==');
  $('btn-canceledit').click();
  await wait(30);
  check('nao abriu folha de confirmacao', !$('sheet-backdrop').classList.contains('show'));
  check('voltou pra home direto', $('screen-home').classList.contains('active'));

  console.log('\n== salvar grava em overrides sem tocar no historico ==');
  await abrirEdicao();
  $('card-' + uidAt(0)).querySelector('[data-move="' + uidAt(0) + '|1"]').click();
  await wait(20);
  const ordemSalva = nomes();
  $('btn-saveedit').click();
  await wait(30);
  check('voltou pra home', $('screen-home').classList.contains('active'));
  check('home marca como personalizado', $('daylist').textContent.includes('personalizado'));
  check('overrides gravado com a nova ordem', Array.isArray(w.MT.overrides.lowerA) && w.MT.overrides.lowerA.length === baseCount);
  check('programa base nao foi tocado', w.MT.program.find(d => d.key === 'lowerA').items.length === baseCount);
  check('historico continua vazio', w.MT.history.length === 0);
  const ovrArmazenado = JSON.parse(w.localStorage.getItem('mt_overrides'));
  check('overrides persistido no localStorage', !!ovrArmazenado && ovrArmazenado.lowerA.length === baseCount);

  await abrirEdicao();
  check('previa reabre ja com a ordem salva', JSON.stringify(nomes()) === JSON.stringify(ordemSalva));
  $('btn-canceledit').click();
  await wait(20);

  console.log('\n== nao deixa excluir o ultimo exercicio ==');
  await abrirEdicao();
  for(let i = 0; i < baseCount - 1; i++){
    const rm = $('exlist').querySelector('[data-remove]');
    rm.click();
    await wait(15);
  }
  check('restou exatamente 1 exercicio', cards().length === 1);
  check('botao excluir some quando so resta 1', !$('exlist').querySelector('[data-remove]'));

  console.log('\n' + (fails ? fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
