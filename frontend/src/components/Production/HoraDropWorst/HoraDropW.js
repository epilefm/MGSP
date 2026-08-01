import { API_URL } from '../../../config/api';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Header from '../../Layout/MGSPHead/Header';
import {
  Layout, Row, Col, Card, Typography, Input, Button,
  Space, Table as AntTable, Tag,
  Tabs, Spin, Select, Checkbox, Form,
  Collapse, Pagination, Divider, DatePicker
} from 'antd';
import {
  SyncOutlined,
  SearchOutlined,
  DownloadOutlined,
  DownOutlined,
  UpOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import './HoraDropW.css';
import dayjs from 'dayjs';

const { Container, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Panel } = Collapse;

// Função para obter cor de fundo baseada na quantidade de erros
const getHourCellColor = (errors) => {
  const qty = parseInt(errors) || 0;
  if (qty === 0) {
    return 'rgba(158, 158, 158, 0.15)'; // Cinza claro/quase branco para 0 erros
  } else if (qty >= 1 && qty <= 5) {
    return 'rgba(255, 235, 59, 0.5)'; // Amarelo para 1-5 erros
  } else {
    return 'rgba(244, 67, 54, 0.4)'; // Vermelho para >5 erros
  }
};

// Função para obter cor do texto baseada na quantidade de erros
const getHourTextColor = (errors) => {
  const qty = parseInt(errors) || 0;
  if (qty === 0) {
    return '#757575'; // Cinza para 0 erros
  } else if (qty >= 1 && qty <= 5) {
    return '#424242'; // Cinza escuro para melhor contraste no amarelo
  } else {
    return '#ffffff'; // Branco para melhor contraste no vermelho
  }
};

function WorstDropTable() {
  const [data, setData] = useState([]);
  const [dataPorHora, setDataPorHora] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [dateRange, setDateRange] = useState([dayjs(), dayjs()]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [limit, setLimit] = useState(50);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [tabValue, setTabValue] = useState('home'); // 'home' = Drop Worst, 'porHora' = Por Turno/Hora
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedTurnos, setSelectedTurnos] = useState([]); // Filtro de turnos
  const [filterOptions, setFilterOptions] = useState({
    Line: [],
    Model: [],
    Equipment: [],
    Classe: []
  });
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const fileName = "Drop_Worst_50";

  // Handler para mudança do RangePicker de datas (Drop Worst)
  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setDateRange(dates);
      setStartDate(dates[0].format('YYYY-MM-DD'));
      setEndDate(dates[1].format('YYYY-MM-DD'));
    }
  };

  // Handler para mudança do RangePicker (Por Hora) - atualiza dateRange tambem
  const handleSelectedDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setDateRange(dates); // Atualiza o dateRange para o RangePicker mostrar corretamente
      setStartDate(dates[0].format('YYYY-MM-DD'));
      setEndDate(dates[1].format('YYYY-MM-DD'));
    }
  };

  // Colunas de horário (00h às 23h) - DEFINIR ANTES DO FILTRO
  const hourColumns = Array.from({ length: 24 }, (_, i) => ({
    id: `h${i.toString().padStart(2, '0')}`,
    label: `${i.toString().padStart(2, '0')}h`,
    numeric: true,
    width: 40,
  }));

  // Definição dos turnos (horas inclusas em cada turno)
  // 1T = 06:55 às 16:43 (considera 7h às 16h)
  // 2T = 16:43:01 às 02:12 (considera 17h às 2h)
  // 3T = restante (3h às 6h)
  const turnosDefinicao = {
    '1T': [7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    '2T': [17, 18, 19, 20, 21, 22, 23, 0, 1, 2],
    '3T': [3, 4, 5, 6]
  };

  // Filtrar colunas de hora baseado nos turnos selecionados
  const hourColumnsFiltradas = useMemo(() => {
    if (selectedTurnos.length === 0) {
      return hourColumns; // Mostra todas as horas se nenhum turno selecionado
    }
    
    const horasPermitidas = new Set();
    selectedTurnos.forEach(turno => {
      turnosDefinicao[turno].forEach(hora => horasPermitidas.add(hora));
    });
    
    return hourColumns.filter(col => {
      const hora = parseInt(col.id.replace('h', ''));
      return horasPermitidas.has(hora);
    });
  }, [selectedTurnos]);

  // Colunas para exibição (aba Home)
  const displayColumns = [
    { id: 'Line', label: 'Linha', numeric: false, width: '7%' },
    { id: 'Model', label: 'Modelo', numeric: false, width: '10%' },
    { id: 'Equipment', label: 'Equipamento', numeric: false, width: '10%' },
    { id: 'Feeder', label: 'Feeder', numeric: false, width: '7%' },
    { id: 'Slot', label: 'Slot', numeric: false, width: '5%' },
    { id: 'Classe', label: 'Classe', numeric: false, width: '5%' },
    { id: 'PartCode', label: 'Código', numeric: false, width: '12%' },
    { id: 'Errors', label: 'Erros', numeric: true, width: '7%' },
    { id: 'valor', label: 'Preço Unit.', numeric: true, width: '10%' },
    { id: 'Total', label: 'Total', numeric: true, width: '10%' },
  ];

  // Colunas fixas para aba Por Hora
  const fixedColumnsPorHora = [
    { id: 'line', label: 'Line', numeric: false, width: '7%' },
    { id: 'model', label: 'Model', numeric: false, width: '8%' },
    { id: 'equipment', label: 'Equipment', numeric: false, width: '10%' },
    { id: 'slot', label: 'Slot', numeric: false, width: '5%' },
    { id: 'part_code', label: 'PartCode', numeric: false, width: '10%' },
    { id: 'feeder', label: 'Feeder', numeric: false, width: '7%' },
    { id: 'classe', label: 'Classe', numeric: false, width: '5%' },
    { id: 'valor_unitario', label: 'Valor Unit', numeric: true, width: '8%' },
    { id: 'valor_total', label: 'TTL (R$)', numeric: true, width: '8%' },
    { id: 'total_errors', label: 'Total', numeric: true, width: '7%' },
  ];

  // Buscar dados do backend
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/drop_worst/current?startDate=${startDate}&endDate=${endDate}&limit=${limit}`);
      const mappedData = response.data.data.map(item => ({
        Line: item.Line,
        Model: item.Model ? item.Model.replace(/^BSM-/i, '') : '', // Remove prefixo 'BSM-'
        Equipment: item.Equipment,
        Feeder: item.Feeder,
        Slot: item.Slot,
        PartCode: item.PartCode,
        Errors: parseInt(item.Errors),
        Classe: item.Classe,
        valor: parseFloat(item.valor),
        Total: parseFloat(item.Total),
        TotalNumerico: parseFloat(item.TotalNumerico)
      }));
      setData(mappedData);
    } catch (err) {
      // Silenciar erros
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, limit]);

  // Buscar dados por hora
  const fetchDataPorHora = useCallback(async () => {
    setLoading(true);
    try {
      // Agora usa startDate e endDate para período
      const response = await axios.get(`${API_URL}/drop_worst/por_hora?startDate=${startDate}&endDate=${endDate}`);
      // Remove prefixo 'BSM-' dos modelos e calcula total_errors somando todas as horas
      let mappedData = (response.data.data || []).map(item => {
        // Soma todas as colunas de hora (h00 a h23) para obter o total correto
        let totalErrosCalculado = 0;
        for (let i = 0; i < 24; i++) {
          const hourKey = `h${i.toString().padStart(2, '0')}`;
          totalErrosCalculado += parseInt(item[hourKey] || 0);
        }
        return {
          ...item,
          model: item.model ? item.model.replace(/^BSM-/i, '') : '',
          total_errors: totalErrosCalculado // Substitui pelo valor calculado
        };
      });
      
      // FILTRO: Mostrar apenas registros que têm pelo menos 1 erro em alguma hora
      mappedData = mappedData.filter(item => item.total_errors > 0);
      
      // ORDENAR: Registros com mais erros aparecem primeiro
      mappedData.sort((a, b) => b.total_errors - a.total_errors);
      
      setDataPorHora(mappedData);
    } catch (err) {
      // Silenciar erros
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // Carregar dados iniciais
  useEffect(() => {
    if (tabValue === 'home') {
      fetchData();
    } else {
      fetchDataPorHora();
    }
  }, [fetchData, fetchDataPorHora, tabValue]);

  // Atualização automática a cada 30 segundos (apenas se autoRefreshEnabled estiver ligado)
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    
    const intervalId = setInterval(() => {
      if (tabValue === 'home') {
        fetchData();
      } else {
        fetchDataPorHora();
      }
      setLastUpdate(new Date());
    }, 30000); // 30 segundos
    
    return () => clearInterval(intervalId);
  }, [fetchData, fetchDataPorHora, tabValue, autoRefreshEnabled]);

  // Extrair valores únicos para os filtros suspensos (ambas abas)
  useEffect(() => {
    if (tabValue === 'home' && data.length > 0) {
      const uniqueValues = {
        Line: [...new Set(data.map(row => row.Line).filter(Boolean))].sort(),
        Model: [...new Set(data.map(row => row.Model).filter(Boolean))].sort(),
        Equipment: [...new Set(data.map(row => row.Equipment).filter(Boolean))].sort(),
        Classe: [...new Set(data.map(row => row.Classe).filter(Boolean))].sort()
      };
      setFilterOptions(uniqueValues);
    } else if (tabValue === 'porHora' && dataPorHora.length > 0) {
      const uniqueValues = {
        Line: [...new Set(dataPorHora.map(row => row.line).filter(Boolean))].sort(),
        Model: [...new Set(dataPorHora.map(row => row.model).filter(Boolean))].sort(),
        Equipment: [...new Set(dataPorHora.map(row => row.equipment).filter(Boolean))].sort(),
        Classe: [...new Set(dataPorHora.map(row => row.classe).filter(Boolean))].sort()
      };
      setFilterOptions(uniqueValues);
    }
  }, [data, dataPorHora, tabValue]);

  // Dados filtrados (aba Home) - suporta filtro unico ou multiplo
  const filteredData = useMemo(() => 
    data.filter(row => 
      row.Classe !== 'TOTAL' &&
      Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        // Se for array (multipla selecao), verifica se o valor esta no array
        if (Array.isArray(value)) {
          return value.some(v => String(row[key]).toLowerCase().includes(v.toLowerCase()));
        }
        // Se for string, faz busca parcial
        return String(row[key]).toLowerCase().includes(value.toLowerCase());
      })
    ),
    [data, filters]
  );

  // Dados filtrados (aba Por Hora) - usa mapeamento de chaves e suporta multipla selecao
  const filteredDataPorHora = useMemo(() => {
    // Mapeamento de chaves: filtro (maiusculo) -> dado (minusculo)
    const keyMapping = {
      'Line': 'line',
      'Model': 'model',
      'Equipment': 'equipment',
      'Classe': 'classe',
      'Feeder': 'feeder',
      'Slot': 'slot',
      'PartCode': 'part_code'
    };
    
    return dataPorHora.filter(row => 
      Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const dataKey = keyMapping[key] || key;
        // Se for array (multipla selecao), verifica se o valor esta no array
        if (Array.isArray(value)) {
          return value.some(v => String(row[dataKey] || '').toLowerCase().includes(v.toLowerCase()));
        }
        // Se for string, faz busca parcial
        return String(row[dataKey] || '').toLowerCase().includes(value.toLowerCase());
      })
    );
  },
    [dataPorHora, filters]
  );

  // Calcular total (aba Home)
  const totalSum = useMemo(() => 
    filteredData.reduce((acc, row) => acc + (parseFloat(row.TotalNumerico) || 0), 0),
    [filteredData]
  );

  // Pior linha em custo (aba Home)
  const worstLine = useMemo(() => {
    const lineCosts = {};
    filteredData.forEach(row => {
      if (row.Line) {
        lineCosts[row.Line] = (lineCosts[row.Line] || 0) + (parseFloat(row.TotalNumerico) || 0);
      }
    });
    
    let worstLine = '';
    let worstCost = 0;
    
    Object.entries(lineCosts).forEach(([line, cost]) => {
      if (cost > worstCost) {
        worstCost = cost;
        worstLine = line;
      }
    });
    
    return { line: worstLine, cost: worstCost };
  }, [filteredData]);

  // Part Code mais frequente (aba Home)
  const mostFrequentPartCode = useMemo(() => {
    const partCodeCounts = {};
    const partCodeErrors = {};
    
    filteredData.forEach(row => {
      if (row.PartCode) {
        partCodeCounts[row.PartCode] = (partCodeCounts[row.PartCode] || 0) + 1;
        partCodeErrors[row.PartCode] = (partCodeErrors[row.PartCode] || 0) + (parseInt(row.Errors) || 0);
      }
    });
    
    let mostFrequent = '';
    let maxCount = 0;
    let totalErrors = 0;
    
    Object.entries(partCodeCounts).forEach(([partCode, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = partCode;
        totalErrors = partCodeErrors[partCode] || 0;
      }
    });
    
    return { partCode: mostFrequent, count: maxCount, totalErrors };
  }, [filteredData]);

  // Atualizar dados
  const handleRefresh = () => {
    if (tabValue === 'home') {
      fetchData();
    } else {
      fetchDataPorHora();
    }
  };

  // Alterar data inicial
  const handleStartDateChange = (e) => {
    const value = e.target.value;
    if (value) {
      setStartDate(value);
    }
  };

  // Alterar data final
  const handleEndDateChange = (e) => {
    const value = e.target.value;
    if (value) {
      setEndDate(value);
    }
  };

  // Alterar filtro (suporta valor único ou array para multipla selecao)
  const handleFilterChange = (field, value) => {
    // Se value for array (multipla selecao), guarda como array
    // Se for string vazia ou undefined, remove o filtro
    if (Array.isArray(value)) {
      setFilters(prev => ({ ...prev, [field]: value.length > 0 ? value : undefined }));
    } else {
      setFilters(prev => ({ ...prev, [field]: value || undefined }));
    }
  };

  // Alterar aba
  const handleTabChange = (value) => {
    setTabValue(value);
    setFilters({}); // Limpar filtros ao trocar de aba
  };

  // Alterar data selecionada (aba Por Hora)
  const handleSelectedDateChange = (value) => {
    if (value) {
      setSelectedDate(value);
      setPage(1); // Resetar paginação ao mudar data
    }
  };

  // Controle de paginação
  const handlePageChange = (newPage, newPageSize) => {
    setPage(newPage);
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
    }
  };

  // Dados paginados (aba Por Hora)
  const paginatedDataPorHora = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredDataPorHora.slice(start, start + pageSize);
  }, [filteredDataPorHora, page, pageSize]);

  // Função para exportar para Excel (aba Home)
  const exportToExcel = () => {
    const exportData = filteredData.map(row => ({
      'Linha': row.Line,
      'Modelo': row.Model,
      'Equipamento': row.Equipment,
      'Feeder': row.Feeder,
      'Slot': row.Slot,
      'Classe': row.Classe,
      'Part Code': row.PartCode,
      'Erros': row.Errors,
      'Preço Unitário': row.valor,
      'Total': row.Total
    }));
    
    exportData.push({
      'Linha': '',
      'Modelo': '',
      'Equipamento': '',
      'Feeder': '',
      'Slot': '',
      'Classe': 'TOTAL',
      'Part Code': '',
      'Erros': '',
      'Preço Unitário': '',
      'Total': new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(totalSum)
    });
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Drop_Worst_50");
    XLSX.writeFile(wb, `${fileName}_${startDate}_a_${endDate}.xlsx`);
  };

  // Função para exportar dados por hora para Excel
  const exportToExcelPorHora = () => {
    const exportData = filteredDataPorHora.map(row => {
      const rowData = {
        'Line': row.line,
        'Model': row.model,
        'Equipment': row.equipment,
        'Slot': row.slot,
        'PartCode': row.part_code,
        'Feeder': row.feeder,
        'Classe': row.classe,
        'Valor Unit': parseFloat(row.valor_unitario).toFixed(2),
        'Valor Ttl': parseFloat(row.valor_total).toFixed(2),
        'Qtd Total': row.total_errors
      };
      
      // Adicionar colunas de horário
      hourColumns.forEach(hourCol => {
        rowData[hourCol.label] = row[hourCol.id] || 0;
      });
      
      return rowData;
    });
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Drop_Worst_Por_Hora");
    XLSX.writeFile(wb, `Drop_Worst_Por_Hora_${selectedDate}.xlsx`);
  };

  // Colunas da tabela Home
  const homeColumns = displayColumns.map((column) => ({
    title: column.label,
    dataIndex: column.id,
    key: column.id,
    align: 'center',
    width: column.width,
    render: (value, record) => {
      let cellStyle = {
        fontWeight: column.id === 'Total' ? 'bold' : 'normal',
        color: column.id === 'Classe' ? 
          (record.Classe === 'A' ? '#d32f2f' : record.Classe === 'B' ? '#ed6c02' : '#0288d1') : 
          'inherit',
        textAlign: 'center',
        fontSize: '13px',
        padding: '8px 6px'
      };
      
      if (column.id === 'Total' && parseFloat(record.TotalNumerico) > 1000) {
        cellStyle.color = '#d32f2f';
      }
      
      return <span style={cellStyle}>{value}</span>;
    }
  }));

  // Colunas da tabela Por Hora
  const porHoraColumns = [
    ...fixedColumnsPorHora.map((column) => ({
      title: column.label,
      dataIndex: column.id,
      key: column.id,
      align: 'center',
      width: column.width,
      fixed: column.id === 'total_errors' ? 'left' : false,
      render: (value, record) => {
        let cellStyle = {
          fontWeight: column.id === 'total_errors' ? 'bold' : 'normal',
          color: column.id === 'classe' ? 
            (record.classe === 'A' ? '#d32f2f' : record.classe === 'B' ? '#ed6c02' : '#0288d1') : 
            'inherit',
          textAlign: 'center'
        };
        
        // Formatar valores numéricos
        let displayValue = value;
        if (column.id === 'valor_unitario' || column.id === 'valor_total') {
          displayValue = parseFloat(value || 0).toFixed(2);
        }
        
        return <span style={cellStyle}>{displayValue}</span>;
      }
    })),
    ...hourColumnsFiltradas.map((hourCol) => ({
      title: hourCol.label,
      dataIndex: hourCol.id,
      key: hourCol.id,
      align: 'center',
      width: hourCol.width,
      render: (value) => {
        const errors = value || 0;
        return (
          <span style={{
            backgroundColor: getHourCellColor(errors),
            color: getHourTextColor(errors),
            fontWeight: errors > 3 ? 'bold' : 'normal',
            fontSize: '11px',
            padding: '2px 4px',
            display: 'block',
            borderRadius: '4px'
          }}>
            {errors > 0 ? errors : '-'}
          </span>
        );
      }
    }))
  ];

  const tabItems = [
    {
      key: 'home',
      label: (
        <Space>
          <SearchOutlined />
          Drop Worst
        </Space>
      ),
      children: null
    },
    {
      key: 'porHora',
      label: (
        <Space>
          <ClockCircleOutlined />
          Por Turno/Hora
        </Space>
      ),
      children: null
    }
  ];

  return (
    <div className="dashboard-container">
      <Header />
      <div className="dashboard-content" style={{marginTop: -12}}>
        <div className="header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ color: 'white', margin: 0, fontSize: '16px' }}>
            🚨 Drop Worst - Monitoramento de Erros por Hora
          </Title>
          <Space size="small" style={{ marginRight: 16 }}>
            <Button
              type={autoRefreshEnabled ? 'primary' : 'default'}
              size="small"
              icon={autoRefreshEnabled ? <SyncOutlined spin /> : <SyncOutlined />}
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              title={autoRefreshEnabled ? 'Auto-refresh LIGADO (30s)' : 'Auto-refresh DESLIGADO'}
            >
              {autoRefreshEnabled ? 'Auto: ON' : 'Auto: OFF'}
            </Button>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
              🕐 Atualizado: {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Text>
          </Space>
        </div>

        {/* Abas de navegação */}
        <Tabs
          activeKey={tabValue}
          onChange={handleTabChange}
          items={tabItems}
          style={{ marginTop: -10, marginBottom: 10 }}
          size="small"
        />

        {/* Painel de filtros */}
        <Card className="filter-panel" size="small">
          <div 
            className="filter-header"
            onClick={() => setFiltersExpanded(!filtersExpanded)}
          >
            <Space>
              <Text strong style={{ fontSize: '14px' }}>Filtros</Text>
            </Space>
            <Space>
              <Button
                type="default"
                size="small"
                icon={<DownloadOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  if (tabValue === 'home') {
                    exportToExcel();
                  } else {
                    exportToExcelPorHora();
                  }
                }}
              >
                Exportar Excel
              </Button>
            </Space>
          </div>
          
          <Collapse 
            activeKey={filtersExpanded ? ['filters'] : []} 
            onChange={() => setFiltersExpanded(!filtersExpanded)}
            bordered={false}
            className="filters-collapse"
          >
            <Panel header="" key="filters">
              <Row gutter={[12, 12]} align="stretch">
                {/* RangePicker de período - Ambas abas */}
                <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                  <div className="form-label">Período</div>
                  <DatePicker.RangePicker
                    value={dateRange}
                    onChange={tabValue === 'home' ? handleDateRangeChange : handleSelectedDateRangeChange}
                    size="small"
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY"
                  />
                </Col>
                
                {/* Filtros com Select - Linha, Modelo, Equipamento, Classe (ambas abas) - MULTIPLA SELECAO */}
                <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                  <div className="form-label">Linha</div>
                  <Select
                    mode="multiple"
                    placeholder="Selecione..."
                    value={filters['Line']}
                    onChange={(value) => handleFilterChange('Line', value)}
                    size="small"
                    showSearch
                    maxTagCount="responsive"
                    style={{ width: '100%' }}
                  >
                    {filterOptions.Line.map(opt => (
                      <Option key={opt} value={opt}>{opt}</Option>
                    ))}
                  </Select>
                </Col>
                
                <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                  <div className="form-label">Modelo</div>
                  <Select
                    mode="multiple"
                    placeholder="Selecione..."
                    value={filters['Model']}
                    onChange={(value) => handleFilterChange('Model', value)}
                    size="small"
                    showSearch
                    maxTagCount="responsive"
                    style={{ width: '100%' }}
                  >
                    {filterOptions.Model.map(opt => (
                      <Option key={opt} value={opt}>{opt}</Option>
                    ))}
                  </Select>
                </Col>
                
                <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                  <div className="form-label">Equipamento</div>
                  <Select
                    mode="multiple"
                    placeholder="Selecione..."
                    value={filters['Equipment']}
                    onChange={(value) => handleFilterChange('Equipment', value)}
                    size="small"
                    showSearch
                    maxTagCount="responsive"
                    style={{ width: '100%' }}
                  >
                    {filterOptions.Equipment.map(opt => (
                      <Option key={opt} value={opt}>{opt}</Option>
                    ))}
                  </Select>
                </Col>
                
                <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                  <div className="form-label">Classe</div>
                  <Select
                    mode="multiple"
                    placeholder="Selecione..."
                    value={filters['Classe']}
                    onChange={(value) => handleFilterChange('Classe', value)}
                    size="small"
                    showSearch
                    maxTagCount="responsive"
                    style={{ width: '100%' }}
                  >
                    {filterOptions.Classe.map(opt => (
                      <Option key={opt} value={opt}>{opt}</Option>
                    ))}
                  </Select>
                </Col>
                
                {/* Filtros com Input (ambas abas) - Feeder, Slot, PartCode */}
                {(tabValue === 'home' ? 
                  displayColumns.filter(col => ['Feeder', 'Slot', 'PartCode'].includes(col.id)) :
                  fixedColumnsPorHora.filter(col => ['feeder', 'slot', 'part_code'].includes(col.id))
                ).map(col => (
                  <Col xs={24} sm={12} md={8} lg={6} xl={4} key={col.id}>
                    <div className="form-label">{col.label}</div>
                    <Input
                      placeholder={col.label}
                      value={filters[col.id] || ''}
                      onChange={(e) => handleFilterChange(col.id, e.target.value)}
                      size="small"
                      allowClear
                      style={{ width: '100%' }}
                    />
                  </Col>
                ))}
                
                {/* Limite - apenas Drop Worst, após o último campo (Código) */}
                {tabValue === 'home' && (
                  <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                    <div className="form-label">Limite</div>
                    <Select
                      value={limit}
                      onChange={setLimit}
                      size="small"
                      style={{ width: '100%' }}
                    >
                      <Option value={50}>50</Option>
                      <Option value={100}>100</Option>
                      <Option value={500}>500</Option>
                      <Option value={1000}>1000</Option>
                      <Option value={999999}>Tudo</Option>
                    </Select>
                  </Col>
                )}
                
                {/* Turnos - apenas Por Hora */}
                {tabValue === 'porHora' && (
                  <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                    <div className="form-label">Turno(s)</div>
                    <Select
                      mode="multiple"
                      placeholder="Turnos"
                      value={selectedTurnos}
                      onChange={setSelectedTurnos}
                      size="small"
                      style={{ width: '100%' }}
                      maxTagCount="responsive"
                    >
                      <Option value="1T">1T</Option>
                      <Option value="2T">2T</Option>
                      <Option value="3T">3T</Option>
                    </Select>
                  </Col>
                )}
                
                {/* Botão Pesquisar - sempre no final */}
                <Col xs={24} sm={12} md={8} lg={6} xl={3}>
                  <div className="form-label">&nbsp;</div>
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    onClick={handleRefresh}
                    loading={loading}
                    block
                    size="small"
                  >
                    Pesquisar
                  </Button>
                </Col>
              </Row>
            </Panel>
          </Collapse>
        </Card>

        {/* Estatísticas (apenas aba Home) - Cards MAIORES e FONTES MAIORES */}
        {tabValue === 'home' && (
          <Row gutter={[8, 8]} style={{ marginBottom: 10 }}>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" className="stat-card">
                <div className="stat-content">
                  <Text className="stat-label">Componentes</Text>
                  <Text className="stat-value" strong style={{ fontSize: '24px', color: '#1890ff', fontWeight: 'bold' }}>
                    {limit === 999999 ? filteredData.length : limit}
                  </Text>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Card size="small" className="stat-card">
                <div className="stat-content">
                  <Text className="stat-label">Custo Total</Text>
                  <Text className="stat-value" strong style={{ fontSize: '24px', color: '#ff4d4f', fontWeight: 'bold' }}>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      maximumFractionDigits: 0
                    }).format(totalSum)}
                  </Text>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Card size="small" className="stat-card">
                <div className="stat-content">
                  <Text className="stat-label">Pior Linha</Text>
                  <Text className="stat-value" strong style={{ fontSize: '20px', color: '#ff4d4f', fontWeight: 'bold' }}>
                    {worstLine.line || 'N/A'}
                  </Text>
                  <Text className="stat-subvalue" style={{ fontSize: '12px', fontWeight: 'bold' }}>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      maximumFractionDigits: 0
                    }).format(worstLine.cost)}
                  </Text>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Card size="small" className="stat-card">
                <div className="stat-content">
                  <Text className="stat-label">Pior Part (Qty)</Text>
                  <Text className="stat-value" strong style={{ fontSize: '18px', color: '#1890ff', fontWeight: 'bold' }}>
                    {mostFrequentPartCode.partCode || 'N/A'}
                  </Text>
                  <Text className="stat-subvalue" style={{ fontSize: '12px', fontWeight: 'bold' }}>
                    Qty: {mostFrequentPartCode.totalErrors}x
                  </Text>
                </div>
              </Card>
            </Col>
          </Row>
        )}

        {/* Tabela de dados */}
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Card className="table-container" size="small">
              {tabValue === 'home' ? (
                // Dados aba Home - SEM paginação
                <AntTable
                  columns={homeColumns}
                  dataSource={filteredData.map((row, index) => ({ ...row, key: `${row.PartCode}-${index}` }))}
                  size="small"
                  pagination={false}
                  scroll={{ x: 'max-content' }}
                  rowClassName="home-row"
                />
              ) : (
                // Dados aba Por Hora - COM paginação
                <AntTable
                  columns={porHoraColumns}
                  dataSource={paginatedDataPorHora.map((row, index) => ({ ...row, key: `${row.part_code}-${index}` }))}
                  size="small"
                  pagination={false}
                  scroll={{ x: 1800 }}
                  rowClassName="hour-row"
                />
              )}
            </Card>
            
            {/* Paginação - apenas aba Por Hora */}
            {tabValue === 'porHora' && (
              <div className="pagination-container">
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={filteredDataPorHora.length}
                  onChange={handlePageChange}
                  showSizeChanger
                  pageSizeOptions={['10', '25', '50', '100']}
                  showTotal={(total, range) => `${range[0]}-${range[1]} de ${total} linhas`}
                />
              </div>
            )}
          </>
        )}

        {/* Total geral (apenas aba Home) */}
        {tabValue === 'home' && (
          <Card className="total-card" size="small">
            <Text strong style={{ fontSize: '15px' }}>
              Total Geral: {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0
              }).format(totalSum)}
            </Text>
          </Card>
        )}
      </div>
    </div>
  );
}

export default WorstDropTable;
