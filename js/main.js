/* =========================================================================
   MEU TREINO
   Ponto de entrada do app: boot(), tela inicial, backup, diagnóstico de
   erros, ligação de todos os eventos e o objeto window.MT de depuração.
   O resto do app vive nos módulos que este arquivo importa: catalog.js
   (catálogo), generator.js (gerador), store.js (armazenamento), ui.js
   (folhas/toast), history.js (histórico), session.js (sessão de treino)
   e onboarding.js (perfil e dados corporais).
   ========================================================================= */

import { EX, META, EQUIP } from './catalog.js';
import { gerarPrograma, tempoEstimado, volumeSemanal, PARAMS, MODELOS, SPLITS, SPLITS_CORPO } from './generator.js';
import { Store, dbBroken, SCHEMA_VERSION, MIGRACOES, migrarDados, lerDadosBrutos, construirPayloadBackup, baixarJSON, lerArquivoBackup } from './store.js';
import { $, esc, mq, openBackdrop, askConfirm, toast, fecharSheetAtual, invalidarBackdropCloser, unitOf, fmtRest, fmtSet, summarizeSets } from './ui.js';
import {
  history, setHistory, saveHistory, renderHistory, editarDataTreino, deleteHistory,
  exerciciosComHistorico, serieTemporalDoExercicio, showHistoryTab, historyTab, calViewDate,
  openCalendar, renderCalendar
} from './history.js';
import {
  overrides, setOverrides, customEx, setCustomEx, favoritos, setFavoritos, session, setSession,
  editState, previewKey,
  saveSession, clearSession, programItems, shapeOf,
  lastPerformance, bestEver, regiaoDoExercicio, ultimasSessoesDoExercicio, sugerirCarga, formatarSugestao,
  openPreview, openEdit, cancelEdit, saveEdit, editMoveItem, editRemoveItem, editSwapExercise,
  editAddExercise, editAddSet, editDelSet, editRestStep,
  beginSession, startFreeSession, resumeSession, renderSession, updateStats, startDurationTimer,
  tickDuration, abrirEdicaoInicio, tickRest, requestWake,
  toggleRestExpand, addRest, skipRest, releaseWake,
  onInput, onKeydown, stepReps, toggleSet, addSet, delSet, moveItem, removeItem, undoRemove,
  swapExercise, addExercise, pickExercise,
  hasProgress, leaveSession, cancelWorkout, finishWorkout, pararTimers,
  compartilharResumo, getShareFile,
  abrirExecucao
} from './session.js';
import {
  PERGUNTAS, ROTULOS, profile, setProfile, corpo, setCorpo, onbIdx,
  abrirOnboarding, escolher, avancar, voltar, abrirDadosCorporais,
  refazerPrograma, atualizarAjustes, calcularSaude
} from './onboarding.js';

/* Número que recebe o feedback pelo WhatsApp (wa.me), só dígitos com DDI e DDD. */
const FEEDBACK_NUMERO = '5581986501624';

/* -------------------------------------------------------------------------
   2. PROGRAMA PADRÃO
   ------------------------------------------------------------------------- */
let PROGRAM = [
  {key:'upperA', tag:'DIA 1', name:'Upper A', block:'upper', meta:'Peito e costas · Força',
   warmup:'5 min de bike ou esteira leve. Mobilidade: rotação de ombro com bastão 2x10, mobilidade torácica em quatro apoios 2x8. Ativação: face pull leve 2x15.',
   items:[
     {ex:'supino_reto', sets:4, reps:'6-8', rpe:'7-8', rir:'2-3', rest:150},
     {ex:'remada_curvada', sets:4, reps:'6-8', rpe:'7-8', rir:'2-3', rest:150},
     {ex:'supino_incl_hal', sets:3, reps:'8-10', rpe:'8', rir:'2', rest:120},
     {ex:'puxada_pronada', sets:3, reps:'8-10', rpe:'8', rir:'2', rest:120},
     {ex:'desenv_militar', sets:3, reps:'8-10', rpe:'8', rir:'2', rest:90},
     {ex:'rosca_direta', sets:3, reps:'10', rpe:'8', rir:'2', rest:60},
     {ex:'fecho_pegada', sets:3, reps:'30-40s', rpe:'8', rir:'1-2', rest:60}
   ]},
  {key:'lowerA', tag:'DIA 2', name:'Lower A', block:'lower', meta:'Quadríceps · Agachamento',
   warmup:'5 min de bike. Mobilidade: 90/90 de quadril 2x30s por lado, mobilidade de tornozelo na parede 2x10 por lado. Ativação: agachamento peso corporal 2x10.',
   items:[
     {ex:'agachamento', sets:4, reps:'6-8', rpe:'7-8', rir:'2-3', rest:150},
     {ex:'leg_press', sets:3, reps:'10-12', rpe:'8', rir:'2', rest:120},
     {ex:'extensora', sets:3, reps:'12-15', rpe:'8-9', rir:'1-2', rest:60},
     {ex:'flexora', sets:3, reps:'10-12', rpe:'8', rir:'2', rest:60},
     {ex:'panturrilha_pe', sets:4, reps:'12-15', rpe:'8', rir:'2', rest:60},
     {ex:'prancha', sets:3, reps:'40-60s', rpe:'8', rir:'-', rest:45}
   ]},
  {key:'upperB', tag:'DIA 3', name:'Upper B', block:'upper', meta:'Ombro e braços · Volume',
   warmup:'5 min remo ergômetro ou elíptico. Mobilidade: rotação externa de ombro com elástico 2x15. Ativação: elevação lateral leve 2x15.',
   items:[
     {ex:'barra_fixa', sets:4, reps:'6-10', rpe:'7-8', rir:'2-3', rest:120},
     {ex:'desenv_halteres', sets:3, reps:'8-10', rpe:'8', rir:'2', rest:90},
     {ex:'elevacao_lateral', sets:4, reps:'12-15', rpe:'8-9', rir:'1-2', rest:60},
     {ex:'rosca_alternada', sets:3, reps:'10-12', rpe:'8', rir:'2', rest:60},
     {ex:'triceps_corda', sets:3, reps:'10-12', rpe:'8', rir:'2', rest:60},
     {ex:'rosca_martelo', sets:3, reps:'10-12', rpe:'8', rir:'2', rest:60},
     {ex:'farmer', sets:3, reps:'30-40m', rpe:'8', rir:'1-2', rest:60}
   ]},
  {key:'lowerB', tag:'DIA 4', name:'Lower B', block:'lower', meta:'Cadeia posterior · Terra e hip thrust',
   warmup:'5 min de bike. Mobilidade: mobilidade de quadril e cat-camel 2x10. Ativação: ponte de glúteo peso corporal 2x12.',
   items:[
     {ex:'terra_romeno', sets:4, reps:'6-8', rpe:'7-8', rir:'2-3', rest:150},
     {ex:'hip_thrust', sets:4, reps:'8-10', rpe:'8', rir:'2', rest:120},
     {ex:'bulgaro', sets:3, reps:'10/perna', rpe:'8', rir:'2', rest:90},
     {ex:'flexora', sets:3, reps:'10-12', rpe:'8', rir:'2', rest:60},
     {ex:'panturrilha_sent', sets:4, reps:'12-15', rpe:'8', rir:'2', rest:60},
     {ex:'prancha_lateral', sets:3, reps:'30-40s', rpe:'8', rir:'-', rest:45}
   ]},
  {key:'upperC', tag:'DIA 5', name:'Upper C', block:'upper', meta:'Peito e costas · Variação',
   warmup:'5 min esteira. Mobilidade torácica 2x8. Ativação: remada com elástico 2x15.',
   items:[
     {ex:'supino_incl_barra', sets:4, reps:'8-10', rpe:'7-8', rir:'2-3', rest:120},
     {ex:'remada_unilateral', sets:4, reps:'8-10', rpe:'8', rir:'2', rest:120},
     {ex:'crucifixo', sets:3, reps:'12-15', rpe:'8-9', rir:'1-2', rest:60},
     {ex:'pulldown_neutro', sets:3, reps:'10-12', rpe:'8', rir:'2', rest:60},
     {ex:'elevacao_lateral', sets:3, reps:'12-15', rpe:'8', rir:'2', rest:60},
     {ex:'rosca_scott', sets:3, reps:'10-12', rpe:'8', rir:'2', rest:60},
     {ex:'triceps_testa', sets:3, reps:'10-12', rpe:'8', rir:'2', rest:60}
   ]},
  {key:'lowerC', tag:'DIA 6', name:'Lower C', block:'lower', meta:'Quadríceps e posterior · Misto',
   warmup:'5 min de bike. Mobilidade de tornozelo e quadril. Ativação: agachamento peso corporal 2x10.',
   items:[
     {ex:'agach_frontal', sets:3, reps:'8-10', rpe:'7-8', rir:'2-3', rest:120},
     {ex:'stiff', sets:3, reps:'10-12', rpe:'8', rir:'2', rest:90},
     {ex:'leg_press_alto', sets:3, reps:'12-15', rpe:'8', rir:'2', rest:90},
     {ex:'extensora', sets:3, reps:'12-15', rpe:'8-9', rir:'1-2', rest:60},
     {ex:'panturrilha_pe', sets:3, reps:'15', rpe:'8', rir:'2', rest:60},
     {ex:'prancha', sets:3, reps:'40-60s', rpe:'8', rir:'-', rest:45}
   ]}
];
const byKey = k => PROGRAM.find(w => w.key === k);
function setPROGRAM(novo){ PROGRAM = Array.isArray(novo) ? novo : PROGRAM; }

/* -------------------------------------------------------------------------
   4. ESTADO
   ------------------------------------------------------------------------- */
let settings = {sound:true, wake:true};
let erros = [];
let deferredInstall = null;
let avatar = null;
function setAvatar(novo){ avatar = typeof novo === 'string' ? novo : null; }

function daysAgo(iso){
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if(d <= 0) return 'hoje';
  if(d === 1) return 'ontem';
  return 'há ' + d + ' dias';
}


/* -------------------------------------------------------------------------
   8. NAVEGAÇÃO
   ------------------------------------------------------------------------- */
const NAVS = {home:'nav-home', history:'nav-history', settings:'nav-settings'};
function showScreen(name){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $('screen-' + name).classList.add('active');
  Object.entries(NAVS).forEach(([k, id]) => {
    const el = $(id);
    if(k === name) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current');
  });
  $('resttimer').classList.toggle('show', name === 'session' && !!(session && session.rest));
  window.scrollTo(0, 0);
}
function updateTrainingBadge(){
  $('nav-home').classList.toggle('training', !!(session && session.startedAt));
}

/* -------------------------------------------------------------------------
   9. HOME
   ------------------------------------------------------------------------- */
function suggestedKey(){
  const last = history.find(h => byKey(h.key));
  if(!last) return PROGRAM[0].key;
  const idx = PROGRAM.findIndex(w => w.key === last.key);
  return PROGRAM[(idx + 1) % PROGRAM.length].key;
}
function renderHome(){
  const next = suggestedKey();
  $('daylist').innerHTML = PROGRAM.map(w => {
    const last = history.find(h => h.key === w.key);
    const n = programItems(w.key).length;
    return '<button class="daycard' + (w.key === next ? ' next' : '') + '" data-open="' + w.key + '">' +
      '<span class="left">' +
        '<span class="tag">' + w.tag + (overrides[w.key] ? ' · personalizado' : '') + '</span>' +
        '<span class="name">' + w.name + '</span>' +
        '<span class="meta">' + w.meta + ' · ' + n + ' exercícios</span>' +
        '<span class="last">' + (last ? 'última vez ' + daysAgo(last.date) : 'ainda não registrado') + '</span>' +
      '</span><span class="arrow" aria-hidden="true">›</span></button>';
  }).join('') +
  '<button class="daycard free" data-free="1">' +
    '<span class="left">' +
      '<span class="tag">EXTRA</span>' +
      '<span class="name">Treino livre</span>' +
      '<span class="meta">Monte na hora, escolhendo os exercícios</span>' +
    '</span><span class="arrow" aria-hidden="true">›</span></button>';

  const now = new Date();
  const weekStart = new Date(now); weekStart.setHours(0,0,0,0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  $('homestats').innerHTML =
    '<div class="homestat"><div class="v">' + history.filter(h => new Date(h.date) >= weekStart).length + '</div><div class="l">Esta semana</div></div>' +
    '<div class="homestat"><div class="v">' + history.filter(h => new Date(h.date) >= monthStart).length + '</div><div class="l">Este mês</div></div>' +
    '<div class="homestat"><div class="v">' + history.length + '</div><div class="l">Total</div></div>';

  atualizarCabecalhoHome();

  const hasActive = !!(session && session.startedAt);
  $('resume').classList.toggle('show', hasActive);
  if(hasActive){
    const mins = Math.floor((Date.now() - session.startedAt) / 60000);
    $('resume-title').textContent = session.name + ' em andamento';
    $('resume-sub').textContent = 'iniciado ' + (mins < 1 ? 'agora há pouco' : 'há ' + mins + ' min') + ', tudo o que você registrou está salvo';
  }
  updateTrainingBadge();
}

function atualizarCabecalhoHome(){
  const sub = $('home-sub'), nota = $('home-nota');
  if(!profile){
    sub.textContent = 'Upper Lower';
    nota.textContent = '';
    return;
  }
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  sub.textContent = saudacao + ', ' + profile.nome + ' · ' + (ROTULOS.objetivo[profile.objetivo] || '') +
    ' · ' + profile.dias + 'x por semana';

  const d = Number(profile.dias);
  if(d >= 6) nota.textContent = 'Com 6 dias você fecha o ciclo inteiro na semana. Se acordar quebrado, trocar um dia por descanso rende mais que insistir.';
  else if(d === 5) nota.textContent = 'Com 5 dias, pule o Upper C ou o Lower C. Priorize manter o Lower B, que é o dia de cadeia posterior.';
  else if(d === 4) nota.textContent = 'Com 4 dias, faça Upper A, Lower A, Upper B e Lower B. Os treinos C ficam como variação para quando sobrar tempo.';
  else nota.textContent = 'Com ' + d + ' dias, alterne entre os treinos na ordem em que aparecem, sem se preocupar em fechar a semana toda. O programa sob medida para essa frequência chega nos próximos passos.';
}

/* -------------------------------------------------------------------------
   18.1 FOTO DE PERFIL
   Fica só no aparelho, em base64 (JPEG 256x256). Nunca sai daqui a não ser
   dentro de um backup exportado pela própria pessoa.
   ------------------------------------------------------------------------- */
function renderAvatar(){
  const inicial = profile && profile.nome ? esc(profile.nome[0].toUpperCase()) : '';
  [$('home-avatar'), $('set-avatar-preview')].forEach(el => {
    if(!el) return;
    el.style.backgroundImage = avatar ? 'url(' + avatar + ')' : '';
    el.textContent = avatar ? '' : inicial;
  });
  $('btn-avatar-remover').style.display = avatar ? 'inline-flex' : 'none';
}

async function escolherAvatarArquivo(file){
  if(!file || !file.type || !file.type.startsWith('image/')){ toast('Escolha um arquivo de imagem'); return; }
  try{
    const bitmap = await createImageBitmap(file);
    const lado = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, (bitmap.width - lado) / 2, (bitmap.height - lado) / 2, lado, lado, 0, 0, 256, 256);
    setAvatar(canvas.toDataURL('image/jpeg', 0.8));
    await Store.set('avatar', avatar);
    renderAvatar();
    toast('Foto atualizada');
  }catch(e){
    toast('Não consegui usar essa imagem');
  }
}

async function removerAvatar(){
  setAvatar(null);
  await Store.del('avatar');
  renderAvatar();
  toast('Foto removida');
}

/* -------------------------------------------------------------------------
   19. BACKUP
   ------------------------------------------------------------------------- */
function exportBackup(){
  const payload = construirPayloadBackup({history, overrides, customEx, profile, corpo, program: PROGRAM, favoritos, avatar, settings});
  baixarJSON(payload, 'meu-treino-' + new Date().toISOString().slice(0, 10) + '.json');
  toast('Backup gerado');
}

async function importBackup(file){
  const lido = await lerArquivoBackup(file);
  if(!lido.ok){
    const msg = lido.motivo === 'invalido'
      ? {title:'Arquivo inválido', text:'Não consegui ler esse arquivo. Use um backup exportado pelo próprio app.', confirmLabel:'Entendi', hideCancel:true}
      : {title:'Arquivo inválido', text:'Esse JSON não tem um histórico de treinos dentro.', confirmLabel:'Entendi', hideCancel:true};
    return askConfirm(msg);
  }
  const data = lido.data;
  const ok = await askConfirm({
    title: 'Restaurar ' + data.history.length + ' treinos?',
    text: 'O histórico atual (' + history.length + ') será substituído pelo do arquivo.',
    confirmLabel: 'Restaurar', danger: true
  });
  if(!ok) return;
  setHistory(data.history);
  if(data.overrides){ setOverrides(data.overrides); await Store.set('overrides', overrides); }
  if(data.customEx){ setCustomEx(data.customEx); await Store.set('custom_ex', customEx); }
  if(data.profile){ setProfile(data.profile); await Store.set('profile', profile); atualizarAjustes(); }
  if(Array.isArray(data.program) && data.program.length){ PROGRAM = data.program; await Store.set('program', PROGRAM); }
  if(data.corpo){ setCorpo(data.corpo); await Store.set('corpo', corpo); atualizarAjustes(); }
  if(data.favoritos){ setFavoritos(data.favoritos); await Store.set('favoritos', favoritos); }
  if(typeof data.avatar === 'string'){ setAvatar(data.avatar); await Store.set('avatar', avatar); }
  if(data.settings && typeof data.settings === 'object'){
    settings = Object.assign(settings, data.settings);
    await Store.set('settings', settings);
    $('sw-sound').setAttribute('aria-checked', settings.sound ? 'true' : 'false');
    $('sw-wake').setAttribute('aria-checked', settings.wake ? 'true' : 'false');
    marcarDescanso();
  }
  await saveHistory();
  renderHistory(); renderHome(); renderAvatar();
  toast('Backup restaurado');
}

/* -------------------------------------------------------------------------
   19.1 PROTEÇÃO DE DADOS
   Sem backend, ninguém além da própria pessoa lembra de tirar backup. No
   máximo um aviso por abertura do app, pra não empilhar dois avisos juntos.
   ------------------------------------------------------------------------- */
function estaInstalado(){
  return mq('(display-mode: standalone)') || window.navigator.standalone === true;
}

async function avisarInstalacaoSeNecessario(){
  if(estaInstalado() || !history.length || settings.avisoInstalacaoMostrado) return false;
  settings.avisoInstalacaoMostrado = true;
  await Store.set('settings', settings);
  await askConfirm({
    title: 'Instale pra não perder o histórico',
    text: 'No iPhone, o Safari pode apagar os dados de sites não instalados depois de 7 dias sem uso. Instalar na tela de início evita isso, tanto no iPhone quanto no Android. No iPhone: toque em Compartilhar e depois em "Adicionar à Tela de Início". No Android: toque no menu do Chrome (⋮) e depois em "Adicionar à tela inicial" ou "Instalar app".',
    confirmLabel: 'Entendi', hideCancel: true
  });
  return true;
}

async function lembrarBackupSeNecessario(){
  if(!history.length) return;
  const lembrete = settings.backupLembrete || null;
  const treinosDesde = history.length - (lembrete ? lembrete.treinos : 0);
  if(treinosDesde < 10) return;
  settings.backupLembrete = {treinos: history.length};
  await Store.set('settings', settings);
  const ok = await askConfirm({
    title: 'Fazer backup do seu histórico?',
    text: 'Seus dados ficam só neste aparelho: não existe conta nem servidor guardando isso por você. Exportar de vez em quando evita perder tudo se você trocar de celular ou limpar o navegador.',
    confirmLabel: 'Exportar agora'
  });
  if(ok) exportBackup();
}

async function avisosDeProtecaoDeDados(){
  if(!profile || !history.length) return;
  const mostrouAvisoInstalacao = await avisarInstalacaoSeNecessario();
  if(mostrouAvisoInstalacao) return;
  await lembrarBackupSeNecessario();
}

async function wipeAll(){
  const ok = await askConfirm({title:'Apagar todo o histórico?', text:'Todos os treinos registrados serão removidos deste aparelho. Não tem como desfazer.', confirmLabel:'Apagar tudo', danger:true});
  if(!ok) return;
  setHistory([]);
  await saveHistory();
  await clearSession();
  renderHistory(); renderHome();
  toast('Histórico apagado');
}

async function resetProgram(){
  const ok = await askConfirm({title:'Restaurar programa original?', text:'As montagens salvas como padrão voltam ao Upper Lower original. O histórico não é afetado.', confirmLabel:'Restaurar'});
  if(!ok) return;
  setOverrides({});
  await Store.set('overrides', overrides);
  renderHome();
  toast('Programa restaurado');
}

/* -------------------------------------------------------------------------
   19b. DIAGNÓSTICO E ERROS
   Sem backend, um erro no aparelho de outra pessoa é invisível para quem
   mantém o app. Guarda só mensagem, tipo e origem do erro, nunca dado de
   treino, perfil ou medida corporal.
   ------------------------------------------------------------------------- */
function registrarErro(info){
  erros.unshift(Object.assign({quando: new Date().toISOString()}, info));
  erros = erros.slice(0, 20);
  Store.set('erros_recentes', erros);
}
window.addEventListener('error', e => {
  registrarErro({tipo: 'erro', mensagem: e.message || 'erro sem mensagem', origem: (e.filename || '') + (e.lineno ? ':' + e.lineno : '')});
});
window.addEventListener('unhandledrejection', e => {
  const motivo = e.reason;
  registrarErro({tipo: 'promessa', mensagem: (motivo && motivo.message) ? motivo.message : String(motivo), origem: ''});
});

function formatarBytes(n){
  if(!(n > 0)) return '0 KB';
  const mb = n / (1024 * 1024);
  return mb < 1 ? Math.round(n / 1024) + ' KB' : mb.toFixed(1).replace('.', ',') + ' MB';
}
async function obterUsoArmazenamento(){
  try{
    if(navigator.storage && navigator.storage.estimate){
      const est = await navigator.storage.estimate();
      return formatarBytes(est.usage || 0);
    }
  }catch(e){ /* ignora */ }
  return 'não disponível neste navegador';
}

/* Novidades da versão mais recente primeiro. Cada bump de VERSION que muda
   algo visível pra pessoa que usa o app ganha uma entrada nova aqui. */
const NOVIDADES = [
  {versao: 'meu-treino-v42', itens: [
    'Tempo de descanso configurável: mais curto ou mais longo em Ajustes, e o -15s/+15s durante o treino agora vale pras próximas séries daquele exercício'
  ]},
  {versao: 'meu-treino-v41', itens: [
    'Excluir um exercício agora fica separado de tirar uma série, e pergunta antes de apagar'
  ]},
  {versao: 'meu-treino-v40', itens: [
    'Priorizar um grupo muscular agora muda o treino de verdade: focar em braços rende uma divisão com dia dedicado',
    'Pegada, punho e trapézio finalmente aparecem nos treinos gerados',
    'Muito mais variedade de exercícios: o gerador deixou de repetir sempre os mesmos'
  ]},
  {versao: 'meu-treino-v39', itens: [
    'Aviso de instalação agora vale pra Android também, não só iPhone, com o passo a passo dos dois',
    'Lembrete de backup passa a aparecer a cada 10 treinos'
  ]},
  {versao: 'meu-treino-v38', itens: [
    'Volume da prévia não mostra mais "0 kg" antes de começar o treino, e exercícios sem histórico ganham uma dica de primeira vez'
  ]},
  {versao: 'meu-treino-v37', itens: [
    'Prescrição de série escrita por extenso ("4 séries de 6 a 8 repetições"), sem número solto que confundia com quantidade de séries'
  ]},
  {versao: 'meu-treino-v35', itens: [
    'Corrige o app pausando a música ou o podcast de outro app durante o descanso'
  ]},
  {versao: 'meu-treino-v34', itens: [
    'Botões de mais/menos repetição durante o treino ficaram maiores, mais fáceis de acertar'
  ]},
  {versao: 'meu-treino-v33', itens: [
    'Fotos de execução ampliadas pra costas, ombro, braços, pernas, posterior, panturrilha, core, pegada e cardio'
  ]},
  {versao: 'meu-treino-v31', itens: [
    'Fotos de execução nos exercícios de peito (piloto): toque na miniatura pra ver em tamanho maior'
  ]},
  {versao: 'meu-treino-v29', itens: [
    'Ajustes de acessibilidade: contraste de texto, áreas de toque maiores e navegação por teclado nas folhas'
  ]},
  {versao: 'meu-treino-v28', itens: [
    'Mais variedade nos exercícios sugeridos, principalmente no dia de perna'
  ]},
  {versao: 'meu-treino-v27', itens: [
    'Tela Sobre, com a versão do app e as novidades da atualização',
    'Lembrete pra fazer backup a cada 15 treinos ou 30 dias',
    'Aviso pra quem usa no iPhone sem instalar na tela de início'
  ]}
];

async function abrirSobre(){
  const el = $('sheet-backdrop');
  const versao = await obterVersaoApp();
  const recentes = NOVIDADES[0];
  $('sheet-body').innerHTML =
    '<div class="sheethead"><h2 id="sheet-title">Sobre o Meu Treino</h2>' +
    '<button class="closebtn" data-fechar="1" aria-label="Fechar">✕</button></div>' +
    '<div class="onb-resumo"><div class="onb-linha"><span>Versão</span><span>' + esc(versao) + '</span></div></div>' +
    (recentes ? '<div class="sumsection">Novidades desta versão</div><ul class="novidades">' +
      recentes.itens.map(i => '<li>' + esc(i) + '</li>').join('') + '</ul>' : '') +
    '<div class="aviso">Este app não substitui avaliação de um profissional de educação física ou de saúde. ' +
    'Se você tem dor, lesão ou condição clínica, procure orientação antes de treinar.</div>' +
    '<div class="sheetact" style="margin-top:16px">' +
      '<button class="btn-ghost" id="sobre-feedback">Enviar feedback</button>' +
      '<button class="btn-primary" data-fechar="1">Fechar</button>' +
    '</div>';
  openBackdrop(el, null, true);
  $('sheet-body').querySelectorAll('[data-fechar]').forEach(b => b.onclick = () => fecharSheetAtual());
  $('sobre-feedback').onclick = () => {
    const link = $('btn-feedback');
    if(link && link.href) window.open(link.href, '_blank');
  };
}

async function abrirDiagnostico(){
  const el = $('sheet-backdrop');
  const versao = await obterVersaoApp();
  const uso = await obterUsoArmazenamento();
  const standalone = mq('(display-mode: standalone)') || window.navigator.standalone === true;
  const fmtQuando = iso => new Date(iso).toLocaleString('pt-BR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'});
  const listaErros = erros.length
    ? erros.map(e => '<div class="onb-linha"><span>' + fmtQuando(e.quando) + ' · ' + esc(e.tipo) + '</span><span>' + esc(e.mensagem) + '</span></div>').join('')
    : '<div class="onb-linha"><span>Nenhum erro registrado</span><span>bom sinal</span></div>';

  $('sheet-body').innerHTML =
    '<div class="sheethead"><h2 id="sheet-title">Diagnóstico</h2>' +
    '<button class="closebtn" data-fechar="1" aria-label="Fechar">✕</button></div>' +
    '<p>Informações técnicas para ajudar a resolver um problema. Nada do seu treino, perfil ou medidas corporais aparece aqui.</p>' +
    '<div class="onb-resumo">' +
      '<div class="onb-linha"><span>Versão</span><span>' + esc(versao) + '</span></div>' +
      '<div class="onb-linha"><span>Modo</span><span>' + (standalone ? 'instalado' : 'navegador') + '</span></div>' +
      '<div class="onb-linha"><span>Armazenamento usado</span><span>' + esc(uso) + '</span></div>' +
    '</div>' +
    '<div class="sumsection">Erros recentes (' + erros.length + ')</div>' +
    '<div class="onb-resumo">' + listaErros + '</div>' +
    '<div class="sheetact" style="margin-top:16px"><button class="btn-ghost" data-fechar="1">Fechar</button></div>';
  openBackdrop(el, null, true);
  $('sheet-body').querySelectorAll('[data-fechar]').forEach(b => b.onclick = () => fecharSheetAtual());
}

/* -------------------------------------------------------------------------
   20. EVENTOS
   ------------------------------------------------------------------------- */
$('daylist').addEventListener('click', e => {
  const free = e.target.closest('[data-free]');
  const btn = e.target.closest('[data-open]');
  if(!free && !btn) return;
  if(session && session.startedAt){
    askConfirm({title:'Você tem um treino em andamento', text:'Finalize ou cancele o ' + session.name + ' antes de abrir outro.', confirmLabel:'Ir para o treino'})
      .then(go => { if(go) resumeSession(); });
    return;
  }
  if(free) return startFreeSession();
  openPreview(btn.dataset.open);
});

$('exlist').addEventListener('input', onInput);
$('exlist').addEventListener('keydown', onKeydown);
$('exlist').addEventListener('click', e => {
  if(Date.now() < suppressClickUntil) return;   // veio de um arrasto, não de um toque
  const t = e.target;
  const note = t.closest('[data-note]');
  if(note){ const n = $('note-' + note.dataset.note); if(n) n.classList.toggle('open'); return; }
  const thumb = t.closest('[data-thumb]');
  if(thumb) return abrirExecucao(thumb.dataset.thumb);

  if(editState){
    if(t.closest('[data-addex]')) return editAddExercise();
    const esw = t.closest('[data-swap]');
    if(esw) return editSwapExercise(esw.dataset.swap);
    const eadd = t.closest('[data-addset]');
    if(eadd) return editAddSet(eadd.dataset.addset);
    const edel = t.closest('[data-delset]');
    if(edel) return editDelSet(edel.dataset.delset);
    const emv = t.closest('[data-move]');
    if(emv){ const p = emv.dataset.move.split('|'); return editMoveItem(p[0], +p[1]); }
    const erm = t.closest('[data-remove]');
    if(erm) return editRemoveItem(erm.dataset.remove);
    const erest = t.closest('[data-restep]');
    if(erest){ const p = erest.dataset.restep.split('|'); return editRestStep(p[0], +p[1]); }
    return;
  }

  if(!session) return;
  if(t.closest('[data-addex]')) return addExercise();
  const chk = t.closest('[data-check]');
  if(chk){ const p = chk.dataset.check.split('|'); return toggleSet(p[0], +p[1]); }
  const step = t.closest('[data-step]');
  if(step){ const p = step.dataset.step.split('|'); return stepReps(p[0], +p[1], +p[2]); }
  const sw = t.closest('[data-swap]');
  if(sw) return swapExercise(sw.dataset.swap);
  const add = t.closest('[data-addset]');
  if(add) return addSet(add.dataset.addset);
  const del = t.closest('[data-delset]');
  if(del) return delSet(del.dataset.delset);
  const mv = t.closest('[data-move]');
  if(mv){ const p = mv.dataset.move.split('|'); return moveItem(p[0], +p[1]); }
  const rm = t.closest('[data-remove]');
  if(rm) return removeItem(rm.dataset.remove);
  const tg = t.closest('[data-toggle]');
  if(tg){
    const card = $('card-' + tg.dataset.toggle);
    const collapsed = card.classList.toggle('collapsed');
    tg.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  }
});

/* arrastar para a esquerda para excluir -------------------------------- */
let swipe = null, suppressClickUntil = 0;
$('exlist').addEventListener('touchstart', e => {
  const card = e.target.closest('.excard[data-uid]');
  if(!card || e.target.closest('input, a, .checkbtn, .stepper, .editstepper, .minibtn, .addex')) return;
  swipe = {card:card, x:e.touches[0].clientX, y:e.touches[0].clientY, dx:0, active:false};
}, {passive:true});
$('exlist').addEventListener('touchmove', e => {
  if(!swipe) return;
  const dx = e.touches[0].clientX - swipe.x;
  const dy = e.touches[0].clientY - swipe.y;
  if(!swipe.active){
    if(Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy) * 1.4) swipe.active = true;
    else if(Math.abs(dy) > 14){ swipe = null; return; }
  }
  if(swipe.active){
    swipe.dx = Math.min(0, dx);
    const inner = swipe.card.querySelector('.cardinner');
    if(inner) inner.style.transform = 'translateX(' + swipe.dx + 'px)';
    swipe.card.classList.toggle('willdelete', swipe.dx < -100);
    if(e.cancelable) e.preventDefault();
  }
}, {passive:false});
$('exlist').addEventListener('touchend', () => {
  if(!swipe) return;
  if(swipe.active) suppressClickUntil = Date.now() + 400;
  const inner = swipe.card.querySelector('.cardinner');
  if(swipe.active && swipe.dx < -100){
    const uid = swipe.card.dataset.uid;
    // devolve o card ao lugar antes de perguntar: excluir exercício agora
    // pede confirmação, e recusar não pode deixar o card preso deslocado
    if(inner) inner.style.transform = '';
    swipe.card.classList.remove('willdelete');
    if(editState) editRemoveItem(uid);
    else removeItem(uid);
  }else if(inner){
    inner.style.transform = '';
    swipe.card.classList.remove('willdelete');
  }
  swipe = null;
});

$('histlist').addEventListener('click', e => {
  const h = e.target.closest('[data-hist]');
  if(h){
    const d = $('hd-' + h.dataset.hist);
    const open = d.classList.toggle('open');
    h.setAttribute('aria-expanded', open ? 'true' : 'false');
    return;
  }
  const del = e.target.closest('[data-delhist]');
  if(del) deleteHistory(del.dataset.delhist);
  const ed = e.target.closest('[data-editdata]');
  if(ed) editarDataTreino(ed.dataset.editdata);
});

$('evolist').addEventListener('click', e => {
  const h = e.target.closest('[data-evo]');
  if(!h) return;
  const d = $('evo-' + h.dataset.evo);
  const open = d.classList.toggle('open');
  h.setAttribute('aria-expanded', open ? 'true' : 'false');
});

$('btn-begin').onclick = beginSession;
$('btn-cancel').onclick = cancelWorkout;
$('btn-finish').onclick = finishWorkout;
$('sess-timer-btn').onclick = abrirEdicaoInicio;
$('session-back').onclick = leaveSession;
$('btn-editprog').onclick = () => openEdit(previewKey);
$('btn-canceledit').onclick = cancelEdit;
$('btn-saveedit').onclick = saveEdit;
$('btn-sum-done').onclick = () => { showScreen('home'); renderHome(); };
$('btn-sum-share').onclick = compartilharResumo;
$('rest-sub').onclick = () => addRest(-15);
$('rest-add').onclick = () => addRest(15);
$('rest-skip').onclick = skipRest;
$('rest-tap').onclick = toggleRestExpand;
$('resume-go').onclick = resumeSession;
$('resume-drop').onclick = cancelWorkout;

$('nav-home').onclick = () => { renderHome(); showScreen('home'); };
$('nav-history').onclick = () => { renderHistory(); showHistoryTab(historyTab); showScreen('history'); };
$('tab-lista').onclick = () => showHistoryTab('lista');
$('tab-evolucao').onclick = () => showHistoryTab('evolucao');
$('nav-settings').onclick = () => { prepararFeedback(); showScreen('settings'); };
$('home-avatar').onclick = () => { prepararFeedback(); showScreen('settings'); };
$('btn-avatar-escolher').onclick = () => $('avatar-file').click();
$('avatar-file').onchange = e => { const f = e.target.files[0]; if(f) escolherAvatarArquivo(f); e.target.value = ''; };
$('btn-avatar-remover').onclick = removerAvatar;

$('btn-calendar').onclick = openCalendar;
$('cal-close').onclick = () => fecharSheetAtual();
$('cal-prev').onclick = () => { calViewDate.setMonth(calViewDate.getMonth() - 1); renderCalendar(); };
$('cal-next').onclick = () => { calViewDate.setMonth(calViewDate.getMonth() + 1); renderCalendar(); };

$('btn-export').onclick = exportBackup;
$('btn-import').onclick = () => $('file-import').click();
$('file-import').onchange = e => { const f = e.target.files[0]; if(f) importBackup(f); e.target.value = ''; };
$('btn-wipe').onclick = wipeAll;
$('btn-resetprog').onclick = refazerPrograma;
$('btn-sobre').onclick = abrirSobre;
$('btn-diagnostico').onclick = abrirDiagnostico;

function bindSwitch(id, key, onChange){
  const el = $(id);
  el.onclick = () => {
    settings[key] = !settings[key];
    el.setAttribute('aria-checked', settings[key] ? 'true' : 'false');
    Store.set('settings', settings);
    if(onChange) onChange(settings[key]);
  };
}
bindSwitch('sw-sound', 'sound', on => { if(on){ unlockAudio(); beep(); vibrate(); } });
bindSwitch('sw-wake', 'wake', on => { if(on) requestWake(); else releaseWake(); });

/* preferência global de descanso: encurta ou alonga o prescrito, e o ajuste
   por exercício feito durante o treino continua valendo mais que ela */
function marcarDescanso(){
  document.querySelectorAll('[data-descanso]').forEach(b =>
    b.setAttribute('aria-checked', b.dataset.descanso === (settings.descansoEscala || 'normal') ? 'true' : 'false'));
}
document.querySelectorAll('[data-descanso]').forEach(b => {
  b.onclick = () => {
    settings.descansoEscala = b.dataset.descanso;
    marcarDescanso();
    Store.set('settings', settings);
    if(session) renderSession();
  };
});

/* volta do segundo plano: recalcula tudo pelo relógio */
function resync(){
  if(document.visibilityState && document.visibilityState !== 'visible') return;
  if(!session) return;
  tickDuration();
  if(session.rest) tickRest();
  if(session.startedAt) requestWake();
}
document.addEventListener('visibilitychange', resync);
window.addEventListener('pageshow', resync);
window.addEventListener('focus', resync);

window.addEventListener('beforeunload', e => {
  if(session && session.startedAt && hasProgress()){
    saveSession(true);
    e.preventDefault();
    e.returnValue = '';
  }
});

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstall = e;
  $('btn-install').style.display = 'flex';
});
$('btn-install').onclick = async () => {
  if(!deferredInstall) return;
  deferredInstall.prompt();
  await deferredInstall.userChoice;
  deferredInstall = null;
  $('btn-install').style.display = 'none';
};

/* -------------------------------------------------------------------------
   21. BOOT
   ------------------------------------------------------------------------- */
async function boot(){
  const migracao = await migrarDados();

  const [h, s, active, ov, cx, pf, cp, pg, fv, er, av] = await Promise.all([
    Store.get('history'), Store.get('settings'), Store.get('active_session'),
    Store.get('overrides'), Store.get('custom_ex'), Store.get('profile'), Store.get('corpo'),
    Store.get('program'), Store.get('favoritos'), Store.get('erros_recentes'), Store.get('avatar')
  ]);
  if(Array.isArray(pg) && pg.length) PROGRAM = pg;
  setProfile((pf && typeof pf === 'object') ? pf : null);
  setCorpo((cp && typeof cp === 'object') ? cp : null);
  setHistory(h);
  if(s && typeof s === 'object') settings = Object.assign(settings, s);
  if(ov && typeof ov === 'object') setOverrides(ov);
  if(cx && typeof cx === 'object') setCustomEx(cx);
  if(fv && typeof fv === 'object') setFavoritos(fv);
  if(Array.isArray(er)) erros = er;
  setAvatar(av);
  $('sw-sound').setAttribute('aria-checked', settings.sound ? 'true' : 'false');
  $('sw-wake').setAttribute('aria-checked', settings.wake ? 'true' : 'false');
  marcarDescanso();

  // sessões no formato antigo (sem items) são descartadas
  if(active && active.startedAt && Array.isArray(active.items) && (Date.now() - active.startedAt) < 12 * 3600 * 1000){
    setSession(active);
  }else if(active){
    await Store.del('active_session');
  }

  renderHome();
  renderHistory();
  renderAvatar();
  updateStorageLabel();
  atualizarAjustes();
  prepararFeedback();
  if(!profile) abrirOnboarding(false);
  else avisosDeProtecaoDeDados();
  if(!migracao.ok){
    toast('Não consegui atualizar o formato dos seus dados, mas nada foi apagado. Existe uma cópia de segurança salva no aparelho. Avise pelo botão de feedback em Ajustes.');
  }

  if('serviceWorker' in navigator){
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  if(navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
}

async function obterVersaoApp(){
  try{
    const chaves = await caches.keys();
    return chaves.find(k => k.indexOf('meu-treino-') === 0) || 'desconhecida';
  }catch(e){
    return 'desconhecida';
  }
}
async function prepararFeedback(){
  const el = $('btn-feedback');
  if(!el) return;
  const versao = await obterVersaoApp();
  const uso = await obterUsoArmazenamento();
  const standalone = mq('(display-mode: standalone)') || window.navigator.standalone === true;
  const resumoErros = erros.length
    ? erros.slice(0, 5).map(e => '- ' + e.quando.slice(0, 16).replace('T', ' ') + ' ' + e.tipo + ': ' + e.mensagem).join('\n')
    : 'nenhum erro recente';
  const msg = 'Feedback do Meu Treino\n' +
    'Versão: ' + versao + '\n' +
    'Modo: ' + (standalone ? 'instalado' : 'navegador') + '\n' +
    'Armazenamento usado: ' + uso + '\n' +
    'Aparelho: ' + navigator.userAgent + '\n' +
    'Erros recentes (' + erros.length + '):\n' + resumoErros + '\n\n' +
    'Descreva aqui o que encontrou:';
  el.href = 'https://wa.me/' + FEEDBACK_NUMERO + '?text=' + encodeURIComponent(msg);
}

function updateStorageLabel(){
  const standalone = mq('(display-mode: standalone)') || window.navigator.standalone === true;
  let label = dbBroken ? 'salvando no armazenamento local do navegador' : 'salvando em banco local no aparelho';
  if(!standalone) label += ' · instale na tela de início para não perder dados';
  $('storage-label').textContent = label;
}

/* -------------------------------------------------------------------------
   Eventos do onboarding (fluxo em si mora em js/onboarding.js)
   ------------------------------------------------------------------------- */
$('onb-back').onclick = voltar;
$('onb-body').addEventListener('click', e => {
  const b = e.target.closest('[data-opt]');
  if(b) escolher(b.dataset.opt);
});
$('onb-foot').addEventListener('click', e => {
  if(onbIdx >= PERGUNTAS.length) return;          // tela de resumo tem o proprio handler
  const n = e.target.closest('#onb-next');
  if(n && !n.disabled) return avancar();
  if(e.target.closest('#onb-skip')) return avancar();
});
$('onb-body').addEventListener('keydown', e => {
  if(e.key === 'Enter' && PERGUNTAS[onbIdx] && PERGUNTAS[onbIdx].tipo === 'texto'){ e.preventDefault(); avancar(); }
});
$('btn-perfil').onclick = () => abrirOnboarding(true);
$('btn-corpo').onclick = abrirDadosCorporais;

/* atalho para inspecionar o estado pelo console do navegador durante um treino */
window.MT = {
  get session(){ return session; },
  get history(){ return history; },
  get settings(){ return settings; },
  get overrides(){ return overrides; },
  get profile(){ return profile; },
  get program(){ return PROGRAM; },
  get favoritos(){ return favoritos; },
  get avatar(){ return avatar; },
  EX: EX, META: META, EQUIP: EQUIP, PARAMS: PARAMS, MODELOS: MODELOS, SPLITS: SPLITS,
  gerar: gerarPrograma, volume: volumeSemanal, tempo: tempoEstimado, sugerir: sugerirCarga,
  exerciciosComHistorico: exerciciosComHistorico, serieTemporal: serieTemporalDoExercicio,
  saude: calcularSaude,
  get schemaVersion(){ return SCHEMA_VERSION; },
  MIGRACOES: MIGRACOES, migrarDados: migrarDados, lerDadosBrutos: lerDadosBrutos,
  get erros(){ return erros; },
  registrarErro: registrarErro, formatarBytes: formatarBytes, obterUsoArmazenamento: obterUsoArmazenamento,
  Store: Store,
  exportBackup: exportBackup, importBackup: importBackup,
  escolherAvatar: escolherAvatarArquivo, removerAvatar: removerAvatar,
  get _shareFile(){ return getShareFile(); },
  _pararTimers: pararTimers
};

boot();

/* export só pra fechar a dependência circular com history.js, que chama
   renderHome() depois de apagar ou editar a data de um treino */
export { renderHome, byKey, PROGRAM, setPROGRAM, showScreen, updateTrainingBadge, settings, avatar };
