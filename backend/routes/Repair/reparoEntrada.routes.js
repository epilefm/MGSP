const express = require("express");
const router = express.Router();
const db = require("../../config/db");
const { authorizeScreen } = require("../../auth/middleware");
const requireScreen = authorizeScreen('RepairScreen');

//---------------------------------------------------------------------------------------------
//--                                      Reparo_Entrada                                     --

router.post("/ReparoEnt", requireScreen, async (req, res) => {
  try {
    let resultVerifyRep = await verifyRep(req.body);
    res.send(resultVerifyRep);
  } catch (e) {
    res.send(e);
  }
});

const getIdFromReparoEntrada = (cn) => {
  return new Promise((resolve, reject) => {
    const query = `select max(id) as id from (
      SELECT id FROM mydb.reparo_entrada WHERE CN_rep != ?) a order by id desc;`

    db.query(query, [cn], (err, result) => {
      if (!err) {
        if (result.length > 0) {
          resolve(result[0].id);
        } else {
          reject("ID não encontrado para a CN informada na tabela reparo_entrada.");
        }
      } else {
        reject("Erro ao buscar ID na tabela reparo_entrada: " + err);
      }
    });
  });
};

const verifyRep = (array) => {
  return new Promise((resolve, reject) => {
    try {
      const checkReparoEntrada = async (item) => {
        try {
          const reparoEntradaId = await getIdFromReparoEntrada(item.CN_rep);

          if (reparoEntradaId) {
            // Agora você pode utilizar reparoEntradaId para inserir na foreign key
            db.query(
              `INSERT INTO mydb.reparo_entrada (id, Data, Halb, Modelo, Linha, Turno, Responsavel, Processo,
                Fase, Origem_SMD, Causa, Sintoma, Origem_Main, Recebimento, Detalhe, Location, CN_rep, Data_Feedback )
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);`,
                [
                  item.id,
                  item.Data,
                  item.Halb,
                  item.Modelo,
                  item.Linha,
                  item.Turno,
                  item.Responsavel,
                  item.Processo,
                  item.Fase,
                  item.Origem_SMD,
                  item.Causa,
                  item.Sintoma,
                  item.Origem_Main,
                  item.Recebimento,
                  item.Detalhe,
                  item.Location,
                  item.CN_rep,
                  item.Data_Feedback,
                ],

              (err, res) => {
                if (err) {
                  console.log("Erro ao salvar dados na tela de Entrada de placa no Reparo: " + err);
                  reject({
                    success: false,
                    msg: "Erro ao salvar dados na tela de Entrada de placa no Reparo.",
                  });
                } else {
                  console.log("Salvou as informações na tela de Entrada de placa no Reparo: " + res);
                  resolve({
                    success: true,
                    msg: "Entrada de placa no Reparo - Salvo com Sucesso" + item.CN_rep,
                  });
                }
              }
            );
          } else {
            reject({
              success: false,
              msg: "",
            });
          }
        } catch (error) {
          reject({
            success: false,
            msg: error,
          });
        }
      };

      array.forEach((item) => {
        // Adicione lógica adicional se necessário antes de chamar checkReparoEntrada
        checkReparoEntrada(item);
      });
    } catch (err) {
      console.log(err);
    }
  });
};

router.get("/getReparo", requireScreen, (req, res) => {
  let mysql =
    "select *, date_format(Data, '%y-%m-%d %Hh:%i') as Data from mydb.reparo_entrada order by id desc limit 1000;";
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

module.exports = router;
