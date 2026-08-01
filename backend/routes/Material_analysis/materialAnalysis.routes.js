const express = require("express");
const router = express.Router();
const db = require("../../config/db");

// nao ta usando-----------------------------------------------------
/*Consulta relacionada a diferença de materiais no processo. Entrada - Saida*/
/*Consulta relacionada a diferença de materiais no processo. Pagamento, Saida, Retorno, Descarte*/
router.get("/getProcesso", (req, res) => {
  const { Line } = req.query;
  const { Halb } = req.query;
  const { datei } = req.query;
  const { datef } = req.query;

  let mysql = `
  SELECT
  a.id,
  a.Date,
  a.Line,
  a.Basic_Model,
  a.Halb,
  a.Part_Number,
  a.PO,
  coalesce((a.Qty_Entrada),0) AS QTY_Entrada,
  coalesce((b.Qty_Saida),0) AS QTY_Saida,
  (coalesce(a.Qty_Entrada,0) - coalesce(b.Qty_Saida,0)) + coalesce(c.Qty_Return,0) AS Estoque_Wip,
  coalesce((c.Qty_Return),0) AS QTY_Return,
  coalesce((d.Qty_Discard),0) AS QTY_Discard,
  coalesce((b.Qty_Saida - a.Qty_Entrada),0) AS Pend_to_Process,
  (coalesce(d.Qty_Discard,0) - coalesce(b.Qty_Saida,0)) + coalesce(c.Qty_Return,0) AS Remain_in_Process
FROM
(SELECT
  id, PO,
    DATE_FORMAT(Date, '%Y%m%d') AS Date,
        Line,
        Basic_Model,
        Part_Number,
        Halb,
        coalesce(sum(Qty),0) AS Qty_Entrada
FROM
    mydb.entrada
WHERE
   Line like '%${Line}%'
  AND Halb like '%${Halb}%'
        AND (DATE_FORMAT(Date, '%Y%m%d') BETWEEN '${datei}' AND '${datef}')
GROUP BY Basic_Model , Part_Number
ORDER BY id DESC) a
    left JOIN
(SELECT
    DATE_FORMAT(Date_Output, '%Y%m%d') AS Date,
        Line,
        Halb,
        Basic_Model,
        Part_Number,
        coalesce(sum(Qty_Output),0) AS Qty_Saida
FROM
    mydb.saida
WHERE
    Line like '%${Line}%'
  AND Halb like '%${Halb}%'
        AND (DATE_FORMAT(Date_Output, '%Y%m%d') BETWEEN '${datei}' AND '${datef}')
GROUP BY Basic_Model , Part_Number
ORDER BY id DESC) b ON (a.Part_Number = b.Part_Number)
Left JOIN
  (SELECT
      DATE_FORMAT(Date, '%Y%m%d') AS Date,
          Line,
          Basic_Model,
          Halb,
          Part_Number,
          coalesce(sum(Qty_Return),0) AS Qty_Return
  FROM
      mydb.devolucao
  WHERE
  Line like '%${Line}%'
  AND Halb like '%${Halb}%'
          AND (DATE_FORMAT(Date, '%Y%m%d') BETWEEN '${datei}' AND '${datef}')
  GROUP BY Basic_Model , Part_Number
  ORDER BY id DESC) c ON (b.Part_Number = c.Part_Number)
  Left JOIN
  (SELECT
      DATE_FORMAT(Date, '%Y%m%d') AS Date,
          Line,
          Basic_Model,
          Halb,
          Part_Number,
         coalesce(sum(Qty_Discard),0) AS Qty_Discard
  FROM
      mydb.descarte
  WHERE
 Line like '%${Line}%'
  AND Halb like '%${Halb}%'
          AND (DATE_FORMAT(Date, '%Y%m%d') BETWEEN '${datei}' AND '${datef}')
  GROUP BY Halb, Part_Number
  ORDER BY id DESC) d ON (b.Part_Number = d.Part_Number)
GROUP BY a.Part_Number;`;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

module.exports = router;
