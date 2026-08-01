const express = require("express");
const router = express.Router();
const db = require("../../config/db");

// Compartilhada entre Material, Repair e MX
// (havia uma segunda definição idêntica desta rota mais adiante no index.js
// original, que nunca era alcançada pelo Express por ser a segunda definição
// do mesmo path - removida na migração por ser código morto)
router.get("/getModeloReparo", (req, res) => {
  let mysql = `SELECT modelo as Basic_Model, Halb
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
  WHERE rn = 1;`;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

module.exports = router;
