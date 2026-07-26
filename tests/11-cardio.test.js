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

(async () => {
  const w = boot();
  const MT = w.MT;
  const isCardio = id => MT.EX[id] && MT.EX[id].type === 'cardio';

  console.log('\n== emagrecer recebe cardio em pelo menos metade dos dias ==');
  for(const dias of [2,3,4,5,6]){
    for(const local of ['academia','simples','casa','corpo']){
      const prog = MT.gerar({experiencia:'intermediario', dias, tempo:60, local, objetivo:'emagrecer', dores:[], prioridade:[], nome:'T'});
      const comCardio = prog.filter(d => d.items.some(it => isCardio(it.ex))).length;
      check(dias + 'd/' + local + ': ' + comCardio + '/' + prog.length + ' dias com cardio (>= metade)', comCardio >= prog.length / 2);
    }
  }

  console.log('\n== saude tambem recebe cardio ==');
  const progSaude = MT.gerar({experiencia:'intermediario', dias:4, tempo:60, local:'academia', objetivo:'saude', dores:[], prioridade:[], nome:'T'});
  check('todo dia de saude tem cardio', progSaude.every(d => d.items.some(it => isCardio(it.ex))));

  console.log('\n== forca e hipertrofia nao recebem cardio automatico ==');
  ['forca','hipertrofia'].forEach(objetivo => {
    for(const dias of [2,3,4,5,6]){
      const prog = MT.gerar({experiencia:'intermediario', dias, tempo:60, local:'academia', objetivo, dores:[], prioridade:[], nome:'T'});
      const algumCardio = prog.some(d => d.items.some(it => isCardio(it.ex)));
      check(objetivo + ' ' + dias + 'd nunca recebe cardio automatico', !algumCardio);
    }
  });

  console.log('\n== cardio sempre e o ultimo exercicio do dia ==');
  ['emagrecer','saude'].forEach(objetivo => {
    for(const tempo of [30,45,60,90]){
      const prog = MT.gerar({experiencia:'intermediario', dias:4, tempo, local:'academia', objetivo, dores:[], prioridade:[], nome:'T'});
      prog.forEach(dia => {
        const idxCardio = dia.items.findIndex(it => isCardio(it.ex));
        if(idxCardio === -1) return; // dia sem cardio nao se aplica aqui, ja coberto no bloco anterior
        check(objetivo + ' ' + tempo + 'min ' + dia.name + ': cardio e o ultimo', idxCardio === dia.items.length - 1);
      });
    }
  });

  console.log('\n== sem academia, cardio usa corda/caminhada (equipamento corpo) ==');
  ['casa','corpo'].forEach(local => {
    const prog = MT.gerar({experiencia:'intermediario', dias:3, tempo:60, local, objetivo:'emagrecer', dores:[], prioridade:[], nome:'T'});
    prog.forEach(dia => {
      const cardioItem = dia.items.find(it => isCardio(it.ex));
      if(!cardioItem) return;
      check(local + ': cardio escolhido (' + cardioItem.ex + ') so exige equipamento corpo', MT.META[cardioItem.ex].e.every(eq => eq === 'corpo'));
    });
  });

  console.log('\n== duracao do cardio entra no orcamento sem estourar o tempo ==');
  ['emagrecer','saude'].forEach(objetivo => {
    for(const tempo of [30,45,60,90]){
      const prog = MT.gerar({experiencia:'avancado', dias:6, tempo, local:'academia', objetivo, dores:[], prioridade:[], nome:'T'});
      prog.forEach(dia => {
        const est = MT.tempo(dia.items);
        check(objetivo + ' ' + tempo + 'min ' + dia.name + ' cabe no tempo (' + Math.round(est/60) + 'min)', est <= tempo * 60 * 1.12);
      });
    }
  });

  console.log('\n== sessao real: cardio nao entra no volume em kg ==');
  const progReal = MT.gerar({experiencia:'intermediario', dias:3, tempo:60, local:'casa', objetivo:'emagrecer', dores:[], prioridade:[], nome:'T'});
  const w2 = boot({mt_program: JSON.stringify(progReal)});
  const $ = id => w2.document.getElementById(id);
  await wait(120);

  $('daylist').querySelector('[data-open="d1"]').click();
  await wait(20);
  $('btn-begin').click();
  await wait(20);

  const cardioUid = w2.MT.session.items.find(it => isCardio(it.ex)).uid;
  const cardioCard = $('card-' + cardioUid);
  const inputR = cardioCard.querySelector('input[data-f="r"]');
  const inputW = cardioCard.querySelector('input[data-f="w"]');
  check('cardio nao tem campo de carga preenchido por padrao', inputW.value === '');
  inputR.value = '20';
  inputR.dispatchEvent(new w2.window.Event('input', {bubbles:true}));
  await wait(20);

  const checkBtn = cardioCard.querySelector('[data-check="' + cardioUid + '|0"]');
  checkBtn.click();
  await wait(20);
  check('marcar cardio como feito nao abre o timer de descanso', !$('resttimer').classList.contains('show'));

  $('btn-finish').click();
  await wait(80);

  const entry = w2.MT.history[0];
  check('treino foi pro historico', !!entry);
  check('volume em kg fica zero (so cardio sem carga concluido)', entry.volume === 0);
  check('cardioMin registra os 20 minutos', entry.cardioMin === 20);
  check('historico mostra o tile de cardio separado do volume', $('histlist').textContent.includes('20 min') && $('histlist').textContent.includes('Cardio'));

  console.log('\n' + (fails ? fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
