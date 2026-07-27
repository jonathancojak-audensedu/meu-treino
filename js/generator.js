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
  full_A: {nome:'Corpo inteiro A', block:'full', slots:[['emp_h','principal'],['pux_h','principal'],['joelho','principal'],['quadril','acessorio'],['lateral','isolado'],['core','isolado']]},
  full_B: {nome:'Corpo inteiro B', block:'full', slots:[['emp_v','principal'],['pux_v','principal'],['quadril','principal'],['joelho','acessorio'],['biceps','isolado'],['triceps','isolado']]},
  full_C: {nome:'Corpo inteiro C', block:'full', slots:[['emp_h','acessorio'],['pux_h','acessorio'],['joelho','acessorio'],['quadril','acessorio'],['lateral','isolado'],['core','isolado']]},
  upper_A:{nome:'Superiores A', block:'upper', slots:[['emp_h','principal'],['pux_h','principal'],['emp_v','acessorio'],['pux_v','acessorio'],['lateral','isolado'],['biceps','isolado'],['triceps','isolado']]},
  upper_B:{nome:'Superiores B', block:'upper', slots:[['pux_v','principal'],['emp_v','principal'],['pux_h','acessorio'],['emp_h','acessorio'],['lateral','isolado'],['triceps','isolado'],['biceps','isolado']]},
  lower_A:{nome:'Inferiores A', block:'lower', slots:[['joelho','principal'],['quadril','acessorio'],['joelho','acessorio'],['quadril','acessorio'],['panturrilha','isolado'],['core','isolado']]},
  lower_B:{nome:'Inferiores B', block:'lower', slots:[['quadril','principal'],['joelho','acessorio'],['quadril','acessorio'],['joelho','acessorio'],['panturrilha','isolado'],['core','isolado']]},
  push:   {nome:'Empurrar', block:'upper', slots:[['emp_h','principal'],['emp_v','principal'],['emp_h','acessorio'],['lateral','isolado'],['triceps','isolado'],['triceps','isolado']]},
  pull:   {nome:'Puxar', block:'upper', slots:[['pux_v','principal'],['pux_h','principal'],['pux_h','acessorio'],['pux_v','acessorio'],['biceps','isolado'],['biceps','isolado']]},
  legs:   {nome:'Pernas', block:'lower', slots:[['joelho','principal'],['quadril','principal'],['joelho','acessorio'],['quadril','acessorio'],['panturrilha','isolado'],['core','isolado']]}
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

/* ordem de recurso quando um espaço do treino fica sem candidato */
const RESERVA = ['emp_h','pux_h','joelho','quadril','core','emp_v','triceps','lateral','biceps','panturrilha'];

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

function escolherExercicio(padrao, papel, perfil, usados, noDia){
  const lista = candidatos(padrao, perfil).filter(id => (noDia || []).indexOf(id) === -1);
  if(!lista.length) return null;
  const prio = perfil.prioridade || [];
  const alvo = ALVO_COMPLEXIDADE[papel];
  const melhorNivel = Math.max.apply(null, lista.map(id => META[id].nivel));
  const pontuado = lista.map(id => {
    const t = META[id];
    let pt = 0;
    // variedade só vale entre equipamentos equivalentes: elástico não substitui polia
    if(usados.indexOf(id) === -1 && t.nivel >= melhorNivel - 1) pt += 30;
    if(usados.indexOf(id) !== -1) pt -= 10;
    if(t.iso && papel !== 'isolado') pt -= 60;                     // isolamento não substitui composto
    if(!t.iso && papel === 'isolado') pt -= 12;
    pt += t.nivel * 7;                                             // usa o melhor equipamento disponível
    pt += (3 - Math.abs(alvo - t.c)) * 4;
    if(prio.some(g => grupoBate(g, t.m))) pt += 8;
    if(t.u && papel === 'principal') pt -= 6;
    return {id: id, pt: pt};
  });
  pontuado.sort((a, b) => b.pt - a.pt || (a.id < b.id ? -1 : 1));
  return pontuado[0].id;
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
  const tabela = perfil.local === 'corpo' ? SPLITS_CORPO : SPLITS;
  const dias = tabela[Number(perfil.dias)] || tabela[3];
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

    modelo.slots.forEach(([padrao, papel]) => {
      if(itens.length >= teto) return;
      const id = escolherExercicio(padrao, papel, perfil, usados, itens.map(x => x.ex));
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
      const id = escolherExercicio(RESERVA[r], papel, perfil, usados, itens.map(x => x.ex));
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
