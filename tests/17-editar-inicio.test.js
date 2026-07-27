const { boot, wait, criarCheck, seletor } = require('./_helpers');
const check = criarCheck();

const pad = n => String(n).padStart(2, '0');
const dataDe = d => d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
const horaDe = d => pad(d.getHours()) + ':' + pad(d.getMinutes());

(async () => {
  const w = await boot();
  const $ = seletor(w);
  const ev = (el, type) => el.dispatchEvent(new w.Event(type, {bubbles:true}));

  console.log('\n== tocar no cronometro da sessao ativa abre edicao do inicio ==');
  $('daylist').querySelector('[data-open="lowerA"]').click();
  await wait(20);
  $('btn-begin').click();
  await wait(20);
  $('sess-timer-btn').click();
  await wait(30);
  check('folha de edicao abre', $('sheet-backdrop').classList.contains('show'));
  check('campo de data existe', !!$('ini-data'));
  check('campo de hora existe', !!$('ini-hora'));
  check('campos sao numericos', $('ini-hora').getAttribute('inputmode') === 'numeric');

  const inicioOriginal = new Date(w.MT.session.startedAt);
  check('inicio pre-preenchido com o horario atual da sessao', $('ini-data').value === dataDe(inicioOriginal) && $('ini-hora').value === horaDe(inicioOriginal));

  console.log('\n== nao deixa salvar inicio no futuro ==');
  const futuro = new Date(Date.now() + 5 * 86400000);
  $('ini-data').value = dataDe(futuro);
  $('ini-hora').value = '10:00';
  let inicioAntes = w.MT.session.startedAt;
  $('ini-salvar').click();
  await wait(30);
  check('nao gravou inicio futuro', w.MT.session.startedAt === inicioAntes);

  console.log('\n== duracao acima de 5 horas pede confirmacao ==');
  const seisHorasAtras = new Date(Date.now() - 6 * 3600 * 1000);
  $('ini-data').value = dataDe(seisHorasAtras);
  $('ini-hora').value = horaDe(seisHorasAtras);
  $('ini-salvar').click();
  await wait(30);
  check('abre confirmacao de duracao longa', $('sheet-body').textContent.includes('mais de 5 horas'));
  $('sheet-body').querySelector('[data-r="0"]').click();
  await wait(30);
  check('recusar a confirmacao nao altera o inicio', w.MT.session.startedAt === inicioAntes);

  console.log('\n== salvar novo inicio atualiza a sessao e o cronometro ==');
  $('sess-timer-btn').click();
  await wait(30);
  const trintaMinAtras = new Date(Date.now() - 30 * 60 * 1000);
  $('ini-data').value = dataDe(trintaMinAtras);
  $('ini-hora').value = horaDe(trintaMinAtras);
  $('ini-salvar').click();
  await wait(30);
  check('folha fecha depois de salvar', !$('sheet-backdrop').classList.contains('show'));
  check('inicio da sessao atualizado', Math.abs(w.MT.session.startedAt - trintaMinAtras.getTime()) < 60000);
  check('cronometro mostra duracao proxima de 30 minutos', $('sess-timer').textContent.startsWith('30:') || $('sess-timer').textContent.startsWith('29:'));

  console.log('\n== resumo do treino permite editar horario apos finalizar ==');
  const uid = $('exlist').querySelector('.excard[data-uid]').dataset.uid;
  const row = $('card-' + uid).querySelectorAll('.setrow')[0];
  const cw = row.querySelector('input[data-f="w"]'); cw.value = '20'; ev(cw, 'input');
  const cr = row.querySelector('input[data-f="r"]'); cr.value = '10'; ev(cr, 'input');
  $('card-' + uid).querySelector('[data-check="' + uid + '|0"]').click();
  await wait(20);
  $('btn-finish').click();
  await wait(150);
  check('mostra botao de editar horario no resumo', !!$('sum-editar-horario'));
  const idEntry = w.MT.history[0].id;
  const duracaoAntes = w.MT.history[0].duration;
  $('sum-editar-horario').click();
  await wait(30);
  check('abre folha de editar inicio e fim', $('sheet-backdrop').classList.contains('show') && $('sheet-body').textContent.includes('Editar início e fim'));

  const novoDia = new Date();
  $('ed-data-ini').value = dataDe(novoDia); $('ed-hora-ini').value = '06:00';
  $('ed-data-fim').value = dataDe(novoDia); $('ed-hora-fim').value = '06:40';
  $('ed-salvar').click();
  await wait(50);
  const entryDepois = w.MT.history.find(h => h.id === idEntry);
  check('duracao do historico foi recalculada', entryDepois.duration === 40 * 60 && entryDepois.duration !== duracaoAntes);
  check('texto do resumo foi atualizado sem precisar recarregar', $('sum-editar-horario').textContent.includes('40 min'));

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
