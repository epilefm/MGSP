import { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCw, BarChart2, Bot, Send, X } from 'lucide-react';
import api from '../../api';

/* ── Formatters ────────────────────────────────────────────────────────────── */
const fmtCurrency = v =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtNum = v => Number(v || 0).toLocaleString('pt-BR');
const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/* ── KpiRow ────────────────────────────────────────────────────────────────── */
function KpiRow({ cards }) {
  const cols =
    cards.length <= 2 ? 'grid-cols-2'
    : cards.length === 3 ? 'grid-cols-3'
    : 'grid-cols-2 sm:grid-cols-4';
  return (
    <div className={`grid gap-3 ${cols}`}>
      {cards.map((c, i) => (
        <div key={i} className={`rounded-xl p-4 border ${c.bg || 'bg-gray-50 dark:bg-dark-bg'} ${c.border || 'border-gray-100 dark:border-dark-border'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${c.labelCls || 'text-gray-400'}`}>
            {c.label}
          </p>
          <p className={`text-2xl font-bold leading-none ${c.valueCls || 'text-gray-900 dark:text-white'}`}>
            {c.value}
          </p>
          {c.sub && <p className={`text-xs mt-1 ${c.subCls || 'text-gray-400'}`}>{c.sub}</p>}
        </div>
      ))}
    </div>
  );
}

/* ── HBarChart ─────────────────────────────────────────────────────────────── */
const BAR_COLORS = [
  'bg-red-500','bg-orange-500','bg-amber-500','bg-yellow-500',
  'bg-emerald-500','bg-sky-500','bg-blue-500','bg-violet-500',
];

function HBarChart({ title, data, unit = '' }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="rounded-xl border border-gray-100 dark:border-dark-border overflow-hidden">
      {title && (
        <div className="px-4 py-2.5 bg-gray-50 dark:bg-dark-bg border-b border-gray-100 dark:border-dark-border">
          <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">{title}</p>
        </div>
      )}
      <div className="p-4 space-y-2.5">
        {data.map((d, i) => {
          const pct     = Math.round((d.value / max) * 100);
          const display = unit === 'currency'
            ? fmtCurrency(d.value)
            : `${fmtNum(d.value)}${unit ? ' ' + unit : ''}`;
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="w-24 text-[11px] font-semibold text-gray-700 dark:text-gray-300 truncate text-right flex-shrink-0">
                {d.label}
              </span>
              <div className="flex-1 bg-gray-100 dark:bg-dark-bg rounded-full h-5 overflow-hidden">
                <div className={`h-5 rounded-full flex items-center justify-end pr-2 ${BAR_COLORS[i % BAR_COLORS.length]}`}
                  style={{ width: `${Math.max(pct, 4)}%` }}>
                  <span className="text-[9px] font-bold text-white whitespace-nowrap">{pct}%</span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 w-28 text-right flex-shrink-0">
                {display}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── DataTable ─────────────────────────────────────────────────────────────── */
function DataTable({ title, headers, rows, highlightFirst = true, highlightCol = -1 }) {
  if (!rows?.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 dark:border-dark-border overflow-hidden">
      {title && (
        <div className="px-4 py-2.5 bg-gray-50 dark:bg-dark-bg border-b border-gray-100 dark:border-dark-border">
          <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">{title}</p>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 dark:bg-dark-bg border-b border-gray-100 dark:border-dark-border">
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-2 text-left font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-dark-border">
            {rows.map((row, ri) => (
              <tr key={ri} className="hover:bg-gray-50 dark:hover:bg-dark-bg/40 transition-colors">
                {row.map((cell, ci) => (
                  <td key={ci} className={`px-4 py-2.5 whitespace-nowrap ${
                    ci === 0 && highlightFirst
                      ? 'font-semibold text-gray-900 dark:text-white'
                      : ci === highlightCol
                      ? 'font-bold text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── GaussPanel ────────────────────────────────────────────────────────────── */
function GaussPanel({ text }) {
  if (!text) return null;
  return (
    <div className="rounded-xl border border-red-200 dark:border-red-800/40 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/15 dark:to-orange-900/10 overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-red-100 dark:border-red-800/30">
        <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0">
          <Bot size={12} className="text-white" />
        </div>
        <span className="text-xs font-bold text-red-900 dark:text-red-300">Análise Gauss IA</span>
        <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400">
          ✦ IA
        </span>
      </div>
      <div className="px-4 py-3">
        <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
          {text.split('**').map((part, pi) =>
            pi % 2 === 1
              ? <strong key={pi} className="text-red-900 dark:text-red-200">{part}</strong>
              : part
          )}
        </p>
      </div>
    </div>
  );
}

/* ── AnalysisResult ────────────────────────────────────────────────────────── */
function AnalysisResult({ result, query }) {
  if (!result) return null;
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden">
      <div className="px-5 py-3.5 bg-gray-50 dark:bg-dark-bg border-b border-gray-100 dark:border-dark-border flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
          <BarChart2 size={13} className="text-red-600 dark:text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{result.title}</p>
          <p className="text-[10px] text-gray-400 font-mono truncate">› {query}</p>
        </div>
        {result.gaussText && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 flex-shrink-0">
            ✦ IA
          </span>
        )}
      </div>
      <div className="p-5 space-y-4">
        {result.gaussText && <GaussPanel text={result.gaussText} />}
        {result.panels.map((panel, i) => {
          if (panel.type === 'kpi')   return <KpiRow key={i} cards={panel.cards} />;
          if (panel.type === 'hbar')  return <HBarChart key={i} title={panel.title} data={panel.data} unit={panel.unit} />;
          if (panel.type === 'table') return <DataTable key={i} title={panel.title} headers={panel.headers} rows={panel.rows} highlightFirst={panel.highlightFirst} highlightCol={panel.highlightCol} />;
          if (panel.type === 'text')  return (
            <div key={i} className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-dark-bg rounded-xl p-4 leading-relaxed whitespace-pre-wrap">
              {panel.content.split('**').map((part, pi) =>
                pi % 2 === 1 ? <strong key={pi} className="text-gray-900 dark:text-white">{part}</strong> : part
              )}
            </div>
          );
          return null;
        })}
      </div>
    </div>
  );
}

/* ── Analysis Engine (local) ───────────────────────────────────────────────── */
function groupBy(arr, key) {
  const map = {};
  arr.forEach(r => {
    const k = r[key] || '(sem dado)';
    if (!map[k]) map[k] = { count: 0, custo: 0, qtd: 0 };
    map[k].count++;
    map[k].custo += Number(r.custo_total || 0);
    map[k].qtd   += Number(r.quantidade  || 0);
  });
  return map;
}

function topN(map, sortKey, n = 10) {
  return Object.entries(map)
    .sort((a, b) => b[1][sortKey] - a[1][sortKey])
    .slice(0, n);
}

function runAnalysis(question, data) {
  const q = norm(question);
  const {
    records = [], total = 0, custoTotal = 0, qtd_total = 0,
    topCausas = [], topLinhas = [], topEquip = [], topCausaRaiz = [], patterns = [],
  } = data;

  const porStatus  = groupBy(records, 'status');
  const aprovados  = porStatus['aprovado']?.count  || 0;
  const pendentes  = porStatus['pendente']?.count  || 0;
  const rejeitados = porStatus['rejeitado']?.count || 0;

  /* RESUMO GERAL */
  if (q.match(/resumo|geral|relatorio|overview|tudo|panorama|inicio/)) {
    return {
      title: 'Resumo Geral — Hanaro Scrap',
      panels: [
        { type: 'kpi', cards: [
          { label: 'Total Registros', value: fmtNum(total),           bg: 'bg-red-50 dark:bg-red-900/20',    border: 'border-red-100 dark:border-red-800/30',    labelCls: 'text-red-500',    valueCls: 'text-red-700 dark:text-red-300'    },
          { label: 'Custo Total',     value: fmtCurrency(custoTotal),  bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-800/30', labelCls: 'text-amber-500', valueCls: 'text-amber-700 dark:text-amber-300' },
          { label: 'Qtd Placas',      value: fmtNum(qtd_total),        bg: 'bg-blue-50 dark:bg-blue-900/20',  border: 'border-blue-100 dark:border-blue-800/30',  labelCls: 'text-blue-500',  valueCls: 'text-blue-700 dark:text-blue-300'  },
          { label: 'Pendentes',       value: fmtNum(pendentes),         bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-100 dark:border-orange-800/30', labelCls: 'text-orange-500', valueCls: 'text-orange-700 dark:text-orange-300', sub: `${aprovados} aprovados · ${rejeitados} rejeitados` },
        ]},
        { type: 'hbar', title: 'Top Causas (frequência)', data: topCausas.map(c => ({ label: c.causa || '(sem causa)', value: c.n })) },
        { type: 'hbar', title: 'Top Linhas (custo)', data: topLinhas.map(l => ({ label: l.linha, value: Number(l.custo) })), unit: 'currency' },
      ],
    };
  }

  /* PADRÕES RECORRENTES */
  if (q.match(/padrao|padrão|recorr|sistem|repeti|frequen|sempre|todo|pattern/)) {
    if (!patterns?.length) return {
      title: 'Padrões Recorrentes — Hanaro Scrap',
      panels: [{ type: 'text', content: 'Nenhum padrão recorrente detectado (mínimo 2 ocorrências da mesma combinação modelo+equipamento+causa).' }],
    };
    return {
      title: 'Padrões Recorrentes — Hanaro Scrap',
      panels: [
        { type: 'table',
          title: 'Combinações modelo + equipamento + causa (≥2 ocorrências)',
          headers: ['Modelo', 'Equipamento', 'Causa', 'Ocorr.', 'Placas', 'Custo'],
          rows: patterns.map(p => [p.modelo||'?', p.equipamento||'(sem equip.)', p.causa||'?', fmtNum(p.n), fmtNum(p.qtd), fmtCurrency(p.custo)]),
          highlightCol: 3,
        },
        { type: 'hbar', title: 'Frequência dos padrões',
          data: patterns.slice(0,8).map(p => ({ label: `${p.modelo}+${p.equipamento||'?'}`, value: p.n })),
        },
      ],
    };
  }

  /* CAUSA RAIZ */
  if (q.match(/causa.?raiz|raiz|root.?cause|5.?why|porque|por.?que/)) {
    const comCR = records.filter(r => r.causa_raiz);
    if (!comCR.length && !topCausaRaiz?.length) return {
      title: 'Causa Raiz — Hanaro Scrap',
      panels: [{ type: 'text', content: 'Nenhum registro com causa raiz preenchida. Incentive os operadores a preencher o campo causa raiz para análises mais profundas.' }],
    };
    const crMap = groupBy(comCR, 'causa_raiz');
    return {
      title: 'Análise de Causa Raiz — Hanaro Scrap',
      panels: [
        { type: 'kpi', cards: [
          { label: 'Com Causa Raiz',   value: fmtNum(comCR.length), bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-100 dark:border-red-800/30', labelCls: 'text-red-500', valueCls: 'text-red-700 dark:text-red-300' },
          { label: 'Sem Causa Raiz',   value: fmtNum(records.length - comCR.length), bg: 'bg-gray-50 dark:bg-dark-bg', border: 'border-gray-100 dark:border-dark-border', labelCls: 'text-gray-400', valueCls: 'text-gray-800 dark:text-gray-100' },
          { label: 'Tipos de CR',      value: Object.keys(crMap).length, bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-800/30', labelCls: 'text-amber-500', valueCls: 'text-amber-700 dark:text-amber-300' },
        ]},
        { type: 'hbar', title: 'Frequência por Causa Raiz',
          data: topN(crMap, 'count', 10).map(([k, v]) => ({ label: k, value: v.count })),
        },
        { type: 'table', title: 'Detalhamento de Causa Raiz',
          headers: ['Causa Raiz', 'Ocorrências', 'Qtd Placas', 'Custo'],
          rows: topN(crMap, 'count', 10).map(([k, v]) => [k, fmtNum(v.count), fmtNum(v.qtd), fmtCurrency(v.custo)]),
        },
      ],
    };
  }

  /* EQUIPAMENTO */
  if (q.match(/equipamento|maquina|máquina|printer|reflow|aoi|spi|chip|mounter/)) {
    const porEquip = groupBy(records.filter(r => r.equipamento), 'equipamento');
    const sorted   = topN(porEquip, 'count', 12);
    if (!sorted.length) return {
      title: 'Equipamentos — Hanaro Scrap',
      panels: [{ type: 'text', content: 'Nenhum registro com equipamento identificado. Preencha o campo equipamento nos registros para análise.' }],
    };
    return {
      title: 'Análise por Equipamento — Hanaro Scrap',
      panels: [
        { type: 'kpi', cards: [
          { label: 'Com Equipamento', value: fmtNum(records.filter(r=>r.equipamento).length), bg:'bg-blue-50 dark:bg-blue-900/20', border:'border-blue-100 dark:border-blue-800/30', labelCls:'text-blue-500', valueCls:'text-blue-700 dark:text-blue-300' },
          { label: 'Tipos',          value: sorted.length, bg:'bg-gray-50 dark:bg-dark-bg', border:'border-gray-100 dark:border-dark-border', labelCls:'text-gray-400', valueCls:'text-gray-800 dark:text-gray-100' },
        ]},
        { type: 'hbar', title: 'Scraps por Equipamento (frequência)',
          data: sorted.map(([k, v]) => ({ label: k, value: v.count })),
        },
        { type: 'table', title: 'Detalhamento por Equipamento',
          headers: ['Equipamento', 'Scraps', 'Qtd Placas', 'Custo Total'],
          rows: sorted.map(([k, v]) => [k, fmtNum(v.count), fmtNum(v.qtd), fmtCurrency(v.custo)]),
          highlightCol: 1,
        },
      ],
    };
  }

  /* CUSTO / FINANCEIRO */
  if (q.match(/custo|gasto|valor|financeiro|dinheiro|prejuizo|caro|barato/)) {
    const porLinha  = groupBy(records, 'linha');
    const porModelo = groupBy(records, 'modelo');
    const media     = total > 0 ? custoTotal / total : 0;
    return {
      title: 'Análise de Custo — Hanaro Scrap',
      panels: [
        { type: 'kpi', cards: [
          { label: 'Custo Total',        value: fmtCurrency(custoTotal), bg:'bg-red-50 dark:bg-red-900/20',    border:'border-red-100 dark:border-red-800/30',    labelCls:'text-red-500',    valueCls:'text-red-700 dark:text-red-300'    },
          { label: 'Média por Registro', value: fmtCurrency(media),       bg:'bg-amber-50 dark:bg-amber-900/20', border:'border-amber-100 dark:border-amber-800/30', labelCls:'text-amber-500', valueCls:'text-amber-700 dark:text-amber-300' },
          { label: 'Total Registros',    value: fmtNum(total),             bg:'bg-gray-50 dark:bg-dark-bg',       border:'border-gray-100 dark:border-dark-border',   labelCls:'text-gray-400',  valueCls:'text-gray-800 dark:text-gray-100'  },
          { label: 'Qtd Placas',         value: fmtNum(qtd_total),         bg:'bg-gray-50 dark:bg-dark-bg',       border:'border-gray-100 dark:border-dark-border',   labelCls:'text-gray-400',  valueCls:'text-gray-800 dark:text-gray-100'  },
        ]},
        { type: 'hbar', title: 'Custo por Linha (Top 10)',
          data: topN(porLinha, 'custo', 10).map(([k, v]) => ({ label: k, value: v.custo })),
          unit: 'currency',
        },
        { type: 'table', title: 'Top Modelos por Custo',
          headers: ['Modelo', 'Registros', 'Qtd Placas', 'Custo Total'],
          rows: topN(porModelo, 'custo', 8).map(([k, v]) => [k, fmtNum(v.count), fmtNum(v.qtd), fmtCurrency(v.custo)]),
        },
      ],
    };
  }

  /* CAUSA / DEFEITO */
  if (q.match(/causa|defeito|problema|motivo|falha|ocorrencia/)) {
    const porCausa = groupBy(records, 'causa');
    const sorted   = topN(porCausa, 'count', 12);
    return {
      title: 'Análise de Causas — Hanaro Scrap',
      panels: [
        { type: 'kpi', cards: [
          { label: 'Tipos de Causa', value: Object.keys(porCausa).length, bg:'bg-red-50 dark:bg-red-900/20', border:'border-red-100 dark:border-red-800/30', labelCls:'text-red-500', valueCls:'text-red-700 dark:text-red-300' },
          { label: 'Total Scraps',   value: fmtNum(total),                 bg:'bg-gray-50 dark:bg-dark-bg',   border:'border-gray-100 dark:border-dark-border',  labelCls:'text-gray-400', valueCls:'text-gray-800 dark:text-gray-100'  },
          { label: 'Custo Total',    value: fmtCurrency(custoTotal),        bg:'bg-amber-50 dark:bg-amber-900/20', border:'border-amber-100 dark:border-amber-800/30', labelCls:'text-amber-500', valueCls:'text-amber-700 dark:text-amber-300' },
        ]},
        { type: 'hbar', title: 'Frequência por Causa', data: sorted.map(([k, v]) => ({ label: k, value: v.count })) },
        { type: 'table', title: 'Detalhamento por Causa',
          headers: ['Causa', 'Ocorrências', 'Qtd Placas', 'Custo Total'],
          rows: sorted.map(([k, v]) => [k, fmtNum(v.count), fmtNum(v.qtd), fmtCurrency(v.custo)]),
        },
      ],
    };
  }

  /* LINHA / ÁREA */
  if (q.match(/linha|area|setor|smd/)) {
    const porLinha = groupBy(records, 'linha');
    const sorted   = topN(porLinha, 'custo', 15);
    return {
      title: 'Análise por Linha — Hanaro Scrap',
      panels: [
        { type: 'hbar', title: 'Custo por Linha (SMD)', data: sorted.map(([k, v]) => ({ label: k, value: v.custo })), unit: 'currency' },
        { type: 'table', title: 'Detalhamento por Linha',
          headers: ['Linha', 'Registros', 'Qtd Placas', 'Custo Total'],
          rows: sorted.map(([k, v]) => [k, fmtNum(v.count), fmtNum(v.qtd), fmtCurrency(v.custo)]),
        },
      ],
    };
  }

  /* MODELO / PRODUTO */
  if (q.match(/modelo|produto|halb|item|celular|sm-/)) {
    const porModelo = groupBy(records, 'modelo');
    const sorted    = topN(porModelo, 'custo', 12);
    return {
      title: 'Análise por Modelo — Hanaro Scrap',
      panels: [
        { type: 'hbar', title: 'Top Modelos (custo)', data: sorted.map(([k, v]) => ({ label: k, value: v.custo })), unit: 'currency' },
        { type: 'table', title: 'Detalhamento por Modelo',
          headers: ['Modelo', 'Registros', 'Qtd Placas', 'Custo Total'],
          rows: sorted.map(([k, v]) => [k, fmtNum(v.count), fmtNum(v.qtd), fmtCurrency(v.custo)]),
        },
      ],
    };
  }

  /* TURNO */
  if (q.match(/turno/)) {
    const porTurno = groupBy(records, 'turno');
    const turnos   = Object.entries(porTurno).sort((a, b) => a[0].localeCompare(b[0]));
    const TCOL = {
      '1T': { bg:'bg-blue-50 dark:bg-blue-900/20',    border:'border-blue-100 dark:border-blue-800/30',    labelCls:'text-blue-500',    valueCls:'text-blue-700 dark:text-blue-300'    },
      '2T': { bg:'bg-amber-50 dark:bg-amber-900/20',   border:'border-amber-100 dark:border-amber-800/30',   labelCls:'text-amber-500',   valueCls:'text-amber-700 dark:text-amber-300'   },
      '3T': { bg:'bg-purple-50 dark:bg-purple-900/20', border:'border-purple-100 dark:border-purple-800/30', labelCls:'text-purple-500',  valueCls:'text-purple-700 dark:text-purple-300' },
    };
    return {
      title: 'Análise por Turno — Hanaro Scrap',
      panels: [
        { type: 'kpi', cards: turnos.map(([k, v]) => ({ label:`Turno ${k}`, value:fmtNum(v.count), sub:fmtCurrency(v.custo), ...(TCOL[k]||{}) })) },
        { type: 'hbar', title: 'Custo por Turno', data: turnos.map(([k, v]) => ({ label: k, value: v.custo })), unit: 'currency' },
        { type: 'table', title: 'Detalhamento por Turno',
          headers: ['Turno', 'Registros', 'Qtd Placas', 'Custo Total'],
          rows: turnos.map(([k, v]) => [k, fmtNum(v.count), fmtNum(v.qtd), fmtCurrency(v.custo)]),
        },
      ],
    };
  }

  /* STATUS / APROVAÇÃO */
  if (q.match(/status|aprovac|aprovado|pendente|rejeitado/)) {
    const SCOL = {
      'aprovado':  { bg:'bg-green-50 dark:bg-green-900/20',  border:'border-green-100 dark:border-green-800/30',  labelCls:'text-green-500',  valueCls:'text-green-700 dark:text-green-300'  },
      'pendente':  { bg:'bg-amber-50 dark:bg-amber-900/20',  border:'border-amber-100 dark:border-amber-800/30',  labelCls:'text-amber-500',  valueCls:'text-amber-700 dark:text-amber-300'  },
      'rejeitado': { bg:'bg-red-50 dark:bg-red-900/20',      border:'border-red-100 dark:border-red-800/30',      labelCls:'text-red-500',    valueCls:'text-red-700 dark:text-red-300'      },
    };
    return {
      title: 'Status de Aprovação — Hanaro Scrap',
      panels: [
        { type: 'kpi', cards: Object.entries(porStatus).map(([k, v]) => ({
            label: k.charAt(0).toUpperCase() + k.slice(1), value: fmtNum(v.count), sub: fmtCurrency(v.custo),
            ...(SCOL[k]||{}),
          })),
        },
        { type: 'table', title: 'Distribuição por Status',
          headers: ['Status', 'Registros', 'Qtd Placas', 'Custo Total'],
          rows: Object.entries(porStatus).map(([k, v]) => [k, fmtNum(v.count), fmtNum(v.qtd), fmtCurrency(v.custo)]),
        },
      ],
    };
  }

  /* TIPO DE PLACA */
  if (q.match(/tipo|placa|bot|top|limpa|fase/)) {
    const porTipo = groupBy(records, 'tipo_placa');
    const sorted  = topN(porTipo, 'count', 8);
    return {
      title: 'Análise por Tipo de Placa — Hanaro Scrap',
      panels: [
        { type: 'hbar', title: 'Ocorrências por Tipo', data: sorted.map(([k, v]) => ({ label: k, value: v.count })) },
        { type: 'table', title: 'Detalhamento por Tipo',
          headers: ['Tipo', 'Registros', 'Qtd Placas', 'Custo Total'],
          rows: sorted.map(([k, v]) => [k, fmtNum(v.count), fmtNum(v.qtd), fmtCurrency(v.custo)]),
        },
      ],
    };
  }

  /* TENDÊNCIA / HISTÓRICO */
  if (q.match(/tendencia|evolucao|historico|por dia|diario|diaria|por mes|mensal|tempo|semana/)) {
    const porDia = {};
    records.forEach(r => {
      const d = (r.data || '').slice(0, 10);
      if (!d) return;
      if (!porDia[d]) porDia[d] = { count: 0, custo: 0, qtd: 0 };
      porDia[d].count++;
      porDia[d].custo += Number(r.custo_total || 0);
      porDia[d].qtd   += Number(r.quantidade  || 0);
    });
    const dias = Object.entries(porDia).sort((a, b) => a[0].localeCompare(b[0]));
    return {
      title: 'Tendência Diária — Hanaro Scrap',
      panels: [
        { type: 'hbar', title: 'Registros por Dia (últimos 14 dias)',
          data: dias.slice(-14).map(([k, v]) => ({ label: k.slice(5), value: v.count })),
        },
        { type: 'table', title: 'Histórico por Data',
          headers: ['Data', 'Registros', 'Qtd Placas', 'Custo Total'],
          rows: dias.slice(-20).reverse().map(([k, v]) => [k, fmtNum(v.count), fmtNum(v.qtd), fmtCurrency(v.custo)]),
        },
      ],
    };
  }

  /* ORIGEM */
  if (q.match(/origem|fonte/)) {
    const porOrigem = groupBy(records, 'origem');
    const sorted    = topN(porOrigem, 'count', 10);
    return {
      title: 'Análise por Origem — Hanaro Scrap',
      panels: [
        { type: 'hbar', title: 'Ocorrências por Origem', data: sorted.map(([k, v]) => ({ label: k, value: v.count })) },
        { type: 'table', title: 'Detalhamento por Origem',
          headers: ['Origem', 'Registros', 'Qtd Placas', 'Custo Total'],
          rows: sorted.map(([k, v]) => [k, fmtNum(v.count), fmtNum(v.qtd), fmtCurrency(v.custo)]),
        },
      ],
    };
  }

  /* Nenhum padrão local — retorna null para o runQuery decidir */
  return null;
}

/* ── Quick Actions ─────────────────────────────────────────────────────────── */
const QUICK_ACTIONS = [
  { label: 'Resumo Geral',        q: 'Resumo geral'                          },
  { label: 'Maiores Custos',      q: 'Análise de custo e prejuízo'           },
  { label: 'Causas Frequentes',   q: 'Principais causas'                     },
  { label: 'Padrões Recorrentes', q: 'Padrões e problemas recorrentes'       },
  { label: 'Causa Raiz',          q: 'Análise de causa raiz'                 },
  { label: 'Por Equipamento',     q: 'Análise por equipamento'               },
  { label: 'Por Linha (SMD)',     q: 'Análise por linha'                     },
  { label: 'Por Modelo',          q: 'Análise por modelo'                    },
  { label: 'Por Turno',           q: 'Análise por turno'                     },
  { label: 'Status Aprovação',    q: 'Status de aprovação'                   },
  { label: 'Tendência Diária',    q: 'Tendência por dia'                     },
  { label: 'Tipo de Placa',       q: 'Análise por tipo de placa'             },
];

/* ── Main Component ────────────────────────────────────────────────────────── */
export default function HanaroChatIA() {
  const [iaData,     setIaData]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [input,      setInput]      = useState('');
  const [iaResults,  setIaResults]  = useState([]);
  const [iaLoading,  setIaLoading]  = useState(false);
  const [iaPhase,    setIaPhase]    = useState(''); // 'local' | 'gauss' | ''
  const resultsRef = useRef(null);
  const inputRef   = useRef(null);

  useEffect(() => {
    api.get('/hanaro/dados-ia')
      .then(({ data }) => setIaData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const runQuery = async (q) => {
    const query = (q || input).trim();
    if (!query || iaLoading || !iaData) return;
    setInput('');
    setIaLoading(true);
    setIaPhase('local');

    try {
      // 1. Análise local (instantânea)
      const localResult = runAnalysis(query, iaData);
      setIaPhase('gauss');

      // 2. Gauss IA — sempre chamado
      let gaussResponse = null;
      try {
        const { data: aiData } = await api.post('/hanaro/ai', { query });
        if (aiData?.response && aiData.response !== 'Sem resposta da IA.') {
          gaussResponse = aiData.response;
        }
      } catch { /* Gauss indisponível */ }

      // 3. Combinar resultados
      let finalResult;

      if (localResult && gaussResponse) {
        finalResult = { ...localResult, gaussText: gaussResponse };
      } else if (localResult) {
        finalResult = localResult;
      } else if (gaussResponse) {
        // Query livre — Gauss + KPIs básicos
        const { total = 0, custoTotal = 0, qtd_total = 0 } = iaData;
        finalResult = {
          title: query.length > 55 ? query.slice(0, 55) + '…' : query,
          gaussText: gaussResponse,
          panels: [
            { type: 'kpi', cards: [
              { label: 'Total Registros', value: fmtNum(total),          bg:'bg-gray-50 dark:bg-dark-bg', border:'border-gray-100 dark:border-dark-border', labelCls:'text-gray-400', valueCls:'text-gray-900 dark:text-white' },
              { label: 'Custo Total',     value: fmtCurrency(custoTotal), bg:'bg-gray-50 dark:bg-dark-bg', border:'border-gray-100 dark:border-dark-border', labelCls:'text-gray-400', valueCls:'text-gray-900 dark:text-white' },
              { label: 'Qtd Placas',      value: fmtNum(qtd_total),       bg:'bg-gray-50 dark:bg-dark-bg', border:'border-gray-100 dark:border-dark-border', labelCls:'text-gray-400', valueCls:'text-gray-900 dark:text-white' },
            ]},
          ],
        };
      } else {
        finalResult = {
          title: 'Sugestões de consulta',
          panels: [{ type: 'text', content:
            'Tente perguntar sobre:\n\n' +
            '• **Padrões recorrentes** — mesmo modelo+equipamento+causa repetindo\n' +
            '• **Causa raiz** — análise profunda das origens dos problemas\n' +
            '• **Por equipamento** — qual máquina gera mais scrap\n' +
            '• **Análise de custo** — impacto financeiro por linha/modelo\n' +
            '• **Tendência diária** — evolução ao longo do tempo\n' +
            '• Perguntas livres como "por que a SMD-5 tem tanto scrap?" ou "qual modelo é mais problemático este mês?"',
          }],
        };
      }

      setIaResults(prev => [{ query, result: finalResult }, ...prev].slice(0, 6));
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } finally {
      setIaLoading(false);
      setIaPhase('');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles size={16} className="text-red-400" />
            Centro de Análise — Hanaro Scrap
          </h2>
          {loading
            ? <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <RefreshCw size={10} className="animate-spin" /> Carregando dados...
              </p>
            : <p className="text-xs text-gray-400 mt-0.5">
                {fmtNum(iaData?.total || 0)} registros · {fmtCurrency(iaData?.custoTotal || 0)} em custo ·{' '}
                <span className="text-red-500 font-medium">Gauss IA ativo</span>
              </p>
          }
        </div>
        {iaData?.patterns?.length > 0 && (
          <div className="text-right">
            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
              {iaData.patterns.length} padrão{iaData.patterns.length > 1 ? 'ões' : ''} recorrente{iaData.patterns.length > 1 ? 's' : ''}
            </p>
            <p className="text-[9px] text-gray-400">detectado{iaData.patterns.length > 1 ? 's' : ''} nos dados</p>
          </div>
        )}
      </div>

      {/* Terminal Input */}
      <div className="rounded-xl bg-gray-950 dark:bg-gray-900 border border-gray-800 p-3.5 flex items-center gap-3">
        <span className="text-red-400 font-mono text-base font-bold flex-shrink-0">›</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && runQuery()}
          placeholder="Pergunte qualquer coisa — ex: 'qual equipamento causa mais scrap?', 'padrões recorrentes no mês', '5-why da SMD-3'..."
          disabled={loading || !iaData}
          className="flex-1 bg-transparent text-green-100 placeholder-gray-600 text-sm font-mono focus:outline-none disabled:opacity-50"
        />
        {input && !iaLoading && (
          <button onClick={() => setInput('')} className="text-gray-600 hover:text-gray-400 flex-shrink-0">
            <X size={13} />
          </button>
        )}
        {iaLoading
          ? <div className="flex items-center gap-2 flex-shrink-0">
              <RefreshCw size={13} className="text-red-400 animate-spin" />
              <span className="text-[10px] text-red-400 font-mono">
                {iaPhase === 'gauss' ? 'Gauss IA...' : 'Analisando...'}
              </span>
            </div>
          : <button
              onClick={() => runQuery()}
              disabled={!input.trim() || !iaData}
              className="text-gray-600 hover:text-red-400 disabled:opacity-30 transition-colors flex-shrink-0">
              <Send size={13} />
            </button>
        }
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_ACTIONS.map(a => (
          <button key={a.label}
            onClick={() => runQuery(a.q)}
            disabled={loading || iaLoading || !iaData}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-300
              hover:bg-gray-100 dark:hover:bg-dark-card hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400
              transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {a.label}
          </button>
        ))}
      </div>

      {/* Loading indicator */}
      {iaLoading && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40">
          <RefreshCw size={14} className="animate-spin text-red-600 dark:text-red-400" />
          <div>
            <p className="text-xs font-semibold text-red-700 dark:text-red-300">
              {iaPhase === 'gauss' ? 'Consultando Gauss IA com dados de scrap...' : 'Processando dados locais...'}
            </p>
            <p className="text-[10px] text-red-500 dark:text-red-400">
              {iaPhase === 'gauss' ? 'Analisando padrões, causas raiz e comentários' : 'Aplicando análise estatística'}
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      <div ref={resultsRef} className="space-y-4">
        {iaResults.length === 0 && !iaLoading && (
          <div className="rounded-2xl border border-dashed border-gray-200 dark:border-dark-border p-12 flex flex-col items-center gap-3 text-gray-300 dark:text-gray-600">
            <Bot size={32} />
            <p className="text-sm text-center text-gray-400 dark:text-gray-500">
              Faça uma pergunta ou clique em uma análise rápida.<br />
              <span className="text-xs">A IA tem acesso a padrões, causas raiz e comentários dos operadores.</span>
            </p>
          </div>
        )}
        {iaResults.map((r, i) => (
          <AnalysisResult key={i} result={r.result} query={r.query} />
        ))}
      </div>
    </div>
  );
}

