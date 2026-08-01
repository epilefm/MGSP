import React, { useState } from 'react';
import KpiChart from './KpiChart';

const KpiDashboard = ({ data }) => {
  const [turnoSelecionado, setTurnoSelecionado] = useState('Todos');
  
  // Componente de tabela personalizado que permite controlar o turno
  const KpiQualityTableWithTurno = ({ data }) => {
    // Obter metas do primeiro item dos dados, ou usar valores padrão
    const targets = data && data.length > 0 && data[0].metas 
      ? data[0].metas 
      : {
          'P-AOI': 635,
          'M-AOI': 377,
          'S-AOI': 112,
          'FT': 1309,
          'TEACHING M': 2.0,
          'TEACHING S': 2.0
        };

    const isWithinTarget = (indicator, value) => {
      if (value === null || value === undefined) return null;
      
      return value <= (targets[indicator] || 0);
    };

    const formatNumber = (value, indicator) => {
      if (value === null || value === undefined) return "—";
      if (indicator === 'TEACHING M' || indicator === 'TEACHING S') {
        return value.toFixed(2);
      }
      return value.toLocaleString('pt-BR');
    };

    const getValueStyle = (value, indicator) => {
      const withinTarget = isWithinTarget(indicator, value);
      if (withinTarget === null) return "kpi-quality-cell-muted";
      return withinTarget ? "kpi-quality-cell-normal" : "kpi-quality-cell-fora";
    };

    const getDiffDisplay = (current, previous, indicator) => {
      if (current === null || current === undefined || previous === null || previous === undefined) {
        return (
          <span className="kpi-quality-diff-neutral">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>—</span>
          </span>
        );
      }

      const diff = current - previous;
      const isGood = diff < 0;
      
      const formattedDiff = indicator === 'TEACHING M' || indicator === 'TEACHING S'
        ? (diff > 0 ? '+' : '') + diff.toFixed(2)
        : (diff > 0 ? '+' : '') + diff.toLocaleString('pt-BR');
      
      return (
        <span className={`kpi-quality-diff-display ${isGood ? 'kpi-quality-diff-good' : 'kpi-quality-diff-bad'}`}>
          {isGood ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
              <polyline points="16 7 22 7 22 13"></polyline>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline>
              <polyline points="16 17 22 17 22 11"></polyline>
            </svg>
          )}
          <span>{formattedDiff}</span>
        </span>
      );
    };

    // Obter horários dos 3 turnos de trabalho (07:00 às 06:00 do dia seguinte)
    const getHorasTurno = () => {
      const horas = [];
      // 1T: 07:00 às 17:00 (corrigido para começar às 7h)
      for (let i = 7; i <= 17; i++) {
        horas.push(`${i.toString().padStart(2, '0')}:00`);
      }
      // 2T: 17:00 às 02:00
      for (let i = 17; i <= 23; i++) {
        horas.push(`${i.toString().padStart(2, '0')}:00`);
      }
      horas.push('00:00');
      horas.push('01:00');
      horas.push('02:00');
      // 3T: 02:00 às 06:00
      for (let i = 3; i <= 6; i++) { // Corrigido para começar às 3h
        horas.push(`${i.toString().padStart(2, '0')}:00`);
      }
      return horas;
    };
    
    const horasTurno = getHorasTurno();
    
    // Filtrar horas por turno selecionado
    const filtrarHorasPorTurno = (horas) => {
      if (turnoSelecionado === 'Todos') return horas;
      
      switch (turnoSelecionado) {
        case '1T':
          return horas.filter(hora => {
            const h = parseInt(hora.split(':')[0]);
            return (h >= 7 && h <= 17); // Corrigido para começar às 7h
          });
        case '2T':
          return horas.filter(hora => {
            const h = parseInt(hora.split(':')[0]);
            return (h >= 17 && h <= 23) || (h >= 0 && h <= 2);
          });
        case '3T':
          return horas.filter(hora => {
            const h = parseInt(hora.split(':')[0]);
            return (h >= 3 && h <= 6); // Corrigido para começar às 3h
          });
        default:
          return horas;
      }
    };
    
    const horasFiltradas = filtrarHorasPorTurno(horasTurno);

    // Preparar dados para a tabela transposta
    const indicadores = ['P-AOI', 'M-AOI', 'S-AOI', 'FT', 'TEACHING M', 'TEACHING S'];


    // Função para obter o último valor de cada indicador para uma hora específica
    const getUltimoValorPorHora = (hora, indicador) => {
      // Verificar se a hora está no turno selecionado
      const horaInt = parseInt(hora.split(':')[0]);
      const horaNoTurno = (() => {
        switch (turnoSelecionado) {
          case '1T':
            return horaInt >= 7 && horaInt <= 17; // Corrigido para começar às 7h
          case '2T':
            return (horaInt >= 17 && horaInt <= 23) || (horaInt >= 0 && horaInt <= 2);
          case '3T':
            return horaInt >= 3 && horaInt <= 6; // Corrigido para começar às 3h
          default:
            return true; // Todos os turnos
        }
      })();
      
      if (!horaNoTurno) return null;
      
      // Filtrar dados para a hora específica usando a nova coluna hora_referencia
      const dadosHora = data.filter(item => {
        // Verificar se o item tem a propriedade hora_referencia
        if (item['hora_referencia'] !== undefined && item['hora_referencia'] !== null) {
          return item['hora_referencia'] === horaInt;
        }
        // Fallback para o método antigo se hora_referencia não estiver disponível
        const horaColeta = new Date(item['data_hora_coleta']).getHours();
        return horaColeta === horaInt;
      });
      
      // Ordenar por data de coleta (mais recente primeiro)
      dadosHora.sort((a, b) => new Date(b['data_hora_coleta']) - new Date(a['data_hora_coleta']));
      
      // Retornar o valor mais recente ou null se não houver dados
      if (dadosHora.length > 0) {
        return dadosHora[0][indicador] !== undefined ? dadosHora[0][indicador] : null;
      }
      return null;
    };

    const tabelaTransposta = indicadores.map(indicador => {
      const valoresPorHora = {};
      horasFiltradas.forEach(hora => {
        valoresPorHora[hora] = getUltimoValorPorHora(hora, indicador);
      });
      
      // Calcular diferença entre os dois últimos valores do turno selecionado
      const valoresValidos = data
        .filter(item => {
          if (item[indicador] === undefined || item[indicador] === null) return false;
          
          // Verificar se o item está no turno selecionado
          const horaColeta = new Date(item['data_hora_coleta']).getHours();
          switch (turnoSelecionado) {
            case '1T':
              return horaColeta >= 7 && horaColeta <= 17; // Corrigido para começar às 7h
            case '2T':
              return (horaColeta >= 17 && horaColeta <= 23) || (horaColeta >= 0 && horaColeta <= 2);
            case '3T':
              return horaColeta >= 3 && horaColeta <= 6; // Corrigido para começar às 3h
            default:
              return true; // Todos os turnos
          }
        })
        .sort((a, b) => new Date(a['data_hora_coleta']) - new Date(b['data_hora_coleta']));
      
      // Calcular diferença entre os dois últimos valores da mesma hora
      let diff = null;
      if (valoresValidos.length >= 2) {
        // Ordenar por data de coleta (mais recente primeiro)
        const valoresOrdenados = [...valoresValidos].sort((a, b) => 
          new Date(b['data_hora_coleta']) - new Date(a['data_hora_coleta'])
        );
        
        if (valoresOrdenados.length >= 2) {
          const ultimo = valoresOrdenados[0][indicador];
          const penultimo = valoresOrdenados[1][indicador];
          diff = ultimo - penultimo;
        }
      }
      
      return {
        indicador,
        target: targets[indicador],
        valoresPorHora,
        diff,
        valoresValidos // Adicionando valoresValidos ao objeto retornado
      };
    });

    return (
      <div className="kpi-quality-table-container">
        <h3 className="kpi-quality-table-title">Defect Rate - KPI Quality (PPM)</h3>
        {/* Filtro de turno */}
        <div className="kpi-quality-turno-filter">
          <label htmlFor="turno-select">Filtrar por Turno: </label>
          <select 
            id="turno-select"
            value={turnoSelecionado} 
            onChange={(e) => setTurnoSelecionado(e.target.value)}
            className="kpi-quality-turno-select"
          >
            <option value="Todos">Todos</option>
            <option value="1T">1T (07:00 - 17:00)</option>
            <option value="2T">2T (17:00 - 02:00)</option>
            <option value="3T">3T (03:00 - 06:00)</option>
          </select>
        </div>
        <div className="kpi-quality-table-wrapper">
          <table className="kpi-quality-table">
            <thead>
              <tr className="kpi-quality-table-header">
                <th className="kpi-quality-header-cell indicator-header">Indicador</th>
                <th className="kpi-quality-header-cell target-header">Meta</th>
                {horasFiltradas.map((hora, index) => (
                  <th key={index} className="kpi-quality-header-cell hour-header">{hora}</th>
                ))}
                <th className="kpi-quality-header-cell diff-header">Diferença</th>
              </tr>
            </thead>
            <tbody>
              {tabelaTransposta.map((row, index) => (
                <tr key={row.indicador} className="kpi-quality-data-row" style={{ animationDelay: `${index * 50}ms` }}>
                  <td className="kpi-quality-data-cell kpi-quality-indicator-name">{row.indicador}</td>
                  <td className="kpi-quality-data-cell kpi-quality-target-cell">≤{row.indicador.includes('TEACHING') ? row.target.toFixed(1) : row.target.toLocaleString('pt-BR')}</td>
                  {horasFiltradas.map((hora, horaIndex) => (
                    <td 
                      key={horaIndex} 
                      className={`kpi-quality-data-cell kpi-quality-value-cell ${getValueStyle(row.valoresPorHora[hora], row.indicador)}`}
                    >
                      {formatNumber(row.valoresPorHora[hora], row.indicador)}
                    </td>
                  ))}
                  <td className="kpi-quality-data-cell kpi-quality-diff-cell">
                    {getDiffDisplay(
                      row.valoresValidos && row.valoresValidos.length >= 2 ? row.valoresValidos[row.valoresValidos.length - 1][row.indicador] : null,
                      row.valoresValidos && row.valoresValidos.length >= 2 ? row.valoresValidos[row.valoresValidos.length - 2][row.indicador] : null,
                      row.indicador
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Processar dados para o gráfico usando a mesma lógica da tabela
  const processarDadosParaGrafico = () => {
    // Obter horários dos 3 turnos de trabalho (07:00 às 06:00 do dia seguinte)
    const getHorasTurno = () => {
      const horas = [];
      // 1T: 07:00 às 17:00 (corrigido para começar às 7h)
      for (let i = 7; i <= 17; i++) {
        horas.push(`${i.toString().padStart(2, '0')}:00`);
      }
      // 2T: 17:00 às 02:00
      for (let i = 17; i <= 23; i++) {
        horas.push(`${i.toString().padStart(2, '0')}:00`);
      }
      horas.push('00:00');
      horas.push('01:00');
      horas.push('02:00');
      // 3T: 02:00 às 06:00
      for (let i = 3; i <= 6; i++) { // Corrigido para começar às 3h
        horas.push(`${i.toString().padStart(2, '0')}:00`);
      }
      return horas;
    };
    
    const horasTurno = getHorasTurno();
    
    // Filtrar horas por turno selecionado
    const filtrarHorasPorTurno = (horas) => {
      if (turnoSelecionado === 'Todos') return horas;
      
      switch (turnoSelecionado) {
        case '1T':
          return horas.filter(hora => {
            const h = parseInt(hora.split(':')[0]);
            return (h >= 7 && h <= 17); // Corrigido para começar às 7h
          });
        case '2T':
          return horas.filter(hora => {
            const h = parseInt(hora.split(':')[0]);
            return (h >= 17 && h <= 23) || (h >= 0 && h <= 2);
          });
        case '3T':
          return horas.filter(hora => {
            const h = parseInt(hora.split(':')[0]);
            return (h >= 3 && h <= 6); // Corrigido para começar às 3h
          });
        default:
          return horas;
      }
    };
    
    const horasFiltradas = filtrarHorasPorTurno(horasTurno);
    
    // Preparar dados para a tabela transposta
    const indicadores = ['P-AOI', 'M-AOI', 'S-AOI', 'FT', 'TEACHING M', 'TEACHING S'];
    
    // Função para obter o último valor de cada indicador para uma hora específica
    const getUltimoValorPorHora = (hora, indicador) => {
      // Verificar se a hora está no turno selecionado
      const horaInt = parseInt(hora.split(':')[0]);
      const horaNoTurno = (() => {
        switch (turnoSelecionado) {
          case '1T':
            return horaInt >= 7 && horaInt <= 17; // Corrigido para começar às 7h
          case '2T':
            return (horaInt >= 17 && horaInt <= 23) || (horaInt >= 0 && horaInt <= 2);
          case '3T':
            return horaInt >= 3 && horaInt <= 6; // Corrigido para começar às 3h
          default:
            return true; // Todos os turnos
        }
      })();
      
      if (!horaNoTurno) return null;
      
      // Filtrar dados para a hora específica usando a nova coluna hora_referencia
      const dadosHora = data.filter(item => {
        // Verificar se o item tem a propriedade hora_referencia
        if (item['hora_referencia'] !== undefined && item['hora_referencia'] !== null) {
          return item['hora_referencia'] === horaInt;
        }
        // Fallback para o método antigo se hora_referencia não estiver disponível
        const horaColeta = new Date(item['data_hora_coleta']).getHours();
        return horaColeta === horaInt;
      });
      
      // Ordenar por data de coleta (mais recente primeiro)
      dadosHora.sort((a, b) => new Date(b['data_hora_coleta']) - new Date(a['data_hora_coleta']));
      
      // Retornar o valor mais recente ou null se não houver dados
      if (dadosHora.length > 0) {
        return dadosHora[0][indicador] !== undefined ? dadosHora[0][indicador] : null;
      }
      return null;
    };
    
    // Criar dados para o gráfico no formato que o ApexCharts espera
    const chartData = [];
    
    // Para cada hora filtrada, criar um ponto de dados
    horasFiltradas.forEach(hora => {
      const ponto = {
        hora: hora,
        timestamp: hora, // Usar a hora como timestamp para ordenação
        valores: {}
      };
      
      // Para cada indicador, obter o valor da hora
      indicadores.forEach(indicador => {
        if (indicador !== 'TEACHING M' && indicador !== 'TEACHING S') { // Excluir TEACHING do gráfico
          const valor = getUltimoValorPorHora(hora, indicador);
          ponto.valores[indicador] = valor !== null ? valor : 0;
        }
      });
      
      chartData.push(ponto);
    });
    
    // Ordenar os dados por hora
    chartData.sort((a, b) => {
      const [horaA] = a.hora.split(':').map(Number);
      const [horaB] = b.hora.split(':').map(Number);
      
      // Tratar casos especiais de turnos
      if (turnoSelecionado === '2T' || turnoSelecionado === '3T') {
        // Para turnos da noite, 00:00, 01:00, 02:00 vêm depois de 17:00, 18:00, etc.
        if (horaA >= 17 && horaB <= 2) return -1;
        if (horaA <= 2 && horaB >= 17) return 1;
      }
      
      return horaA - horaB;
    });
    
    return chartData;
  };
  
  const dadosGrafico = processarDadosParaGrafico();
  
  return (
    <>
      {/* Tabela transposta de dados */}
      <KpiQualityTableWithTurno data={data} />
      
      {/* Gráfico de tendências */}
      <KpiChart data={dadosGrafico} turnoSelecionado={turnoSelecionado} />
    </>
  );
};

export default KpiDashboard;
