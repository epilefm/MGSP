const express = require("express");
const router = express.Router();
const db = require("../../../config/db");

router.get("/BadHead", (req, res) => {
  let mysql = `
  select Linha, Equipamento,
case when Equipamento = 'NPM-1' and TBL = '1' then '1'
	 when Equipamento = 'NPM-1' and TBL = '2' then '2'
	 when Equipamento = 'NPM-2' and TBL = '1' then '3'
     when Equipamento = 'NPM-2' and TBL = '2' then '4'
     when Equipamento = 'NPM-3' and TBL = '1' then '5'
     when Equipamento = 'NPM-3' and TBL = '2' then '6'
     when Equipamento = 'NPM-4' and TBL = '1' then '7'
     when Equipamento = 'NPM-4' and TBL = '2' then '8'
     when Equipamento = 'NPM-5' and TBL = '1' then '9'
     when Equipamento = 'NPM-5' and TBL = '2' then '10'
	 when Equipamento = 'NPM-6' and TBL = '1' then '11'
     when Equipamento = 'NPM-6' and TBL = '2' then '12'
	 when Equipamento = 'NPM-7' and TBL = '1' then '13'
     when Equipamento = 'NPM-7' and TBL = '2' then '14'
     when Equipamento = 'NPM-8' and TBL = '1' then '15'
     when Equipamento = 'NPM-8' and TBL = '2' then '16'
     when Equipamento = 'NPM-9' and TBL = '1' then '17'
     when Equipamento = 'NPM-9' and TBL = '2' then '18'
else TBL end as TBL,
Head, Status,
  DATE_FORMAT(SUBSTR(Periodo, 1, 8), '%Y/%m/%d') AS Data,
  DATE_FORMAT(SUBSTR(Periodo, 1, 14), '%H:%i:%s') AS Hora,
  SUBSTR(TIMEDIFF(NOW(), Periodo), 1, 8) AS Tempo
 from bad_head order by linha, Equipamento asc;
  `;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send(err);
    } else {
      res.send(result);
    }
  });
});

router.get("/BadHead_graf1", (req, res) => {
  let mysql = `
SELECT a.Linha,
  COUNT(b.linha) AS Total_Defeitos,
  concat(round((1-(COUNT(a.id) / b.qty)) * 100,2),'%') AS Eficiencia
FROM bad_head a
left JOIN (SELECT linha, SUM(head) AS qty
  FROM heads
  GROUP BY linha) b ON a.Linha = b.linha
GROUP BY a.Linha ORDER BY a.Linha ASC;
  `;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send(err);
    } else {
      res.send(result);
    }
  });
});

router.get("/BadHead_graf2", (req, res) => {
  let mysql = `
SELECT b.linha,
  concat(round((1-(COUNT(a.id) / b.qty)) * 100,2),'%') AS Eficiencia
FROM
  (SELECT linha, SUM(head) AS qty
   FROM mydb.heads
   GROUP BY linha) b
 left JOIN mydb.bad_head a ON a.linha = b.linha
GROUP BY b.linha;
  `;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send(err);
    } else {
      res.send(result);
    }
  });
});

//////////---------------Salvar Itens de BadHead
router.post("/Bad_headCom", (req, res) => {
  const { linha, equipamento, tbl, head, status, data, hora, tempo, observacao } = req.body;
  let mysql = `
  INSERT INTO bad_head_comments (Linha, Equipamento, TBL, Head, Status, Data, Hora, Tempo, Observacao)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(mysql, [linha, equipamento, tbl, head, status, data, hora, tempo, observacao], (err, result) => {
      if (err) {
          console.log(err);
          res.status(500).send(err);
      } else {
          res.send(result);
      }
  });
});

router.get("/Bad_headComm", (req, res) => {
  const { date } = req.query;

  let mysql = `
SELECT id, Linha, Equipamento, TBL, Head,
        Status, Data, Hora, Tempo, Observacao,
        Date_Format(Periodo, '%Y/%m/%d %H:%i:%s') AS Periodo
        FROM mydb.bad_head_comments order by id desc
      --  WHERE DATE(Periodo) = CURDATE();
  `;
  db.query(mysql, [date], (err, result) => {
      if (err) {
          console.log(err);
          res.status(500).send(err);
      } else {
          res.send(result);
      }
  });
});

module.exports = router;
