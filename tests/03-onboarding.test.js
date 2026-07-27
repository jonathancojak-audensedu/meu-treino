const fs = require('fs');
const path = require('path');
const { boot, wait, criarCheck, seletor, REPO } = require('./_helpers');
const check = criarCheck();

const html = fs.readFileSync(REPO + 'index.html', 'utf8');
const jsDir = path.join(REPO, 'js');
const todoJs = fs.readdirSync(jsDir)
  .filter(f => f.endsWith('.js'))
  .map(f => fs.readFileSync(path.join(jsDir, f), 'utf8'))
  .join('\n');

(async () => {
  const w = await boot();
  const $ = seletor(w);
  const ev = (el, type) => el.dispatchEvent(new w.Event(type, {bubbles:true}));
  const opt = v => $('onb-body').querySelector('[data-opt="' + v + '"]');

  console.log('\n== primeira abertura ==');
  check('onboarding abre sozinho', $('onboarding').hidden === false);
  check('comeca na pergunta 1 de 9', $('onb-step').textContent === '1/9');
  check('botao voltar desabilitado no inicio', $('onb-back').disabled === true);
  check('pergunta o nome', $('onb-body').textContent.includes('Como podemos te chamar'));
  check('continuar bloqueado sem resposta', $('onb-next').disabled === true);

  console.log('\n== nome ==');
  $('onb-texto').value = 'Jonathan';
  ev($('onb-texto'), 'input');
  check('continuar libera ao digitar', $('onb-next').disabled === false);
  $('onb-next').click();
  await wait(30);
  check('avancou para experiencia', $('onb-body').textContent.includes('Você treina hoje'));
  check('progresso 2 de 9', $('onb-step').textContent === '2/9');

  console.log('\n== voltar preserva resposta ==');
  $('onb-back').click();
  await wait(30);
  check('voltou para o nome', $('onb-body').textContent.includes('Como podemos te chamar'));
  check('nome preservado', $('onb-texto').value === 'Jonathan');
  $('onb-next').click();
  await wait(30);

  console.log('\n== escolha unica avanca sozinha ==');
  opt('intermediario').click();
  await wait(260);
  check('seguiu sem tocar em continuar', $('onb-body').textContent.includes('Quantos dias por semana'));

  opt('4').click();
  await wait(260);
  check('dias registrados e seguiu', $('onb-body').textContent.includes('Quanto tempo você tem'));
  opt('60').click();
  await wait(260);
  check('tempo registrado e seguiu', $('onb-body').textContent.includes('Onde você treina'));
  opt('simples').click();
  await wait(260);
  check('local registrado e seguiu', $('onb-body').textContent.includes('Qual seu principal objetivo'));
  opt('hipertrofia').click();
  await wait(260);
  check('objetivo registrado e seguiu', $('onb-body').textContent.includes('dor ou lesão'));

  console.log('\n== multipla escolha ==');
  check('continuar bloqueado sem marcar nada', $('onb-next').disabled === true);
  opt('ombro').click();
  await wait(20);
  check('marcou ombro', opt('ombro').classList.contains('sel'));
  check('continuar liberou', $('onb-next').disabled === false);
  opt('joelho').click();
  await wait(20);
  check('aceita duas dores', opt('ombro').classList.contains('sel') && opt('joelho').classList.contains('sel'));
  opt('nenhuma').click();
  await wait(20);
  check('nenhuma limpa as outras', !opt('ombro').classList.contains('sel') && opt('nenhuma').classList.contains('sel'));
  opt('ombro').click();
  await wait(20);
  check('marcar dor tira o nenhuma', !opt('nenhuma').classList.contains('sel') && opt('ombro').classList.contains('sel'));
  $('onb-next').click();
  await wait(30);

  console.log('\n== prioridade opcional, teto de 2 ==');
  check('chegou na prioridade', $('onb-body').textContent.includes('priorizar algum grupo'));
  check('continuar liberado por ser opcional', $('onb-next').disabled === false);
  check('tem botao de pular', !!$('onb-skip'));
  opt('peito').click(); await wait(20);
  opt('costas').click(); await wait(20);
  opt('bracos').click(); await wait(20);
  const marcados = $('onb-body').querySelectorAll('.onb-opt.sel').length;
  check('nao passa de 2 escolhas', marcados === 2);
  check('a mais antiga saiu', !opt('peito').classList.contains('sel'));
  $('onb-next').click();
  await wait(30);

  console.log('\n== resumo ==');
  check('mostra o nome', $('onb-body').textContent.includes('Tudo certo, Jonathan'));
  check('mostra o objetivo', $('onb-body').textContent.includes('Massa muscular'));
  check('mostra a frequencia', $('onb-body').textContent.includes('4 dias por semana'));
  check('mostra a limitacao', $('onb-body').textContent.includes('ombro'));
  check('tem aviso profissional', $('onb-body').textContent.includes('não substitui avaliação'));
  check('primeira abertura avisa que os dados ficam so no aparelho', $('onb-body').textContent.includes('ficam só neste aparelho'));
  check('progresso 9 de 9', $('onb-step').textContent === '9/9');

  $('onb-next').click();
  await wait(120);

  console.log('\n== perfil salvo e app personalizado ==');
  check('onboarding fechou', $('onboarding').hidden === true);
  const pf = JSON.parse(w.localStorage.getItem('mt_profile'));
  check('perfil no storage', !!pf && pf.nome === 'Jonathan');
  check('dias salvos como numero', pf.dias === 4);
  check('dores salvas', Array.isArray(pf.dores) && pf.dores.indexOf('ombro') !== -1);
  check('prioridade com 2 itens', pf.prioridade.length === 2);
  check('home fala com a pessoa', /Jonathan/.test($('home-sub').textContent));
  check('home cita a frequencia', $('home-sub').textContent.includes('4x por semana'));
  check('nota da home adaptada aos 4 dias', $('home-nota').textContent.includes('Upper A, Lower A'));
  check('ajustes resume o perfil', $('perfil-resumo').textContent.includes('Massa muscular'));
  check('ajustes cita a limitacao', $('perfil-resumo').textContent.includes('ombro'));

  console.log('\n== nada de nome pessoal sobrando ==');
  check('sem Jonathan Costa no html', !html.includes('Jonathan Costa'));
  check('sem referencia a laudo no js', !todoJs.includes('laudo'));
  check('titulo generico', $('screen-home').querySelector('h1').textContent === 'Meu Treino');

  console.log('\n== segunda abertura nao repete o onboarding ==');
  const dump = {};
  for(const k of Object.keys(w.localStorage)) dump[k] = w.localStorage.getItem(k);
  const w2 = await boot(dump);
  const $2 = seletor(w2);
  check('onboarding nao reaparece', $2('onboarding').hidden === true);
  check('home ja personalizada', /Jonathan/.test($2('home-sub').textContent));

  console.log('\n== editar perfil pelos ajustes ==');
  $2('btn-perfil').click();
  await wait(40);
  check('reabre o onboarding', $2('onboarding').hidden === false);
  check('vem preenchido com o nome', $2('onb-texto').value === 'Jonathan');
  $2('onb-texto').value = 'Jon';
  $2('onb-texto').dispatchEvent(new w2.Event('input', {bubbles:true}));
  for(let i = 0; i < 8; i++){ $2('onb-next').click(); await wait(40); }
  check('chegou no resumo em modo edicao', $2('onb-body').textContent.includes('Tudo certo, Jon'));
  check('botao diz salvar', $2('onb-next').textContent.includes('Salvar'));
  check('aviso de primeira abertura nao repete ao editar o perfil', !$2('onb-body').textContent.includes('ficam só neste aparelho'));
  $2('onb-next').click();
  await wait(120);
  const pf2 = JSON.parse(w2.localStorage.getItem('mt_profile'));
  check('nome atualizado', pf2.nome === 'Jon');
  check('demais respostas preservadas', pf2.dias === 4 && pf2.objetivo === 'hipertrofia');
  check('data de criacao mantida', pf2.criadoEm === pf.criadoEm);

  console.log('\n== dados corporais ==');
  $2('btn-corpo').click();
  await wait(40);
  check('folha abriu', $2('sheet-backdrop').classList.contains('show'));
  check('deixa claro que e opcional', $2('sheet-body').textContent.includes('Nada disso muda o treino'));
  $2('c-idade').value = '34'; $2('c-altura').value = '178'; $2('c-peso').value = '82.5';
  $2('sheet-body').querySelector('[data-sexo="masculino"]').click();
  $2('c-salvar').click();
  await wait(120);
  const cp = JSON.parse(w2.localStorage.getItem('mt_corpo'));
  check('dados corporais salvos', cp.altura === '178' && cp.peso === '82.5' && cp.sexo === 'masculino');
  check('ajustes mostra o resumo', $2('corpo-resumo').textContent.includes('178 cm'));

  console.log('\n== programa montado a partir das respostas ==');
  const prog = w2.MT.program;
  check('programa tem 4 dias, como respondido', prog.length === 4);
  check('deixou de ser o Upper Lower fixo', !prog.some(d => d.name === 'Upper A'));
  check('divisao superiores e inferiores para 4 dias', prog[0].name.indexOf('Superiores') === 0);
  const todos = prog.reduce((a,d) => a.concat(d.items.map(i => i.ex)), []);
  const EQ = w2.MT.EQUIP.simples;
  check('respeita academia simples', todos.every(id => w2.MT.META[id].e.every(e => EQ.indexOf(e) !== -1)));
  check('nenhum exercicio carrega o ombro', todos.every(id => w2.MT.META[id].s.indexOf('ombro') === -1));
  check('cabe em 60 minutos', prog.every(d => w2.MT.tempo(d.items) <= 60*60*1.12));
  const vol = w2.MT.volume(prog);
  check('volume de peito dentro do razoavel', vol.peito >= 6 && vol.peito <= 26);
  check('volume de costas dentro do razoavel', vol.costas >= 6 && vol.costas <= 30);
  check('home mostra os dias gerados', $2('daylist').querySelectorAll('[data-open]').length === 4);

  console.log('\n== o treino continua funcionando ==');
  $2('daylist').querySelector('[data-open="' + prog[0].key + '"]').click();
  await wait(30);
  $2('btn-begin').click();
  await wait(30);
  check('sessao inicia com os exercicios do dia', $2('exlist').querySelectorAll('.excard[data-uid]').length === prog[0].items.length);
  const uid = $2('exlist').querySelector('.excard[data-uid]').dataset.uid;
  const row = $2('card-' + uid).querySelectorAll('.setrow')[0];
  const wi = row.querySelector('input[data-f="w"]'); wi.value = '80'; wi.dispatchEvent(new w2.Event('input', {bubbles:true}));
  const ri = row.querySelector('input[data-f="r"]'); ri.value = '8'; ri.dispatchEvent(new w2.Event('input', {bubbles:true}));
  $2('card-' + uid).querySelector('[data-check]').click();
  await wait(40);
  check('volume calcula', $2('sess-volume').textContent === '640 kg');
  check('timer de descanso abre', $2('resttimer').classList.contains('show'));

  console.log('\n' + (check.fails ? check.fails + ' FALHAS' : 'todas as verificacoes passaram'));
  process.exit(check.fails ? 1 : 0);
})();

setTimeout(() => { console.log('\n(timeout)'); process.exit(1); }, 25000);
