const { boot, usar, fechar, wait, criarCheck, seletor } = require('./_helpers');
const check = criarCheck();

/* jsdom nao tem canvas de verdade (getContext('2d') volta null sem o pacote
   nativo 'canvas'), entao mockamos o suficiente pro fluxo de recorte rodar:
   um createImageBitmap falso e um contexto 2d que so registra a chamada.
   createImageBitmap e chamado como identificador solto dentro do modulo, que
   resolve pelo global do Node (o mesmo motivo de _helpers pinar Audio/document
   la), entao o mock vai no global, nao na janela do jsdom */
function mockarCanvas(w){
  global.createImageBitmap = () => Promise.resolve({width: 800, height: 600});
  w.HTMLCanvasElement.prototype.getContext = function(){ return {drawImage(){}}; };
  w.HTMLCanvasElement.prototype.toDataURL = function(){ return 'data:image/jpeg;base64,FAKE'; };
}

const PERFIL = {nome:'Ana', objetivo:'hipertrofia', dias:3, local:'casa', tempo:45, dores:[], prioridade:null};
const storage = () => ({mt_profile: JSON.stringify(PERFIL)});

(async () => {
  let w = await boot(storage());
  mockarCanvas(w);
  const $ = seletor(w);

  console.log('\n== sem foto: mostra a inicial do nome no lugar do avatar ==');
  check('avatar da home mostra inicial', $('home-avatar').textContent.length === 1);
  check('botao de remover escondido sem foto', $('btn-avatar-remover').style.display === 'none');

  console.log('\n== escolher uma foto recorta em 256x256, salva e atualiza a tela ==');
  const arquivo = {type: 'image/png'};
  await w.MT.escolherAvatar(arquivo);
  await wait(20);
  check('home-avatar ganha a imagem de fundo', $('home-avatar').style.backgroundImage.includes('data:image/jpeg'));
  check('preview de ajustes ganha a mesma imagem', $('set-avatar-preview').style.backgroundImage.includes('data:image/jpeg'));
  check('inicial some quando ha foto', $('home-avatar').textContent === '');
  check('botao de remover aparece', $('btn-avatar-remover').style.display !== 'none');
  check('avatar salvo no Store', (await w.MT.Store.get('avatar')).startsWith('data:image/jpeg'));

  console.log('\n== recusa arquivo que nao e imagem ==');
  await w.MT.escolherAvatar({type: 'application/pdf'});
  await wait(20);
  check('toast avisa que precisa ser imagem', $('toast').textContent.includes('imagem'));
  check('avatar anterior continua', (await w.MT.Store.get('avatar')).startsWith('data:image/jpeg'));

  console.log('\n== remover foto volta pra inicial ==');
  await w.MT.removerAvatar();
  await wait(20);
  check('home-avatar sem imagem de fundo', !$('home-avatar').style.backgroundImage);
  check('inicial volta a aparecer', $('home-avatar').textContent.length === 1);
  check('botao de remover some de novo', $('btn-avatar-remover').style.display === 'none');
  check('avatar apagado do Store', await w.MT.Store.get('avatar') === undefined);

  console.log('\n== avatar sobrevive a reabrir o app ==');
  await w.MT.escolherAvatar(arquivo);
  await wait(20);

  const dump = {};
  for(const k of Object.keys(w.localStorage)) dump[k] = w.localStorage.getItem(k);
  fechar(w);
  w = await boot(dump);
  mockarCanvas(w);
  const $b = seletor(w);
  const salvo = await w.MT.Store.get('avatar');
  check('avatar persistiu entre boots', typeof salvo === 'string' && salvo.startsWith('data:image/jpeg'));
  check('home mostra o avatar salvo ao carregar', $b('home-avatar').style.backgroundImage.includes('data:image/jpeg'));

  console.log('\n== avatar entra no backup exportado e volta ao restaurar ==');
  let conteudoBaixado = null;
  const origCreate = w.document.createElement.bind(w.document);
  w.document.createElement = tag => {
    const el = origCreate(tag);
    if(tag === 'a') el.click = () => {};
    return el;
  };
  const OrigBlob = w.Blob;
  w.Blob = function(partes, opts){ conteudoBaixado = partes[0]; return new OrigBlob(partes, opts); };
  w.URL.createObjectURL = () => 'blob:teste';
  w.URL.revokeObjectURL = () => {};
  usar(w);
  w.MT.exportBackup();
  await wait(20);
  const payload = JSON.parse(conteudoBaixado);
  check('backup inclui a foto de perfil', typeof payload.avatar === 'string' && payload.avatar.startsWith('data:image/jpeg'));

  fechar(w);
  const w2 = await boot(storage());
  mockarCanvas(w2);
  const $2 = seletor(w2);
  check('comeca sem avatar', await w2.MT.Store.get('avatar') === undefined);
  w2.MT.importBackup({text: () => Promise.resolve(JSON.stringify(payload))});
  await wait(30);
  $2('sheet-body').querySelector('[data-r="1"]').click();
  await wait(40);
  check('avatar restaurado do backup', (await w2.MT.Store.get('avatar')) === payload.avatar);
  check('home mostra o avatar restaurado', $2('home-avatar').style.backgroundImage.includes('data:image/jpeg'));

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
