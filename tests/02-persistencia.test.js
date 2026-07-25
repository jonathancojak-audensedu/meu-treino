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
  w.URL.createObjectURL = () => 'blob:teste';
  w.URL.revokeObjectURL = () => {};
  if(storage) for(const k of Object.keys(storage)) w.localStorage.setItem(k, storage[k]);
  w.eval(js);
  return w;
}
const wait = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const check = (label, cond) => { if(!cond) fails++; console.log((cond ? '  ok   ' : '  FALHA') + '  ' + label); };

function touch(w, el, x, y){
  return new w.TouchEvent ? null : null;
}

(async () => {
  const w = boot();
  const $ = id => w.document.getElementById(id);
  const ev = (el, type) => el.dispatchEvent(new w.Event(type, {bubbles:true}));
  await wait(120);

  console.log('\n== autosave e retomada ==');
  $('daylist').querySelector('[data-open="upperA"]').click();
  await wait(20);
  $('btn-begin').click();
  await wait(20);
  const uid = $('exlist').querySelector('.excard[data-uid]').dataset.uid;
  const row = $('card-' + uid).querySelectorAll('.setrow')[0];
  const wi = row.querySelector('input[data-f="w"]'); wi.value = '70'; ev(wi, 'input');
  const ri = row.querySelector('input[data-f="r"]'); ri.value = '8'; ev(ri, 'input');
  $('card-' + uid).querySelector('[data-check="' + uid + '|0"]').click();
  await wait(420);

  const dump = {};
  for(const k of Object.keys(w.localStorage)) dump[k] = w.localStorage.getItem(k);
  check('sessao ativa gravada', !!dump['mt_active_session']);

  const w2 = boot(dump);
  const $2 = id => w2.document.getElementById(id);
  await wait(150);
  check('banner de retomar aparece', $2('resume').classList.contains('show'));
  check('banner cita Upper A', $2('resume-title').textContent.includes('Upper A'));
  $2('resume-go').click();
  await wait(40);
  check('sessao restaurada', $2('screen-session').classList.contains('active'));
  check('carga restaurada', $2('card-' + uid).querySelectorAll('input')[0].value === '70');
  check('volume restaurado', $2('sess-volume').textContent === '560 kg');
  check('serie continua marcada', $2('card-' + uid).querySelector('[data-check]').classList.contains('done'));

  console.log('\n== arrastar para excluir ==');
  const alvo = $('exlist').querySelectorAll('.excard[data-uid]')[2];
  const alvoUid = alvo.dataset.uid;
  const total = $('exlist').querySelectorAll('.excard[data-uid]').length;
  const mk = (type, x, y, target) => {
    const e = new w.Event(type, {bubbles:true, cancelable:true});
    e.touches = [{clientX:x, clientY:y}];
    Object.defineProperty(e, 'target', {value: target});
    return e;
  };
  const head = alvo.querySelector('.exname');
  $('exlist').dispatchEvent(mk('touchstart', 300, 400, head));
  $('exlist').dispatchEvent(mk('touchmove', 260, 402, head));
  $('exlist').dispatchEvent(mk('touchmove', 170, 404, head));
  check('card marcado para exclusao ao arrastar', alvo.classList.contains('willdelete'));
  $('exlist').dispatchEvent(mk('touchend', 170, 404, head));
  await wait(30);
  check('exercicio excluido pelo gesto', $('exlist').querySelectorAll('.excard[data-uid]').length === total - 1);
  check('nao existe mais o card arrastado', !$('card-' + alvoUid));
  check('toast de desfazer aparece', $('toast').textContent.includes('Desfazer'));

  console.log('\n== arrastar pouco nao exclui ==');
  const alvo2 = $('exlist').querySelectorAll('.excard[data-uid]')[1];
  const total2 = $('exlist').querySelectorAll('.excard[data-uid]').length;
  const head2 = alvo2.querySelector('.exname');
  $('exlist').dispatchEvent(mk('touchstart', 300, 400, head2));
  $('exlist').dispatchEvent(mk('touchmove', 260, 400, head2));
  $('exlist').dispatchEvent(mk('touchend', 260, 400, head2));
  await wait(20);
  check('arrasto curto nao exclui', $('exlist').querySelectorAll('.excard[data-uid]').length === total2);

  console.log('\n== rolagem vertical nao dispara exclusao ==');
  const alvo3 = $('exlist').querySelectorAll('.excard[data-uid]')[1];
  const total3 = $('exlist').querySelectorAll('.excard[data-uid]').length;
  const head3 = alvo3.querySelector('.exname');
  $('exlist').dispatchEvent(mk('touchstart', 300, 400, head3));
  $('exlist').dispatchEvent(mk('touchmove', 296, 340, head3));
  $('exlist').dispatchEvent(mk('touchmove', 292, 250, head3));
  $('exlist').dispatchEvent(mk('touchend', 292, 250, head3));
  await wait(20);
  check('rolar para cima nao exclui', $('exlist').querySelectorAll('.excard[data-uid]').length === total3);

  console.log('\n== backup ==');
  let baixou = null;
  const origCreate = w.document.createElement.bind(w.document);
  w.document.createElement = tag => {
    const el = origCreate(tag);
    if(tag === 'a') el.click = () => { baixou = el.download; };
    return el;
  };
  w.eval('exportBackup()');
  await wait(20);
  check('arquivo de backup nomeado por data', !!baixou && /^meu-treino-\d{4}-\d{2}-\d{2}\.json$/.test(baixou));

  console.log('\n' + (fails ? fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
