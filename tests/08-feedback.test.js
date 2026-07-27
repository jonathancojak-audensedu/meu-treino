const { boot, wait, criarCheck, seletor } = require('./_helpers');
const check = criarCheck();

(async () => {
  const perfilFake = {nome:'Fulano de Tal Segredo', dias:'4', objetivo:'hipertrofia', local:'academia', tempo:'60', dores:[]};
  const w = await boot({mt_profile: JSON.stringify(perfilFake)}, w => {
    w.caches = {keys: () => Promise.resolve(['meu-treino-v9'])};
  });
  const $ = seletor(w);

  console.log('\n== link de feedback ==');
  const el = $('btn-feedback');
  check('elemento existe', !!el);
  check('abre em nova aba', el.getAttribute('target') === '_blank');
  check('tem rel=noopener', el.getAttribute('rel') === 'noopener');

  const href = el.getAttribute('href');
  check('aponta para o numero certo no wa.me', href.indexOf('https://wa.me/5581986501624?text=') === 0);

  const texto = decodeURIComponent(href.split('?text=')[1]);
  check('mensagem tem cabecalho identificavel', texto.includes('Feedback do Meu Treino'));
  check('mensagem tem a versao do service worker', texto.includes('meu-treino-v9'));
  check('mensagem informa que roda no navegador (nao instalado)', texto.includes('Modo: navegador'));
  check('mensagem tem o user agent completo', texto.includes(w.navigator.userAgent));
  check('nada do nome do perfil vaza pra mensagem', !texto.includes('Fulano de Tal Segredo'));
  check('nenhuma palavra de dado pessoal aparece', !/perfil|treino conclu|hist(o|ó)rico registrado/i.test(texto.replace('Feedback do Meu Treino', '')));

  console.log('\n== reabrir ajustes recalcula o link ==');
  $('nav-settings').click();
  await wait(30);
  check('href continua valido apos reabrir', $('btn-feedback').getAttribute('href').indexOf('https://wa.me/5581986501624') === 0);

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
