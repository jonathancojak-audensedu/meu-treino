import { EX, META, EQUIP } from './catalog.js';

/* =========================================================================
   GERADOR DE PROGRAMA
   Função pura: entra o perfil, sai o programa. Não toca em tela nem em
   armazenamento, o que permite testar sem abrir o navegador. Catálogo
   (EX, META, EQUIP) vem de catalog.js: p é o padrão de movimento, m são os
   músculos com peso, e é o equipamento exigido, s as articulações que
   carrega, c a complexidade de 1 a 3, u marca exercício unilateral.
   ========================================================================= */

/* parâmetros por objetivo e papel do exercício */
const PARAMS = {
  forca: {
    principal:{sets:4, reps:'4-6',  rpe:'8',   rir:'2',   rest:180},
    acessorio:{sets:3, reps:'6-8',  rpe:'8',   rir:'2',   rest:120},
    isolado:  {sets:3, reps:'8-12', rpe:'8',   rir:'2',   rest:75}
  },
  hipertrofia: {
    principal:{sets:4, reps:'6-8',  rpe:'7-8', rir:'2-3', rest:150},
    acessorio:{sets:3, reps:'8-12', rpe:'8',   rir:'2',   rest:90},
    isolado:  {sets:3, reps:'12-15',rpe:'8-9', rir:'1-2', rest:60}
  },
  emagrecer: {
    principal:{sets:4, reps:'6-10', rpe:'7-8', rir:'2-3', rest:90},
    acessorio:{sets:3, reps:'10-12',rpe:'8',   rir:'2',   rest:60},
    isolado:  {sets:3, reps:'12-15',rpe:'8-9', rir:'1-2', rest:45}
  },
  saude: {
    principal:{sets:3, reps:'8-12', rpe:'7',   rir:'3',   rest:90},
    acessorio:{sets:3, reps:'10-12',rpe:'7-8', rir:'2-3', rest:75},
    isolado:  {sets:2, reps:'12-15',rpe:'8',   rir:'2',   rest:45}
  }
};

/* quantos exercícios cabem no tempo informado */
const TETO_EXERCICIOS = {30:4, 45:5, 60:6, 90:8};

/* divisões por dia disponível */
const MODELOS = {
  full_A: {nome:'Corpo inteiro A', block:'full', slots:[['emp_h','principal'],['pux_h','principal'],['joelho','principal'],['quadril','acessorio'],['emp_h','isolado'],['lateral','isolado'],['core','isolado']]},
  full_B: {nome:'Corpo inteiro B', block:'full', slots:[['emp_v','principal'],['pux_v','principal'],['quadril','principal'],['joelho','acessorio'],['biceps','isolado'],['triceps','isolado']]},
  full_C: {nome:'Corpo inteiro C', block:'full', slots:[['emp_h','acessorio'],['pux_h','acessorio'],['joelho','acessorio'],['quadril','acessorio'],['lateral','isolado'],['core','isolado']]},
  upper_A:{nome:'Superiores A', block:'upper', slots:[['emp_h','principal'],['pux_h','principal'],['emp_v','acessorio'],['pux_v','acessorio'],['emp_h','isolado'],['lateral','isolado'],['biceps','isolado'],['triceps','isolado'],['trapezio','isolado']]},
  upper_B:{nome:'Superiores B', block:'upper', slots:[['pux_v','principal'],['emp_v','principal'],['pux_h','acessorio'],['emp_h','acessorio'],['lateral','isolado'],['triceps','isolado'],['biceps','isolado'],['pegada','isolado']]},
  lower_A:{nome:'Inferiores A', block:'lower', slots:[['joelho','principal'],['quadril','acessorio'],['joelho','acessorio'],['quadril','isolado'],['panturrilha','isolado'],['core','isolado']]},
  lower_B:{nome:'Inferiores B', block:'lower', slots:[['quadril','principal'],['joelho','acessorio'],['quadril','acessorio'],['joelho','isolado'],['panturrilha','isolado'],['core','isolado']]},
  push:   {nome:'Empurrar', block:'upper', slots:[['emp_h','principal'],['emp_v','principal'],['emp_h','acessorio'],['emp_h','isolado'],['lateral','isolado'],['triceps','isolado'],['triceps','isolado']]},
  pull:   {nome:'Puxar', block:'upper', slots:[['pux_v','principal'],['pux_h','principal'],['pux_h','acessorio'],['pux_v','acessorio'],['biceps','isolado'],['biceps','isolado'],['trapezio','isolado']]},
  legs:   {nome:'Pernas', block:'lower', slots:[['joelho','principal'],['quadril','principal'],['joelho','acessorio'],['quadril','acessorio'],['panturrilha','isolado'],['core','isolado']]},
  bracos: {nome:'Braços e antebraço', block:'upper', slots:[['biceps','acessorio'],['triceps','acessorio'],['biceps','isolado'],['triceps','isolado'],['punho','isolado'],['pegada','isolado']]}
};

const SPLITS = {
  2:['full_A','full_B'],
  3:['full_A','full_B','full_C'],
  4:['upper_A','lower_A','upper_B','lower_B'],
  5:['upper_A','lower_A','upper_B','lower_B','full_A'],
  6:['upper_A','lower_A','upper_B','lower_B','full_A','full_B']
};

/* sem equipamento não existe puxada vertical nem rosca, então PPL não fecha */
const SPLITS_CORPO = {
  2:['full_A','full_B'],
  3:['full_A','full_B','full_C'],
  4:['upper_A','lower_A','upper_B','lower_B'],
  5:['upper_A','lower_A','upper_B','lower_B','full_A'],
  6:['upper_A','lower_A','upper_B','lower_B','full_A','full_B']
};

/* Divisão dedicada quando a pessoa priorizou braços: Push/Pull/Legs concentra
   bíceps e tríceps em dias próprios, o que Upper/Lower não faz (lá sobra um
   espaço isolado de cada por dia, e é o teto de tempo que decide se cabe).
   Só vale de 4 dias pra cima: com 2 ou 3, gastar um dia inteiro num grupo
   pequeno deixaria o resto do corpo sem estímulo suficiente na semana.
   Exige equipamento, porque sem barra fixa nem polia não existe puxada
   vertical nem rosca o bastante pra sustentar um dia de puxar e um de braço. */
const SPLITS_FOCO = {
  bracos: {
    4:['push','pull','legs','bracos'],
    5:['push','pull','legs','bracos','full_A'],
    6:['push','pull','legs','bracos','upper_A','lower_A']
  }
};

/* ordem de recurso quando um espaço do treino fica sem candidato. Cobre todos
   os padrões de movimento do catálogo, então nenhum grupo fica inalcançável
   só por não aparecer nos slots dos modelos. */
const RESERVA = ['emp_h','pux_h','joelho','quadril','core','emp_v','triceps','lateral','biceps',
                 'panturrilha','trapezio','pegada','punho'];

/* Quais padrões de movimento treinam cada grupo que a pessoa pode priorizar.
   É esta tabela que transforma "quero focar em braços" em espaços concretos
   no treino, em vez de só um empurrãozinho na pontuação. */
const PADROES_DO_GRUPO = {
  peito:   ['emp_h'],
  costas:  ['pux_h','pux_v','trapezio'],
  ombro:   ['emp_v','lateral'],
  bracos:  ['biceps','triceps','punho'],
  gluteos: ['quadril'],
  pernas:  ['joelho','quadril','panturrilha'],
  core:    ['core']
};

const AQUECIMENTOS = {
  upper:'5 minutos de bike, remo ou corda. Rotação de ombro com bastão ou elástico, 2x10. Uma série leve do primeiro exercício antes de começar valendo.',
  lower:'5 minutos de bike ou caminhada inclinada. Mobilidade de quadril e tornozelo, 2x30s de cada lado. Uma série de agachamento peso corporal, 2x10.',
  full:'5 minutos de caminhada, bike ou polichinelo. Mobilidade de ombro e quadril, 2x10 de cada. Uma série leve do primeiro exercício antes de começar valendo.'
};

/* -------------------------------------------------------------------------
   Seleção de exercício para um espaço do treino
   ------------------------------------------------------------------------- */
function candidatos(padrao, perfil){
  const disp = EQUIP[perfil.local] || EQUIP.academia;
  const dores = (perfil.dores || []).filter(d => d !== 'nenhuma');
  const maxC = perfil.experiencia === 'iniciante' ? 2 : 3;
  return Object.keys(META).filter(id => {
    const t = META[id];
    if(t.p !== padrao) return false;
    if(t.c > maxC) return false;
    if(!t.e.every(eq => disp.indexOf(eq) !== -1)) return false;
    if(t.s.some(art => dores.indexOf(art) !== -1)) return false;
    return true;
  });
}

const ALVO_COMPLEXIDADE = {principal:3, acessorio:2, isolado:1, cardio:1};

/* Pesos da pontuação, cada um com o motivo de existir. Ficam nomeados aqui
   em vez de soltos no meio da conta pra dar pra discutir a regra sem ler
   a implementação inteira. */
const PESOS = {
  inedito: 30,                  // ainda não usado na semana: favorece variedade
  repetido: -10,                // já usado: só entra se não houver melhor
  isolamentoEmComposto: -60,    // isolamento não substitui um exercício composto
  compostoEmIsolado: -50,       // e o espaço de isolamento é pra isolamento
  porAfinidadeEquipamento: 4,   // o que aquele equipamento faz bem naquele papel
  equipamentoNovoNoDia: 14,     // mistura barra, máquina e cabo dentro do dia
  equipamentoImprovisado: -25,  // elástico e peso corporal só quando não há melhor
  guiadoComDor: 12,             // quem declarou dor vai melhor no movimento guiado
  porProximidadeComplexidade: 4,// complexidade perto do alvo do papel
  grupoPriorizado: 25,          // desempata a favor do grupo que a pessoa escolheu
  unilateralComoPrincipal: -6   // unilateral rende menos carga no exercício principal
};

/* Elástico e peso corporal são o recurso de quem não tem equipamento; máquina,
   polia, halter e barra são todos legítimos numa academia. A distância entre
   os dois mundos é o que importa, não a ordem dentro do segundo: quando a
   barra valia muitos pontos a mais que a máquina, variações legítimas em
   máquina nunca eram escolhidas em nenhum treino. */
const NIVEL_IMPROVISADO = 2;

/* Equipamento não é ranking com a barra no topo. Cada um faz uma coisa
   melhor: peso livre exige estabilizar, o que faz parte do trabalho num
   composto pesado e atrapalha num isolamento; máquina e cabo guiam o
   movimento, o que ajuda a isolar e a treinar com dor. Antes disto valia
   "nível do equipamento x peso", e a barra ganhava em todo papel: leg press,
   hack machine, peck deck e mais doze exercícios nunca eram escolhidos em
   nenhum programa, mesmo com a academia inteira disponível. */
const AFINIDADE_EQUIPAMENTO = {
  barra:      {principal:6, acessorio:5, isolado:4},
  barra_fixa: {principal:6, acessorio:5, isolado:5},
  halter:     {principal:5, acessorio:5, isolado:5},
  smith:      {principal:5, acessorio:5, isolado:5},
  maquina:    {principal:5, acessorio:5, isolado:5},
  polia:      {principal:4, acessorio:5, isolado:5},
  corpo:      {principal:3, acessorio:3, isolado:3},
  elastico:   {principal:1, acessorio:2, isolado:3},
  cardio:     {principal:5, acessorio:5, isolado:5}
};
/* banco é acessório de outro equipamento e não define o exercício, então fica
   de fora da conta: quem manda no supino com halteres é o halter */
function afinidadeDeEquipamento(meta, papel){
  const notas = meta.e.map(eq => AFINIDADE_EQUIPAMENTO[eq] && AFINIDADE_EQUIPAMENTO[eq][papel]).filter(n => n != null);
  return notas.length ? Math.max.apply(null, notas) : 4;
}

/* Como um bom programa mistura os três, o que interessa pra variedade é a
   família do equipamento, não o item exato: halter e barra contam como o
   mesmo tipo de estímulo, máquina e Smith também. */
function familiaDeEquipamento(meta){
  if(meta.e.indexOf('barra') !== -1 || meta.e.indexOf('barra_fixa') !== -1 || meta.e.indexOf('halter') !== -1) return 'livre';
  if(meta.e.indexOf('maquina') !== -1 || meta.e.indexOf('smith') !== -1) return 'maquina';
  if(meta.e.indexOf('polia') !== -1) return 'cabo';
  if(meta.e.indexOf('elastico') !== -1) return 'elastico';
  if(meta.e.indexOf('cardio') !== -1) return 'cardio';
  return 'corpo';
}

/* Máquina, Smith e polia guiam a trajetória. Pra quem declarou dor, isso é
   vantagem, não demérito: já foram tirados os exercícios que carregam a
   articulação dolorida, e entre os que sobraram o guiado é o mais seguro. */
const FAMILIAS_GUIADAS = ['maquina', 'cabo'];

/* Diferença de pontos abaixo da qual dois exercícios são tratados como
   intercambiáveis e entram no rodízio. Grande o bastante pra cobrir um passo
   de complexidade ou de afinidade, pequena o bastante pra não deixar entrar
   um exercício que perde por motivo de verdade, como isolamento num espaço
   de composto (que custa 50 pontos). */
const MARGEM_EQUIVALENTE = 8;

function escolherExercicio(padrao, papel, perfil, usados, noDia, rotacao){
  const lista = candidatos(padrao, perfil).filter(id => (noDia || []).indexOf(id) === -1);
  if(!lista.length) return null;
  const prio = perfil.prioridade || [];
  const alvo = ALVO_COMPLEXIDADE[papel];
  const melhorNivel = Math.max.apply(null, lista.map(id => META[id].nivel));
  /* bíceps, panturrilha, core, pegada e afins só têm isolamento no catálogo.
     Punir isolamento nesses padrões não escolhe nada melhor, só embaralha a
     ordem, então a penalidade só vale quando existe composto pra comparar. */
  const existeComposto = lista.some(id => !META[id].iso);
  /* famílias de equipamento já presentes no dia, pra premiar quem diversifica */
  const familiasNoDia = (noDia || []).filter(id => META[id]).map(id => familiaDeEquipamento(META[id]));
  const temDor = (perfil.dores || []).some(d => d !== 'nenhuma');
  const pontuado = lista.map(id => {
    const t = META[id];
    const familia = familiaDeEquipamento(t);
    let pt = 0;
    // variedade só vale entre equipamentos de verdade: elástico não substitui
    // polia, mas máquina e halter valem o mesmo pra esse fim
    const equipamentoServe = t.nivel > NIVEL_IMPROVISADO || melhorNivel <= NIVEL_IMPROVISADO;
    if(usados.indexOf(id) === -1 && equipamentoServe) pt += PESOS.inedito;
    if(usados.indexOf(id) !== -1) pt += PESOS.repetido;
    if(t.nivel <= NIVEL_IMPROVISADO && melhorNivel > NIVEL_IMPROVISADO) pt += PESOS.equipamentoImprovisado;
    if(t.iso && papel !== 'isolado' && existeComposto) pt += PESOS.isolamentoEmComposto;
    if(!t.iso && papel === 'isolado') pt += PESOS.compostoEmIsolado;
    pt += afinidadeDeEquipamento(t, papel === 'cardio' ? 'acessorio' : papel) * PESOS.porAfinidadeEquipamento;
    if(familiasNoDia.indexOf(familia) === -1 && familia !== 'corpo') pt += PESOS.equipamentoNovoNoDia;
    if(temDor && FAMILIAS_GUIADAS.indexOf(familia) !== -1) pt += PESOS.guiadoComDor;
    pt += (3 - Math.abs(alvo - t.c)) * PESOS.porProximidadeComplexidade;
    if(prio.some(g => grupoBate(g, t.m))) pt += PESOS.grupoPriorizado;
    if(t.u && papel === 'principal') pt += PESOS.unilateralComoPrincipal;
    return {id: id, pt: pt};
  });
  pontuado.sort((a, b) => b.pt - a.pt || (a.id < b.id ? -1 : 1));
  /* Exercícios equivalentes empatam com frequência (mesa flexora e cadeira
     flexora têm metadados idênticos, por exemplo). Desempatar sempre pela
     ordem alfabética congelaria o mesmo vencedor pra sempre e deixaria o
     equivalente fora de qualquer treino, que é justamente como metade do
     catálogo ficava invisível. Alternar entre os empatados mantém a função
     pura, porque a rotação vem do próprio estado da montagem.

     A margem existe porque empate exato é raro demais pra dar conta do
     problema: panturrilha burro perde da panturrilha em pé por um ponto de
     complexidade e some do catálogo inteiro por causa disso. Quem está a
     poucos pontos do primeiro faz o mesmo trabalho e entra no rodízio. */
  const melhorPonto = pontuado[0].pt;
  const equivalentes = pontuado.filter(x => x.pt >= melhorPonto - MARGEM_EQUIVALENTE);
  /* Entre equivalentes, quem ainda não entrou na semana passa na frente. Só
     rotacionar por índice não bastava: cadeira flexora, mesa flexora e
     flexora unilateral são idênticas nos metadados, e o índice caía sempre
     na mesma, deixando as outras duas fora de qualquer programa. */
  const inéditos = equivalentes.filter(x => usados.indexOf(x.id) === -1);
  const pool = inéditos.length ? inéditos : equivalentes;
  return pool[(rotacao || 0) % pool.length].id;
}

/* Teto de espaços extras por dia. Sem isso, priorizar dois grupos de vários
   padrões (costas e pernas, por exemplo) encheria o dia inteiro do foco e
   deixaria o resto do corpo de fora, que é o oposto de um treino equilibrado. */
const MAX_SLOTS_FOCO = 2;

/* Espaços do dia depois de aplicar o foco muscular. Os padrões do grupo
   priorizado que este dia já treina ganham um espaço extra, inserido antes
   dos isolamentos genéricos: no fim da lista o teto de tempo cortaria
   justamente o que a pessoa pediu pra priorizar. */
function slotsDoDia(modelo, perfil){
  const prio = perfil.prioridade || [];
  if(!prio.length) return modelo.slots;
  const padroesDoDia = modelo.slots.map(s => s[0]);
  const extras = [];
  prio.forEach(grupo => {
    (PADROES_DO_GRUPO[grupo] || []).forEach(padrao => {
      if(extras.length >= MAX_SLOTS_FOCO) return;
      if(padroesDoDia.indexOf(padrao) === -1) return;
      if(extras.some(e => e[0] === padrao)) return;
      extras.push([padrao, 'acessorio']);
    });
  });
  if(!extras.length) return modelo.slots;
  const primeiroIsolado = modelo.slots.findIndex(s => s[1] === 'isolado');
  const corte = primeiroIsolado === -1 ? modelo.slots.length : primeiroIsolado;
  return modelo.slots.slice(0, corte).concat(extras, modelo.slots.slice(corte));
}

/* A divisão da semana: normalmente sai só do número de dias, mas um foco
   muscular com dias suficientes e equipamento troca por uma divisão que
   sustenta aquele foco. */
function splitDaSemana(perfil){
  const dias = Number(perfil.dias);
  const semEquipamento = perfil.local === 'corpo';
  if(!semEquipamento){
    const focos = perfil.prioridade || [];
    for(const grupo of focos){
      const tabela = SPLITS_FOCO[grupo];
      if(tabela && tabela[dias]) return tabela[dias];
    }
  }
  const padrao = semEquipamento ? SPLITS_CORPO : SPLITS;
  return padrao[dias] || padrao[3];
}

function grupoBate(grupo, musculos){
  const mapa = {peito:['peito'], costas:['costas'], ombro:['ombro'], bracos:['biceps','triceps'],
                gluteos:['gluteos'], pernas:['quadriceps','posterior','gluteos'], core:['core']};
  const alvos = mapa[grupo] || [grupo];
  return alvos.some(a => (musculos[a] || 0) >= 1);
}

/* -------------------------------------------------------------------------
   Montagem
   ------------------------------------------------------------------------- */
function ajustarSeries(base, papel, perfil){
  let s = base;
  if(perfil.experiencia === 'iniciante') s = Math.max(2, s - 1);
  if(perfil.experiencia === 'avancado' && papel === 'principal') s += 1;
  return s;
}

function repsDoTipo(tipo, reps){
  if(tipo === 'time') return '30-45s';
  if(tipo === 'dist') return '30m';
  return reps;
}

function tempoEstimado(itens){
  // 5 min de aquecimento mais série a série, contando execução e descanso.
  // cardio é um bloco contínuo, não série x descanso, então usa a duração própria.
  return 300 + itens.reduce((a, i) => {
    if(EX[i.ex] && EX[i.ex].type === 'cardio') return a + (i.duracaoSeg || 0);
    return a + i.sets * (40 + i.rest);
  }, 0);
}

/* cardio entra ao fim da sessão só para emagrecer e saúde; o ponto fixo dentro
   da faixa mostrada (15-25min / 10-15min) é reservado do orçamento de tempo
   antes de decidir quantos exercícios de musculação cabem */
const CARDIO_MINUTOS = {emagrecer: 20, saude: 12};
const CARDIO_FAIXA = {emagrecer: '15-25min', saude: '10-15min'};

function gerarPrograma(perfil){
  const objetivo = PARAMS[perfil.objetivo] ? perfil.objetivo : 'hipertrofia';
  const dias = splitDaSemana(perfil);
  const teto = TETO_EXERCICIOS[Number(perfil.tempo)] || 6;
  const limite = (Number(perfil.tempo) || 60) * 60;
  const temCardio = objetivo === 'emagrecer' || objetivo === 'saude';
  // em sessoes curtas, o cardio completo nao cabe sobrando espaco pra musculacao,
  // entao ele cede parte do seu tempo (nunca mais de ~35% do total da sessao)
  const cardioSeg = temCardio ? Math.min(CARDIO_MINUTOS[objetivo] * 60, Math.round(limite * 0.35)) : 0;
  const limiteMusc = temCardio ? limite - cardioSeg : limite;
  const usados = [];
  const programa = [];

  dias.forEach((modeloId, i) => {
    const modelo = MODELOS[modeloId];
    const itens = [];

    slotsDoDia(modelo, perfil).forEach(([padrao, papel]) => {
      if(itens.length >= teto) return;
      const id = escolherExercicio(padrao, papel, perfil, usados, itens.map(x => x.ex), usados.length + i);
      if(!id) return;                                  // sem opção viável, o espaço fica vazio
      usados.push(id);
      const def = EX[id];
      const par = PARAMS[objetivo][papel];
      itens.push({
        ex: id,
        sets: ajustarSeries(par.sets, papel, perfil),
        reps: repsDoTipo(def.type, par.reps),
        rpe: par.rpe, rir: par.rir, rest: par.rest,
        papel: papel
      });
    });

    // faltou candidato em algum espaço: completa com o que estiver disponível
    const minimo = Math.min(4, teto);
    for(let r = 0; r < RESERVA.length && itens.length < minimo; r++){
      const papel = itens.length < 2 ? 'principal' : 'acessorio';
      const id = escolherExercicio(RESERVA[r], papel, perfil, usados, itens.map(x => x.ex), usados.length + i);
      if(!id) continue;
      usados.push(id);
      const def = EX[id];
      const par = PARAMS[objetivo][papel];
      itens.push({ex:id, sets:ajustarSeries(par.sets, papel, perfil), reps:repsDoTipo(def.type, par.reps),
                  rpe:par.rpe, rir:par.rir, rest:par.rest, papel:papel});
    }

    // corta o que não cabe no tempo, começando pelos isolados do fim
    while(tempoEstimado(itens) > limiteMusc && itens.length > 3){
      let alvo = -1;
      for(let k = itens.length - 1; k >= 0; k--){ if(itens[k].papel === 'isolado'){ alvo = k; break; } }
      itens.splice(alvo === -1 ? itens.length - 1 : alvo, 1);
    }
    // ainda estourando: encolhe o descanso, com piso por papel
    if(tempoEstimado(itens) > limiteMusc){
      const trabalho = itens.reduce((a, x) => a + x.sets * 40, 0);
      const descanso = itens.reduce((a, x) => a + x.sets * x.rest, 0);
      const sobra = limiteMusc - 300 - trabalho;
      if(sobra > 0 && descanso > 0){
        const fator = sobra / descanso;
        const piso = {principal:75, acessorio:60, isolado:40};
        itens.forEach(x => { x.rest = Math.max(piso[x.papel], Math.round(x.rest * fator / 5) * 5); });
      }
    }
    // último recurso: tira séries, sem descer de 2
    let guarda = 0;
    while(tempoEstimado(itens) > limiteMusc && guarda++ < 30){
      const ordem = itens.slice().sort((a, b) => (b.papel === 'isolado' ? 1 : 0) - (a.papel === 'isolado' ? 1 : 0) || b.sets - a.sets);
      const alvo = ordem.find(x => x.sets > 2);
      if(!alvo) break;
      alvo.sets--;
    }

    // prioridade ganha uma série a mais no exercício correspondente
    (perfil.prioridade || []).forEach(g => {
      const alvo = itens.find(x => grupoBate(g, META[x.ex].m));
      if(alvo && tempoEstimado(itens) + (40 + alvo.rest) <= limiteMusc) alvo.sets++;
    });

    // cardio sempre por último, fora da disputa de espaço/corte da musculação
    if(temCardio){
      const idCardio = escolherExercicio('cardio', 'cardio', perfil, usados, itens.map(x => x.ex));
      if(idCardio){
        usados.push(idCardio);
        // sessão curta: mostra a duração real cedida ao cardio, não a faixa cheia que não coube
        const repsCardio = cardioSeg < CARDIO_MINUTOS[objetivo] * 60 ? Math.round(cardioSeg / 60) + 'min' : CARDIO_FAIXA[objetivo];
        itens.push({ex:idCardio, sets:1, reps:repsCardio, rpe:'5-6', rir:'', rest:0, papel:'cardio', duracaoSeg:cardioSeg});
      }
    }

    programa.push({
      key: 'd' + (i + 1),
      tag: 'DIA ' + (i + 1),
      name: modelo.nome + (dias.filter(d => d === modeloId).length > 1 && dias.indexOf(modeloId) !== i ? ' B' : ''),
      block: modelo.block,
      meta: descreverDia(itens),
      warmup: AQUECIMENTOS[modelo.block],
      items: itens.map(it => {
        const base = {ex:it.ex, sets:it.sets, reps:it.reps, rpe:it.rpe, rir:it.rir, rest:it.rest};
        if(it.duracaoSeg != null) base.duracaoSeg = it.duracaoSeg;
        return base;
      })
    });
  });

  return programa;
}

function descreverDia(itens){
  const conta = {};
  itens.forEach(it => {
    Object.keys(META[it.ex].m).forEach(mus => {
      if(META[it.ex].m[mus] >= 1) conta[mus] = (conta[mus] || 0) + it.sets;
    });
  });
  const nomes = {peito:'peito', costas:'costas', ombro:'ombros', biceps:'bíceps', triceps:'tríceps',
                 quadriceps:'quadríceps', posterior:'posterior', gluteos:'glúteos', panturrilha:'panturrilha', core:'core'};
  const top = Object.keys(conta).sort((a, b) => conta[b] - conta[a]).slice(0, 3).map(k => nomes[k] || k);
  return top.join(', ') + ' · ' + itens.length + ' exercícios';
}

/* volume semanal por grupo, usado nos testes e no resumo do programa */
function volumeSemanal(programa){
  const conta = {};
  programa.forEach(dia => dia.items.forEach(it => {
    const m = META[it.ex] ? META[it.ex].m : {};
    Object.keys(m).forEach(mus => { conta[mus] = (conta[mus] || 0) + it.sets * m[mus]; });
  }));
  Object.keys(conta).forEach(k => conta[k] = Math.round(conta[k]));
  return conta;
}

export { gerarPrograma, tempoEstimado, volumeSemanal, PARAMS, MODELOS, SPLITS, SPLITS_CORPO };
