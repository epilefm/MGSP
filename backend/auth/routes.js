const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { authenticateToken } = require("./middleware");
const obterIp = require("./obterIp");

// Cadastro próprio. O usuário começa sem nenhuma tela liberada - o
// administrador libera depois pelo painel Admin.
router.post("/register", (req, res) => {
  const { matricula, senha, nome } = req.body;

  if (!matricula || !senha || !nome) {
    return res.status(400).json({ message: "Matrícula, nome e senha são obrigatórios" });
  }

  bcrypt.hash(senha, 10, (err, hash) => {
    if (err) {
      console.error("Erro ao gerar hash de senha: ", err);
      return res.status(500).json({ message: "Erro ao criar conta" });
    }

    const query = `INSERT INTO mydb.users (nome, matricula, senha_hash) VALUES (?, ?, ?)`;
    db.query(query, [nome, matricula, hash], (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ message: "Já existe uma conta com essa matrícula" });
        }
        console.error("Erro ao criar usuário: ", err);
        return res.status(500).json({ message: "Erro ao criar conta" });
      }
      res.status(201).json({ message: "Conta criada. Um administrador precisa liberar suas telas antes de você ver conteúdo." });
    });
  });
});

router.post("/login", (req, res) => {
  const { matricula, senha } = req.body;

  if (!matricula || !senha) {
    return res.status(400).json({ message: "Matrícula e senha são obrigatórios" });
  }

  const query = `
    SELECT u.id, u.nome, u.matricula, u.senha_hash, u.ativo, u.is_admin,
           GROUP_CONCAT(DISTINCT s.slug) AS telas_liberadas
    FROM mydb.users u
    LEFT JOIN mydb.user_screens us ON us.user_id = u.id
    LEFT JOIN mydb.screens s ON s.id = us.screen_id
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
      return res.status(403).json({ message: "Conta desativada. Fale com o administrador." });
    }

    bcrypt.compare(senha, user.senha_hash, (err, match) => {
      if (err || !match) {
        return res.status(401).json({ message: "Matrícula ou senha incorretos" });
      }

      // Telas públicas contam pra todo mundo, além das liberadas individualmente.
      db.query(`SELECT slug FROM mydb.screens WHERE is_public = TRUE`, [], (err, publicScreens) => {
        if (err) {
          console.error("Erro ao buscar telas públicas: ", err);
          return res.status(500).json({ message: "Erro ao consultar telas públicas" });
        }

        const proprias = user.telas_liberadas ? user.telas_liberadas.split(",") : [];
        const publicas = publicScreens.map((s) => s.slug);
        const screens = Array.from(new Set([...proprias, ...publicas]));

        const payload = {
          id: user.id,
          nome: user.nome,
          matricula: user.matricula,
          isAdmin: !!user.is_admin,
          screens,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "12h" });
        res.status(200).json({ token, user: payload });

        // Registra o acesso (IP + histórico) depois de já ter respondido -
        // não faz o login esperar por isso, e um erro aqui não deve derrubar
        // o login de ninguém.
        const ip = obterIp(req);
        db.query(`UPDATE mydb.users SET ultimo_ip = ?, ultimo_acesso = NOW() WHERE id = ?`, [ip, user.id], (err) => {
          if (err) console.error("Erro ao atualizar último acesso: ", err);
        });
        db.query(`INSERT INTO mydb.login_history (user_id, ip) VALUES (?, ?)`, [user.id, ip], (err) => {
          if (err) console.error("Erro ao registrar histórico de login: ", err);
        });
      });
    });
  });
});

router.get("/me", authenticateToken, (req, res) => {
  res.status(200).json({ user: req.user });
});

// Catálogo de telas (nome/grupo/is_public) para qualquer usuário autenticado
// montar a Home - diferente de /admin/telas, esta não exige ser admin, mas
// também não revela nada sensível (só nomes e agrupamento de telas).
router.get("/screens", authenticateToken, (req, res) => {
  db.query(`SELECT slug, nome, grupo, is_public FROM mydb.screens ORDER BY grupo ASC, nome ASC`, [], (err, results) => {
    if (err) {
      console.error("Erro ao listar catálogo de telas: ", err);
      return res.status(500).json({ message: "Erro ao listar telas" });
    }
    res.status(200).json(results);
  });
});

// "Esqueci minha senha", versão viável pra quem não tem e-mail corporativo:
// o usuário só sinaliza que esqueceu (por matrícula), e o administrador vê
// isso no painel Admin e redefine a senha manualmente pra ele.
router.post("/solicitar-reset", (req, res) => {
  const { matricula } = req.body;

  if (!matricula) {
    return res.status(400).json({ message: "Matrícula é obrigatória" });
  }

  const query = `UPDATE mydb.users SET reset_solicitado = TRUE WHERE matricula = ?`;
  db.query(query, [matricula], (err, result) => {
    if (err) {
      console.error("Erro ao solicitar redefinição de senha: ", err);
      return res.status(500).json({ message: "Erro ao registrar solicitação" });
    }
    // Não revela se a matrícula existe ou não (evita enumeração de usuários).
    res.status(200).json({ message: "Se a matrícula existir, o administrador foi avisado e vai entrar em contato." });
  });
});

module.exports = router;
