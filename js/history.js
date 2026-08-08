/* =========================================================================
   HISTÓRICO, EVOLUÇÃO E CALENDÁRIO
   ========================================================================= */
import { $, esc, openBackdrop, askConfirm, toast, fecharSheetAtual, fmtSet } from './ui.js';
import { Store } from './store.js';
import { renderHome } from './main.js';

let history = [];
let calViewDate = new Date();
let historyTab = 'lista';

/* quem importa history só pode mutar em lugar (push/unshift/filter().length);
   pra substituir o array inteiro (boot, restaurar backup, apagar tudo), usa
   esta função, porque um módulo não pode reatribuir o binding importado de outro */
function setHistory(novo){ history = Array.isArray(novo) ? novo : []; }

async function saveHistory(){
  const ok = await Store.set('history', history);
  if(!ok) toast('Não consegui salvar. Exporte um backup agora.');
  return ok;
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
          '<button class="minibtn" data-sharehist="' + h.id + '">Compartilhar</button>' +
          '<button class="minibtn" data-editdata="' + h.id + '">Editar data e horário</button>' +
          '<button class="minibtn danger" data-delhist="' + h.id + '">Apagar este treino</button>' +
        '</div>' +
      '</div></div>';
  }).join('');
}

/* edita inicio e fim de um treino ja registrado, recalculando a duracao.
   usada tanto pelo historico quanto pelo botao "editar horario" do resumo
   logo depois de finalizar (o item ja esta salvo nesse ponto, so ajusta) */
async function editarDataTreino(id, aoSalvar){
  const entry = history.find(h => h.id === id);
  if(!entry) return;
  const fim = new Date(entry.date);
  const inicio = new Date(fim.getTime() - entry.duration * 1000);
  const pad = n => String(n).padStart(2, '0');
  const dataDe = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const horaDe = d => pad(d.getHours()) + ':' + pad(d.getMinutes());
  const hoje = new Date();
  const dataMax = dataDe(hoje);

  const el = $('sheet-backdrop');
  $('sheet-body').innerHTML =
    '<div class="sheethead"><h2 id="sheet-title">Editar início e fim</h2>' +
    '<button class="closebtn" data-fechar="1" aria-label="Fechar">✕</button></div>' +
    '<p>Ajusta quando esse treino começou e terminou de verdade. Serve pra registrar um treino que você esqueceu de iniciar ou fechar na hora. A duração é recalculada.</p>' +
    '<div class="onb-opts">' +
      '<div class="editlabel">Início</div>' +
      '<input class="onb-input" id="ed-data-ini" type="date" inputmode="numeric" max="' + dataMax + '" value="' + dataDe(inicio) + '" aria-label="Data de início">' +
      '<input class="onb-input" id="ed-hora-ini" type="time" inputmode="numeric" value="' + horaDe(inicio) + '" aria-label="Hora de início">' +
      '<div class="editlabel" style="margin-top:10px">Fim</div>' +
      '<input class="onb-input" id="ed-data-fim" type="date" inputmode="numeric" max="' + dataMax + '" value="' + dataDe(fim) + '" aria-label="Data de fim">' +
      '<input class="onb-input" id="ed-hora-fim" type="time" inputmode="numeric" value="' + horaDe(fim) + '" aria-label="Hora de fim">' +
    '</div>' +
    '<div class="sheetact" style="margin-top:16px">' +
      '<button class="btn-ghost" data-fechar="1">Cancelar</button>' +
      '<button class="btn-primary" id="ed-salvar">Salvar</button>' +
    '</div>';
  openBackdrop(el, null, true);
  $('sheet-body').querySelectorAll('[data-fechar]').forEach(b => b.onclick = () => fecharSheetAtual());
  $('ed-salvar').onclick = async () => {
    const dataIni = $('ed-data-ini').value, horaIni = $('ed-hora-ini').value;
    const dataFim = $('ed-data-fim').value, horaFim = $('ed-hora-fim').value;
    if(!dataIni || !horaIni || !dataFim || !horaFim){ toast('Preencha início e fim'); return; }
    const novoInicio = new Date(dataIni + 'T' + horaIni);
    const novoFim = new Date(dataFim + 'T' + horaFim);
    if(isNaN(novoInicio.getTime()) || isNaN(novoFim.getTime())){ toast('Data inválida'); return; }
    if(novoFim.getTime() > Date.now()){ toast('O fim não pode ser no futuro'); return; }
    if(novoFim.getTime() <= novoInicio.getTime()){ toast('O fim precisa ser depois do início'); return; }
    const novaDuracao = Math.round((novoFim.getTime() - novoInicio.getTime()) / 1000);
    if(novaDuracao > 5 * 3600){
      const ok = await askConfirm({
        title: 'Treino de mais de 5 horas?',
        text: 'Com esses horários a duração fica bem longa. Confirma mesmo assim?',
        confirmLabel: 'Confirmar'
      });
      if(!ok) return;
    }
    entry.date = novoFim.toISOString();
    entry.duration = novaDuracao;
    history.sort((a, b) => new Date(b.date) - new Date(a.date));
    await saveHistory();
    fecharSheetAtual();
    renderHistory();
    renderHome();
    if(aoSalvar) aoSalvar(entry);
    toast('Horário atualizado');
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

export {
  history, setHistory, saveHistory, renderHistory, editarDataTreino, deleteHistory,
  exerciciosComHistorico, serieTemporalDoExercicio, showHistoryTab, historyTab, calViewDate,
  openCalendar, renderCalendar
};
