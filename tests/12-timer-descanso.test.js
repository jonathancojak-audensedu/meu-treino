const { boot, wait, criarCheck, seletor } = require('./_helpers');
const check = criarCheck();

(async () => {
  const w = await boot();
  const $ = seletor(w);

  console.log('\n== elementos do timer redesenhado existem ==');
  check('barra de progresso existe', !!$('restbarfill'));
  check('area clicavel de expandir existe', !!$('rest-tap'));
  check('botao -15s existe', !!$('rest-sub') && $('rest-sub').textContent === '-15s');
  check('botao +15s existe', !!$('rest-add') && $('rest-add').textContent === '+15s');
  check('botao pular existe', !!$('rest-skip') && $('rest-skip').textContent === 'Pular');
  check('linha da proxima serie existe', !!$('rest-next'));

  const alturaBtn = h => parseInt(w.getComputedStyle(h).height, 10);
  check('botao -15s tem 44px de toque', alturaBtn($('rest-sub')) === 44);
  check('botao +15s tem 44px de toque', alturaBtn($('rest-add')) === 44);
  check('botao pular tem 44px de toque', alturaBtn($('rest-skip')) === 44);

  console.log('\n== iniciar treino e descansar mostra exercicio e proxima serie ==');
  $('daylist').querySelector('[data-open="lowerA"]').click();
  await wait(20);
  $('btn-begin').click();
  await wait(20);
  const uid = $('exlist').querySelector('.excard[data-uid]').dataset.uid;
  $('card-' + uid).querySelector('[data-check="' + uid + '|0"]').click();
  await wait(30);

  check('timer aparece', $('resttimer').classList.contains('show'));
  check('mostra nome do exercicio', $('rest-exname').textContent.length > 0);
  check('mostra a proxima serie (2 de N)', /Série 2 de \d/.test($('rest-next').textContent));
  check('barra de progresso comeca cheia', parseInt($('restbarfill').style.width, 10) >= 95);

  console.log('\n== expandir e recolher tela cheia ==');
  check('comeca recolhido', !$('resttimer').classList.contains('expanded'));
  $('rest-tap').click();
  check('expande ao tocar', $('resttimer').classList.contains('expanded'));
  $('rest-tap').click();
  check('recolhe ao tocar de novo', !$('resttimer').classList.contains('expanded'));

  console.log('\n== -15s e +15s ajustam o relogio de termino ==');
  const antes = w.MT.session.rest.endsAt;
  $('rest-sub').click();
  await wait(10);
  check('-15s reduz o horario de termino', w.MT.session.rest.endsAt === antes - 15000);
  $('rest-add').click();
  await wait(10);
  check('+15s devolve o horario original', w.MT.session.rest.endsAt === antes);

  console.log('\n== destaque nos ultimos 10 segundos (nao mais 5) ==');
  // deixa o setInterval real (a cada 250ms) recalcular, em vez de chamar
  // tickRest direto: a funcao e interna do modulo de sessao, nao exposta
  w.MT.session.rest.endsAt = Date.now() + 10000;
  await wait(260);
  check('10s restantes ja ativa o destaque', $('resttimer').classList.contains('ending'));
  w.MT.session.rest.endsAt = Date.now() + 30000;
  await wait(260);
  check('30s restantes nao ativa o destaque', !$('resttimer').classList.contains('ending'));

  console.log('\n== marcar a ultima serie avisa que acabou ==');
  const item = w.MT.session.items.find(i => i.uid === uid);
  for(let s = 1; s < item.sets; s++){
    $('card-' + uid).querySelector('[data-check="' + uid + '|' + s + '"]').click();
    await wait(15);
  }
  check('ultima serie mostra aviso proprio', $('rest-next').textContent === 'Última série feita');

  console.log('\n== pular fecha e recolhe, sem deixar preso no modo tela cheia ==');
  $('rest-tap').click();
  await wait(10);
  check('expandiu antes de pular', $('resttimer').classList.contains('expanded'));
  $('rest-skip').click();
  await wait(10);
  check('pular esconde o timer', !$('resttimer').classList.contains('show'));
  check('pular tambem recolhe a tela cheia', !$('resttimer').classList.contains('expanded'));

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
