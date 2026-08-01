import React, { useEffect, useMemo, useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import '../HoraProd/HoraProd.css';
import Axios from 'axios';
import { Box } from "@mui/system";
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import { CircularProgress } from "@mui/material";
import Breadcrumbs from '@mui/material/Breadcrumbs';
import { Typography } from '@mui/material';
import { Helmet } from 'react-helmet';
import Link from '@mui/material/Link';
import Header from '../../Layout/MGSPHead/Header';
import * as XLSX from "xlsx";

// Configurações por turno - mapeia colunas do banco (h0-h23) para turnos
// Baseado na estrutura do HoraHoraMounter
const TURNOS_CONFIG = {
  '1T': {
    horasCampos: ['h7', 'h8', 'h9', 'h10', 'h11', 'h12', 'h13', 'h14', 'h15', 'h16'],
    horasLabels: ['07:55', '08:55', '09:55', '10:55', '11:55', '12:55', '13:55', '14:55', '15:55', '16:45']
  },
  '2T': {
    horasCampos: ['h17', 'h18', 'h19', 'h20', 'h21', 'h22', 'h23', 'h0', 'h2'],
    horasLabels: ['17:55', '18:55', '19:55', '20:55', '21:55', '22:55', '23:55', '00:55', '02:10']
  },
  '3T': {
    horasCampos: ['h2', 'h3', 'h4', 'h5', 'h6'],
    horasLabels: ['02:55', '03:55', '04:55', '05:55', '06:55']
  }
};

export default function HoraPlanResult() {
  const [turno, setTurno] = useState('1T');
  const [listCard, setListCard] = useState([]);
  const [listCardAllTurnos, setListCardAllTurnos] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModelos, setSelectedModelos] = useState([]);
  const [modeloDropdownOpen, setModeloDropdownOpen] = useState(false);
  const [groupByModel, setGroupByModel] = useState(false);
  const [groupByLine, setGroupByLine] = useState(false);
  const [expandedTurnos, setExpandedTurnos] = useState({});
  const [showHC29, setShowHC29] = useState(true);

  const config = useMemo(() => {
    if (turno === 'DIA') {
      return {
        horasCampos: [...TURNOS_CONFIG['1T'].horasCampos, ...TURNOS_CONFIG['2T'].horasCampos, ...TURNOS_CONFIG['3T'].horasCampos],
        horasLabels: [...TURNOS_CONFIG['1T'].horasLabels, ...TURNOS_CONFIG['2T'].horasLabels, ...TURNOS_CONFIG['3T'].horasLabels]
      };
    }
    return TURNOS_CONFIG[turno];
  }, [turno]);

  // Fetch data from plan_vs_result_hourly (com targets do backend)
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await Axios.get(`http://105.103.39.102:8080/planVsResultHourly?data=${date}`);
        setListCard(response.data);
        setListCardAllTurnos(response.data);
      } catch (error) {
        console.error('Erro ao buscar dados Plan vs Result Hourly:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [date]);

  // Modelos únicos extraídos dos dados (PROC_TYPE_NM)
  const uniqueModelos = useMemo(() => {
    const modelos = [...new Set(listCard.map(item => item.PROC_TYPE_NM).filter(Boolean))];
    return modelos.sort();
  }, [listCard]);


  // Linhas únicas - ordenação numérica (SMD-16, SMD-17, SMD-18, etc.)
  const uniqueLines = useMemo(() => {
    const lines = [...new Set(listCard.map(item => item.LINE_NM).filter(Boolean))];
    return lines.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
  }, [listCard]);

  // Dados filtrados por modelo e modelo
  const filteredListCard = useMemo(() => {
    let filtered = listCard;

    // Filtrar HC29 (modelos sem plano = 0)
    if (!showHC29) {
      filtered = filtered.filter(row => (row.PLAN_QTY || 0) > 0);
    }

    if (selectedModelos.length > 0) {
      filtered = filtered.filter(row => selectedModelos.includes(row.PROC_TYPE_NM));
    }

    // Ordenar linhas numericamente
    filtered = [...filtered].sort((a, b) => {
      const numA = parseInt(a.LINE_NM.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.LINE_NM.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    if (groupByModel || groupByLine) {
      const grouped = {};

      filtered.forEach(row => {
        let key;
        if (groupByModel && groupByLine) {
          key = `${row.PROC_TYPE_NM}_${row.LINE_NM}`;
        } else if (groupByModel) {
          key = row.PROC_TYPE_NM;
        } else {
          key = row.LINE_NM;
        }

        if (!grouped[key]) {
          grouped[key] = {
            PROC_TYPE_NM: row.PROC_TYPE_NM,
            MODEL_CODE: row.MODEL_CODE,
            LINE_NM: row.LINE_NM,
            PLAN_QTY: 0,
            ACRS_QTY: 0
          };
          config.horasCampos.forEach(campo => {
            grouped[key][campo] = 0;
          });
        }

        grouped[key].PLAN_QTY += row.PLAN_QTY || 0;
        grouped[key].ACRS_QTY += row.ACRS_QTY || 0;
        config.horasCampos.forEach(campo => {
          grouped[key][campo] += parseInt(row[campo]) || 0;
        });
      });

      const groupedArray = Object.values(grouped);
      return groupedArray.sort((a, b) => {
        if (groupByModel && groupByLine) {
          const numA = parseInt(a.LINE_NM.replace(/\D/g, '')) || 0;
          const numB = parseInt(b.LINE_NM.replace(/\D/g, '')) || 0;
          return numA - numB;
        } else if (groupByModel) {
          // Primeiro ordena por modelo, depois por linha numericamente
          const modelCompare = (a.PROC_TYPE_NM || '').localeCompare(b.PROC_TYPE_NM || '');
          if (modelCompare !== 0) return modelCompare;

          const lineANum = parseInt((a.LINE_NM || '').replace(/\D/g, '')) || 0;
          const lineBNum = parseInt((b.LINE_NM || '').replace(/\D/g, '')) || 0;
          return lineANum - lineBNum;
        } else {
          const numA = parseInt(a.LINE_NM.replace(/\D/g, '')) || 0;
          const numB = parseInt(b.LINE_NM.replace(/\D/g, '')) || 0;
          return numA - numB;
        }
      });
    }

    return filtered;
  }, [listCard, selectedModelos, groupByModel, groupByLine, showHC29, config.horasCampos]);

  // Reset filtro quando trocar data ou turno
  useEffect(() => {
    setSelectedModelos([]);
    setGroupByModel(false);
    setGroupByLine(false);
  }, [date, turno]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modeloDropdownOpen && !e.target.closest('.modelo-filter-container')) {
        setModeloDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [modeloDropdownOpen]);

  // Calcular soma das horas para cada linha (apenas horas do turno atual)
  const calculateTotalHours = (row) => {
    return config.horasCampos.reduce((acc, campo) => {
      return acc + (parseInt(row[campo]) || 0);
    }, 0);
  };

  // Calcular rendimento (ACRS_QTY / PLAN_QTY * 100)
  const calculateProgressRate = (row) => {
    if (row.PLAN_QTY && row.PLAN_QTY > 0) {
      return ((row.ACRS_QTY / row.PLAN_QTY) * 100).toFixed(1);
    }
    return '0.0';
  };

  // Calcular diferença
  const calculateDiff = (row) => {
    return (row.ACRS_QTY || 0) - (row.PLAN_QTY || 0);
  };

  // Determinar cor da célula baseada no progresso
  const getCellColorClass = (actual, plan) => {
    if (!plan || plan === 0) return 'cell-gray';

    if (actual === 0) return 'cell-gray';

    const percentage = (actual / plan) * 100;

    if (percentage >= 100) {
      return 'cell-green';
    } else if (percentage >= 70) {
      return 'cell-yellow';
    } else {
      return 'cell-red';
    }
  };

  // Determinar classe de rendimento baseada no progresso
  const getProgressRateClass = (rate) => {
    const percentage = parseFloat(rate);
    if (percentage >= 90) {
      return 'rendimento-good';
    } else if (percentage >= 50) {
      return 'rendimento-medium';
    } else {
      return 'rendimento-default';
    }
  };

  // Calcular totais de todas as colunas
  const calculateTotals = useMemo(() => {
    if (filteredListCard.length === 0) {
      return null;
    }

    let totalPlan = 0;
    let totalAcrs = 0;
    const totalHoras = {};

    config.horasCampos.forEach(campo => {
      totalHoras[campo] = 0;
    });

    filteredListCard.forEach(row => {
      totalPlan += row.PLAN_QTY || 0;
      totalAcrs += row.ACRS_QTY || 0;
      config.horasCampos.forEach(campo => {
        totalHoras[campo] += parseInt(row[campo]) || 0;
      });
    });

    const totalProgressRate = totalPlan > 0 ? ((totalAcrs / totalPlan) * 100).toFixed(1) : '0.0';

    return {
      totalPlan,
      totalAcrs,
      totalHoras,
      totalProgressRate,
      totalDiff: totalAcrs - totalPlan
    };
  }, [filteredListCard, config.horasCampos]);

  // Gerar cabeçalhos de N°H dinamicamente
  const renderNumeroHHeaders = () => {
    const headers = [];
    for (let i = 1; i <= config.horasCampos.length; i++) {
      headers.push(<th key={i}>{i}°H</th>);
    }
    return headers;
  };

  const handleClick = (event) => {
    console.info('You clicked a breadcrumb.');
  };

  return (
    <>
      <div className='justify-content-center'>
        <Helmet>
          <title>Plan vs Result - Horário</title>
        </Helmet>

        <Box>
          {/* Toolbar compacta */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            marginTop: 8,
            backgroundColor: '#fff',
            borderRadius: 8,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
          }}>
            {/* Título à esquerda */}
            <span style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', letterSpacing: '-0.3px' }}>
              PLAN VS RESULT - HORÁRIO
            </span>

            {/* Lado direito: Data + Turno + Filtros + Indicador + Excel */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#f5f5f5',
                borderRadius: 6,
                padding: '4px 8px',
                border: '1px solid #e0e0e0'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" style={{ marginRight: 4, color: '#666' }}>
                  <path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2m0 16H5V10h14z"/>
                </svg>
                <input
                  style={{
                    border: 'none',
                    outline: 'none',
                    fontSize: 13,
                    fontWeight: 500,
                    backgroundColor: 'transparent',
                    color: '#333',
                    width: 130,
                    padding: '2px 0'
                  }}
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              {/* Filtro de Modelos */}
              <div className="modelo-filter-container" style={{ position: 'relative' }}>
                <button
                  onClick={() => setModeloDropdownOpen(!modeloDropdownOpen)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: selectedModelos.length > 0 ? '#e3f2fd' : '#f5f5f5',
                    border: `1px solid ${selectedModelos.length > 0 ? '#90caf9' : '#e0e0e0'}`,
                    borderRadius: 6,
                    padding: '5px 10px',
                    fontSize: 12,
                    fontWeight: 500,
                    color: '#333',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    minWidth: 120,
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                      <path fill="currentColor" d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
                    </svg>
                    {selectedModelos.length === 0 ? 'Modelos' : `${selectedModelos.length} selecionado${selectedModelos.length > 1 ? 's' : ''}`}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" style={{ flexShrink: 0, transition: 'transform 0.2s', transform: modeloDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                    <path fill="currentColor" d="M7 10l5 5 5-5z"/>
                  </svg>
                </button>

                {modeloDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: 4,
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 100,
                    minWidth: 200,
                    maxHeight: 280,
                    overflowY: 'auto',
                    padding: '4px 0'
                  }}>
                    {/* Selecionar Todos */}
                    <div
                      onClick={() => setSelectedModelos([])}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                        color: selectedModelos.length === 0 ? '#393D7E' : '#666',
                        backgroundColor: selectedModelos.length === 0 ? '#f0f0ff' : 'transparent',
                        borderBottom: '1px solid #eee',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M3 13h2v-2H3zm0 4h2v-2H3zm0-8h2V7H3zm4 4h14v-2H7zm0 4h14v-2H7zM7 7v2h14V7z"/>
                      </svg>
                      Todos
                    </div>
                    {uniqueModelos.map((modelo) => (
                      <div
                        key={modelo}
                        onClick={() => {
                          setSelectedModelos(prev =>
                            prev.includes(modelo)
                              ? prev.filter(m => m !== modelo)
                              : [...prev, modelo]
                          );
                        }}
                        style={{
                          padding: '7px 12px',
                          cursor: 'pointer',
                          fontSize: 12,
                          color: '#333',
                          backgroundColor: selectedModelos.includes(modelo) ? '#e3f2fd' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          if (!selectedModelos.includes(modelo)) e.currentTarget.style.backgroundColor = '#f5f5f5';
                        }}
                        onMouseLeave={(e) => {
                          if (!selectedModelos.includes(modelo)) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <div style={{
                          width: 16,
                          height: 16,
                          border: `2px solid ${selectedModelos.includes(modelo) ? '#393D7E' : '#bbb'}`,
                          borderRadius: 3,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: selectedModelos.includes(modelo) ? '#393D7E' : 'transparent',
                          transition: 'all 0.15s',
                          flexShrink: 0
                        }}>
                          {selectedModelos.includes(modelo) && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24">
                              <path fill="white" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                          )}
                        </div>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{modelo}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{
                display: 'inline-flex',
                backgroundColor: '#f0f0f0',
                borderRadius: 8,
                padding: 3,
                gap: 2
              }}>
                {['1T', '2T', '3T', 'DIA'].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      if (t === 'DIA') {
                        setTurno('DIA');
                        setExpandedTurnos({});
                      } else {
                        setTurno(t);
                      }
                    }}
                    style={{
                      padding: '6px 18px',
                      fontSize: 13,
                      fontWeight: turno === t ? 700 : 500,
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: turno === t ? '#393D7E' : 'transparent',
                      color: turno === t ? '#fff' : '#555',
                      boxShadow: turno === t ? '0 2px 6px rgba(57,61,126,0.3)' : 'none',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center'
              }}>
                {/* Toggle Modelo */}
                <div
                  onClick={() => setGroupByModel(!groupByModel)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 20,
                    backgroundColor: groupByModel ? '#393D7E' : '#f0f0f0',
                    border: `1px solid ${groupByModel ? '#393D7E' : '#ddd'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: 12,
                    fontWeight: 500,
                    color: groupByModel ? '#fff' : '#666',
                    userSelect: 'none'
                  }}
                  title="Agrupar por modelo"
                >
                  <div style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    border: `2px solid ${groupByModel ? '#fff' : '#aaa'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: groupByModel ? 'rgba(255,255,255,0.3)' : 'transparent'
                  }}>
                    {groupByModel && <span style={{fontSize: 10, color: '#fff'}}>✓</span>}
                  </div>
                  Modelo
                </div>

                {/* Toggle Linha */}
                <div
                  onClick={() => setGroupByLine(!groupByLine)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 20,
                    backgroundColor: groupByLine ? '#393D7E' : '#f0f0f0',
                    border: `1px solid ${groupByLine ? '#393D7E' : '#ddd'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: 12,
                    fontWeight: 500,
                    color: groupByLine ? '#fff' : '#666',
                    userSelect: 'none'
                  }}
                  title="Agrupar por linha"
                >
                  <div style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    border: `2px solid ${groupByLine ? '#fff' : '#aaa'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: groupByLine ? 'rgba(255,255,255,0.3)' : 'transparent'
                  }}>
                    {groupByLine && <span style={{fontSize: 10, color: '#fff'}}>✓</span>}
                  </div>
                  Linha
                </div>

                {/* Toggle HC29 */}
                <div
                  onClick={() => setShowHC29(!showHC29)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 20,
                    backgroundColor: showHC29 ? '#ff9800' : '#f0f0f0',
                    border: `1px solid ${showHC29 ? '#ff9800' : '#ddd'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: 12,
                    fontWeight: 500,
                    color: showHC29 ? '#fff' : '#666',
                    userSelect: 'none'
                  }}
                  title="Mostrar/ocultar HC29 (sem plano)"
                >
                  <div style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    border: `2px solid ${showHC29 ? '#fff' : '#aaa'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: showHC29 ? 'rgba(255,255,255,0.3)' : 'transparent'
                  }}>
                    {showHC29 && <span style={{fontSize: 10, color: '#fff'}}>✓</span>}
                  </div>
                  HC29
                </div>
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: '#e8f5e9',
                padding: '6px 16px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 700,
                color: '#2e7d32',
                whiteSpace: 'nowrap'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M3 13h2v-2H3zm0 4h2v-2H3zm0-8h2V7H3zm4 4h14v-2H7zm0 4h14v-2H7zM7 7v2h14V7z"/>
                </svg>
                {uniqueLines.length} linhas
              </div>

              <button
                onClick={() => {
                  const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
                  const fileExtension = ".xlsx";
                  const ws = XLSX.utils.json_to_sheet(listCard);
                  const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
                  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
                  const data = new Blob([excelBuffer], { type: fileType });
                  const link = document.createElement('a');
                  const url = URL.createObjectURL(data);
                  link.href = url;
                  link.download = `Plan_Result_Hourly_${turno}_${date}` + fileExtension;
                  link.style.display = 'none';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  setTimeout(() => URL.revokeObjectURL(url), 100);
                }}
                title="Exportar Excel"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  border: '1px solid #c8ccd0',
                  borderRadius: 6,
                  backgroundColor: '#f0f4f8',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  padding: 0,
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#d6e4f0';
                  e.currentTarget.style.borderColor = '#90b0d0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f4f8';
                  e.currentTarget.style.borderColor = '#c8ccd0';
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#1D6F42" opacity="0.15"/>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="#1D6F42" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  <path d="M14 2v6h6" stroke="#1D6F42" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <text x="8.5" y="18.5" fontSize="8" fontWeight="bold" fill="#1D6F42" fontFamily="Arial">X</text>
                </svg>
              </button>
            </div>
          </div>

          {/* Indicadores de Performance */}
          {filteredListCard.length > 0 && (() => {
            const totalPlan = filteredListCard.reduce((sum, row) => sum + (row.PLAN_QTY || 0), 0);
            const totalAcrs = filteredListCard.reduce((sum, row) => sum + (row.ACRS_QTY || 0), 0);
            const totalDiff = totalAcrs - totalPlan;
            const progressRate = totalPlan > 0 ? ((totalAcrs / totalPlan) * 100).toFixed(1) : 0;
            const totalItems = filteredListCard.length;
            const hc29Count = listCard.filter(row => (row.PLAN_QTY || 0) === 0).length;

            return (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                marginBottom: 10,
                backgroundColor: '#fff',
                padding: '8px 10px',
                borderRadius: 6,
                border: '1px solid #e0e0e0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}>
                {/* Plan */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  padding: '6px 8px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: 4,
                  borderLeft: '3px solid #3A59D1'
                }}>
                  <span style={{ fontSize: 8, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.2 }}>Plan</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#1a1a2e' }}>{totalPlan.toLocaleString()}</span>
                  <div style={{ height: 2, backgroundColor: '#e8e8e8', borderRadius: 1, overflow: 'hidden', marginTop: 1 }}>
                    <div style={{ height: '100%', backgroundColor: '#3A59D1', width: '100%' }}></div>
                  </div>
                </div>

                {/* Result com Rate */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  padding: '6px 8px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: 4,
                  borderLeft: '3px solid #2e7d32'
                }}>
                  <span style={{ fontSize: 8, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.2 }}>Result</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#1a1a2e' }}>{totalAcrs.toLocaleString()}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: progressRate >= 90 ? '#2e7d32' : progressRate >= 70 ? '#ff9800' : '#d32f2f' }}>
                      {progressRate}%
                    </span>
                  </div>
                  <div style={{ height: 2, backgroundColor: '#e8e8e8', borderRadius: 1, overflow: 'hidden', marginTop: 1 }}>
                    <div style={{
                      height: '100%',
                      backgroundColor: progressRate >= 90 ? '#66bb6a' : progressRate >= 70 ? '#ffb74d' : '#ef5350',
                      width: `${Math.min(progressRate, 100)}%`
                    }}></div>
                  </div>
                </div>

                {/* HC29 e Items */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  padding: '6px 8px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: 4,
                  borderLeft: '3px solid #ff9800'
                }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center', flex: 1 }}>
                      <span style={{ fontSize: 7, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.2 }}>HC29</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#ff9800' }}>{hc29Count}</span>
                    </div>
                    <div style={{ width: 1, height: 20, backgroundColor: '#e8e8e8' }}></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center', flex: 1 }}>
                      <span style={{ fontSize: 7, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.2 }}>Items</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#1a1a2e' }}>{totalItems}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          <TableContainer>
            <Table className='hora-prod-table unificada-table' style={{ marginTop: 6 }}>
              <TableHead>
                {turno !== 'DIA' ? (
                  <>
                    <TableRow>
                      <TableCell colSpan={4} style={{ width: '28%', backgroundColor: '#f8f9fa', border: 'none', borderBottom: 'none', padding: '4px 8px' }}></TableCell>

                      {config.horasLabels.map((label, i) => (
                        <TableCell key={i} style={{ width: '5%', backgroundColor: '#f8f9fa', border: 'none', borderBottom: 'none', fontSize: '11px', fontWeight: 'bold', color: '#393D7E', padding: '4px 4px', textAlign: 'center' }}>
                          {label}
                        </TableCell>
                      ))}
                      <TableCell colSpan={4} style={{ width: '21%', backgroundColor: '#f8f9fa', border: 'none', borderBottom: 'none', padding: '4px' }}></TableCell>
                    </TableRow>

                    <TableRow className='head-of-head'>
                      <th>Line</th>
                      <th>Model</th>
                      <th style={{ backgroundColor: '#3A59D1' }} className='target-column'>Plan</th>
                      <th style={{ backgroundColor: '#3A59D1' }} className='target-column'>Target</th>
                      {renderNumeroHHeaders()}
                      <th>Total</th>
                      <th>Diff</th>
                      <th>TTL Acc (%)</th>
                    </TableRow>
                  </>
                ) : (
                  <>
                    {/* Primeira linha: Horários */}
                    <TableRow style={{ backgroundColor: '#f8f9fa' }}>
                      <TableCell colSpan={4} style={{ border: 'none', padding: '4px 8px' }}></TableCell>

                      {expandedTurnos['1T'] && (
                        TURNOS_CONFIG['1T'].horasCampos.map((campo, i) => (
                          <TableCell key={`1T-h-label-${i}`} style={{ border: 'none', padding: '4px 4px', fontSize: '11px', fontWeight: 600, color: '#1976d2', textAlign: 'center', width: 45, minWidth: 45 }}>
                            {TURNOS_CONFIG['1T'].horasLabels[i]}
                          </TableCell>
                        ))
                      )}

                      {expandedTurnos['2T'] && (
                        TURNOS_CONFIG['2T'].horasCampos.map((campo, i) => (
                          <TableCell key={`2T-h-label-${i}`} style={{ border: 'none', padding: '4px 4px', fontSize: '11px', fontWeight: 600, color: '#d97706', textAlign: 'center', width: 45, minWidth: 45 }}>
                            {TURNOS_CONFIG['2T'].horasLabels[i]}
                          </TableCell>
                        ))
                      )}

                      {expandedTurnos['3T'] && (
                        TURNOS_CONFIG['3T'].horasCampos.map((campo, i) => (
                          <TableCell key={`3T-h-label-${i}`} style={{ border: 'none', padding: '4px 4px', fontSize: '11px', fontWeight: 600, color: '#7c3aed', textAlign: 'center', width: 45, minWidth: 45 }}>
                            {TURNOS_CONFIG['3T'].horasLabels[i]}
                          </TableCell>
                        ))
                      )}

                      <TableCell colSpan={3} style={{ border: 'none', padding: '4px 8px' }}></TableCell>
                    </TableRow>

                    {/* Segunda linha: Labels e Números */}
                    <TableRow style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, fontSize: 12, width: 60, minWidth: 60, color: '#1a1a2e' }}>Line</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, fontSize: 12, width: 80, minWidth: 80, color: '#1a1a2e' }}>Model</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, fontSize: 12, backgroundColor: '#3A59D1', color: '#fff', width: 50, minWidth: 50 }}>Plan</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, fontSize: 12, backgroundColor: '#3A59D1', color: '#fff', width: 50, minWidth: 50 }}>Target</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, fontSize: 12, cursor: 'pointer', backgroundColor: expandedTurnos['1T'] ? '#4B6CB8' : '#D4DDF7', color: expandedTurnos['1T'] ? '#fff' : '#1a1a2e', transition: 'all 0.2s', width: 50, minWidth: 50 }} onClick={() => setExpandedTurnos({...expandedTurnos, '1T': !expandedTurnos['1T']})}>
                        1T <span style={{ fontSize: 11, transition: 'transform 0.2s', display: 'inline-block', transform: expandedTurnos['1T'] ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
                      </th>
                      {expandedTurnos['1T'] && (
                        TURNOS_CONFIG['1T'].horasCampos.map((campo, i) => (
                          <th key={`1T-num-${i}`} style={{ padding: '10px 4px', textAlign: 'center', fontWeight: 600, fontSize: 10, backgroundColor: '#D4DDF7', color: '#1a1a2e', width: 45, minWidth: 45 }}>
                            {i + 1}°H
                          </th>
                        ))
                      )}
                      <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, fontSize: 12, cursor: 'pointer', backgroundColor: expandedTurnos['2T'] ? '#C59964' : '#F2E5D5', color: expandedTurnos['2T'] ? '#fff' : '#1a1a2e', transition: 'all 0.2s', width: 50, minWidth: 50 }} onClick={() => setExpandedTurnos({...expandedTurnos, '2T': !expandedTurnos['2T']})}>
                        2T <span style={{ fontSize: 11, transition: 'transform 0.2s', display: 'inline-block', transform: expandedTurnos['2T'] ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
                      </th>
                      {expandedTurnos['2T'] && (
                        TURNOS_CONFIG['2T'].horasCampos.map((campo, i) => (
                          <th key={`2T-num-${i}`} style={{ padding: '10px 4px', textAlign: 'center', fontWeight: 600, fontSize: 10, backgroundColor: '#F2E5D5', color: '#1a1a2e', width: 45, minWidth: 45 }}>
                            {i + 1}°H
                          </th>
                        ))
                      )}
                      <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, fontSize: 12, cursor: 'pointer', backgroundColor: expandedTurnos['3T'] ? '#7A5E8F' : '#E8DFF5', color: expandedTurnos['3T'] ? '#fff' : '#1a1a2e', transition: 'all 0.2s', width: 50, minWidth: 50 }} onClick={() => setExpandedTurnos({...expandedTurnos, '3T': !expandedTurnos['3T']})}>
                        3T <span style={{ fontSize: 11, transition: 'transform 0.2s', display: 'inline-block', transform: expandedTurnos['3T'] ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
                      </th>
                      {expandedTurnos['3T'] && (
                        TURNOS_CONFIG['3T'].horasCampos.map((campo, i) => (
                          <th key={`3T-num-${i}`} style={{ padding: '10px 4px', textAlign: 'center', fontWeight: 600, fontSize: 10, backgroundColor: '#E8DFF5', color: '#1a1a2e', width: 45, minWidth: 45 }}>
                            {i + 1}°H
                          </th>
                        ))
                      )}
                      <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, fontSize: 12, width: 55, minWidth: 55, color: '#1a1a2e' }}>Total</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, fontSize: 12, width: 50, minWidth: 50, color: '#1a1a2e' }}>Diff</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, fontSize: 12, width: 70, minWidth: 70, color: '#1a1a2e' }}>TTL Acc (%)</th>
                    </TableRow>
                  </>
                )}
              </TableHead>

              <TableBody>
                {turno !== 'DIA' ? (
                  filteredListCard.map((row, index) => {
                    const diff = calculateDiff(row);

                    // Cálculo acumulativo baseado em TARGET
                    const horariosValidos = config.horasCampos.filter(campo => {
                      const valor = parseInt(row[campo]) || 0;
                      return valor > 0;
                    });

                    const somaProducao = horariosValidos.reduce((acc, campo) => {
                      return acc + (parseInt(row[campo]) || 0);
                    }, 0);

                    const target = row.TARGET || row.PLAN_QTY;
                    const metaAcumulada = (parseInt(target) || 0) * horariosValidos.length;
                    const progressRate = metaAcumulada > 0 ? ((somaProducao / metaAcumulada) * 100).toFixed(1) : 0;
                    const progressClass = getProgressRateClass(progressRate);

                    return (
                      <TableRow key={index}>
                        <td>{row.LINE_NM}</td>
                        <td>{row.PROC_TYPE_NM}</td>
                        <td className='target-column'>{row.PLAN_QTY}</td>
                        <td className='target-column'>{row.TARGET || '-'}</td>

                        {config.horasCampos.map((campo) => {
                          const cellColorClass = getCellColorClass(
                            parseInt(row[campo]) || 0,
                            row.TARGET || row.PLAN_QTY
                          );

                          return (
                            <td
                              key={campo}
                              className={cellColorClass}
                            >
                              {row[campo] || 0}
                            </td>
                          );
                        })}

                        <td className='total-column'>{row.ACRS_QTY}</td>
                        <td style={{
                          color: diff >= 0 ? 'green' : 'red',
                          fontWeight: 'bold'
                        }}>
                          {diff >= 0 ? '+' : ''}{diff}
                        </td>
                        <td className={progressClass}>
                          {progressRate}%
                        </td>
                      </TableRow>
                    );
                  })
                ) : (
                  filteredListCard.map((row, index) => {
                    const diff = calculateDiff(row);
                    const total1T = TURNOS_CONFIG['1T'].horasCampos.reduce((sum, campo) => sum + (parseInt(row[campo]) || 0), 0);
                    const total2T = TURNOS_CONFIG['2T'].horasCampos.reduce((sum, campo) => sum + (parseInt(row[campo]) || 0), 0);
                    const total3T = TURNOS_CONFIG['3T'].horasCampos.reduce((sum, campo) => sum + (parseInt(row[campo]) || 0), 0);
                    const totalDay = total1T + total2T + total3T;

                    const horariosValidos = config.horasCampos.filter(campo => {
                      const valor = parseInt(row[campo]) || 0;
                      return valor > 0;
                    });
                    const somaProducao = horariosValidos.reduce((acc, campo) => {
                      return acc + (parseInt(row[campo]) || 0);
                    }, 0);
                    const target = row.TARGET || row.PLAN_QTY;
                    const metaAcumulada = (parseInt(target) || 0) * horariosValidos.length;
                    const progressRate = metaAcumulada > 0 ? ((somaProducao / metaAcumulada) * 100).toFixed(1) : 0;

                    return (
                      <TableRow key={index} style={{ height: 36 }}>
                        <td style={{ padding: '6px 8px', width: 60, minWidth: 60, textAlign: 'center', fontWeight: 600 }}>{row.LINE_NM}</td>
                        <td style={{ padding: '6px 8px', width: 80, minWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>{row.PROC_TYPE_NM.replace('BSM-', '')}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 600, backgroundColor: '#f5f5f5', width: 50, minWidth: 50 }}>{row.PLAN_QTY}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 600, backgroundColor: '#f5f5f5', width: 50, minWidth: 50 }}>{row.TARGET || '-'}</td>

                        {/* 1T Total */}
                        <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700, backgroundColor: expandedTurnos['1T'] ? '#4B6CB8' : '#D4DDF7', color: expandedTurnos['1T'] ? '#fff' : '#000', cursor: 'pointer', transition: 'all 0.2s', width: 50, minWidth: 50 }} onClick={() => setExpandedTurnos({...expandedTurnos, '1T': !expandedTurnos['1T']})}>
                          {total1T}
                        </td>

                        {/* 1T Horas - Mostrar se expandido */}
                        {expandedTurnos['1T'] && (
                          TURNOS_CONFIG['1T'].horasCampos.map((campo, i) => {
                            const cellColor = getCellColorClass(parseInt(row[campo]) || 0, row.TARGET || row.PLAN_QTY);
                            return (
                              <td key={`1T-${i}`} className={cellColor} style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 600, fontSize: 12, width: 45, minWidth: 45 }}>
                                {row[campo] || 0}
                              </td>
                            );
                          })
                        )}

                        {/* 2T Total */}
                        <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700, backgroundColor: expandedTurnos['2T'] ? '#C59964' : '#F2E5D5', color: expandedTurnos['2T'] ? '#fff' : '#000', cursor: 'pointer', transition: 'all 0.2s', width: 50, minWidth: 50 }} onClick={() => setExpandedTurnos({...expandedTurnos, '2T': !expandedTurnos['2T']})}>
                          {total2T}
                        </td>

                        {/* 2T Horas - Mostrar se expandido */}
                        {expandedTurnos['2T'] && (
                          TURNOS_CONFIG['2T'].horasCampos.map((campo, i) => {
                            const cellColor = getCellColorClass(parseInt(row[campo]) || 0, row.TARGET || row.PLAN_QTY);
                            return (
                              <td key={`2T-${i}`} className={cellColor} style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 600, fontSize: 12, width: 45, minWidth: 45 }}>
                                {row[campo] || 0}
                              </td>
                            );
                          })
                        )}

                        {/* 3T Total */}
                        <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700, backgroundColor: expandedTurnos['3T'] ? '#7A5E8F' : '#E8DFF5', color: expandedTurnos['3T'] ? '#fff' : '#000', cursor: 'pointer', transition: 'all 0.2s', width: 50, minWidth: 50 }} onClick={() => setExpandedTurnos({...expandedTurnos, '3T': !expandedTurnos['3T']})}>
                          {total3T}
                        </td>

                        {/* 3T Horas - Mostrar se expandido */}
                        {expandedTurnos['3T'] && (
                          TURNOS_CONFIG['3T'].horasCampos.map((campo, i) => {
                            const cellColor = getCellColorClass(parseInt(row[campo]) || 0, row.TARGET || row.PLAN_QTY);
                            return (
                              <td key={`3T-${i}`} className={cellColor} style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 600, fontSize: 12, width: 45, minWidth: 45 }}>
                                {row[campo] || 0}
                              </td>
                            );
                          })
                        )}

                        {/* Total, Diff, TTL */}
                        <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700, backgroundColor: '#fafafa', width: 55, minWidth: 55 }}>{totalDay}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700, color: diff >= 0 ? '#2e7d32' : '#c62828', width: 50, minWidth: 50 }}>
                          {diff >= 0 ? '+' : ''}{diff}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 600, color: progressRate >= 90 ? '#2e7d32' : progressRate >= 70 ? '#ff9800' : '#c62828', width: 70, minWidth: 70 }}>
                          {progressRate}%
                        </td>
                      </TableRow>
                    );
                  })
                )}

                {calculateTotals && (() => {
                  if (turno !== 'DIA') {
                    const horariosValidos = config.horasCampos.filter(campo => {
                      return calculateTotals.totalHoras[campo] > 0;
                    });

                    const somaTotal = horariosValidos.reduce((acc, campo) => {
                      return acc + (calculateTotals.totalHoras[campo] || 0);
                    }, 0);

                    const totalTarget = filteredListCard.reduce((sum, row) => {
                      return sum + (parseInt(row.TARGET) || parseInt(row.PLAN_QTY) || 0);
                    }, 0);

                    const metaAcumuladaTotal = totalTarget * horariosValidos.length;
                    const totalProgressRate = metaAcumuladaTotal > 0 ? ((somaTotal / metaAcumuladaTotal) * 100).toFixed(1) : 0;

                    return (
                      <TableRow className='last-row'>
                        <td colSpan={2}>Total</td>
                        <td className='target-column'>{calculateTotals.totalPlan}</td>
                        <td className='target-column'>{totalTarget}</td>

                        {config.horasCampos.map((campo) => (
                          <td key={campo}>
                            {calculateTotals.totalHoras[campo]}
                          </td>
                        ))}

                        <td className='total-column'>{calculateTotals.totalAcrs}</td>
                        <td style={{
                          color: calculateTotals.totalDiff >= 0 ? 'green' : 'red',
                          fontWeight: 'bold'
                        }}>
                          {calculateTotals.totalDiff >= 0 ? '+' : ''}{calculateTotals.totalDiff}
                        </td>
                        <td className={getProgressRateClass(totalProgressRate)}>
                          {totalProgressRate}%
                        </td>
                      </TableRow>
                    );
                  } else {
                    const total1T = filteredListCard.reduce((sum, row) => sum + TURNOS_CONFIG['1T'].horasCampos.reduce((s, campo) => s + (parseInt(row[campo]) || 0), 0), 0);
                    const total2T = filteredListCard.reduce((sum, row) => sum + TURNOS_CONFIG['2T'].horasCampos.reduce((s, campo) => s + (parseInt(row[campo]) || 0), 0), 0);
                    const total3T = filteredListCard.reduce((sum, row) => sum + TURNOS_CONFIG['3T'].horasCampos.reduce((s, campo) => s + (parseInt(row[campo]) || 0), 0), 0);
                    const totalTarget = filteredListCard.reduce((sum, row) => sum + (parseInt(row.TARGET) || parseInt(row.PLAN_QTY) || 0), 0);
                    const totalDay = total1T + total2T + total3T;

                    return (
                      <TableRow className='last-row'>
                        <td colSpan={2}>Total</td>
                        <td className='target-column'>{calculateTotals.totalPlan}</td>
                        <td className='target-column'>{totalTarget}</td>
                        <td style={{ backgroundColor: '#e3f2fd', fontWeight: 700, textAlign: 'center' }}>{total1T}</td>
                        <td style={{ backgroundColor: '#fff3e0', fontWeight: 700, textAlign: 'center' }}>{total2T}</td>
                        <td style={{ backgroundColor: '#f3e5f5', fontWeight: 700, textAlign: 'center' }}>{total3T}</td>
                        <td className='total-column'>{totalDay}</td>
                        <td style={{ color: calculateTotals.totalDiff >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                          {calculateTotals.totalDiff >= 0 ? '+' : ''}{calculateTotals.totalDiff}
                        </td>
                        <td>-</td>
                      </TableRow>
                    );
                  }
                })()}
              </TableBody>
            </Table>
          </TableContainer>

          {isLoading && listCard.length === 0 && (
            <Box sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 1000
            }}>
              <CircularProgress color="primary" />
            </Box>
          )}
        </Box>
      </div>
    </>
  );
}





