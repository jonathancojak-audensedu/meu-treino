const { boot, usar, fechar, wait, criarCheck, seletor } = require('./_helpers');
const check = criarCheck();

const PERFIL = {nome:'Ana', objetivo:'hipertrofia', dias:3, local:'casa', tempo:45, dores:[], prioridade:null};
const iso = d => d.toISOString();
const diasAtras = n => new Date(Date.now() - n * 86400000);

function historico(n){
  const lista = [];
  for(let i = 0; i < n; i++){
    lista.push({id:'h' + i, name:'Corpo inteiro A', tag:'DIA 1', block:'a', date: iso(diasAtras(i)), duration:600, volume:500, setsDone:3, exercises:[]});
  }
  return lista;
}

function comoIOSNaoInstalado(w){
  Object.defineProperty(w.navigator, 'userAgent', {value:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15', configurable:true});
  Object.defineProperty(w.navigator, 'platform', {value:'iPhone', configurable:true});
  Object.defineProperty(w.navigator, 'maxTouchPoints', {value:5, configurable:true});
}

(async () => {
  console.log('\n== com poucos treinos e sem tempo passado, nenhum aviso aparece ==');
  let w = await boot({mt_profile: JSON.stringify(PERFIL), mt_history: JSON.stringify(historico(3))});
  let $ = seletor(w);
  await wait(30);
  check('nenhuma folha abriu sozinha', !$('sheet-backdrop').classList.contains('show'));
  fechar(w);

  console.log('\n== 15 treinos sem lembrete anterior dispara o lembrete de backup ==');
  w = await boot({mt_profile: JSON.stringify(PERFIL), mt_history: JSON.stringify(historico(15))}, ww => {
    ww.URL.createObjectURL = () => 'blob:teste';
    ww.URL.revokeObjectURL = () => {};
  });
  $ = seletor(w);
  await wait(30);
  check('lembrete de backup abre sozinho', $('sheet-backdrop').classList.contains('show'));
  check('menciona backup', $('sheet-body').textContent.includes('backup'));
  const st1 = JSON.parse(w.localStorage.getItem('mt_settings'));
  check('grava quando o lembrete foi mostrado', !!st1.backupLembrete && st1.backupLembrete.treinos === 15);

  console.log('\n== escolher "Exportar agora" gera o backup ==');
  let baixou = null, conteudoBaixado = null;
  const origCreate = w.document.createElement.bind(w.document);
  w.document.createElement = tag => {
    const el = origCreate(tag);
    if(tag === 'a') el.click = () => { baixou = el.download; };
    return el;
  };
  const OrigBlob = w.Blob;
  w.Blob = function(partes, opts){ conteudoBaixado = partes[0]; return new OrigBlob(partes, opts); };
  usar(w);
  $('sheet-body').querySelector('[data-r="1"]').click();
  await wait(30);
  check('backup foi baixado ao confirmar', !!baixou && /^meu-treino-\d{4}-\d{2}-\d{2}\.json$/.test(baixou));
  check('backup tem o historico completo', JSON.parse(conteudoBaixado).history.length === 15);
  fechar(w);

  console.log('\n== logo depois do lembrete, reabrir o app nao insiste de novo ==');
  const storageComLembrete = {
    mt_profile: JSON.stringify(PERFIL),
    mt_history: JSON.stringify(historico(16)),
    mt_settings: JSON.stringify({sound:true, wake:true, backupLembrete:{quando: new Date().toISOString(), treinos: 16}})
  };
  w = await boot(storageComLembrete);
  $ = seletor(w);
  await wait(30);
  check('nao insiste com so 1 treino a mais e poucos dias depois', !$('sheet-backdrop').classList.contains('show'));
  fechar(w);

  console.log('\n== 30 dias desde o ultimo lembrete dispara de novo, mesmo com poucos treinos novos ==');
  const settingsAntigos = {sound:true, wake:true, backupLembrete:{quando: iso(diasAtras(31)), treinos: 5}};
  w = await boot({mt_profile: JSON.stringify(PERFIL), mt_history: JSON.stringify(historico(6)), mt_settings: JSON.stringify(settingsAntigos)});
  $ = seletor(w);
  await wait(30);
  check('lembrete volta depois de 30 dias', $('sheet-backdrop').classList.contains('show'));
  fechar(w);

  console.log('\n== iOS sem instalar e com historico avisa sobre o prazo, uma vez so ==');
  w = await boot({mt_profile: JSON.stringify(PERFIL), mt_history: JSON.stringify(historico(2))}, comoIOSNaoInstalado);
  $ = seletor(w);
  await wait(30);
  check('avisa sobre o iOS', $('sheet-backdrop').classList.contains('show') && $('sheet-body').textContent.toLowerCase().includes('iphone'));
  const stIOS = JSON.parse(w.localStorage.getItem('mt_settings'));
  check('marca que o aviso ja foi mostrado', stIOS.avisoIOSMostrado === true);
  $('sheet-body').querySelector('[data-r="1"]').click();
  await wait(20);
  fechar(w);

  console.log('\n== com o aviso de iOS ja visto, nao aparece de novo (mesmo elegivel pro lembrete de backup) ==');
  const settingsComAvisoIOS = {sound:true, wake:true, avisoIOSMostrado:true};
  w = await boot({mt_profile: JSON.stringify(PERFIL), mt_history: JSON.stringify(historico(20)), mt_settings: JSON.stringify(settingsComAvisoIOS)}, comoIOSNaoInstalado);
  $ = seletor(w);
  await wait(30);
  check('aviso de iOS nao repete, mas o lembrete de backup assume o lugar', $('sheet-backdrop').classList.contains('show') && $('sheet-body').textContent.includes('backup'));
  fechar(w);

  console.log('\n== instalado (standalone) nunca ve o aviso de iOS ==');
  w = await boot({mt_profile: JSON.stringify(PERFIL), mt_history: JSON.stringify(historico(2))}, ww => {
    comoIOSNaoInstalado(ww);
    ww.navigator.standalone = true;
  });
  $ = seletor(w);
  await wait(30);
  check('instalado nao ve nenhum aviso com so 2 treinos', !$('sheet-backdrop').classList.contains('show'));
  fechar(w);

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
