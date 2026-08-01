import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import axios from 'axios';
import './KPITable.css';
import Header from '../../Layout/MGSPHead/Header';
import NavbarComp from '../../Layout/NavbarComp'

const KPITable = () => {
  // Estado para a data selecionada
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Estado para o turno selecionado
  const [selectedShift, setSelectedShift] = useState('');
  
  // Estado para os dados da tabela
  const [tableData, setTableData] = useState([]);
  
  // Estado para controlar o carregamento
  const [loading, setLoading] = useState(false);
  
  // Estado para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // Número de itens por página
  
  // Cache de dados para evitar requisições repetidas (usando useRef para persistir entre renders)
  const cacheRef = useRef({});
  
  const dataCache = useMemo(() => ({
    get: (key) => {
      const item = cacheRef.current[key];
      if (item && (Date.now() - item.timestamp) < 300000) { // 5 minutos de cache
        return item.data;
      }
      return null;
    },
    set: (key, data) => {
      cacheRef.current[key] = {
        data,
        timestamp: Date.now()
      };
    }
  }), []);

  // Função para buscar dados automáticos da tabela lob_npm
  const fetchAutomaticData = useCallback(async (date) => {
    setLoading(true);
    try {
      // Formatar a data para o formato YYYY-MM-DD
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      // Criar chave de cache única para data + turno
      const cacheKey = `${formattedDate}_${selectedShift || 'all'}`;
      
      // Verificar se os dados estão em cache
      const cachedData = dataCache.get(cacheKey);
      if (cachedData) {
        console.log('Dados carregados do cache');
        setTableData(cachedData);
        setLoading(false);
        return;
      }
      
      // Construir URL com parâmetros de data e turno
      let url = `http://105.103.39.102:8080/LobMounter?data=${formattedDate}`;
      if (selectedShift) {
        url += `&shift=${selectedShift}`;
      }
              
      // Buscar dados do endpoint LobMounter com timeout
      const response = await axios.get(url, {
        timeout: 10000, // Timeout de 10 segundos
        params: {
          _t: Date.now() // Evitar cache do navegador
        }
      });
      
      // Processar os dados para agrupar por linha e montar as informações de NPM
      const processedData = {};
      
      // Agrupar os dados por linha (line_name)
      response.data.forEach(item => {
        const line = item.line_name || "";
        const mcNo = item.mc_no || 0; // mc_no vem do banco (1-9 para M1-M9)
        const ctime = item.ctime || ""; // ctime é o valor para preencher nas colunas M
        
        if (!processedData[line]) {
          processedData[line] = {
            line: line,
            model: "", // Será preenchido posteriormente se necessário
            array: "",
            // Inicializar todos os campos NPM como vazios
            m1: '', m2: '', m3: '', m4: '', m5: '',
            m6: '', m7: '', m8: '', m9: '',
            // Inicializar skipHead como vazio
            skipHead: ''
          };
        }
        
        // Mapear mc_no para o campo NPM correspondente
        // mc_no = 1 -> m1, mc_no = 2 -> m2, etc.
        if (mcNo >= 1 && mcNo <= 9) {
          const npmField = `m${mcNo}`;
          if (processedData[line][npmField] !== undefined) {
            processedData[line][npmField] = ctime;
          }
        }
      });
              
      // Converter o objeto em array
      const mappedData = Object.values(processedData).map((item, index) => ({
        id: `auto-${index}-${Date.now()}`,
        line: item.line,
        model: item.model,
        array: item.array,
        printer: "", bot: "", top: "",
        paoiLob: "",
        m1: item.m1, m2: item.m2, m3: item.m3, m4: item.m4, m5: item.m5,
        m6: item.m6, m7: item.m7, m8: item.m8, m9: item.m9,
        lob95: '', skipHead: item.skipHead || '',
        maoiLob: '', scm1Lob: '', scm2Lob: '', sanoiLob: '',
        skipDL: '', lobDL: '', skipSite: '', lobSites: '',
        sed4: '', Lob: '', laneSkip: '',
        scmTimInsideLob: '',
        scmTimLob: '',
        blockQty: '', routerLob: '', spindleQty: '',
        neck: "",
        qtyBlankReal: '',
        plannedTarget: '',
        remark: "",
        isAutomatic: true,
        date: formattedDate
      }));
      
      // Salvar no cache
      dataCache.set(cacheKey, mappedData);
              
      setTableData(mappedData);
    } catch (error) {
      console.error("Erro ao buscar dados automáticos:", error);
      if (error.code === 'ECONNABORTED') {
        alert("Tempo de resposta esgotado. Tente novamente.");
      } else {
        alert("Erro ao buscar dados automáticos");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedShift, dataCache]);

  // Efeito para buscar dados quando a data mudar
  useEffect(() => {
    fetchAutomaticData(selectedDate);
  }, [selectedDate, fetchAutomaticData]);

  // Função para adicionar nova linha manual
  const addNewRow = useCallback(() => {
    const newRow = {
      id: `manual-${Date.now()}`,
      line: "",
      model: "",
      array: "",
      printer: "", bot: "", top: "",
        paoiLob: "",
        m1: '', m2: '', m3: '', m4: '', m5: '',
        m6: '', m7: '', m8: '', m9: '',
        lob95: '', skipHead: '',
        maoiLob: '', scm1Lob: '', scm2Lob: '', sanoiLob: '',
        skipDL: '', lobDL: '', skipSite: '', lobSites: '',
        sed4: '', Lob: '', laneSkip: '',
        scmTimInsideLob: '',
        scmTimLob: '',
        blockQty: '', routerLob: '', spindleQty: '',
        neck: "",
        qtyBlankReal: '',
        plannedTarget: '',
        remark: "",
      isAutomatic: false,
      date: format(selectedDate, 'yyyy-MM-dd')
    };

    setTableData(prevData => [...prevData, newRow]);
    alert("Nova linha adicionada");
  }, [selectedDate]);

  // Função para atualizar célula com otimização
  const updateCell = useCallback((id, field, value) => {
    setTableData(prevData => 
      prevData.map(row => 
        row.id === id 
          ? { 
              ...row, 
              [field]: value
            } 
          : row
      )
    );
  }, []);

  // Função para salvar dados
  const saveData = useCallback(() => {
    // Atualiza a data de todas as linhas para a data selecionada
    const updatedData = tableData.map(row => ({
      ...row,
      date: format(selectedDate, 'yyyy-MM-dd')
    }));

    setTableData(updatedData);
    alert("Dados salvos com sucesso!");
    console.log("Dados salvos:", updatedData);
    // Aqui você faria a chamada para a API para salvar no banco de dados
  }, [tableData, selectedDate]);

  // Função para calcular o LOB95% com memoização
  const calculateLOB95 = useCallback((row) => {
    // NPM fields: m1, m2, m3, m4, m5, m6, m7, m8, m9
    const npmFields = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9'];
    
    // Filtrar campos NPM que possuem valor (diferente de 0 e não vazios)
    const validNPMValues = npmFields
      .map(field => row[field])
      .filter(value => value !== undefined && value !== null && value !== '' && value !== 0 && value !== '-');
    
    // Se não houver valores válidos, retornar 0
    if (validNPMValues.length === 0) {
      return 0;
    }
    
    // Calcular a soma dos valores válidos
    const sum = validNPMValues.reduce((acc, value) => acc + (parseFloat(value) || 0), 0);
    
    // Encontrar o valor máximo entre os valores válidos
    const max = Math.max(...validNPMValues.map(value => parseFloat(value) || 0));
    
    // Quantidade de NPM que produziu (com valor)
    const qtyProduced = validNPMValues.length;
    
    // Calcular LOB95%
    if (max === 0 || qtyProduced === 0) {
      return 0;
    }
    
    const lob95 = (sum / (max * qtyProduced)) * 100;
    
    return isNaN(lob95) ? 0 : parseFloat(lob95.toFixed(2));
  }, []);
  
  // Função para calcular o valor máximo (Neck) com memoização
  const calculateNeck = useCallback((row) => {
    // Campos a serem considerados para o cálculo do Neck
    // De "printer bot" até "npm m9" (excluindo LOB95% e Skip/Head)
    // E de "MAOI LOB" até "router spindle"
    const fieldsToCheck = [
      // Printer
      'bot', 'top',
      // PAOI
      'paoi',
      // NPM (excluindo LOB95% e Skip/Head)
      'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9',
      // MAOI
      'maoi',
      // SCM1
      'scm1',
      // SCM2
      'scm2',
      // SAOI
      'sanoi',
      // Function test
      'skipDL', 'lobDL', 'skipSite', 'lobSites',
      // SED-4000
      'sed4000Lob', 'laneSkip',
      // SCM-TIM (Inside TIM)
      'scmTimInsideLob',
      // SCM-TIM
      'scmTimLob',
      // Router
      'blockQty', 'routerLob', 'spindleQty'
    ];
    
    // Obter valores válidos (números)
    const validValues = fieldsToCheck
      .map(field => row[field])
      .filter(value => {
        // Verificar se é um número válido
        const numValue = parseFloat(value);
        return !isNaN(numValue) && isFinite(numValue);
      })
      .map(value => parseFloat(value));
    
    // Se não houver valores válidos, retornar 0
    if (validValues.length === 0) {
      return 0;
    }
    
    // Retornar o valor máximo
    return Math.max(...validValues);
  }, []);
  
  // Função para calcular Qty Blank (Real) com memoização
  const calculateQtyBlankReal = useCallback((row) => {
    // Obter o valor do Neck
    const neckValue = calculateNeck(row);
    
    // Se o valor do Neck for 0 ou inválido, retornar 0
    if (neckValue === 0 || isNaN(neckValue)) {
      return 0;
    }
    
    // Calcular: 3600 / NECK * 0.85
    const result = (3600 / neckValue) * 0.85;
    
    // Se houver erro no cálculo, retornar 0
    if (isNaN(result) || !isFinite(result)) {
      return 0;
    }
    
    return parseFloat(result.toFixed(2));
  }, [calculateNeck]);
  
  // Memoizar os cálculos para cada linha
  const getCalculatedValues = useCallback((row) => {
    return {
      lob95: calculateLOB95(row),
      neck: calculateNeck(row),
      qtyBlankReal: calculateQtyBlankReal(row)
    };
  }, [calculateLOB95, calculateNeck, calculateQtyBlankReal]);
  
  // Calcular dados paginados
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return tableData.slice(startIndex, endIndex);
  }, [tableData, currentPage, itemsPerPage]);
  
  // Calcular número total de páginas
  const totalPages = useMemo(() => {
    return Math.ceil(tableData.length / itemsPerPage);
  }, [tableData.length, itemsPerPage]);
  
  // Função para mudar de página
  const goToPage = useCallback((page) => {
    setCurrentPage(page);
  }, []);
  
  // Função para renderizar célula otimizada
  const renderCell = useCallback((row, field) => {
    // Campos que são automáticos e não editáveis
    const automaticFields = [
      'line', 'model', 'array', // Dados automáticos da API
      'lob95', // LOB 95% será calculado
      'neck', 'qtyBlankReal' // Campos calculados
    ];
    
    // Verifica se o campo deve ser automático
    if (automaticFields.includes(field)) {
      // Para campos calculados, vamos calcular o valor
      let displayValue = row[field];
      
      // Se for LOB 95%, vamos calcular
      if (field === 'lob95') {
        const calculatedValues = getCalculatedValues(row);
        displayValue = calculatedValues.lob95.toFixed(2);
      }
      
      // Se for neck, vamos calcular o valor máximo
      if (field === 'neck') {
        const calculatedValues = getCalculatedValues(row);
        displayValue = calculatedValues.neck.toFixed(2);
      }
      
      // Se for qtyBlankReal, vamos calcular com base no neck
      if (field === 'qtyBlankReal') {
        const calculatedValues = getCalculatedValues(row);
        displayValue = calculatedValues.qtyBlankReal.toFixed(2);
      }
      
      return (
        <div className="automatic-cell">
          {displayValue}
        </div>
      );
    }

    // Determinar se o campo é um dos NPM (m1 a m9) e encontrar o maior valor da linha
    const npmFields = ['m1','m2','m3','m4','m5','m6','m7','m8','m9'];
    const maxNpmValue = Math.max(
      ...npmFields.map(f => {
        const val = parseFloat(row[f]);
        return isNaN(val) ? -Infinity : val;
      })
    );

    const isMaxNpm = npmFields.includes(field) && parseFloat(row[field]) === maxNpmValue && maxNpmValue !== -Infinity;

    return (
      <input
        type="text"
        className={`editable-cell${isMaxNpm ? ' max-npm' : ''}`}
        value={row[field]}
        onChange={(e) => updateCell(row.id, field, e.target.value)}
      />
    );
  }, [getCalculatedValues, updateCell]);

  return (
    <>
    <Header/>
    <div className="kpi-container">
      {/* Cabeçalho da Página */}
      <div className="kpi-header">
        <h1 className="kpi-title">SMD LOB</h1>
        <h2 className="kpi-subtitle">Gerenciamento de CT de Produção</h2>
      </div>

      {/* Filtro de Data e Botões */}
      <div className="filter-and-buttons">
        <div className="date-filter">
          <label htmlFor="date-picker">Selecionar Data:</label>
          <input
            type="date"
            id="date-picker"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => {
              // Corrigir o problema de fuso horário ao definir a data
              const date = new Date(e.target.value);
              // Ajustar para o início do dia local
              date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
              setSelectedDate(date);
            }}
            className="date-input"
          />
        </div>
        
        {/* Filtro de Turno */}
        <div className="shift-filter">
          <label htmlFor="shift-select">Selecionar Turno:</label>
          <select
            id="shift-select"
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
            className="shift-input"
          >
            <option value="">Todos os Turnos</option>
            <option value="1T">1º Turno (1T)</option>
            <option value="2T">2º Turno (2T)</option>
            <option value="3T">3º Turno (3T)</option>
          </select>
        </div>
        
        <div className="action-buttons">
          <button className="btn btn-outline" onClick={addNewRow}>
            Adicionar Linha
          </button>
          <button className="btn btn-primary" onClick={saveData}>
            Salvar
          </button>
        </div>
      </div>

      {/* Indicador de carregamento */}
      {loading && (
        <div className="loading-indicator">
          Carregando dados...
        </div>
      )}

      {/* Tabela */}
      <div className="table-container">
        <table className="kpi-table">
          {/* Cabeçalhos da Tabela */}
          <thead>
            {/* Cabeçalhos das Colunas - Linha 1 */}
            <tr className="column-header">
              <th rowSpan="2">LINE</th>
              <th rowSpan="2">Model</th>
              <th rowSpan="2">Array</th>
              <th colSpan="2">Printer</th>
              <th>PAOI</th>
              <th colSpan="11">NPM</th>
              <th>MAOI</th>
              <th>SCM1</th>
              <th>SCM2</th>
              <th>SAOI</th>
              <th colSpan="4">Function test</th>
              <th colSpan="2">SED-4000</th>
              <th>SCM-TIM (Inside TIM)</th>
              <th>SCM-TIM</th>
              <th colSpan="3">Router</th>
              <th rowSpan="2">Neck</th>
              <th rowSpan="2">Qty Blank(Real)</th>
              <th rowSpan="2">Planned Target</th>
              <th rowSpan="2">Remark</th>
              
            </tr>
            
            {/* Cabeçalhos das Colunas - Linha 2 */}
            <tr className="column-header">
              <th>Bot</th>
              <th>Top</th>
              <th>LOB</th>
              <th>M1</th>
              <th>M2</th>
              <th>M3</th>
              <th>M4</th>
              <th>M5</th>
              <th>M6</th>
              <th>M7</th>
              <th>M8</th>
              <th>M9</th>
              <th>LOB 95%</th>
              <th>Skip/Head</th>
              <th>LOB</th>
              <th>LOB</th>
              <th>LOB</th>
              <th>LOB</th>
              <th>Skip D/L</th>
              <th>LOB D/L</th>
              <th>Skip Site</th>
              <th>LOB Sites</th>
              <th>LOB</th>
              <th>Lane Skip</th>
              <th>LOB</th>
              <th>LOB</th>
              <th>Block Qty</th>
              <th>LOB Router</th>
              <th>Spindle Qty</th>
            </tr>
          </thead>
          
          {/* Corpo da Tabela */}
          <tbody>
            {paginatedData.map((row) => (
              <tr key={row.id}>
                {/* LINE / MODEL / ARRAY - Dados automáticos */}
                <td>{renderCell(row, 'line')}</td>
                <td>{renderCell(row, 'model')}</td>
                <td>{renderCell(row, 'array')}</td>
                
                {/* PRINTER - Dados manuais */}
                <td>{renderCell(row, 'bot')}</td>
                <td>{renderCell(row, 'top')}</td>
                
                {/* PAOI/LOB - Dados manuais */}
                <td>{renderCell(row, 'paoi')}</td>
                {/* Removido paoiLob pois está mesclado com paoi */}
                
                {/* NPM - Dados manuais */}
                {/* Removido npm pois não é uma célula visível */}
                <td>{renderCell(row, 'm1')}</td>
                <td>{renderCell(row, 'm2')}</td>
                <td>{renderCell(row, 'm3')}</td>
                <td>{renderCell(row, 'm4')}</td>
                <td>{renderCell(row, 'm5')}</td>
                <td>{renderCell(row, 'm6')}</td>
                <td>{renderCell(row, 'm7')}</td>
                <td>{renderCell(row, 'm8')}</td>
                <td>{renderCell(row, 'm9')}</td>
                <td>{renderCell(row, 'lob95')}</td>
                <td>{renderCell(row, 'skipHead')}</td>
                
                {/* MAOI/LOB - Dados manuais */}
                <td>{renderCell(row, 'maoi')}</td>
                {/* Removido maoiLob pois está mesclado com maoi */}
                
                {/* SCM1/LOB - Dados manuais */}
                <td>{renderCell(row, 'scm1')}</td>
                {/* Removido scm1Lob pois está mesclado com scm1 */}
                
                {/* SCM2/LOB - Dados manuais */}
                <td>{renderCell(row, 'scm2')}</td>
                {/* Removido scm2Lob pois está mesclado com scm2 */}
                
                {/* SAOI/LOB - Dados manuais */}
                <td>{renderCell(row, 'sanoi')}</td>
                {/* Removido sanoiLob pois está mesclado com sanoi */}
                
                {/* FUNCTION TEST - Dados manuais */}
                <td>{renderCell(row, 'skipDL')}</td>
                <td>{renderCell(row, 'lobDL')}</td>
                <td>{renderCell(row, 'skipSite')}</td>
                <td>{renderCell(row, 'lobSites')}</td>
                
                {/* SED-4000 - Dados manuais */}
                <td>{renderCell(row, 'sed4000Lob')}</td>
                <td>{renderCell(row, 'laneSkip')}</td>
                
                {/* SCM-TIM (Inside TIM) - Dados manuais */}
                <td>{renderCell(row, 'scmTimInsideLob')}</td>
                
                {/* SCM-TIM - Dados manuais */}
                <td>{renderCell(row, 'scmTimLob')}</td>
                
                {/* ROUTER - Dados manuais */}
                <td>{renderCell(row, 'blockQty')}</td>
                <td>{renderCell(row, 'routerLob')}</td>
                <td>{renderCell(row, 'spindleQty')}</td>
                
                {/* NECK - Dados manuais */}
                <td>{renderCell(row, 'neck')}</td>
                
                {/* QTY BLANK (REAL) - Dados manuais */}
                <td>{renderCell(row, 'qtyBlankReal')}</td>
                
                {/* PLANNED TARGET - Dados manuais */}
                <td>{renderCell(row, 'plannedTarget')}</td>
                
                {/* REMARK - Dados manuais */}
                <td>{renderCell(row, 'remark')}</td>
                {/* Células extras para corresponder ao número de colunas dos cabeçalhos */}

                {/* Fim da linha - 48 células no total */}
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Paginação */}
        {totalPages > 1 && (
          <div className="pagination">
            <button 
              className="pagination-btn"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Anterior
            </button>
            
            <span className="pagination-info">
              Página {currentPage} de {totalPages}
            </span>
            
            <button 
              className="pagination-btn"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default KPITable;


