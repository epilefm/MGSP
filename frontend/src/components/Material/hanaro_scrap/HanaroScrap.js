import { API_URL } from '../../../config/api';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, Wrench, Smartphone, Search, Eye, RotateCw,
  Check, X, Save, TrendingUp, AlertTriangle,
  CheckCircle, Clock, RefreshCw, ChevronLeft, ChevronRight, ChevronDown,
  BarChart2, List, Download, History, Zap, FileText,
  User, Calendar, Hash, Tag, MapPin, Factory,
  Settings, Filter, Plus, Minus, Edit3, Trash2,
  Printer, Camera, QrCode, Scan, Layers, Grid,
  Layout, LayoutList, FilterX, FilterCheck, FilterOff,
  ArrowUpDown, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  MoreHorizontal, MoreVertical, Menu, XCircle,
  Info, HelpCircle, AlertCircle, AlertOctagon,
  Star, Heart, ThumbsUp, ThumbsDown, Share, Copy,
  DownloadCloud, UploadCloud, Cloud, Wifi, WifiOff,
  Battery, BatteryCharging, BatteryFull, BatteryLow,
  Volume2, VolumeX, Bell, BellOff, MessageCircle,
  Mail, Phone, Globe, Map, Navigation, Compass,
  Home, Building, Store, ShoppingCart, CreditCard,
  DollarSign, Percent, PieChart, BarChart, LineChart,
  Activity, TrendingUp as TrendingUpIcon, TrendingDown,
  EyeOff, Eye as EyeIcon, Lock, Unlock, Key,
  UserPlus, UserMinus, Users, UserCheck, UserX,
  Bookmark, BookmarkCheck, BookmarkMinus, BookmarkPlus,
  Flag, FlagOff, Pin, PinOff, Link, Link2,
  ExternalLink, Paperclip, Image, Video, Music,
  Play, Pause, Stop, SkipBack, SkipForward,
  Rewind, FastForward, Repeat, Shuffle,
  Volume1, Volume, Mic, MicOff, Headphones,
  Cast, CastOff, Airplay, Disc, Disc2,
  Disc3, DiscAlbum, DiscEject, DiscPause,
  DiscPlay, DiscStop, DiscRecord, DiscSkipBack,
  DiscSkipForward, DiscStepBack, DiscStepForward,
  DiscTrack, DiscVolume, DiscWave, DiscWind,
  DiscZoomIn, DiscZoomOut, DiscZoomReset,
  Disc3D, Disc4K, Disc8K, DiscHD, DiscSD,
  DiscUHD, DiscVHS, DiscVCR, DiscVHSR, DiscVHST,
  DiscVHSX, DiscVHSY, DiscVHSZ, DiscVHS0, DiscVHS1,
  DiscVHS2, DiscVHS3, DiscVHS4, DiscVHS5, DiscVHS6,
  DiscVHS7, DiscVHS8, DiscVHS9,
  ShieldAlert
} from 'lucide-react';
import { Popconfirm, message } from 'antd';
import 'antd/dist/reset.css';
import ReactApexChart from 'react-apexcharts';
import DashboardHanaro from './dashboardHanaro';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Send, Square, Bot, Sparkles, Maximize2 } from 'lucide-react';
import RegistroForm from './RegistroForm';
import RegistroPreview from './RegistroPreview';

// ============================================
// FUNÇÕES UTILITÁRIAS PARA FORMATAÇÃO DE RESPOSTAS DA IA
// ============================================

// Formatar valor monetário
const formatarMoeda = (valor) => {
  if (valor === undefined || valor === null) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
};

// Formatar número com separadores
const formatarNumero = (numero, casasDecimais = 0) => {
  if (numero === undefined || numero === null) return '0';
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: casasDecimais, maximumFractionDigits: casasDecimais }).format(numero);
};

// Detectar e extrair tabelas Markdown do texto
const extrairTabelasMarkdown = (texto) => {
  const tabelas = [];
  const linhas = texto.split('\n');
  let tabelaAtual = [];
  let emTabela = false;
  let cabecalhoIndex = -1;

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    
    // Detectar início de tabela Markdown (| col | col |)
    if (linha.startsWith('|') && linha.endsWith('|')) {
      if (!emTabela) {
        emTabela = true;
        cabecalhoIndex = tabelaAtual.length;
      }
      // Extrair células
      const celulas = linha.split('|').filter((_, idx, arr) => idx !== 0 && idx !== arr.length - 1).map(c => c.trim());
      tabelaAtual.push(celulas);
    } else if (linha.startsWith('|-') || linha.startsWith('| :')) {
      // Linha separadora (ignorar)
      continue;
    } else {
      // Fim da tabela
      if (emTabela && tabelaAtual.length > 0) {
        tabelas.push({
          cabecalho: tabelaAtual[0] || [],
          dados: tabelaAtual.slice(1).filter(row => row.length > 0 && !row.every(c => c.startsWith('-') || c.startsWith(':')))
        });
        tabelaAtual = [];
        emTabela = false;
        cabecalhoIndex = -1;
      }
    }
  }

  // Capturar última tabela se existir
  if (emTabela && tabelaAtual.length > 0) {
    tabelas.push({
      cabecalho: tabelaAtual[0] || [],
      dados: tabelaAtual.slice(1).filter(row => row.length > 0 && !row.every(c => c.startsWith('-') || c.startsWith(':')))
    });
  }

  return tabelas;
};

// Detectar e extrair listas do texto
const extrairListas = (texto) => {
  const listas = [];
  const linhas = texto.split('\n');
  let listaAtual = [];
  let emLista = false;

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    
    // Detectar itens de lista (-, *, •, ou números)
    const matchLista = linha.match(/^(\s*)([-*•]|\d+\.)\s+(.*)/);
    
    if (matchLista) {
      if (!emLista) {
        emLista = true;
        listaAtual = [];
      }
      listaAtual.push({
        texto: matchLista[3],
        nivel: matchLista[1].length / 2
      });
    } else {
      if (emLista && listaAtual.length > 0) {
        listas.push(listaAtual);
        listaAtual = [];
        emLista = false;
      }
    }
  }

  if (emLista && listaAtual.length > 0) {
    listas.push(listaAtual);
  }

  return listas;
};

// Detectar cards de destaque (padrão: **Título**: valor ou 📊 Emoji + texto)
const extrairCards = (texto) => {
  const cards = [];
  const linhas = texto.split('\n');
  
  for (const linha of linhas) {
    // Padrão: **Texto**: valor ou **Texto:** valor
    const matchCard = linha.match(/\*\*([^*]+)\*\*:\s*(.+)/);
    if (matchCard) {
      cards.push({
        titulo: matchCard[1].trim(),
        valor: matchCard[2].trim()
      });
    }
    
    // Padrão com emoji: 📊 Texto
    const matchEmoji = linha.match(/^([📊📈📉💰🔴🟢🟡⚠️✅❌📌🎯🏆👤📅🕐🏭🔧📱])\s*(.+)/);
    if (matchEmoji) {
      cards.push({
        emoji: matchEmoji[1],
        texto: matchEmoji[2].trim()
      });
    }
  }
  
  return cards;
};

// Componente de Tabela Formatada
const TabelaIA = ({ cabecalho, dados }) => {
  if (!cabecalho || cabecalho.length === 0) return null;
  
  return (
    <div style={{
      margin: '12px 0',
      border: '1px solid var(--border)',
      borderRadius: 8,
      overflow: 'hidden'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: cabecalho.map(() => '1fr').join(' '),
        background: 'var(--accent)',
        padding: '10px 12px',
        fontSize: 12,
        fontWeight: 700,
        color: '#fff',
        textAlign: 'center'
      }}>
        {cabecalho.map((col, idx) => (
          <div key={idx}>{col}</div>
        ))}
      </div>
      {dados && dados.map((linha, idxLinha) => (
        <div key={idxLinha} style={{
          display: 'grid',
          gridTemplateColumns: cabecalho.map(() => '1fr').join(' '),
          padding: '10px 12px',
          fontSize: 13,
          textAlign: 'center',
          color: 'var(--text-primary)',
          borderBottom: idxLinha < dados.length - 1 ? '1px solid var(--border)' : 'none',
          background: idxLinha % 2 === 0 ? 'var(--card-bg)' : 'var(--hover-bg)'
        }}>
          {linha.map((celula, idxCelula) => {
            // Detectar e formatar valores monetários
            const matchMoeda = celula.match(/R\$\s*([\d.,]+)/);
            if (matchMoeda) {
              return (
                <div key={idxCelula} style={{ fontWeight: 600, color: 'var(--success)' }}>
                  {formatarMoeda(parseFloat(matchMoeda[1].replace('.', '').replace(',', '.')))}
                </div>
              );
            }
            // Detectar números e formatar
            if (!isNaN(parseFloat(celula.replace('.', '').replace(',', '.')))) {
              return (
                <div key={idxCelula} style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>
                  {celula}
                </div>
              );
            }
            // Destacar texto entre **
            if (celula.includes('**')) {
              const partes = celula.split(/\*\*(.+?)\*\*/);
              return (
                <div key={idxCelula}>
                  {partes.map((parte, idx) => 
                    idx % 2 === 1 ? <strong key={idx} style={{ color: 'var(--accent)' }}>{parte}</strong> : parte
                  )}
                </div>
              );
            }
            return <div key={idxCelula}>{celula}</div>;
          })}
        </div>
      ))}
    </div>
  );
};

// Componente de Lista Formatada
const ListaIA = ({ itens }) => {
  if (!itens || itens.length === 0) return null;
  
  return (
    <ul style={{
      margin: '8px 0',
      paddingLeft: 20,
      listStyleType: 'none'
    }}>
      {itens.map((item, idx) => (
        <li key={idx} style={{
          marginBottom: 6,
          paddingLeft: 8,
          borderLeft: '3px solid var(--accent)',
          background: 'var(--hover-bg)',
          padding: '8px 12px',
          borderRadius: '0 6px 6px 0',
          fontSize: 13,
          lineHeight: 1.5
        }}>
          {item.texto.includes('**') ? (
            <>
              {item.texto.split(/\*\*(.+?)\*\*/).map((parte, idxParte) =>
                idxParte % 2 === 1 ? (
                  <strong key={idxParte} style={{ color: 'var(--accent)', fontWeight: 700 }}>{parte}</strong>
                ) : (
                  parte
                )
              )}
            </>
          ) : (
            item.texto
          )}
        </li>
      ))}
    </ul>
  );
};

// Componente de Card de Destaque
const CardDestaqueIA = ({ titulo, valor, emoji, cor = 'var(--accent)' }) => {
  return (
    <div style={{
      display: 'inline-block',
      margin: '6px 8px 6px 0',
      padding: '10px 16px',
      background: `${cor}10`,
      border: `1px solid ${cor}40`,
      borderRadius: 10,
      boxShadow: `0 2px 8px ${cor}20`
    }}>
      <div style={{ fontSize: 11, color: cor, fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
        {emoji && <span>{emoji}</span>}
        {titulo}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'DM Mono', monospace" }}>
        {valor}
      </div>
    </div>
  );
};

// Componente principal para formatar resposta da IA
const FormatarRespostaIA = ({ conteudo }) => {
  if (!conteudo) return null;
  
  // Extrair elementos estruturados
  const tabelas = extrairTabelasMarkdown(conteudo);
  const listas = extrairListas(conteudo);
  const cards = extrairCards(conteudo);
  
  // Se houver elementos estruturados, renderizá-los
  if (tabelas.length > 0 || listas.length > 0 || cards.length > 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Renderizar cards de destaque */}
        {cards.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            {cards.map((card, idx) => (
              <CardDestaqueIA
                key={idx}
                titulo={card.titulo || card.texto}
                valor={card.valor}
                emoji={card.emoji}
              />
            ))}
          </div>
        )}
        
        {/* Renderizar tabelas */}
        {tabelas.map((tabela, idx) => (
          <TabelaIA key={idx} cabecalho={tabela.cabecalho} dados={tabela.dados} />
        ))}
        
        {/* Renderizar listas */}
        {listas.map((lista, idx) => (
          <ListaIA key={idx} itens={lista} />
        ))}
        
        {/* Renderizar texto restante (removendo elementos já processados) */}
        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6 }}>
          {conteudo
            .replace(/\*\*([^*]+)\*\*:\s*(.+)/g, '') // Remove cards
            .replace(/^([📊📈📉💰🔴🟢🟡⚠️✅❌📌🎯🏆👤📅🕐🏭🔧📱])\s*(.+)/gm, '') // Remove emojis
            .split('\n')
            .filter(linha => linha.trim() && !linha.startsWith('|') && !linha.startsWith('-') && !linha.startsWith('*'))
            .join('\n')}
        </div>
      </div>
    );
  }
  
  // Fallback: renderizar texto puro com formatação básica
  return (
    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6 }}>
      {conteudo.split(/\*\*(.+?)\*\*/).map((parte, idx) =>
        idx % 2 === 1 ? <strong key={idx} style={{ color: 'var(--accent)', fontWeight: 700 }}>{parte}</strong> : parte
      )}
    </div>
  );
};

const HanaroScrap = () => {
  // Estados para os dados do formulário
  const [formData, setFormData] = useState({
    matricula: '',
    nomeOperador: '',
    tipoScrap: '',
    tipoPlaca: '',
    modeloId: '',
    modeloNome: '',
    halb: '',
    qty: '',
    linhaId: '',
    linhaNome: '',
    turno: '',
    plantaId: '',
    plantaNome: '',
    origemId: '',
    origemNome: '',
    equipamentoId: '',
    equipamentoNome: '',
    causaId: '',
    causaNome: '',
    causaRaiz: '',
    acaoCorretiva: '',
    contramedida: '',
    custoUnitario: 0,
    custoTotal: 0,
    cn: '', // CN - Código da Placa (13 caracteres)
  });

  // Estados para validação de campos obrigatórios
  const [requiredFields, setRequiredFields] = useState({
    matricula: false,
    tipoScrap: false,
    tipoPlaca: false,
    modeloId: false,
    linhaId: false,
    turno: false,
    origemId: false,
    equipamentoId: false,
    causaId: false,
    causaRaiz: false,
    acaoCorretiva: false,
    contramedida: false,
    cn: false
  });

  // Estado para verificar CN duplicada
  const [cnDuplicada, setCnDuplicada] = useState(false);
  const [verificandoCn, setVerificandoCn] = useState(false);
  
  // Estado para múltiplas CNs
  const [cnsInseridas, setCnsInseridas] = useState([]); // Array de CNs inseridas
  const [cnInput, setCnInput] = useState(''); // CN sendo digitada atualmente

  // Função para verificar CN duplicada no backend
  const verificarCnDuplicada = async (cn) => {
    if (!cn || cn.length !== 13) return;
    
    setVerificandoCn(true);
    setCnDuplicada(false);
    
    try {
      const response = await fetch(`${API_URL}/api/hanaro-scrap/verificar-cn/${cn}`);
      const result = await response.json();
      
      if (result.success && result.duplicada) {
        setCnDuplicada(true);
        message.error('Esta CN já foi registrada! Este scrap já deveria ter sido descartado.');
      } else {
        setCnDuplicada(false);
      }
    } catch (error) {
      console.error('Erro ao verificar CN:', error);
      setCnDuplicada(false);
    } finally {
      setVerificandoCn(false);
    }
  };

  // Função para adicionar CN à lista
  const adicionarCn = async (cn) => {
    const cnUpper = cn.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Validar CN
    if (cnUpper.length !== 13) {
      message.warning('A CN deve ter 13 caracteres');
      return;
    }
    
    // Verificar se já está na lista
    if (cnsInseridas.includes(cnUpper)) {
      message.warning('Esta CN já foi inserida');
      return;
    }
    
    // Verificar duplicada no backend
    setVerificandoCn(true);
    try {
      const response = await fetch(`${API_URL}/api/hanaro-scrap/verificar-cn/${cnUpper}`);
      const result = await response.json();
      
      if (result.success && result.duplicada) {
        setCnDuplicada(true);
        message.error('Esta CN já foi registrada anteriormente!');
        return;
      }
      
      // Adicionar CN à lista
      setCnsInseridas(prev => [...prev, cnUpper]);
      setCnInput('');
      setCnDuplicada(false);
      
      // Atualizar qty automaticamente (1 CN = 1, 2 CNs = 2, etc.)
      setFormData(prev => ({ ...prev, qty: cnsInseridas.length + 1, cn: cnUpper }));
      
      message.success(`CN ${cnUpper} adicionada! Total: ${cnsInseridas.length + 1} CN(s)`);
    } catch (error) {
      console.error('Erro ao verificar CN:', error);
      message.error('Erro ao verificar CN');
    } finally {
      setVerificandoCn(false);
    }
  };

  // Função para remover CN da lista
  const removerCn = (cnParaRemover) => {
    setCnsInseridas(prev => prev.filter(cn => cn !== cnParaRemover));
    // Atualizar qty automaticamente
    setFormData(prev => ({ ...prev, qty: cnsInseridas.length - 1 }));
    message.info('CN removida');
  };

  // Estados para dados de seleção (simulando dados do backend)
  const [modelos, setModelos] = useState([]);
  const [modelosCusto, setModelosCusto] = useState([]);
  
  // Estado para controlar o dropdown do modelo
  const [modeloDropdownOpen, setModeloDropdownOpen] = useState(false);
  const [modeloSearch, setModeloSearch] = useState('');
  const [modeloSelectedIndex, setModeloSelectedIndex] = useState(-1); // Índice selecionado para navegação com setas
  const modeloDropdownRef = useRef(null);

  // Função para filtrar modelos com prioridade: match exato > começa com > contém
  const filterModelos = (search) => {
    if (!search) return modelos;
    const searchLower = search.toLowerCase();
    
    // Match exato (prioridade 1)
    const exactMatch = modelos.filter(m => 
      m.nome.toLowerCase() === searchLower || 
      (m.halb && m.halb.toLowerCase() === searchLower)
    );
    
    // Começa com (prioridade 2)
    const startsWith = modelos.filter(m => 
      (m.nome.toLowerCase().startsWith(searchLower) || 
       (m.halb && m.halb.toLowerCase().startsWith(searchLower))) &&
      m.nome.toLowerCase() !== searchLower
    );
    
    // Contém (prioridade 3)
    const contains = modelos.filter(m => 
      (m.nome.toLowerCase().includes(searchLower) || 
       (m.halb && m.halb.toLowerCase().includes(searchLower))) &&
      !m.nome.toLowerCase().startsWith(searchLower) &&
      m.nome.toLowerCase() !== searchLower
    );
    
    return [...exactMatch, ...startsWith, ...contains];
  };

  // Ref para armazenar referências dos itens do dropdown
  const modeloItemRefs = useRef([]);

  // Handler para navegação com teclado no dropdown de modelos
  const handleModeloKeyDown = (e) => {
    const filteredModelos = filterModelos(modeloSearch);
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setModeloDropdownOpen(true);
      setModeloSelectedIndex(prev => {
        const newIndex = prev < filteredModelos.length - 1 ? prev + 1 : 0;
        // Scroll automático para o item selecionado
        setTimeout(() => {
          if (modeloItemRefs.current[newIndex]) {
            modeloItemRefs.current[newIndex].scrollIntoView({
              block: 'nearest',
              behavior: 'smooth'
            });
          }
        }, 50);
        return newIndex;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setModeloSelectedIndex(prev => {
        const newIndex = prev > 0 ? prev - 1 : filteredModelos.length - 1;
        // Scroll automático para o item selecionado
        setTimeout(() => {
          if (modeloItemRefs.current[newIndex]) {
            modeloItemRefs.current[newIndex].scrollIntoView({
              block: 'nearest',
              behavior: 'smooth'
            });
          }
        }, 50);
        return newIndex;
      });
    } else if (e.key === 'Enter' && modeloSelectedIndex >= 0 && modeloSelectedIndex < filteredModelos.length) {
      e.preventDefault();
      const modelo = filteredModelos[modeloSelectedIndex];
      setFormData(prev => ({ 
        ...prev, 
        modeloId: modelo.id,
        modeloNome: modelo.nome,
        halb: modelo.halb || ''
      }));
      setModeloSearch('');
      setModeloDropdownOpen(false);
      setModeloSelectedIndex(-1);
      // Focar no próximo campo
      const nextRef = inputRefs.current.qty;
      if (nextRef) nextRef.focus();
    } else if (e.key === 'Escape') {
      setModeloDropdownOpen(false);
      setModeloSelectedIndex(-1);
    }
  };

  const [linhas] = useState([
    { id: '1', nome: 'SMD-02' },
    { id: '2', nome: 'SMD-03' },
    { id: '3', nome: 'SMD-04' },
    { id: '4', nome: 'SMD-05' },
    { id: '5', nome: 'SMD-06' },
    { id: '6', nome: 'SMD-07' },
    { id: '7', nome: 'SMD-08' },
    // SMD-09 excluída conforme solicitado
    { id: '8', nome: 'SMD-10' },
    { id: '9', nome: 'SMD-11' },
    { id: '10', nome: 'SMD-12' },
    { id: '11', nome: 'SMD-13' },
    { id: '12', nome: 'SMD-14' },
    { id: '13', nome: 'SMD-15' },
    { id: '14', nome: 'SMD-16' },
    { id: '15', nome: 'SMD-17' },
    { id: '16', nome: 'SMD-18' },
    { id: '17', nome: 'SMD-19' },
    { id: '18', nome: 'SMD-20' },
    { id: '19', nome: 'SMD-37' },
    { id: '20', nome: 'SMD-38' },
  ]);

  const [plantas] = useState([
    { id: '1', nome: 'Planta São Paulo' },
    { id: '2', nome: 'Planta Rio de Janeiro' },
    { id: '3', nome: 'Planta Minas Gerais' },
  ]);

  // Estados para dados de seleção do banco de dados
  const [origens, setOrigens] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [causas, setCausas] = useState([]);
  
  // Estados para observação quando "Outros" é selecionado
  const [observacaoEquipamento, setObservacaoEquipamento] = useState('');
  const [observacaoCausa, setObservacaoCausa] = useState('');

  // Dados de custo simulados
  const [custoDB] = useState([
    { modelo_id: '1', tipo_placa: 'Bot', custo_unitario: 150.50 },
    { modelo_id: '1', tipo_placa: 'Top', custo_unitario: 200.75 },
    { modelo_id: '1', tipo_placa: 'Limpa', custo_unitario: 80.25 },
    { modelo_id: '2', tipo_placa: 'Bot', custo_unitario: 180.30 },
    { modelo_id: '2', tipo_placa: 'Top', custo_unitario: 220.60 },
    { modelo_id: '2', tipo_placa: 'Limpa', custo_unitario: 95.40 },
    { modelo_id: '3', tipo_placa: 'Bot', custo_unitario: 165.80 },
    { modelo_id: '3', tipo_placa: 'Top', custo_unitario: 210.90 },
    { modelo_id: '3', tipo_placa: 'Limpa', custo_unitario: 88.70 },
  ]);

  // Estados para controle da interface
  const [employee, setEmployee] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('registro'); // 'registro', 'historico', 'aprovacao'
  const [authModal, setAuthModal] = useState(false);
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  // Refs para os campos de input
  const inputRefs = useRef([]);
  const fieldOrder = [
    'matricula',
    'cn',
    'modeloId',
    'qty',
    'linhaId',
    'origemId',
    'equipamentoId',
    'causaId',
    'causaRaiz',
    'acaoCorretiva',
    'contramedida'
  ];

  // Estados para histórico e aprovação
  const [historicoData, setHistoricoData] = useState([]);
  const [aprovacaoData, setAprovacaoData] = useState([]);
  const [rejeitadosData, setRejeitadosData] = useState([]);
  const [historicoLoading, setHistoricoLoading] = useState(false);
  const [aprovacaoLoading, setAprovacaoLoading] = useState(false);
  const [rejeitadosLoading, setRejeitadosLoading] = useState(false);
  const [registroCounter, setRegistroCounter] = useState(1);
  const [historicoFilters, setHistoricoFilters] = useState({
    dataInicio: '',
    dataFim: '',
    linha: '',
    turno: '',
    status: ''
  });
  const [aprovacaoFilters, setAprovacaoFilters] = useState({
    dataInicio: '',
    dataFim: '',
    linha: ''
  });

  // Estados para Chat IA (Análise IA)
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: 'Olá! Sou o assistente de análise de scraps do Hanaro. Posso ajudar você a entender melhor os dados de scraps registrados. Faça uma pergunta sobre o histórico de scraps!',
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatController, setChatController] = useState(null); // Para controle de abort
  const chatEndRef = useRef(null);

  // Estado para dados completos da IA
  const [iaDadosCompletos, setIaDadosCompletos] = useState(null);
  const [iaDadosLoading, setIaDadosLoading] = useState(false);

  // Função para buscar dados completos do banco para IA
  const buscarDadosParaIA = async () => {
    if (iaDadosCompletos) return iaDadosCompletos; // Retorna cache se já existe
    
    setIaDadosLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/hanaro_scrap_dados_ia?limite=500`);
      const result = await response.json();
      
      if (result.success) {
        setIaDadosCompletos(result);
        console.log('[IA Dados] Dados completos carregados:', {
          totalRegistros: result.estatisticas?.totalRegistros,
          totalValor: result.estatisticas?.totalValor,
          modelosUnicos: result.estatisticas?.modelosUnicos?.length,
          causasUnicas: result.estatisticas?.causasUnicas?.length
        });
        return result;
      }
      return null;
    } catch (error) {
      console.error('[IA Dados] Erro ao buscar dados:', error);
      return null;
    } finally {
      setIaDadosLoading(false);
    }
  };

  // Função para chamar API do Gauss
  const callGaussAPI = async (message) => {
    // Buscar dados completos do banco
    const dadosCompletos = await buscarDadosParaIA();
    
    // Preparar contexto ENRIQUECIDO com dados do banco
    const historicoResumo = dadosCompletos?.estatisticas || {
      totalRegistros: historicoData.length,
      totalValor: historicoData.reduce((sum, item) => sum + (item.valor || 0), 0),
      totalQtd: historicoData.reduce((sum, item) => sum + (item.qtd || 0), 0),
      modelosUnicos: [...new Set(historicoData.map(item => item.modelo))],
      causasUnicas: [...new Set(historicoData.map(item => item.causa))],
      equipamentosUnicos: [...new Set(historicoData.map(item => item.equipamento))],
      linhasUnicas: [...new Set(historicoData.map(item => item.linha))],
      turnosUnicos: [...new Set(historicoData.map(item => item.turno))],
      origensUnicas: [...new Set(historicoData.map(item => item.origem))],
      // Agrupamentos para análise
      porModelo: {},
      porCausa: {},
      porEquipamento: {},
      porLinha: {},
      porTurno: {},
      porOrigem: {}
    };

    console.log('[Gauss API] Dados completos do banco:', historicoResumo);

    const systemPrompt = `Você é um assistente especializado em análise de dados de scraps industriais da Samsung. 
Você tem acesso aos seguintes dados do sistema Hanaro Scrap:

📊 RESUMO DOS DADOS:
- Total de registros: ${historicoResumo.totalRegistros || 0}
- Valor total em scraps: R$ ${(historicoResumo.totalValor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Quantidade total de peças: ${historicoResumo.totalQtd || 0}
- Modelos únicos: ${historicoResumo.modelosUnicos?.length > 0 ? historicoResumo.modelosUnicos.join(', ') : 'Nenhum registro'}
- Causas únicas: ${historicoResumo.causasUnicas?.length > 0 ? historicoResumo.causasUnicas.join(', ') : 'Nenhuma registrada'}
- Equipamentos únicos: ${historicoResumo.equipamentosUnicos?.length > 0 ? historicoResumo.equipamentosUnicos.join(', ') : 'Nenhum registro'}
- Linhas únicas: ${historicoResumo.linhasUnicas?.length > 0 ? historicoResumo.linhasUnicas.join(', ') : 'Nenhuma registrada'}
- Turnos únicos: ${historicoResumo.turnosUnicos?.length > 0 ? historicoResumo.turnosUnicos.join(', ') : 'Nenhum registrado'}

INSTRUÇÕES:
- Responda SEMPRE em português brasileiro (pt-BR)
- Seja claro e objetivo
- Use os dados acima para fundamentar suas respostas
- Se não houver dados suficientes, informe ao usuário
- Você pode sugerir análises e insights baseados nos dados
- Formate números como moeda brasileira (R$ 1.234,56)

DADOS DISPONÍVEIS PARA ANÁLISE:
${JSON.stringify(historicoResumo, null, 2)}`;

    const payload = {
      input_type: 'chat',
      output_type: 'chat',
      input_value: `${systemPrompt}\n\n=== PERGUNTA DO USUÁRIO ===\n${message}`
    };

    console.log('[Gauss API] Enviando requisição:', payload);

    try {
      const controller = new AbortController();
      setChatController(controller);

      const response = await fetch('https://agent.sec.samsung.net/api/v1/run/ChatGauss-Hanaro?stream=false', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'sk-L6d36cORFh5iMzCZjF5L42FkLixzEf7hZvhr62O8K3g'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      console.log('[Gauss API] Status da resposta:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Gauss API] Erro na resposta:', errorText);
        throw new Error(`Erro na API: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('[Gauss API] Resposta completa:', JSON.stringify(result, null, 2));
      
      // Log de TODAS as chaves disponíveis para debug
      console.log('[Gauss API] Chaves disponíveis:', Object.keys(result));
      if (result.results) {
        console.log('[Gauss API] Chaves em results:', Object.keys(result.results));
      }
      if (result.outputs) {
        console.log('[Gauss API] outputs[0]:', result.outputs[0]);
        if (result.outputs[0]?.results) {
          console.log('[Gauss API] Chaves em outputs[0].results:', Object.keys(result.outputs[0].results));
        }
      }

      let resposta = '';
      
      // Estrutura REAL da API Gauss (identificada nos logs):
      // result.outputs[0].outputs[0].results.message.text = resposta
      if (result?.outputs?.[0]?.outputs?.[0]?.results?.message?.text) {
        resposta = result.outputs[0].outputs[0].results.message.text;
        console.log('[Gauss API] Extraído de outputs[0].outputs[0].results.message.text:', resposta.substring(0, 100) + '...');
      }
      // Fallback: result.outputs[0].outputs[0].results.message
      else if (result?.outputs?.[0]?.outputs?.[0]?.results?.message) {
        const msg = result.outputs[0].outputs[0].results.message;
        resposta = msg.text || msg.content || '';
        console.log('[Gauss API] Extraído de outputs[0].outputs[0].results.message:', resposta.substring(0, 100) + '...');
      }
      // Fallback genérico
      else if (result?.outputs?.[0]?.outputs?.[0]) {
        const rawOutput = result.outputs[0].outputs[0];
        console.log('[Gauss API] outputs[0].outputs[0] OBJETO:', JSON.stringify(rawOutput, null, 2).substring(0, 500));
        
        resposta = rawOutput.text 
          || rawOutput.content 
          || (rawOutput.results && (rawOutput.results.text || rawOutput.results.content))
          || (rawOutput.message && (rawOutput.message.text || rawOutput.message.content))
          || '';
        
        if (resposta) {
          console.log('[Gauss API] Extraído de fallback:', resposta.substring(0, 100) + '...');
        }
      }
      // Alternativa: result.outputs[0].outputs[0].text
      else if (result?.outputs?.[0]?.outputs?.[0]?.text) {
        resposta = String(result.outputs[0].outputs[0].text);
        console.log('[Gauss API] Extraído de outputs[0].outputs[0].text');
      }
      // Alternativa: result.outputs[0].message.text
      else if (result?.outputs?.[0]?.message?.text) {
        resposta = String(result.outputs[0].message.text);
        console.log('[Gauss API] Extraído de outputs[0].message.text');
      }
      else {
        console.warn('[Gauss API] Não foi possível extrair resposta. Estrutura recebida:', JSON.stringify(result, null, 2).substring(0, 500));
        resposta = 'Desculpe, ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.';
      }
      
      // Garantir que é string
      if (typeof resposta !== 'string') {
        console.warn('[Gauss API] Resposta não é string, convertendo:', resposta);
        resposta = String(resposta);
      }
      
      console.log('[Gauss API] Resposta final:', resposta.substring(0, 200) + '...');
      
      if (!resposta || resposta.trim() === '') {
        console.warn('[Gauss API] Resposta vazia, usando fallback');
        // Retorna mensagem mais informativa
        return `Olá! Sou o assistente de análise de scraps. 
          
📊 DADOS CARREGADOS:
- Total de registros: ${historicoResumo.totalRegistros || 0}
- Valor total: R$ ${(historicoResumo.totalValor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Quantidade: ${historicoResumo.totalQtd || 0} peças
- Modelos: ${(historicoResumo.modelosUnicos || []).length} únicos
- Causas: ${(historicoResumo.causasUnicas || []).length} únicas

⚠️ A IA Gauss não respondeu. Isso pode ser um problema de conexão ou timeout. Tente novamente ou faça uma pergunta mais específica.`;
      }
      
      return resposta;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('[Gauss API] Requisição cancelada pelo usuário');
        return null;
      }
      console.error('[Gauss API] Erro completo:', error);
      throw error;
    }
  };

  // Função para enviar mensagem no chat
  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    
    // Adicionar mensagem do usuário
    setChatMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    setChatLoading(true);

    try {
      const response = await callGaussAPI(userMessage);
      
      if (response) {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: response,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.',
        timestamp: new Date(),
        error: true
      }]);
      message.error('Erro ao conectar com IA');
    } finally {
      setChatLoading(false);
      setChatController(null);
    }
  };

  // Função para parar geração
  const handleStopGeneration = () => {
    if (chatController) {
      chatController.abort();
      setChatController(null);
      setChatLoading(false);
    }
  };

  // Auto-scroll para última mensagem
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Estado para expansão do chat
  const [chatExpanded, setChatExpanded] = useState(false);

  // Estados para modais e seleção
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [recordModal, setRecordModal] = useState(false);
  const [approvalRecord, setApprovalRecord] = useState(null);
  const [approvalAction, setApprovalAction] = useState(''); // 'aprovar' ou 'rejeitar'
  const [gestorMatricula, setGestorMatricula] = useState('');
  const [gestorNome, setGestorNome] = useState('');
  const [gestorLoading, setGestorLoading] = useState(false);
  
  // Refs para campos de senha e matrícula do gestor
  const gestorMatriculaRef = useRef(null);
  const authPasswordRef = useRef(null);

  // Efeito para focar no campo de senha quando o modal de autenticação abrir
  useEffect(() => {
    if (authModal && authPasswordRef.current) {
      const timeoutId = setTimeout(() => {
        authPasswordRef.current.focus();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [authModal]);

  // Efeito para focar no campo de matrícula quando o modal de aprovação abrir
  useEffect(() => {
    if (approvalRecord && approvalAction && gestorMatriculaRef.current) {
      // Pequeno delay para garantir que o modal foi renderizado
      const timeoutId = setTimeout(() => {
        gestorMatriculaRef.current.focus();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [approvalRecord, approvalAction]);

  // Funções para lidar com filtros
  const handleHistoricoFilterChange = (field, value) => {
    setHistoricoFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleAprovacaoFilterChange = (field, value) => {
    setAprovacaoFilters(prev => ({ ...prev, [field]: value }));
  };

  // Função para autenticação
  const handleAuthSubmit = () => {
    // Senha de exemplo - em produção seria verificada no backend
    if (authPassword === '123456') {
      setAuthModal(false);
      setAuthPassword('');
      setAuthError('');
      setAuthenticated(true);
    } else {
      setAuthError('Senha incorreta!');
    }
  };

  // Efeito para verificar autenticação na aba de aprovação
  useEffect(() => {
    if (activeTab === 'aprovacao' && !authModal && !authenticated) {
      setAuthModal(true);
    }
  }, [activeTab, authModal, authenticated]);

  // Efeito para fechar dropdown do modelo quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modeloDropdownRef.current && !modeloDropdownRef.current.contains(event.target)) {
        setModeloDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Constantes
  const TIPOS_SCRAP = ["Classe A", "Feedback", "Scrap", "Wash Board"];
  const TIPOS_PLACA = ["Bot", "Top", "Limpa"];
  const TURNOS = ["1T", "2T", "3T"];

  // Efeito para calcular custo total quando qty ou custoUnitario mudarem
  useEffect(() => {
    const custoUnitario = formData.custoUnitario || 0;
    const qty = formData.qty && formData.qty > 0 ? formData.qty : 0;
    const custoTotal = custoUnitario * qty;
    setFormData(prev => ({ ...prev, custoTotal }));
  }, [formData.qty, formData.custoUnitario]);

  // Estados para loading e erro de custo
  const [loadingCusto, setLoadingCusto] = useState(false);
  const [errorCusto, setErrorCusto] = useState(null);

  // Efeito para atualizar custo unitário quando modelo e tipo de placa mudarem
  useEffect(() => {
    const fetchCustoUnitario = async () => {
      if (formData.modeloId && formData.tipoPlaca) {
        try {
          setLoadingCusto(true);
          setErrorCusto(null);
          
          const response = await fetch(
            `${API_URL}/api/custo-placa?modelo=${encodeURIComponent(formData.modeloId)}&tipoPlaca=${encodeURIComponent(formData.tipoPlaca)}`
          );
          
          if (response.ok) {
            const data = await response.json();
            // Converter para número mantendo as casas decimais
            const custoUnitario = parseFloat(data.custo_unitario) || 0;
            setFormData(prev => ({ ...prev, custoUnitario }));
          } else {
            console.error('Erro na resposta da API:', response.status);
            throw new Error(`HTTP ${response.status}`);
          }
        } catch (error) {
          console.error('Erro ao buscar custo unitário:', error);
          setErrorCusto('Erro ao carregar custo. Usando valor padrão.');
          setFormData(prev => ({ ...prev, custoUnitario: 0 }));
        } finally {
          setLoadingCusto(false);
        }
      } else {
        setFormData(prev => ({ ...prev, custoUnitario: 0 }));
        setErrorCusto(null);
      }
    };

    // Debounce para evitar múltiplas requisições rápidas
    const timeoutId = setTimeout(fetchCustoUnitario, 300);
    
    return () => clearTimeout(timeoutId);
  }, [formData.modeloId, formData.tipoPlaca]);

  // Efeito para atualizar custo total quando custo unitário ou quantidade mudarem
  useEffect(() => {
    const custoUnitario = formData.custoUnitario || 0;
    const qty = formData.qty && formData.qty > 0 ? formData.qty : 0;
    const custoTotal = custoUnitario * qty;
    setFormData(prev => ({ ...prev, custoTotal }));
  }, [formData.qty, formData.custoUnitario]);

  // Função para lidar com mudanças no formulário
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro visual do campo quando usuário começar a preencher
    if (window.clearFieldError) {
      window.clearFieldError(field);
    }
    
    // Atualizar nome do operador quando matrícula mudar
    if (field === 'matricula' && value.length >= 2) {
      // Buscar funcionário no banco de dados
      fetch(`${API_URL}/verifyMatricula/${value}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.exists) {
            setEmployee({ nome: data.nome });
          } else {
            setEmployee(null);
          }
        })
        .catch(error => {
          console.error('Erro ao buscar funcionário:', error);
          setEmployee(null);
        });
    }
    
    // Atualizar HALB, nome do modelo e planta quando modelo mudar
    if (field === 'modeloId') {
      // Buscar modelo pelo ID ou pelo nome (para suportar datalist)
      const modelo = modelos.find(m => m.id === value || m.nome === value);
      if (modelo) {
        setFormData(prev => ({ 
          ...prev, 
          modeloId: modelo.id,
          modeloNome: modelo.nome,
          halb: modelo.halb,
          planta: modelo.planta || '' // Adiciona a planta automática
        }));
      } else {
        // Se não encontrou, atualiza apenas o valor digitado
        setFormData(prev => ({ 
          ...prev, 
          modeloId: value,
          modeloNome: value
        }));
      }
    }
  };

  // Efeito para carregar dados do banco de dados
  useEffect(() => {
    // Carregar modelos da tabela de custo
    const loadModelosCusto = async () => {
      try {
        const response = await fetch(`${API_URL}/api/modelos-custo`);
        const data = await response.json();
        
        // Verificar se há dados
        if (!data.modelos || data.modelos.length === 0) {
          // Usar dados de fallback
          const mockModelos = [
            { id: 'A075M', nome: 'A075M', halb: 'HALB001' },
            { id: 'G970F', nome: 'G970F', halb: 'HALB002' },
            { id: 'X210', nome: 'X210', halb: 'HALB003' },
          ];
          setModelosCusto(mockModelos);
          setModelos(mockModelos);
          return;
        }
        
        // Mapeia os dados para o formato esperado pelo componente
        // Agora o backend retorna { modelo: 'nome', halb: 'codigo' }
        const formattedModelos = data.modelos.map((item) => ({
          id: item.modelo, // Usar o nome do modelo como ID
          nome: item.modelo,
          halb: item.halb || '' // HALB agora vem do backend
        }));
        setModelosCusto(formattedModelos);
        // Usar os modelos de custo como modelos principais
        setModelos(formattedModelos);
      } catch (error) {
        console.error('Erro ao carregar modelos de custo:', error);
        // Fallback para dados simulados em caso de erro
        const mockModelos = [
          { id: 'A075M', nome: 'A075M', halb: 'HALB001' },
          { id: 'G970F', nome: 'G970F', halb: 'HALB002' },
          { id: 'X210', nome: 'X210', halb: 'HALB003' },
        ];
        setModelosCusto(mockModelos);
        setModelos(mockModelos);
      }
    };

    // Carregar origens
    const loadOrigens = async () => {
      try {
        const response = await fetch(`${API_URL}/getOrigens`);
        const data = await response.json();
        setOrigens(data);
      } catch (error) {
        console.error('Erro ao carregar origens:', error);
      }
    };

    // Carregar equipamentos
    const loadEquipamentos = async () => {
      try {
        const response = await fetch(`${API_URL}/getEquipamentos`);
        const data = await response.json();
        setEquipamentos(data);
      } catch (error) {
        console.error('Erro ao carregar equipamentos:', error);
      }
    };

    // Carregar causas
    const loadCausas = async () => {
      try {
        const response = await fetch(`${API_URL}/getCausas`);
        const data = await response.json();
        setCausas(data);
      } catch (error) {
        console.error('Erro ao carregar causas:', error);
      }
    };

    loadModelosCusto();
    loadOrigens();
    loadEquipamentos();
    loadCausas();
    loadPendentes();
    loadHistorico();
    loadRejeitados();
  }, []);

  // Função para carregar registros pendentes de aprovação (SEM LIMITE)
  const loadPendentes = async () => {
    try {
      setAprovacaoLoading(true);
      // Forçar limite alto para retornar TODOS os pendentes (backend pode ter limite padrão)
      const response = await fetch(`${API_URL}/api/hanaro-scrap?status=Pendente&limit=9999`);
      const result = await response.json();
      
      if (result.success && result.data) {
        // Mapear dados do backend para o formato do frontend
        const dadosMapeados = result.data.map(item => ({
          id: String(item.id).padStart(3, '0'),
          data: new Date(item.data_hora).toLocaleDateString('pt-BR'),
          dataHora: item.data_hora,
          turno: item.turno,
          linha: item.linha_nome,
          modelo: item.modelo_nome,
          placa: item.tipo_placa,
          halb: item.halb || '-',
          qtd: item.qty,
          valor: item.custo_total,
          origem: item.origem_nome || '',
          equipamento: item.equipamento_nome || '',
          causa: item.causa_nome || '',
          causaRaiz: item.causa_raiz || '',
          acaoCorretiva: item.acao_corretiva || '',
          contramedida: item.contramedida || '',
          matricula: item.matricula,
          nomeOperador: item.nome_operador || '',
          custoUnitario: item.custo_unitario,
          status: item.status,
          cn: item.cn || '-'
        }));
        setAprovacaoData(dadosMapeados);
      }
    } catch (error) {
      console.error('Erro ao carregar pendentes:', error);
    } finally {
      setAprovacaoLoading(false);
    }
  };

  // Função para carregar histórico de registros aprovados
  const loadHistorico = async () => {
    try {
      setHistoricoLoading(true);
      const response = await fetch(`${API_URL}/api/hanaro-scrap?status=Aprovado&limit=100`);
      const result = await response.json();
      
      if (result.success && result.data) {
        // Mapear dados do backend para o formato do frontend
        const dadosMapeados = result.data.map(item => ({
          id: String(item.id).padStart(3, '0'),
          data: new Date(item.data_hora).toLocaleDateString('pt-BR'),
          dataHora: item.data_hora,
          turno: item.turno,
          linha: item.linha_nome,
          modelo: item.modelo_nome,
          placa: item.tipo_placa,
          halb: item.halb || '-',
          qtd: item.qty,
          valor: item.custo_total,
          origem: item.origem_nome || '',
          equipamento: item.equipamento_nome || '',
          causa: item.causa_nome || '',
          causaRaiz: item.causa_raiz || '',
          acaoCorretiva: item.acao_corretiva || '',
          contramedida: item.contramedida || '',
          matricula: item.matricula,
          nomeOperador: item.nome_operador || '',
          custoUnitario: item.custo_unitario,
          status: item.status,
          dataAprovacao: item.data_aprovacao ? new Date(item.data_aprovacao).toLocaleDateString('pt-BR') : '',
          aprovadoPor: item.nome_aprovador || '',
          cn: item.cn || '-'
        }));
        setHistoricoData(dadosMapeados);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setHistoricoLoading(false);
    }
  };

  // Função para carregar registros rejeitados (últimos 2 dias)
  const loadRejeitados = async () => {
    try {
      setRejeitadosLoading(true);
      // Calcular data de 2 dias atrás
      const doisDiasAtras = new Date();
      doisDiasAtras.setDate(doisDiasAtras.getDate() - 2);
      const dataInicio = doisDiasAtras.toISOString().split('T')[0];
      
      const response = await fetch(`${API_URL}/api/hanaro-scrap?status=Rejeitado&dataInicio=${dataInicio}&limit=100`);
      const result = await response.json();
      
      if (result.success && result.data) {
        // Mapear dados do backend para o formato do frontend
        const dadosMapeados = result.data.map(item => ({
          id: String(item.id).padStart(3, '0'),
          data: new Date(item.data_hora).toLocaleDateString('pt-BR'),
          dataHora: item.data_hora,
          turno: item.turno,
          linha: item.linha_nome,
          modelo: item.modelo_nome,
          placa: item.tipo_placa,
          halb: item.halb || '-',
          qtd: item.qty,
          valor: item.custo_total,
          origem: item.origem_nome || '',
          equipamento: item.equipamento_nome || '',
          causa: item.causa_nome || '',
          causaRaiz: item.causa_raiz || '',
          acaoCorretiva: item.acao_corretiva || '',
          contramedida: item.contramedida || '',
          matricula: item.matricula,
          nomeOperador: item.nome_operador || '',
          custoUnitario: item.custo_unitario,
          status: item.status,
          dataRejeicao: item.data_aprovacao ? new Date(item.data_aprovacao).toLocaleDateString('pt-BR') : '',
          rejeitadoPor: item.nome_aprovador || '',
          cn: item.cn || '-'
        }));
        setRejeitadosData(dadosMapeados);
      }
    } catch (error) {
      console.error('Erro ao carregar rejeitados:', error);
    } finally {
      setRejeitadosLoading(false);
    }
  };

  // Função para obter o label do campo
  const getFieldLabel = (fieldId) => {
    const labels = {
      matricula: 'Matrícula',
      tipoScrap: 'Tipo de Scrap',
      tipoPlaca: 'Tipo de Placa',
      modeloId: 'Modelo',
      linhaId: 'Linha',
      turno: 'Turno',
      origemId: 'Origem',
      equipamentoId: 'Equipamento',
      causaId: 'Causa',
      causaRaiz: 'Causa Raiz',
      acaoCorretiva: 'Ação Corretiva',
      contramedida: 'Contramedida'
    };
    return labels[fieldId] || fieldId;
  };

  // Função para fazer scroll e foco no campo com erro
  const scrollToField = (fieldId) => {
    // Mapear fieldId para o ID do elemento DOM
    const elementIdMap = {
      matricula: 'field-matricula',
      tipoScrap: 'field-tipoScrap',
      tipoPlaca: 'field-tipoPlaca',
      modeloId: 'field-modeloId',
      linhaId: 'field-linhaId',
      turno: 'field-turno',
      origemId: 'field-origemId',
      equipamentoId: 'field-equipamentoId',
      causaId: 'field-causaId',
      causaRaiz: 'field-causaRaiz',
      acaoCorretiva: 'field-acaoCorretiva',
      contramedida: 'field-contramedida'
    };
    
    const elementId = elementIdMap[fieldId];
    const element = document.getElementById(elementId);
    
    if (element) {
      // Scroll suave até o elemento com offset para não ficar colado no topo
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Adicionar classe de destaque temporário
      element.classList.add('field-error-highlight');
      
      // Remover a classe após 2 segundos
      setTimeout(() => {
        element.classList.remove('field-error-highlight');
      }, 2000);
      
      // Focar no input dentro do container (se existir)
      const input = element.querySelector('input, select, textarea, button');
      if (input) {
        setTimeout(() => input.focus(), 300);
      }
    }
  };

  // Estado para campos com erro
  const [fieldsWithError, setFieldsWithError] = useState({});
  
  // Função para salvar registro
  const handleSave = async () => {
    // Função auxiliar para destacar campo com borda vermelha
    const highlightField = (fieldId) => {
      setFieldsWithError(prev => ({ ...prev, [fieldId]: true }));
    };
    
    // Função para limpar erro de um campo específico
    const clearFieldError = (fieldId) => {
      setFieldsWithError(prev => ({ ...prev, [fieldId]: false }));
    };
    
    // Expor globalmente para o RegistroForm poder limpar erros
    window.clearFieldError = clearFieldError;

    // Validar quantidade primeiro
    if (!formData.qty || formData.qty <= 0 || isNaN(formData.qty)) {
      message.error('Digite uma quantidade válida (maior que 0)');
      const qtyInput = document.querySelector('input[type="number"]');
      if (qtyInput) {
        qtyInput.focus();
        qtyInput.style.border = '2px solid #ef4444';
        setTimeout(() => {
          qtyInput.style.border = '';
        }, 2000);
      }
      return;
    }

    // Validar campos obrigatórios
    const required = {
      matricula: !!formData.matricula && !!employee,
      tipoScrap: !!formData.tipoScrap,
      tipoPlaca: !!formData.tipoPlaca,
      modeloId: !!formData.modeloId,
      linhaId: !!formData.linhaId,
      turno: !!formData.turno,
      origemId: !!formData.origemId,
      equipamentoId: !!formData.equipamentoId,
      causaId: !!formData.causaId,
      causaRaiz: !!formData.causaRaiz,
      acaoCorretiva: !!formData.acaoCorretiva,
      contramedida: !!formData.contramedida,
      cn: !!(formData.cn && formData.cn.length === 13)
    };
    
    // Validar observação quando "Outros" é selecionado (pelo nome do item)
    const equipamentoNome = equipamentos.find(e => e.id == formData.equipamentoId)?.nome?.toLowerCase() || '';
    const causaNome = causas.find(c => c.id == formData.causaId)?.nome?.toLowerCase() || '';
    
    if (equipamentoNome.includes('outros') && !observacaoEquipamento) {
      message.error('Preencha a observação para o equipamento "Outros"');
      highlightField('equipamentoId', true);
      scrollToField('equipamentoId');
      return;
    }
    
    if (causaNome.includes('outros') && !observacaoCausa) {
      message.error('Preencha a observação para a causa "Outros"');
      highlightField('causaId', true);
      scrollToField('causaId');
      return;
    }
    
    setRequiredFields(required);
    
    // Encontrar TODOS os campos com erro e destacar visualmente
    const emptyFields = Object.entries(required).filter(([key, value]) => !value);
    
    if (emptyFields.length > 0) {
      // Destacar TODOS os campos vazios com borda vermelha
      emptyFields.forEach(([fieldId]) => {
        const isSelect = ['linhaId', 'turno', 'origemId', 'equipamentoId', 'causaId'].includes(fieldId);
        highlightField(fieldId, isSelect);
      });
      
      // Pegar o primeiro campo com erro para focar e mostrar mensagem
      const [firstFieldId] = emptyFields[0];
      if (firstFieldId === 'matricula') {
        message.error('Matrícula inválida ou não encontrada. Digite uma matrícula válida.');
      } else if (firstFieldId === 'cn') {
        message.error('Preencha a CN (13 caracteres obrigatórios)');
      } else {
        message.error(`Preencha os campos obrigatórios: ${emptyFields.map(([key]) => getFieldLabel(key)).join(', ')}`);
      }
      scrollToField(firstFieldId);
      return;
    }
    
    setSaving(true);
    
    try {
      // Preparar dados para enviar ao backend
      const dadosParaSalvar = {
        matricula: formData.matricula,
        nome_operador: employee?.nome || '',
        tipo_scrap: formData.tipoScrap,
        tipo_placa: formData.tipoPlaca,
        modelo_id: formData.modeloId,
        modelo_nome: formData.modeloNome,
        halb: formData.halb || '',
        qty: formData.qty,
        custo_unitario: formData.custoUnitario,
        custo_total: formData.custoTotal,
        linha_id: formData.linhaId,
        linha_nome: linhas.find(l => l.id === formData.linhaId)?.nome || '',
        turno: formData.turno,
        planta_id: formData.plantaId || '',
        planta_nome: formData.plantaNome || '',
        origem_id: formData.origemId,
        origem_nome: origens.find(o => o.id == formData.origemId)?.nome || '',
        equipamento_id: formData.equipamentoId,
        // Concatenar "Outros - [observação]" quando "Outros" for selecionado (pelo nome do item)
        equipamento_nome: equipamentoNome.includes('outros')
          ? `Outros - ${observacaoEquipamento}` 
          : equipamentos.find(e => e.id == formData.equipamentoId)?.nome || '',
        causa_id: formData.causaId,
        // Concatenar "Outros - [observação]" quando "Outros" for selecionado (pelo nome do item)
        causa_nome: causaNome.includes('outros')
          ? `Outros - ${observacaoCausa}` 
          : causas.find(c => c.id == formData.causaId)?.nome || '',
        causa_raiz: formData.causaRaiz || '',
        acao_corretiva: formData.acaoCorretiva || '',
        contramedida: formData.contramedida || '',
        // Enviar múltiplas CNs separadas por ';' se houver mais de uma, senão enviar a CN única
        cn: cnsInseridas.length > 0 ? cnsInseridas.join(';') : (formData.cn || '')
      };
      
      // Enviar para a API
      const response = await fetch(`${API_URL}/api/hanaro-scrap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosParaSalvar)
      });
      
      const result = await response.json();
      
      if (result.success) {
        message.success("Registro salvo e enviado para aprovação!");
        
        // Recarregar dados pendentes
        loadPendentes();
        
        // Reset form
        setFormData({
          matricula: '', nomeOperador: '', tipoScrap: '', tipoPlaca: '', modeloId: '',
          modeloNome: '', halb: '', qty: '', linhaId: '', linhaNome: '',
          turno: '', plantaId: '', plantaNome: '', origemId: '', origemNome: '',
          equipamentoId: '', equipamentoNome: '', causaId: '', causaNome: '',
          causaRaiz: '', acaoCorretiva: '', contramedida: '', custoUnitario: 0, custoTotal: 0,
        });
        setEmployee(null);
        setObservacaoEquipamento('');
        setObservacaoCausa('');
        setRequiredFields({
          matricula: false,
          tipoScrap: false,
          tipoPlaca: false,
          modeloId: false,
          linhaId: false,
          turno: false,
          origemId: false,
          equipamentoId: false,
          causaId: false
        });
      } else {
        message.error(result.message || "Erro ao salvar registro");
      }
    } catch (error) {
      console.error('Erro ao salvar registro:', error);
      message.error("Erro ao conectar com o servidor");
    } finally {
      setSaving(false);
    }
  };
  
  // Função para aprovar registro
  const handleApproveRecord = async (record) => {
    try {
      // Extrair ID numérico do registro (remover zeros à esquerda)
      const recordId = parseInt(record.id, 10);
      
      // Chamar API para atualizar status
      const response = await fetch(`${API_URL}/api/hanaro-scrap/${recordId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'Aprovado',
          aprovado_por: gestorMatricula,
          nome_aprovador: gestorNome,
          observacao: 'Aprovado via sistema'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        message.success(`Registro #${record.id} aprovado com sucesso!`);
        
        // Recarregar dados
        loadPendentes();
        loadHistorico();
        
        setApprovalRecord(null);
        setApprovalAction('');
        setGestorMatricula('');
        setGestorNome('');
      } else {
        message.error(result.message || "Erro ao aprovar registro");
      }
    } catch (error) {
      console.error('Erro ao aprovar registro:', error);
      message.error("Erro ao conectar com o servidor");
    }
  };
  
  // Função para rejeitar registro
  const handleRejectRecord = async (record) => {
    try {
      // Extrair ID numérico do registro (remover zeros à esquerda)
      const recordId = parseInt(record.id, 10);
      
      // Chamar API para atualizar status
      const response = await fetch(`${API_URL}/api/hanaro-scrap/${recordId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'Rejeitado',
          aprovado_por: gestorMatricula,
          nome_aprovador: gestorNome,
          observacao: 'Rejeitado via sistema'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        message.warning(`Registro #${record.id} rejeitado!`);
        
        // Recarregar dados pendentes e rejeitados
        loadPendentes();
        loadRejeitados();
        
        setApprovalRecord(null);
        setApprovalAction('');
        setGestorMatricula('');
        setGestorNome('');
      } else {
        message.error(result.message || "Erro ao rejeitar registro");
      }
    } catch (error) {
      console.error('Erro ao rejeitar registro:', error);
      message.error("Erro ao conectar com o servidor");
    }
  };

  // Função para formatar valores monetários
  const formatCurrency = (value) => {
    // Garantir que o valor seja um número e ter pelo menos 2 casas decimais
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return 'R$ 0,00';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue);
  };

  // Função para formatar data
  const formatDate = (date) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  // Função para exportar histórico para Excel
  const exportarHistoricoExcel = () => {
    if (historicoData.length === 0) {
      message.warning('Não há dados para exportar');
      return;
    }

    // Preparar dados completos para exportação (incluindo dados do modal)
    const dadosParaExportar = historicoData.map(item => ({
      'ID': item.id,
      'Data': item.data,
      'Data/Hora': new Date(item.dataHora).toLocaleString('pt-BR'),
      'Turno': item.turno,
      'Linha': item.linha,
      'Modelo': item.modelo,
      'Placa': item.placa,
      'CN': item.cn,
      'HALB': item.halb,
      'Quantidade': item.qtd,
      'Valor Total': item.valor,
      'Custo Unitário': item.custoUnitario,
      'Origem': item.origem,
      'Equipamento': item.equipamento,
      'Causa': item.causa,
      'Causa Raiz': item.causaRaiz || '',
      'Ação Corretiva': item.acaoCorretiva || '',
      'Contramedida': item.contramedida || '',
      'Matrícula': item.matricula || '',
      'Operador': item.nomeOperador || '',
      'Status': item.status,
      'Aprovado Por': item.aprovadoPor || '',
      'Data Aprovação': item.dataAprovacao || ''
    }));

    // Criar worksheet
    const worksheet = XLSX.utils.json_to_sheet(dadosParaExportar);
    
    // Ajustar largura das colunas
    const wscols = [
      { wch: 8 },  // ID
      { wch: 12 }, // Data
      { wch: 20 }, // Data/Hora
      { wch: 8 },  // Turno
      { wch: 12 }, // Linha
      { wch: 20 }, // Modelo
      { wch: 8 },  // Placa
      { wch: 15 }, // CN
      { wch: 12 }, // HALB
      { wch: 10 }, // Quantidade
      { wch: 15 }, // Valor Total
      { wch: 15 }, // Custo Unitário
      { wch: 20 }, // Origem
      { wch: 25 }, // Equipamento
      { wch: 25 }, // Causa
      { wch: 40 }, // Causa Raiz
      { wch: 40 }, // Ação Corretiva
      { wch: 40 }, // Contramedida
      { wch: 12 }, // Matrícula
      { wch: 30 }, // Operador
      { wch: 12 }, // Status
      { wch: 25 }, // Aprovado Por
      { wch: 15 }  // Data Aprovação
    ];
    worksheet['!cols'] = wscols;

    // Criar workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Histórico Hanaro');

    // Gerar nome do arquivo com data atual
    const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const horaAtual = new Date().toLocaleTimeString('pt-BR').replace(/:/g, '-');
    const nomeArquivo = `Hanaro_Historico_${dataAtual}_${horaAtual}.xlsx`;

    // Exportar arquivo
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, nomeArquivo);
    
    message.success(`Arquivo Excel exportado com sucesso! (${historicoData.length} registros)`);
  };

  // Função para pular para o próximo campo ao pressionar Enter
  const handleEnterKeyPress = (e, currentField) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentIndex = fieldOrder.indexOf(currentField);
      if (currentIndex !== -1 && currentIndex < fieldOrder.length - 1) {
        const nextField = fieldOrder[currentIndex + 1];
        const nextRef = inputRefs.current[nextField];
        if (nextRef) {
          nextRef.focus();
        }
      }
    }
  };

  // ── CSS Variables ─────────────────
  const cssVars = {
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
    '--success': '#22c55e',
    '--warning': '#f59e0b',
    '--error': '#ef4444',
    '--info': '#3b82f6',
  };

  return (
    <div style={{ 
      ...cssVars,
      fontFamily: "'DM Sans', sans-serif",
      backgroundColor: 'var(--bg)',
      minHeight: '100vh',
      margin: 0,
      padding: 0,
      color: 'var(--text-primary)'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        .row-anim { animation: fadeIn 0.3s ease; }
        .btn { transition: all 0.15s ease; }
        .btn:hover { transform: translateY(-1px); }
        .btn:active { transform: translateY(0); }
        input, select, textarea { font-family: inherit; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
        .tr-hover:hover { background: var(--row-hover) !important; }
        .field-error-highlight {
          animation: fieldErrorPulse 0.5s ease-in-out 3;
          background: rgba(239, 68, 68, 0.1) !important;
        }
        @keyframes fieldErrorPulse {
          0%, 100% { 
            background: rgba(239, 68, 68, 0.1);
            transform: scale(1);
          }
          50% { 
            background: rgba(239, 68, 68, 0.2);
            transform: scale(1.01);
          }
        }
        /* Erro persistente - borda vermelha que permanece até o usuário preencher */
        .field-error-persistent,
        input.field-error-persistent,
        select.field-error-persistent,
        textarea.field-error-persistent {
          border: 2px solid #ef4444 !important;
          border-color: #ef4444 !important;
          background: rgba(239, 68, 68, 0.05) !important;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
        }
        /* Para botões (turnos) */
        button.field-error-persistent {
          border: 2px solid #ef4444 !important;
          border-color: #ef4444 !important;
          background: rgba(239, 68, 68, 0.15) !important;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2) !important;
        }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{
        background: 'var(--card-bg)', borderBottom: '1px solid var(--border)',
        padding: '0 32px', position: 'initial', top: 110, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #ef4444, #dc2626)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Scrap Management System</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>SCRAP · Gerenciamento de scraps de processo</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        </div>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 1600, margin: '0 auto', marginTop: -10 }}>

        {/* ── TABS ── */}
        <div style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          marginBottom: -10,
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            <button
              onClick={() => setActiveTab('dashboard')}
              style={{
                padding: '16px 24px',
                background: activeTab === 'dashboard' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'dashboard' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: activeTab === 'dashboard' ? 600 : 400,
                transition: 'all 0.2s',
                position: 'relative'
              }}
            >
              <BarChart2 size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Dashboard
              {activeTab === 'dashboard' && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: '#fff',
                  borderRadius: '3px 3px 0 0'
                }} />
              )}
            </button>
            <button
              onClick={() => setActiveTab('registro')}
              style={{
                padding: '16px 24px',
                background: activeTab === 'registro' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'registro' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: activeTab === 'registro' ? 600 : 400,
                transition: 'all 0.2s',
                position: 'relative'
              }}
            >
              <FileText size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Registro
              {activeTab === 'registro' && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: '#fff',
                  borderRadius: '3px 3px 0 0'
                }} />
              )}
            </button>
            <button
              onClick={() => setActiveTab('historico')}
              style={{
                padding: '16px 24px',
                background: activeTab === 'historico' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'historico' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: activeTab === 'historico' ? 600 : 400,
                transition: 'all 0.2s',
                position: 'relative'
              }}
            >
              <History size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Histórico
              {activeTab === 'historico' && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: '#fff',
                  borderRadius: '3px 3px 0 0'
                }} />
              )}
            </button>
            <button
              onClick={() => setActiveTab('aprovacao')}
              style={{
                padding: '16px 24px',
                background: activeTab === 'aprovacao' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'aprovacao' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: activeTab === 'aprovacao' ? 600 : 400,
                transition: 'all 0.2s',
                position: 'relative'
              }}
            >
              <Check size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Aprovação
              {aprovacaoData.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  background: activeTab === 'aprovacao' ? '#fff' : 'var(--error)',
                  color: activeTab === 'aprovacao' ? 'var(--accent)' : '#fff',
                  fontSize: 11,
                  fontWeight: 700,
                  minWidth: 20,
                  height: 20,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 6px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  {aprovacaoData.length}
                </span>
              )}
              {activeTab === 'aprovacao' && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: '#fff',
                  borderRadius: '3px 3px 0 0'
                }} />
              )}
            </button>
            <button
              onClick={() => setActiveTab('rejeitados')}
              style={{
                padding: '16px 24px',
                background: activeTab === 'rejeitados' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'rejeitados' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: activeTab === 'rejeitados' ? 600 : 400,
                transition: 'all 0.2s',
                position: 'relative'
              }}
            >
              <XCircle size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Rejeitados
              {rejeitadosData.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  background: activeTab === 'rejeitados' ? '#fff' : 'var(--error)',
                  color: activeTab === 'rejeitados' ? 'var(--accent)' : '#fff',
                  fontSize: 11,
                  fontWeight: 700,
                  minWidth: 20,
                  height: 20,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 6px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  {rejeitadosData.length}
                </span>
              )}
              {activeTab === 'rejeitados' && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: '#fff',
                  borderRadius: '3px 3px 0 0'
                }} />
              )}
            </button>
            <button
              onClick={() => setActiveTab('analise_ia')}
              style={{
                padding: '16px 24px',
                background: activeTab === 'analise_ia' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'analise_ia' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: activeTab === 'analise_ia' ? 600 : 400,
                transition: 'all 0.2s',
                position: 'relative'
              }}
            >
              <Sparkles size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Análise IA
              {activeTab === 'analise_ia' && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: '#fff',
                  borderRadius: '3px 3px 0 0'
                }} />
              )}
            </button>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        
        {/* ── DASHBOARD ── */}
        {activeTab === 'dashboard' && (
          <DashboardHanaro />
        )}

        {/* ── TÍTULO FIXO ACIMA DAS ABAS ── */}
        {activeTab === 'registro' && (
          <div >
            <h2 style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 4,
              marginTop: 25,
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <FileText size={22} color="var(--accent)" />
              Registro de Scrap
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Preencha os dados do material descartado</p>
          </div>
        )}
        
        {activeTab === 'registro' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            height: 'calc(100vh - 180px)',
            minHeight: 0
          }}>
            {/* Componente de Formulário */}
            <RegistroForm
              formData={formData}
              setFormData={setFormData}
              employee={employee}
              setEmployee={setEmployee}
              requiredFields={requiredFields}
              setRequiredFields={setRequiredFields}
              fieldsWithError={fieldsWithError}
              cnDuplicada={cnDuplicada}
              setCnDuplicada={setCnDuplicada}
              verificandoCn={verificandoCn}
              verificarCnDuplicada={verificarCnDuplicada}
              cnsInseridas={cnsInseridas}
              setCnsInseridas={setCnsInseridas}
              cnInput={cnInput}
              setCnInput={setCnInput}
              adicionarCn={adicionarCn}
              removerCn={removerCn}
              modelos={modelos}
              modeloDropdownOpen={modeloDropdownOpen}
              setModeloDropdownOpen={setModeloDropdownOpen}
              modeloSearch={modeloSearch}
              setModeloSearch={setModeloSearch}
              modeloSelectedIndex={modeloSelectedIndex}
              setModeloSelectedIndex={setModeloSelectedIndex}
              modeloDropdownRef={modeloDropdownRef}
              modeloItemRefs={modeloItemRefs}
              linhas={linhas}
              origens={origens}
              equipamentos={equipamentos}
              observacaoEquipamento={observacaoEquipamento}
              setObservacaoEquipamento={setObservacaoEquipamento}
              causas={causas}
              observacaoCausa={observacaoCausa}
              setObservacaoCausa={setObservacaoCausa}
              inputRefs={inputRefs}
              handleFormChange={handleFormChange}
              handleEnterKeyPress={handleEnterKeyPress}
              handleSave={handleSave}
              saving={saving}
              TIPOS_SCRAP={TIPOS_SCRAP}
              TIPOS_PLACA={TIPOS_PLACA}
            />

            {/* Componente de Visualização */}
            <RegistroPreview
              formData={formData}
              employee={employee}
              linhas={linhas}
              origens={origens}
              equipamentos={equipamentos}
              causas={causas}
              observacaoEquipamento={observacaoEquipamento}
              observacaoCausa={observacaoCausa}
              formatCurrency={formatCurrency}
            />
          </div>
        )}

        {activeTab === 'historico' && (
          <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            marginTop: 25,
            padding: 24,
            height: 'calc(100vh - 200px)',
            overflowY: 'auto'
          }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <History size={20} color="var(--accent)" />
                Histórico de Registros
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Visualize todos os registros de scrap</p>
            </div>

            {/* Filtros */}
            <div style={{
              position: 'relative',
              background: 'var(--hover-bg)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: 16,
              marginBottom: 20
            }}>
              {/* Botão Excel flutuante no canto direito */}
              <button 
                onClick={exportarHistoricoExcel}
                title="Exportar para Excel"
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  width: 40,
                  height: 40,
                  background: 'rgba(22, 163, 74, 0.08)',
                  border: '1px solid rgba(22, 163, 74, 0.25)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(22, 163, 74, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(22, 163, 74, 0.4)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(22, 163, 74, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(22, 163, 74, 0.25)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <Download size={20} color="#16a34a" strokeWidth={2} />
              </button>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingRight: 60 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                    Data Início
                  </label>
                  <input
                    type="date"
                    style={{
                      width: 140, height: 36, padding: '0 12px',
                      border: '1px solid var(--border)', borderRadius: 8,
                      background: 'var(--input-bg)', color: 'var(--text-primary)',
                      fontSize: 13, outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                    Data Fim
                  </label>
                  <input
                    type="date"
                    style={{
                      width: 140, height: 36, padding: '0 12px',
                      border: '1px solid var(--border)', borderRadius: 8,
                      background: 'var(--input-bg)', color: 'var(--text-primary)',
                      fontSize: 13, outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                    Linha
                  </label>
                  <select style={{
                    width: 120, height: 36, padding: '0 12px',
                    border: '1px solid var(--border)', borderRadius: 8,
                    background: 'var(--input-bg)', color: 'var(--text-primary)',
                    fontSize: 13, outline: 'none', cursor: 'pointer'
                  }}>
                    <option value="">Todas</option>
                    {linhas.map(linha => (
                      <option key={linha.id} value={linha.id}>{linha.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                    Turno
                  </label>
                  <select style={{
                    width: 80, height: 36, padding: '0 12px',
                    border: '1px solid var(--border)', borderRadius: 8,
                    background: 'var(--input-bg)', color: 'var(--text-primary)',
                    fontSize: 13, outline: 'none', cursor: 'pointer'
                  }}>
                    <option value="">Todos</option>
                    <option value="1T">1T</option>
                    <option value="2T">2T</option>
                    <option value="3T">3T</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                  <button style={{
                    height: 36, padding: '0 16px',
                    background: 'var(--accent)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <Search size={14} />
                    Filtrar
                  </button>
                </div>
              </div>
            </div>

            {/* Tabela de Histórico */}
            <div style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              overflow: 'auto'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '5% 8% 5% 8% 15% 5% 5% 10% 10% 10% 10% 10% 10%',
                background: 'var(--table-head-bg)',
                padding: '12px 16px',
                fontSize: 12,
                textAlign: 'center',
                fontWeight: 600,
                color: 'var(--text-muted)',
                borderBottom: '1px solid var(--border)'
              }}>
                <div>ID</div>
                <div>Data</div>
                <div>Turno</div>
                <div>Linha</div>
                <div>Modelo</div>
                <div>Placa</div>
                <div>CN</div>
                <div>Qtd</div>
                <div>Valor</div>
                <div>Origem</div>
                <div>Equipamento</div>
                <div>Status</div>
                <div>Aprovador</div>
              </div>
              
              {/* Dados reais do histórico */}
              {historicoData.length === 0 ? (
                <div style={{
                  padding: 40,
                  textAlign: 'center',
                  color: 'var(--text-muted)'
                }}>
                  <History size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
                  <p style={{ fontSize: 14 }}>Nenhum registro no histórico</p>
                  <p style={{ fontSize: 12, marginTop: 4 }}>Os registros aprovados aparecerão aqui</p>
                </div>
              ) : (
                historicoData.map((item, index) => (
                <div key={index} style={{
                  display: 'grid',
                  gridTemplateColumns: '5% 8% 5% 8% 15% 5% 10% 5% 10% 10% 10% 10% 10%',
                  padding: '12px 16px',
                  fontSize: 13,
                  textAlign:'center',
                  color: 'var(--text-primary)',
                  borderBottom: '1px solid var(--border)',
                  background: index % 2 === 0 ? 'var(--card-bg)' : 'var(--hover-bg)',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onClick={() => {
                  setSelectedRecord(item);
                  setRecordModal(true);
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent)08'}
                onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'var(--card-bg)' : 'var(--hover-bg)'}
                >
                  <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>#{item.id}</div>
                  <div>{item.data}</div>
                  <div>
                    <span style={{
                      padding: '2px 8px', borderRadius: 999,
                      fontSize: 11, fontWeight: 600,
                      background: item.turno === '1T' ? 'var(--warning)18' : item.turno === '2T' ? 'var(--info)18' : 'var(--success)18',
                      color: item.turno === '1T' ? 'var(--warning)' : item.turno === '2T' ? 'var(--info)' : 'var(--success)',
                      border: '1px solid ' + (item.turno === '1T' ? 'var(--warning)40' : item.turno === '2T' ? 'var(--info)40' : 'var(--success)40')
                    }}>
                      {item.turno}
                    </span>
                  </div>
                  <div>{item.linha}</div>
                  <div>{item.modelo}</div>
                  <div>{item.placa}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 600, color: 'var(--accent)' }}>{item.cn}</div>
                  <div>{item.qtd}</div>
                  <div style={{ fontWeight: 600, color: 'var(--success)' }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
                  </div>
                  <div>{item.origem}</div>
                  <div>{item.equipamento}</div>
                  <div>
                    <span style={{
                      padding: '4px 12px', borderRadius: 999,
                      fontSize: 11, fontWeight: 600,
                      background: item.status === 'Aprovado' ? 'var(--success)18' : item.status === 'Pendente' ? 'var(--warning)18' : 'var(--error)18',
                      color: item.status === 'Aprovado' ? 'var(--success)' : item.status === 'Pendente' ? 'var(--warning)' : 'var(--error)',
                      border: '1px solid ' + (item.status === 'Aprovado' ? 'var(--success)40' : item.status === 'Pendente' ? 'var(--warning)40' : 'var(--error)40')
                    }}>
                      {item.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {item.aprovadoPor ? item.aprovadoPor.split(' ').slice(0, 2).join(' ') : '-'}
                  </div>
                </div>
              ))
              )}
            </div>

            {/* Paginação */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 20,
              padding: '0 16px'
            }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Mostrando 5 de 157 registros
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{
                  width: 32, height: 32,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--hover-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 12
                }}>
                  <ChevronLeft size={16} />
                </button>
                <button style={{
                  width: 32, height: 32,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--accent)',
                  border: '1px solid var(--accent)',
                  borderRadius: 8,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600
                }}>
                  1
                </button>
                <button style={{
                  width: 32, height: 32,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--hover-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 12
                }}>
                  2
                </button>
                <button style={{
                  width: 32, height: 32,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--hover-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 12
                }}>
                  3
                </button>
                <button style={{
                  width: 32, height: 32,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--hover-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 12
                }}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Detalhes do Registro - MOVIDO PARA FORA DAS ABAS */}
        {recordModal && selectedRecord && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 24,
              width: 700,
              maxWidth: '95%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}>
                  <FileText size={22} color="var(--accent)" />
                  Detalhes do Registro #{selectedRecord.id}
                </h3>
                <button
                  onClick={() => setRecordModal(false)}
                  style={{
                    width: 28, height: 28,
                    background: 'var(--hover-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Informações Básicas */}
                <div style={{ background: 'var(--hover-bg)', borderRadius: 8, padding: 12 }}>
                  <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 10, textTransform: 'uppercase' }}>
                    Informações Básicas
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Data:</span>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{selectedRecord.data}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Turno:</span>
                      <span style={{
                        padding: '2px 8px', borderRadius: 999,
                        fontSize: 10, fontWeight: 600,
                        background: selectedRecord.turno === '1T' ? 'var(--warning)18' : selectedRecord.turno === '2T' ? 'var(--info)18' : 'var(--success)18',
                        color: selectedRecord.turno === '1T' ? 'var(--warning)' : selectedRecord.turno === '2T' ? 'var(--info)' : 'var(--success)'
                      }}>
                        {selectedRecord.turno}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Linha:</span>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{selectedRecord.linha}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Status:</span>
                      <span style={{
                        padding: '2px 8px', borderRadius: 999,
                        fontSize: 10, fontWeight: 600,
                        background: selectedRecord.status === 'Aprovado' ? 'var(--success)18' : 'var(--warning)18',
                        color: selectedRecord.status === 'Aprovado' ? 'var(--success)' : 'var(--warning)'
                      }}>
                        {selectedRecord.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dados do Material */}
                <div style={{ background: 'var(--hover-bg)', borderRadius: 8, padding: 12 }}>
                  <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 10, textTransform: 'uppercase' }}>
                    Dados do Material
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Modelo:</span>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{selectedRecord.modelo}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Placa:</span>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{selectedRecord.placa}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>CN:</span>
                      <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "'DM Mono', monospace", color: 'var(--accent)' }}>{selectedRecord.cn || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>HALB:</span>
                      <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>{selectedRecord.halb}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Qtd:</span>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{selectedRecord.qtd}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Valor:</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--success)' }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedRecord.valor)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Operador */}
                <div style={{ background: 'var(--hover-bg)', borderRadius: 8, padding: 12 }}>
                  <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 10, textTransform: 'uppercase' }}>
                    Operador
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Matrícula:</span>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{selectedRecord.matricula || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Nome:</span>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{selectedRecord.nomeOperador || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Origem e Equipamento */}
                <div style={{ background: 'var(--hover-bg)', borderRadius: 8, padding: 12 }}>
                  <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 10, textTransform: 'uppercase' }}>
                    Origem & Equipamento
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Origem:</span>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{selectedRecord.origem || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Equipamento:</span>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{selectedRecord.equipamento || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Causa:</span>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{selectedRecord.causa || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Causa Raiz, Ação Corretiva e Contramedida */}
              {(selectedRecord.causaRaiz || selectedRecord.acaoCorretiva || selectedRecord.contramedida) && (
                <div style={{ marginTop: 16 }}>
                  <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 10, textTransform: 'uppercase' }}>
                    Análise e Ações
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {selectedRecord.causaRaiz && (
                      <div style={{ background: 'var(--hover-bg)', borderRadius: 8, padding: 12 }}>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Causa Raiz:</p>
                        <p style={{ fontSize: 12, color: 'var(--text-primary)' }}>{selectedRecord.causaRaiz}</p>
                      </div>
                    )}
                    {selectedRecord.acaoCorretiva && (
                      <div style={{ background: 'var(--hover-bg)', borderRadius: 8, padding: 12 }}>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Ação Corretiva:</p>
                        <p style={{ fontSize: 12, color: 'var(--text-primary)' }}>{selectedRecord.acaoCorretiva}</p>
                      </div>
                    )}
                    {selectedRecord.contramedida && (
                      <div style={{ background: 'var(--hover-bg)', borderRadius: 8, padding: 12 }}>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Contramedida:</p>
                        <p style={{ fontSize: 12, color: 'var(--text-primary)' }}>{selectedRecord.contramedida}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                <button
                  onClick={() => setRecordModal(false)}
                  style={{
                    padding: '8px 20px',
                    background: 'var(--accent)',
                    border: 'none',
                    borderRadius: 6,
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600
                  }}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'aprovacao' && (
          <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            marginTop:25,
            padding: 24,
            height: 'calc(100vh - 200px)',
            overflowY: 'auto'
          }}>
            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}>
                  <Check size={20} color="var(--accent)" />
                  Aprovação de Registros
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Aprove ou rejeite registros pendentes</p>
              </div>
              
              {/* Resumo de Aprovação - Valores Reais */}
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{
                  background: 'linear-gradient(135deg, var(--success)15, var(--success)08)',
                  border: '2px solid var(--success)40',
                  borderRadius: 12,
                  padding: '16px 24px',
                  textAlign: 'center',
                  minWidth: 120,
                  boxShadow: '0 4px 12px rgba(34, 197, 94, 0.15)'
                }}>
                  <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--success)', margin: 0, fontFamily: "'DM Mono', monospace" }}>
                    {aprovacaoData.length}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, margin: 0, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pendentes</p>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, var(--warning)15, var(--warning)08)',
                  border: '2px solid var(--warning)40',
                  borderRadius: 12,
                  padding: '16px 24px',
                  textAlign: 'center',
                  minWidth: 160,
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)'
                }}>
                  <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--warning)', margin: 0, fontFamily: "'DM Mono', monospace" }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      aprovacaoData.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0)
                    )}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, margin: 0, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valor Total</p>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, var(--info)15, var(--info)08)',
                  border: '2px solid var(--info)40',
                  borderRadius: 12,
                  padding: '16px 24px',
                  textAlign: 'center',
                  minWidth: 140,
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)'
                }}>
                  <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--info)', margin: 0, fontFamily: "'DM Mono', monospace" }}>
                    {aprovacaoData.reduce((sum, item) => sum + (parseInt(item.qtd) || 0), 0)}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, margin: 0, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Qtd Scraps</p>
                </div>
              </div>
            </div>

            {/* Modal de Autenticação */}
            {authModal && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 32,
                  width: 400,
                  maxWidth: '90%'
                }}>
                  <h3 style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                  }}>
                    <Lock size={24} color="var(--accent)" />
                    Acesso Restrito
                  </h3>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
                    Digite a senha para acessar a área de aprovação
                  </p>
                  
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                      Senha
                    </label>
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAuthSubmit()}
                      ref={authPasswordRef}
                      style={{
                        width: '100%', height: 44, padding: '0 16px',
                        border: '1px solid var(--border)', borderRadius: 8,
                        background: 'var(--input-bg)', color: 'var(--text-primary)',
                        fontSize: 14, outline: 'none'
                      }}
                      placeholder="Digite sua senha"
                    />
                    {authError && (
                      <p style={{ fontSize: 12, color: 'var(--error)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AlertCircle size={14} />
                        {authError}
                      </p>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      onClick={() => {
                        setAuthModal(false);
                        setActiveTab('registro');
                      }}
                      style={{
                        flex: 1, height: 40,
                        background: 'var(--hover-bg)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: 14, fontWeight: 500
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAuthSubmit}
                      style={{
                        flex: 1, height: 40,
                        background: 'var(--accent)',
                        border: 'none',
                        borderRadius: 8,
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: 14, fontWeight: 600
                      }}
                    >
                      Acessar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Conteúdo protegido - só mostra quando autenticado */}
            {authenticated && (
              <>
                {/* Filtros */}
                <div style={{
                  background: 'var(--hover-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: 16,
                  marginBottom: 20
                }}>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                        Data Início
                      </label>
                      <input
                        type="date"
                        style={{
                          width: 140, height: 36, padding: '0 12px',
                          border: '1px solid var(--border)', borderRadius: 8,
                          background: 'var(--input-bg)', color: 'var(--text-primary)',
                          fontSize: 13, outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                        Data Fim
                      </label>
                      <input
                        type="date"
                        style={{
                          width: 140, height: 36, padding: '0 12px',
                          border: '1px solid var(--border)', borderRadius: 8,
                          background: 'var(--input-bg)', color: 'var(--text-primary)',
                          fontSize: 13, outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                        Linha
                      </label>
                      <select style={{
                        width: 120, height: 36, padding: '0 12px',
                        border: '1px solid var(--border)', borderRadius: 8,
                        background: 'var(--input-bg)', color: 'var(--text-primary)',
                        fontSize: 13, outline: 'none', cursor: 'pointer'
                      }}>
                        <option value="">Todas</option>
                        {linhas.map(linha => (
                          <option key={linha.id} value={linha.id}>{linha.nome}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button style={{
                        height: 36, padding: '0 16px',
                        background: 'var(--accent)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}>
                        <Search size={14} />
                        Filtrar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tabela de Aprovação */}
                <div style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '5% 8% 20% 6% 10% 15% 8% 5% 14% 8%',
                    background: 'var(--table-head-bg)',
                    padding: '10px 12px',
                    textAlign: 'center',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    borderBottom: '1px solid var(--border)'
                  }}>
                    <div>ID</div>
                    <div>Data</div>
                    <div>Registrado por</div>
                    <div>Turno</div>
                    <div>Linha</div>
                    <div>Modelo</div>
                    <div>Placa</div>
                    <div>Qtd</div>
                    <div>Valor</div>
                    <div>Ações</div>
                  </div>
                  
                  {/* Dados reais de aprovação */}
                  {aprovacaoData.length === 0 ? (
                    <div style={{
                      padding: 40,
                      textAlign: 'center',
                      color: 'var(--text-muted)'
                    }}>
                      <Check size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
                      <p style={{ fontSize: 14 }}>Nenhum registro pendente de aprovação</p>
                    </div>
                  ) : (
                    aprovacaoData.map((item, index) => (
                      <div key={item.id} style={{
                        display: 'grid',
                        gridTemplateColumns: '5% 8% 20% 6% 10% 15% 8% 5% 14% 20%',
                        padding: '10px 12px',
                        textAlign: 'center',
                        fontSize: 12,
                        color: 'var(--text-primary)',
                        borderBottom: '1px solid var(--border)',
                        background: index % 2 === 0 ? 'var(--card-bg)' : 'var(--hover-bg)'
                      }}>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>#{item.id}</div>
                        <div>{item.data}</div>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.nomeOperador || '-'}>
                          {item.nomeOperador || '-'}
                        </div>
                        <div>
                          <span style={{
                            padding: '2px 6px', borderRadius: 999,
                            fontSize: 10, fontWeight: 600,
                            background: item.turno === '1T' ? 'var(--warning)18' : item.turno === '2T' ? 'var(--info)18' : 'var(--success)18',
                            color: item.turno === '1T' ? 'var(--warning)' : item.turno === '2T' ? 'var(--info)' : 'var(--success)',
                            border: '1px solid ' + (item.turno === '1T' ? 'var(--warning)40' : item.turno === '2T' ? 'var(--info)40' : 'var(--success)40')
                          }}>
                            {item.turno}
                          </span>
                        </div>
                        <div>{item.linha}</div>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.modelo}</div>
                        <div>{item.placa}</div>
                        <div>{item.qtd}</div>
                        <div style={{ fontWeight: 600, color: 'var(--success)' }}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button 
                            onClick={() => {
                              setSelectedRecord(item);
                              setRecordModal(true);
                            }}
                            style={{
                              padding: '4px 8px',
                              background: 'var(--accent)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: 11,
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3
                            }}
                            title="Ver detalhes"
                          >
                            <Eye size={12} />
                          </button>
                          <button 
                            onClick={() => {
                              setApprovalRecord(item);
                              setApprovalAction('aprovar');
                              setGestorMatricula('');
                              setGestorNome('');
                            }}
                            style={{
                              padding: '4px 8px',
                              background: 'var(--success)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: 11,
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3
                            }}
                            title="Aprovar"
                          >
                            <Check size={12} />
                          </button>
                          <button 
                            onClick={() => {
                              setApprovalRecord(item);
                              setApprovalAction('rejeitar');
                              setGestorMatricula('');
                              setGestorNome('');
                            }}
                            style={{
                              padding: '4px 8px',
                              background: 'var(--error)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: 11,
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3
                            }}
                            title="Rejeitar"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Modal de Confirmação de Aprovação */}
                {(approvalRecord && approvalAction) && (
                  <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                  }}>
                    <div style={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      padding: 32,
                      width: 400,
                      maxWidth: '90%'
                    }}>
                      <h3 style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12
                      }}>
                        <ShieldAlert size={24} color={approvalAction === 'aprovar' ? 'var(--success)' : 'var(--error)'} />
                        {approvalAction === 'aprovar' ? 'Aprovar' : 'Rejeitar'} Registro
                      </h3>
                      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
                        Confirme a {approvalAction === 'aprovar' ? 'aprovação' : 'rejeição'} com a matrícula do gestor
                      </p>
                      
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                          Matrícula do Gestor
                        </label>
                        <input
                          type="text"
                          maxLength={8}
                          value={gestorMatricula}
                          onChange={(e) => {
                            const matricula = e.target.value;
                            setGestorMatricula(matricula);
                            // Limpar nome do gestor quando a matrícula for alterada
                            setGestorNome('');
                            
                            // Verificar automaticamente apenas quando tiver 8 caracteres (matrícula completa)
                            if (matricula.length === 8) {
                              setGestorLoading(true);
                              // Buscar no backend se a matrícula tem permissão de aprovação
                              fetch(`${API_URL}/verificar-aprovador/${matricula}`)
                                .then(response => response.json())
                                .then(data => {
                                  setGestorLoading(false);
                                  if (data.success && data.podeAprovar) {
                                    setGestorNome(data.aprovador?.nome_completo || data.aprovador?.nome || 'Aprovador');
                                    message.success('Matrícula autorizada para aprovação');
                                  } else {
                                    setGestorNome('');
                                    message.error('Esta matrícula não tem permissão para aprovar registros');
                                  }
                                })
                                .catch(error => {
                                  console.error('Erro ao verificar matrícula:', error);
                                  setGestorLoading(false);
                                  setGestorNome('');
                                  message.error('Erro ao verificar matrícula. Tente novamente.');
                                });
                            }
                          }}
                          onKeyDown={(e) => {
                            // Permitir confirmação com Enter quando a matrícula estiver preenchida e válida
                            if (e.key === 'Enter' && gestorNome) {
                              e.preventDefault();
                              if (approvalAction === 'aprovar') {
                                handleApproveRecord(approvalRecord);
                              } else {
                                handleRejectRecord(approvalRecord);
                              }
                            }
                          }}
                          ref={gestorMatriculaRef}
                          style={{
                            width: '100%', height: 44, padding: '0 16px',
                            border: '1px solid var(--border)', borderRadius: 8,
                            background: 'var(--input-bg)', color: 'var(--text-primary)',
                            fontSize: 14, outline: 'none'
                          }}
                          placeholder="Digite a matrícula do gestor"
                        />
                        {gestorLoading && (
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                            Verificando matrícula...
                          </p>
                        )}
                        {gestorNome && (
                          <p style={{ fontSize: 12, color: 'var(--success)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Check size={14} />
                            {gestorNome}
                          </p>
                        )}
                      </div>

                      {gestorNome && (
                        <div style={{ marginBottom: 16 }}>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                            Confirmar Ação
                          </label>
                          <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                            Deseja realmente {approvalAction === 'aprovar' ? 'aprovar' : 'rejeitar'} o registro #{approvalRecord.id}?
                          </p>
                          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--success)', marginTop: 8 }}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(approvalRecord.valor)}
                          </p>
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button
                          onClick={() => {
                            setApprovalRecord(null);
                            setApprovalAction('');
                            setGestorMatricula('');
                            setGestorNome('');
                          }}
                          style={{
                            flex: 1, height: 40,
                            background: 'var(--hover-bg)',
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontSize: 14, fontWeight: 500
                          }}
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => {
                            if (gestorNome) {
                              if (approvalAction === 'aprovar') {
                                handleApproveRecord(approvalRecord);
                              } else {
                                handleRejectRecord(approvalRecord);
                              }
                            }
                          }}
                          disabled={!gestorNome}
                          style={{
                            flex: 1, height: 40,
                            background: gestorNome ? (approvalAction === 'aprovar' ? 'var(--success)' : 'var(--error)') : 'var(--border)',
                            border: 'none',
                            borderRadius: 8,
                            color: gestorNome ? '#fff' : 'var(--text-muted)',
                            cursor: gestorNome ? 'pointer' : 'not-allowed',
                            fontSize: 14, fontWeight: 600
                          }}
                        >
                          {approvalAction === 'aprovar' ? 'Aprovar' : 'Rejeitar'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'rejeitados' && (
          <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: 12,
              marginTop: 2,
            padding: 24,
            height: 'calc(100vh - 200px)',
            overflowY: 'auto'
          }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <XCircle size={20} color="var(--error)" />
                Registros Rejeitados
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Registros rejeitados nos últimos 2 dias</p>
            </div>

            {/* Tabela de Rejeitados */}
            <div style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              overflow: 'hidden',
              maxWidth: '1400px'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '5% 8% 5% 8% 15% 5% 8% 5% 10% 12% 10% 10% 7%',
                background: 'var(--table-head-bg)',
                padding: '12px 16px',
                fontSize: 12,
                textAlign: 'center',
                fontWeight: 600,
                color: 'var(--text-muted)',
                borderBottom: '1px solid var(--border)'
              }}>
                <div>ID</div>
                <div>Data</div>
                <div>Turno</div>
                <div>Linha</div>
                <div>Modelo</div>
                <div>Placa</div>
                <div>CN</div>
                <div>Qtd</div>
                <div>Valor</div>
                <div>Registrado Por</div>
                <div>Rejeitado Por</div>
                <div>Data Rejeição</div>
                <div>Ações</div>
              </div>
              
              {rejeitadosLoading ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
                  <p>Carregando registros rejeitados...</p>
                </div>
              ) : rejeitadosData.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <XCircle size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
                  <p style={{ fontSize: 14 }}>Nenhum registro rejeitado nos últimos 2 dias</p>
                </div>
              ) : (
                rejeitadosData.map((item, index) => (
                  <div key={item.id} style={{
                    display: 'grid',
                    gridTemplateColumns: '5% 8% 5% 8% 15% 5% 8% 5% 10% 12% 10% 10% 7%',
                    padding: '12px 16px',
                    fontSize: 13,
                    textAlign: 'center',
                    color: 'var(--text-primary)',
                    borderBottom: '1px solid var(--border)',
                    background: index % 2 === 0 ? 'var(--card-bg)' : 'var(--hover-bg)',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onClick={() => {
                    setSelectedRecord(item);
                    setRecordModal(true);
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent)08'}
                  onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'var(--card-bg)' : 'var(--hover-bg)'}
                  >
                    <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>#{item.id}</div>
                    <div>{item.data}</div>
                    <div>
                      <span style={{
                        padding: '2px 8px', borderRadius: 999,
                        fontSize: 11, fontWeight: 600,
                        background: item.turno === '1T' ? 'var(--warning)18' : item.turno === '2T' ? 'var(--info)18' : 'var(--success)18',
                        color: item.turno === '1T' ? 'var(--warning)' : item.turno === '2T' ? 'var(--info)' : 'var(--success)'
                      }}>
                        {item.turno}
                      </span>
                    </div>
                    <div>{item.linha}</div>
                    <div>{item.modelo}</div>
                    <div>{item.placa}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 600, color: 'var(--accent)' }}>{item.cn}</div>
                    <div>{item.qtd}</div>
                    <div style={{ fontWeight: 600, color: 'var(--error)' }}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.nomeOperador || '-'}>
                      {item.nomeOperador ? item.nomeOperador.split(' ').slice(0, 2).join(' ') : '-'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {item.rejeitadoPor ? item.rejeitadoPor.split(' ').slice(0, 2).join(' ') : '-'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.dataRejeicao || '-'}</div>
                    <div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(item);
                          setRecordModal(true);
                        }}
                        style={{
                          padding: '4px 8px',
                          background: 'var(--accent)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 11,
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          margin: '0 auto'
                        }}
                      >
                        <Eye size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── ANÁLISE IA ── */}
        {activeTab === 'analise_ia' && (
          <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            marginTop: 25,
            padding: chatExpanded ? 12 : 24,
            height: chatExpanded ? 'calc(100vh - 80px)' : 'calc(100vh - 200px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: chatExpanded ? 'fixed' : 'relative',
            top: chatExpanded ? 70 : 'auto',
            left: chatExpanded ? 50 : 'auto',
            transform: chatExpanded ? 'translateX(-50%)' : 'none',
            width: chatExpanded ? 'calc(100vw - 100px)' : 'auto',
            maxWidth: chatExpanded ? 'calc(100vw - 100px)' : 'none',
            zIndex: 100
          }}>
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <Sparkles size={16} color="#8b5cf6" />
                  Análise IA - Gauss
                </h2>
                <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>Faça perguntas sobre os dados de scraps e receba insights inteligentes</p>
              </div>
              
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {/* Botão Expandir/Contrair */}
                <button
                  onClick={() => setChatExpanded(!chatExpanded)}
                  title={chatExpanded ? 'Contrair' : 'Expandir'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    background: chatExpanded ? 'var(--accent)' : 'var(--hover-bg)',
                    border: `1px solid ${chatExpanded ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 8,
                    color: chatExpanded ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  {chatExpanded ? <Minus size={14} /> : <Maximize2 size={14} />}
                  {chatExpanded ? 'Contrair' : 'Expandir'}
                </button>
                
                {/* Botão Parar Geração */}
                {chatLoading && (
                  <button
                    onClick={handleStopGeneration}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 16px',
                      background: '#ef4444',
                      border: 'none',
                      borderRadius: 8,
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      transition: 'all 0.2s'
                    }}
                  >
                    <Square size={16} fill="#fff" />
                    Parar
                  </button>
                )}
              </div>
            </div>

            {/* Área de Mensagens */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              marginBottom: 16,
              padding: '0 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}>
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: 12,
                    maxWidth: msg.role === 'user' ? '85%' : '90%',
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    animation: 'fadeIn 0.3s ease'
                  }}
                >
                  {msg.role === 'assistant' && (
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)'
                    }}>
                      <Bot size={20} color="#fff" />
                    </div>
                  )}
                  
                  <div style={{
                    padding: msg.role === 'user' ? '12px 16px' : '14px 18px',
                    borderRadius: 16,
                    background: msg.role === 'user' 
                      ? 'linear-gradient(135deg, #0969da, #0550ae)'
                      : msg.error 
                        ? '#fef2f2'
                        : 'var(--hover-bg)',
                    color: msg.role === 'user' ? '#fff' : msg.error ? '#dc2626' : 'var(--text-primary)',
                    fontSize: 14,
                    lineHeight: 1.5,
                    boxShadow: msg.role === 'user' 
                      ? '0 2px 8px rgba(9, 105, 218, 0.2)' 
                      : '0 1px 3px rgba(0,0,0,0.08)',
                    border: msg.error ? '1px solid #fecaca' : 'none'
                  }}>
                    {msg.role === 'user' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <User size={16} />
                        {msg.content}
                      </div>
                    ) : (
                      <FormatarRespostaIA conteudo={msg.content} />
                    )}
                    <div style={{
                      fontSize: 10,
                      opacity: 0.6,
                      marginTop: 6,
                      textAlign: 'right'
                    }}>
                      {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #0969da, #0550ae)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(9, 105, 218, 0.3)'
                    }}>
                      <User size={20} color="#fff" />
                    </div>
                  )}
                </div>
              ))}
              
              {chatLoading && (
                <div style={{
                  display: 'flex',
                  gap: 12,
                  maxWidth: '90%',
                  alignSelf: 'flex-start',
                  animation: 'fadeIn 0.3s ease'
                }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)'
                  }}>
                    <Bot size={20} color="#fff" />
                  </div>
                  
                  <div style={{
                    padding: '14px 18px',
                    borderRadius: 16,
                    background: 'var(--hover-bg)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#8b5cf6',
                      animation: 'bounce 1.4s infinite ease-in-out both',
                      animationDelay: '0s'
                    }} />
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#8b5cf6',
                      animation: 'bounce 1.4s infinite ease-in-out both',
                      animationDelay: '0.2s'
                    }} />
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#8b5cf6',
                      animation: 'bounce 1.4s infinite ease-in-out both',
                      animationDelay: '0.4s'
                    }} />
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Área de Input */}
            <div style={{
              display: 'flex',
              gap: 12,
              alignItems: 'flex-end',
              paddingTop: 16,
              borderTop: '1px solid var(--border)'
            }}>
              <div style={{
                flex: 1,
                position: 'relative'
              }}>
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Faça uma pergunta sobre os scraps... (Ex: Qual modelo teve mais scraps este mês?)"
                  rows={1}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    paddingRight: 50,
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    outline: 'none',
                    resize: 'none',
                    minHeight: 48,
                    maxHeight: 120,
                    fontFamily: 'inherit',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--accent)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(9, 105, 218, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              
              <button
                onClick={handleSendMessage}
                disabled={chatLoading || !chatInput.trim()}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: chatLoading || !chatInput.trim()
                    ? 'var(--border)'
                    : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  border: 'none',
                  color: chatLoading || !chatInput.trim() ? 'var(--text-muted)' : '#fff',
                  cursor: chatLoading || !chatInput.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  boxShadow: chatLoading || !chatInput.trim()
                    ? 'none'
                    : '0 2px 8px rgba(139, 92, 246, 0.3)'
                }}
              >
                {chatLoading ? (
                  <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HanaroScrap;
