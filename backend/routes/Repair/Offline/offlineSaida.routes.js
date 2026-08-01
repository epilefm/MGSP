const express = require("express");
const router = express.Router();
const db = require("../../../config/db");

//------------------------------------------------------------------------------------------------------------------
//--------------------- Reparo + Offline ---------------------------------------------------------------------------
//-------------------- REPARO Offline ->Offline Saida<-   -------------------------------
router.post("/RegisterOfflineSaida", async (req, res) => {
  try {
    let resultVerifyOffSaida = await verifyOffSaida(req.body);
    res.send(resultVerifyOffSaida);
  } catch (e) {
    res.send(e);
  }
});

const verifyOffSaida = (array) => {
  return new Promise((resolve, reject) => {
    try {
      let query =
        "SELECT COUNT(*) AS COUNT FROM mydb.entrada WHERE Reel_ID = ?";

      array.forEach((item) => {
        let real_id = item.Reel_ID;

        db.query(query, [real_id], (err, result) => {
          if (!err) {
            if (result[0].COUNT > 0) {
              db.query(
                `INSERT INTO mydb.offline_saida (Saida, Linha_saida, Resp_saida, Receb_saida,
                Saida_Processo, CN_saidaOff) VALUES (?, ?, ?, ?, ?, ?);`,
                [
                  item.Saida,
                item.Linha_saida,
                item.Resp_saida,
                item.Receb_saida,
                item.Saida_Processo,
                item.CN_saidaOff,
                ],
                (err, res) => {
                  if (err) {
                    console.log(
                      "Erro ao salvar dados na tela de saida: " + err
                    );
                  } else {
                    console.log(
                      "Salvou as informações na tela de saida: " + res
                    );
                    resolve({
                      success: true,
                      msg: "Saída de Material - Salvo com Sucesso",
                    });
                  }
                }
              );
            } else {
              resolve({
                success: true,
                msg:
                  "Checar Entrada de Material - Não foi possivel salvar a CN " +
                  item.CN_saidaOff,
              });
            }
          } else {
            reject({
              success: true,
              msg: "ERRO, CONTATE O ADMINISTRADOR",
            });
          }
        });
      });
    } catch (err) {
      console.log(err);
    }
  });
};

router.get("/getOfflineSaida", (req, res) => {
  let mysql =
    "select *, date_format(Data_saida, '%y-%m-%d %Hh:%i') as Data_saida from mydb.offline_saida order by id desc;";
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

module.exports = router;
