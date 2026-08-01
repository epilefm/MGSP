const express = require("express");
const router = express.Router();
const db = require("../../../config/db");
const { authorizeScreen } = require("../../../auth/middleware");
const requireScreen = authorizeScreen('InputSpindle');

//--------------------------------Manutenção    =     Spindle-------------------------------
router.post('/spindle', requireScreen, (req, res)=>{
  const {
    id,
    data_manutencao,
    pecas_trocadas,
    codigo_spindle,
    periodicidade,
    tecnico,
    matricula,
    linha,

  } = req.body

  let mysql = "INSERT INTO mydb.spindle (id, data_manutencao, pecas_trocadas, codigo_spindle, periodicidade, tecnico, \
    matricula, linha) VALUES (?,?,?,?,?,?,?,?);"
   db.query(mysql, [id, data_manutencao, pecas_trocadas, codigo_spindle, periodicidade, tecnico,
    matricula, linha], (err) => {
                     if (err) {
                       console.log('Erro na entrada de dados do Inventario:'+err);
                       res.send({
                         STATUS : false,
                         msg : err
                       })
                       }else{
                       console.log('Dados inseridos com sucesso no Inventario');
                       res.send({
                         STATUS : true,
                         msg: "DADOS INSERIDOS COM SUCESSO"
                       })
                     }

   } );

})

router.get("/getspindle", requireScreen, (req, res) => {
 let mysql = "SELECT *, date_format(adddate(data_manutencao, INTERVAL 90 DAY), '%Y-%m-%d / %H-%mm-%ss') as periodicidade, \
 date_format(data_manutencao, '%Y-%m-%d / %H-%mm-%ss') as data_manutencao FROM mydb.spindle ORDER BY ID DESC;"
 db.query(mysql, (err, result) => {
   if (err) {
     console.log(err);
   } else {
     res.send(result);
   }
 });
});

module.exports = router;
