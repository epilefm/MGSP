const express = require("express");
const router = express.Router();
const db = require("../../../config/db");
const { authorizeScreen } = require("../../../auth/middleware");
const requireScreen = authorizeScreen('SplicingNoCheck');

//-Erro de Splicing - Não foi feito splicing

router.get("/SplicingNoCheck", requireScreen, (req, res) => {
  const {data} = req.query;

   let mysql = `SELECT
    DATE_FORMAT(WORK_DT, '%d-%m-%Y %H:%i:%s') as 'Data',
    Equip as 'Equipamento', LINE_NM as 'Linha',
    Side as 'Lado', ERR_DESC as 'Erro',
    Feeder,
    CASE
        WHEN TIME(WORK_DT) BETWEEN '06:55:00' AND '16:42:59' THEN '1T'
        WHEN TIME(WORK_DT) BETWEEN '14:55:00' AND '22:54:59' THEN '2T'
        ELSE '3T' END as 'Turno'
FROM mydb.mounter_eff WHERE
    ERR_DESC = 'No Splicing Check'
    AND WORK_YMD = ?
ORDER BY WORK_DT desc;`;

   db.query(mysql, [data], (err, result) => {
     if (err) {
       console.log(err);
     } else {
       res.json(result);
     }
   });
 });

 router.get("/SplicingNoCheckGraf", requireScreen, (req, res) => {
  const {date} = req.query;

   let mysql = `SELECT DATE_FORMAT(WORK_YMD, '%d-%m-%Y') AS data, LINE_NM, SUM(CASE WHEN ERR_DESC = 'No Splicing Check' THEN 1 ELSE 0 END) AS ErrorCount
FROM mounter_eff WHERE WORK_YMD = ?
GROUP BY LINE_NM HAVING ErrorCount > 0
ORDER BY ErrorCount DESC limit 10;`;

   db.query(mysql, [date], (err, result) => {
     if (err) {
       console.log(err);
     } else {
       res.json(result);
     }
   });
 });

 router.get("/SplicingNoCheckGrafII", requireScreen, (req, res) => {
  const {date} = req.query;

   let mysql = `SELECT DATE_FORMAT(WORK_YMD, '%d-%m-%Y') AS data,LINE_NM, equip, feeder, SUM(CASE WHEN ERR_DESC = 'No Splicing Check' THEN 1 ELSE 0 END) AS ErrorCount
FROM mounter_eff WHERE WORK_YMD = ?
GROUP BY feeder, equip HAVING ErrorCount > 0
ORDER BY ErrorCount DESC limit 10;`;

   db.query(mysql, [date], (err, result) => {
     if (err) {
       console.log(err);
     } else {
       res.json(result);
     }
   });
 });

  //---------------------------------------/**************////////////////////////////////////////////////////////////// */
 // Endpoint para salvar verificação de feeder
router.post("/saveNoSplicingFeederCheck", requireScreen, (req, res) => {
  const { data, feeder, matricula } = req.body;
  
  // Primeiro verificar se a matrícula existe na tabela de pessoas
  const checkMatriculaQuery = `SELECT funcionarios FROM mydb.pessoas WHERE matricula = ?`;
  
  db.query(checkMatriculaQuery, [matricula], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ success: false, message: "Erro ao verificar matrícula" });
    }
    
    if (result.length === 0) {
      return res.status(400).json({ success: false, message: "Matrícula não encontrada" });
    }
    
    // Se a matrícula existe, salvar o check
    const saveCheckQuery = `
      INSERT INTO mydb.no_splicing_feeder (data, feeder, matricula, nome)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      matricula = VALUES(matricula),
      nome = VALUES(nome),
      updated_at = CURRENT_TIMESTAMP
    `;
    
    db.query(saveCheckQuery, [data, feeder, matricula, result[0].funcionarios], (err, insertResult) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Erro ao salvar verificação" });
      }
      
      res.json({ success: true, message: "Verificação salva com sucesso", nome: result[0].funcionarios, motivo: motivo });
    });
  });
});

// Endpoint para buscar verificações de feeder
router.get("/getNoSplicingFeederChecks", requireScreen, (req, res) => {
  const { data } = req.query;
  
  const getChecksQuery = `
    SELECT data, feeder, matricula, nome, motivo, created_at
    FROM mydb.no_splicing_feeder
    WHERE data = ?
    ORDER BY created_at DESC
  `;
  
  db.query(getChecksQuery, [data], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ success: false, message: "Erro ao buscar verificações" });
    }
    
    res.json({ success: true, data: result });
  });
});

// Endpoint para criar tabela de checks se não existir
router.get("/initNoSplicingFeederTable", requireScreen, (req, res) => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS mydb.no_splicing_feeder (
      id INT AUTO_INCREMENT PRIMARY KEY,
      data DATE NOT NULL,
      feeder VARCHAR(50) NOT NULL,
      matricula VARCHAR(20) NOT NULL,
      nome VARCHAR(100) NOT NULL,
      motivo VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_check (data, feeder)
    )
  `;
  
  db.query(createTableQuery, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ success: false, message: "Erro ao criar tabela" });
    }
    
    res.json({ success: true, message: "Tabela criada com sucesso" });
  });
});

// Endpoint para salvar verificação de feeder com motivo
router.post("/saveNoSplicingFeederCheckWithMotivo", requireScreen, (req, res) => {
  const { data, feeder, matricula, motivo, linha, equipamento, lado } = req.body;
  
  // Primeiro verificar se a matrícula existe na tabela de pessoas
  const checkMatriculaQuery = `SELECT funcionarios FROM mydb.pessoas WHERE matricula = ?`;
  
  db.query(checkMatriculaQuery, [matricula], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ success: false, message: "Erro ao verificar matrícula" });
    }
    
    if (result.length === 0) {
      return res.status(400).json({ success: false, message: "Matrícula não encontrada" });
    }
    
    // Se a matrícula existe, salvar o check
    const saveCheckQuery = `
      INSERT INTO mydb.no_splicing_feeder (data, feeder, matricula, nome, motivo, linha, equipamento, lado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      matricula = VALUES(matricula),
      nome = VALUES(nome),
      motivo = VALUES(motivo),
      linha = VALUES(linha),
      equipamento = VALUES(equipamento),
      lado = VALUES(lado),
      updated_at = CURRENT_TIMESTAMP
    `;
    
    db.query(saveCheckQuery, [data, feeder, matricula, result[0].funcionarios, motivo, linha, equipamento, lado], (err, insertResult) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Erro ao salvar verificação" });
      }
      
      res.json({ success: true, message: "Verificação salva com sucesso", nome: result[0].funcionarios, motivo: motivo });
    });
  });
});

// Endpoint para verificar matrícula
router.get("/verifyMatricula/:matricula", requireScreen, (req, res) => {
  const { matricula } = req.params;
  
  // Remover espaços em branco e converter para string
  const cleanMatricula = matricula.toString().trim();
  
  const checkMatriculaQuery = `SELECT funcionarios FROM mydb.pessoas WHERE matricula = ?`;
  
  db.query(checkMatriculaQuery, [cleanMatricula], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ success: false, message: "Erro ao verificar matrícula" });
    }
    
    if (result.length === 0) {
      return res.json({ exists: false });
    }
    
    res.json({ exists: true, nome: result[0].funcionarios });
  });
});

// Endpoint para salvar indicadores diários do Splicing No Check
router.post('/splicing-nocheck-indicators', requireScreen, async (req, res) => {
  try {
    const {
      data,
      total_por_turno,
      worst_line,
      worst_line_qty,
      worst_feeder,
      worst_feeder_qty,
      itens_checados,
      total_registros,
      worst_motivo,
      worst_motivo_qty
    } = req.body;

    // Usar INSERT ... ON DUPLICATE KEY UPDATE para lidar com registros duplicados
    const query = `
      INSERT INTO no_splicingcheck_indicator 
      (data, total_por_turno, worst_line, worst_line_qty, worst_feeder, worst_feeder_qty, 
       itens_checados, total_registros, worst_motivo, worst_motivo_qty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      total_por_turno = VALUES(total_por_turno),
      worst_line = VALUES(worst_line),
      worst_line_qty = VALUES(worst_line_qty),
      worst_feeder = VALUES(worst_feeder),
      worst_feeder_qty = VALUES(worst_feeder_qty),
      itens_checados = VALUES(itens_checados),
      total_registros = VALUES(total_registros),
      worst_motivo = VALUES(worst_motivo),
      worst_motivo_qty = VALUES(worst_motivo_qty),
      updated_at = CURRENT_TIMESTAMP
    `;
    
    await db.promise().query(query, [
      data,
      total_por_turno,
      worst_line,
      worst_line_qty,
      worst_feeder,
      worst_feeder_qty,
      itens_checados,
      total_registros,
      worst_motivo,
      worst_motivo_qty
    ]);

    res.status(200).json({ success: true, message: 'Indicadores salvos com sucesso' });
  } catch (err) {
    console.error('Erro ao salvar indicadores:', err);
    res.status(500).json({ success: false, message: 'Erro ao salvar indicadores' });
  }
});

// Endpoint para buscar indicadores do dashboard
router.get('/splicing-nocheck-dashboard', requireScreen, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = 'SELECT * FROM no_splicingcheck_indicator';
    let params = [];
    
    if (startDate && endDate) {
      query += ' WHERE data BETWEEN ? AND ? ORDER BY data DESC';
      params = [startDate, endDate];
    } else {
      query += ' ORDER BY data DESC LIMIT 30'; // Últimos 30 dias por padrão
    }
    
    const [rows] = await db.promise().query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar indicadores do dashboard:', err);
    res.status(500).json({ error: 'Erro ao buscar indicadores do dashboard' });
  }
});

////------------------
// Endpoint para buscar verificações de feeder
router.get("/NoSplicingRPA", requireScreen, (req, res) => {
  const { data } = req.query;
  
  const getChecksQuery = `
  select WORK_YMD as Data, EQUIP as Mounter, LINE_NM as Linha, SIDE as Lado, 
  date_format(WORK_DT, '%H:%i:%s') as Hora , FEEDER from mounter_eff 
  -- SELECT 
-- WORK_YMD as Data, EQUIP as Mounter, LINE_NM as Linha, SIDE as Lado, ERR_DESC as Erro, date_format(WORK_DT, '%H:%i:%s') as Hora, a.FEEDER,
-- date_format(b.updated_at, '%H:%i:%s') as Hora_check, matricula, nome, motivo
 -- FROM mydb.mounter_eff a left join no_splicing_feeder b on a.feeder = b.feeder
 -- where data = ?
 ;
  `;
  
  db.query(getChecksQuery, [data], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ success: false, message: "Erro ao buscar verificações" });
    }
    
    res.json({ success: true, data: result });
  });
});//-----------------



module.exports = router;
