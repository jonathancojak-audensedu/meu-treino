const { boot, criarCheck } = require('./_helpers');
const check = criarCheck();

/* item 5.1 do ROADMAP: com o catalogo triplicado, boa parte dos exercicios
   novos nunca era escolhida pelo gerador. Tres causas encontradas na
   auditoria, corrigidas em catalog.js/generator.js, viram regressao aqui:

   1) 20 variantes de padrao so-isolamento (biceps, triceps, lateral,
      panturrilha, core, pegada) entraram no catalogo ampliado sem a marca
      `iso`, entao perdiam sempre pra quem tinha a marca dentro do proprio
      espaco isolado.
   2) 'joelho' e 'quadril' nunca tinham um espaco isolado nos dias de perna
      (lower_A/lower_B so usavam esses padroes como principal/acessorio),
      entao toda a familia de isolamento de perna (cadeira extensora,
      cadeira flexora, cadeira adutora/abdutora, gluteo na polia...) ficava
      estruturalmente inalcancavel, nao importa a pontuacao.
   3) mesmo depois de abrir o espaco isolado em (2), a penalidade de quem
      nao tem a marca `iso` nesse papel era fraca demais (-12): compostos
      pesados do mesmo padrao (agachamento sumô, hip thrust, terra romeno)
      continuavam vencendo o espaço isolado, porque o bônus por usar o
      melhor equipamento disponível (até +35) sozinho já superava a
      penalidade. Subiu pra -50, simétrica com o -60 que barra isolamento
      fora do papel isolado. */

const EXPERIENCIAS = ['iniciante','intermediario','avancado'];
const LOCAIS = ['academia','simples','casa','corpo'];
const OBJETIVOS = ['forca','hipertrofia','emagrecer','saude'];
const DIAS = [2,3,4,5,6];
const TEMPOS = [30,45,60,90];
const PRIORIDADES = [[], ['peito'], ['costas','pernas']];
const DORES = [[], ['ombro'], ['joelho'], ['lombar']];

(async () => {
  const w = await boot();
  const MT = w.MT;

  const contagem = {};
  let amostras = 0;
  for(const experiencia of EXPERIENCIAS)
    for(const local of LOCAIS)
      for(const objetivo of OBJETIVOS)
        for(const dias of DIAS)
          for(const tempo of TEMPOS)
            for(const prioridade of PRIORIDADES)
              for(const dores of DORES){
                const prog = MT.gerar({nome:'T', experiencia, dias, tempo, local, objetivo, dores, prioridade});
                amostras++;
                prog.forEach(dia => dia.items.forEach(it => { contagem[it.ex] = (contagem[it.ex] || 0) + 1; }));
              }

  console.log('\n== ' + amostras + ' perfis gerados, variedade do catalogo ampliado ==');

  console.log('\n== variantes so-isolamento que ganharam a marca `iso` aparecem no gerador ==');
  const CORRIGIDOS_ISO = [
    'remada_alta', 'rosca_inversa', 'rosca_barra_w', 'triceps_frances', 'triceps_frances_unilateral',
    'triceps_testa_unilateral', 'panturrilha_leg_press', 'panturrilha_unilateral_corpo', 'hiperextensao_banco'
  ];
  CORRIGIDOS_ISO.forEach(id => check('"' + id + '" aparece pelo menos uma vez', (contagem[id] || 0) > 0));

  console.log('\n== dias de perna agora tem espaco isolado pros padroes joelho/quadril ==');
  const lowerA = MT.MODELOS ? MT.MODELOS.lower_A : null;
  check('MODELOS exposto em MT pro teste', !!lowerA);
  if(lowerA){
    check('lower_A tem um slot quadril/isolado', lowerA.slots.some(([p, papel]) => p === 'quadril' && papel === 'isolado'));
    check('lower_B tem um slot joelho/isolado', MT.MODELOS.lower_B.slots.some(([p, papel]) => p === 'joelho' && papel === 'isolado'));
  }
  const ISOLAMENTO_PERNA = ['flexora', 'gluteo_polia', 'cadeira_adutora', 'cadeira_abdutora', 'extensora'];
  const algumIsolamentoPerna = ISOLAMENTO_PERNA.some(id => (contagem[id] || 0) > 0);
  check('pelo menos um isolamento de perna (extensora/flexora/adutora/abdutora/gluteo) aparece', algumIsolamentoPerna);

  console.log('\n== espaco isolado de perna nao fica refem de composto pesado do mesmo padrao ==');
  const progAcademia = MT.gerar({nome:'T', experiencia:'intermediario', dias:4, tempo:60, local:'academia', objetivo:'hipertrofia', dores:[], prioridade:[]});
  const inferioresA = progAcademia.find(d => d.name.indexOf('Inferiores A') !== -1);
  const inferioresB = progAcademia.find(d => d.name.indexOf('Inferiores B') !== -1);
  check('Inferiores A e B existem nesse perfil', !!inferioresA && !!inferioresB);
  if(inferioresA && inferioresB){
    const ultimoQuadrilOuJoelho = dia => {
      const candidatos = dia.items.filter(it => ['quadril','joelho'].indexOf(MT.META[it.ex].p) !== -1);
      return candidatos[candidatos.length - 1];
    };
    const ultimoA = ultimoQuadrilOuJoelho(inferioresA);
    const ultimoB = ultimoQuadrilOuJoelho(inferioresB);
    check('ultimo exercicio de quadril/joelho de Inferiores A e um isolamento de verdade',
      !!ultimoA && MT.META[ultimoA.ex].iso === true);
    check('ultimo exercicio de quadril/joelho de Inferiores B e um isolamento de verdade',
      !!ultimoB && MT.META[ultimoB.ex].iso === true);
  }

  console.log('\n== cobertura geral do catalogo nao regride ==');
  const exIds = Object.keys(MT.EX);
  const usados = Object.keys(contagem);
  const nuncaUsados = exIds.filter(id => !contagem[id]);
  console.log('  ' + usados.length + ' de ' + exIds.length + ' exercicios distintos escolhidos pelo menos uma vez');
  check('nunca escolhidos nao regride (baseline pos-correcao: 61 de 156)', nuncaUsados.length <= 61);

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 30000);
