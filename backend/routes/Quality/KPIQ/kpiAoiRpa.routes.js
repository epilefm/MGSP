const express = require("express");
const router = express.Router();
const db = require("../../../config/db");

///------------------------------------------------------------------ RPA -------------------------------
//------------KPI_AOI
router.get("/KPI_AOI", (req, res) => {
  const { slip } = req.query;

  // Consulta para obter slots e slips do banco de dados
  let mysql = `SELECT date_format(Work_ymd, '%d/%m/%Y') as Data, PAOI_PPM as 'P-AOI', MAOI_PPM as 'M-AOI', SAOI_PPM as 'S-AOI',  AOI_PPM as 'FT', AOI_PROD 'TEACHING M', AOI as 'TEACHING S'
  FROM mydb.kpi_aoi where WORK_YMD BETWEEN DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND CURDATE() order by WORK_YMD desc;`;

  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

module.exports = router;
