const express = require("express");
const router = express.Router();
const db = require("../../config/db");

// ----------------------------------------LOGIN-----------------------------------------
// NOTA: rota de login legada, anterior ao sistema de autenticação real que será
// implementado na Fase 4 (login com usuários/departamentos). Preservada verbatim.

router.get('/loginForm', (req, res) => {
  const sql = "SELECT * FROM mydb.login WHERE User = ? AND Password = ?"
  const values = [
    req.body.User,
    req.body.Password
  ]
  db.query(sql, [values], (err, data) => {
    if (err) return res.json("Login Failed");
    return res.json(data);
  })
})

module.exports = router;
