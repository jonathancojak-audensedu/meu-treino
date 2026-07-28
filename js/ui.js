/* =========================================================================
   INTERFACE: seletores, folhas, confirmação, toast
   Utilitários de DOM e os primitivos de UI reaproveitados em todo o app.
   ========================================================================= */
let backdropCloser = null;

const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function mq(query){
  try{ return !!(window.matchMedia && window.matchMedia(query).matches); }
  catch(e){ return false; }
}

/* -------------------------------------------------------------------------
   18. FOLHAS, CONFIRMAÇÃO E TOAST
   ------------------------------------------------------------------------- */
/* enquanto uma folha esta aberta, o resto do app fica inert: tira o fundo
   da navegacao por Tab e da leitura por teclado virtual de leitor de tela,
   sem precisar reimplementar focus trap na mao */
function travarFundo(travar){
  document.querySelectorAll('#app > *:not(.backdrop)').forEach(el => { el.inert = travar; });
}

function openBackdrop(el, onClose, skipFocus){
  el.classList.add('show');
  travarFundo(true);
  backdropCloser = () => { el.classList.remove('show'); travarFundo(false); backdropCloser = null; if(onClose) onClose(); };
  el.onclick = e => { if(e.target === el) backdropCloser(); };
  if(!skipFocus){
    const focusable = el.querySelector('button, input, a');
    if(focusable) setTimeout(() => focusable.focus(), 40);
  }
}
document.addEventListener('keydown', e => { if(e.key === 'Escape' && backdropCloser) backdropCloser(); });

/* fecha a folha aberta no momento, se houver (usado por botões de fechar
   fora do fluxo normal de onClose, como o "x" do calendário) */
function fecharSheetAtual(){ if(backdropCloser) backdropCloser(); }
/* invalida o fechador sem chamá-lo: usado quando quem resolveu a folha (ex:
   escolher uma opção) já removeu a classe "show" na mão, pra um Escape ou
   clique tardio no fundo não tentar fechar de novo uma folha ja fechada */
function invalidarBackdropCloser(){ backdropCloser = null; }

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
    const done = v => { if(settled) return; settled = true; el.classList.remove('show'); travarFundo(false); backdropCloser = null; resolve(v); };
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
   formatação de séries e descanso, usada por sessão e histórico
   ------------------------------------------------------------------------- */
function unitOf(type){ return type === 'time' ? 's' : type === 'dist' ? 'm' : type === 'cardio' ? 'min' : 'reps'; }
function fmtRest(sec){
  if(sec >= 60){ const m = Math.floor(sec/60), s = sec%60; return s ? m + ':' + String(s).padStart(2,'0') : m + ' min'; }
  return sec + 's';
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

export { $, esc, mq, openBackdrop, askConfirm, toast, fecharSheetAtual, invalidarBackdropCloser, travarFundo, unitOf, fmtRest, fmtSet, summarizeSets };
