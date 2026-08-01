import { API_URL } from '../../config/api';
// Repair TNP IA - Assistente de consulta de histórico de reparos
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot, Send, BarChart3, Cpu, AlertTriangle,
  ChevronDown, ChevronUp, TrendingUp, 
  Package, Zap, RefreshCw
} from 'lucide-react';
import axios from 'axios';
import './RepairTNP_IA.css';

const api = axios.create({
  baseURL: `${API_URL}`,
});

const SUGESTOES = [
  'Modelo BSM-A075M falha LTE BAND13',
  'Sintoma Tombstone no componente R3813',
  'Defeito Curto de Solda U301',
  'Modelo SM-A155M WakeUP componente alterado',
  'LTE FHC PA Gain falha',
];

const getStatusClass = (status) => {
  if (!status) return '';
  const s = status.toLowerCase();
  if (s === 'good' || s.includes('conserto ok')) return 'status-badge conserto-ok';
  if (s === 'ng') return 'status-badge ng';
  if (s.includes('troca ok')) return 'status-badge troca-ok';
  return 'status-badge';
};

function MessageBubble({ msg }) {
  const [showCases, setShowCases] = useState(false);
  const isUser = msg.role === 'user';

  const renderText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, i) => {
      const formatted = line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/_(.+?)_/g, '<em>$1</em>');
      return (
        <p key={i} style={{ marginTop: line === '' ? '4px' : '0' }}
          dangerouslySetInnerHTML={{ __html: formatted || '\u00A0' }} />
      );
    });
  };

  if (isUser) {
    return (
      <div className="message-bubble user">
        <div className="message-content">
          <p>{msg.content}</p>
          <p className="message-time">{msg.time}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="message-bubble">
      <div className="message-avatar">
        <Bot size={14} />
      </div>
      <div style={{ flex: 1 }}>
        <div className="message-content">
          {msg.loading ? (
            <div className="loading-spinner">
              <RefreshCw size={14} />
              <span>Analisando dados históricos...</span>
            </div>
          ) : (
            <div>{renderText(msg.content)}</div>
          )}
          {msg.stats && (
            <div className="message-stats">
              <span>
                <BarChart3 size={12} />
                {msg.stats.total} casos
              </span>
              <span style={{ 
                color: msg.stats.taxaSucesso >= 70 ? '#16a34a' : '#d97706',
                fontWeight: 500
              }}>
                <TrendingUp size={12} />
                {msg.stats.taxaSucesso}% sucesso
              </span>
            </div>
          )}
        </div>

        {msg.cases?.length > 0 && (
          <div className="cases-table-container">
            <div 
              className="cases-table-header"
              onClick={() => setShowCases(v => !v)}
            >
              <span>
                <Package size={12} />
                {msg.cases.length} casos históricos encontrados
              </span>
              {showCases ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </div>
            {showCases && (
              <table className="cases-table">
                <thead>
                  <tr>
                    <th>Modelo</th>
                    <th>Sintoma</th>
                    <th>Defeito</th>
                    <th>Componente</th>
                    <th>Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {msg.cases.map((c, i) => (
                    <tr key={i}>
                      <td>{c.modelo}</td>
                      <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={c.sintoma}>
                        {c.sintoma}
                      </td>
                      <td>{c.defeito}</td>
                      <td className="component-code">{c.componente}</td>
                      <td>
                        <span className={getStatusClass(c.resultado)}>
                          {c.resultado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
        <p className="message-time">{msg.time}</p>
      </div>
    </div>
  );
}

export default function ReparoIA() {
  const [messages, setMessages] = useState([
    {
      id: 0,
      role: 'bot',
      content: 'Olá! Sou o **Assistente IA de Reparo**.\n\nDescreva o modelo da placa e o sintoma/falha observado que vou analisar o histórico e indicar as causas mais prováveis e ações recomendadas.\n\n_Exemplo: "Modelo BSM-A075M/1R4D com falha LTE BAND13"_',
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [globalStats, setGlobalStats] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollBottom(); }, [messages]);

  useEffect(() => {
    api.get('/reparo-ia/stats')
      .then(({ data }) => setGlobalStats(data))
      .catch(() => {});
  }, []);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const userMsg = { id: Date.now(), role: 'user', content: msg, time };
    const loadingMsg = { id: Date.now() + 1, role: 'bot', content: '', loading: true, time };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/reparo-ia/chat', { message: msg });
      setMessages(prev => prev.map(m =>
        m.id === loadingMsg.id
          ? { ...m, loading: false, content: data.reply, cases: data.cases, stats: data.stats }
          : m
      ));
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === loadingMsg.id
          ? { ...m, loading: false, content: 'Erro ao processar. Verifique se o backend está rodando.' }
          : m
      ));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const maxComp = globalStats?.topComponents?.[0]?.n || 1;
  const maxDef = globalStats?.topDefects?.[0]?.n || 1;

  return (
    <div className="reparo-ia-container">
      {/* Área do Chat */}
      <div className="chat-area">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-icon">
            <Bot size={20} />
          </div>
          <div className="chat-header-title">
            <h1>Assistente IA — Reparo de Placas</h1>
            <p>Análise baseada em histórico de reparos</p>
          </div>
          <div className="chat-status">
            <div className="chat-status-dot"></div>
            <span>Online</span>
          </div>
        </div>

        {/* Mensagens */}
        <div className="chat-messages">
          {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
          <div ref={messagesEndRef} />
        </div>

        {/* Sugestões */}
        {messages.length <= 2 && (
          <div className="suggestions-bar">
            {SUGESTOES.map(s => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="suggestion-chip"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Descreva o modelo e o sintoma da placa..."
              className="chat-input"
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="send-button"
            >
              {loading ? <RefreshCw size={16} /> : <Send size={16} />}
            </button>
          </div>
          <p className="chat-input-hint">
            Pressione Enter para enviar · dados das tabelas reparo_entrada, reparo_process e reparo_analise
          </p>
        </div>
      </div>

      {/* Painel Lateral */}
      <div className="sidebar">
        {/* Stats rápidos */}
        <div className="sidebar-card">
          <h2>
            <BarChart3 size={15} style={{ color: '#5464f5' }} />
            Indicadores Gerais
          </h2>
          <div className="stats-grid">
            <div className="stat-item">
              <p className="stat-value">
                {globalStats ? (globalStats.totalEntrada + (globalStats.totalAnalise || 0)).toLocaleString() : '—'}
              </p>
              <p className="stat-label">Registros</p>
            </div>
            <div className="stat-item">
              <p className={`stat-value ${globalStats?.taxaSucesso >= 70 ? 'success' : 'warning'}`}>
                {globalStats ? `${globalStats.taxaSucesso}%` : '—'}
              </p>
              <p className="stat-label">Sucesso</p>
            </div>
            <div className="stat-item">
              <p className="stat-value info">{globalStats?.totalProcess?.toLocaleString() ?? '—'}</p>
              <p className="stat-label">Processos</p>
            </div>
            <div className="stat-item">
              <p className="stat-value purple">{globalStats?.totalAnalise?.toLocaleString() ?? '—'}</p>
              <p className="stat-label">Análises</p>
            </div>
          </div>
        </div>

        {/* Top componentes */}
        <div className="sidebar-card">
          <h2>
            <Cpu size={15} style={{ color: '#3b82f6' }} />
            Top Componentes
          </h2>
          {globalStats?.topComponents?.length ? (
            <div className="mini-bar-list">
              {globalStats.topComponents.map(({ comp, n }) => {
                const pct = maxComp > 0 ? Math.round((n / maxComp) * 100) : 0;
                return (
                  <div className="mini-bar" key={comp}>
                    <span className="mini-bar-label" title={comp}>{comp}</span>
                    <div className="mini-bar-track">
                      <div className="mini-bar-fill blue" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="mini-bar-value">{n}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#999', fontSize: '12px', padding: '8px' }}>
              Aguardando dados...
            </p>
          )}
        </div>

        {/* Top defeitos */}
        <div className="sidebar-card">
          <h2>
            <AlertTriangle size={15} style={{ color: '#f59e0b' }} />
            Top Defeitos
          </h2>
          {globalStats?.topDefects?.length ? (
            <div className="mini-bar-list">
              {globalStats.topDefects.map(({ defeito, n }) => {
                const pct = maxDef > 0 ? Math.round((n / maxDef) * 100) : 0;
                return (
                  <div className="mini-bar" key={defeito}>
                    <span className="mini-bar-label" title={defeito}>{defeito}</span>
                    <div className="mini-bar-track">
                      <div className="mini-bar-fill amber" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="mini-bar-value">{n}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#999', fontSize: '12px', padding: '8px' }}>
              Aguardando dados...
            </p>
          )}
        </div>

        {/* Como usar */}
        <div className="sidebar-card how-to-use">
          <h2>
            <Zap size={14} />
            Como usar
          </h2>
          <ul>
            <li>• Informe o <strong>modelo</strong> da placa</li>
            <li>• Descreva o <strong>sintoma</strong> ou falha</li>
            <li>• O assistente busca <strong>casos similares</strong> no histórico</li>
            <li>• Receba sugestão de <strong>componente</strong> e ação recomendada</li>
            <li>• Dados consultados: <strong>reparo_entrada</strong> e <strong>reparo_process</strong></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
