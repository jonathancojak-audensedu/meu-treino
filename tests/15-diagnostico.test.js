const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path').join(__dirname, '..') + '/';
const html = fs.readFileSync(path + 'index.html', 'utf8');
const js = fs.readFileSync(path + 'app.js', 'utf8');

function boot(storage){
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://exemplo.github.io/treino/', pretendToBeVisual: true });
  const w = dom.window;
  w.HTMLElement.prototype.scrollIntoView = function(){};
  w.scrollTo = function(){};
  w.navigator.vibrate = () => true;
  w.Audio = function(){ return {loop:false, volume:1, play:()=>Promise.resolve(), pause:()=>{}}; };
  w.caches = {keys: () => Promise.resolve(['meu-treino-v17'])};
  w.navigator.storage = {estimate: () => Promise.resolve({usage: 2 * 1024 * 1024})};
  if(storage) for(const k of Object.keys(storage)) w.localStorage.setItem(k, storage[k]);
  w.eval(js);
  return w;
}
const wait = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const check = (label, cond) => { if(!cond) fails++; console.log((cond ? '  ok   ' : '  FALHA') + '  ' + label); };

(async () => {
  const w = boot();
  const $ = id => w.document.getElementById(id);
  await wait(120);

  console.log('\n== erro em tempo de execucao (window.onerror) fica registrado ==');
  check('comeca sem erros', w.MT.erros.length === 0);
  w.dispatchEvent(new w.ErrorEvent('error', {message:'TypeError de teste', filename:'app.js', lineno:123}));
  check('erro foi registrado', w.MT.erros.length === 1);
  check('tipo e "erro"', w.MT.erros[0].tipo === 'erro');
  check('mensagem preservada', w.MT.erros[0].mensagem === 'TypeError de teste');
  check('origem tem arquivo e linha', w.MT.erros[0].origem === 'app.js:123');
  check('tem data/hora', !!w.MT.erros[0].quando);

  console.log('\n== rejeicao de promessa nao tratada (unhandledrejection) fica registrada ==');
  const ev = new w.Event('unhandledrejection');
  ev.reason = new w.Error('falha assíncrona de teste');
  w.dispatchEvent(ev);
  check('rejeicao foi registrada', w.MT.erros.length === 2);
  check('tipo e "promessa"', w.MT.erros[0].tipo === 'promessa');
  check('mensagem da rejeicao preservada', w.MT.erros[0].mensagem === 'falha assíncrona de teste');

  console.log('\n== guarda no maximo as ultimas 20 ocorrencias, mais recente primeiro ==');
  for(let i = 0; i < 25; i++) w.MT.registrarErro({tipo:'erro', mensagem:'erro numero ' + i, origem:''});
  check('trunca em 20', w.MT.erros.length === 20);
  check('mais recente fica na frente', w.MT.erros[0].mensagem === 'erro numero 24');
  const salvo = JSON.parse(w.localStorage.getItem('mt_erros_recentes'));
  check('lista persistida no localStorage', Array.isArray(salvo) && salvo.length === 20);

  console.log('\n== diagnostico nunca inclui dado de treino, perfil ou corpo ==');
  w.MT.registrarErro({tipo:'erro', mensagem:'ok'});
  check('registro de erro so tem os campos esperados (tipo, mensagem, origem, quando)',
    Object.keys(w.MT.erros[0]).every(k => ['tipo','mensagem','origem','quando'].indexOf(k) !== -1));

  console.log('\n== tela de diagnostico mostra versao, modo, armazenamento e erros ==');
  w.eval('abrirDiagnostico()');
  await wait(60);
  check('sheet abriu', $('sheet-backdrop').classList.contains('show'));
  const corpoSheet = $('sheet-body').textContent;
  check('mostra a versao do cache do service worker', corpoSheet.includes('meu-treino-v17'));
  check('mostra o modo (instalado ou navegador)', corpoSheet.includes('navegador'));
  check('mostra armazenamento formatado em MB', corpoSheet.includes('2,0 MB'));
  check('mostra contagem de erros recentes', corpoSheet.includes('Erros recentes (20)'));
  check('nao menciona nenhuma chave de dado de treino/perfil/corpo', !/supino|agachamento|idade|altura/i.test(corpoSheet));

  console.log('\n== botao de feedback leva o diagnostico junto, visivel antes de enviar ==');
  const href = decodeURIComponent($('btn-feedback').getAttribute('href') || '');
  check('link do whatsapp inclui a versao', href.includes('meu-treino-v17'));
  check('link do whatsapp inclui armazenamento usado', href.includes('2,0 MB'));
  check('link do whatsapp inclui contagem de erros recentes', /Erros recentes \(\d+\)/.test(href));
  check('e um link wa.me que abre o compositor, pessoa revisa antes de enviar', href.indexOf('https://wa.me/') === 0);

  console.log('\n' + (fails ? fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
