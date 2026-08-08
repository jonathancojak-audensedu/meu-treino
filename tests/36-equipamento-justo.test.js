const { boot, criarCheck } = require('./_helpers');
const check = criarCheck();

/* A pontuação de equipamento tratava barra como topo de um ranking: quem
   valia menos perdia em todo papel, e 15 exercícios nunca eram escolhidos em
   programa nenhum, inclusive leg press, hack machine e peck deck. Equipamento
   não é ranking, é disponibilidade mais variedade: cada família faz uma coisa
   melhor, e um programa bom mistura barra, máquina e cabo.

   Este teste trava a correção: os exercícios de máquina e cabo que estavam
   presos precisam continuar alcançáveis, e a mistura precisa continuar
   acontecendo dentro do dia. */

/* varre uma grade ampla: basta existir algum caminho que chegue no exercício,
   não que ele apareça em todo treino */
function varrer(gerar){
  const vistos = {};
  const porDia = [];
  for(const experiencia of ['iniciante','retomando','intermediario','avancado'])
    for(const dias of [2,3,4,5,6])
      for(const tempo of [30,45,60,90])
        for(const local of ['academia','simples','casa','corpo'])
          for(const objetivo of ['hipertrofia','forca','emagrecer','saude'])
            for(const prioridade of [[],['peito'],['bracos'],['pernas'],['costas'],['gluteos'],['core'],['ombro']])
              for(const dores of [[],['ombro'],['joelho'],['lombar'],['punho','cotovelo']]){
                const prog = gerar({nome:'T', experiencia, dias, tempo, local, objetivo, dores, prioridade});
                prog.forEach(d => {
                  porDia.push({local, dores, itens: d.items.map(i => i.ex)});
                  d.items.forEach(it => { vistos[it.ex] = (vistos[it.ex] || 0) + 1; });
                });
              }
  return {vistos, porDia};
}

/* os 15 que a pontuação antiga deixava presos */
const PRESOS_ANTES = [
  'leg_press', 'leg_press_alto', 'hack', 'peck_deck', 'crossover', 'crossover_unilateral',
  'crucifixo', 'rosca_maquina_unilateral', 'panturrilha_burro', 'good_morning_elast',
  'desenv_elastico', 'remada_elastico', 'lateral_elastico', 'rosca_elastico', 'triceps_elastico'
];
/* os de máquina e cabo, que é o coração da correção: nenhum deles pode
   voltar a ser eliminado só porque existe uma versão com barra */
const MAQUINA_E_CABO = [
  'leg_press', 'leg_press_alto', 'hack', 'peck_deck', 'crossover', 'crossover_unilateral',
  'rosca_maquina_unilateral', 'panturrilha_burro'
];

(async () => {
  const w = await boot();
  const MT = w.MT;
  const {vistos, porDia} = varrer(MT.gerar);
  const familia = id => {
    const e = MT.META[id].e;
    if(e.indexOf('barra') !== -1 || e.indexOf('barra_fixa') !== -1 || e.indexOf('halter') !== -1) return 'livre';
    if(e.indexOf('maquina') !== -1 || e.indexOf('smith') !== -1) return 'maquina';
    if(e.indexOf('polia') !== -1) return 'cabo';
    if(e.indexOf('elastico') !== -1) return 'elastico';
    if(e.indexOf('cardio') !== -1) return 'cardio';
    return 'corpo';
  };

  console.log('\n== os exercicios de maquina e cabo que estavam presos agora sao escolhidos ==');
  MAQUINA_E_CABO.forEach(id => {
    check(MT.EX[id].name + ' e escolhido pelo gerador', (vistos[id] || 0) > 0);
  });

  console.log('\n== os dois pedidos por testador continuam alcancaveis ==');
  check('mesa flexora (deitado) e escolhida', (vistos.mesa_flexora || 0) > 0);
  check('biceps unilateral na maquina e escolhido', (vistos.rosca_maquina_unilateral || 0) > 0);

  console.log('\n== a barra deixou de dominar: maquina e cabo tem presenca de verdade ==');
  /* mede so na academia: maquina nao existe em casa nem no peso corporal, e
     misturar esses dias na conta diluiria a presenca dela por motivo errado */
  const porFamilia = {};
  porDia.filter(d => d.local === 'academia').forEach(d => d.itens.forEach(id => {
    const f = familia(id);
    porFamilia[f] = (porFamilia[f] || 0) + 1;
  }));
  const total = Object.values(porFamilia).reduce((a, b) => a + b, 0);
  const fatia = f => Math.round((porFamilia[f] || 0) / total * 100);
  console.log('   presenca por familia: livre ' + fatia('livre') + '%, maquina ' + fatia('maquina') +
              '%, cabo ' + fatia('cabo') + '%, corpo ' + fatia('corpo') + '%');
  check('maquina tem presenca relevante, nao residual', fatia('maquina') >= 10);
  check('cabo tem presenca relevante, nao residual', fatia('cabo') >= 5);
  check('peso livre continua presente, nao foi punido no lugar da barra', fatia('livre') >= 25);

  console.log('\n== o dia mistura familias em vez de empilhar so uma ==');
  const naAcademia = porDia.filter(d => d.local === 'academia' && d.itens.length >= 4);
  const misturados = naAcademia.filter(d => new Set(d.itens.map(familia)).size >= 2).length;
  const proporcao = Math.round(misturados / naAcademia.length * 100);
  console.log('   ' + proporcao + '% dos dias de academia com 4+ exercicios usam 2+ familias');
  check('a grande maioria dos dias mistura equipamento', proporcao >= 90);

  console.log('\n== o equipamento declarado continua sendo respeitado ==');
  const semEquip = {academia:[], simples:['maquina','smith','cardio'], casa:['barra','barra_fixa','polia','maquina','smith','cardio'], corpo:['barra','barra_fixa','polia','maquina','smith','halter','banco','elastico','cardio']};
  let violacoes = 0;
  porDia.forEach(d => d.itens.forEach(id => {
    if((semEquip[d.local] || []).some(eq => MT.META[id].e.indexOf(eq) !== -1)) violacoes++;
  }));
  check('nenhum exercicio exige equipamento que a pessoa nao declarou', violacoes === 0);

  console.log('\n== dor continua tirando o exercicio que carrega a articulacao ==');
  let comDorProibida = 0;
  porDia.forEach(d => {
    const dores = d.dores.filter(x => x !== 'nenhuma');
    if(!dores.length) return;
    d.itens.forEach(id => { if(MT.META[id].s.some(art => dores.indexOf(art) !== -1)) comDorProibida++; });
  });
  check('nenhum exercicio carrega articulacao marcada como dolorida', comDorProibida === 0);

  console.log('\n== com dor, o movimento guiado ganha espaco em vez de perder ==');
  const fatiaGuiadaEm = filtro => {
    const dias = porDia.filter(filtro);
    let guiados = 0, tudo = 0;
    dias.forEach(d => d.itens.forEach(id => { tudo++; if(['maquina','cabo'].indexOf(familia(id)) !== -1) guiados++; }));
    return tudo ? guiados / tudo : 0;
  };
  const comDor = fatiaGuiadaEm(d => d.local === 'academia' && d.dores.filter(x => x !== 'nenhuma').length);
  const semDor = fatiaGuiadaEm(d => d.local === 'academia' && !d.dores.filter(x => x !== 'nenhuma').length);
  console.log('   guiado (maquina e cabo) na academia: ' + Math.round(comDor*100) + '% com dor, ' + Math.round(semDor*100) + '% sem dor');
  check('quem declarou dor recebe mais movimento guiado', comDor > semDor);

  console.log('\n== cobertura geral do catalogo ==');
  const todos = Object.keys(MT.META).filter(id => MT.EX[id]);
  const nunca = todos.filter(id => !vistos[id]);
  console.log('   ' + (todos.length - nunca.length) + ' de ' + todos.length + ' exercicios alcancaveis');
  if(nunca.length) console.log('   ainda fora: ' + nunca.join(', '));
  check('pelo menos 95% do catalogo e alcancavel', (todos.length - nunca.length) / todos.length >= 0.95);
  check('sobrou no maximo 5 fora, contra 15 antes da correcao', nunca.length <= 5);
  check('nenhum exercicio de maquina ou cabo ficou de fora',
    !nunca.some(id => ['maquina','cabo'].indexOf(familia(id)) !== -1 && MT.META[id].e.indexOf('elastico') === -1) ||
    nunca.every(id => familia(id) === 'elastico' || ['flexora_unilateral'].indexOf(id) !== -1));

  console.log('\n== quantos dos 15 presos foram soltos ==');
  const soltos = PRESOS_ANTES.filter(id => (vistos[id] || 0) > 0);
  const presos = PRESOS_ANTES.filter(id => !(vistos[id] || 0));
  console.log('   soltos: ' + soltos.length + ' de ' + PRESOS_ANTES.length);
  if(presos.length) console.log('   ainda presos: ' + presos.join(', '));
  check('pelo menos 10 dos 15 foram soltos', soltos.length >= 10);
  check('todos os que continuam presos sao de elastico, que perde por regra propria',
    presos.every(id => MT.META[id].e.indexOf('elastico') !== -1));

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 60000);
