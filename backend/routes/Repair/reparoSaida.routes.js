const express = require("express");
const router = express.Router();
const db = require("../../config/db");
const { authorizeScreen } = require("../../auth/middleware");
const requireScreen = authorizeScreen('RepairSaida');

//----------------------------Reparo Saida--------------------------------------------------------

router.post("/ReparoSaida", requireScreen, async (req, res) => {
  try {
    let resultVerifysaida = await verifysaida(req.body);
    res.send(resultVerifysaida);
  } catch (e) {
    res.send(e);
  }
});

//-pesquisa CN Tecnico
const checkCNInReparoPro = (cn) => {
  return new Promise((resolve, reject) => {
    const query = "SELECT COUNT(*) AS COUNT FROM mydb.reparo_process WHERE CN_processo = ?;";

    db.query(query, [cn], (err, result) => {
      if (!err) {
        resolve(result[0].COUNT > 0);
      } else {
        reject("Erro ao verificar CN na tabela reparo_process: " + err);
      }
    });
  });
};

const getIdFromReparoAuxProcess = (cn) => {
  return new Promise((resolve, reject) => {
    const query = `
    select max(id) as id from(
    select id from reparo_process where CN_processo != ? and Status != 'NG') a;`;

    db.query(query, [cn], (err, result) => {
      if (!err) {

          resolve(result[0].id);
      } else {
        reject("Erro ao buscar ID na tabela reparo_process: " + err);
      }
    });
  });cn
};

const verifysaida = (array) => {
  return new Promise((resolve, reject) => {
    try {

      const checkReparoSaida = async (item) => {
       try {
          // Check if the CN exists in the reparo_process table
          const exists = await checkCNInReparoPro(item.CN_saida);

          if (exists) {
            // Get the ID from the reparo_aux_process table
            const reparoEntradaId = await getIdFromReparoAuxProcess(item.CN_saida);

            // Insert the data into the reparo_saida table
            const query =
              `INSERT INTO mydb.reparo_saida
              (Saida, Linha_saida, Resp_saida, Receb_saida, CN_saida, Saida_Processo, id_fk)
              VALUES (?,?,?,?,?,?,?);`;

            db.query(
              query,
              [
                item.Saida,
                item.Linha_saida,
                item.Resp_saida,
                item.Receb_saida,
                item.CN_saida,
                item.Saida_Processo,
                reparoEntradaId,
              ],
              (err, res) => {
                if (err) {
                  console.log("Erro ao salvar dados na tela de Reparo de Saída: " + err);
                  reject({
                    success: false,
                    msg: "Erro ao salvar dados na tela de Reparo de Saída.",
                  });
                } else {
                  console.log("Salvou as informações na tela de Reparo de Saída: " + res);
                  resolve({
                    success: true,
                    msg: "Saída de Reparo - Salvo com Sucesso",
                  });
                }
              }
            );
          } else {
            throw new Error("CN não existe na tabela reparo_process");
          }
        } catch (error) {
          reject({
            success: false,
            msg: error,
          });  //console.log(error)
        }
      };

      array.forEach((item) => {
        checkReparoSaida(item);
      });
    } catch (err) {
      console.log(err);
    }
  });
};

// As funções checkCNInReparoProcess e checkCNInReparoAuxiliar permanecem como mencionado anteriormente
router.get("/getReparoSaida", requireScreen, (req, res) => {
  let mysql =
    "select *, date_format(Data_saida, '%y-%m-%d %Hh:%i') as Data_saida from mydb.reparo_saida order by id desc limit 1000;";
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

module.exports = router;
