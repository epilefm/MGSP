import React, { useEffect, useMemo, useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import './HoraProd.css';
import Axios from 'axios';
import { Button } from "@mui/material";
import { Box } from "@mui/system";
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import { useNavigate } from 'react-router-dom';
import { CircularProgress } from "@mui/material";
import Breadcrumbs from '@mui/material/Breadcrumbs';
import { Typography } from '@mui/material';
import { Helmet } from 'react-helmet';
import Form from 'react-bootstrap/Form';
import Link from '@mui/material/Link';
import Header from '../../Layout/MGSPHead/Header'
import { ExportToExcel } from '../../Excel/Excel_Export'
import { notification } from 'antd';

export default function Tabela() {
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

  const fileName = "Hora Mounter 1T Data";

  // Persist marked cells to localStorage
  useEffect(() => {
    localStorage.setItem('markedCells', JSON.stringify(markedCells));
  }, [markedCells]);

  // Fetch production data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await Axios.get(`http://105.103.39.102:8080/HoraProd?data=${date}`);
        setListCard(response.data);
      } catch (error) {
        console.error('Erro ao buscar dados no HoraProdução Mounter:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [date]);


  // Check if a cell has a comment (função atualizada para verificar ambos os tipos de comentário)
  const hasComment = async (linha, modelo, horario) => {
    try {
      const response = await Axios.get(`http://105.103.39.102:8080/horaProd_comments`, {
        params: {
          data: date,
          linha,
          modelo,
          horario
        }
      });
      console.log(`Verificando comentário para ${linha}-${modelo}-${horario}:`, response.data);
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

  // Função para obter o nome do operador com base na matrícula (apenas nome e sobrenome)
  const getOperatorName = async (matricula) => {
    try {
      const response = await Axios.get(`http://105.103.39.102:8080/pessoas`);
      const operator = response.data.find(person => person.matricula === matricula);
      if (operator) {
        // Retornar apenas os 2 primeiros nomes
        const names = operator.funcionarios.split(' ');
        return names.length > 1 ? `${names[0]} ${names[1]}` : names[0];
      }
      return matricula;
    } catch (error) {
      console.error('Erro ao buscar nome do operador:', error);
      return matricula;
    }
  };

  // Função para obter o nome do técnico com base na matrícula (apenas nome e sobrenome)
  const getTechnicianName = async (matricula) => {
    try {
      const response = await Axios.get(`http://105.103.39.102:8080/pessoas`);
      const technician = response.data.find(person => person.matricula === matricula);
      if (technician) {
        // Retornar apenas os 2 primeiros nomes
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
        
        const horarios = [
          'HORARIO_1_1', 'HORARIO_1_2', 'HORARIO_1_3', 'HORARIO_1_4',
          'HORARIO_1_5', 'HORARIO_1_6', 'HORARIO_1_7', 'HORARIO_1_8',
          'HORARIO_2_1', 'HORARIO_2_2'
        ];
        
        for (const horario of horarios) {
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
          // Marcar células com base em ambos os tipos de comentário
          newMarkedCells[cellKey] = commentData.hasProductionComment || commentData.hasMaintenanceComment;
          // Armazenar dados adicionais para exibir os ícones corretos
          newMarkedCells[`${cellKey}_prod`] = commentData.hasProductionComment;
          newMarkedCells[`${cellKey}_manut`] = commentData.hasMaintenanceComment;
          console.log(`Célula ${cellKey} marcada com produção: ${commentData.hasProductionComment}, manutenção: ${commentData.hasMaintenanceComment}`);
        }
      });
      
      setMarkedCells(prev => ({ ...prev, ...newMarkedCells }));
    };
    
    if (listCard.length > 0) {
      loadMarkedCells();
    }
  }, [listCard, date]);


  // duplo clique para abrir modal
  const handleCellDoubleClick = async (linha, modelo, horario) => {
    handleCellClick(linha, modelo, horario);
    const cellKey = `${date}-${linha}-${modelo}-${horario}`;
    setCurrentCell({ linha, modelo, horario });
    
    try {
      const response = await Axios.get(`http://105.103.39.102:8080/horaProd_comments`, {
        params: {
          data: date,
          linha,
          modelo,
          horario
        }
      });
      
      console.log('Dados recebidos ao abrir o popup:', response.data);
      
      if (response.data) {
        setExistingComment(response.data);
        setCurrentComment(response.data.comentario || '');
        // Carregar dados de manutenção se existirem
        // Verificar se o comentário de manutenção está vazio ou se é o template padrão
        const isDefaultTemplate = response.data.comentario_manutencao === 'Erro:\nSolução:\nCausa:\nContramedida:\ntempo:';
        setMaintenanceComment(isDefaultTemplate || !response.data.comentario_manutencao ? 'Erro:\nSolução:\nCausa:\nContramedida:\ntempo:' : response.data.comentario_manutencao || '');
        setTechnicianId(response.data.matricula_tecnico || '');
        setTechnicianName(''); // Limpar nome do técnico
        // Verificar se a matrícula do técnico é válida
        if (response.data.matricula_tecnico) {
          console.log('Matrícula do técnico encontrada:', response.data.matricula_tecnico);
          await checkTechnicianId(response.data.matricula_tecnico);
        }
        
        // Carregar dados de produção se existirem
        setOperatorId(response.data.matricula_operador || '');
        setOperatorName(''); // Limpar nome do operador
        console.log('Matrícula do operador carregada:', response.data.matricula_operador);
        // Verificar se a matrícula do operador é válida
        if (response.data.matricula_operador) {
          console.log('Verificando matrícula do operador:', response.data.matricula_operador);
          await checkOperatorId(response.data.matricula_operador);
        }
      } else {
        setExistingComment(null);
        setCurrentComment('');
        // Definir o template padrão para novo comentário de manutenção
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
      // Definir o template padrão para novo comentário de manutenção
      setMaintenanceComment('Erro:\nSolução:\nCausa:\nContramedida:\ntempo:');
      setTechnicianId('');
      setTechnicianName('');
      setOperatorId('');
      setOperatorName('');
    }
  
 // Obter valores de target e produção real
 const target = listCard.find(item => item.Linha === linha && item.Modelo === modelo)?.Meta;
 const actual = listCard.find(item => item.Linha === linha && item.Modelo === modelo)?.[horario];
 
 setCurrentTarget(target);
 setCurrentActual(actual);
 
 // Calcular diferença
 const difference = target - actual;
 setDifference(difference);
 
 // Calcular perda em minutos
 const percentageAchieved = (target / 60);
 const differenceInMinutes = 60 - (actual / percentageAchieved);
 setDifferenceInMinutes(differenceInMinutes);

 setCommentModalOpen(true);
};

  const handleOverlayClick = () => {
    setCommentModalOpen(false);
  };

//Clique unico
  const handleCellClick = async (linha, modelo, horario) => {
    const cellKey = `${date}-${linha}-${modelo}-${horario}`;
    if (markedCells[cellKey]) {
      try {
        const response = await Axios.get(`http://105.103.39.102:8080/horaProd_comments`, {
          params: {
            data: date,
            linha,
            modelo,
            horario
          }
        });
        
        console.log('Dados do comentário ao clicar na célula:', response.data);
        
        if (response.data) {
          // Obter nomes dos responsáveis
          const operatorName = response.data.matricula_operador 
            ? await getOperatorName(response.data.matricula_operador) 
            : '';
          const technicianName = response.data.matricula_tecnico 
            ? await getTechnicianName(response.data.matricula_tecnico) 
            : '';
          
          // Criar elementos JSX para exibir os comentários de forma estruturada
          const description = (
            <div>
              {response.data.comentario && (
                <div>
                  <div ><strong style={{color:'#393D7E'}}>Produção:</strong> {response.data.comentario}</div>
                  {response.data.matricula_operador && (
                    <div><strong style={{color:'#393D7E'}}>Resp. Produção:</strong> {operatorName}</div>
                  )}
                </div>
              )}
              {response.data.comentario_manutencao && response.data.comentario && (
                <div style={{ margin: '8px 0' }}></div>
              )}
              {response.data.comentario_manutencao && (
                <div>
                   <div ><strong style={{color:'#296374'}}>Manutenção:</strong> {response.data.comentario_manutencao}</div>
                  {response.data.matricula_tecnico && (
                    <div><strong style={{color:'#296374'}}>Resp. Manutenção:</strong> {technicianName}</div>
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
  const [activeTab, setActiveTab] = useState('producao');
  const [maintenanceComment, setMaintenanceComment] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  const [isTechnicianValid, setIsTechnicianValid] = useState(null); // null = não verificado, true = válido, false = inválido
  
  // Estados para matrícula do operador (produção)
  const [operatorId, setOperatorId] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [isOperatorValid, setIsOperatorValid] = useState(null); // null = não verificado, true = válido, false = inválido

  // Verificar se a matrícula do técnico é válida (apenas para manutenção)
  const checkTechnicianId = async (matricula) => {
    if (!matricula) {
      setIsTechnicianValid(null);
      setTechnicianName('');
      return;
    }

    try {
      const response = await Axios.get(`http://105.103.39.102:8080/pessoas`);
      const technician = response.data.find(person => person.matricula === matricula);
      
      if (technician) {
        // Verificar se o job_class é de manutenção (diferente de 'Production')
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

  // Verificar se a matrícula do operador é válida (apenas para produção)
  const checkOperatorId = async (matricula) => {
    console.log('Iniciando verificação da matrícula do operador:', matricula);
    if (!matricula) {
      setIsOperatorValid(null);
      setOperatorName('');
      return;
    }

    try {
      const response = await Axios.get(`http://105.103.39.102:8080/pessoas`);
      console.log('Resposta da API de pessoas:', response.data);
      const operator = response.data.find(person => person.matricula === matricula);
      console.log('Operador encontrado:', operator);
      
      if (operator) {
        // Verificar se o job_class é de produção
        if (operator.job_class && operator.job_class.toLowerCase() === 'production') {
          setIsOperatorValid(true);
          setOperatorName(operator.funcionarios);
          console.log('Operador válido:', operator.funcionarios);
        } else {
          setIsOperatorValid(false);
          setOperatorName('Matrícula inválida para produção');
          console.log('Matrícula inválida para produção');
        }
      } else {
        setIsOperatorValid(false);
        setOperatorName('');
        console.log('Operador não encontrado');
      }
    } catch (error) {
      console.error('Erro ao verificar matrícula do operador:', error);
      setIsOperatorValid(false);
      setOperatorName('');
    }
  };

  // Verificar a matrícula quando ela muda
  useEffect(() => {
    if (activeTab === 'manutencao' && technicianId) {
      const timer = setTimeout(() => {
        checkTechnicianId(technicianId);
      }, 500); // Debounce de 500ms
      
      return () => clearTimeout(timer);
    } else if (activeTab === 'manutencao' && !technicianId) {
      setIsTechnicianValid(null);
      setTechnicianName('');
    }
    
    // Verificar a matrícula do operador quando ela muda
    if (activeTab === 'producao' && operatorId) {
      const timer = setTimeout(() => {
        checkOperatorId(operatorId);
      }, 500); // Debounce de 500ms
      
      return () => clearTimeout(timer);
    } else if (activeTab === 'producao' && !operatorId) {
      setIsOperatorValid(null);
      setOperatorName('');
    }
  }, [technicianId, operatorId, activeTab]);

  // Save or update comment
  const handleSaveComment = async () => {
    if (!currentCell) return;
    
    // Verificar se a matrícula do técnico é válida (apenas se foi preenchida)
    if (activeTab === 'manutencao' && technicianId.trim() && isTechnicianValid !== true) {
      alert('Por favor, insira uma matrícula de técnico válida.');
      return;
    }
    
    // Verificar se a matrícula do operador é válida (apenas se foi preenchida)
    if (activeTab === 'producao' && operatorId.trim() && isOperatorValid !== true) {
      alert('Por favor, insira uma matrícula de operador válida.');
      return;
    }
  
  try {
    console.log('Salvando comentário na aba:', activeTab);
    console.log('Dados da célula atual:', currentCell);
    console.log('Matrícula do operador:', operatorId);
    console.log('Matrícula do técnico:', technicianId);
    
    if (activeTab === 'manutencao') {
      // Salvar comentário de manutenção
      const maintenanceData = {
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
      };
      console.log('Dados de manutenção a serem salvos:', maintenanceData);
      const response = await Axios.post(`http://105.103.39.102:8080/horaProdUp_comments`, maintenanceData);
      console.log('Resposta do servidor ao salvar manutenção:', response.data);
    } else {
      // Salvar comentário de produção (comportamento original)
      const productionData = {
        data: date,
        linha: currentCell.linha,
        modelo: currentCell.modelo,
        horario: currentCell.horario,
        comentario: currentComment,
        matricula_operador: operatorId, // Adicionar matrícula do operador
        target: currentTarget,
        actual: currentActual,
        difference: difference,
        loss_minutes: differenceInMinutes,
        tipo_comentario: 'producao'
      };
      console.log('Dados de produção a serem salvos:', productionData);
      const response = await Axios.post(`http://105.103.39.102:8080/horaProdUp_comments`, productionData);
      console.log('Resposta do servidor ao salvar produção:', response.data);
    }
    
    // Update cell marking based on comment
    const cellKey = `${date}-${currentCell.linha}-${currentCell.modelo}-${currentCell.horario}`;
    setMarkedCells(prev => ({
      ...prev,
      [cellKey]: (activeTab === 'manutencao' ? maintenanceComment : currentComment).trim() !== '',
      [`${cellKey}_prod`]: activeTab === 'producao' && currentComment.trim() !== '',
      [`${cellKey}_manut`]: activeTab === 'manutencao' && maintenanceComment.trim() !== ''
    }));
    
    // Resetar estados
    setActiveTab('producao');
    setMaintenanceComment('');
    setTechnicianId('');
    setOperatorId(''); // Resetar matrícula do operador
    
    setCommentModalOpen(false);
  } catch (error) {
    console.error('Erro ao salvar comentário:', error);
  }
  };

  const hours = useMemo(() => {
    return {
      "HORARIO_1_1": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(7,55)),
      "HORARIO_1_2": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(8,55)),
      "HORARIO_1_3": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(9,55)),
      "HORARIO_1_4": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(10,55)),
      "HORARIO_1_5": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(11,55)),
      "HORARIO_1_6": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(12,55)),
      "HORARIO_1_7": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(13,55)),
      "HORARIO_1_8": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(14,55)),
      "HORARIO_2_1": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(15,55)),
      "HORARIO_2_2": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(16,45)),
    }
  }, [date]);

const uniqueLinesCount = useMemo(() => {
    const filteredLines = listCard.filter(item => item.Linha !== 'Total');
    const count = new Set(filteredLines.map(item => item.Linha)).size;
    // Subtrai 1 do total para corrigir a contagem que sempre mostra 1 a mais
    return Math.max(0, count - 1);
  }, [listCard]);

  const LineCounter = ({ uniqueLines }) => {
    return (
      <div className="line-counter">
        <div className="counter-title">Total de Linhas: {uniqueLines}</div>
      </div>
    );
  };

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.reload();
    }, 180000);
    
    return () => clearTimeout(timer);
  }, []);

  
  function handleClick(event) {
    console.info('You clicked a breadcrumb.');
}

  return (
    <>
      <Header />
      <div className='justify-content-center'>
      <Helmet>
                <title>Hora Mounter</title>
            </Helmet>

            <Breadcrumbs aria-label="breadcrumb" style={{ marginTop: 5, marginLeft:25 }}>
                <Typography sx={{ color: 'text.primary' }}>Hora Mounter </Typography>
                <Link underline="hover" color="blue" href="HoraProdLista" onClick={handleClick}>
                Histórico Mounter
                </Link>
            </Breadcrumbs>

        <Box>
          <h2 className='h2' style={{ marginTop: 10, marginBottom: -30, fontSize: '30px' }}>
            PRODUÇÃO MOUNTER
          </h2>

          <div style={{ marginBottom: -70 }}>
            <ExportToExcel apiData={listCard} fileName={fileName} />
            <LineCounter uniqueLines={uniqueLinesCount} />
          </div>

          <TableContainer>
            <Table className='hora-prod-table' style={{ marginTop: 70 }}>
              <TableHead>
                <TableRow>
                  <TableCell style={{ width: '30%', backgroundColor: 'white', borderColor: 'white', fontSize: '15px', fontWeight: 'bold' }} colSpan={3}>
                    <input 
                      style={{ border: 'none', boxSizing: 'border-box', borderBottom: '2px solid black', fontSize: '15px' }}
                      type="date" 
                      value={date} 
                      onChange={(e) => setDate(e.target.value)} 
                    />

                    <Button 
                      variant='contained' 
                      href="/HoraHora"
                      style={{ width: 65, color: 'white', fontSize: 15, fontWeight: 'bold', marginLeft: 10, height: 36 }}
                    >
                      1T
                    </Button>

                    <Button 
                      href="/HoraHora2T"
                      style={{ width: 65, color: 'black', fontSize: 15, backgroundColor: 'transparent', border: 'solid 1px', borderColor: 'gray', fontWeight: 10, height: 36 }}
                    >
                      2T
                    </Button>

                    <Button 
                      href="/HoraHora3T"
                      style={{ width: 65, color: 'black', fontSize: 15, backgroundColor: 'transparent', border: 'solid 1px', borderColor: 'gray', fontWeight: 10, height: 36 }}
                    >
                      3T
                    </Button>
                  </TableCell>

                  <TableCell style={{ width: '5%', backgroundColor: 'white', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'black' }}>07:55</TableCell>
                  <TableCell style={{ width: '5%', backgroundColor: 'white', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'black' }}>08:55</TableCell>
                  <TableCell style={{ width: '5%', backgroundColor: 'white', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'black' }}>09:55</TableCell>
                  <TableCell style={{ width: '5%', backgroundColor: 'white', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'black' }}>10:55</TableCell>
                  <TableCell style={{ width: '5%', backgroundColor: 'white', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'black' }}>11:55</TableCell>
                  <TableCell style={{ width: '5%', backgroundColor: 'white', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'black' }}>12:55</TableCell>
                  <TableCell style={{ width: '5%', backgroundColor: 'white', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'black' }}>13:55</TableCell>
                  <TableCell style={{ width: '5%', backgroundColor: 'white', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'black' }}>14:55</TableCell>
                  <TableCell style={{ width: '5%', backgroundColor: 'white', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'black' }}>15:55</TableCell>
                  <TableCell style={{ width: '5%', backgroundColor: 'white', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'black' }}>16:45</TableCell>
                  <TableCell style={{ width: '5%', backgroundColor: 'white', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'black' }}></TableCell>
                  <TableCell style={{ width: '8%', backgroundColor: 'white', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'black' }}></TableCell>
                </TableRow>

<TableRow className='head-of-head'>
                  <th>Line</th>
                  <th>Model</th>
                  <th style={{ backgroundColor: '#3A59D1' }} className='target-column'>Target</th>
                  <th>1°H</th>
                  <th>2°H</th>
                  <th>3°H</th>
                  <th>4°H</th>
                  <th>5°H</th>
                  <th>6°H</th>
                  <th>7°H</th>
                  <th>8°H</th>
                  <th>9°H</th>
                  <th>10°H</th>
                  <th>Total</th>
<th>TTL Acc (%)</th>
                </TableRow>
              </TableHead>

              <TableBody>
            {listCard.map((row, index) => (
              <TableRow key={index} className={index === listCard.length - 1 ? "last-row" : ""}>
                <td>{row.Linha}</td>
                <td>{row.Modelo}</td>
                <td className='target-column'>{row.Meta}</td>

                {['HORARIO_1_1', 'HORARIO_1_2', 'HORARIO_1_3', 'HORARIO_1_4', 
                  'HORARIO_1_5', 'HORARIO_1_6', 'HORARIO_1_7', 'HORARIO_1_8',
                  'HORARIO_2_1', 'HORARIO_2_2'].map((accessor, colIndex) => {

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
                      onClick={() => handleCellClick(row.Linha, row.Modelo, accessor)} // Adicionar o evento de clique único
                      onDoubleClick={() => handleCellDoubleClick(row.Linha, row.Modelo, accessor)} // Manter o evento de clique duplo
                      style={{ cursor: 'pointer', position: 'relative' }}
                    >
                      {row[accessor]}
                    {isMarked && (
                      <span className="marker-icon" title="Esta célula possui comentário" style={{ position: 'absolute', top: '2px', left: '2px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24">
                          <path fill="currentColor" d="m13.299 3.148l8.634 14.954a1.5 1.5 0 0 1-1.299 2.25H3.366a1.5 1.5 0 0 1-1.299-2.25l8.634-14.954c.577-1 2.02-1 2.598 0" class="duoicon-secondary-layer" opacity=".3"/>
                          <path fill="currentColor" d="M12 8a1 1 0 0 0-.993.883L11 9v4a1 1 0 0 0 1.993.117L13 13V9a1 1 0 0 0-1-1m0 7a1 1 0 1 0 0 2a1 1 0 0 0 0-2" class="duoicon-primary-layer"/>
                        </svg>
                      </span>
                    )}
                          </td>
                        );
})}
                    
<td className="total-column">{row.Total}</td>
<td className={(() => {
                      if (row.Linha === 'Total') return '';
                      
                      // Horários do 1T
                      const horarios = [
                        'HORARIO_1_1', 'HORARIO_1_2', 'HORARIO_1_3', 'HORARIO_1_4',
                        'HORARIO_1_5', 'HORARIO_1_6', 'HORARIO_1_7', 'HORARIO_1_8',
                        'HORARIO_2_1', 'HORARIO_2_2'
                      ];
                      
                      // Filtrar horários que já passaram ou estão em andamento (com valores diferentes de zero ou horário atual)
                      const horariosValidos = horarios.filter(horario => {
                        const valor = parseInt(row[horario]) || 0;
                        const horaAtual = hours[horario];
                        return valor > 0 || (horaAtual && new Date() > horaAtual);
                      });
                      
                      // Calcular soma da produção apenas para horários válidos
                      const somaProducao = horariosValidos.reduce((acc, horario) => {
                        return acc + (parseInt(row[horario]) || 0);
                      }, 0);
                      
                      // Meta acumulada (meta por hora * quantidade de horas válidas)
                      const metaAcumulada = (parseInt(row.Meta) || 0) * horariosValidos.length;
                      
// Calcular porcentagem de rendimento
                      const rendimento = metaAcumulada > 0 ? ((somaProducao / metaAcumulada) * 100) : 0;
                      
// Aplicar classe com base no valor
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
                          // Horários do 1T
                          const horarios = [
                            'HORARIO_1_1', 'HORARIO_1_2', 'HORARIO_1_3', 'HORARIO_1_4',
                            'HORARIO_1_5', 'HORARIO_1_6', 'HORARIO_1_7', 'HORARIO_1_8',
                            'HORARIO_2_1', 'HORARIO_2_2'
                          ];
                          
                          // Filtrar horários que já passaram ou estão em andamento (com valores diferentes de zero ou horário atual)
                          const horariosValidos = horarios.filter(horario => {
                            const valor = parseInt(row[horario]) || 0;
                            const horaAtual = hours[horario];
                            return valor > 0 || (horaAtual && new Date() > horaAtual);
                          });
                          
                          // Calcular soma da produção apenas para horários válidos
                          const somaProducao = horariosValidos.reduce((acc, horario) => {
                            return acc + (parseInt(row[horario]) || 0);
                          }, 0);
                          
                          // Meta acumulada (meta por hora * quantidade de horas válidas)
                          const metaAcumulada = (parseInt(row.Meta) || 0) * horariosValidos.length;
                          
                          // Calcular porcentagem de rendimento
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

          {isLoading && (
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
              {/* Abas */}
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
                
                {/* Novos campos adicionados */}
                <p><strong>Target:</strong> {currentTarget}</p>
                <p><strong>Atingido:</strong> {currentActual}</p>
                
                {difference !== 0 && (
                  <p style={{ color: difference > 0 ? 'red' : 'green' }}>
                    <strong style={{color:'black'}}>Diff:</strong> {Math.abs(difference)}
                  </p>
                )}
                {difference !== 0 && (
                  <p style={{ color: difference > 0 ? 'red' : 'green' }}>
                    <strong style={{color:'black'}}>Loss:</strong> {Math.abs(differenceInMinutes).toFixed(2)} min
                  </p>
                )}
              </div>
              
              {/* Conteúdo da aba de produção */}
              {activeTab === 'producao' && (
                <div className="production-tab">
                  <div className="form-group">
                    <label htmlFor="operatorId">Matrícula do Operador:</label>
                    <input
                      type="text"
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
                    {console.log('Renderizando aba de produção - operatorId:', operatorId, 'isOperatorValid:', isOperatorValid, 'operatorName:', operatorName)}
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

              {/* Conteúdo da aba de manutenção */}
              {activeTab === 'manutencao' && (
                <div className="maintenance-tab">
                  <div className="form-group">
                    <label htmlFor="technicianId">Matrícula do Técnico:</label>
                    <input
                      type="text"
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
                
                {existingComment && (
                  <button
                    onClick={() => {
                      setCurrentComment('');
                      setExistingComment(null);
                      setMaintenanceComment('');
                      setTechnicianId('');
                    }}
                    className="clear-button"
                  >
                    Limpar Comentário
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