const express = require("express");
const router = express.Router();
const db = require("../../config/db");

//---------------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------
// ----------------------------------------Consultas Kitting Plan GMES

router.post('/registerkit', (req, res) => {

  const array = req.body;
array.forEach(item => {


     db.query('INSERT INTO mydb.smdkittingplan (LINE_NM ,MODEL_CODE, BASIC_MODEL_CODE, PLAN_QTY, PRODC_INST_NO, PLANT_CODE,PLAN_YMD,WORK_YMD,CNTN_YN) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
     [item.LINE_NM, item.MODEL_CODE, item.BASIC_MODEL_CODE, item.PLAN_QTY,
      item.PRODC_INST_NO,item.PLANT_CODE, item.CNTN_YN,item.WORK_YMD,item.PLAN_YMD], (err, result) => {
      if (err) throw err;
      console.log('Dados inseridos: ' + res.affectedRows);
    });
  });
})

router.get("/getkit", (req, res) => {
  let mysql = "SELECT id, WORK_YMD as Date, LINE_NM as Line,MODEL_CODE as Halb,BASIC_MODEL_CODE as Basic_Model,PLANT_CODE as Plant,sum(PLAN_QTY) as Qty FROM mydb.smdkittingplan where PLANT_CODE='P81J' or PLANT_CODE='P81L' or PLANT_CODE='P81M' or PLANT_CODE='P81N' or PLANT_CODE='P81P' group by LINE_NM;";
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

module.exports = router;
