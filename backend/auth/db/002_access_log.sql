-- Fase 4 (incremento): rastreio de acesso - de onde (IP) e quando cada
-- usuário acessou o sistema, pra dar visibilidade ao administrador de quem
-- está usando o quê e de qual computador.
-- Execute manualmente contra o MySQL (mydb):
--   mysql -u materiais -p mydb < backend/auth/db/002_access_log.sql
--
-- Não é idempotente (ADD COLUMN sem IF NOT EXISTS - essa versão do MySQL
-- não aceitou a sintaxe com IF NOT EXISTS pra ADD COLUMN). Se rodar de novo
-- numa base que já tem essas colunas/tabela, vai dar erro de "duplicate
-- column"/"table already exists" - é só ignorar, não quebra nada.

-- Estado rápido "por onde essa pessoa está agora" - atualizado a cada
-- requisição autenticada (ver backend/auth/middleware.js), então serve
-- como sinal de "ativo agora" (ultimo_acesso recente = provavelmente online).
ALTER TABLE mydb.users ADD COLUMN ultimo_ip VARCHAR(45) NULL, ADD COLUMN ultimo_acesso DATETIME NULL;

-- Histórico completo: um registro por login bem-sucedido, pra auditoria
-- (quem entrou, de qual IP, quando) - diferente de ultimo_ip/ultimo_acesso,
-- que só guardam o estado mais recente. FOREIGN KEY em user_id já cria um
-- índice implícito no InnoDB, suficiente pro volume de consultas daqui.
CREATE TABLE IF NOT EXISTS mydb.login_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  ip VARCHAR(45) NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES mydb.users(id) ON DELETE CASCADE
);
