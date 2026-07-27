const { boot, wait, criarCheck, seletor } = require('./_helpers');
const check = criarCheck();

const dias = n => new Date(Date.now() - n * 86400000).toISOString();

const HISTORICO = [
  {id:'h1', name:'Superiores A', tag:'DIA 1', block:'a', date: dias(0), duration: 600, volume: 980, setsDone: 2,
    exercises: [{exId:'supino_reto', name:'Supino reto barra', type:'reps', sets:[{w:'70', r:'8'}, {w:'70', r:'6'}]}]},
  {id:'h2', name:'Superiores A', tag:'DIA 1', block:'a', date: dias(10), duration: 600, volume: 540, setsDone: 1,
    exercises: [{exId:'supino_reto', name:'Supino reto barra', type:'reps', sets:[{w:'67.5', r:'8'}]}]},
  {id:'h3', name:'Superiores A', tag:'DIA 1', block:'a', date: dias(40), duration: 600, volume: 920, setsDone: 2,
    exercises: [
      {exId:'supino_reto', name:'Supino reto barra', type:'reps', sets:[{w:'65', r:'8'}]},
      {exId:'agachamento_livre', name:'Agachamento livre barra', type:'reps', sets:[{w:'80', r:'5'}]}
    ]}
];

(async () => {
  const w = await boot({mt_history: JSON.stringify(HISTORICO)});
  const $ = seletor(w);

  console.log('\n== dados puros (MT.exerciciosComHistorico / MT.serieTemporal) ==');
  const exs = w.MT.exerciciosComHistorico();
  check('lista tem os 2 exercicios do historico', exs.length === 2);
  check('mais recente aparece primeiro (supino antes de agachamento)', exs[0].exId === 'supino_reto' && exs[1].exId === 'agachamento_livre');

  const serieSupino = w.MT.serieTemporal('supino_reto');
  check('serie do supino tem 3 sessoes', serieSupino.length === 3);
  check('serie vem em ordem cronologica (mais antigo primeiro)', serieSupino[0].valor === 65 && serieSupino[1].valor === 67.5 && serieSupino[2].valor === 70);

  const serieAgacho = w.MT.serieTemporal('agachamento_livre');
  check('agachamento tem so 1 sessao', serieAgacho.length === 1);

  console.log('\n== tela de historico: aba evolucao ==');
  $('nav-history').click();
  await wait(20);
  check('aba lista comeca ativa', $('tab-lista').classList.contains('active'));
  $('tab-evolucao').click();
  await wait(20);
  check('aba evolucao fica ativa', $('tab-evolucao').classList.contains('active'));
  check('lista de historico esconde', $('histlist').style.display === 'none');
  check('lista de evolucao aparece', $('evolist').style.display !== 'none');
  check('2 cards de exercicio na evolucao', $('evolist').querySelectorAll('[data-evo]').length === 2);

  console.log('\n== exercicio com historico suficiente mostra grafico ==');
  const cardSupino = $('evolist').querySelector('[data-evo="supino_reto"]');
  cardSupino.click();
  await wait(20);
  const painelSupino = $('evo-supino_reto');
  check('painel abre', painelSupino.classList.contains('open'));
  const svg = painelSupino.querySelector('svg.evochart');
  check('svg do grafico existe', !!svg);
  check('svg tem role=img', svg && svg.getAttribute('role') === 'img');
  check('svg tem aria-label descrevendo a tendencia', svg && svg.getAttribute('aria-label') && svg.getAttribute('aria-label').length > 10);
  check('mostra a carga maxima correta', painelSupino.textContent.includes('70 kg'));

  console.log('\n== exercicio com menos de 2 sessoes mostra mensagem, nao grafico ==');
  const cardAgacho = $('evolist').querySelector('[data-evo="agachamento_livre"]');
  cardAgacho.click();
  await wait(20);
  const painelAgacho = $('evo-agachamento_livre');
  check('nao tem svg', !painelAgacho.querySelector('svg'));
  check('mostra mensagem de poucas sessoes', painelAgacho.textContent.includes('Menos de 2 sessões'));

  console.log('\n== voltar pra lista ==');
  $('tab-lista').click();
  await wait(20);
  check('lista volta a aparecer', $('histlist').style.display !== 'none');
  check('evolucao esconde de novo', $('evolist').style.display === 'none');

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
