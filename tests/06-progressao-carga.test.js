const { boot, criarCheck } = require('./_helpers');
const check = criarCheck();
const sessao = (...sets) => ({sets: sets.map(([wgt, r]) => ({w: String(wgt), r: String(r)}))});

(async () => {
  const w = await boot();
  const MT = w.MT;

  console.log('\n== sem historico ==');
  check('array vazio nao sugere nada', MT.sugerir([], {reps:'6-8', type:'reps', regiao:'superior'}) === null);
  check('sessao sem series concluidas nao sugere nada', MT.sugerir([{sets:[]}], {reps:'6-8', type:'reps', regiao:'superior'}) === null);
  check('carga/reps nao numericos nao sugerem nada', MT.sugerir([sessao(['', ''])], {reps:'6-8', type:'reps', regiao:'superior'}) === null);

  console.log('\n== exercicio de tempo ou distancia nao entra na regra ==');
  check('tipo tempo nunca sugere', MT.sugerir([sessao([20, 40])], {reps:'30-40s', type:'time', regiao:'superior'}) === null);
  check('tipo distancia nunca sugere', MT.sugerir([sessao([20, 30])], {reps:'30m', type:'dist', regiao:'superior'}) === null);

  console.log('\n== topo da faixa atingido em todas as series ==');
  const subirSuperior = MT.sugerir([sessao([60, 8], [60, 8], [60, 8])], {reps:'6-8', type:'reps', regiao:'superior'});
  check('sugere subir', subirSuperior && subirSuperior.tipo === 'subir');
  check('60kg membro superior sobe pra 62,5kg (bate o exemplo do roadmap)', subirSuperior && subirSuperior.cargaSugerida === 62.5);
  check('reps concluidas registradas', subirSuperior && subirSuperior.repsFeitas === 8);

  const subirInferior = MT.sugerir([sessao([100, 8], [100, 8])], {reps:'6-8', type:'reps', regiao:'inferior'});
  check('100kg membro inferior sobe pra 105kg (5% vence o piso fixo de 5kg)', subirInferior && subirInferior.cargaSugerida === 105);

  console.log('\n== abaixo do piso da faixa em duas sessoes seguidas ==');
  const historicoDuasRuins = [
    sessao([40, 4], [40, 4]),
    sessao([42.5, 5], [42.5, 4])
  ];
  const descer = MT.sugerir(historicoDuasRuins, {reps:'6-8', type:'reps', regiao:'superior'});
  check('sugere descer', descer && descer.tipo === 'descer');
  check('reduz a carga', descer && descer.cargaSugerida < 40);

  const soUmaSessaoRuim = MT.sugerir([sessao([40, 4], [40, 4])], {reps:'6-8', type:'reps', regiao:'superior'});
  check('uma sessao ruim isolada nao basta pra sugerir descer', soUmaSessaoRuim && soUmaSessaoRuim.tipo === 'manter');

  console.log('\n== faixa parcial (nem topo nem duas seguidas abaixo do piso) ==');
  const manter = MT.sugerir([sessao([50, 7], [50, 6])], {reps:'6-8', type:'reps', regiao:'superior'});
  check('sugere manter', manter && manter.tipo === 'manter');
  check('mantem a carga anterior', manter && manter.cargaSugerida === 50);

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
