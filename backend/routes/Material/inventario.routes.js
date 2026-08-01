const express = require("express");
const router = express.Router();
const db = require("../../config/db");
const { authorizeScreen } = require("../../auth/middleware");
const requireScreen = authorizeScreen('Inventario');

// ---------------------------------------Inventário de Componentes / Placas ---------------------------------------

router.post('/inv', requireScreen, (req, res)=>{
  const {
    Data,
    Basic_Model,
    Codigo,
    Fase,
    Material,
    Qty_Bottom,
    Qty_Top,
    Qty_Reparo,
    Qty_Offline,
    Qty_Wip,
    Qty_Scrap,
    Pend_Kitting,
    Qty_Plano,
    Observacao
  } = req.body

  let mysql = "INSERT INTO mydb.inventario (Data, Basic_Model, Codigo, Fase, Material, Qty_Bottom, Qty_Top, Qty_Reparo, Qty_Offline, \
     Qty_Wip, Qty_Scrap, Pend_Kitting, Qty_Plano, Observacao) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?);"
   db.query(mysql, [Data, Basic_Model, Codigo, Fase, Material, Qty_Bottom, Qty_Top, Qty_Reparo, Qty_Offline, Qty_Wip, Qty_Scrap,
     Pend_Kitting, Qty_Plano, Observacao], (err) => {
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

router.get("/getinventario", requireScreen, (req, res) => {
 let mysql = "SELECT * FROM mydb.inventario ORDER BY id desc;";
 db.query(mysql, (err, result) => {
   if (err) {
     console.log(err);
   } else {
     res.send(result);
   }
 });
});

module.exports = router;
