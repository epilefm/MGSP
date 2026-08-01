import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Monitor, RefreshCw, Calendar, AlertTriangle, CheckCircle2,
  XCircle, Bell, Bot, LayoutGrid, Zap,
  LogOut, Moon, Sun, X, Send, TrendingDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_BASE = 'http://105.103.39.102:8080';

/* ── Constants ────────────────────────────────────────────────────────────── */
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const STATUS_CFG = {
  'OK':        { color: 'bg-green-500 text-white',                                         dot: 'bg-green-500',  label: 'OK'      },
  'NG':        { color: 'bg-red-500 text-white animate-pulse',                              dot: 'bg-red-500',    label: 'NG'      },
  'SEM PLACA': { color: 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-200',   dot: 'bg-gray-400',   label: 'S/PLACA' },
  'SETUP':     { color: 'bg-violet-400 text-white',                                         dot: 'bg-violet-400', label: 'SETUP'   },
  'empty':     { color: 'bg-gray-50 dark:bg-dark-bg/40 text-transparent',                  dot: '',              label: ''        },
};

/* ── Turn & SETUP helpers ────────────────────────────────────────────────── */
function getTurno(h) {
  if (h >= 7 && h <= 16) return '1T';
  if (h >= 17 || h <= 2) return '2T';
  return '3T'; // 3h–6h
}

function isSetupRecord(r) {
  return r.tipo && r.tipo.toUpperCase().includes('SETUP');
}

function isSetupHour(recs) {
  return recs.some(isSetupRecord);
}

/* ── Dept por hora ────────────────────────────────────────────────────────── */
const PROD_HOURS  = [2, 5, 7, 10, 13, 16, 17, 20, 23];
const QUAL_HOURS  = [3, 6, 9, 12, 15, 19, 22, 1];
const MANUT_HOURS = [4, 8, 11, 14, 18, 21, 0];
function getDept(h) {
  if (PROD_HOURS.includes(h))  return 'PROD';
  if (QUAL_HOURS.includes(h))  return 'QUAL';
  if (MANUT_HOURS.includes(h)) return 'MANUT';
  return '';
}

/* ── Manaus time helpers (UTC-4, no DST) ─────────────────────────────────── */
function getManausDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Manaus' });
}
function getManausHour() {
  return parseInt(new Date().toLocaleString('en-US', { timeZone: 'America/Manaus', hour: '2-digit', hour12: false }));
}

/* ── Smart Alert Detection ───────────────────────────────────────────────── */
function detectSmartAlerts(grid) {
  const alerts = [];
  const nowHour = getManausHour();

  Object.entries(grid).forEach(([linha, hours]) => {
    const sequence = [];
    for (let h = 0; h < 24; h++) {
      const recs = hours[h] || [];
      if (!recs.length) continue;
      sequence.push({ h, status: recs[0].status, isSetup: isSetupHour(recs), turno: getTurno(h) });
    }
    const real = sequence.filter(s => !s.isSetup);

    const totOK  = real.filter(s => s.status === 'OK').length;
    const totNG  = real.filter(s => s.status === 'NG').length;
    const totSem = real.filter(s => s.status === 'SEM PLACA').length;
    const tot    = totOK + totNG + totSem;
    const ef     = tot > 0 ? (totOK / tot) * 100 : 0;

    // Consecutive analysis (excluding SETUP)
    let consSem = 0, maxConsSem = 0, consNG = 0, maxConsNG = 0;
    for (const s of real) {
      if (s.status === 'SEM PLACA') { consSem++; consNG = 0; if (consSem > maxConsSem) maxConsSem = consSem; }
      else if (s.status === 'NG')   { consNG++; consSem = 0; if (consNG > maxConsNG) maxConsNG = consNG; }
      else { consSem = 0; consNG = 0; }
    }

    if (maxConsSem >= 5) {
      alerts.push({ id: `${linha}-parada-critica`, linha, severity: 'high', type: 'Parada Crítica',
        msg: `${maxConsSem}h consecutivas sem placa (trocas de modelo excluídas) — ação imediata` });
    } else if (maxConsSem >= 3) {
      alerts.push({ id: `${linha}-parada`, linha, severity: 'high', type: 'Linha Parada',
        msg: `${maxConsSem}h consecutivas sem placa` });
    } else if (maxConsSem >= 2) {
      alerts.push({ id: `${linha}-parada-med`, linha, severity: 'medium', type: 'Parada Intermitente',
        msg: `${maxConsSem}h consecutivas sem placa` });
    }

    if (maxConsNG >= 3) {
      alerts.push({ id: `${linha}-ng-critico`, linha, severity: 'high', type: 'NG Crítico',
        msg: `${maxConsNG}h seguidas com NG — processo fora de controle` });
    } else if (maxConsNG >= 2) {
      alerts.push({ id: `${linha}-ng-consec`, linha, severity: 'medium', type: 'NG Consecutivo',
        msg: `${maxConsNG}h seguidas com NG — verificar processo` });
    }

    // Início do 1T com NG
    const early1T = real.filter(s => s.turno === '1T' && s.h >= 7 && s.h <= 9);
    if (early1T.length >= 1 && early1T.filter(s => s.status === 'NG').length / early1T.length >= 0.5) {
      alerts.push({ id: `${linha}-inicio-1t`, linha, severity: 'high', type: 'NG Início do 1T',
        msg: `Mal começou o 1T — ${early1T.filter(s => s.status === 'NG').length}/${early1T.length} horas com NG (7h–9h)` });
    }

    // Padrão alternado OK/NG
    const statuses = real.map(s => s.status);
    let alternating = 0;
    for (let i = 1; i < statuses.length; i++) {
      const p = statuses[i - 1], c = statuses[i];
      if ((p === 'OK' && c === 'NG') || (p === 'NG' && c === 'OK')) alternating++;
    }
    const altRatio = statuses.length > 2 ? alternating / (statuses.length - 1) : 0;

    // Preditivo
    let predictPct = 0;
    if (totNG > 0 && tot > 0) {
      const altBoost    = altRatio > 0.45 ? 25 : altRatio > 0.25 ? 12 : 0;
      const consecBoost = maxConsNG >= 3 ? 25 : maxConsNG >= 2 ? 15 : 0;
      const earlyBoost  = early1T.some(s => s.status === 'NG') ? 10 : 0;
      predictPct = Math.min(95, Math.round((totNG / tot) * 55 + altBoost + consecBoost + earlyBoost + 10));
    }

    if (predictPct >= 60 && totNG >= 2) {
      alerts.push({
        id: `${linha}-preditivo`, linha,
        severity: predictPct >= 75 ? 'high' : 'medium',
        type: 'Risco de Recorrência',
        msg: `${predictPct}% chance de novos NGs — ${altRatio > 0.35 ? 'padrão alternado OK/NG' : 'histórico instável'}`,
        predictPct,
      });
    }

    if (totNG >= 4 && maxConsNG < 2 && predictPct < 60) {
      alerts.push({ id: `${linha}-instavel`, linha, severity: 'medium', type: 'Linha Instável',
        msg: `${totNG} registros NG espalhados — ef. ${ef.toFixed(0)}% (excl. SETUP)` });
    }
  });

  return alerts.sort((a, b) => (a.severity === 'high' ? -1 : 1));
}

/* ── AI Analysis engine (local) ──────────────────────────────────────────── */
function buildContext(grid) {
  const stats = {};
  Object.keys(grid).forEach(l => {
    let ok = 0, ng = 0, sem = 0, setup = 0, causas = [];
    const byHour = {};
    HOURS.forEach(h => {
      const recs    = grid[l]?.[h] || [];
      const isSetup = isSetupHour(recs);
      byHour[h]     = recs;
      recs.forEach(r => {
        if (isSetup) { setup++; return; }
        if (r.status === 'OK') ok++;
        else if (r.status === 'NG') { ng++; if (r.causa) causas.push(r.causa); }
        else if (r.status === 'SEM PLACA') sem++;
      });
    });
    stats[l] = { ok, ng, sem, setup, causas, total: ok + ng + sem, byHour };
  });
  return stats;
}

const NORM = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function runAnalysis(question, grid, date, compareGrid, compareDate) {
  const q      = NORM(question);
  const ctx    = buildContext(grid);
  const linhas = Object.keys(ctx).sort((a, b) =>
    (parseInt(a.replace(/\D/g,''))||0) - (parseInt(b.replace(/\D/g,''))||0)
  );

  const totOK  = linhas.reduce((s, l) => s + ctx[l].ok,  0);
  const totNG  = linhas.reduce((s, l) => s + ctx[l].ng,  0);
  const totSem = linhas.reduce((s, l) => s + ctx[l].sem, 0);
  const tot    = totOK + totNG + totSem;
  const ef     = tot > 0 ? ((totOK / tot) * 100).toFixed(1) : '0.0';
  const efN    = Number(ef);
  const efCol  = v => Number(v) >= 80 ? 'green' : Number(v) >= 60 ? 'amber' : 'red';
  const lineEf = l => ctx[l].total > 0 ? ctx[l].ok / ctx[l].total : 0;
  const sorted = [...linhas].sort((a, b) => lineEf(b) - lineEf(a));

  // ── Comparação entre datas ──────────────────────────────────────────────
  if ((q.includes('compar') || q.includes('versus') || q.includes(' vs ')) && compareGrid) {
    const cctx = buildContext(compareGrid);
    const cl   = Object.keys(cctx).sort();
    const cOK  = cl.reduce((s, l) => s + cctx[l].ok,  0);
    const cNG  = cl.reduce((s, l) => s + cctx[l].ng,  0);
    const cSem = cl.reduce((s, l) => s + cctx[l].sem, 0);
    const cTot = cOK + cNG + cSem;
    const cEf  = cTot > 0 ? ((cOK / cTot) * 100).toFixed(1) : '0.0';
    const all  = [...new Set([...linhas, ...cl])].sort((a,b)=>(parseInt(a.replace(/\D/g,''))||0)-(parseInt(b.replace(/\D/g,''))||0));
    return {
      title: `Comparação: ${date}  ×  ${compareDate}`,
      panels: [
        { type: 'compare', left: { date, ok: totOK, ng: totNG, sem: totSem, ef }, right: { date: compareDate, ok: cOK, ng: cNG, sem: cSem, ef: cEf } },
        { type: 'table', title: 'Eficiência por linha (excl. SETUP)',
          headers: ['Linha', `${date} Ef%`, `${compareDate} Ef%`, 'Variação'],
          rows: all.map(l => {
            const s  = ctx[l]  || { ok: 0, total: 0 };
            const cs = cctx[l] || { ok: 0, total: 0 };
            const e1 = s.total  > 0 ? Math.round((s.ok  / s.total)  * 100) : null;
            const e2 = cs.total > 0 ? Math.round((cs.ok / cs.total) * 100) : null;
            const d  = e1 !== null && e2 !== null ? e1 - e2 : null;
            return [l, e1!=null?e1+'%':'—', e2!=null?e2+'%':'—', d!=null?(d>0?'+'+d+'%':d+'%'):'—'];
          }),
          highlightDelta: 3,
        },
      ],
    };
  }

  // ── Detectar linha específica mencionada ────────────────────────────────
  const mentionedLine = linhas.find(l => q.includes(NORM(l)));

  // ── Linha específica ────────────────────────────────────────────────────
  if (mentionedLine) {
    const s      = ctx[mentionedLine];
    const lineEfPct = s.total > 0 ? ((s.ok / s.total) * 100).toFixed(1) : '0.0';
    // Distribuição horária
    const hoursWithData = HOURS.filter(h => (s.byHour[h] || []).length > 0);
    const hourRows = hoursWithData.map(h => {
      const recs  = s.byHour[h] || [];
      const isSet = isSetupHour(recs);
      const st    = recs[0]?.status || '—';
      const ca    = recs.find(r => r.causa)?.causa || '';
      return [`${String(h).padStart(2,'0')}h`, isSet ? 'SETUP' : st, getTurno(h), ca];
    });
    return {
      title: `${mentionedLine} — ${date}`,
      panels: [
        { type: 'kpi', cards: [
          { label: 'OK',           value: s.ok,          color: 'green' },
          { label: 'NG',           value: s.ng,          color: s.ng  > 0 ? 'red'   : 'green' },
          { label: 'Sem Placa',    value: s.sem + 'h',   color: s.sem > 0 ? 'amber' : 'green' },
          { label: 'SETUP/Troca',  value: s.setup,       color: 'gray' },
          { label: 'Eficiência',   value: lineEfPct+'%', color: efCol(lineEfPct) },
        ]},
        ...(s.ng > 0 && s.causas.length ? [{
          type: 'table', title: 'Causas de NG registradas',
          headers: ['Causa', 'Ocorrências'],
          rows: Object.entries(s.causas.reduce((acc, c) => { acc[c] = (acc[c]||0)+1; return acc; }, {}))
            .sort((a,b)=>b[1]-a[1])
            .map(([c,n]) => [c, n]),
          highlightCol: 1,
        }] : []),
        { type: 'table', title: 'Histórico hora a hora',
          headers: ['Hora', 'Resultado', 'Turno', 'Causa'],
          rows: hourRows,
        },
      ],
    };
  }

  // ── Resumo geral ────────────────────────────────────────────────────────
  if (q.match(/resumo|geral|relatorio|tudo|overview|dia/)) {
    return {
      title: 'Resumo do Dia — ' + date,
      panels: [
        { type: 'kpi', cards: [
          { label: 'OK',                       value: totOK,        color: 'green' },
          { label: 'NG',                       value: totNG,        color: totNG  > 0 ? 'red'   : 'green' },
          { label: 'Sem Placa',                value: totSem+'h',   color: totSem > 0 ? 'amber' : 'green' },
          { label: 'Eficiência (excl. SETUP)', value: ef+'%',       color: efCol(ef) },
          { label: 'Linhas monitoradas',       value: linhas.length, color: 'gray' },
        ]},
        { type: 'hbar', title: 'Eficiência por linha (%)', unit: '%', maxVal: 100,
          data: sorted.map(l => ({ label: l, value: ctx[l].total > 0 ? Math.round(lineEf(l)*100) : 0, color: lineEf(l)>=0.8?'green':lineEf(l)>=0.6?'amber':'red' }))
        },
        { type: 'table', title: 'Tabela completa por linha',
          headers: ['Linha', 'OK', 'NG', 'S/Placa', 'SETUP', 'Ef%'],
          rows: sorted.map(l => {
            const s = ctx[l];
            return [l, s.ok, s.ng, s.sem+'h', s.setup, s.total>0?Math.round((s.ok/s.total)*100)+'%':'—'];
          }),
          highlightCol: 2,
        },
      ],
    };
  }

  // ── Eficiência / Ranking ────────────────────────────────────────────────
  if (q.match(/eficiencia|desempenho|performance|ranking|melhor|pior/)) {
    const best  = sorted[0];
    const worst = sorted[sorted.length - 1];
    return {
      title: 'Ranking de Eficiência — ' + date,
      panels: [
        { type: 'kpi', cards: [
          { label: 'Ef. geral',    value: ef+'%',                                                                          color: efCol(ef) },
          { label: '≥ 80% Ótimo', value: sorted.filter(l=>ctx[l].total>0&&lineEf(l)>=0.8).length,                         color: 'green'   },
          { label: '60–79% Reg.',  value: sorted.filter(l=>ctx[l].total>0&&lineEf(l)>=0.6&&lineEf(l)<0.8).length,         color: 'amber'   },
          { label: '< 60% Crítico',value: sorted.filter(l=>ctx[l].total>0&&lineEf(l)<0.6).length,                         color: 'red'     },
        ]},
        { type: 'hbar', title: 'Ranking decrescente por eficiência (%)', unit: '%', maxVal: 100,
          data: sorted.map(l => ({ label: l, value: ctx[l].total>0?Math.round(lineEf(l)*100):0, color: lineEf(l)>=0.8?'green':lineEf(l)>=0.6?'amber':'red' }))
        },
        ...(best && worst && best !== worst ? [{ type: 'text', content:
          `Melhor linha: **${best}** — ${ctx[best].total>0?Math.round(lineEf(best)*100):0}% de eficiência\n` +
          `Pior linha: **${worst}** — ${ctx[worst].total>0?Math.round(lineEf(worst)*100):0}% de eficiência\n` +
          (efN < 80 ? `\n⚠️ Eficiência geral abaixo de 80% — investigar causas nas linhas críticas.` : `\n✅ Eficiência geral dentro do padrão.`)
        }] : []),
      ],
    };
  }

  // ── Análise por turno ───────────────────────────────────────────────────
  if (q.match(/turno|1t|2t|3t|manha|tarde|noite/)) {
    const turnos = { '1T': { ok:0,ng:0,sem:0 }, '2T': { ok:0,ng:0,sem:0 }, '3T': { ok:0,ng:0,sem:0 } };
    linhas.forEach(l => {
      HOURS.forEach(h => {
        const recs = grid[l]?.[h] || [];
        if (!recs.length || isSetupHour(recs)) return;
        const t = getTurno(h);
        recs.forEach(r => {
          if (r.status==='OK') turnos[t].ok++;
          else if (r.status==='NG') turnos[t].ng++;
          else if (r.status==='SEM PLACA') turnos[t].sem++;
        });
      });
    });
    return {
      title: 'Análise por Turno — ' + date,
      panels: [
        { type: 'table', title: 'Produção por turno (excl. SETUP)',
          headers: ['Turno', 'Horário', 'OK', 'NG', 'S/Placa', 'Ef%'],
          rows: [
            ['1T', '07h–16h', turnos['1T'].ok, turnos['1T'].ng, turnos['1T'].sem+'h', (t=>{const tt=t.ok+t.ng+t.sem;return tt>0?Math.round(t.ok/tt*100)+'%':'—'})(turnos['1T'])],
            ['2T', '17h–02h', turnos['2T'].ok, turnos['2T'].ng, turnos['2T'].sem+'h', (t=>{const tt=t.ok+t.ng+t.sem;return tt>0?Math.round(t.ok/tt*100)+'%':'—'})(turnos['2T'])],
            ['3T', '03h–06h', turnos['3T'].ok, turnos['3T'].ng, turnos['3T'].sem+'h', (t=>{const tt=t.ok+t.ng+t.sem;return tt>0?Math.round(t.ok/tt*100)+'%':'—'})(turnos['3T'])],
          ],
          highlightCol: 4,
        },
        { type: 'hbar', title: 'NG por turno', unit: ' reg.', maxVal: null,
          data: [
            { label: '1T (07–16h)', value: turnos['1T'].ng, color: 'red'   },
            { label: '2T (17–02h)', value: turnos['2T'].ng, color: 'amber' },
            { label: '3T (03–06h)', value: turnos['3T'].ng, color: 'amber' },
          ].filter(d => d.value > 0)
        },
      ],
    };
  }

  // ── Causas / defeitos ───────────────────────────────────────────────────
  if (q.match(/causa|defeito|tipo|falha|motivo|solda|componente/)) {
    const allCausas = {};
    linhas.forEach(l => {
      const recs = Object.values(grid[l]||{}).flat();
      recs.filter(r=>r.status==='NG'&&(r.causa||r.cause)).forEach(r=>{
        const c = r.causa||r.cause;
        allCausas[c] = (allCausas[c]||0) + 1;
      });
    });
    const causaRows = Object.entries(allCausas).sort((a,b)=>b[1]-a[1]);
    if (!causaRows.length) return { title: 'Causas de NG', panels: [{ type: 'text', content: 'Nenhuma causa de NG registrada em ' + date + '.' }] };
    return {
      title: 'Análise de Causas — ' + date,
      panels: [
        { type: 'kpi', cards: [
          { label: 'Tipos de defeito', value: causaRows.length, color: 'amber' },
          { label: 'Total NG',         value: totNG,            color: 'red'   },
          { label: 'Causa principal',  value: causaRows[0]?.[0]?.split(' ').slice(0,2).join(' ') || '—', color: 'red' },
        ]},
        { type: 'hbar', title: 'Frequência por causa de NG', unit: ' ocorrências', maxVal: null,
          data: causaRows.slice(0, 8).map(([c, n]) => ({ label: c, value: n, color: 'red' }))
        },
        { type: 'table', title: 'Detalhamento por causa',
          headers: ['Causa', 'Qtd', '% do total NG'],
          rows: causaRows.map(([c, n]) => [c, n, totNG>0?Math.round(n/totNG*100)+'%':'—']),
          highlightCol: 1,
        },
      ],
    };
  }

  // ── Análise NG ──────────────────────────────────────────────────────────
  if (q.match(/\bng\b|rejeicao|reprovad/)) {
    const comNG = linhas.filter(l => ctx[l].ng > 0).sort((a, b) => ctx[b].ng - ctx[a].ng);
    if (!comNG.length) return { title: 'Registros NG', panels: [{ type: 'text', content: 'Nenhuma linha registrou NG em ' + date + '. ✅' }] };
    return {
      title: 'Análise NG — ' + date,
      panels: [
        { type: 'kpi', cards: [
          { label: 'Total NG',        value: totNG,                        color: 'red'   },
          { label: 'Linhas afetadas', value: comNG.length,                 color: 'amber' },
          { label: 'Linhas sem NG',   value: linhas.length-comNG.length,   color: 'green' },
          { label: 'Taxa de NG',      value: tot>0?Math.round(totNG/tot*100)+'%':'—', color: 'red' },
        ]},
        { type: 'hbar', title: 'NG por linha (ordenado)', unit: ' reg.', maxVal: null,
          data: comNG.map(l => ({ label: l, value: ctx[l].ng, color: 'red' }))
        },
        { type: 'table', title: 'Detalhe por linha',
          headers: ['Linha', 'OK', 'NG', 'S/Placa', 'Ef%', 'Principal causa'],
          rows: comNG.map(l => {
            const s = ctx[l];
            const topCausa = Object.entries(s.causas.reduce((acc,c)=>{acc[c]=(acc[c]||0)+1;return acc;},{})).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—';
            return [l, s.ok, s.ng, s.sem+'h', s.total>0?Math.round(s.ok/s.total*100)+'%':'—', topCausa];
          }),
          highlightCol: 2,
        },
      ],
    };
  }

  // ── Paradas ─────────────────────────────────────────────────────────────
  if (q.match(/parada|sem placa|parou|parado|parar|interrup/)) {
    const paradas = linhas.filter(l => ctx[l].sem > 0).sort((a, b) => ctx[b].sem - ctx[a].sem);
    if (!paradas.length) return { title: 'Linhas Paradas', panels: [{ type: 'text', content: 'Nenhuma linha ficou parada em ' + date + '. ✅' }] };
    return {
      title: 'Linhas Paradas — ' + date,
      panels: [
        { type: 'kpi', cards: [
          { label: 'Linhas paradas',  value: paradas.length,                 color: 'red'   },
          { label: 'Total s/ placa',  value: totSem+'h',                     color: 'amber' },
          { label: 'Linhas normais',  value: linhas.length-paradas.length,   color: 'green' },
        ]},
        { type: 'hbar', title: 'Horas sem placa por linha (excl. SETUP)', unit: 'h', maxVal: null,
          data: paradas.map(l => ({ label: l, value: ctx[l].sem, color: ctx[l].sem >= 5 ? 'red' : 'amber' }))
        },
        { type: 'table', title: 'Detalhe das paradas',
          headers: ['Linha', 'S/Placa', 'OK', 'NG', 'SETUP', 'Ef%'],
          rows: paradas.map(l => {
            const s = ctx[l];
            return [l, s.sem+'h', s.ok, s.ng, s.setup, s.total>0?Math.round(s.ok/s.total*100)+'%':'—'];
          }),
          highlightCol: 1,
        },
      ],
    };
  }

  // ── SETUP / troca de modelo ─────────────────────────────────────────────
  if (q.match(/setup|troca|modelo/)) {
    const comSetup = linhas.filter(l => ctx[l].setup > 0).sort((a,b)=>ctx[b].setup-ctx[a].setup);
    const totSetup = linhas.reduce((s,l)=>s+ctx[l].setup, 0);
    return {
      title: 'Trocas de Modelo (SETUP) — ' + date,
      panels: [
        { type: 'kpi', cards: [
          { label: 'Total SETUP',       value: totSetup,      color: 'gray'  },
          { label: 'Linhas com troca',  value: comSetup.length, color: 'amber' },
          { label: 'Linhas sem troca',  value: linhas.length-comSetup.length, color: 'green' },
        ]},
        ...(comSetup.length ? [{
          type: 'hbar', title: 'SETUP por linha', unit: ' trocas', maxVal: null,
          data: comSetup.map(l => ({ label: l, value: ctx[l].setup, color: 'gray' }))
        }] : []),
        { type: 'text', content: 'Registros SETUP são trocas de modelo — **excluídos** do cálculo de eficiência.\nUma troca pode impactar a produção por até 1–2h dependendo do modelo.' },
      ],
    };
  }

  // ── Linhas sem problemas / normais ──────────────────────────────────────
  if (q.match(/normal|ok|bem|boa|excelente|acima/)) {
    const normais = sorted.filter(l => ctx[l].total > 0 && lineEf(l) >= 0.8);
    return {
      title: 'Linhas com Bom Desempenho — ' + date,
      panels: [
        { type: 'kpi', cards: [
          { label: 'Linhas ≥ 80%',    value: normais.length,               color: 'green' },
          { label: 'Ef. média ótimas', value: normais.length > 0 ? Math.round(normais.reduce((s,l)=>s+lineEf(l),0)/normais.length*100)+'%' : '—', color: 'green' },
          { label: 'Total ≥ 80%',      value: normais.reduce((s,l)=>s+ctx[l].ok,0), color: 'green' },
        ]},
        { type: 'hbar', title: 'Linhas com ≥ 80% de eficiência', unit: '%', maxVal: 100,
          data: normais.map(l => ({ label: l, value: Math.round(lineEf(l)*100), color: 'green' }))
        },
      ],
    };
  }

  // ── Fallback: retorna nulo para o runQuery decidir ──────────────────────
  return null;
}

/* ── Cell Modal ──────────────────────────────────────────────────────────── */
function CellModal({ records, linha, hora, onClose }) {
  const ST_BADGE = {
    'OK':        'bg-green-500 text-white',
    'NG':        'bg-red-500 text-white',
    'SEM PLACA': 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-100',
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={handleBackdropClick}>
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 dark:border-dark-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Monitor size={17} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white leading-none">{linha}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                <span className="font-semibold text-gray-500">Hora:</span> {String(hora).padStart(2, '0')}:00 – {String(hora + 1).padStart(2, '0')}:00
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card transition-colors">
            <X size={15} className="text-gray-400" />
          </button>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-dark-border max-h-[70vh] overflow-y-auto">
          {records.map((r, i) => {
            const setup = isSetupRecord(r);
            const status = r.status || '—';
            
            return (
              <div key={i} className="p-4">
                {/* Header do registro - compacto */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide ${ST_BADGE[status] || 'bg-gray-100 text-gray-600'}`}>
                      {status}
                    </span>
                    {setup && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400">
                        SETUP
                      </span>
                    )}
                  </div>
                  {records.length > 1 && (
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-dark-bg px-2 py-0.5 rounded-full">
                      #{i + 1}/{records.length}
                    </span>
                  )}
                </div>

                {/* Campos de detalhes - compactos */}
                <div className="space-y-2">
                  {/* Linha */}
                  <div className="flex items-center gap-2.5 py-1.5 border-b border-gray-100 dark:border-dark-border">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider w-20">Linha</span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{linha}</span>
                  </div>
                  
                  {/* Hora */}
                  <div className="flex items-center gap-2.5 py-1.5 border-b border-gray-100 dark:border-dark-border">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider w-20">Hora</span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{String(hora).padStart(2, '0')}:00-{String(hora + 1).padStart(2, '0')}:00</span>
                  </div>
                  
                  {/* Status */}
                  <div className="flex items-center gap-2.5 py-1.5 border-b border-gray-100 dark:border-dark-border">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider w-20">Status</span>
                    <span className={`text-sm font-bold ${status === 'OK' ? 'text-green-600' : status === 'NG' ? 'text-red-600' : 'text-gray-600'}`}>
                      {status}
                    </span>
                  </div>
                  
                  {/* Inspetor */}
                  {(r.nome || r.inspetor) && (
                    <div className="flex items-center gap-2.5 py-1.5 border-b border-gray-100 dark:border-dark-border">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider w-20">Inspetor</span>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{r.nome || r.inspetor}</span>
                    </div>
                  )}
                  
                  {/* Modelo */}
                  {r.modelo && (
                    <div className="flex items-center gap-2.5 py-1.5 border-b border-gray-100 dark:border-dark-border">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider w-20">Modelo</span>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{r.modelo}</span>
                    </div>
                  )}
                  
                  {/* CN */}
                  {r.cn && (
                    <div className="flex items-center gap-2.5 py-1.5 border-b border-gray-100 dark:border-dark-border">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider w-20">CN</span>
                      <span className="text-sm font-mono font-semibold text-gray-800 dark:text-gray-200">{r.cn}</span>
                    </div>
                  )}
                  
                  {/* Tipo */}
                  {r.tipo && (
                    <div className="flex items-center gap-2.5 py-1.5 border-b border-gray-100 dark:border-dark-border">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider w-20">Tipo</span>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{r.tipo}</span>
                    </div>
                  )}
                  
                  {/* Dept */}
                  {(r.dept || r.department) && (
                    <div className="flex items-center gap-2.5 py-1.5 border-b border-gray-100 dark:border-dark-border">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider w-20">Dept</span>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{r.dept || r.department}</span>
                    </div>
                  )}
                  
                  {/* Causa (apenas para NG) */}
                  {(r.causa || r.cause) && status === 'NG' && (
                    <div className="flex items-center gap-2.5 py-1.5 border-b border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 -mx-2 px-2 rounded">
                      <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider w-20">Causa</span>
                      <span className="text-sm font-semibold text-red-700 dark:text-red-400 capitalize">{r.causa || r.cause}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Analysis sub-components ─────────────────────────────────────────────── */
const KPI_CLS = {
  green: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/40',
  red:   'bg-red-50   dark:bg-red-900/20   text-red-700   dark:text-red-400   border-red-200   dark:border-red-800/40',
  amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
  gray:  'bg-gray-50  dark:bg-gray-800/30  text-gray-600  dark:text-gray-300  border-gray-200  dark:border-dark-border',
};
const BAR_CLS = { green: 'bg-green-500', red: 'bg-red-500', amber: 'bg-amber-400', gray: 'bg-gray-400', blue: 'bg-blue-500' };

function KpiRow({ cards }) {
  const cols = cards.length <= 3 ? 'grid-cols-3' : cards.length === 5 ? 'grid-cols-3 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4';
  return (
    <div className={`grid gap-2 ${cols}`}>
      {cards.map((c, i) => (
        <div key={i} className={`rounded-xl border p-3 ${KPI_CLS[c.color] || KPI_CLS.gray}`}>
          <p className="text-[10px] font-semibold uppercase tracking-wide opacity-60 mb-0.5">{c.label}</p>
          <p className="text-2xl font-black leading-none">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

function HBarChart({ title, data, unit = '', maxVal }) {
  const max = (maxVal !== null && maxVal !== undefined) ? maxVal : Math.max(...data.map(d => d.value), 1);
  return (
    <div>
      {title && <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">{title}</p>}
      <div className="space-y-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-gray-600 dark:text-gray-300 w-20 flex-shrink-0 truncate">{d.label}</span>
            <div className="flex-1 h-5 bg-gray-100 dark:bg-dark-bg rounded overflow-hidden">
              <div className={`h-full rounded transition-all duration-500 ${BAR_CLS[d.color] || BAR_CLS.blue}`}
                style={{ width: (max > 0 ? (d.value / max) * 100 : 0) + '%' }} />
            </div>
            <span className="text-[11px] font-bold text-gray-700 dark:text-gray-200 w-14 text-right flex-shrink-0 tabular-nums">
              {d.value}{unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DataTable({ title, headers, rows, highlightCol, highlightDelta }) {
  return (
    <div>
      {title && <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">{title}</p>}
      <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-dark-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 dark:bg-dark-bg">
              {headers.map((h, i) => (
                <th key={i} className="px-3 py-2 text-left font-semibold text-gray-400 dark:text-gray-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-dark-border">
            {rows.map((row, ri) => (
              <tr key={ri} className="hover:bg-gray-50 dark:hover:bg-dark-bg/50">
                {row.map((cell, ci) => {
                  let cls = 'px-3 py-1.5 ';
                  if (ci === 0) cls += 'font-semibold text-gray-900 dark:text-white font-mono';
                  else if (ci === highlightCol) cls += 'font-bold text-red-600 dark:text-red-400';
                  else if (ci === highlightDelta) {
                    const n = parseFloat(cell);
                    cls += n > 0 ? 'font-bold text-green-600 dark:text-green-400'
                         : n < 0 ? 'font-bold text-red-600 dark:text-red-400'
                         : 'text-gray-400';
                  } else cls += 'text-gray-600 dark:text-gray-300';
                  return <td key={ci} className={cls}>{cell}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComparePanel({ left, right }) {
  const metrics = [
    { label: 'OK',         pos: 'higher', lv: left.ok,  rv: right.ok  },
    { label: 'NG',         pos: 'lower',  lv: left.ng,  rv: right.ng  },
    { label: 'Sem Placa',  pos: 'lower',  lv: left.sem, rv: right.sem },
    { label: 'Eficiência', pos: 'higher', lv: left.ef,  rv: right.ef, suf: '%' },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {[left, right].map((side, si) => (
        <div key={si} className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface p-4">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 pb-2 border-b border-gray-100 dark:border-dark-border">{side.date}</p>
          {metrics.map((m, mi) => {
            const val   = si === 0 ? m.lv : m.rv;
            const other = si === 0 ? m.rv : m.lv;
            const better = m.pos === 'higher' ? Number(val) > Number(other) : Number(val) < Number(other);
            return (
              <div key={mi} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-dark-border last:border-0">
                <span className="text-[10px] text-gray-400 uppercase tracking-wide">{m.label}</span>
                <span className={`text-base font-black tabular-nums ${better ? 'text-green-600 dark:text-green-400' : 'text-gray-800 dark:text-gray-100'}`}>
                  {val}{m.suf || ''}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function RichText({ content }) {
  if (!content) return null;
  return (
    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
      {content.split('**').map((part, pi) =>
        pi % 2 === 1 ? <strong key={pi} className="text-gray-900 dark:text-white">{part}</strong> : part
      )}
    </p>
  );
}

function GaussPanel({ text }) {
  return (
    <div className="rounded-xl border border-blue-200 dark:border-blue-800/40 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/15 dark:to-indigo-900/10 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-blue-100 dark:border-blue-800/30">
        <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Bot size={12} className="text-white" />
        </div>
        <span className="text-xs font-bold text-blue-900 dark:text-blue-300">Análise Gauss IA</span>
        <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400">IA</span>
      </div>
      <div className="px-4 py-3">
        <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
          {text.split('**').map((part, pi) =>
            pi % 2 === 1 ? <strong key={pi} className="text-blue-900 dark:text-blue-200">{part}</strong> : part
          )}
        </p>
      </div>
    </div>
  );
}

function AnalysisResult({ result, query }) {
  if (!result) return null;
  return (
    <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-dark-bg border-b border-gray-100 dark:border-dark-border">
        <div className="w-1 h-5 bg-blue-600 rounded-full flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{result.title}</p>
          {query && <p className="text-[10px] text-gray-400 truncate">"{query}"</p>}
        </div>
        {result.gaussText && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 flex-shrink-0">
            ✦ IA
          </span>
        )}
      </div>
      <div className="p-4 space-y-4">
        {/* Gauss sempre primeiro quando existir */}
        {result.gaussText && <GaussPanel text={result.gaussText} />}
        {result.panels.map((panel, i) => (
          <div key={i}>
            {panel.type === 'kpi'     && <KpiRow cards={panel.cards} />}
            {panel.type === 'hbar'    && <HBarChart title={panel.title} data={panel.data} unit={panel.unit} maxVal={panel.maxVal} />}
            {panel.type === 'table'   && <DataTable title={panel.title} headers={panel.headers} rows={panel.rows} highlightCol={panel.highlightCol} highlightDelta={panel.highlightDelta} />}
            {panel.type === 'compare' && <ComparePanel left={panel.left} right={panel.right} />}
            {panel.type === 'text'    && <RichText content={panel.content} />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Alert justification generator ───────────────────────────────────────── */
function generateJustification(alert, grid) {
  const { linha, type, msg, predictPct } = alert;
  const recs    = Object.values(grid[linha] || {}).flat();
  const ok      = recs.filter(r => r.status === 'OK').length;
  const ng      = recs.filter(r => r.status === 'NG').length;
  const sem     = recs.filter(r => r.status === 'SEM PLACA').length;
  const tot     = ok + ng + sem;
  const ef      = tot > 0 ? Math.round(ok / tot * 100) : 0;
  const causas  = [...new Set(recs.filter(r => r.status === 'NG' && (r.causa || r.cause)).map(r => r.causa || r.cause))];
  const horasNG = Object.entries(grid[linha] || {}).filter(([, v]) => v.some(r => r.status === 'NG')).map(([h]) => h + 'h');
  const altSeq  = (() => { let c = 0, mx = 0; let prev = null; recs.forEach(r => { if (r.status !== prev) { c = 1; prev = r.status; } else c++; if (c > mx) mx = c; }); return mx; })();

  const EXPLAIN = {
    'NG Início do 1T': {
      why: `A linha ${linha} registrou falhas de inspeção nas primeiras horas do 1º turno (7h–9h), período crítico que indica problema de setup ou material que persiste desde o início da produção. Com ${ng} NGs detectados, a eficiência ficou em ${ef}%, abaixo do esperado para o início de turno.`,
      factors: [
        `${ng} registros NG concentrados nas horas iniciais: ${horasNG.slice(0,4).join(', ')}`,
        causas.length ? `Causas mais frequentes: ${causas.join(', ')}` : 'Causas ainda não registradas no sistema',
        `Eficiência geral do dia: ${ef}% (${ok} OK / ${ng} NG / ${sem} sem placa)`,
        'Falhas no 1T tendem a persistir se não corrigidas nas primeiras 2h',
      ],
      actions: [
        'Acionar técnico de processo imediatamente para revisão do setup',
        'Verificar lote de material — possível lote com defeito',
        'Registrar causa detalhada no sistema para rastreabilidade',
        'Monitorar as próximas 2 horas com inspeção reforçada',
      ],
    },
    'Parada Crítica': {
      why: `A linha ${linha} ficou ${sem} horas sem registro de placa inspecionada (excluindo trocas de modelo SETUP). Paradas superiores a 3h consecutivas indicam problema técnico grave — falha de equipamento, falta de material ou problema operacional não registrado.`,
      factors: [
        `${sem} horas sem placa registrada (parada real, excluindo SETUP)`,
        `Eficiência comprometida: ${ef}% — ${ok} OK vs ${ng} NG`,
        causas.length ? `Falhas anteriores à parada: ${causas.join(', ')}` : 'Sem registro de causa anterior',
        'Parada não justificada pode indicar falha de equipamento silenciosa',
      ],
      actions: [
        'Verificar status físico da linha — equipamento ligado e operacional?',
        'Checar abastecimento de material (PCBs) na linha',
        'Registrar no sistema a causa da parada com horário exato',
        'Acionar manutenção preventiva se equipamento estiver com falha',
      ],
    },
    'NG Crítico': {
      why: `A linha ${linha} registrou ${ng} falhas de NG em sequência, configurando um processo fora de controle estatístico. Com eficiência de ${ef}%, a taxa de rejeição está acima do limite aceitável e indica problema sistemático, não aleatório.`,
      factors: [
        `${ng} registros NG — taxa de rejeição: ${tot > 0 ? Math.round(ng/tot*100) : 0}%`,
        causas.length ? `Causas identificadas: ${causas.join(', ')}` : 'Causas não registradas — ação necessária',
        `Horas com NG: ${horasNG.join(', ')}`,
        'Padrão de NG consecutivo indica causa raiz sistemática',
      ],
      actions: [
        'Parar a linha para inspeção imediata do processo de solda',
        'Analisar os últimos 10 PCBs inspecionados para identificar padrão',
        `Investigar especificamente: ${causas[0] || 'causa não informada'}`,
        'Não retomar produção sem ajuste confirmado do processo',
      ],
    },
    'Risco de Recorrência': {
      why: `O sistema detectou padrão alternado OK→NG→OK→NG na linha ${linha} com ${predictPct || '?'}% de probabilidade de novos NGs. Processos que alternam entre aprovação e rejeição indicam instabilidade nos parâmetros de solda — o problema não foi corrigido na raiz.`,
      factors: [
        `Padrão alternado detectado com sequência máxima de ${altSeq} registros iguais`,
        `${ng} NGs distribuídos ao longo do turno: ${horasNG.join(', ')}`,
        causas.length ? `Variação nas causas: ${causas.join(', ')} — indica múltiplos fatores` : 'Causas não registradas',
        `Probabilidade preditiva de novo NG: ${predictPct || '?'}%`,
      ],
      actions: [
        'Revisar parâmetros de temperatura e pressão da máquina de solda',
        'Verificar se há variação de lote no material utilizado',
        'Implementar inspeção 100% nas próximas 3 horas',
        'Solicitar análise de Cp/Cpk do processo ao engenheiro de qualidade',
      ],
    },
    'Parada Intermitente': {
      why: `A linha ${linha} apresentou paradas intermitentes — períodos alternados sem placa inspecionada — sugerindo instabilidade no abastecimento ou problemas mecânicos esporádicos que não chegaram a configurar uma parada crítica contínua.`,
      factors: [
        `${sem} horas sem placa registradas de forma não-contínua`,
        `Eficiência atual: ${ef}% — impacto direto da intermitência`,
        `${ok} OK e ${ng} NG registrados nos períodos produtivos`,
        'Paradas intermitentes frequentemente indicam problema de abastecimento ou operador',
      ],
      actions: [
        'Verificar fluxo de abastecimento de PCBs na linha',
        'Checar se operador está registrando inspeções corretamente',
        'Analisar log de paradas do equipamento nas últimas 4 horas',
        'Se mecânico: acionar manutenção para diagnóstico preventivo',
      ],
    },
    'Eficiência Baixa': {
      why: `A eficiência da linha ${linha} está em ${ef}%, abaixo do mínimo aceitável. Com ${ng} rejeições em ${tot} inspeções realizadas (excluindo SETUP), o processo está fora dos padrões de qualidade estabelecidos para a linha.`,
      factors: [
        `Taxa de rejeição: ${tot > 0 ? Math.round(ng/tot*100) : 0}% (${ng} NG em ${tot} inspecionados)`,
        causas.length ? `Principais causas: ${causas.join(', ')}` : 'Causas não registradas no sistema',
        `${sem} horas sem placa também impactam a eficiência`,
        `Eficiência alvo: ≥85% | Atual: ${ef}%`,
      ],
      actions: [
        'Realizar reunião rápida com operador e técnico da linha',
        'Mapear as horas de maior concentração de NG e investigar',
        causas[0] ? `Priorizar correção de: ${causas[0]}` : 'Registrar causas de rejeição obrigatoriamente',
        'Definir meta de recuperação até o fim do turno',
      ],
    },
  };

  const base = EXPLAIN[type];
  if (base) return base;
  return {
    why: msg,
    factors: [
      `Linha ${linha} — ${ok} OK, ${ng} NG, ${sem} sem placa`,
      `Eficiência: ${ef}%`,
      causas.length ? `Causas: ${causas.join(', ')}` : 'Sem causas registradas',
    ],
    actions: [
      'Verificar estado atual da linha',
      'Consultar operador responsável',
      'Registrar causa no sistema',
    ],
  };
}

/* ── Main Component ──────────────────────────────────────────────────────── */
export default function RouterMonitor() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const toggleDarkMode = () => setDarkMode(d => !d);

  const [tab,            setTab]            = useState('monitor');
  const [date,           setDate]           = useState(getManausDate());
  const [grid,           setGrid]           = useState({});
  const [loading,        setLoading]        = useState(false);
  const [alerts,         setAlerts]         = useState([]);
  const [cellModal,      setCellModal]      = useState(null);
  const [showAlertPanel, setShowAlertPanel] = useState(true);
  const [selectedAlert,  setSelectedAlert]  = useState(null);

  // AI auto-alerts
  const [aiAlerts,        setAiAlerts]        = useState(null);
  const [aiAlertsLoading, setAiAlertsLoading] = useState(false);

  // Local IA analysis
  const [iaQuery,     setIaQuery]     = useState('');
  const [iaResults,   setIaResults]   = useState([]);
  const [iaLoading,   setAiLoading]   = useState(false);
  const [compareDate, setCompareDate] = useState('');
  const [compareGrid, setCompareGrid] = useState(null);
  const [cmpLoading,  setCmpLoading]  = useState(false);
  const resultsRef = useRef(null);

  const nowHour    = getManausHour();
  const turnoAtual = getTurno(nowHour);

  const load = useCallback(async () => {
    setLoading(true);
    setAiAlerts(null);
    try {
      const { data } = await axios.get(`${API_BASE}/router/monitor?date=${date}`);
      const gridData  = data.grid || {};
      setGrid(gridData);
      const detected = detectSmartAlerts(gridData);
      setAlerts(detected);

      // Background: pedir diagnóstico IA ao backend
      setAiAlertsLoading(true);
      (async () => {
        try {
          const lines = Object.keys(gridData).sort((a, b) =>
            (parseInt(a.replace(/\D/g, '')) || 0) - (parseInt(b.replace(/\D/g, '')) || 0)
          );
          const flat   = l => Object.values(gridData[l] || {}).flat();
          const totOK  = lines.reduce((s, l) => s + flat(l).filter(r => r.status === 'OK').length, 0);
          const totNG  = lines.reduce((s, l) => s + flat(l).filter(r => r.status === 'NG').length, 0);
          const totSem = lines.reduce((s, l) => s + flat(l).filter(r => r.status === 'SEM PLACA').length, 0);
          const tot    = totOK + totNG + totSem;

          const { data: aiData } = await axios.post(`${API_BASE}/router/ai-alerts`, {
            grid: gridData,
            date,
            alerts:   detected,
            linhas:   lines,
            totalOK:  totOK,
            totalNG:  totNG,
            totalSem: totSem,
            eficiencia: tot > 0 ? Math.round((totOK / tot) * 100) : 0,
          });

          if (aiData?.response) setAiAlerts(aiData.response);
        } catch (err) {
          console.warn('IA de alertas indisponível:', err.message);
        } finally {
          setAiAlertsLoading(false);
        }
      })();

    } catch { toast.error('Erro ao carregar dados do monitor'); }
    finally { setLoading(false); }
  }, [date]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (resultsRef.current) resultsRef.current.scrollTop = 0; }, [iaResults]);

  const loadCompare = async () => {
    if (!compareDate) return;
    setCmpLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/router/monitor?date=${compareDate}`);
      setCompareGrid(data.grid || {});
      toast.success('Dados de comparação carregados');
    } catch { toast.error('Erro ao carregar data de comparação'); }
    finally { setCmpLoading(false); }
  };

  const runQuery = async (q) => {
    const query = (q || iaQuery).trim();
    if (!query || iaLoading) return;
    if (!iaQuery && q) setIaQuery(q);
    const lines = Object.keys(grid);
    if (!lines.length) {
      setIaResults(prev => [{ query, result: { title: 'Sem dados', panels: [{ type: 'text', content: 'Carregue os dados de um dia antes de analisar.' }] } }, ...prev]);
      return;
    }
    setAiLoading(true);
    try {
      const flat   = l => Object.values(grid[l] || {}).flat();
      const totOK  = lines.reduce((s, l) => s + flat(l).filter(r => r.status==='OK').length, 0);
      const totNG  = lines.reduce((s, l) => s + flat(l).filter(r => r.status==='NG').length, 0);
      const totSem = lines.reduce((s, l) => s + flat(l).filter(r => r.status==='SEM PLACA').length, 0);
      const tot    = totOK + totNG + totSem;

      // Run local analysis (may return null for free-form queries)
      const localResult = runAnalysis(query, grid, date, compareGrid, compareDate);

      // Always try Gauss
      let gaussResponse = null;
      try {
        const { data: aiData } = await axios.post(`${API_BASE}/router/ai-alerts`, {
          message:    query,
          grid,
          date,
          linhas:     lines,
          alerts,
          totalOK:    totOK,
          totalNG:    totNG,
          totalSem:   totSem,
          eficiencia: tot > 0 ? Math.round((totOK / tot) * 100) : 0,
        });
        if (aiData?.response && aiData.response !== 'Sem resposta da IA.') {
          gaussResponse = aiData.response;
        }
      } catch { /* Gauss indisponível — usa só local */ }

      let finalResult;

      if (localResult && gaussResponse) {
        // Tem análise local E Gauss: adiciona painel Gauss no topo
        finalResult = {
          ...localResult,
          gaussText: gaussResponse,
        };
      } else if (localResult) {
        // Só análise local (Gauss falhou)
        finalResult = localResult;
      } else if (gaussResponse) {
        // Só Gauss respondeu (query free-form sem padrão local)
        // Adiciona painel de contexto básico junto
        const ctx   = buildContext(grid);
        const linhasS = Object.keys(ctx).sort((a,b)=>(parseInt(a.replace(/\D/g,''))||0)-(parseInt(b.replace(/\D/g,''))||0));
        const ef    = tot > 0 ? Math.round(totOK/tot*100) : 0;
        finalResult = {
          title: query.length > 50 ? query.slice(0,50)+'…' : query,
          gaussText: gaussResponse,
          panels: [
            { type: 'kpi', cards: [
              { label: 'OK',         value: totOK,  color: 'green' },
              { label: 'NG',         value: totNG,  color: totNG  > 0 ? 'red'   : 'green' },
              { label: 'Sem Placa',  value: totSem+'h', color: totSem > 0 ? 'amber' : 'green' },
              { label: 'Eficiência', value: ef+'%', color: ef>=80?'green':ef>=60?'amber':'red' },
            ]},
          ],
        };
      } else {
        // Nem local nem Gauss funcionou
        finalResult = {
          title: 'Consulta não reconhecida',
          panels: [{ type: 'text', content:
            'Não consegui processar essa consulta. Tente:\n\n' +
            '• **Resumo geral** — visão do dia\n• **Ranking de eficiência** — melhor/pior linha\n' +
            '• **Análise de NG** — causas e defeitos\n• **Análise por turno** — 1T / 2T / 3T\n' +
            '• **Causas de falha** — tipos de defeito\n• **"Como foi a SMD-5?"** — linha específica\n' +
            '• **Linhas paradas** — horas sem placa'
          }],
        };
      }

      setIaResults(prev => [{ query, result: finalResult }, ...prev.slice(0, 4)]);
    } catch (err) {
      const result = runAnalysis(query, grid, date, compareGrid, compareDate) || {
        title: 'Erro',
        panels: [{ type: 'text', content: 'Erro ao processar. Tente novamente.' }],
      };
      setIaResults(prev => [{ query, result }, ...prev.slice(0, 4)]);
    } finally { setAiLoading(false); }
  };

  const linhas   = Object.keys(grid).sort((a, b) =>
    (parseInt(a.replace(/\D/g, '')) || 0) - (parseInt(b.replace(/\D/g, '')) || 0)
  );
  const flatAll  = l => Object.values(grid[l] || {}).flat();
  const totalOK  = linhas.reduce((s, l) => s + flatAll(l).filter(r => r.status === 'OK').length, 0);
  const totalNG  = linhas.reduce((s, l) => s + flatAll(l).filter(r => r.status === 'NG').length, 0);
  const totalSem = linhas.reduce((s, l) => s + flatAll(l).filter(r => r.status === 'SEM PLACA').length, 0);

  const TABS = [
    { key: 'monitor', label: 'Monitor',                                                              icon: Monitor },
    { key: 'alertas', label: `Alertas${alerts.length ? ` (${alerts.length})` : ''}`,                icon: Bell    },
    { key: 'ia',      label: 'Análise IA',                                                           icon: Bot     },
  ];

  /* ── Render ──────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex flex-col">

      {/* Topbar */}
      <header className="bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Monitor size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">MX SMD Visual Inspection monitoring System </span>
          </div>
          {/* Turno badge */}
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
            {turnoAtual}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 border border-gray-200 dark:border-dark-border rounded-lg px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-bg">
            <Calendar size={13} className="text-gray-400" />
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="bg-transparent outline-none text-xs cursor-pointer" />
          </div>
          <button onClick={load}
            className={`p-2 rounded-lg border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-card text-gray-500 transition-colors ${loading ? 'animate-spin' : ''}`}
            title="Atualizar">
            <RefreshCw size={14} />
          </button>
          <button onClick={toggleDarkMode}
            className="p-2 rounded-lg border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-card text-gray-500 transition-colors">
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </header>

      {/* KPI bar */}
      <div className="bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border px-6 py-2 flex items-center gap-6 text-xs flex-wrap">
        <span className="text-gray-400">{linhas.length} linhas</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-gray-700 dark:text-gray-300 font-semibold">{totalOK}</span>
          <span className="text-gray-400">OK</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-gray-700 dark:text-gray-300 font-semibold">{totalNG}</span>
          <span className="text-gray-400">NG</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-400" />
          <span className="text-gray-700 dark:text-gray-300 font-semibold">{totalSem}</span>
          <span className="text-gray-400">Sem Placa</span>
        </div>
        <div className="flex items-center gap-1.5 text-violet-500 dark:text-violet-400">
          <span className="w-2 h-2 rounded-full bg-violet-400" />
          <span>SETUP = troca de modelo (excluído)</span>
        </div>
        {/* Alertas agrupados no canto direito */}
        {alerts.length > 0 && (
          <div className="ml-auto flex items-center gap-3">
            {alerts.filter(a => a.severity === 'high').length > 0 && (
              <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-semibold animate-pulse px-2 py-1 rounded-lg bg-red-50 dark:bg-red-900/20">
                <AlertTriangle size={14} />
                <span className="text-xs">{alerts.filter(a => a.severity === 'high').length} crítico{alerts.filter(a => a.severity === 'high').length > 1 ? 's' : ''}</span>
              </div>
            )}
            <button 
              onClick={() => setShowAlertPanel(!showAlertPanel)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors">
              <Bell size={16} />
              {showAlertPanel ? 'Ocultar' : 'Mostrar'} alertas ({alerts.length})
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border px-6 flex items-center gap-1">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 -mb-px transition-colors
                ${tab === t.key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              <Icon size={13} /> {t.label}
              {t.key === 'alertas' && aiAlertsLoading && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">

        {/* ── MONITOR TAB ──────────────────────────────────────────────────── */}
        {tab === 'monitor' && (
          <div className="p-4">
            {showAlertPanel && alerts.length > 0 && (
              <div className="mb-4 bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-dark-border">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                    <Bell size={13} className="text-amber-500" /> Alertas inteligentes
                  </div>
                  <button onClick={() => setShowAlertPanel(false)} className="p-0.5 text-gray-400 hover:text-gray-600">
                    <X size={13} />
                  </button>
                </div>
                <div className="p-3 flex flex-wrap gap-2">
                  {alerts.map(a => (
                    <div key={a.id} className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${
                      a.severity === 'high'
                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-400'
                        : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-400'
                    }`}>
                      {a.severity === 'high' ? <XCircle size={13} className="mt-0.5 flex-shrink-0" /> : <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />}
                      <span>
                        <strong>{a.linha}</strong> — {a.type}: {a.msg}
                        {a.predictPct && (
                          <span className="ml-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-[9px] font-bold">
                            <Zap size={8} /> {a.predictPct}%
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : linhas.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
                <Monitor size={36} className="opacity-30" />
                <p className="text-sm">Nenhum dado para {date}</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs" style={{ borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: '1200px' }}>
                    <thead>
                      <tr style={{ display: 'table-row' }} className="bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-dark-border">
                        <th className="sticky left-0 bg-gray-50 dark:bg-dark-bg px-4 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400 z-20 w-32 border-r border-gray-200 dark:border-dark-border" style={{ display: 'table-cell', position: 'sticky', left: 0 }}>
                          Linha
                        </th>
                        {HOURS.map((h, idx) => {
                          const t = getTurno(h);
                          const tCls = t === '1T' ? 'text-blue-600 dark:text-blue-400' : t === '2T' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400';
                          return (
                            <th key={h} className="px-0.5 py-1 text-center font-semibold text-gray-400 dark:text-gray-500" style={{ display: 'table-cell', minWidth: '56px', width: '56px' }}>
                              <div>{String(h).padStart(2, '0')}h</div>
                              <div className={`text-[8px] font-bold ${tCls}`}>{t}</div>
                            </th>
                          );
                        })}
                      </tr>
                      {/* Linha de departamentos */}
                      <tr style={{ display: 'table-row' }} className="border-b border-gray-200 dark:border-dark-border">
                        <th className="sticky left-0 bg-gray-50 dark:bg-dark-bg px-4 py-0 text-[9px] font-semibold text-gray-400 dark:text-gray-500 z-20 border-r border-gray-200 dark:border-dark-border text-left" style={{ display: 'table-cell', position: 'sticky', left: 0 }}>
                          Dept
                        </th>
                        {HOURS.map((h, idx) => {
                          const dept = getDept(h);
                          const passed = h < nowHour;
                          const hasData = linhas.some(l => (grid[l]?.[h] || []).length > 0);
                          const missed  = passed && !hasData && dept;
                          return (
                            <th key={h} className={`px-0 text-center text-[8px] font-bold leading-none h-4 ${
                              missed
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400'
                                : dept
                                  ? 'bg-gray-50 dark:bg-dark-bg/60 text-gray-400 dark:text-gray-600'
                                  : ''
                            }`} style={{ display: 'table-cell', minWidth: '56px', width: '56px' }}>
                              {dept}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody style={{ display: 'table-row-group' }} className="divide-y divide-gray-50 dark:divide-dark-border">
                      {linhas.map(linha => {
                        const lineAlerts = alerts.filter(a => a.linha === linha);
                        const hasHigh    = lineAlerts.some(a => a.severity === 'high');
                        const hasMed     = lineAlerts.length > 0;
                        return (
                          <tr key={linha} className="group hover:bg-blue-50/20 dark:hover:bg-blue-900/10" style={{ display: 'table-row' }}>
                            <td className={`sticky left-0 px-4 py-2 font-semibold text-gray-800 dark:text-gray-200 z-20 border-r whitespace-nowrap
                              ${hasHigh ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30'
                              : hasMed  ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30'
                              : 'bg-white dark:bg-dark-surface border-gray-200 dark:border-dark-border'}`}
                              style={{ display: 'table-cell', position: 'sticky', left: 0, minWidth: '128px' }}>
                              <div className="flex items-center gap-1.5">
                                {hasHigh && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                                {!hasHigh && hasMed && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                                {linha}
                              </div>
                            </td>
                            {HOURS.map(h => {
                              const recs  = grid[linha]?.[h] || [];
                              const setup = recs.length > 0 && isSetupHour(recs);
                              const status = recs.length ? recs[0].status : '';
                              
                              // Determina o que mostrar na célula
                              let label, titleText, cellColor;
                              
                              if (setup) {
                                // SETUP - mostra 'SETUP'
                                label = 'SETUP';
                                titleText = 'Troca de modelo';
                                cellColor = STATUS_CFG['SETUP'].color;
                              } else if (recs.length && status === 'NG') {
                                // NG - mostra a 1ª palavra da causa (como os inspetores registram)
                                const causaFull = recs[0]?.causa || recs[0]?.cause || 'NG';
                                const causaCurta = causaFull.split(' ')[0].substring(0, 12);
                                label = causaCurta;
                                titleText = `${causaFull} (${recs.length} regs)`;
                                cellColor = STATUS_CFG['NG'].color;
                              } else if (recs.length && status === 'OK') {
                                // OK - mostra 'OK'
                                label = 'OK';
                                titleText = recs[0]?.causa || 'OK';
                                cellColor = STATUS_CFG['OK'].color;
                              } else if (recs.length && status === 'SEM PLACA') {
                                // SEM PLACA - mostra 'S/PLACA'
                                label = 'S/PLACA';
                                titleText = 'Sem placa registrada';
                                cellColor = STATUS_CFG['SEM PLACA'].color;
                              } else {
                                // Vazio - sem dados
                                label = '';
                                titleText = 'Sem dados';
                                cellColor = STATUS_CFG['empty'].color;
                              }
                              
                              return (
                                <td key={h} className="px-0.5 py-1"
                                  style={{ display: 'table-cell', minWidth: '56px', width: '56px' }}
                                  onClick={() => recs.length && setCellModal({ records: recs, linha, hora: h })}>
                                  <div className={`h-8 rounded flex items-center justify-center gap-0.5 text-[9px] font-bold select-none
                                    ${recs.length ? 'cursor-pointer hover:opacity-80' : ''} ${cellColor}`}
                                    title={titleText}>
                                    {label}
                                    {recs.length > 1 && <span className="text-[8px] font-normal opacity-80">×{recs.length}</span>}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-100 dark:border-dark-border text-[11px] text-gray-500 flex-wrap">
                  <div className="flex items-center gap-1.5"><span className="px-2 py-0.5 rounded bg-green-500 text-white text-[10px] font-bold">OK</span></div>
                  <div className="flex items-center gap-1.5"><span className="px-2 py-0.5 rounded bg-red-500 text-white text-[10px] font-bold">NG</span></div>
                  <div className="flex items-center gap-1.5"><span className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-200 text-[10px] font-bold">S/PLACA</span> Sem Placa</div>
                  <div className="flex items-center gap-1.5"><span className="px-1 py-0.5 rounded bg-violet-400 text-white text-[10px] font-bold">SETUP</span> Troca de modelo</div>
                  <span className="ml-auto text-gray-400">Clique na célula para detalhes</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ALERTAS TAB ──────────────────────────────────────────────────── */}
        {tab === 'alertas' && (() => {
          const jus = selectedAlert ? generateJustification(selectedAlert, grid) : null;
          return (
          <div className="flex h-full overflow-hidden">

            {/* ── COLUNA ESQUERDA: Cards de linha (grid 3 col) ── */}
            <div className="w-[310px] flex-shrink-0 border-r border-gray-200 dark:border-dark-border overflow-y-auto p-2.5 flex flex-col">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 px-0.5">
                Status · {date}
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {linhas.map(l => {
                  const recs  = flatAll(l);
                  const ok    = recs.filter(r => r.status === 'OK'        && !isSetupRecord(r)).length;
                  const ng    = recs.filter(r => r.status === 'NG'        && !isSetupRecord(r)).length;
                  const sem   = recs.filter(r => r.status === 'SEM PLACA' && !isSetupRecord(r)).length;
                  const setup = recs.filter(r => isSetupRecord(r)).length;
                  const tot   = ok + ng + sem;
                  const ef    = tot > 0 ? Math.round(ok / tot * 100) : null;
                  const la    = alerts.filter(a => a.linha === l);
                  const hasH  = la.some(a => a.severity === 'high');
                  const pred  = la.find(a => a.predictPct);
                  const efCls = ef === null ? 'text-gray-400'
                              : ef >= 80   ? 'text-green-600 dark:text-green-400'
                              : ef >= 60   ? 'text-amber-500 dark:text-amber-400'
                              : 'text-red-600 dark:text-red-400';
                  const barCls = ef === null ? 'bg-gray-300 dark:bg-gray-700'
                               : ef >= 80   ? 'bg-green-500'
                               : ef >= 60   ? 'bg-amber-500'
                               : 'bg-red-500';
                  return (
                    <button key={l}
                      onClick={() => { if (la[0]) setSelectedAlert(la[0]); }}
                      className={`text-left rounded-xl border p-2 transition-all w-full ${
                        la.length ? 'cursor-pointer hover:scale-[1.02] hover:shadow-sm' : 'cursor-default'
                      } ${hasH
                          ? 'border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/10'
                          : la.length
                          ? 'border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/10'
                          : 'border-gray-100 dark:border-dark-border bg-white dark:bg-dark-surface'
                      }`}>
                      {/* Nome + badge */}
                      <div className="flex items-start justify-between gap-0.5 mb-1.5">
                        <span className="text-[11px] font-black text-gray-900 dark:text-white leading-none">
                          {l.replace(/\D/g,'')}
                        </span>
                        {la.length > 0 && (
                          <span className={`text-[7px] font-bold w-3.5 h-3.5 rounded-full text-white flex items-center justify-center flex-shrink-0 ${hasH ? 'bg-red-500' : 'bg-amber-400'}`}>
                            {la.length}
                          </span>
                        )}
                      </div>
                      {/* Eficiência grande */}
                      <p className={`text-base font-black leading-none mb-1 ${efCls}`}>
                        {ef !== null ? ef + '%' : '—'}
                      </p>
                      {/* Barra */}
                      <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-1.5">
                        <div className={`h-full rounded-full ${barCls}`} style={{ width: (ef||0) + '%' }} />
                      </div>
                      {/* Contadores */}
                      <p className="text-[8px] text-gray-400 dark:text-gray-500 leading-tight">
                        {ok}✓ <span className={ng > 0 ? 'text-red-500' : ''}>{ng}✗</span> {sem}⏸
                      </p>
                      {pred && (
                        <p className="text-[7px] font-bold text-violet-500 mt-1 flex items-center gap-0.5 leading-tight">
                          <Zap size={6} /> {pred.predictPct}%
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── COLUNA DIREITA: Alertas ou detalhe ── */}
            <div className="flex-1 overflow-y-auto p-4">

              {/* Gauss no topo — só na lista */}
              {!selectedAlert && (aiAlertsLoading || aiAlerts) && (
                <div className="mb-3 rounded-xl border border-blue-200 dark:border-blue-800/40 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900/10 dark:to-green-900/10 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <Bot size={12} className="text-white" />
                    </div>
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-300">Gauss IA</span>
                    {aiAlertsLoading && <RefreshCw size={11} className="animate-spin text-blue-500" />}
                    {aiAlerts && <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">✓ IA</span>}
                  </div>
                  {aiAlertsLoading && <p className="text-[11px] text-blue-600 dark:text-blue-400 italic">Analisando turno...</p>}
                  {aiAlerts && <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{aiAlerts}</p>}
                </div>
              )}

              {/* DETALHE DO ALERTA */}
              {selectedAlert && jus && (
                <div className="flex flex-col gap-3">
                  <button onClick={() => setSelectedAlert(null)}
                    className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors w-fit">
                    ← Voltar para alertas
                  </button>

                  {/* Header */}
                  <div className={`rounded-xl border p-3 ${
                    selectedAlert.severity === 'high'
                      ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/40'
                      : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/40'
                  }`}>
                    <div className="flex items-center gap-3">
                      {selectedAlert.severity === 'high'
                        ? <XCircle size={18} className="text-red-500 flex-shrink-0" />
                        : <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />}
                      <div>
                        <p className={`text-sm font-bold flex items-center gap-2 flex-wrap ${
                          selectedAlert.severity === 'high' ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'
                        }`}>
                          SMD-{selectedAlert.linha.replace(/\D/g,'')} — {selectedAlert.type}
                          {selectedAlert.predictPct && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-[9px] font-bold">
                              <Zap size={8} /> {selectedAlert.predictPct}% risco
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{selectedAlert.msg}</p>
                      </div>
                    </div>
                  </div>

                  {/* Por que? */}
                  <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-card flex items-center gap-2">
                      <Bot size={12} className="text-blue-600" />
                      <span className="text-xs font-bold text-gray-800 dark:text-white">Por que este alerta?</span>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{jus.why}</p>
                    </div>
                  </div>

                  {/* Fatores */}
                  <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-card">
                      <span className="text-xs font-bold text-gray-800 dark:text-white">Fatores detectados</span>
                    </div>
                    <div className="px-4 py-3 flex flex-col gap-1.5">
                      {jus.factors.map((f, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                          <span className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="rounded-xl border border-green-200 dark:border-green-800/40 bg-green-50 dark:bg-green-900/10 overflow-hidden">
                    <div className="px-4 py-2 border-b border-green-100 dark:border-green-800/30 flex items-center gap-2">
                      <CheckCircle2 size={12} className="text-green-600 dark:text-green-400" />
                      <span className="text-xs font-bold text-green-800 dark:text-green-300">Ações recomendadas</span>
                    </div>
                    <div className="px-4 py-3 flex flex-col gap-1.5">
                      {jus.actions.map((a, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-xs font-bold text-green-600 dark:text-green-400 flex-shrink-0 min-w-[18px]">{i + 1}.</span>
                          <span className="text-xs text-green-800 dark:text-green-300 leading-relaxed">{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Outros alertas da mesma linha */}
                  {alerts.filter(a => a.linha === selectedAlert.linha && a.id !== selectedAlert.id).length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                        Outros alertas em {selectedAlert.linha}
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {alerts.filter(a => a.linha === selectedAlert.linha && a.id !== selectedAlert.id).map(a => (
                          <button key={a.id} onClick={() => setSelectedAlert(a)}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left cursor-pointer hover:opacity-80 transition-opacity ${
                              a.severity === 'high'
                                ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/40'
                                : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/40'
                            }`}>
                            {a.severity === 'high'
                              ? <XCircle size={13} className="text-red-500 flex-shrink-0" />
                              : <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />}
                            <span className={`text-xs font-semibold flex-1 ${a.severity === 'high' ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                              {a.type}
                            </span>
                            {a.predictPct && (
                              <span className="text-[9px] font-bold text-violet-600 dark:text-violet-400 flex items-center gap-0.5">
                                <Zap size={8} /> {a.predictPct}%
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* LISTA DE ALERTAS */}
              {!selectedAlert && (
                alerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                    <CheckCircle2 size={36} className="text-green-400 mb-2" />
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">Nenhum alerta detectado</p>
                    <p className="text-xs mt-1">Todas as linhas operando normalmente</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] text-gray-400 mb-1">
                      {alerts.filter(a => a.severity==='high').length} crítico{alerts.filter(a=>a.severity==='high').length!==1?'s':''} · {alerts.filter(a=>a.severity==='medium').length} atenção — clique para detalhes
                    </p>
                    {alerts.map(a => (
                      <button key={a.id} onClick={() => setSelectedAlert(a)}
                        className={`flex items-start gap-3 p-3 rounded-xl border text-left cursor-pointer hover:opacity-80 transition-opacity w-full ${
                          a.severity === 'high'
                            ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/40'
                            : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/40'
                        }`}>
                        {a.severity === 'high'
                          ? <XCircle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                          : <AlertTriangle size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold flex items-center gap-1.5 flex-wrap ${
                            a.severity === 'high' ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'
                          }`}>
                            SMD-{a.linha.replace(/\D/g,'')} — {a.type}
                            {a.predictPct && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-[9px] font-bold">
                                <Zap size={8} /> {a.predictPct}%
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{a.msg}</p>
                        </div>
                        <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">›</span>
                      </button>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
          );
        })()}

        {/* ── IA TAB ───────────────────────────────────────────────────────── */}
        {tab === 'ia' && (
          <div className="p-6 max-w-5xl mx-auto space-y-3">
            <div className="flex items-end justify-between pb-3 border-b border-gray-200 dark:border-dark-border">
              <div>
                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-0.5">Centro de Análise</p>
                <h2 className="text-xl font-black text-gray-900 dark:text-white leading-none">Diagnóstico de Produção</h2>
                <p className="text-xs text-gray-400 mt-0.5">Linhas de corte · {date} · {turnoAtual}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400">Linhas monitoradas</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">{linhas.length}</p>
              </div>
            </div>

            {/* Comparação */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border">
              <TrendingDown size={13} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-500 flex-shrink-0">Comparar com:</span>
              <input type="date" value={compareDate}
                onChange={e => { setCompareDate(e.target.value); setCompareGrid(null); }}
                className="flex-1 min-w-0 text-xs bg-transparent text-gray-700 dark:text-gray-300 outline-none cursor-pointer" />
              <button onClick={loadCompare} disabled={!compareDate || cmpLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[11px] font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {cmpLoading ? <RefreshCw size={11} className="animate-spin" /> : <Calendar size={11} />}
                Carregar
              </button>
              {compareGrid && !cmpLoading && (
                <span className="text-[11px] text-green-600 dark:text-green-400 font-semibold flex-shrink-0">✓ {compareDate}</span>
              )}
            </div>

            {/* Terminal */}
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 bg-gray-900 dark:bg-zinc-950 rounded-xl px-4 py-2.5 border border-gray-700 dark:border-zinc-700">
                <span className="text-green-400 font-mono text-sm select-none flex-shrink-0">›</span>
                <input value={iaQuery} onChange={e => setIaQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && runQuery()}
                  placeholder="Resumo geral · Linhas com NG · Eficiência · Comparar datas..."
                  className="flex-1 bg-transparent text-white text-xs font-mono outline-none placeholder-gray-600 min-w-0" />
                {iaQuery && (
                  <button onClick={() => setIaQuery('')} className="text-gray-600 hover:text-gray-400"><X size={12} /></button>
                )}
              </div>
              <button onClick={() => runQuery()} disabled={!iaQuery.trim() || iaLoading}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1.5">
                {iaLoading ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                Analisar
              </button>
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Resumo do dia',      q: 'Resumo geral do dia'       },
                { label: 'Ranking eficiência', q: 'Ranking de eficiência'     },
                { label: 'Linhas com NG',      q: 'Análise de NG'             },
                { label: 'Linhas paradas',     q: 'Linhas paradas'            },
                { label: 'Causas de defeito',  q: 'Causas de falha e defeito' },
                { label: 'Análise por turno',  q: 'Análise por turno'         },
                { label: 'Melhores linhas',    q: 'Linhas com melhor desempenho' },
                compareGrid && { label: `Comparar vs ${compareDate}`, q: `Comparar ${date} vs ${compareDate}` },
              ].filter(Boolean).map(item => (
                <button key={item.label}
                  onClick={() => { setIaQuery(item.q); runQuery(item.q); }}
                  className="px-3 py-1 rounded-lg text-[11px] border border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-card hover:border-blue-400 hover:text-blue-600 transition-colors">
                  {item.label}
                </button>
              ))}
            </div>

            {iaLoading && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40">
                <RefreshCw size={14} className="animate-spin text-blue-600 dark:text-blue-400" />
                <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">Consultando Gauss IA...</span>
              </div>
            )}

            <div ref={resultsRef} className="space-y-3">
              {iaResults.map((r, i) => (
                <AnalysisResult key={i} result={r.result} query={r.query} />
              ))}
              {!iaLoading && iaResults.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Bot size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Nenhuma análise ainda</p>
                  <p className="text-xs mt-1">Digite uma consulta ou use os atalhos acima</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cell modal */}
      {cellModal && (
        <CellModal records={cellModal.records} linha={cellModal.linha} hora={cellModal.hora}
          onClose={() => setCellModal(null)} />
      )}
    </div>
  );
}
