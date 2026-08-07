const { boot, usar, fechar, wait, criarCheck, seletor } = require('./_helpers');
const check = criarCheck();

(async () => {
  // este arquivo alterna entre tres janelas (algumas com sessao/timer ativos),
  // entao gerencia o ciclo de vida na mao: manterAnterior:true em todo boot,
  // fechar() quando uma janela nao vai mais ser usada, usar() pra trocar de
  // volta pra uma janela mais antiga antes de interagir com ela de novo.
  const w = await boot(null, w => {
    w.URL.createObjectURL = () => 'blob:teste';
    w.URL.revokeObjectURL = () => {};
  }, {manterAnterior: true});
  const $ = seletor(w);
  const ev = (el, type) => el.dispatchEvent(new w.Event(type, {bubbles:true}));

  console.log('\n== autosave e retomada ==');
  $('daylist').querySelector('[data-open="upperA"]').click();
  await wait(20);
  $('btn-begin').click();
  await wait(20);
  const uid = $('exlist').querySelector('.excard[data-uid]').dataset.uid;
  const row = $('card-' + uid).querySelectorAll('.setrow')[0];
  const wi = row.querySelector('input[data-f="w"]'); wi.value = '70'; ev(wi, 'input');
  const ri = row.querySelector('input[data-f="r"]'); ri.value = '8'; ev(ri, 'input');
  $('card-' + uid).querySelector('[data-check="' + uid + '|0"]').click();
  await wait(420);

  const dump = {};
  for(const k of Object.keys(w.localStorage)) dump[k] = w.localStorage.getItem(k);
  check('sessao ativa gravada', !!dump['mt_active_session']);

  const w2 = await boot(dump, null, {manterAnterior: true});
  const $2 = seletor(w2);
  check('banner de retomar aparece', $2('resume').classList.contains('show'));
  check('banner cita Upper A', $2('resume-title').textContent.includes('Upper A'));
  $2('resume-go').click();
  await wait(40);
  check('sessao restaurada', $2('screen-session').classList.contains('active'));
  check('carga restaurada', $2('card-' + uid).querySelectorAll('input')[0].value === '70');
  check('volume restaurado', $2('sess-volume').textContent === '560 kg');
  check('serie continua marcada', $2('card-' + uid).querySelector('[data-check]').classList.contains('done'));

  fechar(w2); // resumeSession ligou um novo durationInt em w2, encerra antes de voltar pra w
  usar(w);

  console.log('\n== arrastar para excluir ==');
  const alvo = $('exlist').querySelectorAll('.excard[data-uid]')[2];
  const alvoUid = alvo.dataset.uid;
  const total = $('exlist').querySelectorAll('.excard[data-uid]').length;
  const mk = (type, x, y, target) => {
    const e = new w.Event(type, {bubbles:true, cancelable:true});
    e.touches = [{clientX:x, clientY:y}];
    Object.defineProperty(e, 'target', {value: target});
    return e;
  };
  const head = alvo.querySelector('.exname');
  $('exlist').dispatchEvent(mk('touchstart', 300, 400, head));
  $('exlist').dispatchEvent(mk('touchmove', 260, 402, head));
  $('exlist').dispatchEvent(mk('touchmove', 170, 404, head));
  check('card marcado para exclusao ao arrastar', alvo.classList.contains('willdelete'));
  $('exlist').dispatchEvent(mk('touchend', 170, 404, head));
  await wait(30);
  // o gesto tambem passa pela confirmacao: e o mesmo caminho de exclusao
  check('gesto tambem pede confirmacao', $('sheet-backdrop').classList.contains('show'));
  check('card volta ao lugar enquanto a confirmacao esta aberta',
    !alvo.classList.contains('willdelete') && !alvo.querySelector('.cardinner').style.transform);
  $('sheet-body').querySelector('[data-r="1"]').click();
  await wait(30);
  check('exercicio excluido pelo gesto', $('exlist').querySelectorAll('.excard[data-uid]').length === total - 1);
  check('nao existe mais o card arrastado', !$('card-' + alvoUid));
  check('toast de desfazer aparece', $('toast').textContent.includes('Desfazer'));

  console.log('\n== arrastar pouco nao exclui ==');
  const alvo2 = $('exlist').querySelectorAll('.excard[data-uid]')[1];
  const total2 = $('exlist').querySelectorAll('.excard[data-uid]').length;
  const head2 = alvo2.querySelector('.exname');
  $('exlist').dispatchEvent(mk('touchstart', 300, 400, head2));
  $('exlist').dispatchEvent(mk('touchmove', 260, 400, head2));
  $('exlist').dispatchEvent(mk('touchend', 260, 400, head2));
  await wait(20);
  check('arrasto curto nao exclui', $('exlist').querySelectorAll('.excard[data-uid]').length === total2);

  console.log('\n== rolagem vertical nao dispara exclusao ==');
  const alvo3 = $('exlist').querySelectorAll('.excard[data-uid]')[1];
  const total3 = $('exlist').querySelectorAll('.excard[data-uid]').length;
  const head3 = alvo3.querySelector('.exname');
  $('exlist').dispatchEvent(mk('touchstart', 300, 400, head3));
  $('exlist').dispatchEvent(mk('touchmove', 296, 340, head3));
  $('exlist').dispatchEvent(mk('touchmove', 292, 250, head3));
  $('exlist').dispatchEvent(mk('touchend', 292, 250, head3));
  await wait(20);
  check('rolar para cima nao exclui', $('exlist').querySelectorAll('.excard[data-uid]').length === total3);

  console.log('\n== backup: exporta com todos os dados, nao so o historico ==');
  let baixou = null, conteudoBaixado = null;
  const origCreate = w.document.createElement.bind(w.document);
  w.document.createElement = tag => {
    const el = origCreate(tag);
    if(tag === 'a') el.click = () => { baixou = el.download; };
    return el;
  };
  const OrigBlob = w.Blob;
  w.Blob = function(partes, opts){ conteudoBaixado = partes[0]; return new OrigBlob(partes, opts); };
  usar(w); // Blob foi trocado depois do pin inicial, repina pra valer no global
  w.MT.favoritos.supino_reto = true;
  w.MT.exportBackup();
  await wait(20);
  check('arquivo de backup nomeado por data', !!baixou && /^meu-treino-\d{4}-\d{2}-\d{2}\.json$/.test(baixou));
  const payload = JSON.parse(conteudoBaixado);
  check('backup inclui o historico completo', Array.isArray(payload.history) && payload.history.length === w.MT.history.length);
  check('backup inclui favoritos', payload.favoritos && payload.favoritos.supino_reto === true);
  check('backup inclui o programa', Array.isArray(payload.program) && payload.program.length > 0);
  check('backup inclui overrides e exercicios personalizados', 'overrides' in payload && 'customEx' in payload);

  fechar(w); // sessao de w (upperA) continua com durationInt rodando, encerra antes da proxima janela

  console.log('\n== restaurar um backup traz o historico e os favoritos de volta ==');
  const w3 = await boot(null, null, {manterAnterior: true});
  const $3 = seletor(w3);
  check('comeca sem favoritos', Object.keys(w3.MT.favoritos).length === 0);
  check('comeca sem historico', w3.MT.history.length === 0);
  w3.MT.importBackup({text: () => Promise.resolve(JSON.stringify(payload))});
  await wait(30);
  $3('sheet-body').querySelector('[data-r="1"]').click();
  await wait(40);
  check('historico restaurado com a mesma quantidade do backup', w3.MT.history.length === payload.history.length);
  check('favoritos restaurados', w3.MT.favoritos.supino_reto === true);
  w3.MT.importBackup({text: () => Promise.resolve(JSON.stringify({app:'outra coisa'}))});
  await wait(30);
  $3('sheet-body').querySelector('[data-r="1"]').click();
  await wait(30);
  check('historico nao foi apagado por um arquivo invalido', w3.MT.history.length === payload.history.length);

  fechar(w3);

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
