const express = require("express");
const router = express.Router();
const db = require("../../config/db");

router.post("/register", (req, res) => {
  const array = req.body;
  const results = [];
  const errors = []
  array.forEach((item) => {
    db.query(
      "INSERT INTO mydb.entrada (PO, Kitting_Plan, Line, Basic_Model, Shift, Reel_ID, Barcode, Part_Number, Qty, User, Registry_ID, Halb, Plant) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
      [
        item.PO,
        item.Kitting_Plan,
        item.Line,
        item.Basic_Model,
        item.Shift,
        item.Reel_ID,
        item.Barcode,
        item.Part_Number,
        item.Qty,
        item.User,
        item.Registry_ID,
        item.Halb,
        item.Plant,
      ],
      (err, result) => {
        if (err) {
          console.log("Erro ao salvar dados na tela de entrada: " + err);
          // res.status(400).json({message: "Erro ao salvar dados na tela de entrada: " + err});
          errors.push(err);
        } else {
          console.log("Dados inseridos: " + res);
          // res.json({message: "sucesso"});
          results.push(result)
        }
      }
    );

  });

  if (errors.length > 0) {
    res.status(400).json({message: `Erro ao salvar ${errors.length} componentes`});
  } else {
    res.json({message: "Sucesso", data: results});
  }

});

router.post("/search", (req, res) => {
  const { Date } = req.body;
  const { PO } = req.body;
  const { Line } = req.body;
  const { Basic_Model } = req.body;
  const { Shift } = req.body;
  const { Reel_ID } = req.body;
  const { Barcode } = req.body;
  const { Part_Number } = req.body;
  const { Qty } = req.body;
  const { User } = req.body;
  const { Registry_ID } = req.body;
  const { Halb } = req.body;
  const { Plant } = req.body;

  let mysql =
    "SELECT*from entrada ORDER BY id desc WHERE Date = ? AND PO = ? AND Line = ? AND Basic_Model = ? AND Shift = ? AND Reel_ID = ? AND Barcode = ? \
    AND Part_Number = ?  AND Qty = ? AND User = ? AND Registry_ID = ? AND Halb = ?  AND Plant = ?";
  db.query(mysql, [Date, PO, Line, Basic_Model, Shift, Reel_ID, Barcode, Part_Number, Qty, User, Registry_ID, Halb, Plant], (err, result) => {
    if (err) res.send(err);
    console.log(err);
    res.send(result);
  });
});

router.get("/getCards", (req, res) => {
  let mysql = "SELECT *, date_format(SUBSTR(Date, 1, 10), '%d/%m/%Y') as Date, time_format(SUBSTR(Date, 11, 19), '%H:%i') as Hour FROM mydb.entrada where date >= curdate() - INTERVAL 30 DAY order by id desc;";
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

router.put("/edit", (req, res) => {
  const { id } = req.body;
  const { dia } = req.body;
  const { po } = req.body;
  const { linha } = req.body;
  const { modelo } = req.body;
  const { turno } = req.body;
  const { reel_id } = req.body;
  const { vendor } = req.body;
  const { part_number } = req.body;
  const { qty } = req.body;
  const { user } = req.body;
  const { matricula } = req.body;
  const { halb } = req.body;
  const { planta } = req.body;

  let mysql = "UPDATE entrada SET data = ?, linha = ?, modelo = ?, turno = ?, reel_id = ?, vendor = ?, part_number = ? WHERE id = ?";
  db.query(mysql, [dia, linha, modelo, turno, reel_id, vendor, part_number, qty, user, matricula, halb, planta], (err, result) => {
    if (err) {
      res.send(err);
    } else {
      res.send(result);
    }
  });
});

router.delete("/delete/:id", (req, res) => {
  const { id } = req.params;
  let mysql = "DELETE FROM entrada WHERE id = ?";
  db.query(mysql, id, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

module.exports = router;
