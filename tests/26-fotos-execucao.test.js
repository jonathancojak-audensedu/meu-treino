const { boot, usar, wait, criarCheck, seletor } = require('./_helpers');
const check = criarCheck();

/* fotos de execucao (piloto peito): fonte free-exercise-db, licenca Unlicense,
   ver README.md. Miniatura no seletor e no card do treino ativo abre as duas
   fotos maiores, alternando pra simular o movimento. Como a miniatura pode
   ser tocada com o seletor de exercicio ainda aberto, o visualizador usa um
   backdrop proprio (#exec-backdrop) empilhado por cima do backdrop
   generico (#sheet-backdrop), daí os testes de pilha de folhas abaixo. */

const IDS_COM_FOTO = [
  'supino_reto', 'supino_maquina', 'supino_halteres', 'supino_incl_hal', 'supino_incl_barra',
  'crucifixo', 'crossover', 'supino_declinado', 'crucifixo_inclinado', 'peck_deck',
  'supino_halteres_unilateral', 'crossover_unilateral', 'flexao_declinada',
  'supino_maquina_convergente', 'flexao', 'flexao_inclinada', 'flexao_elastico'
];

(async () => {
  let w = await boot();
  let $ = seletor(w);

  console.log('\n== catalogo: 17 exercicios de peito marcados com img, o resto sem ==');
  const MT = w.MT;
  const comImg = Object.keys(MT.EX).filter(id => MT.EX[id].img);
  check('exatamente 17 exercicios marcados com img', comImg.length === 17);
  check('todos os 17 ids esperados tem a marca img', IDS_COM_FOTO.every(id => MT.EX[id] && MT.EX[id].img === true));
  check('flexao_joelho (sem correspondente na fonte) fica sem imagem', !MT.EX.flexao_joelho.img);
  check('um exercicio de outro grupo (agachamento) fica sem imagem', !MT.EX.agachamento.img);

  console.log('\n== card do treino ativo: miniatura so aparece pra quem tem foto ==');
  $('daylist').querySelector('[data-open="upperA"]').click();
  await wait(20);
  $('btn-begin').click();
  await wait(20);
  const uidSupino = w.MT.session.items.find(it => it.ex === 'supino_reto').uid;
  const uidSemFoto = w.MT.session.items.find(it => !MT.EX[it.ex].img);
  check('existe pelo menos um exercicio sem foto nesse treino, pra comparar', !!uidSemFoto);
  const thumbSupino = $('card-' + uidSupino).querySelector('.exthumb');
  check('miniatura aparece no card do supino reto (tem foto)', !!thumbSupino);
  check('miniatura usa <picture> com webp e jpg de reserva',
    !!thumbSupino.querySelector('picture source[type="image/webp"]') && !!thumbSupino.querySelector('picture img'));
  if(uidSemFoto){
    check('card sem foto nao tem miniatura nem quebra o layout', !$('card-' + uidSemFoto.uid).querySelector('.exthumb'));
  }

  console.log('\n== link "execução" do rodapé: com foto abre o visualizador, sem foto vai direto pro YouTube ==');
  const linkExecComFoto = $('card-' + uidSupino).querySelector('.exfoot [data-thumb]');
  check('com foto, o link do rodape vira um <button> com data-thumb (nao <a href>)', !!linkExecComFoto && linkExecComFoto.tagName === 'BUTTON');
  linkExecComFoto.click();
  await wait(30);
  check('clicar em "execução" no rodape abre o visualizador de fotos, nao navega pro YouTube', $('exec-backdrop').classList.contains('show'));
  $('exec-body').querySelector('.closebtn').click();
  await wait(20);
  if(uidSemFoto){
    const linkExecSemFoto = $('card-' + uidSemFoto.uid).querySelector('.exfoot a.minibtn.link');
    check('sem foto, o link do rodape continua sendo <a href> pro YouTube como sempre foi', !!linkExecSemFoto && linkExecSemFoto.tagName === 'A' && linkExecSemFoto.href.includes('youtube.com'));
  }

  console.log('\n== tocar na miniatura do card abre o visualizador com duas fotos, YouTube e pausar ==');
  thumbSupino.click();
  await wait(30);
  check('visualizador abre', $('exec-backdrop').classList.contains('show'));
  check('titulo e o nome do exercicio', $('exec-body').textContent.includes('Supino reto barra'));
  check('duas fotos (dois <picture>) dentro do quadro animado', $('exec-frames').querySelectorAll('picture').length === 2);
  check('botao de pausar existe e comeca como "Pausar"', $('exec-pausar').textContent === 'Pausar' && $('exec-pausar').getAttribute('aria-pressed') === 'false');
  check('link do YouTube continua como complemento', !!$('exec-youtube'));

  console.log('\n== pausar para a alternancia dos quadros ==');
  await wait(950);
  check('depois de ~950ms sozinho, ja alternou pro quadro B', $('exec-frames').classList.contains('frame-b'));
  $('exec-pausar').click();
  await wait(10);
  check('texto muda pra "Retomar" e aria-pressed vira true', $('exec-pausar').textContent === 'Retomar' && $('exec-pausar').getAttribute('aria-pressed') === 'true');
  const estadoAoPausar = $('exec-frames').classList.contains('frame-b');
  await wait(1000);
  check('pausado, nao alterna mais (mesmo estado depois de 1s)', $('exec-frames').classList.contains('frame-b') === estadoAoPausar);

  console.log('\n== fechar o visualizador para a animacao e volta pro card ==');
  $('exec-body').querySelector('.closebtn').click();
  await wait(20);
  check('visualizador fecha', !$('exec-backdrop').classList.contains('show'));
  check('card do treino continua visivel por baixo', $('screen-session').classList.contains('active'));

  console.log('\n== abrir a miniatura de dentro do seletor de exercicio empilha por cima, sem fechar o seletor ==');
  $('exlist').querySelector('[data-addex]').click();
  await wait(40);
  $('ex-search').value = 'supino reto barra';
  $('ex-search').dispatchEvent(new w.Event('input', {bubbles:true}));
  await wait(10);
  const linhaSupino = [...$('ex-options').querySelectorAll('.opt')].find(o => o.textContent.includes('Supino reto barra'));
  check('linha do supino reto aparece na busca', !!linhaSupino);
  const thumbNoSeletor = linhaSupino.querySelector('.exthumb');
  check('miniatura aparece tambem no seletor', !!thumbNoSeletor);
  check('seletor continua aberto antes de tocar na miniatura', $('sheet-backdrop').classList.contains('show'));
  thumbNoSeletor.click();
  await wait(30);
  check('visualizador abre por cima', $('exec-backdrop').classList.contains('show'));
  check('seletor continua aberto por baixo, nao foi fechado nem resolvido', $('sheet-backdrop').classList.contains('show'));
  const bottomnavStack = w.document.querySelector('.bottomnav');
  check('fundo continua inert com as duas folhas empilhadas', bottomnavStack.inert === true);

  $('exec-body').querySelector('.closebtn').click();
  await wait(20);
  check('so o visualizador fecha', !$('exec-backdrop').classList.contains('show'));
  check('seletor continua aberto depois de fechar so o visualizador', $('sheet-backdrop').classList.contains('show'));
  check('fundo continua inert (seletor ainda aberto)', bottomnavStack.inert === true);

  console.log('\n== depois de fechar so o visualizador, o seletor continua funcionando normalmente ==');
  const opcaoAtual = [...$('ex-options').querySelectorAll('.opt .optselect')].find(o => o.textContent.includes('Supino reto barra'));
  opcaoAtual.click();
  await wait(30);
  check('escolher o exercicio fecha o seletor e destrava o fundo', !$('sheet-backdrop').classList.contains('show') && bottomnavStack.inert === false);
  check('exercicio foi trocado/adicionado normalmente', w.MT.session.items.some(it => it.ex === 'supino_reto'));

  console.log('\n== respeita prefers-reduced-motion: sem animacao, quadros lado a lado, sem botao de pausar ==');
  w = await boot(null, ww => {
    ww.matchMedia = q => ({matches: /reduced-motion/.test(q), media: q, addEventListener(){}, removeEventListener(){}});
  });
  $ = seletor(w);
  $('daylist').querySelector('[data-open="upperA"]').click();
  await wait(20);
  $('btn-begin').click();
  await wait(20);
  const uidSupino2 = w.MT.session.items.find(it => it.ex === 'supino_reto').uid;
  $('card-' + uidSupino2).querySelector('.exthumb').click();
  await wait(30);
  check('sem motion reduzido, mostra os dois quadros lado a lado', $('exec-body').querySelector('.execframes.lado-a-lado') && $('exec-body').querySelectorAll('.execframes picture').length === 2);
  check('sem motion reduzido, nao tem botao de pausar (nao ha animacao pra pausar)', !$('exec-pausar'));
  await wait(950);
  check('nao alterna sozinho com motion reduzido', !$('exec-body').querySelector('.execframes').classList.contains('frame-b'));

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
