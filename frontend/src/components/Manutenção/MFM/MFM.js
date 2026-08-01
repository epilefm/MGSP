import { API_URL } from '../../../config/api';
import React, { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import './MFM.css';

const MFM = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [shift, setShift] = useState('1T');
  const [expandedRows, setExpandedRows] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Função para buscar dados da API
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/smd-kitting-mx`);
      if (!response.ok) {
        throw new Error('Falha ao buscar dados');
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Determinar se uma linha pertence ao turno atual
  const isLineInShift = (lineName) => {
    // Extrair número da linha (ex: SMD-02 -> 2, SMD-15 -> 15)
    const lineMatch = lineName.match(/SMD-(\d+)/);
    if (!lineMatch) return false;
    
    const lineNumber = parseInt(lineMatch[1], 10);
    
    if (shift === '1T') {
      // 1T: linhas 2 até 11
      return lineNumber >= 2 && lineNumber <= 11;
    } else {
      // 2T: linhas 12 até 38
      return lineNumber >= 12 && lineNumber <= 38;
    }
  };

  // Função para extrair número da linha
  const extractLineNumber = (lineName) => {
    const match = lineName.match(/SMD-(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Processar dados para agrupar por linha
  const processData = (rawData) => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    // Filtrar dados do dia atual
    const todayData = rawData.filter(item => 
      item.WO_PLAN_START_YMD === today
    );
    
    // Filtrar dados pelo turno
    const shiftData = todayData.filter(item => 
      isLineInShift(item.LINE_NM)
    );
    
    // Agrupar por linha
    const groupedData = {};
    
    shiftData.forEach(item => {
      const line = item.LINE_NM;
      
      if (!groupedData[line]) {
        groupedData[line] = {
          line: line,
          total: 0,
          done: 0,
          pending: 0,
          startTime: shift === '1T' ? '07:00' : '17:00',
          endTime: shift === '1T' ? '15:00' : '21:00',
          pendingItems: [],
          items: []
        };
      }
      
      groupedData[line].total++;
      groupedData[line].items.push(item);
      
      if (item.CHK_YN === 'Y') {
        groupedData[line].done++;
      } else {
        groupedData[line].pending++;
        groupedData[line].pendingItems.push(item);
      }
    });
    
    // Converter para array e ordenar numericamente por número da linha
    const sortedData = Object.values(groupedData).sort((a, b) => {
      return extractLineNumber(a.line) - extractLineNumber(b.line);
    });
    
    return sortedData;
  };

  // Verificar se está próximo do horário limite
  const isNearDeadline = (pendingCount) => {
    const now = new Date();
    const currentHour = now.getHours();
    
    if (shift === '1T') {
      // Turno 1: 7h às 15h
      return (currentHour >= 13 && pendingCount > 0); // Após 13h com pendências
    } else {
      // Turno 2: 17h às 1h
      return ((currentHour >= 22 || currentHour < 1) && pendingCount > 0); // Após 22h ou antes de 1h com pendências
    }
  };

  // Alternar expansão de linha
  const toggleRowExpansion = (line) => {
    setExpandedRows(prev => ({
      ...prev,
      [line]: !prev[line]
    }));
  };

  // Atualizar dados filtrados quando os dados ou turno mudarem
  useEffect(() => {
    if (data.length > 0) {
      setFilteredData(processData(data));
    }
  }, [data, shift]);

  // Buscar dados a cada 30 segundos
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calcular dados para os gráficos
  const calculateChartStats = () => {
    // Calcular totais gerais
    let totalEquipment = 0;
    let doneEquipment = 0;
    let pendingEquipment = 0;
    
    filteredData.forEach(row => {
      totalEquipment += row.total;
      doneEquipment += row.done;
      pendingEquipment += row.pending;
    });
    
    // Calcular porcentagem por linha
    const linePercentages = filteredData.map(row => ({
      name: row.line,
      percentage: row.total > 0 ? Math.round((row.done / row.total) * 100) : 0
    }));
    
    return {
      totalEquipment,
      doneEquipment,
      pendingEquipment,
      linePercentages
    };
  };

  // Função para determinar a cor com base na porcentagem
  const getColorByPercentage = (percentage) => {
    if (percentage === 100) return '#10b981'; // Verde esmeralda para 100%
    if (percentage >= 75) return '#3b82f6';   // Azul para 75-99%
    if (percentage >= 50) return '#8b5cf6';   // Roxo para 50-74%
    if (percentage >= 25) return '#f59e0b';   // Âmbar para 25-49%
    return '#ef4444';                        // Vermelho para 0-24%
  };

  // Configuração do gráfico de totais (pizza)
  const getTotalChartOptions = (stats) => {
    return {
      chart: {
        type: 'pie',
        height: 250,
        toolbar: {
          show: false
        }
      },
      labels: ['Feitos', 'Pendentes'],
      colors: ['#48bb78', '#ed8936'],
      dataLabels: {
        enabled: true,
        formatter: function (val) {
          return Math.round(val) + "%";
        },
        style: {
          colors: ['#fff'],
          fontSize: '14px',
          fontWeight: 600
        },
        dropShadow: {
          enabled: false
        }
      },
      legend: {
        position: 'right',
        fontSize: '12px'
      },
      tooltip: {
        y: {
          formatter: function (val, { seriesIndex }) {
            const values = [stats.doneEquipment, stats.pendingEquipment];
            return values[seriesIndex] + " equipamentos";
          }
        }
      }
    };
  };

  // Configuração do gráfico de porcentagens (barras verticais) - Versão 3.0
  const getPercentageChartOptions = (data, colors) => {
    return {
      chart: {
        type: 'bar',
        height: 250,
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '60%',
          endingShape: 'rounded',
          distributed: false,
          borderRadius: 4
        },
      },
      dataLabels: {
        enabled: true,
        formatter: function (val) {
          return val + "%";
        },
        style: {
          colors: ['#2d3748'],
          fontSize: '12px',
          fontWeight: 600
        },
        background: {
          enabled: true,
          foreColor: '#fff',
          borderRadius: 2,
          padding: 4,
          opacity: 0.9,
          borderWidth: 1,
          borderColor: '#e2e8f0'
        }
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: percentageChartCategories,
        labels: {
          style: {
            colors: '#4a5568',
            fontSize: '11px'
          }
        }
      },
      yaxis: {
        title: {
          text: 'Porcentagem',
          style: {
            color: '#2d3748',
            fontSize: '12px',
            fontWeight: 600
          }
        },
        max: 100,
        labels: {
          style: {
            colors: '#4a5568',
            fontSize: '11px'
          }
        }
      },
      grid: {
        show: true,
        borderColor: '#e2e8f0',
        strokeDashArray: 3,
        xaxis: {
          lines: {
            show: false
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        }
      },
      fill: {
        opacity: 1,
        colors: colors
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return val + "%"
          }
        },
        theme: 'light'
      },
      legend: {
        position: 'top',
        horizontalAlign: 'center',
        fontSize: '12px',
        markers: {
          width: 12,
          height: 12,
          radius: 12
        }
      }
    };
  };

  // Renderizar indicador de status
  const renderStatus = (pending, total) => {
    if (pending === 0) {
      return <span className="status completed">Concluído</span>;
    } else {
      return <span className="status pending">Pendente</span>;
    }
  };

  if (loading) {
    return <div className="mfm-container">Carregando...</div>;
  }

  if (error) {
    return <div className="mfm-container error">Erro: {error}</div>;
  }

  const stats = calculateChartStats();
  const totalChartData = [stats.doneEquipment, stats.pendingEquipment];
  const percentageChartData = stats.linePercentages.map(item => item.percentage);
  const percentageChartCategories = stats.linePercentages.map(item => item.name);
  
  // Gerar cores para cada barra com base na porcentagem
  const barColors = percentageChartData.map(percentage => getColorByPercentage(percentage));

  return (
    <div className="mfm-container">
      <h1 className="mfm-title">MFM - Monitoramento de Check de Equipamentos</h1>
      
      <div className="shift-filter">
        <button 
          className={shift === '1T' ? 'shift-button active' : 'shift-button'}
          onClick={() => setShift('1T')}
        >
          1º Turno (07:00 - 15:00)
        </button>
        <button 
          className={shift === '2T' ? 'shift-button active' : 'shift-button'}
          onClick={() => setShift('2T')}
        >
          2º Turno (17:00 - 21:00)
        </button>
      </div>
      
      <div className="charts-container">
        <div className="chart-wrapper">
          <h3>Total de Equipamentos</h3>
          <Chart
            options={getTotalChartOptions(stats)}
            series={totalChartData}
            type="pie"
            height={250}
          />
        </div>
        <div className="chart-wrapper">
          <h3>Porcentagem por Linha</h3>
          <Chart
            options={getPercentageChartOptions(percentageChartData, barColors)}
            series={[{
              name: 'Porcentagem',
              data: percentageChartData
            }]}
            type="bar"
            height={250}
          />
        </div>
      </div>
      
      <div className="table-container">
        <table className="mfm-table">
          <thead>
            <tr>
              <th>Linha</th>
              <th>Qty Pendente</th>
              <th>Qty Feito</th>
              <th>Qty Total</th>
              <th>Hora Início</th>
              <th>Hora Término</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, index) => (
              <React.Fragment key={row.line}>
                <tr className={isNearDeadline(row.pending) ? 'near-deadline' : ''}>
                  <td>{row.line}</td>
                  <td>
                    <button 
                      className="pending-button"
                      onClick={() => toggleRowExpansion(row.line)}
                      disabled={row.pending === 0}
                    >
                      <span className="icon">
                        {row.pending > 0 ? '⚠️' : '✓'}
                      </span>
                      <span className="count">{row.pending}</span>
                      {row.pending > 0 && (
                        <span className="icon">
                          {expandedRows[row.line] ? '▲' : '▼'}
                        </span>
                      )}
                    </button>
                  </td>
                  <td>{row.done}</td>
                  <td>{row.total}</td>
                  <td>{row.startTime}</td>
                  <td>{row.endTime}</td>
                  <td>{renderStatus(row.pending, row.total)}</td>
                </tr>
                {expandedRows[row.line] && row.pendingItems.length > 0 && (
                  <tr className="expanded-row">
                    <td colSpan="7">
                      <div className="pending-items">
                        <h4>Equipamentos Pendentes - Linha {row.line}</h4>
                        <ul>
                          {(() => {
                            // Agrupar itens pendentes por equipamento
                            const groupedByEquipment = {};
                            row.pendingItems.forEach(item => {
                              if (!groupedByEquipment[item.LINE_EQSEQ]) {
                                groupedByEquipment[item.LINE_EQSEQ] = 0;
                              }
                              groupedByEquipment[item.LINE_EQSEQ]++;
                            });
                            
                            // Ordenar equipamentos em ordem alfabética
                            const sortedEquipment = Object.entries(groupedByEquipment).sort(([a], [b]) => a.localeCompare(b));
                            
                            return sortedEquipment.map(([equipment, count], idx) => (
                              <li key={idx}>
                                <strong>{equipment}</strong>
                                <span>{count} item{count > 1 ? 's' : ''}</span>
                              </li>
                            ));
                          })()}
                        </ul>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MFM;
