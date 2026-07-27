/* =========================================================================
   MEU TREINO v2
   Sessão editável (ordem, troca, inclusão e exclusão de exercícios),
   descanso agendado no relógio de áudio, treino livre e recordes.
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
  tickDuration, tickRest, requestWake,
  toggleRestExpand, addRest, skipRest, releaseWake,
  onInput, onKeydown, stepReps, toggleSet, addSet, delSet, moveItem, removeItem, undoRemove,
  swapExercise, addExercise, pickExercise,
  hasProgress, leaveSession, cancelWorkout, finishWorkout, pararTimers
} from './session.js';

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

/* -------------------------------------------------------------------------
   ARMAZENAMENTO em js/store.js: Store (IndexedDB com localStorage de
   reserva), versionamento (SCHEMA_VERSION, MIGRACOES, migrarDados) e o
   formato de payload do backup (construirPayloadBackup, lerArquivoBackup).
   ------------------------------------------------------------------------- */


/* -------------------------------------------------------------------------
   4. ESTADO
   ------------------------------------------------------------------------- */
let settings = {sound:true, wake:true};
let erros = [];
let deferredInstall = null;




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
   histórico, evolução e calendário agora em js/history.js
   ------------------------------------------------------------------------- */


/* -------------------------------------------------------------------------
   openBackdrop, askConfirm e toast agora em js/ui.js
   ------------------------------------------------------------------------- */


/* -------------------------------------------------------------------------
   19. BACKUP
   ------------------------------------------------------------------------- */
function exportBackup(){
  const payload = construirPayloadBackup({history, overrides, customEx, profile, corpo, program: PROGRAM, favoritos});
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
  if(data.profile){ profile = data.profile; await Store.set('profile', profile); atualizarAjustes(); }
  if(Array.isArray(data.program) && data.program.length){ PROGRAM = data.program; await Store.set('program', PROGRAM); }
  if(data.corpo){ corpo = data.corpo; await Store.set('corpo', corpo); atualizarAjustes(); }
  if(data.favoritos){ setFavoritos(data.favoritos); await Store.set('favoritos', favoritos); }
  await saveHistory();
  renderHistory(); renderHome();
  toast('Backup restaurado');
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
    if(editState) editRemoveItem(swipe.card.dataset.uid);
    else removeItem(swipe.card.dataset.uid);
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
$('session-back').onclick = leaveSession;
$('btn-editprog').onclick = () => openEdit(previewKey);
$('btn-canceledit').onclick = cancelEdit;
$('btn-saveedit').onclick = saveEdit;
$('btn-sum-done').onclick = () => { showScreen('home'); renderHome(); };
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

$('btn-calendar').onclick = openCalendar;
$('cal-close').onclick = () => fecharSheetAtual();
$('cal-prev').onclick = () => { calViewDate.setMonth(calViewDate.getMonth() - 1); renderCalendar(); };
$('cal-next').onclick = () => { calViewDate.setMonth(calViewDate.getMonth() + 1); renderCalendar(); };

$('btn-export').onclick = exportBackup;
$('btn-import').onclick = () => $('file-import').click();
$('file-import').onchange = e => { const f = e.target.files[0]; if(f) importBackup(f); e.target.value = ''; };
$('btn-wipe').onclick = wipeAll;
$('btn-resetprog').onclick = refazerPrograma;
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

  const [h, s, active, ov, cx, pf, cp, pg, fv, er] = await Promise.all([
    Store.get('history'), Store.get('settings'), Store.get('active_session'),
    Store.get('overrides'), Store.get('custom_ex'), Store.get('profile'), Store.get('corpo'),
    Store.get('program'), Store.get('favoritos'), Store.get('erros_recentes')
  ]);
  if(Array.isArray(pg) && pg.length) PROGRAM = pg;
  profile = (pf && typeof pf === 'object') ? pf : null;
  corpo = (cp && typeof cp === 'object') ? cp : null;
  setHistory(h);
  if(s && typeof s === 'object') settings = Object.assign(settings, s);
  if(ov && typeof ov === 'object') setOverrides(ov);
  if(cx && typeof cx === 'object') setCustomEx(cx);
  if(fv && typeof fv === 'object') setFavoritos(fv);
  if(Array.isArray(er)) erros = er;
  $('sw-sound').setAttribute('aria-checked', settings.sound ? 'true' : 'false');
  $('sw-wake').setAttribute('aria-checked', settings.wake ? 'true' : 'false');

  // sessões no formato antigo (sem items) são descartadas
  if(active && active.startedAt && Array.isArray(active.items) && (Date.now() - active.startedAt) < 12 * 3600 * 1000){
    setSession(active);
  }else if(active){
    await Store.del('active_session');
  }

  renderHome();
  renderHistory();
  updateStorageLabel();
  atualizarAjustes();
  prepararFeedback();
  if(!profile) abrirOnboarding(false);
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

/* =========================================================================
   GERADOR DE PROGRAMA em js/generator.js: gerarPrograma, tempoEstimado,
   volumeSemanal e as tabelas de PARAMS/MODELOS/SPLITS. Função pura, não
   toca em tela nem em armazenamento, o que permite testar sem navegador.
   ========================================================================= */



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
    'As limitações que você marcou servem apenas para tirar exercícios da sua lista.</div>';

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
  PROGRAM = novo;
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

/* -------------------------------------------------------------------------
   Eventos
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
  EX: EX, META: META, EQUIP: EQUIP, PARAMS: PARAMS, SPLITS: SPLITS,
  gerar: gerarPrograma, volume: volumeSemanal, tempo: tempoEstimado, sugerir: sugerirCarga,
  exerciciosComHistorico: exerciciosComHistorico, serieTemporal: serieTemporalDoExercicio,
  saude: calcularSaude,
  get schemaVersion(){ return SCHEMA_VERSION; },
  MIGRACOES: MIGRACOES, migrarDados: migrarDados, lerDadosBrutos: lerDadosBrutos,
  get erros(){ return erros; },
  registrarErro: registrarErro, formatarBytes: formatarBytes, obterUsoArmazenamento: obterUsoArmazenamento,
  Store: Store,
  exportBackup: exportBackup, importBackup: importBackup,
  _pararTimers: pararTimers
};

boot();

/* export só pra fechar a dependência circular com history.js, que chama
   renderHome() depois de apagar ou editar a data de um treino */
export { renderHome, byKey, PROGRAM, showScreen, updateTrainingBadge, settings };
