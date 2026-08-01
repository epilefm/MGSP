const express = require("express");
const router = express.Router();
const db = require("../../config/db");

//---------------------------------------------------------------------
// Endpoint LobMounter - Busca dados da tabela lob_npm para monitoramento de LOB
// Parâmetros: data (YYYY-MM-DD), shift (turno), line_name (nome da linha)
//---------------------------------------------------------------------

// Endpoint otimizado LobMounter - Busca dados da tabela lob_npm para monitoramento de LOB
// Parâmetros: data (YYYY-MM-DD), shift (turno), line_name (nome da linha)
// OTIMIZAÇÃO: Usa índice composto (log_date, shift, line_name) para busca rápida
router.get("/LobMounter", (req, res) => {
  const { data, shift, line_name } = req.query;
  
  // Query otimizada com uso de índices
  let mysql = `
    SELECT 
      mc_no, 
      CAST(ctime AS DECIMAL(10,2)) as ctime, 
      line_name, 
      lane, 
      bneck, 
      lot_name 
    FROM mydb.lob_npm 
    WHERE 1=1
  `;
  const params = [];
  
  // Ordem dos filtros é importante para usar o índice composto
  if (data) {
    mysql += " AND log_date = ?";
    params.push(data);
  }
  
  if (shift) {
    mysql += " AND shift = ?";
    params.push(shift);
  }
  
  if (line_name) {
    mysql += " AND line_name = ?";
    params.push(line_name);
  }
  
  // Ordenação otimizada
  mysql += " ORDER BY line_name, mc_no";
  
  // Usar query com promise para melhor performance
  db.query(mysql, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar dados do LobMounter:", err);
      res.status(500).json({ error: "Erro ao buscar dados", message: err.message });
    } else {
      res.json(result);
    }
  });
});


// ==========================================

router.get("/LobMounter/init-indexes", (req, res) => {
  const createIndexQueries = [
    // Índice composto para otimizar as buscas principais
    `CREATE INDEX IF NOT EXISTS idx_lob_npm_date_shift_line ON mydb.lob_npm (log_date, shift, line_name)`,
    // Índice para busca apenas por data
    `CREATE INDEX IF NOT EXISTS idx_lob_npm_date ON mydb.lob_npm (log_date)`,
    // Índice para busca por data e turno
    `CREATE INDEX IF NOT EXISTS idx_lob_npm_date_shift ON mydb.lob_npm (log_date, shift)`,
    // Índice para ordenação
    `CREATE INDEX IF NOT EXISTS idx_lob_npm_line_mc ON mydb.lob_npm (line_name, mc_no)`
  ];
  
  let completed = 0;
  const results = [];
  
  createIndexQueries.forEach((query, index) => {
    db.query(query, (err, result) => {
      if (err) {
        console.error(`Erro ao criar índice ${index + 1}:`, err);
        results.push({ index: index + 1, success: false, error: err.message });
      } else {
        console.log(`Índice ${index + 1} criado/atualizado com sucesso`);
        results.push({ index: index + 1, success: true });
      }
      completed++;
      
      if (completed === createIndexQueries.length) {
        res.json({ 
          message: "Processo de criação de índices concluído",
          results: results
        });
      }
    });
  });
});

module.exports = router;
