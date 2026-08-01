const express = require("express");
const router = express.Router();
const db = require("../../config/db");

//------------------------------------
// **-----------Gravacao QRCODE --------------------
// Gravação CN - 1T
// Gravação CN - 1T
router.get("/GravacaoCN", (req, res) => {
  const {data} = req.query;
 
   let mysql = `
 SELECT 
    CASE 
        WHEN (TIME(g.log_time) >= '02:12:01' AND TIME(g.log_time) <= '06:54:59') THEN DATE_SUB(g.log_date, INTERVAL 1 DAY)
        WHEN (TIME(g.log_time) > '16:43:00' AND TIME(g.log_time) <= '23:59:59') THEN g.log_date
        WHEN (TIME(g.log_time) >= '00:00:00' AND TIME(g.log_time) <= '02:12:00') THEN DATE_SUB(g.log_date, INTERVAL 1 DAY)
        ELSE g.log_date
    END AS 'Data',
    g.machine_name AS Maquina,

    CASE 
        WHEN g.model_name LIKE 'Model[%' THEN
            CONCAT(
                SUBSTRING(g.model_name, 11, 4),
                '_',
                SUBSTRING(g.model_name, LENGTH(g.model_name) - 4, 3)
            )
        ELSE
            CONCAT(
                SUBSTRING(g.model_name, 5, 4),
                '_',
                RIGHT(g.model_name, 3)
            )
    END AS Modelo,
-- CASE 
 --       WHEN a.modelo LIKE 'Model[%' THEN
  --          CONCAT(
  -- SUBSTRING(a.modelo, 11, 4),
 --               '_',
  --              SUBSTRING(a.modelo, LENGTH(a.modelo) - 4, 3)
   --         )
    --    ELSE
  --          CONCAT(
  --              SUBSTRING(a.modelo, 5, 4),
 --               '_',
 --               RIGHT(a.modelo, 3)
 --           )
 --   END as ModeloT,
 a.target as Meta,
    
    COALESCE(pcb.Array, 0) AS 'array',
    
    -- Multiplicação por Array para 1T
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '06:55:00' AND '07:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 1T_1,
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '07:55:00' AND '08:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 1T_2,
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '08:55:00' AND '09:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 1T_3,
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '09:55:00' AND '10:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 1T_4,
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '10:55:00' AND '11:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 1T_5,
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '11:55:00' AND '12:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 1T_6,
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '12:55:00' AND '13:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 1T_7,
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '13:55:00' AND '14:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 1T_8,
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '14:55:00' AND '15:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 1T_9,
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '15:55:00' AND '16:43:00' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 1T_10,
    
   -- COUNT(*) AS total_qty,
    COUNT(*) * COALESCE(pcb.Array, 0) AS total
    
FROM gravacao_cn g
LEFT JOIN (
    -- Subq pra pegar apenas um modelo de cada tipo da tabela pcb_qty_array
    SELECT 
        p1.*,
        ROW_NUMBER() OVER (
            PARTITION BY 
                CASE 
                    WHEN p1.Modelo LIKE 'BSM-X____%' THEN SUBSTRING(p1.Modelo, 1, 7)
                    WHEN p1.Modelo LIKE 'BSM-A____%' THEN SUBSTRING(p1.Modelo, 1, 8)
                    ELSE SUBSTRING(p1.Modelo, 1, 8)
                END 
            ORDER BY p1.id
        ) as rn
    FROM pcb_qty_array p1
) pcb ON (
    -- filtro do nome dos modelos
    CASE 
        WHEN g.model_name LIKE 'Model[BSM-X____%' THEN
            SUBSTRING(g.model_name, 7, 7)  -- Extrai "BSM-X115"
        WHEN g.model_name LIKE 'Model[BSM-A____%' THEN
            SUBSTRING(g.model_name, 7, 8)  -- Extrai "BSM-A075"
        WHEN g.model_name LIKE 'BSM-X____%' THEN
            SUBSTRING(g.model_name, 1, 7)  -- Extrai "BSM-X115"
        WHEN g.model_name LIKE 'BSM-A____%' THEN
            SUBSTRING(g.model_name, 1, 8)  -- Extrai "BSM-A075"
        ELSE ''
    END = 
    CASE 
        WHEN pcb.Modelo LIKE 'BSM-X____%' THEN SUBSTRING(pcb.Modelo, 1, 7)
        WHEN pcb.Modelo LIKE 'BSM-A____%' THEN SUBSTRING(pcb.Modelo, 1, 8)
        ELSE SUBSTRING(pcb.Modelo, 1, 8)
    END
    AND pcb.rn = 1  -- Pegar apenas o primeiro registro de cada modelo
) 
 left join gravacao_cn_target a ON (
     CASE 
        WHEN a.modelo LIKE 'Model[%' THEN
            CONCAT(
                SUBSTRING(a.modelo, 11, 4),
                '_',
                SUBSTRING(a.modelo, LENGTH(a.modelo) - 4, 3)
            )
        ELSE
            CONCAT(
                SUBSTRING(a.modelo, 5, 4),
                '_',
                RIGHT(a.modelo, 3)
            )
    END) =
    CASE 
        WHEN g.model_name LIKE 'Model[%' THEN
            CONCAT(
                SUBSTRING(g.model_name, 11, 4),
                '_',
                SUBSTRING(g.model_name, LENGTH(g.model_name) - 4, 3)
            )
        ELSE
            CONCAT(
                SUBSTRING(g.model_name, 5, 4),
                '_',
                RIGHT(g.model_name, 3)
            )
    END

where 
-- where para a data
CASE 
        WHEN (TIME(g.log_time) >= '02:12:01' AND TIME(g.log_time) <= '06:54:59') THEN DATE_SUB(g.log_date, INTERVAL 1 DAY)
        WHEN (TIME(g.log_time) > '16:43:00' AND TIME(g.log_time) <= '23:59:59') THEN g.log_date
        WHEN (TIME(g.log_time) >= '00:00:00' AND TIME(g.log_time) <= '02:12:00') THEN DATE_SUB(g.log_date, INTERVAL 1 DAY)
        ELSE g.log_date
    END = ?
GROUP BY 
    data,
    Maquina,
    Modelo,
    pcb.Modelo,
    COALESCE(pcb.Array, 0)
ORDER BY 
    data,
    Maquina,
    Modelo;
   `;
   
   db.query(mysql, [data], (err, result) => {
     if (err) {
       console.log(err);
       res.status(500).send(err);
     } else {
       res.json(result);
     }
   });
 });


// Gravação CN - 2T
router.get("/GravacaoCN2T", (req, res) => {
  const {data} = req.query;
 
   let mysql = `
 SELECT 
    CASE 
  WHEN (TIME(g.log_time) >= '02:12:01' AND TIME(g.log_time) <= '06:54:59') THEN DATE_SUB(g.log_date, INTERVAL 1 DAY)
        WHEN (TIME(g.log_time) > '16:43:00' AND TIME(g.log_time) <= '23:59:59') THEN g.log_date
        WHEN (TIME(g.log_time) >= '00:00:00' AND TIME(g.log_time) <= '02:12:00') THEN DATE_SUB(g.log_date, INTERVAL 1 DAY)
        ELSE g.log_date
    END AS 'Data',
    g.machine_name AS Maquina,

    CASE 
        WHEN g.model_name LIKE 'Model[%' THEN
            CONCAT(
                SUBSTRING(g.model_name, 11, 4),
                '_',
                SUBSTRING(g.model_name, LENGTH(g.model_name) - 4, 3)
            )
        ELSE
            CONCAT(
                SUBSTRING(g.model_name, 5, 4),
                '_',
                RIGHT(g.model_name, 3)
            )
    END AS Modelo,
-- CASE 
 --       WHEN a.modelo LIKE 'Model[%' THEN
  --          CONCAT(
  -- SUBSTRING(a.modelo, 11, 4),
 --               '_',
  --              SUBSTRING(a.modelo, LENGTH(a.modelo) - 4, 3)
   --         )
    --    ELSE
  --          CONCAT(
  --              SUBSTRING(a.modelo, 5, 4),
 --               '_',
 --               RIGHT(a.modelo, 3)
 --           )
 --   END as ModeloT,
 a.target as Meta,
    
    COALESCE(pcb.Array, 0) AS 'array',
    
    -- Multiplicação por Array para 2T
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '16:43:01' AND '17:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 2T_1,
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '17:55:00' AND '18:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 2T_2,
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '18:55:00' AND '19:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 2T_3,
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '19:55:00' AND '20:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 2T_4,
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '20:55:00' AND '21:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 2T_5,
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '21:55:00' AND '22:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 2T_6,
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '22:55:00' AND '23:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 2T_7,
    SUM(CASE WHEN (TIME(g.log_time) BETWEEN '23:55:00' AND '23:59:59') OR (TIME(g.log_time) BETWEEN '00:00:00' AND '00:54:59') THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 2T_8,
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '00:55:00' AND '02:12:00' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS 2T_9,
    
   -- COUNT(*) AS total_qty,
    COUNT(*) * COALESCE(pcb.Array, 0) AS total
    
FROM gravacao_cn g
LEFT JOIN (
    -- Subq pra pegar apenas um modelo de cada tipo da tabela pcb_qty_array
    SELECT 
        p1.*,
        ROW_NUMBER() OVER (
            PARTITION BY 
                CASE 
                    WHEN p1.Modelo LIKE 'BSM-X____%' THEN SUBSTRING(p1.Modelo, 1, 7)
                    WHEN p1.Modelo LIKE 'BSM-A____%' THEN SUBSTRING(p1.Modelo, 1, 8)
                    ELSE SUBSTRING(p1.Modelo, 1, 8)
                END 
            ORDER BY p1.id
        ) as rn
    FROM pcb_qty_array p1
) pcb ON (
    -- filtro do nome dos modelos
    CASE 
        WHEN g.model_name LIKE 'Model[BSM-X____%' THEN
            SUBSTRING(g.model_name, 7, 7)  -- Extrai "BSM-X115"
        WHEN g.model_name LIKE 'Model[BSM-A____%' THEN
            SUBSTRING(g.model_name, 7, 8)  -- Extrai "BSM-A075"
        WHEN g.model_name LIKE 'BSM-X____%' THEN
            SUBSTRING(g.model_name, 1, 7)  -- Extrai "BSM-X115"
        WHEN g.model_name LIKE 'BSM-A____%' THEN
            SUBSTRING(g.model_name, 1, 8)  -- Extrai "BSM-A075"
        ELSE ''
    END = 
    CASE 
        WHEN pcb.Modelo LIKE 'BSM-X____%' THEN SUBSTRING(pcb.Modelo, 1, 7)
        WHEN pcb.Modelo LIKE 'BSM-A____%' THEN SUBSTRING(pcb.Modelo, 1, 8)
        ELSE SUBSTRING(pcb.Modelo, 1, 8)
    END
    AND pcb.rn = 1  -- Pegar apenas o primeiro registro de cada modelo
) 
 left join gravacao_cn_target a ON (
     CASE 
        WHEN a.modelo LIKE 'Model[%' THEN
            CONCAT(
                SUBSTRING(a.modelo, 11, 4),
                '_',
                SUBSTRING(a.modelo, LENGTH(a.modelo) - 4, 3)
            )
        ELSE
            CONCAT(
                SUBSTRING(a.modelo, 5, 4),
                '_',
                RIGHT(a.modelo, 3)
            )
    END) =
    CASE 
        WHEN g.model_name LIKE 'Model[%' THEN
            CONCAT(
                SUBSTRING(g.model_name, 11, 4),
                '_',
                SUBSTRING(g.model_name, LENGTH(g.model_name) - 4, 3)
            )
        ELSE
            CONCAT(
                SUBSTRING(g.model_name, 5, 4),
                '_',
                RIGHT(g.model_name, 3)
            )
    END

where 
-- where para a data
CASE 
        WHEN (TIME(g.log_time) >= '02:12:01' AND TIME(g.log_time) <= '06:54:59') THEN DATE_SUB(g.log_date, INTERVAL 1 DAY)
        WHEN (TIME(g.log_time) > '16:43:00' AND TIME(g.log_time) <= '23:59:59') THEN g.log_date
        WHEN (TIME(g.log_time) >= '00:00:00' AND TIME(g.log_time) <= '02:12:00') THEN DATE_SUB(g.log_date, INTERVAL 1 DAY)
        ELSE g.log_date
    END = ?
GROUP BY 
    data,
    Maquina,
    Modelo,
    pcb.Modelo,
    COALESCE(pcb.Array, 0)
ORDER BY 
    data,
    Maquina,
    Modelo;
   `;
   
   db.query(mysql, [data], (err, result) => {
     if (err) {
       console.log(err);
       res.status(500).send(err);
     } else {
       res.json(result);
     }
   });
 });


// Gravação CN - 3T
router.get("/GravacaoCN3T", (req, res) => {
  const {data} = req.query;
 
   let mysql = `
  SELECT 
    CASE 
		WHEN (TIME(g.log_time) >= '02:12:01' AND TIME(g.log_time) <= '06:54:59') THEN DATE_SUB(g.log_date, INTERVAL 1 DAY)
        WHEN (TIME(g.log_time) > '16:43:00' AND TIME(g.log_time) <= '23:59:59') THEN g.log_date
        WHEN (TIME(g.log_time) >= '00:00:00' AND TIME(g.log_time) <= '02:12:00') THEN DATE_SUB(g.log_date, INTERVAL 1 DAY)
        ELSE g.log_date
    END AS 'Data',
    g.machine_name AS Maquina,

    CASE 
        WHEN g.model_name LIKE 'Model[%' THEN
            CONCAT(
                SUBSTRING(g.model_name, 11, 4),
                '_',
                SUBSTRING(g.model_name, LENGTH(g.model_name) - 4, 3)
            )
        ELSE
            CONCAT(
                SUBSTRING(g.model_name, 5, 4),
                '_',
                RIGHT(g.model_name, 3)
            )
    END AS Modelo,
-- CASE 
 --       WHEN a.modelo LIKE 'Model[%' THEN
  --          CONCAT(
  -- SUBSTRING(a.modelo, 11, 4),
 --               '_',
  --              SUBSTRING(a.modelo, LENGTH(a.modelo) - 4, 3)
   --         )
    --    ELSE
  --          CONCAT(
  --              SUBSTRING(a.modelo, 5, 4),
 --               '_',
 --               RIGHT(a.modelo, 3)
 --           )
 --   END as ModeloT,
 a.target as Meta,
    
    COALESCE(pcb.Array, 0) AS 'array',
    
    -- Multiplicação por Array para 3T
SUM(CASE WHEN TIME(g.log_time) BETWEEN '02:12:01' AND '03:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS '3T_1',
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '03:55:00' AND '04:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS '3T_2',
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '04:55:00' AND '05:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS '3T_3',
    SUM(CASE WHEN TIME(g.log_time) BETWEEN '05:55:00' AND '06:54:59' THEN 1 ELSE 0 END) * COALESCE(pcb.Array, 0) AS '3T_4',
    
   -- COUNT(*) AS total_qty,
    COUNT(*) * COALESCE(pcb.Array, 0) AS total
    
FROM gravacao_cn g
LEFT JOIN (
    -- Subq pra pegar apenas um modelo de cada tipo da tabela pcb_qty_array
    SELECT 
        p1.*,
        ROW_NUMBER() OVER (
            PARTITION BY 
                CASE 
                    WHEN p1.Modelo LIKE 'BSM-X____%' THEN SUBSTRING(p1.Modelo, 1, 7)
                    WHEN p1.Modelo LIKE 'BSM-A____%' THEN SUBSTRING(p1.Modelo, 1, 8)
                    ELSE SUBSTRING(p1.Modelo, 1, 8)
                END 
            ORDER BY p1.id
        ) as rn
    FROM pcb_qty_array p1
) pcb ON (
    -- filtro do nome dos modelos
    CASE 
        WHEN g.model_name LIKE 'Model[BSM-X____%' THEN
            SUBSTRING(g.model_name, 7, 7)  -- Extrai "BSM-X115"
        WHEN g.model_name LIKE 'Model[BSM-A____%' THEN
            SUBSTRING(g.model_name, 7, 8)  -- Extrai "BSM-A075"
        WHEN g.model_name LIKE 'BSM-X____%' THEN
            SUBSTRING(g.model_name, 1, 7)  -- Extrai "BSM-X115"
        WHEN g.model_name LIKE 'BSM-A____%' THEN
            SUBSTRING(g.model_name, 1, 8)  -- Extrai "BSM-A075"
        ELSE ''
    END = 
    CASE 
        WHEN pcb.Modelo LIKE 'BSM-X____%' THEN SUBSTRING(pcb.Modelo, 1, 7)
        WHEN pcb.Modelo LIKE 'BSM-A____%' THEN SUBSTRING(pcb.Modelo, 1, 8)
        ELSE SUBSTRING(pcb.Modelo, 1, 8)
    END
    AND pcb.rn = 1  -- Pegar apenas o primeiro registro de cada modelo
) 
 left join gravacao_cn_target a ON (
     CASE 
        WHEN a.modelo LIKE 'Model[%' THEN
            CONCAT(
                SUBSTRING(a.modelo, 11, 4),
                '_',
                SUBSTRING(a.modelo, LENGTH(a.modelo) - 4, 3)
            )
        ELSE
            CONCAT(
                SUBSTRING(a.modelo, 5, 4),
                '_',
                RIGHT(a.modelo, 3)
            )
    END) =
    CASE 
        WHEN g.model_name LIKE 'Model[%' THEN
            CONCAT(
                SUBSTRING(g.model_name, 11, 4),
                '_',
                SUBSTRING(g.model_name, LENGTH(g.model_name) - 4, 3)
            )
        ELSE
            CONCAT(
                SUBSTRING(g.model_name, 5, 4),
                '_',
                RIGHT(g.model_name, 3)
            )
    END

where 
-- where para a data
CASE 
     WHEN (TIME(g.log_time) >= '02:12:01' AND TIME(g.log_time) <= '06:54:59') THEN DATE_SUB(g.log_date, INTERVAL 1 DAY)
        WHEN (TIME(g.log_time) > '16:43:00' AND TIME(g.log_time) <= '23:59:59') THEN g.log_date
        WHEN (TIME(g.log_time) >= '00:00:00' AND TIME(g.log_time) <= '02:12:00') THEN DATE_SUB(g.log_date, INTERVAL 1 DAY)
        ELSE g.log_date
    END = ?
GROUP BY 
    data,
    Maquina,
    Modelo,
    pcb.Modelo,
    COALESCE(pcb.Array, 0)
ORDER BY 
    data,
    Maquina,
    Modelo;
   `;
   
   db.query(mysql, [data], (err, result) => {
     if (err) {
       console.log(err);
       res.status(500).send(err);
     } else {
       res.json(result);
     }
   });
 });

// GET para buscar comentários da Gravação CN
router.get("/gravacaoCN_comments", (req, res) => {
  const { data, linha, modelo, horario } = req.query;
  
  const sql = `
    SELECT * FROM gravacao_cn_comments 
    WHERE data = ? 
    AND linha = ? 
    AND modelo = ? 
    AND horario = ?
  `;
  
  db.query(sql, [data, linha, modelo, horario], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao buscar comentário' });
    }
    res.json(result[0] || null);
  });
});

// POST/PUT para salvar/atualizar comentários da Gravação CN
router.post("/gravacaoCNUp_comments", (req, res) => {
  const { 
    data, 
    linha, 
    modelo, 
    horario, 
    comentario,
    target,      
    actual,       
    difference,   
    loss_minutes  
  } = req.body;
  
  const sql = `
    INSERT INTO gravacao_cn_comments 
    (data, linha, modelo, horario, comentario, target, actual, difference, loss_minutes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
    comentario = VALUES(comentario),
    target = VALUES(target),
    actual = VALUES(actual),
    difference = VALUES(difference),
    loss_minutes = VALUES(loss_minutes),
    data_atualizacao = CURRENT_TIMESTAMP
  `;
  
  db.query(sql, [
    data, 
    linha, 
    modelo, 
    horario, 
    comentario,
    target,
    actual,
    difference,
    loss_minutes
  ], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao salvar comentário' });
    }
    res.json({ success: true, message: 'Comentário salvo com sucesso!' });
  });
});


////----------------------------------------------------------------------------------------*********
// Nova Tela de Entrada e saida de material para o WIP
// ********

// Função para determinar o turno com base no horário atual
function determinarTurno() {
  const agora = new Date();
  const horas = agora.getHours();
  const minutos = agora.getMinutes();
  const segundos = agora.getSeconds();
  
  // Converter para segundos para facilitar a comparação
  const totalSegundos = horas * 3600 + minutos * 60 + segundos;
  
  // Definir os limites dos turnos em segundos
  const limite1TInicio = 6 * 3600 + 55 * 60; // 06:55:00 = 24900 segundos
  const limite1TFim = 16 * 3600 + 42 * 60 + 59; // 16:42:59 = 60179 segundos
  const limite2TInicio = 16 * 3600 + 43 * 60; // 16:43:00 = 60180 segundos
  const limite2TFim = 2 * 3600 + 11 * 60 + 55; // 02:11:55 = 7915 segundos (do dia seguinte)
  const limite3TInicio = 2 * 3600 + 12 * 60; // 02:12:00 = 7920 segundos
  const limite3TFim = 6 * 3600 + 54 * 60 + 59; // 06:54:59 = 24899 segundos
  
  // Determinar o turno com base nos horários
  if (totalSegundos >= limite1TInicio && totalSegundos <= limite1TFim) {
    return '1T';
  } else if (totalSegundos >= limite3TInicio && totalSegundos <= limite3TFim) {
    return '3T';
  } else {
    // Para o turno 2T, que cruza a meia-noite
    // Se for antes das 02:11:55 da manhã, é 2T do dia anterior
    // Se for depois das 16:43:00, é 2T do mesmo dia
    if (totalSegundos <= limite2TFim || totalSegundos >= limite2TInicio) {
      return '2T';
    }
  }
  
  // Padrão para 1T caso não se encaixe em nenhuma condição (não deve acontecer)
  return '1T';
}


module.exports = router;
