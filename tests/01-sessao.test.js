const { boot, wait, criarCheck, seletor } = require('./_helpers');
const check = criarCheck();

(async () => {
  const w = await boot();
  const $ = seletor(w);
  const ev = (el, type) => el.dispatchEvent(new w.Event(type, {bubbles:true}));

  console.log('\n== item 3: iniciar e editar exercicios ==');
  $('daylist').querySelector('[data-open="lowerA"]').click();
  await wait(20);
  $('btn-begin').click();
  await wait(20);
  const uids = [...$('exlist').querySelectorAll('.excard[data-uid]')].map(c => c.dataset.uid);
  check('6 exercicios na sessao', uids.length === 6);
  check('botao de adicionar exercicio existe', !!$('exlist').querySelector('[data-addex]'));

  console.log('\n== item 1: reordenar ==');
  const primeiroNome = $('card-' + uids[0]).querySelector('.exname').textContent;
  $('card-' + uids[0]).querySelector('[data-move="' + uids[0] + '|1"]').click();
  await wait(20);
  const novaOrdem = [...$('exlist').querySelectorAll('.excard[data-uid]')].map(c => c.dataset.uid);
  check('exercicio desceu uma posicao', novaOrdem[1] === uids[0]);
  check('nome preservado apos mover', $('card-' + uids[0]).querySelector('.exname').textContent === primeiroNome);
  $('card-' + uids[0]).querySelector('[data-move="' + uids[0] + '|-1"]').click();
  await wait(20);
  check('voltou para o topo', [...$('exlist').querySelectorAll('.excard[data-uid]')][0].dataset.uid === uids[0]);

  console.log('\n== item 1: buscar exercicio semelhante ==');
  $('card-' + uids[0]).querySelector('[data-swap]').click();
  await wait(40);
  check('folha de busca abriu', $('sheet-backdrop').classList.contains('show'));
  check('campo de busca presente', !!$('ex-search'));
  check('mostra alternativas sugeridas', $('sheet-body').textContent.includes('Alternativas sugeridas'));
  $('ex-search').value = 'leg';
  ev($('ex-search'), 'input');
  await wait(10);
  const hits = [...$('ex-options').querySelectorAll('.opt')].map(o => o.textContent);
  check('busca por "leg" acha o leg press', hits.some(h => h.includes('Leg press')));
  $('ex-search').value = 'peito';
  ev($('ex-search'), 'input');
  await wait(10);
  check('busca por grupo muscular funciona', $('ex-options').querySelectorAll('.opt').length >= 5);
  $('ex-search').value = 'agachamento sumo com kettlebell';
  ev($('ex-search'), 'input');
  await wait(10);
  check('oferece criar exercicio novo quando nao acha', !!$('ex-options').querySelector('[data-new]'));
  $('ex-search').value = 'smith';
  ev($('ex-search'), 'input');
  await wait(10);
  $('ex-options').querySelector('.optselect').click();
  await wait(40);
  check('exercicio trocado', $('card-' + uids[0]).querySelector('.exname').textContent.includes('Smith'));

  console.log('\n== item 5: campos so aceitam numero ==');
  const inputs = $('card-' + uids[0]).querySelectorAll('input');
  check('carga com teclado decimal', inputs[0].getAttribute('inputmode') === 'decimal' && inputs[0].type === 'number');
  check('reps com teclado numerico', inputs[1].getAttribute('inputmode') === 'numeric' && inputs[1].type === 'number');
  let blocked = false;
  const kev = new w.KeyboardEvent('keydown', {key:'e', bubbles:true, cancelable:true});
  inputs[1].dispatchEvent(kev);
  blocked = kev.defaultPrevented;
  check('letra e bloqueada no campo de reps', blocked);
  const kev2 = new w.KeyboardEvent('keydown', {key:'7', bubbles:true, cancelable:true});
  inputs[1].dispatchEvent(kev2);
  check('numero passa normalmente', !kev2.defaultPrevented);

  console.log('\n== item 3: + para aumentar repeticoes ==');
  const card0 = () => $('card-' + uids[0]);
  card0().querySelector('[data-step="' + uids[0] + '|0|1"]').click();
  await wait(10);
  let repInput = card0().querySelectorAll('.setrow')[0].querySelector('input[data-f="r"]');
  check('primeiro toque preenche com o alvo (6)', repInput.value === '6');
  card0().querySelector('[data-step="' + uids[0] + '|0|1"]').click();
  await wait(10);
  repInput = card0().querySelectorAll('.setrow')[0].querySelector('input[data-f="r"]');
  check('segundo toque soma 1 (7)', repInput.value === '7');
  card0().querySelector('[data-step="' + uids[0] + '|0|-1"]').click();
  await wait(10);
  repInput = card0().querySelectorAll('.setrow')[0].querySelector('input[data-f="r"]');
  check('menos volta para 6', repInput.value === '6');

  console.log('\n== item 2 e 4: descanso por relogio ==');
  const wIn = card0().querySelectorAll('.setrow')[0].querySelector('input[data-f="w"]');
  wIn.value = '100'; ev(wIn, 'input');
  card0().querySelector('[data-check="' + uids[0] + '|0"]').click();
  await wait(30);
  check('timer de descanso apareceu', $('resttimer').classList.contains('show'));
  const restStart = parseInt($('ringtext').textContent, 10);
  check('descanso comeca em 150s', restStart >= 148 && restStart <= 150);
  // simula 100 segundos em segundo plano mexendo no horario de termino, depois
  // dispara um foco real (resync esta pendurado em window 'focus')
  w.MT.session.rest.endsAt = Date.now() + 50000; w.MT.session.startedAt = Date.now() - 600000;
  w.dispatchEvent(new w.Event('focus'));
  await wait(10);
  check('descanso recalculado pelo relogio', parseInt($('ringtext').textContent, 10) === 50);
  check('duracao recalculada pelo relogio', $('sess-timer').textContent === '10:00');
  w.MT.session.rest.endsAt = Date.now() - 10;
  await wait(260); // deixa o setInterval real (250ms) do descanso perceber o fim
  check('descanso encerra sozinho', !$('resttimer').classList.contains('show'));
  check('vibracao disponivel no fim', typeof w.navigator.vibrate === 'function');

  console.log('\n== item 7: destaque do exercicio concluido ==');
  for(let s = 1; s < 4; s++){
    const row = card0().querySelectorAll('.setrow')[s];
    const wi = row.querySelector('input[data-f="w"]'); wi.value = '100'; ev(wi, 'input');
    const ri = row.querySelector('input[data-f="r"]'); ri.value = '6'; ev(ri, 'input');
    card0().querySelector('[data-check="' + uids[0] + '|' + s + '"]').click();
    await wait(10);
  }
  check('card marcado como concluido', card0().classList.contains('done'));
  check('mostra selo de concluido', card0().querySelector('.doneflag') !== null);
  const resumo = card0().querySelector('.exsummary');
  check('resumo do que foi feito aparece', !!resumo && resumo.textContent.includes('100×6'));
  check('resumo lista as 4 series', resumo.querySelectorAll('span').length === 4);

  console.log('\n== item 3: excluir exercicio e desfazer ==');
  const antes = $('exlist').querySelectorAll('.excard[data-uid]').length;
  $('card-' + uids[3]).querySelector('[data-remove]').click();
  await wait(30);
  // excluir exercicio inteiro passa por confirmacao desde que um testador
  // apagou um exercicio achando que tirava so uma serie
  check('pede confirmacao antes de excluir', $('sheet-backdrop').classList.contains('show'));
  $('sheet-body').querySelector('[data-r="1"]').click();
  await wait(30);
  check('exercicio removido', $('exlist').querySelectorAll('.excard[data-uid]').length === antes - 1);
  check('toast oferece desfazer', $('toast').textContent.includes('Desfazer'));
  $('toast-act').click();
  await wait(20);
  check('desfazer devolve o exercicio', $('exlist').querySelectorAll('.excard[data-uid]').length === antes);
  check('exercicio volta na mesma posicao', [...$('exlist').querySelectorAll('.excard[data-uid]')][3].dataset.uid === uids[3]);

  console.log('\n== item 3: adicionar exercicio ==');
  $('exlist').querySelector('[data-addex]').click();
  await wait(40);
  $('ex-search').value = 'face pull';
  ev($('ex-search'), 'input');
  await wait(10);
  $('ex-options').querySelector('.optselect').click();
  await wait(40);
  check('exercicio adicionado ao fim', $('exlist').querySelectorAll('.excard[data-uid]').length === antes + 1);
  check('novo exercicio e o face pull', [...$('exlist').querySelectorAll('.exname')].pop().textContent.includes('Face pull'));

  console.log('\n== finalizar e salvar montagem ==');
  $('btn-finish').click();
  await wait(120);
  check('perguntou se salva a nova montagem', $('sheet-body').textContent.includes('Salvar essa montagem'));
  $('sheet-body').querySelector('[data-r="1"]').click();
  await wait(80);
  const ovr = JSON.parse(w.localStorage.getItem('mt_overrides'));
  check('montagem salva como padrao', !!ovr && ovr.lowerA.length === antes + 1);
  check('home marca o treino como personalizado', $('daylist').textContent.includes('personalizado'));

  console.log('\n== item 6: treino livre ==');
  $('daylist').querySelector('[data-free]').click();
  await wait(50);
  check('seletor abre direto no treino livre', $('sheet-backdrop').classList.contains('show'));
  $('ex-search').value = 'rosca martelo';
  ev($('ex-search'), 'input');
  await wait(10);
  $('ex-options').querySelector('.optselect').click();
  await wait(50);
  check('treino livre criado', $('sess-name').textContent === 'Treino livre');
  check('com o exercicio escolhido', $('exlist').textContent.includes('Rosca martelo'));
  check('aquecimento escondido no livre', $('sess-warmup').style.display === 'none');

  const luid = $('exlist').querySelector('.excard[data-uid]').dataset.uid;
  const lrow = $('card-' + luid).querySelectorAll('.setrow')[0];
  const lw = lrow.querySelector('input[data-f="w"]'); lw.value = '14'; ev(lw, 'input');
  const lr = lrow.querySelector('input[data-f="r"]'); lr.value = '12'; ev(lr, 'input');
  $('card-' + luid).querySelector('[data-check="' + luid + '|0"]').click();
  await wait(20);
  $('btn-finish').click();
  await wait(120);

  console.log('\n== item 6: double perfect no calendario ==');
  check('resumo mostra double perfect', $('sumwrap').textContent.includes('Double perfect'));
  $('nav-history').click();
  await wait(20);
  $('btn-calendar').click();
  await wait(30);
  const dourado = $('cal-grid').querySelector('.calday.double');
  check('dia aparece dourado', !!dourado);
  check('dia dourado tem estrela', !!dourado && !!dourado.querySelector('.star'));
  check('resumo do mes cita dia dourado', $('cal-summary').textContent.includes('dia dourado'));

  console.log('\n== navegacao de mes no calendario ==');
  const mesAtual = $('cal-monthlabel').textContent;
  $('cal-prev').click();
  await wait(20);
  check('mes anterior muda o rotulo do mes', $('cal-monthlabel').textContent !== mesAtual);
  check('mes anterior nao mostra o dia dourado de hoje', !$('cal-grid').querySelector('.calday.double'));
  $('cal-next').click();
  await wait(20);
  check('proximo mes volta a mostrar o mes atual', $('cal-monthlabel').textContent === mesAtual);
  check('dia dourado reaparece ao voltar pro mes atual', !!$('cal-grid').querySelector('.calday.double'));

  console.log('\n== persistencia entre sessoes ==');
  const dump = {};
  for(const k of Object.keys(w.localStorage)) dump[k] = w.localStorage.getItem(k);
  const w2 = await boot(dump);
  const $2 = seletor(w2);
  check('2 treinos no historico', $2('hist-sub').textContent.includes('2 treinos'));
  check('montagem personalizada carregou', $2('daylist').textContent.includes('personalizado'));
  $2('daylist').querySelector('[data-open="lowerA"]').click();
  await wait(30);
  check('previa abre com a montagem salva', $2('exlist').querySelectorAll('.excard').length === antes + 1);
  check('previa mostra o que foi feito', $2('exlist').textContent.includes('100kg x 6'));

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
