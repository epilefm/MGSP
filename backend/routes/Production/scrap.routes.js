const express = require("express");
const router = express.Router();
const db = require("../../config/db");

//--                                         SCRAP                                           --

router.post("/Scrap", (req, res) => {
  const array = req.body;

  array.forEach(item => {

    let mysql = 'INSERT INTO mydb.scrap_entrada (id, Processo, CN, Fase, Halb, Modelo, Linha, Turno, \
    Origem, Motivo, Equipamento, Causa_raiz, Corretiva, Preventiva, Operador, MK, Lider, Sup_Manut, Sup_Qualidade, Sup_Prod, PQC) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(mysql, [item.id, item.Processo, item.CN, item.Fase, item.Halb, item.Modelo, item.Linha, item.Turno, item.Origem, item.Motivo, item.Equipamento, item.Causa_raiz,
      item.Corretiva, item.Preventiva, item.Operador, item.MK, item.Lider, item.Sup_Manut, item.Sup_Qualidade, item.Sup_Prod, item.PQC], (err, res) => {

      if (err) {
        console.log('Erro na entrada de dados de scrap/washboard: ' + err);
      } else {
        console.log('Dados inseridos com sucesso no scrap/washboard: ' + res);

      }
    });
  });
});


router.get("/getScrap", (req, res) => {
  let mysql = "SELECT *, SUBSTR(Data, 1, 10) as Data, SUBSTR(Data, 11, 19) as Hour FROM mydb.scrap_entrada order by id desc;";
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

//----------------------------Scrap Recebimento--------------------------------------------------------

router.get("/getScrapRecebim", (req, res) => {
  let mysql = "select *, date_format(Data, '%y-%m-%d %Hh:%i') as Data from mydb.scrap_receb order by id desc;"
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

router.post('/ScrapReceb', async (req, res) => {
  try {
    let result = await verifyScrap(req.body.CN_receb);
    if (result.success) {
      let resultInserir1 = await inserirScrap(req.body)
      res.json(resultInserir1)
    }
  } catch (e) {
    res.json({
      success: false,
      msg: e.msg
    })
  }
})

const inserirScrap = (data) => {
  return new Promise((resolve, reject) => {

    const {
      id, Recebimento, Responsavel, CN_receb
    } = data

    let query = `INSERT INTO mydb.scrap_receb (id, Recebimento, Responsavel, CN_receb) VALUES (?,?,?,?);`;

    db.query(query, [id, Recebimento, Responsavel, CN_receb
    ], (err, result) => {
      if (!err) {
        resolve({
          success: true,
          msg: "SUCCESS REGISTER - CN REGISTRADA"
        })
      } else {
        reject({
          success: false,
          msg: "ERRO, CONTATE O ADMINISTRADOR - query"
        })
      }
    })
  })
}

const verifyScrap = (CN_SCRAP) => {
  return new Promise((resolve, reject) => {

    let query = `SELECT
  COUNT(*) AS count
      FROM
  mydb.scrap_entrada
      WHERE
  CN = ?;`;

    db.query(query, [
      CN_SCRAP
    ], (err, result) => {
      if (!err) {
        if (result[0].count > 0) {
          resolve({
            success: true
          })
        } else {
          reject({
            success: false,
            msg: "FALHA DE INPUT -  CN NÃO CADASTRADA NO INPUT DE ENTRADA DE SCRAP"
          })
        }
      } else {
        reject({
          success: false,
          msg: "ERRO, CONTATE O ADMINISTRADOR - verify"
        })
      }
    })
  })
}

router.get("/getScrapReceb", (req, res) => {
  let mysql = `SELECT
  *,
  Linha,
  Fase,
  Halb,
  Modelo,
  Fase,
  DATE_FORMAT(a.Data, '%y-%m-%d %Hh:%i') AS Data, b.Recebimento
FROM
  scrap_entrada a
      INNER JOIN
  scrap_receb b
ON
  a.CN = b.CN_receb and b.recebimento = 'scrap'
  where  b.cn_status is null order by a.id desc`;
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});


router.put("/updatescrap", (req, res)=>{
  const {cn , user1, user2} = req.body
  console.log (req.body)
  let sql = "UPDATE mydb.scrap_receb SET cn_status = 'PAGO', saida_wip = ?, entrada_prod = ? where CN_receb = ?"
  db.query(sql,[
      user1,
      user2,
      cn
  ], (err, result)=>{
    if(!err){
      res.send({"MSG" : "REPOSIÇÃO DA PCB CONCLUIDA"})
    }else{
      res.send({"MSG" : "ERRO"})
    }
  })
})


//----------------------------Placa Saida--------------------------------------------------------

router.post('/scrapSaida', async (req, res) => {
  console.log(req.body)
  try {
    let result = await verifyScrap2(req.body.CN_saida);
    if (result.success) {
      let resultadoInserir = await inserirScrap2(req.body)
      res.json(resultadoInserir)
    }
  } catch (e) {
    res.json({
      success: false,
      msg: e.msg
    })
  }
})

const inserirScrap2 = (data) => {
  return new Promise((resolve, reject) => {

    const {
      id,
    Saida,
    Linha,
    Responsavel,
    Recebedor,
    Processo,
    CN_saida,

    } = data

    let query = `INSERT INTO mydb.scrap_saida (
      id, Saida,
      Linha,
      Responsavel,
      Recebedor,
      Processo,
      CN_saida)
    VALUES (?,?,?,?,?,?,?)`;

    db.query(query, [
      id, Saida,
      Linha,
      Responsavel,
      Recebedor,
      Processo,
      CN_saida
    ], (err, result) => {
      if (!err) {
        resolve({
          success: true,
          msg: "REGISTER SUCCESS - CN REGISTRADA"
        })
      } else {
        reject({
          success: false,
          msg: "ERRO, CONTATE O ADMINISTRADOR - query"
        })
      }
    })
  })
}

const verifyScrap2 = (CN_saida) => {
  return new Promise((resolve, reject) => {

    let query = `SELECT
    COUNT(*) AS count
        FROM
    mydb.scrap_receb
        WHERE
        CN_receb = ?;`;


        db.query(query, [
          CN_saida
        ], (err, result) => {
          if (!err) {
            if (result[0].count > 0) {
              resolve({
                success: true
              })
            } else {
              reject({
                success: false,
                msg: "FALHA DE INPUT -  CN NÃO CADASTRADA NO INPUT DE RECEBIMENTO DE SCRAP "
              })
            }
          } else {
            reject({
              success: false,
              msg: "ERRO, CONTATE O ADMINISTRADOR - verify"
            })
          }

    })
  })
}

router.get("/getScrapSaida", (req, res) => {
  let mysql = "select *, date_format(Data_saida, '%y-%m-%d %Hh:%i') as Data_saida from mydb.scrap_saida order by id desc;"
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

module.exports = router;
