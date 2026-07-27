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

  check('schemaVersion da versao atual do app e 1', w1.MT.schemaVersion === 1);
  check('schemaVersion foi gravada no localStorage', w1.localStorage.getItem('mt_schemaVersion') === '1');
  check('historico nao foi perdido', JSON.stringify(w1.MT.history) === JSON.stringify(HISTORICO));
  check('perfil nao foi perdido', w1.MT.profile && w1.MT.profile.nome === 'Ana');
  check('settings nao foi perdido', w1.MT.settings.sound === false && w1.MT.settings.wake === true);
  check('nao sobrou chave de resgate depois de uma migracao bem sucedida', w1.localStorage.getItem('mt_resgate_dados') === null);

  console.log('\n== quem ja esta na versao atual nao sofre nenhuma escrita ==');
  const storageAtual = Object.assign({mt_schemaVersion: '1'}, storageAntigo);
  const w2 = await boot(storageAtual, null, {manterAnterior: true});
  const resultado = await w2.MT.migrarDados();
  check('migrarDados e no-op quando ja esta na versao alvo', resultado.ok === true && resultado.versao === 1);
  check('dados continuam intactos', JSON.stringify(w2.MT.history) === JSON.stringify(HISTORICO));

  console.log('\n== migracao que falha nao apaga nada e deixa copia de resgate ==');
  usar(w1); // volta a apontar document/window/localStorage pra janela 1
  w1.MT.MIGRACOES[2] = async () => { throw new Error('falha simulada de migração'); };
  const antesHistorico = w1.localStorage.getItem('mt_history');
  const antesVersao = w1.localStorage.getItem('mt_schemaVersion');
  const falhou = await w1.MT.migrarDados(2);
  await wait(30);

  check('migrarDados relata falha', falhou.ok === false);
  check('historico original nao foi alterado', w1.localStorage.getItem('mt_history') === antesHistorico);
  check('schemaVersion nao avançou apos falha', w1.localStorage.getItem('mt_schemaVersion') === antesVersao);
  const resgate = JSON.parse(w1.localStorage.getItem('mt_resgate_dados') || 'null');
  check('copia de resgate foi criada com os dados brutos de antes da tentativa', !!resgate && JSON.stringify(resgate.dados.history) === JSON.stringify(HISTORICO));
  check('copia de resgate registra a versao de origem', resgate.versaoOrigem === 1);

  fechar(w1);
  fechar(w2);

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
