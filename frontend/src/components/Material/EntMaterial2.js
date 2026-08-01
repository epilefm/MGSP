import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  IconButton, 
  Collapse, 
  Button, 
  TextField, 
  Grid, 
  Alert, 
  CircularProgress, 
  Chip,
  Card,
  CardContent,
  Divider,
  Tooltip,
  Fab
} from '@mui/material';
import { 
  KeyboardArrowDown, 
  KeyboardArrowUp, 
  Add, 
  Save, 
  Refresh, 
  Delete,
  Inventory2,
  ProductionQuantityLimits,
  CalendarToday,
  Factory,
  Person,
  Notes
} from '@mui/icons-material';
import Header from '../Layout/MGSPHead/Header';
import Axios from 'axios';
import './EntMaterial2.css';

export default function EntMaterial2() {
  const [productionPlans, setProductionPlans] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [productInputs, setProductInputs] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [reelIdStatus, setReelIdStatus] = useState({}); // Para rastrear o status dos Reel IDs
  const [dateFilter, setDateFilter] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Colunas da tabela conforme especificado
  const tableColumns = [
    { id: 'numero', label: 'Nº', minWidth: 60, icon: null },
    { id: 'data', label: 'Data', minWidth: 100, icon: null },
    { id: 'linha', label: 'Linha', minWidth: 100, icon: null },
    { id: 'prodOrder', label: 'PO', minWidth: 120, icon: null },
    { id: 'modelo', label: 'Modelo', minWidth: 150, icon: null },
    { id: 'halb', label: 'Halb', minWidth: 120, icon: null },
    { id: 'plant', label: 'Plant', minWidth: 100, icon: null },
    { id: 'keep', label: 'Keep', minWidth: 100, icon: null },
    { id: 'planQty', label: 'Qty PO', minWidth: 100, icon: null }
  ];

  useEffect(() => {
    loadProductionPlans();
  }, [dateFilter]);

  const loadProductionPlans = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Chamada direta da nova API que funciona
      const response = await Axios.get('http://105.103.2.25/json/smd-material-tracking/?context=getSMDKitting2');
      
      // Log para verificar os dados brutos
      console.log('Dados brutos da API:', response.data);
      
      // Mapear os dados da API para o formato esperado pelo componente
      const mappedData = response.data.map((item) => ({
        id: item.PRODC_INST_NO || Date.now() + Math.random(), // ID único para cada item
        originalId: item.PRODC_INST_NO, // Manter o ID original para referência
        data: item.PLAN_YMD ? `${item.PLAN_YMD.substring(0, 4)}/${item.PLAN_YMD.substring(4, 6)}/${item.PLAN_YMD.substring(6, 8)}` : '',
        linha: item.LINE_NM || '',
        prodOrder: item.PRODC_INST_NO || '',
        modelo: item.BASIC_MODEL_CODE || '',
        halb: item.MODEL_CODE || '',
        plant: item.PLANT_CODE || '',
        keep: item.CNTN_YN || '',
        planQty: item.PLAN_QTY || 0
      }));
      
      // Log para verificar os dados mapeados
      console.log('Dados mapeados:', mappedData);
      console.log('Data atual do filtro:', dateFilter);
      
      setProductionPlans(mappedData);
      setLoading(false);
      
    } catch (err) {
      console.error('Erro ao carregar planos de produção:', err);
      setError('Erro ao carregar planos de produção. Verifique o console para mais detalhes.');
      setLoading(false);
    }
  };

  // Filtrar planos de produção com base no termo de busca e data
  const filteredPlans = productionPlans.filter(plan => {
    // Converter a data do filtro para o formato YYYY/MM/DD para corresponder ao formato dos dados
    const [year, month, day] = dateFilter.split('-');
    const filterDateFormatted = `${year}/${month}/${day}`;
    
    // Log para debug
    console.log('Filtrando planos:', {
      planData: plan.data,
      filterDateFormatted: filterDateFormatted,
      dateMatch: plan.data === filterDateFormatted
    });
    
    // Verificar se a data do plano corresponde ao filtro de data
    const dateMatch = plan.data === filterDateFormatted;
    
    // Se não há termo de busca, mostrar todos os planos da data
    if (!searchTerm) {
      console.log('Sem termo de busca, retornando dateMatch:', dateMatch);
      return dateMatch;
    }
    
    // Verificar se corresponde ao termo de busca
    const searchMatch = Object.values(plan).some(value => 
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    console.log('Com termo de busca, retornando dateMatch && searchMatch:', dateMatch && searchMatch);
    return dateMatch && searchMatch;
  });

  const handleRowExpand = (rowId) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
    
    // Inicializa campos de input para esta linha se ainda não existirem
    if (!expandedRows[rowId]) {
      setProductInputs(prev => ({
        ...prev,
        [rowId]: [
          {
            id: Date.now(),
            reelId: '',
            barcode: '',
            partNumber: '',
            quantity: '',
            observations: ''
          }
        ]
      }));
    }
  };

  const addProductInput = (rowId) => {
    const newProductId = Date.now();
    setProductInputs(prev => ({
      ...prev,
      [rowId]: [
        ...(prev[rowId] || []),
        {
          id: newProductId,
          reelId: '',
          barcode: '',
          partNumber: '',
          quantity: '',
          observations: ''
        }
      ]
    }));
    return newProductId;
  };

  const removeProductInput = (rowId, productId) => {
    setProductInputs(prev => ({
      ...prev,
      [rowId]: prev[rowId].filter(product => product.id !== productId)
    }));
  };

  const handleProductInputChange = (rowId, productId, field, value) => {
    setProductInputs(prev => ({
      ...prev,
      [rowId]: prev[rowId].map(product => 
        product.id === productId ? { ...product, [field]: value } : product
      )
    }));
  };

  // Função para lidar com a tecla Enter nos campos de input
  const handleKeyPress = (e, rowId, productId, field, currentIndex) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (field === 'barcode') {
        // Após escanear o barcode, adicionar nova linha e focar no próximo Reel ID
        const newProductId = addProductInput(rowId);
        // Focar no Reel ID da nova linha
        setTimeout(() => {
          const nextElement = document.querySelector(`[name="${rowId}-${newProductId}-reelId"]`);
          if (nextElement) {
            nextElement.focus();
          }
        }, 50);
      } else {
        // Navegação normal entre campos
        const fields = ['reelId', 'barcode'];
        const nextIndex = (currentIndex + 1) % fields.length;
        const nextField = fields[nextIndex];
        
        // Encontrar o próximo campo e focar nele
        const nextElement = document.querySelector(`[name="${rowId}-${productId}-${nextField}"]`);
        if (nextElement) {
          nextElement.focus();
        }
      }
    }
  };

  // Função para verificar se o Reel ID já existe no banco de dados
  const checkReelIdExists = async (reelId) => {
    try {
      const response = await Axios.get(`http://105.103.112.18:8080/checkReelId/${reelId}`);
      return response.data.exists;
    } catch (err) {
      console.error('Erro ao verificar Reel ID:', err);
      return false;
    }
  };

  // Função alternativa para salvar produtos
  const handleSaveProductsAlternative = async (rowId) => {
    const products = productInputs[rowId] || [];
    const selectedPlan = productionPlans.find(plan => plan.id === rowId);

    // Validar todos os produtos
    const invalidProducts = products.filter(product => 
      !product.reelId || !product.barcode || !product.quantity
    );

    if (invalidProducts.length > 0) {
      setError('Preencha todos os campos obrigatórios em todos os produtos');
      return;
    }

    // Verificar se algum Reel ID já existe no banco
    setLoading(true);
    setError('');

    try {
      // Verificar cada Reel ID
      const reelIdChecks = await Promise.all(
        products.map(async (product) => {
          const exists = await checkReelIdExists(product.reelId);
          return { reelId: product.reelId, exists };
        })
      );

      // Verificar se algum Reel ID já existe
      const existingReelIds = reelIdChecks.filter(check => check.exists);
      if (existingReelIds.length > 0) {
        const reelIds = existingReelIds.map(check => check.reelId).join(', ');
        setError(`Os seguintes Reel IDs já existem no banco de dados: ${reelIds}. Por favor, use Reel IDs diferentes.`);
        setLoading(false);
        return;
      }

      // Preparar dados para envio
      const dataToSend = {
        productionPlanId: rowId,
        prodOrder: selectedPlan.prodOrder,
        linha: selectedPlan.linha,
        modelo: selectedPlan.modelo,
        halb: selectedPlan.halb,
        plant: selectedPlan.plant,
        keep: selectedPlan.keep,
        planQty: selectedPlan.planQty,
        products: products.map(product => ({
          reelId: product.reelId,
          barcode: product.barcode,
          partNumber: product.partNumber,
          quantity: product.quantity,
          observations: product.observations,
          registryDate: new Date().toISOString()
        }))
      };

      // Enviar dados para o servidor usando uma abordagem alternativa
      const response = await fetch('/saveEntradawip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        setSuccess(`${products.length} produto(s) vinculado(s) ao plano ${selectedPlan.prodOrder} com sucesso!`);
        setLoading(false);

        // Limpar campos após salvamento
        setProductInputs(prev => ({
          ...prev,
          [rowId]: [
            {
              id: Date.now(),
              reelId: '',
              barcode: '',
              partNumber: '',
              quantity: '',
              observations: ''
            }
          ]
        }));

        // Limpar mensagem de sucesso após 3 segundos
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError('Erro ao salvar produtos: ' + (errorData.message || 'Erro desconhecido'));
        setLoading(false);
      }

    } catch (err) {
      setError('Erro ao salvar produtos: ' + (err.message || 'Erro de conexão'));
      setLoading(false);
    }
  };

  const handleSaveProducts = async (rowId) => {
    const products = productInputs[rowId] || [];
    const selectedPlan = productionPlans.find(plan => plan.id === rowId);

    console.log('Iniciando salvamento de produtos para o plano:', rowId);
    console.log('Plano selecionado:', selectedPlan);
    console.log('Produtos a serem salvos:', products);

    // Validar todos os produtos
    const invalidProducts = products.filter(product => 
      !product.reelId || !product.barcode || !product.quantity
    );

    if (invalidProducts.length > 0) {
      console.log('Erro: Produtos inválidos encontrados:', invalidProducts);
      setError('Preencha todos os campos obrigatórios em todos os produtos');
      return;
    }

    // Verificar se há Reel IDs duplicados nos produtos atuais
    const reelIds = products.map(product => product.reelId);
    const duplicateReelIds = reelIds.filter((reelId, index) => reelIds.indexOf(reelId) !== index);
    
    if (duplicateReelIds.length > 0) {
      const uniqueDuplicates = [...new Set(duplicateReelIds)];
      console.log('Erro: Reel IDs duplicados encontrados nos produtos atuais:', uniqueDuplicates);
      setError(`Os seguintes Reel IDs estão duplicados nesta operação: ${uniqueDuplicates.join(', ')}. Por favor, use Reel IDs diferentes.`);
      return;
    }

    // Verificar se algum Reel ID já existe no banco
    setLoading(true);
    setError('');
    console.log('Verificando Reel IDs duplicados...');

    try {
      // Verificar cada Reel ID
      const reelIdChecks = await Promise.all(
        products.map(async (product) => {
          console.log('Verificando Reel ID:', product.reelId);
          const exists = await checkReelIdExists(product.reelId);
          console.log('Reel ID', product.reelId, 'existe:', exists);
          return { reelId: product.reelId, exists };
        })
      );

      // Verificar se algum Reel ID já existe
      const existingReelIds = reelIdChecks.filter(check => check.exists);
      if (existingReelIds.length > 0) {
        const reelIds = existingReelIds.map(check => check.reelId).join(', ');
        console.log('Erro: Reel IDs duplicados encontrados:', reelIds);
        setError(`Os seguintes Reel IDs já existem no banco de dados: ${reelIds}. Por favor, use Reel IDs diferentes.`);
        setLoading(false);
        return;
      }

      // Preparar dados para envio, incluindo os dados do plano de produção
      const dataToSend = {
        products: products.map(product => ({
          reelId: product.reelId,
          barcode: product.barcode,
          partNumber: product.partNumber,
          quantity: product.quantity
        })),
        // Adicionar dados do plano de produção
        line: selectedPlan.linha,
        prodOrder: selectedPlan.prodOrder,
        model: selectedPlan.modelo,
        halb: selectedPlan.halb,
        plant: selectedPlan.plant,
        keep: selectedPlan.keep,
        planQty: selectedPlan.planQty
      };

      console.log('Enviando dados para o servidor:', dataToSend);

      // Enviar dados para o servidor
      const response = await Axios.post('http://105.103.112.18:8080/saveEntradawip', dataToSend);
      console.log('Resposta do servidor:', response.data);

      setSuccess(`${products.length} produto(s) vinculado(s) ao plano ${selectedPlan.prodOrder} com sucesso!`);
      setLoading(false);

      // Limpar campos após salvamento
      setProductInputs(prev => ({
        ...prev,
        [rowId]: [
          {
            id: Date.now(),
            reelId: '',
            barcode: '',
            partNumber: '',
            quantity: '',
            observations: ''
          }
        ]
      }));

      console.log('Produtos salvos com sucesso!');

      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      console.error('Erro ao salvar produtos:', err);
      setError('Erro ao salvar produtos: ' + (err.response?.data?.message || err.message));
      setLoading(false);
    }
  };

  // Componente para campos de input modernos
  const ModernInputField = ({ 
    label, 
    value, 
    onChange, 
    required = false, 
    type = 'text',
    multiline = false,
    rows = 1,
    icon: IconComponent,
    ...props 
  }) => (
    <Box className="entmaterial2-input-wrapper">
      <Box className="entmaterial2-input-label-container">
        {IconComponent && (
          <IconComponent className="entmaterial2-input-icon" fontSize="small" />
        )}
        <Typography variant="caption" className="entmaterial2-input-label">
          {label} {required && <span className="entmaterial2-required">*</span>}
        </Typography>
      </Box>
      <TextField
        fullWidth
        variant="outlined"
        size="small"
        value={value}
        onChange={onChange}
        required={required}
        type={type}
        multiline={multiline}
        rows={rows}
        className="entmaterial2-textfield"
        {...props}
      />
    </Box>
  );

  return (
    <>
   <Header/>
      <Box className="entmaterial2-container">
        {/* Header Moderno */}
        <Box className="entmaterial2-header">
          <Box className="entmaterial2-header-content">
            <Box className="entmaterial2-title-section">
              <Inventory2 className="entmaterial2-header-icon" />
              <Box>
                <Typography variant="h4" className="entmaterial2-title">
                  Entrada de Material
                </Typography>
                <Typography variant="subtitle1" className="entmaterial2-subtitle">
                  Gestão de Planos de Produção e Vinculação de Produtos
                </Typography>
              </Box>
            </Box>
            
            <Box className="entmaterial2-actions">
              <TextField
                label="Data"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                className="entmaterial2-date-field"
              />
              <TextField
                placeholder="Buscar planos..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="entmaterial2-search-field"
                InputProps={{
                  startAdornment: <SearchIcon className="entmaterial2-search-icon" />
                }}
              />
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={loadProductionPlans}
                disabled={loading}
                className="entmaterial2-refresh-btn"
              >
                Atualizar
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => window.location.href = '/ListaEntradaWIP'}
                className="entmaterial2-records-btn"
                style={{ marginLeft: '10px' }}
              >
                Ver Registros
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Alertas */}
        {error && (
          <Alert 
            severity="error" 
            className="entmaterial2-alert" 
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert 
            severity="success" 
            className="entmaterial2-alert" 
            onClose={() => setSuccess('')}
          >
            {success}
          </Alert>
        )}

        {/* Loading */}
        {loading && (
          <Box className="entmaterial2-loading-overlay">
            <Box className="entmaterial2-loading-content">
              <CircularProgress size={40} className="entmaterial2-spinner" />
              <Typography variant="body1">Carregando dados...</Typography>
            </Box>
          </Box>
        )}

        {/* Tabela Principal */}
        <Card className="entmaterial2-table-card">
          <CardContent className="entmaterial2-table-content">
            <Box className="entmaterial2-table-header">
<Typography variant="h6" className="entmaterial2-table-title">
                <Inventory2 className="entmaterial2-table-icon" />
                Planos de Produção
              </Typography>
              <Typography variant="body2" className="entmaterial2-table-subtitle">
                {filteredPlans.length} plano(s) encontrado(s)
              </Typography>
            </Box>
            
            <TableContainer className="entmaterial2-table-container">
              <Table stickyHeader className="entmaterial2-table">
                <TableHead>
                  <TableRow className="entmaterial2-table-header-row">
                    <TableCell className="entmaterial2-expand-cell" />
                    {tableColumns.map((column) => (
                      <TableCell
                        key={column.id}
                        className="entmaterial2-header-cell"
                        style={{ minWidth: column.minWidth }}
                      >
                        <Box className="entmaterial2-header-content">
                          {column.icon && (
                            <span className="entmaterial2-header-icon">
                              {column.icon}
                            </span>
                          )}
                          <span className="entmaterial2-header-text">
                            {column.label}
                          </span>
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPlans.map((row) => (
                    <React.Fragment key={row.id}>
                      <TableRow
                        className={`entmaterial2-table-row ${
                          expandedRows[row.id] ? 'entmaterial2-row-expanded' : ''
                        }`}
                        onClick={() => handleRowExpand(row.id)}
                      >
                        <TableCell className="entmaterial2-expand-cell">
                          <IconButton
                            aria-label="expand row"
                            size="small"
                            className="entmaterial2-expand-btn"
                          >
                            {expandedRows[row.id] ? (
                              <KeyboardArrowUp className="entmaterial2-arrow-icon" />
                            ) : (
                              <KeyboardArrowDown className="entmaterial2-arrow-icon" />
                            )}
                          </IconButton>
                        </TableCell>
                        {tableColumns.map((column) => (
                          <TableCell 
                            key={column.id} 
                            className="entmaterial2-data-cell"
                          >
                            {column.id === 'numero' ? (
                              // Mostrar a posição sequencial baseada nos itens filtrados
                              filteredPlans.indexOf(row) + 1
                            ) : column.id === 'linha' ? (
                              <Chip 
                                label={row[column.id]} 
                                size="small" 
                                className={`entmaterial2-chip entmaterial2-chip-${row[column.id].toLowerCase()}`}
                              />
                            ) : column.id === 'planQty' ? (
                              <Box className="entmaterial2-quantity-cell">
                                <ProductionQuantityLimits className="entmaterial2-quantity-icon" />
                                <span>{row[column.id]}</span>
                              </Box>
                            ) : (
                              row[column.id]
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                      
                      {/* Seção Expandida para Input de Produtos */}
                      <TableRow className="entmaterial2-expanded-row">
                        <TableCell
                          style={{ paddingBottom: 0, paddingTop: 0 }}
                          colSpan={tableColumns.length + 1}
                        >
                          <Collapse 
                            in={expandedRows[row.id]} 
                            timeout="auto" 
                            unmountOnExit
                            className="entmaterial2-collapse"
                          >
                            <Card className="entmaterial2-input-card">
                              <CardContent className="entmaterial2-input-content">
                                <Box className="entmaterial2-input-header">
                                  <Typography variant="h6" className="entmaterial2-input-title">
                                    <Add className="entmaterial2-input-title-icon" />
                                    Vincular Produtos ao Plano: {row.prodOrder}
                                  </Typography>
                                  <Typography variant="subtitle2" className="entmaterial2-input-subtitle">
                                    {row.modelo} | {row.linha} | Qty: {row.planQty}
                                  </Typography>
                                </Box>
                                
                                <Divider className="entmaterial2-divider" />
                                
                                <Grid container spacing={3} className="entmaterial2-input-grid">
                                  <Grid item xs={12}>
                                    <Button
                                      variant="outlined"
                                      startIcon={<Add />}
                                      onClick={() => addProductInput(row.id)}
                                      className="entmaterial2-add-btn"
                                    >
                                      Adicionar Produto
                                    </Button>
                                  </Grid>
                                  
                                  {(productInputs[row.id] || []).map((product, index) => (
                                    <Grid item xs={12} key={product.id}>
                                      <Card className="entmaterial2-product-card">
                                        <CardContent className="entmaterial2-product-content">
                                          <Box className="entmaterial2-product-header">
                                            <Typography variant="subtitle1" className="entmaterial2-product-title">
                                              <Inventory2 className="entmaterial2-product-icon" />
                                              Produto #{index + 1}
                                            </Typography>
                                            {(productInputs[row.id] || []).length > 1 && (
                                              <Tooltip title="Remover produto">
                                                <IconButton
                                                  size="small"
                                                  onClick={() => removeProductInput(row.id, product.id)}
                                                  className="entmaterial2-remove-btn"
                                                >
                                                  <Delete />
                                                </IconButton>
                                              </Tooltip>
                                            )}
                                          </Box>
                                          
                                          <Grid container spacing={2}>
                                            <Grid item xs={12} md={2}>
                                              <TextField
                                                fullWidth
                                                variant="outlined"
                                                size="small"
                                                label="Reel ID *"
                                                value={product.reelId}
                                                onChange={async (e) => {
                                                  // Limitar a 13 caracteres
                                                  const value = e.target.value.slice(0, 13);
                                                  handleProductInputChange(row.id, product.id, 'reelId', value);
                                                  
                                                  // Verificar se há Reel IDs duplicados nos produtos atuais
                                                  const currentProducts = productInputs[row.id] || [];
                                                  const isDuplicate = currentProducts.some(
                                                    p => p.id !== product.id && p.reelId === value && value.length === 13
                                                  );
                                                  
                                                  if (isDuplicate) {
                                                    // Atualizar o status para "duplicado"
                                                    setReelIdStatus(prev => ({
                                                      ...prev,
                                                      [`${row.id}-${product.id}`]: { status: 'error', message: 'Reel ID duplicado nesta operação' }
                                                    }));
                                                    return;
                                                  }
                                                  
                                                  // Verificar se o Reel ID já existe no banco de dados
                                                  if (value.length === 13) {
                                                    // Atualizar o status para "verificando"
                                                    setReelIdStatus(prev => ({
                                                      ...prev,
                                                      [`${row.id}-${product.id}`]: { status: 'checking', message: 'Verificando...' }
                                                    }));
                                                    
                                                    try {
                                                      const exists = await checkReelIdExists(value);
                                                      if (exists) {
                                                        setReelIdStatus(prev => ({
                                                          ...prev,
                                                          [`${row.id}-${product.id}`]: { status: 'error', message: 'Reel ID já existe' }
                                                        }));
                                                      } else {
                                                        setReelIdStatus(prev => ({
                                                          ...prev,
                                                          [`${row.id}-${product.id}`]: { status: 'success', message: 'Reel ID disponível' }
                                                        }));
                                                      }
                                                    } catch (err) {
                                                      setReelIdStatus(prev => ({
                                                        ...prev,
                                                        [`${row.id}-${product.id}`]: { status: 'error', message: 'Erro na verificação' }
                                                      }));
                                                    }
                                                  } else if (value.length === 0) {
                                                    // Limpar o status se o campo estiver vazio
                                                    setReelIdStatus(prev => {
                                                      const newStatus = { ...prev };
                                                      delete newStatus[`${row.id}-${product.id}`];
                                                      return newStatus;
                                                    });
                                                  } else {
                                                    // Atualizar o status para "digitando"
                                                    setReelIdStatus(prev => ({
                                                      ...prev,
                                                      [`${row.id}-${product.id}`]: { status: 'typing', message: 'Digite os 13 caracteres' }
                                                    }));
                                                  }
                                                }}
                                                required
                                                className={`entmaterial2-textfield ${
                                                  reelIdStatus[`${row.id}-${product.id}`]?.status === 'error' ? 'entmaterial2-textfield-error' : 
                                                  reelIdStatus[`${row.id}-${product.id}`]?.status === 'success' ? 'entmaterial2-textfield-success' : ''
                                                }`}
                                                name={`${row.id}-${product.id}-reelId`}
                                                onKeyDown={(e) => handleKeyPress(e, row.id, product.id, 'reelId', 0)}
                                                inputProps={{ maxLength: 13 }}
                                                helperText={reelIdStatus[`${row.id}-${product.id}`]?.message}
                                                FormHelperTextProps={{
                                                  className: `entmaterial2-helper-text ${
                                                    reelIdStatus[`${row.id}-${product.id}`]?.status === 'error' ? 'entmaterial2-helper-text-error' : 
                                                    reelIdStatus[`${row.id}-${product.id}`]?.status === 'success' ? 'entmaterial2-helper-text-success' : ''
                                                  }`
                                                }}
                                              />
                                            </Grid>
                                            
                                            <Grid item xs={12} md={3}>
                                              <TextField
                                                fullWidth
                                                variant="outlined"
                                                size="small"
                                                label="Código de Barras *"
                                                value={product.barcode}
                                                onChange={(e) => {
                                                  // Limitar a 46 caracteres
                                                  const value = e.target.value.slice(0, 46);
                                                  handleProductInputChange(row.id, product.id, 'barcode', value);
                                                  
                                                  // Extrair Part Number (11 primeiros dígitos) e Quantidade (últimos 6 dígitos)
                                                  if (value.length >= 17) {
                                                    const partNumber = value.slice(0, 11);
                                                    const quantity = value.slice(-6);
                                                    handleProductInputChange(row.id, product.id, 'partNumber', partNumber);
                                                    handleProductInputChange(row.id, product.id, 'quantity', quantity);
                                                  }
                                                }}
                                                required
                                                className="entmaterial2-textfield"
                                                name={`${row.id}-${product.id}-barcode`}
                                                onKeyDown={(e) => handleKeyPress(e, row.id, product.id, 'barcode', 1)}
                                                inputProps={{ maxLength: 46 }}
                                              />
                                            </Grid>
                                            
                                            <Grid item xs={12} md={2}>
                                              <TextField
                                                fullWidth
                                                variant="outlined"
                                                size="small"
                                                label="Part Number"
                                                value={product.partNumber || ''}
                                                onChange={(e) => handleProductInputChange(row.id, product.id, 'partNumber', e.target.value)}
                                                className="entmaterial2-textfield entmaterial2-discreet-field"
                                                name={`${row.id}-${product.id}-partNumber`}
                                                disabled
                                              />
                                            </Grid>
                                            
                                            <Grid item xs={12} md={2}>
                                              <TextField
                                                fullWidth
                                                variant="outlined"
                                                size="small"
                                                label="Quantidade"
                                                value={product.quantity || ''}
                                                onChange={(e) => handleProductInputChange(row.id, product.id, 'quantity', e.target.value)}
                                                className="entmaterial2-textfield entmaterial2-discreet-field"
                                                name={`${row.id}-${product.id}-quantity`}
                                                disabled
                                              />
                                            </Grid>
                                            
                                            <Grid item xs={12} md={3}>
                                              <TextField
                                                fullWidth
                                                variant="outlined"
                                                size="small"
                                                label="Observações"
                                                value={product.observations || ''}
                                                onChange={(e) => handleProductInputChange(row.id, product.id, 'observations', e.target.value)}
                                                className="entmaterial2-textfield"
                                                name={`${row.id}-${product.id}-observations`}
                                                multiline
                                                rows={1}
                                              />
                                            </Grid>
                                          </Grid>
                                        </CardContent>
                                      </Card>
                                    </Grid>
                                  ))}
                                  
                                  <Grid item xs={12}>
                                    <Box className="entmaterial2-actions-row">
                                      <div></div> {/* Espaço vazio para manter o layout */}
                                      <Button
                                        variant="contained"
                                        startIcon={<Save />}
                                        onClick={() => handleSaveProducts(row.id)}
                                        disabled={loading}
                                        className="entmaterial2-save-btn"
                                      >
                                        Salvar {((productInputs[row.id] || []).length)} Produto(s)
                                      </Button>
                                    </Box>
                                  </Grid>
                                </Grid>
                              </CardContent>
                            </Card>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
        
        {/* Botão Flutuante para Ações Rápidas */}
        <Fab
          color="primary"
          aria-label="refresh"
          className="entmaterial2-fab"
          onClick={loadProductionPlans}
          disabled={loading}
        >
          <Refresh className={loading ? 'entmaterial2-spin' : ''} />
        </Fab>
      </Box>
    </>
  );
}

// Componente de ícone de busca para evitar erro
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);
