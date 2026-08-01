const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { authenticateToken, requireAdmin } = require("./middleware");

router.use(authenticateToken, requireAdmin);

// Lista todos os usuários, com as telas que cada um tem liberadas.
router.get("/usuarios", (req, res) => {
  const query = `
    SELECT u.id, u.nome, u.matricula, u.is_admin, u.ativo, u.reset_solicitado, u.criado_em,
           GROUP_CONCAT(DISTINCT s.slug) AS telas_liberadas
    FROM mydb.users u
    LEFT JOIN mydb.user_screens us ON us.user_id = u.id
    LEFT JOIN mydb.screens s ON s.id = us.screen_id
    GROUP BY u.id
    ORDER BY u.nome ASC
  `;
  db.query(query, [], (err, results) => {
    if (err) {
      console.error("Erro ao listar usuários: ", err);
      return res.status(500).json({ message: "Erro ao listar usuários" });
    }
    const usuarios = results.map((u) => ({
      ...u,
      telas_liberadas: u.telas_liberadas ? u.telas_liberadas.split(",") : [],
    }));
    res.status(200).json(usuarios);
  });
});

// Catálogo completo de telas (pro admin montar a UI de concessão).
router.get("/telas", (req, res) => {
  db.query(`SELECT id, slug, nome, grupo, is_public FROM mydb.screens ORDER BY grupo ASC, nome ASC`, [], (err, results) => {
    if (err) {
      console.error("Erro ao listar telas: ", err);
      return res.status(500).json({ message: "Erro ao listar telas" });
    }
    res.status(200).json(results);
  });
});

// Define o conjunto completo de telas liberadas para um usuário
// (substitui as anteriores - o frontend manda a lista final desejada).
router.post("/usuarios/:id/telas", (req, res) => {
  const { id } = req.params;
  const { screenIds } = req.body; // array de ids de mydb.screens

  if (!Array.isArray(screenIds)) {
    return res.status(400).json({ message: "screenIds precisa ser uma lista de ids" });
  }

  db.query(`DELETE FROM mydb.user_screens WHERE user_id = ?`, [id], (err) => {
    if (err) {
      console.error("Erro ao limpar telas do usuário: ", err);
      return res.status(500).json({ message: "Erro ao atualizar telas" });
    }

    if (screenIds.length === 0) {
      return res.status(200).json({ message: "Telas atualizadas (nenhuma liberada)" });
    }

    const values = screenIds.map((screenId) => [id, screenId]);
    db.query(`INSERT INTO mydb.user_screens (user_id, screen_id) VALUES ?`, [values], (err) => {
      if (err) {
        console.error("Erro ao conceder telas: ", err);
        return res.status(500).json({ message: "Erro ao atualizar telas" });
      }
      res.status(200).json({ message: "Telas atualizadas" });
    });
  });
});

// Admin redefine a senha de um usuário manualmente (fluxo de "esqueci a senha").
router.post("/usuarios/:id/reset-senha", (req, res) => {
  const { id } = req.params;
  const { novaSenha } = req.body;

  if (!novaSenha || novaSenha.length < 4) {
    return res.status(400).json({ message: "Informe uma nova senha (mínimo 4 caracteres)" });
  }

  bcrypt.hash(novaSenha, 10, (err, hash) => {
    if (err) {
      console.error("Erro ao gerar hash: ", err);
      return res.status(500).json({ message: "Erro ao redefinir senha" });
    }

    const query = `UPDATE mydb.users SET senha_hash = ?, reset_solicitado = FALSE WHERE id = ?`;
    db.query(query, [hash, id], (err, result) => {
      if (err) {
        console.error("Erro ao redefinir senha: ", err);
        return res.status(500).json({ message: "Erro ao redefinir senha" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      res.status(200).json({ message: "Senha redefinida" });
    });
  });
});

// Ativa/desativa a conta de um usuário.
router.post("/usuarios/:id/ativo", (req, res) => {
  const { id } = req.params;
  const { ativo } = req.body;

  db.query(`UPDATE mydb.users SET ativo = ? WHERE id = ?`, [!!ativo, id], (err, result) => {
    if (err) {
      console.error("Erro ao atualizar status do usuário: ", err);
      return res.status(500).json({ message: "Erro ao atualizar usuário" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    res.status(200).json({ message: ativo ? "Usuário ativado" : "Usuário desativado" });
  });
});

module.exports = router;
