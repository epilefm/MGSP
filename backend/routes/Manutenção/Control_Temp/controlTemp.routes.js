const express = require("express");
const router = express.Router();
const db = require("../../../config/db");

//----------------
//----------------Tela de temperatura e umidade------------------------------------------------------------------------------
router.get("/Temperatura", (req, res) => {
  const {data} = req.query;

   let mysql = `SELECT
    t1.line_smd AS 'linha',
    t1.temp_equipament_smd AS 'temp',
    t1.humidity_equipament_smd AS 'umidade',
    t1.equipament_smd AS 'equip',
    DATE_FORMAT(t1.hours_days, '%Y-%m-%d') AS 'data'
FROM
    mydb.temperatura t1
INNER JOIN (
    SELECT
        line_smd,
        equipament_smd,
        MAX(hours_days) AS max_hour
    FROM
        mydb.temperatura
    WHERE
        DATE_FORMAT(hours_days, '%Y-%m-%d') = CURDATE() and equipament_smd <> 'AMBIENTE'
    GROUP BY
        line_smd,
        equipament_smd
) t2 ON t1.line_smd = t2.line_smd AND t1.equipament_smd = t2.equipament_smd AND t1.hours_days = t2.max_hour group by equip, linha
order by linha;
 `;
   db.query(mysql, [data], (err, result) => {
     if (err) {
       console.log(err);
     } else {
       res.json(result);
     }
   });
 });

router.get("/TempAmbiente", (req, res) => {
  const {data} = req.query;

   let mysql = `SELECT
    t1.line_smd AS 'linha',
    t1.temp_equipament_smd AS 'temp',
    t1.humidity_equipament_smd AS 'umidade',
    t1.equipament_smd AS 'equip',
    DATE_FORMAT(t1.hours_days, '%Y-%m-%d') AS 'data'
FROM
    mydb.temperatura t1
INNER JOIN (
    SELECT
        line_smd,
        equipament_smd,
        MAX(hours_days) AS max_hour
    FROM
        mydb.temperatura
    WHERE
        DATE_FORMAT(hours_days, '%Y-%m-%d') = CURDATE() and equipament_smd = 'AMBIENTE'
    GROUP BY
        line_smd,
        equipament_smd
) t2 ON t1.line_smd = t2.line_smd AND t1.equipament_smd = t2.equipament_smd AND t1.hours_days = t2.max_hour group by equip, linha;
 `;
   db.query(mysql, [data], (err, result) => {
     if (err) {
       console.log(err);
     } else {
       res.json(result);
     }
   });
 });

router.get("/Temperaturaa", (req, res) => {
    const {data} = req.query;

     let mysql = `SELECT line_smd AS 'line',
     temp_equipament_smd AS 'temperature',
     humidity_equipament_smd AS 'humidity',
     equipament_smd AS 'equipament',
     DATE_FORMAT(hours_days, '%Y-%m-%d') AS 'period'
  FROM mydb.temperatura where DATE_FORMAT(hours_days, '%Y-%m-%d') = curdate()
  order by hours_days desc `;
     db.query(mysql, [data], (err, result) => {
       if (err) {
         console.log(err);
       } else {
         res.json(result);
       }
     });
   });

module.exports = router;
