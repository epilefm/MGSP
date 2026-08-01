const express = require("express");
const router = express.Router();
const db = require("../../config/db");

router.get("/getModelo", (req, res) => {
  let mysql = "SELECT Halb, Basic_Model, Plant FROM mydb.entrada where Plant='P81J' OR Plant='P81L' \
   OR Plant='P81M' OR Plant='P81N' OR Plant='P81P' OR Plant is null group by halb ORDER BY Halb ASC;";
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

// ---------------------------------------usuarios---------------------------------------

router.get("/getUser", (req, res) => {
  let mysql = "SELECT Nome FROM mydb.usuarios where matricula = 'Registry_ID' order by id desc;";
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

// Buscar todas as pessoas (usada por múltiplos departamentos: Suporte/Armario, Production, etc)
router.get('/pessoas', (req, res) => {
  const query = `SELECT id, funcionarios, matricula, turno, cargo, departamento, job_class FROM mydb.pessoas ORDER BY funcionarios`;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar pessoas: ", err);
      return res.status(500).json({ error: "Erro ao buscar pessoas" });
    }

    res.status(200).json(results);
  });
});

module.exports = router;
