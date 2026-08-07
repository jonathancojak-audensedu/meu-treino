const { boot, wait, criarCheck, seletor } = require('./_helpers');
const check = criarCheck();

/* Um testador apagou um exercício inteiro achando que estava tirando só uma
   série: "− série" e "excluir" eram dois .minibtn do mesmo tamanho, na mesma
   linha, separados por três botões, e a única diferença era a cor do texto.

   As duas ações são de peso muito diferente:
   - tirar série só decrementa item.sets; o log continua guardado e "+ série"
     traz os dados de volta, então é reversível de fato e segue sem pergunta;
   - excluir exercício leva junto todas as séries registradas, então passa por
     confirmação e por desfazer, nos dois caminhos (botão e gesto). */

(async () => {
  const w = await boot();
  const $ = seletor(w);
  const MT = w.MT;

  $('daylist').querySelector('[data-open="upperA"]').click();
  await wait(20);
  $('btn-begin').click();
  await wait(20);
  const uid = MT.session.items[0].uid;
  const card = () => $('card-' + uid);

  console.log('\n== as duas acoes ficam visualmente separadas ==');
  const btnSerie = card().querySelector('[data-delset]');
  const btnExcluir = card().querySelector('[data-remove]');
  check('botao de tirar serie existe', !!btnSerie);
  check('botao de excluir exercicio existe', !!btnExcluir);
  check('nao estao mais na mesma linha', btnSerie.parentElement !== btnExcluir.parentElement);
  check('a linha do excluir e marcada como perigo', btnExcluir.parentElement.classList.contains('perigo'));
  check('o rotulo diz o que sai, nao so "excluir"', btnExcluir.textContent.trim() === 'excluir exercício');
  check('tirar serie continua com rotulo curto e leve', btnSerie.textContent.trim() === '− série');
  check('excluir tem aria-label citando o exercicio', /Excluir o exercício .+ inteiro/.test(btnExcluir.getAttribute('aria-label')));
  // jsdom devolve string vazia pra propriedade nao declarada, entao o padrao
  // do botao entra como 400 na comparacao
  const peso = el => parseInt(w.getComputedStyle(el).fontWeight, 10) || 400;
  const fundo = el => w.getComputedStyle(el).backgroundColor || w.getComputedStyle(el).background || '';
  check('excluir e mais pesado que tirar serie', peso(btnExcluir) > peso(btnSerie));
  check('excluir tem fundo de alerta proprio, tirar serie nao', fundo(btnExcluir) !== fundo(btnSerie));

  console.log('\n== tirar serie e leve: sem pergunta, e os dados voltam ==');
  const setsAntes = MT.session.items[0].sets;
  // registra a ultima serie pra provar que o dado sobrevive
  const linhas = card().querySelectorAll('.setrow');
  const ultima = linhas[linhas.length - 1];
  ultima.querySelector('input[data-f="w"]').value = '77';
  ultima.querySelector('input[data-f="w"]').dispatchEvent(new w.Event('input', {bubbles:true}));
  await wait(20);
  btnSerie.click();
  await wait(30);
  check('tirar serie nao abre confirmacao', !$('sheet-backdrop').classList.contains('show'));
  check('a serie saiu da contagem', MT.session.items[0].sets === setsAntes - 1);
  check('o exercicio continua no treino', !!card());
  card().querySelector('[data-addset]').click();
  await wait(30);
  check('mais serie devolve a contagem', MT.session.items[0].sets === setsAntes);
  const linhasDepois = card().querySelectorAll('.setrow');
  check('o dado registrado voltou junto, nada se perdeu',
    linhasDepois[linhasDepois.length - 1].querySelector('input[data-f="w"]').value === '77');

  console.log('\n== excluir exercicio pergunta antes, e da pra recusar ==');
  const totalAntes = MT.session.items.length;
  card().querySelector('[data-remove]').click();
  await wait(30);
  check('abre confirmacao', $('sheet-backdrop').classList.contains('show'));
  const textoConfirma = $('sheet-body').textContent;
  check('a confirmacao nomeia o exercicio', textoConfirma.includes(MT.EX[MT.session.items[0].ex].name));
  check('a confirmacao avisa que da pra desfazer', textoConfirma.includes('desfazer'));
  check('o botao de confirmar diz exatamente o que faz', $('sheet-body').querySelector('[data-r="1"]').textContent === 'Excluir exercício');
  $('sheet-body').querySelector('[data-r="0"]').click();
  await wait(30);
  check('recusar nao exclui nada', MT.session.items.length === totalAntes && !!card());

  console.log('\n== a confirmacao conta as series ja registradas ==');
  card().querySelector('.setrow .checkbtn').click();
  await wait(30);
  $('rest-skip').click();
  await wait(20);
  card().querySelector('[data-remove]').click();
  await wait(30);
  check('avisa quantas series se perdem', /registrou 1 série/.test($('sheet-body').textContent));
  $('sheet-body').querySelector('[data-r="0"]').click();
  await wait(20);

  console.log('\n== excluir pelo botao: confirma, exclui e desfaz ==');
  const nomeExcluido = MT.EX[MT.session.items[0].ex].name;
  card().querySelector('[data-remove]').click();
  await wait(30);
  $('sheet-body').querySelector('[data-r="1"]').click();
  await wait(30);
  check('exercicio saiu', MT.session.items.length === totalAntes - 1 && !card());
  check('toast oferece desfazer', $('toast').textContent.includes('Desfazer'));
  $('toast-act').click();
  await wait(30);
  check('desfazer devolve o exercicio', MT.session.items.length === totalAntes);
  check('volta na primeira posicao, de onde saiu', MT.EX[MT.session.items[0].ex].name === nomeExcluido);
  check('a serie que estava marcada voltou junto',
    (MT.session.log[MT.session.items[0].uid] || []).some(s => s && s.done));

  console.log('\n== excluir pelo gesto de arrastar: mesmo caminho, mesma protecao ==');
  const alvo = $('exlist').querySelectorAll('.excard[data-uid]')[1];
  const alvoUid = alvo.dataset.uid;
  const totalGesto = MT.session.items.length;
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
  $('exlist').dispatchEvent(mk('touchend', 170, 404, head));
  await wait(30);
  check('o gesto tambem pede confirmacao', $('sheet-backdrop').classList.contains('show'));
  check('o card volta ao lugar enquanto a pessoa decide, nao fica preso torto',
    !alvo.classList.contains('willdelete') && !alvo.querySelector('.cardinner').style.transform);
  $('sheet-body').querySelector('[data-r="0"]').click();
  await wait(30);
  check('recusar no gesto tambem nao exclui', MT.session.items.length === totalGesto && !!$('card-' + alvoUid));

  $('exlist').dispatchEvent(mk('touchstart', 300, 400, head));
  $('exlist').dispatchEvent(mk('touchmove', 260, 402, head));
  $('exlist').dispatchEvent(mk('touchmove', 170, 404, head));
  $('exlist').dispatchEvent(mk('touchend', 170, 404, head));
  await wait(30);
  $('sheet-body').querySelector('[data-r="1"]').click();
  await wait(30);
  check('confirmar no gesto exclui', MT.session.items.length === totalGesto - 1 && !$('card-' + alvoUid));
  check('gesto tambem oferece desfazer', $('toast').textContent.includes('Desfazer'));
  $('toast-act').click();
  await wait(30);
  check('desfazer funciona igual pelo gesto', MT.session.items.length === totalGesto && !!$('card-' + alvoUid));

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
