import React, { useState, useEffect, useRef, useImperativeHandle, useMemo } from 'react';
import Axios from 'axios';
import {
  Layout, Card, Typography, Input, Button, Table, Select,
  Tabs, message, Space, Tooltip, ConfigProvider, theme, Switch, Row, Col,
  Modal, Form, Popconfirm, Tag, DatePicker
} from 'antd';
import {
  SaveOutlined, SearchOutlined, CheckCircleOutlined,
  SunOutlined, MoonOutlined, FileExcelOutlined, HistoryOutlined,
  FormOutlined, SettingOutlined, UserOutlined, CloseOutlined, EditOutlined,
  PlusOutlined, DeleteOutlined, DashboardOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, LabelList, PieChart, Pie, Cell, Legend
} from 'recharts';

const { Title } = Typography;

const API_URL = 'http://105.103.39.102:8080';



// Componente de Autocomplete reutilizável com Ant Design
const AutocompleteField = ({ label, value, onChange, onSelect, options, placeholder, error, inputRef, nextFieldRef, disabled = false }) => {
  const [showList, setShowList] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [internalValue, setInternalValue] = useState(value || '');
  const listRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setInternalValue(value || '');
  }, [value]);

  const filteredOptions = options.filter(opt => {
    const optLabel = typeof opt === 'string' ? opt : opt.label || '';
    return optLabel.toLowerCase().includes(internalValue.toLowerCase());
  });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowList(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInternalValue(val);
    onChange(val);
    setShowList(true);
    setHighlightedIndex(-1);
  };

  const handleFocus = () => {
    if (filteredOptions.length > 0 || options.length > 0) {
      setShowList(true);
    }
  };

  const handleSelect = (option) => {
    const label = typeof option === 'string' ? option : option.label || '';
    setInternalValue(label);
    onSelect(option);
    setShowList(false);
    setHighlightedIndex(-1);
    if (nextFieldRef && nextFieldRef.current) {
      nextFieldRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (!showList || filteredOptions.length === 0) {
      if (e.key === 'Enter' && nextFieldRef && nextFieldRef.current) {
        e.preventDefault();
        nextFieldRef.current.focus();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[highlightedIndex]);
      } else if (filteredOptions.length === 1) {
        handleSelect(filteredOptions[0]);
      } else if (nextFieldRef && nextFieldRef.current) {
        setShowList(false);
        nextFieldRef.current.focus();
      }
    } else if (e.key === 'Escape') {
      setShowList(false);
      setHighlightedIndex(-1);
    }
  };

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('.autocomplete-item');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const dropdownBg = '#ffffff';
  const dropdownBorder = '#d9d9d9';
  const itemHoverBg = '#b3b3b3';
  const itemColor = '#333333';
  const sublabelColor = '#999';

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <Input
        placeholder={placeholder}
        value={internalValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        ref={inputRef}
        status={error ? 'error' : undefined}
        suffix={<SearchOutlined style={{ color: '#999', fontSize: 14 }} />}
      />
      {showList && filteredOptions.length > 0 && (
        <div
          ref={listRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 9999,
            maxHeight: 200,
            overflowY: 'auto',
            marginTop: 4,
            backgroundColor: dropdownBg,
            border: `1px solid ${dropdownBorder}`,
            borderRadius: 6,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          }}
        >
          {filteredOptions.map((option, index) => {
            const label = typeof option === 'string' ? option : option.label || '';
            const sublabel = typeof option === 'object' && option.sublabel ? option.sublabel : null;
            return (
              <div
                key={index}
                className="autocomplete-item"
                onClick={() => handleSelect(option)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  backgroundColor: index === highlightedIndex ? itemHoverBg : 'transparent',
                  color: itemColor,
                  fontSize: '0.875rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => {
                  if (index !== highlightedIndex) {
                    e.currentTarget.style.backgroundColor = itemHoverBg;
                  }
                }}
                onMouseLeave={(e) => {
                  if (index !== highlightedIndex) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span>{label}</span>
                {sublabel && (
                  <span style={{ color: sublabelColor, fontSize: '0.75rem' }}>{sublabel}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Componente de Registro
const RegistroTab = ({ onRegistroSalvo }) => {
  const nomeRef = useRef(null);
  const modeloRef = useRef(null);
  const partRef = useRef(null);
  const corRef = useRef(null);
  const placeRef = useRef(null);
  const qtyInspecRef = useRef(null);
  const failureTestRef = useRef(null);
  const qrcodeRef = useRef(null);

  const [nome, setNome] = useState('');
  const [modelo, setModelo] = useState('');
  const [part, setPart] = useState('');
  const [cor, setCor] = useState('');
  const [place, setPlace] = useState('');
  const [qtyInspec, setQtyInspec] = useState('');
  const [defects, setDefects] = useState([]); // Array de defeitos detalhados
  const [currentDefect, setCurrentDefect] = useState({ failure: '', qty: '', remark: '' }); // Defeito sendo adicionado
  const [failureTest, setFailureTest] = useState('');
  const [qrcode, setQrcode] = useState('');
  const [dataInspecao, setDataInspecao] = useState(dayjs()); // Data da inspeção (padrão: hoje)

  const [modelos, setModelos] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [failures, setFailures] = useState([]);
  const [cores, setCores] = useState([]);
  const [partsOptions, setPartsOptions] = useState([]); // Todos os parts disponíveis
  const [modeloParts, setModeloParts] = useState([]); // Parts filtrados pelo modelo selecionado
  const [descricao, setDescricao] = useState(''); // Descrição selecionada
  const [descricoes, setDescricoes] = useState([]); // Descrições filtradas
  const [loadingModelos, setLoadingModelos] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch de todos os parts (para fallback)
  const fetchParts = async () => {
    try {
      const response = await Axios.get(`${API_URL}/getMXParts`);
      if (Array.isArray(response.data)) {
        setPartsOptions(response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar parts:', error);
    }
  };

  // Fetch de parts filtrados pelo modelo
  const fetchPartsByModel = async (selectedModel) => {
    if (!selectedModel) {
      setModeloParts([]);
      setDescricoes([]);
      return;
    }
    
    try {
      const response = await Axios.get(`${API_URL}/getMXPartsByModel`, {
        params: { modelo: selectedModel }
      });
      if (Array.isArray(response.data)) {
        setModeloParts(response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar parts por modelo:', error);
      setModeloParts([]);
    }
  };

  // Fetch de descrições filtradas pelo modelo e part
  const fetchDescricoes = async (selectedModel, selectedPart) => {
    if (!selectedModel || !selectedPart) {
      setDescricoes([]);
      return;
    }
    
    try {
      const response = await Axios.get(`${API_URL}/getMXDescricoesByModeloPart`, {
        params: { modelo: selectedModel, part: selectedPart }
      });
      if (Array.isArray(response.data)) {
        setDescricoes(response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar descrições:', error);
      setDescricoes([]);
    }
  };

  useEffect(() => {
    const fetchModelos = async () => {
      setLoadingModelos(true);
      try {
        // Buscar modelos da tabela de custo (mais tratados)
        const response = await Axios.get(`${API_URL}/getMXModelos`);
        if (Array.isArray(response.data)) {
          setModelos(response.data);
        }
      } catch (error) {
        console.error('Erro ao buscar modelos:', error);
      } finally {
        setLoadingModelos(false);
      }
    };

    const fetchPessoas = async () => {
      try {
        const response = await Axios.get(`${API_URL}/getMXPessoas`);
        if (Array.isArray(response.data)) {
          setPessoas(response.data);
        }
      } catch (error) {
        console.error('Erro ao buscar pessoas:', error);
      }
    };

    const fetchFailures = async () => {
      try {
        const response = await Axios.get(`${API_URL}/getMXFailures`);
        if (Array.isArray(response.data)) {
          setFailures(response.data);
        }
      } catch (error) {
        console.error('Erro ao buscar failures:', error);
      }
    };

    const fetchCores = async () => {
      try {
        const response = await Axios.get(`${API_URL}/getMXColors`);
        if (Array.isArray(response.data)) {
          setCores(response.data);
        }
      } catch (error) {
        console.error('Erro ao buscar cores:', error);
      }
    };

    fetchModelos();
    fetchPessoas();
    fetchFailures();
    fetchCores();
    fetchParts(); // Adicionado chamada para buscar parts
  }, []);

  const handleAddDefect = () => {
    if (currentDefect.failure && currentDefect.qty && parseInt(currentDefect.qty) > 0) {
      const totalCurrentDefects = defects.reduce((sum, defect) => sum + parseInt(defect.qty), 0);
      const newTotal = totalCurrentDefects + parseInt(currentDefect.qty);
      
      if (newTotal > parseInt(qtyInspec)) {
        message.error('A soma dos defeitos não pode ultrapassar a quantidade inspecionada!');
        return;
      }
      
      setDefects([...defects, { ...currentDefect }]);
      setCurrentDefect({ failure: '', qty: '', remark: '' });
    }
  };

  const handleRemoveDefect = (index) => {
    const newDefects = defects.filter((_, i) => i !== index);
    setDefects(newDefects);
  };

  const handleSave = async () => {
    if (!nome.trim() || !modelo.trim() || !part.trim() || !cor.trim() || !qtyInspec) {
      message.error('Preencha todos os campos obrigatórios');
      return;
    }

    const totalDefects = defects.reduce((sum, defect) => sum + parseInt(defect.qty), 0);
    if (totalDefects > parseInt(qtyInspec)) {
      message.error('A soma dos defeitos não pode ultrapassar a quantidade inspecionada!');
      return;
    }

    setSaving(true);
    try {
      const dateSelecionada = dataInspecao || dayjs();
      const agora = dayjs();
      const hora = agora.format('HH:mm:ss');
      const dataHora = dateSelecionada.format('YYYY-MM-DD') + ' ' + hora;

      // Para cada defeito, enviar um registro separado
      for (const defect of defects) {
        const payload = {
          nome: nome.trim(),
          modelo: modelo.trim(),
          Halb: '',
          part: part.trim(),
          cor: cor.trim(),
          failure_test: defect.failure,
          place: place.trim(),
          qty_inspec: parseInt(qtyInspec),
          qty_defect: parseInt(defect.qty),
          qrcode: defect.remark ? defect.remark.trim() : qrcode.trim(),
          data_hora: dataHora,
        };

        await Axios.post(`${API_URL}/registerMXInsp`, payload);
      }

      // Se não houver defeitos, enviar um registro com qty_defect = 0
      if (defects.length === 0) {
        const payload = {
          nome: nome.trim(),
          modelo: modelo.trim(),
          Halb: '',
          part: part.trim(),
          cor: cor.trim(),
          failure_test: '',
          place: place.trim(),
          qty_inspec: parseInt(qtyInspec),
          qty_defect: 0,
          qrcode: qrcode.trim(),
          data_hora: dataHora,
        };

        await Axios.post(`${API_URL}/registerMXInsp`, payload);
      }

      message.success(`${defects.length > 0 ? defects.length + ' registro(s) salvo(s)' : 'Registro salvo'} com sucesso!`);
      
      // Limpar todos os campos
      setNome('');
      setModelo('');
      setPart('');
      setCor('');
      setPlace('');
      setQtyInspec('');
      setDefects([]);
      setCurrentDefect({ failure: '', qty: '', remark: '' });
      setQrcode('');
      setDataInspecao(dayjs());

      // Chamar função de callback para atualizar o histórico
      if (onRegistroSalvo) {
        onRegistroSalvo();
      }

      if (nomeRef.current) nomeRef.current.focus();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      message.error('Erro ao salvar registro');
    } finally {
      setSaving(false);
    }
  };

  // Calcular Rate automaticamente
  const totalDefects = defects.reduce((sum, defect) => sum + parseInt(defect.qty), 0);
  const rate = qtyInspec && totalDefects ? ((parseInt(totalDefects) / parseInt(qtyInspec)) * 100).toFixed(2) : '0.00';

  const gradientBg = 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div
        style={{
          background: gradientBg,
          padding: '16px 20px',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          color: '#fff',
        }}
      >
        <CheckCircleOutlined style={{ fontSize: 26 }} />
        <Title level={4} style={{ color: '#fff', margin: 0, fontWeight: 700, letterSpacing: '0.5px', textAlign: 'center' }}>
          MX - PQC Screening
        </Title>
      </div>

      <Row gutter={16}>
        {/* Nome */}
        <Col span={8}>
          <div>
            <label style={{ fontWeight: 500, marginBottom: 4, display: 'block', fontSize: 13,
              color: '#555' }}>Nome</label>
            <AutocompleteField
              value={nome}
              onChange={(val) => setNome(val)}
              onSelect={(option) => {
                const label = typeof option === 'string' ? option : option.label || '';
                setNome(label);
              }}
              options={pessoas.map(p => ({ label: p.nome, sublabel: p.matricula }))}
              placeholder="Digite para buscar nome..."
              inputRef={nomeRef}
              nextFieldRef={modeloRef}
            />
          </div>
        </Col>

        {/* Modelo */}
        <Col span={8}>
          <div>
            <label style={{ fontWeight: 500, marginBottom: 4, display: 'block', fontSize: 13,
              color: '#555' }}>Modelo</label>
              <AutocompleteField
                value={modelo}
                onChange={(val) => {
                  setModelo(val);
                  // Buscar parts filtrados quando o modelo mudar
                  fetchPartsByModel(val);
                }}
                onSelect={(option) => {
                  const label = typeof option === 'string' ? option : option.label || '';
                  setModelo(label);
                  // Buscar parts filtrados quando o modelo for selecionado
                  fetchPartsByModel(label);
                }}
                options={modelos.map(m => ({ label: m.Basic_Model }))}
                placeholder="Digite para buscar modelo..."
                inputRef={modeloRef}
                nextFieldRef={partRef}
              />
          </div>
        </Col>

        {/* Place */}
        <Col span={8}>
          <div>
            <label style={{ fontWeight: 500, marginBottom: 4, display: 'block', fontSize: 13,
              color: '#555' }}>Place</label>
            <AutocompleteField
              value={place}
              onChange={(val) => setPlace(val)}
              onSelect={(option) => {
                const label = typeof option === 'string' ? option : option.label || '';
                setPlace(label);
              }}
              options={[
                { label: 'Screening' },
                { label: 'BLK6' },
                { label: 'BLK7' }
              ]}
              placeholder="Selecione ou digite o local..."
              inputRef={placeRef}
              nextFieldRef={qtyInspecRef}
            />
          </div>
        </Col>
      </Row>

      <Row gutter={16}>
        {/* Part */}
        <Col span={8}>
          <div>
            <label style={{ fontWeight: 500, marginBottom: 4, display: 'block', fontSize: 13,
              color: '#555' }}>Part</label>
              <AutocompleteField
                value={part}
                onChange={(val) => {
                  setPart(val);
                  // Buscar descrições quando o part mudar
                  if (modelo && val) {
                    fetchDescricoes(modelo, val);
                  }
                }}
                onSelect={(option) => {
                  const label = typeof option === 'string' ? option : (option.label || option.part || '');
                  setPart(label);
                  // Buscar descrições quando o part for selecionado
                  if (modelo && label) {
                    fetchDescricoes(modelo, label);
                  }
                }}
                options={modelo && Array.isArray(modeloParts) && modeloParts.length > 0 
                  ? modeloParts
                      .filter(p => p && p.part && p.part.trim() !== '')
                      .map(p => ({ label: p.part, part: p.part }))
                      .sort((a, b) => a.label.localeCompare(b.label))
                  : Array.isArray(partsOptions) && partsOptions.length > 0 
                    ? partsOptions
                        .filter(p => p && p.part && p.part.trim() !== '')
                        .map(p => ({ label: p.part, part: p.part }))
                        .sort((a, b) => a.label.localeCompare(b.label))
                    : []
                }
                placeholder="Selecione o Part..."
                inputRef={partRef}
                nextFieldRef={corRef}
              />
          </div>
        </Col>

        {/* Cor */}
        <Col span={8}>
          <div>
            <label style={{ fontWeight: 500, marginBottom: 4, display: 'block', fontSize: 13,
              color: '#555' }}>Cor</label>
            <AutocompleteField
              value={cor}
              onChange={(val) => setCor(val)}
              onSelect={(option) => {
                const label = typeof option === 'string' ? option : option.label || '';
                setCor(label);
              }}
              options={Array.isArray(cores) && cores.length > 0 
                ? [...new Map(cores
                    .filter(c => c && c.cor && c.cor.trim() !== '' && c.cor.trim().toUpperCase() !== 'NA')
                    .map(c => [c.cor, { label: c.cor }])).values()]
                : []
              }
              placeholder="Selecione a cor..."
              inputRef={corRef}
              nextFieldRef={qtyInspecRef}
            />
          </div>
        </Col>

        {/* Descrição */}
        <Col span={8}>
          <div>
            <label style={{ fontWeight: 500, marginBottom: 4, display: 'block', fontSize: 13,
              color: '#555' }}>Descrição</label>
            <AutocompleteField
              value={descricao}
              onChange={(val) => setDescricao(val)}
              onSelect={(option) => {
                const label = typeof option === 'string' ? option : option.label || '';
                setDescricao(label);
              }}
              options={Array.isArray(descricoes) && descricoes.length > 0 
                ? descricoes
                    .filter(d => d && d.descricao && d.descricao.trim() !== '')
                    .map(d => ({ label: d.descricao }))
                    .sort((a, b) => a.label.localeCompare(b.label))
                : []
              }
              placeholder="Selecione a descrição..."
            />
          </div>
        </Col>
      </Row>

      <Row gutter={16}>
        {/* Qty Inspeção */}
        <Col span={8}>
          <div>
            <label style={{ fontWeight: 500, marginBottom: 4, display: 'block', fontSize: 13,
              color: '#555' }}>Qty Inspeção</label>
            <Input
              type="number"
              placeholder="0"
              value={qtyInspec}
              onChange={(e) => setQtyInspec(e.target.value)}
              ref={qtyInspecRef}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  // Focar no campo de failure para adicionar defeitos
                }
              }}
              min={0}
            />
          </div>
        </Col>

        {/* Data da Inspeção */}
        <Col span={8}>
          <div>
            <label style={{ fontWeight: 500, marginBottom: 4, display: 'block', fontSize: 13,
              color: '#555' }}>Data da Inspeção (Opcional)</label>
            <DatePicker
              value={dataInspecao}
              onChange={(date) => {
                if (date && date.isAfter(dayjs(), 'day')) {
                  message.error('Não é possível selecionar datas futuras');
                  return;
                }
                setDataInspecao(date || dayjs());
              }}
              disabledDate={(current) => {
                return current && current.isAfter(dayjs(), 'day');
              }}
              format="DD/MM/YYYY"
              placeholder="Selecione a data"
              style={{ width: '100%' }}
            />
            <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
              Se não alterar, será considerado: {dayjs().format('DD/MM/YYYY')}
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={16}>       

        {/* Detalhamento de Defeitos - Seção expandida */}
        <Col span={24}>
          <div style={{ 
            border: `1px solid #d9d9d9`,
            borderRadius: 6,
            padding: 12,
            backgroundColor: '#fafafa'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontWeight: 500, marginBottom: 0, display: 'block', fontSize: 13,
                color: '#555' }}>Detalhamento de Defeitos</label>
              <Tag color={'geekblue'}>{totalDefects} / {qtyInspec || 0}</Tag>
            </div>
            
            {/* Adicionar novo defeito */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <AutocompleteField
                  value={currentDefect.failure}
                  onChange={(val) => setCurrentDefect({ ...currentDefect, failure: val })}
                  onSelect={(option) => {
                    const label = typeof option === 'string' ? option : option.label || option.failures || '';
                    setCurrentDefect({ ...currentDefect, failure: label });
                    // Focar no campo de quantidade após selecionar o defeito
                    setTimeout(() => {
                      const qtyInput = document.querySelector('[placeholder="Qty"]');
                      if (qtyInput) qtyInput.focus();
                    }, 100);
                  }}
                  options={Array.isArray(failures) && failures.length > 0 
                    ? failures.map(f => ({ label: f.failures }))
                    : []
                  }
                  placeholder="Selecione o tipo de defeito..."
                />
              </div>
              <Input
                type="number"
                placeholder="Qty"
                value={currentDefect.qty}
                onChange={(e) => setCurrentDefect({ ...currentDefect, qty: e.target.value })}
                style={{ width: 80 }}
                min={0}
                max={parseInt(qtyInspec) - defects.reduce((sum, defect) => sum + parseInt(defect.qty), 0)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const remarkInput = document.querySelector('[placeholder="Remark (opcional)"]');
                    if (remarkInput) remarkInput.focus();
                  }
                }}
              />
              <Input
                placeholder="Remark (opcional)"
                value={currentDefect.remark}
                onChange={(e) => setCurrentDefect({ ...currentDefect, remark: e.target.value })}
                style={{ width: 180 }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddDefect();
                    // Focar novamente no campo de defeito após adicionar
                    setTimeout(() => {
                      const failureInput = document.querySelector('[placeholder="Selecione o tipo de defeito..."] input');
                      if (failureInput) failureInput.focus();
                    }, 100);
                  }
                }}
              />
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={() => {
                  handleAddDefect();
                  // Focar novamente no campo de defeito após adicionar
                  setTimeout(() => {
                    const failureInput = document.querySelector('[placeholder="Selecione o tipo de defeito..."] input');
                    if (failureInput) failureInput.focus();
                  }, 100);
                }}
                disabled={!currentDefect.failure || !currentDefect.qty || parseInt(currentDefect.qty) <= 0}
              />
            </div>

            {/* Lista de defeitos adicionados */}
            {defects.length > 0 && (
              <div style={{ 
                maxHeight: 150, 
                overflowY: 'auto',
                border: `1px solid #e8e8e8`,
                borderRadius: 4,
                padding: 8,
                backgroundColor: '#fff'
              }}>
                {defects.map((defect, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '4px 8px',
                    marginBottom: 4,
                    backgroundColor: 'rgba(79, 70, 229, 0.05)',
                    borderRadius: 4
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#333' }}>
                        {defect.failure}
                      </div>
                      <div style={{ fontSize: 11, color: '#666' }}>
                        Quantidade: {defect.qty} {defect.remark && `| Remark: ${defect.remark}`}
                      </div>
                    </div>
                    <Button 
                      type="text" 
                      icon={<DeleteOutlined />} 
                      onClick={() => handleRemoveDefect(index)}
                      size="small"
                      danger
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* Rate */}
      <div>
        <label style={{ fontWeight: 500, marginBottom: 4, display: 'block', fontSize: 13,
          color: '#555' }}>Rate (%)</label>
        <Input
          type="text"
          placeholder="0.00"
          value={`${rate}%`}
          readOnly
          style={{ backgroundColor: '#f5f5f5', color: '#666' }}
        />
      </div>

      {/* Botão Salvar */}
      <Popconfirm
        title="Confirmar salvamento"
        description="Tem certeza que deseja salvar este registro?"
        onConfirm={handleSave}
        okText="Sim, salvar"
        cancelText="Cancelar"
        disabled={saving}
      >
        <Button
          size="large"
          block
          loading={saving}
          icon={<SaveOutlined />}
          style={{
            marginTop: 4,
            height: 44,
            fontWeight: 600,
            fontSize: 15,
            borderRadius: 8,
            backgroundColor: '#4f46e5',
            color: '#fff',
            border: '1px solid #4f46e5'
          }}
        >
          {saving ? 'Salvando...' : 'Salvar Registro'}
        </Button>
      </Popconfirm>
    </div>
  );
};

// Componente de Histórico
const HistoricoTab = React.forwardRef(({}, ref) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([dayjs(), dayjs()]);
  const [selectedDate, setSelectedDate] = useState(null); // Para filtro por data específica
  const [datasDisponiveis, setDatasDisponiveis] = useState([]);
  const [useDateFilter, setUseDateFilter] = useState(false); // true = usa data específica, false = usa range
  const [modeloFilter, setModeloFilter] = useState('');
  const [tnpFilter, setTnpFilter] = useState('todos'); // 'todos', 'tnp', 'sec'
  const [modelos, setModelos] = useState([]);

  useEffect(() => {
    const fetchModelos = async () => {
      try {
        const response = await Axios.get(`${API_URL}/getModeloReparo`);
        if (Array.isArray(response.data)) {
          setModelos(response.data);
        }
      } catch (error) {
        console.error('Erro ao buscar modelos:', error);
      }
    };
    fetchModelos();
  }, []);

  // Buscar datas disponíveis
  const fetchDatasDisponiveis = async () => {
    try {
      const params = {};
      if (modeloFilter) params.modelo = modeloFilter;
      if (tnpFilter && tnpFilter !== 'todos') params.tnp = tnpFilter;
      
      const response = await Axios.get(`${API_URL}/getMXInspDatas`, { params });
      if (Array.isArray(response.data)) {
        setDatasDisponiveis(response.data.map(item => item.data));
        // Se estiver usando filtro por data e a data selecionada não estiver na lista, selecionar a primeira
        if (useDateFilter) {
          const dataSelecionada = response.data.find(d => 
            dayjs(d.data).isSame(selectedDate, 'day')
          );
          if (!dataSelecionada && response.data.length > 0) {
            setSelectedDate(dayjs(response.data[0].data));
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar datas disponíveis:', error);
    }
  };

  useEffect(() => {
    fetchDatasDisponiveis();
  }, [modeloFilter, tnpFilter, useDateFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Buscar dados do histórico
      const params = {};
      if (useDateFilter) {
        // Usar filtro por data específica (mais recente ao mais antigo)
        if (selectedDate) {
          params.dataInicio = selectedDate.format('YYYY-MM-DD');
          params.dataFim = selectedDate.format('YYYY-MM-DD');
        }
      } else {
        // Usar filtro por range de datas
        if (dateRange && dateRange[0] && dateRange[1]) {
          params.dataInicio = dateRange[0].format('YYYY-MM-DD');
          params.dataFim = dateRange[1].format('YYYY-MM-DD');
        }
      }
      if (modeloFilter) {
        params.modelo = modeloFilter;
      }
      if (tnpFilter && tnpFilter !== 'todos') {
        params.tnp = tnpFilter;
      }
      
      const historyResponse = await Axios.get(`${API_URL}/getMXInsp`, { params });

      // Processar dados do histórico
      const processedData = Array.isArray(historyResponse.data) ? historyResponse.data : [];

      setData(processedData);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      message.error('Erro ao buscar histórico');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Expor fetchData através da ref
  useImperativeHandle(ref, () => ({
    fetchData
  }));

  useEffect(() => {
    fetchData();
  }, []);

  const exportToExcel = () => {
    if (data.length === 0) {
      message.warning('Não há dados para exportar');
      return;
    }

    const exportData = data.map((item, index) => {
      const custo = parseFloat(item.custo_unitario) || 0;
      const qty = parseInt(item.qty_defect) || 0;
      const total = custo * qty;
      return {
        '#': index + 1,
        'Nome': item.nome,
        'Modelo': item.modelo,
        'Part': item.part,
        'Cor': item.cor,
        'Failure Test': item.failure_test,
        'Place': item.place,
        'QRCode': item.qrcode,
        'Qty Inspeção': item.qty_inspec,
        'Qty Defect': item.qty_defect,
        'Rate (%)': item.qty_inspec && item.qty_defect ? ((parseInt(item.qty_defect) / parseInt(item.qty_inspec)) * 100).toFixed(2) : '0.00',
        'Custo Unit.': custo > 0 ? custo.toFixed(4) : '-',
        'Custo Total': total > 0 ? total.toFixed(2) : '-',
        'Data/Hora': item.data_hora,
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = { Sheets: { data: ws }, SheetNames: ['data'] };
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const fileExtension = '.xlsx';
    const blob = new Blob([excelBuffer], { type: fileType });
    FileSaver.saveAs(blob, `inspecao_mx_${dayjs().format('YYYY-MM-DD_HH-mm')}${fileExtension}`);
  };

  const columns = [
    {
      title: '#',
      key: 'index',
      width: 60,
      render: (_, __, index) => index + 1,
    },
            {
      title: 'Data/Hora',
      dataIndex: 'data_hora',
      key: 'data_hora',
      width: 180,
    },
    {
      title: 'Nome',
      dataIndex: 'nome',
      key: 'nome',
      width: 200,
    },
    {
      title: 'Modelo',
      dataIndex: 'modelo',
      key: 'modelo',
      width: 180,
    },
    {
      title: 'Part',
      dataIndex: 'part',
      key: 'part',
      width: 130,
    },
    {
      title: 'Cor',
      dataIndex: 'cor',
      key: 'cor',
      width: 150,
    },
    {
      title: 'Failure Test',
      dataIndex: 'failure_test',
      key: 'failure_test',
      width: 180,
    },
    {
      title: 'Place',
      dataIndex: 'place',
      key: 'place',
      width: 150,
    },
    {
      title: 'QRCode',
      dataIndex: 'qrcode',
      key: 'qrcode',
      width: 150,
    },
    {
      title: 'Qty Insp.',
      dataIndex: 'qty_inspec',
      key: 'qty_inspec',
      width: 110,
      align: 'center',
    },
    {
      title: 'Qty Defect',
      dataIndex: 'qty_defect',
      key: 'qty_defect',
      width: 110,
      align: 'center',
    },
    {
      title: 'Rate (%)',
      key: 'rate',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const rate = record.qty_inspec && record.qty_defect ? ((parseInt(record.qty_defect) / parseInt(record.qty_inspec)) * 100).toFixed(2) : '0.00';
        return `${rate}%`;
      },
    },
    {
      title: 'Custo Unit.',
      dataIndex: 'custo_unitario',
      key: 'custo_unitario',
      width: 120,
      align: 'right',
      render: (_, record) => {
        const custo = parseFloat(record.custo_unitario) || 0;
        return custo > 0 ? `R$ ${custo.toFixed(2)}` : '-';
      },
    },
    {
      title: 'Custo Total',
      key: 'custo_total',
      width: 110,
      align: 'right',
      render: (_, record) => {
        const custo = parseFloat(record.custo_unitario) || 0;
        const qty = parseInt(record.qty_defect) || 0;
        const total = custo * qty;
        return total > 0 ? (
          <span style={{ 
            fontWeight: 'bold', 
            color: '#cf1322',
            backgroundColor: '#fff1f0',
            padding: '1px 6px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            display: 'inline-block',
            fontSize: '11px'
          }}>
            R$ {total.toFixed(2)}
          </span>
        ) : <span style={{ fontSize: '11px' }}>-</span>;
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filtros */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: '#fafafa',
        borderRadius: 8,
        border: `1px solid #e8e8e8`,
      }}>
        {/* Toggle entre filtro por data específica e range */}
        <div style={{ flex: '1 1 100%', marginBottom: 8 }}>
          <Space>
            <Button
              size="small"
              onClick={() => setUseDateFilter(false)}
              style={{
                backgroundColor: !useDateFilter ? '#1890ff' : '#f0f0f0',
                color: !useDateFilter ? '#fff' : '#333',
                border: `1px solid ${!useDateFilter ? '#1890ff' : '#d9d9d9'}`
              }}
            >
              Filtro por Período
            </Button>
            <Button
              size="small"
              onClick={() => setUseDateFilter(true)}
              style={{
                backgroundColor: useDateFilter ? '#1890ff' : '#f0f0f0',
                color: useDateFilter ? '#fff' : '#333',
                border: `1px solid ${useDateFilter ? '#1890ff' : '#d9d9d9'}`
              }}
            >
              Datas Disponíveis
            </Button>
          </Space>
        </div>

        {/* Filtro por Range de Datas */}
        {!useDateFilter && (
          <div style={{ flex: '1 1 220px' }}>
            <label style={{ fontWeight: 500, marginBottom: 4, display: 'block', fontSize: 13,
              color: '#555' }}>Período</label>
            <DatePicker.RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
              style={{ width: '100%' }}
              dropdownClassName="inspecmx-datepicker"
            />
          </div>
        )}

        {/* Filtro por Data Disponível */}
        {useDateFilter && (
          <div style={{ flex: '1 1 220px' }}>
            <label style={{ fontWeight: 500, marginBottom: 4, display: 'block', fontSize: 13,
              color: '#555' }}>Data com Registros</label>
            <Select
              value={selectedDate ? selectedDate.format('YYYY-MM-DD') : undefined}
              onChange={(val) => setSelectedDate(val ? dayjs(val) : null)}
              style={{ width: '100%' }}
              placeholder="Selecione uma data"
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {datasDisponiveis.map((data, index) => (
                <Select.Option key={index} value={data}>
                  {dayjs(data).format('DD/MM/YYYY')}
                </Select.Option>
              ))}
            </Select>
            <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
              {datasDisponiveis.length} data(s) disponível(eis)
            </div>
          </div>
        )}

        <div style={{ flex: '1 1 200px' }}>
          <label style={{ fontWeight: 500, marginBottom: 4, display: 'block', fontSize: 13,
            color: '#555' }}>Modelo</label>
          <Select
            allowClear
            showSearch
            placeholder="Todos os modelos"
            value={modeloFilter || undefined}
            onChange={(val) => setModeloFilter(val || '')}
            style={{ width: '100%' }}
            filterOption={(input, option) =>
              (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {modelos.map(m => (
              <Select.Option key={m.Basic_Model} value={m.Basic_Model}>
                {m.Basic_Model}
              </Select.Option>
            ))}
          </Select>
        </div>
        <div style={{ flex: '1 1 150px' }}>
          <label style={{ fontWeight: 500, marginBottom: 4, display: 'block', fontSize: 13,
            color: '#555' }}>TNP/SEC</label>
          <Select
            allowClear
            placeholder="Todos"
            value={tnpFilter || 'todos'}
            onChange={(val) => setTnpFilter(val || 'todos')}
            style={{ width: '100%' }}
          >
            <Select.Option value="todos">Todos</Select.Option>
            <Select.Option value="tnp">TNP</Select.Option>
            <Select.Option value="sec">SEC</Select.Option>
          </Select>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            icon={<SearchOutlined />}
            onClick={fetchData}
            loading={loading}
            style={{
              backgroundColor: '#1890ff',
              color: '#fff',
              border: '1px solid #1890ff'
            }}
          >
            Buscar
          </Button>
          <Tooltip title="Exportar para Excel">
            <Button
              icon={<FileExcelOutlined />}
              onClick={exportToExcel}
              style={{
                backgroundColor: '#52c41a',
                color: '#fff',
                border: '1px solid #52c41a'
              }}
            />
          </Tooltip>
        </div>
      </div>

      {/* Tabela */}
      <Table
        columns={columns}
        dataSource={data}
        rowKey={(record, index) => record.id ? `id_${record.id}` : `index_${index}_${record.data_hora || ''}_${record.modelo || ''}`}
        loading={loading}
        size="small"
        pagination={{ pageSize: 15, showSizeChanger: false, showTotal: (total) => `${total} registros` }}
        scroll={{ x: 1260 }}
        style={{ borderRadius: 8, fontSize: '12px' }}
        rowStyle={{ fontSize: '12px' }}
      />
    </div>
  );
},);

// Componente de Administração - Login
const AdminLogin = ({ onLoginSuccess }) => {
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!senha.trim()) {
      message.error('Digite a senha de administrador');
      return;
    }

    setLoading(true);
    try {
      const response = await Axios.post(`${API_URL}/admin/login`, { senha });
      if (response.data.authenticated) {
        message.success('Login realizado com sucesso!');
        onLoginSuccess();
      } else {
        message.error('Senha incorreta!');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      message.error('Erro ao realizar login');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 300,
      padding: 24,
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        padding: 24,
        borderRadius: 12,
        textAlign: 'center',
        maxWidth: 400,
        width: '100%',
      }}>
        <UserOutlined style={{ fontSize: 48, color: '#fff', marginBottom: 16 }} />
        <Title level={4} style={{ color: '#fff', margin: '0 0 24px 0', textAlign: 'center' }}>
          Área Administrativa
        </Title>
        <Input.Password
          placeholder="Digite a senha de administrador"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          onPressEnter={handleKeyPress}
          style={{ marginBottom: 16 }}
        />
        <Button
          type="primary"
          block
          onClick={handleLogin}
          loading={loading}
          size="large"
          style={{ fontWeight: 600 }}
        >
          Acessar
        </Button>
      </div>
    </div>
  );
};

// Componente de Administração - CRUD
const AdminCRUD = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('pessoas');
  const [pessoas, setPessoas] = useState([]);
  const [failures, setFailures] = useState([]);
  const [cores, setCores] = useState([]);
  const [parts, setParts] = useState([]); // Adicionado estado para parts
  const [custos, setCustos] = useState([]); // Adicionado estado para custos
  const [loading, setLoading] = useState(false);

  // Estados para modais
  const [modalVisible, setModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [form] = Form.useForm();

  // Buscar dados
  const fetchData = async () => {
    setLoading(true);
    try {
      const [pessoasRes, failuresRes, coresRes, partsRes, custosRes] = await Promise.all([
        Axios.get(`${API_URL}/admin/mx_pessoas`),
        Axios.get(`${API_URL}/admin/mx_failures`),
        Axios.get(`${API_URL}/admin/mx_cores`),
        Axios.get(`${API_URL}/admin/mx_parts`),
        Axios.get(`${API_URL}/admin/mx_custos`), // Adicionado fetch de custos
      ]);
      setPessoas(Array.isArray(pessoasRes.data) ? pessoasRes.data : []);
      setFailures(Array.isArray(failuresRes.data) ? failuresRes.data : []);
      setCores(Array.isArray(coresRes.data) ? coresRes.data : []);
      setParts(Array.isArray(partsRes.data) ? partsRes.data : []);
      setCustos(Array.isArray(custosRes.data) ? custosRes.data : []); // Adicionado set de custos
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      message.error('Erro ao buscar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Funções CRUD para Pessoas
  const handleAddPessoa = async (values) => {
    try {
      await Axios.post(`${API_URL}/admin/mx_pessoas`, values);
      message.success('Pessoa adicionada com sucesso!');
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      console.error('Erro ao adicionar pessoa:', error);
      message.error('Erro ao adicionar pessoa');
    }
  };

  const handleUpdatePessoa = async (id, values) => {
    try {
      await Axios.put(`${API_URL}/admin/mx_pessoas/${id}`, values);
      message.success('Pessoa atualizada com sucesso!');
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      console.error('Erro ao atualizar pessoa:', error);
      message.error('Erro ao atualizar pessoa');
    }
  };

  const handleDeletePessoa = async (id) => {
    try {
      await Axios.delete(`${API_URL}/admin/mx_pessoas/${id}`);
      message.success('Pessoa excluída com sucesso!');
      fetchData();
    } catch (error) {
      console.error('Erro ao excluir pessoa:', error);
      message.error('Erro ao excluir pessoa');
    }
  };

  // Funções CRUD para Failures
  const handleAddFailure = async (values) => {
    try {
      await Axios.post(`${API_URL}/admin/mx_failures`, values);
      message.success('Failure adicionado com sucesso!');
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      console.error('Erro ao adicionar failure:', error);
      message.error('Erro ao adicionar failure');
    }
  };

  const handleUpdateFailure = async (id, values) => {
    try {
      await Axios.put(`${API_URL}/admin/mx_failures/${id}`, values);
      message.success('Failure atualizado com sucesso!');
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      console.error('Erro ao atualizar failure:', error);
      message.error('Erro ao atualizar failure');
    }
  };

  const handleDeleteFailure = async (id) => {
    try {
      await Axios.delete(`${API_URL}/admin/mx_failures/${id}`);
      message.success('Failure excluído com sucesso!');
      fetchData();
    } catch (error) {
      console.error('Erro ao excluir failure:', error);
      message.error('Erro ao excluir failure');
    }
  };

  // Funções CRUD para Cores
  const handleAddCor = async (values) => {
    try {
      await Axios.post(`${API_URL}/admin/mx_cores`, values);
      message.success('Cor adicionada com sucesso!');
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      console.error('Erro ao adicionar cor:', error);
      message.error('Erro ao adicionar cor');
    }
  };

  const handleUpdateCor = async (id, values) => {
    try {
      await Axios.put(`${API_URL}/admin/mx_cores/${id}`, values);
      message.success('Cor atualizada com sucesso!');
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      console.error('Erro ao atualizar cor:', error);
      message.error('Erro ao atualizar cor');
    }
  };

  const handleDeleteCor = async (id) => {
    try {
      await Axios.delete(`${API_URL}/admin/mx_cores/${id}`);
      message.success('Cor excluída com sucesso!');
      fetchData();
    } catch (error) {
      console.error('Erro ao excluir cor:', error);
      message.error('Erro ao excluir cor');
    }
  };

  // Funções CRUD para Parts - Adicionado
  const handleAddPart = async (values) => {
    try {
      await Axios.post(`${API_URL}/admin/mx_parts`, values);
      message.success('Part adicionado com sucesso!');
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      console.error('Erro ao adicionar part:', error);
      message.error('Erro ao adicionar part');
    }
  };

  const handleUpdatePart = async (id, values) => {
    try {
      await Axios.put(`${API_URL}/admin/mx_parts/${id}`, values);
      message.success('Part atualizado com sucesso!');
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      console.error('Erro ao atualizar part:', error);
      message.error('Erro ao atualizar part');
    }
  };

  const handleDeletePart = async (id) => {
    try {
      await Axios.delete(`${API_URL}/admin/mx_parts/${id}`);
      message.success('Part excluído com sucesso!');
      fetchData();
    } catch (error) {
      console.error('Erro ao excluir part:', error);
      message.error('Erro ao excluir part');
    }
  };

  // Funções CRUD para Custos
  const handleAddCusto = async (values) => {
    try {
      await Axios.post(`${API_URL}/admin/mx_custos`, values);
      message.success('Custo adicionado com sucesso!');
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      console.error('Erro ao adicionar custo:', error);
      message.error('Erro ao adicionar custo');
    }
  };

  const handleUpdateCusto = async (id, values) => {
    try {
      await Axios.put(`${API_URL}/admin/mx_custos/${id}`, values);
      message.success('Custo atualizado com sucesso!');
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      console.error('Erro ao atualizar custo:', error);
      message.error('Erro ao atualizar custo');
    }
  };

  const handleDeleteCusto = async (id) => {
    try {
      await Axios.delete(`${API_URL}/admin/mx_custos/${id}`);
      message.success('Custo excluído com sucesso!');
      fetchData();
    } catch (error) {
      console.error('Erro ao excluir custo:', error);
      message.error('Erro ao excluir custo');
    }
  };

  // Colunas das tabelas
  const pessoasColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Nome',
      dataIndex: 'nome',
      key: 'nome',
    },
    {
      title: 'Matrícula',
      dataIndex: 'matricula',
      key: 'matricula',
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            style={{
              backgroundColor: '#1890ff',
              color: '#fff',
              border: '1px solid #1890ff'
            }}
            onClick={() => {
              setCurrentItem(record);
              form.setFieldsValue(record);
              setModalVisible(true);
            }}
          >
            Editar
          </Button>
          <Popconfirm
            title="Excluir pessoa?"
            description="Tem certeza que deseja excluir esta pessoa?"
            onConfirm={() => handleDeletePessoa(record.id)}
            okText="Sim"
            cancelText="Não"
          >
            <Button
              size="small"
              icon={<DeleteOutlined />}
              style={{
                backgroundColor: '#ff4d4f',
                color: '#fff',
                border: '1px solid #ff4d4f'
              }}
            >
              Deletar
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const failuresColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Failure',
      dataIndex: 'failures',
      key: 'failures',
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            style={{
              backgroundColor: '#1890ff',
              color: '#fff',
              border: '1px solid #1890ff'
            }}
            onClick={() => {
              setCurrentItem(record);
              form.setFieldsValue(record);
              setModalVisible(true);
            }}
          >
            Editar
          </Button>
          <Popconfirm
            title="Excluir failure?"
            description="Tem certeza que deseja excluir este failure?"
            onConfirm={() => handleDeleteFailure(record.id)}
            okText="Sim"
            cancelText="Não"
          >
            <Button
              size="small"
              icon={<DeleteOutlined />}
              style={{
                backgroundColor: '#ff4d4f',
                color: '#fff',
                border: '1px solid #ff4d4f'
              }}
            >
              Deletar
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const coresColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Cor',
      dataIndex: 'cor',
      key: 'cor',
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            style={{
              backgroundColor: '#1890ff',
              color: '#fff',
              border: '1px solid #1890ff'
            }}
            onClick={() => {
              setCurrentItem(record);
              form.setFieldsValue(record);
              setModalVisible(true);
            }}
          >
            Editar
          </Button>
          <Popconfirm
            title="Excluir cor?"
            description="Tem certeza que deseja excluir esta cor?"
            onConfirm={() => handleDeleteCor(record.id)}
            okText="Sim"
            cancelText="Não"
          >
            <Button
              size="small"
              icon={<DeleteOutlined />}
              style={{
                backgroundColor: '#ff4d4f',
                color: '#fff',
                border: '1px solid #ff4d4f'
              }}
            >
              Deletar
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Colunas para Parts - Adicionado
  const partsColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Part',
      dataIndex: 'part',
      key: 'part',
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            style={{
              backgroundColor: '#1890ff',
              color: '#fff',
              border: '1px solid #1890ff'
            }}
            onClick={() => {
              setCurrentItem(record);
              form.setFieldsValue(record);
              setModalVisible(true);
            }}
          >
            Editar
          </Button>
          <Popconfirm
            title="Excluir part?"
            description="Tem certeza que deseja excluir este part?"
            onConfirm={() => handleDeletePart(record.id)}
            okText="Sim"
            cancelText="Não"
          >
            <Button
              size="small"
              icon={<DeleteOutlined />}
              style={{
                backgroundColor: '#ff4d4f',
                color: '#fff',
                border: '1px solid #ff4d4f'
              }}
            >
              Deletar
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Colunas para Custos
  const custosColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Modelo',
      dataIndex: 'Basic_Model',
      key: 'Basic_Model',
      width: 120,
    },
    {
      title: 'Part',
      dataIndex: 'Part',
      key: 'Part',
      width: 120,
    },
    {
      title: 'Descrição',
      dataIndex: 'Descricao',
      key: 'Descricao',
      width: 180,
    },
    {
      title: 'Valor Unit. (R$)',
      dataIndex: 'Valor_Unitario',
      key: 'Valor_Unitario',
      width: 130,
      render: (text) => {
        const valor = parseFloat(text) || 0;
        return valor.toFixed(4);
      },
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            style={{
              backgroundColor: '#1890ff',
              color: '#fff',
              border: '1px solid #1890ff'
            }}
            onClick={() => {
              setCurrentItem(record);
              form.setFieldsValue(record);
              setModalVisible(true);
            }}
          >
            Editar
          </Button>
          <Popconfirm
            title="Excluir custo?"
            description="Tem certeza que deseja excluir este custo?"
            onConfirm={() => handleDeleteCusto(record.id)}
            okText="Sim"
            cancelText="Não"
          >
            <Button
              size="small"
              icon={<DeleteOutlined />}
              style={{
                backgroundColor: '#ff4d4f',
                color: '#fff',
                border: '1px solid #ff4d4f'
              }}
            >
              Deletar
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '8px 4px 20px' }}>
      {/* Header com botão de logout */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        padding: '16px 20px',
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        borderRadius: 10,
        color: '#fff',
      }}>
        <Title level={4} style={{ color: '#fff', margin: 0, textAlign: 'center', flex: 1 }}>
          <SettingOutlined style={{ marginRight: 12 }} />
          Administração - Tabelas de Referência
        </Title>
        <Button
          type="primary"
          danger
          icon={<CloseOutlined />}
          onClick={onLogout}
          style={{ backgroundColor: '#ff4d4f' }}
        >
          Sair
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'pessoas',
            label: 'Pessoas',
            children: (
              <div>
                <div style={{ marginBottom: 16, textAlign: 'right' }}>
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setCurrentItem(null);
                      form.resetFields();
                      setModalVisible(true);
                    }}
                    style={{
                      backgroundColor: '#52c41a',
                      color: '#fff',
                      border: '1px solid #52c41a'
                    }}
                  >
                    Adicionar Pessoa
                  </Button>
                </div>
                <Table
                  columns={pessoasColumns}
                  dataSource={pessoas}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                  size="small"
                  scroll={{ x: 400 }}
                />
              </div>
            ),
          },
          {
            key: 'failures',
            label: 'Failures',
            children: (
              <div>
                <div style={{ marginBottom: 16, textAlign: 'right' }}>
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setCurrentItem(null);
                      form.resetFields();
                      setModalVisible(true);
                    }}
                    style={{
                      backgroundColor: '#52c41a',
                      color: '#fff',
                      border: '1px solid #52c41a'
                    }}
                  >
                    Adicionar Failure
                  </Button>
                </div>
                <Table
                  columns={failuresColumns}
                  dataSource={failures}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                  size="small"
                  scroll={{ x: 400 }}
                />
              </div>
            ),
          },
          {
            key: 'cores',
            label: 'Cores',
            children: (
              <div>
                <div style={{ marginBottom: 16, textAlign: 'right' }}>
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setCurrentItem(null);
                      form.resetFields();
                      setModalVisible(true);
                    }}
                    style={{
                      backgroundColor: '#52c41a',
                      color: '#fff',
                      border: '1px solid #52c41a'
                    }}
                  >
                    Adicionar Cor
                  </Button>
                </div>
                <Table
                  columns={coresColumns}
                  dataSource={cores}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                  size="small"
                  scroll={{ x: 400 }}
                />
              </div>
            ),
          },
          // Tab para Parts - Adicionado
          {
            key: 'parts',
            label: 'Parts',
            children: (
              <div>
                <div style={{ marginBottom: 16, textAlign: 'right' }}>
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setCurrentItem(null);
                      form.resetFields();
                      setModalVisible(true);
                    }}
                    style={{
                      backgroundColor: '#52c41a',
                      color: '#fff',
                      border: '1px solid #52c41a'
                    }}
                  >
                    Adicionar Part
                  </Button>
                </div>
                <Table
                  columns={partsColumns}
                  dataSource={parts}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                  size="small"
                  scroll={{ x: 400 }}
                />
              </div>
            ),
          },
          // Tab para Custos
          {
            key: 'custos',
            label: 'Custos',
            children: (
              <div>
                <div style={{ marginBottom: 16, textAlign: 'right' }}>
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setCurrentItem(null);
                      form.resetFields();
                      setModalVisible(true);
                    }}
                    style={{
                      backgroundColor: '#52c41a',
                      color: '#fff',
                      border: '1px solid #52c41a'
                    }}
                  >
                    Adicionar Custo
                  </Button>
                </div>
                <Table
                  columns={custosColumns}
                  dataSource={custos}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                  size="small"
                  scroll={{ x: 900 }}
                />
              </div>
            ),
          },
        ]}
      />

      {/* Modal para CRUD */}
      <Modal
        title={currentItem ? 'Editar Item' : 'Adicionar Item'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        okButtonProps={{
          style: {
            backgroundColor: '#52c41a',
            color: '#fff',
            border: '1px solid #52c41a'
          }
        }}
        cancelButtonProps={{
          style: {
            backgroundColor: '#ff4d4f',
            color: '#fff',
            border: '1px solid #ff4d4f'
          }
        }}
        onOk={() => {
          form
            .validateFields()
            .then((values) => {
              if (activeTab === 'pessoas') {
                if (currentItem) {
                  handleUpdatePessoa(currentItem.id, values);
                } else {
                  handleAddPessoa(values);
                }
              } else if (activeTab === 'failures') {
                if (currentItem) {
                  handleUpdateFailure(currentItem.id, values);
                } else {
                  handleAddFailure(values);
                }
              } else if (activeTab === 'cores') {
                if (currentItem) {
                  handleUpdateCor(currentItem.id, values);
                } else {
                  handleAddCor(values);
                }
              } else if (activeTab === 'parts') { // Adicionado tratamento para parts
                if (currentItem) {
                  handleUpdatePart(currentItem.id, values);
                } else {
                  handleAddPart(values);
                }
              } else if (activeTab === 'custos') { // Adicionado tratamento para custos
                if (currentItem) {
                  handleUpdateCusto(currentItem.id, values);
                } else {
                  handleAddCusto(values);
                }
              }
            })
            .catch((info) => {
              console.log('Validate Failed:', info);
            });
        }}
        okText={currentItem ? 'Atualizar' : 'Adicionar'}
        cancelText="Cancelar"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={currentItem || {}}
        >
          {activeTab === 'pessoas' && (
            <>
              <Form.Item
                name="nome"
                label="Nome"
                rules={[{ required: true, message: 'Por favor, insira o nome!' }]}
              >
                <Input placeholder="Digite o nome" />
              </Form.Item>
              <Form.Item
                name="matricula"
                label="Matrícula"
                rules={[{ required: true, message: 'Por favor, insira a matrícula!' }]}
              >
                <Input placeholder="Digite a matrícula" />
              </Form.Item>
            </>
          )}
          {activeTab === 'failures' && (
            <Form.Item
              name="failures"
              label="Failure"
              rules={[{ required: true, message: 'Por favor, insira o failure!' }]}
            >
              <Input placeholder="Digite o failure" />
            </Form.Item>
          )}
          {activeTab === 'cores' && (
            <>
              <Form.Item
                name="code"
                label="Code"
                rules={[{ required: true, message: 'Por favor, insira o code!' }]}
              >
                <Input placeholder="Digite o code" />
              </Form.Item>
              <Form.Item
                name="cor"
                label="Cor"
                rules={[{ required: true, message: 'Por favor, insira a cor!' }]}
              >
                <Input placeholder="Digite a cor" />
              </Form.Item>
            </>
          )}
          {activeTab === 'parts' && ( // Adicionado formulário para parts
            <Form.Item
              name="part"
              label="Part"
              rules={[{ required: true, message: 'Por favor, insira o part!' }]}
            >
              <Input placeholder="Digite o part" />
            </Form.Item>
          )}
          {activeTab === 'custos' && ( // Adicionado formulário para custos
            <>
              <Form.Item
                name="Basic_Model"
                label="Modelo"
                rules={[{ required: true, message: 'Por favor, insira o modelo!' }]}
              >
                <Input placeholder="Digite o modelo (ex: S23)" />
              </Form.Item>
              <Form.Item
                name="Part"
                label="Part"
                rules={[{ required: true, message: 'Por favor, insira o part!' }]}
              >
                <Input placeholder="Digite o part (ex: MAIN PCB)" />
              </Form.Item>
              <Form.Item
                name="Descricao"
                label="Descrição"
                rules={[{ required: true, message: 'Por favor, insira a descrição!' }]}
              >
                <Input placeholder="Digite a descrição (ex: JDM)" />
              </Form.Item>
              <Form.Item
                name="Valor_Unitario"
                label="Valor Unitário (R$)"
                rules={[
                  { required: true, message: 'Por favor, insira o valor!' },
                  {
                    pattern: /^\d+(\.\d{1,4})?$/,
                    message: 'Insira um valor numérico válido'
                  }
                ]}
              >
                <Input type="number" placeholder="0.0000" step="0.0001" min="0" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};

// Componente de Dashboard
const DashboardTab = () => {
  const [loading, setLoading] = useState(false);
  const [rawData, setRawData] = useState([]);
  
  // Filtros - Inicializar com a semana atual (domingo a sábado)
  const getWeekRange = () => {
    const today = dayjs();
    const startOfWeek = today.day(0); // Domingo
    const endOfWeek = today.day(6); // Sábado
    return [startOfWeek, endOfWeek];
  };
  
  const [dateRange, setDateRange] = useState(getWeekRange());
  const [modeloFilter, setModeloFilter] = useState('');
  const [partFilter, setPartFilter] = useState('');
  const [corFilter, setCorFilter] = useState('');
  const [failureTestFilter, setFailureTestFilter] = useState('');
  const [placeFilter, setPlaceFilter] = useState('');
  
  // Opções para filtros
  const [modelosComRegistro, setModelosComRegistro] = useState([]);
  const [parts, setParts] = useState([]);
  const [cores, setCores] = useState([]);
  const [failures, setFailures] = useState([]);
  const [places] = useState(['Screening', 'BLK6', 'BLK7']);

  // Buscar dados iniciais e opções de filtros
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.dataInicio = dateRange[0].format('YYYY-MM-DD');
        params.dataFim = dateRange[1].format('YYYY-MM-DD');
      }
      if (modeloFilter) params.modelo = modeloFilter;
      
      const response = await Axios.get(`${API_URL}/getMXInsp`, { params });
      setRawData(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      message.error('Erro ao buscar dados do dashboard');
      setRawData([]);
    } finally {
      setLoading(false);
    }
  };

  // Buscar opções dos filtros e modelos com registro
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [modelosRes, partsRes, coresRes, failuresRes] = await Promise.all([
          Axios.get(`${API_URL}/getMXModelos`),
          Axios.get(`${API_URL}/getMXParts`),
          Axios.get(`${API_URL}/getMXColors`),
          Axios.get(`${API_URL}/getMXFailures`),
        ]);
        if (Array.isArray(partsRes.data)) setParts(partsRes.data);
        if (Array.isArray(coresRes.data)) setCores(coresRes.data);
        if (Array.isArray(failuresRes.data)) setFailures(failuresRes.data);
        
        // Buscar modelos que já têm registro (últimos 90 dias)
        try {
          const modelosComRegistroRes = await Axios.get(`${API_URL}/getMXInsp`, {
            params: {
              dataInicio: dayjs().subtract(90, 'days').format('YYYY-MM-DD'),
              dataFim: dayjs().format('YYYY-MM-DD')
            }
          });
          if (Array.isArray(modelosComRegistroRes.data)) {
            const modelosUnicos = [...new Set(modelosComRegistroRes.data.map(item => item.modelo).filter(Boolean))];
            setModelosComRegistro(modelosUnicos);
          }
        } catch (err) {
          console.error('Erro ao buscar modelos com registro:', err);
          // Fallback para todos os modelos
          if (Array.isArray(modelosRes.data)) {
            setModelosComRegistro(modelosRes.data.map(m => m.Basic_Model));
          }
        }
      } catch (error) {
        console.error('Erro ao buscar opções:', error);
      }
    };
    fetchOptions();
  }, []);

  // Buscar dados quando filtros principais mudarem
  useEffect(() => {
    fetchDashboardData();
  }, [dateRange, modeloFilter]);

  // Resetar todos os filtros
  const resetFilters = () => {
    setDateRange(getWeekRange());
    setModeloFilter('');
    setPartFilter('');
    setCorFilter('');
    setFailureTestFilter('');
    setPlaceFilter('');
    message.success('Filtros resetados para a semana atual');
  };

  // Dados filtrados - aplica todos os filtros como um WHERE
  const filteredData = useMemo(() => {
    return rawData.filter(item => {
      if (modeloFilter && item.modelo !== modeloFilter) return false;
      if (partFilter && item.part !== partFilter) return false;
      if (corFilter && item.cor !== corFilter) return false;
      if (failureTestFilter && item.failure_test !== failureTestFilter) return false;
      if (placeFilter && item.place !== placeFilter) return false;
      return true;
    });
  }, [rawData, modeloFilter, partFilter, corFilter, failureTestFilter, placeFilter]);

  // Dados únicos para filtros dependentes
  const uniqueParts = useMemo(() => [...new Set(filteredData.map(item => item.part).filter(Boolean))], [filteredData]);
  const uniqueCores = useMemo(() => [...new Set(filteredData.map(item => item.cor).filter(Boolean))], [filteredData]);
  const uniqueFailures = useMemo(() => [...new Set(filteredData.map(item => item.failure_test).filter(Boolean))], [filteredData]);
  const uniquePlaces = useMemo(() => [...new Set(filteredData.map(item => item.place).filter(Boolean))], [filteredData]);

  // Dados para gráfico de custo por período
  const custoPorPeriodoData = useMemo(() => {
    const grouped = {};
    filteredData.forEach(item => {
      const data = item.data_hora ? dayjs(item.data_hora).format('DD/MM') : 'N/A';
      const custo = (parseFloat(item.custo_unitario) || 0) * (parseInt(item.qty_defect) || 0);
      if (!grouped[data]) grouped[data] = 0;
      grouped[data] += custo;
    });
    return Object.entries(grouped)
      .map(([periodo, custo]) => ({ periodo, custo }))
      .sort((a, b) => a.periodo.localeCompare(b.periodo));
  }, [filteredData]);

  // Dados para gráfico de defeitos por modelo
  const defeitosPorModeloData = useMemo(() => {
    const grouped = {};
    filteredData.forEach(item => {
      const modelo = item.modelo || 'N/A';
      const qty = parseInt(item.qty_defect) || 0;
      if (!grouped[modelo]) grouped[modelo] = 0;
      grouped[modelo] += qty;
    });
    return Object.entries(grouped)
      .map(([modelo, qty]) => ({ modelo, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10); // Top 10
  }, [filteredData]);

  // Dados para gráfico de failure test
  const failureTestData = useMemo(() => {
    const grouped = {};
    filteredData.forEach(item => {
      const failure = item.failure_test || 'Sem defeito';
      const qty = parseInt(item.qty_defect) || 0;
      if (!grouped[failure]) grouped[failure] = 0;
      grouped[failure] += qty;
    });
    return Object.entries(grouped)
      .map(([failure, qty]) => ({ failure, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8); // Top 8
  }, [filteredData]);

  // Dados para gráfico de qty por modelo
  const qtyPorModeloData = useMemo(() => {
    const grouped = {};
    filteredData.forEach(item => {
      const modelo = item.modelo || 'N/A';
      const qty = parseInt(item.qty_inspec) || 0;
      if (!grouped[modelo]) grouped[modelo] = 0;
      grouped[modelo] += qty;
    });
    return Object.entries(grouped)
      .map(([modelo, qty]) => ({ modelo, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8); // Top 8
  }, [filteredData]);

  // Dados para gráfico de defeitos por inspetor (nome)
  const defeitosPorInspetorData = useMemo(() => {
    const grouped = {};
    filteredData.forEach(item => {
      const nome = item.nome || 'N/A';
      const qty = parseInt(item.qty_defect) || 0;
      if (!grouped[nome]) grouped[nome] = 0;
      grouped[nome] += qty;
    });
    return Object.entries(grouped)
      .map(([nome, qty]) => ({ nome, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8); // Top 8
  }, [filteredData]);

  // Cores para os gráficos
  const colors = ['#4f46e5', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          padding: '20px 24px',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          color: '#fff',
        }}
      >
        <DashboardOutlined style={{ fontSize: 28 }} />
        <Title level={4} style={{ color: '#fff', margin: 0, fontWeight: 700, letterSpacing: '0.5px' }}>
          Dashboard - MX PQC Screening
        </Title>
      </div>

      {/* Cards de Resumo - Indicadores */}
      <Row gutter={[12, 12]} style={{ marginTop: 8 }}>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 8, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: '#fff', padding: '1px 12px' }} size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
                {filteredData.reduce((sum, item) => {
                  const custo = parseFloat(item.custo_unitario) || 0;
                  const qty = parseInt(item.qty_defect) || 0;
                  return sum + (custo * qty);
                }, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>Custo Total (R$)</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 8, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', padding: '1px 12px' }} size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
                {filteredData.reduce((sum, item) => sum + (parseInt(item.qty_inspec) || 0), 0).toLocaleString()}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>Total Inspecionado</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 8, background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#fff', padding: '1px 12px' }} size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
                {filteredData.reduce((sum, item) => sum + (parseInt(item.qty_defect) || 0), 0).toLocaleString()}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>Total de Defeitos</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filtros */}
      <Card style={{ borderRadius: 8, marginTop: 12 }} size="small">
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'flex-end',
        }}>
          <div style={{ flex: '1 1 220px' }}>
            <label style={{ fontWeight: 500, marginBottom: 4, display: 'block', fontSize: 13, color: '#555' }}>Período</label>
            <DatePicker.RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
              style={{ width: '100%' }}
              dropdownClassName="inspecmx-datepicker"
            />
          </div>
          <div style={{ flex: '1 1 180px' }}>
            <label style={{ fontWeight: 500, marginBottom: 4, display: 'block', fontSize: 13, color: '#555' }}>Modelo</label>
            <Select
              allowClear
              showSearch
              placeholder="Todos"
              value={modeloFilter || undefined}
              onChange={(val) => { setModeloFilter(val || ''); setPartFilter(''); setCorFilter(''); }}
              style={{ width: '100%' }}
              filterOption={(input, option) =>
                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {modelosComRegistro.map(m => (
                <Select.Option key={m} value={m}>{m}</Select.Option>
              ))}
            </Select>
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ fontWeight: 500, marginBottom: 4, display: 'block', fontSize: 13, color: '#555' }}>Part</label>
            <Select
              allowClear
              showSearch
              placeholder="Todos"
              value={partFilter || undefined}
              onChange={(val) => setPartFilter(val || '')}
              style={{ width: '100%' }}
              filterOption={(input, option) =>
                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {uniqueParts.map(p => (
                <Select.Option key={p} value={p}>{p}</Select.Option>
              ))}
            </Select>
          </div>
          <div style={{ flex: '1 1 130px' }}>
            <label style={{ fontWeight: 500, marginBottom: 4, display: 'block', fontSize: 13, color: '#555' }}>Cor</label>
            <Select
              allowClear
              showSearch
              placeholder="Todas"
              value={corFilter || undefined}
              onChange={(val) => setCorFilter(val || '')}
              style={{ width: '100%' }}
              filterOption={(input, option) =>
                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {uniqueCores.map(c => (
                <Select.Option key={c} value={c}>{c}</Select.Option>
              ))}
            </Select>
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <label style={{ fontWeight: 500, marginBottom: 4, display: 'block', fontSize: 13, color: '#555' }}>Failure Test</label>
            <Select
              allowClear
              showSearch
              placeholder="Todos"
              value={failureTestFilter || undefined}
              onChange={(val) => setFailureTestFilter(val || '')}
              style={{ width: '100%' }}
              filterOption={(input, option) =>
                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {uniqueFailures.map(f => (
                <Select.Option key={f} value={f}>{f}</Select.Option>
              ))}
            </Select>
          </div>
          <div style={{ flex: '1 1 130px' }}>
            <label style={{ fontWeight: 500, marginBottom: 4, display: 'block', fontSize: 13, color: '#555' }}>Place</label>
            <Select
              allowClear
              placeholder="Todos"
              value={placeFilter || undefined}
              onChange={(val) => setPlaceFilter(val || '')}
              style={{ width: '100%' }}
            >
              {uniquePlaces.map(p => (
                <Select.Option key={p} value={p}>{p}</Select.Option>
              ))}
            </Select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              icon={<SearchOutlined />}
              onClick={fetchDashboardData}
              loading={loading}
              title="Atualizar dados"
              style={{
                backgroundColor: '#1890ff',
                color: '#fff',
                border: '1px solid #1890ff'
              }}
            >
              Buscar
            </Button>
            <Button
              icon={<CloseOutlined />}
              onClick={resetFilters}
              title="Resetar filtros para semana atual"
              style={{
                backgroundColor: '#ff4d4f',
                color: '#fff',
                border: '1px solid #ff4d4f'
              }}
            >
              Resetar Filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* Gráfico de Custo por Período - Área com gradiente verde */}
      <Card title="Custo por Período (R$)" style={{ borderRadius: 8 }} size="small">
        <div style={{ width: '100%', height: 340 }}>
          <ResponsiveContainer>
            <AreaChart data={custoPorPeriodoData} margin={{ top: 30, right: 30, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="colorCusto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="periodo" tick={{ fontSize: 12 }} interval={0} angle={-10} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `R$ ${value.toFixed(0)}`} width={70} />
              <RechartsTooltip 
                formatter={(value) => [`R$ ${value.toFixed(2)}`, 'Custo']}
                contentStyle={{ borderRadius: 8, borderColor: '#10b981' }}
              />
              <Area 
                type="monotone" 
                dataKey="custo" 
                stroke="#059669" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorCusto)" 
                label={{ 
                  position: 'top', 
                  fontSize: 11, 
                  fontWeight: 600,
                  fill: '#047857',
                  formatter: (v) => `R$ ${v.toFixed(0)}` 
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Primeira linha de gráficos */}
      <Row gutter={[16, 16]}>
        {/* Defeitos por Modelo */}
        <Col xs={24} lg={12}>
          <Card title="Quantidade de Defeitos por Modelo" style={{ borderRadius: 8, height: '100%' }} size="small">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={defeitosPorModeloData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="modelo" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={70} interval={0} />
                  <YAxis tick={{ fontSize: 12 }} width={40} />
                  <RechartsTooltip contentStyle={{ borderRadius: 8 }} />
                  <Bar dataKey="qty" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={30}>
                    <LabelList dataKey="qty" position="top" fontSize={11} fontWeight={600} fill="#312e81" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Failure Test */}
        <Col xs={24} lg={12}>
          <Card title="Top Failure Tests" style={{ borderRadius: 8, height: '100%' }} size="small">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={failureTestData} layout="vertical" margin={{ left: 20, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} width={30} />
                  <YAxis dataKey="failure" type="category" tick={{ fontSize: 9 }} width={130} interval={0} />
                  <RechartsTooltip contentStyle={{ borderRadius: 8 }} />
                  <Bar dataKey="qty" fill="#7c3aed" radius={[0, 4, 4, 0]} barSize={25}>
                    <LabelList dataKey="qty" position="right" fontSize={11} fontWeight={600} fill="#5b21b6" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Segunda linha de gráficos */}
      <Row gutter={[16, 16]}>
        {/* Quantidade por Modelo */}
        <Col xs={24} lg={12}>
          <Card title="Quantidade Inspecionada por Modelo" style={{ borderRadius: 8, height: '100%' }} size="small">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={qtyPorModeloData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="modelo" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={70} interval={0} />
                  <YAxis tick={{ fontSize: 12 }} width={40} />
                  <RechartsTooltip contentStyle={{ borderRadius: 8 }} />
                  <Bar dataKey="qty" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={30}>
                    <LabelList dataKey="qty" position="top" fontSize={11} fontWeight={600} fill="#0e7490" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Quantidade por Inspetor */}
        <Col xs={24} lg={12}>
          <Card title="Quantidade por Inspetor" style={{ borderRadius: 8, height: '100%' }} size="small">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={defeitosPorInspetorData} layout="vertical" margin={{ left: 20, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} width={30} />
                  <YAxis dataKey="nome" type="category" tick={{ fontSize: 9 }} width={130} interval={0} />
                  <RechartsTooltip contentStyle={{ borderRadius: 8 }} />
                  <Bar dataKey="qty" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={25}>
                    <LabelList dataKey="qty" position="right" fontSize={11} fontWeight={600} fill="#b45309" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// Componente Principal
const InspecMX = () => {
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const historicoRef = useRef();

  // Função para atualizar o histórico
  const updateHistorico = () => {
    // Forçar atualização do histórico quando um novo registro for salvo
    if (historicoRef.current && typeof historicoRef.current.fetchData === 'function') {
      historicoRef.current.fetchData();
    }
  };

  return (
    <React.Fragment>
      <style>{`
        /* Ajustes para o datepicker - Dashboard e Histórico */
        .inspecmx-datepicker .ant-picker-calendar-header {
          background-color: #f5f5f5 !important;
        }
        .inspecmx-datepicker .ant-picker-calendar-header th {
          background-color: transparent !important;
          color: #333333 !important;
        }
        .inspecmx-datepicker thead th {
          background-color: #f5f5f5 !important;
          color: #333333 !important;
        }
        .inspecmx-datepicker .ant-picker-content th {
          background-color: #f5f5f5 !important;
          color: #333333 !important;
          font-weight: normal !important;
        }
        /* Ajuste para visibilidade dos dias da semana no range picker */
        .ant-picker-panel thead th {
          color: #333333 !important;
          font-weight: 600 !important;
        }
        .ant-picker-cell-in-view {
          color: #333333 !important;
        }
        .ant-picker-cell-selected .ant-picker-cell-inner {
          color: #fff !important;
          font-weight: bold !important;
        }
      `}</style>
      <ConfigProvider
        theme={{
         
          token: {
            colorPrimary: '#4f46e5',
            borderRadius: 6,
          },
          components: {
            DatePicker: {
              colorText: '#333333',
              colorTextHeading: '#333333',
              colorTextPlaceholder: '#999',
              colorBgContainer: '#ffffff',
              colorBorder: '#d9d9d9',
              colorBgElevated: '#ffffff',
              colorBgBase: '#f5f5f5',
            },
          },
        }}
      >
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#f0f2f5',
          padding: '24px 16px',
        }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>

          {/* Card principal */}
          <Card
            style={{
              borderRadius: 12,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              border: '1px solid #e8e8e8',
            }}
            styles={{ body: { padding: 0 } }}
          >
            <Tabs
              defaultActiveKey="dashboard"
              centered
              size="large"
              style={{ padding: '0 16px' }}
              items={[
                {
                  key: 'dashboard',
                  label: (
                    <span>
                      <DashboardOutlined style={{ marginRight: 6 }} />
                      Dashboard
                    </span>
                  ),
                  children: (
                    <div style={{ padding: '8px 4px 20px' }}>
                      <DashboardTab />
                    </div>
                  ),
                },
                {
                  key: 'registro',
                  label: (
                    <span>
                      <FormOutlined style={{ marginRight: 6 }} />
                      Registro
                    </span>
                  ),
                  children: (
                    <div style={{ padding: '8px 4px 20px' }}>
                      <RegistroTab onRegistroSalvo={updateHistorico} />
                    </div>
                  ),
                },
                {
                  key: 'historico',
                  label: (
                    <span>
                      <HistoryOutlined style={{ marginRight: 6 }} />
                      Histórico
                    </span>
                  ),
                  children: (
                    <div style={{ padding: '8px 4px 20px' }}>
                      <HistoricoTab ref={historicoRef} />
                    </div>
                  ),
                },
                {
                  key: 'admin',
                  label: (
                    <span>
                      <SettingOutlined style={{ marginRight: 6 }} />
                      Admin
                    </span>
                  ),
                  children: (
                    <div style={{ padding: '8px 4px 20px' }}>
                      {adminAuthenticated ? (
                        <AdminCRUD 
                          onLogout={() => setAdminAuthenticated(false)} 
                        />
                      ) : (
        <AdminLogin 
          onLoginSuccess={() => setAdminAuthenticated(true)} 
        />
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </div>
      </div>
    </ConfigProvider>
    </React.Fragment>
  );
};

export default InspecMX;
