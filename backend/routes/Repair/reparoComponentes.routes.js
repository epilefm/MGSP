const express = require("express");
const router = express.Router();
const db = require("../../config/db");
const { authorizeScreen } = require("../../auth/middleware");
const requireScreen = authorizeScreen('Estoque_comp');

////////////////////////////////---- Estoque de Componentes do Reparo ----------------------------------------------------------------------------------------------------------------------------------

// Endpoint para buscar sugestões de códigos de componentes
router.get("/searchComponentCodes", requireScreen, (req, res) => {
  const { searchTerm } = req.query;

  // Verificar se o termo de busca foi fornecido
  if (!searchTerm) {
    return res.status(400).json({ error: "Parâmetro 'searchTerm' é obrigatório" });
  }

  // Query para buscar códigos de componentes que correspondem ao termo de busca
  // Incluindo informação de quantidade do estoque de reparo
  const query = `
    SELECT
      p.material,
      p.price_decimal,
      p.mat_name,
      COALESCE(r.qty, 0) as qty
    FROM mydb.price_comp_convertido p
    LEFT JOIN mydb.reparo_ctrl_comp r ON p.material = r.cod_comp
    WHERE p.material LIKE ?
    GROUP BY p.material, p.price_decimal, p.mat_name, r.qty
    ORDER BY p.material
  `;

  db.query(query, [`%${searchTerm}%`], (err, results) => {
    if (err) {
      console.error("Erro ao buscar códigos de componentes: ", err);
      return res.status(500).json({ error: "Erro ao buscar códigos de componentes" });
    }

    // Garantir que results seja sempre um array
    const formattedResults = Array.isArray(results) ? results : [];

    // Sempre retornar um array, mesmo que vazio
    res.status(200).json(formattedResults.length > 0 ? formattedResults : []);
  });
});

//----------------------------Reparo Componentes Logs--------------------------------------------------------

router.get("/getReparoComponentesLogs", requireScreen, (req, res) => {
  let mysql = "SELECT * FROM mydb.reparo_componentes_log ORDER BY created_at DESC LIMIT 1000";
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send({
        success: false,
        msg: "Erro ao buscar logs de componentes"
      });
    } else {
      res.send(result);
    }
  });
});

//----------------------------Reparo Componentes Estoque--------------------------------------------------------
router.get("/getReparoCompEstoque", requireScreen, (req, res) => {
  let mysql = "select id,cod_comp,qty,valor*qty as valor,DATE_FORMAT(data, '%Y-%m-%d %H:%i:%s') as data from mydb.reparo_ctrl_comp group by cod_comp order by data desc limit 500;"
  db.query(mysql, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

//----------------------------Reparo Componentes--------------------------------------------------------

router.post("/ReparoEntradaComponentes", requireScreen, (req, res) => {
  const array = req.body;

  array.forEach(item => {
    // First, check if the component already exists
    let selectQuery = "SELECT id, qty FROM mydb.reparo_ctrl_comp WHERE cod_comp = ? ORDER BY id DESC LIMIT 1";

    db.query(selectQuery, [item.codigo], (err, result) => {
      if (err) {
        console.log('Erro ao buscar componente no controle de componentes: ' + err);
      } else {
        if (result.length > 0) {
          // Component exists, update the quantity by summing with existing quantity
          const existingQty = result[0].qty;
          const newQty = existingQty + item.quantidade;
          const updateQuery = "UPDATE mydb.reparo_ctrl_comp SET qty = ?, valor = ?, data = ? WHERE id = ?";

          db.query(updateQuery, [newQty, item.valor_componente, item.data, result[0].id], (err, updateResult) => {
            if (err) {
              console.log('Erro ao atualizar quantidade no controle de componentes: ' + err);
            } else {
              console.log('Quantidade atualizada com sucesso no controle de componentes: ' + updateResult);

              // Log the update action
              const logQuery = `INSERT INTO mydb.reparo_componentes_log
                (action_type, component_code, quantity, previous_quantity, new_quantity, unit_value, total_value, operation_description, colaborador, matricula)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
              const totalValue = item.quantidade * item.valor_componente;
              db.query(logQuery, [
                'ENTRADA',
                item.codigo,
                item.quantidade,
                existingQty,
                newQty,
                item.valor_componente,
                totalValue,
                `Entrada de componente ${item.codigo}: ${existingQty} → ${newQty}${item.colaborador ? '. Colaborador: ' + item.colaborador : ''}`,
                item.colaborador || null,
                item.matricula || null
              ], (err, logResult) => {
                if (err) {
                  console.log('Erro ao registrar log de entrada: ' + err);
                }
              });
            }
          });
        } else {
          // Component doesn't exist, insert a new row
          let insertQuery = "INSERT INTO mydb.reparo_ctrl_comp (cod_comp, qty, valor, data) VALUES (?, ?, ?, ?)";
          db.query(insertQuery, [item.codigo, item.quantidade, item.valor_componente, item.data], (err, result) => {
            if (err) {
              console.log('Erro na entrada de dados do controle de componentes: ' + err);
            } else {
              console.log('Dados inseridos com sucesso no controle de componentes: ' + result);

              // Log the insert action
              const logQuery = `INSERT INTO mydb.reparo_componentes_log
                (action_type, component_code, quantity, previous_quantity, new_quantity, unit_value, total_value, operation_description, colaborador, matricula)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
              const totalValue = item.quantidade * item.valor_componente;
              db.query(logQuery, [
                'ENTRADA',
                item.codigo,
                item.quantidade,
                0,
                item.quantidade,
                item.valor_componente,
                totalValue,
                `Entrada de novo componente ${item.codigo} no estoque: ${item.quantidade} unidades${item.colaborador ? '. Colaborador: ' + item.colaborador : ''}`,
                item.colaborador || null,
                item.matricula || null
              ], (err, logResult) => {
                if (err) {
                  console.log('Erro ao registrar log de entrada: ' + err);
                }
              });
            }
          });
        }
      }
    });
  });

  res.send({
    success: true,
    msg: "ITENS INSERIDOS"
  });
});

//----------------------------Reparo Diminui Estoque--------------------------------------------------------

router.post("/ReparoDiminuiEstoque", requireScreen, (req, res) => {
  const { cod_comp, qty } = req.body;

  // First, check if the component exists and get its current quantity
  let selectQuery = "SELECT id, qty, valor FROM mydb.reparo_ctrl_comp WHERE cod_comp = ? ORDER BY id DESC LIMIT 1";

  db.query(selectQuery, [cod_comp], (err, result) => {
    if (err) {
      console.log('Erro ao buscar componente no controle de componentes: ' + err);
      res.send({
        success: false,
        msg: "Erro ao buscar componente no estoque"
      });
    } else {
      if (result.length > 0) {
        const currentQty = result[0].qty;
        const unitValue = result[0].valor || 0;

        // Check if the requested quantity to decrease is greater than available quantity
        if (qty > currentQty) {
          res.send({
            success: false,
            msg: `Quantidade solicitada (${qty}) é maior que a quantidade disponível (${currentQty}) no estoque`
          });
          return;
        }

        const newQty = currentQty - qty;
        const totalValue = qty * unitValue;

        // Update the quantity
        let updateQuery = "UPDATE mydb.reparo_ctrl_comp SET qty = ? WHERE id = ?";
        db.query(updateQuery, [newQty, result[0].id], (err, updateResult) => {
          if (err) {
            console.log('Erro ao atualizar quantidade no controle de componentes: ' + err);
            res.send({
              success: false,
              msg: "Erro ao atualizar quantidade no estoque"
            });
          } else {
            console.log('Quantidade atualizada com sucesso no controle de componentes');

            // Log the exit action
            const logQuery = `INSERT INTO mydb.reparo_componentes_log
              (action_type, component_code, quantity, previous_quantity, new_quantity, unit_value, total_value, operation_description, colaborador, matricula)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            db.query(logQuery, [
              'SCRAP',
              cod_comp,
              qty,
              currentQty,
              newQty,
              unitValue,
              totalValue,
              `Scrap de componente ${cod_comp} do estoque: ${currentQty} → ${newQty}${req.body.colaborador ? '. Colaborador: ' + req.body.colaborador : ''}`,
              req.body.colaborador || null,
              req.body.matricula || null
            ], (err, logResult) => {
              if (err) {
                console.log('Erro ao registrar log de saída: ' + err);
              }
            });

            res.send({
              success: true,
              msg: "Quantidade atualizada com sucesso no estoque"
            });
          }
        });
      } else {
        // Component not found
        res.send({
          success: false,
          msg: "Componente não encontrado no estoque"
        });
      }
    }
  });
});

// Buscar pessoas/colaboradores por nome (autocomplete)
router.get('/searchPessoas', requireScreen, (req, res) => {
  const { searchTerm } = req.query;

  if (!searchTerm || searchTerm.length < 2) {
    return res.status(200).json([]);
  }

  const query = `SELECT id, funcionarios, matricula, turno, cargo, departamento, job_class FROM mydb.pessoas WHERE funcionarios LIKE ? ORDER BY funcionarios LIMIT 20`;

  db.query(query, [`%${searchTerm}%`], (err, results) => {
    if (err) {
      console.error("Erro ao buscar colaboradores: ", err);
      return res.status(500).json({ error: "Erro ao buscar colaboradores" });
    }

    res.status(200).json(results);
  });
});

module.exports = router;
