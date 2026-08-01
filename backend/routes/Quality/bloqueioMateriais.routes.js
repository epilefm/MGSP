const express = require("express");
const router = express.Router();
const db = require("../../config/db");

   router.post("/BloqMat", (req, res) => {
    const { Basic_Model } = req.body;
    const { Linha } = req.body;
    const { Turno } = req.body;
    const { Defeito } = req.body;
    const { Qty_bloq } = req.body;
    const { Qty_def } = req.body;
    const { PIC } = req.body;
    const { Equipamento } = req.body;
  
    let mysql =
      "INSERT INTO mydb.bloqueio_mat (Basic_Model, Linha, Turno, Defeito, Qty_bloq, Qty_def, PIC, Equipamento) \
    VALUES (?,?,?,?,?,?,?,?)";
    db.query(
      mysql,
      [
        Basic_Model,
        Linha,
        Turno,
        Defeito,
        Qty_bloq,
        Qty_def,
        PIC,
        Equipamento,
      ],
      (err, res) => {
        if (err) {
          console.log(
            "Erro na entrada de dados do bloqueio de materiais: " + err + " ---- " + res
          );
        } else {
          console.log("Dados inseridos com sucesso no bloqueio de materiais " + res);
        }
      }
    );
  });
  
  router.get("/getBloqMat", (req, res) => {
    let mysql =
      "SELECT *, DATE_FORMAT(Data, '%Y-%m-%d %H:%i:%s') AS 'Data' FROM mydb.bloqueio_mat order by id desc";
    db.query(mysql, (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    });
  });
module.exports = router;
