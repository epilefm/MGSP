const express = require("express");
const router = express.Router();
const db = require("../../../config/db");
const { authorizeScreen } = require("../../../auth/middleware");
const requireScreen = authorizeScreen(['SplicingScreen', 'OfflineSplicing', 'Splicing_history', 'Splicing_ops', 'Switch_splice']);

////---------------------------------Comparacao Reel id -------------------------
router.post("/SplicingOffline", requireScreen, (req, res) => {
  const data = req.body;

  let mysql =
    `INSERT INTO mydb.compare_reel (Operador, Modelo, Linha, Reel_ID,
    Barcode, Codigo, Qty, Status_barcode, Status_codigo, Qty_Splicing)
    VALUES ?`;

  const values = data.map(item => [
    item.operator,
    item.model,
    item.line,
    item.reelId,            // Alinhar com front-end
    item.barcode,
    item.codigo,            // Alinhar com front-end (anteriormente `codigoAtual`)
    item.qtySplicing,       // Alinhar com front-end (anteriormente `ultimos6`)
    item.barcodeStatus,
    item.codigoStatus,
    item.totalQtySplicing   // Alinhar com front-end (anteriormente `somaUltimosDigitos`)
  ]);

  db.query(mysql, [values], (err, result) => {
    if (err) {
      console.log(
        "Erro na entrada de dados do Splicing Offline: " + err + " ---- " + result
      );
      res.status(500).send("Erro ao salvar dados.");
    } else {
      console.log("Dados inseridos com sucesso no Splicing Offline " + result);
      res.status(200).send("Dados salvos com sucesso.");
    }
  });
});

router.get("/getSplicingOffline", requireScreen, (req, res) => {
  let mysql =
    `SELECT id, date_format(t1.Data, '%Y-%m-%d %H:%i:%s') as Data, t1.operador, t1.Modelo,
t1.Linha, t1.Reel_ID, t1.Codigo, t1.Qty, t1.Barcode, t1.Status_barcode, t1.Status_codigo, t1.Qty_Splicing
FROM compare_reel t1
INNER JOIN (
    SELECT MAX(id) AS max_id, DATE_FORMAT(Data, '%Y-%m-%d %H-%i-%s') AS Data
    FROM compare_reel
    GROUP BY Data
) t2 ON t1.id = t2.max_id order by id desc;`;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

router.get("/getModalOffSplicing", requireScreen, (req, res) => {
  const Barcode = req.query.Barcode;
  // Modify your SQL query to filter by CN
  let mysql = `SELECT date_format(t1.Data, '%Y-%m-%d %H:%i:%s') as Data,
t1.Operador, t1.Modelo, t1.Linha, t1.Reel_ID as 'Reel ID', t1.Codigo, t1.Qty,
t1.Barcode, t1.Status_barcode as 'Status Barcode', t1.Status_codigo as 'Status Codigo',
t1.Qty_Splicing as 'Qty Splicing'
FROM compare_reel t1
JOIN compare_reel t2 ON date_format(t1.Data, '%Y-%m-%d %H:%i:%s') = date_format(t2.Data, '%Y-%m-%d %H:%i:%s') AND t1.id != t2.id
 WHERE t1.Barcode and t2.barcode = '${Barcode}'
GROUP BY t1.id; `;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  }); //console.log(req.query.cnProcess)
});

//--------------------------------
router.get("/Splicing", requireScreen, (req, res) => {
  const {data, turno} = req.query;

   let mysql = `SELECT Linha, replace(date_format(WORK_YMD, '%Y-%m-%d'), '00:00:00','') as data,
   sum(case when Turno = '1T' then QTY else 0 end) as '1T',
   sum(case when Turno = '2T' then QTY else 0 end) as '2T',
   sum(case when Turno = '3T' then QTY else 0 end) as '3T'
   FROM mydb.splicing_history
    WHERE replace(date_format(WORK_YMD, '%Y-%m-%d'), '00:00:00','') = ?`;

   // Adicionar filtro de turno se não for "Todos"
   if (turno && turno !== 'Todos') {
     mysql += ` AND Turno = ?`;
     mysql += ` group by linha;`;
     db.query(mysql, [data, turno], (err, result) => {
       if (err) {
         console.log(err);
       } else {
         res.json(result);
       }
     });
   } else {
     mysql += ` group by linha;`;
     db.query(mysql, [data], (err, result) => {
       if (err) {
         console.log(err);
       } else {
         res.json(result);
       }
     });
   }
 });

router.get("/SplicingOpss", requireScreen, (req, res) => {
  const {data, turno} = req.query;

   let mysql = `SELECT *, replace(date_format(WORK_YMD, '%Y-%m-%d'), '00:00:00','') as data
   FROM mydb.splicing_opss
    WHERE replace(date_format(WORK_YMD, '%Y-%m-%d'), '00:00:00','') = ?`;

   // Adicionar filtro de turno se não for "todos"
   if (turno && turno !== 'todos') {
     mysql += ` AND turno = ?`;
     mysql += ` order by turno, operator_name;`;
     db.query(mysql, [data, turno], (err, result) => {
       if (err) {
         console.log(err);
       } else {
         res.json(result);
       }
     });
   } else {
     mysql += ` order by turno, operator_name;`;
     db.query(mysql, [data], (err, result) => {
       if (err) {
         console.log(err);
       } else {
         res.json(result);
       }
     });
   }
 });

  router.get("/SplicingOpssMaior", requireScreen, (req, res) => {
   const {data} = req.query;

    let mysql = `SELECT OPERATOR_NAME, turno, linha, replace(date_format(WORK_YMD, '%Y-%m-%d'), '00:00:00','') as data, sum(qty) as qty
    FROM mydb.splicing_opss
     WHERE replace(date_format(WORK_YMD, '%Y-%m-%d'), '00:00:00','') = ? group by OPERATOR_NAME, turno order by qty desc;`;

    db.query(mysql, [data], (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.json(result);
      }
    });
  });


  router.get("/SplicingComparison", requireScreen, (req, res) => {
   const {data} = req.query;

    let mysql = ` select DATE_FORMAT(WORK_YMD, '%Y-%m-%d %H:%i:%s') as data, turno, OPERATOR_NAME, Linha, Qty, COMPARISON_ID, PAC_PART_NO,
    case when
    COMPARISON_ID = PAC_PART_NO then 'OK' else 'NG' end as Status
    from splicing_comparison WHERE DATE_FORMAT(WORK_YMD, '%Y-%m-%d') = ? order by linha, turno, operator_name;`;

    db.query(mysql, [data], (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.json(result);
      }
    });
  });


  router.get("/SplicingDMF", requireScreen, (req, res) => {
    const {data} = req.query;

     let mysql = `SELECT * FROM (
      SELECT SUBSTR(WORK_YMD, 1,10) WORK_YMD, Linha LINE_NM,  Module MODULE, Turno SHIFT,
      date_format(Work_YMD, '%Y-%m-%d %H:%i:%s') TIME_ON , OPERATOR_NAME, PAC_PART_NO, COMPARISON_ID, '-' FAILURE_DESC FROM splicing_dmf1 UNION ALL
      SELECT SUBSTR(WORK_YMD, 1,10) WORK_YMD, LINE LINE_NM,  MODULE, Turno SHIFT, WORK_YMD TIME_ON, OPERATOR_NAME, PART_NO PAC_PART_NO, COMPARISON_ID, FAILURE_DESC FROM transaction_dmf) A
      WHERE WORK_YMD = ? ORDER BY WORK_YMD, TIME_ON`;

     db.query(mysql, [data], (err, result) => {
       if (err) {
         console.log(err);
       } else {
         res.json(result);
       }
     });
   });
  // http://105.103.39.102:80/SplicingDMF?data=${date}

module.exports = router;
