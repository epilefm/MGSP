import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import Axios from 'axios';
import {
  Activity, CheckCircle2, AlertTriangle, XCircle,
  RefreshCw, Zap, MessageCircle, MessageSquare,
  User, Clock, BarChart3, TrendingUp, X, AlertCircle,
} from 'lucide-react';
import { API_URL } from '../../config/api';

const API_BASE = `${API_URL}`;
const COMMENT_KEY = 'ft_skip_comments_v1';

const EMPLOYEES = {
  '001': 'João Silva', '002': 'Maria Santos', '003': 'Carlos Oliveira',
  '004': 'Ana Lima', '005': 'Pedro Costa', '101': 'Roberto Alves',
  '102': 'Fernanda Souza', '103': 'Marcos Pereira', '104': 'Lucia Ferreira',
};

const parseCount = (val) => {
  if (!val?.trim()) return [0, 0];
  const [a, b] = val.split('/');
  return [parseInt(a) || 0, parseInt(b) || 0];
};

const calcEff = (cur, tot) => (tot > 0 ? Math.min(100, Math.round((cur / tot) * 100)) : null);

const storageGet = () => {
  try { return JSON.parse(localStorage.getItem(COMMENT_KEY) || '{}'); }
  catch { return {}; }
};

const getComment = (line, type, date) => storageGet()[`${line}||${type}||${date}`] || null;

const saveComment = (line, type, date, data) => {
  const all = storageGet();
  all[`${line}||${type}||${date}`] = { ...data, savedAt: new Date().toISOString() };
  localStorage.setItem(COMMENT_KEY, JSON.stringify(all));
};

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: 'white', borderRadius: '12px', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)', width: '100%', maxWidth: '448px', margin: '16px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6b7280' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function CircularProgress({ percentage, size = 70, label, isStopped }) {
  const circumference = 2 * Math.PI * (size / 2 - 5);
  const offset = circumference - (percentage / 100) * circumference;

  let color = '#9ca3af';
  if (!isStopped) {
    if (percentage >= 95) color = '#059669';
    else if (percentage >= 85) color = '#2563eb';
    else if (percentage >= 70) color = '#f59e0b';
    else color = '#dc2626';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg style={{ transform: 'rotate(-90deg)' }} width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={size / 2 - 5} fill="none" stroke="#e5e7eb" strokeWidth="4" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 5}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: color }}>{percentage}%</span>
        </div>
      </div>
      <span style={{ fontSize: '9px', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative',
        width: '40px',
        height: '24px',
        borderRadius: '9999px',
        backgroundColor: checked ? '#2563eb' : '#e5e7eb',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        transition: 'background-color 0.2s',
      }}
    >
      <span style={{
        position: 'absolute',
        top: '2px',
        width: '20px',
        height: '20px',
        backgroundColor: 'white',
        borderRadius: '50%',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        left: checked ? '20px' : '2px',
        transition: 'left 0.2s',
      }} />
    </button>
  );
}

function LineCard({ line, dateStr, onCell }) {
  const hasCommentBuild = !!getComment(line.line_name, 'build', dateStr);
  const hasCommentFt = !!getComment(line.line_name, 'ft', dateStr);

  const statusColor = line.isStopped ? '#ef4444' : line.hasSkip ? '#f59e0b' : '#10b981';
  const statusLabel = line.isStopped ? 'Parada' : line.hasSkip ? 'Com Skip' : 'OK';
  const statusBg = line.isStopped ? '#fee2e2' : line.hasSkip ? '#fef3c7' : '#ecfdf5';

  return (
    <div style={{
      background: 'white',
      borderRadius: '10px',
      border: `2px solid ${line.isStopped ? '#fecaca' : line.hasSkip ? '#fde68a' : '#a7f3d0'}`,
      padding: '10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      transition: 'all 0.2s',
      cursor: 'pointer',
    }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)'}
    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: 0 }}>{line.line_name}</h3>
          <p style={{ fontSize: '10px', color: '#6b7280', margin: '1px 0 0', fontFamily: 'monospace' }}>{line.model_name || '—'}</p>
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', fontWeight: 600, color: statusColor, backgroundColor: statusBg, padding: '3px 6px', borderRadius: '6px', flexShrink: 0, whiteSpace: 'nowrap' }}>
          {line.isStopped ? <XCircle size={11} /> : line.hasSkip ? <AlertTriangle size={11} /> : <CheckCircle2 size={11} />}
          {statusLabel}
        </span>
      </div>

      {/* Test Results Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {/* Build Test */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '8px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
          <CircularProgress percentage={line.bEff ?? 0} size={60} label="Build" isStopped={line.isStopped} />
          <div style={{ textAlign: 'center', width: '100%', fontSize: '10px', lineHeight: 1.4 }}>
            <div style={{ fontWeight: 600, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>
              <span style={{ display: 'block' }}>Qty: {line.bC}</span>
            </div>
            <div style={{ color: '#6b7280', fontSize: '9px' }}>
              <span style={{ display: 'block' }}>Total: {line.bT}</span>
            </div>
            {line.bT - line.bC > 0 && (
              <div style={{ color: '#dc2626', fontWeight: 600, marginTop: '2px' }}>
                <span style={{ display: 'block' }}>Skip: −{line.bT - line.bC}</span>
              </div>
            )}
            <button
              onClick={() => onCell(line.line_name, 'build')}
              title="Clique: ver comentário · Duplo clique: editar"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: '3px' }}
            >
              <MessageCircle size={11} style={{ color: hasCommentBuild ? '#2563eb' : '#d1d5db' }} />
            </button>
          </div>
        </div>

        {/* Sites */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '8px', backgroundColor: '#ecfdf5', borderRadius: '8px' }}>
          <CircularProgress percentage={line.fEff ?? 0} size={60} label="Sites" isStopped={line.isStopped} />
          <div style={{ textAlign: 'center', width: '100%', fontSize: '10px', lineHeight: 1.4 }}>
            <div style={{ fontWeight: 600, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>
              <span style={{ display: 'block' }}>Qty: {line.fC}</span>
            </div>
            <div style={{ color: '#6b7280', fontSize: '9px' }}>
              <span style={{ display: 'block' }}>Total: {line.fT}</span>
            </div>
            {line.fT - line.fC > 0 && (
              <div style={{ color: '#dc2626', fontWeight: 600, marginTop: '2px' }}>
                <span style={{ display: 'block' }}>Skip: −{line.fT - line.fC}</span>
              </div>
            )}
            <button
              onClick={() => onCell(line.line_name, 'ft')}
              title="Clique: ver comentário · Duplo clique: editar"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: '3px' }}
            >
              <MessageCircle size={11} style={{ color: hasCommentFt ? '#2563eb' : '#d1d5db' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, detail, color, bgColor }) {
  return (
    <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '12px', display: 'flex', alignItems: 'flex-start', gap: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '6px', backgroundColor: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', margin: 0, letterSpacing: '0.2px' }}>{label}</p>
        <p style={{ fontSize: '22px', fontWeight: 700, color: color, margin: '2px 0 0', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
        {detail && <p style={{ fontSize: '10px', color: '#9ca3af', margin: '3px 0 0' }}>{detail}</p>}
      </div>
    </div>
  );
}

export default function FTSkipMonitor() {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateStr, setDateStr] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [auto, setAuto] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState({ open: false, line: '', type: '', title: '' });
  const [matInput, setMatInput] = useState('');
  const [empName, setEmpName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState({});
  const timers = useRef({});

  const loadData = useCallback(async (date, showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const { data } = await Axios.get(`${API_BASE}/getFTSkipData?date=${date}`);
      if (!Array.isArray(data)) return;
      setLines(data.map((item, i) => {
        const model = (item.model_name || '').trim().toLowerCase();
        const STOP_WORDS = ['pass', 'test', 'teste', 'bypass', 'by pass'];
        const isStopped = !model || /^-+$/.test(model) || STOP_WORDS.some(w => model === w || model.startsWith(w + ' '));
        const [bC, bT] = parseCount(item.building_test_count);
        const [fC, fT] = parseCount(item.function_test_count);
        const hasSkip = !isStopped && (bC < bT || fC < fT);
        return {
          ...item, _key: item.id ?? i, isStopped, hasSkip,
          bC, bT, bEff: calcEff(bC, bT), fC, fT, fEff: calcEff(fC, fT),
        };
      }));
      setLastSync(new Date());
    } catch (e) {
      console.error('FTSkipMonitor:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(dateStr); }, [dateStr, loadData]);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => loadData(dateStr, false), 30000);
    return () => clearInterval(id);
  }, [auto, dateStr, loadData]);

  const totalL = lines.length;
  const okL = lines.filter(l => !l.isStopped && !l.hasSkip).length;
  const skipL = lines.filter(l => l.hasSkip).length;
  const stopL = lines.filter(l => l.isStopped).length;

  const buildSkipsTotal = lines.reduce((sum, l) => sum + Math.max(0, l.bT - l.bC), 0);
  const ftSkipsTotal = lines.reduce((sum, l) => sum + Math.max(0, l.fT - l.fC), 0);
  const buildTotalExpected = lines.reduce((sum, l) => sum + l.bT, 0);
  const ftTotalExpected = lines.reduce((sum, l) => sum + l.fT, 0);
  const buildTotalOk = buildTotalExpected - buildSkipsTotal;
  const ftTotalOk = ftTotalExpected - ftSkipsTotal;

  const onCell = useCallback((lineName, type) => {
    const k = `${lineName}_${type}`;
    if (timers.current[k]) {
      clearTimeout(timers.current[k]);
      delete timers.current[k];
      const typeLabel = type === 'build' ? 'Build Test' : 'Function Test';
      const existing = getComment(lineName, type, dateStr);
      setMatInput(existing?.mat || '');
      setEmpName(existing ? (existing.name || EMPLOYEES[existing.mat] || '') : '');
      setCommentText(existing?.comment || '');
      setFormErr({});
      setModal({ open: true, line: lineName, type, title: `${lineName} — ${typeLabel}` });
    } else {
      timers.current[k] = setTimeout(() => {
        delete timers.current[k];
        const typeLabel = type === 'build' ? 'Build Test' : 'Function Test';
        const c = getComment(lineName, type, dateStr);
        if (c) {
          toast.custom((t) => (
            <div style={{
              backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', border: '1px solid #e5e7eb', padding: '16px', width: '280px',
              opacity: t.visible ? 1 : 0, transform: t.visible ? 'translateY(0)' : 'translateY(-8px)', transition: 'all 0.3s',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '14px', color: '#111827', margin: 0 }}>{lineName}</p>
                  <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0' }}>{typeLabel}</p>
                </div>
                <button onClick={() => toast.dismiss(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: 0 }}>
                  <X size={14} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '6px', padding: '6px 12px', marginBottom: '12px' }}>
                <User size={12} style={{ color: '#2563eb' }} />
                <span style={{ fontWeight: 600, fontSize: '13px', color: '#1e40af' }}>{c.name}</span>
                <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: 'auto' }}>#{c.mat}</span>
              </div>
              <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.5, margin: 0 }}>{c.comment}</p>
              <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={10} />{format(new Date(c.savedAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          ), { position: 'top-right', duration: 7000 });
        } else {
          toast('💬 Sem comentário. Duplo clique para registrar.', { position: 'top-right', duration: 3000 });
        }
      }, 280);
    }
  }, [dateStr]);

  const handleSave = () => {
    const errors = {};
    if (!matInput.trim()) errors.mat = 'Informe a matrícula';
    if (!commentText.trim()) errors.comment = 'Informe o motivo';
    else if (commentText.trim().length < 5) errors.comment = 'Mínimo 5 caracteres';
    if (Object.keys(errors).length) { setFormErr(errors); return; }
    setSaving(true);
    const name = empName || EMPLOYEES[matInput.trim()] || matInput.trim();
    saveComment(modal.line, modal.type, dateStr, { mat: matInput.trim(), name, comment: commentText.trim() });
    toast.success(`Comentário de ${name} salvo!`, { position: 'top-right' });
    setModal(m => ({ ...m, open: false }));
    setSaving(false);
  };

  const sorted = [...lines].sort((a, b) => {
    const p = l => l.isStopped ? 0 : l.hasSkip ? 1 : 2;
    return p(a) !== p(b) ? p(a) - p(b) : a.line_name.localeCompare(b.line_name);
  });

  const filtered = sorted.filter(l => {
    if (filter === 'ok') return !l.isStopped && !l.hasSkip;
    if (filter === 'skip') return l.hasSkip;
    if (filter === 'stopped') return l.isStopped;
    return true;
  });

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(100vh - 15px)', padding: '24px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', backgroundColor: '#f3f4f6' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>Central de Monitoramento</h1>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 0' }}>Build Test e Sites</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#6b7280' }}>Auto</span>
              <Toggle checked={auto} onChange={setAuto} />
            </div>
            <input type="date" value={dateStr} onChange={e => setDateStr(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '12px' }} />
            {lastSync && (
              <span style={{ fontSize: '11px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
                {format(lastSync, 'HH:mm:ss')}
              </span>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', flexShrink: 0 }}>
          <StatCard icon={BarChart3} label="Total de Jigs" value={buildTotalExpected + ftTotalExpected} color="#2563eb" bgColor="#dbeafe" detail="Build + Sites" />
          <StatCard icon={CheckCircle2} label="Build OK" value={buildTotalOk} color="#10b981" bgColor="#d1fae5" detail={buildTotalExpected > 0 ? `${Math.round((buildTotalOk / buildTotalExpected) * 100)}% eficiência` : '—'} />
          <StatCard icon={AlertTriangle} label="Build Skips" value={buildSkipsTotal} color="#f59e0b" bgColor="#fef3c7" detail={`de ${buildTotalExpected}`} />
          <StatCard icon={CheckCircle2} label="Sites OK" value={ftTotalOk} color="#10b981" bgColor="#d1fae5" detail={ftTotalExpected > 0 ? `${Math.round((ftTotalOk / ftTotalExpected) * 100)}% eficiência` : '—'} />
          <StatCard icon={AlertTriangle} label="Sites Skips" value={ftSkipsTotal} color="#f59e0b" bgColor="#fef3c7" detail={`de ${ftTotalExpected}`} />
          <StatCard icon={Activity} label="Linhas Ativas" value={totalL - stopL} color="#2563eb" bgColor="#dbeafe" detail={`${stopL} parada${stopL !== 1 ? 's' : ''}`} />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          {[
            { key: 'all', label: 'Todas', count: sorted.length },
            { key: 'ok', label: 'OK', count: okL },
            { key: 'skip', label: 'Com Skip', count: skipL },
            { key: 'stopped', label: 'Paradas', count: stopL },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, padding: '10px 16px', borderRadius: '8px', border: '2px solid',
                backgroundColor: filter === f.key ? '#2563eb' : 'white',
                color: filter === f.key ? 'white' : '#374151',
                borderColor: filter === f.key ? '#2563eb' : '#e5e7eb',
                cursor: 'pointer',
              }}
            >
              {f.label}
              <span style={{ fontSize: '12px', fontWeight: 700, backgroundColor: filter === f.key ? 'rgba(255,255,255,0.3)' : '#f3f4f6', padding: '2px 8px', borderRadius: '4px', color: filter === f.key ? 'white' : '#6b7280' }}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Lines Grid */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
            {filtered.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: '#9ca3af' }}>
                <div style={{ textAlign: 'center' }}>
                  <AlertCircle size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <p style={{ fontSize: '14px', margin: 0 }}>Nenhuma linha encontrada</p>
                </div>
              </div>
            ) : (
              filtered.map(line => <LineCard key={line._key} line={line} dateStr={dateStr} onCell={onCell} />)
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        open={modal.open}
        onClose={() => setModal(m => ({ ...m, open: false }))}
        title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MessageSquare size={16} style={{ color: '#2563eb' }} />{modal.title}</span>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Matrícula</label>
            <input
              style={{ width: '100%', maxWidth: '160px', padding: '8px 12px', border: `1px solid ${formErr.mat ? '#ef4444' : '#d1d5db'}`, borderRadius: '6px', fontSize: '14px', outline: 'none' }}
              placeholder="Ex: 001"
              value={matInput}
              onChange={e => { setMatInput(e.target.value); setEmpName(EMPLOYEES[e.target.value.trim()] || ''); if (formErr.mat) setFormErr(fe => ({ ...fe, mat: undefined })); }}
            />
            {formErr.mat && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{formErr.mat}</p>}
            {empName && (
              <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '6px', padding: '6px 12px' }}>
                <User size={12} style={{ color: '#2563eb' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e40af' }}>{empName}</span>
              </div>
            )}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Motivo do Skip <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: '12px' }}>(descreva a causa)</span></label>
            <textarea
              style={{ width: '100%', padding: '8px 12px', border: `1px solid ${formErr.comment ? '#ef4444' : '#d1d5db'}`, borderRadius: '6px', fontSize: '13px', outline: 'none', resize: 'none' }}
              rows={4}
              placeholder="Ex: Sensor descalibrado, aguardando peça…"
              maxLength={300}
              value={commentText}
              onChange={e => { setCommentText(e.target.value); if (formErr.comment) setFormErr(fe => ({ ...fe, comment: undefined })); }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              {formErr.comment ? <p style={{ fontSize: '12px', color: '#ef4444' }}>{formErr.comment}</p> : <span />}
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>{commentText.length}/300</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }} onClick={() => setModal(m => ({ ...m, open: false }))}>Cancelar</button>
            <button style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', opacity: saving ? 0.5 : 1 }} onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar Comentário'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
