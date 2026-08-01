const express = require("express");
const router = express.Router();
const db = require("../../../config/db");
const { authorizeScreen } = require("../../../auth/middleware");
const requireScreen = authorizeScreen(['HoraHora', 'HoraHora2T', 'HoraHora3T', 'HoraHoraMounter', 'HoraProdLista']);

 //---------------- Hora produção 1T
 router.get("/HoraProd", requireScreen, (req, res) => {
  const {data} = req.query;

    let mysql = `
   SELECT DISTINCT
   A.Data,
   A.Linha,
   A.Modelo,
   CASE

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-16' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-16' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-16' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-16' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-16' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-16' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-16' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-16' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-16' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-16' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-16' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-16' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-16' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-16' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-16' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-16' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-16' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-16' THEN 180
    
    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-17' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-17' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-17' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-17' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-17' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-17' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-17' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-17' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-17' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-17' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-17' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-17' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-17' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-17' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-17' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-17' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-17' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-17' THEN 180

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-18' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-18' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-18' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-18' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-18' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-18' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-18' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-18' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-18' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-18' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-18' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-18' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-18' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-18' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-18' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-18' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-18' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-18' THEN 180

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-19' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-19' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-19' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-19' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-19' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-19' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-19' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-19' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-19' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-19' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-19' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-19' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-19' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-19' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-19' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-19' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-19' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-19' THEN 180

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-20' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-20' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-20' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-20' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-20' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-20' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-20' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-20' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-20' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-20' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-20' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-20' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-20' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-20' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-20' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-20' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-20' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-20' THEN 180

     ELSE B.Meta
   END AS Meta,
   A.HORARIO_1_1 * B.Array AS HORARIO_1_1,
   A.HORARIO_1_2 * B.Array AS HORARIO_1_2,
   A.HORARIO_1_3 * B.Array AS HORARIO_1_3,
   A.HORARIO_1_4 * B.Array AS HORARIO_1_4,
   A.HORARIO_1_5 * B.Array AS HORARIO_1_5,
   A.HORARIO_1_6 * B.Array AS HORARIO_1_6,
   A.HORARIO_1_7 * B.Array AS HORARIO_1_7,
   A.HORARIO_1_8 * B.Array AS HORARIO_1_8,
   A.HORARIO_2_1 * B.Array AS HORARIO_2_1,
   A.HORARIO_2_2 * B.Array AS HORARIO_2_2,
   (A.HORARIO_1_1 + A.HORARIO_1_2 + A.HORARIO_1_3 +
    A.HORARIO_1_4 + A.HORARIO_1_5 + A.HORARIO_1_6 +
    A.HORARIO_1_7 + A.HORARIO_1_8 + A.HORARIO_2_1 + A.HORARIO_2_2) * B.Array AS Total
FROM (
   SELECT
     DATE_FORMAT(WORK_YMD, '%Y-%m-%d') AS Data,
     LINE_NM AS Linha, MODEL_CODE as Modelo,
     HORARIO_1_1, HORARIO_1_2,
     HORARIO_1_3, HORARIO_1_4,
     HORARIO_1_5, HORARIO_1_6,
     HORARIO_1_7, HORARIO_1_8,
     HORARIO_2_1, HORARIO_2_2
   FROM hora_mounter_v2
   WHERE DATE_FORMAT(WORK_YMD, '%Y-%m-%d') = ?
    AND (HORARIO_1_1 + HORARIO_1_2 + HORARIO_1_3 +
        HORARIO_1_4 + HORARIO_1_5 + HORARIO_1_6 +
        HORARIO_1_7 + HORARIO_1_8 + HORARIO_2_1 + HORARIO_2_2) > 0
   GROUP BY linha, modelo
   ORDER BY Linha
) A
INNER JOIN pcb_qty_array B ON A.Modelo = B.Modelo
union all
SELECT '','TOTAL','',sum(Meta), SUM(HORARIO_1_1),SUM(HORARIO_1_2),
SUM(HORARIO_1_3),SUM(HORARIO_1_4),SUM(HORARIO_1_5),SUM(HORARIO_1_6),
SUM(HORARIO_1_7),SUM(HORARIO_1_8),SUM(HORARIO_2_1),SUM(HORARIO_2_2),
 SUM(TOTAL) 
FROM (
SELECT DISTINCT
   A.Data,
   A.Linha,
   A.Modelo,
   CASE

   WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-16' THEN 172
   WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-16' THEN 252
   WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-16' THEN 240
   WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-16' THEN 198
   WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-16' THEN 204
   WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-16' THEN 180
   WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-16' THEN 188
   WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-16' THEN 180
   WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-16' THEN 220
   WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-16' THEN 116
   WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-16' THEN 194
   WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-16' THEN 138
   WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-16' THEN 190
   WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-16' THEN 136
   WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-16' THEN 180
   WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-16' THEN 122
   WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-16' THEN 210
   WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-16' THEN 180
   
   WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-17' THEN 172
   WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-17' THEN 252
   WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-17' THEN 240
   WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-17' THEN 198
   WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-17' THEN 204
   WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-17' THEN 180
   WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-17' THEN 188
   WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-17' THEN 180
   WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-17' THEN 220
   WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-17' THEN 116
   WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-17' THEN 194
   WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-17' THEN 138
   WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-17' THEN 190
   WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-17' THEN 136
   WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-17' THEN 180
   WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-17' THEN 122
   WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-17' THEN 210
   WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-17' THEN 180

   WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-18' THEN 172
   WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-18' THEN 252
   WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-18' THEN 240
   WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-18' THEN 198
   WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-18' THEN 204
   WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-18' THEN 180
   WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-18' THEN 188
   WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-18' THEN 180
   WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-18' THEN 220
   WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-18' THEN 116
   WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-18' THEN 194
   WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-18' THEN 138
   WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-18' THEN 190
   WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-18' THEN 136
   WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-18' THEN 180
   WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-18' THEN 122
   WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-18' THEN 210
   WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-18' THEN 180

   WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-19' THEN 172
   WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-19' THEN 252
   WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-19' THEN 240
   WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-19' THEN 198
   WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-19' THEN 204
   WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-19' THEN 180
   WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-19' THEN 188
   WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-19' THEN 180
   WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-19' THEN 220
   WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-19' THEN 116
   WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-19' THEN 194
   WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-19' THEN 138
   WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-19' THEN 190
   WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-19' THEN 136
   WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-19' THEN 180
   WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-19' THEN 122
   WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-19' THEN 210
   WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-19' THEN 180

   WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-20' THEN 172
   WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-20' THEN 252
   WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-20' THEN 240
   WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-20' THEN 198
   WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-20' THEN 204
   WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-20' THEN 180
   WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-20' THEN 188
   WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-20' THEN 180
   WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-20' THEN 220
   WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-20' THEN 116
   WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-20' THEN 194
   WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-20' THEN 138
   WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-20' THEN 190
   WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-20' THEN 136
   WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-20' THEN 180
   WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-20' THEN 122
   WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-20' THEN 210
   WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-20' THEN 180

     ELSE B.Meta
   END AS Meta,
   A.HORARIO_1_1 * B.Array AS HORARIO_1_1,
   A.HORARIO_1_2 * B.Array AS HORARIO_1_2,
   A.HORARIO_1_3 * B.Array AS HORARIO_1_3,
   A.HORARIO_1_4 * B.Array AS HORARIO_1_4,
   A.HORARIO_1_5 * B.Array AS HORARIO_1_5,
   A.HORARIO_1_6 * B.Array AS HORARIO_1_6,
   A.HORARIO_1_7 * B.Array AS HORARIO_1_7,
   A.HORARIO_1_8 * B.Array AS HORARIO_1_8,
   A.HORARIO_2_1 * B.Array AS HORARIO_2_1,
   A.HORARIO_2_2 * B.Array AS HORARIO_2_2,
   (A.HORARIO_1_1 + A.HORARIO_1_2 + A.HORARIO_1_3 +
    A.HORARIO_1_4 + A.HORARIO_1_5 + A.HORARIO_1_6 +
    A.HORARIO_1_7 + A.HORARIO_1_8 + A.HORARIO_2_1 + A.HORARIO_2_2) * B.Array AS Total
FROM (
   SELECT
     DATE_FORMAT(WORK_YMD, '%Y-%m-%d') AS Data,
     LINE_NM AS Linha, MODEL_CODE as Modelo,
     HORARIO_1_1, HORARIO_1_2,
     HORARIO_1_3, HORARIO_1_4,
     HORARIO_1_5, HORARIO_1_6,
     HORARIO_1_7, HORARIO_1_8,
     HORARIO_2_1, HORARIO_2_2
   FROM hora_mounter_v2
   WHERE DATE_FORMAT(WORK_YMD, '%Y-%m-%d') = ?
    AND (HORARIO_1_1 + HORARIO_1_2 + HORARIO_1_3 +
        HORARIO_1_4 + HORARIO_1_5 + HORARIO_1_6 +
        HORARIO_1_7 + HORARIO_1_8 + HORARIO_2_1 + HORARIO_2_2) > 0
   GROUP BY linha, modelo
   ORDER BY Linha
) A
INNER JOIN pcb_qty_array B ON A.Modelo = B.Modelo
) A             
 ORDER BY Linha ASC;
 
   `;
   
   db.query(mysql, [data, data], (err, result) => {
     if (err) {
       console.log(err);
     } else {
       res.json(result);
     }
   });
 });


// GET para buscar comentários
router.get("/horaProd_comments", requireScreen, (req, res) => {
  const { data, linha, modelo, horario } = req.query;
  
  const sql = `
    SELECT * FROM hora_mounter_comments 
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

// POST/PUT para salvar/atualizar comentários
router.post("/horaProdUp_comments", requireScreen, (req, res) => {
  console.log("Dados recebidos:", req.body); // Adicione este log

  const { 
    data, 
    linha, 
    modelo, 
    horario, 
    comentario,
    comentario_manutencao,
    matricula_tecnico,
    matricula_operador,
    target,      
    actual,       
    difference,   
    loss_minutes,
    tipo_comentario
  } = req.body;
  
  let sql, params;
  
  if (tipo_comentario === 'manutencao') {
    // Salvar comentário de manutenção
    sql = `
      INSERT INTO hora_mounter_comments 
      (data, linha, modelo, horario, comentario_manutencao, matricula_tecnico, target, actual, difference, loss_minutes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      comentario_manutencao = VALUES(comentario_manutencao),
      matricula_tecnico = VALUES(matricula_tecnico),
      target = VALUES(target),
      actual = VALUES(actual),
      difference = VALUES(difference),
      loss_minutes = VALUES(loss_minutes),
      data_atualizacao = CURRENT_TIMESTAMP
    `;
    
    params = [
      data, 
      linha, 
      modelo, 
      horario, 
      comentario_manutencao,
      matricula_tecnico,
      target,
      actual,
      difference,
      loss_minutes
    ];
  } else {
    // Salvar comentário de produção (comportamento original)
    sql = `
      INSERT INTO hora_mounter_comments 
      (data, linha, modelo, horario, comentario, matricula_operador, target, actual, difference, loss_minutes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      comentario = VALUES(comentario),
      matricula_operador = VALUES(matricula_operador),
      target = VALUES(target),
      actual = VALUES(actual),
      difference = VALUES(difference),
      loss_minutes = VALUES(loss_minutes),
      data_atualizacao = CURRENT_TIMESTAMP
    `;
    
    params = [
      data, 
      linha, 
      modelo, 
      horario, 
      comentario,
      matricula_operador,
      target,
      actual,
      difference,
      loss_minutes
    ];
  }
  
  db.query(sql, params, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao salvar comentário' });
    }
    res.json({ success: true, message: 'Comentário salvo com sucesso!' });
  });
});


// Historico de registro do horahora

router.get("/HoraProd_Lista", requireScreen, (req, res) => {
  const { date } = req.query;

  let mysql = `
  SELECT date_format(a.data, '%Y-%m-%d') data, a.linha, a.modelo, 
  case
  when a.horario = 'HORARIO_1_1' then '1T 1°H'
  when a.horario = 'HORARIO_1_2' then '1T 2°H'
  when a.horario = 'HORARIO_1_3' then '1T 3°H'
  when a.horario = 'HORARIO_1_4' then '1T 4°H'
  when a.horario = 'HORARIO_1_5' then '1T 5°H'
  when a.horario = 'HORARIO_1_6' then '1T 6°H'
  when a.horario = 'HORARIO_1_7' then '1T 7°H'
  when a.horario = 'HORARIO_1_8' then '1T 8°H'
  when a.horario = 'HORARIO_2_1' then '1T 9°H'
  when a.horario = 'HORARIO_2_2' then '1T 10°H'
  when a.horario = 'HORARIO_2_3' then '2T 1°H'
  when a.horario = 'HORARIO_2_4' then '2T 2°H'
  when a.horario = 'HORARIO_2_5' then '2T 3°H'
  when a.horario = 'HORARIO_2_6' then '2T 4°H'
  when a.horario = 'HORARIO_2_7' then '2T 5°H'
  when a.horario = 'HORARIO_2_8' then '2T 6°H'
  when a.horario = 'HORARIO_3_1' then '2T 7°H'
  when a.horario = 'HORARIO_3_2' then '2T 8°H'
  when a.horario = 'HORARIO_3_3' then '2T 9°H'
  when a.horario = 'HORARIO_3_4' then '3T 1°H'
  when a.horario = 'HORARIO_3_5' then '3T 2°H'
  when a.horario = 'HORARIO_3_6' then '3T 3°H'
  when a.horario = 'HORARIO_3_7' then '3T 4°H'
  when a.horario = 'HORARIO_3_8' then '3T 5°H'
  else a.horario
    end Horario,
    a.comentario comentario, 
    date_format(a.data_atualizacao, '%H:%i:%s') data_atualizacao,
    a.target,       
    a.actual,        
    a.difference,   
    a.loss_minutes,
    a.loss_minutes,
    a.comentario_manutencao
    
  FROM mydb.hora_mounter_comments a
  WHERE date_format(a.data, '%Y-%m-%d') = ?
  ORDER BY data DESC;
  `;
  db.query(mysql, [date], (err, result) => {
      if (err) {
          console.log(err);
          res.status(500).send(err);
      } else {
          res.send(result);
      }
  });
});


  //---------------Hora produção 2T
router.get("/HoraProd2T", requireScreen, (req, res) => {
  const {data} = req.query;
 
   let mysql = `
SELECT DISTINCT
   A.Data,
   A.Linha,
   A.Modelo,
   CASE

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-16' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-16' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-16' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-16' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-16' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-16' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-16' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-16' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-16' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-16' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-16' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-16' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-16' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-16' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-16' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-16' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-16' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-16' THEN 180
    
    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-17' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-17' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-17' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-17' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-17' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-17' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-17' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-17' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-17' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-17' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-17' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-17' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-17' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-17' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-17' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-17' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-17' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-17' THEN 180

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-18' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-18' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-18' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-18' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-18' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-18' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-18' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-18' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-18' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-18' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-18' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-18' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-18' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-18' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-18' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-18' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-18' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-18' THEN 180

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-19' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-19' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-19' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-19' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-19' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-19' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-19' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-19' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-19' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-19' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-19' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-19' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-19' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-19' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-19' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-19' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-19' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-19' THEN 180

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-20' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-20' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-20' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-20' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-20' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-20' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-20' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-20' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-20' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-20' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-20' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-20' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-20' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-20' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-20' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-20' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-20' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-20' THEN 180

     ELSE B.Meta
   END AS Meta,
  A.HORARIO_2_3 * B.Array AS HORARIO_2_3, /*5:55*/
  A.HORARIO_2_4 * B.Array AS HORARIO_2_4, /*6:55*/
  A.HORARIO_2_5 * B.Array AS HORARIO_2_5, /*7:55*/
  A.HORARIO_2_6 * B.Array AS HORARIO_2_6, /*8:55*/
  A.HORARIO_2_7 * B.Array AS HORARIO_2_7, /*9:55*/
  A.HORARIO_2_8 * B.Array AS HORARIO_2_8, /*10:55*/
  A.HORARIO_3_1 * B.Array AS HORARIO_3_1, /*11:55*/
  A.HORARIO_3_2 * B.Array AS HORARIO_3_2, /*00:55*/
  A.HORARIO_3_3 * B.Array AS HORARIO_3_3, /*1:55*/
  
  (A.HORARIO_2_3 + A.HORARIO_2_4 + A.HORARIO_2_5 +
   A.HORARIO_2_6 + A.HORARIO_2_7 + A.HORARIO_2_8 +
   A.HORARIO_3_1 + A.HORARIO_3_2 + A.HORARIO_3_3) * B.Array AS Total
FROM (
   SELECT
     DATE_FORMAT(WORK_YMD, '%Y-%m-%d') AS Data,
     LINE_NM AS Linha, MODEL_CODE as Modelo,
     HORARIO_2_3 , HORARIO_2_4 , HORARIO_2_5 ,
   HORARIO_2_6 , HORARIO_2_7 , HORARIO_2_8 ,
   HORARIO_3_1 , HORARIO_3_2 , HORARIO_3_3
   FROM hora_mounter_v2
   WHERE DATE_FORMAT(WORK_YMD, '%Y-%m-%d') = ?
AND (HORARIO_2_3 + HORARIO_2_4 + HORARIO_2_5 +
   HORARIO_2_6 + HORARIO_2_7 + HORARIO_2_8 +
   HORARIO_3_1 + HORARIO_3_2 + HORARIO_3_3) > 0
   GROUP BY linha, modelo
   ORDER BY Linha
) A
INNER JOIN pcb_qty_array B ON A.Modelo = B.Modelo
union all
SELECT '','TOTAL','',sum(Meta), SUM(HORARIO_2_3),SUM(HORARIO_2_4),
SUM(HORARIO_2_5),SUM(HORARIO_2_6),SUM(HORARIO_2_7),SUM(HORARIO_2_8),
SUM(HORARIO_3_1),SUM(HORARIO_3_2),SUM(HORARIO_3_3),
 SUM(TOTAL) 
FROM (
SELECT DISTINCT
   A.Data,
   A.Linha,
   A.Modelo,
   CASE

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-16' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-16' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-16' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-16' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-16' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-16' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-16' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-16' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-16' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-16' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-16' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-16' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-16' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-16' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-16' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-16' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-16' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-16' THEN 180
    
    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-17' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-17' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-17' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-17' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-17' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-17' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-17' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-17' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-17' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-17' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-17' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-17' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-17' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-17' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-17' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-17' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-17' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-17' THEN 180

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-18' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-18' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-18' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-18' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-18' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-18' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-18' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-18' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-18' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-18' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-18' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-18' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-18' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-18' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-18' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-18' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-18' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-18' THEN 180

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-19' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-19' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-19' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-19' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-19' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-19' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-19' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-19' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-19' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-19' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-19' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-19' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-19' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-19' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-19' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-19' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-19' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-19' THEN 180

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-20' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-20' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-20' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-20' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-20' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-20' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-20' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-20' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-20' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-20' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-20' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-20' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-20' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-20' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-20' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-20' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-20' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-20' THEN 180

     ELSE B.Meta
   END AS Meta,
  A.HORARIO_2_3 * B.Array AS HORARIO_2_3, /*5:55*/
  A.HORARIO_2_4 * B.Array AS HORARIO_2_4, /*6:55*/
  A.HORARIO_2_5 * B.Array AS HORARIO_2_5, /*7:55*/
  A.HORARIO_2_6 * B.Array AS HORARIO_2_6, /*8:55*/
  A.HORARIO_2_7 * B.Array AS HORARIO_2_7, /*9:55*/
  A.HORARIO_2_8 * B.Array AS HORARIO_2_8, /*10:55*/
  A.HORARIO_3_1 * B.Array AS HORARIO_3_1, /*11:55*/
  A.HORARIO_3_2 * B.Array AS HORARIO_3_2, /*00:55*/
  A.HORARIO_3_3 * B.Array AS HORARIO_3_3, /*1:55*/

  (A.HORARIO_2_3 + A.HORARIO_2_4 + A.HORARIO_2_5 +
   A.HORARIO_2_6 + A.HORARIO_2_7 + A.HORARIO_2_8 +
   A.HORARIO_3_1 + A.HORARIO_3_2 + A.HORARIO_3_3) * B.Array AS Total

FROM (
   SELECT
     DATE_FORMAT(WORK_YMD, '%Y-%m-%d') AS Data,
     LINE_NM AS Linha, MODEL_CODE as Modelo,
   HORARIO_2_3 , HORARIO_2_4 , HORARIO_2_5 ,
   HORARIO_2_6 , HORARIO_2_7 , HORARIO_2_8 ,
   HORARIO_3_1 , HORARIO_3_2 , HORARIO_3_3

   FROM hora_mounter_v2
   WHERE DATE_FORMAT(WORK_YMD, '%Y-%m-%d') = ?
    AND (HORARIO_2_3 + HORARIO_2_4 + HORARIO_2_5 +
   HORARIO_2_6 + HORARIO_2_7 + HORARIO_2_8 +
   HORARIO_3_1 + HORARIO_3_2 + HORARIO_3_3) > 0
   GROUP BY linha, modelo
   ORDER BY Linha
) A
INNER JOIN pcb_qty_array B ON A.Modelo = B.Modelo
) A             
 ORDER BY Linha ASC;

    `;
   
   db.query(mysql, [data, data], (err, result) => {
     if (err) {
       console.log(err);
     } else {
       res.json(result);
     }
   });
 });


 //-------- Hora produção 3T
router.get("/HoraProd3T", requireScreen, (req, res) => {
  const {data} = req.query;
 
   let mysql = ` 
SELECT DISTINCT
   A.Data,
   A.Linha,
   A.Modelo,
   CASE

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-16' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-16' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-16' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-16' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-16' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-16' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-16' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-16' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-16' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-16' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-16' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-16' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-16' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-16' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-16' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-16' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-16' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-16' THEN 180
    
    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-17' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-17' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-17' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-17' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-17' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-17' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-17' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-17' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-17' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-17' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-17' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-17' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-17' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-17' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-17' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-17' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-17' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-17' THEN 180

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-18' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-18' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-18' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-18' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-18' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-18' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-18' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-18' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-18' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-18' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-18' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-18' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-18' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-18' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-18' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-18' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-18' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-18' THEN 180

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-19' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-19' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-19' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-19' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-19' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-19' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-19' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-19' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-19' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-19' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-19' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-19' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-19' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-19' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-19' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-19' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-19' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-19' THEN 180

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-20' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-20' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-20' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-20' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-20' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-20' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-20' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-20' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-20' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-20' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-20' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-20' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-20' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-20' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-20' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-20' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-20' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-20' THEN 180

     ELSE B.Meta
   END AS Meta,
  A.HORARIO_3_4 * B.Array AS HORARIO_3_4, /*5:55*/
  A.HORARIO_3_5 * B.Array AS HORARIO_3_5, /*6:55*/
  A.HORARIO_3_6 * B.Array AS HORARIO_3_6, /*7:55*/
  A.HORARIO_3_7 * B.Array AS HORARIO_3_7, /*8:55*/
  A.HORARIO_3_8 * B.Array AS HORARIO_3_8, /*9:55*/
  
(A.HORARIO_3_4 + A.HORARIO_3_5 + A.HORARIO_3_6 +
   A.HORARIO_3_7 + A.HORARIO_3_8 ) * B.Array AS Total

FROM (
   SELECT
     DATE_FORMAT(WORK_YMD, '%Y-%m-%d') AS Data,
     LINE_NM AS Linha, MODEL_CODE as Modelo,
     HORARIO_3_4 , HORARIO_3_5 , HORARIO_3_6 ,
   HORARIO_3_7 , HORARIO_3_8
   FROM hora_mounter_v2
   WHERE DATE_FORMAT(WORK_YMD, '%Y-%m-%d') = ?
AND (HORARIO_3_4 + HORARIO_3_5 + HORARIO_3_6 +
   HORARIO_3_7 + HORARIO_3_8) > 0
   GROUP BY linha, modelo
   ORDER BY Linha
) A
INNER JOIN pcb_qty_array B ON A.Modelo = B.Modelo
union all
SELECT '','TOTAL','',sum(Meta), SUM(HORARIO_3_4),SUM(HORARIO_3_5),
SUM(HORARIO_3_6),SUM(HORARIO_3_7),SUM(HORARIO_3_8),
 SUM(TOTAL) 
FROM (
SELECT DISTINCT
   A.Data,
   A.Linha,
   A.Modelo,
   CASE

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-16' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-16' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-16' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-16' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-16' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-16' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-16' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-16' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-16' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-16' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-16' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-16' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-16' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-16' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-16' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-16' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-16' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-16' THEN 180
    
    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-17' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-17' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-17' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-17' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-17' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-17' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-17' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-17' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-17' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-17' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-17' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-17' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-17' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-17' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-17' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-17' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-17' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-17' THEN 180

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-18' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-18' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-18' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-18' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-18' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-18' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-18' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-18' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-18' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-18' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-18' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-18' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-18' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-18' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-18' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-18' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-18' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-18' THEN 180

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-19' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-19' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-19' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-19' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-19' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-19' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-19' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-19' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-19' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-19' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-19' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-19' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-19' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-19' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-19' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-19' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-19' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-19' THEN 180

    WHEN A.Modelo like '%A066%' AND A.Linha = 'SMD-20' THEN 172
    WHEN A.Modelo like '%A165%' AND A.Linha = 'SMD-20' THEN 252
    WHEN A.Modelo like '%A175%' AND A.Linha = 'SMD-20' THEN 240
    WHEN A.Modelo like '%A176%' AND A.Linha = 'SMD-20' THEN 198
    WHEN A.Modelo like '%A266%' AND A.Linha = 'SMD-20' THEN 204
    WHEN A.Modelo like '%A366%' AND A.Linha = 'SMD-20' THEN 180
    WHEN A.Modelo like '%A566%' AND A.Linha = 'SMD-20' THEN 188
    WHEN A.Modelo like '%G556%' AND A.Linha = 'SMD-20' THEN 180
    WHEN A.Modelo like '%X210%' AND A.Linha = 'SMD-20' THEN 220
    WHEN A.Modelo like '%X306%' AND A.Linha = 'SMD-20' THEN 116
    WHEN A.Modelo like '%X400%' AND A.Linha = 'SMD-20' THEN 194
    WHEN A.Modelo like '%X406%' AND A.Linha = 'SMD-20' THEN 138
    WHEN A.Modelo like '%X620%' AND A.Linha = 'SMD-20' THEN 190
    WHEN A.Modelo like '%X626%' AND A.Linha = 'SMD-20' THEN 136
    WHEN A.Modelo like '%X730%' AND A.Linha = 'SMD-20' THEN 180
    WHEN A.Modelo like '%X736%' AND A.Linha = 'SMD-20' THEN 122
    WHEN A.Modelo like '%X930%' AND A.Linha = 'SMD-20' THEN 210
    WHEN A.Modelo like '%A576%' AND A.Linha = 'SMD-20' THEN 180

     ELSE B.Meta
   END AS Meta,
  A.HORARIO_3_4 * B.Array AS HORARIO_3_4, 
  A.HORARIO_3_5 * B.Array AS HORARIO_3_5, 
  A.HORARIO_3_6 * B.Array AS HORARIO_3_6, 
  A.HORARIO_3_7 * B.Array AS HORARIO_3_7,
  A.HORARIO_3_8 * B.Array AS HORARIO_3_8, 

  (HORARIO_3_4 + HORARIO_3_5 + HORARIO_3_6 +
   HORARIO_3_7 + HORARIO_3_8) * B.Array AS Total

FROM (
   SELECT
     DATE_FORMAT(WORK_YMD, '%Y-%m-%d') AS Data,
     LINE_NM AS Linha, MODEL_CODE as Modelo,
    HORARIO_3_4 , HORARIO_3_5 , HORARIO_3_6 ,
   HORARIO_3_7 , HORARIO_3_8

   FROM hora_mounter_v2
   WHERE DATE_FORMAT(WORK_YMD, '%Y-%m-%d') = ?
    AND (HORARIO_3_4 + HORARIO_3_5 + HORARIO_3_6 +
   HORARIO_3_7 + HORARIO_3_8) > 0
   GROUP BY linha, modelo
   ORDER BY Linha
) A
INNER JOIN pcb_qty_array B ON A.Modelo = B.Modelo
) A             
 ORDER BY Linha ASC;

    `;
   
   db.query(mysql, [data, data], (err, result) => {
     if (err) {
       console.log(err);
     } else {
       res.json(result);
     }
   });
 });

 //-----------------------------------------------------------------------------------------------
 //---------- ATR Slots

// // Node.js backend
// app.get("/getATRSlots", async (req, res) => {
//   const { slip } = req.query;

//   // Consulta para obter slots e slips do banco de dados
//   let mysql = `SELECT idModel_Tray as slot, Model_Tray as slip 
//                FROM mydb.smart_rack 
//                ORDER BY Model_date DESC`;

//   try {
//     const [result] = await db2.promise().execute(mysql);
//     res.json(result); // Envia o resultado para o frontend
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Erro ao buscar dados");
//   }
// });


//------------------------------------------------------------------------------------------------
//------------ ESD---------------------------------------------------------------


//--------------------------------------------------------------

//-----------------------------------------------*************************************====================================================================================================

//---------------------------------------------------------------------------------------------------
//------------------------------ Drop Worst Data Collection -----------------------------------------
//---------------------------------------------------------------------------------------------------

// Função para criar nome de tabela temporária único
const generateTempTableName = () => {
  return `temp_drop_worst_data_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
};

// Função para fazer requisição com retry
const fetchWithRetry = async (url, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, { timeout: 10000 });
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`Tentativa ${i + 1} falhou, tentando novamente em ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Endpoint para obter dados processados do Drop Worst com preços reais

module.exports = router;
