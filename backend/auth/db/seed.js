// Popula/atualiza o catálogo de telas (tabela screens) a partir de
// backend/auth/db/seedScreens.js. Idempotente - roda quantas vezes precisar.
// Uso: node backend/auth/db/seed.js  (rode a partir da raiz do projeto ou de backend/)

require("dotenv").config();
const db = require("../../config/db");
const { SCREENS } = require("./seedScreens");

const query = `
  INSERT INTO mydb.screens (slug, nome, grupo, is_public)
  VALUES (?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE nome = VALUES(nome), grupo = VALUES(grupo), is_public = VALUES(is_public)
`;

let pending = SCREENS.length;
let errors = 0;

SCREENS.forEach((screen) => {
  db.query(query, [screen.slug, screen.nome, screen.grupo, !!screen.is_public], (err) => {
    if (err) {
      console.error(`Erro ao popular tela "${screen.slug}":`, err.message);
      errors++;
    }
    pending--;
    if (pending === 0) {
      console.log(`Catálogo de telas atualizado: ${SCREENS.length - errors}/${SCREENS.length} ok.`);
      process.exit(errors > 0 ? 1 : 0);
    }
  });
});
