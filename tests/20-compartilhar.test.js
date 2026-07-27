const { boot, usar, fechar, wait, criarCheck, seletor } = require('./_helpers');
const check = criarCheck();

/* mesma logica de mock de canvas do teste de avatar: jsdom nao tem canvas de
   verdade, entao um contexto 2d falso registra as chamadas sem desenhar nada.
   measureText usa uma heuristica simples (14px por caractere) so pra
   truncarTexto ter uma largura previsivel e nao entrar em loop infinito. */
function mockarCanvas(w){
  w.HTMLCanvasElement.prototype.getContext = function(){
    return {
      fillStyle:'', strokeStyle:'', lineWidth:1, font:'', textAlign:'left', textBaseline:'alphabetic',
      fillRect(){}, save(){}, restore(){}, beginPath(){}, arc(){}, closePath(){}, clip(){},
      drawImage(){}, fillText(){}, moveTo(){}, lineTo(){}, stroke(){},
      measureText(t){ return {width: t.length * 14}; }
    };
  };
  w.HTMLCanvasElement.prototype.toBlob = function(cb){ cb(new Blob(['fake-png'], {type:'image/png'})); };
}

/* Image tambem nao carrega de verdade em jsdom (recursos externos ficam
   desligados por padrao), entao uma imagem falsa dispara onload sozinha */
function mockarImage(){
  class FakeImage{
    set src(v){ this._src = v; setTimeout(() => { if(this.onload) this.onload(); }, 0); }
    get src(){ return this._src; }
  }
  global.Image = FakeImage;
}

const PERFIL = {nome:'Ana', objetivo:'hipertrofia', dias:3, local:'casa', tempo:45, dores:[], prioridade:null};

async function marcarPrimeiraSerie($, w, uid, wVal, rVal){
  const ev = (el, type) => el.dispatchEvent(new w.Event(type, {bubbles:true}));
  const row = $('card-' + uid).querySelectorAll('.setrow')[0];
  const wi = row.querySelector('input[data-f="w"]'); wi.value = String(wVal); ev(wi, 'input');
  const ri = row.querySelector('input[data-f="r"]'); ri.value = String(rVal); ev(ri, 'input');
  $('card-' + uid).querySelector('[data-check="' + uid + '|0"]').click();
  await wait(15);
}

(async () => {
  const w = await boot({mt_profile: JSON.stringify(PERFIL)});
  mockarCanvas(w);
  mockarImage();
  const $ = seletor(w);
  const ev = (el, type) => el.dispatchEvent(new w.Event(type, {bubbles:true}));

  console.log('\n== clicar em compartilhar antes de ter uma imagem pronta avisa em vez de travar ==');
  $('btn-sum-share').click();
  await wait(10);
  check('avisa que ainda esta preparando', $('toast').textContent.includes('preparada'));

  console.log('\n== finalizar o treino gera a imagem sozinho, sem esperar o clique ==');
  $('daylist').querySelector('[data-open="lowerA"]').click();
  await wait(20);
  $('btn-begin').click();
  await wait(20);
  const uids = [...$('exlist').querySelectorAll('.excard[data-uid]')].map(c => c.dataset.uid);
  await marcarPrimeiraSerie($, w, uids[0], 100, 8); // provavel recorde, primeiro registro
  $('btn-finish').click();
  await wait(150);
  check('resumo mostra o botao de compartilhar', !!$('btn-sum-share'));
  await wait(80); // gerarImagemResumo roda em segundo plano, depois do render
  const arquivo = w.MT._shareFile;
  check('imagem ficou pronta sozinha, sem precisar clicar', !!arquivo);
  check('arquivo e um PNG', arquivo && arquivo.type === 'image/png');
  check('nome do arquivo cita o treino', arquivo && arquivo.name.startsWith('treino-'));

  console.log('\n== compartilhar com suporte do navegador chama navigator.share com o arquivo ==');
  let chamadaShare = null;
  w.navigator.share = args => { chamadaShare = args; return Promise.resolve(); };
  w.navigator.canShare = args => Array.isArray(args.files) && args.files.length > 0;
  usar(w);
  $('btn-sum-share').click();
  await wait(10);
  check('navigator.share foi chamado', !!chamadaShare);
  check('arquivo compartilhado e o mesmo gerado', chamadaShare && chamadaShare.files[0] === arquivo);

  console.log('\n== sem suporte a compartilhar arquivo, cai pro download do PNG ==');
  delete w.navigator.share;
  delete w.navigator.canShare;
  usar(w);
  let baixou = null;
  const origCreate = w.document.createElement.bind(w.document);
  w.document.createElement = tag => {
    const el = origCreate(tag);
    if(tag === 'a') el.click = () => { baixou = el.download; };
    return el;
  };
  w.URL.createObjectURL = () => 'blob:teste';
  w.URL.revokeObjectURL = () => {};
  usar(w);
  $('btn-sum-share').click();
  await wait(20);
  check('sem navigator.share, baixa o arquivo direto', baixou && baixou.startsWith('treino-') && baixou.endsWith('.png'));

  fechar(w);

  console.log('\n== com foto de perfil, a imagem inclui a foto sem travar ==');
  const w2 = await boot({mt_profile: JSON.stringify(PERFIL), mt_avatar: JSON.stringify('data:image/jpeg;base64,FAKE')});
  mockarCanvas(w2);
  mockarImage();
  const $2 = seletor(w2);
  $2('daylist').querySelector('[data-open="lowerA"]').click();
  await wait(20);
  $2('btn-begin').click();
  await wait(20);
  const uid2 = $2('exlist').querySelector('.excard[data-uid]').dataset.uid;
  await marcarPrimeiraSerie($2, w2, uid2, 50, 10);
  $2('btn-finish').click();
  await wait(200);
  check('imagem com foto tambem fica pronta, sem travar em carregar a foto', !!w2.MT._shareFile);
  fechar(w2);

  console.log('\n== treino livre com muitos exercicios nao trava a geracao da imagem ==');
  const w3 = await boot({mt_profile: JSON.stringify(PERFIL)});
  mockarCanvas(w3);
  mockarImage();
  const $3 = seletor(w3);
  $3('daylist').querySelector('[data-free]').click();
  await wait(40);
  $3('ex-search').value = 'rosca'; ev($3('ex-search'), 'input'); await wait(10);
  $3('ex-options').querySelector('.opt').click();
  await wait(40);
  const termos = ['supino', 'agachamento', 'remada', 'triceps', 'panturrilha', 'abdominal', 'leg press', 'stiff', 'desenvolvimento'];
  for(const termo of termos){
    $3('exlist').querySelector('[data-addex]').click();
    await wait(20);
    $3('ex-search').value = termo; ev($3('ex-search'), 'input');
    await wait(10);
    const opt = $3('ex-options').querySelector('.opt');
    if(opt) opt.click();
    await wait(20);
  }
  const totalEx = $3('exlist').querySelectorAll('.excard[data-uid]').length;
  check('treino livre ficou com bastante exercicio', totalEx >= 8);
  const uid3 = $3('exlist').querySelector('.excard[data-uid]').dataset.uid;
  await marcarPrimeiraSerie($3, w3, uid3, 20, 12);
  $3('btn-finish').click();
  await wait(250);
  check('imagem com muitos exercicios fica pronta (trunca em vez de travar)', !!w3.MT._shareFile);
  fechar(w3);

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
