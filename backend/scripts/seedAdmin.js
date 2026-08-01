// Cria (ou atualiza a senha de) um usuário com acesso a todos os departamentos.
// Uso: node scripts/seedAdmin.js <matricula> <senha> "<Nome Completo>"
// Rode a partir da pasta backend/, depois de aplicar db/migrations/001_auth_schema.sql

require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("../config/db");

const [, , matricula, senha, nome] = process.argv;

if (!matricula || !senha || !nome) {
  console.error('Uso: node scripts/seedAdmin.js <matricula> <senha> "<Nome Completo>"');
  process.exit(1);
}

bcrypt.hash(senha, 10, (err, hash) => {
  if (err) {
    console.error("Erro ao gerar hash da senha:", err);
    process.exit(1);
  }

  const upsertUser = `
    INSERT INTO mydb.users (nome, matricula, senha_hash)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE nome = VALUES(nome), senha_hash = VALUES(senha_hash), ativo = TRUE
  `;

  db.query(upsertUser, [nome, matricula, hash], (err) => {
    if (err) {
      console.error("Erro ao criar/atualizar usuário:", err);
      process.exit(1);
    }

    db.query("SELECT id FROM mydb.users WHERE matricula = ?", [matricula], (err, rows) => {
      if (err || rows.length === 0) {
        console.error("Erro ao buscar usuário recém-criado:", err);
        process.exit(1);
      }

      const userId = rows[0].id;
      db.query("SELECT id FROM mydb.departments", [], (err, departments) => {
        if (err) {
          console.error("Erro ao buscar departamentos:", err);
          process.exit(1);
        }

        const values = departments.map((d) => [userId, d.id]);
        if (values.length === 0) {
          console.warn("Nenhum departamento encontrado - rode a migration 001_auth_schema.sql primeiro.");
          process.exit(0);
        }

        db.query(
          "INSERT IGNORE INTO mydb.user_departments (user_id, department_id) VALUES ?",
          [values],
          (err) => {
            if (err) {
              console.error("Erro ao vincular departamentos:", err);
              process.exit(1);
            }
            console.log(`Usuário "${matricula}" pronto, com acesso a todos os ${values.length} departamentos.`);
            process.exit(0);
          }
        );
      });
    });
  });
});
