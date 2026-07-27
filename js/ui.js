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

export { $, esc, mq, openBackdrop, askConfirm, toast, fecharSheetAtual, invalidarBackdropCloser };
