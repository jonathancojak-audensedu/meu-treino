/* =========================================================================
   MEU TREINO v2
   Sessão editável (ordem, troca, inclusão e exclusão de exercícios),
   descanso agendado no relógio de áudio, treino livre e recordes.
   ========================================================================= */

/* -------------------------------------------------------------------------
   1. CATÁLOGO DE EXERCÍCIOS
   type: 'reps' (carga x repetições) | 'time' (segundos) | 'dist' (metros)
   ------------------------------------------------------------------------- */
const EX = {
  supino_reto:        {name:'Supino reto barra', type:'reps', group:'peito', note:'Escápulas retraídas, cotovelo a cerca de 45 graus. Progressão: suba 2,5 a 5% quando bater RIR 2 em todas as séries por duas sessões seguidas.', alts:['supino_maquina','supino_halteres']},
  supino_maquina:     {name:'Supino em máquina pegada neutra', type:'reps', group:'peito'},
  supino_halteres:    {name:'Supino reto halteres', type:'reps', group:'peito'},
  supino_incl_hal:    {name:'Supino inclinado halteres', type:'reps', group:'peito', alts:['supino_incl_barra']},
  supino_incl_barra:  {name:'Supino inclinado barra', type:'reps', group:'peito', alts:['supino_incl_hal']},
  crucifixo:          {name:'Crucifixo halteres ou peck deck', type:'reps', group:'peito', note:'Dor no ombro: troque por cross over com cabo baixo.', alts:['crossover']},
  crossover:          {name:'Cross over cabo baixo', type:'reps', group:'peito'},

  remada_curvada:     {name:'Remada curvada barra', type:'reps', group:'costas', note:'Puxe com o cotovelo, tronco firme, sem balanço.', alts:['remada_cavalinho','remada_baixa']},
  remada_cavalinho:   {name:'Remada cavalinho apoiada', type:'reps', group:'costas'},
  remada_baixa:       {name:'Remada baixa pegada neutra', type:'reps', group:'costas'},
  remada_unilateral:  {name:'Remada unilateral halteres', type:'reps', group:'costas'},
  puxada_pronada:     {name:'Puxada pegada pronada aberta', type:'reps', group:'costas', alts:['pulldown_neutro','barra_fixa']},
  pulldown_neutro:    {name:'Pulldown pegada neutra', type:'reps', group:'costas'},
  barra_fixa:         {name:'Barra fixa ou puxada supinada', type:'reps', group:'costas', note:'Dor no ombro: troque por remada baixa neutra.', alts:['remada_baixa','pulldown_neutro']},

  desenv_militar:     {name:'Desenvolvimento militar em pé', type:'reps', group:'ombro', alts:['desenv_halteres']},
  desenv_halteres:    {name:'Desenvolvimento halteres sentado', type:'reps', group:'ombro', alts:['desenv_militar']},
  elevacao_lateral:   {name:'Elevação lateral', type:'reps', group:'ombro'},
  face_pull:          {name:'Face pull na polia', type:'reps', group:'ombro'},

  rosca_direta:       {name:'Rosca direta barra reta', type:'reps', group:'bíceps', alts:['rosca_alternada','rosca_scott']},
  rosca_alternada:    {name:'Rosca alternada halteres', type:'reps', group:'bíceps'},
  rosca_martelo:      {name:'Rosca martelo', type:'reps', group:'bíceps'},
  rosca_scott:        {name:'Rosca scott', type:'reps', group:'bíceps'},
  triceps_corda:      {name:'Tríceps corda na polia', type:'reps', group:'tríceps', alts:['triceps_testa']},
  triceps_testa:      {name:'Tríceps testa', type:'reps', group:'tríceps', alts:['triceps_corda']},
  triceps_mergulho:   {name:'Mergulho no banco ou paralelas', type:'reps', group:'tríceps'},

  fecho_pegada:       {name:'Fecho de pegada na barra fixa', type:'time', group:'pegada', note:'Trabalho direto de pegada, ligado ao handgrip fraco do laudo.'},
  farmer:             {name:'Farmer carry', type:'dist', group:'pegada', note:'Pegada firme, ombro para trás, passo curto.'},

  agachamento:        {name:'Agachamento livre barra', type:'reps', group:'quadríceps', note:'Quadril e joelho descem juntos, joelho segue a direção do pé. Dor no joelho: troque por Smith ou leg press com pés mais altos.', alts:['agach_smith','leg_press','hack']},
  agach_smith:        {name:'Agachamento no Smith', type:'reps', group:'quadríceps'},
  agach_frontal:      {name:'Agachamento frontal ou hack machine', type:'reps', group:'quadríceps', alts:['hack','agach_smith']},
  hack:               {name:'Hack machine', type:'reps', group:'quadríceps'},
  leg_press:          {name:'Leg press 45 graus', type:'reps', group:'quadríceps', alts:['leg_press_alto','hack']},
  leg_press_alto:     {name:'Leg press pés altos', type:'reps', group:'quadríceps'},
  extensora:          {name:'Cadeira extensora', type:'reps', group:'quadríceps'},
  bulgaro:            {name:'Afundo búlgaro halteres', type:'reps', group:'quadríceps', alts:['leg_press','passada']},
  passada:            {name:'Passada com halteres', type:'reps', group:'quadríceps'},

  terra_romeno:       {name:'Levantamento terra romeno', type:'reps', group:'posterior', note:'Quadril vai para trás primeiro, barra roça a perna, coluna neutra. Dor lombar: troque por cadeira flexora e glúteo na polia baixa.', alts:['stiff','flexora','gluteo_polia']},
  stiff:              {name:'Stiff halteres', type:'reps', group:'posterior'},
  flexora:            {name:'Cadeira flexora', type:'reps', group:'posterior'},
  gluteo_polia:       {name:'Glúteo na polia baixa', type:'reps', group:'posterior'},
  hip_thrust:         {name:'Hip thrust barra', type:'reps', group:'posterior', alts:['gluteo_polia']},

  panturrilha_pe:     {name:'Panturrilha em pé', type:'reps', group:'panturrilha', alts:['panturrilha_sent']},
  panturrilha_sent:   {name:'Panturrilha sentado', type:'reps', group:'panturrilha', alts:['panturrilha_pe']},

  prancha:            {name:'Prancha abdominal', type:'time', group:'core'},
  prancha_lateral:    {name:'Prancha lateral', type:'time', group:'core'},
  abdominal_polia:    {name:'Abdominal na polia', type:'reps', group:'core'}
};

/* -------------------------------------------------------------------------
   2. PROGRAMA PADRÃO
   ------------------------------------------------------------------------- */
const PROGRAM = [
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
   3. ARMAZENAMENTO
   ------------------------------------------------------------------------- */
const DB_NAME = 'meutreino', STORE = 'kv';
let dbPromise = null, dbBroken = false;

function openDB(){
  if(dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if(!('indexedDB' in window)) return reject(new Error('sem indexedDB'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }).catch(err => { dbBroken = true; throw err; });
  return dbPromise;
}

const Store = {
  async get(key){
    try{
      if(dbBroken) throw new Error('fallback');
      const db = await openDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const r = tx.objectStore(STORE).get(key);
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
    }catch(e){
      try{ const raw = localStorage.getItem('mt_' + key); return raw ? JSON.parse(raw) : undefined; }
      catch(e2){ return undefined; }
    }
  },
  async set(key, value){
    let ok = false;
    try{
      if(dbBroken) throw new Error('fallback');
      const db = await openDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      ok = true;
    }catch(e){ /* cai para o localStorage */ }
    try{ localStorage.setItem('mt_' + key, JSON.stringify(value)); ok = true; }catch(e2){ /* cota cheia */ }
    return ok;
  },
  async del(key){
    try{
      if(!dbBroken){
        const db = await openDB();
        await new Promise(resolve => {
          const tx = db.transaction(STORE, 'readwrite');
          tx.objectStore(STORE).delete(key);
          tx.oncomplete = resolve; tx.onerror = resolve;
        });
      }
    }catch(e){ /* ignora */ }
    try{ localStorage.removeItem('mt_' + key); }catch(e2){ /* ignora */ }
  }
};

/* -------------------------------------------------------------------------
   4. ESTADO
   ------------------------------------------------------------------------- */
let history = [];
let settings = {sound:true, wake:true};
let overrides = {};
let customEx = {};
let session = null;
let previewKey = null;
let durationInt = null, restInt = null;
let wakeLock = null, audioCtx = null, silentAudio = null;
let scheduledBeeps = [];
let deferredInstall = null;
let calViewDate = new Date();
let uidSeq = 1;
let lastRemoved = null;
let backdropCloser = null;

const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const defOf = id => EX[id] || customEx[id] || {name:'Exercício', type:'reps', group:''};

function mq(query){
  try{ return !!(window.matchMedia && window.matchMedia(query).matches); }
  catch(e){ return false; }
}

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
  clearTimeout(saveTimer);
  await Store.del('active_session');
  updateTrainingBadge();
}
async function saveHistory(){
  const ok = await Store.set('history', history);
  if(!ok) toast('Não consegui salvar. Exporte um backup agora.');
  return ok;
}

/* -------------------------------------------------------------------------
   6. PRESCRIÇÃO
   ------------------------------------------------------------------------- */
function programItems(key){
  const base = overrides[key] || (byKey(key) ? byKey(key).items : []);
  return base.map(it => Object.assign({}, it));
}
function newUid(){ return 'e' + (uidSeq++) + Math.random().toString(36).slice(2, 6); }
function unitOf(type){ return type === 'time' ? 's' : type === 'dist' ? 'm' : 'reps'; }
function fmtRest(sec){
  if(sec >= 60){ const m = Math.floor(sec/60), s = sec%60; return s ? m + ':' + String(s).padStart(2,'0') : m + ' min'; }
  return sec + 's';
}
function videoUrl(name){
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(name + ' execução correta técnica');
}
function daysAgo(iso){
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if(d <= 0) return 'hoje';
  if(d === 1) return 'ontem';
  return 'há ' + d + ' dias';
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

  const hasActive = !!(session && session.startedAt);
  $('resume').classList.toggle('show', hasActive);
  if(hasActive){
    const mins = Math.floor((Date.now() - session.startedAt) / 60000);
    $('resume-title').textContent = session.name + ' em andamento';
    $('resume-sub').textContent = 'iniciado ' + (mins < 1 ? 'agora há pouco' : 'há ' + mins + ' min') + ', tudo o que você registrou está salvo';
  }
  updateTrainingBadge();
}

/* -------------------------------------------------------------------------
   10. PRÉVIA
   ------------------------------------------------------------------------- */
function openPreview(key){
  previewKey = key;
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
    return '<div class="excard">' +
      '<div class="cardinner">' +
      '<div class="exhead" style="cursor:default">' +
        '<span class="exmain"><span class="idx">Exercício ' + (i+1) + '</span>' +
        '<span class="exname">' + esc(def.name) + '</span>' +
        '<span class="target">' + it.sets + ' séries · ' + esc(it.reps) + ' · RPE ' + it.rpe + ' · descanso ' + fmtRest(it.rest) + '</span>' +
        (last ? '<span class="exsummary">última vez: ' + summarizeSets(last.sets, def.type) + '</span>' : '') +
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

  $('startbar').style.display = 'block';
  $('finishbar').style.display = 'none';
  showScreen('session');
}
function summarizeSets(sets, type){
  const u = unitOf(type);
  return sets.slice(0, 4).map(s => s.w
    ? s.w + 'kg x ' + s.r + (u === 'reps' ? '' : u)
    : s.r + (u === 'reps' ? ' reps' : u)).join(' · ');
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
  $('exlist').innerHTML = session.items.map((it, i) => cardHTML(it, i)).join('') +
    '<button class="addex" data-addex="1">+ adicionar exercício</button>' +
    (session.items.length
      ? '<div class="previewnote">Arraste um exercício para a esquerda para excluir.</div>'
      : '<div class="previewnote">Nenhum exercício ainda. Toque acima para incluir o primeiro.</div>');
  $('startbar').style.display = 'none';
  $('finishbar').style.display = 'flex';
  updateStats();
  showScreen('session');
}

function cardHTML(item, pos){
  const def = defOf(item.ex);
  const log = session.log[item.uid] || [];
  const last = lastPerformance(item.ex);
  const u = unitOf(def.type);
  const doneCount = log.slice(0, item.sets).filter(s => s.done).length;
  const allDone = doneCount >= item.sets && item.sets > 0;
  const isLast = pos === session.items.length - 1;

  let rows = '';
  for(let s = 0; s < item.sets; s++){
    const entry = log[s] || {w:'', r:'', done:false};
    const prev = last && last.sets[s];
    const hint = prev ? (prev.w ? prev.w + 'kg x ' + prev.r + (u === 'reps' ? '' : u) : prev.r + (u === 'reps' ? ' reps' : u)) : '';
    rows +=
      '<div class="setrow' + (entry.done ? ' done' : '') + '">' +
        '<div class="setnum">' + (s+1) + '</div>' +
        '<div class="field">' +
          '<input type="number" inputmode="decimal" step="0.5" min="0" pattern="[0-9]*" value="' + esc(entry.w) + '" ' +
            'placeholder="' + (def.type === 'reps' ? 'kg' : 'kg opc.') + '" ' +
            'aria-label="Carga da série ' + (s+1) + ' de ' + esc(def.name) + '" data-uid="' + item.uid + '" data-s="' + s + '" data-f="w">' +
          '<div class="prevhint">' + esc(hint) + '</div>' +
        '</div>' +
        '<div class="field">' +
          '<input type="number" inputmode="numeric" step="1" min="0" pattern="[0-9]*" value="' + esc(entry.r) + '" ' +
            'placeholder="' + esc(def.type === 'reps' ? item.reps : (def.type === 'time' ? 'seg' : 'metros')) + '" ' +
            'aria-label="' + (u === 'reps' ? 'Repetições' : u === 's' ? 'Segundos' : 'Metros') + ' da série ' + (s+1) + '" data-uid="' + item.uid + '" data-s="' + s + '" data-f="r">' +
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
    '<span>' + (s.w ? esc(s.w) + '×' : '') + esc(s.r) + (u === 'reps' ? '' : u) + '</span>').join('');

  return '<div class="excard' + (allDone ? ' done collapsed' : '') + '" id="card-' + item.uid + '" data-uid="' + item.uid + '">' +
    '<div class="swipehint" aria-hidden="true">excluir</div>' +
    '<div class="cardinner">' +
    '<button class="exhead" data-toggle="' + item.uid + '" aria-expanded="' + (allDone ? 'false' : 'true') + '">' +
      '<span class="exmain">' +
        '<span class="idx">' + (allDone ? '<span class="doneflag">✓ concluído</span>' : 'Exercício ' + (pos+1)) + '</span>' +
        '<span class="exname">' + esc(def.name) + '</span>' +
        '<span class="target">' + esc(item.reps) + ' · RPE ' + item.rpe + ' · RIR ' + item.rir + ' · ' + fmtRest(item.rest) + '</span>' +
        (allDone && summary ? '<span class="exsummary">' + summary + '</span>' : '') +
      '</span>' +
      '<span class="prog">' + doneCount + '/' + item.sets + '</span>' +
    '</button>' +
    '<div class="exbody">' +
      '<div class="setrow-head"><div></div><div>Carga</div><div>' + (def.type === 'reps' ? 'Reps' : def.type === 'time' ? 'Tempo' : 'Dist.') + '</div><div></div><div></div></div>' +
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

/* -------------------------------------------------------------------------
   12. DESCANSO
   O bipe é agendado no relógio do AudioContext, então toca na hora certa
   mesmo se o navegador congelar os temporizadores em segundo plano.
   ------------------------------------------------------------------------- */
function startRest(seconds, label){
  session.rest = {endsAt: Date.now() + seconds * 1000, total: seconds, label: label};
  saveSession();
  scheduleBeep(seconds);
  startRestLoop();
}
function startRestLoop(){
  clearInterval(restInt);
  $('rest-exname').textContent = session.rest.label;
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
  $('ringprog').style.strokeDashoffset = 150.8 * (1 - pct);
  $('resttimer').classList.toggle('ending', left <= 5);
}
function endRest(){
  clearInterval(restInt);
  $('resttimer').classList.remove('show', 'ending');
  session.rest = null;
  saveSession();
  keepAudioAlive(false);
  if(!scheduledBeeps.length) beep();
  scheduledBeeps = [];
  vibrate();
}
function skipRest(){
  clearInterval(restInt);
  $('resttimer').classList.remove('show', 'ending');
  cancelScheduledBeeps();
  keepAudioAlive(false);
  if(session){ session.rest = null; saveSession(); }
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
  if(!el.dataset || el.dataset.f === undefined || !session) return;
  const uid = el.dataset.uid, s = +el.dataset.s;
  if(!session.log[uid]) session.log[uid] = [];
  if(!session.log[uid][s]) session.log[uid][s] = {w:'', r:'', done:false};
  session.log[uid][s][el.dataset.f] = el.value;
  updateStats();
  saveSession();
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
  const card = $('card-' + uid);
  const rows = card ? card.querySelectorAll('.setrow') : [];
  if(rows[s]){
    const target = rows[s].querySelector('input[data-f="r"]');
    if(target) target.value = entry.r;
  }
  updateStats();
  saveSession();
}

function toggleSet(uid, s){
  const item = itemByUid(uid);
  if(!item) return;
  if(!session.log[uid][s]) session.log[uid][s] = {w:'', r:'', done:false};
  const entry = session.log[uid][s];
  entry.done = !entry.done;

  if(entry.done){
    const prev = lastPerformance(item.ex);
    if(!entry.w && s > 0 && session.log[uid][s-1] && session.log[uid][s-1].w) entry.w = session.log[uid][s-1].w;
    else if(!entry.w && prev && prev.sets[s] && prev.sets[s].w) entry.w = prev.sets[s].w;
    if(!entry.r && s > 0 && session.log[uid][s-1] && session.log[uid][s-1].r) entry.r = session.log[uid][s-1].r;
  }

  const doneCount = session.log[uid].slice(0, item.sets).filter(x => x.done).length;
  refreshCard(uid);
  updateStats();
  saveSession();

  if(entry.done){
    startRest(item.rest, defOf(item.ex).name);
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
  const item = {
    uid: newUid(), ex: choice, sets: 3,
    reps: def.type === 'time' ? '30-45s' : def.type === 'dist' ? '30m' : '8-12',
    rpe: '8', rir: '2', rest: 90
  };
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
function pickExercise(title, suggested, replacing){
  return new Promise(resolve => {
    const el = $('sheet-backdrop');
    const list = allExercises().sort((a, b) => a.def.name.localeCompare(b.def.name, 'pt-BR'));
    const norm = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    $('sheet-body').innerHTML =
      '<div class="sheethead"><h2 id="sheet-title">' + esc(title) + '</h2>' +
      '<button class="closebtn" data-v="" aria-label="Fechar">✕</button></div>' +
      (replacing ? '<p>Substituindo ' + esc(replacing) + '. A troca vale para este treino.</p>' : '') +
      '<input class="searchbox" id="ex-search" type="search" placeholder="Buscar por nome ou grupo muscular" ' +
      'aria-label="Buscar exercício" autocomplete="off">' +
      '<div class="optlist" id="ex-options"></div>';

    const options = $('ex-options');
    function draw(filter){
      const q = norm(filter || '');
      const rows = [];
      if(!q && suggested && suggested.length){
        rows.push('<div class="optgroup">Alternativas sugeridas</div>');
        suggested.forEach(id => {
          rows.push('<button class="opt" data-v="' + id + '">' + esc(defOf(id).name) +
            '<span class="om">' + esc(defOf(id).group || '') + '</span></button>');
        });
        rows.push('<div class="optgroup">Todos os exercícios</div>');
      }
      const hits = list.filter(x => !q || norm(x.def.name).includes(q) || norm(x.def.group || '').includes(q));
      hits.forEach(x => {
        rows.push('<button class="opt" data-v="' + x.id + '">' + esc(x.def.name) +
          '<span class="om">' + esc(x.def.group || '') + (x.def.type !== 'reps' ? ' · ' + (x.def.type === 'time' ? 'tempo' : 'distância') : '') + '</span></button>');
      });
      if(!hits.length && filter && filter.trim().length > 2){
        rows.push('<button class="opt" data-new="' + esc(filter.trim()) + '">Criar "' + esc(filter.trim()) + '"' +
          '<span class="om">exercício novo, fica salvo no seu catálogo</span></button>');
      }
      options.innerHTML = rows.join('');
    }
    draw('');

    let settled = false;
    const done = v => { if(settled) return; settled = true; el.classList.remove('show'); backdropCloser = null; resolve(v || null); };
    openBackdrop(el, () => done(null), true);

    $('ex-search').addEventListener('input', ev => draw(ev.target.value));
    $('sheet-body').addEventListener('click', ev => {
      const novo = ev.target.closest('[data-new]');
      if(novo) return done(createCustomExercise(novo.dataset.new));
      const b = ev.target.closest('[data-v]');
      if(b) done(b.dataset.v);
    });
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
  let volume = 0, doneSets = 0;
  const exercises = [];

  session.items.forEach(it => {
    const def = defOf(it.ex);
    const sets = (session.log[it.uid] || []).slice(0, it.sets)
      .filter(s => s.done)
      .map(s => ({w: s.w, r: s.r}));
    if(!sets.length) return;
    doneSets += sets.length;
    if(def.type === 'reps') sets.forEach(s => { volume += (parseFloat(s.w) || 0) * (parseFloat(s.r) || 0); });
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
    exercises: exercises
  };
  const previous = history.find(h => h.key === session.key);

  const shape = i => ({ex:i.ex, sets:i.sets, reps:i.reps, rpe:i.rpe, rir:i.rir, rest:i.rest});
  const currentShape = session.items.map(shape);
  const defaultShape = programItems(session.key).map(shape);
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
      '<div class="c"><div class="v">' + mins + ' min</div><div class="l">Duração</div></div>' +
      '<div class="c"><div class="v">' + entry.setsDone + '</div><div class="l">Séries</div></div>' +
      '<div class="c"><div class="v">' + entry.volume + '</div><div class="l">Volume kg</div></div>' +
    '</div>';

  if(prs.length){
    html += '<div class="sumsection">Recordes</div><div class="prlist">' +
      prs.map(p => '<div class="pritem"><div class="n">' + esc(p.name) + '</div><div class="d">' + p.detail + (p.first ? ' · primeiro registro' : '') + '</div></div>').join('') +
      '</div>';
  }

  html += '<div class="sumsection">Séries registradas</div><div class="histcard"><div class="hdetail open" style="border:none; margin:0; padding:0;">' +
    entry.exercises.map(e =>
      '<div class="hex"><div class="hexname">' + esc(e.name) + '</div><div class="hexsets">' +
      e.sets.map(s => '<span>' + (s.w ? esc(s.w) + 'kg x ' : '') + esc(s.r) + (e.type === 'reps' ? '' : unitOf(e.type)) + '</span>').join('') +
      '</div></div>').join('') +
    '</div></div>';

  $('sumwrap').innerHTML = html;
}

/* -------------------------------------------------------------------------
   16. HISTÓRICO
   ------------------------------------------------------------------------- */
function renderHistory(){
  const list = $('histlist');
  $('hist-sub').textContent = history.length
    ? history.length + (history.length === 1 ? ' treino registrado' : ' treinos registrados')
    : 'nenhum treino ainda';

  if(!history.length){
    list.innerHTML = '<div class="empty"><div class="big">Nada por aqui ainda</div>Finalize um treino na aba Treinos para ele aparecer no histórico.</div>';
    return;
  }

  list.innerHTML = history.map(h => {
    const d = new Date(h.date);
    const dateStr = d.toLocaleDateString('pt-BR', {day:'2-digit', month:'short'}) + ' · ' + d.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
    return '<div class="histcard">' +
      '<button class="htop" data-hist="' + h.id + '" aria-expanded="false">' +
        '<span class="hname">' + esc(h.name) + '</span><span class="hdate">' + dateStr + '</span>' +
      '</button>' +
      '<div class="hstats">' +
        '<div><div class="v">' + Math.round(h.duration/60) + ' min</div><div class="l">Duração</div></div>' +
        '<div><div class="v">' + h.volume + ' kg</div><div class="l">Volume</div></div>' +
        '<div><div class="v">' + h.setsDone + '</div><div class="l">Séries</div></div>' +
      '</div>' +
      '<div class="hdetail" id="hd-' + h.id + '">' +
        (h.exercises || []).map(e =>
          '<div class="hex"><div class="hexname">' + esc(e.name) + '</div><div class="hexsets">' +
          (e.sets || []).map(s => '<span>' + (s.w ? esc(s.w) + 'kg x ' : '') + esc(s.r) + (e.type === 'reps' ? '' : unitOf(e.type)) + '</span>').join('') +
          '</div></div>').join('') +
        '<div style="margin-top:12px"><button class="minibtn danger" data-delhist="' + h.id + '">Apagar este treino</button></div>' +
      '</div></div>';
  }).join('');
}

async function deleteHistory(id){
  const ok = await askConfirm({title:'Apagar este treino?', text:'Ele sai do histórico e das comparações de progressão.', confirmLabel:'Apagar', danger:true});
  if(!ok) return;
  history = history.filter(h => h.id !== id);
  await saveHistory();
  renderHistory(); renderHome();
  toast('Treino apagado');
}

/* -------------------------------------------------------------------------
   17. CALENDÁRIO
   ------------------------------------------------------------------------- */
function openCalendar(){
  calViewDate = new Date();
  openBackdrop($('calmodal'));
  renderCalendar();
}
function renderCalendar(){
  const year = calViewDate.getFullYear(), month = calViewDate.getMonth();
  const label = calViewDate.toLocaleDateString('pt-BR', {month:'long', year:'numeric'});
  $('cal-monthlabel').textContent = label.charAt(0).toUpperCase() + label.slice(1);

  const days = {};
  history.forEach(h => {
    const d = new Date(h.date);
    if(d.getFullYear() !== year || d.getMonth() !== month) return;
    const k = d.getDate();
    if(!days[k]) days[k] = {count:0, block:h.block || 'upper'};
    days[k].count++;
  });

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  let html = ['D','S','T','Q','Q','S','S'].map(d => '<div class="dow">' + d + '</div>').join('');
  for(let i = 0; i < firstDow; i++) html += '<div class="calday empty"></div>';
  for(let day = 1; day <= daysInMonth; day++){
    const info = days[day];
    const cls = info ? (info.count >= 2 ? 'double' : info.block) : '';
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
    html += '<div class="calday ' + cls + (isToday ? ' today' : '') + '">' + day +
      (info && info.count >= 2 ? '<span class="star" aria-hidden="true">★</span>' : '') + '</div>';
  }
  $('cal-grid').innerHTML = html;

  const total = Object.values(days).reduce((a, d) => a + d.count, 0);
  const doubles = Object.values(days).filter(d => d.count >= 2).length;
  $('cal-summary').textContent = total + (total === 1 ? ' treino registrado em ' : ' treinos registrados em ') + label +
    (doubles ? ' · ' + doubles + (doubles === 1 ? ' dia dourado' : ' dias dourados') : '');
}

/* -------------------------------------------------------------------------
   18. FOLHAS, CONFIRMAÇÃO E TOAST
   ------------------------------------------------------------------------- */
function openBackdrop(el, onClose, skipFocus){
  el.classList.add('show');
  backdropCloser = () => { el.classList.remove('show'); backdropCloser = null; if(onClose) onClose(); };
  el.onclick = e => { if(e.target === el) backdropCloser(); };
  if(!skipFocus){
    const focusable = el.querySelector('button, input, a');
    if(focusable) setTimeout(() => focusable.focus(), 40);
  }
}
document.addEventListener('keydown', e => { if(e.key === 'Escape' && backdropCloser) backdropCloser(); });

function askConfirm(opts){
  return new Promise(resolve => {
    const el = $('sheet-backdrop');
    $('sheet-body').innerHTML =
      '<h2 id="sheet-title">' + esc(opts.title) + '</h2>' +
      '<p>' + esc(opts.text || '') + '</p>' +
      '<div class="sheetact">' +
        (opts.hideCancel ? '' : '<button class="btn-ghost" data-r="0">Voltar</button>') +
        '<button class="' + (opts.danger ? 'btn-danger' : 'btn-primary') + '" data-r="1">' + esc(opts.confirmLabel || 'Confirmar') + '</button>' +
      '</div>';
    let settled = false;
    const done = v => { if(settled) return; settled = true; el.classList.remove('show'); backdropCloser = null; resolve(v); };
    openBackdrop(el, () => done(false));
    $('sheet-body').querySelectorAll('[data-r]').forEach(b => b.onclick = () => done(b.dataset.r === '1'));
  });
}

let toastTimer = null;
function toast(msg, actionLabel, cb){
  const t = $('toast');
  t.innerHTML = '<span>' + esc(msg) + '</span>' +
    (actionLabel ? '<button class="toastact" id="toast-act">' + esc(actionLabel) + '</button>' : '');
  t.classList.add('show');
  if(actionLabel && cb) $('toast-act').onclick = () => { t.classList.remove('show'); cb(); };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), actionLabel ? 5000 : 2800);
}

/* -------------------------------------------------------------------------
   19. BACKUP
   ------------------------------------------------------------------------- */
function exportBackup(){
  const payload = {app:'meu-treino', version:2, exportedAt:new Date().toISOString(), history:history, overrides:overrides, customEx:customEx};
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'meu-treino-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast('Backup gerado');
}

async function importBackup(file){
  let data;
  try{ data = JSON.parse(await file.text()); }
  catch(e){ return askConfirm({title:'Arquivo inválido', text:'Não consegui ler esse arquivo. Use um backup exportado pelo próprio app.', confirmLabel:'Entendi', hideCancel:true}); }
  if(!data || !Array.isArray(data.history)){
    return askConfirm({title:'Arquivo inválido', text:'Esse JSON não tem um histórico de treinos dentro.', confirmLabel:'Entendi', hideCancel:true});
  }
  const ok = await askConfirm({
    title: 'Restaurar ' + data.history.length + ' treinos?',
    text: 'O histórico atual (' + history.length + ') será substituído pelo do arquivo.',
    confirmLabel: 'Restaurar', danger: true
  });
  if(!ok) return;
  history = data.history;
  if(data.overrides){ overrides = data.overrides; await Store.set('overrides', overrides); }
  if(data.customEx){ customEx = data.customEx; await Store.set('custom_ex', customEx); }
  await saveHistory();
  renderHistory(); renderHome();
  toast('Backup restaurado');
}

async function wipeAll(){
  const ok = await askConfirm({title:'Apagar todo o histórico?', text:'Todos os treinos registrados serão removidos deste aparelho. Não tem como desfazer.', confirmLabel:'Apagar tudo', danger:true});
  if(!ok) return;
  history = [];
  await saveHistory();
  await clearSession();
  renderHistory(); renderHome();
  toast('Histórico apagado');
}

async function resetProgram(){
  const ok = await askConfirm({title:'Restaurar programa original?', text:'As montagens salvas como padrão voltam ao Upper Lower original. O histórico não é afetado.', confirmLabel:'Restaurar'});
  if(!ok) return;
  overrides = {};
  await Store.set('overrides', overrides);
  renderHome();
  toast('Programa restaurado');
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
  if(!card || e.target.closest('input, a, .checkbtn, .stepper, .minibtn, .addex')) return;
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
    removeItem(swipe.card.dataset.uid);
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
});

$('btn-begin').onclick = beginSession;
$('btn-cancel').onclick = cancelWorkout;
$('btn-finish').onclick = finishWorkout;
$('session-back').onclick = leaveSession;
$('btn-sum-done').onclick = () => { showScreen('home'); renderHome(); };
$('rest-add').onclick = () => addRest(15);
$('rest-skip').onclick = skipRest;
$('resume-go').onclick = resumeSession;
$('resume-drop').onclick = cancelWorkout;

$('nav-home').onclick = () => { renderHome(); showScreen('home'); };
$('nav-history').onclick = () => { renderHistory(); showScreen('history'); };
$('nav-settings').onclick = () => showScreen('settings');

$('btn-calendar').onclick = openCalendar;
$('cal-close').onclick = () => backdropCloser && backdropCloser();
$('cal-prev').onclick = () => { calViewDate.setMonth(calViewDate.getMonth() - 1); renderCalendar(); };
$('cal-next').onclick = () => { calViewDate.setMonth(calViewDate.getMonth() + 1); renderCalendar(); };

$('btn-export').onclick = exportBackup;
$('btn-import').onclick = () => $('file-import').click();
$('file-import').onchange = e => { const f = e.target.files[0]; if(f) importBackup(f); e.target.value = ''; };
$('btn-wipe').onclick = wipeAll;
$('btn-resetprog').onclick = resetProgram;

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
  const [h, s, active, ov, cx] = await Promise.all([
    Store.get('history'), Store.get('settings'), Store.get('active_session'),
    Store.get('overrides'), Store.get('custom_ex')
  ]);
  history = Array.isArray(h) ? h : [];
  if(s && typeof s === 'object') settings = Object.assign(settings, s);
  if(ov && typeof ov === 'object') overrides = ov;
  if(cx && typeof cx === 'object') customEx = cx;
  $('sw-sound').setAttribute('aria-checked', settings.sound ? 'true' : 'false');
  $('sw-wake').setAttribute('aria-checked', settings.wake ? 'true' : 'false');

  // sessões no formato antigo (sem items) são descartadas
  if(active && active.startedAt && Array.isArray(active.items) && (Date.now() - active.startedAt) < 12 * 3600 * 1000){
    session = active;
  }else if(active){
    await Store.del('active_session');
  }

  renderHome();
  renderHistory();
  updateStorageLabel();

  if('serviceWorker' in navigator){
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  if(navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
}

function updateStorageLabel(){
  const standalone = mq('(display-mode: standalone)') || window.navigator.standalone === true;
  let label = dbBroken ? 'salvando no armazenamento local do navegador' : 'salvando em banco local no aparelho';
  if(!standalone) label += ' · instale na tela de início para não perder dados';
  $('storage-label').textContent = label;
}

/* atalho para inspecionar o estado pelo console do navegador durante um treino */
window.MT = {
  get session(){ return session; },
  get history(){ return history; },
  get settings(){ return settings; },
  get overrides(){ return overrides; }
};

boot();
