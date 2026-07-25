/* Roda os quatro conjuntos de teste em sequência e resume o resultado. */
const { execFileSync } = require('child_process');
const fs = require('fs');
const dir = __dirname;

const arquivos = fs.readdirSync(dir).filter(f => f.endsWith('.test.js')).sort();
let falhou = false;

for(const f of arquivos){
  console.log('\n' + '='.repeat(60));
  console.log('  ' + f);
  console.log('='.repeat(60));
  try{
    const saida = execFileSync('node', [dir + '/' + f], {encoding:'utf8', timeout:120000});
    process.stdout.write(saida);
    if(/FALHA/.test(saida)) falhou = true;
  }catch(e){
    process.stdout.write(e.stdout || '');
    console.log('  ERRO AO EXECUTAR: ' + e.message);
    falhou = true;
  }
}

console.log('\n' + '='.repeat(60));
console.log(falhou ? '  RESULTADO: existem falhas, veja acima' : '  RESULTADO: tudo passou');
console.log('='.repeat(60));
process.exit(falhou ? 1 : 0);
