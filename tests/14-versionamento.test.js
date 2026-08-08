const { boot, usar, fechar, wait, criarCheck } = require('./_helpers');
const check = criarCheck();

const HISTORICO = [
  {id:'h1', name:'Superiores A', tag:'DIA 1', block:'upper', date: new Date().toISOString(), duration:600, volume:900, setsDone:3,
    exercises:[{exId:'supino_reto', name:'Supino reto barra', type:'reps', sets:[{w:'60', r:'8'}]}]}
];
const PERFIL = {nome:'Ana', experiencia:'intermediario', dias:4, tempo:60, local:'academia', objetivo:'hipertrofia', dores:[], prioridade:[]};

(async () => {
  console.log('\n== dump sem schemaVersion (quem instalou antes deste recurso) migra sem perder nada ==');
  const storageAntigo = {
    mt_history: JSON.stringify(HISTORICO),
    mt_profile: JSON.stringify(PERFIL),
    mt_settings: JSON.stringify({sound:false, wake:true})
  };
  // mantem w1 viva: o teste volta a interagir com ela depois de criar w2
  const w1 = await boot(storageAntigo, null, {manterAnterior: true});

  check('schemaVersion da versao atual do app e 2', w1.MT.schemaVersion === 2);
  check('schemaVersion foi gravada no localStorage', w1.localStorage.getItem('mt_schemaVersion') === '2');
  /* a migracao 2 acrescenta setsPrescritos, entao o objeto muda de forma de
     proposito: o que nao pode mudar e o dado que ja existia */
  check('nenhum treino foi perdido', w1.MT.history.length === HISTORICO.length);
  check('o treino manteve id, nome e data', w1.MT.history[0].id === 'h1' && w1.MT.history[0].name === 'Superiores A' && w1.MT.history[0].date === HISTORICO[0].date);
  check('as series registradas continuam iguais', JSON.stringify(w1.MT.history[0].exercises[0].sets) === JSON.stringify(HISTORICO[0].exercises[0].sets));
  check('volume, duracao e contagem de series intactos', w1.MT.history[0].volume === 900 && w1.MT.history[0].duration === 600 && w1.MT.history[0].setsDone === 3);
  check('treino antigo ganha setsPrescritos nulo, que o motor le como desconhecido', w1.MT.history[0].exercises[0].setsPrescritos === null);
  check('perfil nao foi perdido', w1.MT.profile && w1.MT.profile.nome === 'Ana');
  check('settings nao foi perdido', w1.MT.settings.sound === false && w1.MT.settings.wake === true);
  check('nao sobrou chave de resgate depois de uma migracao bem sucedida', w1.localStorage.getItem('mt_resgate_dados') === null);

  console.log('\n== quem ja esta na versao atual nao sofre nenhuma escrita ==');
  const storageAtual = Object.assign({mt_schemaVersion: '2'}, storageAntigo);
  const w2 = await boot(storageAtual, null, {manterAnterior: true});
  const resultado = await w2.MT.migrarDados();
  check('migrarDados e no-op quando ja esta na versao alvo', resultado.ok === true && resultado.versao === 2);
  check('dados continuam intactos', w2.MT.history.length === 1 && w2.MT.history[0].id === 'h1');

  console.log('\n== migracao que falha nao apaga nada e deixa copia de resgate ==');
  usar(w1); // volta a apontar document/window/localStorage pra janela 1
  w1.MT.MIGRACOES[3] = async () => { throw new Error('falha simulada de migração'); };
  const antesHistorico = w1.localStorage.getItem('mt_history');
  const antesVersao = w1.localStorage.getItem('mt_schemaVersion');
  const falhou = await w1.MT.migrarDados(3);
  await wait(30);

  check('migrarDados relata falha', falhou.ok === false);
  check('historico original nao foi alterado', w1.localStorage.getItem('mt_history') === antesHistorico);
  check('schemaVersion nao avançou apos falha', w1.localStorage.getItem('mt_schemaVersion') === antesVersao);
  const resgate = JSON.parse(w1.localStorage.getItem('mt_resgate_dados') || 'null');
  check('copia de resgate foi criada com os dados brutos de antes da tentativa', !!resgate && Array.isArray(resgate.dados.history) && resgate.dados.history[0].id === 'h1');
  check('copia de resgate registra a versao de origem', resgate.versaoOrigem === 2);

  fechar(w1);
  fechar(w2);

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
