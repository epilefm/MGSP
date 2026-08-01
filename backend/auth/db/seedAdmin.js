// Cria (ou promove a admin) um usuário administrador, com acesso a tudo.
// Uso: node backend/auth/db/seedAdmin.js <matricula> <senha> "<Nome Completo>"
// Rode depois de aplicar schema.sql e seed.js.

require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("../../config/db");

const [, , matricula, senha, nome] = process.argv;

if (!matricula || !senha || !nome) {
  console.error('Uso: node backend/auth/db/seedAdmin.js <matricula> <senha> "<Nome Completo>"');
  process.exit(1);
}

bcrypt.hash(senha, 10, (err, hash) => {
  if (err) {
    console.error("Erro ao gerar hash da senha:", err);
    process.exit(1);
  }

  const upsert = `
    INSERT INTO mydb.users (nome, matricula, senha_hash, is_admin, ativo)
    VALUES (?, ?, ?, TRUE, TRUE)
    ON DUPLICATE KEY UPDATE nome = VALUES(nome), senha_hash = VALUES(senha_hash), is_admin = TRUE, ativo = TRUE
  `;

  db.query(upsert, [nome, matricula, hash], (err) => {
    if (err) {
      console.error("Erro ao criar/promover administrador:", err);
      process.exit(1);
    }
    console.log(`Administrador "${matricula}" pronto (acesso total, is_admin = TRUE).`);
    process.exit(0);
  });
});
