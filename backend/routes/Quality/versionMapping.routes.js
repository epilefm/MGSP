const express = require("express");
const router = express.Router();
const db = require("../../config/db");

//-------------------Version SW----------------------------------

  router.get("/getVersion", (req, res) => {
    let mysql =
      `SELECT *,
      case   when a.PDA_VER = a.SW_VER_LINE
             then 'Atualizado'
             else 'Desatualizado'
     END AS 'Status PDA',
     case
     when a.CSC_VER = a.SW_VER_LINE
             then 'Atualizado'
             else 'Desatualizado'
             end as 'Status CSC'
           
             FROM mydb.vw_control_version_v3 a WHERE SW_VER_LINE != '-' order by LINE_NM;`
    db.query(mysql, (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    });
  });

 router.get("/get2DMapping", (req, res) => {
   let mysql =
     `SELECT *, date_format(PLAN_YMD,'%Y-%m-%d') as Date FROM mydb.pcb_2d_control;`
   db.query(mysql, (err, result) => {
     if (err) {
       console.log(err);
     } else {
       res.send(result);
     }
   });
 });
module.exports = router;
