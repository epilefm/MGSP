const express = require("express");
const router = express.Router();
const db = require("../../config/db");

router.get("/getDescarteResumo", (req, res) => {
  const { Line } = req.query;
  const { datei } = req.query;
  const { datef } = req.query;

  let mysql = `select id, date_format(Date, '%Y%m%d') as Date,Line,Part_Number, sum(Qty_Discard) as Qty_Discard from mydb.descarte where\
   Line like '%${Line}%' and (date_format(Date, '%Y%m%d') between'${datei}' and '${datef}') group by Part_Number;`;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

router.get("/getEntra", (req, res) => {
  const { Line } = req.query;
  const { Halb } = req.query;
  const { datei } = req.query;
  const { datef } = req.query;

  let mysql = `select id, date_format(Date, '%Y-%m-%d') as Date,Line,Halb,Basic_Model,Part_Number,sum(Qty) as Qty_Entrance from mydb.entrada where Line \
  like '%${Line}%' and Halb like '%${Halb}%' and (date_format(Date, '%Y-%m-%d') between '${datei}' and '${datef}') group by Halb,Part_Number`;
  db.query(mysql, (err, result) => {

    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

router.get("/getResumo", (req, res) => {
  const { Line } = req.query;
  const { Halb } = req.query;
  const { datei } = req.query;
  const { datef } = req.query;

  let mysql = `select id, date_format(Date, '%Y%m%d') as Date,Line,Halb,Basic_Model,Part_Number, sum(Qty) as Qty_Entrance from mydb.entrada where\
   Line like '%${Line}%' and Halb like '%${Halb}%' and (date_format(Date, '%Y%m%d') between '${datei}' and '${datef}')  group by Halb,Part_Number;`;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

router.get("/getSaidaResumo", (req, res) => {
  const { Line } = req.query;
  const { Halb } = req.query;
  const { datei } = req.query;
  const { datef } = req.query;

  let mysql = `select id, date_format(Date_Output, '%Y%m%d') as Date,Line,Halb,Basic_Model,Part_Number, sum(Qty_Output) as Qty_Output from mydb.saida where\
   Line like '%${Line}%' and Halb like '%${Halb}%' and (date_format(Date_Output, '%Y%m%d') between '${datei}' and '${datef}')  group by Halb,Part_Number;`;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

router.get("/getReturnResumo", (req, res) => {
  const { Line } = req.query;
  const { Halb } = req.query;
  const { datei } = req.query;
  const { datef } = req.query;

  let mysql = `select id, date_format(Date, '%Y%m%d') as Date,Line,Halb,Basic_Model,Part_Number, sum(Qty_Return) as Qty_Return from mydb.devolucao where\
   Line like '%${Line}%' and Halb like '%${Halb}%' and (date_format(Date, '%Y%m%d') between '${datei}' and '${datef}')  group by Halb,Part_Number;`;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});


router.get("/getClasseAResumo", (req, res) => {
  const { Line } = req.query;
  const { Halb } = req.query;
  const { datei } = req.query;
  const { datef } = req.query;
  let mysql = `select id, date_format(Date, '%Y%m%d') as Date,Line,Halb,Basic_Model,Part_Number,((Output)-(Discard_Qty)) as In_Process from mydb.rastreabilidade where\
   Line like '%${Line}%' and Halb like '%${Halb}%' and (date_format(Date, '%Y%m%d') between '${datei}' and '${datef}') group by Halb,Part_Number;`;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

/*Consulta relacionada a diferença de materiais no WIP. Entrada - Saida*/
router.get("/getEstoque", (req, res) => {
  const { Line } = req.query;
  const { Halb } = req.query;
  const { datei } = req.query;
  const { datef } = req.query;

  let mysql = `  SELECT
  a.id,
	date_format(a.Date, '%Y-m%-d%),
    a.Line,
    a.Basic_Model,
    a.Halb,
    a.Part_Number,
    a.Qty AS QTY_Entrada,
    b.Qty AS QTY_Saida,
    SUM(a.Qty - b.Qty) AS Pend_to_Process
FROM
    (SELECT
      id,
        DATE_FORMAT(Date, '%Y%m%d') AS Date,
            Line,
            Basic_Model,
            Part_Number,
            Halb,
            SUM(Qty) AS Qty
    FROM
        mydb.entrada
    WHERE
        Line LIKE '%${Line}%'

            AND Halb like '%${Halb}%'
            AND (DATE_FORMAT(Date, '%Y%m%d') BETWEEN '${datei}' AND '${datef}')
    GROUP BY Basic_Model , Part_Number
    ORDER BY id DESC) a
        INNER JOIN
    (SELECT
        DATE_FORMAT(Date_Output, '%Y%m%d') AS Date,
            Line,
            Basic_Model,
            Part_Number,
            SUM(Qty_Output) AS Qty
    FROM
        mydb.saida
    WHERE
        Line LIKE '%${Line}%'

        AND Halb like '%${Halb}%'
            AND (DATE_FORMAT(Date_Output, '%Y%m%d') BETWEEN '${datei}' AND '${datef}')
    GROUP BY Basic_Model , Part_Number
    ORDER BY id DESC) b ON (a.Part_Number = b.Part_Number)
GROUP BY a.Part_Number;`;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

router.get("/getDiscardChart", (req, res) => {
  const { datei } = req.query;
  const { datef } = req.query;

  let mysql = `SELECT Line,  \
  count(Qty_Discard) AS Qty FROM mydb.descarte WHERE  \
(date_format(Date, '%Y%m%d') between '${datei}' and '${datef}') GROUP BY Line ORDER BY Qty ASC;`;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

// --------------------------Dashboard turno descarte-----------------------------------
router.get("/getPie", (req, res) => {
  let mysql = "select shift, count(id) as Qty from mydb.descarte group by shift order by id desc ;";
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
 });

module.exports = router;
