/* =========================================================================
   ONBOARDING, PERFIL, DADOS CORPORAIS E IMC/TMB
   ========================================================================= */
import { $, esc, openBackdrop, askConfirm, toast, fecharSheetAtual } from './ui.js';
import { Store } from './store.js';
import { gerarPrograma, volumeSemanal } from './generator.js';
import { PROGRAM, setPROGRAM, renderHome } from './main.js';
import { overrides, setOverrides } from './session.js';

/* =========================================================================
   ONBOARDING E PERFIL
   As perguntas existem para mudar o treino. O que nao muda o treino
   (sexo, idade, altura, peso) fica em "Dados corporais", opcional.
   ========================================================================= */
const PERGUNTAS = [
  {
    id:'nome', tipo:'texto', obrigatoria:true,
    titulo:'Como podemos te chamar?',
    dica:'Só para o app deixar de falar com um estranho. Fica salvo no seu aparelho.',
    placeholder:'Seu nome ou apelido'
  },
  {
    id:'experiencia', tipo:'unica', obrigatoria:true,
    titulo:'Você treina hoje?',
    dica:'Isso define quais exercícios entram e o quanto dá para progredir por semana.',
    opcoes:[
      {v:'iniciante', l:'Nunca treinei', d:'ou parei faz mais de 6 meses'},
      {v:'retomando', l:'Treino há menos de 1 ano', d:'ainda meio irregular'},
      {v:'intermediario', l:'Treino consistente', d:'de 1 a 3 anos'},
      {v:'avancado', l:'Treino sério', d:'há mais de 3 anos'}
    ]
  },
  {
    id:'dias', tipo:'unica', obrigatoria:true, grade:true,
    titulo:'Quantos dias por semana você consegue treinar de verdade?',
    dica:'Vale responder pelo pior mês do ano, não pelo melhor. É isso que define a divisão do treino.',
    opcoes:[{v:2,l:'2'},{v:3,l:'3'},{v:4,l:'4'},{v:5,l:'5'},{v:6,l:'6'}]
  },
  {
    id:'tempo', tipo:'unica', obrigatoria:true,
    titulo:'Quanto tempo você tem por sessão?',
    dica:'Contando o aquecimento. Define quantos exercícios cabem sem você ter que sair no meio.',
    opcoes:[
      {v:30, l:'Até 30 minutos'},
      {v:45, l:'Uns 45 minutos'},
      {v:60, l:'Cerca de 1 hora'},
      {v:90, l:'1h30 ou mais'}
    ]
  },
  {
    id:'local', tipo:'unica', obrigatoria:true,
    titulo:'Onde você treina?',
    dica:'A pergunta que mais muda o seu treino. Não adianta prescrever o que você não tem.',
    opcoes:[
      {v:'academia', l:'Academia completa', d:'barras, halteres, máquinas e polias'},
      {v:'simples', l:'Academia simples', d:'halteres, barras e algumas máquinas'},
      {v:'casa', l:'Em casa', d:'com halteres ou elásticos'},
      {v:'corpo', l:'Só peso corporal', d:'sem nenhum equipamento'}
    ]
  },
  {
    id:'objetivo', tipo:'unica', obrigatoria:true,
    titulo:'Qual seu principal objetivo?',
    dica:'Escolha um só. É o que define repetições, carga e descanso.',
    opcoes:[
      {v:'hipertrofia', l:'Ganhar massa muscular', d:'6 a 12 repetições, descanso médio'},
      {v:'forca', l:'Ficar mais forte', d:'poucas repetições, carga alta, descanso longo'},
      {v:'emagrecer', l:'Perder gordura mantendo músculo', d:'treino de hipertrofia mais aeróbico'},
      {v:'saude', l:'Saúde e condicionamento', d:'volume moderado, corpo todo'}
    ]
  },
  {
    id:'dores', tipo:'multipla', obrigatoria:true, nenhuma:'nenhuma',
    titulo:'Tem alguma dor ou lesão que limita algum movimento?',
    dica:'O app só usa isso para tirar exercício da lista. Ele não trata nada e não substitui avaliação profissional.',
    opcoes:[
      {v:'ombro', l:'Ombro'}, {v:'cotovelo', l:'Cotovelo'}, {v:'punho', l:'Punho'},
      {v:'lombar', l:'Lombar'}, {v:'quadril', l:'Quadril'}, {v:'joelho', l:'Joelho'},
      {v:'tornozelo', l:'Tornozelo'}, {v:'nenhuma', l:'Nenhuma'}
    ]
  },
  {
    id:'prioridade', tipo:'multipla', max:2, opcional:true,
    titulo:'Quer priorizar algum grupo muscular?',
    dica:'Pode escolher até dois, ou pular. O grupo escolhido ganha um pouco mais de volume na semana.',
    opcoes:[
      {v:'peito', l:'Peito'}, {v:'costas', l:'Costas'}, {v:'ombro', l:'Ombros'},
      {v:'bracos', l:'Braços'}, {v:'gluteos', l:'Glúteos'},
      {v:'pernas', l:'Pernas'}, {v:'core', l:'Abdômen'}
    ]
  }
];

const ROTULOS = {
  experiencia:{iniciante:'Nunca treinei', retomando:'Menos de 1 ano', intermediario:'1 a 3 anos', avancado:'Mais de 3 anos'},
  local:{academia:'Academia completa', simples:'Academia simples', casa:'Em casa', corpo:'Peso corporal'},
  objetivo:{hipertrofia:'Massa muscular', forca:'Força', emagrecer:'Perder gordura', saude:'Saúde geral'}
};

let profile = null;
let corpo = null;
let onbDraft = {};
let onbIdx = 0;
let onbEditando = false;

/* main.js tambem le/escreve profile e corpo (boot, backup); um modulo nao
   pode reatribuir o binding importado de outro, entao usa estes setters */
function setProfile(novo){ profile = novo; }
function setCorpo(novo){ corpo = novo; }

/* -------------------------------------------------------------------------
   Fluxo
   ------------------------------------------------------------------------- */
function abrirOnboarding(editando){
  onbEditando = !!editando;
  onbDraft = editando && profile ? Object.assign({}, profile) : {};
  onbIdx = 0;
  $('onboarding').hidden = false;
  desenharPergunta();
}

function fecharOnboarding(){
  $('onboarding').hidden = true;
}

function desenharPergunta(){
  const total = PERGUNTAS.length + 1;           // perguntas mais a tela de resumo
  const p = PERGUNTAS[onbIdx];
  $('onb-bar').style.width = Math.round(((onbIdx) / total) * 100) + '%';
  $('onb-step').textContent = Math.min(onbIdx + 1, total) + '/' + total;
  $('onb-back').disabled = onbIdx === 0;
  $('onb-body').scrollTop = 0;

  if(!p) return desenharResumo();

  let corpoHtml = '<div class="onb-q">' + esc(p.titulo) + '</div>' +
                  '<div class="onb-hint">' + esc(p.dica) + '</div>';

  if(p.tipo === 'texto'){
    corpoHtml += '<input class="onb-input" id="onb-texto" type="text" autocomplete="given-name" ' +
      'placeholder="' + esc(p.placeholder) + '" value="' + esc(onbDraft[p.id] || '') + '" maxlength="30">';
  }else{
    const sel = onbDraft[p.id];
    corpoHtml += '<div class="' + (p.grade ? 'onb-grid' : 'onb-opts') + '">' +
      p.opcoes.map(o => {
        const marcado = p.tipo === 'multipla'
          ? Array.isArray(sel) && sel.indexOf(o.v) !== -1
          : String(sel) === String(o.v);
        return '<button class="onb-opt' + (marcado ? ' sel' : '') + '" data-opt="' + esc(o.v) + '">' +
          '<span><b>' + esc(o.l) + '</b>' + (o.d ? '<small>' + esc(o.d) + '</small>' : '') + '</span>' +
          (p.grade ? '' : '<span class="tick" aria-hidden="true">✓</span>') +
          '</button>';
      }).join('') + '</div>';
  }
  $('onb-body').innerHTML = corpoHtml;

  $('onb-foot').innerHTML =
    '<button class="onb-next" id="onb-next">' + (onbEditando ? 'Continuar' : 'Continuar') + '</button>' +
    (p.opcional ? '<button class="onb-skip" id="onb-skip">Pular esta</button>' : '');

  atualizarBotao();
  if(p.tipo === 'texto'){
    const inp = $('onb-texto');
    inp.addEventListener('input', atualizarBotao);
    setTimeout(() => inp.focus(), 60);
  }
}

function respostaValida(){
  const p = PERGUNTAS[onbIdx];
  if(!p) return true;
  if(p.opcional) return true;
  const v = p.tipo === 'texto' ? ($('onb-texto') ? $('onb-texto').value.trim() : '') : onbDraft[p.id];
  if(p.tipo === 'multipla') return Array.isArray(v) && v.length > 0;
  return v !== undefined && v !== null && v !== '';
}

function atualizarBotao(){
  const b = $('onb-next');
  if(b) b.disabled = !respostaValida();
}

function escolher(valor){
  const p = PERGUNTAS[onbIdx];
  if(p.tipo === 'multipla'){
    let atual = Array.isArray(onbDraft[p.id]) ? onbDraft[p.id].slice() : [];
    const ehNenhuma = p.nenhuma && valor === p.nenhuma;
    if(atual.indexOf(valor) !== -1){
      atual = atual.filter(x => x !== valor);
    }else{
      if(ehNenhuma) atual = [valor];
      else {
        atual = atual.filter(x => x !== p.nenhuma);
        if(p.max && atual.length >= p.max) atual.shift();
        atual.push(valor);
      }
    }
    onbDraft[p.id] = atual;
    document.querySelectorAll('#onb-body .onb-opt').forEach(el =>
      el.classList.toggle('sel', atual.indexOf(el.dataset.opt) !== -1));
    atualizarBotao();
    return;
  }
  // valores numericos voltam como numero
  const bruto = p.opcoes.find(o => String(o.v) === String(valor));
  onbDraft[p.id] = bruto ? bruto.v : valor;
  document.querySelectorAll('#onb-body .onb-opt').forEach(el => el.classList.toggle('sel', el.dataset.opt === String(valor)));
  atualizarBotao();
  setTimeout(avancar, 180);   // escolha unica segue sozinha
}

function avancar(){
  const p = PERGUNTAS[onbIdx];
  if(p && p.tipo === 'texto'){
    const v = $('onb-texto') ? $('onb-texto').value.trim() : '';
    if(!v) return;
    onbDraft[p.id] = v;
  }
  if(p && !respostaValida()) return;
  onbIdx++;
  desenharPergunta();
}

function voltar(){
  if(onbIdx === 0) return;
  onbIdx--;
  desenharPergunta();
}

function desenharResumo(){
  $('onb-bar').style.width = '100%';
  const d = onbDraft;
  const linha = (r, v) => '<div class="onb-linha"><span>' + r + '</span><span>' + esc(v) + '</span></div>';
  const dores = (d.dores || []).filter(x => x !== 'nenhuma');
  const prio = d.prioridade || [];

  $('onb-body').innerHTML =
    '<div class="onb-q">Tudo certo, ' + esc(d.nome) + '</div>' +
    '<div class="onb-hint">Confira suas respostas. Dá para mudar quando quiser, em Ajustes.</div>' +
    '<div class="onb-resumo">' +
      linha('Experiência', ROTULOS.experiencia[d.experiencia]) +
      linha('Frequência', d.dias + ' dias por semana') +
      linha('Tempo por sessão', d.tempo >= 90 ? '1h30 ou mais' : d.tempo + ' minutos') +
      linha('Onde treina', ROTULOS.local[d.local]) +
      linha('Objetivo', ROTULOS.objetivo[d.objetivo]) +
      linha('Limitações', dores.length ? dores.join(', ') : 'nenhuma') +
      (prio.length ? linha('Prioridade', prio.join(', ')) : '') +
    '</div>' +
    '<div class="aviso">Este app não substitui avaliação de um profissional de educação física ou de saúde. ' +
    'Se você tem dor, lesão ou condição clínica, procure orientação antes de treinar. ' +
    'As limitações que você marcou servem apenas para tirar exercícios da sua lista.</div>' +
    (onbEditando ? '' : '<div class="aviso">Seus dados de treino ficam só neste aparelho, sem conta nem nuvem. Em Ajustes dá para exportar um backup quando quiser.</div>');

  $('onb-foot').innerHTML = '<button class="onb-next" id="onb-next">' +
    (onbEditando ? 'Salvar alterações' : 'Começar a treinar') + '</button>';
  $('onb-next').onclick = concluirOnboarding;
  $('onb-step').textContent = (PERGUNTAS.length + 1) + '/' + (PERGUNTAS.length + 1);
}

async function concluirOnboarding(){
  profile = Object.assign({}, onbDraft, {
    criadoEm: (profile && profile.criadoEm) || new Date().toISOString(),
    atualizadoEm: new Date().toISOString()
  });
  if(!Array.isArray(profile.prioridade)) profile.prioridade = [];
  if(!Array.isArray(profile.dores)) profile.dores = [];
  await Store.set('profile', profile);
  await aplicarPrograma(gerarPrograma(profile));
  fecharOnboarding();
  renderHome();
  atualizarAjustes();
  mostrarProgramaNovo();
}

async function aplicarPrograma(novo){
  setPROGRAM(novo);
  setOverrides({});                       // montagens antigas não valem para o programa novo
  await Store.set('program', novo);
  await Store.set('overrides', overrides);
}

function mostrarProgramaNovo(){
  const vol = volumeSemanal(PROGRAM);
  const nomes = {peito:'Peito', costas:'Costas', ombro:'Ombros', biceps:'Bíceps', triceps:'Tríceps',
                 quadriceps:'Quadríceps', posterior:'Posterior', gluteos:'Glúteos', panturrilha:'Panturrilha', core:'Core'};
  const linhas = Object.keys(vol).filter(k => nomes[k] && vol[k] > 0)
    .sort((a,b) => vol[b] - vol[a])
    .map(k => '<div class="onb-linha"><span>' + nomes[k] + '</span><span>' + vol[k] + ' séries</span></div>').join('');

  $('sheet-body').innerHTML =
    '<h2 id="sheet-title">Seu programa está pronto</h2>' +
    '<p>Montei ' + PROGRAM.length + ' treinos a partir das suas respostas. ' +
    'Você pode trocar, reordenar e excluir exercícios durante o treino, e refazer o programa quando quiser em Ajustes.</p>' +
    '<div class="onb-resumo">' +
      PROGRAM.map(d => '<div class="onb-linha"><span>' + esc(d.name) + '</span><span>' + d.items.length + ' exercícios</span></div>').join('') +
    '</div>' +
    '<div class="sumsection">Séries por semana</div>' +
    '<div class="onb-resumo">' + linhas + '</div>' +
    '<div class="sheetact" style="margin-top:16px"><button class="btn-primary" id="prog-ok">Ver meus treinos</button></div>';
  openBackdrop($('sheet-backdrop'), null, true);
  $('prog-ok').onclick = () => fecharSheetAtual();
}

async function refazerPrograma(){
  if(!profile) return abrirOnboarding(false);
  const ok = await askConfirm({
    title:'Refazer seu programa?',
    text:'Vou montar os treinos de novo a partir das suas respostas atuais. Seu histórico não é afetado, mas as montagens que você salvou como padrão são descartadas.',
    confirmLabel:'Refazer'
  });
  if(!ok) return;
  await aplicarPrograma(gerarPrograma(profile));
  renderHome();
  mostrarProgramaNovo();
}

/* -------------------------------------------------------------------------
   IMC e TMB (estimativas por fórmula, não substituem avaliação profissional)
   ------------------------------------------------------------------------- */
function classificarIMC(imc){
  if(imc < 18.5) return 'abaixo do peso';
  if(imc < 25) return 'peso saudável';
  if(imc < 30) return 'sobrepeso';
  return 'obesidade';
}
function tmbMifflin(peso, alturaCm, idade, sexo){
  const base = 10 * peso + 6.25 * alturaCm - 5 * idade;
  if(sexo === 'masculino') return base + 5;
  if(sexo === 'feminino') return base - 161;
  return base + (5 - 161) / 2;
}
function calcularSaude(dados){
  const idade = parseFloat(dados.idade), alturaCm = parseFloat(dados.altura), peso = parseFloat(dados.peso);
  if(!(idade > 0) || !(alturaCm > 0) || !(peso > 0)) return null;
  const alturaM = alturaCm / 100;
  const pesoMin = 18.5 * alturaM * alturaM;
  const pesoMax = 24.9 * alturaM * alturaM;
  return {
    imc: peso / (alturaM * alturaM),
    imcLabel: classificarIMC(peso / (alturaM * alturaM)),
    pesoMin: pesoMin,
    pesoMax: pesoMax,
    tmb: tmbMifflin(peso, alturaCm, idade, dados.sexo),
    tmbSaudavel: tmbMifflin((pesoMin + pesoMax) / 2, alturaCm, idade, dados.sexo)
  };
}

/* -------------------------------------------------------------------------
   Dados corporais (opcional, fora do onboarding)
   ------------------------------------------------------------------------- */
function abrirDadosCorporais(){
  const c = corpo || {};
  const el = $('sheet-backdrop');
  $('sheet-body').innerHTML =
    '<div class="sheethead"><h2 id="sheet-title">Dados corporais</h2>' +
    '<button class="closebtn" data-fechar="1" aria-label="Fechar">✕</button></div>' +
    '<p>Tudo opcional. Nada disso muda o treino que você recebe, serve para acompanhar sua evolução com o tempo. ' +
    'Fica salvo só no seu aparelho.</p>' +
    '<div class="onb-opts">' +
      '<input class="onb-input" id="c-idade" type="number" inputmode="numeric" min="10" max="100" placeholder="Idade" value="' + esc(c.idade || '') + '">' +
      '<input class="onb-input" id="c-altura" type="number" inputmode="numeric" min="100" max="250" placeholder="Altura em cm" value="' + esc(c.altura || '') + '">' +
      '<input class="onb-input" id="c-peso" type="number" inputmode="decimal" step="0.1" min="30" max="300" placeholder="Peso em kg" value="' + esc(c.peso || '') + '">' +
      '<div class="onb-opts" style="gap:8px">' +
        ['feminino','masculino','prefiro não dizer'].map(g =>
          '<button class="onb-opt' + (c.sexo === g ? ' sel' : '') + '" data-sexo="' + g + '"><span>' + g.charAt(0).toUpperCase() + g.slice(1) + '</span><span class="tick" aria-hidden="true">✓</span></button>').join('') +
      '</div>' +
    '</div>' +
    '<div id="c-resultados"></div>' +
    '<div class="sheetact" style="margin-top:16px">' +
      '<button class="btn-ghost" data-fechar="1">Voltar</button>' +
      '<button class="btn-primary" id="c-salvar">Salvar</button>' +
    '</div>';
  openBackdrop(el, null, true);
  let sexo = c.sexo || '';
  const fmt1 = n => n.toFixed(1).replace('.', ',');
  const atualizarResultados = () => {
    const s = calcularSaude({idade: $('c-idade').value, altura: $('c-altura').value, peso: $('c-peso').value, sexo: sexo});
    const el2 = $('c-resultados');
    if(!s){ el2.innerHTML = ''; return; }
    const linha = (r, v) => '<div class="onb-linha"><span>' + r + '</span><span>' + v + '</span></div>';
    el2.innerHTML =
      '<div class="onb-resumo" style="margin-top:14px">' +
        linha('IMC', fmt1(s.imc) + ' · ' + s.imcLabel) +
        linha('Faixa de peso saudável', fmt1(s.pesoMin) + '–' + fmt1(s.pesoMax) + ' kg') +
        linha('TMB estimada', Math.round(s.tmb) + ' kcal/dia') +
        linha('TMB de referência', Math.round(s.tmbSaudavel) + ' kcal/dia') +
      '</div>' +
      '<div class="aviso">IMC e TMB são estimativas por fórmula (Mifflin-St Jeor), não substituem avaliação de um profissional de saúde. ' +
      '"Referência" é o que uma pessoa da mesma idade e altura, com peso no meio da faixa saudável, teria.</div>';
  };
  $('sheet-body').querySelectorAll('[data-sexo]').forEach(b => b.onclick = () => {
    sexo = b.dataset.sexo;
    $('sheet-body').querySelectorAll('[data-sexo]').forEach(x => x.classList.toggle('sel', x === b));
    atualizarResultados();
  });
  $('sheet-body').querySelectorAll('[data-fechar]').forEach(b => b.onclick = () => fecharSheetAtual());
  ['c-idade','c-altura','c-peso'].forEach(id => $(id).addEventListener('input', atualizarResultados));
  atualizarResultados();
  $('c-salvar').onclick = async () => {
    corpo = {
      idade: $('c-idade').value || '',
      altura: $('c-altura').value || '',
      peso: $('c-peso').value || '',
      sexo: sexo
    };
    await Store.set('corpo', corpo);
    fecharSheetAtual();
    atualizarAjustes();
    toast('Dados salvos');
  };
}

function atualizarAjustes(){
  if(profile){
    const dores = (profile.dores || []).filter(x => x !== 'nenhuma');
    $('perfil-resumo').textContent = [
      ROTULOS.objetivo[profile.objetivo],
      profile.dias + 'x por semana',
      ROTULOS.local[profile.local]
    ].join(' · ') + (dores.length ? ' · evitando ' + dores.join(', ') : '');
  }
  if(corpo && (corpo.peso || corpo.altura || corpo.idade)){
    const partes = [];
    if(corpo.idade) partes.push(corpo.idade + ' anos');
    if(corpo.altura) partes.push(corpo.altura + ' cm');
    if(corpo.peso) partes.push(corpo.peso + ' kg');
    $('corpo-resumo').textContent = partes.join(' · ');
  }
}

export {
  PERGUNTAS, ROTULOS, profile, setProfile, corpo, setCorpo, onbIdx,
  abrirOnboarding, escolher, avancar, voltar, abrirDadosCorporais,
  refazerPrograma, atualizarAjustes, calcularSaude
};
