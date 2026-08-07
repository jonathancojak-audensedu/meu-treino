const { boot, criarCheck } = require('./_helpers');
const check = criarCheck();

/* Sintomas relatados por testadores, todos com a mesma raiz: o gerador
   coletava a resposta e não fazia nada estrutural com ela.

   1) Foco muscular quase não mudava o treino. `prioridade` só dava um
      empurrãozinho na pontuação (+8) e uma série extra num exercício, tudo
      dentro de espaços fixos: quem pedia braços recebia o mesmo
      Upper/Lower de quem não pediu nada.
   2) Um treino focado em braço saía quase sem bíceps. Os modelos push/pull/
      legs existiam em MODELOS mas nenhuma tabela SPLITS os referenciava, ou
      seja, código morto: não havia caminho no gerador que produzisse um dia
      concentrado em bíceps ou tríceps.
   3) Pegada, punho e trapézio existiam no catálogo e nunca eram escolhidos.
      Não era filtro nem mapeamento errado: esses padrões de movimento não
      apareciam em nenhum slot de MODELOS nem na lista RESERVA, então
      escolherExercicio() nunca era chamado com eles.

   Idade não entra aqui de propósito: ela nunca fez parte do onboarding nem
   do perfil que chega ao gerador, mora em "Dados corporais" e serve só pro
   cálculo de IMC/TMB. Ver o comentário no topo de js/onboarding.js. */

const base = {experiencia:'intermediario', tempo:60, local:'academia', objetivo:'hipertrofia', dores:[], nome:'Teste'};
const perfil = extra => Object.assign({}, base, extra);
const idsDe = programa => programa.reduce((a, d) => a.concat(d.items.map(i => i.ex)), []);
const seriesDoGrupo = (MT, programa, musculo) => programa.reduce((a, d) =>
  a + d.items.reduce((b, it) => b + ((MT.META[it.ex].m[musculo] || 0) >= 1 ? it.sets : 0), 0), 0);

(async () => {
  const w = await boot();
  const MT = w.MT;
  const gerar = MT.gerar;

  console.log('\n== os dois exercicios que faltavam existem e sao alcancaveis ==');
  check('mesa flexora (flexora deitado) existe no catalogo', !!MT.EX.mesa_flexora);
  check('mesa flexora tem metadados, senao some do gerador', !!MT.META.mesa_flexora);
  check('mesa flexora e diferente da cadeira flexora (que e sentado)', MT.EX.mesa_flexora.name !== MT.EX.flexora.name);
  check('biceps unilateral na maquina existe no catalogo', !!MT.EX.rosca_maquina_unilateral);
  check('biceps unilateral na maquina tem metadados', !!MT.META.rosca_maquina_unilateral);
  check('biceps unilateral na maquina e marcado como unilateral', MT.META.rosca_maquina_unilateral.u === true);
  check('os dois contam como isolamento, senao disputam espaco de composto',
    MT.META.mesa_flexora.iso === true && MT.META.rosca_maquina_unilateral.iso === true);

  console.log('\n== pegada, punho e trapezio deixam de ser inalcancaveis ==');
  /* varre uma grade de perfis: basta existir algum caminho que chegue neles,
     não que apareçam em todo treino */
  const alcancados = {};
  for(const dias of [2,3,4,5,6])
    for(const tempo of [30,45,60,90])
      for(const objetivo of ['forca','hipertrofia','emagrecer','saude'])
        for(const local of ['academia','simples','casa','corpo'])
          for(const dores of [[], ['punho'], ['ombro','joelho']])
            for(const prioridade of [[], ['bracos'], ['costas'], ['peito','bracos']])
              idsDe(gerar(perfil({dias, tempo, objetivo, local, dores, prioridade}))).forEach(id => { alcancados[id] = true; });

  const porPadrao = padrao => Object.keys(MT.META).filter(id => MT.META[id].p === padrao);
  ['pegada','punho','trapezio'].forEach(padrao => {
    const desse = porPadrao(padrao);
    check('padrao "' + padrao + '" tem exercicio no catalogo', desse.length > 0);
    check('padrao "' + padrao + '" e alcancavel por algum perfil', desse.some(id => alcancados[id]));
  });
  check('mesa flexora e alcancada por algum perfil', !!alcancados.mesa_flexora);
  /* a rosca na máquina só ganha das roscas de peso livre quando elas saem por
     dor no punho, que é justamente quando a máquina é a indicada */
  check('biceps unilateral na maquina e alcancado por algum perfil', !!alcancados.rosca_maquina_unilateral);

  console.log('\n== todo padrao de movimento do catalogo tem caminho ate o gerador ==');
  const padroes = [...new Set(Object.keys(MT.META).map(id => MT.META[id].p))];
  const semCaminho = padroes.filter(p => !porPadrao(p).some(id => alcancados[id]));
  check('nenhum padrao de movimento fica orfao (' + padroes.length + ' padroes)', semCaminho.length === 0);
  if(semCaminho.length) console.log('    orfaos:', semCaminho.join(', '));

  console.log('\n== foco em bracos muda a estrutura do treino, nao so a pontuacao ==');
  const semFoco = gerar(perfil({dias:4, prioridade:[]}));
  const comBracos = gerar(perfil({dias:4, prioridade:['bracos']}));
  check('sem foco, a divisao continua Superiores/Inferiores', semFoco.some(d => d.name.indexOf('Superiores') === 0));
  check('com foco em bracos, ganha um dia dedicado de bracos', comBracos.some(d => d.name === 'Braços e antebraço'));
  check('com foco em bracos, a divisao vira Push/Pull/Legs',
    ['Empurrar','Puxar','Pernas'].every(n => comBracos.some(d => d.name === n)));

  const bicepsSem = seriesDoGrupo(MT, semFoco, 'biceps');
  const bicepsCom = seriesDoGrupo(MT, comBracos, 'biceps');
  const tricepsSem = seriesDoGrupo(MT, semFoco, 'triceps');
  const tricepsCom = seriesDoGrupo(MT, comBracos, 'triceps');
  console.log('  biceps: ' + bicepsSem + ' -> ' + bicepsCom + ' series/semana | triceps: ' + tricepsSem + ' -> ' + tricepsCom);
  check('foco em bracos aumenta o volume de biceps de verdade', bicepsCom > bicepsSem);
  check('foco em bracos aumenta o volume de triceps de verdade', tricepsCom > tricepsSem);

  console.log('\n== o dia de bracos e realmente um dia de braco, nao um upper disfarcado ==');
  const diaBracos = comBracos.find(d => d.name === 'Braços e antebraço');
  check('dia de bracos existe', !!diaBracos);
  const exBracos = diaBracos.items.map(i => i.ex);
  const ehDeBraco = id => {
    const m = MT.META[id].m;
    return (m.biceps || 0) >= 1 || (m.triceps || 0) >= 1 || ['punho','pegada'].indexOf(MT.META[id].p) !== -1;
  };
  check('todo exercicio do dia de bracos trabalha braco ou antebraco', exBracos.every(ehDeBraco));
  check('tem pelo menos 2 exercicios de biceps no dia', exBracos.filter(id => (MT.META[id].m.biceps || 0) >= 1).length >= 2);

  console.log('\n== foco em outros grupos tambem sobe o volume daquele grupo ==');
  [['peito','peito'], ['costas','costas'], ['ombro','ombro'], ['core','core']].forEach(([grupo, musculo]) => {
    const sem = seriesDoGrupo(MT, gerar(perfil({dias:4, prioridade:[]})), musculo);
    const com = seriesDoGrupo(MT, gerar(perfil({dias:4, prioridade:[grupo]})), musculo);
    check('foco em ' + grupo + ' nao reduz o volume de ' + musculo + ' (' + sem + ' -> ' + com + ')', com >= sem);
  });

  console.log('\n== foco nao desequilibra: o resto do corpo continua sendo treinado ==');
  const focoCostas = gerar(perfil({dias:4, prioridade:['costas']}));
  ['peito','quadriceps','costas'].forEach(mus => {
    check('com foco em costas, ' + mus + ' ainda recebe serie', seriesDoGrupo(MT, focoCostas, mus) > 0);
  });
  const focoDuplo = gerar(perfil({dias:4, prioridade:['costas','pernas']}));
  check('priorizar dois grupos nao zera o peito', seriesDoGrupo(MT, focoDuplo, 'peito') > 0);

  console.log('\n== dor continua tirando exercicio da lista, inclusive com foco ==');
  const comDorEFoco = gerar(perfil({dias:4, prioridade:['bracos'], dores:['cotovelo']}));
  const idsDor = idsDe(comDorEFoco);
  check('nenhum exercicio carrega o cotovelo dolorido', idsDor.every(id => MT.META[id].s.indexOf('cotovelo') === -1));
  check('mesmo evitando cotovelo, o treino nao fica vazio', idsDor.length >= 12);

  const dorMultipla = gerar(perfil({dias:4, prioridade:['pernas'], dores:['joelho','lombar']}));
  const idsMult = idsDe(dorMultipla);
  check('joelho e lombar dolorida sao respeitados junto com o foco',
    idsMult.every(id => MT.META[id].s.indexOf('joelho') === -1 && MT.META[id].s.indexOf('lombar') === -1));
  check('ainda sobra treino com duas dores e foco', idsMult.length >= 12);

  console.log('\n== sem equipamento, foco em bracos nao tenta um PPL que nao fecha ==');
  const corpoBracos = gerar(perfil({dias:4, local:'corpo', prioridade:['bracos']}));
  check('peso corporal continua na divisao que funciona sem equipamento',
    !corpoBracos.some(d => d.name === 'Braços e antebraço'));
  check('e ainda gera 4 dias com exercicio em todos', corpoBracos.length === 4 && corpoBracos.every(d => d.items.length > 0));

  console.log('\n== poucos dias nao viram split especializado ==');
  [2, 3].forEach(dias => {
    const p = gerar(perfil({dias, prioridade:['bracos']}));
    check('com ' + dias + ' dias, foco em bracos nao gasta um dia inteiro so em braco',
      !p.some(d => d.name === 'Braços e antebraço'));
  });

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 30000);
