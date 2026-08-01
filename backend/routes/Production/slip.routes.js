const express = require("express");
const router = express.Router();
const db = require("../../config/db");

//-------------------GMES SLIP

router.post("/slip", (req, res) => {

  const array = req.body.dados;

  console.log(req.body.dados)

  array.forEach((item) => {
    db.query(
      "INSERT INTO mydb.slip (slip, cn, resultado) VALUES (?, ?, ?);",
      [
        item.slip,
        item.cn,
        item.resultado,

      ],
      (err, res) => {
        if (err) {
          console.log("Erro ao salvar dados na tela de entrada: " + err);
        } else {
          console.log("Dados inseridos: " + res);
        }
      }
    );
  });
})

router.get("/getSlip", (req, res) => {
  let mysql = `select *,  date_format(Data, '%Y-%m-%d / %H:%m') as Data from mydb.slip order by id desc limit 1000;`;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

module.exports = router;
