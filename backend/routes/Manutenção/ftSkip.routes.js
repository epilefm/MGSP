const express = require("express");
const router = express.Router();
const db = require("../../config/db");

// Rota para buscar dados da tabela FT Skip Monitoring
// Pega apenas o registro MAIS RECENTE de cada linha (evita duplicados do dia)
router.get("/getFTSkipData", (req, res) => {
  const { date } = req.query;

  let mysql;
  if (date) {
    // Buscar dados de uma data específica - apenas o mais recente de cada linha
    mysql = `SELECT
      a.id,
      a.line_name,
      a.building_test_count,
      a.function_test_count,
      a.model_name,
      date_format(a.collection_datetime, '%Y-%m-%d') as date,
      time_format(a.collection_datetime, '%H:%i:%s') as time,
      date_format(a.created_at, '%Y-%m-%d %H:%i:%s') as created_at
    FROM mydb.ft_skip a
    INNER JOIN (
      SELECT line_name, MAX(collection_datetime) as max_datetime
      FROM mydb.ft_skip
      WHERE date_format(collection_datetime, '%Y-%m-%d') = ?
      GROUP BY line_name
    ) b ON a.line_name = b.line_name AND a.collection_datetime = b.max_datetime
    ORDER BY a.line_name ASC;`;
    db.query(mysql, [date], (err, result) => {
      if (err) {
        console.error("Erro ao buscar dados FT Skip:", err);
        res.status(500).json({ error: "Erro ao buscar dados" });
      } else {
        res.json(result);
      }
    });
  } else {
    // Buscar dados do dia atual - apenas o mais recente de cada linha
    mysql = `SELECT
      a.id,
      a.line_name,
      a.building_test_count,
      a.function_test_count,
      a.model_name,
      date_format(a.collection_datetime, '%Y-%m-%d') as date,
      time_format(a.collection_datetime, '%H:%i:%s') as time,
      date_format(a.created_at, '%Y-%m-%d %H:%i:%s') as created_at
    FROM mydb.ft_skip a
    INNER JOIN (
      SELECT line_name, MAX(collection_datetime) as max_datetime
      FROM mydb.ft_skip
      WHERE date_format(collection_datetime, '%Y-%m-%d') = CURDATE()
      GROUP BY line_name
    ) b ON a.line_name = b.line_name AND a.collection_datetime = b.max_datetime
    ORDER BY a.line_name ASC;`;
    db.query(mysql, (err, result) => {
      if (err) {
        console.error("Erro ao buscar dados FT Skip:", err);
        res.status(500).json({ error: "Erro ao buscar dados" });
      } else {
        res.json(result);
      }
    });
  }
});

module.exports = router;
