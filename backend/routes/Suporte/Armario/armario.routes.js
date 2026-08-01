const express = require("express");
const router = express.Router();
const db = require("../../../config/db");
const { authorizeScreen } = require("../../../auth/middleware");
const requireScreen = authorizeScreen('Armarios');

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Endpoints para armários
// Buscar todos os armários
router.get('/armarios', requireScreen, (req, res) => {
  const query = `SELECT * FROM armario_smd ORDER BY numero_armario`;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar armários: ", err);
      return res.status(500).json({ error: "Erro ao buscar armários" });
    }

    res.status(200).json(results);
  });
});

// Buscar um armário específico pelo número
router.get('/armario/:numero', requireScreen, (req, res) => {
  const { numero } = req.params;

  const query = `SELECT * FROM armario_smd WHERE numero_armario = ?`;

  db.query(query, [numero], (err, results) => {
    if (err) {
      console.error("Erro ao buscar armário: ", err);
      return res.status(500).json({ error: "Erro ao buscar armário" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Armário não encontrado" });
    }

    res.status(200).json(results[0]);
  });
});

// Criar ou atualizar um armário
router.post('/armario/:numero', requireScreen, (req, res) => {
  const { numero } = req.params;
  const { numero_real, pessoa_id, funcionario, matricula, turno, cargo, departamento } = req.body;

  // Validação de campos obrigatórios
  if (!numero) {
    return res.status(400).json({ error: "Número do armário é obrigatório" });
  }

  // Verificar se a pessoa já está em outro armário (exceto o armário atual)
  const checkPessoaArmarioQuery = `SELECT * FROM armario_smd WHERE pessoa_id = ? AND numero_armario != ?`;

  db.query(checkPessoaArmarioQuery, [pessoa_id, numero], (err, result) => {
    if (err) {
      console.error("Erro ao verificar pessoa em armário: ", err);
      return res.status(500).json({ error: "Erro ao verificar pessoa em armário" });
    }

    if (result.length > 0) {
      return res.status(400).json({ error: "Pessoa já está atribuída a outro armário" });
    }

    // Verificar se a pessoa existe na tabela de pessoas (apenas se pessoa_id foi fornecido)
    if (pessoa_id) {
      const checkPessoaQuery = `SELECT * FROM mydb.pessoas WHERE id = ?`;

      db.query(checkPessoaQuery, [pessoa_id], (err, result) => {
        if (err) {
          console.error("Erro ao verificar pessoa: ", err);
          return res.status(500).json({ error: "Erro ao verificar pessoa" });
        }

        if (result.length === 0) {
          return res.status(400).json({ error: "Pessoa não encontrada" });
        }

        // Inserir ou atualizar armário
        const updateArmarioQuery = `
          INSERT INTO armario_smd
          (numero_armario, numero_real, pessoa_id, funcionario, matricula, turno, cargo, departamento)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          numero_real = VALUES(numero_real),
          pessoa_id = VALUES(pessoa_id),
          funcionario = VALUES(funcionario),
          matricula = VALUES(matricula),
          turno = VALUES(turno),
          cargo = VALUES(cargo),
          departamento = VALUES(departamento),
          updated_at = CURRENT_TIMESTAMP
        `;

        db.query(updateArmarioQuery, [
          numero,
          numero_real || numero,
          pessoa_id || null,
          funcionario || null,
          matricula || null,
          turno || null,
          cargo || null,
          departamento || null
        ], (err, result) => {
          if (err) {
            console.error("Erro ao salvar armário: ", err);
            // Verificar se é um erro de duplicidade
            if (err.code === 'ER_DUP_ENTRY') {
              if (err.message.includes('numero_armario')) {
                return res.status(400).json({ error: "Número de armário já existe" });
              } else if (err.message.includes('pessoa_id')) {
                return res.status(400).json({ error: "Pessoa já está atribuída a outro armário" });
              }
            }
            return res.status(500).json({ error: "Erro ao salvar armário" });
          }

          // Recarregar os armários após a atualização
          const reloadQuery = `SELECT * FROM armario_smd ORDER BY numero_armario`;
          db.query(reloadQuery, (err, results) => {
            if (err) {
              console.error("Erro ao recarregar armários: ", err);
              return res.status(200).json({ message: "Pessoa atribuída ao armário com sucesso" });
            }

            res.status(200).json({
              message: "Pessoa atribuída ao armário com sucesso",
              armarios: results
            });
          });
        });
      });
    } else {
      // Se não tiver pessoa_id, apenas atualizar os dados do armário
      const updateArmarioQuery = `
        INSERT INTO armario_smd
        (numero_armario, numero_real, pessoa_id, funcionario, matricula, turno, cargo, departamento)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        numero_real = VALUES(numero_real),
        pessoa_id = VALUES(pessoa_id),
        funcionario = VALUES(funcionario),
        matricula = VALUES(matricula),
        turno = VALUES(turno),
        cargo = VALUES(cargo),
        departamento = VALUES(departamento),
        updated_at = CURRENT_TIMESTAMP
      `;

      db.query(updateArmarioQuery, [
        numero,
        numero_real || numero,
        pessoa_id || null,
        funcionario || null,
        matricula || null,
        turno || null,
        cargo || null,
        departamento || null
      ], (err, result) => {
        if (err) {
          console.error("Erro ao salvar armário: ", err);
          // Verificar se é um erro de duplicidade
          if (err.code === 'ER_DUP_ENTRY') {
            if (err.message.includes('numero_armario')) {
              return res.status(400).json({ error: "Número de armário já existe" });
            } else if (err.message.includes('pessoa_id')) {
              return res.status(400).json({ error: "Pessoa já está atribuída a outro armário" });
            }
          }
          return res.status(500).json({ error: "Erro ao salvar armário" });
        }

        // Recarregar os armários após a atualização
        const reloadQuery = `SELECT * FROM armario_smd ORDER BY numero_armario`;
        db.query(reloadQuery, (err, results) => {
          if (err) {
            console.error("Erro ao recarregar armários: ", err);
            return res.status(200).json({ message: "Armário atualizado com sucesso" });
          }

          res.status(200).json({
            message: "Armário atualizado com sucesso",
            armarios: results
          });
        });
      });
    }
  });
});

// Liberar um armário (remover pessoa)
router.delete('/armario/:numero', requireScreen, (req, res) => {
  const { numero } = req.params;

  // Verificar se o armário existe
  const checkArmarioQuery = `SELECT * FROM armario_smd WHERE numero_armario = ?`;

  db.query(checkArmarioQuery, [numero], (err, result) => {
    if (err) {
      console.error("Erro ao verificar armário: ", err);
      return res.status(500).json({ error: "Erro ao verificar armário" });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "Armário não encontrado" });
    }

    // Remover pessoa do armário
    const updateArmarioQuery = `
      UPDATE armario_smd
      SET pessoa_id = NULL,
          funcionario = NULL,
          matricula = NULL,
          turno = NULL,
          cargo = NULL,
          departamento = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE numero_armario = ?
    `;

    db.query(updateArmarioQuery, [numero], (err, result) => {
      if (err) {
        console.error("Erro ao remover pessoa do armário: ", err);
        return res.status(500).json({ error: "Erro ao remover pessoa do armário" });
      }

      res.status(200).json({ message: "Pessoa removida do armário com sucesso" });
    });
  });
});

module.exports = router;
