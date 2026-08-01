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
  TextField, 
  Button, 
  CircularProgress, 
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Pagination,
  Stack,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { 
  Inventory2, 
  Refresh, 
  Clear, 
  CalendarToday, 
  Download 
} from '@mui/icons-material';
import Header from '../Layout/MGSPHead/Header';
import Axios from 'axios';
import * as XLSX from 'xlsx';
import ExcelExportMaterial from './ExcelExportMaterial';


export default function ListaEntradaWIP() {
  const [registros, setRegistros] = useState([]);
  const [filteredRegistros, setFilteredRegistros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({
    date: '',
    prod_order: '',
    reel_id: '',
    part_number: ''
  });
  const [page, setPage] = useState(1);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [registrosPerPage, setRegistrosPerPage] = useState(20);

  // Carregar registros ao montar o componente
  useEffect(() => {
    loadRegistros();
  }, []);

  // Aplicar filtros quando os registros ou filtros mudarem
  useEffect(() => {
    applyFilters();
  }, [registros, filters]);

  const loadRegistros = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await Axios.get('http://105.103.112.18:8080/getEntradawip');
      setRegistros(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar registros:', err);
      setError('Erro ao carregar registros. Verifique o console para mais detalhes.');
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const filtered = registros.filter(registro => {
      return Object.keys(filters).every(key => {
        // Ignorar filtros para os campos de quantidade
        if (key === 'plan_qty' || key === 'qty') {
          return true;
        }
        
        // Filtro de data simples
        if (key === 'date' && filters.date) {
          const recordDate = new Date(registro.date);
          const filterDate = new Date(filters.date);
          return recordDate.toDateString() === filterDate.toDateString();
        }
        
        if (!filters[key]) return true;
        return registro[key] && registro[key].toString().toLowerCase().includes(filters[key].toLowerCase());
      });
    });
    setFilteredRegistros(filtered);
    setPage(1); // Resetar para a primeira página quando os filtros mudarem
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      date: '',
      prod_order: '',
      reel_id: '',
      part_number: ''
    });
  };

  // Funções para exportação de Excel
  const getExcelData = () => {
    return filteredRegistros.map((registro, index) => ({
      'Nº': indexOfFirstRegistro + index + 1,
      'Data': registro.date || '',
      'Linha': registro.line || '',
      'PO': registro.prod_order || '',
      'Modelo': registro.model || '',
      'Halb': registro.halb || '',
      'Plant': registro.plant || '',
      'Keep': registro.keep || '',
      'Qty PO': registro.plan_qty || '',
      'Qty Registrada': registro.qty || '',
      'Reel ID': registro.reel_id || '',
      'Código de Barras': registro.barcode || '',
      'Part Number': registro.part_number || '',
      'Turno': registro.shift || '',
      'Data de Criação': registro.created_at ? new Date(registro.created_at).toLocaleString() : '',
      'Status de Saída': registro.confirmed_exit ? 'Realizado Saída' : 'Pendente Saída'
    }));
  };

  const getFileName = () => {
    // Usar a primeira PO da lista filtrada como nome do arquivo
    if (currentRegistros && currentRegistros.length > 0 && currentRegistros[0].prod_order) {
      return currentRegistros[0].prod_order;
    }
    // Se não houver registros, usar um nome padrão
    return 'registros_entrada_wip';
  };


  // Paginação
  const indexOfLastRegistro = page * registrosPerPage;
  const indexOfFirstRegistro = indexOfLastRegistro - registrosPerPage;
  const currentRegistros = filteredRegistros.slice(indexOfFirstRegistro, indexOfLastRegistro);
  const totalPages = Math.ceil(filteredRegistros.length / registrosPerPage);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // Funções para gerenciar a seleção de registros
  const handleSelectRecord = (recordId) => {
    setSelectedRecords(prev => {
      if (prev.includes(recordId)) {
        return prev.filter(id => id !== recordId);
      } else {
        return [...prev, recordId];
      }
    });
  };

  const handleSelectAllRecords = () => {
    if (selectedRecords.length === currentRegistros.length) {
      // Se todos os registros da página atual estão selecionados, desmarcar todos
      setSelectedRecords([]);
    } else {
      // Selecionar todos os registros da página atual
      const allRecordIds = currentRegistros.map(registro => registro.id);
      setSelectedRecords(allRecordIds);
    }
  };

  // Função para salvar as confirmações de saída no backend
  const saveExitConfirmations = async () => {
    if (selectedRecords.length === 0) {
      setError('Nenhum registro selecionado para confirmação de saída.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Enviar os IDs dos registros selecionados para o backend
      const response = await Axios.post('http://105.103.112.18:8080/confirmExit', {
        recordIds: selectedRecords
      });

      if (response.data.success) {
        setSuccess(`Saída confirmada para ${selectedRecords.length} registro(s).`);
        // Atualizar os registros localmente para refletir o status de confirmação
        setRegistros(prevRegistros => 
          prevRegistros.map(registro => 
            selectedRecords.includes(registro.id) 
              ? { ...registro, confirmed_exit: true } 
              : registro
          )
        );
        // Limpar a seleção após salvar
        setSelectedRecords([]);
        // Recarregar os registros para garantir que o status foi atualizado
        loadRegistros();
      } else {
        setError('Erro ao confirmar saída dos registros.');
      }
    } catch (err) {
      console.error('Erro ao salvar confirmações de saída:', err);
      setError('Erro ao confirmar saída dos registros. Verifique o console para mais detalhes.');
    } finally {
      setLoading(false);
    }
  };

  // Cabeçalhos da tabela (incluindo a nova coluna de seleção)
  const tableHeaders = [
    { id: 'number', label: 'Nº' },
    { id: 'select', label: 'Saída de Material' },
    { id: 'date', label: 'Data' },
    { id: 'line', label: 'Linha' },
    { id: 'prod_order', label: 'PO' },
    { id: 'model', label: 'Modelo' },
    { id: 'halb', label: 'Halb' },
    { id: 'plant', label: 'Plant' },
    { id: 'keep', label: 'Keep' },
    { id: 'plan_qty', label: 'Qty PO' },
    { id: 'qty', label: 'Qty Registrada' },
    { id: 'reel_id', label: 'Reel ID' },
    { id: 'barcode', label: 'Código de Barras' },
    { id: 'part_number', label: 'Part Number' },
    { id: 'shift', label: 'Turno' },
    { id: 'created_at', label: 'Data de Criação' }
  ];

  return (
    <>
       <Header/>
    <Box className="lista-entrada-wip-container" style={{ padding: '20px' }}>
      {/* Header */}
      <Box style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <Inventory2 style={{ fontSize: '2rem', marginRight: '10px' }} />
        <Typography variant="h4" component="h1">
          Lista de Entradas WIP
        </Typography>
      </Box>

      {/* Alertas */}
      {error && (
        <Alert severity="error" style={{ marginBottom: '20px' }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" style={{ marginBottom: '20px' }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Filtros */}
      <Paper style={{ padding: '15px', marginBottom: '20px' }}>
        <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <Typography variant="h6">Filtros</Typography>
          <Box>
            <Tooltip title="Exportar para Excel">
              <ExcelExportMaterial apiData={getExcelData()} fileName={getFileName()} />
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadRegistros}
              disabled={loading}
              size="small"
            >
              Atualizar
            </Button>
          </Box>
        </Box>
        
        <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', flex: 1 }}>
            <TextField
              label="Data"
              type="date"
              variant="outlined"
              size="small"
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              disabled={loading}
            />
            <TextField
              label="PO"
              variant="outlined"
              size="small"
              value={filters.prod_order}
              onChange={(e) => handleFilterChange('prod_order', e.target.value)}
              disabled={loading}
            />
            <TextField
              label="Reel ID"
              variant="outlined"
              size="small"
              value={filters.reel_id}
              onChange={(e) => handleFilterChange('reel_id', e.target.value)}
              disabled={loading}
            />
            <TextField
              label="Part Number"
              variant="outlined"
              size="small"
              value={filters.part_number}
              onChange={(e) => handleFilterChange('part_number', e.target.value)}
              disabled={loading}
            />
          </Box>
          
          <Box style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '10px' }}>
            <Button
              variant="outlined"
              startIcon={<Clear />}
              onClick={clearFilters}
              disabled={loading}
              size="small"
            >
              Limpar Filtros
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Botão para confirmar saída dos registros selecionados */}
      {selectedRecords.length > 0 && (
        <Box style={{ marginBottom: '20px' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={saveExitConfirmations}
            disabled={loading}
            style={{ marginRight: '10px' }}
          >
            Confirmar Saída ({selectedRecords.length} selecionados)
          </Button>
          <Button
            variant="outlined"
            onClick={() => setSelectedRecords([])}
            disabled={loading}
          >
            Cancelar Seleção
          </Button>
        </Box>
      )}

      {/* Loading */}
      {loading && (
        <Box style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
          <CircularProgress />
        </Box>
      )}

      {/* Tabela de Registros */}
      <TableContainer component={Paper} style={{ maxHeight: '600px' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow style={{ backgroundColor: '#f5f5f5' }}>
              {tableHeaders.map(header => (
                <TableCell
                  key={header.id}
                  style={{ 
                    fontWeight: 'bold', 
                    backgroundColor: '#f5f5f5',
                    padding: '8px 16px',
                    fontSize: '0.875rem'
                  }}
                >
                  {header.id === 'select' ? (
                    <Checkbox
                      checked={selectedRecords.length > 0 && selectedRecords.length === currentRegistros.length}
                      indeterminate={selectedRecords.length > 0 && selectedRecords.length < currentRegistros.length}
                      onChange={handleSelectAllRecords}
                      disabled={loading}
                    />
                  ) : (
                    header.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {currentRegistros.map((registro, index) => (
              <TableRow 
                key={registro.id} 
                style={{ 
                  backgroundColor: registro.id % 2 === 0 ? '#fafafa' : '#ffffff',
                  '&:hover': {
                    backgroundColor: '#f0f0f0'
                  }
                }}
              >
                <TableCell style={{ padding: '8px 16px', fontSize: '0.875rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  {indexOfFirstRegistro + index + 1}
                </TableCell>
                <TableCell style={{ padding: '8px 16px', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                  {registro.confirmed_exit ? (
                    <Chip 
                      label="Saída Confirmada" 
                      size="small" 
                      color="success" 
                      variant="outlined" 
                      style={{ fontSize: '0.7rem', height: '18px' }}
                    />
                  ) : (
                    <>
                      <Checkbox
                        checked={selectedRecords.includes(registro.id)}
                        onChange={() => handleSelectRecord(registro.id)}
                        disabled={loading}
                        size="small"
                        style={{ padding: 0, marginRight: '8px' }}
                      />
                      <Chip 
                        label="Pendente Saída" 
                        size="small" 
                        color="warning" 
                        variant="outlined" 
                        style={{ fontSize: '0.7rem', height: '18px' }}
                      />
                    </>
                  )}
                </TableCell>
                <TableCell style={{ padding: '8px 16px', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                  {registro.date ? new Date(registro.date).toLocaleDateString('pt-BR') : '-'}
                </TableCell>
                <TableCell style={{ padding: '8px 16px', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                  <Chip 
                    label={registro.line || '-'} 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                    style={{ fontSize: '0.75rem', height: '20px' }}
                  />
                </TableCell>
                <TableCell style={{ padding: '8px 16px', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                  {registro.prod_order || '-'}
                </TableCell>
                <TableCell style={{ padding: '8px 16px', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                  {registro.model || '-'}
                </TableCell>
                <TableCell style={{ padding: '8px 16px', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                  {registro.halb || '-'}
                </TableCell>
                <TableCell style={{ padding: '8px 16px', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                  {registro.plant || '-'}
                </TableCell>
                <TableCell style={{ padding: '8px 16px', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                  {registro.keep || '-'}
                </TableCell>
                <TableCell style={{ padding: '8px 16px', fontSize: '0.875rem', textAlign: 'right', whiteSpace: 'nowrap', fontWeight: 'bold', color: '#1976d2' }}>
                  {registro.plan_qty || '-'}
                </TableCell>
                <TableCell style={{ padding: '8px 16px', fontSize: '0.875rem', textAlign: 'right', whiteSpace: 'nowrap', fontWeight: 'bold', color: '#388e3c' }}>
                  {registro.qty || '-'}
                </TableCell>
                <TableCell style={{ padding: '8px 16px', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                  {registro.reel_id || '-'}
                </TableCell>
                <TableCell style={{ padding: '8px 16px', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                  {registro.barcode || '-'}
                </TableCell>
                <TableCell style={{ padding: '8px 16px', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                  {registro.part_number || '-'}
                </TableCell>
                <TableCell style={{ padding: '8px 16px', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                  <Chip 
                    label={registro.shift || '-'} 
                    size="small" 
                    color={registro.shift === '1T' ? 'primary' : registro.shift === '2T' ? 'secondary' : 'default'} 
                    variant="outlined" 
                    style={{ fontSize: '0.75rem', height: '20px' }}
                  />
                </TableCell>
                <TableCell style={{ padding: '8px 16px', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                  {registro.created_at ? new Date(registro.created_at).toLocaleString('pt-BR') : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginação */}
      <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px', gap: '20px' }}>
        <Box style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Typography variant="body2">Registros por página:</Typography>
          <select 
            value={registrosPerPage} 
            onChange={(e) => {
              setRegistrosPerPage(Number(e.target.value));
              setPage(1); // Resetar para a primeira página quando mudar o limite
            }}
            style={{ 
              padding: '5px', 
              borderRadius: '4px', 
              border: '1px solid #ccc',
              backgroundColor: 'white'
            }}
            disabled={loading}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </Box>
        
        <Stack spacing={2}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={handlePageChange} 
            color="primary" 
            showFirstButton 
            showLastButton 
          />
        </Stack>
      </Box>

      {/* Informações adicionais */}
      <Box style={{ marginTop: '20px', textAlign: 'center', color: '#666' }}>
        <Typography variant="body2">
          Total de registros: {filteredRegistros.length} | Página {page} de {totalPages}
        </Typography>
      </Box>
    </Box>
    </>
  );
}
