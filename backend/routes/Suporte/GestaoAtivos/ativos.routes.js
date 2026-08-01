const express = require("express");
const router = express.Router();
const db = require("../../../config/db");
const { authorizeScreen } = require("../../../auth/middleware");
const requireScreen = authorizeScreen('GestaoAtivos');

// Rota para buscar ativos unificados (ativo_fixo + ativo_bnp)
router.get('/api/ativos-unificados', requireScreen, (req, res) => {
  const { tipo } = req.query; // Adiciona filtro por tipo (opcional)

  let query = '';

  // Se o tipo for especificado, filtra por tipo específico
  if (tipo === 'fixo') {
    query = `
      SELECT
        asset AS asset_identifier,
        serial_number AS serial,
        asset_description AS description,
        inventario AS estacao,
        'fixo' AS tipo,
        inventario AS status
      FROM ativo_fixo
      ORDER BY asset_identifier
    `;
  } else if (tipo === 'bnp') {
    query = `
      SELECT
        asset_number AS asset_identifier,
        serial_number AS serial,
        asset_desc AS description,
        location_district AS estacao,
        'bnp' AS tipo,
        NULL AS status
      FROM ativo_bnp
      ORDER BY asset_identifier
    `;
  } else {
    // Se não especificar tipo ou for 'todos', faz a união
    query = `
      SELECT
        asset AS asset_identifier,
        serial_number AS serial,
        asset_description AS description,
        inventario AS estacao,
        'fixo' AS tipo,
        inventario AS status
      FROM ativo_fixo
      UNION ALL
      SELECT
        asset_number AS asset_identifier,
        serial_number AS serial,
        asset_desc AS description,
        location_district AS estacao,
        'bnp' AS tipo,
        NULL AS status
      FROM ativo_bnp
      ORDER BY asset_identifier
    `;
  }

  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar ativos unificados: ", err);
      return res.status(500).json({ success: false, message: "Erro ao buscar ativos unificados" });
    }

    res.status(200).json({ success: true, data: results });
  });
});

// Endpoint para verificar se a tabela de inventário existe
router.get('/api/verificar-tabela-inventario', requireScreen, (req, res) => {
  const checkTableQuery = `
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'mydb' AND table_name = 'ativo_inventario_historico' LIMIT 1
  `;

  db.query(checkTableQuery, (err, results) => {
    if (err) {
      console.error("Erro ao verificar tabela de inventário: ", err);
      return res.status(500).json({ success: false, message: "Erro ao verificar tabela de inventário" });
    }

    const existe = results.length > 0;
    res.status(200).json({ success: true, existe: existe });
  });
});

// Rota para salvar o status do inventário de um ativo
router.post('/api/salvar-inventario-ativo', requireScreen, (req, res) => {
  const { asset_identifier, serial_number, description, localizacao, tipo_ativo, status } = req.body;

  // Validar campos obrigatórios
  if (!asset_identifier || !tipo_ativo || !status) {
    return res.status(400).json({ success: false, message: "Campos obrigatórios: asset_identifier, tipo_ativo e status" });
  }

  // Validar status
  if (status !== 'encontrado' && status !== 'nao_encontrado' && status !== 'pendente') {
    return res.status(400).json({ success: false, message: "Status inválido. Use 'encontrado', 'nao_encontrado' ou 'pendente'" });
  }

  // Iniciar uma transação para atualizar ambas as tabelas
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Erro ao obter conexão: ", err);
      return res.status(500).json({ success: false, message: "Erro ao obter conexão" });
    }

    connection.beginTransaction(err => {
      if (err) {
        connection.release();
        console.error("Erro ao iniciar transação: ", err);
        return res.status(500).json({ success: false, message: "Erro ao iniciar transação" });
      }

      // Atualizar a tabela de inventário histórico
      const ciclo_id = req.body.ciclo_id || null;
      const inventarioQuery = `
        INSERT INTO ativo_inventario_historico
        (asset_identifier, serial_number, description, localizacao, tipo_ativo, status, ciclo_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        serial_number = VALUES(serial_number),
        description = VALUES(description),
        localizacao = VALUES(localizacao),
        tipo_ativo = VALUES(tipo_ativo),
        status = VALUES(status),
        ciclo_id = VALUES(ciclo_id),
        data_hora = CURRENT_TIMESTAMP
      `;

      connection.query(inventarioQuery, [asset_identifier, serial_number, description, localizacao, tipo_ativo, status, ciclo_id], (err, results) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            console.error("Erro ao salvar inventário do ativo: ", err);
            return res.status(500).json({ success: false, message: "Erro ao salvar inventário do ativo" });
          });
        }

        // Commit da transação (localização é salva apenas no histórico, não nas tabelas originais)
        connection.commit(err => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              console.error("Erro ao commitar transação: ", err);
              return res.status(500).json({ success: false, message: "Erro ao salvar dados" });
            });
          }

          connection.release();
          res.status(200).json({
            success: true,
            message: "Inventário do ativo salvo com sucesso",
            id: results.insertId
          });
        });
      });
    });
  });
});

// Rota para buscar o histórico de inventário de um ativo específico
router.get('/api/historico-inventario-ativo/:asset_identifier', requireScreen, (req, res) => {
  const { asset_identifier } = req.params;

  const query = `
    SELECT * FROM ativo_inventario_historico
    WHERE asset_identifier = ?
    ORDER BY data_hora DESC
  `;

  db.query(query, [asset_identifier], (err, results) => {
    if (err) {
      console.error("Erro ao buscar histórico de inventário do ativo: ", err);
      return res.status(500).json({ success: false, message: "Erro ao buscar histórico de inventário do ativo" });
    }

    res.status(200).json({ success: true, data: results });
  });
});

// Rota para buscar estatísticas de inventário
router.get('/api/estatisticas-inventario', requireScreen, (req, res) => {
  const query = `
    SELECT
      tipo_ativo,
      status,
      COUNT(*) as quantidade
    FROM ativo_inventario_historico
    WHERE data_hora = (SELECT MAX(data_hora) FROM ativo_inventario_historico ai2 WHERE ai2.asset_identifier = ativo_inventario_historico.asset_identifier)
    GROUP BY tipo_ativo, status
    ORDER BY tipo_ativo, status
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar estatísticas de inventário: ", err);
      return res.status(500).json({ success: false, message: "Erro ao buscar estatísticas de inventário" });
    }

    // Processar os resultados para um formato mais amigável
    const estatisticas = {
      fixo: { encontrado: 0, nao_encontrado: 0 },
      bnp: { encontrado: 0, nao_encontrado: 0 }
    };

    results.forEach(row => {
      if (row.tipo_ativo === 'fixo') {
        estatisticas.fixo[row.status] = row.quantidade;
      } else if (row.tipo_ativo === 'bnp') {
        estatisticas.bnp[row.status] = row.quantidade;
      }
    });

    res.status(200).json({ success: true, data: estatisticas });
  });
});

// Rota para buscar contadores de ativos
router.get('/api/contadores-ativos', requireScreen, (req, res) => {
  // Contar total de ativos fixos
  const queryFixos = `SELECT COUNT(*) as total FROM ativo_fixo`;

  // Contar total de ativos BNP
  const queryBnp = `SELECT COUNT(*) as total FROM ativo_bnp`;

  // Contar ativos fixos inventariados
  const queryFixosInventariados = `
    SELECT status, COUNT(*) as quantidade
    FROM ativo_inventario_historico
    WHERE tipo_ativo = 'fixo'
    AND data_hora = (SELECT MAX(data_hora) FROM ativo_inventario_historico ai2 WHERE ai2.asset_identifier = ativo_inventario_historico.asset_identifier)
    GROUP BY status
  `;

  // Contar ativos BNP inventariados
  const queryBnpInventariados = `
    SELECT status, COUNT(*) as quantidade
    FROM ativo_inventario_historico
    WHERE tipo_ativo = 'bnp'
    AND data_hora = (SELECT MAX(data_hora) FROM ativo_inventario_historico ai2 WHERE ai2.asset_identifier = ativo_inventario_historico.asset_identifier)
    GROUP BY status
  `;

  // Executar todas as queries em paralelo
  Promise.all([
    new Promise((resolve, reject) => {
      db.query(queryFixos, (err, results) => {
        if (err) reject(err);
        else resolve(results[0].total);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(queryBnp, (err, results) => {
        if (err) reject(err);
        else resolve(results[0].total);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(queryFixosInventariados, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(queryBnpInventariados, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    })
  ])
  .then(([totalFixos, totalBnp, fixosInventariados, bnpInventariados]) => {
    // Processar resultados
    const contadores = {
      fixos: {
        total: totalFixos,
        encontrado: 0,
        nao_encontrado: 0
      },
      bnp: {
        total: totalBnp,
        encontrado: 0,
        nao_encontrado: 0
      }
    };

    // Preencher contadores de ativos fixos
    fixosInventariados.forEach(row => {
      if (row.status === 'encontrado') {
        contadores.fixos.encontrado = row.quantidade;
      } else if (row.status === 'nao_encontrado') {
        contadores.fixos.nao_encontrado = row.quantidade;
      }
    });

    // Preencher contadores de ativos BNP
    bnpInventariados.forEach(row => {
      if (row.status === 'encontrado') {
        contadores.bnp.encontrado = row.quantidade;
      } else if (row.status === 'nao_encontrado') {
        contadores.bnp.nao_encontrado = row.quantidade;
      }
    });

    res.status(200).json({ success: true, data: contadores });
  })
  .catch(err => {
    console.error("Erro ao buscar contadores de ativos: ", err);
    res.status(500).json({ success: false, message: "Erro ao buscar contadores de ativos" });
  });
});

// Rota para buscar status de múltiplos ativos de uma vez
router.post('/api/ativos-com-status', requireScreen, (req, res) => {
  const { assetIdentifiers } = req.body;

  if (!assetIdentifiers || !Array.isArray(assetIdentifiers) || assetIdentifiers.length === 0) {
    return res.status(400).json({ success: false, message: "Lista de identificadores de ativos é obrigatória" });
  }

  // Criar placeholders para a query
  const placeholders = assetIdentifiers.map(() => '?').join(',');

  // Query para buscar o status mais recente de cada ativo
  const query = `
    SELECT
      asset_identifier,
      status,
      localizacao,
      data_hora
    FROM ativo_inventario_historico aih1
    WHERE
      asset_identifier IN (${placeholders}) AND
      data_hora = (
        SELECT MAX(data_hora)
        FROM ativo_inventario_historico aih2
        WHERE aih2.asset_identifier = aih1.asset_identifier
      )
  `;

  db.query(query, assetIdentifiers, (err, results) => {
    if (err) {
      console.error("Erro ao buscar status de ativos: ", err);
      return res.status(500).json({ success: false, message: "Erro ao buscar status de ativos" });
    }

    res.status(200).json({ success: true, data: results });
  });
});

module.exports = router;
