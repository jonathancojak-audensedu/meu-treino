const { boot, usar, fechar, wait, criarCheck, seletor } = require('./_helpers');
const check = criarCheck();

const dias = n => new Date(Date.now() - n * 86400000).toISOString();
const HISTORICO = [
  {id:'h1', name:'Superiores A', tag:'DIA 1', block:'a', date: dias(0), duration:600, volume:900, setsDone:3, exercises:[]}
];

(async () => {
  const w = await boot({mt_history: JSON.stringify(HISTORICO)});
  const $ = seletor(w);
  const alturaBtn = el => parseInt(w.getComputedStyle(el).height, 10);
  const larguraBtn = el => parseInt(w.getComputedStyle(el).width, 10);

  console.log('\n== rotulo em todo campo do onboarding e dos editores de horario ==');
  $('daylist').querySelector('[data-open="lowerA"]').click();
  await wait(20);
  $('btn-begin').click();
  await wait(20);
  $('sess-timer-btn').click();
  await wait(30);
  check('data de inicio da sessao tem aria-label', $('ini-data').getAttribute('aria-label') === 'Data de início');
  check('hora de inicio da sessao tem aria-label', $('ini-hora').getAttribute('aria-label') === 'Hora de início');
  $('sheet-body').querySelector('[data-fechar]').click();
  await wait(20);

  $('nav-history').click();
  await wait(20);
  $('histlist').querySelector('[data-hist="h1"]').click();
  await wait(20);
  $('histlist').querySelector('[data-editdata="h1"]').click();
  await wait(30);
  check('data de inicio do historico tem aria-label', $('ed-data-ini').getAttribute('aria-label') === 'Data de início');
  check('hora de inicio do historico tem aria-label', $('ed-hora-ini').getAttribute('aria-label') === 'Hora de início');
  check('data de fim do historico tem aria-label', $('ed-data-fim').getAttribute('aria-label') === 'Data de fim');
  check('hora de fim do historico tem aria-label', $('ed-hora-fim').getAttribute('aria-label') === 'Hora de fim');
  $('sheet-body').querySelector('[data-fechar]').click();
  await wait(20);

  console.log('\n== estrela de favorito e um botao de verdade, nao aninhado dentro de outro botao ==');
  $('nav-home').click();
  await wait(20);
  // ha uma sessao ativa (lowerA, comecada no inicio do teste): cancela antes
  // de abrir outro dia, senao o app pergunta "treino em andamento" em vez de
  // abrir a previa
  $('resume-drop').click();
  await wait(20);
  $('sheet-body').querySelector('[data-r="1"]').click();
  await wait(30);
  $('daylist').querySelector('[data-open="upperA"]').click();
  await wait(20);
  $('btn-editprog').click();
  await wait(30);
  $('exlist').querySelector('[data-addex]').click();
  await wait(40);
  const primeiraOpcao = $('ex-options').querySelector('.opt');
  check('linha do seletor existe', !!primeiraOpcao);
  const estrela = primeiraOpcao.querySelector('[data-star]');
  check('estrela e uma tag <button>, nao <span role="button">', estrela.tagName === 'BUTTON');
  check('estrela nao esta dentro de outro <button> (HTML invalido, some pra leitor de tela)', !estrela.closest('button button') && estrela.closest('button') === estrela);
  check('estrela tem aria-pressed refletindo o estado de favorito', estrela.getAttribute('aria-pressed') === 'false');
  check('estrela alcanca 44px de altura de toque', alturaBtn(estrela) === 44);
  check('estrela alcanca 44px de largura de toque', larguraBtn(estrela) === 44);
  const botaoSelecionar = primeiraOpcao.querySelector('.optselect');
  check('botao de selecionar exercicio existe ao lado da estrela, nao dentro dela', !!botaoSelecionar && botaoSelecionar !== estrela);

  console.log('\n== areas de toque de 44px em botoes pequenos revisados ==');
  check('botao fechar da folha (X) alcanca 44px', alturaBtn($('sheet-body').querySelector('.closebtn')) === 44 && larguraBtn($('sheet-body').querySelector('.closebtn')) === 44);
  $('sheet-body').querySelector('.closebtn').click();
  await wait(20);
  const stepperBtn = $('exlist').querySelector('.editstepper button');
  check('stepper de series/descanso na edicao alcanca 44px', alturaBtn(stepperBtn) === 44 && larguraBtn(stepperBtn) === 44);
  $('btn-canceledit').click();
  await wait(20);

  $('nav-history').click();
  await wait(20);
  $('btn-calendar').click();
  await wait(30);
  const navBtn = $('calmodal').querySelector('.calnav button');
  check('navegacao do calendario (mes anterior/seguinte) alcanca 44px', alturaBtn(navBtn) === 44 && larguraBtn(navBtn) === 44);
  $('cal-close').click();
  await wait(20);

  console.log('\n== fundo fica inert enquanto uma folha esta aberta (navegacao por teclado e leitor de tela nao vazam pro fundo) ==');
  const bottomnav = w.document.querySelector('.bottomnav');
  check('bottomnav nao e inert com o calendario fechado', !bottomnav.inert);
  $('btn-calendar').click();
  await wait(30);
  check('bottomnav fica inert com o calendario aberto', bottomnav.inert === true);
  check('a propria folha (calmodal) continua acessivel, nao inert', !$('calmodal').inert);
  $('cal-close').click();
  await wait(20);
  check('bottomnav destrava depois de fechar', bottomnav.inert === false);

  console.log('\n== foco visivel: :focus-visible nao foi removido sem substituto adequado ==');
  const cssTexto = require('fs').readFileSync(require('path').join(__dirname, '..', 'css', 'app.css'), 'utf8');
  check('regra global de :focus-visible continua no css', /:focus-visible\s*\{[^}]*outline/.test(cssTexto));

  console.log('\n== contraste: text-faint ajustado pra passar 4.5:1 mesmo no card mais escuro (card-2) ==');
  function hexToRgb(hex){ hex = hex.replace('#',''); return [0,2,4].map(i => parseInt(hex.substr(i,2),16)); }
  function luminance([r,g,b]){
    const a = [r,g,b].map(v => { v/=255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); });
    return 0.2126*a[0] + 0.7152*a[1] + 0.0722*a[2];
  }
  function contraste(h1, h2){
    const l1 = luminance(hexToRgb(h1)), l2 = luminance(hexToRgb(h2));
    const [c, e] = l1 > l2 ? [l1,l2] : [l2,l1];
    return (c + 0.05) / (e + 0.05);
  }
  const mTextFaint = cssTexto.match(/--text-faint:\s*(#[0-9a-fA-F]{6})/);
  const mCard2 = cssTexto.match(/--card-2:\s*(#[0-9a-fA-F]{6})/);
  check('--text-faint e --card-2 encontrados no css', !!mTextFaint && !!mCard2);
  if(mTextFaint && mCard2){
    const c = contraste(mTextFaint[1], mCard2[1]);
    check('contraste text-faint sobre card-2 e pelo menos 4.5:1 (' + c.toFixed(2) + ':1)', c >= 4.5);
  }

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
