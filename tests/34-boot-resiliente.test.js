const { boot, wait, criarCheck, seletor } = require('./_helpers');
const check = criarCheck();

/* Um testador abriu o app com o index.html novo e o js antigo (o service
   worker serve navegação pela rede e os módulos pelo cache, então numa
   atualização os dois podem se desencontrar por uma carga). O js antigo
   procurava um elemento que não existia mais, a home quebrava, e como o
   registro do service worker vinha DEPOIS de desenhar as telas, a versão
   nova nunca chegava: o aparelho ficava presa na versão quebrada sem saída
   pela própria interface.

   Duas garantias aqui: desenhar tela é isolado do resto do boot, e o
   registro do service worker acontece antes de qualquer render. */

const PERFIL = {nome:'Ana', objetivo:'hipertrofia', dias:3, local:'casa', tempo:45, dores:[], prioridade:[]};

(async () => {
  console.log('\n== falha ao desenhar a home não derruba o resto do boot ==');
  let registrou = false;
  const w = await boot({mt_profile: JSON.stringify(PERFIL)}, ww => {
    ww.navigator.serviceWorker = {
      controller: null,
      register: () => { registrou = true; return Promise.resolve({}); },
      addEventListener: () => {},
      getRegistrations: () => Promise.resolve([])
    };
    /* simula o desencontro real: o elemento que a home desenha some, como
       aconteceria com html e js de versões diferentes */
    const orig = ww.document.getElementById.bind(ww.document);
    ww.document.getElementById = id => (id === 'home-saudacao' ? null : orig(id));
  });
  const $ = seletor(w);

  check('o app não fica em branco quando a home quebra', !!$('screen-home'));
  check('o service worker foi registrado mesmo com a tela quebrada', registrou === true);
  check('o erro foi guardado pro diagnóstico', w.MT.erros.some(e => /desenhar a tela inicial/.test(e.mensagem)));
  check('a pessoa é avisada em vez de ficar olhando tela quebrada', $('toast').textContent.includes('Feche e abra'));
  check('a navegação de baixo continua funcionando', !!w.document.querySelector('.bottomnav'));

  console.log('\n== com tudo no lugar, o boot registra o service worker e desenha normal ==');
  let registrou2 = false, ouviuTroca = false;
  const w2 = await boot({mt_profile: JSON.stringify(PERFIL)}, ww => {
    ww.navigator.serviceWorker = {
      controller: {},
      register: () => { registrou2 = true; return Promise.resolve({}); },
      addEventListener: (tipo) => { if(tipo === 'controllerchange') ouviuTroca = true; },
      getRegistrations: () => Promise.resolve([])
    };
  });
  const $2 = seletor(w2);
  check('service worker registrado', registrou2 === true);
  check('fica de olho na troca de versão do service worker', ouviuTroca === true);
  check('a home desenhou por completo', $2('home-saudacao').textContent.length > 3);
  check('sem erro de boot registrado', !w2.MT.erros.some(e => /desenhar a tela inicial/.test(e.mensagem)));
  check('sem aviso de falha pra pessoa', !$2('toast').textContent.includes('Feche e abra'));

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
