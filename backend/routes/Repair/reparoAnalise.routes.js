const express = require("express");
const router = express.Router();
const db = require("../../config/db");

router.get("/getModalReparoDetalhado", (req, res) => {
  const cnProcess = req.query.cnProcess;
  // Modify your SQL query to filter by CN
  let mysql = `  SELECT A.CN_rep as 'CN',
  date_format(b.Data, '%y-%m-%d %H:%i') as 'Data',
 b.Tipo, b.Tecnico , b.Bancada, b.Troca_Comp as 'Troca de componente?', b.Location, b.Detalhes, b.Defeito, b.Status
  FROM
  #entrada esta ok
      reparo_entrada A
      left join reparo_process b on (A.cn_rep = b.CN_processo)
    left join reparo_saida c on case when c.id is not null then (b.id = c.id) end
  where b.CN_processo = '${cnProcess}'
	ORDER BY A.id DESC;`;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  }); //console.log(req.query.cnProcess)
});

//-------------------------------------------------------------------------------------
//--------------Reparo Inventário------------------------------------------------------

router.get("/getReparoInventario", (req, res) => {
  let mysql = ` select B.Linha, A.Modelo, B.good, B.scrap, B.ng,  A.Estoque,
  case when A.Estoque - (B.good+B.scrap+B.ng) < 0 then -1 * (A.Estoque - (B.good+B.scrap+B.ng)) end as pendencia, B.good+B.scrap+B.ng Total FROM
    (
    select A.Linha, A.Modelo, A.Estoque - ifnull(B.saida, 0) as Estoque from (
      select A.Linha, A.Modelo, COUNT(*) Estoque from mydb.reparo_entrada A, reparo_receb B where A.CN_rep = B.CN_recebrep group by A.Linha, A.Modelo) A left join
    (
    select A.Linha, A.Modelo, COUNT(*) saida from mydb.reparo_entrada A, reparo_saida B where A.CN_rep = B.CN_saida group by A.Linha, A.Modelo) B
    on A.Linha = B.Linha and A.Modelo = B.Modelo) A
    LEFT JOIN
    (
      SELECT A.Linha, A.Modelo, A.good + B.good good, A.scrap + B.scrap scrap, A.ng + B.ng ng
      FROM (
      SELECT A.Linha, A.Modelo, ifnull(sum(A.good), 0) good, ifnull(Sum(A.scrap), 0) scrap, ifnull(sum(A.ng), 0) ng,
      ifnull(sum(A.good), 0) + ifnull(Sum(A.scrap), 0) + ifnull(sum(A.ng), 0) Total FROM
      (
        select A.Linha, A.Modelo, B.good, C.scrap, D.NG from
        (select * from mydb.reparo_entrada) A LEFT JOIN
        (
          select A.CN_processo, IFNULL(GOOD, 0) - IFNULL(SAIDA, 0) AS good from
          (select CN_processo, count(*) AS GOOD from mydb.reparo_process WHERE Status = 'Good' group by CN_processo) A left join
          (select CN_saida, count(*) SAIDA from mydb.reparo_saida group by CN_saida) B ON A.CN_processo = B.CN_saida
            ) B ON A.CN_rep = B.CN_processo LEFT JOIN
        (
          select A.CN_processo, IFNULL(SCRAP, 0) - IFNULL(SAIDA, 0) AS scrap from
          (select CN_processo, count(*) AS SCRAP from mydb.reparo_process WHERE Status
           = 'Scrap' group by CN_processo) A left join
          (select CN_saida, count(*) SAIDA from mydb.reparo_saida group by CN_saida) B ON A.CN_processo = B.CN_saida
            ) C ON A.CN_rep = C.CN_processo LEFT JOIN
        (
          select A.CN_processo, IFNULL(NG, 0) - IFNULL(SAIDA, 0) AS ng from
          (select CN_processo, count(*) AS NG from mydb.reparo_process WHERE Status = 'NG' group by CN_processo) A left join
          (select CN_saida, count(*) SAIDA from mydb.reparo_saida group by CN_saida) B ON A.CN_processo = B.CN_saida
            ) D ON A.CN_rep = D.CN_processo
      ) A
      GROUP BY A.Modelo, A.Linha
      ) A,
      (
      SELECT A.Linha, A.Modelo, ifnull(sum(A.good), 0) good, ifnull(Sum(A.scrap), 0) scrap, ifnull(sum(A.ng), 0) ng,
      ifnull(sum(A.good), 0) + ifnull(Sum(A.scrap), 0) + ifnull(sum(A.ng), 0) Total FROM
      (
      select A.Linha, A.Modelo, B.good, C.scrap, D.NG from
      (select * from mydb.reparo_entrada) A LEFT JOIN
      (
        select A.CN_auxiliar, IFNULL(Good, 0) - IFNULL(SAIDA, 0) AS Good from
        (select CN_auxiliar, count(*) AS Good from mydb.reparo_auxiliar WHERE Status_auxiliar = 'Good' group by CN_auxiliar) A left join
        (select CN_saida, count(*) SAIDA from mydb.reparo_saida group by CN_saida) B ON A.CN_auxiliar = B.CN_saida
        ) B ON A.CN_rep = B.CN_auxiliar LEFT JOIN
      (
        select A.CN_auxiliar, IFNULL(SCRAP, 0) - IFNULL(SAIDA, 0) AS scrap from
        (select CN_auxiliar, count(*) AS SCRAP from mydb.reparo_auxiliar WHERE Status_auxiliar = 'Scrap' group by CN_auxiliar) A left join
        (select CN_saida, count(*) SAIDA from mydb.reparo_saida group by CN_saida) B ON A.CN_auxiliar = B.CN_saida
        ) C ON A.CN_rep = C.CN_auxiliar LEFT JOIN
      (
        select A.CN_auxiliar, IFNULL(NG, 0) - IFNULL(SAIDA, 0) AS NG from
        (select CN_auxiliar, count(*) AS NG from mydb.reparo_auxiliar WHERE Status_auxiliar = 'NG' group by CN_auxiliar) A left join
        (select CN_saida, count(*) SAIDA from mydb.reparo_saida group by CN_saida) B ON A.CN_auxiliar = B.CN_saida
        ) D ON A.CN_rep = D.CN_auxiliar

      ) A
      GROUP BY A.Modelo, A.Linha
      ) B
      WHERE A.Linha = B.Linha and A.Modelo = B.Modelo Group by A.Linha, A.Modelo, A.total
        ) B
        ON A.Modelo = B.Modelo

        union

        (

    select 'Total', '', sum(B.good), sum(B.scrap), sum(B.ng), sum(A.Estoque), sum(case when A.Estoque - (B.good+B.scrap+B.ng) < 0 then -1 * (A.Estoque - (B.good+B.scrap+B.ng)) end) as pendencia,
    sum(B.good)+sum(B.scrap)+sum(B.ng) total FROM
    (
    select A.Linha, A.Modelo, A.Estoque - ifnull(B.saida, 0) as Estoque from (
      select A.Linha, A.Modelo, COUNT(*) Estoque from mydb.reparo_entrada A, reparo_receb B where A.CN_rep = B.CN_recebrep group by A.Linha, A.Modelo) A left join
    (
    select A.Linha, A.Modelo, COUNT(*) saida from mydb.reparo_entrada A, reparo_saida B where A.CN_rep = B.CN_saida group by A.Linha, A.Modelo) B
    on A.Linha = B.Linha and A.Modelo = B.Modelo) A
    LEFT JOIN
    (
      SELECT A.Linha, A.Modelo, A.good + B.good good, A.scrap + B.scrap scrap, A.ng + B.ng ng
      FROM (
      SELECT A.Linha, A.Modelo, ifnull(sum(A.good), 0) good, ifnull(Sum(A.scrap), 0) scrap, ifnull(sum(A.ng), 0) ng,
      ifnull(sum(A.good), 0) + ifnull(Sum(A.scrap), 0) + ifnull(sum(A.ng), 0) Total FROM
      (
        select A.Linha, A.Modelo, B.good, C.scrap, D.NG from
        (select * from mydb.reparo_entrada) A LEFT JOIN
        (
          select A.CN_processo, IFNULL(GOOD, 0) - IFNULL(SAIDA, 0) AS good from
          (select CN_processo, count(*) AS GOOD from mydb.reparo_process WHERE Status = 'Good' group by CN_processo) A left join
          (select CN_saida, count(*) SAIDA from mydb.reparo_saida group by CN_saida) B ON A.CN_processo = B.CN_saida
            ) B ON A.CN_rep = B.CN_processo LEFT JOIN
        (
          select A.CN_processo, IFNULL(SCRAP, 0) - IFNULL(SAIDA, 0) AS scrap from
          (select CN_processo, count(*) AS SCRAP from mydb.reparo_process WHERE Status
           = 'Scrap' group by CN_processo) A left join
          (select CN_saida, count(*) SAIDA from mydb.reparo_saida group by CN_saida) B ON A.CN_processo = B.CN_saida
            ) C ON A.CN_rep = C.CN_processo LEFT JOIN
        (
          select A.CN_processo, IFNULL(NG, 0) - IFNULL(SAIDA, 0) AS ng from
          (select CN_processo, count(*) AS NG from mydb.reparo_process WHERE Status = 'NG' group by CN_processo) A left join
          (select CN_saida, count(*) SAIDA from mydb.reparo_saida group by CN_saida) B ON A.CN_processo = B.CN_saida
            ) D ON A.CN_rep = D.CN_processo
      ) A
      GROUP BY A.Modelo, A.Linha
      ) A,
      (
      SELECT A.Linha, A.Modelo, ifnull(sum(A.good), 0) good, ifnull(Sum(A.scrap), 0) scrap, ifnull(sum(A.ng), 0) ng,
      ifnull(sum(A.good), 0) + ifnull(Sum(A.scrap), 0) + ifnull(sum(A.ng), 0) Total FROM
      (
      select A.Linha, A.Modelo, B.good, C.scrap, D.NG from
      (select * from mydb.reparo_entrada) A LEFT JOIN
      (
        select A.CN_auxiliar, IFNULL(Good, 0) - IFNULL(SAIDA, 0) AS Good from
        (select CN_auxiliar, count(*) AS Good from mydb.reparo_auxiliar WHERE Status_auxiliar = 'Good' group by CN_auxiliar) A left join
        (select CN_saida, count(*) SAIDA from mydb.reparo_saida group by CN_saida) B ON A.CN_auxiliar = B.CN_saida
        ) B ON A.CN_rep = B.CN_auxiliar LEFT JOIN
      (
        select A.CN_auxiliar, IFNULL(SCRAP, 0) - IFNULL(SAIDA, 0) AS scrap from
        (select CN_auxiliar, count(*) AS SCRAP from mydb.reparo_auxiliar WHERE Status_auxiliar = 'Scrap' group by CN_auxiliar) A left join
        (select CN_saida, count(*) SAIDA from mydb.reparo_saida group by CN_saida) B ON A.CN_auxiliar = B.CN_saida
        ) C ON A.CN_rep = C.CN_auxiliar LEFT JOIN
      (
        select A.CN_auxiliar, IFNULL(NG, 0) - IFNULL(SAIDA, 0) AS NG from
        (select CN_auxiliar, count(*) AS NG from mydb.reparo_auxiliar WHERE Status_auxiliar = 'NG' group by CN_auxiliar) A left join
        (select CN_saida, count(*) SAIDA from mydb.reparo_saida group by CN_saida) B ON A.CN_auxiliar = B.CN_saida
        ) D ON A.CN_rep = D.CN_auxiliar

      ) A
      GROUP BY A.Modelo, A.Linha
      ) B
      WHERE A.Linha = B.Linha and A.Modelo = B.Modelo Group by A.Linha, A.Modelo, A.total
        ) B
        ON A.Modelo = B.Modelo
    )`;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

//-------Reparo Inventario Resultado total ultima linha--------------------------------
router.get("/getReparoInventarioTotal", (req, res) => {
  let mysql = `
  SELECT a.Modelo, a.Linha,
  SUM(IFNULL(b.QtyGood, 0)) AS 'Good',
  SUM(IFNULL(b.QtyNG, 0)) AS 'NG',
  SUM(IFNULL(b.QtyGood, 0)) + SUM(IFNULL(b.QtyNG, 0)) AS Total
FROM reparo_entrada a
LEFT JOIN
  (SELECT CN_processo,
      CASE WHEN Status = 'Good' THEN COUNT(*) ELSE 0 END AS QtyGood,
      CASE WHEN Status = 'NG'  THEN COUNT(*) ELSE 0 END AS QtyNG
  FROM (SELECT * FROM (
SELECT A.*, ROW_NUMBER() OVER(PARTITION BY CN_processo order by Data desc) RN
  FROM reparo_process A
  ) B WHERE RN = 1) m
  GROUP BY CN_processo, Status ) b ON
  a.CN_rep = b.CN_processo
where a.Linha !='Feedback' and NOT EXISTS (select * from reparo_saida C where C.CN_saida = a.CN_rep)
GROUP BY a.Modelo, a.Linha
HAVING SUM(IFNULL(b.QtyGood, 0)) > 0 OR SUM(IFNULL(b.QtyNG, 0)) > 0

union all

SELECT 'Total', '',
  SUM(IFNULL(b.QtyGood, 0)) AS 'Good',
  SUM(IFNULL(b.QtyNG, 0)) AS 'NG',
  SUM(IFNULL(b.QtyGood, 0)) + SUM(IFNULL(b.QtyNG, 0)) AS Total
FROM reparo_entrada a
LEFT JOIN
  (SELECT CN_processo,
      CASE WHEN Status = 'Good' THEN COUNT(*) ELSE 0 END AS QtyGood,
      CASE WHEN Status = 'NG'  THEN COUNT(*) ELSE 0 END AS QtyNG
  FROM (SELECT * FROM (
SELECT A.*, ROW_NUMBER() OVER(PARTITION BY CN_processo order by Data desc) RN
  FROM reparo_process A
  ) B WHERE RN = 1) m
  GROUP BY CN_processo, Status ) b ON
  a.CN_rep = b.CN_processo
where a.Linha !='Feedback' and NOT EXISTS (select * from reparo_saida C where C.CN_saida = a.CN_rep)
HAVING SUM(IFNULL(b.QtyGood, 0)) > 0 OR SUM(IFNULL(b.QtyNG, 0)) > 0
  ` ;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

//----------------ModalInventario---------
router.get("/getModalRepInventario", (req, res) => {
  const modelo = req.query.modelo;
  const linha = req.query.linha;
  const status = req.query.status;

  let statusColumn;
  switch (status) {
    case 'Good':
      statusColumn = 'Good';
      break;
    case 'NG':
      statusColumn = 'NG';
      break;
    case 'Scrap':
      statusColumn = 'Scrap';
      break;
    default:
      return res.status(400).send("Invalid status");
  }

  let mysql = `
  SELECT a.modelo, a.linha,  ${statusColumn} FROM (
Select * from (SELECT a.Modelo, a.Linha,
  (IFNULL(b.QtyGood, 0)) AS 'Good',
  (IFNULL(b.QtyNG, 0)) AS 'NG',
  (IFNULL(b.QtyScrap, 0)) AS 'Scrap'
FROM reparo_entrada a
LEFT JOIN
  (SELECT CN_processo,
      CASE WHEN Status = 'Good' THEN CN_processo ELSE 0 END AS QtyGood,
      CASE WHEN Status = 'NG'  THEN CN_processo ELSE 0 END AS QtyNG,
      CASE WHEN Status = 'Scrap'THEN CN_processo ELSE 0 END AS QtyScrap
  FROM (SELECT * FROM (
SELECT A.*, ROW_NUMBER() OVER(PARTITION BY CN_processo order by Data desc) RN
  FROM reparo_process A
  ) B WHERE RN = 1) m
  GROUP BY CN_processo, Status ) b ON
  a.CN_rep = b.CN_processo
where NOT EXISTS (select * from reparo_saida C where C.CN_saida = a.CN_rep)) a
) A where ${statusColumn} != '0' and modelo = '${modelo}' and Linha = '${linha}'
  `;
  db.query(mysql, [status, modelo, linha], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send(err);
    } else {
      res.send(result);
    }
  });
});

module.exports = router;
