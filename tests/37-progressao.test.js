const { boot, wait, criarCheck, seletor } = require('./_helpers');
const check = criarCheck();

/* Motor de progressão, modelo de dupla progressão: com a mesma carga a
   pessoa enche as repetições dentro da faixa, e só quando fecha todas as
   séries no topo é que a carga sobe. Três sessões no mesmo ponto sugerem
   alívio. Nada disso é automático: a carga nova só passa a valer depois do
   toque de confirmar no resumo.

   A função é pura de propósito, então dá pra testar cada regra sem tela. */

const PERFIL = {nome:'Ana', experiencia:'intermediario', dias:4, tempo:60, local:'academia', objetivo:'hipertrofia', dores:[], prioridade:[]};

/* sessões vêm da mais recente pra mais antiga, como ultimasSessoesDoExercicio */
const sessao = (carga, reps, prescritos) => ({
  sets: reps.map(r => ({w: String(carga), r: String(r)})),
  setsPrescritos: prescritos === undefined ? reps.length : prescritos
});

(async () => {
  const w = await boot({mt_profile: JSON.stringify(PERFIL)});
  /* o resumo gera a imagem de compartilhar ao renderizar e jsdom nao tem
     canvas: sem o mock o teste passa, mas cospe erro no meio da saida */
  w.HTMLCanvasElement.prototype.getContext = () => ({
    fillStyle:'', strokeStyle:'', lineWidth:1, font:'', textAlign:'left', textBaseline:'alphabetic',
    shadowColor:'', shadowBlur:0, shadowOffsetY:0,
    fillRect(){}, save(){}, restore(){}, beginPath(){}, arc(){}, closePath(){}, clip(){},
    drawImage(){}, fillText(){}, moveTo(){}, lineTo(){}, stroke(){},
    createLinearGradient(){ return {addColorStop(){}}; },
    measureText(t){ return {width: t.length * 14}; }
  });
  w.HTMLCanvasElement.prototype.toBlob = cb => cb(new Blob(['x'], {type:'image/png'}));
  const MT = w.MT;
  const p = MT.progressao;
  const supino = {exId:'supino_reto', reps:'6-8', type:'reps', regiao:'superior'};

  console.log('\n== sem histórico, o motor não chuta carga ==');
  check('primeira vez tem tipo próprio', p([], supino).tipo === 'primeira');
  check('histórico nulo também', p(null, supino).tipo === 'primeira');
  check('exercício de tempo não entra no motor de carga', p([sessao(0,[45])], {exId:'prancha', reps:'30-45', type:'time'}) === null);
  check('faixa de repetição ilegível não gera sugestão', p([sessao(40,[8])], {exId:'supino_reto', reps:'', type:'reps'}) === null);

  console.log('\n== estágio 1: dentro da faixa, segura a carga e pede repetição ==');
  const meio = p([sessao(40, [7,7,6])], supino);
  check('tipo é manter', meio.tipo === 'manter');
  check('mantém a carga da última vez', meio.cargaSugerida === 40);
  check('diz quantas repetições faltam pra subir', /faltam 2 repetições/.test(MT.formatarProgressao(meio)));
  const quaseLa = p([sessao(40, [8,8,7])], supino);
  check('uma série abaixo do topo ainda segura', quaseLa.tipo === 'manter');
  check('e o texto fica no singular com uma faltando', /falta 1 repetição/.test(MT.formatarProgressao(quaseLa)));

  console.log('\n== estágio 2: topo em todas as séries sobe a carga ==');
  const subiu = p([sessao(40, [8,8,8])], supino);
  check('tipo é subir', subiu.tipo === 'subir');
  check('a carga sobe de verdade', subiu.cargaSugerida > 40);
  check('o texto explica por que subiu', /fechou 8 em todas as séries/.test(MT.formatarProgressao(subiu)));
  check('passar do topo também sobe', p([sessao(40, [9,10,9])], supino).tipo === 'subir');

  console.log('\n== série não concluída não conta como faixa fechada ==');
  const incompleto = p([sessao(40, [8,8], 4)], supino);
  check('fez 2 de 4 séries no topo, mas não fechou o treino', incompleto.tipo !== 'subir');
  check('treino antigo sem setsPrescritos é tratado como completo, não penalizado',
    p([{sets:[{w:'40',r:'8'},{w:'40',r:'8'}], setsPrescritos: null}], supino).tipo === 'subir');

  console.log('\n== incremento respeita o que o equipamento permite ==');
  const inc = MT.incrementoCarga;
  check('barra de perna sobe de 5 em 5', inc('agachamento', 'inferior') === 5);
  check('barra de superior sobe de 2,5 em 2,5', inc('supino_reto', 'superior') === 2.5);
  check('halter sobe de 2 em 2', inc('supino_halteres', 'superior') === 2);
  check('máquina sobe uma placa', inc('leg_press', 'inferior') === 5);
  check('polia também', inc('triceps_corda', 'superior') === 5);
  const naMaquina = p([sessao(50, [12,12,12])], {exId:'leg_press', reps:'10-12', type:'reps', regiao:'inferior'});
  check('a sugestão da máquina cai em número redondo de placa', naMaquina.cargaSugerida === 55);
  const noHalter = p([sessao(20, [8,8,8])], {exId:'supino_halteres', reps:'6-8', type:'reps', regiao:'superior'});
  check('halter sobe sem inventar meio quilo', noHalter.cargaSugerida > 20 && (noHalter.cargaSugerida * 2) % 1 === 0);

  console.log('\n== três sessões no mesmo ponto sugerem alívio ==');
  const travado = [sessao(60,[6,6,6]), sessao(60,[6,6,6]), sessao(60,[6,6,6])];
  const alivio = p(travado, supino);
  check('tipo é aliviar', alivio.tipo === 'aliviar');
  check('a carga desce', alivio.cargaSugerida < 60);
  check('desce cerca de 10%', alivio.cargaSugerida >= 52.5 && alivio.cargaSugerida <= 55);
  check('conta quantas sessões travadas', alivio.sessoes >= 3);

  console.log('\n== duas sessões não bastam, e progredir zera a contagem ==');
  check('duas no mesmo ponto ainda é manter', p([sessao(60,[6,6,6]), sessao(60,[6,6,6])], supino).tipo === 'manter');
  const ganhouRep = [sessao(60,[7,7,7]), sessao(60,[6,6,6]), sessao(60,[6,6,6])];
  check('ganhar repetição com a mesma carga é progresso, não travamento', p(ganhouRep, supino).tipo === 'manter');
  const subiuCarga = [sessao(60,[6,6,6]), sessao(55,[6,6,6]), sessao(55,[6,6,6])];
  check('ter subido a carga na última também não é travamento', p(subiuCarga, supino).tipo === 'manter');

  console.log('\n== o texto do alívio não culpa a pessoa ==');
  const txt = MT.formatarProgressao(alivio);
  check('fala em destravar, não em falhar', /destravar/.test(txt));
  check('não usa palavra de fracasso', !/falh|erro|fracass|não conseguiu|regred/i.test(txt));
  check('não usa ponto de exclamação de cobrança', !/!/.test(txt));

  console.log('\n== carga confirmada pela pessoa vence o cálculo do motor ==');
  const comAlvo = Object.assign({}, supino, {cargaAlvo: 45});
  const confirmada = p([sessao(40, [7,7,6])], comAlvo);
  check('a decisão dela aparece em vez do manter', confirmada.tipo === 'confirmada');
  check('e com a carga que ela marcou', confirmada.cargaSugerida === 45);
  check('o texto lembra que foi ela quem marcou', /você marcou/.test(MT.formatarProgressao(confirmada)));
  check('alvo igual ao que já foi feito não vira aviso', p([sessao(45, [7,7,6])], comAlvo).tipo === 'manter');

  console.log('\n== na tela: o bloco de confirmação só aparece quando há decisão ==');
  const $ = seletor(w);
  $('daylist').querySelector('[data-open="upperA"]').click();
  await wait(20);
  $('btn-begin').click();
  await wait(20);
  const uid = MT.session.items[0].uid;
  /* marcar uma série re-renderiza o card, entao as linhas precisam ser
     buscadas de novo a cada volta: guardar a lista de fora deixaria as
     referencias orfas e so a primeira serie seria marcada */
  const totalSeries = MT.session.items[0].sets;
  for(let i = 0; i < totalSeries; i++){
    const linha = $('card-' + uid).querySelectorAll('.setrow')[i];
    const wi = linha.querySelector('input[data-f="w"]'); wi.value = '40'; wi.dispatchEvent(new w.Event('input', {bubbles:true}));
    const ri = linha.querySelector('input[data-f="r"]'); ri.value = '8'; ri.dispatchEvent(new w.Event('input', {bubbles:true}));
    $('card-' + uid).querySelectorAll('.setrow')[i].querySelector('.checkbtn').click();
    await wait(20);
    const skip = $('rest-skip'); if(skip) skip.click();
    await wait(15);
  }
  $('btn-finish').click();
  await wait(250);

  check('o resumo abriu', $('screen-summary').classList.contains('active'));
  check('o bloco de progressão aparece', $('sum-progressao').style.display !== 'none');
  check('e propõe o exercício que fechou a faixa', $('sum-progressao').textContent.includes('Supino reto barra'));
  check('com um campo editável pra ajustar a carga', !!$('sum-progressao').querySelector('.pg-input'));
  check('tem o botão de confirmar', !!$('prog-confirmar'));
  check('e o de manter como está', !!$('prog-manter'));
  check('nada foi gravado antes do toque', !(MT.settings.cargaAlvo || {}).supino_reto);

  console.log('\n== confirmar grava o alvo do próximo treino ==');
  const campo = $('sum-progressao').querySelector('.pg-input');
  const propostaAutomatica = parseFloat(campo.value);
  check('a proposta já vem preenchida', propostaAutomatica > 40);
  campo.value = '44';   // a pessoa ajusta na mão
  $('prog-confirmar').click();
  await wait(80);
  check('grava a carga que a pessoa deixou no campo, não a proposta', MT.settings.cargaAlvo.supino_reto === 44);
  check('o bloco confirma o que foi anotado', /aparece no próximo treino|aparecem no próximo treino/.test($('sum-progressao').textContent));
  check('e some com os botões, pra não confirmar duas vezes', !$('prog-confirmar'));

  console.log('\n== "manter como está" não grava nada ==');
  const w2 = await boot({mt_profile: JSON.stringify(PERFIL)});
  w2.HTMLCanvasElement.prototype.getContext = w.HTMLCanvasElement.prototype.getContext;
  w2.HTMLCanvasElement.prototype.toBlob = cb => cb(new Blob(['x'], {type:'image/png'}));
  const MT2 = w2.MT;
  const $2 = seletor(w2);
  $2('daylist').querySelector('[data-open="upperA"]').click();
  await wait(20);
  $2('btn-begin').click();
  await wait(20);
  const uid2 = MT2.session.items[0].uid;
  const total2 = MT2.session.items[0].sets;
  for(let i = 0; i < total2; i++){
    const linha = $2('card-' + uid2).querySelectorAll('.setrow')[i];
    const wi = linha.querySelector('input[data-f="w"]'); wi.value = '40'; wi.dispatchEvent(new w2.Event('input', {bubbles:true}));
    const ri = linha.querySelector('input[data-f="r"]'); ri.value = '8'; ri.dispatchEvent(new w2.Event('input', {bubbles:true}));
    $2('card-' + uid2).querySelectorAll('.setrow')[i].querySelector('.checkbtn').click();
    await wait(20);
    const s2 = $2('rest-skip'); if(s2) s2.click();
    await wait(15);
  }
  $2('btn-finish').click();
  await wait(250);
  $2('prog-manter').click();
  await wait(60);
  check('recusar não grava carga alvo nenhuma', !(MT2.settings.cargaAlvo || {}).supino_reto);
  check('e avisa que segue como está', /seguem como estão/.test($2('sum-progressao').textContent));

  console.log('\n== o histórico passou a guardar quantas séries foram prescritas ==');
  const ex = MT2.history[0].exercises.find(e => e.exId === 'supino_reto');
  check('o exercício foi salvo', !!ex);
  check('com setsPrescritos preenchido', typeof ex.setsPrescritos === 'number' && ex.setsPrescritos > 0);
  check('e bate com o que a sessão pedia', ex.setsPrescritos >= ex.sets.length);

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 30000);
