const express = require("express");
const router = express.Router();
const db = require("../../../config/db");
const { authorizeScreen } = require("../../../auth/middleware");
const requireScreen = authorizeScreen('GestaoAtivos');

// ═══════════════════════════════════════════════════════════════
// ROTAS PARA GESTÃO DE CICLOS DE INVENTÁRIO
// ═══════════════════════════════════════════════════════════════

// GET /api/ciclo-inventario-ativo
// Retorna o ciclo de inventário atualmente ativo. Se não existir, cria automaticamente.
router.get('/api/ciclo-inventario-ativo', requireScreen, (req, res) => {
  // Usar data_fim IS NULL para encontrar o ciclo ativo (evita problemas com UNIQUE constraint na coluna ativo)
  const queryBuscar = `SELECT * FROM ativo_inv_ciclo WHERE data_fim IS NULL ORDER BY id DESC LIMIT 1`;

  db.query(queryBuscar, (err, results) => {
    if (err) {
      console.error('Erro ao buscar ciclo ativo:', err);
      return res.status(500).json({ success: false, message: 'Erro ao buscar ciclo ativo' });
    }

    if (results.length > 0) {
      return res.status(200).json({ success: true, data: results[0] });
    }

    // Nenhum ciclo existe → cria o primeiro automaticamente
    const nome = `Inventário ${new Date().toLocaleDateString('pt-BR')}`;
    const queryCriar = `
      INSERT INTO ativo_inv_ciclo (nome, descricao, data_inicio, criado_em)
      VALUES (?, 'Ciclo inicial criado automaticamente', NOW(), NOW())
    `;
    db.query(queryCriar, [nome], (err2, result2) => {
      if (err2) {
        console.error('Erro ao criar ciclo inicial:', err2);
        return res.status(500).json({ success: false, message: 'Erro ao criar ciclo inicial' });
      }
      const novoCiclo = { id: result2.insertId, nome, data_inicio: new Date() };
      return res.status(200).json({ success: true, data: novoCiclo });
    });
  });
});

// POST /api/novo_ciclo_inventario
// Fecha o ciclo atual e cria um novo. O histórico anterior fica intacto.
router.post('/api/novo_ciclo_inventario', requireScreen, (req, res) => {
  const { descricao } = req.body;
  const nome = descricao || `Inventário ${new Date().toLocaleDateString('pt-BR')}`;

  // 0. Remover UNIQUE constraint da coluna ativo se existir (causa Duplicate Entry)
  db.query(`ALTER TABLE ativo_inv_ciclo DROP INDEX uq_ativo`, (errDrop) => {
    // Ignorar erro se o índice não existir

    // 1. Fechar o ciclo atual
    const queryFechar = `UPDATE ativo_inv_ciclo SET data_fim = NOW() WHERE data_fim IS NULL`;

    db.query(queryFechar, (err) => {
      if (err) {
        console.error('Erro ao fechar ciclo:', err.message);
        return res.status(500).json({ success: false, message: 'Erro ao fechar ciclo atual', error: err.message });
      }

      // 2. Criar o novo ciclo (sem usar a coluna ativo para evitar conflito com UNIQUE)
      const queryCriar = `INSERT INTO ativo_inv_ciclo (nome, descricao, data_inicio, criado_em) VALUES (?, ?, NOW(), NOW())`;

      db.query(queryCriar, [nome, `Criado em ${new Date().toLocaleString('pt-BR')}`], (err2, result) => {
        if (err2) {
          console.error('Erro ao criar novo ciclo:', err2.message);
          // Se ainda der erro de Duplicate Entry, tentar sem a coluna ativo setando explicitamente
          if (err2.code === 'ER_DUP_ENTRY') {
            // Tentar remover o índice e inserir novamente
            db.query(`ALTER TABLE ativo_inv_ciclo DROP INDEX uq_ativo`, () => {
              db.query(queryCriar, [nome, `Criado em ${new Date().toLocaleString('pt-BR')}`], (err3, result3) => {
                if (err3) {
                  console.error('Erro na segunda tentativa:', err3.message);
                  return res.status(500).json({ success: false, message: 'Erro ao criar novo ciclo', error: err3.message });
                }
                return res.status(200).json({
                  success: true,
                  message: 'Novo ciclo criado com sucesso',
                  data: { id: result3.insertId, nome, data_inicio: new Date() },
                });
              });
            });
          } else {
            return res.status(500).json({ success: false, message: 'Erro ao criar novo ciclo', error: err2.message });
          }
        } else {
          return res.status(200).json({
            success: true,
            message: 'Novo ciclo criado com sucesso',
            data: { id: result.insertId, nome, data_inicio: new Date() },
          });
        }
      });
    });
  });
});

// GET /api/ciclos-historico
// Lista todos os ciclos anteriores (para relatórios).
router.get('/api/ciclos-historico', requireScreen, (req, res) => {
  const query = `
    SELECT
      c.*,
      COUNT(h.id) AS total_registros,
      SUM(CASE WHEN h.status = 'encontrado' THEN 1 ELSE 0 END) AS encontrados,
      SUM(CASE WHEN h.status = 'nao_encontrado' THEN 1 ELSE 0 END) AS nao_encontrados
    FROM ativo_inv_ciclo c
    LEFT JOIN ativo_inventario_historico h ON h.ciclo_id = c.id
    GROUP BY c.id
    ORDER BY c.data_inicio DESC
  `;
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erro ao buscar histórico de ciclos' });
    }
    return res.status(200).json({ success: true, data: results });
  });
});

module.exports = router;
