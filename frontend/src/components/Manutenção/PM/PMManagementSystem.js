import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PM.css';
import * as FileSaver from "file-saver";
import * as XLSX from "xlsx";

const currentDate = new Date();
const currentMonth = currentDate.getMonth() + 1; // Janeiro = 1
const currentYear = currentDate.getFullYear();

// Ícones SVG como componentes React
const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const AlertTriangleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const UnlockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
  </svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const PMManagementSystem = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showsenhaModal, setShowsenhaModal] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [selectedCell, setSelectedCell] = useState(null);
    const [senhaAction, setsenhaAction] = useState('');
    const [stats, setStats] = useState({
        completed_pms: 0,
        total_pms: 0,
        completion_percentage: 0,
        delayed_pms: 0
    });
    const [pms, setPms] = useState([]);
    const [towerLamps, setTowerLamps] = useState([]);
    const [senha, setsenha] = useState('');
    const [selectedYear, setSelectedYear] = useState(currentYear); // Estado para o ano selecionado
const [viewMode, setViewMode] = useState(() => {
    // Recuperar o modo de visualização do localStorage, se disponível
    const savedViewMode = localStorage.getItem('pmManagementViewMode');
    return savedViewMode || 'pm'; // 'pm' ou 'tower-lamp'
  });

  // Dados das linhas de produção e meses
  const productionLines = [
    'SMD-02', 'SMD-03', 'SMD-04', 'SMD-05', 'SMD-06', 'SMD-07', 'SMD-08', 'SMD-09', 'SMD-10',
    'SMD-11', 'SMD-12', 'SMD-13', 'SMD-14', 'SMD-15', 'SMD-16', 'SMD-17', 'SMD-18', 'SMD-19', 'SMD-20',
    'SMD-37', 'SMD-38'
  ];
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // Equipamentos e itens de manutenção
  const equipmentSections = [
    {
      id: 'reflow',
      name: 'Reflow',
      items: [
        'Limpeza dos sensores',
        'Verificação de temperatura',
        'Calibração das zonas',
        'Limpeza da esteira'
      ]
    },
    {
      id: 'spi',
      name: 'SPI',
      items: [
        'Limpeza das câmeras',
        'Calibração óptica',
        'Verificação do sistema',
        'Atualização de software'
      ]
    },
    {
      id: 'printer',
      name: 'Printer',
      items: [
        'Limpeza da mesa',
        'Verificação de pressão',
        'Alinhamento da tela',
        'Inspeção das lâminas'
      ]
    },
    {
      id: 'pick_place',
      name: 'Pick & Place',
      items: [
        'Calibração dos bicos',
        'Limpeza das câmeras',
        'Verificação dos feeders',
        'Atualização de programas'
      ]
    }
  ];

// Função para buscar estatísticas
  const fetchStats = async (year) => {
    try {
      if (viewMode === 'pm') {
        const response = await axios.get(`http://105.103.39.102:8080/stats?year=${year}`);
        setStats(response.data);
      } else {
        const response = await axios.get(`http://105.103.39.102:8080/tower-lamp-stats?year=${year}`);
        setStats({
          completed_pms: response.data.completed_tower_lamps,
          total_pms: response.data.total_tower_lamps,
          completion_percentage: response.data.completion_percentage,
          delayed_pms: response.data.delayed_tower_lamps
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

const fetchPMs = async (year) => {
    try {
      if (viewMode === 'pm') {
        const response = await axios.get(`http://105.103.39.102:8080/pms?year=${year}`);
        setPms(response.data);
      } else {
        const response = await axios.get(`http://105.103.39.102:8080/tower-lamps?year=${year}`);
        setTowerLamps(response.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

// Função para verificar se o mês é editável
  const isEditable = (month, year) => {
    if (year < selectedYear) return true; // meses passados sempre editáveis
    if (year === selectedYear && month <= currentMonth) return true; // até mês atual
    return isEditing; // meses futuros editáveis apenas no modo de edição
  };

// Função para lidar com clique em célula
  const handleCellClick = (line, month) => {
    const data = viewMode === 'pm' ? pms : towerLamps;
    const item = data.find(p => p.production_line === line && p.month === month);
    
    if (!isEditing) {
      // Se estiver no modo bloqueado e a célula estiver preenchida, mostrar modal de visualização
      if (item) {
        setSelectedCell({ line, month, pm: item });
        setShowViewModal(true);
      }
      return;
    }
    
    // Se estiver no modo de edição, abrir o modal normal
    setSelectedCell({ line, month, pm: item });
    setShowModal(true);
  };

  // Função para desbloquear edição
  const handleUnlock = () => {
    setsenhaAction('unlock');
    setShowsenhaModal(true);
  };

// Função para exportar para Excel
  const handleExport = () => {
    // Preparar os dados para exportação
    const data = [];
    
    // Adicionar cabeçalho
    const headerRow = {
      'Linha': 'Linha',
      ...months.reduce((acc, month) => {
        acc[month] = month;
        return acc;
      }, {}),
      'Total Anual': 'Total Anual',
      'Metas': 'Metas'
    };
    data.push(headerRow);
    
    // Adicionar dados das linhas
    productionLines.forEach(line => {
      const row = {
        'Linha': line,
        ...months.reduce((acc, month) => {
          const dataItems = viewMode === 'pm' ? pms : towerLamps;
          const item = dataItems.find(p => p.production_line === line && p.month === month);
          if (item) {
            if (item.is_scheduled) {
              acc[month] = 'Agendada';
            } else if (item.is_delayed) {
              acc[month] = 'Atrasada';
            } else {
              acc[month] = 'Realizada';
            }
          } else {
            acc[month] = '';
          }
          return acc;
        }, {}),
        'Total Anual': calculateLineTotal(line),
        'Metas': `${calculateLinePercentage(line)}%`
      };
      data.push(row);
    });
    
    // Adicionar linha de totais mensais
    const totalsRow = {
      'Linha': 'Totais Mensais',
      ...months.reduce((acc, month) => {
        acc[month] = `${calculateMonthPercentage(month)}%`;
        return acc;
      }, {}),
      'Total Anual': '',
      'Metas': `${stats.completion_percentage}%`
    };
    data.push(totalsRow);
    
    // Chamar diretamente a função de exportação com formatação
    const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    const fileExtension = ".xlsx";
    
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Adicionar formatação
    const range = XLSX.utils.decode_range(ws['!ref']);
    
    // Formatar cabeçalho em negrito
    for (let C = range.s.c; C <= range.e.c; C++) {
      const address = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[address]) continue;
      if (!ws[address].s) ws[address].s = {};
      ws[address].s.font = { bold: true };
    }
    
    // Ajustar largura das colunas
    const colWidths = [];
    for (let C = range.s.c; C <= range.e.c; C++) {
      let maxWidth = 10;
      for (let R = range.s.r; R <= range.e.r; R++) {
        const address = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[address]) continue;
        const cellLength = ws[address].v ? ws[address].v.toString().length : 0;
        if (cellLength > maxWidth) maxWidth = cellLength;
      }
      colWidths.push({ wch: maxWidth + 2 });
    }
    ws['!cols'] = colWidths;
    
    const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const fileData = new Blob([excelBuffer], { type: fileType });
    FileSaver.saveAs(fileData, `${viewMode === 'pm' ? 'PM' : 'TowerLamp'}_SMD_${selectedYear}` + fileExtension);
  };

// Função para agendar PM
  const handleSchedule = () => {
    // Verificar se o mês selecionado é futuro ou atual
    const selectedMonthIndex = months.indexOf(selectedCell?.month);
    const currentMonthIndex = new Date().getMonth();
    
    // Permitir agendamento para meses atuais e futuros
    if (selectedMonthIndex < currentMonthIndex && selectedYear <= new Date().getFullYear()) {
      alert('Não é possível agendar PMs em meses passados.');
      return;
    }
    
    setsenhaAction('schedule');
    setShowsenhaModal(true);
  };

    // --- VERIFICAR SENHA ---
  const verifysenha = async () => {
    if (senhaAction === 'unlock' && senha === '123') {
      setIsEditing(true);
      alert('Edição desbloqueada!');
    } else if ((senhaAction === 'save' || senhaAction === 'delete' || senhaAction === 'schedule') && senha === '123') {
      if (senhaAction === 'save') {
        await handleSavePM();
      } else if (senhaAction === 'delete') {
        await handleDeletePM();
      } else if (senhaAction === 'schedule') {
        // Abrir modal de agendamento
        setShowScheduleModal(true);
        setShowsenhaModal(false);
      }
    } else {
      alert('Senha incorreta!');
    }
    setsenha('');
    setShowsenhaModal(false);
  };

// Estados para controlar o campo de data e a semana
  const [showDateField, setShowDateField] = useState(false);
  const [scheduledWeek, setScheduledWeek] = useState(null);

  // Função para lidar com a mudança do checkbox de agendamento
  const handleScheduleCheckboxChange = (e) => {
    const isChecked = e.target.checked;
    setShowDateField(isChecked);
    
    // Se estiver desmarcando, limpar a semana
    if (!isChecked) {
      setScheduledWeek(null);
    }
  };

  // Função para lidar com a mudança da data
  const handleDateChange = (e) => {
    const dateValue = e.target.value;
    if (dateValue) {
      const dateObj = new Date(dateValue);
      const weekNumber = getWeekNumber(dateObj);
      setScheduledWeek(weekNumber);
      
      // Atualizar o display da semana no modal de edição
      const weekDisplay = document.getElementById('edit-week-display');
      if (weekDisplay) {
        weekDisplay.textContent = `Semana: ${weekNumber}`;
      }
    }
  };

// --- SALVAR PM ---
  const handleSave = () => {
    setsenhaAction('save');
    setShowsenhaModal(true);
  };

const handleSavePM = async () => {
    try {
      const { line, month, pm } = selectedCell;
      
      // Obter valores dos campos do formulário
      const textarea = document.querySelector('.pm-preventiva-modal textarea');
      const checkboxes = document.querySelectorAll('.pm-preventiva-modal input[type="checkbox"]');
      const dateInput = document.querySelector('.pm-preventiva-modal input[type="date"]');
      
      const justification = textarea ? textarea.value : '';
      const is_delayed = checkboxes.length > 0 ? checkboxes[0].checked : false;
      const is_scheduled = checkboxes.length > 1 ? checkboxes[1].checked : false;
      
      // Se estiver agendada, calcular a semana com base na data
      let scheduled_week = null;
      let scheduled_date = null;
      if (is_scheduled && dateInput && dateInput.value) {
        const dateObj = new Date(dateInput.value);
        scheduled_week = getWeekNumber(dateObj);
        scheduled_date = dateInput.value; // Formato YYYY-MM-DD
      }

      // Verificar se os valores são válidos
      if (justification === null || is_delayed === null || is_scheduled === null) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
      }

      // Determinar a rota baseada no modo selecionado
      const apiEndpoint = viewMode === 'pm' ? 'pms' : 'tower-lamps';

      if (pm?.id) {
        // Update existente
        const response = await axios.put(`http://105.103.39.102:8080/${apiEndpoint}/${pm.id}`, { 
          justification, 
          is_delayed,
          is_scheduled,
          scheduled_week,
          scheduled_date
        });
        console.log(`${viewMode === 'pm' ? 'PM' : 'Tower Lamp'} atualizada:`, response.data);
      } else {
        // Criar nova entrada
        const response = await axios.post(`http://105.103.39.102:8080/${apiEndpoint}`, { 
          production_line: line, 
          month, 
          year: selectedYear, 
          justification, 
          is_delayed,
          is_scheduled,
          scheduled_week,
          scheduled_date
        });
        console.log(`${viewMode === 'pm' ? 'PM' : 'Tower Lamp'} criada:`, response.data);
      }
      alert(`${viewMode === 'pm' ? 'PM' : 'Tower Lamp'} salva com sucesso!`);
      fetchPMs(selectedYear);
      setShowModal(false);
      // Resetar estados
      setShowDateField(false);
      setScheduledWeek(null);
    } catch (error) {
      console.error(`Erro ao salvar ${viewMode === 'pm' ? 'PM' : 'Tower Lamp'}:`, error);
      alert(`Erro ao salvar ${viewMode === 'pm' ? 'PM' : 'Tower Lamp'}. Por favor, tente novamente.`);
    }
  };

  // --- DELETAR PM ---
  const handleDelete = () => {
    setsenhaAction('delete');
    setShowsenhaModal(true);
  };

const handleDeletePM = async () => {
    try {
      const { pm } = selectedCell;
      if (!pm?.id) return;
      
      // Determinar a rota baseada no modo selecionado
      const apiEndpoint = viewMode === 'pm' ? 'pms' : 'tower-lamps';
      
      await axios.delete(`http://105.103.39.102:8080/${apiEndpoint}/${pm.id}`);
      alert(`${viewMode === 'pm' ? 'PM' : 'Tower Lamp'} deletada com sucesso!`);
      fetchPMs(selectedYear);
      setShowModal(false);
    } catch (error) {
      console.error(error);
    }
  };

// --- SALVAR AGENDAMENTO ---
  const handleSaveSchedule = async () => {
    try {
      const { line, month } = selectedCell;
      const scheduleDate = document.querySelector('input[type="date"]').value;
      const observations = document.querySelector('textarea').value;

      // Verificar se a data foi selecionada
      if (!scheduleDate) {
        alert('Por favor, selecione uma data para o agendamento.');
        return;
      }

      // Calcular a semana do ano com base na data selecionada
      const dateObj = new Date(scheduleDate);
      const scheduledWeek = getWeekNumber(dateObj);

// Criar novo agendamento
      await axios.post('http://105.103.39.102:8080/schedule', { 
        production_line: line, 
        month, 
        year: selectedYear, 
        schedule_date: scheduleDate,
        scheduled_week: scheduledWeek,
        observations
      });

      alert('PM agendada com sucesso!');
      setShowScheduleModal(false);
      fetchPMs(selectedYear); // Atualizar a lista de PMs
    } catch (error) {
      console.error('Erro ao agendar PM:', error);
      alert('Erro ao agendar PM!');
    }
  };

  // Função para calcular o número da semana do ano
  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

// --- FUNÇÕES DE CÁLCULO ---
  // Total de PMs por linha (meta: 4 PMs por ano por linha)
// Contar apenas PMs realizadas (não agendadas e não atrasadas)
  const calculateLineTotal = (line) => {
    const data = viewMode === 'pm' ? pms : towerLamps;
    return data.filter(item => item.production_line === line && item.is_scheduled === 0 && item.is_delayed === 0).length;
  };
  const calculateLinePercentage = (line) => Math.round((calculateLineTotal(line)/4)*100);

  // Total de PMs por mês (meta: 8 PMs por mês)
  // Contar apenas PMs realizadas (não agendadas e não atrasadas)
  const calculateMonthTotal = (month) => {
    const data = viewMode === 'pm' ? pms : towerLamps;
    return data.filter(item => item.month === month && item.is_scheduled === 0 && item.is_delayed === 0).length;
  };
  const calculateMonthPercentage = (month) => Math.round((calculateMonthTotal(month)/8)*100);

  // Função para lidar com Enter no input de senha
  const handlesenhaKeyPress = (e) => {
    if (e.key === 'Enter') {
      verifysenha();
    }
  };

  // Função para mudar o ano selecionado
  const handleYearChange = (e) => {
    const year = parseInt(e.target.value);
    setSelectedYear(year);
    fetchPMs(year);
    fetchStats(year);
  };

// Função para obter classe de badge baseada na porcentagem
  const getBadgeClass = (percentage) => {
    if (percentage >= 75) return 'high';
    if (percentage >= 50) return 'medium';
    return 'low';
  };

  // Gerar opções de anos (apenas anos com dados + ano atual)
  const [availableYears, setAvailableYears] = useState([]);
  
  const fetchAvailableYears = async () => {
    try {
      const response = await axios.get('http://105.103.39.102:8080/available-years');
      setAvailableYears(response.data.years);
      // Se o ano selecionado não estiver na lista, definir para o ano atual
      if (!response.data.years.includes(selectedYear)) {
        setSelectedYear(currentYear);
      }
    } catch (error) {
      console.error('Erro ao buscar anos disponíveis:', error);
      // Fallback: usar anos do ano atual até 5 anos atrás
      const fallbackYears = [];
      for (let i = currentYear; i >= currentYear - 5; i--) {
        fallbackYears.push(i);
      }
      setAvailableYears(fallbackYears);
    }
  };

  // Buscar anos disponíveis quando o componente montar
  useEffect(() => {
    fetchAvailableYears();
  }, []);

// Buscar dados iniciais quando o componente montar e quando availableYears mudar
  useEffect(() => {
    // Buscar dados iniciais quando availableYears for carregado
    if (availableYears.length > 0) {
      fetchStats(selectedYear);
      fetchPMs(selectedYear);
    }
  }, [availableYears, selectedYear]);

  // Atualizar dados quando o modo de visualização mudar
  useEffect(() => {
    fetchStats(selectedYear);
    fetchPMs(selectedYear);
  }, [viewMode, selectedYear]);

  // Função para fechar modais com Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowModal(false);
        setShowsenhaModal(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div className="pm-preventiva-system">
      <div className="pm-preventiva-container">
        {/* Header */}
<div className="pm-preventiva-header">
          <h1 className="pm-preventiva-title">
            {viewMode === 'pm' 
              ? 'Sistema de Gestão de Manutenção Preventiva - SMD' 
              : 'Sistema de Gestão de Tower Lamps - SMD'}
          </h1>
          <p className="pm-preventiva-subtitle">
            {viewMode === 'pm' 
              ? 'Monitoramento e controle mensal de manutenções preventivas das linhas de produção' 
              : 'Monitoramento e controle mensal de tower lamps das linhas de produção'}
          </p>
        </div>

{/* Barra de Ferramentas e Indicadores */}
        <div className="pm-preventiva-toolbar-container">
          <div className="pm-preventiva-stats-container">
            <div className="pm-preventiva-stat-card">
              <div className="pm-preventiva-stat-icon">
                <CheckCircleIcon />
              </div>
              <div className="pm-preventiva-stat-content">
                <div className="pm-preventiva-stat-title">
                  {viewMode === 'pm' ? 'PMs Realizadas' : 'Tower Lamps Realizadas'}
                </div>
                <div className="pm-preventiva-stat-value">{stats.completed_pms}/{stats.total_pms}</div>
              </div>
            </div>
            <div className="pm-preventiva-stat-card">
              <div className="pm-preventiva-stat-icon">
                <ClockIcon />
              </div>
              <div className="pm-preventiva-stat-content">
                <div className="pm-preventiva-stat-title">
                  {viewMode === 'pm' ? '% Anual de PMs' : '% Anual de Tower Lamps'}
                </div>
                <div className="pm-preventiva-stat-value">{stats.completion_percentage}%</div>
              </div>
            </div>
            <div className="pm-preventiva-stat-card">
              <div className="pm-preventiva-stat-icon">
                <AlertTriangleIcon />
              </div>
              <div className="pm-preventiva-stat-content">
                <div className="pm-preventiva-stat-title">
                  {viewMode === 'pm' ? 'PMs Atrasadas' : 'Tower Lamps Atrasadas'}
                </div>
                <div className="pm-preventiva-stat-value">{stats.delayed_pms}</div>
              </div>
            </div>
          </div>

<div className="pm-preventiva-toolbar">
            {/* Seletor de Ano */}
            <div className="year-selector">
              <label htmlFor="year-select" className="year-selector-label">
                <CalendarIcon className="year-selector-icon" />
                Ano:
              </label>
              <select 
                id="year-select" 
                value={selectedYear} 
                onChange={handleYearChange}
                className="year-selector-dropdown"
              >
                {availableYears.map(year => (
                  <option key={year} value={year} className="year-option">
                    {year}
                  </option>
                ))}
              </select>
            </div>
            
{/* Botão de alternância entre PM e Tower Lamp */}
            <button 
              className="toggle-view-btn" 
              onClick={() => {
                const newViewMode = viewMode === 'pm' ? 'tower-lamp' : 'pm';
                setViewMode(newViewMode);
                // Salvar o modo de visualização no localStorage
                localStorage.setItem('pmManagementViewMode', newViewMode);
                // Atualizar os dados
                fetchPMs(selectedYear);
                fetchStats(selectedYear);
              }}
            >
              {viewMode === 'pm' ? (
                <>
                  <BellIcon />
                  Ver Tower Lamps
                </>
              ) : (
                <>
                  <BellIcon />
                  Ver PMs
                </>
              )}
            </button>
            
            <button 
              className="unlock-btn" 
              onClick={handleUnlock}
            >
              {isEditing ? (
                <>
                  <UnlockIcon />
                  Modo Edição
                </>
              ) : (
                <>
                  <LockIcon />
                  Desbloquear Edição
                </>
              )}
            </button>
            <button 
              className="export-btn" 
              onClick={handleExport}
            >
              <DownloadIcon />
              Exportar Excel
            </button>
          </div>
        </div>

        {/* Tabela */}
           <div className="pm-preventiva-table-container">
          <table className="pm-preventiva-table">
            <thead>
              <tr>
                <th>Linha</th>
                {months.map(month => <th key={month}>{month}</th>)}
                <th>Total Anual</th><th>Metas</th>
              </tr>
            </thead>
            <tbody>
              {productionLines.map(line => (
                <tr key={line}>
                  <td>{line}</td>
{months.map((month, idx) => {
                    const data = viewMode === 'pm' ? pms : towerLamps;
                    const item = data.find(p => p.production_line===line && p.month===month);
                    const isCompleted = !!item;
                    const isDelayed = item?.is_delayed;
                    const isScheduled = item?.is_scheduled;
                    const monthNumber = idx + 1;
                    return (
                      <td key={`${line}-${month}`}
                        className={`pm-preventiva-cell ${isCompleted?(isDelayed?'delayed':(isScheduled?'scheduled':'completed')):'empty'} ${isEditable(monthNumber,selectedYear)?'editable':'locked'}`}
                        onClick={()=>isEditable(monthNumber,selectedYear)&&handleCellClick(line,month)}
                        title={isDelayed?'PM atrasada':isScheduled?'PM agendada':isCompleted?'PM realizada':'Sem PM'}>
{isCompleted ? (
                        isScheduled ? <CalendarIcon /> : 
                        isDelayed ? <AlertTriangleIcon /> : <CheckCircleIcon />
                      ) : null}
                      {isScheduled && item?.scheduled_date && (
                        <div style={{fontSize: '10px', marginTop: '2px'}}>
                          {new Date(item.scheduled_date).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                      </td>
                    );
                  })}
                  <td>{calculateLineTotal(line)}</td>
                  <td><span className={`pm-preventiva-badge ${getBadgeClass(calculateLinePercentage(line))}`}>{calculateLinePercentage(line)}%</span></td>
                </tr>
              ))}
<tr className="footer-row">
                <td><strong>Totais Mensais</strong></td>
                {months.map(month => (
                  <td key={month}><span className={`pm-preventiva-footer-badge ${getBadgeClass(calculateMonthPercentage(month))}`}>{calculateMonthPercentage(month)}%</span></td>
                ))}
                <td colSpan="2">
                  <span className={`pm-preventiva-footer-badge ${getBadgeClass(stats.completion_percentage)}`}>
                    {stats.completion_percentage}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

{/* Modal de Edição/Adição */}
      {showModal && (
        <div className="pm-preventiva-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="pm-preventiva-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pm-preventiva-modal-header">
              <div className="pm-preventiva-modal-title">
                {selectedCell?.pm ? 'Editar' : 'Adicionar'} PM - {selectedCell?.line} - {selectedCell?.month} ({selectedYear})
              </div>
              <button 
                className="pm-preventiva-modal-close" 
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div className="pm-preventiva-modal-body">
              <div className="pm-preventiva-form-group">
                <label className="pm-preventiva-form-label">Justificativa:</label>
                <textarea 
                  className="pm-preventiva-form-textarea"
                  placeholder="Descreva a justificativa para esta manutenção..."
                  defaultValue={selectedCell?.pm?.justification || ''}
                />
              </div>
              
              <div className="pm-preventiva-form-group">
                <label className="pm-preventiva-checkbox-group">
                  <input 
                    type="checkbox" 
                    defaultChecked={selectedCell?.pm?.is_delayed}
                  />
                  <span>PM Atrasada</span>
                </label>
              </div>
              
              <div className="pm-preventiva-form-group">
                <label className="pm-preventiva-checkbox-group">
                  <input 
                    type="checkbox" 
                    defaultChecked={selectedCell?.pm?.is_scheduled}
                    onChange={handleScheduleCheckboxChange}
                  />
                  <span>PM Agendada</span>
                </label>
              </div>
              
{(selectedCell?.pm?.is_scheduled || showDateField) && (
                <div className="pm-preventiva-form-group">
                  <label className="pm-preventiva-form-label">Data de Agendamento:</label>
                  <input
                    type="date"
                    className="pm-preventiva-form-input"
                    defaultValue={selectedCell?.pm?.scheduled_date || new Date().toISOString().split('T')[0]}
                    onChange={handleDateChange}
                  />
                  <div className="pm-preventiva-form-helper" id="edit-week-display">
                    Semana: {scheduledWeek || getWeekNumber(new Date())}
                  </div>
                </div>
              )}
            </div>
            <div className="pm-preventiva-modal-footer">
              {selectedCell?.pm && (
                <button className="delete-btn" onClick={handleDelete}>
                  Excluir
                </button>
              )}
              <button className="cancel-btn" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className="save-btn" onClick={handleSave}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

{/* Modal de Visualização */}
      {showViewModal && (
        <div className="pm-preventiva-modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="pm-preventiva-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pm-preventiva-modal-header">
              <div className="pm-preventiva-modal-title">
                Detalhes da PM - {selectedCell?.line} - {selectedCell?.month} ({selectedYear})
              </div>
              <button 
                className="pm-preventiva-modal-close" 
                onClick={() => setShowViewModal(false)}
              >
                ×
              </button>
            </div>
            <div className="pm-preventiva-modal-body">
              <div className="pm-preventiva-form-group">
                <label className="pm-preventiva-form-label">Justificativa:</label>
                <div className="pm-preventiva-form-textarea-read">
                  {selectedCell?.pm?.justification || 'Nenhuma justificativa fornecida'}
                </div>
              </div>
              
              <div className="pm-preventiva-form-group">
                <label className="pm-preventiva-checkbox-group">
                  <input 
                    type="checkbox" 
                    checked={selectedCell?.pm?.is_delayed}
                    disabled
                  />
                  <span>PM Atrasada</span>
                </label>
              </div>
              
              <div className="pm-preventiva-form-group">
                <label className="pm-preventiva-checkbox-group">
                  <input 
                    type="checkbox" 
                    checked={selectedCell?.pm?.is_scheduled}
                    disabled
                  />
                  <span>PM Agendada</span>
                </label>
              </div>
              
{selectedCell?.pm?.is_scheduled && (
                <div className="pm-preventiva-form-group">
                  <label className="pm-preventiva-form-label">Semana Agendada:</label>
                  <div className="pm-preventiva-form-textarea-read">
                    {selectedCell?.pm?.scheduled_week && selectedCell?.pm?.scheduled_week > 0 ? `Semana ${selectedCell?.pm?.scheduled_week}` : 'Semana não especificada'}
                  </div>
                </div>
              )}
            </div>
            <div className="pm-preventiva-modal-footer">
              <button className="cancel-btn" onClick={() => setShowViewModal(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Senha */}
      {showsenhaModal && (
        <div className="pm-preventiva-modal-overlay" onClick={() => setShowsenhaModal(false)}>
          <div className="pm-preventiva-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pm-preventiva-modal-header">
              <div className="pm-preventiva-modal-title">
                {senhaAction === 'unlock' ? 'Desbloquear Edição' : 
                 senhaAction === 'save' ? 'Salvar PM' : 
                 senhaAction === 'delete' ? 'Excluir PM' : 'Agendar PM'}
              </div>
              <button 
                className="pm-preventiva-modal-close" 
                onClick={() => setShowsenhaModal(false)}
              >
                ×
              </button>
            </div>
            <div className="pm-preventiva-modal-body">
              <div className="pm-preventiva-form-group">
                <label className="pm-preventiva-form-label">
                  {senhaAction === 'unlock' ? 'Senha para desbloquear:' : 
                   senhaAction === 'save' ? 'Senha para salvar:' : 
                   senhaAction === 'delete' ? 'Senha para excluir:' : 'Senha para agendar:'}
                </label>
                <input
                  type="password"
                  className="pm-preventiva-form-input"
                  value={senha}
                  onChange={(e) => setsenha(e.target.value)}
                  onKeyPress={handlesenhaKeyPress}
                  placeholder="Digite a senha"
                  autoFocus
                />
              </div>
            </div>
            <div className="pm-preventiva-modal-footer">
              <button className="cancel-btn" onClick={() => setShowsenhaModal(false)}>
                Cancelar
              </button>
              <button className="save-btn" onClick={verifysenha}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Agendamento */}
      {showScheduleModal && (
        <div className="pm-preventiva-modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="pm-preventiva-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pm-preventiva-modal-header">
              <div className="pm-preventiva-modal-title">
                Agendar PM - {selectedCell?.line} - {selectedCell?.month} ({selectedYear})
              </div>
              <button 
                className="pm-preventiva-modal-close" 
                onClick={() => setShowScheduleModal(false)}
              >
                ×
              </button>
            </div>
            <div className="pm-preventiva-modal-body">
              <div className="pm-preventiva-form-group">
                <label className="pm-preventiva-form-label">Data de Agendamento:</label>
                <input
                  type="date"
                  className="pm-preventiva-form-input"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    // Calcular e mostrar a semana quando a data mudar
                    const dateObj = new Date(e.target.value);
                    const weekNumber = getWeekNumber(dateObj);
                    // Atualizar o elemento que mostra a semana
                    const weekDisplay = document.getElementById('schedule-week-display');
                    if (weekDisplay) {
                      weekDisplay.textContent = `Semana: ${weekNumber}`;
                    }
                  }}
                />
                <div id="schedule-week-display" className="pm-preventiva-form-helper">
                  Semana: {getWeekNumber(new Date())}
                </div>
              </div>
              <div className="pm-preventiva-form-group">
                <label className="pm-preventiva-form-label">Observações:</label>
                <textarea 
                  className="pm-preventiva-form-textarea"
                  placeholder="Descreva observações sobre o agendamento..."
                />
              </div>
            </div>
            <div className="pm-preventiva-modal-footer">
              <button className="cancel-btn" onClick={() => setShowScheduleModal(false)}>
                Cancelar
              </button>
              <button className="save-btn" onClick={handleSaveSchedule}>
                Agendar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PMManagementSystem;
