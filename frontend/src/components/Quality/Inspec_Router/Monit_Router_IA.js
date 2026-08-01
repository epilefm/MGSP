import { API_URL } from '../../../config/api';
// Monit_Router_IA.js - Tela de Análise IA para Monitoramento de Router
import { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCw, BarChart2, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import axios from 'axios';

const API_BASE = `${API_URL}`;

/* ── Formatters ────────────────────────────────────────────────────────────── */
const fmtNum = v => Number(v || 0).toLocaleString('pt-BR');
const fmtPercent = (v, total) => total > 0 ? `${((v / total) * 100).toFixed(1)}%` : '0%';

/* ── KpiRow ────────────────────────────────────────────────────────────────── */
function KpiRow({ cards }) {
  const cols =
    cards.length <= 2 ? 'grid-cols-2'
    : cards.length === 3 ? 'grid-cols-3'
    : 'grid-cols-2 sm:grid-cols-4';
  return (
    <div className={`grid gap-3 ${cols}`}>
      {cards.map((c, i) => (
        <div key={i}
          className={`rounded-xl p-4 border ${c.bg || 'bg-gray-50'} ${c.border || 'border-gray-100'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${c.labelCls || 'text-gray-400'}`}>
            {c.label}
          </p>
          <p className={`text-2xl font-bold leading-none ${c.valueCls || 'text-gray-900'}`}>
            {c.value}
          </p>
          {c.sub && (
            <p className={`text-xs mt-1 ${c.subCls || 'text-gray-400'}`}>{c.sub}</p>
          )}
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
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      {title && (
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">{title}</p>
        </div>
      )}
      <div className="p-4 space-y-2.5">
        {data.map((d, i) => {
          const pct = Math.round((d.value / max) * 100);
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="w-20 text-[11px] font-semibold text-gray-700 truncate text-right flex-shrink-0">
                {d.label}
              </span>
              <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                <div
                  className={`h-5 rounded-full flex items-center justify-end pr-2 ${BAR_COLORS[i % BAR_COLORS.length]}`}
                  style={{ width: `${Math.max(pct, 4)}%` }}
                >
                  <span className="text-[9px] font-bold text-white whitespace-nowrap">{pct}%</span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-gray-600 w-28 text-right flex-shrink-0">
                {unit === 'currency' ? `R$ ${d.value.toFixed(2)}` : d.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── DataTable ─────────────────────────────────────────────────────────────── */
function DataTable({ title, headers, rows, highlightFirst = true }) {
  if (!rows?.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      {title && (
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">{title}</p>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-2 text-left font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((row, ri) => (
              <tr key={ri} className="hover:bg-gray-50 transition-colors">
                {row.map((cell, ci) => (
                  <td key={ci} className={`px-4 py-2.5 whitespace-nowrap ${
                    ci === 0 && highlightFirst
                      ? 'font-semibold text-gray-900'
                      : 'text-gray-600'
                  }`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── AnalysisResult ────────────────────────────────────────────────────────── */
function AnalysisResult({ result, query }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
      <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
          <BarChart2 size={13} className="text-red-600" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-900">{result.title}</p>
          <p className="text-[10px] text-gray-400 font-mono">› {query}</p>
        </div>
      </div>
      <div className="p-5 space-y-4">
        {result.panels.map((panel, i) => {
          if (panel.type === 'kpi')   return <KpiRow   key={i} cards={panel.cards} />;
          if (panel.type === 'hbar')  return <HBarChart key={i} title={panel.title} data={panel.data} unit={panel.unit} />;
          if (panel.type === 'table') return <DataTable key={i} title={panel.title} headers={panel.headers} rows={panel.rows} highlightFirst={panel.highlightFirst} />;
          if (panel.type === 'text')  return (
            <div key={i} className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4 leading-relaxed">
              {panel.content}
            </div>
          );
          return null;
        })}
      </div>
    </div>
  );
}

/* ── Analysis Engine para Router ──────────────────────────────────────────── */
function analyzeRouterData(question, data) {
  const q = question.toLowerCase();
  const { productionData = {}, date = new Date().toISOString().slice(0, 10) } = data;

  // Calcular estatísticas gerais
  let okCount = 0, ngCount = 0, semPlacaCount = 0, setupCount = 0;
  const ngPorLinha = {};
  const paradasPorLinha = {};
  const defeitosMaisComuns = {};

  Object.entries(productionData).forEach(([linha, hours]) => {
    Object.entries(hours).forEach(([hour, inspections]) => {
      if (!inspections || !inspections.length) return;
      const insp = inspections[0];
      const status = insp.status;
      
      if (status === 'OK' || status === 'SETUP') {
        okCount++;
        if (status === 'SETUP') setupCount++;
      } else if (status === 'NG') {
        ngCount++;
        if (!ngPorLinha[linha]) ngPorLinha[linha] = [];
        ngPorLinha[linha].push({ hour, cause: insp.cause });
        
        // Contar defeitos
        const defeito = insp.cause ? insp.cause.split(' ')[0] : 'Outro';
        defeitosMaisComuns[defeito] = (defeitosMaisComuns[defeito] || 0) + 1;
      } else if (status === 'SEM PLACA') {
        semPlacaCount++;
        if (!paradasPorLinha[linha]) paradasPorLinha[linha] = [];
        paradasPorLinha[linha].push(parseInt(hour));
      }
    });
  });

  const total = okCount + ngCount + semPlacaCount;
  const linhas = Object.keys(productionData).sort();
  
  // Identificar linhas críticas (3+ NGs)
  const linhasCríticas = Object.entries(ngPorLinha)
    .filter(([_, ngs]) => ngs.length >= 3)
    .map(([linha, ngs]) => ({
      linha,
      qtdNg: ngs.length,
      defeitos: [...new Set(ngs.map(n => n.cause))]
    }))
    .sort((a, b) => b.qtdNg - a.qtdNg);

  // Calcular paradas prolongadas
  const paradasProlongadas = Object.entries(paradasPorLinha)
    .map(([linha, horas]) => {
      const horasOrdenadas = horas.sort((a, b) => a - b);
      if (horasOrdenadas.length >= 2) {
        const inicio = horasOrdenadas[0];
        const fim = horasOrdenadas[horasOrdenadas.length - 1];
        const duracao = fim - inicio + 1;
        if (duracao >= 2) {
          return { linha, inicio, fim, duracao };
        }
      }
      return null;
    })
    .filter(p => p !== null);

  /* RESUMO GERAL */
  if (q.match(/resumo|geral|panorama|overview|tudo/)) {
    return {
      title: 'Resumo Geral — Monitoramento Router',
      panels: [
        {
          type: 'kpi',
          cards: [
            { label: 'Total Inspeções', value: fmtNum(total), bg: 'bg-blue-50', border: 'border-blue-100', labelCls: 'text-blue-500', valueCls: 'text-blue-700' },
            { label: 'OK', value: fmtNum(okCount), sub: fmtPercent(okCount, total), bg: 'bg-green-50', border: 'border-green-100', labelCls: 'text-green-500', valueCls: 'text-green-700' },
            { label: 'NG', value: fmtNum(ngCount), sub: fmtPercent(ngCount, total), bg: 'bg-red-50', border: 'border-red-100', labelCls: 'text-red-500', valueCls: 'text-red-700' },
            { label: 'Sem Placa', value: fmtNum(semPlacaCount), sub: `${setupCount} setups`, bg: 'bg-gray-50', border: 'border-gray-100', labelCls: 'text-gray-500', valueCls: 'text-gray-700' },
          ],
        },
        linhasCríticas.length > 0 ? {
          type: 'table',
          title: '⚠️ Linhas Críticas',
          headers: ['Linha', 'NGs', 'Defeitos'],
          rows: linhasCríticas.slice(0, 5).map(l => [
            l.linha,
            l.qtdNg.toString(),
            l.defeitos.slice(0, 3).join(', ') + (l.defeitos.length > 3 ? ` +${l.defeitos.length - 3}` : '')
          ]),
        } : {
          type: 'text',
          content: '✅ Nenhuma linha crítica identificada (menos de 3 NGs por linha).'
        }
      ],
    };
  }

  /* LINHAS CRÍTICAS / PROBLEMAS */
  if (q.match(/problema|crítico|critica|ng|defeito|falha/)) {
    return {
      title: 'Análise de Problemas — Router',
      panels: [
        {
          type: 'kpi',
          cards: [
            { label: 'Linhas com NG', value: fmtNum(Object.keys(ngPorLinha).length), bg: 'bg-red-50', border: 'border-red-100', labelCls: 'text-red-500', valueCls: 'text-red-700' },
            { label: 'Total NGs', value: fmtNum(ngCount), bg: 'bg-red-50', border: 'border-red-100', labelCls: 'text-red-500', valueCls: 'text-red-700' },
            { label: 'Linhas Críticas', value: fmtNum(linhasCríticas.length), bg: 'bg-orange-50', border: 'border-orange-100', labelCls: 'text-orange-500', valueCls: 'text-orange-700' },
          ],
        },
        linhasCríticas.length > 0 && {
          type: 'table',
          title: 'Linhas Críticas (3+ NGs)',
          headers: ['Linha', 'Qtd NGs', 'Principais Defeitos'],
          rows: linhasCríticas.map(l => [
            l.linha,
            l.qtdNg.toString(),
            l.defeitos.join(', ')
          ]),
        },
        {
          type: 'hbar',
          title: 'Top Defeitos',
          data: Object.entries(defeitosMaisComuns)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([k, v]) => ({ label: k, value: v })),
        }
      ].filter(p => p),
    };
  }

  /* PARADAS / SEM PLACA */
  if (q.match(/parada|sem placa|parado|tempo|inativo/)) {
    return {
      title: 'Análise de Paradas — Router',
      panels: [
        {
          type: 'kpi',
          cards: [
            { label: 'Total Sem Placa', value: fmtNum(semPlacaCount), bg: 'bg-gray-50', border: 'border-gray-100', labelCls: 'text-gray-500', valueCls: 'text-gray-700' },
            { label: 'Linhas Paradas', value: fmtNum(Object.keys(paradasPorLinha).length), bg: 'bg-gray-50', border: 'border-gray-100', labelCls: 'text-gray-500', valueCls: 'text-gray-700' },
            { label: 'Paradas Prolongadas', value: fmtNum(paradasProlongadas.length), sub: '2+ horas', bg: 'bg-orange-50', border: 'border-orange-100', labelCls: 'text-orange-500', valueCls: 'text-orange-700' },
          ],
        },
        paradasProlongadas.length > 0 ? {
          type: 'table',
          title: '⏱️ Paradas Prolongadas',
          headers: ['Linha', 'Início', 'Fim', 'Duração'],
          rows: paradasProlongadas.map(p => [
            p.linha,
            `${p.inicio}h`,
            `${p.fim}h`,
            `${p.duracao}h`
          ]),
        } : {
          type: 'text',
          content: '✅ Nenhuma parada prolongada identificada.'
        }
      ],
    };
  }

  /* POR LINHA */
  if (q.match(/linha|smd|por linha/)) {
    const statsPorLinha = linhas.map(linha => {
      const hours = productionData[linha] || {};
      let ok = 0, ng = 0, semPlaca = 0;
      Object.values(hours).forEach(inspections => {
        if (!inspections?.length) return;
        const status = inspections[0].status;
        if (status === 'OK' || status === 'SETUP') ok++;
        else if (status === 'NG') ng++;
        else if (status === 'SEM PLACA') semPlaca++;
      });
      return { linha, ok, ng, semPlaca, total: ok + ng + semPlaca };
    });

    return {
      title: 'Análise por Linha — Router',
      panels: [
        {
          type: 'hbar',
          title: 'NGs por Linha',
          data: statsPorLinha
            .filter(l => l.ng > 0)
            .sort((a, b) => b.ng - a.ng)
            .slice(0, 10)
            .map(l => ({ label: l.linha, value: l.ng })),
        },
        {
          type: 'table',
          title: 'Estatísticas por Linha',
          headers: ['Linha', 'OK', 'NG', 'Sem Placa', 'Total'],
          rows: statsPorLinha
            .sort((a, b) => b.total - a.total)
            .slice(0, 15)
            .map(l => [l.linha, l.ok.toString(), l.ng.toString(), l.semPlaca.toString(), l.total.toString()]),
        }
      ],
    };
  }

  /* DEFAULT */
  return {
    title: 'Análise Rápida — Router',
    panels: [
      {
        type: 'text',
        content: 'Tente: "resumo geral", "linhas com problemas", "paradas", "por linha", ou "defeitos mais comuns"'
      },
      {
        type: 'kpi',
        cards: [
          { label: 'Total', value: fmtNum(total), bg: 'bg-gray-50', border: 'border-gray-100', labelCls: 'text-gray-400', valueCls: 'text-gray-900' },
          { label: 'OK', value: fmtNum(okCount), bg: 'bg-green-50', border: 'border-green-100', labelCls: 'text-green-500', valueCls: 'text-green-700' },
          { label: 'NG', value: fmtNum(ngCount), bg: 'bg-red-50', border: 'border-red-100', labelCls: 'text-red-500', valueCls: 'text-red-700' },
          { label: 'Sem Placa', value: fmtNum(semPlacaCount), bg: 'bg-gray-50', border: 'border-gray-100', labelCls: 'text-gray-500', valueCls: 'text-gray-700' },
        ],
      }
    ],
  };
}

/* ── Quick Actions ─────────────────────────────────────────────────────────── */
const QUICK_ACTIONS = [
  { label: '📊 Resumo Geral', q: 'Resumo geral' },
  { label: '⚠️ Linhas Críticas', q: 'Linhas com problemas' },
  { label: '⏱️ Paradas', q: 'Paradas de linha' },
  { label: '📈 Por Linha', q: 'Análise por linha' },
  { label: '🔧 Defeitos', q: 'Defeitos mais comuns' },
];

/* ── Main Component ────────────────────────────────────────────────────────── */
export default function Monit_Router_IA({ date }) {
  const [routerData, setRouterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const resultsRef = useRef(null);

  // Buscar dados do Router
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE}/Monit_Router`, {
          params: { date: date || new Date().toISOString().slice(0, 10) }
        });
        setRouterData({
          productionData: response.data,
          date: date || new Date().toISOString().slice(0, 10)
        });
      } catch (error) {
        console.error('Erro ao buscar dados do Router:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [date]);

  const runAnalysis = (q) => {
    if (!q.trim() || !routerData) return;
    setAnalyzing(true);
    setQuery('');
    
    // Pequeno delay para UX
    setTimeout(() => {
      const result = analyzeRouterData(q, routerData);
      setResults(prev => [{ result, query: q }, ...prev].slice(0, 6));
      setAnalyzing(false);
      
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 200);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">
            Centro de Análise IA — Router
          </h2>
          {loading
            ? <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><RefreshCw size={10} className="animate-spin" /> Carregando dados...</p>
            : routerData && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {Object.keys(routerData.productionData).length} linhas monitoradas · Data: {routerData.date}
                </p>
              )
          }
        </div>
        <Sparkles size={18} className="text-red-400" />
      </div>

      {/* Input */}
      <div className="rounded-xl bg-gray-900 border border-gray-800 p-4 flex items-center gap-3">
        <span className="text-green-400 font-mono text-base font-bold flex-shrink-0">›</span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && runAnalysis(query)}
          placeholder="Faça uma pergunta sobre a produção (Ex: Resumo geral, linhas com problemas...)"
          disabled={loading || !routerData}
          className="flex-1 bg-transparent text-green-100 placeholder-gray-600 text-sm font-mono focus:outline-none disabled:opacity-50"
        />
        {analyzing && <RefreshCw size={14} className="text-green-400 animate-spin flex-shrink-0" />}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map(a => (
          <button key={a.label}
            onClick={() => runAnalysis(a.q)}
            disabled={loading || analyzing || !routerData}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600
              hover:bg-gray-100 hover:border-red-300 hover:text-red-600
              transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {a.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div ref={resultsRef} className="space-y-4">
        {results.length === 0 && !analyzing && (
          <div className="rounded-2xl border border-dashed border-gray-200 p-12 flex flex-col items-center gap-3 text-gray-300">
            <BarChart2 size={32} />
            <p className="text-sm text-center">
              Use o campo acima ou clique em uma análise rápida para gerar um relatório
            </p>
          </div>
        )}
        {results.map((r, i) => (
          <AnalysisResult key={i} result={r.result} query={r.query} />
        ))}
      </div>
    </div>
  );
}
