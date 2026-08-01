const express = require("express");
const router = express.Router();
const db = require("../../config/db");

/////-------------------------------------
router.get("/getPlantHistory", (req, res) => {
  let mysql =
    `           -- Histórico de planta errada
     SELECT date_format(WORK_YMD, '%d-%m-%Y') as 'Data', date_format(Insp_DT, '%h:%i:%s') as 'Hora',
 WORK_PROC_CODE as Fase, LINE_NM as Linha, MODEL_CODE as Modelo, CN, PLANT_CODE_PAOI as Planta_PAOI, PLANT_CODE_MASTER as Planta_Master
 ,  
        case when a.PLANT_CODE_PAOI = a.PLANT_CODE_MASTER
               then 'Correct'
               else 'Wrong Plant'
       END AS 'Status'
       FROM mydb.plant_check_v5 a order by id desc;`
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});   // http://105.103.39.102:80/getPlantHistory
module.exports = router;
