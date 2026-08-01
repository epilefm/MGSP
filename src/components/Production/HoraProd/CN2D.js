import React, { useEffect, useMemo, useState } from "react";
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
import { Typography } from '@mui/material';
import { Helmet } from 'react-helmet';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import { ExportToExcel } from '../../Excel/Excel_Export'
import { notification } from 'antd';
import Header from "../../Layout/MGSPHead/Header";

// Função para calcular a soma de uma coluna
const calculateColumnSum = (data, columnKey) => {
  return data.reduce((sum, row) => {
    const value = parseInt(row[columnKey]) || 0;
    return sum + value;
  }, 0);
};

// Função para calcular a soma de todas as colunas de horário
const calculateAllHoursSum = (data, hourKeys) => {
  const sums = {};
  hourKeys.forEach(key => {
    sums[key] = calculateColumnSum(data, key);
  });
  return sums;
};

export default function GravacaoCNAllTurns() {
  const [listCard1T, setListCard1T] = useState([]);
  const [listCard2T, setListCard2T] = useState([]);
  const [listCard3T, setListCard3T] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isLoading, setIsLoading] = useState(false);
  const [markedCells1T, setMarkedCells1T] = useState(() => {
    const saved = localStorage.getItem('markedCellsCN1T_All');
    return saved ? JSON.parse(saved) : {};
  });
  const [markedCells2T, setMarkedCells2T] = useState(() => {
    const saved = localStorage.getItem('markedCellsCN2T_All');
    return saved ? JSON.parse(saved) : {};
  });
  const [markedCells3T, setMarkedCells3T] = useState(() => {
    const saved = localStorage.getItem('markedCellsCN3T_All');
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

  const fileName = "Gravacao_CN_Todos_Turnos";

  // Dados combinados para exportação
  const combinedData = [
    { turno: '1T', data: listCard1T },
    { turno: '2T', data: listCard2T },
    { turno: '3T', data: listCard3T }
  ];

  // Persist marked cells to localStorage
  useEffect(() => {
    localStorage.setItem('markedCellsCN1T_All', JSON.stringify(markedCells1T));
  }, [markedCells1T]);

  useEffect(() => {
    localStorage.setItem('markedCellsCN2T_All', JSON.stringify(markedCells2T));
  }, [markedCells2T]);

  useEffect(() => {
    localStorage.setItem('markedCellsCN3T_All', JSON.stringify(markedCells3T));
  }, [markedCells3T]);

  // Fetch production data for all shifts
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch data for all three shifts
        const [response1T, response2T, response3T] = await Promise.all([
          Axios.get(`http://105.103.112.18:8080/GravacaoCN?data=${date}`),
          Axios.get(`http://105.103.112.18:8080/GravacaoCN2T?data=${date}`),
          Axios.get(`http://105.103.112.18:8080/GravacaoCN3T?data=${date}`)
        ]);
        
        setListCard1T(response1T.data);
        setListCard2T(response2T.data);
        setListCard3T(response3T.data);
      } catch (error) {
        console.error('Erro ao buscar dados de Gravação CN:', error);
        notification.error({
          message: 'Erro',
          description: 'Falha ao carregar os dados de Gravação CN',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [date]);

  // Check if a cell has a comment
  const hasComment = async (Maquina, modelo, horario) => {
    try {
      const response = await Axios.get(`http://105.103.112.18:8080/gravacaoCN_comments`, {
        params: {
          data: date,
          Maquina,
          modelo,
          horario
        }
      });
      return response.data && response.data.comentario;
    } catch (error) {
      console.error('Erro ao verificar comentário:', error);
      return false;
    }
  };

  // Load marked cells based on existing comments for 1T
  useEffect(() => {
    const loadMarkedCells = async () => {
      const cellsToCheck = [];
      
      for (const row of listCard1T) {
        if (row.Maquina === 'Total') continue;
        
        const horarios = [
          '1T_1', '1T_2', '1T_3', '1T_4',
          '1T_5', '1T_6', '1T_7', '1T_8',
          '1T_9', '1T_10'
        ];
        
        for (const horario of horarios) {
          const cellKey = `${date}-${row.Maquina}-${row.Modelo}-${horario}`;
          cellsToCheck.push({
            cellKey,
            promise: hasComment(row.Maquina, row.Modelo, horario)
          });
        }
      }
      
      const results = await Promise.all(cellsToCheck.map(cell => cell.promise));
      
      const newMarkedCells = {};
      results.forEach((hasComent, index) => {
        if (hasComent) {
          const cellKey = cellsToCheck[index].cellKey;
          newMarkedCells[cellKey] = true;
        }
      });
      
      setMarkedCells1T(prev => ({ ...prev, ...newMarkedCells }));
    };
    
    if (listCard1T.length > 0) {
      loadMarkedCells();
    }
  }, [listCard1T, date]);

  // Load marked cells based on existing comments for 2T
  useEffect(() => {
    const loadMarkedCells = async () => {
      const cellsToCheck = [];
      
      for (const row of listCard2T) {
        if (row.Maquina === 'Total') continue;
        
        const horarios = [
          '2T_1', '2T_2', '2T_3', '2T_4',
          '2T_5', '2T_6', '2T_7', '2T_8',
          '2T_9'
        ];
        
        for (const horario of horarios) {
          const cellKey = `${date}-${row.Maquina}-${row.Modelo}-${horario}`;
          cellsToCheck.push({
            cellKey,
            promise: hasComment(row.Maquina, row.Modelo, horario)
          });
        }
      }
      
      const results = await Promise.all(cellsToCheck.map(cell => cell.promise));
      
      const newMarkedCells = {};
      results.forEach((hasComent, index) => {
        if (hasComent) {
          const cellKey = cellsToCheck[index].cellKey;
          newMarkedCells[cellKey] = true;
        }
      });
      
      setMarkedCells2T(prev => ({ ...prev, ...newMarkedCells }));
    };
    
    if (listCard2T.length > 0) {
      loadMarkedCells();
    }
  }, [listCard2T, date]);

  // Load marked cells based on existing comments for 3T
  useEffect(() => {
    const loadMarkedCells = async () => {
      const cellsToCheck = [];
      
      for (const row of listCard3T) {
        if (row.Maquina === 'Total') continue;
        
        const horarios = [
          '3T_1', '3T_2', '3T_3', '3T_4'
        ];
        
        for (const horario of horarios) {
          const cellKey = `${date}-${row.Maquina}-${row.Modelo}-${horario}`;
          cellsToCheck.push({
            cellKey,
            promise: hasComment(row.Maquina, row.Modelo, horario)
          });
        }
      }
      
      const results = await Promise.all(cellsToCheck.map(cell => cell.promise));
      
      const newMarkedCells = {};
      results.forEach((hasComent, index) => {
        if (hasComent) {
          const cellKey = cellsToCheck[index].cellKey;
          newMarkedCells[cellKey] = true;
        }
      });
      
      setMarkedCells3T(prev => ({ ...prev, ...newMarkedCells }));
    };
    
    if (listCard3T.length > 0) {
      loadMarkedCells();
    }
  }, [listCard3T, date]);

  // duplo clique para abrir modal
  const handleCellDoubleClick = async (Maquina, modelo, horario, shift) => {
    handleCellClick(Maquina, modelo, horario, shift);
    const cellKey = `${date}-${Maquina}-${modelo}-${horario}`;
    setCurrentCell({ Maquina, modelo, horario, shift });
    
    try {
      const response = await Axios.get(`http://105.103.112.18:8080/gravacaoCN_comments`, {
        params: {
          data: date,
          Maquina,
          modelo,
          horario
        }
      });
      
      if (response.data) {
        setExistingComment(response.data);
        setCurrentComment(response.data.comentario || '');
      } else {
        setExistingComment(null);
        setCurrentComment('');
      }
    } catch (error) {
      console.error('Erro ao buscar comentário:', error);
      setExistingComment(null);
      setCurrentComment('');
    }
  
    // Obter valores de target e produção real
    let target, actual;
    if (shift === '1T') {
      target = listCard1T.find(item => item.Maquina === Maquina && item.Modelo === modelo)?.Meta;
      actual = listCard1T.find(item => item.Maquina === Maquina && item.Modelo === modelo)?.[horario];
    } else if (shift === '2T') {
      target = listCard2T.find(item => item.Maquina === Maquina && item.Modelo === modelo)?.Meta;
      actual = listCard2T.find(item => item.Maquina === Maquina && item.Modelo === modelo)?.[horario];
    } else if (shift === '3T') {
      target = listCard3T.find(item => item.Maquina === Maquina && item.Modelo === modelo)?.Meta;
      actual = listCard3T.find(item => item.Maquina === Maquina && item.Modelo === modelo)?.[horario];
    }
 
    setCurrentTarget(target);
    setCurrentActual(actual);
 
    // Calcular diferença
    const difference = target && actual ? target - actual : 0;
    setDifference(difference);
 
    // Calcular perda em minutos
    if (target && actual && target > 0) {
      const percentageAchieved = (actual / target) * 100;
      const differenceInMinutes = ((target - actual) / target) * 60;
      setDifferenceInMinutes(differenceInMinutes);
    } else {
      setDifferenceInMinutes(0);
    }

    setCommentModalOpen(true);
  };

  const handleOverlayClick = () => {
    setCommentModalOpen(false);
    // Resetar o estado do modal quando fechado
    setCurrentComment('');
    setExistingComment(null);
    setCurrentCell(null);
    setCurrentTarget(null);
    setCurrentActual(null);
    setDifference(null);
    setDifferenceInMinutes(null);
  };

  //Clique unico
  const handleCellClick = async (Maquina, modelo, horario, shift) => {
    const cellKey = `${date}-${Maquina}-${modelo}-${horario}`;
    let isMarked = false;
    
    if (shift === '1T') {
      isMarked = markedCells1T[cellKey];
    } else if (shift === '2T') {
      isMarked = markedCells2T[cellKey];
    } else if (shift === '3T') {
      isMarked = markedCells3T[cellKey];
    }
    
    if (isMarked) {
      try {
        const response = await Axios.get(`http://105.103.112.18:8080/gravacaoCN_comments`, {
          params: {
            data: date,
            Maquina,
            modelo,
            horario
          }
        });
        
        if (response.data && response.data.comentario) {
          notification.open({
            message: 'Status da Maquina',
            description: response.data.comentario,
            duration: 5,
          }); 
        }
      } catch (error) {
        console.error('Erro ao buscar comentário:', error);
      }
    }
  };

  // Save or update comment
  const handleSaveComment = async () => {
    if (!currentCell) return;
    
    try {
      await Axios.post(`http://105.103.112.18:8080/gravacaoCNUp_comments`, {
        data: date,
        Maquina: currentCell.Maquina,
        modelo: currentCell.modelo,
        horario: currentCell.horario,
        comentario: currentComment,
        target: currentTarget,        
        actual: currentActual,        
        difference: difference,       
        loss_minutes: differenceInMinutes 
      });
      
      // Update cell marking based on comment
      const cellKey = `${date}-${currentCell.Maquina}-${currentCell.modelo}-${currentCell.horario}`;
      if (currentCell.shift === '1T') {
        setMarkedCells1T(prev => ({ ...prev, [cellKey]: currentComment.trim() !== '' }));
      } else if (currentCell.shift === '2T') {
        setMarkedCells2T(prev => ({ ...prev, [cellKey]: currentComment.trim() !== '' }));
      } else if (currentCell.shift === '3T') {
        setMarkedCells3T(prev => ({ ...prev, [cellKey]: currentComment.trim() !== '' }));
      }
      
      // Atualizar imediatamente o existingComment para refletir a mudança
      setExistingComment({
        data: date,
        Maquina: currentCell.Maquina,
        modelo: currentCell.modelo,
        horario: currentCell.horario,
        comentario: currentComment,
        target: currentTarget,
        actual: currentActual,
        difference: difference,
        loss_minutes: differenceInMinutes
      });
      
      setCommentModalOpen(false);
      notification.success({
        message: 'Sucesso',
        description: 'Comentário salvo com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao salvar comentário:', error);
      notification.error({
        message: 'Erro',
        description: 'Falha ao salvar o comentário',
      });
    }
  };

  const hours1T = useMemo(() => {
    return {
      "1T_1": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(7,55)),
      "1T_2": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(8,55)),
      "1T_3": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(9,55)),
      "1T_4": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(10,55)),
      "1T_5": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(11,55)),
      "1T_6": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(12,55)),
      "1T_7": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(13,55)),
      "1T_8": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(14,55)),
      "1T_9": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(15,55)),
      "1T_10": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(16,45))
    }
  }, [date]);

  const hours2T = useMemo(() => {
    return {
      "2T_1": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(17,55)),
      "2T_2": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(18,55)),
      "2T_3": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(19,55)),
      "2T_4": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(20,55)),
      "2T_5": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(21,55)),
      "2T_6": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(22,55)),
      "2T_7": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(23,55)),
      "2T_8": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(0,55)),
      "2T_9": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(1,55)),
    }
  }, [date]);

  const hours3T = useMemo(() => {
    return {
      "3T_1": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(3,55)),
      "3T_2": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(4,55)),
      "3T_3": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(5,55)),
      "3T_4": new Date(new Date(date.slice(0,10).replace("-",",")).setHours(6,55)),
    }
  }, [date]);

  const uniqueLinesCount1T = useMemo(() => {
    const filteredLines = listCard1T.filter(item => item.Maquina !== 'Total');
    return new Set(filteredLines.map(item => item.Maquina)).size;
  }, [listCard1T]);

  const uniqueLinesCount2T = useMemo(() => {
    const filteredLines = listCard2T.filter(item => item.Maquina !== 'Total');
    return new Set(filteredLines.map(item => item.Maquina)).size;
  }, [listCard2T]);

  const uniqueLinesCount3T = useMemo(() => {
    const filteredLines = listCard3T.filter(item => item.Maquina !== 'Total');
    return new Set(filteredLines.map(item => item.Maquina)).size;
  }, [listCard3T]);

  const LineCounter = ({ uniqueLines }) => {
    return (
      <div className="line-counter">
        <div className="counter-title">Total de Maquinas: {uniqueLines}</div>
      </div>
    );
  };

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.reload();
    }, 120000);
    
    return () => clearTimeout(timer);
  }, []);

  
  function handleClick(event) {
    console.info('You clicked a breadcrumb.');
}

  // Calcular somas para cada turno
  const sums1T = useMemo(() => {
    const hourKeys = ['1T_1', '1T_2', '1T_3', '1T_4', '1T_5', '1T_6', '1T_7', '1T_8', '1T_9', '1T_10'];
    return calculateAllHoursSum(listCard1T.filter(row => row.Maquina !== 'Total'), hourKeys);
  }, [listCard1T]);

  const sums2T = useMemo(() => {
    const hourKeys = ['2T_1', '2T_2', '2T_3', '2T_4', '2T_5', '2T_6', '2T_7', '2T_8', '2T_9'];
    return calculateAllHoursSum(listCard2T.filter(row => row.Maquina !== 'Total'), hourKeys);
  }, [listCard2T]);

  const sums3T = useMemo(() => {
    const hourKeys = ['3T_1', '3T_2', '3T_3', '3T_4'];
    return calculateAllHoursSum(listCard3T.filter(row => row.Maquina !== 'Total'), hourKeys);
  }, [listCard3T]);

  // Função para calcular o total por Maquina (soma dos horários)
  const calculateRowTotal = (row, hourKeys) => {
    return hourKeys.reduce((sum, key) => {
      const value = parseInt(row[key]) || 0;
      return sum + value;
    }, 0);
  };

  // Função para calcular o total por Maquina para 1T
  const calculateRowTotal1T = (row) => {
    const hourKeys = ['1T_1', '1T_2', '1T_3', '1T_4', '1T_5', '1T_6', '1T_7', '1T_8', '1T_9', '1T_10'];
    return calculateRowTotal(row, hourKeys);
  };

  // Função para calcular o total por Maquina para 2T
  const calculateRowTotal2T = (row) => {
    const hourKeys = ['2T_1', '2T_2', '2T_3', '2T_4', '2T_5', '2T_6', '2T_7', '2T_8', '2T_9'];
    return calculateRowTotal(row, hourKeys);
  };

  // Função para calcular o total por Maquina para 3T
  const calculateRowTotal3T = (row) => {
    const hourKeys = ['3T_1', '3T_2', '3T_3', '3T_4'];
    return calculateRowTotal(row, hourKeys);
  };

  return (
    <>
      <Header />
      <div className='justify-content-center'>
      <Helmet>
                <title>2D CN</title>
            </Helmet>

            <Breadcrumbs aria-label="breadcrumb" style={{ marginTop: 5, marginLeft:25 }}>
                <Typography sx={{ color: 'text.primary' }}>2D CN</Typography>
                <Link underline="hover" color="blue" href="HoraProdLista" onClick={handleClick}>
                Histórico Gravação CN
                </Link>
            </Breadcrumbs>

        <Box>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '0 20px' }}>
            <h2 className='h2' style={{ fontSize: '28px', fontWeight: '600', color: '#333', margin: 0, textAlign: 'center', flex: 1 }}>
              2D CN - Hora a Hora
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label htmlFor="date-filter" style={{ fontWeight: '500', color: '#555' }}>Data:</label>
                <input 
                  id="date-filter"
                  style={{ 
                    border: '1px solid #ddd', 
                    borderRadius: '4px', 
                    padding: '8px 12px', 
                    fontSize: '14px', 
                    width: '140px',
                    backgroundColor: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                />
              </div>
              <ExportToExcel apiData={combinedData} fileName={fileName} />
            </div>
          </div>

          {/* 1T Table */}
          <div style={{ 
            backgroundColor: '#3A59D1', 
            color: 'white', 
            padding: '12px 20px', 
            borderRadius: '8px 8px 0 0', 
            fontWeight: '600', 
            fontSize: '18px',
            maxWidth: '95%',
            margin: '15px auto 0',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}>
            1º TURNO (06:55 - 16:45)
          </div>
          <TableContainer style={{ maxWidth: '95%', overflowX: 'auto', margin: '0 auto', marginTop: '0' }}>
            <Table className='hora-prod-table' style={{ tableLayout: 'auto', width: '100%' }}>
              <TableHead>
                <TableRow>
                  <TableCell style={{ width: '7%', backgroundColor: '#3A59D1', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>Maquina</TableCell>
                  <TableCell style={{ width: '11%', backgroundColor: '#3A59D1', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>Modelo</TableCell>
                  <TableCell style={{ width: '4%', backgroundColor: '#3A59D1', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>Target</TableCell>
                  <TableCell style={{ width: '6%', backgroundColor: '#405cc4', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>07:55</TableCell>
                  <TableCell style={{ width: '6%', backgroundColor: '#405cc4', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>08:55</TableCell>
                  <TableCell style={{ width: '6%', backgroundColor: '#405cc4', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>09:55</TableCell>
                  <TableCell style={{ width: '6%', backgroundColor: '#405cc4', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>10:55</TableCell>
                  <TableCell style={{ width: '6%', backgroundColor: '#405cc4', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>11:55</TableCell>
                  <TableCell style={{ width: '6%', backgroundColor: '#405cc4', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>12:55</TableCell>
                  <TableCell style={{ width: '6%', backgroundColor: '#405cc4', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>13:55</TableCell>
                  <TableCell style={{ width: '6%', backgroundColor: '#405cc4', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>14:55</TableCell>
                  <TableCell style={{ width: '6%', backgroundColor: '#405cc4', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>15:55</TableCell>
                  <TableCell style={{ width: '6%', backgroundColor: '#405cc4', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>16:43</TableCell>
                  <TableCell style={{ width: '6%', backgroundColor: '#3A59D1', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>Total</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {listCard1T.map((row, index) => (
                  <TableRow key={`1T-${index}`}>
                    <td>{row.Maquina}</td>
                    <td>{row.Modelo}</td>
                    <td className='target-column'>{row.Meta}</td>

                      {['1T_1', '1T_2', '1T_3', '1T_4', 
                      '1T_5', '1T_6', '1T_7', '1T_8',
                      '1T_9', '1T_10'].map((accessor, colIndex) => {
                        const cellKey = `${date}-${row.Maquina}-${row.Modelo}-${accessor}`;
                        const isMarked = markedCells1T[cellKey];

                        return (
                          <td 
                            key={colIndex}
                            className={`${
                              new Date() > hours1T[accessor] 
                                ? `cell-${
                                    parseInt(row[accessor]) === parseInt(row.Meta) ? 'green' :
                                    parseInt(row[accessor]) === 0 ? 'gray' :
                                    parseInt(row[accessor]) < parseInt(row.Meta) * 0.70 ? 'red' :
                                    parseInt(row[accessor]) < parseInt(row.Meta) ? 'yellow' : 'green'
                                  }`
                                : ''
                            } ${isMarked ? 'marked-cell' : ''}`}
                            onClick={() => handleCellClick(row.Maquina, row.Modelo, accessor, '1T')}
                            onDoubleClick={() => handleCellDoubleClick(row.Maquina, row.Modelo, accessor, '1T')}
                            style={{ cursor: 'pointer', position: 'relative', textAlign: 'center' }}
                          >
                            {row[accessor]}
                            {isMarked && (
                              <span className="marker-icon" title="Esta célula possui comentário">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="m13.299 3.148l8.634 14.954a1.5 1.5 0 0 1-1.299 2.25H3.366a1.5 1.5 0 0 1-1.299-2.25l8.634-14.954c.577-1 2.02-1 2.598 0" class="duoicon-secondary-layer" opacity=".3"/><path fill="currentColor" d="M12 8a1 1 0 0 0-.993.883L11 9v4a1 1 0 0 0 1.993.117L13 13V9a1 1 0 0 0-1-1m0 7a1 1 0 1 0 0 2a1 1 0 0 0 0-2" class="duoicon-primary-layer"/></svg>
                              </span>
                            )}
                          </td>
                        );
                      })}
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                      {row.Maquina !== 'Total' ? calculateRowTotal1T(row) : ''}
                    </td>
                  </TableRow>
                ))}
                {/* Total */}
                <TableRow style={{ backgroundColor: '#365280', color: 'white', fontWeight: 'bold' }}>
                  <td colSpan={3} style={{ textAlign: 'center' }}>Total</td>
                  {['1T_1', '1T_2', '1T_3', '1T_4', 
                    '1T_5', '1T_6', '1T_7', '1T_8',
                    '1T_9', '1T_10'].map((accessor, colIndex) => (
                    <td key={colIndex} style={{ textAlign: 'center' }}>
                      {sums1T[accessor]}
                    </td>
                  ))}
                  <td style={{ textAlign: 'center' }}>
                    {/* Total geral da linha de total */}
                    {Object.values(sums1T).reduce((acc, val) => acc + val, 0)}
                  </td>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* 2T Table */}
          <div style={{ 
            backgroundColor: '#3A59D1', 
            color: 'white', 
            padding: '12px 20px', 
            borderRadius: '8px 8px 0 0', 
            fontWeight: '600', 
            fontSize: '18px',
            maxWidth: '95%',
            margin: '10px auto 0',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}>
            2º TURNO (16:45 - 02:12)
          </div>
          <TableContainer style={{ maxWidth: '95%', overflowX: 'auto', margin: '0 auto', marginTop: '0' }}>
            <Table className='hora-prod-table' style={{ tableLayout: 'auto', width: '100%' }}>
              <TableHead>
                <TableRow>
                  <TableCell style={{ width: '7%', backgroundColor: '#3A59D1', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>Maquina</TableCell>
                  <TableCell style={{ width: '11%', backgroundColor: '#3A59D1', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>Modelo</TableCell>
                  <TableCell style={{ width: '4%', backgroundColor: '#3A59D1', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>Target</TableCell>
                  <TableCell style={{ width: '6%', backgroundColor: '#405cc4', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>17:55</TableCell>
                  <TableCell style={{ width: '6%', backgroundColor: '#405cc4', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>18:55</TableCell>
                  <TableCell style={{ width: '6%', backgroundColor: '#405cc4', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>19:55</TableCell>
                  <TableCell style={{ width: '6%', backgroundColor: '#405cc4', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>20:55</TableCell>
                  <TableCell style={{ width: '6%', backgroundColor: '#405cc4', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>21:55</TableCell>
                  <TableCell style={{ width: '6%', backgroundColor: '#405cc4', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>22:55</TableCell>
                  <TableCell style={{ width: '6%', backgroundColor: '#405cc4', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>23:55</TableCell>
                  <TableCell style={{ width: '6%', backgroundColor: '#405cc4', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>00:55</TableCell>
                  <TableCell style={{ width: '6%', backgroundColor: '#405cc4', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>02:12</TableCell>
                  <TableCell style={{ width: '6%', backgroundColor: '#3A59D1', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>Total</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {listCard2T.map((row, index) => (
                  <TableRow key={`2T-${index}`}>
                    <td>{row.Maquina}</td>
                    <td>{row.Modelo}</td>
                    <td className='target-column'>{row.Meta}</td>

                      {['2T_1', '2T_2', '2T_3', '2T_4', 
                      '2T_5', '2T_6', '2T_7', '2T_8',
                      '2T_9'].map((accessor, colIndex) => {
                        const cellKey = `${date}-${row.Maquina}-${row.Modelo}-${accessor}`;
                        const isMarked = markedCells2T[cellKey];

                        return (
                          <td 
                            key={colIndex}
                            className={`${
                              new Date() > hours2T[accessor] 
                                ? `cell-${
                                    parseInt(row[accessor]) === parseInt(row.Meta) ? 'green' :
                                    parseInt(row[accessor]) === 0 ? 'gray' :
                                    parseInt(row[accessor]) < parseInt(row.Meta) * 0.70 ? 'red' :
                                    parseInt(row[accessor]) < parseInt(row.Meta) ? 'yellow' : 'green'
                                  }`
                                : ''
                            } ${isMarked ? 'marked-cell' : ''}`}
                            onClick={() => handleCellClick(row.Maquina, row.Modelo, accessor, '2T')}
                            onDoubleClick={() => handleCellDoubleClick(row.Maquina, row.Modelo, accessor, '2T')}
                            style={{ cursor: 'pointer', position: 'relative', textAlign: 'center' }}
                          >
                            {row[accessor]}
                            {isMarked && (
                              <span className="marker-icon" title="Esta célula possui comentário">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="m13.299 3.148l8.634 14.954a1.5 1.5 0 0 1-1.299 2.25H3.366a1.5 1.5 0 0 1-1.299-2.25l8.634-14.954c.577-1 2.02-1 2.598 0" class="duoicon-secondary-layer" opacity=".3"/><path fill="currentColor" d="M12 8a1 1 0 0 0-.993.883L11 9v4a1 1 0 0 0 1.993.117L13 13V9a1 1 0 0 0-1-1m0 7a1 1 0 1 0 0 2a1 1 0 0 0 0-2" class="duoicon-primary-layer"/></svg>
                              </span>
                            )}
                          </td>
                        );
                      })}
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                      {row.Maquina !== 'Total' ? calculateRowTotal2T(row) : ''}
                    </td>
                  </TableRow>
                ))}
                {/* Total */}
                <TableRow style={{ backgroundColor: '#365280', color: 'white', fontWeight: 'bold' }}>
                  <td colSpan={3} style={{ textAlign: 'center' }}>Total</td>
                  {['2T_1', '2T_2', '2T_3', '2T_4', 
                    '2T_5', '2T_6', '2T_7', '2T_8',
                    '2T_9'].map((accessor, colIndex) => (
                    <td key={colIndex} style={{ textAlign: 'center' }}>
                      {sums2T[accessor]}
                    </td>
                  ))}
                  <td style={{ textAlign: 'center' }}>
                    {/* Total geral da linha de total */}
                    {Object.values(sums2T).reduce((acc, val) => acc + val, 0)}
                  </td>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* 3T Table */}
          <div style={{ 
            backgroundColor: '#3A59D1', 
            color: 'white', 
            padding: '12px 20px', 
            borderRadius: '8px 8px 0 0', 
            fontWeight: '600', 
            fontSize: '18px',
            maxWidth: '95%',
            margin: '10px auto 0',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}>
            3º TURNO (02:12 - 06:55)
          </div>
          <TableContainer style={{ maxWidth: '95%', overflowX: 'auto', margin: '0 auto', marginTop: '0' }}>
            <Table className='hora-prod-table' style={{ tableLayout: 'auto', width: '100%' }}>
              <TableHead>
                <TableRow>
                  <TableCell style={{ width: '7%', backgroundColor: '#3A59D1', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>Maquina</TableCell>
                  <TableCell style={{ width: '11%', backgroundColor: '#3A59D1', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>Modelo</TableCell>
                  <TableCell style={{ width: '4%', backgroundColor: '#3A59D1', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>Target</TableCell>
                  <TableCell style={{ width: '6%', backgroundColor: '#405cc4', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>03:55</TableCell>
                  <TableCell style={{ width: '6%', backgroundColor: '#405cc4', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>04:55</TableCell>
                  <TableCell style={{ width: '6%', backgroundColor: '#405cc4', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>05:55</TableCell>
                  <TableCell style={{ width: '6%', backgroundColor: '#405cc4', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>06:55</TableCell>
                  <TableCell style={{ width: '6%', backgroundColor: '#3A59D1', borderColor: 'white', fontSize: '12px', fontWeight: 'bold', color:'white' }}>Total</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {listCard3T.map((row, index) => (
                  <TableRow key={`3T-${index}`}>
                    <td>{row.Maquina}</td>
                    <td>{row.Modelo}</td>
                    <td className='target-column'>{row.Meta}</td>

                    {['3T_1', '3T_2', '3T_3', '3T_4'].map((accessor, colIndex) => {
                      const cellKey = `${date}-${row.Maquina}-${row.Modelo}-${accessor}`;
                      const isMarked = markedCells3T[cellKey];

                      return (
                        <td 
                          key={colIndex}
                          className={`${
                            new Date() > hours3T[accessor] 
                              ? `cell-${
                                  parseInt(row[accessor]) === parseInt(row.Meta) ? 'green' :
                                  parseInt(row[accessor]) === 0 ? 'gray' :
                                  parseInt(row[accessor]) < parseInt(row.Meta) * 0.70 ? 'red' :
                                  parseInt(row[accessor]) < parseInt(row.Meta) ? 'yellow' : 'green'
                                }`
                              : ''
                          } ${isMarked ? 'marked-cell' : ''}`}
                          onClick={() => handleCellClick(row.Maquina, row.Modelo, accessor, '3T')}
                          onDoubleClick={() => handleCellDoubleClick(row.Maquina, row.Modelo, accessor, '3T')}
                          style={{ cursor: 'pointer', position: 'relative', textAlign: 'center' }}
                        >
                          {row[accessor]}
                          {isMarked && (
                            <span className="marker-icon" title="Esta célula possui comentário">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="m13.299 3.148l8.634 14.954a1.5 1.5 0 0 1-1.299 2.25H3.366a1.5 1.5 0 0 1-1.299-2.25l8.634-14.954c.577-1 2.02-1 2.598 0" class="duoicon-secondary-layer" opacity=".3"/><path fill="currentColor" d="M12 8a1 1 0 0 0-.993.883L11 9v4a1 1 0 0 0 1.993.117L13 13V9a1 1 0 0 0-1-1m0 7a1 1 0 1 0 0 2a1 1 0 0 0 0-2" class="duoicon-primary-layer"/></svg>
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                      {row.Maquina !== 'Total' ? calculateRowTotal3T(row) : ''}
                    </td>
                  </TableRow>
                ))}
                {/* Total */}
                <TableRow style={{ backgroundColor: '#365280', color: 'white', fontWeight: 'bold' }}>
                  <td colSpan={3} style={{ textAlign: 'center' }}>Total</td>
                  {['3T_1', '3T_2', '3T_3', '3T_4'].map((accessor, colIndex) => (
                    <td key={colIndex} style={{ textAlign: 'center' }}>
                      {sums3T[accessor]}
                    </td>
                  ))}
                  <td style={{ textAlign: 'center' }}>
                    {/* Total geral da linha de total */}
                    {Object.values(sums3T).reduce((acc, val) => acc + val, 0)}
                  </td>
                </TableRow>
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
              <h3>Justifique a Maquina</h3>
              <button 
                onClick={() => {
                  setCommentModalOpen(false);
                  // Resetar o estado do modal quando fechado
                  setCurrentComment('');
                  setExistingComment(null);
                  setCurrentCell(null);
                  setCurrentTarget(null);
                  setCurrentActual(null);
                  setDifference(null);
                  setDifferenceInMinutes(null);
                }}
                className="close-button"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="cell-info">
                <p><strong>Data:</strong> {date}</p>
                <p><strong>Maquina:</strong> {currentCell?.Maquina}</p>
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
              
              <textarea
                className="comment-textarea"
                value={currentComment}
                onChange={(e) => setCurrentComment(e.target.value)}
                placeholder="Descreva a ocorrência ou observação..."
                rows={5}
              />
              
              <div className="modal-footer">
                <button
                  onClick={handleSaveComment}
                  className="save-button"
                >
                  {existingComment ? 'Atualizar' : 'Salvar'}
                </button>
                
                {existingComment && (
                  <button
                    onClick={async () => {
                      // Limpar o comentário no banco de dados
                      try {
                        await Axios.post(`http://105.103.112.18:8080/gravacaoCNUp_comments`, {
                          data: date,
                          Maquina: currentCell.Maquina,
                          modelo: currentCell.modelo,
                          horario: currentCell.horario,
                          comentario: '',
                          target: currentTarget,        
                          actual: currentActual,        
                          difference: difference,       
                          loss_minutes: differenceInMinutes 
                        });
                        
                        // Atualizar o estado
                        setCurrentComment('');
                        setExistingComment(null);
                        
                        // Atualizar a marcação da célula
                        const cellKey = `${date}-${currentCell.Maquina}-${currentCell.modelo}-${currentCell.horario}`;
                        if (currentCell.shift === '1T') {
                          setMarkedCells1T(prev => ({ ...prev, [cellKey]: false }));
                        } else if (currentCell.shift === '2T') {
                          setMarkedCells2T(prev => ({ ...prev, [cellKey]: false }));
                        } else if (currentCell.shift === '3T') {
                          setMarkedCells3T(prev => ({ ...prev, [cellKey]: false }));
                        }
                        
                        notification.success({
                          message: 'Sucesso',
                          description: 'Comentário limpo com sucesso!',
                        });
                      } catch (error) {
                        console.error('Erro ao limpar comentário:', error);
                        notification.error({
                          message: 'Erro',
                          description: 'Falha ao limpar o comentário',
                        });
                      }
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
