const express = require("express");
const router = express.Router();
const db = require("../../../config/db");
const { authorizeScreen } = require("../../../auth/middleware");
const requireScreen = authorizeScreen('Feeder');

//----------------------Feeder-------------------------------
router.post('/Feeder', requireScreen, (req, res) => {
  const {
    id,    Turno,    Tecnico,    Codigo,    Tamanho,
    Ano,    Status,    Manutencao,    Peca
  } = req.body

  let mysql = `INSERT INTO mydb.feeder (id,
    Turno,  Tecnico,  Codigo,   Tamanho,   Ano,
    Status,   Manutencao,   Peca) VALUES (?,?,?,?,?,?,?,?,?);`

  db.query(mysql, [id,
    Turno,    Tecnico,    Codigo,    Tamanho,    Ano,
    Status,    Manutencao,    Peca],

     (err) => {
      if (err) {
        console.log('Erro na entrada de dados do Feeder:' + err);
        res.send({
          STATUS: false,
          msg: err
        })
      } else {
        console.log('Dados inseridos com sucesso no Feeder');
        res.send({
          STATUS: true,
          msg: "DADOS INSERIDOS COM SUCESSO"
        })
      }

    });

})

router.get("/getFeeder", requireScreen, (req, res) => {
  let mysql = `select *, date_format(Data, '%Y-%m-%d / %Hh:%mm') as Data from mydb.feeder order by id desc;`
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

module.exports = router;
