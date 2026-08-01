const express = require("express");
const router = express.Router();
const db = require("../../../config/db");

/// ESD REAL - STRAP FREE
router.get("/StrapFree", (req, res) => {
  const { date } = req.query;

  let mysql = `
  select
  date_format(Data, '%d-%m-%Y') Data,
  date_format(Data, '%H:%i:%s') Hora,
   Funcionario, Turno, Resultado, Pulseira, Bata, calcado_dir, calcado_esq
   from mydb.strap_freee
    where date_format(Data, '%d-%m-%Y') = ?;
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

module.exports = router;
