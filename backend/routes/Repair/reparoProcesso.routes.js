const express = require("express");
const router = express.Router();
const db = require("../../config/db");
const { authorizeScreen } = require("../../auth/middleware");
const requireScreen = authorizeScreen('RepairProcess');

//----------------------------Reparo Diagnostico--------------------------------------------------------

router.post("/ReparoProcess", requireScreen, async (req, res) => {
  try {
    let resultVerifyProcess = await verifyProcess(req.body);
    res.send(resultVerifyProcess);
  } catch (e) {
    res.send(e);
  }
});

//-pesquisa CN recebimento
const checkCNInReparoEnt = (cn) => {
  return new Promise((resolve, reject) => {
    const query = "SELECT COUNT(*) AS COUNT FROM mydb.reparo_entrada WHERE CN_rep = ?;";

    db.query(query, [cn], (err, result) => {
      if (!err) {
        resolve(result[0].COUNT > 0);
      } else {
        reject("Erro ao verificar CN na tabela reparo_rep: " + err);
      }
    });
  });
};

//---pesquisa id fk
const getIdFromReparoEnt = (cn) => {
  return new Promise((resolve, reject) => {
    const query = "SELECT id FROM mydb.reparo_entrada WHERE CN_rep = ? order by id desc;";

    db.query(query, [cn], (err, result) => {
      if (!err) {
        if (result.length > 0) {
          resolve(result[0].id);
        } else {
          reject("ID não encontrado para a CN informada na tabela Entrada de placas de reparo.");
        }
      } else {
        reject("Erro ao buscar ID na tabela de entrada de reparo: " + err);
      }
    });
  });
};

const verifyProcess = (array) => {
  return new Promise((resolve, reject) => {
    try {
      const checkReparoEntrada = async (item) => {
        try {
          const reparoEntradaId = await getIdFromReparoEnt(item.CN_processo);

          if (reparoEntradaId) {
            // Agora você pode utilizar reparoEntradaId para inserir na foreign key
            db.query(
              `INSERT INTO mydb.reparo_process (Tipo,Tecnico, Bancada, Defeito, Status, Detalhes,
                Location, Troca_Comp, CN_processo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
              [
                item.Tipo,
                item.Tecnico,
                item.Bancada,
                item.Defeito,
                item.Status,
                item.Detalhes,
                item.Location,
                item.Troca_Comp,
                item.CN_processo,
              ],
              (err, res) => {
                if (err) {
                  console.log("Erro ao salvar dados na tela de Recebimento de Reparo: " + err);
                  reject({
                    success: false,
                    msg: "Erro ao salvar dados na tela de Recebimento de Reparo.",
                  });
                } else {
                  console.log("Salvou as informações na tela de Diagnóstico de Reparo: " + res);
                  resolve({
                    success: true,
                    msg: "Diagnóstico no Reparo - Salvo com Sucesso" + item.CN_processo,
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

router.get("/getReparoProcess", requireScreen, (req, res) => {
  let mysql = "select *, date_format(Data, '%y-%m-%d %Hh:%i') as Data from mydb.reparo_process order by id desc limit 1000;"
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

module.exports = router;
