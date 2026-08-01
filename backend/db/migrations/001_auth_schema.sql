-- Fase 4: schema de autenticação (usuários, departamentos, permissões)
-- Execute manualmente no MySQL (mydb) antes de usar o login novo.
-- Não mexe em nenhuma tabela existente do sistema legado.

CREATE TABLE IF NOT EXISTS mydb.users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  matricula VARCHAR(50) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mydb.departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(50) NOT NULL UNIQUE,
  nome VARCHAR(100) NOT NULL
);

INSERT IGNORE INTO mydb.departments (slug, nome) VALUES
  ('material', 'Material'),
  ('quality', 'Qualidade / Reparo'),
  ('production', 'Produção'),
  ('maintenance', 'Manutenção'),
  ('support', 'Suporte');

CREATE TABLE IF NOT EXISTS mydb.user_departments (
  user_id INT NOT NULL,
  department_id INT NOT NULL,
  PRIMARY KEY (user_id, department_id),
  FOREIGN KEY (user_id) REFERENCES mydb.users(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES mydb.departments(id) ON DELETE CASCADE
);
