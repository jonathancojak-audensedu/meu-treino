const { boot, wait, criarCheck, seletor } = require('./_helpers');
const check = criarCheck();

/* metricasDaHome() é função pura de propósito: entra histórico, perfil e a
   hora de agora, sai o painel pronto. Assim dá pra testar virada de semana,
   sequência e estado vazio fixando o "agora", sem depender de quando os
   testes rodam nem de abrir o app. */

const PERFIL = {nome:'Ana', objetivo:'hipertrofia', dias:4, local:'casa', tempo:45, dores:[], prioridade:[]};

/* segunda-feira, pra ancorar as contas de semana num dia conhecido */
const SEGUNDA = new Date('2026-08-03T09:00:00');
const menos = (base, dias, horas) => new Date(base.getTime() - dias * 86400000 - (horas || 0) * 3600000).toISOString();

const treino = (id, data, extra) => Object.assign({
  id: id, key:'upperA', name:'Superiores A', tag:'DIA 1', block:'upper',
  date: data, duration: 3540, volume: 5000, setsDone: 20,
  exercises: [{exId:'supino_reto', name:'Supino reto barra', type:'reps', sets:[{w:'60', r:'8'}]}]
}, extra || {});

(async () => {
  const w = await boot({mt_profile: JSON.stringify(PERFIL)});
  /* o resumo do treino gera a imagem de compartilhar ao renderizar, e jsdom
     não tem canvas: sem este mock o teste ainda passa, mas cospe um erro
     "not implemented" no meio da saída */
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
  const m = MT.metricasDaHome;

  console.log('\n== histórico vazio: nada de zero quebrado, o painel se declara vazio ==');
  const vazio = m([], PERFIL, SEGUNDA);
  check('marca que está vazio', vazio.vazio === true);
  check('sequência zerada em vez de undefined', vazio.sequencia === 0);
  check('treinos da semana zerados', vazio.treinosSemana === 0);
  check('recordes zerados', vazio.recordes === 0);
  check('sem último treino', vazio.ultimo === null);
  check('histórico nulo também não quebra', m(null, PERFIL, SEGUNDA).vazio === true);
  check('sem perfil e sem histórico continua vazio, sem estourar', m([], null, SEGUNDA).vazio === true);

  console.log('\n== treinos desta semana contam contra a meta do perfil ==');
  const nestaSemana = [
    treino('a', menos(SEGUNDA, 0, 2)),   // hoje, segunda
    treino('b', menos(SEGUNDA, 0, 5)),   // hoje mais cedo
    treino('c', menos(SEGUNDA, 4))       // quinta passada, semana anterior
  ];
  const r1 = m(nestaSemana, PERFIL, SEGUNDA);
  check('conta só os desta semana', r1.treinosSemana === 2);
  check('a meta vem do perfil', r1.metaSemanal === 4);
  check('total conta tudo', r1.total === 3);
  check('sem perfil, fica sem meta em vez de inventar uma', m(nestaSemana, null, SEGUNDA).metaSemanal === null);
  check('perfil sem dias válidos também fica sem meta', m(nestaSemana, {nome:'X'}, SEGUNDA).metaSemanal === null);

  console.log('\n== sequência conta semanas seguidas, não dias ==');
  const tresSemanas = [
    treino('s0', menos(SEGUNDA, 0, 2)),  // semana atual
    treino('s1', menos(SEGUNDA, 3)),     // semana passada
    treino('s2', menos(SEGUNDA, 10))     // duas semanas atrás
  ];
  check('três semanas seguidas', m(tresSemanas, PERFIL, SEGUNDA).sequencia === 3);
  check('um treino só já vale uma semana', m([treino('u', menos(SEGUNDA, 0, 1))], PERFIL, SEGUNDA).sequencia === 1);
  check('vários treinos na mesma semana ainda contam uma', m([
    treino('x1', menos(SEGUNDA, 0, 1)), treino('x2', menos(SEGUNDA, 0, 3))
  ], PERFIL, SEGUNDA).sequencia === 1);

  const comBuraco = [
    treino('n0', menos(SEGUNDA, 0, 2)),  // semana atual
    treino('n2', menos(SEGUNDA, 10)),    // pulou a semana passada
    treino('n3', menos(SEGUNDA, 17))
  ];
  check('semana em branco quebra a sequência', m(comBuraco, PERFIL, SEGUNDA).sequencia === 1);

  console.log('\n== a semana atual é de graça: segunda de manhã não zera o que foi construído ==');
  const semTreinarAinda = [
    treino('p1', menos(SEGUNDA, 3)),     // semana passada
    treino('p2', menos(SEGUNDA, 10)),
    treino('p3', menos(SEGUNDA, 17))
  ];
  check('sem treino nesta semana, a sequência das anteriores continua valendo', m(semTreinarAinda, PERFIL, SEGUNDA).sequencia === 3);
  check('e os treinos desta semana continuam zero', m(semTreinarAinda, PERFIL, SEGUNDA).treinosSemana === 0);
  const paradoHaDuasSemanas = [treino('q1', menos(SEGUNDA, 10)), treino('q2', menos(SEGUNDA, 17))];
  check('duas semanas sem treinar aí sim zera', m(paradoHaDuasSemanas, PERFIL, SEGUNDA).sequencia === 0);

  console.log('\n== recordes: conta a cada vez que a carga máxima do exercício subiu ==');
  const carga = (id, dias, w2, r2, exId) => treino(id, menos(SEGUNDA, dias), {
    exercises: [{exId: exId || 'supino_reto', name:'Supino', type:'reps', sets:[{w:String(w2), r:String(r2)}]}]
  });
  check('progressão de 3 cargas = 3 recordes', m([carga('c1',20,60,8), carga('c2',10,70,8), carga('c3',3,80,8)], PERFIL, SEGUNDA).recordes === 3);
  check('carga que não superou não vira recorde', m([carga('d1',20,60,8), carga('d2',10,50,8)], PERFIL, SEGUNDA).recordes === 1);
  check('mesma carga com mais repetição conta como recorde', m([carga('e1',20,60,8), carga('e2',10,60,10)], PERFIL, SEGUNDA).recordes === 2);
  check('exercícios diferentes contam separado', m([carga('f1',20,60,8,'supino_reto'), carga('f2',10,20,8,'rosca_direta')], PERFIL, SEGUNDA).recordes === 2);
  check('ordem embaralhada não muda a conta', m([carga('g3',3,80,8), carga('g1',20,60,8), carga('g2',10,70,8)], PERFIL, SEGUNDA).recordes === 3);
  const soTempo = treino('t1', menos(SEGUNDA, 2), {exercises:[{exId:'prancha', name:'Prancha', type:'time', sets:[{w:'', r:'60'}]}]});
  check('exercício de tempo não gera recorde de carga', m([soTempo], PERFIL, SEGUNDA).recordes === 0);
  const semSerie = treino('t2', menos(SEGUNDA, 2), {exercises:[{exId:'supino_reto', name:'S', type:'reps', sets:[]}]});
  check('exercício sem série registrada não quebra', m([semSerie], PERFIL, SEGUNDA).recordes === 0);

  console.log('\n== último treino sai do mais recente, não do primeiro do array ==');
  const foraDeOrdem = [
    treino('v1', menos(SEGUNDA, 9), {name:'Antigo', duration: 1800, volume: 1000, setsDone: 5}),
    treino('v2', menos(SEGUNDA, 1), {name:'Recente', duration: 3600, volume: 7000, setsDone: 22})
  ];
  const ult = m(foraDeOrdem, PERFIL, SEGUNDA).ultimo;
  check('pega o mais recente por data', ult.nome === 'Recente');
  check('duração convertida pra minutos', ult.minutos === 60);
  check('volume preservado', ult.volume === 7000);
  check('séries preservadas', ult.series === 22);
  const semDuracao = m([treino('z', menos(SEGUNDA, 1), {duration: 0, volume: 0, setsDone: 0})], PERFIL, SEGUNDA).ultimo;
  check('treino sem duração nem volume não vira NaN', semDuracao.minutos === 0 && semDuracao.volume === 0);

  console.log('\n== na tela: usuário novo vê convite, não tela vazia ==');
  const $ = seletor(w);
  check('a saudação cumprimenta pelo nome', /Ana/.test($('home-saudacao').textContent));
  check('e usa bom dia, boa tarde ou boa noite', /Bom dia|Boa tarde|Boa noite/.test($('home-saudacao').textContent));
  check('mostra uma frase de boas-vindas', $('home-frase').textContent.length > 10);
  check('bloco da meta convida em vez de mostrar 0/4', $('home-meta').textContent.includes('primeira semana'));
  check('a faixa da semana some enquanto não há treino', $('home-semana').style.display === 'none');
  check('o gráfico vira convite em vez de eixo vazio', $('home-grafico').textContent.includes('gráfico aparece aqui'));
  check('não desenha barra nenhuma sem dado', !$('home-grafico').querySelector('.barchart'));
  check('números secundários ficam escondidos', $('home-mini').style.display === 'none');
  check('o próximo treino é a ação principal', !!$('home-proximo').querySelector('.proxcard'));
  check('e convida a começar o primeiro', $('home-proximo').textContent.includes('primeiro treino'));

  console.log('\n== as frases de boas-vindas são conteúdo revisado, não podem regredir ==');
  const frases = MT.FRASES_BOAS_VINDAS;
  check('o pool tem 24 frases', frases.length === 24);
  check('nenhuma frase repetida', new Set(frases).size === frases.length);
  check('nenhuma vazia', frases.every(f => typeof f === 'string' && f.trim().length > 8));
  check('nenhuma usa travessão, que o projeto não usa', frases.every(f => !f.includes('—')));
  /* estas quatro foram trocadas na revisão de tom: a de "o corpo aguenta mais
     do que a cabeça acha" incentivava passar por cima do limite, e as outras
     soavam como cobrança ou clichê. Não devem voltar. */
  const removidas = ['O corpo aguenta mais', 'Ninguém nunca se arrependeu', 'O que não é registrado', 'é sobre ser melhor que ontem'];
  check('nenhuma das frases removidas na revisão voltou', removidas.every(r => !frases.some(f => f.includes(r))));
  const aprovadas = ['Consistência constrói mais que exagero.', 'Treino registrado é evolução que você vê crescer.', 'Ninguém se arrepende de ter treinado.', 'Melhor que ontem já é vitória.'];
  check('as quatro frases revisadas estão no pool', aprovadas.every(a => frases.includes(a)));

  console.log('\n== a faixa da semana marca os sete dias ==');
  const dias = MT.metricasDaHome([{id:'d1', name:'T', date:new Date(SEGUNDA.getTime() + 2*3600000).toISOString(), duration:600, volume:100, setsDone:5, exercises:[]}], PERFIL, SEGUNDA).diasDaSemana;
  check('sempre sete posições', dias.length === 7);
  check('começa na segunda', dias[0].rotulo === 'S' && dias[6].rotulo === 'D');
  check('marca o dia em que houve treino', dias[0].treinou === true);
  check('não marca os outros', dias.filter(d => d.treinou).length === 1);
  check('sabe qual é hoje', dias[0].hoje === true);
  check('e o que ainda não chegou', dias[6].futuro === true);

  console.log('\n== a métrica do gráfico sai do dado da pessoa e não muda sozinha ==');
  const comCarga = [{id:'g1', name:'T', date: menos(SEGUNDA, 3), duration:600, volume:5000, setsDone:20, exercises:[]}];
  const semCarga = [{id:'g2', name:'T', date: menos(SEGUNDA, 3), duration:600, volume:0, setsDone:18, exercises:[]}];
  const semNada = [{id:'g3', name:'T', date: menos(SEGUNDA, 3), duration:600, volume:0, setsDone:0, exercises:[]}];
  check('quem registra carga vê volume', MT.metricaSugerida(comCarga) === 'volume');
  check('quem não registra carga cai pra séries', MT.metricaSugerida(semCarga) === 'series');
  check('sem carga e sem série, cai pra treinos', MT.metricaSugerida(semNada) === 'treinos');
  const gv = MT.graficoDaHome(comCarga, 'volume', SEGUNDA);
  check('o gráfico vem sempre rotulado', gv.titulo === 'Volume por semana');
  check('a escolha manual é respeitada, mesmo contrariando o dado',
    MT.graficoDaHome(comCarga, 'treinos', SEGUNDA).titulo === 'Treinos por semana');
  check('oito semanas de barras, sempre', gv.barras.length === 8);
  check('a última barra é a semana atual', gv.barras[7].atual === true);
  check('semana sem treino vira barra zerada, não some do gráfico', gv.barras[0].valor === 0);
  check('com uma semana só de dado, ainda não desenha', gv.suficiente === false);
  const duasSemanas = [
    {id:'s1', name:'T', date: menos(SEGUNDA, 2), duration:600, volume:5000, setsDone:20, exercises:[]},
    {id:'s2', name:'T', date: menos(SEGUNDA, 9), duration:600, volume:4000, setsDone:18, exercises:[]}
  ];
  check('com duas semanas, o gráfico aparece', MT.graficoDaHome(duasSemanas, 'volume', SEGUNDA).suficiente === true);
  check('e soma o total do período', MT.graficoDaHome(duasSemanas, 'volume', SEGUNDA).total === 9000);

  console.log('\n== na tela: depois de treinar, o painel se enche ==');
  $('daylist').querySelector('[data-open="upperA"]').click();
  await wait(20);
  $('btn-begin').click();
  await wait(20);
  const uid = MT.session.items[0].uid;
  const linha = $('card-' + uid).querySelectorAll('.setrow')[0];
  const wi = linha.querySelector('input[data-f="w"]'); wi.value = '60'; wi.dispatchEvent(new w.Event('input', {bubbles:true}));
  const ri = linha.querySelector('input[data-f="r"]'); ri.value = '8'; ri.dispatchEvent(new w.Event('input', {bubbles:true}));
  $('card-' + uid).querySelector('[data-check="' + uid + '|0"]').click();
  await wait(20);
  $('btn-finish').click();
  await wait(200);
  $('btn-sum-done').click();
  await wait(80);

  check('a meta mostra 1 de 4', $('home-meta').textContent.replace(/\s/g,'').includes('1/4'));
  check('com texto de incentivo, não só o número', $('home-meta').textContent.includes('Faltam 3 treinos'));
  check('a barra de progresso aparece', !!$('home-meta').querySelector('.barra-fill'));
  check('a faixa da semana aparece com os sete dias', $('home-semana').style.display !== 'none' && $('home-semana').querySelectorAll('.dia').length === 7);
  check('e marca o dia de hoje como feito', !!$('home-semana').querySelector('.dia.feito'));
  check('os números secundários aparecem', $('home-mini').style.display !== 'none' && $('home-mini').querySelectorAll('.mini').length === 3);
  check('o gráfico ainda pede a segunda semana', $('home-grafico').textContent.includes('comparar'));
  check('mas já mostra o título da métrica', $('home-grafico').textContent.includes('por semana'));
  check('o botão de trocar métrica está visível', !!$('btn-trocar-grafico'));
  check('o próximo treino continua em destaque', !!$('home-proximo').querySelector('.proxcard'));

  console.log('\n== trocar a métrica é manual e fica gravado ==');
  const antes = MT.settings.graficoHome;
  $('btn-trocar-grafico').click();
  await wait(60);
  check('a métrica mudou ao tocar', MT.settings.graficoHome !== antes);
  check('e o título acompanhou', $('home-grafico').textContent.includes('por semana'));

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
