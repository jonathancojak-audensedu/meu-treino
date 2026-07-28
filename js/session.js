/* =========================================================================
   SESSÃO: prescrição, progressão, prévia, edição de programa, sessão
   ativa, descanso, edição da sessão, seletor de exercício, finalizar
   ========================================================================= */
import { EX, META } from './catalog.js';
import { tempoEstimado } from './generator.js';
import { Store } from './store.js';
import {
  $, esc, mq, openBackdrop, askConfirm, toast, fecharSheetAtual, invalidarBackdropCloser,
  unitOf, fmtRest, fmtSet, summarizeSets
} from './ui.js';
import { history, saveHistory, renderHistory, exerciciosComHistorico, editarDataTreino } from './history.js';
import { byKey, PROGRAM, showScreen, updateTrainingBadge, settings, renderHome, avatar } from './main.js';
import { profile } from './onboarding.js';

let overrides = {};
let customEx = {};
let favoritos = {};

let session = null;
let previewKey = null;
let editState = null;
let durationInt = null, restInt = null;
let restExpanded = false;
let wakeLock = null, audioCtx = null, silentAudio = null;
let scheduledBeeps = [];

let uidSeq = 1;
let lastRemoved = null;

const defOf = id => EX[id] || customEx[id] || {name:'Exercício', type:'reps', group:''};

/* -------------------------------------------------------------------------
   5. PERSISTÊNCIA DA SESSÃO
   ------------------------------------------------------------------------- */
let saveTimer = null;
function saveSession(immediate){
  if(!session) return;
  clearTimeout(saveTimer);
  const run = () => Store.set('active_session', session);
  if(immediate) return run();
  saveTimer = setTimeout(run, 300);
}
async function clearSession(){
  session = null;
  restExpanded = false;
  clearTimeout(saveTimer);
  await Store.del('active_session');
  updateTrainingBadge();
}

/* -------------------------------------------------------------------------
   6. PRESCRIÇÃO
   ------------------------------------------------------------------------- */
function programItems(key){
  const base = overrides[key] || (byKey(key) ? byKey(key).items : []);
  return base.map(it => Object.assign({}, it));
}
function shapeOf(i){
  const base = {ex:i.ex, sets:i.sets, reps:i.reps, rpe:i.rpe, rir:i.rir, rest:i.rest};
  if(i.duracaoSeg != null) base.duracaoSeg = i.duracaoSeg;
  return base;
}
function newUid(){ return 'e' + (uidSeq++) + Math.random().toString(36).slice(2, 6); }
function videoUrl(name){
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(name + ' execução correta técnica');
}

/* -------------------------------------------------------------------------
   FOTOS DE EXECUÇÃO
   Piloto cobrindo só peito (ver README.md pra fonte e licença das fotos).
   def.img:true indica que existem duas fotos em img/exercicios/{id}-0 e -1,
   cada uma em .webp com .jpg de reserva. Miniatura clicável ao lado do nome
   abre as duas fotos maiores, alternando pra simular o movimento.
   ------------------------------------------------------------------------- */
function fotoExecucao(id, i){ return './img/exercicios/' + id + '-' + i; }

function thumbHTML(id, def){
  if(!def.img) return '';
  return '<button class="exthumb" data-thumb="' + id + '" aria-label="Ver execução de ' + esc(def.name) + '">' +
    '<picture><source srcset="' + fotoExecucao(id, 0) + '.webp" type="image/webp">' +
    '<img src="' + fotoExecucao(id, 0) + '.jpg" alt="" loading="lazy" width="400" height="267"></picture>' +
    '</button>';
}

let execucaoInterval = null;
function pararAnimacaoExecucao(){
  if(execucaoInterval){ clearInterval(execucaoInterval); execucaoInterval = null; }
}

function abrirExecucao(id){
  const def = defOf(id);
  if(!def.img) return;
  const el = $('exec-backdrop');
  const reduzMovimento = mq('(prefers-reduced-motion: reduce)');
  const frame = i => '<picture><source srcset="' + fotoExecucao(id, i) + '.webp" type="image/webp">' +
    '<img src="' + fotoExecucao(id, i) + '.jpg" alt="Execução de ' + esc(def.name) + ', quadro ' + (i + 1) + '" width="400" height="267"></picture>';

  $('exec-body').innerHTML =
    '<div class="sheethead"><h2 id="exec-title">' + esc(def.name) + '</h2>' +
    '<button class="closebtn" data-fechar="1" aria-label="Fechar">✕</button></div>' +
    (reduzMovimento
      ? '<div class="execframes lado-a-lado">' + frame(0) + frame(1) + '</div>'
      : '<div class="execframes" id="exec-frames">' + frame(0) + frame(1) + '</div>' +
        '<div class="execact"><button class="btn-ghost" id="exec-pausar" aria-pressed="false">Pausar</button></div>') +
    '<div class="sheetact" style="margin-top:16px">' +
      '<button class="btn-ghost" id="exec-youtube">Ver no YouTube</button>' +
      '<button class="btn-primary" data-fechar="1">Fechar</button>' +
    '</div>';

  openBackdrop(el, pararAnimacaoExecucao, true);
  $('exec-body').querySelectorAll('[data-fechar]').forEach(b => b.onclick = () => { pararAnimacaoExecucao(); fecharSheetAtual(); });
  $('exec-youtube').onclick = () => window.open(videoUrl(def.name), '_blank');

  if(!reduzMovimento){
    const frames = $('exec-frames');
    let mostrandoB = false;
    const alternar = () => { mostrandoB = !mostrandoB; frames.classList.toggle('frame-b', mostrandoB); };
    execucaoInterval = setInterval(alternar, 900);
    let pausado = false;
    $('exec-pausar').onclick = () => {
      pausado = !pausado;
      pararAnimacaoExecucao();
      if(!pausado) execucaoInterval = setInterval(alternar, 900);
      $('exec-pausar').setAttribute('aria-pressed', pausado ? 'true' : 'false');
      $('exec-pausar').textContent = pausado ? 'Retomar' : 'Pausar';
    };
  }
}

function repTarget(reps){
  const m = String(reps).match(/\d+/);
  return m ? parseInt(m[0], 10) : 10;
}
function sameDay(a, b){
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/* -------------------------------------------------------------------------
   7. PROGRESSÃO
   ------------------------------------------------------------------------- */
function lastPerformance(exId){
  for(const h of history){
    const found = (h.exercises || []).find(e => e.exId === exId);
    if(found && found.sets && found.sets.length) return {date:h.date, sets:found.sets};
  }
  return null;
}
function bestEver(exId){
  let best = null;
  for(const h of history){
    const found = (h.exercises || []).find(e => e.exId === exId);
    if(!found) continue;
    for(const s of found.sets){
      const w = parseFloat(s.w) || 0, r = parseFloat(s.r) || 0;
      if(!best || w > best.w || (w === best.w && r > best.r)) best = {w, r};
    }
  }
  return best;
}

/* dupla progressão: sobe a carga quando fecha o topo da faixa, desce quando
   fica abaixo do piso em duas sessões seguidas, senão mantém e busca mais reps */
const REGIAO_POR_PADRAO = {
  emp_h:'superior', emp_v:'superior', pux_h:'superior', pux_v:'superior',
  lateral:'superior', biceps:'superior', triceps:'superior',
  joelho:'inferior', quadril:'inferior', panturrilha:'inferior'
};
function regiaoDoExercicio(exId){
  const meta = META[exId];
  return (meta && REGIAO_POR_PADRAO[meta.p]) || 'superior';
}
function ultimasSessoesDoExercicio(exId){
  const out = [];
  for(const h of history){
    const found = (h.exercises || []).find(e => e.exId === exId);
    if(found && found.sets && found.sets.length) out.push({date: h.date, sets: found.sets});
    if(out.length >= 2) break;
  }
  return out;
}
function parseFaixaReps(reps){
  const nums = String(reps).match(/\d+/g);
  if(!nums) return null;
  const piso = parseInt(nums[0], 10);
  const topo = nums[1] ? parseInt(nums[1], 10) : piso;
  return {piso, topo};
}
function arredondar2_5(n){ return Math.round(n / 2.5) * 2.5; }
function sugerirCarga(historicoDoExercicio, prescricao){
  if(!prescricao || prescricao.type !== 'reps') return null;
  if(!historicoDoExercicio || !historicoDoExercicio.length) return null;
  const faixa = parseFaixaReps(prescricao.reps);
  if(!faixa) return null;

  const ultima = historicoDoExercicio[0];
  if(!ultima.sets || !ultima.sets.length) return null;
  const pesos = ultima.sets.map(s => parseFloat(s.w));
  const repsFeitos = ultima.sets.map(s => parseFloat(s.r));
  if(pesos.some(isNaN) || repsFeitos.some(isNaN)) return null;

  const pesoAnterior = pesos[pesos.length - 1];
  const repMinima = Math.min(...repsFeitos);

  if(repsFeitos.every(r => r >= faixa.topo)){
    const regiaoKg = prescricao.regiao === 'inferior' ? 5 : 2.5;
    const incremento = Math.max(regiaoKg, pesoAnterior * 0.05);
    return {tipo:'subir', pesoAnterior:pesoAnterior, cargaSugerida:arredondar2_5(pesoAnterior + incremento), repsFeitas:repMinima};
  }

  const todasAbaixoDoPiso = sessao => sessao.sets.every(s => (parseFloat(s.r) || 0) < faixa.piso);
  if(historicoDoExercicio.length >= 2 && todasAbaixoDoPiso(historicoDoExercicio[0]) && todasAbaixoDoPiso(historicoDoExercicio[1])){
    return {tipo:'descer', pesoAnterior:pesoAnterior, cargaSugerida:arredondar2_5(pesoAnterior * 0.925), repsFeitas:repMinima};
  }

  return {tipo:'manter', pesoAnterior:pesoAnterior, cargaSugerida:pesoAnterior, repsFeitas:repMinima};
}
function formatarSugestao(sug){
  const fmt = n => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ','));
  if(sug.tipo === 'subir') return 'sugestão: ' + fmt(sug.cargaSugerida) + ' kg, você fechou ' + sug.repsFeitas + ' em todas as séries da última vez';
  if(sug.tipo === 'descer') return 'sugestão: reduzir para ' + fmt(sug.cargaSugerida) + ' kg, faixa não foi atingida em duas sessões seguidas';
  return 'sugestão: manter ' + fmt(sug.cargaSugerida) + ' kg e buscar mais repetições';
}

/* -------------------------------------------------------------------------
   10. PRÉVIA
   ------------------------------------------------------------------------- */
function openPreview(key){
  previewKey = key;
  editState = null;
  const w = byKey(key);
  const items = programItems(key);
  $('sess-name').textContent = w.name;
  $('sess-sub').textContent = w.tag + ' · ' + w.meta;
  $('sess-warmup').style.display = 'block';
  $('sess-warmup').innerHTML = '<b>Aquecimento e ativação</b>' + esc(w.warmup);
  $('sess-timer').textContent = '--:--';
  $('sess-volume').textContent = '0 kg';
  $('sess-sets').textContent = items.reduce((a, e) => a + e.sets, 0) + ' previstas';

  $('exlist').innerHTML = items.map((it, i) => {
    const def = defOf(it.ex);
    const last = lastPerformance(it.ex);
    const sug = sugerirCarga(ultimasSessoesDoExercicio(it.ex), {reps: it.reps, type: def.type, regiao: regiaoDoExercicio(it.ex)});
    return '<div class="excard">' +
      '<div class="cardinner">' +
      '<div class="exhead" style="cursor:default">' +
        '<span class="exmain"><span class="idx">Exercício ' + (i+1) + '</span>' +
        '<span class="exname">' + esc(def.name) + '</span>' +
        '<span class="target">' + it.sets + ' séries · ' + esc(it.reps) + ' · RPE ' + it.rpe + ' · descanso ' + fmtRest(it.rest) + '</span>' +
        (last ? '<span class="exsummary">última vez: ' + summarizeSets(last.sets, def.type) + '</span>' : '') +
        (sug ? '<span class="suggestion">' + esc(formatarSugestao(sug)) + '</span>' : '') +
        '</span>' +
      '</div>' +
      '<div class="exfoot">' +
        '<a class="minibtn link" href="' + videoUrl(def.name) + '" target="_blank" rel="noopener">ver execução</a>' +
        (def.note ? '<button class="minibtn" data-note="p' + i + '">observações</button>' : '') +
      '</div>' +
      (def.note ? '<div class="noteblock" id="note-p' + i + '">' + esc(def.note) + '</div>' : '') +
      '</div></div>';
  }).join('') +
  '<div class="previewnote">Depois de iniciar você pode trocar, reordenar, incluir e excluir exercícios.</div>';

  const minEstimados = Math.round(tempoEstimado(items) / 60);
  $('startbar-info').textContent = items.length + (items.length === 1 ? ' exercício' : ' exercícios') + ' · ~' + minEstimados + 'min';
  $('exlist').classList.add('com-barra-fixa');
  $('btn-editprog').style.display = w ? 'block' : 'none';
  $('startbar').style.display = 'flex';
  $('finishbar').style.display = 'none';
  $('editbar').style.display = 'none';
  showScreen('session');
}

/* -------------------------------------------------------------------------
   10b. EDIÇÃO DO PROGRAMA FORA DO TREINO
   ------------------------------------------------------------------------- */
function openEdit(key){
  const w = byKey(key);
  if(!w) return;
  editState = {
    key: key,
    original: programItems(key).map(shapeOf),
    items: programItems(key).map(it => Object.assign({uid: newUid()}, it))
  };
  $('sess-name').textContent = w.name;
  $('sess-sub').textContent = w.tag + ' · ' + w.meta;
  $('sess-warmup').style.display = 'none';
  $('sess-volume').textContent = '0 kg';
  $('startbar').style.display = 'none';
  $('finishbar').style.display = 'none';
  $('editbar').style.display = 'flex';
  renderEdit();
  showScreen('session');
}

function renderEdit(){
  const items = editState.items;
  $('exlist').classList.remove('com-barra-fixa');
  $('exlist').innerHTML = items.map((it, i) => editCardHTML(it, i, items.length)).join('') +
    '<button class="addex" data-addex="1">+ adicionar exercício</button>';
  $('sess-timer').textContent = '~' + Math.round(tempoEstimado(items) / 60) + 'min';
  $('sess-sets').textContent = items.reduce((a, e) => a + e.sets, 0) + ' previstas';
}

function editCardHTML(item, pos, total){
  const def = defOf(item.ex);
  return '<div class="excard" id="card-' + item.uid + '" data-uid="' + item.uid + '">' +
    '<div class="swipehint" aria-hidden="true">excluir</div>' +
    '<div class="cardinner">' +
    '<div class="exhead" style="cursor:default">' +
      '<span class="exmain">' +
        '<span class="idx">Exercício ' + (pos+1) + '</span>' +
        '<span class="exname">' + esc(def.name) + '</span>' +
        '<span class="target">RPE ' + item.rpe + ' · RIR ' + item.rir + '</span>' +
      '</span>' +
    '</div>' +
    '<div class="exbody">' +
      '<div class="editrow">' +
        '<div class="editlabel">Séries</div>' +
        '<div class="editstepper">' +
          '<button data-delset="' + item.uid + '" aria-label="Diminuir séries">−</button>' +
          '<span class="editval">' + item.sets + '</span>' +
          '<button data-addset="' + item.uid + '" aria-label="Aumentar séries">+</button>' +
        '</div>' +
      '</div>' +
      '<div class="editrow">' +
        '<div class="editlabel">Faixa de repetições</div>' +
        '<input class="editreps" type="text" value="' + esc(item.reps) + '" data-editreps="' + item.uid + '" aria-label="Faixa de repetições de ' + esc(def.name) + '">' +
      '</div>' +
      '<div class="editrow">' +
        '<div class="editlabel">Descanso</div>' +
        '<div class="editstepper">' +
          '<button data-restep="' + item.uid + '|-15" aria-label="Diminuir descanso em 15 segundos">−</button>' +
          '<span class="editval">' + fmtRest(item.rest) + '</span>' +
          '<button data-restep="' + item.uid + '|15" aria-label="Aumentar descanso em 15 segundos">+</button>' +
        '</div>' +
      '</div>' +
      '<div class="exfoot">' +
        '<button class="minibtn" data-swap="' + item.uid + '">trocar</button>' +
        (pos > 0 ? '<button class="minibtn" data-move="' + item.uid + '|-1" aria-label="Mover para cima">↑</button>' : '') +
        (pos < total - 1 ? '<button class="minibtn" data-move="' + item.uid + '|1" aria-label="Mover para baixo">↓</button>' : '') +
        (total > 1 ? '<button class="minibtn danger" data-remove="' + item.uid + '">excluir</button>' : '') +
        '<a class="minibtn link" href="' + videoUrl(def.name) + '" target="_blank" rel="noopener">execução</a>' +
        (def.note ? '<button class="minibtn" data-note="' + item.uid + '">observações</button>' : '') +
      '</div>' +
      (def.note ? '<div class="noteblock" id="note-' + item.uid + '">' + esc(def.note) + '</div>' : '') +
    '</div></div></div>';
}

function editItemByUid(uid){ return editState.items.find(i => i.uid === uid); }
function editPosOf(uid){ return editState.items.findIndex(i => i.uid === uid); }

function editMoveItem(uid, delta){
  const pos = editPosOf(uid);
  const target = pos + delta;
  if(target < 0 || target >= editState.items.length) return;
  const [it] = editState.items.splice(pos, 1);
  editState.items.splice(target, 0, it);
  renderEdit();
  const card = $('card-' + uid);
  if(card && card.scrollIntoView) card.scrollIntoView({behavior:'auto', block:'center'});
}

function editRemoveItem(uid){
  if(editState.items.length <= 1){ toast('Pelo menos um exercício é necessário'); return; }
  const pos = editPosOf(uid);
  if(pos === -1) return;
  editState.items.splice(pos, 1);
  renderEdit();
}

async function editSwapExercise(uid){
  const item = editItemByUid(uid);
  const def = defOf(item.ex);
  const choice = await pickExercise('Trocar exercício', def.alts || [], def.name);
  if(!choice) return;
  item.ex = choice;
  renderEdit();
}

function novoItemPadrao(id, def){
  if(def.type === 'cardio') return {ex:id, sets:1, reps:'15-20min', rpe:'5-6', rir:'', rest:0, duracaoSeg:15*60};
  return {
    ex: id, sets: 3,
    reps: def.type === 'time' ? '30-45s' : def.type === 'dist' ? '30m' : '8-12',
    rpe: '8', rir: '2', rest: 90
  };
}

async function editAddExercise(){
  const choice = await pickExercise('Adicionar exercício', []);
  if(!choice) return;
  const def = defOf(choice);
  editState.items.push(Object.assign({uid: newUid()}, novoItemPadrao(choice, def)));
  renderEdit();
  const items = editState.items;
  const card = $('card-' + items[items.length - 1].uid);
  if(card && card.scrollIntoView) card.scrollIntoView({behavior:'auto', block:'center'});
}

function editAddSet(uid){
  const item = editItemByUid(uid);
  item.sets++;
  renderEdit();
}
function editDelSet(uid){
  const item = editItemByUid(uid);
  if(item.sets <= 1) return;
  item.sets--;
  renderEdit();
}

function editRestStep(uid, delta){
  const item = editItemByUid(uid);
  item.rest = Math.max(15, item.rest + delta);
  renderEdit();
}

async function cancelEdit(){
  const changed = JSON.stringify(editState.items.map(shapeOf)) !== JSON.stringify(editState.original);
  if(changed){
    const ok = await askConfirm({
      title: 'Descartar as alterações?',
      text: 'O que você mudou nesta edição não será salvo.',
      confirmLabel: 'Descartar',
      danger: true
    });
    if(!ok) return;
  }
  editState = null;
  renderHome();
  showScreen('home');
}

async function saveEdit(){
  overrides[editState.key] = editState.items.map(shapeOf);
  await Store.set('overrides', overrides);
  editState = null;
  renderHome();
  showScreen('home');
  toast('Montagem salva como padrão');
}

/* -------------------------------------------------------------------------
   11. SESSÃO ATIVA
   ------------------------------------------------------------------------- */
function newSession(key){
  const w = byKey(key);
  const items = programItems(key).map(it => Object.assign({uid: newUid()}, it));
  return {
    key: key,
    name: w ? w.name : 'Treino livre',
    tag: w ? w.tag : 'EXTRA',
    block: w ? w.block : 'free',
    startedAt: Date.now(),
    items: items,
    log: items.reduce((acc, it) => {
      acc[it.uid] = Array.from({length: it.sets}, () => ({w:'', r:'', done:false}));
      return acc;
    }, {}),
    rest: null
  };
}

function beginSession(){
  session = newSession(previewKey);
  unlockAudio();
  requestWake();
  saveSession(true);
  renderSession();
  startDurationTimer();
  updateTrainingBadge();
}

async function startFreeSession(){
  session = {
    key: 'livre', name: 'Treino livre', tag: 'EXTRA', block: 'free',
    startedAt: Date.now(), items: [], log: {}, rest: null
  };
  previewKey = 'livre';
  $('sess-name').textContent = 'Treino livre';
  $('sess-sub').textContent = 'EXTRA · monte na hora';
  $('sess-warmup').style.display = 'none';
  unlockAudio();
  requestWake();
  saveSession(true);
  renderSession();
  startDurationTimer();
  updateTrainingBadge();
  await addExercise();
}

function resumeSession(){
  previewKey = session.key;
  const w = byKey(session.key);
  $('sess-name').textContent = session.name;
  $('sess-sub').textContent = session.tag + (w ? ' · ' + w.meta : ' · monte na hora');
  $('sess-warmup').style.display = w ? 'block' : 'none';
  if(w) $('sess-warmup').innerHTML = '<b>Aquecimento e ativação</b>' + esc(w.warmup);
  unlockAudio();
  requestWake();
  renderSession();
  startDurationTimer();
  if(session.rest && session.rest.endsAt > Date.now()) startRestLoop(); else session.rest = null;
  showScreen('session');
}

function renderSession(){
  editState = null;
  $('exlist').classList.remove('com-barra-fixa');
  $('exlist').innerHTML = session.items.map((it, i) => cardHTML(it, i)).join('') +
    '<button class="addex" data-addex="1">+ adicionar exercício</button>' +
    (session.items.length
      ? '<div class="previewnote">Arraste um exercício para a esquerda para excluir.</div>'
      : '<div class="previewnote">Nenhum exercício ainda. Toque acima para incluir o primeiro.</div>');
  $('startbar').style.display = 'none';
  $('finishbar').style.display = 'flex';
  $('editbar').style.display = 'none';
  updateStats();
  showScreen('session');
}

function cardHTML(item, pos){
  const def = defOf(item.ex);
  const log = session.log[item.uid] || [];
  const last = lastPerformance(item.ex);
  const sug = sugerirCarga(ultimasSessoesDoExercicio(item.ex), {reps: item.reps, type: def.type, regiao: regiaoDoExercicio(item.ex)});
  const u = unitOf(def.type);
  const doneCount = log.slice(0, item.sets).filter(s => s.done).length;
  const allDone = doneCount >= item.sets && item.sets > 0;
  const isLast = pos === session.items.length - 1;

  let rows = '';
  for(let s = 0; s < item.sets; s++){
    const entry = log[s] || {w:'', r:'', done:false};
    const prev = last && last.sets[s];
    const hint = prev ? fmtSet(prev, def.type) : '';
    rows +=
      '<div class="setrow' + (entry.done ? ' done' : '') + '">' +
        '<div class="setnum">' + (s+1) + '</div>' +
        '<div class="field">' +
          '<input type="number" inputmode="decimal" step="0.5" min="0" pattern="[0-9]*" class="' + (entry.autoW ? 'auto' : '') + '" value="' + esc(entry.w) + '" ' +
            'placeholder="' + (def.type === 'reps' ? 'kg' : def.type === 'cardio' ? 'km opc.' : 'kg opc.') + '" ' +
            'aria-label="' + (def.type === 'cardio' ? 'Distância' : 'Carga') + ' da série ' + (s+1) + ' de ' + esc(def.name) + '" data-uid="' + item.uid + '" data-s="' + s + '" data-f="w">' +
          '<div class="prevhint">' + hint + '</div>' +
        '</div>' +
        '<div class="field">' +
          '<input type="number" inputmode="numeric" step="1" min="0" pattern="[0-9]*" class="' + (entry.autoR ? 'auto' : '') + '" value="' + esc(entry.r) + '" ' +
            'placeholder="' + esc(def.type === 'reps' ? item.reps : (def.type === 'time' ? 'seg' : def.type === 'cardio' ? 'min' : 'metros')) + '" ' +
            'aria-label="' + (u === 'reps' ? 'Repetições' : u === 's' ? 'Segundos' : u === 'min' ? 'Minutos' : 'Metros') + ' da série ' + (s+1) + '" data-uid="' + item.uid + '" data-s="' + s + '" data-f="r">' +
          '<div class="prevhint">' + (def.type === 'reps' ? 'alvo ' + esc(item.reps) : '') + '</div>' +
        '</div>' +
        '<div class="stepper">' +
          '<button data-step="' + item.uid + '|' + s + '|1" aria-label="Aumentar em 1">+</button>' +
          '<button data-step="' + item.uid + '|' + s + '|-1" aria-label="Diminuir em 1">−</button>' +
        '</div>' +
        '<button class="checkbtn' + (entry.done ? ' done' : '') + '" data-check="' + item.uid + '|' + s + '" ' +
          'role="switch" aria-checked="' + (entry.done ? 'true' : 'false') + '" aria-label="Concluir série ' + (s+1) + '">✓</button>' +
      '</div>';
  }

  const summary = log.slice(0, item.sets).filter(s => s.done).map(s =>
    '<span>' + (def.type === 'cardio' ? fmtSet(s, 'cardio') : (s.w ? esc(s.w) + '×' : '') + esc(s.r) + (u === 'reps' ? '' : u)) + '</span>').join('');

  return '<div class="excard' + (allDone ? ' done collapsed' : '') + '" id="card-' + item.uid + '" data-uid="' + item.uid + '">' +
    '<div class="swipehint" aria-hidden="true">excluir</div>' +
    '<div class="cardinner">' +
    '<div class="exheadrow' + (def.img ? ' has-thumb' : '') + '">' +
    thumbHTML(item.ex, def) +
    '<button class="exhead" data-toggle="' + item.uid + '" aria-expanded="' + (allDone ? 'false' : 'true') + '">' +
      '<span class="exmain">' +
        '<span class="idx">' + (allDone ? '<span class="doneflag">✓ concluído</span>' : 'Exercício ' + (pos+1)) + '</span>' +
        '<span class="exname">' + esc(def.name) + '</span>' +
        '<span class="target">' + esc(item.reps) + ' · RPE ' + item.rpe + ' · RIR ' + item.rir + ' · ' + fmtRest(item.rest) + '</span>' +
        (sug ? '<span class="suggestion">' + esc(formatarSugestao(sug)) + '</span>' : '') +
        (allDone && summary ? '<span class="exsummary">' + summary + '</span>' : '') +
      '</span>' +
      '<span class="prog">' + doneCount + '/' + item.sets + '</span>' +
    '</button>' +
    '</div>' +
    '<div class="exbody">' +
      '<div class="setrow-head"><div></div><div>' + (def.type === 'cardio' ? 'Dist.' : 'Carga') + '</div><div>' + (def.type === 'reps' ? 'Reps' : def.type === 'time' ? 'Tempo' : def.type === 'cardio' ? 'Duração' : 'Dist.') + '</div><div></div><div></div></div>' +
      rows +
      '<div class="exfoot">' +
        '<button class="minibtn" data-addset="' + item.uid + '">+ série</button>' +
        (item.sets > 1 ? '<button class="minibtn" data-delset="' + item.uid + '">- série</button>' : '') +
        '<button class="minibtn" data-swap="' + item.uid + '">trocar</button>' +
        (pos > 0 ? '<button class="minibtn" data-move="' + item.uid + '|-1" aria-label="Mover para cima">↑</button>' : '') +
        (!isLast ? '<button class="minibtn" data-move="' + item.uid + '|1" aria-label="Mover para baixo">↓</button>' : '') +
        '<button class="minibtn danger" data-remove="' + item.uid + '">excluir</button>' +
        '<a class="minibtn link" href="' + videoUrl(def.name) + '" target="_blank" rel="noopener">execução</a>' +
        (def.note ? '<button class="minibtn" data-note="' + item.uid + '">observações</button>' : '') +
      '</div>' +
      (def.note ? '<div class="noteblock" id="note-' + item.uid + '">' + esc(def.note) + '</div>' : '') +
    '</div></div></div>';
}

function itemByUid(uid){ return session.items.find(i => i.uid === uid); }
function posOf(uid){ return session.items.findIndex(i => i.uid === uid); }

function refreshCard(uid){
  const pos = posOf(uid);
  if(pos === -1) return;
  const card = $('card-' + uid);
  if(card) card.outerHTML = cardHTML(session.items[pos], pos);
}

function updateStats(){
  if(!session) return;
  let total = 0, done = 0, volume = 0;
  session.items.forEach(it => {
    total += it.sets;
    const type = defOf(it.ex).type;
    (session.log[it.uid] || []).slice(0, it.sets).forEach(s => {
      if(!s.done) return;
      done++;
      if(type === 'reps') volume += (parseFloat(s.w) || 0) * (parseFloat(s.r) || 0);
    });
  });
  $('sess-sets').textContent = done + '/' + total;
  $('sess-volume').textContent = Math.round(volume) + ' kg';
}

function startDurationTimer(){
  clearInterval(durationInt);
  durationInt = setInterval(tickDuration, 1000);
  tickDuration();
}
function tickDuration(){
  if(!session || !session.startedAt) return;
  const diff = Math.floor((Date.now() - session.startedAt) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  $('sess-timer').textContent = (h ? h + ':' + String(m).padStart(2,'0') : String(m).padStart(2,'0')) + ':' + String(s).padStart(2,'0');
}

/* tocar no cronometro da sessao ativa abre a edicao do horario de inicio,
   pra quem esquece de tocar em Comecar na hora certa */
function abrirEdicaoInicio(){
  if(!session || !session.startedAt) return;
  const el = $('sheet-backdrop');
  const d = new Date(session.startedAt);
  const pad = n => String(n).padStart(2, '0');
  const dataVal = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const horaVal = pad(d.getHours()) + ':' + pad(d.getMinutes());
  const agora = new Date();
  const dataMax = agora.getFullYear() + '-' + pad(agora.getMonth() + 1) + '-' + pad(agora.getDate());

  $('sheet-body').innerHTML =
    '<div class="sheethead"><h2 id="sheet-title">Editar início do treino</h2>' +
    '<button class="closebtn" data-fechar="1" aria-label="Fechar">✕</button></div>' +
    '<p>Ajusta quando você começou de verdade, se esqueceu de tocar em Começar na hora.</p>' +
    '<div class="onb-opts">' +
      '<input class="onb-input" id="ini-data" type="date" inputmode="numeric" max="' + dataMax + '" value="' + dataVal + '" aria-label="Data de início">' +
      '<input class="onb-input" id="ini-hora" type="time" inputmode="numeric" value="' + horaVal + '" aria-label="Hora de início">' +
    '</div>' +
    '<div class="sheetact" style="margin-top:16px">' +
      '<button class="btn-ghost" data-fechar="1">Cancelar</button>' +
      '<button class="btn-primary" id="ini-salvar">Salvar</button>' +
    '</div>';
  openBackdrop(el, null, true);
  $('sheet-body').querySelectorAll('[data-fechar]').forEach(b => b.onclick = () => fecharSheetAtual());
  $('ini-salvar').onclick = async () => {
    const dataStr = $('ini-data').value, horaStr = $('ini-hora').value;
    if(!dataStr || !horaStr){ toast('Preencha data e horário'); return; }
    const novo = new Date(dataStr + 'T' + horaStr);
    if(isNaN(novo.getTime())){ toast('Data inválida'); return; }
    if(novo.getTime() > Date.now()){ toast('O início não pode ser no futuro'); return; }
    const duracaoHoras = (Date.now() - novo.getTime()) / 3600000;
    if(duracaoHoras > 5){
      const ok = await askConfirm({
        title: 'Treino de mais de 5 horas?',
        text: 'Com esse início a duração fica bem longa. Confirma mesmo assim?',
        confirmLabel: 'Confirmar'
      });
      if(!ok) return;
    }
    session.startedAt = novo.getTime();
    saveSession(true);
    tickDuration();
    fecharSheetAtual();
    toast('Início atualizado');
  };
}

/* -------------------------------------------------------------------------
   12. DESCANSO
   O bipe é agendado no relógio do AudioContext, então toca na hora certa
   mesmo se o navegador congelar os temporizadores em segundo plano.
   ------------------------------------------------------------------------- */
function startRest(seconds, label, proxima){
  session.rest = {endsAt: Date.now() + seconds * 1000, total: seconds, label: label, proxima: proxima || ''};
  saveSession();
  scheduleBeep(seconds);
  startRestLoop();
}
function startRestLoop(){
  clearInterval(restInt);
  $('rest-exname').textContent = session.rest.label;
  $('rest-next').textContent = session.rest.proxima || 'Descanso';
  $('resttimer').classList.add('show');
  keepAudioAlive(true);
  tickRest();
  restInt = setInterval(tickRest, 250);
}
function tickRest(){
  if(!session || !session.rest) return;
  const left = Math.ceil((session.rest.endsAt - Date.now()) / 1000);
  if(left <= 0) return endRest();
  $('ringtext').textContent = left;
  const pct = Math.max(0, Math.min(1, left / session.rest.total));
  $('restbarfill').style.width = (pct * 100) + '%';
  $('resttimer').classList.toggle('ending', left <= 10);
}
function endRest(){
  clearInterval(restInt);
  $('resttimer').classList.remove('show', 'ending', 'expanded');
  restExpanded = false;
  session.rest = null;
  saveSession();
  keepAudioAlive(false);
  if(!scheduledBeeps.length) beep();
  scheduledBeeps = [];
  vibrate();
}
function skipRest(){
  clearInterval(restInt);
  $('resttimer').classList.remove('show', 'ending', 'expanded');
  restExpanded = false;
  cancelScheduledBeeps();
  keepAudioAlive(false);
  if(session){ session.rest = null; saveSession(); }
}
function toggleRestExpand(){
  restExpanded = !restExpanded;
  $('resttimer').classList.toggle('expanded', restExpanded);
}
function addRest(sec){
  if(!session || !session.rest) return;
  session.rest.endsAt += sec * 1000;
  session.rest.total = Math.max(session.rest.total, Math.ceil((session.rest.endsAt - Date.now())/1000));
  cancelScheduledBeeps();
  scheduleBeep(Math.ceil((session.rest.endsAt - Date.now()) / 1000));
  saveSession();
  tickRest();
}

/* som ------------------------------------------------------------------ */
function unlockAudio(){
  if(!settings.sound) return;
  try{
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if(Ctx && !audioCtx) audioCtx = new Ctx();
    if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    if(audioCtx){
      const b = audioCtx.createBuffer(1, 1, 22050);
      const src = audioCtx.createBufferSource();
      src.buffer = b; src.connect(audioCtx.destination); src.start(0);
    }
  }catch(e){ audioCtx = null; }
  try{
    if(!silentAudio && typeof Audio === 'function'){
      silentAudio = new Audio('silence.wav');
      silentAudio.loop = true;
      silentAudio.volume = 0.01;
    }
  }catch(e){ silentAudio = null; }
}
function keepAudioAlive(on){
  if(!silentAudio || !settings.sound) return;
  try{
    if(on){ const p = silentAudio.play(); if(p && p.catch) p.catch(() => {}); }
    else { silentAudio.pause(); }
  }catch(e){ /* ignora */ }
}
function toneAt(when, freq){
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(0.4, when + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.18);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(when); o.stop(when + 0.2);
  return o;
}
function scheduleBeep(seconds){
  if(!settings.sound || !audioCtx) return;
  try{
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const base = audioCtx.currentTime + Math.max(0, seconds);
    scheduledBeeps = [toneAt(base, 880), toneAt(base + 0.24, 880), toneAt(base + 0.48, 1174)];
  }catch(e){ scheduledBeeps = []; }
}
function cancelScheduledBeeps(){
  scheduledBeeps.forEach(o => { try{ o.stop(); }catch(e){} });
  scheduledBeeps = [];
}
function beep(){
  if(!settings.sound || !audioCtx) return;
  try{
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const base = audioCtx.currentTime + 0.02;
    toneAt(base, 880); toneAt(base + 0.24, 880); toneAt(base + 0.48, 1174);
  }catch(e){ /* ignora */ }
}
function vibrate(){
  if(!settings.sound || !navigator.vibrate) return;
  try{ navigator.vibrate([200, 90, 200, 90, 320]); }catch(e){}
}

/* tela ligada ---------------------------------------------------------- */
async function requestWake(){
  if(!settings.wake || !('wakeLock' in navigator)) return;
  try{ wakeLock = await navigator.wakeLock.request('screen'); }catch(e){ /* bateria baixa */ }
}
function releaseWake(){
  if(wakeLock){ try{ wakeLock.release(); }catch(e){} wakeLock = null; }
}

/* -------------------------------------------------------------------------
   13. EDIÇÃO DA SESSÃO
   ------------------------------------------------------------------------- */
function onInput(e){
  const el = e.target;
  if(editState && el.dataset && el.dataset.editreps !== undefined){
    const item = editItemByUid(el.dataset.editreps);
    if(item && el.value.trim()) item.reps = el.value;
    return;
  }
  if(!el.dataset || el.dataset.f === undefined || !session) return;
  const uid = el.dataset.uid, s = +el.dataset.s, f = el.dataset.f;
  if(!session.log[uid]) session.log[uid] = [];
  if(!session.log[uid][s]) session.log[uid][s] = {w:'', r:'', done:false};
  const entry = session.log[uid][s];
  entry[f] = el.value;
  entry[chaveAuto(f)] = false;
  el.classList.remove('auto');
  propagarValor(uid, s, f, el.value);
  updateStats();
  saveSession();
}

const chaveAuto = f => f === 'w' ? 'autoW' : 'autoR';

/* propaga carga/reps digitadas pras series seguintes do mesmo exercicio,
   so pra frente e so nas que ainda nao foram concluidas nem editadas a mao.
   nao reusa refreshCard aqui pra nao perder o foco/cursor de quem esta
   digitando no campo que disparou a propagacao */
function propagarValor(uid, fromS, f, valor){
  const item = itemByUid(uid);
  if(!item) return;
  const log = session.log[uid];
  const chave = chaveAuto(f);
  const card = $('card-' + uid);
  for(let s = fromS + 1; s < item.sets; s++){
    if(!log[s]) log[s] = {w:'', r:'', done:false};
    const entry = log[s];
    if(entry.done || entry[chave] === false) continue;
    entry[f] = valor;
    entry[chave] = true;
    if(card){
      const input = card.querySelector('input[data-s="' + s + '"][data-f="' + f + '"]');
      if(input){ input.value = valor; input.classList.add('auto'); }
    }
  }
}

/* campos numéricos não aceitam letras (o 'e' passa em input type=number) */
function onKeydown(e){
  const el = e.target;
  if(!el.dataset || el.dataset.f === undefined) return;
  if(e.ctrlKey || e.metaKey || e.key.length > 1) return;
  const allowed = el.dataset.f === 'w' ? /[0-9.,]/ : /[0-9]/;
  if(!allowed.test(e.key)) e.preventDefault();
}

function stepReps(uid, s, delta){
  const item = itemByUid(uid);
  if(!item) return;
  if(!session.log[uid][s]) session.log[uid][s] = {w:'', r:'', done:false};
  const entry = session.log[uid][s];
  const current = parseInt(entry.r, 10);
  if(isNaN(current)){
    const prev = lastPerformance(item.ex);
    const fromPrev = prev && prev.sets[s] ? parseInt(prev.sets[s].r, 10) : NaN;
    entry.r = String(Math.max(0, !isNaN(fromPrev) ? fromPrev : repTarget(item.reps)));
  }else{
    entry.r = String(Math.max(0, current + delta));
  }
  entry.autoR = false;
  const card = $('card-' + uid);
  const rows = card ? card.querySelectorAll('.setrow') : [];
  if(rows[s]){
    const target = rows[s].querySelector('input[data-f="r"]');
    if(target){ target.value = entry.r; target.classList.remove('auto'); }
  }
  propagarValor(uid, s, 'r', entry.r);
  updateStats();
  saveSession();
}

function toggleSet(uid, s){
  const item = itemByUid(uid);
  if(!item) return;
  if(!session.log[uid][s]) session.log[uid][s] = {w:'', r:'', done:false};
  const entry = session.log[uid][s];
  entry.done = !entry.done;

  const doneCount = session.log[uid].slice(0, item.sets).filter(x => x.done).length;
  refreshCard(uid);
  updateStats();
  saveSession();

  if(entry.done){
    if(defOf(item.ex).type !== 'cardio'){
      const proxima = doneCount < item.sets ? 'Série ' + (doneCount + 1) + ' de ' + item.sets : 'Última série feita';
      startRest(item.rest, defOf(item.ex).name, proxima);
    }
    if(doneCount >= item.sets) scrollToNext(posOf(uid));
  }
}

function scrollToNext(fromPos){
  for(let i = fromPos + 1; i < session.items.length; i++){
    const it = session.items[i];
    const done = (session.log[it.uid] || []).slice(0, it.sets).filter(x => x.done).length;
    if(done < it.sets){
      const card = $('card-' + it.uid);
      if(card && card.scrollIntoView) card.scrollIntoView({behavior: mq('(prefers-reduced-motion: reduce)') ? 'auto' : 'smooth', block: 'start'});
      return;
    }
  }
}

function addSet(uid){
  const item = itemByUid(uid);
  item.sets++;
  while(session.log[uid].length < item.sets) session.log[uid].push({w:'', r:'', done:false});
  refreshCard(uid); updateStats(); saveSession();
}
function delSet(uid){
  const item = itemByUid(uid);
  if(item.sets <= 1) return;
  item.sets--;
  refreshCard(uid); updateStats(); saveSession();
}

function moveItem(uid, delta){
  const pos = posOf(uid);
  const target = pos + delta;
  if(target < 0 || target >= session.items.length) return;
  const [it] = session.items.splice(pos, 1);
  session.items.splice(target, 0, it);
  renderSession();
  saveSession();
  const card = $('card-' + uid);
  if(card && card.scrollIntoView) card.scrollIntoView({behavior:'auto', block:'center'});
}

function removeItem(uid, silent){
  const pos = posOf(uid);
  if(pos === -1) return;
  lastRemoved = {item: session.items[pos], log: session.log[uid], pos: pos};
  session.items.splice(pos, 1);
  delete session.log[uid];
  renderSession();
  saveSession();
  if(!silent) toast('Exercício removido', 'Desfazer', undoRemove);
}
function undoRemove(){
  if(!lastRemoved || !session) return;
  session.items.splice(Math.min(lastRemoved.pos, session.items.length), 0, lastRemoved.item);
  session.log[lastRemoved.item.uid] = lastRemoved.log;
  lastRemoved = null;
  renderSession();
  saveSession();
}

async function swapExercise(uid){
  const item = itemByUid(uid);
  const def = defOf(item.ex);
  const choice = await pickExercise('Trocar exercício', def.alts || [], def.name);
  if(!choice) return;
  item.ex = choice;
  refreshCard(uid);
  saveSession();
  toast('Agora é ' + defOf(choice).name);
}

async function addExercise(){
  const choice = await pickExercise('Adicionar exercício', []);
  if(!choice) return;
  const def = defOf(choice);
  const item = Object.assign({uid: newUid()}, novoItemPadrao(choice, def));
  session.items.push(item);
  session.log[item.uid] = Array.from({length: item.sets}, () => ({w:'', r:'', done:false}));
  renderSession();
  saveSession();
  const card = $('card-' + item.uid);
  if(card && card.scrollIntoView) card.scrollIntoView({behavior:'auto', block:'center'});
}

/* -------------------------------------------------------------------------
   14. SELETOR DE EXERCÍCIO COM BUSCA
   ------------------------------------------------------------------------- */
function allExercises(){
  return Object.keys(EX).concat(Object.keys(customEx)).map(id => ({id, def: defOf(id)}));
}

const CHIP_LABELS = {peito:'Peito', costas:'Costas', ombros:'Ombros', bracos:'Braços', pernas:'Pernas', gluteos:'Glúteos', abdomen:'Abdômen', cardio:'Cardio'};
const CHIP_GRUPOS = {
  peito: ['peito'], costas: ['costas'], ombros: ['ombro'],
  bracos: ['bíceps','tríceps','pegada'], pernas: ['quadríceps','panturrilha'],
  gluteos: ['posterior'], abdomen: ['core'], cardio: ['cardio']
};

function pickExercise(title, suggested, replacing){
  return new Promise(resolve => {
    const el = $('sheet-backdrop');
    const list = allExercises().sort((a, b) => a.def.name.localeCompare(b.def.name, 'pt-BR'));
    const recentesIds = exerciciosComHistorico().map(e => e.exId).slice(0, 8);
    let chipAtivo = '';
    const norm = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    $('sheet-body').innerHTML =
      '<div class="sheethead"><h2 id="sheet-title">' + esc(title) + '</h2>' +
      '<button class="closebtn" data-v="" aria-label="Fechar">✕</button></div>' +
      (replacing ? '<p>Substituindo ' + esc(replacing) + '. A troca vale para este treino.</p>' : '') +
      '<input class="searchbox" id="ex-search" type="search" placeholder="Buscar por nome ou grupo muscular" ' +
      'aria-label="Buscar exercício" autocomplete="off">' +
      '<div class="chiprow" id="ex-chips">' +
        Object.keys(CHIP_LABELS).map(c => '<button class="chip" data-chip="' + c + '">' + CHIP_LABELS[c] + '</button>').join('') +
      '</div>' +
      '<div class="optlist" id="ex-options"></div>';

    const options = $('ex-options');
    // .opt e um <div>, nunca um <button>: a estrela de favorito e um botao de
    // verdade, e botao dentro de botao e invalido (some pra leitor de tela)
    const optRow = x => {
      const fav = !!favoritos[x.id];
      return '<div class="opt">' +
        thumbHTML(x.id, x.def) +
        '<button class="optselect" data-v="' + x.id + '">' +
          '<span class="optmain">' + esc(x.def.name) +
            '<span class="om">' + esc(x.def.group || '') + (x.def.type !== 'reps' ? ' · ' + (x.def.type === 'time' ? 'tempo' : x.def.type === 'cardio' ? 'cardio' : 'distância') : '') + '</span>' +
          '</span>' +
        '</button>' +
        '<button class="star' + (fav ? ' fav' : '') + '" data-star="' + x.id + '" aria-pressed="' + (fav ? 'true' : 'false') + '" aria-label="' + (fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos') + '">★</button>' +
      '</div>';
    };
    const passaChip = x => !chipAtivo || (CHIP_GRUPOS[chipAtivo] || []).indexOf(x.def.group) !== -1;

    function draw(filter){
      const q = norm(filter || '');
      const rows = [];
      const base = list.filter(passaChip);

      if(!q){
        const favs = base.filter(x => favoritos[x.id]);
        if(favs.length){
          rows.push('<div class="optgroup">Favoritos</div>');
          favs.forEach(x => rows.push(optRow(x)));
        }
        const recentes = recentesIds.map(id => base.find(x => x.id === id)).filter(Boolean);
        if(recentes.length){
          rows.push('<div class="optgroup">Usados recentemente</div>');
          recentes.forEach(x => rows.push(optRow(x)));
        }
        if(!chipAtivo && suggested && suggested.length){
          rows.push('<div class="optgroup">Alternativas sugeridas</div>');
          suggested.forEach(id => {
            const x = list.find(l => l.id === id);
            if(x) rows.push(optRow(x));
          });
        }
        rows.push('<div class="optgroup">Todos os exercícios</div>');
      }
      const hits = base.filter(x => !q || norm(x.def.name).includes(q) || norm(x.def.group || '').includes(q));
      hits.forEach(x => rows.push(optRow(x)));
      if(!hits.length && filter && filter.trim().length > 2){
        rows.push('<div class="opt"><button class="optselect" data-new="' + esc(filter.trim()) + '">Criar "' + esc(filter.trim()) + '"' +
          '<span class="om">exercício novo, fica salvo no seu catálogo</span></button></div>');
      }
      options.innerHTML = rows.join('');
    }
    draw('');

    let settled = false;
    const done = v => { if(settled) return; settled = true; el.classList.remove('show'); invalidarBackdropCloser(); resolve(v || null); };
    openBackdrop(el, () => done(null), true);

    $('ex-search').oninput = ev => draw(ev.target.value);
    $('ex-chips').onclick = ev => {
      const c = ev.target.closest('[data-chip]');
      if(!c) return;
      chipAtivo = chipAtivo === c.dataset.chip ? '' : c.dataset.chip;
      $('ex-chips').querySelectorAll('[data-chip]').forEach(bt => bt.classList.toggle('sel', bt.dataset.chip === chipAtivo));
      draw($('ex-search').value);
    };
    $('sheet-body').onclick = ev => {
      const thumb = ev.target.closest('[data-thumb]');
      if(thumb) return abrirExecucao(thumb.dataset.thumb);
      const star = ev.target.closest('[data-star]');
      if(star){
        const id = star.dataset.star;
        if(favoritos[id]) delete favoritos[id]; else favoritos[id] = true;
        Store.set('favoritos', favoritos);
        draw($('ex-search').value);
        return;
      }
      const novo = ev.target.closest('[data-new]');
      if(novo) return done(createCustomExercise(novo.dataset.new));
      const b = ev.target.closest('[data-v]');
      if(b) done(b.dataset.v);
    };
  });
}

function createCustomExercise(name){
  const slug = String(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 24);
  const id = 'custom_' + slug + '_' + Math.random().toString(36).slice(2, 5);
  customEx[id] = {name: name, type: 'reps', group: 'personalizado'};
  Store.set('custom_ex', customEx);
  return id;
}

/* -------------------------------------------------------------------------
   15. FINALIZAR
   ------------------------------------------------------------------------- */
function hasProgress(){
  if(!session) return false;
  return Object.values(session.log).some(sets => sets.some(s => s.done || s.w || s.r));
}

function leaveSession(){
  if(editState) return cancelEdit();
  if(!session || !session.startedAt){ showScreen('home'); return; }
  toast('Treino continua rodando. Retome pela tela de treinos.');
  renderHome();
  showScreen('home');
}

async function cancelWorkout(){
  const ok = await askConfirm({
    title: 'Cancelar este treino?',
    text: hasProgress()
      ? 'As séries registradas nesta sessão serão apagadas e nada vai para o histórico.'
      : 'Nada foi registrado ainda, então nada será perdido.',
    confirmLabel: 'Cancelar treino',
    danger: true
  });
  if(!ok) return;
  clearInterval(durationInt); clearInterval(restInt);
  cancelScheduledBeeps(); keepAudioAlive(false);
  $('resttimer').classList.remove('show');
  releaseWake();
  await clearSession();
  renderHome();
  showScreen('home');
}

async function finishWorkout(){
  let volume = 0, doneSets = 0, cardioMin = 0;
  const exercises = [];

  session.items.forEach(it => {
    const def = defOf(it.ex);
    const sets = (session.log[it.uid] || []).slice(0, it.sets)
      .filter(s => s.done)
      .map(s => ({w: s.w, r: s.r}));
    if(!sets.length) return;
    doneSets += sets.length;
    if(def.type === 'reps') sets.forEach(s => { volume += (parseFloat(s.w) || 0) * (parseFloat(s.r) || 0); });
    if(def.type === 'cardio') sets.forEach(s => { cardioMin += parseFloat(s.r) || 0; });
    exercises.push({exId: it.ex, name: def.name, type: def.type, sets: sets});
  });

  if(!doneSets){
    await askConfirm({title:'Nenhuma série concluída', text:'Marque pelo menos uma série como concluída antes de finalizar.', confirmLabel:'Entendi', hideCancel:true});
    return;
  }

  const prs = [];
  exercises.forEach(e => {
    if(e.type !== 'reps') return;
    const prev = bestEver(e.exId);
    let best = null;
    e.sets.forEach(s => {
      const w = parseFloat(s.w) || 0, r = parseFloat(s.r) || 0;
      if(w <= 0 || r <= 0) return;
      if(!best || w > best.w || (w === best.w && r > best.r)) best = {w, r};
    });
    if(!best) return;
    if(!prev || best.w > prev.w || (best.w === prev.w && best.r > prev.r)){
      prs.push({name: e.name, detail: best.w + ' kg x ' + best.r, first: !prev});
    }
  });

  const todayCount = history.filter(h => sameDay(new Date(h.date), new Date())).length;
  const entry = {
    id: 'w_' + Date.now(),
    key: session.key, name: session.name, tag: session.tag, block: session.block,
    date: new Date().toISOString(),
    duration: Math.floor((Date.now() - session.startedAt) / 1000),
    volume: Math.round(volume),
    setsDone: doneSets,
    cardioMin: Math.round(cardioMin),
    exercises: exercises
  };
  const previous = history.find(h => h.key === session.key);

  const currentShape = session.items.map(shapeOf);
  const defaultShape = programItems(session.key).map(shapeOf);
  const changed = !!byKey(session.key) && JSON.stringify(currentShape) !== JSON.stringify(defaultShape);
  const finishedKey = session.key;

  history.unshift(entry);
  await saveHistory();

  clearInterval(durationInt); clearInterval(restInt);
  cancelScheduledBeeps(); keepAudioAlive(false);
  $('resttimer').classList.remove('show');
  releaseWake();
  await clearSession();

  renderSummary(entry, previous, prs, todayCount);
  renderHome(); renderHistory();
  showScreen('summary');

  if(changed){
    const save = await askConfirm({
      title: 'Salvar essa montagem?',
      text: 'Você mudou a ordem ou os exercícios do ' + entry.name + '. Quer que ele abra assim das próximas vezes?',
      confirmLabel: 'Salvar como padrão'
    });
    if(save){
      overrides[finishedKey] = currentShape;
      await Store.set('overrides', overrides);
      renderHome();
      toast('Montagem salva como padrão');
    }
  }
}

function renderSummary(entry, previous, prs, todayCount){
  const mins = Math.round(entry.duration / 60);
  $('sum-sub').textContent = entry.name + ' · ' + new Date(entry.date).toLocaleDateString('pt-BR', {weekday:'long', day:'2-digit', month:'long'});

  let deltaTxt = 'Primeiro registro deste treino. A partir de agora dá para comparar.';
  if(previous){
    const dv = entry.volume - previous.volume;
    const pct = previous.volume ? Math.round((dv / previous.volume) * 100) : 0;
    deltaTxt = dv >= 0
      ? 'Volume ' + (pct ? pct + '% acima' : 'igual') + ' do último ' + entry.name + '.'
      : 'Volume ' + Math.abs(pct) + '% abaixo do último ' + entry.name + '. Nem toda sessão precisa subir.';
  }

  let html = '';
  if(todayCount >= 1){
    html += '<div class="sumhero gold"><div class="badge" aria-hidden="true">★</div><div class="k">Double perfect</div>' +
      '<div class="s">Segundo treino no mesmo dia. Esse dia fica dourado no calendário.</div></div>';
  }else{
    html += '<div class="sumhero"><div class="k">' + (prs.length ? prs.length + (prs.length === 1 ? ' recorde batido' : ' recordes batidos') : 'Sessão registrada') + '</div>' +
      '<div class="s">' + deltaTxt + '</div></div>';
  }

  html += '<div class="sumgrid">' +
      '<button class="c editavel" id="sum-editar-horario" type="button" aria-label="Editar início e fim do treino"><div class="v">' + mins + ' min</div><div class="l">Duração</div></button>' +
      '<div class="c"><div class="v">' + entry.setsDone + '</div><div class="l">Séries</div></div>' +
      '<div class="c"><div class="v">' + entry.volume + '</div><div class="l">Volume kg</div></div>' +
      (entry.cardioMin ? '<div class="c"><div class="v">' + entry.cardioMin + '</div><div class="l">Cardio min</div></div>' : '') +
    '</div>';

  if(prs.length){
    html += '<div class="sumsection">Recordes</div><div class="prlist">' +
      prs.map(p => '<div class="pritem"><div class="n">' + esc(p.name) + '</div><div class="d">' + p.detail + (p.first ? ' · primeiro registro' : '') + '</div></div>').join('') +
      '</div>';
  }

  html += '<div class="sumsection">Séries registradas</div><div class="histcard"><div class="hdetail open" style="border:none; margin:0; padding:0;">' +
    entry.exercises.map(e =>
      '<div class="hex"><div class="hexname">' + esc(e.name) + '</div><div class="hexsets">' +
      e.sets.map(s => '<span>' + fmtSet(s, e.type) + '</span>').join('') +
      '</div></div>').join('') +
    '</div></div>';

  $('sumwrap').innerHTML = html;
  $('sum-editar-horario').onclick = () => editarDataTreino(entry.id, atualizado => {
    $('sum-editar-horario').querySelector('.v').textContent = Math.round(atualizado.duration / 60) + ' min';
  });
  prepararCompartilhamento(entry, prs);
}

/* -------------------------------------------------------------------------
   17. COMPARTILHAR RESUMO
   A imagem e gerada assim que o resumo renderiza, nunca dentro do clique de
   compartilhar: no iOS, navigator.share só funciona chamado de forma
   síncrona dentro do próprio gesto de toque, sem nenhum await antes dele.
   ------------------------------------------------------------------------- */
let shareFile = null;

function carregarImagem(src){
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function truncarTexto(ctx, texto, maxWidth){
  if(ctx.measureText(texto).width <= maxWidth) return texto;
  let t = texto;
  while(t.length > 1 && ctx.measureText(t + '…').width > maxWidth) t = t.slice(0, -1);
  return t + '…';
}

async function gerarImagemResumo(entry, prs){
  const canvas = document.createElement('canvas');
  canvas.width = 1080; canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if(!ctx) return null;

  if(document.fonts){
    try{
      await Promise.all([
        document.fonts.load('600 40px "Space Grotesk"'),
        document.fonts.load('700 64px "Space Grotesk"'),
        document.fonts.load('600 36px "Space Grotesk"'),
        document.fonts.load('600 84px "JetBrains Mono"'),
        document.fonts.load('600 28px "JetBrains Mono"'),
        document.fonts.load('400 32px "JetBrains Mono"')
      ]);
      await document.fonts.ready;
    }catch(e){ /* segue com a fonte de sistema, melhor que travar */ }
  }

  const W = 1080, MX = 80;
  ctx.fillStyle = '#101314';
  ctx.fillRect(0, 0, W, 1920);

  const cx = MX + 64, cy = 170, r = 64;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = '#232830';
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  if(avatar){
    try{
      const img = await carregarImagem(avatar);
      ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
    }catch(e){ /* sem foto, fica so o fundo */ }
  }
  ctx.restore();
  if(!avatar){
    ctx.fillStyle = '#7f898e';
    ctx.font = '700 48px "Space Grotesk"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(profile && profile.nome ? profile.nome[0].toUpperCase() : '', cx, cy + 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  ctx.fillStyle = '#eef1f0';
  ctx.font = '600 40px "Space Grotesk"';
  ctx.fillText(profile && profile.nome ? profile.nome : 'Meu Treino', cx + r + 32, cy + 14);

  let y = 340;
  ctx.fillStyle = '#b9ff3c';
  ctx.font = '700 64px "Space Grotesk"';
  ctx.fillText(truncarTexto(ctx, entry.name, W - MX * 2), MX, y);

  y += 56;
  ctx.fillStyle = '#a3adb2';
  ctx.font = '400 32px "JetBrains Mono"';
  ctx.fillText(new Date(entry.date).toLocaleDateString('pt-BR', {weekday:'long', day:'2-digit', month:'long'}), MX, y);

  y += 110;
  const stats = [
    {v: Math.round(entry.duration / 60), l: 'MINUTOS'},
    {v: entry.setsDone, l: 'SÉRIES'},
    {v: entry.volume, l: 'VOLUME KG'}
  ];
  const colW = (W - MX * 2) / 3;
  stats.forEach((s, i) => {
    const sx = MX + colW * i;
    ctx.fillStyle = '#b9ff3c';
    ctx.font = '600 84px "JetBrains Mono"';
    ctx.fillText(String(s.v), sx, y);
    ctx.fillStyle = '#7f898e';
    ctx.font = '600 26px "JetBrains Mono"';
    ctx.fillText(s.l, sx, y + 40);
  });

  y += 100;
  ctx.strokeStyle = '#2a3034';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(MX, y); ctx.lineTo(W - MX, y); ctx.stroke();

  if(prs.length){
    y += 70;
    ctx.fillStyle = '#9ad02f';
    ctx.font = '600 28px "JetBrains Mono"';
    ctx.fillText('RECORDES', MX, y);
    prs.slice(0, 4).forEach(p => {
      y += 64;
      ctx.fillStyle = '#eef1f0';
      ctx.font = '600 36px "Space Grotesk"';
      ctx.textAlign = 'left';
      ctx.fillText(truncarTexto(ctx, p.name, W - MX * 2 - 260), MX, y);
      ctx.fillStyle = '#b9ff3c';
      ctx.font = '600 32px "JetBrains Mono"';
      ctx.textAlign = 'right';
      ctx.fillText(p.detail, W - MX, y);
      ctx.textAlign = 'left';
    });
    y += 30;
  }

  y += 70;
  ctx.fillStyle = '#7f898e';
  ctx.font = '600 28px "JetBrains Mono"';
  ctx.fillText('SÉRIES REGISTRADAS', MX, y);
  y += 20;

  const limiteY = 1780, linhaAltura = 72;
  let mostrados = 0;
  for(const ex of entry.exercises){
    if(y + linhaAltura > limiteY) break;
    y += linhaAltura;
    ctx.fillStyle = '#eef1f0';
    ctx.font = '600 34px "Space Grotesk"';
    ctx.fillText(truncarTexto(ctx, ex.name, W - MX * 2), MX, y);
    y += 32;
    ctx.fillStyle = '#a3adb2';
    ctx.font = '400 26px "JetBrains Mono"';
    ctx.fillText(truncarTexto(ctx, ex.sets.map(s => fmtSet(s, ex.type)).join('   '), W - MX * 2), MX, y);
    mostrados++;
  }
  const restantes = entry.exercises.length - mostrados;
  if(restantes > 0){
    y += 50;
    ctx.fillStyle = '#7f898e';
    ctx.font = '400 28px "JetBrains Mono"';
    ctx.fillText('+ ' + restantes + (restantes === 1 ? ' exercício' : ' exercícios'), MX, y);
  }

  ctx.fillStyle = '#3a4247';
  ctx.font = '600 26px "JetBrains Mono"';
  ctx.textAlign = 'center';
  ctx.fillText('MEU TREINO', W / 2, 1870);

  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

async function prepararCompartilhamento(entry, prs){
  shareFile = null;
  try{
    const blob = await gerarImagemResumo(entry, prs);
    if(blob) shareFile = new File([blob], 'treino-' + entry.id + '.png', {type: 'image/png'});
  }catch(e){ shareFile = null; }
}

function baixarImagem(file){
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url; a.download = file.name;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* só pra inspecionar pelos testes se a imagem já ficou pronta */
function getShareFile(){ return shareFile; }

function compartilharResumo(){
  if(!shareFile){ toast('A imagem ainda está sendo preparada, tenta de novo em instantes'); return; }
  const podeCompartilharArquivo = typeof navigator.share === 'function' &&
    (typeof navigator.canShare !== 'function' || navigator.canShare({files: [shareFile]}));
  if(podeCompartilharArquivo){
    navigator.share({files: [shareFile], title: 'Meu Treino'}).catch(() => {});
  }else{
    baixarImagem(shareFile);
  }
}

function setOverrides(novo){ overrides = (novo && typeof novo === 'object') ? novo : {}; }
function setCustomEx(novo){ customEx = (novo && typeof novo === 'object') ? novo : {}; }
function setFavoritos(novo){ favoritos = (novo && typeof novo === 'object') ? novo : {}; }
function setSession(novo){ session = novo || null; }
/* usado só pelos testes, pra fechar uma janela de teste sem deixar o
   cronômetro da sessão ou do descanso rodando na próxima */
function pararTimers(){ clearInterval(durationInt); clearInterval(restInt); }


export {
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
};
