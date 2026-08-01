import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './KPI_Quality.css';
import DashboardHeader from './DashboardHeader';
import StatusIndicator from './StatusIndicator';
import KpiDashboard from './KpiDashboard';
import Header from '../../Layout/MGSPHead/Header';

const KPIQuality = () => {
  const [dadosAPI, setDadosAPI] = useState([]);
  const [dadosAtuais, setDadosAtuais] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);
  const [dataSelecionada, setDataSelecionada] = useState('');
  
  const API_URL = 'http://105.103.112.18:8080/kpi_aoi_historico';
  const API_URL_ATUAL = 'http://105.103.112.18:8080/kpi_aoii';

  const buscarDadosAPI = async () => {
    try {
      setCarregando(true);
      setErro(null);
      
      // Buscar dados históricos
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }
      
      const data = await response.json();
      setDadosAPI(data);
      
      // Buscar dados atuais
      const responseAtual = await fetch(API_URL_ATUAL);
      if (responseAtual.ok) {
        const dataAtual = await responseAtual.json();
        if (dataAtual && dataAtual.length > 0) {
          setDadosAtuais(dataAtual[0]);
        }
      }
      
      setUltimaAtualizacao(new Date());
      setCarregando(false);
    } catch (error) {
      console.error('Erro ao buscar dados da API:', error);
      setErro(error.message);
      setCarregando(false);
    }
  };

  // Buscar dados imediatamente ao carregar o componente
  useEffect(() => {
    buscarDadosAPI();
  }, []);

  // Configurar intervalo para buscar dados a cada 10 segundos (10000 ms)
  useEffect(() => {
    const intervalo = setInterval(() => {
      buscarDadosAPI();
    }, 10000); // 10 segundos em milissegundos

    return () => clearInterval(intervalo);
  }, []);

  const formatarData = (dataString) => {
    if (!dataString) return 'Data inválida';
    
    if (typeof dataString === 'string' && dataString.includes('/')) {
      return dataString;
    }
    
    try {
      const data = new Date(dataString);
      if (isNaN(data.getTime())) {
        return dataString;
      }
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dataString;
    }
  };

  const formatarHora = (data) => {
    return data.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatarHoraColeta = (dataString) => {
    if (!dataString) return '--:--:--';
    
    try {
      const data = new Date(dataString);
      if (isNaN(data.getTime())) {
        if (typeof dataString === 'string' && dataString.includes(':')) {
          return dataString;
        }
        return dataString;
      }
      
      return data.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return dataString || '--:--:--';
    }
  };

  // Obter datas únicas para o filtro
  const datasUnicas = [...new Set(dadosAPI.map(item => item.Data))].sort((a, b) => {
    const [diaA, mesA, anoA] = a.split('/').map(Number);
    const [diaB, mesB, anoB] = b.split('/').map(Number);
    return new Date(anoA, mesA - 1, diaA) - new Date(anoB, mesB - 1, diaB);
  });

  const converterParaDate = (dataString) => {
    if (!dataString) return null;
    const [dia, mes, ano] = dataString.split('/').map(Number);
    return new Date(ano, mes - 1, dia);
  };

  const converterParaString = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDataAtual = () => {
    const hoje = new Date();
    return hoje.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  useEffect(() => {
    if (dadosAPI.length > 0 && !dataSelecionada) {
      const dataAtual = getDataAtual();
      if (datasUnicas.includes(dataAtual)) {
        setDataSelecionada(dataAtual);
      } else if (datasUnicas.length > 0) {
        setDataSelecionada(datasUnicas[datasUnicas.length - 1]);
      }
    }
  }, [dadosAPI, dataSelecionada, datasUnicas]);

  const isDataDisponivel = (date) => {
    const dataString = converterParaString(date);
    return datasUnicas.includes(dataString);
  };

  const handleDataChange = (date) => {
    if (date) {
      const dataString = converterParaString(date);
      if (isDataDisponivel(date)) {
        setDataSelecionada(dataString);
      }
    }
  };

  const dadosFiltrados = dataSelecionada 
    ? dadosAPI
        .filter(item => item.Data === dataSelecionada)
        .sort((a, b) => {
          const dataA = new Date(a['data_hora_coleta']);
          const dataB = new Date(b['data_hora_coleta']);
          return dataB - dataA; // Ordenar do mais recente para o mais antigo
        })
    : dadosAPI;

  // Obter os últimos valores para os indicadores de status
  const getUltimosValores = () => {
    // Se há uma data selecionada, usar o último registro dessa data
    if (dataSelecionada) {
      if (dadosFiltrados.length === 0) return {};
      
      // Obter o último registro do dia selecionado (o mais recente)
      const ultimoRegistro = dadosFiltrados[0];
      return {
        'P-AOI': ultimoRegistro['P-AOI'] || 0,
        'M-AOI': ultimoRegistro['M-AOI'] || 0,
        'S-AOI': ultimoRegistro['S-AOI'] || 0,
        'FT': ultimoRegistro['FT'] || 0,
        'TEACHING M': ultimoRegistro['TEACHING M'] || 0,
        'TEACHING S': ultimoRegistro['TEACHING S'] || 0
      };
    }
    
    // Se não há data selecionada, usar dados atuais se disponíveis
    if (Object.keys(dadosAtuais).length > 0) {
      return {
        'P-AOI': dadosAtuais['P-AOI'] || 0,
        'M-AOI': dadosAtuais['M-AOI'] || 0,
        'S-AOI': dadosAtuais['S-AOI'] || 0,
        'FT': dadosAtuais['FT'] || 0,
        'TEACHING M': dadosAtuais['TEACHING M'] || 0,
        'TEACHING S': dadosAtuais['TEACHING S'] || 0
      };
    }
    
    // Fallback: usar o último registro disponível
    if (dadosAPI.length > 0) {
      const dadosOrdenados = [...dadosAPI].sort((a, b) => 
        new Date(b['data_hora_coleta']) - new Date(a['data_hora_coleta'])
      );
      const ultimoRegistro = dadosOrdenados[0];
      return {
        'P-AOI': ultimoRegistro['P-AOI'] || 0,
        'M-AOI': ultimoRegistro['M-AOI'] || 0,
        'S-AOI': ultimoRegistro['S-AOI'] || 0,
        'FT': ultimoRegistro['FT'] || 0,
        'TEACHING M': ultimoRegistro['TEACHING M'] || 0,
        'TEACHING S': ultimoRegistro['TEACHING S'] || 0
      };
    }
    
    return {};
  };

  const ultimosValores = getUltimosValores();
  const targets = {
    'P-AOI': 635,
    'M-AOI': 377,
    'S-AOI': 112,
    'FT': 1309,
    'TEACHING M': 2.5,
    'TEACHING S': 2.1
  };

  if (carregando && dadosAPI.length === 0) {
    return (
      <div className="kpi-quality-dashboard">
        <div className="quality-loading">
          <h2>Carregando dados da API...</h2>
          <div className="quality-spinner"></div>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="kpi-quality-dashboard">
        <div className="quality-error">
          <h2>Erro ao carregar dados</h2>
          <p>{erro}</p>
          <button onClick={buscarDadosAPI} className="quality-btn retry">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    <Header/>
    <div className="kpi-quality-dashboard">
      <DashboardHeader 
        lastUpdate={ultimaAtualizacao}
        onRefresh={buscarDadosAPI}
        isLoading={carregando}
        dataSelecionada={dataSelecionada}
        datasUnicas={datasUnicas}
        handleDataChange={handleDataChange}
        converterParaDate={converterParaDate}
        isDataDisponivel={isDataDisponivel}
        formatarData={formatarData}
      />
      
      {/* Indicadores de Status */}
      <div className="status-indicators-container">
        <div className="status-indicators-grid">
          {Object.keys(targets).map((indicator) => (
            <StatusIndicator
              key={indicator}
              indicator={indicator}
              value={ultimosValores[indicator]}
              target={targets[indicator]}
            />
          ))}
        </div>
      </div>

      {dadosAPI.length === 0 ? (
        <div className="quality-no-data">
          <h2>Nenhum dado encontrado</h2>
          <p>Não há dados disponíveis na API no momento.</p>
        </div>
      ) : dadosFiltrados.length === 0 ? (
        <div className="quality-no-data">
          <h2>Nenhum dado encontrado para a data selecionada</h2>
          <p>Tente selecionar outra data.</p>
        </div>
      ) : (
        <KpiDashboard data={dadosFiltrados} />
      )}
    </div>
  </>

  );
};

export default KPIQuality;
