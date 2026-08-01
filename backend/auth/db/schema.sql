-- Fase 4: schema de autenticação e permissão por tela.
-- Execute manualmente contra o MySQL (mydb) antes de usar o login novo:
--   mysql -u materiais -p mydb < backend/auth/db/schema.sql

CREATE TABLE IF NOT EXISTS mydb.users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  matricula VARCHAR(50) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  reset_solicitado BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Catálogo de telas do sistema. `slug` bate exatamente com o `path`
-- de cada rota em frontend/src/index.js.
CREATE TABLE IF NOT EXISTS mydb.screens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  nome VARCHAR(150) NOT NULL,
  grupo VARCHAR(50) NOT NULL, -- material | quality | production | maintenance | support | inovacao
  is_public BOOLEAN NOT NULL DEFAULT FALSE
);

-- Concessão de acesso: quais usuários podem ver quais telas.
-- Administradores (users.is_admin = TRUE) ignoram esta tabela e veem tudo.
CREATE TABLE IF NOT EXISTS mydb.user_screens (
  user_id INT NOT NULL,
  screen_id INT NOT NULL,
  PRIMARY KEY (user_id, screen_id),
  FOREIGN KEY (user_id) REFERENCES mydb.users(id) ON DELETE CASCADE,
  FOREIGN KEY (screen_id) REFERENCES mydb.screens(id) ON DELETE CASCADE
);
