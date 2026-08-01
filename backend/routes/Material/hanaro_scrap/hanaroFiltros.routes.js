const express = require("express");
const router = express.Router();
const db = require("../../../config/db");
const { authorizeScreen } = require("../../../auth/middleware");
const requireScreen = authorizeScreen('HanaroScrap');

const { buildFilterConditions } = require("./filterConditions");

// Equipamentos disponíveis
router.get("/api/hanaro-equipamentos-registrados", requireScreen, (req, res) => {
  const { conditions, params } = buildFilterConditions(req);
  
  let query = `
    SELECT DISTINCT equipamento_nome as equipamento
    FROM hanaro_scrap
    WHERE ${conditions.join(' AND ')} AND equipamento_nome IS NOT NULL AND equipamento_nome != ''
    ORDER BY equipamento_nome ASC
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar equipamentos registrados: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar equipamentos registrados",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({ equipamento: item.equipamento }))
    });
  });
});

// Causas disponíveis
router.get("/api/hanaro-causas-registradas", requireScreen, (req, res) => {
  const { conditions, params } = buildFilterConditions(req);
  
  let query = `
    SELECT DISTINCT causa_nome as causa
    FROM hanaro_scrap
    WHERE ${conditions.join(' AND ')} AND causa_nome IS NOT NULL AND causa_nome != ''
    ORDER BY causa_nome ASC
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar causas registradas: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar causas registradas",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({ causa: item.causa }))
    });
  });
});

// Linhas disponíveis
router.get("/api/hanaro-linhas-registradas", requireScreen, (req, res) => {
  const { conditions, params } = buildFilterConditions(req);
  
  let query = `
    SELECT DISTINCT linha_nome as linha
    FROM hanaro_scrap
    WHERE ${conditions.join(' AND ')} AND linha_nome IS NOT NULL AND linha_nome != ''
    ORDER BY linha_nome ASC
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar linhas registradas: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar linhas registradas",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({ linha: item.linha }))
    });
  });
});

// Fases disponíveis (usa tipo_placa que é o campo correto na tabela)
router.get("/api/hanaro-fases-registradas", requireScreen, (req, res) => {
  const { conditions, params } = buildFilterConditions(req);
  
  let query = `
    SELECT DISTINCT tipo_placa as fase
    FROM hanaro_scrap
    WHERE ${conditions.join(' AND ')} AND tipo_placa IS NOT NULL AND tipo_placa != ''
    ORDER BY tipo_placa ASC
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar fases registradas: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar fases registradas",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({ fase: item.fase }))
    });
  });
});

// Turnos disponíveis
router.get("/api/hanaro-turnos-registrados", requireScreen, (req, res) => {
  const { conditions, params } = buildFilterConditions(req, 'turno');
  
  let query = `
    SELECT DISTINCT turno
    FROM hanaro_scrap
    WHERE ${conditions.join(' AND ')} AND turno IS NOT NULL AND turno != ''
    ORDER BY turno ASC
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar turnos registrados: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar turnos registrados",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({ turno: item.turno }))
    });
  });
});

// Responsáveis disponíveis
router.get("/api/hanaro-responsaveis-registrados", requireScreen, (req, res) => {
  const { conditions, params } = buildFilterConditions(req, 'responsavel');
  
  let query = `
    SELECT DISTINCT nome_operador as responsavel
    FROM hanaro_scrap
    WHERE ${conditions.join(' AND ')} AND nome_operador IS NOT NULL AND nome_operador != ''
    ORDER BY nome_operador ASC
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar responsáveis registrados: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar responsáveis registrados",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({ responsavel: item.responsavel }))
    });
  });
});

// Tipos de Scrap disponíveis
router.get("/api/hanaro-tipo-scrap-registrados", requireScreen, (req, res) => {
  const { conditions, params } = buildFilterConditions(req, 'tipo_scrap');
  
  let query = `
    SELECT DISTINCT tipo_scrap
    FROM hanaro_scrap
    WHERE ${conditions.join(' AND ')} AND tipo_scrap IS NOT NULL AND tipo_scrap != ''
    ORDER BY tipo_scrap ASC
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar tipos de scrap registrados: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar tipos de scrap registrados",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({ tipo_scrap: item.tipo_scrap }))
    });
  });
});

// ==========================================
// Hanaro Scrap - Modelos Únicos (para filtro)
// ==========================================
// Retorna apenas modelos que já têm registros APROVADOS
router.get("/api/hanaro-modelos-registrados", requireScreen, (req, res) => {
  const { dataInicio, dataFim, origem } = req.query;
  
  let query = `
    SELECT DISTINCT modelo_nome as modelo, modelo_id
    FROM hanaro_scrap
    WHERE status = 'Aprovado' AND modelo_nome IS NOT NULL AND modelo_nome != ''
  `;
  
  const params = [];
  const conditions = [];
  
  // Filtro de data
  if (dataInicio && dataFim) {
    conditions.push("DATE(data_hora) BETWEEN ? AND ?");
    params.push(dataInicio, dataFim);
  }
  
  // Filtro de origem
  if (origem) {
    conditions.push("origem_nome = ?");
    params.push(origem);
  }
  
  if (conditions.length > 0) {
    query += " AND " + conditions.join(" AND ");
  }
  
  query += " ORDER BY modelo_nome ASC";
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar modelos registrados: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar modelos registrados",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({
        modelo: item.modelo || 'N/A',
        modelo_id: item.modelo_id || ''
      }))
    });
  });
});

// ==========================================
// Hanaro Scrap - Origens Únicas (para filtro)
// ==========================================
// Retorna apenas origens que já têm registros APROVADOS
router.get("/api/hanaro-origens-registradas", requireScreen, (req, res) => {
  const { dataInicio, dataFim, modelo } = req.query;
  
  let query = `
    SELECT DISTINCT origem_nome as origem, origem_id
    FROM hanaro_scrap
    WHERE status = 'Aprovado' AND origem_nome IS NOT NULL AND origem_nome != ''
  `;
  
  const params = [];
  const conditions = [];
  
  // Filtro de data
  if (dataInicio && dataFim) {
    conditions.push("DATE(data_hora) BETWEEN ? AND ?");
    params.push(dataInicio, dataFim);
  }
  
  // Filtro de modelo
  if (modelo) {
    conditions.push("modelo_nome = ?");
    params.push(modelo);
  }
  
  if (conditions.length > 0) {
    query += " AND " + conditions.join(" AND ");
  }
  
  query += " ORDER BY origem_nome ASC";
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar origens registradas: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar origens registradas",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({
        origem: item.origem || 'N/A',
        origem_id: item.origem_id || ''
      }))
    });
  });
});
module.exports = router;
