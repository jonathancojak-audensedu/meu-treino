const { boot, wait, criarCheck, seletor } = require('./_helpers');
const check = criarCheck();

const dias = n => new Date(Date.now() - n * 86400000);
const iso = d => d.toISOString();
const pad = n => String(n).padStart(2, '0');
const dataDe = d => d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
const horaDe = d => pad(d.getHours()) + ':' + pad(d.getMinutes());

const HISTORICO = [
  {id:'h1', name:'Superiores A', tag:'DIA 1', block:'a', date: iso(dias(0)), duration:600, volume:900, setsDone:3, exercises:[]},
  {id:'h2', name:'Inferiores A', tag:'DIA 2', block:'a', date: iso(dias(5)), duration:600, volume:800, setsDone:3, exercises:[]},
  {id:'h3', name:'Superiores B', tag:'DIA 3', block:'a', date: iso(dias(10)), duration:600, volume:700, setsDone:3, exercises:[]}
];

(async () => {
  const w = await boot({mt_history: JSON.stringify(HISTORICO)});
  const $ = seletor(w);

  console.log('\n== abrir edicao de inicio e fim ==');
  $('nav-history').click();
  await wait(20);
  $('histlist').querySelector('[data-hist="h2"]').click();
  await wait(20);
  $('histlist').querySelector('[data-editdata="h2"]').click();
  await wait(30);
  check('folha de edicao abre', $('sheet-backdrop').classList.contains('show'));
  check('campo de data de inicio existe', !!$('ed-data-ini'));
  check('campo de hora de inicio existe', !!$('ed-hora-ini'));
  check('campo de data de fim existe', !!$('ed-data-fim'));
  check('campo de hora de fim existe', !!$('ed-hora-fim'));
  check('campos sao numericos (sem teclado alfabetico)', $('ed-hora-ini').getAttribute('inputmode') === 'numeric' && $('ed-hora-fim').getAttribute('inputmode') === 'numeric');

  const h2 = w.MT.history.find(h => h.id === 'h2');
  const fimOriginal = new Date(h2.date);
  const inicioOriginal = new Date(fimOriginal.getTime() - h2.duration * 1000);
  check('fim pre-preenchido com a data atual do treino', $('ed-data-fim').value === dataDe(fimOriginal) && $('ed-hora-fim').value === horaDe(fimOriginal));
  check('inicio pre-preenchido calculado a partir da duracao', $('ed-data-ini').value === dataDe(inicioOriginal) && $('ed-hora-ini').value === horaDe(inicioOriginal));

  console.log('\n== salvar novo inicio/fim recalcula duracao e reordena o historico ==');
  // h2 tinha 5 dias atras; movendo pra 20 dias atras ela deve virar a mais antiga,
  // com uma sessao de 45 minutos (inicio as 07:00, fim as 07:45)
  const novoDia = dias(20);
  $('ed-data-ini').value = dataDe(novoDia); $('ed-data-ini').dispatchEvent(new w.Event('input', {bubbles:true}));
  $('ed-hora-ini').value = '07:00'; $('ed-hora-ini').dispatchEvent(new w.Event('input', {bubbles:true}));
  $('ed-data-fim').value = dataDe(novoDia); $('ed-data-fim').dispatchEvent(new w.Event('input', {bubbles:true}));
  $('ed-hora-fim').value = '07:45'; $('ed-hora-fim').dispatchEvent(new w.Event('input', {bubbles:true}));
  $('ed-salvar').click();
  await wait(50);

  check('folha fecha depois de salvar', !$('sheet-backdrop').classList.contains('show'));
  const ordemDepois = w.MT.history.map(h => h.id);
  check('h2 virou o mais antigo (ultima posicao)', ordemDepois[ordemDepois.length - 1] === 'h2');
  check('h1 continua o mais recente', ordemDepois[0] === 'h1');
  const h2Depois = w.MT.history.find(h => h.id === 'h2');
  check('fim salvo corretamente (hora)', new Date(h2Depois.date).getHours() === 7 && new Date(h2Depois.date).getMinutes() === 45);
  check('duracao recalculada pra 45 minutos', h2Depois.duration === 45 * 60);

  console.log('\n== nao deixa salvar fim no futuro ==');
  $('histlist').querySelector('[data-hist="h1"]').click();
  await wait(20);
  $('histlist').querySelector('[data-editdata="h1"]').click();
  await wait(30);
  const maxAttr = $('ed-data-fim').getAttribute('max');
  check('input de fim tem max de hoje (bloqueia futuro na UI)', !!maxAttr);
  const futuro = new Date(Date.now() + 5 * 86400000);
  $('ed-data-fim').value = dataDe(futuro);
  $('ed-hora-fim').value = '10:00';
  let antesDoSalvar = JSON.stringify(w.MT.history);
  $('ed-salvar').click();
  await wait(30);
  check('nao gravou o fim futuro', JSON.stringify(w.MT.history) === antesDoSalvar);

  console.log('\n== nao deixa salvar fim antes ou igual ao inicio ==');
  $('sheet-body').querySelector('[data-fechar]').click();
  await wait(20);
  $('histlist').querySelector('[data-editdata="h1"]').click();
  await wait(30);
  const hoje = dataDe(new Date());
  $('ed-data-ini').value = hoje; $('ed-hora-ini').value = '10:00';
  $('ed-data-fim').value = hoje; $('ed-hora-fim').value = '09:00'; // fim antes do inicio
  antesDoSalvar = JSON.stringify(w.MT.history);
  $('ed-salvar').click();
  await wait(30);
  check('nao gravou com fim antes do inicio', JSON.stringify(w.MT.history) === antesDoSalvar);

  console.log('\n== duracao acima de 5 horas pede confirmacao ==');
  // horarios calculados a partir de agora (nunca fixos), senao o teste falha
  // se rodar de madrugada: "hoje as 08:00" pode cair no futuro e a validacao
  // de fim futuro barra o salvamento antes de chegar na checagem de duracao
  const fimLongo = new Date(Date.now() - 60000);
  const inicioLongo = new Date(fimLongo.getTime() - 7 * 3600000);
  $('ed-data-ini').value = dataDe(inicioLongo); $('ed-hora-ini').value = horaDe(inicioLongo);
  $('ed-data-fim').value = dataDe(fimLongo); $('ed-hora-fim').value = horaDe(fimLongo);
  $('ed-salvar').click();
  await wait(30);
  check('abre confirmacao de duracao longa', $('sheet-body').textContent.includes('mais de 5 horas'));
  $('sheet-body').querySelector('[data-r="0"]').click(); // recusa
  await wait(30);
  check('recusar a confirmacao nao salva', w.MT.history.find(h => h.id === 'h1').duration === 600);

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
