const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../../config/db");
const { authenticateToken } = require("../../middleware/auth");

router.post("/login", (req, res) => {
  const { matricula, senha } = req.body;

  if (!matricula || !senha) {
    return res.status(400).json({ message: "Matrícula e senha são obrigatórios" });
  }

  const query = `
    SELECT u.id, u.nome, u.matricula, u.senha_hash, u.ativo,
           GROUP_CONCAT(d.slug) AS departments
    FROM mydb.users u
    LEFT JOIN mydb.user_departments ud ON ud.user_id = u.id
    LEFT JOIN mydb.departments d ON d.id = ud.department_id
    WHERE u.matricula = ?
    GROUP BY u.id
  `;

  db.query(query, [matricula], (err, results) => {
    if (err) {
      console.error("Erro ao consultar usuário: ", err);
      return res.status(500).json({ message: "Erro ao consultar usuário" });
    }
    if (results.length === 0) {
      return res.status(401).json({ message: "Matrícula ou senha incorretos" });
    }

    const user = results[0];
    if (!user.ativo) {
      return res.status(403).json({ message: "Usuário desativado" });
    }

    bcrypt.compare(senha, user.senha_hash, (err, match) => {
      if (err || !match) {
        return res.status(401).json({ message: "Matrícula ou senha incorretos" });
      }

      const departments = user.departments ? user.departments.split(",") : [];
      const payload = {
        id: user.id,
        nome: user.nome,
        matricula: user.matricula,
        departments,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "12h" });
      res.status(200).json({ token, user: payload });
    });
  });
});

router.get("/me", authenticateToken, (req, res) => {
  res.status(200).json({ user: req.user });
});

module.exports = router;
