const { boot, wait, criarCheck, seletor } = require('./_helpers');
const check = criarCheck();

/* montarCartaoResumo() é a camada de dados do card compartilhável, separada
   do desenho de propósito: o canvas não roda em jsdom, mas o que vai escrito
   no card sim, e é onde moram os erros que a pessoa vê (nome errado, data
   fora do formato, série mal formatada, recorde de mais).

   Cobre também o fluxo da foto tirada na hora de compartilhar: ela entra como
   fundo do card, fica só em memória e é descartada ao sair do resumo. */

function mockarCanvas(w){
  w.HTMLCanvasElement.prototype.getContext = function(){
    return {
      fillStyle:'', strokeStyle:'', lineWidth:1, font:'', textAlign:'left', textBaseline:'alphabetic',
      fillRect(){}, save(){}, restore(){}, beginPath(){}, arc(){}, closePath(){}, clip(){},
      drawImage(){}, fillText(){}, moveTo(){}, lineTo(){}, stroke(){},
      createLinearGradient(){ return {addColorStop(){}}; },
      measureText(t){ return {width: t.length * 14}; }
    };
  };
  w.HTMLCanvasElement.prototype.toBlob = function(cb){ cb(new Blob(['fake-png'], {type:'image/png'})); };
}

const PERFIL = {nome:'Ana', objetivo:'hipertrofia', dias:3, local:'casa', tempo:45, dores:[], prioridade:[]};

const TREINO = {
  id: 'w_1', key:'upperA', name:'Superiores A', tag:'DIA 1', block:'upper',
  date: '2026-08-03T10:00:00.000Z',
  duration: 3540, volume: 6681, setsDone: 22, cardioMin: 0,
  exercises: [
    {exId:'supino_reto', name:'Supino reto barra', type:'reps', sets:[{w:'20', r:'12'}, {w:'40', r:'4'}]},
    {exId:'remada_baixa', name:'Remada baixa pegada neutra', type:'reps', sets:[{w:'40', r:'12'}]},
    {exId:'prancha', name:'Prancha abdominal', type:'time', sets:[{w:'', r:'45'}]}
  ]
};
const RECORDES = [
  {name:'Supino reto barra', detail:'40 kg x 4', first:false},
  {name:'Remada baixa pegada neutra', detail:'40 kg x 12', first:false},
  {name:'Elevação frontal', detail:'10 kg x 12', first:false},
  {name:'Abdominal na máquina', detail:'45 kg x 15', first:false},
  {name:'Quinto recorde', detail:'5 kg x 5', first:true}
];

(async () => {
  const w = await boot({mt_profile: JSON.stringify(PERFIL)});
  mockarCanvas(w);
  const $ = seletor(w);
  const MT = w.MT;
  const montar = MT.montarCartaoResumo;

  console.log('\n== o card sai com os mesmos numeros do resumo ==');
  const card = montar(TREINO, RECORDES);
  check('leva o nome de quem treinou, nao um generico', card.nome === 'Ana');
  check('titulo e o nome do treino', card.titulo === 'Superiores A');
  check('data escrita por extenso em portugues', /segunda|domingo|terça|quarta|quinta|sexta|sábado/.test(card.data));
  check('duracao convertida de segundos pra minutos inteiros', card.stats[0].valor === '59' && card.stats[0].rotulo === 'MINUTOS');
  check('series vem do setsDone', card.stats[1].valor === '22' && card.stats[1].rotulo === 'SÉRIES');
  check('volume vem do entry', card.stats[2].valor === '6681' && card.stats[2].rotulo === 'VOLUME KG');
  check('tem exatamente as tres estatisticas do resumo', card.stats.length === 3);
  check('todo stat e string, pronto pro fillText', card.stats.every(s => typeof s.valor === 'string'));

  console.log('\n== recordes entram no card, com teto de 4 pra nao estourar a altura ==');
  check('corta em 4 mesmo recebendo 5', card.recordes.length === 4);
  check('mantem a ordem recebida', card.recordes[0].nome === 'Supino reto barra');
  check('leva o detalhe formatado', card.recordes[0].detalhe === '40 kg x 4');
  check('o quinto recorde ficou de fora', !card.recordes.some(r => r.nome === 'Quinto recorde'));
  check('sem recorde nenhum, a lista vem vazia em vez de quebrar', montar(TREINO, []).recordes.length === 0);
  check('prs ausente tambem nao quebra', montar(TREINO, undefined).recordes.length === 0);

  console.log('\n== series registradas viram uma linha de texto por exercicio ==');
  check('um item por exercicio', card.exercicios.length === 3);
  check('nome do exercicio preservado', card.exercicios[0].nome === 'Supino reto barra');
  check('series de carga saem como "20kg x 12"', card.exercicios[0].series.includes('20kg x 12'));
  check('varias series na mesma linha', card.exercicios[0].series.includes('40kg x 4'));
  check('exercicio de tempo usa segundos, nao kg', card.exercicios[2].series === '45s');
  const semEx = montar(Object.assign({}, TREINO, {exercises: []}), RECORDES);
  check('treino sem exercicio nao quebra', semEx.exercicios.length === 0);

  check('a marca do app vai no card', card.marca === 'MEU TREINO');
  check('inicial do nome quando existe perfil', card.inicial === 'A');
  check('com foto de perfil ausente, avatar e null', card.avatar === null);

  console.log('\n== foto tirada na hora: entra no card e sai ao deixar o resumo ==');
  check('o botao de adicionar foto existe no resumo', !!$('btn-sum-foto'));
  check('comeca escrito "Adicionar foto"', $('btn-sum-foto').textContent === 'Adicionar foto');
  check('o botao de remover comeca escondido', $('btn-sum-foto-remover').style.display === 'none');
  const campo = $('sum-foto-file');
  check('o campo abre a camera no celular (capture)', campo.getAttribute('capture') === 'environment');
  check('o campo aceita so imagem', campo.getAttribute('accept') === 'image/*');

  // createImageBitmap nao existe em jsdom: devolve um retangulo falso, que e
  // tudo que desenharFotoDeFundo precisa pra calcular o recorte
  w.createImageBitmap = async () => ({width: 900, height: 1600, close(){}});
  global.createImageBitmap = w.createImageBitmap;

  /* a foto so entra depois que existe um resumo aberto, entao finaliza um
     treino de verdade em vez de chamar a funcao no vazio */
  $('daylist').querySelector('[data-open="lowerA"]').click();
  await wait(20);
  $('btn-begin').click();
  await wait(20);
  const uid0 = [...$('exlist').querySelectorAll('.excard[data-uid]')].map(c => c.dataset.uid)[0];
  const linha = $('card-' + uid0).querySelectorAll('.setrow')[0];
  const wi = linha.querySelector('input[data-f="w"]'); wi.value = '100'; wi.dispatchEvent(new w.Event('input', {bubbles:true}));
  const ri = linha.querySelector('input[data-f="r"]'); ri.value = '8'; ri.dispatchEvent(new w.Event('input', {bubbles:true}));
  $('card-' + uid0).querySelector('[data-check="' + uid0 + '|0"]').click();
  await wait(20);
  $('btn-finish').click();
  await wait(180);
  check('o resumo abriu, com a imagem ja pronta', !!w.MT._shareFile);
  const semFoto = w.MT._shareFile;

  const arquivoFalso = new w.File(['x'], 'foto.jpg', {type: 'image/jpeg'});
  await w.MT.usarFoto(arquivoFalso);
  await wait(60);
  check('depois de escolher, o botao vira "Trocar foto"', $('btn-sum-foto').textContent === 'Trocar foto');
  check('o botao de remover aparece', $('btn-sum-foto-remover').style.display !== 'none');
  check('a imagem foi regerada com a foto, nao ficou a antiga', w.MT._shareFile && w.MT._shareFile !== semFoto);
  check('e continua sendo um PNG compartilhavel', w.MT._shareFile.type === 'image/png');

  await w.MT.removerFoto();
  await wait(60);
  check('remover volta o rotulo pra "Adicionar foto"', $('btn-sum-foto').textContent === 'Adicionar foto');
  check('remover esconde o botao de remover de novo', $('btn-sum-foto-remover').style.display === 'none');

  console.log('\n== arquivo que nao e imagem e recusado com aviso ==');
  const naoImagem = new w.File(['x'], 'treino.json', {type: 'application/json'});
  await w.MT.usarFoto(naoImagem);
  await wait(40);
  check('avisa que precisa ser imagem', $('toast').textContent.includes('imagem'));
  check('e nao marca foto nenhuma', $('btn-sum-foto').textContent === 'Adicionar foto');

  console.log('\n== recordes de um treino antigo saem do que existia ANTES dele ==');
  const rec = MT.recordesDoTreino;
  const dia = n => new Date(Date.now() - n * 86400000).toISOString();
  const sessao = (id, diasAtras, w, r) => ({
    id: id, name:'Treino', date: dia(diasAtras), duration: 3000, volume: 100, setsDone: 1,
    exercises: [{exId:'supino_reto', name:'Supino reto barra', type:'reps', sets:[{w:String(w), r:String(r)}]}]
  });
  // 60kg (antigo) -> 80kg (meio) -> 100kg (recente)
  const linhaDoTempo = [sessao('h3', 1, 100, 5), sessao('h2', 10, 80, 5), sessao('h1', 20, 60, 5)];
  const doMeio = rec(linhaDoTempo[1], linhaDoTempo);
  check('o treino do meio conta como recorde na epoca dele (80 superou 60)', doMeio.length === 1);
  check('e mostra a carga daquele dia, nao a de hoje', doMeio[0].detail === '80 kg x 5');
  const oMaisAntigo = rec(linhaDoTempo[2], linhaDoTempo);
  check('o primeiro treino do exercicio conta como primeiro registro', oMaisAntigo.length === 1 && oMaisAntigo[0].first === true);
  const semRecorde = rec(sessao('h4', 5, 70, 5), linhaDoTempo);
  check('treino que nao superou o anterior nao vira recorde', semRecorde.length === 0);
  check('o proprio treino nao entra na comparacao consigo mesmo', rec(linhaDoTempo[0], linhaDoTempo).length === 1);
  const soTempo = {id:'t', name:'T', date: dia(2), duration: 60, volume: 0, setsDone: 1,
    exercises: [{exId:'prancha', name:'Prancha abdominal', type:'time', sets:[{w:'', r:'60'}]}]};
  check('exercicio de tempo nao gera recorde de carga', rec(soTempo, [soTempo]).length === 0);
  check('historico vazio nao quebra', rec(linhaDoTempo[0], []).length === 1);

  console.log('\n== compartilhar um treino antigo pelo historico ==');
  $('nav-history').click();
  await wait(60);
  const cardHist = $('histlist').querySelector('[data-hist]');
  check('o treino finalizado aparece no historico', !!cardHist);
  const idHist = cardHist.dataset.hist;
  check('o card fechado ainda nao mostra o botao', $('hd-' + idHist).className.indexOf('open') === -1);
  cardHist.click();
  await wait(300);
  check('abrir o card revela o botao de compartilhar', !!$('histlist').querySelector('[data-sharehist="' + idHist + '"]'));
  check('abrir o card ja deixa a imagem pronta, sem esperar o clique', !!w.MT._shareFile);
  check('a imagem do historico e um PNG', w.MT._shareFile.type === 'image/png');
  check('o arquivo cita o treino do historico', w.MT._shareFile.name === 'treino-' + idHist + '.png');
  check('compartilhar pelo historico nao carrega a foto do resumo anterior',
    $('btn-sum-foto').textContent === 'Adicionar foto');

  let compartilhou = null;
  w.navigator.share = arg => { compartilhou = arg; return Promise.resolve(); };
  w.navigator.canShare = () => true;
  $('histlist').querySelector('[data-sharehist="' + idHist + '"]').click();
  await wait(60);
  check('o botao do historico dispara o compartilhamento', !!compartilhou);
  check('e manda o arquivo daquele treino', compartilhou && compartilhou.files[0].name === 'treino-' + idHist + '.png');

  /* por ultimo porque abre outra janela e fecha a de cima */
  console.log('\n== o card se vira sem perfil nenhum ==');
  const semPerfil = await boot();
  mockarCanvas(semPerfil);
  const cardSemPerfil = semPerfil.MT.montarCartaoResumo(TREINO, []);
  check('sem nome no perfil, usa o nome do app', cardSemPerfil.nome === 'Meu Treino');
  check('sem perfil, a inicial vem vazia em vez de undefined', cardSemPerfil.inicial === '');
  check('sem perfil, ainda monta os stats normalmente', cardSemPerfil.stats.length === 3);

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
