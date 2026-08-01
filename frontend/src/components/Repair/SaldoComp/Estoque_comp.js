import React, { useState, useEffect, useRef } from 'react';
import { Button, Form, Row, Col, ListGroup } from 'react-bootstrap';
import Axios from 'axios';
import Chart from 'react-apexcharts';
import { ExportToExcel } from '../../Excel/Excel_Export';
import * as FileSaver from "file-saver";
import * as XLSX from "xlsx";
import { Input, InputNumber, Card, Table as AntTable, Space, Tag, Popconfirm, message, Tooltip, Divider, Tabs } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, SaveOutlined, CloseOutlined, WarningOutlined, ShoppingCartOutlined, ThunderboltOutlined, ExpandOutlined, ShrinkOutlined, DownloadOutlined } from '@ant-design/icons';
import Header from '../../Layout/MGSPHead/Header';

const exportExcel = (apiData, fileName) => {
  const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
  const fileExtension = ".xlsx";
  const ws = XLSX.utils.json_to_sheet(apiData);
  const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const data = new Blob([excelBuffer], { type: fileType });
  const link = document.createElement('a');
  const url = URL.createObjectURL(data);
  link.href = url;
  link.download = fileName + fileExtension;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

const AutocompleteComponent = ({ value, onChange, onSelect, name, required, placeholder, searchType = 'component' }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const getApiConfig = (searchValue) => {
    if (searchType === 'colaborador') {
      return { url: 'http://105.103.39.102:8080/searchPessoas', params: { searchTerm: searchValue } };
    }
    return { url: 'http://105.103.39.102:8080/searchComponentCodes', params: { searchTerm: searchValue } };
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!value || value.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
      setLoading(true);
      try {
        const apiConfig = getApiConfig(value);
        const response = await Axios.get(apiConfig.url, { params: apiConfig.params });
        const results = Array.isArray(response.data) ? response.data : [];
        if (searchType === 'colaborador') {
          setSuggestions(results); setShowSuggestions(results.length > 0);
        } else {
          const uniqueResults = results.filter((item, index, self) => index === self.findIndex((t) => t.material === item.material));
          setSuggestions(uniqueResults); setShowSuggestions(uniqueResults.length > 0);
        }
      } catch (error) {
        setSuggestions([]); setShowSuggestions(false);
      } finally { setLoading(false); }
    };
    const delayDebounceFn = setTimeout(() => { fetchSuggestions(); }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [value, searchType]);

  const handleInputChange = (e) => {
    onChange(e);
    setHighlightedIndex(-1);
    if (!e.target.value) { setSuggestions([]); setShowSuggestions(false); }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : suggestions.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        handleSuggestionClick(suggestions[highlightedIndex]);
      } else if (suggestions.length > 0) {
        handleSuggestionClick(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  useEffect(() => {
    if (highlightedIndex >= 0 && suggestionsRef.current) {
      const items = suggestionsRef.current.children;
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target) && suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  const handleSuggestionClick = (suggestion) => {
    let event;
    if (searchType === 'colaborador') { event = { target: { name, value: suggestion.funcionarios } }; }
    else { event = { target: { name, value: suggestion.material } }; }
    onChange(event); onSelect && onSelect(suggestion); setShowSuggestions(false); setSuggestions([]);
    if (inputRef.current) inputRef.current.focus();
  };

  const renderSuggestion = (suggestion) => {
    if (searchType === 'colaborador') {
      return (<div><strong>{suggestion.funcionarios}</strong><span style={{ marginLeft: 10, color: '#666', fontSize: '0.85em' }}>{suggestion.matricula}</span></div>);
    }
    return <div><strong>{suggestion.material}</strong></div>;
  };

  const getSuggestionKey = (suggestion) => searchType === 'colaborador' ? suggestion.id : suggestion.material;

  return (
    <div style={{ position: 'relative' }}>
      <Form.Control ref={inputRef} type="text" name={name} value={value} onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
        required={required} placeholder={placeholder} />
      {showSuggestions && (
        <ListGroup ref={suggestionsRef} style={{ position: 'absolute', zIndex: 9999, width: '100%', maxHeight: '200px', overflowY: 'auto', marginTop: '5px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '4px', backgroundColor: 'white', border: '1px solid #ccc', top: '100%', left: 0 }}>
          {suggestions.map((suggestion, index) => (
            <ListGroup.Item key={getSuggestionKey(suggestion)} onClick={() => handleSuggestionClick(suggestion)} action style={{ cursor: 'pointer', padding: '10px 15px', backgroundColor: index === highlightedIndex ? '#e6f7ff' : 'white', borderLeft: index === highlightedIndex ? '3px solid #1890ff' : '3px solid transparent' }}>
              {renderSuggestion(suggestion)}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
      {loading && <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#131d25' }}>...</div>}
    </div>
  );
};

function EstoqueComp() {
  const [estoque, setEstoque] = useState([]);
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [componentDescriptions, setComponentDescriptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState({ codigo: '', quantidade: 1, valorComponente: '', descricao: '', quantidadeEstoque: '' });
  const [selectedColaborador, setSelectedColaborador] = useState('');
  const [colaboradorDetails, setColaboradorDetails] = useState(null);
  const [itensEntrada, setItensEntrada] = useState([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [estoquePage, setEstoquePage] = useState(1);
  const [expandedTable, setExpandedTable] = useState(null);
  const itemsPerPage = 10;

  const fetchComponentDescriptions = async (componentCodes) => {
    try {
      const uniqueCodes = [...new Set(componentCodes)];
      const descriptions = {};
      for (const code of uniqueCodes) {
        try {
          const response = await Axios.get('http://105.103.39.102:8080/searchComponentCodes', { params: { searchTerm: code } });
          if (response.data && response.data.length > 0) {
            const exactMatch = response.data.find(item => item.material === code);
            descriptions[code] = exactMatch ? exactMatch.mat_name || '-' : '-';
          } else { descriptions[code] = '-'; }
        } catch (error) { descriptions[code] = '-'; }
      }
      setComponentDescriptions(descriptions);
    } catch (error) { console.error('Error fetching component descriptions:', error); }
  };

  const fetchLogs = () => {
    setLoading(true);
    Axios.get('http://105.103.39.102:8080/getReparoComponentesLogs')
      .then((response) => { setLogs(response.data); setFilteredLogs(response.data); setLoading(false); })
      .catch(error => { console.error("Erro ao buscar logs:", error); setLoading(false); });
  };

  const fetchEstoque = () => {
    Axios.get('http://105.103.39.102:8080/getReparoCompEstoque')
      .then((response) => { setEstoque(response.data); fetchComponentDescriptions(response.data.map(item => item.cod_comp)); })
      .catch(error => { console.error("Erro ao buscar dados do estoque:", error); });
  };

  useEffect(() => { fetchLogs(); fetchEstoque(); }, []);
  useEffect(() => { if (estoque.length > 0) fetchComponentDescriptions(estoque.map(item => item.cod_comp)); }, [estoque]);

  const filterLogsByDate = () => {
    if (!startDate && !endDate) { setFilteredLogs(logs); return; }
    if (!logs || logs.length === 0) { setFilteredLogs([]); return; }
    const filtered = logs.filter(log => {
      const logDate = new Date(log.created_at);
      let start = null, end = null;
      if (startDate) { const [y, m, d] = startDate.split('-').map(Number); start = new Date(y, m - 1, d); }
      if (endDate) { const [y, m, d] = endDate.split('-').map(Number); end = new Date(y, m - 1, d, 23, 59, 59, 999); }
      const logDateOnly = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());
      if (start && end) return logDateOnly >= start && logDateOnly <= end;
      if (start) return logDateOnly >= start;
      if (end) return logDateOnly <= new Date(end.getFullYear(), end.getMonth(), end.getDate());
      return true;
    });
    setFilteredLogs(filtered);
  };
  useEffect(() => { filterLogsByDate(); }, [startDate, endDate, logs]);

  const handleCodigoChange = (e) => { const { name, value } = e.target; setSelectedComponent({ ...selectedComponent, [name]: value }); };
  const handleComponentSelect = (suggestion) => { setSelectedComponent({ codigo: suggestion.material, valorComponente: suggestion.price_decimal, descricao: suggestion.mat_name || '', quantidadeEstoque: suggestion.qty || 0, quantidade: '' }); };
  const handleColaboradorChange = (e) => { setSelectedColaborador(e.target.value); if (!e.target.value) setColaboradorDetails(null); };
  const handleColaboradorSelect = (suggestion) => { setColaboradorDetails(suggestion); };

  const handleAddEntrada = (e) => {
    e.preventDefault();
    if (!selectedColaborador) { message.warning('Selecione um colaborador!'); return; }
    if (selectedComponent.codigo && selectedComponent.valorComponente) {
      if (itensEntrada.some(item => item.codigo === selectedComponent.codigo)) { message.warning('Componente ja adicionado na lista!'); return; }
      const quantidade = selectedComponent.quantidade && selectedComponent.quantidade > 0 ? parseInt(selectedComponent.quantidade) : 1;
      const now = new Date();
      const dataFormatada = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
      setItensEntrada([...itensEntrada, { id: Date.now(), ...selectedComponent, quantidade, data: dataFormatada, colaborador: selectedColaborador || '', matricula: colaboradorDetails ? colaboradorDetails.matricula : '' }]);
      setSelectedComponent({ codigo: '', quantidade: 1, valorComponente: '', descricao: '', quantidadeEstoque: '' });
      message.success('Componente adicionado a lista!');
    } else { message.warning('Selecione um componente!'); }
  };

  const handleAddScrap = (e) => {
    e.preventDefault();
    if (!selectedColaborador) { message.warning('Selecione um colaborador!'); return; }
    if (selectedComponent.codigo && selectedComponent.valorComponente) {
      const quantidade = selectedComponent.quantidade && selectedComponent.quantidade > 0 ? parseInt(selectedComponent.quantidade) : 1;
      Axios.post('http://105.103.39.102:8080/ReparoDiminuiEstoque', { cod_comp: selectedComponent.codigo, qty: quantidade, colaborador: selectedColaborador || '', matricula: colaboradorDetails ? colaboradorDetails.matricula : '' })
        .then((response) => {
          if (response.data.success) { message.success('SCRAP registrado com sucesso!'); fetchEstoque(); fetchLogs(); setSelectedComponent({ codigo: '', quantidade: 1, valorComponente: '', descricao: '', quantidadeEstoque: '' }); }
          else { message.error('Quantidade de descarte maior que a disponivel no estoque!'); }
        })
        .catch(error => { console.error("Erro ao diminuir quantidade no estoque:", error); message.error('Erro ao processar SCRAP!'); });
    } else { message.warning('Selecione um componente!'); }
  };

  const handleRemoveEntrada = (id) => { setItensEntrada(itensEntrada.filter(item => item.id !== id)); };

  const handleSubmitEntrada = () => {
    if (itensEntrada.length === 0) { message.warning('Adicione pelo menos um item!'); return; }
    Axios.post('http://105.103.39.102:8080/ReparoEntradaComponentes', itensEntrada.map(item => ({ codigo: item.codigo, quantidade: item.quantidade, valor_componente: item.valorComponente, descricao: item.descricao, data: item.data, colaborador: item.colaborador || '', matricula: item.matricula || '' })))
      .then((response) => { if (response.data.success) { message.success('Entrada registrada com sucesso!'); setItensEntrada([]); fetchEstoque(); fetchLogs(); } else { message.error('Erro ao registrar Entrada!'); } })
      .catch(error => { console.error("Erro ao enviar dados de Entrada:", error); message.error('Erro ao processar Entrada!'); });
  };

  const calculateMetrics = () => {
    const metrics = { totalEntries: 0, totalScraps: 0, totalValue: 0 };
    filteredLogs.forEach(log => {
      const quantity = parseFloat(log.quantity) || 0;
      const totalValue = parseFloat(log.total_value) || 0;
      if (log.action_type === 'ENTRADA') { metrics.totalEntries += quantity; metrics.totalValue += totalValue; }
      else if (log.action_type === 'SCRAP') { metrics.totalScraps += quantity; metrics.totalValue += totalValue; }
    });
    return metrics;
  };
  const metrics = calculateMetrics();

  const getEstoqueExcelData = () => estoque.filter(item => item.cod_comp.toLowerCase().includes(searchTerm.toLowerCase())).map(item => ({ 'Codigo': item.cod_comp, 'Descricao': componentDescriptions[item.cod_comp] || '-', 'Qtd': item.qty, 'Valor': item.valor }));

  const logsEntrada = filteredLogs.filter(log => log.action_type === 'ENTRADA');
  const logsScrap = filteredLogs.filter(log => log.action_type === 'SCRAP');

  const tabItems = [
    {
      key: 'registro',
      label: <span><EditOutlined style={{ marginRight: 6 }} />Registro</span>,
      children: (
        <div style={{ display: 'flex', gap: 16, minHeight: '70vh' }}>
          <div style={{ flex: 0.38, minWidth: 0 }}>
            <Card title={<span style={{ fontSize: 16, fontWeight: 600 }}><ShoppingCartOutlined style={{ marginRight: 8 }} />Registro de Componentes</span>} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} styles={{ body: { padding: '20px 24px' } }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div><label style={{ fontWeight: 500, marginBottom: 4, display: 'block', fontSize: 13, color: '#555' }}>Codigo do Componente</label><AutocompleteComponent name="codigo" value={selectedComponent.codigo} onChange={handleCodigoChange} onSelect={handleComponentSelect} placeholder="Buscar componente..." /></div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}><label style={{ fontWeight: 500, marginBottom: 4, display: 'block', fontSize: 13, color: '#555' }}>Quantidade</label><InputNumber min={1} value={selectedComponent.quantidade || ''} onChange={(val) => setSelectedComponent({ ...selectedComponent, quantidade: val || 1 })} style={{ width: '100%' }} placeholder="1" /></div>
                  <div style={{ flex: 1 }}><label style={{ fontWeight: 500, marginBottom: 4, display: 'block', fontSize: 13, color: '#555' }}>Valor (un)</label><Input value={selectedComponent.valorComponente} readOnly style={{ backgroundColor: '#f5f5f5', color: '#333' }} /></div>
                  <div style={{ flex: 1 }}><label style={{ fontWeight: 500, marginBottom: 4, display: 'block', fontSize: 13, color: '#555' }}>Saldo (Qty)</label><Input value={selectedComponent.quantidadeEstoque} readOnly style={{ backgroundColor: '#f5f5f5', color: '#333' }} /></div>
                </div>
                <div><label style={{ fontWeight: 500, marginBottom: 4, display: 'block', fontSize: 13, color: '#555' }}>Descricao</label><Input value={selectedComponent.descricao} readOnly style={{ backgroundColor: '#f5f5f5', color: '#333' }} /></div>
                <Divider style={{ margin: '8px 0' }} />
                <div><label style={{ fontWeight: 500, marginBottom: 4, display: 'block', fontSize: 13, color: '#555' }}>Colaborador</label><AutocompleteComponent name="colaborador" value={selectedColaborador} onChange={handleColaboradorChange} onSelect={handleColaboradorSelect} placeholder="Buscar colaborador..." searchType="colaborador" /></div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}><label style={{ fontWeight: 500, marginBottom: 4, display: 'block', fontSize: 13, color: '#555' }}>Matricula</label><Input value={colaboradorDetails ? colaboradorDetails.matricula : ''} readOnly placeholder="-" style={{ backgroundColor: '#f5f5f5', color: '#333' }} /></div>
                  <div style={{ flex: 1 }}><label style={{ fontWeight: 500, marginBottom: 4, display: 'block', fontSize: 13, color: '#555' }}>Departamento</label><Input value={colaboradorDetails ? colaboradorDetails.departamento : ''} readOnly placeholder="-" style={{ backgroundColor: '#f5f5f5', color: '#333' }} /></div>
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleAddEntrada} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #52c41a, #389e0d)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><PlusOutlined /> Entrada</button>
                  <Popconfirm title="Confirmar SCRAP?" onConfirm={handleAddScrap} okText="Sim" cancelText="Nao" icon={<WarningOutlined style={{ color: '#faad14' }} />}>
                    <button style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #ff4d4f, #cf1322)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><ThunderboltOutlined /> Scrap</button>
                  </Popconfirm>
                </div>
              </div>
            </Card>
          </div>
          <div style={{ flex: 0.62, minWidth: 0 }}>
            <Card title={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 16, fontWeight: 600 }}><EditOutlined style={{ marginRight: 8 }} />Registro - Pre Visualizacao</span><Tag color="green" style={{ fontSize: 15, padding: '4px 14px', fontWeight: 700, borderRadius: 6 }}>R$ {itensEntrada.reduce((t, i) => t + ((parseFloat(i.quantidade) || 0) * (parseFloat(i.valorComponente) || 0)), 0).toFixed(2)}</Tag></div>} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} styles={{ body: { padding: '12px 16px' } }}>
              <AntTable dataSource={itensEntrada} rowKey="id" size="small" pagination={false} scroll={{ y: 380 }} locale={{ emptyText: 'Nenhum item adicionado ainda.' }} columns={[
                { title: 'Codigo', dataIndex: 'codigo', key: 'codigo', width: 120, render: (t) => <Tag color="geekblue">{t}</Tag> },
                { title: 'Qtd', dataIndex: 'quantidade', key: 'quantidade', width: 60, align: 'center' },
                { title: 'Val Un', dataIndex: 'valorComponente', key: 'valorComponente', width: 80, render: (v) => 'R$ ' + v },
                { title: 'Val Total', key: 'total', width: 100, render: (_, r) => <Tag color="green" style={{ fontWeight: 700, fontSize: 12, borderRadius: 4 }}>R$ {(parseFloat(r.quantidade) * parseFloat(r.valorComponente)).toFixed(2)}</Tag> },
                { title: 'Colaborador', dataIndex: 'colaborador', key: 'colaborador', width: 110, render: (t) => t || '-' },
                { title: 'Acoes', key: 'acoes', width: 80, align: 'center', render: (_, record) => (<Space size={4}><Tooltip title="Editar quantidade"><button onClick={() => { const newQtd = window.prompt('Nova quantidade:', record.quantidade); if (newQtd && parseInt(newQtd) > 0) { setItensEntrada(itensEntrada.map(i => i.id === record.id ? { ...i, quantidade: parseInt(newQtd) } : i)); } }} style={{ border: 'none', background: '#e6f7ff', color: '#1890ff', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}><EditOutlined /></button></Tooltip><Tooltip title="Remover"><button onClick={() => handleRemoveEntrada(record.id)} style={{ border: 'none', background: '#fff1f0', color: '#ff4d4f', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}><DeleteOutlined /></button></Tooltip></Space>) }
              ]} />
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <button onClick={handleSubmitEntrada} disabled={itensEntrada.length === 0} style={{ padding: '10px 32px', borderRadius: 8, border: 'none', background: itensEntrada.length > 0 ? 'linear-gradient(135deg, #722ed1, #531dab)' : '#d9d9d9', color: itensEntrada.length > 0 ? '#fff' : '#999', fontWeight: 600, fontSize: 14, cursor: itensEntrada.length > 0 ? 'pointer' : 'not-allowed' }}><SaveOutlined style={{ marginRight: 6 }} />Registrar Entrada</button>
              </div>
            </Card>
          </div>
        </div>
      )
    },
    {
      key: 'historico',
      label: <span><PlusOutlined style={{ marginRight: 6 }} />Historico</span>,
      children: (
        <div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 16, padding: '12px 16px', background: '#fafafa', borderRadius: 8, border: '1px solid #e8e8e8' }}>
            <div><label style={{ fontWeight: 500, marginBottom: 4, display: 'block', fontSize: 13, color: '#555' }}>Data Inicial</label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: 160 }} /></div>
            <div><label style={{ fontWeight: 500, marginBottom: 4, display: 'block', fontSize: 13, color: '#555' }}>Data Final</label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: 160 }} /></div>
            <div><label style={{ fontWeight: 500, marginBottom: 4, display: 'block', fontSize: 13, color: '#555' }}>Buscar Codigo</label><Input placeholder="Filtrar componente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: 200 }} allowClear /></div>
            <button onClick={() => { const t = new Date().toISOString().split('T')[0]; setStartDate(t); setEndDate(t); setSearchTerm(''); }} style={{ padding: '5px 16px', borderRadius: 6, border: '1px solid #d9d9d9', background: '#fff', color: '#555', fontWeight: 500, cursor: 'pointer', height: 32 }}>Limpar</button>
          </div>
          <div style={{ display: 'flex', gap: 16, minHeight: '65vh' }}>
            <div style={{ flex: 1, minWidth: 0, display: expandedTable === 'scrap' ? 'none' : 'block' }}>
              <Card title={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 15, fontWeight: 600, color: '#389e0d' }}><PlusOutlined style={{ marginRight: 6 }} />Historico de Entrada</span><Space><Tag color="green" style={{ fontWeight: 600 }}>{logsEntrada.filter(l => l.component_code.toLowerCase().includes(searchTerm.toLowerCase())).length} registros</Tag><Tooltip title="Exportar Excel"><button onClick={() => exportExcel(logsEntrada.filter(l => l.component_code.toLowerCase().includes(searchTerm.toLowerCase())).map(l => ({ 'Data/Hora': new Date(l.created_at).toLocaleString('pt-BR'), 'Codigo': l.component_code, 'Qtd': l.quantity, 'Qtd Ant': l.previous_quantity || '-', 'Qtd Nova': l.new_quantity || '-', 'Val Un': l.unit_value || '-', 'Val Total': l.total_value || '-', 'Desc': l.operation_description || '-' })), 'hist_entrada_' + new Date().toISOString().slice(0, 10))} style={{ border: 'none', background: '#f6ffed', color: '#52c41a', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center' }}><DownloadOutlined /></button></Tooltip><Tooltip title={expandedTable === 'entrada' ? 'Restaurar' : 'Maximizar'}><button onClick={() => setExpandedTable(expandedTable === 'entrada' ? null : 'entrada')} style={{ border: 'none', background: expandedTable === 'entrada' ? '#fff1f0' : '#e6f7ff', color: expandedTable === 'entrada' ? '#ff4d4f' : '#1890ff', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center' }}>{expandedTable === 'entrada' ? <ShrinkOutlined /> : <ExpandOutlined />}</button></Tooltip></Space></div>} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '3px solid #52c41a' }} styles={{ body: { padding: '8px 12px' } }}>
                <AntTable dataSource={logsEntrada.filter(l => l.component_code.toLowerCase().includes(searchTerm.toLowerCase()))} rowKey="id" size="small" pagination={{ pageSize: itemsPerPage, size: 'small', showSizeChanger: false }} scroll={{ y: expandedTable === 'entrada' ? 520 : 420 }} locale={{ emptyText: 'Nenhum registro de entrada.' }} columns={[
                  { title: 'Data', key: 'data', width: 90, render: (_, r) => new Date(r.created_at).toLocaleDateString('pt-BR') },
                  { title: 'Hora', key: 'hora', width: 70, render: (_, r) => new Date(r.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) },
                  { title: 'Codigo', dataIndex: 'component_code', key: 'component_code', width: 110, render: (t) => <Tag color="geekblue">{t}</Tag> },
                  { title: 'Qtd', dataIndex: 'quantity', key: 'quantity', width: 55, align: 'center' },
                  { title: 'Val Total', key: 'total', width: 90, render: (_, r) => <Tag color="green" style={{ fontWeight: 700, fontSize: 11, borderRadius: 4 }}>R$ {r.total_value || '-'}</Tag> },
                  { title: 'Desc', dataIndex: 'operation_description', key: 'operation_description', width: 100, ellipsis: true, render: (t) => t || '-' }
                ]} />
              </Card>
            </div>
            <div style={{ flex: 1, minWidth: 0, display: expandedTable === 'entrada' ? 'none' : 'block' }}>
              <Card title={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 15, fontWeight: 600, color: '#cf1322' }}><ThunderboltOutlined style={{ marginRight: 6 }} />Historico de Scrap</span><Space><Tag color="red" style={{ fontWeight: 600 }}>{logsScrap.filter(l => l.component_code.toLowerCase().includes(searchTerm.toLowerCase())).length} registros</Tag><Tooltip title="Exportar Excel"><button onClick={() => exportExcel(logsScrap.filter(l => l.component_code.toLowerCase().includes(searchTerm.toLowerCase())).map(l => ({ 'Data/Hora': new Date(l.created_at).toLocaleString('pt-BR'), 'Codigo': l.component_code, 'Qtd': l.quantity, 'Qtd Ant': l.previous_quantity || '-', 'Qtd Nova': l.new_quantity || '-', 'Val Un': l.unit_value || '-', 'Val Total': l.total_value || '-', 'Desc': l.operation_description || '-' })), 'hist_scrap_' + new Date().toISOString().slice(0, 10))} style={{ border: 'none', background: '#fff1f0', color: '#ff4d4f', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center' }}><DownloadOutlined /></button></Tooltip><Tooltip title={expandedTable === 'scrap' ? 'Restaurar' : 'Maximizar'}><button onClick={() => setExpandedTable(expandedTable === 'scrap' ? null : 'scrap')} style={{ border: 'none', background: expandedTable === 'scrap' ? '#fff1f0' : '#e6f7ff', color: expandedTable === 'scrap' ? '#ff4d4f' : '#1890ff', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center' }}>{expandedTable === 'scrap' ? <ShrinkOutlined /> : <ExpandOutlined />}</button></Tooltip></Space></div>} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '3px solid #ff4d4f' }} styles={{ body: { padding: '8px 12px' } }}>
                <AntTable dataSource={logsScrap.filter(l => l.component_code.toLowerCase().includes(searchTerm.toLowerCase()))} rowKey="id" size="small" pagination={{ pageSize: itemsPerPage, size: 'small', showSizeChanger: false }} scroll={{ y: expandedTable === 'scrap' ? 520 : 420 }} locale={{ emptyText: 'Nenhum registro de scrap.' }} columns={[
                  { title: 'Data', key: 'data', width: 90, render: (_, r) => new Date(r.created_at).toLocaleDateString('pt-BR') },
                  { title: 'Hora', key: 'hora', width: 70, render: (_, r) => new Date(r.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) },
                  { title: 'Codigo', dataIndex: 'component_code', key: 'component_code', width: 110, render: (t) => <Tag color="volcano">{t}</Tag> },
                  { title: 'Qtd', dataIndex: 'quantity', key: 'quantity', width: 55, align: 'center' },
                  { title: 'Val Total', key: 'total', width: 90, render: (_, r) => <Tag color="red" style={{ fontWeight: 700, fontSize: 11, borderRadius: 4 }}>R$ {r.total_value || '-'}</Tag> },
                  { title: 'Desc', dataIndex: 'operation_description', key: 'operation_description', width: 100, ellipsis: true, render: (t) => t || '-' }
                ]} />
              </Card>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'dashboard',
      label: <span><ShoppingCartOutlined style={{ marginRight: 6 }} />Dashboard</span>,
      children: (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
            <Card style={{ flex: 1, borderRadius: 10, borderTop: '3px solid #52c41a' }} styles={{ body: { padding: '16px 20px' } }}><div style={{ fontSize: 13, color: '#888', fontWeight: 500 }}>Total em Estoque</div><div style={{ fontSize: 28, fontWeight: 700, color: '#389e0d' }}>{estoque.reduce((t, i) => t + (parseFloat(i.qty) || 0), 0).toLocaleString('pt-BR')}</div><div style={{ fontSize: 12, color: '#999' }}>componentes</div></Card>
            <Card style={{ flex: 1, borderRadius: 10, borderTop: '3px solid #1890ff' }} styles={{ body: { padding: '16px 20px' } }}><div style={{ fontSize: 13, color: '#888', fontWeight: 500 }}>Valor Total Estoque</div><div style={{ fontSize: 28, fontWeight: 700, color: '#1890ff' }}>R$ {estoque.reduce((t, i) => t + (parseFloat(i.valor) || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div><div style={{ fontSize: 12, color: '#999' }}>em estoque</div></Card>
            <Card style={{ flex: 1, borderRadius: 10, borderTop: '3px solid #ff4d4f' }} styles={{ body: { padding: '16px 20px' } }}><div style={{ fontSize: 13, color: '#888', fontWeight: 500 }}>Scrap (Periodo)</div><div style={{ fontSize: 28, fontWeight: 700, color: '#cf1322' }}>{metrics.totalScraps.toLocaleString('pt-BR')}</div><div style={{ fontSize: 12, color: '#999' }}>unidades</div></Card>
            <Card style={{ flex: 1, borderRadius: 10, borderTop: '3px solid #faad14' }} styles={{ body: { padding: '16px 20px' } }}><div style={{ fontSize: 13, color: '#888', fontWeight: 500 }}>Entrada (Periodo)</div><div style={{ fontSize: 28, fontWeight: 700, color: '#d48806' }}>{metrics.totalEntries.toLocaleString('pt-BR')}</div><div style={{ fontSize: 12, color: '#999' }}>unidades</div></Card>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 16, padding: '12px 16px', background: '#fafafa', borderRadius: 8, border: '1px solid #e8e8e8' }}>
            <div><label style={{ fontWeight: 500, marginBottom: 4, display: 'block', fontSize: 13, color: '#555' }}>Data Inicial</label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: 160 }} /></div>
            <div><label style={{ fontWeight: 500, marginBottom: 4, display: 'block', fontSize: 13, color: '#555' }}>Data Final</label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: 160 }} /></div>
            <button onClick={() => { const t = new Date().toISOString().split('T')[0]; setStartDate(t); setEndDate(t); }} style={{ padding: '5px 16px', borderRadius: 6, border: '1px solid #d9d9d9', background: '#fff', color: '#555', fontWeight: 500, cursor: 'pointer', height: 32 }}>Limpar</button>
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1 }}><Card style={{ borderRadius: 10 }} styles={{ body: { padding: '8px 12px' } }}><Chart options={{ chart: { type: 'area', toolbar: { show: false } }, stroke: { curve: 'smooth', width: 2 }, fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.6, opacityTo: 0.05, stops: [0, 100] } }, dataLabels: { enabled: true, formatter: (val) => 'R$ ' + parseFloat(val).toFixed(2), style: { fontSize: '10px' } }, xaxis: { categories: estoque.sort((a, b) => parseFloat(b.valor) - parseFloat(a.valor)).slice(0, 15).map(i => i.cod_comp), labels: { rotate: -45, style: { fontSize: '10px' } } }, yaxis: { labels: { formatter: (val) => 'R$ ' + val.toFixed(0) } }, title: { text: 'Valor por Componente', align: 'center', style: { fontSize: '14px', fontWeight: 600 } }, colors: ['#1890ff'], grid: { borderColor: '#f0f0f0' } }} series={[{ name: 'Valor', data: estoque.sort((a, b) => parseFloat(b.valor) - parseFloat(a.valor)).slice(0, 15).map(item => parseFloat(item.valor)) }]} type="area" height={320} /></Card></div>
            <div style={{ flex: 1 }}><Card style={{ borderRadius: 10 }} styles={{ body: { padding: '8px 12px' } }}><Chart options={{ chart: { type: 'bar', toolbar: { show: false } }, plotOptions: { bar: { borderRadius: 4, columnWidth: '60%', distributed: true } }, dataLabels: { enabled: true, formatter: (val) => val.toLocaleString('pt-BR'), style: { fontSize: '10px' } }, xaxis: { categories: estoque.sort((a, b) => parseFloat(b.qty) - parseFloat(a.qty)).slice(0, 15).map(i => i.cod_comp), labels: { rotate: -45, style: { fontSize: '10px' } } }, title: { text: 'Quantidade por Componente', align: 'center', style: { fontSize: '14px', fontWeight: 600 } }, colors: ['#52c41a'], legend: { show: false }, grid: { borderColor: '#f0f0f0' } }} series={[{ name: 'Qtd', data: estoque.sort((a, b) => parseFloat(b.qty) - parseFloat(a.qty)).slice(0, 15).map(item => parseFloat(item.qty)) }]} type="bar" height={320} /></Card></div>
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1 }}><Card style={{ borderRadius: 10 }} styles={{ body: { padding: '8px 12px' } }}><Chart options={{ chart: { type: 'bar', toolbar: { show: false } }, plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } }, dataLabels: { enabled: true, formatter: (val) => val.toLocaleString('pt-BR'), style: { fontSize: '10px' } }, xaxis: { categories: (() => { const c = {}; filteredLogs.forEach(l => { c[l.component_code] = (c[l.component_code] || 0) + (parseFloat(l.quantity) || 0); }); return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 10).map(e => e[0]); })(), labels: { rotate: -45, style: { fontSize: '10px' } } }, title: { text: 'Movimentacoes por Componente', align: 'center', style: { fontSize: '14px', fontWeight: 600 } }, colors: ['#52c41a', '#ff4d4f'], grid: { borderColor: '#f0f0f0' } }} series={[{ name: 'Entrada', data: (() => { const c = {}; filteredLogs.filter(l => l.action_type === 'ENTRADA').forEach(l => { c[l.component_code] = (c[l.component_code] || 0) + (parseFloat(l.quantity) || 0); }); return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 10).map(e => e[1]); })() }, { name: 'Scrap', data: (() => { const c = {}; filteredLogs.filter(l => l.action_type === 'SCRAP').forEach(l => { c[l.component_code] = (c[l.component_code] || 0) + (parseFloat(l.quantity) || 0); }); return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 10).map(e => e[1]); })() }]} type="bar" height={300} /></Card></div>
            <div style={{ flex: 1 }}><Card style={{ borderRadius: 10 }} styles={{ body: { padding: '8px 12px' } }}><Chart options={{ chart: { type: 'bar', toolbar: { show: false } }, plotOptions: { bar: { borderRadius: 4, columnWidth: '60%', distributed: true } }, dataLabels: { enabled: true, formatter: (val) => val.toLocaleString('pt-BR'), style: { fontSize: '10px' } }, xaxis: { categories: (() => { const c = {}; filteredLogs.filter(l => l.action_type === 'SCRAP').forEach(l => { c[l.component_code] = (c[l.component_code] || 0) + (parseFloat(l.quantity) || 0); }); return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 10).map(e => e[0]); })(), labels: { rotate: -45, style: { fontSize: '10px' } } }, title: { text: 'Worst Scrap (Qty)', align: 'center', style: { fontSize: '14px', fontWeight: 600 } }, colors: ['#ff4d4f'], legend: { show: false }, grid: { borderColor: '#f0f0f0' } }} series={[{ name: 'Scrap', data: (() => { const c = {}; filteredLogs.filter(l => l.action_type === 'SCRAP').forEach(l => { c[l.component_code] = (c[l.component_code] || 0) + (parseFloat(l.quantity) || 0); }); return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 10).map(e => e[1]); })() }]} type="bar" height={300} /></Card></div>
          </div>
          <Card title={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 15, fontWeight: 600 }}>Estoque de Componentes</span><Space><Input placeholder="Buscar componente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: 200 }} allowClear /><Tooltip title="Exportar Excel"><button onClick={() => exportExcel(getEstoqueExcelData(), 'estoque_componentes_' + new Date().toISOString().slice(0, 10))} style={{ border: 'none', background: '#e6f7ff', color: '#1890ff', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center' }}><DownloadOutlined /></button></Tooltip></Space></div>} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} styles={{ body: { padding: '8px 12px' } }}>
            <AntTable dataSource={estoque.filter(item => item.cod_comp.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => parseFloat(b.qty) - parseFloat(a.qty))} rowKey="id" size="small" pagination={{ pageSize: itemsPerPage, size: 'small', showSizeChanger: false }} scroll={{ y: 350 }} locale={{ emptyText: 'Nenhum componente em estoque.' }} columns={[
              { title: 'Codigo', dataIndex: 'cod_comp', key: 'cod_comp', width: 130, render: (t) => <Tag color="geekblue">{t}</Tag> },
              { title: 'Descricao', key: 'desc', width: 200, render: (_, r) => componentDescriptions[r.cod_comp] || '-' },
              { title: 'Qtd', dataIndex: 'qty', key: 'qty', width: 80, align: 'center', render: (v) => <Tag color="blue" style={{ fontWeight: 600 }}>{parseInt(v).toLocaleString('pt-BR')}</Tag> },
              { title: 'Valor Total', dataIndex: 'valor', key: 'valor', width: 120, align: 'right', render: (v) => <Tag color="green" style={{ fontWeight: 700, fontSize: 12, borderRadius: 4 }}>R$ {parseFloat(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Tag> },
              { title: 'Ultima Mov.', key: 'last', width: 100, render: (_, r) => { const cl = logs.filter(l => l.component_code === r.cod_comp); if (!cl.length) return '-'; cl.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); return new Date(cl[0].created_at).toLocaleDateString('pt-BR'); } }
            ]} />
          </Card>
        </div>
      )
    }
  ];

  return (
    <div>
      <Header />
      <div style={{ padding: 10, marginTop: 0 }}>
        <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', borderRadius: 12, padding: '16px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
          <ShoppingCartOutlined style={{ fontSize: 28, color: '#52c41a' }} />
          <h2 style={{ margin: 0, color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: '0.5px' }}>Controle de Componentes - Reparo</h2>
        </div>
        <Tabs defaultActiveKey="registro" type="card" style={{ marginBottom: 16 }} onChange={(key) => { if (key === 'historico') { fetchLogs(); } }} items={tabItems} />
      </div>
    </div>
  );
}

export default EstoqueComp;
