const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path').join(__dirname, '..') + '/';
const html = fs.readFileSync(path + 'index.html', 'utf8');
const js = fs.readFileSync(path + 'app.js', 'utf8');

const HISTORICO = [
  {id:'h1', name:'Superiores A', tag:'DIA 1', block:'upper', date: new Date().toISOString(), duration:600, volume:900, setsDone:3,
    exercises:[{exId:'supino_reto', name:'Supino reto barra', type:'reps', sets:[{w:'60', r:'8'}]}]}
];
const PERFIL = {nome:'Ana', experiencia:'intermediario', dias:4, tempo:60, local:'academia', objetivo:'hipertrofia', dores:[], prioridade:[]};

function boot(storage){
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://exemplo.github.io/treino/', pretendToBeVisual: true });
  const w = dom.window;
  w.HTMLElement.prototype.scrollIntoView = function(){};
  w.scrollTo = function(){};
  w.navigator.vibrate = () => true;
  w.Audio = function(){ return {loop:false, volume:1, play:()=>Promise.resolve(), pause:()=>{}}; };
  w.caches = {keys: () => Promise.resolve([])};
  if(storage) for(const k of Object.keys(storage)) w.localStorage.setItem(k, storage[k]);
  w.eval(js);
  return w;
}
const wait = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const check = (label, cond) => { if(!cond) fails++; console.log((cond ? '  ok   ' : '  FALHA') + '  ' + label); };

(async () => {
  console.log('\n== dump sem schemaVersion (quem instalou antes deste recurso) migra sem perder nada ==');
  const storageAntigo = {
    mt_history: JSON.stringify(HISTORICO),
    mt_profile: JSON.stringify(PERFIL),
    mt_settings: JSON.stringify({sound:false, wake:true})
  };
  const w1 = boot(storageAntigo);
  await wait(150);

  check('schemaVersion da versao atual do app e 1', w1.MT.schemaVersion === 1);
  check('schemaVersion foi gravada no localStorage', w1.localStorage.getItem('mt_schemaVersion') === '1');
  check('historico nao foi perdido', JSON.stringify(w1.MT.history) === JSON.stringify(HISTORICO));
  check('perfil nao foi perdido', w1.MT.profile && w1.MT.profile.nome === 'Ana');
  check('settings nao foi perdido', w1.MT.settings.sound === false && w1.MT.settings.wake === true);
  check('nao sobrou chave de resgate depois de uma migracao bem sucedida', w1.localStorage.getItem('mt_resgate_dados') === null);

  console.log('\n== quem ja esta na versao atual nao sofre nenhuma escrita ==');
  const storageAtual = Object.assign({mt_schemaVersion: '1'}, storageAntigo);
  const w2 = boot(storageAtual);
  await wait(150);
  const resultado = await w2.MT.migrarDados();
  check('migrarDados e no-op quando ja esta na versao alvo', resultado.ok === true && resultado.versao === 1);
  check('dados continuam intactos', JSON.stringify(w2.MT.history) === JSON.stringify(HISTORICO));

  console.log('\n== migracao que falha nao apaga nada e deixa copia de resgate ==');
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

  console.log('\n' + (fails ? fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
