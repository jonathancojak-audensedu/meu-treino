/* =========================================================================
   MEU TREINO v2
   Sessão editável (ordem, troca, inclusão e exclusão de exercícios),
   descanso agendado no relógio de áudio, treino livre e recordes.
   ========================================================================= */

/* Número que recebe o feedback pelo WhatsApp (wa.me), só dígitos com DDI e DDD. */
const FEEDBACK_NUMERO = '5581986501624';

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

  fecho_pegada:       {name:'Fecho de pegada na barra fixa', type:'time', group:'pegada', note:'Trabalho direto de pegada e antebraço. Segure a barra o máximo que aguentar, sem balançar.'},
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
  abdominal_polia:    {name:'Abdominal na polia', type:'reps', group:'core'},

  esteira_inclinada:  {name:'Esteira caminhada inclinada', type:'cardio', group:'cardio'},
  esteira_corrida:    {name:'Esteira corrida', type:'cardio', group:'cardio'},
  bike_ergometrica:   {name:'Bicicleta ergométrica', type:'cardio', group:'cardio'},
  eliptico:           {name:'Elíptico', type:'cardio', group:'cardio'},
  remo_ergometro:     {name:'Remo ergômetro', type:'cardio', group:'cardio'},
  escada_ergometrica: {name:'Escada ergométrica', type:'cardio', group:'cardio'},
  corda_pular:        {name:'Corda', type:'cardio', group:'cardio'},
  caminhada_externa:  {name:'Caminhada ao ar livre', type:'cardio', group:'cardio'},

  supino_declinado:        {name:'Supino declinado barra', type:'reps', group:'peito'},
  crucifixo_inclinado:     {name:'Crucifixo inclinado halteres', type:'reps', group:'peito'},
  peck_deck:               {name:'Peck deck (voador)', type:'reps', group:'peito'},
  pullover:                {name:'Pullover halteres', type:'reps', group:'costas'},
  supino_halteres_unilateral: {name:'Supino unilateral com halteres', type:'reps', group:'peito'},
  crossover_unilateral:    {name:'Crossover unilateral na polia', type:'reps', group:'peito'},
  flexao_declinada:        {name:'Flexão declinada', type:'reps', group:'peito'},
  flexao_joelho:           {name:'Flexão com joelho apoiado', type:'reps', group:'peito'},
  supino_maquina_convergente: {name:'Supino em máquina convergente', type:'reps', group:'peito'},

  desenvolvimento_arnold:  {name:'Desenvolvimento Arnold', type:'reps', group:'ombro'},
  elevacao_frontal:        {name:'Elevação frontal', type:'reps', group:'ombro'},
  crucifixo_inverso:       {name:'Crucifixo inverso', type:'reps', group:'ombro'},
  remada_alta:             {name:'Remada alta barra', type:'reps', group:'ombro'},
  remada_alta_halteres:    {name:'Remada alta com halteres', type:'reps', group:'ombro'},
  desenv_halteres_unilateral: {name:'Desenvolvimento unilateral com halteres', type:'reps', group:'ombro'},
  elevacao_lateral_unilateral: {name:'Elevação lateral unilateral', type:'reps', group:'ombro'},
  elevacao_frontal_unilateral: {name:'Elevação frontal unilateral', type:'reps', group:'ombro'},
  desenvolvimento_maquina: {name:'Desenvolvimento de ombro na máquina', type:'reps', group:'ombro'},

  remada_serrote:          {name:'Remada serrote', type:'reps', group:'costas'},
  remada_t:                {name:'Remada T', type:'reps', group:'costas'},
  encolhimento_trapezio:   {name:'Encolhimento de trapézio', type:'reps', group:'costas'},
  remada_baixa_unilateral: {name:'Remada baixa unilateral na polia', type:'reps', group:'costas'},
  remada_maquina_unilateral: {name:'Remada unilateral na máquina', type:'reps', group:'costas'},
  puxada_unilateral:       {name:'Puxada unilateral na polia', type:'reps', group:'costas'},
  remada_barra_supinada:   {name:'Remada curvada pegada supinada', type:'reps', group:'costas'},

  rosca_concentrada:       {name:'Rosca concentrada', type:'reps', group:'bíceps'},
  rosca_inversa:           {name:'Rosca inversa barra', type:'reps', group:'bíceps'},
  rosca_21:                {name:'Rosca 21', type:'reps', group:'bíceps'},
  rosca_punho:             {name:'Rosca de punho', type:'reps', group:'bíceps'},
  rosca_unilateral_halteres: {name:'Rosca direta unilateral com halter', type:'reps', group:'bíceps'},
  rosca_martelo_unilateral: {name:'Rosca martelo unilateral', type:'reps', group:'bíceps'},
  rosca_scott_unilateral:  {name:'Rosca Scott unilateral', type:'reps', group:'bíceps'},
  rosca_barra_w:           {name:'Rosca com barra W', type:'reps', group:'bíceps'},
  rosca_zottman:           {name:'Rosca Zottman', type:'reps', group:'bíceps'},
  triceps_frances:         {name:'Tríceps francês', type:'reps', group:'tríceps'},
  triceps_banco:           {name:'Tríceps no banco', type:'reps', group:'tríceps'},
  triceps_unilateral:      {name:'Tríceps unilateral na polia', type:'reps', group:'tríceps'},
  triceps_corda_unilateral: {name:'Tríceps corda unilateral', type:'reps', group:'tríceps'},
  triceps_frances_unilateral: {name:'Tríceps francês unilateral', type:'reps', group:'tríceps'},
  triceps_testa_unilateral: {name:'Tríceps testa unilateral', type:'reps', group:'tríceps'},
  triceps_coice:           {name:'Tríceps coice halteres', type:'reps', group:'tríceps'},

  agachamento_sumo:        {name:'Agachamento sumô', type:'reps', group:'quadríceps'},
  leg_press_unilateral:    {name:'Leg press unilateral', type:'reps', group:'quadríceps'},
  cadeira_adutora:         {name:'Cadeira adutora', type:'reps', group:'quadríceps'},
  cadeira_abdutora:        {name:'Cadeira abdutora', type:'reps', group:'posterior'},
  panturrilha_leg_press:   {name:'Panturrilha no leg press', type:'reps', group:'panturrilha'},
  terra_convencional:      {name:'Levantamento terra convencional', type:'reps', group:'posterior'},
  terra_sumo:              {name:'Levantamento terra sumô', type:'reps', group:'posterior'},
  avanco_smith:            {name:'Avanço no Smith', type:'reps', group:'quadríceps'},
  hack_unilateral:         {name:'Hack machine unilateral', type:'reps', group:'quadríceps'},
  extensora_unilateral:    {name:'Cadeira extensora unilateral', type:'reps', group:'quadríceps'},
  flexora_unilateral:      {name:'Cadeira flexora unilateral', type:'reps', group:'posterior'},
  rdl_unilateral:          {name:'Levantamento terra romeno unilateral', type:'reps', group:'posterior'},
  hip_thrust_unilateral:   {name:'Hip thrust unilateral', type:'reps', group:'posterior'},
  ponte_gluteo_unilateral: {name:'Ponte de glúteo unilateral', type:'reps', group:'posterior'},
  elevacao_pelvica_maquina: {name:'Elevação pélvica em máquina', type:'reps', group:'posterior'},
  afundo_halteres_caminhando: {name:'Afundo caminhando com halteres', type:'reps', group:'quadríceps'},
  bulgaro_smith:           {name:'Agachamento búlgaro no Smith', type:'reps', group:'quadríceps'},
  agachamento_taca:        {name:'Agachamento taça', type:'reps', group:'quadríceps'},
  step_up:                 {name:'Step up com halteres', type:'reps', group:'quadríceps'},
  afundo_reverso:          {name:'Afundo reverso peso corporal', type:'reps', group:'quadríceps'},
  good_morning_barra:      {name:'Good morning com barra', type:'reps', group:'posterior'},
  gluteo_4_apoios:         {name:'Glúteo em 4 apoios', type:'reps', group:'posterior'},
  gluteo_caneleira:        {name:'Glúteo com caneleira', type:'reps', group:'posterior'},
  panturrilha_unilateral_corpo: {name:'Panturrilha unilateral peso corporal', type:'reps', group:'panturrilha'},
  panturrilha_smith:       {name:'Panturrilha no Smith', type:'reps', group:'panturrilha'},
  panturrilha_burro:       {name:'Panturrilha burro', type:'reps', group:'panturrilha'},

  abdominal_infra:         {name:'Abdominal infra', type:'reps', group:'core'},
  elevacao_pernas_suspenso: {name:'Elevação de pernas suspenso', type:'reps', group:'core'},
  roda_abdominal:          {name:'Roda abdominal', type:'reps', group:'core'},
  prancha_elevacao_membro: {name:'Prancha com elevação de membro', type:'time', group:'core'},
  abdominal_bicicleta:     {name:'Abdominal bicicleta', type:'reps', group:'core'},
  abdominal_canivete:      {name:'Abdominal canivete', type:'reps', group:'core'},
  prancha_dinamica:        {name:'Prancha dinâmica', type:'time', group:'core'},
  russian_twist:           {name:'Abdominal russo', type:'reps', group:'core'},
  superman:                {name:'Superman', type:'reps', group:'core'},
  hiperextensao_banco:     {name:'Hiperextensão no banco romano', type:'reps', group:'core'},
  abdominal_maquina:       {name:'Abdominal na máquina', type:'reps', group:'core'},

  farmer_unilateral:       {name:'Farmer carry unilateral', type:'dist', group:'pegada'}
};

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
let favoritos = {};
let session = null;
let previewKey = null;
let editState = null;
let durationInt = null, restInt = null;
let restExpanded = false;
let wakeLock = null, audioCtx = null, silentAudio = null;
let scheduledBeeps = [];
let deferredInstall = null;
let calViewDate = new Date();
let historyTab = 'lista';
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
  restExpanded = false;
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
function shapeOf(i){
  const base = {ex:i.ex, sets:i.sets, reps:i.reps, rpe:i.rpe, rir:i.rir, rest:i.rest};
  if(i.duracaoSeg != null) base.duracaoSeg = i.duracaoSeg;
  return base;
}
function newUid(){ return 'e' + (uidSeq++) + Math.random().toString(36).slice(2, 6); }
function unitOf(type){ return type === 'time' ? 's' : type === 'dist' ? 'm' : type === 'cardio' ? 'min' : 'reps'; }
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

  $('btn-editprog').style.display = w ? 'block' : 'none';
  $('startbar').style.display = 'flex';
  $('finishbar').style.display = 'none';
  $('editbar').style.display = 'none';
  showScreen('session');
}
function fmtSet(s, type){
  if(type === 'cardio') return (s.w ? esc(s.w) + 'km · ' : '') + esc(s.r) + 'min';
  const u = unitOf(type);
  return s.w
    ? esc(s.w) + 'kg x ' + esc(s.r) + (u === 'reps' ? '' : u)
    : esc(s.r) + (u === 'reps' ? ' reps' : u);
}
function summarizeSets(sets, type){
  return sets.slice(0, 4).map(s => fmtSet(s, type)).join(' · ');
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
          '<input type="number" inputmode="decimal" step="0.5" min="0" pattern="[0-9]*" value="' + esc(entry.w) + '" ' +
            'placeholder="' + (def.type === 'reps' ? 'kg' : def.type === 'cardio' ? 'km opc.' : 'kg opc.') + '" ' +
            'aria-label="' + (def.type === 'cardio' ? 'Distância' : 'Carga') + ' da série ' + (s+1) + ' de ' + esc(def.name) + '" data-uid="' + item.uid + '" data-s="' + s + '" data-f="w">' +
          '<div class="prevhint">' + hint + '</div>' +
        '</div>' +
        '<div class="field">' +
          '<input type="number" inputmode="numeric" step="1" min="0" pattern="[0-9]*" value="' + esc(entry.r) + '" ' +
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
    const optRow = x => {
      const fav = !!favoritos[x.id];
      return '<button class="opt" data-v="' + x.id + '">' +
        '<span class="optmain">' + esc(x.def.name) +
          '<span class="om">' + esc(x.def.group || '') + (x.def.type !== 'reps' ? ' · ' + (x.def.type === 'time' ? 'tempo' : x.def.type === 'cardio' ? 'cardio' : 'distância') : '') + '</span>' +
        '</span>' +
        '<span class="star' + (fav ? ' fav' : '') + '" data-star="' + x.id + '" role="button" aria-label="' + (fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos') + '">★</span>' +
      '</button>';
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
        rows.push('<button class="opt" data-new="' + esc(filter.trim()) + '">Criar "' + esc(filter.trim()) + '"' +
          '<span class="om">exercício novo, fica salvo no seu catálogo</span></button>');
      }
      options.innerHTML = rows.join('');
    }
    draw('');

    let settled = false;
    const done = v => { if(settled) return; settled = true; el.classList.remove('show'); backdropCloser = null; resolve(v || null); };
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
      '<div class="c"><div class="v">' + mins + ' min</div><div class="l">Duração</div></div>' +
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
        (h.cardioMin ? '<div><div class="v">' + h.cardioMin + ' min</div><div class="l">Cardio</div></div>' : '') +
      '</div>' +
      '<div class="hdetail" id="hd-' + h.id + '">' +
        (h.exercises || []).map(e =>
          '<div class="hex"><div class="hexname">' + esc(e.name) + '</div><div class="hexsets">' +
          (e.sets || []).map(s => '<span>' + fmtSet(s, e.type) + '</span>').join('') +
          '</div></div>').join('') +
        '<div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap">' +
          '<button class="minibtn" data-editdata="' + h.id + '">Editar data e horário</button>' +
          '<button class="minibtn danger" data-delhist="' + h.id + '">Apagar este treino</button>' +
        '</div>' +
      '</div></div>';
  }).join('');
}

function editarDataTreino(id){
  const entry = history.find(h => h.id === id);
  if(!entry) return;
  const d = new Date(entry.date);
  const pad = n => String(n).padStart(2, '0');
  const dataVal = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const horaVal = pad(d.getHours()) + ':' + pad(d.getMinutes());
  const hoje = new Date();
  const dataMax = hoje.getFullYear() + '-' + pad(hoje.getMonth() + 1) + '-' + pad(hoje.getDate());

  const el = $('sheet-backdrop');
  $('sheet-body').innerHTML =
    '<div class="sheethead"><h2 id="sheet-title">Editar data e horário</h2>' +
    '<button class="closebtn" data-fechar="1" aria-label="Fechar">✕</button></div>' +
    '<p>Ajusta quando esse treino aconteceu de verdade. Serve pra registrar um treino que você esqueceu de fechar na hora.</p>' +
    '<div class="onb-opts">' +
      '<input class="onb-input" id="ed-data" type="date" max="' + dataMax + '" value="' + dataVal + '">' +
      '<input class="onb-input" id="ed-hora" type="time" value="' + horaVal + '">' +
    '</div>' +
    '<div class="sheetact" style="margin-top:16px">' +
      '<button class="btn-ghost" data-fechar="1">Cancelar</button>' +
      '<button class="btn-primary" id="ed-salvar">Salvar</button>' +
    '</div>';
  openBackdrop(el, null, true);
  $('sheet-body').querySelectorAll('[data-fechar]').forEach(b => b.onclick = () => backdropCloser && backdropCloser());
  $('ed-salvar').onclick = async () => {
    const dataStr = $('ed-data').value, horaStr = $('ed-hora').value;
    if(!dataStr || !horaStr){ toast('Preencha data e horário'); return; }
    const nova = new Date(dataStr + 'T' + horaStr);
    if(isNaN(nova.getTime())){ toast('Data inválida'); return; }
    if(nova.getTime() > Date.now()){ toast('A data não pode ser no futuro'); return; }
    entry.date = nova.toISOString();
    history.sort((a, b) => new Date(b.date) - new Date(a.date));
    await saveHistory();
    if(backdropCloser) backdropCloser();
    renderHistory();
    renderHome();
    toast('Data atualizada');
  };
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
   16b. EVOLUÇÃO
   ------------------------------------------------------------------------- */
function exerciciosComHistorico(){
  const vistos = new Set();
  const out = [];
  for(const h of history){
    for(const e of (h.exercises || [])){
      if(!vistos.has(e.exId)){
        vistos.add(e.exId);
        out.push({exId: e.exId, name: e.name, type: e.type});
      }
    }
  }
  return out;
}
function melhorValorDaSessao(sets, type){
  let melhor = null;
  for(const s of sets){
    const v = parseFloat(type === 'reps' ? s.w : s.r);
    if(isNaN(v) || v <= 0) continue;
    if(melhor == null || v > melhor) melhor = v;
  }
  return melhor;
}
function serieTemporalDoExercicio(exId){
  const out = [];
  for(let i = history.length - 1; i >= 0; i--){
    const h = history[i];
    const found = (h.exercises || []).find(e => e.exId === exId);
    if(!found || !found.sets || !found.sets.length) continue;
    const valor = melhorValorDaSessao(found.sets, found.type);
    if(valor == null) continue;
    out.push({date: h.date, valor: valor});
  }
  return out;
}
function unidadeCarga(type){ return type === 'time' ? 's' : type === 'dist' ? 'm' : 'kg'; }
function estatisticasEvolucao(serie){
  let cargaMaxima = null, dataMaxima = null;
  serie.forEach(p => { if(cargaMaxima == null || p.valor >= cargaMaxima){ cargaMaxima = p.valor; dataMaxima = p.date; } });

  const ultimo = serie[serie.length - 1];
  const corte = new Date(ultimo.date).getTime() - 30 * 86400000;
  let referencia = null;
  for(const p of serie){ if(new Date(p.date).getTime() <= corte) referencia = p; }
  const variacao30d = referencia ? Math.round(((ultimo.valor - referencia.valor) / referencia.valor) * 1000) / 10 : null;

  return {cargaMaxima, dataMaxima, variacao30d};
}
function descreverTendencia(serie, tipo){
  const u = unidadeCarga(tipo);
  const primeiro = serie[0], ultimo = serie[serie.length - 1];
  const fmtData = iso => new Date(iso).toLocaleDateString('pt-BR', {day:'2-digit', month:'long'});
  const variacao = primeiro.valor ? Math.round(((ultimo.valor - primeiro.valor) / primeiro.valor) * 1000) / 10 : 0;
  const tendencia = variacao > 0 ? 'alta' : variacao < 0 ? 'queda' : 'estável';
  return 'Evolução de ' + primeiro.valor + ' ' + u + ' em ' + fmtData(primeiro.date) + ' para ' + ultimo.valor + ' ' + u + ' em ' + fmtData(ultimo.date) + ', ' + tendencia +
    (variacao ? ' de ' + Math.abs(variacao).toFixed(1).replace('.', ',') + '%' : '');
}
function svgEvolucao(serie, tipo){
  const W = 300, H = 150, padL = 34, padR = 10, padT = 14, padB = 22;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const valores = serie.map(p => p.valor);
  const minV = Math.min(...valores), maxV = Math.max(...valores);
  const span = maxV - minV || 1;
  const n = serie.length;
  const x = i => padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = v => padT + (1 - (v - minV) / span) * plotH;
  const u = unidadeCarga(tipo);

  const pontos = serie.map((p, i) => ({x: x(i), y: y(p.valor)}));
  const linha = pontos.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ');
  const circulos = pontos.map(p => '<circle class="ponto" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="3"></circle>').join('');

  const rotulosX = n <= 6 ? serie.map((_, i) => i) : [0, Math.floor((n - 1) / 2), n - 1];
  const fmtData = iso => new Date(iso).toLocaleDateString('pt-BR', {day:'2-digit', month:'short'});
  const ancoraX = i => i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle';
  const textosX = rotulosX.map(i => '<text x="' + x(i).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="' + ancoraX(i) + '">' + fmtData(serie[i].date) + '</text>').join('');

  const textosY =
    '<text x="4" y="' + (padT + 4) + '">' + Math.round(maxV) + ' ' + u + '</text>' +
    '<text x="4" y="' + (padT + plotH) + '">' + Math.round(minV) + ' ' + u + '</text>';

  const grade = '<line class="grade" x1="' + padL + '" y1="' + (padT + plotH) + '" x2="' + (padL + plotW) + '" y2="' + (padT + plotH) + '"></line>';

  return '<svg class="evochart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(descreverTendencia(serie, tipo)) + '">' +
    grade + textosY + '<path class="linha" d="' + linha + '"></path>' + circulos + textosX +
  '</svg>';
}
function renderEvolucao(){
  const list = $('evolist');
  const exs = exerciciosComHistorico();
  if(!exs.length){
    list.innerHTML = '<div class="empty"><div class="big">Nada por aqui ainda</div>Finalize um treino para começar a ver a evolução dos exercícios.</div>';
    return;
  }
  list.innerHTML = exs.map(ex => {
    const serie = serieTemporalDoExercicio(ex.exId);
    const u = unidadeCarga(ex.type);
    let corpo;
    if(serie.length < 2){
      corpo = '<div class="previewnote">Menos de 2 sessões registradas ainda. Volte depois de treinar esse exercício mais uma vez.</div>';
    }else{
      const stats = estatisticasEvolucao(serie);
      const dataRecorde = new Date(stats.dataMaxima).toLocaleDateString('pt-BR', {day:'2-digit', month:'short'});
      const variacaoTxt = stats.variacao30d == null ? '—' : (stats.variacao30d > 0 ? '+' : '') + stats.variacao30d.toFixed(1).replace('.', ',') + '%';
      corpo = svgEvolucao(serie, ex.type) +
        '<div class="hstats">' +
          '<div><div class="v">' + stats.cargaMaxima + ' ' + u + '</div><div class="l">Carga máxima</div></div>' +
          '<div><div class="v">' + dataRecorde + '</div><div class="l">Data do recorde</div></div>' +
          '<div><div class="v">' + variacaoTxt + '</div><div class="l">30 dias</div></div>' +
        '</div>';
    }
    const ultima = serie.length ? serie[serie.length - 1] : null;
    return '<div class="histcard">' +
      '<button class="htop" data-evo="' + ex.exId + '" aria-expanded="false">' +
        '<span class="hname">' + esc(ex.name) + '</span>' +
        '<span class="hdate">' + (ultima ? ultima.valor + ' ' + u : '') + '</span>' +
      '</button>' +
      '<div class="hdetail" id="evo-' + ex.exId + '">' + corpo + '</div>' +
    '</div>';
  }).join('');
}
function showHistoryTab(tab){
  historyTab = tab;
  $('tab-lista').classList.toggle('active', tab === 'lista');
  $('tab-evolucao').classList.toggle('active', tab === 'evolucao');
  $('histlist').style.display = tab === 'lista' ? '' : 'none';
  $('evolist').style.display = tab === 'evolucao' ? '' : 'none';
  if(tab === 'evolucao') renderEvolucao();
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
  const payload = {app:'meu-treino', version:3, exportedAt:new Date().toISOString(), history:history, overrides:overrides, customEx:customEx, profile:profile, corpo:corpo, program:PROGRAM, favoritos:favoritos};
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
  if(data.profile){ profile = data.profile; await Store.set('profile', profile); atualizarAjustes(); }
  if(Array.isArray(data.program) && data.program.length){ PROGRAM = data.program; await Store.set('program', PROGRAM); }
  if(data.corpo){ corpo = data.corpo; await Store.set('corpo', corpo); atualizarAjustes(); }
  if(data.favoritos){ favoritos = data.favoritos; await Store.set('favoritos', favoritos); }
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
$('cal-close').onclick = () => backdropCloser && backdropCloser();
$('cal-prev').onclick = () => { calViewDate.setMonth(calViewDate.getMonth() - 1); renderCalendar(); };
$('cal-next').onclick = () => { calViewDate.setMonth(calViewDate.getMonth() + 1); renderCalendar(); };

$('btn-export').onclick = exportBackup;
$('btn-import').onclick = () => $('file-import').click();
$('file-import').onchange = e => { const f = e.target.files[0]; if(f) importBackup(f); e.target.value = ''; };
$('btn-wipe').onclick = wipeAll;
$('btn-resetprog').onclick = refazerPrograma;

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
  const [h, s, active, ov, cx, pf, cp, pg, fv] = await Promise.all([
    Store.get('history'), Store.get('settings'), Store.get('active_session'),
    Store.get('overrides'), Store.get('custom_ex'), Store.get('profile'), Store.get('corpo'),
    Store.get('program'), Store.get('favoritos')
  ]);
  if(Array.isArray(pg) && pg.length) PROGRAM = pg;
  profile = (pf && typeof pf === 'object') ? pf : null;
  corpo = (cp && typeof cp === 'object') ? cp : null;
  history = Array.isArray(h) ? h : [];
  if(s && typeof s === 'object') settings = Object.assign(settings, s);
  if(ov && typeof ov === 'object') overrides = ov;
  if(cx && typeof cx === 'object') customEx = cx;
  if(fv && typeof fv === 'object') favoritos = fv;
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
  atualizarAjustes();
  prepararFeedback();
  if(!profile) abrirOnboarding(false);

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
  const standalone = mq('(display-mode: standalone)') || window.navigator.standalone === true;
  const msg = 'Feedback do Meu Treino\n' +
    'Versão: ' + versao + '\n' +
    'Modo: ' + (standalone ? 'instalado' : 'navegador') + '\n' +
    'Aparelho: ' + navigator.userAgent + '\n\n' +
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
   GERADOR DE PROGRAMA
   Função pura: entra o perfil, sai o programa. Não toca em tela nem em
   armazenamento, o que permite testar sem abrir o navegador.
   ========================================================================= */

/* Metadados do catálogo -----------------------------------------------------
   p  padrão de movimento        e  equipamento exigido (todos)
   m  músculos {nome: peso}      s  articulações exigidas (exclusão por dor)
   c  complexidade 1 a 3         u  unilateral
   --------------------------------------------------------------------------- */
const META = {
  supino_reto:       {p:'emp_h', m:{peito:1, triceps:.5, ombro:.5}, e:['barra','banco'], s:['ombro','punho'], c:3},
  supino_maquina:    {p:'emp_h', m:{peito:1, triceps:.5}, e:['maquina'], s:[], c:1},
  supino_halteres:   {p:'emp_h', m:{peito:1, triceps:.5, ombro:.5}, e:['halter','banco'], s:['ombro'], c:2},
  supino_incl_hal:   {p:'emp_h', m:{peito:1, ombro:.5, triceps:.5}, e:['halter','banco'], s:['ombro'], c:2},
  supino_incl_barra: {p:'emp_h', m:{peito:1, ombro:.5, triceps:.5}, e:['barra','banco'], s:['ombro','punho'], c:3},
  crucifixo:         {p:'emp_h', m:{peito:1}, e:['halter','banco'], s:['ombro'], c:2},
  crossover:         {p:'emp_h', m:{peito:1}, e:['polia'], s:['ombro'], c:1},
  flexao:            {p:'emp_h', m:{peito:1, triceps:.5, ombro:.5}, e:['corpo'], s:['punho','ombro'], c:1},
  flexao_inclinada:  {p:'emp_h', m:{peito:1, triceps:.5}, e:['corpo'], s:['punho'], c:1},
  flexao_elastico:   {p:'emp_h', m:{peito:1, triceps:.5}, e:['elastico'], s:['punho'], c:1},

  desenv_militar:    {p:'emp_v', m:{ombro:1, triceps:.5}, e:['barra'], s:['ombro','punho','lombar'], c:3},
  desenv_halteres:   {p:'emp_v', m:{ombro:1, triceps:.5}, e:['halter'], s:['ombro'], c:2},
  desenv_elastico:   {p:'emp_v', m:{ombro:1, triceps:.5}, e:['elastico'], s:['ombro'], c:1},
  pike_pushup:       {p:'emp_v', m:{ombro:1, triceps:.5}, e:['corpo'], s:['ombro','punho'], c:2},

  remada_curvada:    {p:'pux_h', m:{costas:1, biceps:.5}, e:['barra'], s:['lombar'], c:3},
  remada_cavalinho:  {p:'pux_h', m:{costas:1, biceps:.5}, e:['maquina'], s:[], c:2},
  remada_baixa:      {p:'pux_h', m:{costas:1, biceps:.5}, e:['polia'], s:[], c:1},
  remada_unilateral: {p:'pux_h', m:{costas:1, biceps:.5}, e:['halter','banco'], s:[], c:2, u:true},
  remada_halteres:   {p:'pux_h', m:{costas:1, biceps:.5}, e:['halter'], s:['lombar'], c:2},
  remada_invertida:  {p:'pux_h', m:{costas:1, biceps:.5}, e:['corpo'], s:[], c:1},
  remada_elastico:   {p:'pux_h', m:{costas:1, biceps:.5}, e:['elastico'], s:[], c:1},

  puxada_pronada:    {p:'pux_v', m:{costas:1, biceps:.5}, e:['polia'], s:['ombro'], c:1},
  pulldown_neutro:   {p:'pux_v', m:{costas:1, biceps:.5}, e:['polia'], s:[], c:1},
  barra_fixa:        {p:'pux_v', m:{costas:1, biceps:.5}, e:['barra_fixa'], s:['ombro','cotovelo'], c:3},
  puxada_elastico:   {p:'pux_v', m:{costas:1, biceps:.5}, e:['elastico'], s:[], c:1},

  elevacao_lateral:  {p:'lateral', m:{ombro:1}, e:['halter'], s:['ombro'], c:1},
  lateral_elastico:  {p:'lateral', m:{ombro:1}, e:['elastico'], s:['ombro'], c:1},
  face_pull:         {p:'lateral', m:{ombro:1, costas:.5}, e:['polia'], s:[], c:1},

  rosca_direta:      {p:'biceps', m:{biceps:1}, e:['barra'], s:['punho','cotovelo'], c:1},
  rosca_alternada:   {p:'biceps', m:{biceps:1}, e:['halter'], s:['cotovelo'], c:1},
  rosca_martelo:     {p:'biceps', m:{biceps:1}, e:['halter'], s:['cotovelo'], c:1},
  rosca_scott:       {p:'biceps', m:{biceps:1}, e:['barra','banco'], s:['cotovelo','punho'], c:1},
  rosca_elastico:    {p:'biceps', m:{biceps:1}, e:['elastico'], s:['cotovelo'], c:1},

  triceps_corda:     {p:'triceps', m:{triceps:1}, e:['polia'], s:['cotovelo'], c:1},
  triceps_testa:     {p:'triceps', m:{triceps:1}, e:['halter','banco'], s:['cotovelo'], c:2},
  triceps_mergulho:  {p:'triceps', m:{triceps:1, peito:.5}, e:['corpo'], s:['ombro','punho'], c:2},
  flexao_diamante:   {p:'triceps', m:{triceps:1, peito:.5}, e:['corpo'], s:['punho','cotovelo'], c:1},
  triceps_elastico:  {p:'triceps', m:{triceps:1}, e:['elastico'], s:['cotovelo'], c:1},

  agachamento:       {p:'joelho', m:{quadriceps:1, gluteos:.5, core:.5}, e:['barra'], s:['joelho','lombar'], c:3},
  agach_smith:       {p:'joelho', m:{quadriceps:1, gluteos:.5}, e:['smith'], s:['joelho'], c:2},
  agach_frontal:     {p:'joelho', m:{quadriceps:1, core:.5}, e:['barra'], s:['joelho','punho'], c:3},
  hack:              {p:'joelho', m:{quadriceps:1, gluteos:.5}, e:['maquina'], s:['joelho'], c:1},
  leg_press:         {p:'joelho', m:{quadriceps:1, gluteos:.5}, e:['maquina'], s:['joelho'], c:1},
  leg_press_alto:    {p:'joelho', m:{quadriceps:.5, gluteos:1}, e:['maquina'], s:['joelho'], c:1},
  extensora:         {p:'joelho', m:{quadriceps:1}, e:['maquina'], s:['joelho'], c:1},
  bulgaro:           {p:'joelho', m:{quadriceps:1, gluteos:1}, e:['halter','banco'], s:['joelho'], c:2, u:true},
  passada:           {p:'joelho', m:{quadriceps:1, gluteos:1}, e:['halter'], s:['joelho'], c:2, u:true},
  agach_corpo:       {p:'joelho', m:{quadriceps:1, gluteos:.5}, e:['corpo'], s:['joelho'], c:1},
  afundo_corpo:      {p:'joelho', m:{quadriceps:1, gluteos:1}, e:['corpo'], s:['joelho'], c:1, u:true},
  agach_bulgaro_corpo:{p:'joelho', m:{quadriceps:1, gluteos:1}, e:['corpo'], s:['joelho'], c:2, u:true},

  terra_romeno:      {p:'quadril', m:{posterior:1, gluteos:1, lombar:.5}, e:['barra'], s:['lombar'], c:3},
  stiff:             {p:'quadril', m:{posterior:1, gluteos:.5}, e:['halter'], s:['lombar'], c:2},
  flexora:           {p:'quadril', m:{posterior:1}, e:['maquina'], s:['joelho'], c:1},
  gluteo_polia:      {p:'quadril', m:{gluteos:1}, e:['polia'], s:[], c:1, u:true},
  hip_thrust:        {p:'quadril', m:{gluteos:1, posterior:.5}, e:['barra','banco'], s:[], c:2},
  ponte_gluteo:      {p:'quadril', m:{gluteos:1, posterior:.5}, e:['corpo'], s:[], c:1},
  elevacao_pelvica:  {p:'quadril', m:{gluteos:1, posterior:.5}, e:['corpo','banco'], s:[], c:1},
  good_morning_elast:{p:'quadril', m:{posterior:1, gluteos:.5}, e:['elastico'], s:['lombar'], c:1},

  panturrilha_pe:    {p:'panturrilha', m:{panturrilha:1}, e:['maquina'], s:['tornozelo'], c:1},
  panturrilha_sent:  {p:'panturrilha', m:{panturrilha:1}, e:['maquina'], s:['tornozelo'], c:1},
  panturrilha_corpo: {p:'panturrilha', m:{panturrilha:1}, e:['corpo'], s:['tornozelo'], c:1},
  panturrilha_halter:{p:'panturrilha', m:{panturrilha:1}, e:['halter'], s:['tornozelo'], c:1},

  prancha:           {p:'core', m:{core:1}, e:['corpo'], s:['ombro'], c:1},
  prancha_lateral:   {p:'core', m:{core:1}, e:['corpo'], s:['ombro'], c:1},
  abdominal_polia:   {p:'core', m:{core:1}, e:['polia'], s:[], c:1},
  abdominal_solo:    {p:'core', m:{core:1}, e:['corpo'], s:[], c:1},
  bird_dog:          {p:'core', m:{core:1}, e:['corpo'], s:[], c:1},

  fecho_pegada:      {p:'pegada', m:{}, e:['barra_fixa'], s:['cotovelo','punho'], c:1},
  farmer:            {p:'pegada', m:{core:.5}, e:['halter'], s:['punho'], c:1},

  esteira_inclinada:  {p:'cardio', m:{}, e:['cardio'], s:[], c:1},
  esteira_corrida:    {p:'cardio', m:{}, e:['cardio'], s:['joelho','tornozelo'], c:1},
  bike_ergometrica:   {p:'cardio', m:{}, e:['cardio'], s:['joelho'], c:1},
  eliptico:           {p:'cardio', m:{}, e:['cardio'], s:[], c:1},
  remo_ergometro:     {p:'cardio', m:{}, e:['cardio'], s:['lombar'], c:1},
  escada_ergometrica: {p:'cardio', m:{}, e:['cardio'], s:['joelho'], c:1},
  corda_pular:        {p:'cardio', m:{}, e:['corpo'], s:['joelho','tornozelo'], c:1},
  caminhada_externa:  {p:'cardio', m:{}, e:['corpo'], s:[], c:1},

  supino_declinado:        {p:'emp_h', m:{peito:1, triceps:.5, ombro:.2}, e:['barra','banco'], s:['ombro','punho'], c:3},
  crucifixo_inclinado:     {p:'emp_h', m:{peito:1, ombro:.3}, e:['halter','banco'], s:['ombro'], c:2},
  peck_deck:               {p:'emp_h', m:{peito:1}, e:['maquina'], s:['ombro'], c:1},
  pullover:                {p:'pux_v', m:{costas:.7, peito:.5, triceps:.3}, e:['halter','banco'], s:['ombro'], c:2},
  supino_halteres_unilateral: {p:'emp_h', m:{peito:1, triceps:.5, ombro:.5}, e:['halter','banco'], s:['ombro'], c:2, u:true},
  crossover_unilateral:    {p:'emp_h', m:{peito:1}, e:['polia'], s:['ombro'], c:1, u:true},
  flexao_declinada:        {p:'emp_h', m:{peito:1, ombro:1, triceps:.5}, e:['corpo','banco'], s:['punho','ombro'], c:2},
  flexao_joelho:           {p:'emp_h', m:{peito:1, triceps:.5, ombro:.3}, e:['corpo'], s:['punho'], c:1},
  supino_maquina_convergente: {p:'emp_h', m:{peito:1, triceps:.5}, e:['maquina'], s:[], c:1},

  desenvolvimento_arnold:  {p:'emp_v', m:{ombro:1, triceps:.5}, e:['halter'], s:['ombro'], c:2},
  elevacao_frontal:        {p:'lateral', m:{ombro:1}, e:['halter'], s:['ombro'], c:1},
  crucifixo_inverso:       {p:'lateral', m:{ombro:1, costas:.3}, e:['halter'], s:['ombro'], c:1},
  remada_alta:             {p:'lateral', m:{ombro:1, costas:.3}, e:['barra'], s:['ombro','punho'], c:2},
  remada_alta_halteres:    {p:'lateral', m:{ombro:1, costas:.3}, e:['halter'], s:['ombro','punho'], c:2},
  desenv_halteres_unilateral: {p:'emp_v', m:{ombro:1, triceps:.5}, e:['halter'], s:['ombro'], c:2, u:true},
  elevacao_lateral_unilateral: {p:'lateral', m:{ombro:1}, e:['halter'], s:['ombro'], c:1, u:true},
  elevacao_frontal_unilateral: {p:'lateral', m:{ombro:1}, e:['halter'], s:['ombro'], c:1, u:true},
  desenvolvimento_maquina: {p:'emp_v', m:{ombro:1, triceps:.5}, e:['maquina'], s:['ombro'], c:1},

  remada_serrote:          {p:'pux_h', m:{costas:1, biceps:.5}, e:['halter','banco'], s:[], c:2, u:true},
  remada_t:                {p:'pux_h', m:{costas:1, biceps:.5}, e:['maquina'], s:['lombar'], c:2},
  encolhimento_trapezio:   {p:'trapezio', m:{costas:1}, e:['barra'], s:[], c:1},
  remada_baixa_unilateral: {p:'pux_h', m:{costas:1, biceps:.5}, e:['polia'], s:[], c:2, u:true},
  remada_maquina_unilateral: {p:'pux_h', m:{costas:1, biceps:.5}, e:['maquina'], s:[], c:2, u:true},
  puxada_unilateral:       {p:'pux_v', m:{costas:1, biceps:.5}, e:['polia'], s:['ombro'], c:2, u:true},
  remada_barra_supinada:   {p:'pux_h', m:{costas:1, biceps:1}, e:['barra'], s:['lombar','cotovelo'], c:3},

  rosca_concentrada:       {p:'biceps', m:{biceps:1}, e:['halter','banco'], s:['cotovelo'], c:1},
  rosca_inversa:           {p:'biceps', m:{biceps:1}, e:['barra'], s:['punho','cotovelo'], c:1},
  rosca_21:                {p:'biceps', m:{biceps:1}, e:['barra'], s:['cotovelo','punho'], c:2},
  rosca_punho:             {p:'punho', m:{}, e:['halter','banco'], s:['punho'], c:1},
  rosca_unilateral_halteres: {p:'biceps', m:{biceps:1}, e:['halter'], s:['cotovelo'], c:1, u:true},
  rosca_martelo_unilateral: {p:'biceps', m:{biceps:1}, e:['halter'], s:['cotovelo'], c:1, u:true},
  rosca_scott_unilateral:  {p:'biceps', m:{biceps:1}, e:['halter','banco'], s:['cotovelo'], c:1, u:true},
  rosca_barra_w:           {p:'biceps', m:{biceps:1}, e:['barra'], s:['punho','cotovelo'], c:1},
  rosca_zottman:           {p:'biceps', m:{biceps:1}, e:['halter'], s:['punho','cotovelo'], c:2},
  triceps_frances:         {p:'triceps', m:{triceps:1}, e:['halter'], s:['cotovelo','ombro'], c:2},
  triceps_banco:           {p:'triceps', m:{triceps:1, peito:.3}, e:['corpo','banco'], s:['ombro','punho'], c:1},
  triceps_unilateral:      {p:'triceps', m:{triceps:1}, e:['polia'], s:['cotovelo'], c:1, u:true},
  triceps_corda_unilateral: {p:'triceps', m:{triceps:1}, e:['polia'], s:['cotovelo'], c:1, u:true},
  triceps_frances_unilateral: {p:'triceps', m:{triceps:1}, e:['halter'], s:['cotovelo','ombro'], c:2, u:true},
  triceps_testa_unilateral: {p:'triceps', m:{triceps:1}, e:['halter'], s:['cotovelo'], c:2, u:true},
  triceps_coice:           {p:'triceps', m:{triceps:1}, e:['halter','banco'], s:['cotovelo'], c:1, u:true},

  agachamento_sumo:        {p:'quadril', m:{gluteos:1, quadriceps:.7, posterior:.3}, e:['barra'], s:['joelho','lombar'], c:3},
  leg_press_unilateral:    {p:'joelho', m:{quadriceps:1, gluteos:.5}, e:['maquina'], s:['joelho'], c:2, u:true},
  cadeira_adutora:         {p:'quadril', m:{gluteos:.5}, e:['maquina'], s:['joelho'], c:1},
  cadeira_abdutora:        {p:'quadril', m:{gluteos:1}, e:['maquina'], s:['joelho'], c:1},
  panturrilha_leg_press:   {p:'panturrilha', m:{panturrilha:1}, e:['maquina'], s:['tornozelo'], c:1},
  terra_convencional:      {p:'quadril', m:{posterior:1, gluteos:1, lombar:.7, quadriceps:.3}, e:['barra'], s:['lombar','joelho'], c:3},
  terra_sumo:              {p:'quadril', m:{gluteos:1, posterior:.7, quadriceps:.5, lombar:.5}, e:['barra'], s:['lombar','joelho'], c:3},
  avanco_smith:            {p:'joelho', m:{quadriceps:1, gluteos:1}, e:['smith'], s:['joelho'], c:2, u:true},
  hack_unilateral:         {p:'joelho', m:{quadriceps:1, gluteos:.5}, e:['maquina'], s:['joelho'], c:2, u:true},
  extensora_unilateral:    {p:'joelho', m:{quadriceps:1}, e:['maquina'], s:['joelho'], c:1, u:true},
  flexora_unilateral:      {p:'quadril', m:{posterior:1}, e:['maquina'], s:['joelho'], c:1, u:true},
  rdl_unilateral:          {p:'quadril', m:{posterior:1, gluteos:1}, e:['halter'], s:['lombar','joelho'], c:3, u:true},
  hip_thrust_unilateral:   {p:'quadril', m:{gluteos:1, posterior:.5}, e:['halter'], s:['joelho'], c:2, u:true},
  ponte_gluteo_unilateral: {p:'quadril', m:{gluteos:1, posterior:.5}, e:['corpo'], s:[], c:1, u:true},
  elevacao_pelvica_maquina: {p:'quadril', m:{gluteos:1, posterior:.3}, e:['maquina'], s:[], c:1},
  afundo_halteres_caminhando: {p:'joelho', m:{quadriceps:1, gluteos:1}, e:['halter'], s:['joelho'], c:2, u:true},
  bulgaro_smith:           {p:'joelho', m:{quadriceps:1, gluteos:1}, e:['smith'], s:['joelho'], c:2, u:true},
  agachamento_taca:        {p:'joelho', m:{quadriceps:1, gluteos:.5, core:.3}, e:['halter'], s:['joelho'], c:1},
  step_up:                 {p:'joelho', m:{quadriceps:1, gluteos:1}, e:['halter','banco'], s:['joelho'], c:2, u:true},
  afundo_reverso:          {p:'joelho', m:{quadriceps:1, gluteos:1}, e:['corpo'], s:['joelho'], c:1, u:true},
  good_morning_barra:      {p:'quadril', m:{posterior:1, gluteos:.5, lombar:.5}, e:['barra'], s:['lombar'], c:3},
  gluteo_4_apoios:         {p:'quadril', m:{gluteos:1}, e:['corpo'], s:[], c:1},
  gluteo_caneleira:        {p:'quadril', m:{gluteos:1}, e:['corpo'], s:[], c:1, u:true},
  panturrilha_unilateral_corpo: {p:'panturrilha', m:{panturrilha:1}, e:['corpo'], s:['tornozelo'], c:1, u:true},
  panturrilha_smith:       {p:'panturrilha', m:{panturrilha:1}, e:['smith'], s:['tornozelo'], c:1},
  panturrilha_burro:       {p:'panturrilha', m:{panturrilha:1}, e:['maquina'], s:['tornozelo'], c:2},

  abdominal_infra:         {p:'core', m:{core:1}, e:['corpo'], s:['lombar'], c:1},
  elevacao_pernas_suspenso: {p:'core', m:{core:1}, e:['barra_fixa'], s:['ombro','lombar'], c:2},
  roda_abdominal:          {p:'core', m:{core:1, ombro:.3}, e:['corpo'], s:['lombar','ombro'], c:3},
  prancha_elevacao_membro: {p:'core', m:{core:1, gluteos:.3}, e:['corpo'], s:['ombro'], c:2},
  abdominal_bicicleta:     {p:'core', m:{core:1}, e:['corpo'], s:['lombar'], c:1},
  abdominal_canivete:      {p:'core', m:{core:1}, e:['corpo'], s:['lombar'], c:2},
  prancha_dinamica:        {p:'core', m:{core:1, ombro:.3}, e:['corpo'], s:['ombro'], c:2},
  russian_twist:           {p:'core', m:{core:1}, e:['corpo'], s:['lombar'], c:1},
  superman:                {p:'core', m:{core:1}, e:['corpo'], s:['lombar'], c:1},
  hiperextensao_banco:     {p:'core', m:{core:1, posterior:.5}, e:['maquina'], s:['lombar'], c:2},
  abdominal_maquina:       {p:'core', m:{core:1}, e:['maquina'], s:[], c:1},

  farmer_unilateral:       {p:'pegada', m:{core:.5}, e:['halter'], s:['punho'], c:1, u:true}
};

/* isolamento: nunca deve ocupar o lugar de exercício principal */
['crucifixo','crossover','elevacao_lateral','lateral_elastico','face_pull','rosca_direta','rosca_alternada',
 'rosca_martelo','rosca_scott','rosca_elastico','triceps_corda','triceps_testa','triceps_elastico',
 'flexao_diamante','extensora','flexora','gluteo_polia','panturrilha_pe','panturrilha_sent','panturrilha_corpo',
 'panturrilha_halter','prancha','prancha_lateral','abdominal_polia','abdominal_solo','bird_dog',
 'fecho_pegada','farmer',
 'peck_deck','crossover_unilateral','elevacao_frontal','crucifixo_inverso','elevacao_lateral_unilateral',
 'elevacao_frontal_unilateral','encolhimento_trapezio','rosca_concentrada','rosca_punho','triceps_coice',
 'cadeira_adutora','cadeira_abdutora','extensora_unilateral','flexora_unilateral','gluteo_4_apoios',
 'gluteo_caneleira','abdominal_infra','elevacao_pernas_suspenso','roda_abdominal','prancha_elevacao_membro',
 'abdominal_bicicleta','abdominal_canivete','prancha_dinamica','russian_twist','superman','abdominal_maquina'
].forEach(id => { if(META[id]) META[id].iso = true; });

/* qualidade do equipamento, para não preferir elástico onde existe barra */
const NIVEL_EQUIP = {elastico:1, corpo:2, maquina:3, smith:3, polia:3, banco:3, cardio:3, halter:4, barra:5, barra_fixa:5};
Object.keys(META).forEach(id => {
  META[id].nivel = Math.max.apply(null, META[id].e.map(eq => NIVEL_EQUIP[eq] || 2));
});

/* exercícios que ainda não existem no catálogo principal */
const EX_EXTRA = {
  flexao:             {name:'Flexão de braço', type:'reps', group:'peito'},
  flexao_inclinada:   {name:'Flexão com mãos apoiadas', type:'reps', group:'peito', note:'Quanto mais alto o apoio, mais fácil. Comece na altura que você faz 8 repetições limpas.'},
  flexao_elastico:    {name:'Supino com elástico', type:'reps', group:'peito'},
  desenv_elastico:    {name:'Desenvolvimento com elástico', type:'reps', group:'ombro'},
  pike_pushup:        {name:'Flexão pike', type:'reps', group:'ombro', note:'Quadril alto, corpo em V. É a flexão que vira desenvolvimento de ombro.'},
  remada_halteres:    {name:'Remada curvada com halteres', type:'reps', group:'costas'},
  remada_invertida:   {name:'Remada invertida', type:'reps', group:'costas', note:'Use uma barra baixa, mesa firme ou o corrimão. Quanto mais deitado, mais difícil.'},
  remada_elastico:    {name:'Remada com elástico', type:'reps', group:'costas'},
  puxada_elastico:    {name:'Puxada alta com elástico', type:'reps', group:'costas'},
  lateral_elastico:   {name:'Elevação lateral com elástico', type:'reps', group:'ombro'},
  rosca_elastico:     {name:'Rosca com elástico', type:'reps', group:'bíceps'},
  triceps_elastico:   {name:'Tríceps com elástico', type:'reps', group:'tríceps'},
  flexao_diamante:    {name:'Flexão diamante', type:'reps', group:'tríceps'},
  agach_corpo:        {name:'Agachamento peso corporal', type:'reps', group:'quadríceps'},
  afundo_corpo:       {name:'Afundo peso corporal', type:'reps', group:'quadríceps'},
  agach_bulgaro_corpo:{name:'Agachamento búlgaro peso corporal', type:'reps', group:'quadríceps'},
  ponte_gluteo:       {name:'Ponte de glúteo', type:'reps', group:'posterior'},
  elevacao_pelvica:   {name:'Elevação pélvica apoiada no banco', type:'reps', group:'posterior'},
  good_morning_elast: {name:'Good morning com elástico', type:'reps', group:'posterior'},
  panturrilha_corpo:  {name:'Panturrilha em pé sem carga', type:'reps', group:'panturrilha', note:'Faça em um degrau para aumentar a amplitude.'},
  panturrilha_halter: {name:'Panturrilha em pé com halteres', type:'reps', group:'panturrilha'},
  abdominal_solo:     {name:'Abdominal no solo', type:'reps', group:'core'},
  bird_dog:           {name:'Bird dog', type:'time', group:'core', note:'Braço e perna opostos, sem deixar o quadril girar. Bom para lombar sensível.'}
};

/* equipamento disponível em cada lugar */
const EQUIP = {
  academia: ['corpo','halter','barra','banco','barra_fixa','polia','maquina','smith','elastico','cardio'],
  simples:  ['corpo','halter','barra','banco','barra_fixa','polia','elastico'],
  casa:     ['corpo','halter','banco','elastico'],
  corpo:    ['corpo']
};

/* parâmetros por objetivo e papel do exercício */
const PARAMS = {
  forca: {
    principal:{sets:4, reps:'4-6',  rpe:'8',   rir:'2',   rest:180},
    acessorio:{sets:3, reps:'6-8',  rpe:'8',   rir:'2',   rest:120},
    isolado:  {sets:3, reps:'8-12', rpe:'8',   rir:'2',   rest:75}
  },
  hipertrofia: {
    principal:{sets:4, reps:'6-8',  rpe:'7-8', rir:'2-3', rest:150},
    acessorio:{sets:3, reps:'8-12', rpe:'8',   rir:'2',   rest:90},
    isolado:  {sets:3, reps:'12-15',rpe:'8-9', rir:'1-2', rest:60}
  },
  emagrecer: {
    principal:{sets:4, reps:'6-10', rpe:'7-8', rir:'2-3', rest:90},
    acessorio:{sets:3, reps:'10-12',rpe:'8',   rir:'2',   rest:60},
    isolado:  {sets:3, reps:'12-15',rpe:'8-9', rir:'1-2', rest:45}
  },
  saude: {
    principal:{sets:3, reps:'8-12', rpe:'7',   rir:'3',   rest:90},
    acessorio:{sets:3, reps:'10-12',rpe:'7-8', rir:'2-3', rest:75},
    isolado:  {sets:2, reps:'12-15',rpe:'8',   rir:'2',   rest:45}
  }
};

/* quantos exercícios cabem no tempo informado */
const TETO_EXERCICIOS = {30:4, 45:5, 60:6, 90:8};

/* divisões por dia disponível */
const MODELOS = {
  full_A: {nome:'Corpo inteiro A', block:'full', slots:[['emp_h','principal'],['pux_h','principal'],['joelho','principal'],['quadril','acessorio'],['lateral','isolado'],['core','isolado']]},
  full_B: {nome:'Corpo inteiro B', block:'full', slots:[['emp_v','principal'],['pux_v','principal'],['quadril','principal'],['joelho','acessorio'],['biceps','isolado'],['triceps','isolado']]},
  full_C: {nome:'Corpo inteiro C', block:'full', slots:[['emp_h','acessorio'],['pux_h','acessorio'],['joelho','acessorio'],['quadril','acessorio'],['lateral','isolado'],['core','isolado']]},
  upper_A:{nome:'Superiores A', block:'upper', slots:[['emp_h','principal'],['pux_h','principal'],['emp_v','acessorio'],['pux_v','acessorio'],['lateral','isolado'],['biceps','isolado'],['triceps','isolado']]},
  upper_B:{nome:'Superiores B', block:'upper', slots:[['pux_v','principal'],['emp_v','principal'],['pux_h','acessorio'],['emp_h','acessorio'],['lateral','isolado'],['triceps','isolado'],['biceps','isolado']]},
  lower_A:{nome:'Inferiores A', block:'lower', slots:[['joelho','principal'],['quadril','acessorio'],['joelho','acessorio'],['quadril','acessorio'],['panturrilha','isolado'],['core','isolado']]},
  lower_B:{nome:'Inferiores B', block:'lower', slots:[['quadril','principal'],['joelho','acessorio'],['quadril','acessorio'],['joelho','acessorio'],['panturrilha','isolado'],['core','isolado']]},
  push:   {nome:'Empurrar', block:'upper', slots:[['emp_h','principal'],['emp_v','principal'],['emp_h','acessorio'],['lateral','isolado'],['triceps','isolado'],['triceps','isolado']]},
  pull:   {nome:'Puxar', block:'upper', slots:[['pux_v','principal'],['pux_h','principal'],['pux_h','acessorio'],['pux_v','acessorio'],['biceps','isolado'],['biceps','isolado']]},
  legs:   {nome:'Pernas', block:'lower', slots:[['joelho','principal'],['quadril','principal'],['joelho','acessorio'],['quadril','acessorio'],['panturrilha','isolado'],['core','isolado']]}
};

const SPLITS = {
  2:['full_A','full_B'],
  3:['full_A','full_B','full_C'],
  4:['upper_A','lower_A','upper_B','lower_B'],
  5:['upper_A','lower_A','upper_B','lower_B','full_A'],
  6:['upper_A','lower_A','upper_B','lower_B','full_A','full_B']
};

/* sem equipamento não existe puxada vertical nem rosca, então PPL não fecha */
const SPLITS_CORPO = {
  2:['full_A','full_B'],
  3:['full_A','full_B','full_C'],
  4:['upper_A','lower_A','upper_B','lower_B'],
  5:['upper_A','lower_A','upper_B','lower_B','full_A'],
  6:['upper_A','lower_A','upper_B','lower_B','full_A','full_B']
};

/* ordem de recurso quando um espaço do treino fica sem candidato */
const RESERVA = ['emp_h','pux_h','joelho','quadril','core','emp_v','triceps','lateral','biceps','panturrilha'];

const AQUECIMENTOS = {
  upper:'5 minutos de bike, remo ou corda. Rotação de ombro com bastão ou elástico, 2x10. Uma série leve do primeiro exercício antes de começar valendo.',
  lower:'5 minutos de bike ou caminhada inclinada. Mobilidade de quadril e tornozelo, 2x30s de cada lado. Uma série de agachamento peso corporal, 2x10.',
  full:'5 minutos de caminhada, bike ou polichinelo. Mobilidade de ombro e quadril, 2x10 de cada. Uma série leve do primeiro exercício antes de começar valendo.'
};

/* -------------------------------------------------------------------------
   Seleção de exercício para um espaço do treino
   ------------------------------------------------------------------------- */
function candidatos(padrao, perfil){
  const disp = EQUIP[perfil.local] || EQUIP.academia;
  const dores = (perfil.dores || []).filter(d => d !== 'nenhuma');
  const maxC = perfil.experiencia === 'iniciante' ? 2 : 3;
  return Object.keys(META).filter(id => {
    const t = META[id];
    if(t.p !== padrao) return false;
    if(t.c > maxC) return false;
    if(!t.e.every(eq => disp.indexOf(eq) !== -1)) return false;
    if(t.s.some(art => dores.indexOf(art) !== -1)) return false;
    return true;
  });
}

const ALVO_COMPLEXIDADE = {principal:3, acessorio:2, isolado:1, cardio:1};

function escolherExercicio(padrao, papel, perfil, usados, noDia){
  const lista = candidatos(padrao, perfil).filter(id => (noDia || []).indexOf(id) === -1);
  if(!lista.length) return null;
  const prio = perfil.prioridade || [];
  const alvo = ALVO_COMPLEXIDADE[papel];
  const melhorNivel = Math.max.apply(null, lista.map(id => META[id].nivel));
  const pontuado = lista.map(id => {
    const t = META[id];
    let pt = 0;
    // variedade só vale entre equipamentos equivalentes: elástico não substitui polia
    if(usados.indexOf(id) === -1 && t.nivel >= melhorNivel - 1) pt += 30;
    if(usados.indexOf(id) !== -1) pt -= 10;
    if(t.iso && papel !== 'isolado') pt -= 60;                     // isolamento não substitui composto
    if(!t.iso && papel === 'isolado') pt -= 12;
    pt += t.nivel * 7;                                             // usa o melhor equipamento disponível
    pt += (3 - Math.abs(alvo - t.c)) * 4;
    if(prio.some(g => grupoBate(g, t.m))) pt += 8;
    if(t.u && papel === 'principal') pt -= 6;
    return {id: id, pt: pt};
  });
  pontuado.sort((a, b) => b.pt - a.pt || (a.id < b.id ? -1 : 1));
  return pontuado[0].id;
}

function grupoBate(grupo, musculos){
  const mapa = {peito:['peito'], costas:['costas'], ombro:['ombro'], bracos:['biceps','triceps'],
                gluteos:['gluteos'], pernas:['quadriceps','posterior','gluteos'], core:['core']};
  const alvos = mapa[grupo] || [grupo];
  return alvos.some(a => (musculos[a] || 0) >= 1);
}

/* -------------------------------------------------------------------------
   Montagem
   ------------------------------------------------------------------------- */
function ajustarSeries(base, papel, perfil){
  let s = base;
  if(perfil.experiencia === 'iniciante') s = Math.max(2, s - 1);
  if(perfil.experiencia === 'avancado' && papel === 'principal') s += 1;
  return s;
}

function repsDoTipo(tipo, reps){
  if(tipo === 'time') return '30-45s';
  if(tipo === 'dist') return '30m';
  return reps;
}

function tempoEstimado(itens){
  // 5 min de aquecimento mais série a série, contando execução e descanso.
  // cardio é um bloco contínuo, não série x descanso, então usa a duração própria.
  return 300 + itens.reduce((a, i) => {
    if(defOf(i.ex).type === 'cardio') return a + (i.duracaoSeg || 0);
    return a + i.sets * (40 + i.rest);
  }, 0);
}

/* cardio entra ao fim da sessão só para emagrecer e saúde; o ponto fixo dentro
   da faixa mostrada (15-25min / 10-15min) é reservado do orçamento de tempo
   antes de decidir quantos exercícios de musculação cabem */
const CARDIO_MINUTOS = {emagrecer: 20, saude: 12};
const CARDIO_FAIXA = {emagrecer: '15-25min', saude: '10-15min'};

function gerarPrograma(perfil){
  const objetivo = PARAMS[perfil.objetivo] ? perfil.objetivo : 'hipertrofia';
  const tabela = perfil.local === 'corpo' ? SPLITS_CORPO : SPLITS;
  const dias = tabela[Number(perfil.dias)] || tabela[3];
  const teto = TETO_EXERCICIOS[Number(perfil.tempo)] || 6;
  const limite = (Number(perfil.tempo) || 60) * 60;
  const temCardio = objetivo === 'emagrecer' || objetivo === 'saude';
  // em sessoes curtas, o cardio completo nao cabe sobrando espaco pra musculacao,
  // entao ele cede parte do seu tempo (nunca mais de ~35% do total da sessao)
  const cardioSeg = temCardio ? Math.min(CARDIO_MINUTOS[objetivo] * 60, Math.round(limite * 0.35)) : 0;
  const limiteMusc = temCardio ? limite - cardioSeg : limite;
  const usados = [];
  const programa = [];

  dias.forEach((modeloId, i) => {
    const modelo = MODELOS[modeloId];
    const itens = [];

    modelo.slots.forEach(([padrao, papel]) => {
      if(itens.length >= teto) return;
      const id = escolherExercicio(padrao, papel, perfil, usados, itens.map(x => x.ex));
      if(!id) return;                                  // sem opção viável, o espaço fica vazio
      usados.push(id);
      const def = EX[id] || EX_EXTRA[id];
      const par = PARAMS[objetivo][papel];
      itens.push({
        ex: id,
        sets: ajustarSeries(par.sets, papel, perfil),
        reps: repsDoTipo(def.type, par.reps),
        rpe: par.rpe, rir: par.rir, rest: par.rest,
        papel: papel
      });
    });

    // faltou candidato em algum espaço: completa com o que estiver disponível
    const minimo = Math.min(4, teto);
    for(let r = 0; r < RESERVA.length && itens.length < minimo; r++){
      const papel = itens.length < 2 ? 'principal' : 'acessorio';
      const id = escolherExercicio(RESERVA[r], papel, perfil, usados, itens.map(x => x.ex));
      if(!id) continue;
      usados.push(id);
      const def = EX[id] || EX_EXTRA[id];
      const par = PARAMS[objetivo][papel];
      itens.push({ex:id, sets:ajustarSeries(par.sets, papel, perfil), reps:repsDoTipo(def.type, par.reps),
                  rpe:par.rpe, rir:par.rir, rest:par.rest, papel:papel});
    }

    // corta o que não cabe no tempo, começando pelos isolados do fim
    while(tempoEstimado(itens) > limiteMusc && itens.length > 3){
      let alvo = -1;
      for(let k = itens.length - 1; k >= 0; k--){ if(itens[k].papel === 'isolado'){ alvo = k; break; } }
      itens.splice(alvo === -1 ? itens.length - 1 : alvo, 1);
    }
    // ainda estourando: encolhe o descanso, com piso por papel
    if(tempoEstimado(itens) > limiteMusc){
      const trabalho = itens.reduce((a, x) => a + x.sets * 40, 0);
      const descanso = itens.reduce((a, x) => a + x.sets * x.rest, 0);
      const sobra = limiteMusc - 300 - trabalho;
      if(sobra > 0 && descanso > 0){
        const fator = sobra / descanso;
        const piso = {principal:75, acessorio:60, isolado:40};
        itens.forEach(x => { x.rest = Math.max(piso[x.papel], Math.round(x.rest * fator / 5) * 5); });
      }
    }
    // último recurso: tira séries, sem descer de 2
    let guarda = 0;
    while(tempoEstimado(itens) > limiteMusc && guarda++ < 30){
      const ordem = itens.slice().sort((a, b) => (b.papel === 'isolado' ? 1 : 0) - (a.papel === 'isolado' ? 1 : 0) || b.sets - a.sets);
      const alvo = ordem.find(x => x.sets > 2);
      if(!alvo) break;
      alvo.sets--;
    }

    // prioridade ganha uma série a mais no exercício correspondente
    (perfil.prioridade || []).forEach(g => {
      const alvo = itens.find(x => grupoBate(g, META[x.ex].m));
      if(alvo && tempoEstimado(itens) + (40 + alvo.rest) <= limiteMusc) alvo.sets++;
    });

    // cardio sempre por último, fora da disputa de espaço/corte da musculação
    if(temCardio){
      const idCardio = escolherExercicio('cardio', 'cardio', perfil, usados, itens.map(x => x.ex));
      if(idCardio){
        usados.push(idCardio);
        // sessão curta: mostra a duração real cedida ao cardio, não a faixa cheia que não coube
        const repsCardio = cardioSeg < CARDIO_MINUTOS[objetivo] * 60 ? Math.round(cardioSeg / 60) + 'min' : CARDIO_FAIXA[objetivo];
        itens.push({ex:idCardio, sets:1, reps:repsCardio, rpe:'5-6', rir:'', rest:0, papel:'cardio', duracaoSeg:cardioSeg});
      }
    }

    programa.push({
      key: 'd' + (i + 1),
      tag: 'DIA ' + (i + 1),
      name: modelo.nome + (dias.filter(d => d === modeloId).length > 1 && dias.indexOf(modeloId) !== i ? ' B' : ''),
      block: modelo.block,
      meta: descreverDia(itens),
      warmup: AQUECIMENTOS[modelo.block],
      items: itens.map(it => {
        const base = {ex:it.ex, sets:it.sets, reps:it.reps, rpe:it.rpe, rir:it.rir, rest:it.rest};
        if(it.duracaoSeg != null) base.duracaoSeg = it.duracaoSeg;
        return base;
      })
    });
  });

  return programa;
}

function descreverDia(itens){
  const conta = {};
  itens.forEach(it => {
    Object.keys(META[it.ex].m).forEach(mus => {
      if(META[it.ex].m[mus] >= 1) conta[mus] = (conta[mus] || 0) + it.sets;
    });
  });
  const nomes = {peito:'peito', costas:'costas', ombro:'ombros', biceps:'bíceps', triceps:'tríceps',
                 quadriceps:'quadríceps', posterior:'posterior', gluteos:'glúteos', panturrilha:'panturrilha', core:'core'};
  const top = Object.keys(conta).sort((a, b) => conta[b] - conta[a]).slice(0, 3).map(k => nomes[k] || k);
  return top.join(', ') + ' · ' + itens.length + ' exercícios';
}

/* volume semanal por grupo, usado nos testes e no resumo do programa */
function volumeSemanal(programa){
  const conta = {};
  programa.forEach(dia => dia.items.forEach(it => {
    const m = META[it.ex] ? META[it.ex].m : {};
    Object.keys(m).forEach(mus => { conta[mus] = (conta[mus] || 0) + it.sets * m[mus]; });
  }));
  Object.keys(conta).forEach(k => conta[k] = Math.round(conta[k]));
  return conta;
}

/* junta os exercícios extras ao catálogo principal */
Object.keys(EX_EXTRA).forEach(id => { if(!EX[id]) EX[id] = EX_EXTRA[id]; });

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
  overrides = {};                       // montagens antigas não valem para o programa novo
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
  $('prog-ok').onclick = () => backdropCloser && backdropCloser();
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
  $('sheet-body').querySelectorAll('[data-fechar]').forEach(b => b.onclick = () => backdropCloser && backdropCloser());
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
    if(backdropCloser) backdropCloser();
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
  saude: calcularSaude
};

boot();
