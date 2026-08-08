const { boot, wait, criarCheck, seletor } = require('./_helpers');
const check = criarCheck();

/* A navegação passou de três para quatro abas: Início, Treinos, Histórico e
   Ajustes. Início é a home de incentivo e abre por padrão; Treinos virou tela
   própria com os dias do programa e o treino livre, que antes moravam dentro
   da home. */

const PERFIL = {nome:'Ana', objetivo:'hipertrofia', dias:3, local:'casa', tempo:45, dores:[], prioridade:[]};

(async () => {
  const w = await boot({mt_profile: JSON.stringify(PERFIL)});
  const $ = seletor(w);
  const MT = w.MT;
  const abas = () => [...w.document.querySelectorAll('.bottomnav .navbtn')];
  const ativa = () => abas().find(b => b.getAttribute('aria-current') === 'page');

  console.log('\n== quatro abas, na ordem certa e com rótulo curto ==');
  check('a navegação tem quatro abas', abas().length === 4);
  const rotulos = abas().map(b => b.textContent.trim());
  check('na ordem Início, Treinos, Histórico, Ajustes',
    rotulos[0] === 'Início' && rotulos[1] === 'Treinos' && rotulos[2] === 'Histórico' && rotulos[3] === 'Ajustes');
  check('usa "Ajustes", não "Configurações", pra não truncar', !rotulos.some(r => r.includes('Configurações')));
  check('todo rótulo é curto o bastante pro celular', rotulos.every(r => r.length <= 9));
  check('cada aba tem ícone próprio', abas().every(b => !!b.querySelector('svg')));
  const svgTreinos = $('nav-treinos').querySelector('svg').innerHTML;
  check('a aba de treinos usa halter, não um sinal de mais', svgTreinos.split('<path').length - 1 === 5);

  console.log('\n== Início abre por padrão ==');
  check('a tela inicial é a home de incentivo', $('screen-home').classList.contains('active'));
  check('e a aba acesa é a primeira', ativa() === $('nav-home'));
  check('a home mostra a saudação', $('home-saudacao').textContent.length > 3);
  check('e o card do próximo treino', !!$('home-proximo').querySelector('.proxcard'));

  console.log('\n== os dias do programa saíram da home e viraram a aba Treinos ==');
  check('a lista de treinos não está mais na home', !$('screen-home').querySelector('#daylist'));
  check('ela vive na tela de treinos', !!$('screen-treinos').querySelector('#daylist'));
  check('a tela de treinos existe', !!$('screen-treinos'));
  $('nav-treinos').click();
  await wait(40);
  check('tocar em Treinos abre a tela', $('screen-treinos').classList.contains('active'));
  check('e a home sai de cena', !$('screen-home').classList.contains('active'));
  check('a aba de treinos fica acesa', ativa() === $('nav-treinos'));
  check('os dias do programa aparecem', $('daylist').querySelectorAll('[data-open]').length >= 3);
  check('e o treino livre também', !!$('daylist').querySelector('[data-free]'));

  console.log('\n== dá pra circular entre as quatro ==');
  $('nav-history').click();
  await wait(30);
  check('Histórico abre', $('screen-history').classList.contains('active') && ativa() === $('nav-history'));
  $('nav-settings').click();
  await wait(30);
  check('Ajustes abre', $('screen-settings').classList.contains('active') && ativa() === $('nav-settings'));
  $('nav-home').click();
  await wait(30);
  check('e volta pro Início', $('screen-home').classList.contains('active') && ativa() === $('nav-home'));
  check('só uma aba acesa por vez', abas().filter(b => b.getAttribute('aria-current') === 'page').length === 1);

  console.log('\n== durante o treino, a aba Treinos continua acesa ==');
  $('nav-treinos').click();
  await wait(30);
  $('daylist').querySelector('[data-open]').click();
  await wait(30);
  check('a prévia do treino abre', $('screen-session').classList.contains('active'));
  check('a aba de treinos segue acesa, em vez de nenhuma', ativa() === $('nav-treinos'));
  $('btn-begin').click();
  await wait(30);
  check('com o treino rolando, ainda é a aba de treinos', ativa() === $('nav-treinos'));
  check('o ponto de treino em andamento fica na aba de treinos', $('nav-treinos').classList.contains('training'));
  check('e não na aba de início', !$('nav-home').classList.contains('training'));

  console.log('\n== o card do próximo treino não repete a contagem de exercícios ==');
  const px = $('home-proximo').querySelector('.px-meta');
  check('o card do próximo treino tem descrição', !!px);
  check('"exercícios" aparece uma vez só', (px.textContent.match(/exercícios?/g) || []).length === 1);
  const daycards = [...$('daylist').querySelectorAll('.daycard .meta')];
  check('e na lista de treinos também não repete',
    daycards.every(d => (d.textContent.match(/exercícios?/g) || []).length === 1));

  /* o programa gerado traz a contagem dentro do meta, o padrão não: a
     descrição precisa dar certo nos dois casos */
  const comContagem = MT.descricaoDoDia({meta:'peito, costas, ombros · 5 exercícios'}, 5);
  check('meta que já vinha com contagem não duplica', comContagem === 'peito, costas, ombros · 5 exercícios');
  const semContagem = MT.descricaoDoDia({meta:'Peito e costas · Força'}, 7);
  check('meta sem contagem ganha a contagem', semContagem === 'Peito e costas · Força · 7 exercícios');
  check('a contagem mostrada é a atual, não a que estava congelada no meta',
    MT.descricaoDoDia({meta:'peito · 6 exercícios'}, 4) === 'peito · 4 exercícios');
  check('um exercício só fica no singular', MT.descricaoDoDia({meta:'peito · 3 exercícios'}, 1) === 'peito · 1 exercício');
  check('meta vazio não deixa um separador solto', MT.descricaoDoDia({meta:''}, 5) === '5 exercícios');

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 20000);
