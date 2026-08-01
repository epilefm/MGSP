import { API_URL } from '../../../config/api';
import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, Filter, ChevronDown, ChevronUp, PieChart as PieChartIcon, LineChart as LineChartIcon, AreaChart as AreaChartIcon, Target as RadarChartIcon, Minimize2, Maximize2, RefreshCw } from 'lucide-react';
import { DatePicker, ConfigProvider } from 'antd';
import dayjs from 'dayjs';
import ptBR from 'antd/locale/pt_BR';
import 'antd/dist/reset.css';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart, YAxis as YAxis2
} from 'recharts';

const { RangePicker } = DatePicker;

// CSS injection para corrigir fundo preto do calendario
const injectCalendarStyles = () => {
  const styleId = 'hanaro-calendar-fix';
  // Remove estilo existente se houver
  const existing = document.getElementById(styleId);
  if (existing) existing.remove();
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .ant-picker-panel th,
    .ant-picker-content th,
    .ant-picker-body th,
    .ant-picker-panel thead th,
    .ant-picker-content thead th,
    .ant-picker-body thead th,
    .ant-picker-panel-container th,
    th.ant-picker-cell,
    .ant-picker-cell-header {
      background: #f6f8fa !important;
      background-color: #f6f8fa !important;
      color: #1f2328 !important;
    }
    .ant-picker-header,
    .ant-picker-header-view,
    .ant-picker-panel,
    .ant-picker-panel-container,
    .ant-picker-body,
    .ant-picker-dropdown,
    .ant-picker-content,
    .ant-picker-cell,
    .ant-picker-cell-in-view,
    .ant-picker-ranges,
    .ant-picker-ranges ul,
    .ant-picker-ranges li {
      background-color: #ffffff !important;
    }
    .ant-picker-cell-inner {
      color: #1f2328 !important;
    }
  `;
  document.head.appendChild(style);
};

// Hook para injetar estilos quando o componente montar
const useCalendarStyleFix = () => {
  useEffect(() => {
    injectCalendarStyles();
    // Re-injeta apos delay para garantir que pegue o CSS do AntD
    const timeout = setTimeout(() => injectCalendarStyles(), 100);
    const timeout2 = setTimeout(() => injectCalendarStyles(), 500);
    return () => {
      clearTimeout(timeout);
      clearTimeout(timeout2);
    };
  }, []);
};

const DashboardHanaro = () => {
  // Estados para filtros
  const hoje = dayjs();
  const [dateRange, setDateRange] = useState([hoje, hoje]);
  const [modeloFilter, setModeloFilter] = useState('');
  const [origemFilter, setOrigemFilter] = useState('');
  const [equipamentoFilter, setEquipamentoFilter] = useState('');
  const [causaFilter, setCausaFilter] = useState('');
  const [linhaFilter, setLinhaFilter] = useState('');
  const [faseFilter, setFaseFilter] = useState('');
  const [turnoFilter, setTurnoFilter] = useState('');
  const [responsavelFilter, setResponsavelFilter] = useState('');
  const [tipoScrapFilter, setTipoScrapFilter] = useState('');
  
  // Estados para valores disponíveis dos filtros
  const [modelosDisponiveis, setModelosDisponiveis] = useState([]);
  const [origensDisponiveis, setOrigensDisponiveis] = useState([]);
  const [equipamentosDisponiveis, setEquipamentosDisponiveis] = useState([]);
  const [causasDisponiveis, setCausasDisponiveis] = useState([]);
  const [linhasDisponiveis, setLinhasDisponiveis] = useState([]);
  const [fasesDisponiveis, setFasesDisponiveis] = useState([]);
  const [turnosDisponiveis, setTurnosDisponiveis] = useState([]);
  const [responsaveisDisponiveis, setResponsaveisDisponiveis] = useState([]);
  const [tipoScrapDisponiveis, setTipoScrapDisponiveis] = useState([]);
  
  // Presets de data (usando dayjs)
  const presets = [
    { label: 'Últimos 7 dias', value: () => [dayjs().subtract(6, 'day'), dayjs()] },
    { label: 'Últimos 14 dias', value: () => [dayjs().subtract(13, 'day'), dayjs()] },
    { label: 'Últimos 30 dias', value: () => [dayjs().subtract(29, 'day'), dayjs()] },
    { label: 'Últimos 90 dias', value: () => [dayjs().subtract(89, 'day'), dayjs()] },
  ];
  
  // Estados para dados
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    totalValor: 0,
    totalQtd: 0,
    totalRegistros: 0,
    data: ''
  });
  const [modeloData, setModeloData] = useState([]);
  const [loadingModelo, setLoadingModelo] = useState(false);
  const [origemData, setOrigemData] = useState([]);
  const [loadingOrigem, setLoadingOrigem] = useState(false);
  const [equipamentoData, setEquipamentoData] = useState([]);
  const [loadingEquipamento, setLoadingEquipamento] = useState(false);
  const [causaData, setCausaData] = useState([]);
  const [loadingCausa, setLoadingCausa] = useState(false);
  const [linhaData, setLinhaData] = useState([]);
  const [loadingLinha, setLoadingLinha] = useState(false);
  const [faseData, setFaseData] = useState([]);
  const [loadingFase, setLoadingFase] = useState(false);
  const [turnoData, setTurnoData] = useState([]);
  const [loadingTurno, setLoadingTurno] = useState(false);
  const [responsavelData, setResponsavelData] = useState([]);
  const [loadingResponsavel, setLoadingResponsavel] = useState(false);
  const [tipoScrapData, setTipoScrapData] = useState([]);
  const [loadingTipoScrap, setLoadingTipoScrap] = useState(false);
  const [periodoData, setPeriodoData] = useState([]);
  const [loadingPeriodo, setLoadingPeriodo] = useState(false);
  const [periodoFilter, setPeriodoFilter] = useState('diario'); // 'diario', 'semanal', 'mensal', 'anual'
  const [logMessage, setLogMessage] = useState('');
  
  // Estado para expandir/minimizar filtros (inicia minimizado)
  const [filtrosExpandidos, setFiltrosExpandidos] = useState(false);
  
  // Estados para expandir/minimizar gráficos
  const [expandedCharts, setExpandedCharts] = useState({
    modelo: false,
    origem: false,
    equipamento: false,
    causa: false,
    linha: false,
    fase: false,
    turno: false,
    responsavel: false,
    tipoScrap: false,
    periodo: false
  });
  
  // Toggle para expandir/minimizar
  const toggleChartExpand = (chartName) => {
    setExpandedCharts(prev => ({
      ...prev,
      [chartName]: !prev[chartName]
    }));
  };
  
  // Itens por gráfico quando minimizado
  const ITEMS_PER_CHART = 5;

  // Função para truncar nome para apenas 2 palavras (primeiro e segundo nome)
  const truncateName = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    return parts.slice(0, 2).join(' ');
  };

  // Converter dateRange para formato YYYY-MM-DD (compatível com dayjs do Ant Design)
  const formatDate = (date) => {
    if (!date) return '';
    // Se for objeto dayjs (Ant Design)
    if (date.$d) {
      return date.$d.toISOString().split('T')[0];
    }
    // Se for Date nativo
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    // Se for string
    if (typeof date === 'string') {
      return date;
    }
    return '';
  };

  // Função para carregar dados do dashboard com filtros
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      let url = `${API_URL}/api/hanaro-dashboard-hoje`;
      const params = new URLSearchParams();
      
      const dataInicio = formatDate(dateRange[0]);
      const dataFim = formatDate(dateRange[1]);
      
      if (dataInicio) params.append('dataInicio', dataInicio);
      if (dataFim) params.append('dataFim', dataFim);
      if (modeloFilter) params.append('modelo', modeloFilter);
      if (origemFilter) params.append('origem', origemFilter);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success && result.data) {
        setData(result.data);
        setLogMessage(`✅ Dados carregados! Período: ${dataInicio} até ${dataFim}`);
      } else {
        setData({ totalValor: 0, totalQtd: 0, totalRegistros: 0, data: '' });
      }
    } catch (error) {
      console.error('[DashboardHanaro] Erro:', error);
      setLogMessage(`❌ Erro: ${error.message}`);
      setData({ totalValor: 0, totalQtd: 0, totalRegistros: 0, data: '' });
    } finally {
      setLoading(false);
    }
  };

  // Helper para construir URL com TODOS os filtros (segmentação tipo Excel)
  // Todos os filtros são aplicados em todos os gráficos, incluindo o filtro do próprio campo
  const buildFiltersUrl = (baseUrl) => {
    const params = new URLSearchParams();
    const dataInicio = formatDate(dateRange[0]);
    const dataFim = formatDate(dateRange[1]);
    
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataFim) params.append('dataFim', dataFim);
    // Aplica TODOS os filtros em TODOS os gráficos (comportamento Excel)
    if (modeloFilter) params.append('modelo', modeloFilter);
    if (origemFilter) params.append('origem', origemFilter);
    if (equipamentoFilter) params.append('equipamento', equipamentoFilter);
    if (causaFilter) params.append('causa', causaFilter);
    if (linhaFilter) params.append('linha', linhaFilter);
    if (faseFilter) params.append('fase', faseFilter);
    if (turnoFilter) params.append('turno', turnoFilter);
    if (responsavelFilter) params.append('responsavel', responsavelFilter);
    if (tipoScrapFilter) params.append('tipo_scrap', tipoScrapFilter);
    
    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
  };

  // Função para carregar dados por modelo (TODOS os filtros aplicados - comportamento Excel)
  const loadDashboardPorModelo = async () => {
    try {
      setLoadingModelo(true);
      const url = buildFiltersUrl(`${API_URL}/api/hanaro-dashboard-por-modelo`);
      const response = await fetch(url);
      const result = await response.json();
      if (result.success && result.data) {
        // Transformar dados para incluir custo formatado
        const transformedData = result.data.map(item => ({
          ...item,
          custoFormatado: `R$ ${(item.totalValor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        }));
        setModeloData(transformedData);
      }
      else setModeloData([]);
    } catch (error) {
      console.error('[DashboardHanaro] Erro ao carregar por modelo:', error);
      setModeloData([]);
    } finally {
      setLoadingModelo(false);
    }
  };

  // Função para carregar dados por origem (TODOS os filtros aplicados - comportamento Excel)
  const loadDashboardPorOrigem = async () => {
    try {
      setLoadingOrigem(true);
      const url = buildFiltersUrl(`${API_URL}/api/hanaro-dashboard-por-origem`);
      const response = await fetch(url);
      const result = await response.json();
      if (result.success && result.data) setOrigemData(result.data);
      else setOrigemData([]);
    } catch (error) {
      console.error('[DashboardHanaro] Erro ao carregar por origem:', error);
      setOrigemData([]);
    } finally {
      setLoadingOrigem(false);
    }
  };

  // Função para carregar todos os valores disponíveis dos filtros (correlacionados)
  const loadValoresFiltros = async () => {
    try {
      const dataInicio = formatDate(dateRange[0]);
      const dataFim = formatDate(dateRange[1]);
      
      // Construir URL base com filtros selecionados (exceto o que está sendo carregado)
      const buildBaseParams = (excludeParam = '') => {
        const params = new URLSearchParams();
        params.append('dataInicio', dataInicio);
        params.append('dataFim', dataFim);
        if (modeloFilter && excludeParam !== 'modelo') params.append('modelo', modeloFilter);
        if (origemFilter && excludeParam !== 'origem') params.append('origem', origemFilter);
        if (equipamentoFilter && excludeParam !== 'equipamento') params.append('equipamento', equipamentoFilter);
        if (causaFilter && excludeParam !== 'causa') params.append('causa', causaFilter);
        if (linhaFilter && excludeParam !== 'linha') params.append('linha', linhaFilter);
        if (faseFilter && excludeParam !== 'fase') params.append('fase', faseFilter);
        if (turnoFilter && excludeParam !== 'turno') params.append('turno', turnoFilter);
        if (responsavelFilter && excludeParam !== 'responsavel') params.append('responsavel', responsavelFilter);
        if (tipoScrapFilter && excludeParam !== 'tipo_scrap') params.append('tipo_scrap', tipoScrapFilter);
        return params.toString();
      };
      
      // Carregar modelos disponíveis
      const modelosParams = buildBaseParams('modelo');
      const modelosUrl = `${API_URL}/api/hanaro-modelos-registrados?${modelosParams}`;
      const modelosResponse = await fetch(modelosUrl);
      const modelosResult = await modelosResponse.json();
      if (modelosResult.success && modelosResult.data) {
        setModelosDisponiveis(modelosResult.data);
        if (modeloFilter && !modelosResult.data.find(m => m.modelo === modeloFilter)) {
          setModeloFilter('');
        }
      }
      
      // Carregar origens disponíveis
      const origensParams = buildBaseParams('origem');
      const origensUrl = `${API_URL}/api/hanaro-origens-registradas?${origensParams}`;
      const origensResponse = await fetch(origensUrl);
      const origensResult = await origensResponse.json();
      if (origensResult.success && origensResult.data) {
        setOrigensDisponiveis(origensResult.data);
        if (origemFilter && !origensResult.data.find(o => o.origem === origemFilter)) {
          setOrigemFilter('');
        }
      }
      
      // Carregar equipamentos disponíveis
      const equipamentosParams = buildBaseParams('equipamento');
      const equipamentosUrl = `${API_URL}/api/hanaro-equipamentos-registrados?${equipamentosParams}`;
      const equipamentosResponse = await fetch(equipamentosUrl);
      const equipamentosResult = await equipamentosResponse.json();
      if (equipamentosResult.success && equipamentosResult.data) {
        setEquipamentosDisponiveis(equipamentosResult.data);
        if (equipamentoFilter && !equipamentosResult.data.find(e => e.equipamento === equipamentoFilter)) {
          setEquipamentoFilter('');
        }
      }
      
      // Carregar causas disponíveis
      const causasParams = buildBaseParams('causa');
      const causasUrl = `${API_URL}/api/hanaro-causas-registradas?${causasParams}`;
      const causasResponse = await fetch(causasUrl);
      const causasResult = await causasResponse.json();
      if (causasResult.success && causasResult.data) {
        setCausasDisponiveis(causasResult.data);
        if (causaFilter && !causasResult.data.find(c => c.causa === causaFilter)) {
          setCausaFilter('');
        }
      }
      
      // Carregar linhas disponíveis
      const linhasParams = buildBaseParams('linha');
      const linhasUrl = `${API_URL}/api/hanaro-linhas-registradas?${linhasParams}`;
      const linhasResponse = await fetch(linhasUrl);
      const linhasResult = await linhasResponse.json();
      if (linhasResult.success && linhasResult.data) {
        setLinhasDisponiveis(linhasResult.data);
        if (linhaFilter && !linhasResult.data.find(l => l.linha === linhaFilter)) {
          setLinhaFilter('');
        }
      }
      
      // Carregar fases disponíveis
      const fasesParams = buildBaseParams('fase');
      const fasesUrl = `${API_URL}/api/hanaro-fases-registradas?${fasesParams}`;
      const fasesResponse = await fetch(fasesUrl);
      const fasesResult = await fasesResponse.json();
      if (fasesResult.success && fasesResult.data) {
        setFasesDisponiveis(fasesResult.data);
        if (faseFilter && !fasesResult.data.find(f => f.fase === faseFilter)) {
          setFaseFilter('');
        }
      }
      
      // Carregar turnos disponíveis
      const turnosParams = buildBaseParams('turno');
      const turnosUrl = `${API_URL}/api/hanaro-turnos-registrados?${turnosParams}`;
      const turnosResponse = await fetch(turnosUrl);
      const turnosResult = await turnosResponse.json();
      if (turnosResult.success && turnosResult.data) {
        setTurnosDisponiveis(turnosResult.data);
        if (turnoFilter && !turnosResult.data.find(t => t.turno === turnoFilter)) {
          setTurnoFilter('');
        }
      }
      
      // Carregar responsáveis disponíveis
      const responsaveisParams = buildBaseParams('responsavel');
      const responsaveisUrl = `${API_URL}/api/hanaro-responsaveis-registrados?${responsaveisParams}`;
      const responsaveisResponse = await fetch(responsaveisUrl);
      const responsaveisResult = await responsaveisResponse.json();
      if (responsaveisResult.success && responsaveisResult.data) {
        setResponsaveisDisponiveis(responsaveisResult.data);
        if (responsavelFilter && !responsaveisResult.data.find(r => r.responsavel === responsavelFilter)) {
          setResponsavelFilter('');
        }
      }
      
      // Carregar tipos de scrap disponíveis
      const tipoScrapParams = buildBaseParams('tipo_scrap');
      const tipoScrapUrl = `${API_URL}/api/hanaro-tipo-scrap-registrados?${tipoScrapParams}`;
      const tipoScrapResponse = await fetch(tipoScrapUrl);
      const tipoScrapResult = await tipoScrapResponse.json();
      if (tipoScrapResult.success && tipoScrapResult.data) {
        setTipoScrapDisponiveis(tipoScrapResult.data);
        if (tipoScrapFilter && !tipoScrapResult.data.find(ts => ts.tipo_scrap === tipoScrapFilter)) {
          setTipoScrapFilter('');
        }
      }
    } catch (error) {
      console.error('[DashboardHanaro] Erro ao carregar valores dos filtros:', error);
    }
  };

  // Carregar valores dos filtros ao montar e quando data ou filtros mudarem
  useEffect(() => {
    loadValoresFiltros();
  }, [dateRange?.[0], dateRange?.[1], modeloFilter, origemFilter, equipamentoFilter, causaFilter, linhaFilter, faseFilter, turnoFilter, responsavelFilter, tipoScrapFilter]);

  // Função para carregar dados por equipamento (TODOS os filtros aplicados - comportamento Excel)
  const loadDashboardPorEquipamento = async () => {
    try {
      setLoadingEquipamento(true);
      const url = buildFiltersUrl(`${API_URL}/api/hanaro-dashboard-por-equipamento`);
      const response = await fetch(url);
      const result = await response.json();
      console.log('[DashboardHanaro] Equipamento:', result);
      if (result.success && result.data) {
        // Normalizar nomes: se conter "Outros - ", mostrar apenas "Outros"
        const normalizedData = result.data.map(item => ({
          ...item,
          equipamento: item.equipamento?.toLowerCase().includes('outros -') ? 'Outros' : item.equipamento
        }));
        setEquipamentoData(normalizedData);
      }
      else setEquipamentoData([]);
    } catch (error) {
      console.error('[DashboardHanaro] Erro ao carregar por equipamento:', error);
      setEquipamentoData([]);
    } finally {
      setLoadingEquipamento(false);
    }
  };

  // Função para carregar dados por causa (TODOS os filtros aplicados - comportamento Excel)
  const loadDashboardPorCausa = async () => {
    try {
      setLoadingCausa(true);
      const url = buildFiltersUrl(`${API_URL}/api/hanaro-dashboard-por-causa`);
      const response = await fetch(url);
      const result = await response.json();
      console.log('[DashboardHanaro] Causa:', result);
      if (result.success && result.data) {
        // Normalizar nomes: se conter "Outros - ", mostrar apenas "Outros"
        const normalizedData = result.data.map(item => ({
          ...item,
          causa: item.causa?.toLowerCase().includes('outros -') ? 'Outros' : item.causa
        }));
        setCausaData(normalizedData);
      }
      else setCausaData([]);
    } catch (error) {
      console.error('[DashboardHanaro] Erro ao carregar por causa:', error);
      setCausaData([]);
    } finally {
      setLoadingCausa(false);
    }
  };

  // Função para carregar dados por linha (TODOS os filtros aplicados - comportamento Excel)
  const loadDashboardPorLinha = async () => {
    try {
      setLoadingLinha(true);
      const url = buildFiltersUrl(`${API_URL}/api/hanaro-dashboard-por-linha`);
      const response = await fetch(url);
      const result = await response.json();
      console.log('[DashboardHanaro] Linha:', result);
      if (result.success && result.data) setLinhaData(result.data);
      else setLinhaData([]);
    } catch (error) {
      console.error('[DashboardHanaro] Erro ao carregar por linha:', error);
      setLinhaData([]);
    } finally {
      setLoadingLinha(false);
    }
  };

  // Função para carregar dados por fase (TODOS os filtros aplicados - comportamento Excel)
  const loadDashboardPorFase = async () => {
    try {
      setLoadingFase(true);
      const url = buildFiltersUrl(`${API_URL}/api/hanaro-dashboard-por-fase`);
      const response = await fetch(url);
      const result = await response.json();
      console.log('[DashboardHanaro] Fase:', result);
      if (result.success && result.data) setFaseData(result.data);
      else setFaseData([]);
    } catch (error) {
      console.error('[DashboardHanaro] Erro ao carregar por fase:', error);
      setFaseData([]);
    } finally {
      setLoadingFase(false);
    }
  };

  // Função para carregar dados por turno (TODOS os filtros aplicados - comportamento Excel)
  const loadDashboardPorTurno = async () => {
    try {
      setLoadingTurno(true);
      const url = buildFiltersUrl(`${API_URL}/api/hanaro-dashboard-por-turno`);
      const response = await fetch(url);
      const result = await response.json();
      console.log('[DashboardHanaro] Turno:', result);
      if (result.success && result.data) setTurnoData(result.data);
      else setTurnoData([]);
    } catch (error) {
      console.error('[DashboardHanaro] Erro ao carregar por turno:', error);
      setTurnoData([]);
    } finally {
      setLoadingTurno(false);
    }
  };

  // Função para carregar dados por responsável (TODOS os filtros aplicados - comportamento Excel)
  const loadDashboardPorResponsavel = async () => {
    try {
      setLoadingResponsavel(true);
      const url = buildFiltersUrl(`${API_URL}/api/hanaro-dashboard-por-responsavel`);
      const response = await fetch(url);
      const result = await response.json();
      console.log('[DashboardHanaro] Responsavel:', result);
      if (result.success && result.data) setResponsavelData(result.data);
      else setResponsavelData([]);
    } catch (error) {
      console.error('[DashboardHanaro] Erro ao carregar por responsável:', error);
      setResponsavelData([]);
    } finally {
      setLoadingResponsavel(false);
    }
  };

  // Função para carregar dados por tipo de scrap (TODOS os filtros aplicados - comportamento Excel)
  const loadDashboardPorTipoScrap = async () => {
    try {
      setLoadingTipoScrap(true);
      const url = buildFiltersUrl(`${API_URL}/api/hanaro-dashboard-por-tipo-scrap`);
      const response = await fetch(url);
      const result = await response.json();
      console.log('[DashboardHanaro] TipoScrap:', result);
      if (result.success && result.data) setTipoScrapData(result.data);
      else setTipoScrapData([]);
    } catch (error) {
      console.error('[DashboardHanaro] Erro ao carregar por tipo scrap:', error);
      setTipoScrapData([]);
    } finally {
      setLoadingTipoScrap(false);
    }
  };

  // Função para calcular número da semana ISO (1-53)
  const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
  };

  // Função para agrupar dados por período (diário, semanal, mensal, anual)
  // O backend já retorna dados filtrados pelo dateRange, aqui apenas agrupamos
  const agruparDadosPorPeriodo = (dados, tipo) => {
    if (!dados || dados.length === 0) {
      return [];
    }
    
    const agrupados = {};
    
    // Obter ano atual para datas sem ano (formato DD/MM)
    const anoAtual = new Date().getFullYear();
    
    dados.forEach(item => {
      let dataStr = item.periodo || item.data || '';
      let data;
      
      // Formato DD/MM (backend retorna assim: "01/04", "15/04", etc.)
      if (dataStr.includes('/') && !dataStr.includes('/' + (anoAtual.toString().slice(-2)))) {
        const parts = dataStr.split('/');
        const dia = parseInt(parts[0]);
        const mes = parseInt(parts[1]) - 1; // Meses em JS começam do 0
        // Usar ano do dateRange se disponível, senão ano atual
        const ano = dateRange[0]?.$d ? dateRange[0].$d.getFullYear() : anoAtual;
        data = new Date(Date.UTC(ano, mes, dia, 0, 0, 0));
      }
      // Formato DD/MM/AA
      else if (dataStr.includes('/') && dataStr.length === 8) {
        const parts = dataStr.split('/');
        const dia = parseInt(parts[0]);
        const mes = parseInt(parts[1]) - 1;
        const ano = 2000 + parseInt(parts[2]);
        data = new Date(Date.UTC(ano, mes, dia, 0, 0, 0));
      }
      // Formato YYYY-MM-DD
      else if (dataStr.includes('-')) {
        const parts = dataStr.split('-');
        data = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 0, 0, 0));
      }
      // Formato DD/MM/YYYY
      else if (dataStr.includes('/') && dataStr.length === 10) {
        const parts = dataStr.split('/');
        data = new Date(Date.UTC(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]), 0, 0, 0));
      }
      else {
        data = new Date(dataStr);
      }
      
      if (isNaN(data.getTime())) {
        console.warn('[agruparDadosPorPeriodo] Data inválida:', dataStr);
        return;
      }
      
      let chave = '';
      let ordem = data.getTime();
      
      if (tipo === 'diario') {
        // DIÁRIO: Mostra CADA DIA - usa o próprio dataStr do backend
        chave = dataStr;
        ordem = data.getTime();
        
      } else if (tipo === 'semanal') {
        // SEMANAL: Agrupa por semana ISO
        const semana = getWeekNumber(data);
        const ano = data.getUTCFullYear();
        chave = `W${semana}/${String(ano).slice(-2)}`;
        const diaSemana = data.getUTCDay() || 7;
        const segundaFeira = new Date(data);
        segundaFeira.setUTCDate(data.getUTCDate() - diaSemana + 1);
        ordem = segundaFeira.getTime();
        
      } else if (tipo === 'mensal') {
        // MENSAL: Agrupa por MÊS
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const mes = meses[data.getUTCMonth()];
        const ano = data.getUTCFullYear();
        chave = `${mes}/${String(ano).slice(-2)}`;
        ordem = data.getTime();
        
      } else if (tipo === 'anual') {
        // ANUAL: Agrupa por ano
        chave = data.getUTCFullYear().toString();
        ordem = data.getTime();
      }
      
      if (!agrupados[chave]) {
        agrupados[chave] = { periodo: chave, custo: 0, qty: 0, ordem: ordem };
      }
      agrupados[chave].custo += Number(item.custo) || 0;
      agrupados[chave].qty += Number(item.qty) || 0;
    });
    
    // Converter para array e ordenar cronologicamente
    return Object.values(agrupados).sort((a, b) => a.ordem - b.ordem).map(({ ordem, ...rest }) => rest);
  };

  // Função para carregar dados por PERÍODO (Custo + Qty) - Gráfico estilo STOCKS
  const loadDashboardPorPeriodo = async () => {
    try {
      setLoadingPeriodo(true);
      const url = buildFiltersUrl(`${API_URL}/api/hanaro-dashboard-por-periodo`);
      console.log('[DashboardHanaro] URL da requisição:', url);
      
      const response = await fetch(url);
      console.log('[DashboardHanaro] Status da resposta:', response.status);
      
      const result = await response.json();
      console.log('[DashboardHanaro] Resultado completo:', JSON.stringify(result, null, 2));
      
      if (result.success && result.data && result.data.length > 0) {
        // Transformar dados para formato do gráfico
        const rawData = result.data.map(item => {
          const valor = item.totalValor || item.total_valor || 0;
          const qtd = item.totalQtd || item.total_qtd || 0;
          return {
            periodo: item.periodo || item.data || 'N/A',
            custo: Number(valor) || 0,
            qty: Number(qtd) || 0
          };
        });
        console.log('[DashboardHanaro] Dados brutos transformados:', rawData);
        
        // Agrupar dados conforme filtro de período selecionado
        const dadosAgrupados = agruparDadosPorPeriodo(rawData, periodoFilter);
        console.log('[DashboardHanaro] Dados agrupados (' + periodoFilter + '):', dadosAgrupados);
        setPeriodoData(dadosAgrupados);
      } else {
        console.warn('[DashboardHanaro] Sem dados no resultado:', result);
        setPeriodoData([]);
      }
    } catch (error) {
      console.error('[DashboardHanaro] Erro ao carregar por período:', error);
      setPeriodoData([]);
    } finally {
      setLoadingPeriodo(false);
    }
  };

  // Carregar dados do dashboard quando filtros mudarem
  useEffect(() => {
    loadDashboardData();
    loadDashboardPorModelo();
    loadDashboardPorOrigem();
    loadDashboardPorEquipamento();
    loadDashboardPorCausa();
    loadDashboardPorLinha();
    loadDashboardPorFase();
    loadDashboardPorTurno();
    loadDashboardPorResponsavel();
    loadDashboardPorTipoScrap();
    loadDashboardPorPeriodo();
  }, [dateRange?.[0], dateRange?.[1], modeloFilter, origemFilter, equipamentoFilter, causaFilter, linhaFilter, faseFilter, turnoFilter, responsavelFilter, tipoScrapFilter, periodoFilter]);

  // Aplica correcao do calendario
  useCalendarStyleFix();
  
  return (
    <div style={{ padding: '24px 0' }}>
      {/* Container para o popup do datepicker */}
      <div className="hanaro-datepicker-container" style={{ position: 'relative' }}>
      
      {/* Filtros */}
      <div 
        style={{
          background: '#fff',
          border: '1px solid #d0d7de',
          borderRadius: 12,
          padding: filtrosExpandidos ? 20 : 12,
          marginBottom: 24,
          cursor: !filtrosExpandidos ? 'pointer' : 'default',
          position: 'relative'
        }}
        onClick={() => !filtrosExpandidos && setFiltrosExpandidos(true)}
      >
        {/* Área clicável invisível quando minimizado */}
        {!filtrosExpandidos && (
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1
            }}
            title="Clique para expandir filtros"
          />
        )}
        
        {/* Header dos Filtros com Toggle - clicável para expandir quando minimizado */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: filtrosExpandidos ? 16 : 0,
            position: 'relative',
            zIndex: 2
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={18} color="#0969da" />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1f2328' }}>Filtros</span>
            {!filtrosExpandidos && (
              <span style={{ fontSize: 11, color: '#656d76', background: '#f6f8fa', padding: '2px 8px', borderRadius: 10 }}>
                {dateRange[0] && dateRange[1] ? `${formatDate(dateRange[0])} até ${formatDate(dateRange[1])}` : 'Hoje'}
                {modeloFilter && ` • Modelo: ${modeloFilter}`}
                {origemFilter && ` • Origem: ${origemFilter}`}
                {linhaFilter && ` • Linha: ${linhaFilter}`}
              </span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFiltrosExpandidos(!filtrosExpandidos);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '6px',
              background: '#f6f8fa',
              border: '1px solid #d0d7de',
              borderRadius: 6,
              color: '#1f2328',
              cursor: 'pointer'
            }}
            title={filtrosExpandidos ? 'Minimizar filtros' : 'Maximizar filtros'}
          >
            {filtrosExpandidos ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
        
        {filtrosExpandidos && (
          <>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
              gap: 12 
            }}>
              {/* Date Range Picker - Ant Design com Presets */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: 11, 
                  fontWeight: 500, 
                  color: '#656d76', 
                  marginBottom: 4 
                }}>
                  <Filter size={10} style={{ display: 'inline', marginRight: 4 }} />
                  Período
                </label>
                <ConfigProvider 
                  locale={ptBR}
                  theme={{
                    components: {
                      Picker: {
                        cellBgColor: '#ffffff',
                        cellHoverBgColor: '#f6f8fa',
                        panelBg: '#ffffff',
                      }
                    }
                  }}
                >
                  <RangePicker
                    className="hanaro-datepicker"
                    value={dateRange}
                    onChange={(dates) => {
                      if (!dates || !dates[0] || !dates[1]) {
                        setDateRange([hoje, hoje]);
                      } else {
                        setDateRange(dates);
                      }
                    }}
                    presets={presets}
                    style={{ width: '100%', fontSize: 12 }}
                    format="DD/MM/YYYY"
                    getPopupContainer={() => document.querySelector('.hanaro-datepicker-container') || document.body}
                  />
                </ConfigProvider>
              </div>
              
              {/* Modelo */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#656d76', marginBottom: 4 }}>Modelo</label>
                <select value={modeloFilter} onChange={(e) => setModeloFilter(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #d0d7de', borderRadius: 6, fontSize: 12, boxSizing: 'border-box', backgroundColor: '#fff' }}>
                  <option value="">Todos</option>
                  {modelosDisponiveis.map((m, idx) => (<option key={idx} value={m.modelo}>{m.modelo}</option>))}
                </select>
              </div>
              
              {/* Origem */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#656d76', marginBottom: 4 }}>Origem</label>
                <select value={origemFilter} onChange={(e) => setOrigemFilter(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #d0d7de', borderRadius: 6, fontSize: 12, boxSizing: 'border-box', backgroundColor: '#fff' }}>
                  <option value="">Todas</option>
                  {origensDisponiveis.map((o, idx) => (<option key={idx} value={o.origem}>{o.origem}</option>))}
                </select>
              </div>
              
              {/* Equipamento */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#656d76', marginBottom: 4 }}>Equipamento</label>
                <select value={equipamentoFilter} onChange={(e) => setEquipamentoFilter(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #d0d7de', borderRadius: 6, fontSize: 12, boxSizing: 'border-box', backgroundColor: '#fff' }}>
                  <option value="">Todos</option>
                  {equipamentosDisponiveis.map((eq, idx) => (<option key={idx} value={eq.equipamento}>{eq.equipamento}</option>))}
                </select>
              </div>
              
              {/* Causa */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#656d76', marginBottom: 4 }}>Causa</label>
                <select value={causaFilter} onChange={(e) => setCausaFilter(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #d0d7de', borderRadius: 6, fontSize: 12, boxSizing: 'border-box', backgroundColor: '#fff' }}>
                  <option value="">Todas</option>
                  {causasDisponiveis.map((c, idx) => (<option key={idx} value={c.causa}>{c.causa}</option>))}
                </select>
              </div>
              
              {/* Linha */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#656d76', marginBottom: 4 }}>Linha</label>
                <select value={linhaFilter} onChange={(e) => setLinhaFilter(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #d0d7de', borderRadius: 6, fontSize: 12, boxSizing: 'border-box', backgroundColor: '#fff' }}>
                  <option value="">Todas</option>
                  {linhasDisponiveis.map((l, idx) => (<option key={idx} value={l.linha}>{l.linha}</option>))}
                </select>
              </div>
              
              {/* Fase */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#656d76', marginBottom: 4 }}>Fase</label>
                <select value={faseFilter} onChange={(e) => setFaseFilter(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #d0d7de', borderRadius: 6, fontSize: 12, boxSizing: 'border-box', backgroundColor: '#fff' }}>
                  <option value="">Todas</option>
                  {fasesDisponiveis.map((f, idx) => (<option key={idx} value={f.fase}>{f.fase}</option>))}
                </select>
              </div>
              
              {/* Turno */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#656d76', marginBottom: 4 }}>Turno</label>
                <select value={turnoFilter} onChange={(e) => setTurnoFilter(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #d0d7de', borderRadius: 6, fontSize: 12, boxSizing: 'border-box', backgroundColor: '#fff' }}>
                  <option value="">Todos</option>
                  {turnosDisponiveis.map((t, idx) => (<option key={idx} value={t.turno}>{t.turno}</option>))}
                </select>
              </div>
              
              {/* Responsável */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#656d76', marginBottom: 4 }}>Responsável</label>
                <select value={responsavelFilter} onChange={(e) => setResponsavelFilter(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #d0d7de', borderRadius: 6, fontSize: 12, boxSizing: 'border-box', backgroundColor: '#fff' }}>
                  <option value="">Todos</option>
                  {responsaveisDisponiveis.map((r, idx) => (<option key={idx} value={r.responsavel}>{r.responsavel}</option>))}
                </select>
              </div>
              
              {/* Tipo Scrap */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#656d76', marginBottom: 4 }}>Tipo Scrap</label>
                <select value={tipoScrapFilter} onChange={(e) => setTipoScrapFilter(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #d0d7de', borderRadius: 6, fontSize: 12, boxSizing: 'border-box', backgroundColor: '#fff' }}>
                  <option value="">Todos</option>
                  {tipoScrapDisponiveis.map((ts, idx) => (<option key={idx} value={ts.tipo_scrap}>{ts.tipo_scrap}</option>))}
                </select>
              </div>
            </div>
            
            {/* Botão Limpar Filtros */}
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button
                onClick={() => {
                  const hoje = dayjs();
                  setDateRange([hoje, hoje]);
                  setModeloFilter('');
                  setOrigemFilter('');
                  setEquipamentoFilter('');
                  setCausaFilter('');
                  setLinhaFilter('');
                  setFaseFilter('');
                  setTurnoFilter('');
                  setResponsavelFilter('');
                  setTipoScrapFilter('');
                }}
                style={{
                  padding: '8px 16px',
                  background: '#f6f8fa',
                  border: '1px solid #d0d7de',
                  borderRadius: 6,
                  color: '#1f2328',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Limpar Todos Filtros
              </button>
            </div>
          </>
        )}
      </div>

      {/* Modal de Gráfico Expandido - Renderizado separadamente */}
      {expandedCharts.periodo && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
          onClick={() => toggleChartExpand('periodo')}
        >
          <div 
            style={{
              background: '#fff',
              border: '1px solid #d0d7de',
              borderRadius: 12,
              padding: 24,
              width: 'calc(100vw - 100px)',
              height: 'calc(100vh - 150px)',
              maxWidth: '95vw',
              maxHeight: '95vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do modal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AreaChartIcon size={20} color="#0ea5e9" />
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1f2328' }}>Evolução por Período - Visão Expandida</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {/* Seletor de Período */}
                <div style={{ display: 'flex', gap: 4 }}>
                  {[
                    { value: 'diario', label: 'Diário' },
                    { value: 'semanal', label: 'Semanal' },
                    { value: 'mensal', label: 'Mensal' },
                    { value: 'anual', label: 'Anual' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setPeriodoFilter(opt.value)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: `1px solid ${periodoFilter === opt.value ? '#0969da' : '#d0d7de'}`,
                        background: periodoFilter === opt.value ? '#0969da' : '#fff',
                        color: periodoFilter === opt.value ? '#fff' : '#656d76',
                        fontSize: 12,
                        fontWeight: periodoFilter === opt.value ? 600 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                
                {/* Botão Fechar */}
                <button
                  onClick={() => toggleChartExpand('periodo')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    border: '1px solid #d0d7de',
                    background: '#f6f8fa',
                    color: '#1f2328',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    marginLeft: 8
                  }}
                >
                  <Minimize2 size={18} />
                </button>
              </div>
            </div>
            
            {/* Contador de períodos */}
            {periodoData.length > 0 && (
              <div style={{ marginBottom: 12, flexShrink: 0 }}>
                <span style={{ fontSize: 12, color: '#656d76', background: '#f6f8fa', padding: '4px 12px', borderRadius: 12, fontWeight: 600 }}>
                  📊 {periodoData.length} {periodoFilter === 'diario' ? 'dias' : periodoFilter === 'semanal' ? 'semanas' : periodoFilter === 'mensal' ? 'meses' : 'anos'} no período
                </span>
              </div>
            )}
            
            {/* Gráfico - ocupa todo espaço restante */}
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              {loadingPeriodo ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#656d76', fontSize: 14 }}>
                  <div style={{ animation: 'spin 1s linear infinite', marginRight: 8 }}>
                    <RefreshCw size={20} />
                  </div>
                  Carregando dados...
                </div>
              ) : periodoData.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9198a1', fontSize: 14 }}>
                  Sem dados para exibir
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={periodoData} margin={{ top: 25, right: 30, left: 0, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorCustoExpanded" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.15}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="periodo" 
                      angle={-45} 
                      textAnchor="end" 
                      interval={0} 
                      height={60} 
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => value.length > 8 ? value.substring(0, 8) + '...' : value}
                    />
                    <YAxis 
                      yAxisId="left" 
                      tick={{ fontSize: 11, fill: '#ef4444' }} 
                      label={{ value: 'Custo (R$)', angle: -90, position: 'insideLeft', fill: '#ef4444', fontSize: 12 }} 
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      tick={{ fontSize: 11, fill: '#2563eb' }} 
                      label={{ value: 'Quantidade', angle: 90, position: 'insideRight', fill: '#2563eb', fontSize: 12 }} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: 8, 
                        border: '1px solid #d0d7de', 
                        fontSize: 13,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        background: '#fff'
                      }}
                      formatter={(value, name) => {
                        if (name === 'custo') return [`R$ ${value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Custo Scrap'];
                        return [`${value} un`, 'Qtd'];
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    
                    {/* Área de custo - VERMELHO com rótulos */}
                    <Area 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="custo" 
                      stroke="#dc2626" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorCustoExpanded)"
                      name="Custo Scrap"
                      label={{
                        position: 'top',
                        dy: -10,
                        fill: '#991b1b',
                        fontSize: 11,
                        fontWeight: 700,
                        formatter: (value) => {
                          return `R$ ${value?.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                        }
                      }}
                    />
                    {/* Barras de quantidade - AZUL com rótulos */}
                    <Bar 
                      yAxisId="right" 
                      dataKey="qty" 
                      fill="#2563eb" 
                      opacity={0.85} 
                      radius={[4, 4, 0, 0]} 
                      barSize={35}
                      name="Quantidade"
                      label={{
                        position: 'top',
                        dy: 15,
                        fill: '#ffffff',
                        fontSize: 11,
                        fontWeight: 700,
                        formatter: (value) => value
                      }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grid: Total do Período + Gráfico de Evolução */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '400px 1fr',
        gap: 20,
        marginBottom: 24
      }}>
        {/* Card de Total do Período */}
        <div style={{
          background: '#fff',
          border: '1px solid #d0d7de',
          borderRadius: 12,
          padding: 24,
          height: 'fit-content'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <BarChart3 size={18} color="#0969da" />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1f2328' }}>Total do Período</span>
          </div>
          
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ 
              fontSize: 36, 
              fontWeight: 800, 
              color: data.totalValor > 0 ? '#ef4444' : '#656d76',
              fontFamily: "'DM Mono', monospace",
              marginBottom: 8
            }}>
              {data.totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div style={{ fontSize: 14, color: '#656d76', marginBottom: 16 }}>
              {data.totalRegistros} registros | {data.totalQtd} scraps
            </div>
            <div style={{ fontSize: 12, color: '#9198a1' }}>
              {dateRange[0] && dateRange[1] ? `${formatDate(dateRange[0])} até ${formatDate(dateRange[1])}` : 'Data: -'}
            </div>
          </div>
        </div>

        {/* GRÁFICO 10: PERÍODO POR CUSTO - Estilo STOCKS (Area + Bar) */}
        <div style={{
          background: '#fff',
          border: '1px solid #d0d7de',
          borderRadius: 12,
          padding: expandedCharts.periodo ? 24 : 16,
          position: expandedCharts.periodo ? 'fixed' : 'relative',
          top: expandedCharts.periodo ? '50%' : 'auto',
          left: expandedCharts.periodo ? '50%' : 'auto',
          transform: expandedCharts.periodo ? 'translate(-50%, -50%)' : 'none',
          width: expandedCharts.periodo ? 'calc(100vw - 100px)' : 'auto',
          maxWidth: expandedCharts.periodo ? 'calc(100vw - 100px)' : 'none',
          height: expandedCharts.periodo ? 'calc(100vh - 200px)' : 'auto',
          minHeight: expandedCharts.periodo ? '500px' : 'auto',
          zIndex: 1000,
          boxShadow: expandedCharts.periodo ? '0 20px 60px rgba(0,0,0,0.3)' : 'none',
          overflow: 'visible'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AreaChartIcon size={16} color="#0ea5e9" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1f2328' }}>Evolução por Período</span>
              {periodoData.length > 0 && (
                <span style={{ fontSize: 10, color: '#656d76', background: '#f6f8fa', padding: '2px 6px', borderRadius: 10 }}>
                  {periodoData.length} {periodoFilter === 'diario' ? 'dias' : periodoFilter === 'semanal' ? 'semanas' : periodoFilter === 'mensal' ? 'meses' : 'anos'}
                </span>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {/* Seletor de Período */}
              <div style={{ display: 'flex', gap: 4 }}>
                {[
                  { value: 'diario', label: 'Diário' },
                  { value: 'semanal', label: 'Semanal' },
                  { value: 'mensal', label: 'Mensal' },
                  { value: 'anual', label: 'Anual' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setPeriodoFilter(opt.value)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 5,
                      border: `1px solid ${periodoFilter === opt.value ? '#0969da' : '#d0d7de'}`,
                      background: periodoFilter === opt.value ? '#0969da' : '#fff',
                      color: periodoFilter === opt.value ? '#fff' : '#656d76',
                      fontSize: 10,
                      fontWeight: periodoFilter === opt.value ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              
              {/* Botão Expandir/Minimizar */}
              <button
                onClick={() => toggleChartExpand('periodo')}
                title={expandedCharts.periodo ? 'Minimizar' : 'Expandir'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: '1px solid #d0d7de',
                  background: expandedCharts.periodo ? '#0969da' : '#f6f8fa',
                  color: expandedCharts.periodo ? '#fff' : '#656d76',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginLeft: 8
                }}
              >
                {expandedCharts.periodo ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </div>
          {loadingPeriodo ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#656d76', fontSize: 12 }}>Carregando...</div>
          ) : periodoData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9198a1', fontSize: 12 }}>Sem dados</div>
          ) : (
            <ResponsiveContainer width="100%" height={expandedCharts.periodo ? 'calc(100vh - 280px)' : 200}>
              <ComposedChart data={periodoData} margin={{ top: 25, right: 10, left: -20, bottom: -45 }}>
                <defs>
                  <linearGradient id="colorCusto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.15}/>
                  </linearGradient>
                  {/* Filtro de sombra para o label do custo */}
                  <filter id="shadowCusto" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.3"/>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="periodo" angle={-45} textAnchor="end" interval={0} height={80} tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#ef4444' }} label={{ value: 'Custo Scrap (R$)', angle: -90, position: 'insideLeft', fill: '#ef4444', fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#273A8C' }} label={{ value: 'Quantidade', angle: 90, position: 'insideRight', fill: '#273A8C', fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: 8, border: '1px solid #d0d7de', fontSize: 12 }}
                  formatter={(value, name) => {
                    if (name === 'custo') return [`R$ ${value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Custo Scrap'];
                    return [`${value} un`, 'Qtd'];
                  }}
                />
              
                {/* Área/linha de custo SCRAP (fundo) - VERMELHO */}
                <Area yAxisId="left" type="monotone" dataKey="custo" stroke="#dc2626" strokeWidth={3} fillOpacity={1} fill="url(#colorCusto)" 
                  label={{ 
                    position: 'top',
                    dy: -12,
                    fill: '#991b1b',
                    fontSize: 12,
                    fontWeight: 800,
                    formatter: (value, entry, index) => {
                      const barQty = periodoData[index]?.qty || 0;
                      const isBothLow = value < 5000 && barQty < 30;
                      return `R$ ${value?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    }
                  }}
                />
                {/* Barras de quantidade (frente) - AZUL FORTE */}
                <Bar yAxisId="right" dataKey="qty" fill="#2563eb" opacity={0.9} radius={[4, 4, 0, 0]} barSize={30} 
                  label={{
                    position: 'top',
                    dy: 18,
                    fill: '#ffffff',
                    fontSize: 11,
                    fontWeight: 700
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Grid de Gráficos - 2 colunas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
        gap: 20
      }}>
        
        {/* GRÁFICO 1: MODELO - Barras Verticais com Rótulos */}
        <div style={{
          background: '#fff',
          border: '1px solid #d0d7de',
          borderRadius: 12,
          padding: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <BarChart3 size={16} color="#0969da" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1f2328' }}>Por Modelo</span>
            {modeloData.length > 5 && (
              <span style={{ fontSize: 10, color: '#656d76', background: '#f6f8fa', padding: '2px 6px', borderRadius: 10 }}>
                {modeloData.length}
              </span>
            )}
          </div>
          {loadingModelo ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#656d76', fontSize: 12 }}>Carregando...</div>
          ) : modeloData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9198a1', fontSize: 12 }}>Sem dados</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={modeloData.slice(0, 10)} margin={{ top: 20, right: 10, left: -20, bottom: -1 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="modelo" angle={-45} textAnchor="end" interval={0} height={80} tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div style={{ 
                          background: '#fff', 
                          border: '1px solid #d0d7de', 
                          borderRadius: 8, 
                          padding: 12,
                          fontSize: 12,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                          <strong style={{ display: 'block', marginBottom: 8 }}>{label}</strong>
                          <div style={{ color: '#0969da', marginBottom: 4 }}>Qty: {data.totalQtd} unidades</div>
                          <div style={{ color: '#16a34a', fontWeight: 600 }}>Custo: R$ {(data.totalValor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="totalQtd" fill="#0969da" radius={[6, 6, 0, 0]} label={{ position: 'top', fontSize: 11, fill: '#1f2328', fontWeight: 600 }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* GRÁFICO 2: ORIGEM - Pizza/Doughnut */}
        <div style={{
          background: '#fff',
          border: '1px solid #d0d7de',
          borderRadius: 12,
          padding: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <PieChartIcon size={16} color="#16a34a" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1f2328' }}>Por Origem</span>
            {origemData.length > 5 && (
              <span style={{ fontSize: 10, color: '#656d76', background: '#f6f8fa', padding: '2px 6px', borderRadius: 10 }}>
                {origemData.length}
              </span>
            )}
          </div>
          {loadingOrigem ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#656d76', fontSize: 12 }}>Carregando...</div>
          ) : origemData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9198a1', fontSize: 12 }}>Sem dados</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={origemData.slice(0, 8)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="totalQtd"
                  nameKey="origem"
                  label={({ origem, percent }) => `${origem} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ fontSize: 10 }}
                >
                  {origemData.slice(0, 8).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7', '#f0fdf4', '#fef2f2'][index % 8]} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div style={{ 
                          background: '#fff', 
                          border: '1px solid #d0d7de', 
                          borderRadius: 8, 
                          padding: 12,
                          fontSize: 12,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                          <strong style={{ display: 'block', marginBottom: 8 }}>{data.origem || label}</strong>
                          <div style={{ color: '#16a34a', marginBottom: 4 }}>Qty: {data.totalQtd} unidades</div>
                          <div style={{ color: '#16a34a', fontWeight: 600 }}>Custo: R$ {(data.totalValor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* GRÁFICO 3: EQUIPAMENTO - Barras Verticais com Rótulos */}
        <div style={{
          background: '#fff',
          border: '1px solid #d0d7de',
          borderRadius: 12,
          padding: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <BarChart3 size={16} color="#7c3aed" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1f2328' }}>Por Equipamento</span>
            {equipamentoData.length > 5 && (
              <span style={{ fontSize: 10, color: '#656d76', background: '#f6f8fa', padding: '2px 6px', borderRadius: 10 }}>
                {equipamentoData.length}
              </span>
            )}
          </div>
          {loadingEquipamento ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#656d76', fontSize: 12 }}>Carregando...</div>
          ) : equipamentoData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9198a1', fontSize: 12 }}>Sem dados</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={equipamentoData.slice(0, 10)} margin={{ top: 20, right: 10, left: -20, bottom: -1 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="equipamento" angle={-45} textAnchor="end" interval={0} height={80} tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div style={{ 
                          background: '#fff', 
                          border: '1px solid #d0d7de', 
                          borderRadius: 8, 
                          padding: 12,
                          fontSize: 12,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                          <strong style={{ display: 'block', marginBottom: 8 }}>{label}</strong>
                          <div style={{ color: '#7c3aed', marginBottom: 4 }}>Qty: {data.totalQtd} unidades</div>
                          <div style={{ color: '#16a34a', fontWeight: 600 }}>Custo: R$ {(data.totalValor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="totalQtd" fill="#7c3aed" radius={[6, 6, 0, 0]} label={{ position: 'top', fontSize: 11, fill: '#1f2328', fontWeight: 600 }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* GRÁFICO 4: CAUSA - Barras Verticais com Rótulos */}
        <div style={{
          background: '#fff',
          border: '1px solid #d0d7de',
          borderRadius: 12,
          padding: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <BarChart3 size={16} color="#ec4899" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1f2328' }}>Por Causa</span>
            {causaData.length > 5 && (
              <span style={{ fontSize: 10, color: '#656d76', background: '#f6f8fa', padding: '2px 6px', borderRadius: 10 }}>
                {causaData.length}
              </span>
            )}
          </div>
          {loadingCausa ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#656d76', fontSize: 12 }}>Carregando...</div>
          ) : causaData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9198a1', fontSize: 12 }}>Sem dados</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={causaData.slice(0, 10)} margin={{ top: 20, right: 10, left: -20, bottom: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="causa" angle={-45} textAnchor="end" interval={0} height={80} tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div style={{ 
                          background: '#fff', 
                          border: '1px solid #d0d7de', 
                          borderRadius: 8, 
                          padding: 12,
                          fontSize: 12,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                          <strong style={{ display: 'block', marginBottom: 8 }}>{label}</strong>
                          <div style={{ color: '#ec4899', marginBottom: 4 }}>Qty: {data.totalQtd} unidades</div>
                          <div style={{ color: '#16a34a', fontWeight: 600 }}>Custo: R$ {(data.totalValor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="totalQtd" fill="#ec4899" radius={[6, 6, 0, 0]} label={{ position: 'top', fontSize: 11, fill: '#1f2328', fontWeight: 600 }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* GRÁFICO 5: LINHA - Barras Verticais com Rótulos */}
        <div style={{
          background: '#fff',
          border: '1px solid #d0d7de',
          borderRadius: 12,
          padding: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <BarChart3 size={16} color="#f59e0b" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1f2328' }}>Por Linha</span>
            {linhaData.length > 5 && (
              <span style={{ fontSize: 10, color: '#656d76', background: '#f6f8fa', padding: '2px 6px', borderRadius: 10 }}>
                {linhaData.length}
              </span>
            )}
          </div>
          {loadingLinha ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#656d76', fontSize: 12 }}>Carregando...</div>
          ) : linhaData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9198a1', fontSize: 12 }}>Sem dados</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={linhaData.slice(0, 10)} margin={{ top: 20, right: 10, left: -20, bottom: -30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="linha" angle={-45} textAnchor="end" interval={0} height={80} tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div style={{ 
                          background: '#fff', 
                          border: '1px solid #d0d7de', 
                          borderRadius: 8, 
                          padding: 12,
                          fontSize: 12,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                          <strong style={{ display: 'block', marginBottom: 8 }}>{label}</strong>
                          <div style={{ color: '#f59e0b', marginBottom: 4 }}>Qty: {data.totalQtd} unidades</div>
                          <div style={{ color: '#16a34a', fontWeight: 600 }}>Custo: R$ {(data.totalValor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="totalQtd" fill="#f59e0b" radius={[6, 6, 0, 0]} label={{ position: 'top', fontSize: 11, fill: '#1f2328', fontWeight: 600 }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* GRÁFICO 6: FASE - Doughnut com Custo */}
        <div style={{
          background: '#fff',
          border: '1px solid #d0d7de',
          borderRadius: 12,
          padding: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <PieChartIcon size={16} color="#06b6d4" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1f2328' }}>Por Fase</span>
            {faseData.length > 5 && (
              <span style={{ fontSize: 10, color: '#656d76', background: '#f6f8fa', padding: '2px 6px', borderRadius: 10 }}>
                {faseData.length}
              </span>
            )}
          </div>
          {loadingFase ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#656d76', fontSize: 12 }}>Carregando...</div>
          ) : faseData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9198a1', fontSize: 12 }}>Sem dados</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={faseData.slice(0, 8)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="totalQtd"
                  nameKey="fase"
                  label={({ fase, percent }) => `${fase} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ fontSize: 10 }}
                >
                  {faseData.slice(0, 8).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63', '#67e8f9', '#a5f3fc', '#cffafe'][index % 8]} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div style={{ 
                          background: '#fff', 
                          border: '1px solid #d0d7de', 
                          borderRadius: 8, 
                          padding: 12,
                          fontSize: 12,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                          <strong style={{ display: 'block', marginBottom: 8 }}>{data.fase || label}</strong>
                          <div style={{ color: '#06b6d4', marginBottom: 4 }}>Qty: {data.totalQtd} unidades</div>
                          <div style={{ color: '#16a34a', fontWeight: 600 }}>Custo: R$ {(data.totalValor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* GRÁFICO 7: TURNO - Doughnut com Custo */}
        <div style={{
          background: '#fff',
          border: '1px solid #d0d7de',
          borderRadius: 12,
          padding: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <PieChartIcon size={16} color="#84cc16" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1f2328' }}>Por Turno</span>
            {turnoData.length > 5 && (
              <span style={{ fontSize: 10, color: '#656d76', background: '#f6f8fa', padding: '2px 6px', borderRadius: 10 }}>
                {turnoData.length}
              </span>
            )}
          </div>
          {loadingTurno ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#656d76', fontSize: 12 }}>Carregando...</div>
          ) : turnoData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9198a1', fontSize: 12 }}>Sem dados</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={turnoData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="totalQtd"
                  nameKey="turno"
                  label={({ turno, percent }) => `${turno} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ fontSize: 10 }}
                >
                  {turnoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#84cc16', '#a3e635', '#bef264', '#dcfce7'][index % 4]} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div style={{ 
                          background: '#fff', 
                          border: '1px solid #d0d7de', 
                          borderRadius: 8, 
                          padding: 12,
                          fontSize: 12,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                          <strong style={{ display: 'block', marginBottom: 8 }}>{data.turno || label}</strong>
                          <div style={{ color: '#84cc16', marginBottom: 4 }}>Qty: {data.totalQtd} unidades</div>
                          <div style={{ color: '#16a34a', fontWeight: 600 }}>Custo: R$ {(data.totalValor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* GRÁFICO 8: RESPONSÁVEL - Barras Verticais com Custo */}
        <div style={{
          background: '#fff',
          border: '1px solid #d0d7de',
          borderRadius: 12,
          padding: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <BarChart3 size={16} color="#a855f7" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1f2328' }}>Por Responsável</span>
            {responsavelData.length > 5 && (
              <span style={{ fontSize: 10, color: '#656d76', background: '#f6f8fa', padding: '2px 6px', borderRadius: 10 }}>
                {responsavelData.length}
              </span>
            )}
          </div>
          {loadingResponsavel ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#656d76', fontSize: 12 }}>Carregando...</div>
          ) : responsavelData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9198a1', fontSize: 12 }}>Sem dados</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={responsavelData.slice(0, 10).map(item => ({ ...item, responsavelCurto: truncateName(item.responsavel) }))} margin={{ top: 20, right: 10, left: -20, bottom: -1 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="responsavelCurto" angle={-45} textAnchor="end" interval={0} height={80} tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div style={{ 
                          background: '#fff', 
                          border: '1px solid #d0d7de', 
                          borderRadius: 8, 
                          padding: 12,
                          fontSize: 12,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                          <strong style={{ display: 'block', marginBottom: 8 }}>{label}</strong>
                          <div style={{ color: '#a855f7', marginBottom: 4 }}>Qty: {data.totalQtd} unidades</div>
                          <div style={{ color: '#16a34a', fontWeight: 600 }}>Custo: R$ {(data.totalValor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="totalQtd" fill="#a855f7" radius={[6, 6, 0, 0]} label={{ position: 'top', fontSize: 11, fill: '#1f2328', fontWeight: 600 }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* GRÁFICO 9: TIPO SCRAP - Doughnut com Custo */}
        <div style={{
          background: '#fff',
          border: '1px solid #d0d7de',
          borderRadius: 12,
          padding: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <PieChartIcon size={16} color="#ef4444" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1f2328' }}>Por Tipo Scrap</span>
            {tipoScrapData.length > 5 && (
              <span style={{ fontSize: 10, color: '#656d76', background: '#f6f8fa', padding: '2px 6px', borderRadius: 10 }}>
                {tipoScrapData.length}
              </span>
            )}
          </div>
          {loadingTipoScrap ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#656d76', fontSize: 12 }}>Carregando...</div>
          ) : tipoScrapData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9198a1', fontSize: 12 }}>Sem dados</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={tipoScrapData.slice(0, 8)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="totalQtd"
                  nameKey="tipo_scrap"
                  label={({ tipo_scrap, percent }) => `${tipo_scrap} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ fontSize: 10 }}
                >
                  {tipoScrapData.slice(0, 8).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#ef4444', '#f87171', '#fca5a5', '#fda4af', '#fecaca', '#ffe4e6', '#fee2e2', '#ffb4b4'][index % 8]} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div style={{ 
                          background: '#fff', 
                          border: '1px solid #d0d7de', 
                          borderRadius: 8, 
                          padding: 12,
                          fontSize: 12,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                          <strong style={{ display: 'block', marginBottom: 8 }}>{data.tipo_scrap || label}</strong>
                          <div style={{ color: '#ef4444', marginBottom: 4 }}>Qty: {data.totalQtd} unidades</div>
                          <div style={{ color: '#16a34a', fontWeight: 600 }}>Custo: R$ {(data.totalValor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      {/* Área de Log */}
      {logMessage && (
        <div style={{
          marginTop: 16,
          background: logMessage.includes('❌') ? '#fef2f2' : logMessage.includes('✅') ? '#f0fdf4' : '#f6f8fa',
          border: `1px solid ${logMessage.includes('❌') ? '#fecaca' : logMessage.includes('✅') ? '#bbf7d0' : '#d0d7de'}`,
          borderRadius: 8,
          padding: 12,
          fontSize: 13,
          color: logMessage.includes('❌') ? '#dc2626' : logMessage.includes('✅') ? '#16a34a' : '#1f2328',
          fontFamily: "'DM Mono', monospace",
          wordBreak: 'break-all'
        }}>
          {logMessage}
        </div>
      )}

      </div>
    </div>
  );
};

export default DashboardHanaro;

