import { API_URL } from '../../config/api';
import React, { useState, useEffect } from 'react';
import './POP_Control.css';
import Header from '../Layout/MGSPHead/Header';

const POP_Control = () => {
  // Estados para os dados
  const [data, setData] = useState([]);
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    hora: '',
    linha: '',
    modelo: '',
    part_number: '',
    molhagem: '',
    medicao_jig: '',
    squeegee_gap: '',
    antes: '',
    depois: '',
    status: '',
    operador: ''
  });
  
  // Estados para abas
  const [activeTab, setActiveTab] = useState('form');
  
  // Estado para dados de controle
  const [controlData, setControlData] = useState([]);
  
  // Estados para dados automáticos
  const [linhas, setLinhas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [operadorNome, setOperadorNome] = useState(''); // Estado para mostrar o nome do operador
  
  // Estado para filtro de data
  const [filterDate, setFilterDate] = useState('');
  
  // Estados para listas suspensas
  const horas = [
    '07:00 ~ 08:00',
    '08:00 ~ 09:00',
    '09:00 ~ 10:00',
    '10:00 ~ 11:00',
    '11:00 ~ 12:00',
    '12:00 ~ 13:00',
    '13:00 ~ 14:00',
    '14:00 ~ 15:00',
    '15:00 ~ 16:00',
    '16:00 ~ 17:00',
    '17:00 ~ 18:00',
    '18:00 ~ 19:00',
    '19:00 ~ 20:00',
    '20:00 ~ 21:00',
    '21:00 ~ 22:00',
    '22:00 ~ 23:00',
    '23:00 ~ 00:00',
    '00:00 ~ 01:00',
    '01:00 ~ 02:00',
    '02:00 ~ 03:00',
    '03:00 ~ 04:00',
    '04:00 ~ 05:00',
    '05:00 ~ 06:00',
    '06:00 ~ 07:00'
  ];
  
  // Estados para opções dinâmicas (serão carregadas do backend)
  const [molhagemOptions, setMolhagemOptions] = useState([]);
  const [medicaoJigOptions, setMedicaoJigOptions] = useState([]);
  
  // Função para carregar opções de molhagem do banco de dados
  const fetchMolhagemOptions = async () => {
    try {
      const response = await fetch(`${API_URL}/pop_control_molhagem`);
      if (response.ok) {
        const data = await response.json();
        // Converter para formato de string simples
        setMolhagemOptions(data.map(item => item.valor));
      }
    } catch (error) {
      console.error('Erro ao buscar opções de molhagem:', error);
      // Fallback para opções padrão
      setMolhagemOptions(['Fluxo POP', 'Reflow Epoxy', 'Solder Dipping']);
    }
  };
  
  // Função para carregar opções de medição jig do banco de dados
  const fetchMedicaoJigOptions = async () => {
    try {
      const response = await fetch(`${API_URL}/pop_control_jig`);
      if (response.ok) {
        const data = await response.json();
        // Converter para formato de string simples e ordenar numericamente
        const sortedData = data
          .map(item => item.valor)
          .sort((a, b) => parseFloat(a) - parseFloat(b));
        setMedicaoJigOptions(sortedData);
      }
    } catch (error) {
      console.error('Erro ao buscar opções de jig:', error);
      // Fallback para opções padrão
      setMedicaoJigOptions([
        '0.000', '0.065', '0.070', '0.075', '0.080', '0.085', '0.090', '0.095',
        '0.100', '0.110', '0.120', '0.130', '0.140', '0.150', '0.160', '0.170',
        '0.180', '0.190', '0.200'
      ]);
    }
  };
  
  // Função para buscar dados do operador
  const fetchOperador = async (matricula) => {
    try {
      const response = await fetch(`${API_URL}/api/operador/${matricula}`);
      if (response.ok) {
        const operador = await response.json();
        return operador;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar operador:', error);
      return null;
    }
  };
  
  // Função para comparar valores e definir status baseado na porcentagem e tipo de molhagem
  const calcularStatus = (depois, molhagem) => {
    if (!depois || !molhagem) return '';
    
    const depoisNum = parseFloat(depois);
    
    // Verificar status baseado no tipo de molhagem
    if (molhagem === 'Fluxo POP') {
      // Para Fluxo POP, acima de 70% é NG
      if (depoisNum > 70.00) {
        return 'NG';
      } else {
        return 'OK';
      }
    } else if (molhagem === 'Reflow Epoxy') {
      // Para Reflow Epoxy, acima de 50% é NG
      if (depoisNum > 50.00) {
        return 'NG';
      } else {
        return 'OK';
      }
    }
    
    return '';
  };
  
  // Função para validar e formatar números percentuais
  const formatarNumero = (value) => {
    // Remover tudo que não for número
    let valor = value.replace(/[^0-9]/g, '');
    
    // Limitar a 4 dígitos (2 antes do ponto e 2 depois)
    if (valor.length > 4) {
      valor = valor.substring(0, 4);
    }
    
    // Adicionar ponto automaticamente após o segundo dígito
    if (valor.length > 2) {
      valor = valor.substring(0, 2) + '.' + valor.substring(2);
    }
    
    // Limitar a 6 caracteres no total (100.00)
    if (valor.length > 6) {
      valor = valor.substring(0, 6);
    }
    
    // Validar se o valor está entre 0 e 100
    const numValor = parseFloat(valor);
    if (numValor > 100) {
      valor = '100.00';
    }
    
    return valor;
  };
  
  // Função para lidar com mudanças no formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Tratamento especial para campos de porcentagem (antes e depois)
    if (['antes', 'depois'].includes(name)) {
      const valorFormatado = formatarNumero(value);
      setFormData({
        ...formData,
        [name]: valorFormatado
      });
      
      // Atualizar status automaticamente quando "depois" ou tipo de molhagem mudar
      if (name === 'depois') {
        const depoisValue = valorFormatado;
        const molhagemValue = formData.molhagem;
        const status = calcularStatus(depoisValue, molhagemValue);
        
        setFormData(prev => ({
          ...prev,
          status: status
        }));
      }
      return;
    }
    
    // Tratamento especial para squeegee_gap (formato: número.ponto.três números)
    if (name === 'squeegee_gap') {
      // Remover tudo que não for número
      let valor = value.replace(/[^0-9]/g, '');
      
      // Limitar a 4 dígitos (1 antes do ponto e 3 depois)
      if (valor.length > 4) {
        valor = valor.substring(0, 4);
      }
      
      // Adicionar ponto automaticamente após o primeiro dígito
      if (valor.length > 1) {
        valor = valor.charAt(0) + '.' + valor.substring(1);
      }
      
      // Limitar a 5 caracteres no total
      if (valor.length > 5) {
        valor = valor.substring(0, 5);
      }
      
      setFormData({
        ...formData,
        [name]: valor
      });
      return;
    }
    
    // Tratamento especial para part_number (limitar a 7-12 caracteres)
    if (name === 'part_number') {
      if (value.length <= 12) {
        setFormData({
          ...formData,
          [name]: value
        });
      }
      return;
    }
    
    // Tratamento especial para operador (buscar nome)
    if (name === 'operador') {
      setFormData({
        ...formData,
        [name]: value
      });
      
      // Se a matrícula tiver um tamanho razoável, buscar o nome
      if (value.length >= 4) {
        fetchOperador(value).then(operador => {
          if (operador) {
            setOperadorNome(operador.funcionarios || operador.nome || '');
          } else {
            setOperadorNome('');
          }
        });
      } else {
        setOperadorNome('');
      }
      return;
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Atualizar status automaticamente quando "depois" ou "molhagem" mudar
    if (name === 'depois' || name === 'molhagem') {
      const depoisValue = name === 'depois' ? value : formData.depois;
      const molhagemValue = name === 'molhagem' ? value : formData.molhagem;
      const status = calcularStatus(depoisValue, molhagemValue);
      
      setFormData(prev => ({
        ...prev,
        status: status
      }));
    }
  };
  
  // Função para buscar dados automáticos
  const fetchAutomaticData = async () => {
    try {
      // Buscar linhas (SMD-02 a SMD-20, SMD-37, SMD-38 - sem SMD-01 e SMD-09)
      const linhasData = [];
      for (let i = 2; i <= 8; i++) {
        linhasData.push(`SMD-${i.toString().padStart(2, '0')}`);
      }
      for (let i = 10; i <= 20; i++) {
        linhasData.push(`SMD-${i.toString().padStart(2, '0')}`);
      }
      linhasData.push('SMD-37', 'SMD-38');
      setLinhas(linhasData);
      
      // Buscar modelos do banco de dados
      const response = await fetch(`${API_URL}/api/modelos`);
      if (response.ok) {
        const modelosData = await response.json();
        setModelos(modelosData.map(item => item.modelo));
      } else {
        // Fallback caso a API não esteja disponível
        const modelosData = ['BSM-A155', 'BSM-A156', 'BSM-A165', 'BSM-A256', 'BSM-A356'];
        setModelos(modelosData);
      }
    } catch (error) {
      console.error('Erro ao buscar dados automáticos:', error);
      // Fallback em caso de erro
      const linhasData = [];
      for (let i = 2; i <= 8; i++) {
        linhasData.push(`SMD-${i.toString().padStart(2, '0')}`);
      }
      for (let i = 10; i <= 20; i++) {
        linhasData.push(`SMD-${i.toString().padStart(2, '0')}`);
      }
      linhasData.push('SMD-37', 'SMD-38');
      setLinhas(linhasData);
      
      const modelosData = ['BSM-A155', 'BSM-A156', 'BSM-A165', 'BSM-A256', 'BSM-A356'];
      setModelos(modelosData);
    }
  };
  
  // Função para salvar dados
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar part_number (7-12 caracteres)
    if (formData.part_number.length < 7 || formData.part_number.length > 12) {
      alert('Part Number deve ter entre 7 e 12 caracteres');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/pop-control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        // Atualizar a tabela
        setData([...data, formData]);
        // Limpar formulário
        setFormData({
          data: new Date().toISOString().split('T')[0],
          hora: '',
          linha: '',
          modelo: '',
          part_number: '',
          molhagem: '',
          medicao_jig: '',
          squeegee_gap: '',
          antes: '',
          depois: '',
          status: '',
          operador: ''
        });
        setOperadorNome(''); // Limpar nome do operador
        alert('Dados salvos com sucesso!');
        // Recarregar dados
        fetchExistingData();
      } else {
        alert('Erro ao salvar dados');
      }
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      alert('Erro ao salvar dados');
    }
  };
  
  // Função para buscar dados existentes
  const fetchExistingData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/pop-control`);
      if (response.ok) {
        const data = await response.json();
        setData(data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };
  
  // Função para deletar um registro
  const deleteRecord = async (id) => {
    // Confirmar antes de deletar
    if (!window.confirm('Tem certeza que deseja deletar este registro?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/pop-control/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        alert('Registro deletado com sucesso!');
        // Recarregar dados
        fetchExistingData();
      } else {
        alert('Erro ao deletar registro');
      }
    } catch (error) {
      console.error('Erro ao deletar registro:', error);
      alert('Erro ao deletar registro');
    }
  };
  
  // Função para buscar dados filtrados por data
  const fetchFilteredData = async (date) => {
    try {
      const response = await fetch(`${API_URL}/api/pop-control?data=${date}`);
      if (response.ok) {
        const data = await response.json();
        setData(data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados filtrados:', error);
    }
  };
  
  // Função para buscar dados de controle
  const fetchControlData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/popControl_controle`);
      if (response.ok) {
        const controlData = await response.json();
        setControlData(controlData);
      } else {
        console.error('Erro ao buscar dados de controle');
        setControlData([]);
      }
    } catch (error) {
      console.error('Erro ao buscar dados de controle:', error);
      setControlData([]);
    }
  };
  
  // Função para buscar dados de controle filtrados por data
  const fetchFilteredControlData = async (date) => {
    try {
      const response = await fetch(`${API_URL}/api/popControl_controle?data=${date}`);
      if (response.ok) {
        const controlData = await response.json();
        setControlData(controlData);
      } else {
        console.error('Erro ao buscar dados de controle filtrados');
        setControlData([]);
      }
    } catch (error) {
      console.error('Erro ao buscar dados de controle filtrados:', error);
      setControlData([]);
    }
  };
  
  // Função para processar dados de controle (mantida para compatibilidade)
  const processControlData = () => {
    // Definir os intervalos de hora
    const timeIntervals = [
      '07:00 ~ 08:00',
      '08:00 ~ 09:00',
      '09:00 ~ 10:00',
      '10:00 ~ 11:00',
      '11:00 ~ 12:00',
      '12:00 ~ 13:00',
      '13:00 ~ 14:00',
      '14:00 ~ 15:00',
      '15:00 ~ 16:00',
      '16:00 ~ 17:00',
      '17:00 ~ 18:00',
      '18:00 ~ 19:00',
      '19:00 ~ 20:00',
      '20:00 ~ 21:00',
      '21:00 ~ 22:00',
      '22:00 ~ 23:00',
      '23:00 ~ 00:00',
      '00:00 ~ 01:00',
      '01:00 ~ 02:00',
      '02:00 ~ 03:00',
      '03:00 ~ 04:00',
      '04:00 ~ 05:00',
      '05:00 ~ 06:00',
      '06:00 ~ 07:00'
    ];
    
    // Obter a data de hoje no formato YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    
    // Filtrar dados para hoje
    // Ajustar o formato da data para comparar corretamente
    const todayData = data.filter(item => {
      // Verificar se item.data é uma string no formato ISO
      if (typeof item.data === 'string') {
        // Se a data já estiver no formato YYYY-MM-DD, usar diretamente
        if (item.data.match(/^\d{4}-\d{2}-\d{2}/)) {
          return item.data === today;
        }
        // Se for uma data no formato ISO, converter
        try {
          const itemDate = new Date(item.data).toISOString().split('T')[0];
          return itemDate === today;
        } catch (e) {
          return false;
        }
      }
      // Se for um objeto Date
      if (item.data instanceof Date) {
        const itemDate = item.data.toISOString().split('T')[0];
        return itemDate === today;
      }
      return false;
    });
    
    // Se não houver dados de hoje, não processar
    if (todayData.length === 0) {
      setControlData([]);
      return;
    }
    
    // Obter linhas e modelos únicos de hoje
    const uniqueLines = [...new Set(todayData.map(item => item.linha))];
    const uniqueModels = [...new Set(todayData.map(item => item.modelo))];
    
    // Criar estrutura de dados para controle
    const controlData = [];
    
    // Para cada linha
    uniqueLines.forEach(line => {
      // Para cada modelo
      uniqueModels.forEach(model => {
        // Verificar se há registros para esta linha e modelo
        const lineModelData = todayData.filter(item => item.linha === line && item.modelo === model);
        
        if (lineModelData.length > 0) {
          const controlRow = {
            linha: line,
            modelo: model,
            intervals: {}
          };
          
          // Para cada intervalo de hora
          timeIntervals.forEach(interval => {
            // Filtrar registros para este intervalo
            const intervalData = lineModelData.filter(item => item.hora === interval);
            
            if (intervalData.length > 0) {
              // Obter o último registro (mais recente)
              const lastRecord = intervalData[intervalData.length - 1];
              controlRow.intervals[interval] = lastRecord.status;
            } else {
              // Se não houver registros, marcar como pendente
              controlRow.intervals[interval] = '-';
            }
          });
          
          controlData.push(controlRow);
        }
      });
    });
    
    setControlData(controlData);
  };
  
  // Efeito para carregar dados iniciais
  useEffect(() => {
    fetchAutomaticData();
    fetchExistingData();
    fetchMolhagemOptions();
    fetchMedicaoJigOptions();
  }, []);
  
  // Efeito para buscar dados de controle quando a aba de controle for selecionada
  useEffect(() => {
    if (activeTab === 'control') {
      fetchControlData();
    }
  }, [activeTab]);
  
  return (
<>
<Header/>
    <div className="pop-control-container">
      <h2 className="pop-title">Monitoramento de Fluxo POP e Reflow Epoxy </h2>
      
      {/* Abas */}
      <div className="pop-tabs">
        <button 
          className={`pop-tab-button ${activeTab === 'form' ? 'pop-tab-active' : ''}`}
          onClick={() => setActiveTab('form')}
        >
          Formulário
        </button>
        <button 
          className={`pop-tab-button ${activeTab === 'records' ? 'pop-tab-active' : ''}`}
          onClick={() => setActiveTab('records')}
        >
          Registros
        </button>
        <button 
          className={`pop-tab-button ${activeTab === 'control' ? 'pop-tab-active' : ''}`}
          onClick={() => setActiveTab('control')}
        >
          Controle
        </button>
      </div>
      
      {/* Conteúdo da aba Formulário */}
      {activeTab === 'form' && (
        <div className="pop-form-section">
          <h3>Adicionar Registro</h3>
          <form onSubmit={handleSubmit} className="pop-form">
            <div className="pop-form-row">
              <div className="pop-form-group">
                <label>Linha:</label>
                <select
                  name="linha"
                  value={formData.linha}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Selecione uma linha</option>
                  {linhas.map((linha, index) => (
                    <option key={index} value={linha}>{linha}</option>
                  ))}
                </select>
              </div>
              
              <div className="pop-form-group">
                <label>Modelo:</label>
                <select
                  name="modelo"
                  value={formData.modelo}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Selecione um modelo</option>
                  {modelos.map((modelo, index) => (
                    <option key={index} value={modelo}>{modelo}</option>
                  ))}
                </select>
              </div>
              
              <div className="pop-form-group">
                <label>Part Number:</label>
                <input
                  type="text"
                  name="part_number"
                  value={formData.part_number}
                  onChange={handleInputChange}
                  required
                  minLength="7"
                  maxLength="12"
                  placeholder="7-12 caracteres"
                />
              </div>
            </div>
            
            <div className="pop-form-row">
              
              <div className="pop-form-group">
                <label>Molhagem:</label>
                <select
                  name="molhagem"
                  value={formData.molhagem}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Selecione uma opção</option>
                  {molhagemOptions.map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              
              <div className="pop-form-group">
                <label>Medição Jig:</label>
                <select
                  name="medicao_jig"
                  value={formData.medicao_jig}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Selecione uma medição</option>
                  {medicaoJigOptions.map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="pop-form-row">
              <div className="pop-form-group">
                <label>Squeegee Gap:</label>
                <input
                  type="text"
                  name="squeegee_gap"
                  value={formData.squeegee_gap}
                  onChange={handleInputChange}
                  required
                  maxLength="5"
                  placeholder="0.000"
                />
              </div>
              
              <div className="pop-form-group">
                <label>Antes (%):</label>
                <input
                  type="text"
                  name="antes"
                  value={formData.antes}
                  onChange={handleInputChange}
                  required
                  maxLength="6"
                  placeholder="0.00"
                />
              </div>
              
              {/* <div className="pop-form-group">
                <label>Depois (%):</label>
                <input
                  type="text"
                  name="depois"
                  value={formData.depois}
                  onChange={handleInputChange}
                  required
                  maxLength="6"
                  placeholder="0.00"
                />
              </div> */}
              
              <div className="pop-form-group">
                <label>Status:</label>
                <input
                  type="text"
                  name="status"
                  value={formData.status}
                  readOnly
                  className="pop-status-field"
                />
              </div>
            </div>
            
            <div className="pop-form-row">
              <div className="pop-form-group">
                <label>Operador (Matrícula):</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="text"
                    name="operador"
                    value={formData.operador}
                    onChange={handleInputChange}
                    required
                    placeholder="Digite a matrícula"
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="pop-submit-button">Salvar</button>
                </div>
                {operadorNome ? (
                  <div style={{ fontSize: '12px', color: '#28a745', marginTop: '5px' }}>
                    {operadorNome}
                  </div>
                ) : formData.operador.length >= 4 ? (
                  <div style={{ fontSize: '12px', color: '#dc3545', marginTop: '5px' }}>
                    Matrícula não encontrada
                  </div>
                ) : null}
              </div>
            </div>
          </form>
        </div>
      )}
      
      {/* Conteúdo da aba Registros */}
      {activeTab === 'records' && (
        <div className="pop-table-section">
          <h3>Registros Existentes</h3>
          <div className="pop-filter-section">
            <div className="pop-filter-group">
              <label>Data:</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
              <button 
                className="pop-filter-button"
                onClick={() => {
                  if (filterDate) {
                    fetchFilteredData(filterDate);
                  } else {
                    fetchExistingData();
                  }
                }}
              >
                Filtrar
              </button>
              <button 
                className="pop-clear-button"
                onClick={() => {
                  setFilterDate('');
                  fetchExistingData();
                }}
              >
                Limpar
              </button>
            </div>
          </div>
          <div className="pop-table-container">
            <table className="pop-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Hora</th>
                  <th>Linha</th>
                  <th>Modelo</th>
                  <th>Part Number</th>
                  <th>Molhagem</th>
                  <th>Medição Jig</th>
                  <th>Squeegee Gap</th>
                  <th>Antes (%)</th>
                  <th>Depois (%)</th>
                  <th>Status</th>
                  <th>Operador</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.length > 0 ? (
                  data.map((item, index) => (
                    <tr key={index}>
                      <td>{item.data ? new Date(item.data).toLocaleDateString('pt-BR') : ''}</td>
                      <td>{item.hora}</td>
                      <td>{item.linha}</td>
                      <td>{item.modelo}</td>
                      <td>{item.part_number}</td>
                      <td>{item.molhagem}</td>
                      <td>{item.medicao_jig}</td>
                      <td>{item.squeegee_gap}</td>
                      <td>{item.antes ? `${item.antes}%` : ''}</td>
                      <td>{item.depois ? `${item.depois}%` : ''}</td>
                      <td className={item.status === 'OK' ? 'pop-status-ok' : 'pop-status-ng'}>{item.status}</td>
                      <td>{item.operador}</td>
                      <td>
                        <button 
                          className="pop-delete-button"
                          onClick={() => deleteRecord(item.id)}
                        >
                          Deletar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="13" className="pop-no-data">Nenhum registro encontrado</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Conteúdo da aba Controle */}
      {activeTab === 'control' && (
        <div className="pop-table-section">
          <h3>Controle de Medições</h3>
          <div className="pop-filter-section">
            <div className="pop-filter-group">
              <label>Data:</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
              <button 
                className="pop-filter-button"
                onClick={() => {
                  if (filterDate) {
                    fetchFilteredControlData(filterDate);
                  } else {
                    fetchControlData();
                  }
                }}
              >
                Filtrar
              </button>
              <button 
                className="pop-clear-button"
                onClick={() => {
                  setFilterDate('');
                  fetchControlData();
                }}
              >
                Limpar
              </button>
            </div>
          </div>
          <div className="pop-table-container">
            <table className="pop-table">
              <thead>
                <tr>
                  <th>Linha</th>
                  <th>Modelo</th>
                  <th>07:00 ~ 08:00</th>
                  <th>08:00 ~ 09:00</th>
                  <th>09:00 ~ 10:00</th>
                  <th>10:00 ~ 11:00</th>
                  <th>11:00 ~ 12:00</th>
                  <th>12:00 ~ 13:00</th>
                  <th>13:00 ~ 14:00</th>
                  <th>14:00 ~ 15:00</th>
                  <th>15:00 ~ 16:00</th>
                  <th>16:00 ~ 17:00</th>
                  <th>17:00 ~ 18:00</th>
                  <th>18:00 ~ 19:00</th>
                  <th>19:00 ~ 20:00</th>
                  <th>20:00 ~ 21:00</th>
                  <th>21:00 ~ 22:00</th>
                  <th>22:00 ~ 23:00</th>
                  <th>23:00 ~ 00:00</th>
                  <th>00:00 ~ 01:00</th>
                  <th>01:00 ~ 02:00</th>
                  <th>02:00 ~ 03:00</th>
                  <th>03:00 ~ 04:00</th>
                  <th>04:00 ~ 05:00</th>
                  <th>05:00 ~ 06:00</th>
                  <th>06:00 ~ 07:00</th>
                </tr>
              </thead>
              <tbody>
                {controlData.length > 0 ? (
                  controlData.map((item, index) => (
                    <tr key={index}>
                      <td>{item.linha}</td>
                      <td>{item.modelo}</td>
                      <td className={item.intervals['07:00 ~ 08:00'] === 'OK' ? 'pop-status-ok' : item.intervals['07:00 ~ 08:00'] === 'NG' ? 'pop-status-ng' : 'pop-status-pend'}>
                        {item.intervals['07:00 ~ 08:00']}
                      </td>
                      <td className={item.intervals['08:00 ~ 09:00'] === 'OK' ? 'pop-status-ok' : item.intervals['08:00 ~ 09:00'] === 'NG' ? 'pop-status-ng' : 'pop-status-pend'}>
                        {item.intervals['08:00 ~ 09:00']}
                      </td>
                      <td className={item.intervals['09:00 ~ 10:00'] === 'OK' ? 'pop-status-ok' : item.intervals['09:00 ~ 10:00'] === 'NG' ? 'pop-status-ng' : 'pop-status-pend'}>
                        {item.intervals['09:00 ~ 10:00']}
                      </td>
                      <td className={item.intervals['10:00 ~ 11:00'] === 'OK' ? 'pop-status-ok' : item.intervals['10:00 ~ 11:00'] === 'NG' ? 'pop-status-ng' : 'pop-status-pend'}>
                        {item.intervals['10:00 ~ 11:00']}
                      </td>
                      <td className={item.intervals['11:00 ~ 12:00'] === 'OK' ? 'pop-status-ok' : item.intervals['11:00 ~ 12:00'] === 'NG' ? 'pop-status-ng' : 'pop-status-pend'}>
                        {item.intervals['11:00 ~ 12:00']}
                      </td>
                      <td className={item.intervals['12:00 ~ 13:00'] === 'OK' ? 'pop-status-ok' : item.intervals['12:00 ~ 13:00'] === 'NG' ? 'pop-status-ng' : 'pop-status-pend'}>
                        {item.intervals['12:00 ~ 13:00']}
                      </td>
                      <td className={item.intervals['13:00 ~ 14:00'] === 'OK' ? 'pop-status-ok' : item.intervals['13:00 ~ 14:00'] === 'NG' ? 'pop-status-ng' : 'pop-status-pend'}>
                        {item.intervals['13:00 ~ 14:00']}
                      </td>
                      <td className={item.intervals['14:00 ~ 15:00'] === 'OK' ? 'pop-status-ok' : item.intervals['14:00 ~ 15:00'] === 'NG' ? 'pop-status-ng' : 'pop-status-pend'}>
                        {item.intervals['14:00 ~ 15:00']}
                      </td>
                      <td className={item.intervals['15:00 ~ 16:00'] === 'OK' ? 'pop-status-ok' : item.intervals['15:00 ~ 16:00'] === 'NG' ? 'pop-status-ng' : 'pop-status-pend'}>
                        {item.intervals['15:00 ~ 16:00']}
                      </td>
                      <td className={item.intervals['16:00 ~ 17:00'] === 'OK' ? 'pop-status-ok' : item.intervals['16:00 ~ 17:00'] === 'NG' ? 'pop-status-ng' : 'pop-status-pend'}>
                        {item.intervals['16:00 ~ 17:00']}
                      </td>
                      <td className={item.intervals['17:00 ~ 18:00'] === 'OK' ? 'pop-status-ok' : item.intervals['17:00 ~ 18:00'] === 'NG' ? 'pop-status-ng' : 'pop-status-pend'}>
                        {item.intervals['17:00 ~ 18:00']}
                      </td>
                      <td className={item.intervals['18:00 ~ 19:00'] === 'OK' ? 'pop-status-ok' : item.intervals['18:00 ~ 19:00'] === 'NG' ? 'pop-status-ng' : 'pop-status-pend'}>
                        {item.intervals['18:00 ~ 19:00']}
                      </td>
                      <td className={item.intervals['19:00 ~ 20:00'] === 'OK' ? 'pop-status-ok' : item.intervals['19:00 ~ 20:00'] === 'NG' ? 'pop-status-ng' : 'pop-status-pend'}>
                        {item.intervals['19:00 ~ 20:00']}
                      </td>
                      <td className={item.intervals['20:00 ~ 21:00'] === 'OK' ? 'pop-status-ok' : item.intervals['20:00 ~ 21:00'] === 'NG' ? 'pop-status-ng' : 'pop-status-pend'}>
                        {item.intervals['20:00 ~ 21:00']}
                      </td>
                      <td className={item.intervals['21:00 ~ 22:00'] === 'OK' ? 'pop-status-ok' : item.intervals['21:00 ~ 22:00'] === 'NG' ? 'pop-status-ng' : 'pop-status-pend'}>
                        {item.intervals['21:00 ~ 22:00']}
                      </td>
                      <td className={item.intervals['22:00 ~ 23:00'] === 'OK' ? 'pop-status-ok' : item.intervals['22:00 ~ 23:00'] === 'NG' ? 'pop-status-ng' : 'pop-status-pend'}>
                        {item.intervals['22:00 ~ 23:00']}
                      </td>
                      <td className={item.intervals['23:00 ~ 00:00'] === 'OK' ? 'pop-status-ok' : item.intervals['23:00 ~ 00:00'] === 'NG' ? 'pop-status-ng' : 'pop-status-pend'}>
                        {item.intervals['23:00 ~ 00:00']}
                      </td>
                      <td className={item.intervals['00:00 ~ 01:00'] === 'OK' ? 'pop-status-ok' : item.intervals['00:00 ~ 01:00'] === 'NG' ? 'pop-status-ng' : 'pop-status-pend'}>
                        {item.intervals['00:00 ~ 01:00']}
                      </td>
                      <td className={item.intervals['01:00 ~ 02:00'] === 'OK' ? 'pop-status-ok' : item.intervals['01:00 ~ 02:00'] === 'NG' ? 'pop-status-ng' : 'pop-status-pend'}>
                        {item.intervals['01:00 ~ 02:00']}
                      </td>
                      <td className={item.intervals['02:00 ~ 03:00'] === 'OK' ? 'pop-status-ok' : item.intervals['02:00 ~ 03:00'] === 'NG' ? 'pop-status-ng' : 'pop-status-pend'}>
                        {item.intervals['02:00 ~ 03:00']}
                      </td>
                      <td className={item.intervals['03:00 ~ 04:00'] === 'OK' ? 'pop-status-ok' : item.intervals['03:00 ~ 04:00'] === 'NG' ? 'pop-status-ng' : 'pop-status-pend'}>
                        {item.intervals['03:00 ~ 04:00']}
                      </td>
                      <td className={item.intervals['04:00 ~ 05:00'] === 'OK' ? 'pop-status-ok' : item.intervals['04:00 ~ 05:00'] === 'NG' ? 'pop-status-ng' : 'pop-status-pend'}>
                        {item.intervals['04:00 ~ 05:00']}
                      </td>
                      <td className={item.intervals['05:00 ~ 06:00'] === 'OK' ? 'pop-status-ok' : item.intervals['05:00 ~ 06:00'] === 'NG' ? 'pop-status-ng' : 'pop-status-pend'}>
                        {item.intervals['05:00 ~ 06:00']}
                      </td>
                      <td className={item.intervals['06:00 ~ 07:00'] === 'OK' ? 'pop-status-ok' : item.intervals['06:00 ~ 07:00'] === 'NG' ? 'pop-status-ng' : 'pop-status-pend'}>
                        {item.intervals['06:00 ~ 07:00']}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="26" className="pop-no-data">Nenhum dado de controle encontrado</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
</>
  );
};
export default POP_Control;
