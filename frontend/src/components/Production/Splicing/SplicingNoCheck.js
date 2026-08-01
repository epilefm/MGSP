import React, { useState, useEffect, useMemo } from "react";
import { useTable, useSortBy, useGlobalFilter } from 'react-table';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { Box } from "@mui/system";
import { Button, Form, Container, Row, Col, Card, Alert } from "react-bootstrap";
import { SplicingExportToExcel } from './Splicing_NoExport';
import './SplicingNoCheck.css';
import Header from "../../Layout/MGSPHead/Header";

// Estado global para gerenciar seleções de múltiplos motivos
const MotivoContext = React.createContext();

// Componente para célula de motivo
function MotivoCell({ feeder, data, linha, equipamento, lado }) {
  const [motivo, setMotivo] = useState('');
  const [showMotivoModal, setShowMotivoModal] = useState(false);
  const { selectedMotivos, setSelectedMotivos, setShowSaveButton, motivosSelecionados, setMotivosSelecionados } = React.useContext(MotivoContext);

  // Verificar se já existe um motivo salvo
  useEffect(() => {
    const fetchMotivo = async () => {
      try {
        const response = await axios.get(`http://105.103.39.102:8080/getNoSplicingFeederChecks?data=${data}`);
        const checks = response.data.data;
        const check = checks.find(c => c.feeder === feeder);
        if (check) {
          setMotivo(check.motivo);
        }
      } catch (err) {
        console.error('Erro ao buscar motivo:', err);
      }
    };

    fetchMotivo();
  }, [feeder, data]);

  const handleMotivoClick = () => {
    // Se já tem motivo salvo, não permite seleção
    if (motivo) return;
    
    setShowMotivoModal(true);
  };

  const handleMotivoSelect = (motivoSelecionado) => {
    // Adicionar ou atualizar o motivo selecionado para este feeder
    const newItem = {
      feeder,
      data,
      linha,
      equipamento,
      lado,
      motivo: motivoSelecionado
    };
    
    setMotivosSelecionados(prev => {
      // Remover se já existir com os mesmos atributos
      const filtered = prev.filter(item => 
        !(item.feeder === feeder && item.linha === linha && item.equipamento === equipamento && item.lado === lado)
      );
      // Adicionar o novo
      return [...filtered, newItem];
    });
    
    // Adicionar à lista de seleções
    setSelectedMotivos(prev => {
      // Remover se já existir com os mesmos atributos
      const filtered = prev.filter(item => 
        !(item.feeder === feeder && item.linha === linha && item.equipamento === equipamento && item.lado === lado)
      );
      // Adicionar o novo
      return [...filtered, { feeder, data, linha, equipamento, lado }];
    });
    
    // Mostrar botão de salvar se houver itens selecionados
    setShowSaveButton(true);
    setShowMotivoModal(false);
  };

  // Verificar se este feeder está selecionado (considerando linha, equipamento e lado)
  const isSelected = selectedMotivos.some(item => 
    item.feeder === feeder && item.linha === linha && item.equipamento === equipamento && item.lado === lado
  );
  
  const motivoSelecionado = motivosSelecionados.find(item => 
    item.feeder === feeder && item.linha === linha && item.equipamento === equipamento && item.lado === lado
  );

  return (
    <>
      <div 
        onClick={handleMotivoClick} 
        style={{ 
          cursor: motivo ? 'default' : 'pointer', 
          minHeight: '30px', 
          display: 'flex', 
          alignItems: 'center',
          backgroundColor: motivo ? '#EFE9E3' : (isSelected ? '#e3f2fd' : 'transparent'),
          border: isSelected ? '2px solid #2196f3' : '1px solid #dee2e6',
          borderRadius: '4px',
          padding: '0 6px',
          fontWeight: motivo ? 'bold' : 'normal'
        }}
      >
        {motivo || (motivoSelecionado ? motivoSelecionado.motivo : 'Clique para inserir')}
      </div>

      {/* Modal para seleção de motivo */}
      {showMotivoModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Selecione o Motivo</h5>
                <button type="button" className="btn-close" onClick={() => setShowMotivoModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="d-grid gap-2">
                  <button type="button" className="btn btn-outline-primary" onClick={() => handleMotivoSelect('Operacional')}>
                    1 - Operacional
                  </button>
                  <button type="button" className="btn btn-outline-primary" onClick={() => handleMotivoSelect('Falha no barcode')}>
                    2 - Falha no barcode
                  </button>
                  <button type="button" className="btn btn-outline-primary" onClick={() => handleMotivoSelect('Problema no feeder')}>
                    3 - Problema no feeder
                  </button>
                  <button type="button" className="btn btn-outline-primary" onClick={() => handleMotivoSelect('Problema na emenda')}>
                    4 - Problema na emenda
                  </button>
                  <button type="button" className="btn btn-outline-primary" onClick={() => handleMotivoSelect('Outros')}>
                    5 - Outros
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMotivoModal(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Componente para célula de check
function CheckCell({ feeder, data }) {
  const [isChecked, setIsChecked] = useState(false);

  // Verificar se já foi checado
  useEffect(() => {
    const fetchCheckStatus = async () => {
      try {
        const response = await axios.get(`http://105.103.39.102:8080/getNoSplicingFeederChecks?data=${data}`);
        const checks = response.data.data;
        const check = checks.find(c => c.feeder === feeder);
        if (check) {
          setIsChecked(true);
        }
      } catch (err) {
        console.error('Erro ao buscar status de check:', err);
      }
    };

    fetchCheckStatus();
  }, [feeder, data]);

  return (
    <div style={{ textAlign: 'center' }}>
      {isChecked ? (
        // Ícone de check melhorado - bola vermelha
        <span style={{ color: 'red', fontSize: '1.5rem' }}>●</span>
      ) : (
        <span style={{ color: 'gray', fontSize: '1.5rem' }}>○</span>
      )}
    </div>
  );
}

// Componente para gerenciar seleções e salvamento em massa
function MotivoManager({ date, children }) {
  const [selectedMotivos, setSelectedMotivos] = useState([]);
  const [motivosSelecionados, setMotivosSelecionados] = useState([]);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [showMatriculaModal, setShowMatriculaModal] = useState(false);
  const [matricula, setMatricula] = useState('');
  const [error, setError] = useState('');

  // Função para salvar todos os motivos selecionados
  const saveAllMotivos = async () => {
    if (!matricula) {
      setError('Por favor, informe a matrícula');
      return;
    }

    try {
      // Verificar se a matrícula existe
      const response = await axios.get(`http://105.103.39.102:8080/verifyMatricula/${matricula}`);
      if (!response.data.exists) {
        setError('Matrícula não encontrada ou incorreta');
        return;
      }

      // Salvar cada motivo selecionado
      const promises = motivosSelecionados.map(item => {
        return axios.post('http://105.103.39.102:8080/saveNoSplicingFeederCheckWithMotivo', {
          data: item.data,
          feeder: item.feeder,
          matricula: matricula,
          motivo: item.motivo,
          linha: item.linha,
          equipamento: item.equipamento,
          lado: item.lado
        });
      });

      await Promise.all(promises);

      // Limpar seleções após salvar
      setSelectedMotivos([]);
      setMotivosSelecionados([]);
      setShowSaveButton(false);
      setShowMatriculaModal(false);
      setMatricula('');
      setError('');
      
      // Recarregar a página para mostrar os novos dados
      window.location.reload();
    } catch (err) {
      setError('Erro ao salvar os motivos');
      console.error(err);
    }
  };

  // Função para lidar com o Enter no campo de matrícula
  const handleMatriculaKeyPress = (e) => {
    if (e.key === 'Enter') {
      saveAllMotivos();
    }
  };

  return (
    <MotivoContext.Provider value={{
      selectedMotivos,
      setSelectedMotivos,
      setShowSaveButton,
      motivosSelecionados,
      setMotivosSelecionados
    }}>
      {children}
      
      {/* Botão de salvar (aparece quando há seleções) */}
      {showSaveButton && (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000 }}>
          <button 
            className="btn btn-success btn-lg"
            style={{ 
              padding: '20px 30px', 
              fontSize: '20px', 
              fontWeight: 'bold',
              boxShadow: '0 6px 12px rgba(0,0,0,0.3)',
              border: 'none',
              borderRadius: '50px',
              minWidth: '250px'
            }}
            onClick={() => setShowMatriculaModal(true)}
          >
            Salvar ({motivosSelecionados.length}) selecionados
          </button>
        </div>
      )}

      {/* Modal para matrícula */}
      {showMatriculaModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Informe sua Matrícula</h5>
                <button type="button" className="btn-close" onClick={() => setShowMatriculaModal(false)}></button>
              </div>
              <div className="modal-body">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Matrícula"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  onKeyPress={handleMatriculaKeyPress}
                  autoFocus
                />
                {error && <div className="text-danger mt-2">{error}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMatriculaModal(false)}>
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={saveAllMotivos}
                  style={{ 
                    opacity: 1,
                    visibility: 'visible',
                    display: 'inline-block',
                    backgroundColor: '#0d6efd',
                    color: 'white',
                    border: '1px solid #0d6efd',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontWeight: '400',
                    textAlign: 'center',
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Salvar Todos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MotivoContext.Provider>
  );
}

export default function SplicingNoCheck({ inModal = false }) {
  const [listCard, setListCard] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [turno, setTurno] = useState("Todos");
  const [linha, setLinha] = useState("Todas");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uniqueLinhas, setUniqueLinhas] = useState([]);

  const fileName = "Splicing_No_Check_Data";

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`http://105.103.39.102:8080/SplicingNoCheck?data=${date}`);
        setListCard(response.data);
        
        // Extrair linhas únicas para o filtro
        const linhas = [...new Set(response.data.map(item => item.Linha))].sort();
        setUniqueLinhas(linhas);
      } catch (error) {
        console.error('Erro ao buscar dados', error);
        setError('Erro ao carregar os dados. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Configurar atualização automática a cada 2 minutos (120000 ms)
    const interval = setInterval(() => {
      fetchData();
    }, 120000);
    
    // Limpar o intervalo quando o componente for desmontado
    return () => clearInterval(interval);
  }, [date]);

  // Filter data based on turno and linha
  const filteredData = useMemo(() => {
    return listCard.filter(item => {
      const matchTurno = turno === "Todos" || item.Turno === turno;
      const matchLinha = linha === "Todas" || item.Linha === linha;
      return matchTurno && matchLinha;
    });
  }, [listCard, turno, linha]);

  // Buscar itens checados
  const [checkedItems, setCheckedItems] = useState([]);
  
  useEffect(() => {
    const fetchCheckedItems = async () => {
      try {
        const response = await axios.get(`http://105.103.39.102:8080/getNoSplicingFeederChecks?data=${date}`);
        setCheckedItems(response.data.data);
      } catch (err) {
        console.error('Erro ao buscar itens checados:', err);
      }
    };
    
    fetchCheckedItems();
  }, [date]);

  // Calcular indicadores
  const calculateIndicators = useMemo(() => {
    // Total de registros do dia (não muda com filtros)
    const totalRecords = listCard.length;
    
    // Registros filtrados por turno
    const turnoFiltered = turno === "Todos" 
      ? totalRecords 
      : listCard.filter(item => item.Turno === turno).length;
    
    // Worst line (linha com mais erros) - baseado em dados filtrados
    const lineCounts = {};
    filteredData.forEach(item => {
      lineCounts[item.Linha] = (lineCounts[item.Linha] || 0) + 1;
    });
    
    let worstLine = "";
    let worstLineCount = 0;
    Object.entries(lineCounts).forEach(([line, count]) => {
      if (count > worstLineCount) {
        worstLine = line;
        worstLineCount = count;
      }
    });
    
    // Worst feeder da pior linha - baseado em dados filtrados
    let worstFeederOfWorstLine = "";
    let worstFeederOfWorstLineCount = 0;
    
    if (worstLine) {
      // Filtrar dados apenas da pior linha
      const dataFromWorstLine = filteredData.filter(item => item.Linha === worstLine);
      
      // Contar feeders da pior linha
      const feederCountsInWorstLine = {};
      dataFromWorstLine.forEach(item => {
        feederCountsInWorstLine[item.Feeder] = (feederCountsInWorstLine[item.Feeder] || 0) + 1;
      });
      
      // Encontrar o pior feeder da pior linha
      Object.entries(feederCountsInWorstLine).forEach(([feeder, count]) => {
        if (count > worstFeederOfWorstLineCount) {
          worstFeederOfWorstLine = feeder;
          worstFeederOfWorstLineCount = count;
        }
      });
    }
    
    // Worst feeder filtrado (para o novo indicador) - baseado em dados filtrados
    const filteredFeederCounts = {};
    filteredData.forEach(item => {
      filteredFeederCounts[item.Feeder] = (filteredFeederCounts[item.Feeder] || 0) + 1;
    });
    
    let filteredWorstFeeder = "";
    let filteredWorstFeederCount = 0;
    Object.entries(filteredFeederCounts).forEach(([feeder, count]) => {
      if (count > filteredWorstFeederCount) {
        filteredWorstFeeder = feeder;
        filteredWorstFeederCount = count;
      }
    });
    
    // Filtrar itens checados com base no turno selecionado
    const filteredCheckedItems = turno === "Todos" 
      ? checkedItems 
      : checkedItems.filter(item => {
          const dataItem = listCard.find(d => d.Feeder === item.feeder);
          return dataItem && dataItem.Turno === turno;
        });
    
    // Contar itens checados diretamente da tela (itens que têm check visual) - baseado em dados filtrados
    let checkedCount = 0;
    filteredData.forEach(item => {
      // Verificar se este item tem check marcado (baseado nos dados do banco)
      const hasCheck = checkedItems.some(checkedItem => 
        checkedItem.feeder === item.Feeder
      );
      if (hasCheck) {
        checkedCount++;
      }
    });
    
    // Worst motivo (motivo mais repetido) - baseado em dados filtrados
    const motivoCounts = {};
    filteredCheckedItems.forEach(item => {
      motivoCounts[item.motivo] = (motivoCounts[item.motivo] || 0) + 1;
    });
    
    let worstMotivo = "";
    let worstMotivoCount = 0;
    Object.entries(motivoCounts).forEach(([motivo, count]) => {
      if (count > worstMotivoCount) {
        worstMotivo = motivo;
        worstMotivoCount = count;
      }
    });
    
    return {
      totalRecords,
      turnoFiltered,
      worstLine: worstLine || "N/A",
      worstLineCount,
      worstFeederOfWorstLine: worstFeederOfWorstLine || "N/A",
      worstFeederOfWorstLineCount,
      filteredWorstFeeder: filteredWorstFeeder || "N/A",  // Worst feeder filtrado
      filteredWorstFeederCount,
      checkedCount,
      worstMotivo: worstMotivo || "N/A",
      worstMotivoCount
    };
  }, [listCard, filteredData, turno, checkedItems]);

  // Função para salvar indicadores no servidor
  const saveIndicatorsToServer = async (indicators) => {
    try {
      const response = await axios.post('http://105.103.39.102:8080/splicing-nocheck-indicators', {
        data: date,
        total_por_turno: indicators.turnoFiltered,
        worst_line: indicators.worstLine,
        worst_line_qty: indicators.worstLineCount,
        worst_feeder: indicators.worstFeederOfWorstLine,
        worst_feeder_qty: indicators.worstFeederOfWorstLineCount,
        itens_checados: indicators.checkedCount,
        total_registros: indicators.totalRecords,
        worst_motivo: indicators.worstMotivo,
        worst_motivo_qty: indicators.worstMotivoCount
      });
      
      console.log('Indicadores salvos com sucesso:', response.data);
    } catch (error) {
      console.error('Erro ao salvar indicadores:', error);
    }
  };

  // Salvar indicadores periodicamente (a cada 2 minutos)
  useEffect(() => {
    // Salvar imediatamente quando os indicadores mudarem
    if (calculateIndicators) {
      saveIndicatorsToServer(calculateIndicators);
    }
    
    // Configurar intervalo para salvar a cada 2 minutos
    const interval = setInterval(() => {
      if (calculateIndicators) {
        saveIndicatorsToServer(calculateIndicators);
      }
    }, 120000); // 2 minutos em milissegundos
    
    // Limpar intervalo quando o componente for desmontado
    return () => clearInterval(interval);
  }, [calculateIndicators, date]);

  // Columns definition
  const columns = useMemo(() => [
    { 
      Header: 'Data/Hora', 
      accessor: 'Data',
      Cell: ({ value }) => <span style={{ whiteSpace: 'nowrap' }}>{value}</span>
    },
    { Header: 'Turno', accessor: 'Turno' },
    { Header: 'Linha', accessor: 'Linha' },
    { Header: 'Equipamento', accessor: 'Equipamento' },
    { Header: 'Lado', accessor: 'Lado' },
 //   { Header: 'Erro', accessor: 'Erro' },
    { Header: 'Feeder', accessor: 'Feeder' },
    {
      Header: 'Motivo',
      accessor: 'Motivo',
      Cell: ({ row }) => (
        <MotivoCell 
          feeder={row.original.Feeder} 
          data={date} 
          linha={row.original.Linha}
          equipamento={row.original.Equipamento}
          lado={row.original.Lado}
        />
      )
    },
    {
      Header: 'Check',
      accessor: 'Check',
      Cell: ({ row }) => <CheckCell feeder={row.original.Feeder} data={date} />
    }
  ], [date]);

  // Table instance (sem paginação)
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state: { globalFilter },
    setGlobalFilter,
  } = useTable(
    {
      columns,
      data: filteredData,
    },
    useGlobalFilter,
    useSortBy
  );

  // Get unique turnos for filter
  const uniqueTurnos = [...new Set(listCard.map(item => item.Turno))].sort();

  return (
    <MotivoManager date={date}>
      <Header/>
      <Container fluid className="splicing-no-check-container">
        <Row className="mb-4">
          <Col>
            <h2 className="splicing-title">Monitoramento de No Splicing Check</h2>
          </Col>
        </Row>

        {/* Indicadores (movidos para cima) */}
        <Row className="splicing-no-check-indicators-row">
          <Col md={2}>
            <Card className="text-center h-75 splicing-no-check-card">
              <Card.Body className="d-flex flex-column justify-content-center p-2">
                <Card.Title className="mb-1 splicing-no-check-card-title">Qty por Turno</Card.Title>
                <Card.Text className="splicing-no-check-display-4 mb-0">{calculateIndicators.turnoFiltered}</Card.Text>
                <div className="splicing-no-check-small mt-1">
                  {turno === "Todos" ? "Todos os turnos" : `Turno: ${turno}`}
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={2}>
            <Card className="text-center h-75 splicing-no-check-card">
              <Card.Body className="d-flex flex-column justify-content-center p-2">
                <Card.Title className="mb-1 splicing-no-check-card-title">Worst Line</Card.Title>
                <Card.Text className="splicing-no-check-display-6 mb-0">{calculateIndicators.worstLine}</Card.Text>
                <div className="splicing-no-check-small mt-1">Qty: {calculateIndicators.worstLineCount}</div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={2}>
            <Card className="text-center h-75 splicing-no-check-card">
              <Card.Body className="d-flex flex-column justify-content-center p-2">
                <Card.Title className="mb-1 splicing-no-check-card-title">Worst Feeder</Card.Title>
                <Card.Text className="splicing-no-check-display-6 mb-0">{calculateIndicators.worstFeederOfWorstLine}</Card.Text>
                <div className="splicing-no-check-small mt-1">Qty: {calculateIndicators.worstFeederOfWorstLineCount}</div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={2}>
            <Card className="text-center h-75 splicing-no-check-card">
              <Card.Body className="d-flex flex-column justify-content-center p-2">
                <Card.Title className="mb-1 splicing-no-check-card-title">Itens Checados</Card.Title>
                <Card.Text className="splicing-no-check-display-4 mb-0">
                  {calculateIndicators.checkedCount} / {calculateIndicators.totalRecords}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={2}>
            <Card className="text-center h-75 splicing-no-check-card">
              <Card.Body className="d-flex flex-column justify-content-center p-2">
                <Card.Title className="mb-1 splicing-no-check-card-title">Worst Motivo</Card.Title>
                <Card.Text className="splicing-no-check-display-6 mb-0">{calculateIndicators.worstMotivo}</Card.Text>
                <div className="splicing-no-check-small mt-1">Qty: {calculateIndicators.worstMotivoCount}</div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={2}>
            {/* Espaço em branco para manter o layout */}
          </Col>
        </Row>

        {/* Filtros (movidos para baixo) */}
        <Card className="mb-4">
          <Card.Body>
            <Row className="align-items-end">
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="splicing-no-check-form-label">Data</Form.Label>
                <Form.Control
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="splicing-no-check-form-control"
                />
                </Form.Group>
              </Col>
              
              <Col md={2}>
                <Form.Group>
                  <Form.Label className="splicing-no-check-form-label">Turno</Form.Label>
                  <Form.Select
                    value={turno}
                    onChange={(e) => setTurno(e.target.value)}
                    className="splicing-no-check-form-select"
                  >
                    <option value="Todos">Todos</option>
                    {uniqueTurnos.map(turno => (
                      <option key={turno} value={turno}>{turno}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={2}>
                <Form.Group>
                  <Form.Label className="splicing-no-check-form-label">Linha</Form.Label>
                  <Form.Select
                    value={linha}
                    onChange={(e) => setLinha(e.target.value)}
                    className="splicing-no-check-form-select"
                  >
                    <option value="Todas">Todas</option>
                    {uniqueLinhas.map(linha => (
                      <option key={linha} value={linha}>{linha}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="splicing-no-check-form-label">Buscar</Form.Label>
                  <Form.Control
                    type="text"
                    value={globalFilter || ''}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Pesquisar em toda tabela..."
                    className="splicing-no-check-form-control"
                  />
                </Form.Group>
              </Col>
              
              <Col md={2}>
                <SplicingExportToExcel apiData={filteredData} fileName={fileName} />
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Mensagens de erro ou carregamento */}
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible className="splicing-no-check-alert">
            {error}
          </Alert>
        )}
        
        {loading && (
          <div className="text-center my-4">
            <div className="spinner-border splicing-no-check-spinner-border" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
          </div>
        )}

        {/* Tabela (sem paginação) */}
        <Card>
          <Card.Body>
            <div className="table-responsive">
              <table {...getTableProps()} className="table table-striped table-hover splicing-no-check-table">
                <thead>
                  {headerGroups.map(headerGroup => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                      {headerGroup.headers.map(column => (
                        <th 
                          {...column.getHeaderProps(column.getSortByToggleProps())}
                          style={{ padding: '0.5rem' }}
                        >
                          {column.render('Header')}
                          <span>
                            {column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}
                          </span>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                  {rows.map(row => {
                    prepareRow(row);
                    return (
                      <tr {...row.getRowProps()}>
                        {row.cells.map(cell => {
                          return (
                            <td 
                              {...cell.getCellProps()}
                              style={{ padding: '0.1rem' }}
                            >
                              {cell.render('Cell')}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </MotivoManager>
  );
}
