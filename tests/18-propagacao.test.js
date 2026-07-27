const { boot, wait, criarCheck, seletor } = require('./_helpers');
const check = criarCheck();

(async () => {
  const w = await boot();
  const $ = seletor(w);
  const ev = (el, type) => el.dispatchEvent(new w.Event(type, {bubbles:true}));

  $('daylist').querySelector('[data-open="lowerA"]').click();
  await wait(20);
  $('btn-begin').click();
  await wait(20);

  const uid = w.MT.session.items[0].uid; // agachamento, 4 series
  const card = () => $('card-' + uid);
  const rows = () => card().querySelectorAll('.setrow');
  const wInput = s => rows()[s].querySelector('input[data-f="w"]');
  const rInput = s => rows()[s].querySelector('input[data-f="r"]');

  console.log('\n== digitar na serie 1 propaga pra frente, nunca pra tras ==');
  const w0 = wInput(0); w0.value = '100'; ev(w0, 'input');
  const r0 = rInput(0); r0.value = '10'; ev(r0, 'input');
  await wait(10);
  check('serie 2 recebeu a carga', wInput(1).value === '100');
  check('serie 2 recebeu as reps', rInput(1).value === '10');
  check('serie 3 recebeu a carga', wInput(2).value === '100');
  check('serie 4 recebeu a carga', wInput(3).value === '100');
  check('serie 2 marcada como automatica (dim)', wInput(1).classList.contains('auto'));
  check('serie 1 (digitada) nao fica marcada como automatica', !w0.classList.contains('auto'));
  check('log guarda o flag autoW nas series propagadas', w.MT.session.log[uid][1].autoW === true);
  check('log nao marca autoW na serie digitada', w.MT.session.log[uid][0].autoW === false);

  console.log('\n== edicao manual de uma serie do meio trava ela, mas nao interrompe a propagacao ==');
  const r1 = rInput(1); r1.value = '8'; ev(r1, 'input');
  await wait(10);
  check('serie 2 nao fica mais marcada como automatica', !rInput(1).classList.contains('auto'));
  check('log marca a serie 2 como editada a mao', w.MT.session.log[uid][1].autoR === false);

  const r0b = rInput(0); r0b.value = '12'; ev(r0b, 'input');
  await wait(10);
  check('serie 2 (editada a mao) nao foi sobrescrita', rInput(1).value === '8');
  check('serie 3 continua recebendo a propagacao mesmo com a 2 travada', rInput(2).value === '12');
  check('serie 4 continua recebendo a propagacao mesmo com a 2 travada', rInput(3).value === '12');

  console.log('\n== serie concluida nunca e alterada pela propagacao ==');
  $('card-' + uid).querySelector('[data-check="' + uid + '|2"]').click();
  await wait(10);
  check('serie 3 marcada como concluida', w.MT.session.log[uid][2].done === true);
  const w0c = wInput(0); w0c.value = '140'; ev(w0c, 'input');
  await wait(10);
  check('serie 3 (concluida) preserva a carga antiga', w.MT.session.log[uid][2].w === '100');
  check('serie 4 (nao concluida) recebe a nova carga', w.MT.session.log[uid][3].w === '140');

  console.log('\n== o stepper de reps tambem propaga e trava a serie editada ==');
  const uid2 = w.MT.session.items[1].uid; // leg_press, 3 series
  $('card-' + uid2).querySelector('[data-step="' + uid2 + '|0|1"]').click();
  await wait(10);
  const r2Series1 = $('card-' + uid2).querySelectorAll('.setrow')[1].querySelector('input[data-f="r"]');
  check('stepper propagou pra serie seguinte', r2Series1.value === w.MT.session.log[uid2][0].r);
  check('serie seguinte marcada como automatica', r2Series1.classList.contains('auto'));

  console.log('\n== resumo do treino conclui normalmente sem a copia antiga ao marcar serie ==');
  const uid3 = w.MT.session.items[2].uid;
  $('card-' + uid3).querySelector('[data-check="' + uid3 + '|0"]').click();
  await wait(10);
  check('marcar serie sem ter digitado nada antes fica em branco (sem copia automatica antiga)', w.MT.session.log[uid3][0].w === '');

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
