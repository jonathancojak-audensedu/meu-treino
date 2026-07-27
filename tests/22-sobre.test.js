const { boot, wait, criarCheck, seletor } = require('./_helpers');
const check = criarCheck();

(async () => {
  const w = await boot(null, w => {
    w.caches = {keys: () => Promise.resolve(['meu-treino-v27'])};
    w.navigator.storage = {estimate: () => Promise.resolve({usage: 2 * 1024 * 1024})};
  });
  const $ = seletor(w);

  console.log('\n== ajustes tem o item Sobre ==');
  $('nav-settings').click();
  await wait(20);
  check('botao Sobre existe', !!$('btn-sobre'));

  console.log('\n== abrir Sobre mostra versao, novidades e o aviso profissional ==');
  $('btn-sobre').click();
  await wait(40);
  check('folha abre', $('sheet-backdrop').classList.contains('show'));
  check('titulo correto', $('sheet-title').textContent.includes('Sobre'));
  check('mostra a versao instalada', $('sheet-body').textContent.includes('meu-treino-v27'));
  check('tem secao de novidades', $('sheet-body').textContent.includes('Novidades desta versão'));
  check('lista pelo menos uma novidade', $('sheet-body').querySelectorAll('.novidades li').length >= 1);
  check('tem o aviso profissional', $('sheet-body').textContent.includes('não substitui avaliação'));

  console.log('\n== enviar feedback abre o link ja preparado com a versao ==');
  await wait(20); // prepararFeedback() roda em paralelo no boot, da tempo dela terminar
  let aberto = null;
  w.open = (url) => { aberto = url; };
  $('sobre-feedback').click();
  await wait(10);
  check('abriu o link de feedback', !!aberto && aberto.indexOf('wa.me') !== -1);
  check('link inclui a versao', decodeURIComponent(aberto).includes('meu-treino-v27'));

  console.log('\n== fechar a folha funciona ==');
  $('sheet-body').querySelector('[data-fechar]').click();
  await wait(20);
  check('folha fecha', !$('sheet-backdrop').classList.contains('show'));

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
