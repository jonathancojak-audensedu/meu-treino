const fs = require('fs');
const zlib = require('zlib');
const { criarCheck, REPO } = require('./_helpers');
const check = criarCheck();

/* item 5.3 do ROADMAP: sem servidor de build, o unico jeito de manter o
   carregamento rapido numa conexao lenta e vigiar o peso do que entra no
   caminho critico (tudo que index.html carrega antes da primeira tela:
   HTML, CSS, e o grafo inteiro de modulos JS, ja que import estatico exige
   resolver tudo antes de rodar main.js). Medido com http.server local sem
   gzip: ~227KB brutos, ~65KB com gzip (o que o GitHub Pages aplica de
   verdade). Esses tetos dao folga pro app crescer sem regredir caladamente. */

const ARQUIVOS_CAMINHO_CRITICO = [
  'index.html', 'css/app.css',
  'js/main.js', 'js/catalog.js', 'js/generator.js', 'js/store.js',
  'js/ui.js', 'js/history.js', 'js/session.js', 'js/onboarding.js'
];

(async () => {
  console.log('\n== peso do caminho critico (o que carrega antes da primeira tela) ==');
  let totalBruto = 0, totalGzip = 0;
  const tamanhos = {};
  ARQUIVOS_CAMINHO_CRITICO.forEach(rel => {
    const conteudo = fs.readFileSync(REPO + rel);
    const bruto = conteudo.length;
    const gzip = zlib.gzipSync(conteudo).length;
    tamanhos[rel] = {bruto, gzip};
    totalBruto += bruto;
    totalGzip += gzip;
  });
  console.log('  total bruto: ' + (totalBruto / 1024).toFixed(1) + ' KB');
  console.log('  total gzip: ' + (totalGzip / 1024).toFixed(1) + ' KB');

  check('caminho critico bruto fica abaixo de 320 KB (medido: ' + (totalBruto/1024).toFixed(1) + ' KB)', totalBruto < 320 * 1024);
  check('caminho critico com gzip fica abaixo de 100 KB (medido: ' + (totalGzip/1024).toFixed(1) + ' KB, GitHub Pages serve gzip de verdade)', totalGzip < 100 * 1024);

  console.log('\n== dicas de carregamento que ajudam numa conexao lenta ==');
  const html = fs.readFileSync(REPO + 'index.html', 'utf8');
  check('preconnect pro fonts.googleapis.com', html.includes('rel="preconnect" href="https://fonts.googleapis.com"'));
  check('preconnect pro fonts.gstatic.com', html.includes('rel="preconnect" href="https://fonts.gstatic.com"'));
  check('fonte pedida com display=swap (texto nao fica invisivel esperando a fonte)', html.includes('display=swap'));

  const modulosEmMain = fs.readFileSync(REPO + 'js/main.js', 'utf8').match(/from '\.\/(\w+)\.js'/g) || [];
  const nomesModulos = ['main', ...modulosEmMain.map(m => m.match(/\.\/(\w+)\.js/)[1])];
  const semPreload = nomesModulos.filter(n => !html.includes('modulepreload" href="./js/' + n + '.js"'));
  check('todo modulo importado por main.js tem modulepreload (' + semPreload.length + ' faltando: ' + semPreload.join(', ') + ')', semPreload.length === 0);

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();
