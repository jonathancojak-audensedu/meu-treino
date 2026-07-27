const { boot, wait, criarCheck, seletor } = require('./_helpers');
const check = criarCheck();

(async () => {
  const w = await boot();
  const $ = seletor(w);

  console.log('\n== previa: barra de iniciar fixa acima da navegacao ==');
  $('daylist').querySelector('[data-open="upperA"]').click();
  await wait(30);

  const estiloBarra = w.getComputedStyle($('startbar'));
  check('barra fica fixa', estiloBarra.position === 'fixed');
  check('barra fica colada na base (acima da nav, calculo usa var(--navh))', estiloBarra.bottom !== '' && estiloBarra.bottom !== 'auto');

  check('mostra quantidade de exercicios e duracao estimada', /\d+ exerc[ií]cios? · ~\d+min/.test($('startbar-info').textContent));
  check('exlist ganha espaco extra no fim pra nao esconder o ultimo exercicio', $('exlist').classList.contains('com-barra-fixa'));

  console.log('\n== ao comecar o treino, a barra fixa some e a normal aparece ==');
  $('btn-begin').click();
  await wait(30);
  check('startbar esconde', $('startbar').style.display === 'none');
  check('finishbar aparece', $('finishbar').style.display === 'flex');
  check('exlist perde o espaco extra da barra fixa', !$('exlist').classList.contains('com-barra-fixa'));

  console.log('\n== editar treino tambem nao deixa o espaco extra sobrando ==');
  $('btn-cancel').click();
  await wait(20);
  $('sheet-body').querySelector('[data-r="1"]').click(); // confirma cancelar
  await wait(30);
  $('daylist').querySelector('[data-open="lowerA"]').click();
  await wait(30);
  check('espaco extra volta ao reabrir a previa de outro dia', $('exlist').classList.contains('com-barra-fixa'));
  $('btn-editprog').click();
  await wait(30);
  check('editbar aparece', $('editbar').style.display === 'flex');
  check('exlist perde o espaco extra ao entrar no modo de edicao', !$('exlist').classList.contains('com-barra-fixa'));

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
