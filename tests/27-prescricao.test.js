const { boot, wait, criarCheck, seletor } = require('./_helpers');
const check = criarCheck();

/* prescrição por extenso: relato de usuários confundindo "RPE 7-8" com
   número de séries. Testa que a prévia, a sessão ativa e o editor de
   treino escrevem séries/repetições por extenso, trocam RIR por uma frase
   em linguagem comum e mantêm RPE só como detalhe secundário (nunca como
   o número solto que gerava a confusão). */

(async () => {
  const w = await boot();
  const $ = seletor(w);
  const MT = w.MT;

  console.log('\n== previa: prescricao de exercicio de repeticao por extenso ==');
  $('daylist').querySelector('[data-open="upperA"]').click();
  await wait(20);
  const cardSupino = [...$('exlist').querySelectorAll('.excard')].find(c => c.textContent.includes('Supino reto barra'));
  check('card do supino aparece na previa', !!cardSupino);
  const targetSupino = cardSupino.querySelector('.target');
  check('mostra series e repeticoes por extenso, nao "N séries · X-Y"', /\d+ séries? de (\d+ a \d+|\d+) repetições/.test(targetSupino.textContent));
  check('nao mostra mais o rotulo cru "RIR"', !targetSupino.textContent.includes('RIR'));
  check('RIR virou frase em linguagem comum "na reserva"', targetSupino.textContent.includes('na reserva'));
  check('RPE continua visivel, como detalhe secundario', /RPE \S+/.test(targetSupino.textContent));
  const rpeSpan = targetSupino.querySelector('.rpe-detalhe');
  check('RPE fica num span proprio, apagado (nao é o texto principal)', !!rpeSpan && rpeSpan.textContent.startsWith('RPE'));
  check('descanso continua aparecendo na previa', targetSupino.textContent.includes('descanso'));

  console.log('\n== previa: exercicio de tempo usa "segundos", exercicio de distancia usa "metros" ==');
  $('daylist').querySelector('[data-open="lowerA"]').click();
  await wait(20);
  const cardPranchaLower = [...$('exlist').querySelectorAll('.excard')].find(c => c.textContent.includes('Prancha abdominal'));
  check('card da prancha (exercicio de tempo) aparece na previa de lowerA', !!cardPranchaLower);
  check('prescricao de tempo em segundos por extenso', /\d+ a \d+ segundos|\d+ segundos/.test(cardPranchaLower.querySelector('.target').textContent));
  check('nao usa "repetições" pra descrever a duracao (só a parte de reserva, se houver, usa a palavra)',
    !cardPranchaLower.querySelector('.target').textContent.split(',')[0].includes('repetições'));

  $('daylist').querySelector('[data-open="upperB"]').click();
  await wait(20);
  const cardFarmer = [...$('exlist').querySelectorAll('.excard')].find(c => c.textContent.includes('Farmer carry'));
  check('card do farmer (exercicio de distancia) aparece na previa de upperB', !!cardFarmer);
  check('prescricao de distancia em metros por extenso', /\d+ a \d+ metros|\d+ metros/.test(cardFarmer.querySelector('.target').textContent));

  console.log('\n== editor de treino: cabecalho troca "RPE x · RIR y" pela frase em linguagem comum ==');
  $('daylist').querySelector('[data-open="upperA"]').click();
  await wait(20);
  $('btn-editprog').click();
  await wait(30);
  const cardEditSupino = [...$('exlist').querySelectorAll('.excard')].find(c => c.textContent.includes('Supino reto barra'));
  const targetEdit = cardEditSupino.querySelector('.target');
  check('editor nao mostra mais "RIR" cru', !targetEdit.textContent.includes('RIR'));
  check('editor mostra "na reserva" em vez de RIR', targetEdit.textContent.includes('na reserva'));
  check('editor mantem RPE como detalhe secundario', !!targetEdit.querySelector('.rpe-detalhe'));
  check('series e faixa de repeticoes continuam em campos proprios, nao duplicados no cabecalho', !!cardEditSupino.querySelector('[data-editreps]'));
  $('btn-canceledit').click();
  await wait(20);

  console.log('\n== sessao ativa: card do exercicio usa a mesma linguagem, sem repetir "N séries" (ja aparece no contador) ==');
  $('btn-begin').click();
  await wait(20);
  const cardSessaoSupino = [...$('exlist').querySelectorAll('.excard')].find(c => c.textContent.includes('Supino reto barra'));
  const targetSessao = cardSessaoSupino.querySelector('.target');
  check('card ativo nao mostra "RIR" cru', !targetSessao.textContent.includes('RIR'));
  check('card ativo mostra "na reserva"', targetSessao.textContent.includes('na reserva'));
  check('card ativo mantem RPE como detalhe secundario', !!targetSessao.querySelector('.rpe-detalhe'));
  check('card ativo mostra a faixa de repeticoes por extenso', /(\d+ a \d+|\d+) repetições/.test(targetSessao.textContent));

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
