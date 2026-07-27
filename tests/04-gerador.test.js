const { boot } = require('./_helpers');

const EXPERIENCIAS = ['iniciante','retomando','intermediario','avancado'];
const DIAS = [2,3,4,5,6];
const TEMPOS = [30,45,60,90];
const LOCAIS = ['academia','simples','casa','corpo'];
const OBJETIVOS = ['hipertrofia','forca','emagrecer','saude'];
const DORES = [[], ['ombro'], ['joelho'], ['lombar'], ['ombro','joelho','lombar'], ['punho','cotovelo'], ['ombro','joelho','lombar','punho','cotovelo','quadril','tornozelo']];
const PRIORIDADES = [[], ['peito'], ['gluteos','bracos']];
const TETO = {30:4, 45:5, 60:6, 90:8};

let combos = 0, problemas = [];
function falha(perfil, msg){
  problemas.push(JSON.stringify({exp:perfil.experiencia, dias:perfil.dias, tempo:perfil.tempo, local:perfil.local, obj:perfil.objetivo, dores:perfil.dores}) + ' -> ' + msg);
}

(async () => {
  const w = await boot();
  const MT = w.MT;

  function verificar(perfil){
    combos++;
    const prog = MT.gerar(perfil);
    const disp = MT.EQUIP[perfil.local];
    const dores = perfil.dores.filter(d => d !== 'nenhuma');
    const maxC = perfil.experiencia === 'iniciante' ? 2 : 3;

    if(prog.length !== Number(perfil.dias)) return falha(perfil, 'dias gerados ' + prog.length);

    prog.forEach(dia => {
      if(!dia.items.length) return falha(perfil, dia.name + ' saiu vazio');
      if(dia.items.length < 3) return falha(perfil, dia.name + ' com so ' + dia.items.length + ' exercicios');
      // cardio e um adicional fixo no fim, nao concorre pelo teto de exercicios de musculacao
      const musculacao = dia.items.filter(it => MT.EX[it.ex] && MT.EX[it.ex].type !== 'cardio');
      if(musculacao.length > TETO[perfil.tempo]) return falha(perfil, dia.name + ' passou do teto de exercicios');
      if(!dia.warmup || !dia.name || !dia.key) return falha(perfil, dia.name + ' sem metadados');

      const vistos = [];
      dia.items.forEach((it, idx) => {
        const def = MT.EX[it.ex], meta = MT.META[it.ex];
        if(!def) return falha(perfil, 'exercicio inexistente no catalogo: ' + it.ex);
        if(!meta) return falha(perfil, 'exercicio sem metadados: ' + it.ex);
        if(vistos.indexOf(it.ex) !== -1) return falha(perfil, 'exercicio repetido no mesmo dia: ' + it.ex);
        vistos.push(it.ex);
        if(!meta.e.every(eq => disp.indexOf(eq) !== -1)) return falha(perfil, it.ex + ' exige equipamento indisponivel em ' + perfil.local);
        if(meta.s.some(art => dores.indexOf(art) !== -1)) return falha(perfil, it.ex + ' carrega articulacao com dor');
        if(meta.c > maxC) return falha(perfil, it.ex + ' complexo demais para ' + perfil.experiencia);
        if(def.type === 'cardio'){
          if(it.sets !== 1) return falha(perfil, it.ex + ' cardio com ' + it.sets + ' series, deveria ser 1 bloco');
          if(idx !== dia.items.length - 1) return falha(perfil, it.ex + ' cardio nao esta por ultimo no dia');
          if(!it.reps || !it.rpe) return falha(perfil, it.ex + ' sem prescricao completa');
          if(!/min$/.test(it.reps)) return falha(perfil, it.ex + ' e cardio mas reps=' + it.reps);
          if(!(it.duracaoSeg > 0)) return falha(perfil, it.ex + ' cardio sem duracaoSeg pro orcamento de tempo');
          return;
        }
        if(!(it.sets >= 2 && it.sets <= 6)) return falha(perfil, it.ex + ' com ' + it.sets + ' series');
        if(!it.reps || !it.rest || !it.rpe) return falha(perfil, it.ex + ' sem prescricao completa');
        if(def.type === 'time' && !/s$/.test(it.reps)) return falha(perfil, it.ex + ' e por tempo mas reps=' + it.reps);
      });

      const est = MT.tempo(dia.items);
      if(est > perfil.tempo * 60 * 1.12) return falha(perfil, dia.name + ' estimado em ' + Math.round(est/60) + 'min contra ' + perfil.tempo);
    });
  }

  console.log('== gerando programa para todas as combinacoes ==');
  for(const experiencia of EXPERIENCIAS)
    for(const dias of DIAS)
      for(const tempo of TEMPOS)
        for(const local of LOCAIS)
          for(const objetivo of OBJETIVOS)
            verificar({experiencia, dias, tempo, local, objetivo, dores:[], prioridade:[], nome:'Teste'});

  console.log('  ' + combos + ' combinacoes basicas verificadas');

  const antes = combos;
  for(const dores of DORES)
    for(const prioridade of PRIORIDADES)
      for(const local of LOCAIS)
        for(const dias of DIAS)
          verificar({experiencia:'intermediario', dias, tempo:60, local, objetivo:'hipertrofia', dores, prioridade, nome:'Teste'});
  console.log('  ' + (combos - antes) + ' combinacoes com dor e prioridade verificadas');

  if(problemas.length){
    console.log('\n' + problemas.length + ' PROBLEMAS (primeiros 15):');
    problemas.slice(0,15).forEach(p => console.log('  ' + p));
  }else{
    console.log('  nenhum problema estrutural encontrado');
  }

  console.log('\n== amostras reais ==');
  function amostra(titulo, perfil){
    const prog = MT.gerar(perfil);
    const vol = MT.volume(prog);
    console.log('\n' + titulo);
    prog.forEach(d => {
      const est = Math.round(MT.tempo(d.items) / 60);
      console.log('  ' + d.name + ' (~' + est + 'min): ' + d.items.map(i => MT.EX[i.ex].name + ' ' + i.sets + 'x' + i.reps).join(' | '));
    });
    const top = Object.keys(vol).filter(k => vol[k] >= 4).sort((a,b)=>vol[b]-vol[a]).slice(0,6);
    console.log('  volume semanal: ' + top.map(k => k + ' ' + vol[k]).join(', '));
  }

  amostra('INICIANTE, 3 dias, 45min, so peso corporal, emagrecer',
    {experiencia:'iniciante', dias:3, tempo:45, local:'corpo', objetivo:'emagrecer', dores:[], prioridade:[], nome:'A'});

  amostra('INTERMEDIARIO, 4 dias, 60min, academia completa, hipertrofia, dor no ombro',
    {experiencia:'intermediario', dias:4, tempo:60, local:'academia', objetivo:'hipertrofia', dores:['ombro'], prioridade:[], nome:'B'});

  amostra('AVANCADO, 6 dias, 90min, academia completa, forca, prioridade em costas',
    {experiencia:'avancado', dias:6, tempo:90, local:'academia', objetivo:'forca', dores:[], prioridade:['costas'], nome:'C'});

  amostra('RETOMANDO, 2 dias, 30min, em casa com halteres, saude',
    {experiencia:'retomando', dias:2, tempo:30, local:'casa', objetivo:'saude', dores:['lombar'], prioridade:[], nome:'D'});

  console.log('\n' + (problemas.length ? problemas.length + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(problemas.length ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
