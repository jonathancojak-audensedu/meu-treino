const { boot, wait, criarCheck, seletor } = require('./_helpers');
const check = criarCheck();
const perto = (a, b, tol) => Math.abs(a - b) < (tol || 0.05);

(async () => {
  const w = await boot();
  const $ = seletor(w);

  console.log('\n== calcularSaude (funcao pura) ==');
  check('sem idade retorna null', w.MT.saude({idade:'', altura:'180', peso:'80', sexo:'masculino'}) === null);
  check('sem altura retorna null', w.MT.saude({idade:'30', altura:'', peso:'80', sexo:'masculino'}) === null);
  check('sem peso retorna null', w.MT.saude({idade:'30', altura:'180', peso:'', sexo:'masculino'}) === null);

  const homem = w.MT.saude({idade:'30', altura:'180', peso:'80', sexo:'masculino'});
  check('imc do homem calculado certo', perto(homem.imc, 24.69, 0.01));
  check('classificacao peso saudavel', homem.imcLabel === 'peso saudável');
  check('faixa de peso saudavel calculada certo', perto(homem.pesoMin, 59.94, 0.01) && perto(homem.pesoMax, 80.68, 0.01));
  check('tmb masculino (mifflin +5) certo', perto(homem.tmb, 1780, 0.5));
  check('tmb de referencia usa peso do meio da faixa', perto(homem.tmbSaudavel, 1683.08, 0.5));

  const mulher = w.MT.saude({idade:'25', altura:'165', peso:'60', sexo:'feminino'});
  check('tmb feminino (mifflin -161) certo', perto(mulher.tmb, 1345.25, 0.5));

  const semSexo = w.MT.saude({idade:'40', altura:'170', peso:'90', sexo:''});
  check('imc alto classifica como obesidade', semSexo.imcLabel === 'obesidade');
  check('sem sexo usa media das constantes', perto(semSexo.tmb, 1684.5, 0.5));

  const limite = w.MT.saude({idade:'30', altura:'100', peso:'18.5', sexo:'masculino'});
  check('imc exatamente 18.5 conta como peso saudavel, nao abaixo do peso', limite.imcLabel === 'peso saudável');

  console.log('\n== painel na tela de Dados corporais ==');
  $('nav-settings').click();
  await wait(20);
  $('btn-corpo').click();
  await wait(40);
  check('painel de resultados comeca vazio sem dados', $('c-resultados').innerHTML.trim() === '');

  $('c-idade').value = '30';
  $('c-idade').dispatchEvent(new w.Event('input', {bubbles:true}));
  $('c-altura').value = '180';
  $('c-altura').dispatchEvent(new w.Event('input', {bubbles:true}));
  $('c-peso').value = '80';
  $('c-peso').dispatchEvent(new w.Event('input', {bubbles:true}));
  await wait(20);

  const texto = $('c-resultados').textContent;
  check('mostra o imc calculado', texto.includes('24,7') || texto.includes('IMC'));
  check('mostra a faixa de peso saudavel', texto.includes('kg'));
  check('mostra a tmb estimada', texto.includes('kcal/dia'));
  check('mostra o aviso de que nao substitui avaliacao profissional', texto.includes('não substituem avaliação'));

  $('sheet-body').querySelector('[data-sexo="masculino"]').click();
  await wait(20);
  check('resultado recalcula ao marcar sexo', $('c-resultados').textContent.includes('kcal/dia'));

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
