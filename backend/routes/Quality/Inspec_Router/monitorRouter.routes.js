const express = require("express");
const router = express.Router();
const db = require("../../../config/db");

/// -------  Monitoramento de Corte da Router-----------------------------------------------------
router.get('/Monit_Router', (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10); // Usar data recebida ou atual

  const sql = `
   SELECT 
      concat('SMD-', linha) as linha, b.funcionarios as nome, time as Dept, tipo_validacao as tipo, modelo as Modelo,
      HOUR(data_hora) as Hour,
      resultado_inspecao,
      causa_falha,
      cn_pcb
    FROM 
      (select data_hora, resultado_inspecao, maquina, linha, matricula, cn_pcb, tipo_validacao, causa_falha, time, modelo
      from corte_router order by data_hora desc) a
      left join pessoas b on a.matricula = b.matricula
    WHERE 
      HOUR(data_hora) BETWEEN 0 AND 23 
      AND date_format(data_hora, '%Y-%m-%d') = ?  -- Usar parâmetro
    ORDER BY linha asc
  `;

  db.query(sql, [date], (err, results) => {
    if (err) throw err;
    
    // Group by production line and hour
    const groupedData = results.reduce((acc, item) => {
      if (!acc[item.linha]) acc[item.linha] = {};
      // Manter histórico completo em vez de sobrescrever
      if (!acc[item.linha][item.Hour]) {
        acc[item.linha][item.Hour] = [];
      }
      acc[item.linha][item.Hour].push({
        status: item.resultado_inspecao,
        cause: item.causa_falha,
        nome: item.nome,
        tipo: item.tipo,
        dept: item.Dept,
        modelo: item.Modelo,
        cn: item.cn_pcb
      });
      return acc;
    }, {});

    res.json(groupedData);
  });
});




// ==========================================
// API GAUSS - Chat IA para Monitor Router
// ==========================================

// Rota alternativa para o frontend moderno (sem auth)
router.get('/router/monitor', (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);

  const sql = `
    SELECT 
       concat('SMD-', linha) as linha, b.funcionarios as nome, time as Dept, tipo_validacao as tipo, modelo as Modelo,
       HOUR(data_hora) as Hour,
       resultado_inspecao,
       causa_falha,
       cn_pcb
     FROM 
       (select data_hora, resultado_inspecao, maquina, linha, matricula, cn_pcb, tipo_validacao, causa_falha, time, modelo
       from corte_router order by data_hora desc) a
       left join pessoas b on a.matricula = b.matricula
     WHERE 
       HOUR(data_hora) BETWEEN 0 AND 23 
       AND date_format(data_hora, '%Y-%m-%d') = ?
     ORDER BY linha asc
  `;

  db.query(sql, [date], (err, results) => {
    if (err) {
      console.error('Erro /router/monitor:', err);
      return res.status(500).json({ error: 'Erro ao buscar dados' });
    }
    
    const groupedData = results.reduce((acc, item) => {
      if (!acc[item.linha]) acc[item.linha] = {};
      if (!acc[item.linha][item.Hour]) {
        acc[item.linha][item.Hour] = [];
      }
      acc[item.linha][item.Hour].push({
        status: item.resultado_inspecao,
        cause: item.causa_falha,
        nome: item.nome,
        tipo: item.tipo,
        dept: item.Dept,
        modelo: item.Modelo,
        cn: item.cn_pcb
      });
      return acc;
    }, {});

    res.json({ date, grid: groupedData });
  });
});
module.exports = router;
