const express = require("express");
const router = express.Router();
const db = require("../../../config/db");

  router.get("/SplicingDefect", (req, res) => {
    const {data} = req.query;

     let mysql = ` SELECT
     DATE_FORMAT(a.WORK_YMD, '%H:%i:%s') AS Hora,
     a.Turno,
     DATE_FORMAT(a.WORK_YMD, '%Y-%m-%d') AS data,
     a.OPERATOR_NAME, a.PART_NO, a.COMPARISON_ID,
     case when
     a.LINE = 'SST' then 'Pre Setup' else LINE end as LINE,

     a.FAILURE_DESC,
 CASE
   WHEN a.PART_NO = a.COMPARISON_ID and FAILURE_DESC = 'Inapplicable Part Scan Error' then 'Scan de rolo do mesmo código'
     when a.PART_NO != a.COMPARISON_ID and FAILURE_DESC = 'Inapplicable Part Scan Error' then 'Scan em rolos diferentes'

     WHEN a.PART_NO != a.COMPARISON_ID and a.COMPARISON_ID = '-' and FAILURE_DESC = 'Inapplicable Part Scan Error' then 'Divergência de Scan'
     WHEN a.PART_NO != a.COMPARISON_ID and a.COMPARISON_ID = '-' and FAILURE_DESC = 'Unmatched Old New Part Scan' then 'Repetindo scan em rolo antigo'
   WHEN a.PART_NO != a.COMPARISON_ID and a.COMPARISON_ID = '-' and FAILURE_DESC = 'Unused Part Scan Error' then 'Lista divergente do rolo'

    -- when a.PART_NO = '-' and a.COMPARISON_ID = '-' and FAILURE_DESC = 'Inapplicable Part Scan Error' then 'Falha de scan'
    -- when a.PART_NO = '-' and a.COMPARISON_ID = '-' and FAILURE_DESC = 'Unmatched Old New Part Scan' then 'Falha de scan em rolo antigo'

     else 'Divergência'
     end as 'Status'
 FROM
     mydb.transaction1 a
 LEFT JOIN
     splicing_comparison b
 ON
     a.WORK_YMD = b.WORK_YMD  and a.OPERATOR_NAME = b.OPERATOR_NAME
     where
  (a.PART_NO <> '-' AND a.COMPARISON_ID <> '-') and Line <> 'SST' and
     FAILURE_DESC <> 'Cancel Button on Scanner' and DATE_FORMAT(a.WORK_YMD, '%Y-%m-%d') = ?
     order by a.WORK_YMD desc`;

     db.query(mysql, [data], (err, result) => {
       if (err) {
         console.log(err);
       } else {
         res.json(result);
       }
     });
   });

   router.get("/SplicingDefectQTY", (req, res) => {
    const {date} = req.query;

     let mysql =  `select  'Total', '',
     SUM(1T) AS 'primeiroT', SUM(2T) AS 'segundoT', SUM(3T) AS 'terceiroT',
     SUM(Scan_diferente) AS 'scanDif',
     SUM(Scan_igual) AS 'ScanIgual'
     from (SELECT
     REPLACE(DATE_FORMAT(WORK_YMD, '%Y-%m-%d'), '00:00:00', '') AS data,
     CASE WHEN REPLACE(a.Line, '_', '') = 'SST' THEN 'Pre Setup'
     ELSE REPLACE(a.Line, '_', '')
     END AS LINE,
     SUM(CASE WHEN Turno = '1T' AND failure_desc NOT IN ('Cancel Button on Scanner', 'Unmatched Old New Part Scan', 'Unused Part Scan Error', 'Inapplicable Substitute Part Scan Error') THEN 1 ELSE 0 END) AS '1T',
     SUM(CASE WHEN Turno = '2T' AND failure_desc NOT IN ('Cancel Button on Scanner', 'Unmatched Old New Part Scan', 'Unused Part Scan Error', 'Inapplicable Substitute Part Scan Error') THEN 1 ELSE 0 END) AS '2T',
     SUM(CASE WHEN Turno = '3T' AND failure_desc NOT IN ('Cancel Button on Scanner', 'Unmatched Old New Part Scan', 'Unused Part Scan Error', 'Inapplicable Substitute Part Scan Error') THEN 1 ELSE 0 END) AS '3T',

     -- WHEN a.PART_NO = a.COMPARISON_ID and FAILURE_DESC = 'Inapplicable Part Scan Error' then 'Scan de rolo do mesmo código'
     -- when a.PART_NO != a.COMPARISON_ID and FAILURE_DESC = 'Inapplicable Part Scan Error' then 'Scan em rolos diferentes'

     SUM(CASE WHEN FAILURE_DESC = 'Inapplicable Part Scan Error' AND COMPARISON_ID != PART_NO THEN 1 ELSE 0 END) AS Scan_diferente,
     SUM(CASE WHEN FAILURE_DESC = 'Inapplicable Part Scan Error' AND COMPARISON_ID = PART_NO THEN 1 ELSE 0 END) AS Scan_igual
  --   SUM(CASE WHEN FAILURE_DESC NOT IN ('Inapplicable Part Scan Error', 'Unmatched Old New Part Scan', 'Unused Part Scan Error','Cancel Button on Scanner') THEN 1 ELSE 0 END) AS 'Divergência'
  FROM mydb.transaction1 a
  WHERE
     REPLACE(DATE_FORMAT(WORK_YMD, '%Y-%m-%d'), '00:00:00', '') = ?
     AND COMPARISON_ID <> '-' AND FAILURE_DESC <> 'Cancel Button on Scanner'
  GROUP BY LINE

  UNION ALL

  SELECT
    'Total', '',
     SUM(1T) AS '1T', SUM(2T) AS '2T', SUM(3T) AS '3T',
     SUM(Scan_diferente) AS 'Scan em rolos diferentes',
     SUM(Scan_igual) AS 'Scan de rolo do mesmo código'
  FROM (
     SELECT
         REPLACE(DATE_FORMAT(WORK_YMD, '%Y-%m-%d'), '00:00:00', '') AS data,
         CASE WHEN REPLACE(a.Line, '_', '') = 'SST' THEN 'Pre Setup'
         ELSE REPLACE(a.Line, '_', '')
         END AS LINE,
         SUM(CASE WHEN Turno = '1T' AND failure_desc NOT IN ('Cancel Button on Scanner', 'Unmatched Old New Part Scan', 'Unused Part Scan Error', 'Inapplicable Substitute Part Scan Error') THEN 1 ELSE 0 END) AS '1T',
         SUM(CASE WHEN Turno = '2T' AND failure_desc NOT IN ('Cancel Button on Scanner', 'Unmatched Old New Part Scan', 'Unused Part Scan Error', 'Inapplicable Substitute Part Scan Error') THEN 1 ELSE 0 END) AS '2T',
         SUM(CASE WHEN Turno = '3T' AND failure_desc NOT IN ('Cancel Button on Scanner', 'Unmatched Old New Part Scan', 'Unused Part Scan Error', 'Inapplicable Substitute Part Scan Error') THEN 1 ELSE 0 END) AS '3T',

         -- WHEN a.PART_NO = a.COMPARISON_ID and FAILURE_DESC = 'Inapplicable Part Scan Error' then 'Scan de rolo do mesmo código'
         -- when a.PART_NO != a.COMPARISON_ID and FAILURE_DESC = 'Inapplicable Part Scan Error' then 'Scan em rolos diferentes'

         SUM(CASE WHEN FAILURE_DESC = 'Inapplicable Part Scan Error' AND COMPARISON_ID != PART_NO THEN 1 ELSE 0 END) AS Scan_diferente,
         SUM(CASE WHEN FAILURE_DESC = 'Inapplicable Part Scan Error' AND COMPARISON_ID = PART_NO THEN 1 ELSE 0 END) AS Scan_igual
     --   SUM(CASE WHEN FAILURE_DESC NOT IN ('Inaplicable Part Scan Error', 'Unmatched Old New Part Scan', 'Unused Part Scan Error','Cancel Button on Scanner') THEN 1 ELSE 0 END) AS 'Divergência'
     FROM mydb.transaction1 a
     WHERE
         REPLACE(DATE_FORMAT(WORK_YMD, '%Y-%m-%d'), '00:00:00', '') = curdate()
         AND COMPARISON_ID <> '-' AND FAILURE_DESC <> 'Cancel Button on Scanner'
     GROUP BY LINE
  ) a
  ) a`

     db.query(mysql, [date], (err, result) => {
       if (err) {
         console.log(err);
       } else {
         res.json(result);
       }
     });
   });

   router.get("/SplicingDefectLineQTY", (req, res) => {
    const {date} = req.query;

     let mysql =  `select  * from (SELECT
      REPLACE(DATE_FORMAT(WORK_YMD, '%Y-%m-%d'), '00:00:00', '') AS data,
      CASE WHEN REPLACE(a.Line, '_', '') = 'SST' THEN 'Pre Setup'
      ELSE REPLACE(a.Line, '_', '')
      END AS LINE,
      SUM(CASE WHEN Turno = '1T' AND failure_desc NOT IN ('Cancel Button on Scanner', 'Unmatched Old New Part Scan', 'Unused Part Scan Error', 'Inapplicable Substitute Part Scan Error') THEN 1 ELSE 0 END) AS 'primT',
      SUM(CASE WHEN Turno = '2T' AND failure_desc NOT IN ('Cancel Button on Scanner', 'Unmatched Old New Part Scan', 'Unused Part Scan Error', 'Inapplicable Substitute Part Scan Error') THEN 1 ELSE 0 END) AS 'secT',
      SUM(CASE WHEN Turno = '3T' AND failure_desc NOT IN ('Cancel Button on Scanner', 'Unmatched Old New Part Scan', 'Unused Part Scan Error', 'Inapplicable Substitute Part Scan Error') THEN 1 ELSE 0 END) AS 'tercT',

      -- WHEN a.PART_NO = a.COMPARISON_ID and FAILURE_DESC = 'Inapplicable Part Scan Error' then 'Scan de rolo do mesmo código'
      -- when a.PART_NO != a.COMPARISON_ID and FAILURE_DESC = 'Inapplicable Part Scan Error' then 'Scan em rolos diferentes'

      SUM(CASE WHEN FAILURE_DESC = 'Inapplicable Part Scan Error' AND COMPARISON_ID != PART_NO THEN 1 ELSE 0 END) AS Scan_diferente,
      SUM(CASE WHEN FAILURE_DESC = 'Inapplicable Part Scan Error' AND COMPARISON_ID = PART_NO THEN 1 ELSE 0 END) AS Scan_igual
  --   SUM(CASE WHEN FAILURE_DESC NOT IN ('Inapplicable Part Scan Error', 'Unmatched Old New Part Scan', 'Unused Part Scan Error','Cancel Button on Scanner') THEN 1 ELSE 0 END) AS 'Divergência'
  FROM mydb.transaction1 a
  WHERE
      REPLACE(DATE_FORMAT(WORK_YMD, '%Y-%m-%d'), '00:00:00', '') = curdate()
      AND COMPARISON_ID <> '-' AND FAILURE_DESC <> 'Cancel Button on Scanner'
  GROUP BY LINE order by line) a;`

     db.query(mysql, [date], (err, result) => {
       if (err) {
         console.log(err);
       } else {
         res.json(result);
       }
     });
   });

module.exports = router;
