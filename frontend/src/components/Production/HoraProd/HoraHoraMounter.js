import { API_URL } from '../../../config/api';
import React, { useEffect, useMemo, useRef, useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import './HoraProd.css';
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
import { notification } from 'antd';

// Configurações por turno
const TURNOS_CONFIG = {
  '1T': {
    endpoint: 'HoraProd',
    fileName: 'Hora Mounter 1T Data',
    horarios: [
      'HORARIO_1_1', 'HORARIO_1_2', 'HORARIO_1_3', 'HORARIO_1_4',
      'HORARIO_1_5', 'HORARIO_1_6', 'HORARIO_1_7', 'HORARIO_1_8',
      'HORARIO_2_1', 'HORARIO_2_2'
    ],
    horasLabels: ['07:55', '08:55', '09:55', '10:55', '11:55', '12:55', '13:55', '14:55', '15:55', '16:45'],
    horasValores: {
      "HORARIO_1_1": { hours: 7, minutes: 55 },
      "HORARIO_1_2": { hours: 8, minutes: 55 },
      "HORARIO_1_3": { hours: 9, minutes: 55 },
      "HORARIO_1_4": { hours: 10, minutes: 55 },
      "HORARIO_1_5": { hours: 11, minutes: 55 },
      "HORARIO_1_6": { hours: 12, minutes: 55 },
      "HORARIO_1_7": { hours: 13, minutes: 55 },
      "HORARIO_1_8": { hours: 14, minutes: 55 },
      "HORARIO_2_1": { hours: 15, minutes: 55 },
      "HORARIO_2_2": { hours: 16, minutes: 45 }
    },
    qtdHorarios: 10
  },
  '2T': {
    endpoint: 'HoraProd2T',
    fileName: 'Hora Mounter 2T Data',
    horarios: [
      'HORARIO_2_3', 'HORARIO_2_4', 'HORARIO_2_5',
      'HORARIO_2_6', 'HORARIO_2_7', 'HORARIO_2_8',
      'HORARIO_3_1', 'HORARIO_3_2', 'HORARIO_3_3'
    ],
    horasLabels: ['17:55', '18:55', '19:55', '20:55', '21:55', '22:55', '23:55', '00:55', '02:10'],
    horasValores: {
      "HORARIO_2_3": { hours: 17, minutes: 55 },
      "HORARIO_2_4": { hours: 18, minutes: 55 },
      "HORARIO_2_5": { hours: 19, minutes: 55 },
      "HORARIO_2_6": { hours: 20, minutes: 55 },
      "HORARIO_2_7": { hours: 21, minutes: 55 },
      "HORARIO_2_8": { hours: 22, minutes: 55 },
      "HORARIO_3_1": { hours: 23, minutes: 55 },
      "HORARIO_3_2": { hours: 0, minutes: 55 },
      "HORARIO_3_3": { hours: 2, minutes: 10 }
    },
    qtdHorarios: 9
  },
  '3T': {
    endpoint: 'HoraProd3T',
    fileName: 'Hora Mounter 3T Data',
    horarios: [
      'HORARIO_3_4', 'HORARIO_3_5', 'HORARIO_3_6',
      'HORARIO_3_7', 'HORARIO_3_8'
    ],
    horasLabels: ['02:55', '03:55', '04:55', '05:55', '06:55'],
    horasValores: {
      "HORARIO_3_4": { hours: 2, minutes: 55 },
      "HORARIO_3_5": { hours: 3, minutes: 55 },
      "HORARIO_3_6": { hours: 4, minutes: 55 },
      "HORARIO_3_7": { hours: 5, minutes: 55 },
      "HORARIO_3_8": { hours: 6, minutes: 55 }
    },
    qtdHorarios: 5
  }
};

export default function HoraHoraUnificada() {
  const [turno, setTurno] = useState('1T');
  const [listCard, setListCard] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isLoading, setIsLoading] = useState(false);
  const [markedCells, setMarkedCells] = useState(() => {
    const saved = localStorage.getItem('markedCells');
    return saved ? JSON.parse(saved) : {};
  });
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [currentComment, setCurrentComment] = useState('');
  const [currentCell, setCurrentCell] = useState(null);
  const [existingComment, setExistingComment] = useState(null);
  const [difference, setDifference] = useState(null);
  const [differenceInMinutes, setDifferenceInMinutes] = useState(null);
  const [currentTarget, setCurrentTarget] = useState(null);
  const [currentActual, setCurrentActual] = useState(null);
  const [activeTab, setActiveTab] = useState('producao');
  const [maintenanceComment, setMaintenanceComment] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  const [isTechnicianValid, setIsTechnicianValid] = useState(null);
  const [operatorId, setOperatorId] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [isOperatorValid, setIsOperatorValid] = useState(null);
  const [selectedModelos, setSelectedModelos] = useState([]);
  const [modeloDropdownOpen, setModeloDropdownOpen] = useState(false);

  const config = useMemo(() => TURNOS_CONFIG[turno], [turno]);
  const fileName = config.fileName;

  // Ref para armazenar dados atuais sem recriar o interval do polling
  const listCardRef = useRef(listCard);
  useEffect(() => {
    listCardRef.current = listCard;
  }, [listCard]);

  // Persist marked cells
  useEffect(() => {
    localStorage.setItem('markedCells', JSON.stringify(markedCells));
  }, [markedCells]);

  // Fetch production data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await Axios.get(`${API_URL}/${config.endpoint}?data=${date}`);
        setListCard(response.data);
      } catch (error) {
        console.error(`Erro ao buscar dados no HoraProdução Mounter ${turno}:`, error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [date, config.endpoint, turno]);

  // Check if a cell has a comment
  const hasComment = async (linha, modelo, horario) => {
    try {
      const response = await Axios.get(`${API_URL}/horaProd_comments`, {
        params: { data: date, linha, modelo, horario }
      });
      return response.data ? {
        hasProductionComment: !!response.data.comentario,
        hasMaintenanceComment: !!response.data.comentario_manutencao,
        data: response.data
      } : null;
    } catch (error) {
      console.error('Erro ao verificar comentário:', error);
      return null;
    }
  };

  const getOperatorName = async (matricula) => {
    try {
      const response = await Axios.get(`${API_URL}/pessoas`);
      const operator = response.data.find(person => person.matricula === matricula);
      if (operator) {
        const names = operator.funcionarios.split(' ');
        return names.length > 1 ? `${names[0]} ${names[1]}` : names[0];
      }
      return matricula;
    } catch (error) {
      console.error('Erro ao buscar nome do operador:', error);
      return matricula;
    }
  };

  const getTechnicianName = async (matricula) => {
    try {
      const response = await Axios.get(`${API_URL}/pessoas`);
      const technician = response.data.find(person => person.matricula === matricula);
      if (technician) {
        const names = technician.funcionarios.split(' ');
        return names.length > 1 ? `${names[0]} ${names[1]}` : names[0];
      }
      return matricula;
    } catch (error) {
      console.error('Erro ao buscar nome do técnico:', error);
      return matricula;
    }
  };

  // Load marked cells based on existing comments
  useEffect(() => {
    const loadMarkedCells = async () => {
      const cellsToCheck = [];
      for (const row of listCard) {
        if (row.Linha === 'Total') continue;
        for (const horario of config.horarios) {
          const cellKey = `${date}-${row.Linha}-${row.Modelo}-${horario}`;
          cellsToCheck.push({
            cellKey,
            promise: hasComment(row.Linha, row.Modelo, horario)
          });
        }
      }
      const results = await Promise.all(cellsToCheck.map(cell => cell.promise));
      const newMarkedCells = {};
      results.forEach((commentData, index) => {
        if (commentData) {
          const cellKey = cellsToCheck[index].cellKey;
          newMarkedCells[cellKey] = commentData.hasProductionComment || commentData.hasMaintenanceComment;
          newMarkedCells[`${cellKey}_prod`] = commentData.hasProductionComment;
          newMarkedCells[`${cellKey}_manut`] = commentData.hasMaintenanceComment;
        }
      });
      setMarkedCells(prev => ({ ...prev, ...newMarkedCells }));
    };
    if (listCard.length > 0) {
      loadMarkedCells();
    }
  }, [listCard, date, config.horarios]);

  const checkTechnicianId = async (matricula) => {
    if (!matricula) {
      setIsTechnicianValid(null);
      setTechnicianName('');
      return;
    }
    try {
      const response = await Axios.get(`${API_URL}/pessoas`);
      const technician = response.data.find(person => person.matricula === matricula);
      if (technician) {
        if (technician.job_class && technician.job_class.toLowerCase() === 'production') {
          setIsTechnicianValid(false);
          setTechnicianName('Matrícula inválida para manutenção');
        } else {
          setIsTechnicianValid(true);
          setTechnicianName(technician.funcionarios);
        }
      } else {
        setIsTechnicianValid(false);
        setTechnicianName('');
      }
    } catch (error) {
      console.error('Erro ao verificar matrícula:', error);
      setIsTechnicianValid(false);
      setTechnicianName('');
    }
  };

  const checkOperatorId = async (matricula) => {
    if (!matricula) {
      setIsOperatorValid(null);
      setOperatorName('');
      return;
    }
    try {
      const response = await Axios.get(`${API_URL}/pessoas`);
      const operator = response.data.find(person => person.matricula === matricula);
      if (operator) {
        if (operator.job_class && operator.job_class.toLowerCase() === 'production') {
          setIsOperatorValid(true);
          setOperatorName(operator.funcionarios);
        } else {
          setIsOperatorValid(false);
          setOperatorName('Matrícula inválida para produção');
        }
      } else {
        setIsOperatorValid(false);
        setOperatorName('');
      }
    } catch (error) {
      console.error('Erro ao verificar matrícula do operador:', error);
      setIsOperatorValid(false);
      setOperatorName('');
    }
  };

  // Verificar matrículas quando mudam
  useEffect(() => {
    if (activeTab === 'manutencao' && technicianId) {
      const timer = setTimeout(() => {
        checkTechnicianId(technicianId);
      }, 500);
      return () => clearTimeout(timer);
    } else if (activeTab === 'manutencao' && !technicianId) {
      setIsTechnicianValid(null);
      setTechnicianName('');
    }

    if (activeTab === 'producao' && operatorId) {
      const timer = setTimeout(() => {
        checkOperatorId(operatorId);
      }, 500);
      return () => clearTimeout(timer);
    } else if (activeTab === 'producao' && !operatorId) {
      setIsOperatorValid(null);
      setOperatorName('');
    }
  }, [technicianId, operatorId, activeTab]);

  // Duplo clique para abrir modal
  const handleCellDoubleClick = async (linha, modelo, horario) => {
    handleCellClick(linha, modelo, horario);
    setCurrentCell({ linha, modelo, horario });

    try {
      const response = await Axios.get(`${API_URL}/horaProd_comments`, {
        params: { data: date, linha, modelo, horario }
      });

      if (response.data) {
        setExistingComment(response.data);
        setCurrentComment(response.data.comentario || '');
        const isDefaultTemplate = response.data.comentario_manutencao === 'Erro:\nSolução:\nCausa:\nContramedida:\ntempo:';
        setMaintenanceComment(isDefaultTemplate || !response.data.comentario_manutencao ? 'Erro:\nSolução:\nCausa:\nContramedida:\ntempo:' : response.data.comentario_manutencao || '');
        setTechnicianId(response.data.matricula_tecnico || '');
        setTechnicianName('');
        if (response.data.matricula_tecnico) {
          await checkTechnicianId(response.data.matricula_tecnico);
        }
        setOperatorId(response.data.matricula_operador || '');
        setOperatorName('');
        if (response.data.matricula_operador) {
          await checkOperatorId(response.data.matricula_operador);
        }
      } else {
        setExistingComment(null);
        setCurrentComment('');
        setMaintenanceComment('Erro:\nSolução:\nCausa:\nContramedida:\ntempo:');
        setTechnicianId('');
        setTechnicianName('');
        setOperatorId('');
        setOperatorName('');
      }
    } catch (error) {
      console.error('Erro ao buscar comentário:', error);
      setExistingComment(null);
      setCurrentComment('');
      setMaintenanceComment('Erro:\nSolução:\nCausa:\nContramedida:\ntempo:');
      setTechnicianId('');
      setTechnicianName('');
      setOperatorId('');
      setOperatorName('');
    }

    const target = listCard.find(item => item.Linha === linha && item.Modelo === modelo)?.Meta;
    const actual = listCard.find(item => item.Linha === linha && item.Modelo === modelo)?.[horario];

    setCurrentTarget(target);
    setCurrentActual(actual);

    const diff = target - actual;
    setDifference(diff);

    const percentageAchieved = (target / 60);
    const diffInMinutes = 60 - (actual / percentageAchieved);
    setDifferenceInMinutes(diffInMinutes);

    setCommentModalOpen(true);
  };

  const handleOverlayClick = () => {
    setCommentModalOpen(false);
  };

  // Clique único
  const handleCellClick = async (linha, modelo, horario) => {
    const cellKey = `${date}-${linha}-${modelo}-${horario}`;
    if (markedCells[cellKey]) {
      try {
        const response = await Axios.get(`${API_URL}/horaProd_comments`, {
          params: { data: date, linha, modelo, horario }
        });

        if (response.data) {
          const opName = response.data.matricula_operador
            ? await getOperatorName(response.data.matricula_operador)
            : '';
          const techName = response.data.matricula_tecnico
            ? await getTechnicianName(response.data.matricula_tecnico)
            : '';

          const description = (
            <div>
              {response.data.comentario && (
                <div>
                  <div><strong style={{ color: '#393D7E' }}>Produção:</strong> {response.data.comentario}</div>
                  {response.data.matricula_operador && (
                    <div><strong style={{ color: '#393D7E' }}>Resp. Produção:</strong> {opName}</div>
                  )}
                </div>
              )}
              {response.data.comentario_manutencao && response.data.comentario && (
                <div style={{ margin: '8px 0' }}></div>
              )}
              {response.data.comentario_manutencao && (
                <div>
                  <div><strong style={{ color: '#296374' }}>Manutenção:</strong> {response.data.comentario_manutencao}</div>
                  {response.data.matricula_tecnico && (
                    <div><strong style={{ color: '#296374' }}>Resp. Manutenção:</strong> {techName}</div>
                  )}
                </div>
              )}
            </div>
          );

          notification.open({
            message: 'Status da linha',
            description: description,
            duration: 5,
          });
        }
      } catch (error) {
        console.error('Erro ao buscar comentário:', error);
      }
    }
  };

  // Clear comment (delete from database)
  const handleClearComment = async (tipo) => {
    if (!currentCell) return;

    const confirmMessage = tipo === 'producao' 
      ? 'Deseja realmente excluir o comentário de produção?' 
      : 'Deseja realmente excluir o comentário de manutenção?';
    
    if (!window.confirm(confirmMessage)) return;

    try {
      await Axios.post(`${API_URL}/horaProdUp_comments`, {
        data: date,
        linha: currentCell.linha,
        modelo: currentCell.modelo,
        horario: currentCell.horario,
        tipo_comentario: tipo,
        acao: 'deletar'
      });

      const cellKey = `${date}-${currentCell.linha}-${currentCell.modelo}-${currentCell.horario}`;
      
      if (tipo === 'producao') {
        setCurrentComment('');
        setOperatorId('');
        setIsOperatorValid(null);
        setOperatorName('');
        // Atualiza existingComment removendo o comentário de produção
        setExistingComment(prev => prev ? { ...prev, comentario: null, matricula_operador: null } : null);
        setMarkedCells(prev => {
          const updated = { ...prev };
          delete updated[`${cellKey}_prod`];
          // Mantém marcado se ainda tiver comentário de manutenção
          if (!updated[`${cellKey}_manut`]) {
            delete updated[cellKey];
          }
          return updated;
        });
      } else {
        // Mantém o template padrão ao deletar comentário de manutenção
        setMaintenanceComment('Erro:\nSolução:\nCausa:\nContramedida:\ntempo:');
        setTechnicianId('');
        setIsTechnicianValid(null);
        setTechnicianName('');
        // Atualiza existingComment removendo o comentário de manutenção
        setExistingComment(prev => prev ? { ...prev, comentario_manutencao: null, matricula_tecnico: null } : null);
        setMarkedCells(prev => {
          const updated = { ...prev };
          delete updated[`${cellKey}_manut`];
          // Mantém marcado se ainda tiver comentário de produção
          if (!updated[`${cellKey}_prod`]) {
            delete updated[cellKey];
          }
          return updated;
        });
      }
    } catch (error) {
      console.error('Erro ao excluir comentário:', error);
      alert('Erro ao excluir comentário. Tente novamente.');
    }
  };

  // Save or update comment
  const handleSaveComment = async () => {
    if (!currentCell) return;

    if (activeTab === 'manutencao') {
      if (!maintenanceComment.trim() && !technicianId.trim()) {
        alert('Preencha a matrícula e o comentário para salvar.');
        return;
      }
      if (!technicianId.trim()) {
        alert('Por favor, insira a matrícula do técnico para salvar o comentário.');
        return;
      }
      if (isTechnicianValid !== true) {
        alert('Por favor, insira uma matrícula de técnico válida.');
        return;
      }
      if (!maintenanceComment.trim()) {
        alert('Por favor, insira o comentário de manutenção para salvar.');
        return;
      }
    }

    if (activeTab === 'producao') {
      if (!currentComment.trim() && !operatorId.trim()) {
        alert('Preencha a matrícula e o comentário para salvar.');
        return;
      }
      if (!operatorId.trim()) {
        alert('Por favor, insira a matrícula do operador para salvar o comentário.');
        return;
      }
      if (isOperatorValid !== true) {
        alert('Por favor, insira uma matrícula de operador válida.');
        return;
      }
      if (!currentComment.trim()) {
        alert('Por favor, insira o comentário de produção para salvar.');
        return;
      }
    }

    try {
      if (activeTab === 'manutencao') {
        await Axios.post(`${API_URL}/horaProdUp_comments`, {
          data: date,
          linha: currentCell.linha,
          modelo: currentCell.modelo,
          horario: currentCell.horario,
          comentario_manutencao: maintenanceComment,
          matricula_tecnico: technicianId,
          target: currentTarget,
          actual: currentActual,
          difference: difference,
          loss_minutes: differenceInMinutes,
          tipo_comentario: 'manutencao'
        });
      } else {
        await Axios.post(`${API_URL}/horaProdUp_comments`, {
          data: date,
          linha: currentCell.linha,
          modelo: currentCell.modelo,
          horario: currentCell.horario,
          comentario: currentComment,
          matricula_operador: operatorId,
          target: currentTarget,
          actual: currentActual,
          difference: difference,
          loss_minutes: differenceInMinutes,
          tipo_comentario: 'producao'
        });
      }

      const cellKey = `${date}-${currentCell.linha}-${currentCell.modelo}-${currentCell.horario}`;
      setMarkedCells(prev => ({
        ...prev,
        [cellKey]: (activeTab === 'manutencao' ? maintenanceComment : currentComment).trim() !== '',
        [`${cellKey}_prod`]: activeTab === 'producao' && currentComment.trim() !== '',
        [`${cellKey}_manut`]: activeTab === 'manutencao' && maintenanceComment.trim() !== ''
      }));

      setActiveTab('producao');
      setMaintenanceComment('');
      setTechnicianId('');
      setOperatorId('');
      setCommentModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar comentário:', error);
    }
  };

  // Horas para comparação de cores
  const hours = useMemo(() => {
    const result = {};
    for (const [key, val] of Object.entries(config.horasValores)) {
      result[key] = new Date(new Date(date.slice(0, 10).replace("-", ",")).setHours(val.hours, val.minutes));
    }
    return result;
  }, [date, config.horasValores]);

  const uniqueLinesCount = useMemo(() => {
    const filteredLines = listCard.filter(item => item.Linha !== 'Total');
    const count = new Set(filteredLines.map(item => item.Linha)).size;
    return Math.max(0, count - 1);
  }, [listCard]);

  // Modelos únicos extraídos dos dados
  const uniqueModelos = useMemo(() => {
    const modelos = [...new Set(listCard.filter(item => item.Linha !== 'Total').map(item => item.Modelo))];
    return modelos.sort();
  }, [listCard]);

  // Dados filtrados por modelo
  const filteredListCard = useMemo(() => {
    if (selectedModelos.length === 0) return listCard;
    return listCard.filter(row => row.Linha === 'Total' || selectedModelos.includes(row.Modelo));
  }, [listCard, selectedModelos]);

  // Reset filtro de modelos quando trocar turno/data
  useEffect(() => {
    setSelectedModelos([]);
  }, [turno, date]);

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

  // Auto-refresh inteligente: re-busca dados a cada 30 segundos sem recarregar a página
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await Axios.get(`${API_URL}/${config.endpoint}?data=${date}`);
        const newData = response.data;
        // Usa ref para comparar sem recriar o interval
        if (JSON.stringify(newData) !== JSON.stringify(listCardRef.current)) {
          setListCard(newData);
        }
      } catch (error) {
        console.error(`Erro ao atualizar dados automaticamente:`, error);
      }
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [config.endpoint, date]); // Sem listCard nas deps - usa ref

  function handleClick(event) {
    console.info('You clicked a breadcrumb.');
  }

  // Gerar cabeçalhos de N°H dinamicamente
  const renderNumeroHHeaders = () => {
    const headers = [];
    for (let i = 1; i <= config.qtdHorarios; i++) {
      headers.push(<th key={i}>{i}°H</th>);
    }
    return headers;
  };

  // Trocar turno - sem limpar dados para evitar flicker
  const handleTurnoChange = (novoTurno) => {
    if (novoTurno !== turno) {
      setTurno(novoTurno);
    }
  };

  return (
    <>
      <div className='justify-content-center'>
        <Helmet>
          <title>Hora Mounter</title>
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
              PRODUÇÃO MOUNTER
            </span>

            {/* Lado direito: Data + Turno + Indicador + Excel */}
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
                {['1T', '2T', '3T'].map((t) => (
                  <button
                    key={t}
                    onClick={() => handleTurnoChange(t)}
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
                {uniqueLinesCount} linhas
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
                  link.download = fileName + fileExtension;
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

          <TableContainer>
            <Table className='hora-prod-table unificada-table' style={{ marginTop: 6 }}>
              <TableHead>
                <TableRow>
                  <TableCell colSpan={3} style={{ width: '28%', backgroundColor: '#f8f9fa', border: 'none', borderBottom: 'none', padding: '4px 8px' }}></TableCell>

                  {config.horasLabels.map((label, i) => (
                    <TableCell key={i} style={{ width: '5%', backgroundColor: '#f8f9fa', border: 'none', borderBottom: 'none', fontSize: '11px', fontWeight: 'bold', color: '#393D7E', padding: '4px 4px', textAlign: 'center' }}>
                      {label}
                    </TableCell>
                  ))}
                  <TableCell colSpan={2} style={{ width: '13%', backgroundColor: '#f8f9fa', border: 'none', borderBottom: 'none', padding: '4px' }}></TableCell>
                </TableRow>

                <TableRow className='head-of-head'>
                  <th>Line</th>
                  <th>Model</th>
                  <th style={{ backgroundColor: '#3A59D1' }} className='target-column'>Target</th>
                  {renderNumeroHHeaders()}
                  <th>Total</th>
                  <th>TTL Acc (%)</th>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredListCard.map((row, index) => (
                  <TableRow key={index} className={index === filteredListCard.length - 1 ? "last-row" : ""}>
                    <td>{row.Linha}</td>
                    <td>{row.Modelo}</td>
                    <td className='target-column'>{row.Meta}</td>

                    {config.horarios.map((accessor, colIndex) => {
                      const cellKey = `${date}-${row.Linha}-${row.Modelo}-${accessor}`;
                      const isMarked = markedCells[cellKey];
                      const hasProductionComment = markedCells[`${cellKey}_prod`];
                      const hasMaintenanceComment = markedCells[`${cellKey}_manut`];

                      return (
                        <td
                          key={colIndex}
                          className={`${
                            new Date() > hours[accessor]
                              ? `cell-${
                                  parseInt(row[accessor]) === parseInt(row.Meta) ? 'green' :
                                  parseInt(row[accessor]) === 0 ? 'gray' :
                                  parseInt(row[accessor]) < parseInt(row.Meta) * 0.70 ? 'red' :
                                  parseInt(row[accessor]) < parseInt(row.Meta) ? 'yellow' : 'green'
                                }`
                              : ''
                          } ${isMarked ? 'marked-cell' : ''}`}
                          onClick={() => handleCellClick(row.Linha, row.Modelo, accessor)}
                          onDoubleClick={() => handleCellDoubleClick(row.Linha, row.Modelo, accessor)}
                          style={{ cursor: 'pointer', position: 'relative' }}
                        >
                          {row[accessor]}
                          {isMarked && (
                            <span className="marker-icon" title="Esta célula possui comentário" style={{ position: 'absolute', top: '2px', left: '2px' }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24">
                                <path fill="currentColor" d="m13.299 3.148l8.634 14.954a1.5 1.5 0 0 1-1.299 2.25H3.366a1.5 1.5 0 0 1-1.299-2.25l8.634-14.954c.577-1 2.02-1 2.598 0" class="duoicon-secondary-layer" opacity=".3" />
                                <path fill="currentColor" d="M12 8a1 1 0 0 0-.993.883L11 9v4a1 1 0 0 0 1.993.117L13 13V9a1 1 0 0 0-1-1m0 7a1 1 0 1 0 0 2a1 1 0 0 0 0-2" class="duoicon-primary-layer" />
                              </svg>
                            </span>
                          )}
                        </td>
                      );
                    })}

                    <td className="total-column">{row.Total}</td>
                    <td className={(() => {
                      if (row.Linha === 'Total') return '';

                      const horarios = config.horarios;
                      const horariosValidos = horarios.filter(horario => {
                        const valor = parseInt(row[horario]) || 0;
                        const horaAtual = hours[horario];
                        return valor > 0 || (horaAtual && new Date() > horaAtual);
                      });

                      const somaProducao = horariosValidos.reduce((acc, horario) => {
                        return acc + (parseInt(row[horario]) || 0);
                      }, 0);

                      const metaAcumulada = (parseInt(row.Meta) || 0) * horariosValidos.length;
                      const rendimento = metaAcumulada > 0 ? ((somaProducao / metaAcumulada) * 100) : 0;

                      if (rendimento >= 90) {
                        return 'rendimento-good';
                      } else if (rendimento >= 50) {
                        return 'rendimento-medium';
                      } else {
                        return 'rendimento-default';
                      }
                    })()}>
                      {row.Linha !== 'Total' ? (
                        (() => {
                          const horarios = config.horarios;
                          const horariosValidos = horarios.filter(horario => {
                            const valor = parseInt(row[horario]) || 0;
                            const horaAtual = hours[horario];
                            return valor > 0 || (horaAtual && new Date() > horaAtual);
                          });

                          const somaProducao = horariosValidos.reduce((acc, horario) => {
                            return acc + (parseInt(row[horario]) || 0);
                          }, 0);

                          const metaAcumulada = (parseInt(row.Meta) || 0) * horariosValidos.length;
                          const rendimento = metaAcumulada > 0 ? ((somaProducao / metaAcumulada) * 100).toFixed(1) : 0;

                          return `${rendimento}%`;
                        })()
                      ) : (
                        ''
                      )}
                    </td>
                  </TableRow>
                ))}
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

      {/* Comment Modal */}
      {commentModalOpen && (
        <div className="comment-modal-overlay" onClick={handleOverlayClick}>
          <div className="comment-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Justifique a linha</h3>
              <button
                onClick={() => setCommentModalOpen(false)}
                className="close-button"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="tabs">
                <button
                  className={`tab-button ${activeTab === 'producao' ? 'active' : ''}`}
                  onClick={() => setActiveTab('producao')}
                >
                  Produção
                </button>
                <button
                  className={`tab-button ${activeTab === 'manutencao' ? 'active' : ''}`}
                  onClick={() => setActiveTab('manutencao')}
                >
                  Manutenção
                </button>
              </div>

              <div className="cell-info">
                <p><strong>Data:</strong> {date}</p>
                <p><strong>Linha:</strong> {currentCell?.linha}</p>
                <p><strong>Modelo:</strong> {currentCell?.modelo}</p>
                <p><strong>Target:</strong> {currentTarget}</p>
                <p><strong>Atingido:</strong> {currentActual}</p>

                {difference !== 0 && (
                  <p style={{ color: difference > 0 ? 'red' : 'green' }}>
                    <strong style={{ color: 'black' }}>Diff:</strong> {Math.abs(difference)}
                  </p>
                )}
                {difference !== 0 && (
                  <p style={{ color: difference > 0 ? 'red' : 'green' }}>
                    <strong style={{ color: 'black' }}>Loss:</strong> {Math.abs(differenceInMinutes).toFixed(2)} min
                  </p>
                )}
              </div>

              {activeTab === 'producao' && (
                <div className="production-tab">
                  <div className="form-group">
                    <label htmlFor="operatorId">Matrícula do Operador:</label>
                    <input
                      type="password"
                      id="operatorId"
                      className={`form-control ${isOperatorValid === null ? '' : isOperatorValid ? 'is-valid' : 'is-invalid'}`}
                      value={operatorId}
                      onChange={(e) => setOperatorId(e.target.value)}
                      placeholder="Digite a matrícula do operador"
                    />
                    {isOperatorValid === true && (
                      <div className="valid-feedback">
                        {operatorName}
                      </div>
                    )}
                    {isOperatorValid === false && (
                      <div className="invalid-feedback">
                        Matrícula não encontrada ou incorreta
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="productionComment">Comentário de Produção:</label>
                    <textarea
                      id="productionComment"
                      className="comment-textarea"
                      value={currentComment}
                      onChange={(e) => setCurrentComment(e.target.value)}
                      placeholder="Descreva a ocorrência ou observação..."
                      rows={5}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'manutencao' && (
                <div className="maintenance-tab">
                  <div className="form-group">
                    <label htmlFor="technicianId">Matrícula do Técnico:</label>
                    <input
                      type="password"
                      id="technicianId"
                      className={`form-control ${isTechnicianValid === null ? '' : isTechnicianValid ? 'is-valid' : 'is-invalid'}`}
                      value={technicianId}
                      onChange={(e) => setTechnicianId(e.target.value)}
                      placeholder="Digite a matrícula do técnico"
                    />
                    {isTechnicianValid === true && (
                      <div className="valid-feedback">
                        {technicianName}
                      </div>
                    )}
                    {isTechnicianValid === false && (
                      <div className="invalid-feedback">
                        Matrícula não encontrada ou incorreta
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="maintenanceComment">Comentário de Manutenção:</label>
                    <textarea
                      id="maintenanceComment"
                      className="comment-textarea"
                      value={maintenanceComment}
                      onChange={(e) => setMaintenanceComment(e.target.value)}
                      placeholder="Descreva a ocorrência ou observação de manutenção..."
                      rows={5}
                    />
                  </div>
                </div>
              )}

              <div className="modal-footer">
                <button
                  onClick={handleSaveComment}
                  className="save-button"
                >
                  {existingComment ? 'Atualizar' : 'Salvar'}
                </button>

                {activeTab === 'producao' && existingComment?.comentario && (
                  <button
                    onClick={() => handleClearComment('producao')}
                    className="clear-button"
                    style={{ backgroundColor: '#dc3545', borderColor: '#dc3545' }}
                  >
                    Excluir Produção
                  </button>
                )}

                {activeTab === 'manutencao' && existingComment?.comentario_manutencao && existingComment?.comentario_manutencao !== 'Erro:\nSolução:\nCausa:\nContramedida:\ntempo:' && (
                  <button
                    onClick={() => handleClearComment('manutencao')}
                    className="clear-button"
                    style={{ backgroundColor: '#dc3545', borderColor: '#dc3545' }}
                  >
                    Excluir Manutenção
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
