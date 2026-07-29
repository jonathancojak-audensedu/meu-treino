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
function comoAndroidNaoInstalado(w){
  Object.defineProperty(w.navigator, 'userAgent', {value:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/124.0', configurable:true});
  Object.defineProperty(w.navigator, 'platform', {value:'Linux armv8l', configurable:true});
  Object.defineProperty(w.navigator, 'maxTouchPoints', {value:5, configurable:true});
}

(async () => {
  console.log('\n== sem nenhum treino registrado, nenhum aviso aparece ==');
  let w = await boot({mt_profile: JSON.stringify(PERFIL)});
  let $ = seletor(w);
  await wait(30);
  check('nenhuma folha abriu sozinha', !$('sheet-backdrop').classList.contains('show'));
  fechar(w);

  console.log('\n== navegador (nao instalado) com pelo menos 1 treino: aviso de instalacao, com instrucao de iOS e de Android ==');
  w = await boot({mt_profile: JSON.stringify(PERFIL), mt_history: JSON.stringify(historico(1))}, comoIOSNaoInstalado);
  $ = seletor(w);
  await wait(30);
  check('aviso de instalacao abre sozinho', $('sheet-backdrop').classList.contains('show'));
  const textoAvisoIOS = $('sheet-body').textContent;
  check('menciona os 7 dias do iPhone', textoAvisoIOS.includes('7 dias') && textoAvisoIOS.toLowerCase().includes('iphone'));
  check('inclui instrucao de instalar no iOS', textoAvisoIOS.includes('Compartilhar') && textoAvisoIOS.includes('Adicionar à Tela de Início'));
  check('inclui instrucao de instalar no Android', textoAvisoIOS.toLowerCase().includes('android') && textoAvisoIOS.includes('Adicionar à tela inicial'));
  const stAviso = JSON.parse(w.localStorage.getItem('mt_settings'));
  check('marca que o aviso ja foi mostrado', stAviso.avisoInstalacaoMostrado === true);
  $('sheet-body').querySelector('[data-r="1"]').click();
  await wait(20);
  fechar(w);

  console.log('\n== o mesmo aviso vale pra Android, nao so pra iOS ==');
  w = await boot({mt_profile: JSON.stringify(PERFIL), mt_history: JSON.stringify(historico(1))}, comoAndroidNaoInstalado);
  $ = seletor(w);
  await wait(30);
  check('android nao instalado tambem ve o aviso de instalacao', $('sheet-backdrop').classList.contains('show') && $('sheet-body').textContent.toLowerCase().includes('android'));
  fechar(w);

  console.log('\n== instalado (standalone) nunca ve o aviso de instalacao, mesmo no iOS ==');
  w = await boot({mt_profile: JSON.stringify(PERFIL), mt_history: JSON.stringify(historico(2))}, ww => {
    comoIOSNaoInstalado(ww);
    ww.navigator.standalone = true;
  });
  $ = seletor(w);
  await wait(30);
  check('instalado nao ve nenhum aviso', !$('sheet-backdrop').classList.contains('show'));
  fechar(w);

  console.log('\n== com o aviso de instalacao ja visto, nao aparece de novo (mesmo elegivel pro lembrete de backup) ==');
  const settingsComAviso = {sound:true, wake:true, avisoInstalacaoMostrado:true};
  w = await boot({mt_profile: JSON.stringify(PERFIL), mt_history: JSON.stringify(historico(10)), mt_settings: JSON.stringify(settingsComAviso)}, comoIOSNaoInstalado);
  $ = seletor(w);
  await wait(30);
  check('aviso de instalacao nao repete, mas o lembrete de backup assume o lugar', $('sheet-backdrop').classList.contains('show') && $('sheet-body').textContent.includes('backup'));
  fechar(w);

  console.log('\n== com menos de 10 treinos, o lembrete de backup nao aparece ==');
  w = await boot({mt_profile: JSON.stringify(PERFIL), mt_history: JSON.stringify(historico(9)), mt_settings: JSON.stringify(settingsComAviso)}, comoIOSNaoInstalado);
  $ = seletor(w);
  await wait(30);
  check('9 treinos ainda nao dispara o lembrete de backup', !$('sheet-backdrop').classList.contains('show'));
  fechar(w);

  console.log('\n== a cada 10 treinos registrados, o lembrete de backup aparece, explicando que nao ha servidor ==');
  w = await boot({mt_profile: JSON.stringify(PERFIL), mt_history: JSON.stringify(historico(10)), mt_settings: JSON.stringify(settingsComAviso)}, ww => {
    comoIOSNaoInstalado(ww);
    ww.URL.createObjectURL = () => 'blob:teste';
    ww.URL.revokeObjectURL = () => {};
  });
  $ = seletor(w);
  await wait(30);
  check('lembrete de backup abre sozinho com 10 treinos', $('sheet-backdrop').classList.contains('show'));
  const textoBackup = $('sheet-body').textContent;
  check('menciona backup', textoBackup.includes('backup'));
  check('explica que os dados ficam so no aparelho, sem servidor', textoBackup.includes('só neste aparelho') && textoBackup.includes('servidor'));
  const st1 = JSON.parse(w.localStorage.getItem('mt_settings'));
  check('grava quantos treinos existiam quando o lembrete foi mostrado', !!st1.backupLembrete && st1.backupLembrete.treinos === 10);

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
  check('backup tem o historico completo', JSON.parse(conteudoBaixado).history.length === 10);
  fechar(w);

  console.log('\n== logo depois do lembrete, reabrir o app nao insiste de novo com so 1 treino a mais ==');
  const storageComLembrete = {
    mt_profile: JSON.stringify(PERFIL),
    mt_history: JSON.stringify(historico(11)),
    mt_settings: JSON.stringify({sound:true, wake:true, avisoInstalacaoMostrado:true, backupLembrete:{treinos: 11}})
  };
  w = await boot(storageComLembrete, comoIOSNaoInstalado);
  $ = seletor(w);
  await wait(30);
  check('nao insiste com so 1 treino a mais', !$('sheet-backdrop').classList.contains('show'));
  fechar(w);

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
