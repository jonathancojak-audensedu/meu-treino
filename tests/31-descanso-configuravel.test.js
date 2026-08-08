const { boot, usar, wait, criarCheck, seletor } = require('./_helpers');
const check = criarCheck();

/* Descanso configurável (pedido do Ledson). Três fontes, nesta ordem:
   1. ajuste feito naquele exercício durante o treino, que vale pra sempre
      e pra qualquer dia que use o mesmo exercício;
   2. preferência global de Ajustes, que encurta ou alonga o prescrito em
      vez de trocar por um valor fixo, senão um principal de força e um
      isolado passariam a descansar igual;
   3. o que o gerador prescreveu.

   O timer continua por horário de término (endsAt), que é o que faz ele
   sobreviver a tela bloqueada e app em segundo plano. */

const abrirTreino = async ($, w) => {
  $('daylist').querySelector('[data-open="upperA"]').click();
  await wait(20);
  $('btn-begin').click();
  await wait(20);
};

(async () => {
  let w = await boot();
  let $ = seletor(w);
  let MT = w.MT;

  console.log('\n== padrao: sem preferencia nenhuma, vale o que o gerador prescreveu ==');
  await abrirTreino($, w);
  const item0 = MT.session.items[0];
  const prescrito = item0.rest;
  check('o exercicio tem descanso prescrito pelo gerador', prescrito > 0);
  $('card-' + item0.uid).querySelector('.setrow .checkbtn').click();
  await wait(30);
  check('descanso comeca com o valor prescrito', MT.session.rest.total === prescrito);
  check('timer usa horario de termino, nao contador', MT.session.rest.endsAt > Date.now());
  check('o descanso sabe de qual exercicio veio', MT.session.rest.uid === item0.uid);
  $('rest-skip').click();
  await wait(20);

  console.log('\n== ajustar durante o treino vale para as proximas series ==');
  $('card-' + item0.uid).querySelectorAll('.setrow .checkbtn')[1].click();
  await wait(30);
  const antesDoAjuste = MT.session.rest.total;
  $('rest-add').click();
  await wait(30);
  check('o descanso em andamento aumenta 15s', MT.session.rest.total >= antesDoAjuste + 15);
  check('o ajuste virou o padrao daquele exercicio',
    MT.settings.descansoPorExercicio[item0.ex] === prescrito + 15);
  // mesma formatacao de fmtRest() em js/ui.js, so pra conferir o texto do card
  const comoNaTela = seg => seg >= 60
    ? (seg % 60 ? Math.floor(seg/60) + ':' + String(seg%60).padStart(2,'0') : Math.floor(seg/60) + ' min')
    : seg + 's';
  check('o card passa a exibir o descanso ajustado, nao o prescrito',
    $('card-' + item0.uid).querySelector('.target').textContent.includes(comoNaTela(prescrito + 15)));
  $('rest-skip').click();
  await wait(20);
  $('card-' + item0.uid).querySelectorAll('.setrow .checkbtn')[2].click();
  await wait(30);
  check('a proxima serie ja comeca com o descanso ajustado', MT.session.rest.total === prescrito + 15);
  $('rest-skip').click();
  await wait(20);

  console.log('\n== diminuir tambem persiste, e respeita o piso ==');
  const uidOutro = MT.session.items[1].uid;
  const exOutro = MT.session.items[1].ex;
  const prescritoOutro = MT.session.items[1].rest;
  $('card-' + uidOutro).querySelector('.setrow .checkbtn').click();
  await wait(30);
  $('rest-sub').click();
  await wait(30);
  check('tirar 15s persiste no exercicio', MT.settings.descansoPorExercicio[exOutro] === prescritoOutro - 15);
  check('o ajuste de um exercicio nao mexe no outro', MT.settings.descansoPorExercicio[item0.ex] === prescrito + 15);
  $('rest-skip').click();
  await wait(20);

  console.log('\n== a preferencia sobrevive a fechar e reabrir o app ==');
  const dump = {};
  for(const k of Object.keys(w.localStorage)) dump[k] = w.localStorage.getItem(k);
  w = await boot(dump);
  $ = seletor(w);
  MT = w.MT;
  check('descanso por exercicio foi persistido', MT.settings.descansoPorExercicio[item0.ex] === prescrito + 15);

  console.log('\n== preferencia global encurta e alonga o prescrito, sem achatar tudo ==');
  w = await boot();
  $ = seletor(w);
  MT = w.MT;
  check('comeca em "como prescrito"', (MT.settings.descansoEscala || 'normal') === 'normal');
  const marcado = () => [...w.document.querySelectorAll('[data-descanso]')].find(b => b.getAttribute('aria-checked') === 'true');
  check('o controle existe em Ajustes e mostra o valor atual', !!marcado() && marcado().dataset.descanso === 'normal');

  await abrirTreino($, w);
  // guarda o prescrito de um pesado e de um leve pra provar que a proporção fica
  const pesado = MT.session.items.find(i => i.rest >= 120) || MT.session.items[0];
  const leve = MT.session.items.slice().sort((a, b) => a.rest - b.rest)[0];
  const prescritoPesado = pesado.rest, prescritoLeve = leve.rest;
  check('o treino tem exercicios com descansos diferentes, pra comparar', prescritoPesado > prescritoLeve);

  w.document.querySelector('[data-descanso="curto"]').click();
  await wait(30);
  check('a escolha fica marcada', marcado().dataset.descanso === 'curto');
  check('a escolha e salva', MT.settings.descansoEscala === 'curto');

  $('card-' + pesado.uid).querySelector('.setrow .checkbtn').click();
  await wait(30);
  const curtoPesado = MT.session.rest.total;
  check('mais curto encurta o descanso do pesado', curtoPesado < prescritoPesado);
  $('rest-skip').click();
  await wait(20);
  $('card-' + leve.uid).querySelector('.setrow .checkbtn').click();
  await wait(30);
  const curtoLeve = MT.session.rest.total;
  check('mais curto encurta tambem o do leve', curtoLeve < prescritoLeve);
  check('o pesado continua descansando mais que o leve, nada foi achatado', curtoPesado > curtoLeve);
  check('nunca desce do piso de 15s', curtoLeve >= 15);
  $('rest-skip').click();
  await wait(20);

  w.document.querySelector('[data-descanso="longo"]').click();
  await wait(30);
  $('card-' + pesado.uid).querySelectorAll('.setrow .checkbtn')[1].click();
  await wait(30);
  check('mais longo alonga o descanso', MT.session.rest.total > prescritoPesado);
  $('rest-skip').click();
  await wait(20);

  console.log('\n== o ajuste do exercicio vence a preferencia global ==');
  const uidP = pesado.uid, exP = pesado.ex;
  $('card-' + uidP).querySelectorAll('.setrow .checkbtn')[2].click();
  await wait(30);
  $('rest-add').click();
  await wait(30);
  const fixado = MT.settings.descansoPorExercicio[exP];
  $('rest-skip').click();
  await wait(20);
  w.document.querySelector('[data-descanso="curto"]').click();
  await wait(30);
  $('card-' + uidP).querySelectorAll('.setrow .checkbtn')[3].click();
  await wait(30);
  check('com ajuste proprio, mudar a preferencia global nao mexe naquele exercicio', MT.session.rest.total === fixado);
  $('rest-skip').click();
  await wait(20);

  console.log('\n== o backup leva as preferencias junto ==');
  let conteudo = null;
  const origCreate = w.document.createElement.bind(w.document);
  w.document.createElement = tag => {
    const el = origCreate(tag);
    if(tag === 'a') el.click = () => {};
    return el;
  };
  const OrigBlob = w.Blob;
  w.Blob = function(partes, opts){ conteudo = partes[0]; return new OrigBlob(partes, opts); };
  w.URL.createObjectURL = () => 'blob:teste';
  w.URL.revokeObjectURL = () => {};
  usar(w);   // re-aponta os globais pros substitutos acima, senao o Blob real e usado
  $('btn-export').click();
  await wait(60);
  const payload = JSON.parse(conteudo);
  check('o backup inclui as configuracoes', !!payload.settings);
  check('inclui a preferencia global de descanso', payload.settings.descansoEscala === 'curto');
  check('inclui o descanso ajustado por exercicio', payload.settings.descansoPorExercicio[exP] === fixado);

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 25000);
