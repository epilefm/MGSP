import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutGrid, Wrench, Smartphone, Search, Eye, RotateCw,
  Check, X, Save, TrendingUp, Package, AlertTriangle,
  CheckCircle, Clock, RefreshCw, ChevronLeft, ChevronRight,
  BarChart2, List, Download, History, Zap
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Header from '../../Layout/MGSPHead/Header';

const API = 'http://105.103.39.102:8080/api';

/* ─────────────────────────────────────────
   UTILS
───────────────────────────────────────── */
const fmt = (n) => new Intl.NumberFormat('pt-BR').format(n);
const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

/* ─────────────────────────────────────────
   MINI COMPONENTS
───────────────────────────────────────── */
const Badge = ({ children, color = 'blue' }) => {
  const colors = {
    blue: 'var(--badge-blue)',
    green: 'var(--badge-green)',
    red: 'var(--badge-red)',
    yellow: 'var(--badge-yellow)',
    gray: 'var(--badge-gray)',
  };
  return (
    <span style={{
      background: colors[color],
      color: '#fff',
      padding: '2px 10px',
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
    }}>{children}</span>
  );
};

const RingProgress = ({ value, max, color, label, sub }) => {
  const radius = 44;
  const circ = 2 * Math.PI * radius;
  const p = max > 0 ? value / max : 0;
  const dash = circ * p;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={110} height={110} viewBox="0 0 110 110">
        <circle cx={55} cy={55} r={radius} fill="none" stroke="var(--ring-bg)" strokeWidth={10} />
        <circle
          cx={55} cy={55} r={radius} fill="none"
          stroke={color} strokeWidth={10}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 55 55)"
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)' }}
        />
        <text x={55} y={50} textAnchor="middle" fill="var(--text-primary)" fontSize={18} fontWeight={700} fontFamily="'DM Sans', sans-serif">{value}</text>
        <text x={55} y={67} textAnchor="middle" fill="var(--text-muted)" fontSize={11} fontFamily="'DM Sans', sans-serif">de {max}</text>
      </svg>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>{label}</span>
      {sub && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</span>}
    </div>
  );
};

const BarProgress = ({ value, max, color, label }) => {
  const p = pct(value, max);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 700 }}>{value}/{max} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({p}%)</span></span>
      </div>
      <div style={{ height: 8, background: 'var(--ring-bg)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${p}%`, background: color, borderRadius: 99,
          transition: 'width 0.8s cubic-bezier(.4,0,.2,1)'
        }} />
      </div>
    </div>
  );
};

const Toast = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  const colors = { success: '#22c55e', error: '#ef4444', info: '#3b82f6', warning: '#f59e0b' };
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: 'var(--card-bg)', border: `1.5px solid ${colors[type] || colors.info}`,
      borderRadius: 12, padding: '12px 20px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      display: 'flex', alignItems: 'center', gap: 10, minWidth: 260,
      animation: 'slideInRight 0.3s ease',
    }}>
      <span style={{ color: colors[type], fontSize: 18 }}>
        {type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ'}
      </span>
      <span style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}>×</button>
    </div>
  );
};

const SenhaModal = ({ onConfirm, onCancel }) => {
  const [senha, setSenha] = useState('');
  const SENHA_ADMIN = 'mgsp';

  const handleConfirm = () => {
    if (senha === SENHA_ADMIN) {
      onConfirm();
    } else {
      alert('Senha incorreta!');
      setSenha('');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 8000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'var(--card-bg)', borderRadius: 16, padding: 32, maxWidth: 380, width: '90%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)', border: '1px solid var(--border)',
        animation: 'scaleIn 0.2s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ef444420', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            🔒
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, color: 'var(--text-primary)', fontWeight: 700 }}>Acesso Restrito</h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Insira a senha de administrador</p>
          </div>
        </div>
        <input
          type="password"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleConfirm()}
          placeholder="Digite a senha..."
          autoFocus
          style={{
            width: '100%', height: 44, padding: '0 14px',
            border: '1px solid var(--border)', borderRadius: 8,
            background: 'var(--input-bg)', color: 'var(--text-primary)',
            fontSize: 14, outline: 'none', marginBottom: 20,
          }}
        />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            padding: '9px 20px', borderRadius: 8, border: '1.5px solid var(--border)',
            background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: 13,
          }}>Cancelar</button>
          <button onClick={handleConfirm} style={{
            padding: '9px 20px', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff',
            cursor: 'pointer', fontWeight: 700, fontSize: 13,
          }}>Confirmar</button>
        </div>
      </div>
    </div>
  );
};

const ConfirmModal = ({ title, message, onConfirm, onCancel }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 8000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(4px)',
  }}>
    <div style={{
      background: 'var(--card-bg)', borderRadius: 16, padding: 32, maxWidth: 420, width: '90%',
      boxShadow: '0 24px 64px rgba(0,0,0,0.3)', border: '1px solid var(--border)',
      animation: 'scaleIn 0.2s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f59e0b20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle size={20} color="#f59e0b" />
        </div>
        <h3 style={{ margin: 0, fontSize: 17, color: 'var(--text-primary)', fontWeight: 700 }}>{title}</h3>
      </div>
      <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{message}</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{
          padding: '9px 20px', borderRadius: 8, border: '1.5px solid var(--border)',
          background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: 13,
        }}>Cancelar</button>
        <button onClick={onConfirm} style={{
          padding: '9px 20px', borderRadius: 8, border: 'none',
          background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: '#fff',
          cursor: 'pointer', fontWeight: 700, fontSize: 13,
        }}>Confirmar Reset</button>
      </div>
    </div>
  </div>
);

const HistoricoModal = ({ ativo, historico, onClose }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 8000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(4px)', padding: 16,
  }}>
    <div style={{
      background: 'var(--card-bg)', borderRadius: 16, width: '100%', maxWidth: 640,
      maxHeight: '80vh', display: 'flex', flexDirection: 'column',
      boxShadow: '0 24px 64px rgba(0,0,0,0.3)', border: '1px solid var(--border)',
      animation: 'scaleIn 0.2s ease',
    }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Histórico de Inventário</div>
          <h2 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)', fontWeight: 700 }}>Asset {ativo?.asset_identifier}</h2>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>{ativo?.description}</p>
        </div>
        <button onClick={onClose} style={{ background: 'var(--hover-bg)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          <X size={16} />
        </button>
      </div>
      <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px' }}>
        {historico.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <History size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>Nenhum registro de inventário encontrado.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {historico
              .sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora))
              .map((item, i) => {
                const isEncontrado = item.status === 'encontrado';
                const color = isEncontrado ? '#22c55e' : '#ef4444';
                return (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', background: color + '20',
                      border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, fontSize: 14, fontWeight: 'bold', color: color,
                    }}>
                      {isEncontrado ? '✓' : '✕'}
                    </div>
                    <div style={{ flex: 1, background: 'var(--hover-bg)', borderRadius: 10, padding: '10px 14px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 6 }}>
                        <div>
                          <Badge color={isEncontrado ? 'green' : 'red'}>
                            {isEncontrado ? 'Encontrado' : 'Não Encontrado'}
                          </Badge>
                          {item.inventario_id && (
                            <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-muted)' }}>Ciclo #{item.inventario_id}</span>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {new Date(item.data_hora).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      {item.localizacao && (
                        <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                          📍 {item.localizacao}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
const GestaoAtivos = () => {
  const [ativos, setAtivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('todos');
  const [filtroPesquisa, setFiltroPesquisa] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [itensPorPagina, setItensPorPagina] = useState(100);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [statusInventario, setStatusInventario] = useState({});
  const [localizacaoInventario, setLocalizacaoInventario] = useState({});
  const [dataRegistro, setDataRegistro] = useState({});
  const [cicloAtual, setCicloAtual] = useState(null); // ID do ciclo de inventário ativo
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [senhaModal, setSenhaModal] = useState(false);
  const [historicoModal, setHistoricoModal] = useState({ visivel: false, ativo: null, dados: [] });
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [theme, setTheme] = useState('light');

  const showToast = (msg, type = 'info') => setToast({ msg, type });

  // Buscar ou criar ciclo de inventário ativo
  const carregarCicloAtivo = useCallback(async () => {
    try {
      const res = await fetch(`${API}/ciclo-inventario-ativo`);
      const data = await res.json();
      if (data.success && data.data) {
        setCicloAtual(data.data);
        return data.data;
      }
    } catch (e) {
      console.error('Erro ao carregar ciclo:', e);
    }
    return null;
  }, []);

  // Buscar todos os ativos
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [ativosRes] = await Promise.all([
          fetch(`${API}/ativos-unificados`),
        ]);
        const ativosData = await ativosRes.json();
        setAtivos(ativosData.data || ativosData);

        const ciclo = await carregarCicloAtivo();

        if (ciclo) {
          await carregarStatusCiclo(ciclo.id, ativosData.data || ativosData);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Carregar status do ciclo atual
  const carregarStatusCiclo = async (cicloId, ativosLista) => {
    try {
      const lista = Array.isArray(ativosLista) ? ativosLista : ativos;
      const ids = lista.map(a => a.asset_identifier);
      const res = await fetch(`${API}/ativos-com-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetIdentifiers: ids, cicloId }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const map = {};
        const mapLoc = {};
        const mapData = {};
        data.data.forEach(item => { 
          map[item.asset_identifier] = item.status;
          mapLoc[item.asset_identifier] = item.localizacao || '';
          mapData[item.asset_identifier] = item.data_hora || item.data_registro || null;
        });
        setStatusInventario(map);
        setLocalizacaoInventario(mapLoc);
        setDataRegistro(mapData);
      }
    } catch (e) {
      console.error('Erro ao carregar status:', e);
    }
  };

  // Salvar status de um ativo
  const salvarStatus = async (ativo, status) => {
    try {
      const res = await fetch(`${API}/salvar-inventario-ativo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_identifier: ativo.asset_identifier,
          serial_number: ativo.serial,
          description: ativo.description,
          localizacao: localizacaoInventario[ativo.asset_identifier] !== undefined ? localizacaoInventario[ativo.asset_identifier] : (ativo.estacao || ''),
          tipo_ativo: ativo.tipo,
          status,
          ciclo_id: cicloAtual?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusInventario(prev => ({ ...prev, [ativo.asset_identifier]: status }));
        setLocalizacaoInventario(prev => ({ ...prev, [ativo.asset_identifier]: ativo.estacao || '' }));
        setDataRegistro(prev => ({ ...prev, [ativo.asset_identifier]: new Date().toISOString() }));
        showToast(
          status === 'encontrado' ? `✓ ${ativo.asset_identifier} marcado como Encontrado` : `✕ ${ativo.asset_identifier} marcado como Não Encontrado`,
          status === 'encontrado' ? 'success' : 'error'
        );
      } else {
        showToast('Erro ao salvar status', 'error');
      }
    } catch (e) {
      showToast('Erro de conexão', 'error');
    }
  };

  // Salvar localização
  const salvarLocalizacao = async (ativo) => {
    const loc = localizacaoInventario[ativo.asset_identifier] !== undefined ? localizacaoInventario[ativo.asset_identifier] : (ativo.estacao || '');
    try {
      const res = await fetch(`${API}/salvar-inventario-ativo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_identifier: ativo.asset_identifier,
          serial_number: ativo.serial,
          description: ativo.description,
          localizacao: loc,
          tipo_ativo: ativo.tipo,
          status: statusInventario[ativo.asset_identifier] || 'pendente',
          ciclo_id: cicloAtual?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLocalizacaoInventario(prev => ({ ...prev, [ativo.asset_identifier]: loc }));
        showToast('Localização salva!', 'success');
      }
      else showToast('Erro ao salvar localização', 'error');
    } catch (e) {
      showToast('Erro de conexão', 'error');
    }
  };

  // Resetar inventário = criar novo ciclo
  const resetarInventario = () => {
    setSenhaModal(true);
  };

  const confirmarResetInventario = () => {
    setConfirm({
      title: 'Iniciar Novo Inventário',
      message: `Isso vai criar um novo ciclo de inventário. Todos os itens voltarão ao status "Pendente". O histórico do ciclo anterior (${cicloAtual?.nome || 'atual'}) será preservado integralmente.`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          const res = await fetch(`${API}/novo_ciclo_inventario`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descricao: `Inventário ${new Date().toLocaleDateString('pt-BR')}` }),
          });
          const data = await res.json();
          if (data.success) {
            setCicloAtual(data.data);
            setStatusInventario({}); // tudo pendente (sem registro no novo ciclo)
            setLocalizacaoInventario({}); // limpar localizações do ciclo anterior
            setDataRegistro({}); // limpar datas de registro
            showToast(`🔄 Novo ciclo iniciado: ${data.data.nome}`, 'success');
          } else {
            showToast('Erro ao criar novo ciclo', 'error');
          }
        } catch (e) {
          showToast('Erro de conexão', 'error');
        }
      },
      onCancel: () => setConfirm(null),
    });
  };

  // Ver histórico de um ativo
  const verHistorico = async (ativo) => {
    try {
      const res = await fetch(`${API}/historico-inventario-ativo/${ativo.asset_identifier}`);
      const data = await res.json();
      setHistoricoModal({ visivel: true, ativo, dados: data.success ? data.data : [] });
    } catch (e) {
      showToast('Erro ao carregar histórico', 'error');
    }
  };

  // ── Cálculos ──────────────────────────────
  const ativosArray = Array.isArray(ativos) ? ativos : [];

  let ativosFiltrados = ativosArray.filter(a =>
    filtro === 'todos' || a.tipo === filtro
  );

  if (filtroStatus !== 'todos') {
    ativosFiltrados = ativosFiltrados.filter(a => {
      const s = statusInventario[a.asset_identifier] || 'pendente';
      return s === filtroStatus;
    });
  }

  if (filtroPesquisa) {
    const q = filtroPesquisa.toLowerCase();
    ativosFiltrados = ativosFiltrados.filter(a => {
      const cod = a.tipo === 'bnp' ? `820B00${a.asset_identifier}U` : `C82000${a.asset_identifier}T`;
      return (
        a.asset_identifier?.toString().toLowerCase().includes(q) ||
        cod.toLowerCase().includes(q) ||
        a.serial?.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        a.estacao?.toLowerCase().includes(q)
      );
    });
  }

  const totalPaginas = Math.ceil(ativosFiltrados.length / itensPorPagina);
  const ativosPaginados = ativosFiltrados.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina);

  const totalFixos = ativosArray.filter(a => a.tipo === 'fixo').length;
  const totalBNP = ativosArray.filter(a => a.tipo === 'bnp').length;

  const encontrados = ativosArray.filter(a => statusInventario[a.asset_identifier] === 'encontrado').length;
  const naoEncontrados = ativosArray.filter(a => statusInventario[a.asset_identifier] === 'nao_encontrado').length;
  const pendentes = ativosArray.length - encontrados - naoEncontrados;

  const fixosEnc = ativosArray.filter(a => a.tipo === 'fixo' && statusInventario[a.asset_identifier] === 'encontrado').length;
  const bnpEnc = ativosArray.filter(a => a.tipo === 'bnp' && statusInventario[a.asset_identifier] === 'encontrado').length;

  const progressoGeral = pct(encontrados + naoEncontrados, ativosArray.length);

  // Paginação
  const gerarPaginas = () => {
    if (totalPaginas <= 7) return Array.from({ length: totalPaginas }, (_, i) => i + 1);
    const pages = [1];
    if (paginaAtual > 3) pages.push('...');
    for (let i = Math.max(2, paginaAtual - 1); i <= Math.min(totalPaginas - 1, paginaAtual + 1); i++) pages.push(i);
    if (paginaAtual < totalPaginas - 2) pages.push('...');
    pages.push(totalPaginas);
    return pages;
  };

  const exportar = () => {
    const data = ativosArray.map(a => {
      const dataReg = dataRegistro[a.asset_identifier];
      const dataFormatada = dataReg ? new Date(dataReg).toLocaleString('pt-BR') : '-';
      return {
        'Asset': a.asset_identifier,
        'Código Patrimonial': a.tipo === 'bnp' ? `820B00${a.asset_identifier}U` : `C82000${a.asset_identifier}T`,
        'Serial': a.serial,
        'Descrição': a.description,
        'Localização': localizacaoInventario[a.asset_identifier] !== undefined ? localizacaoInventario[a.asset_identifier] : (a.estacao || ''),
        'Tipo': a.tipo === 'fixo' ? 'Ativo Fixo' : 'Ativo BNP',
        'Status': statusInventario[a.asset_identifier] || 'pendente',
        'Data Registro': dataFormatada,
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = { Sheets: { data: ws }, SheetNames: ['data'] };
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const blob = new Blob([excelBuffer], { type: fileType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventario_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exportado com sucesso!', 'success');
  };

  // ── CSS Variables (theme) ─────────────────
  const cssVars = theme === 'dark' ? {
    '--bg': '#0d1117',
    '--card-bg': '#161b22',
    '--border': '#30363d',
    '--text-primary': '#e6edf3',
    '--text-secondary': '#8b949e',
    '--text-muted': '#484f58',
    '--accent': '#58a6ff',
    '--accent-hover': '#79b8ff',
    '--hover-bg': '#1c2128',
    '--ring-bg': '#21262d',
    '--badge-blue': '#1d6fa0',
    '--badge-green': '#1a7f37',
    '--badge-red': '#b91c1c',
    '--badge-yellow': '#9a6700',
    '--badge-gray': '#484f58',
    '--input-bg': '#0d1117',
    '--row-hover': '#1c2128',
    '--table-head-bg': '#161b22',
  } : {
    '--bg': '#f6f8fa',
    '--card-bg': '#ffffff',
    '--border': '#d0d7de',
    '--text-primary': '#1f2328',
    '--text-secondary': '#656d76',
    '--text-muted': '#9198a1',
    '--accent': '#0969da',
    '--accent-hover': '#0550ae',
    '--hover-bg': '#f6f8fa',
    '--ring-bg': '#eaeef2',
    '--badge-blue': '#0969da',
    '--badge-green': '#1a7f37',
    '--badge-red': '#cf222e',
    '--badge-yellow': '#9a6700',
    '--badge-gray': '#8c959f',
    '--input-bg': '#ffffff',
    '--row-hover': '#f6f8fa',
    '--table-head-bg': '#f6f8fa',
  };

  if (loading) return (
    <div style={{ ...cssVars, minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ width: 48, height: 48, border: '4px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>Carregando ativos...</p>
    </div>
  );

  if (error) return (
    <div style={{ ...cssVars, minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <AlertTriangle size={40} color="#ef4444" />
      <p style={{ color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif" }}>Erro ao carregar: {error}</p>
      <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
        Tentar novamente
      </button>
    </div>
  );

  return (
    <div style={{ ...cssVars, minHeight: '100vh', background: 'var(--bg)', fontFamily: "'DM Sans', sans-serif", color: 'var(--text-primary)' }}>
      <Header />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .row-anim { animation: fadeIn 0.3s ease; }
        .btn { transition: all 0.15s ease; }
        .btn:hover { transform: translateY(-1px); }
        .btn:active { transform: translateY(0); }
        input, select { font-family: inherit; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
        .tr-hover:hover { background: var(--row-hover) !important; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{
        background: 'var(--card-bg)', borderBottom: '1px solid var(--border)',
        padding: '0 32px', position: 'initial', top: 110, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, var(--accent), #7c3aed)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Asset Management</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>MX SMD · {fmt(ativosArray.length)} ativos</div>
          </div>
          {cicloAtual && (
            <div style={{ marginLeft: 12, padding: '3px 10px', background: 'var(--accent)20', border: '1px solid var(--accent)40', borderRadius: 999, fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>
              <Zap size={10} style={{ display: 'inline', marginRight: 4 }} />
              {cicloAtual.nome || `Ciclo #${cicloAtual.id}`}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="btn" onClick={exportar} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={14} /> Exportar
          </button>
          <button className="btn" onClick={() => window.location.reload()} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Recarregar
          </button>
          <button className="btn" onClick={resetarInventario} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <RotateCw size={14} /> Novo Inventário
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 1600, margin: '0 auto', marginTop: 10 }}>

        {/* ── KPI CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total de Ativos', value: fmt(ativosArray.length), icon: <Package size={18} />, color: '#3b82f6', sub: 'no sistema' },
            { label: 'Ativos Fixos', value: fmt(totalFixos), icon: <Wrench size={18} />, color: '#8b5cf6', sub: `${pct(totalFixos, ativosArray.length)}% do total` },
            { label: 'Ativos BNP', value: fmt(totalBNP), icon: <Smartphone size={18} />, color: '#06b6d4', sub: `${pct(totalBNP, ativosArray.length)}% do total` },
            { label: 'Encontrados', value: fmt(encontrados), icon: <CheckCircle size={18} />, color: '#22c55e', sub: `${pct(encontrados, ativosArray.length)}% do total` },
            { label: 'Não Encontrados', value: fmt(naoEncontrados), icon: <X size={18} />, color: '#ef4444', sub: `${pct(naoEncontrados, ativosArray.length)}% do total` },
            { label: 'Pendentes', value: fmt(pendentes), icon: <Clock size={18} />, color: '#f59e0b', sub: `${pct(pendentes, ativosArray.length)}% do total` },
          ].map((kpi, i) => (
            <div key={i} style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12,
              padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8,
              animation: `fadeIn 0.3s ease ${i * 0.05}s both`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{kpi.label}</span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: kpi.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color }}>
                  {kpi.icon}
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{kpi.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* ── PROGRESS SECTION ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          {/* Progresso geral */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>Progresso do Inventário</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{progressoGeral}% concluído</div>
              </div>
              <BarChart2 size={18} color="var(--text-muted)" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <RingProgress value={encontrados} max={ativosArray.length} color="#22c55e" label="Encontrados" sub={`${pct(encontrados, ativosArray.length)}%`} />
              <RingProgress value={naoEncontrados} max={ativosArray.length} color="#ef4444" label="Não Encontrados" sub={`${pct(naoEncontrados, ativosArray.length)}%`} />
              <RingProgress value={pendentes} max={ativosArray.length} color="#f59e0b" label="Pendentes" sub={`${pct(pendentes, ativosArray.length)}%`} />
            </div>
          </div>

          {/* Progresso por tipo */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>Progresso por Tipo</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Encontrados em cada categoria</div>
              </div>
              <TrendingUp size={18} color="var(--text-muted)" />
            </div>
            <BarProgress value={fixosEnc} max={totalFixos} color="#8b5cf6" label="Ativos Fixos" />
            <BarProgress value={bnpEnc} max={totalBNP} color="#06b6d4" label="Ativos BNP" />
            <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--hover-bg)', borderRadius: 8, display: 'flex', gap: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Fixos:</span>{' '}
                {ativosArray.filter(a => a.tipo === 'fixo' && statusInventario[a.asset_identifier] === 'nao_encontrado').length} não encontrados
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>BNP:</span>{' '}
                {ativosArray.filter(a => a.tipo === 'bnp' && statusInventario[a.asset_identifier] === 'nao_encontrado').length} não encontrados
              </div>
            </div>
          </div>
        </div>

        {/* ── FILTERS BAR ── */}
        <div style={{
          background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12,
          padding: '16px 20px', marginBottom: 16,
          display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            {/* Busca */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, color: 'var(--text-muted)' }} />
              <input
                value={filtroPesquisa}
                onChange={e => { setFiltroPesquisa(e.target.value); setPaginaAtual(1); }}
                placeholder="Buscar asset, serial, descrição..."
                style={{
                  paddingLeft: 32, paddingRight: 12, height: 36, width: 260,
                  border: '1px solid var(--border)', borderRadius: 8, background: 'var(--input-bg)',
                  color: 'var(--text-primary)', fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            {/* Tipo */}
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { key: 'todos', label: 'Todos', icon: <LayoutGrid size={13} /> },
                { key: 'fixo', label: 'Fixos', icon: <Wrench size={13} /> },
                { key: 'bnp', label: 'BNP', icon: <Smartphone size={13} /> },
              ].map(f => (
                <button key={f.key} className="btn" onClick={() => { setFiltro(f.key); setPaginaAtual(1); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 7,
                    border: '1px solid ' + (filtro === f.key ? 'var(--accent)' : 'var(--border)'),
                    background: filtro === f.key ? 'var(--accent)18' : 'transparent',
                    color: filtro === f.key ? 'var(--accent)' : 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: 12, fontWeight: filtro === f.key ? 700 : 500,
                  }}>
                  {f.icon} {f.label}
                </button>
              ))}
            </div>

            {/* Status */}
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { key: 'todos', label: 'Todos status' },
                { key: 'pendente', label: '⏳ Pendente' },
                { key: 'encontrado', label: '✓ Encontrado' },
                { key: 'nao_encontrado', label: '✕ Não Encontrado' },
              ].map(f => (
                <button key={f.key} className="btn" onClick={() => { setFiltroStatus(f.key); setPaginaAtual(1); }}
                  style={{
                    padding: '7px 12px', borderRadius: 7,
                    border: '1px solid ' + (filtroStatus === f.key ? 'var(--accent)' : 'var(--border)'),
                    background: filtroStatus === f.key ? 'var(--accent)18' : 'transparent',
                    color: filtroStatus === f.key ? 'var(--accent)' : 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: 12, fontWeight: filtroStatus === f.key ? 700 : 500,
                  }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* View toggle */}
            <div style={{ display: 'flex', gap: 2, background: 'var(--hover-bg)', borderRadius: 7, padding: 3 }}>
              {[{ key: 'table', icon: <List size={14} /> }, { key: 'cards', icon: <LayoutGrid size={14} /> }].map(v => (
                <button key={v.key} onClick={() => setViewMode(v.key)} style={{
                  padding: '5px 8px', borderRadius: 5, border: 'none', cursor: 'pointer',
                  background: viewMode === v.key ? 'var(--card-bg)' : 'transparent',
                  color: viewMode === v.key ? 'var(--accent)' : 'var(--text-muted)',
                  boxShadow: viewMode === v.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                }}>
                  {v.icon}
                </button>
              ))}
            </div>

            <select value={itensPorPagina} onChange={e => { setItensPorPagina(Number(e.target.value)); setPaginaAtual(1); }}
              style={{ height: 36, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 7, background: 'var(--input-bg)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>
              {[50, 100, 200, 500, ativosFiltrados.length].map(n => <option key={n} value={n}>{n === ativosFiltrados.length ? 'Todos' : n} por página</option>)}
            </select>

            <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {fmt(ativosFiltrados.length)} resultados
            </span>
          </div>
        </div>

        {/* ── TABLE VIEW ── */}
        {viewMode === 'table' && (
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--table-head-bg)', borderBottom: '2px solid var(--border)' }}>
                    {['Asset', 'Cód. Patrimonial', 'Serial', 'Descrição', 'Localização', 'Tipo', 'Status', 'Ações'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ativosPaginados.map((ativo, i) => {
                    const status = statusInventario[ativo.asset_identifier] || 'pendente';
                    const cod = ativo.tipo === 'bnp' ? `820B00${ativo.asset_identifier}U` : `C82000${ativo.asset_identifier}T`;
                    return (
                      <tr key={i} className="tr-hover row-anim" style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--accent)', fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{ativo.asset_identifier}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text-muted)', background: 'var(--hover-bg)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>{cod}</span>
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{ativo.serial}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-primary)', maxWidth: 240 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ativo.description}>{ativo.description}</div>
                        </td>
                        <td style={{ padding: '10px 14px', minWidth: 180 }}>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input
                              value={localizacaoInventario[ativo.asset_identifier] !== undefined ? localizacaoInventario[ativo.asset_identifier] : (ativo.estacao || '')}
                              onChange={e => setLocalizacaoInventario(prev => ({ ...prev, [ativo.asset_identifier]: e.target.value }))}
                              style={{ flex: 1, height: 30, padding: '0 8px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: 12, outline: 'none', minWidth: 0 }}
                            />
                            <button className="btn" onClick={() => salvarLocalizacao(ativo)} title="Salvar Localização" style={{ width: 28, height: 28, border: '1px solid var(--border)', borderRadius: 6, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0, fontSize: 14 }}>
                              💾
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <Badge color={ativo.tipo === 'fixo' ? 'blue' : 'green'}>{ativo.tipo === 'fixo' ? 'Fixo' : 'BNP'}</Badge>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                            background: status === 'encontrado' ? '#22c55e18' : status === 'nao_encontrado' ? '#ef444418' : '#f59e0b18',
                            color: status === 'encontrado' ? '#22c55e' : status === 'nao_encontrado' ? '#ef4444' : '#f59e0b',
                            border: `1px solid ${status === 'encontrado' ? '#22c55e40' : status === 'nao_encontrado' ? '#ef444440' : '#f59e0b40'}`,
                          }}>
                            {status === 'encontrado' ? '✓ Encontrado' : status === 'nao_encontrado' ? '✕ Não Encontrado' : '⏳ Pendente'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button 
                              className="btn" 
                              onClick={() => salvarStatus(ativo, 'encontrado')} 
                              title="Marcar como Encontrado"
                              style={{ 
                                width: 28, 
                                height: 28, 
                                border: '1px solid #22c55e40', 
                                borderRadius: 6, 
                                background: '#22c55e10', 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                color: '#22c55e',
                                fontSize: 16,
                                fontWeight: 'bold'
                              }}>
                              ✓
                            </button>
                            <button 
                              className="btn" 
                              onClick={() => salvarStatus(ativo, 'nao_encontrado')} 
                              title="Marcar como Não Encontrado"
                              style={{ 
                                width: 28, 
                                height: 28, 
                                border: '1px solid #ef444440', 
                                borderRadius: 6, 
                                background: '#ef444410', 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                color: '#ef4444',
                                fontSize: 16,
                                fontWeight: 'bold'
                              }}>
                              ✕
                            </button>
                            <button 
                              className="btn" 
                              onClick={() => verHistorico(ativo)} 
                              title="Ver Histórico"
                              style={{ 
                                width: 28, 
                                height: 28, 
                                border: '1px solid var(--border)', 
                                borderRadius: 6, 
                                background: 'transparent', 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                color: 'var(--text-muted)',
                                fontSize: 16
                              }}>
                              👁
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CARD VIEW ── */}
        {viewMode === 'cards' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {ativosPaginados.map((ativo, i) => {
              const status = statusInventario[ativo.asset_identifier] || 'pendente';
              const cod = ativo.tipo === 'bnp' ? `820B00${ativo.asset_identifier}U` : `C82000${ativo.asset_identifier}T`;
              const statusColor = status === 'encontrado' ? '#22c55e' : status === 'nao_encontrado' ? '#ef4444' : '#f59e0b';
              return (
                <div key={i} className="row-anim" style={{
                  background: 'var(--card-bg)', border: `1px solid ${statusColor}30`, borderRadius: 12,
                  padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
                  borderTop: `3px solid ${statusColor}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{ativo.asset_identifier}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace", marginTop: 2 }}>{cod}</div>
                    </div>
                    <Badge color={ativo.tipo === 'fixo' ? 'blue' : 'green'}>{ativo.tipo === 'fixo' ? 'Fixo' : 'BNP'}</Badge>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>{ativo.description}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Serial: <span style={{ color: 'var(--text-secondary)', fontFamily: "'DM Mono', monospace" }}>{ativo.serial}</span></div>
                  {(localizacaoInventario[ativo.asset_identifier] || ativo.estacao) && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>📍 {localizacaoInventario[ativo.asset_identifier] || ativo.estacao}</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: statusColor }}>
                      {status === 'encontrado' ? '✓ Encontrado' : status === 'nao_encontrado' ? '✕ Não Encontrado' : '⏳ Pendente'}
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn" onClick={() => salvarStatus(ativo, 'encontrado')} style={{ width: 28, height: 28, border: '1px solid #22c55e40', borderRadius: 6, background: '#22c55e10', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e', fontSize: 16, fontWeight: 'bold' }}>✓</button>
                      <button className="btn" onClick={() => salvarStatus(ativo, 'nao_encontrado')} style={{ width: 28, height: 28, border: '1px solid #ef444440', borderRadius: 6, background: '#ef444410', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: 16, fontWeight: 'bold' }}>✕</button>
                      <button className="btn" onClick={() => verHistorico(ativo)} style={{ width: 28, height: 28, border: '1px solid var(--border)', borderRadius: 6, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 16 }}>👁</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── PAGINATION ── */}
        {totalPaginas > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 20, padding: '16px 0' }}>
            <button className="btn" onClick={() => setPaginaAtual(p => Math.max(1, p - 1))} disabled={paginaAtual === 1}
              style={{ width: 32, height: 32, border: '1px solid var(--border)', borderRadius: 7, background: 'var(--card-bg)', cursor: paginaAtual === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', opacity: paginaAtual === 1 ? 0.4 : 1 }}>
              <ChevronLeft size={14} />
            </button>

            {gerarPaginas().map((p, i) => (
              <button key={i} onClick={() => typeof p === 'number' && setPaginaAtual(p)} disabled={typeof p !== 'number'}
                style={{
                  minWidth: 32, height: 32, border: '1px solid ' + (p === paginaAtual ? 'var(--accent)' : 'var(--border)'),
                  borderRadius: 7, background: p === paginaAtual ? 'var(--accent)' : 'var(--card-bg)',
                  color: p === paginaAtual ? '#fff' : 'var(--text-secondary)',
                  cursor: typeof p === 'number' ? 'pointer' : 'default', fontSize: 13, fontWeight: p === paginaAtual ? 700 : 400,
                  padding: '0 6px',
                }}>
                {p}
              </button>
            ))}

            <button className="btn" onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))} disabled={paginaAtual === totalPaginas}
              style={{ width: 32, height: 32, border: '1px solid var(--border)', borderRadius: 7, background: 'var(--card-bg)', cursor: paginaAtual === totalPaginas ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', opacity: paginaAtual === totalPaginas ? 0.4 : 1 }}>
              <ChevronRight size={14} />
            </button>

            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
              Página {paginaAtual} de {totalPaginas}
            </span>
          </div>
        )}
      </div>

      {/* ── MODALS & OVERLAYS ── */}
      {senhaModal && (
        <SenhaModal
          onConfirm={() => { setSenhaModal(false); confirmarResetInventario(); }}
          onCancel={() => setSenhaModal(false)}
        />
      )}
      {confirm && <ConfirmModal {...confirm} />}
      {historicoModal.visivel && (
        <HistoricoModal
          ativo={historicoModal.ativo}
          historico={historicoModal.dados}
          onClose={() => setHistoricoModal({ visivel: false, ativo: null, dados: [] })}
        />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default GestaoAtivos;
