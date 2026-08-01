const express = require("express");
const router = express.Router();
const db = require("../../config/db");

///--------------------------------------------------------------------------------------------------------------------------------
///--------------------------------------------------------------------------------------------------------------------------------
///--------------------------------------------------------------------------------------------------------------------------------
///--------------------------------------------------------------------------------------------------------------------------------
// Endpoints para POP_Control
// Buscar todos os registros
router.get('/api/pop-control', (req, res) => {
  const { data } = req.query;
  
  let query = `SELECT * FROM pop_control`;
  const params = [];
  
  if (data) {
    query += ` WHERE DATE(data) = ?`;
    params.push(data);
  } else {
    // Se nenhuma data for fornecida, buscar os dados do dia atual
    query += ` WHERE DATE(data) = CURDATE()`;
  }
  
  query += ` ORDER BY data DESC, hora ASC`;
  
  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Erro ao buscar registros POP_Control: ", err);
      return res.status(500).json({ error: "Erro ao buscar registros" });
    }
    
    res.status(200).json(results);
  });
});

// Criar um novo registro
router.post('/api/pop-control', (req, res) => {
  const {
    data,
    linha,
    modelo,
    part_number,
    molhagem,
    medicao_jig,
    squeegee_gap,
    antes,
    depois,
    status,
    operador
  } = req.body;
  
  // Validar campos obrigatórios
  // Nota: campo 'depois' é opcional pois foi comentado no frontend
  if (!data || !linha || !modelo || !part_number || !molhagem || 
      !medicao_jig || !squeegee_gap || !antes || !status || !operador) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  }
  
  // Obter a hora atual do sistema
  const horaAtual = new Date().toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  });
  
  const query = `
    INSERT INTO pop_control 
    (data, hora, linha, modelo, part_number, molhagem, medicao_jig, squeegee_gap, antes, depois, status, operador)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.query(query, [
    data,
    horaAtual,
    linha,
    modelo,
    part_number,
    molhagem,
    medicao_jig,
    squeegee_gap,
    antes,
    depois,
    status,
    operador
  ], (err, result) => {
    if (err) {
      console.error("Erro ao criar registro POP_Control: ", err);
      return res.status(500).json({ error: "Erro ao criar registro" });
    }
    
    res.status(201).json({ 
      message: "Registro criado com sucesso", 
      id: result.insertId 
    });
  });
});

// Buscar um registro específico por ID
router.get('/api/pop-control/:id', (req, res) => {
  const { id } = req.params;
  
  const query = `SELECT * FROM pop_control WHERE id = ?`;
  
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Erro ao buscar registro POP_Control: ", err);
      return res.status(500).json({ error: "Erro ao buscar registro" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: "Registro não encontrado" });
    }
    
    res.status(200).json(results[0]);
  });
});

// Atualizar um registro específico por ID
router.put('/api/pop-control/:id', (req, res) => {
  const { id } = req.params;
  const {
    data,
    hora,
    linha,
    modelo,
    part_number,
    molhagem,
    medicao_jig,
    squeegee_gap,
    antes,
    depois,
    status,
    operador
  } = req.body;
  
  // Validar campos obrigatórios
  if (!data || !hora || !linha || !modelo || !part_number || !molhagem || 
      !medicao_jig || !squeegee_gap || !antes || !depois || !status || !operador) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  }
  
  const query = `
    UPDATE pop_control 
    SET data = ?, hora = ?, linha = ?, modelo = ?, part_number = ?, molhagem = ?, 
        medicao_jig = ?, squeegee_gap = ?, antes = ?, depois = ?, status = ?, operador = ?
    WHERE id = ?
  `;
  
  db.query(query, [
    data,
    hora,
    linha,
    modelo,
    part_number,
    molhagem,
    medicao_jig,
    squeegee_gap,
    antes,
    depois,
    status,
    operador,
    id
  ], (err, result) => {
    if (err) {
      console.error("Erro ao atualizar registro POP_Control: ", err);
      return res.status(500).json({ error: "Erro ao atualizar registro" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Registro não encontrado" });
    }
    
    res.status(200).json({ message: "Registro atualizado com sucesso" });
  });
});

// Deletar um registro específico por ID
router.delete('/api/pop-control/:id', (req, res) => {
  const { id } = req.params;
  
  const query = `DELETE FROM pop_control WHERE id = ?`;
  
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Erro ao deletar registro POP_Control: ", err);
      return res.status(500).json({ error: "Erro ao deletar registro" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Registro não encontrado" });
    }
    
    res.status(200).json({ message: "Registro deletado com sucesso" });
  });
});

// Buscar informações do operador por matrícula
router.get('/api/operador/:matricula', (req, res) => {
  const { matricula } = req.params;
  
  const query = `SELECT funcionarios, matricula, turno FROM mydb.pessoas WHERE matricula = ?`;
  
  db.query(query, [matricula], (err, results) => {
    if (err) {
      console.error("Erro ao buscar operador: ", err);
      return res.status(500).json({ error: "Erro ao buscar operador" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: "Operador não encontrado" });
    }
    
    res.status(200).json(results[0]);
  });
});

// Buscar modelos do banco de dados
router.get('/api/modelos', (req, res) => {
  const query = `
    SELECT modelo, Halb
    FROM (
      SELECT 
        CASE 
          WHEN modelo LIKE '%-T' THEN SUBSTRING(modelo, 1, LENGTH(modelo) - 2)
          WHEN modelo LIKE '%-B' THEN SUBSTRING(modelo, 1, LENGTH(modelo) - 2)
          ELSE modelo
        END AS modelo,
        Halb,
        ROW_NUMBER() OVER (
          PARTITION BY 
            CASE 
              WHEN modelo LIKE '%-T' THEN SUBSTRING(modelo, 1, LENGTH(modelo) - 2)
              WHEN modelo LIKE '%-B' THEN SUBSTRING(modelo, 1, LENGTH(modelo) - 2)
              ELSE modelo
            END 
          ORDER BY Halb
        ) as rn
      FROM pcb_qty_array
    ) AS ranked_data
    WHERE rn = 1
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar modelos: ", err);
      return res.status(500).json({ error: "Erro ao buscar modelos" });
    }
    
    res.status(200).json(results);
  });
});

// Rota para verificar a estrutura da tabela pop_control
router.get('/api/pop_control_structure', (req, res) => {
  const query = `DESCRIBE pop_control`;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar estrutura da tabela pop_control: ", err);
      return res.status(500).json({ error: "Erro ao buscar estrutura da tabela pop_control" });
    }
    
    res.status(200).json(results);
  });
});

// Rota para buscar opções de molhagem da tabela pop_control_molhagem
router.get('/pop_control_molhagem', (req, res) => {
  const query = `SELECT id, molhagem as valor FROM pop_control_molhagem ORDER BY molhagem ASC`;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar opções de molhagem: ", err);
      // Fallback para opções padrão se a tabela não existir
      return res.status(200).json([
        { id: 1, valor: 'Fluxo POP' },
        { id: 2, valor: 'Reflow Epoxy' },
        { id: 3, valor: 'Solder Dipping' }
      ]);
    }
    res.status(200).json(results);
  });
});

// Rota para buscar opções de medição jig da tabela pop_control_jig
router.get('/pop_control_jig', (req, res) => {
  const query = `SELECT id, medicao as valor FROM pop_control_jig ORDER BY CAST(medicao AS DECIMAL(10,3)) ASC`;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar opções de jig: ", err);
      // Fallback para opções padrão se a tabela não existir
      return res.status(200).json([
        { id: 1, valor: '0.000' }, { id: 2, valor: '0.065' }, { id: 3, valor: '0.070' },
        { id: 4, valor: '0.075' }, { id: 5, valor: '0.080' }, { id: 6, valor: '0.085' },
        { id: 7, valor: '0.090' }, { id: 8, valor: '0.095' }, { id: 9, valor: '0.100' },
        { id: 10, valor: '0.110' }, { id: 11, valor: '0.120' }, { id: 12, valor: '0.130' },
        { id: 13, valor: '0.140' }, { id: 14, valor: '0.150' }, { id: 15, valor: '0.160' },
        { id: 16, valor: '0.170' }, { id: 17, valor: '0.180' }, { id: 18, valor: '0.190' },
        { id: 19, valor: '0.200' }
      ]);
    }
    res.status(200).json(results);
  });
});

// Rota específica para a tabela de controle POP
router.get('/api/popControl_controle', (req, res) => {
  const { data } = req.query;
  
  let query = `
    SELECT 
      linha,
      modelo,
      hora,
      status,
      data,
      depois,
      molhagem
    FROM pop_control 
  `;
  
  const params = [];
  
  if (data) {
    query += ` WHERE DATE(data) = ?`;
    params.push(data);
  } else {
    query += ` WHERE DATE(data) = CURDATE()`;
  }
  
  query += ` ORDER BY linha, modelo, hora`;
  
  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Erro ao buscar dados para tabela de controle: ", err);
      return res.status(500).json({ error: "Erro ao buscar dados para tabela de controle" });
    }
    
    // Função para calcular status baseado na porcentagem e tipo de molhagem (igual ao frontend)
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
    
    // Processar os dados para o formato necessário pela tabela de controle
    const processedData = {};
    
    // Primeiro, agrupar os dados por linha e modelo
    const groupedData = {};
    
    results.forEach(item => {
      const key = `${item.linha}-${item.modelo}`;
      
      if (!groupedData[key]) {
        groupedData[key] = {
          linha: item.linha,
          modelo: item.modelo,
          registros: []
        };
      }
      
      groupedData[key].registros.push(item);
    });
    
    // Depois, processar cada grupo para criar os intervalos
    Object.values(groupedData).forEach(group => {
      const key = `${group.linha}-${group.modelo}`;
      
      if (!processedData[key]) {
        processedData[key] = {
          linha: group.linha,
          modelo: group.modelo,
          intervals: {}
        };
      }
      
      // Para cada intervalo de hora
      timeIntervals.forEach(interval => {
        // Filtrar registros para este intervalo
        // Extrair as horas de início e fim do intervalo
        const [start, end] = interval.split(' ~ ');
        const startHour = parseInt(start.split(':')[0]);
        const endHour = parseInt(end.split(':')[0]);
        
        const intervalData = group.registros.filter(item => {
          // Converter a hora do item para número
          const itemHour = parseInt(item.hora.split(':')[0]);
          const itemMinute = parseInt(item.hora.split(':')[1]);
          
          // Verificar se a hora do item está no intervalo
          if (endHour > startHour) {
            // Intervalo normal (ex: 07:00 ~ 08:00)
            if (itemHour === startHour && itemMinute >= 0) {
              return true;
            }
            if (itemHour > startHour && itemHour < endHour) {
              return true;
            }
            if (itemHour === endHour && itemMinute < 0) {
              return true;
            }
            return false;
          } else {
            // Intervalo que cruza a meia-noite (ex: 23:00 ~ 00:00)
            if (itemHour >= startHour) {
              return true;
            }
            if (itemHour < endHour) {
              return true;
            }
            return false;
          }
        });
        
        if (intervalData.length > 0) {
          // Obter o último registro (mais recente) do intervalo
          const lastRecord = intervalData[intervalData.length - 1];
          
          // Calcular o status com base nos valores de depois e molhagem
          const calculatedStatus = calcularStatus(lastRecord.depois, lastRecord.molhagem);
          processedData[key].intervals[interval] = calculatedStatus || lastRecord.status;
        } else {
          // Se não houver registros, marcar como pendente
          processedData[key].intervals[interval] = '-';
        }
      });
    });
    
    res.status(200).json(Object.values(processedData));
  });
});
module.exports = router;
