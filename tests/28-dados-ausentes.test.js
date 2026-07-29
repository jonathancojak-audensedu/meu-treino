const { boot, wait, criarCheck, seletor } = require('./_helpers');
const check = criarCheck();

/* ausencia de dado consistente: usuarios reportaram "Volume" mostrando
   "0 kg" antes de qualquer serie registrada, enquanto "Duração" ja usava
   "--:--" pro mesmo estado. E quando um exercicio nunca foi feito antes,
   o espaco da sugestao de carga ficava simplesmente vazio, sem orientar
   quem esta comecando agora. */

const dias = n => new Date(Date.now() - n * 86400000).toISOString();
const HISTORICO = [
  {id:'h1', name:'Superiores A', tag:'DIA 1', block:'a', date: dias(1), duration:600, volume:480, setsDone:1,
    exercises:[{exId:'supino_reto', name:'Supino reto barra', type:'reps', sets:[{w:'60', r:'8'}]}]}
];

(async () => {
  const w = await boot({mt_history: JSON.stringify(HISTORICO)});
  const $ = seletor(w);

  console.log('\n== previa: volume sem dado usa "--", igual a duracao, nunca "0 kg" ==');
  $('daylist').querySelector('[data-open="upperA"]').click();
  await wait(20);
  check('duracao mostra "--:--" antes de iniciar', $('sess-timer').textContent === '--:--');
  check('volume mostra "--" antes de iniciar, nao "0 kg"', $('sess-volume').textContent === '--');

  console.log('\n== previa: exercicio com historico mantem a sugestao de carga, sem historico mostra orientacao de primeira vez ==');
  const cardSupino = [...$('exlist').querySelectorAll('.excard')].find(c => c.textContent.includes('Supino reto barra'));
  check('supino (com historico) continua mostrando a sugestao de carga existente', cardSupino.querySelector('.suggestion').textContent.startsWith('sugestão:'));
  const cardRemada = [...$('exlist').querySelectorAll('.excard')].find(c => c.textContent.includes('Remada curvada barra'));
  check('remada (sem historico) mostra orientacao de primeira vez em vez de nada', cardRemada.querySelector('.suggestion').textContent === 'primeira vez: comece leve e ajuste na segunda série');

  console.log('\n== editor de treino (fora da sessao): volume tambem usa "--" ==');
  $('btn-editprog').click();
  await wait(30);
  check('volume no editor mostra "--"', $('sess-volume').textContent === '--');
  $('btn-canceledit').click();
  await wait(20);

  console.log('\n== sessao ativa: o mesmo criterio (com/sem historico) vale pro card durante o treino ==');
  $('btn-begin').click();
  await wait(20);
  const cardSupinoAtivo = [...$('exlist').querySelectorAll('.excard')].find(c => c.textContent.includes('Supino reto barra'));
  check('supino ativo continua com a sugestao de carga existente', cardSupinoAtivo.querySelector('.suggestion').textContent.startsWith('sugestão:'));
  const cardRemadaAtivo = [...$('exlist').querySelectorAll('.excard')].find(c => c.textContent.includes('Remada curvada barra'));
  check('remada ativa (sem historico) mostra orientacao de primeira vez', cardRemadaAtivo.querySelector('.suggestion').textContent === 'primeira vez: comece leve e ajuste na segunda série');

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
