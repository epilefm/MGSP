const express = require("express");
const router = express.Router();
const db = require("../../config/db");
const { authorizeScreen } = require("../../auth/middleware");
const requireScreen = authorizeScreen('InspecMX');

// ==========================================
// Inspeção MX - Pessoas
// ==========================================
router.get("/getMXPessoas", requireScreen, (req, res) => {
  const { searchTerm } = req.query;

  let query = `SELECT nome, matricula FROM mydb.mx_pessoas WHERE 1=1`;
  const params = [];

  if (searchTerm && searchTerm.length >= 1) {
    query += ` AND nome LIKE ?`;
    params.push(`%${searchTerm}%`);
  }

  query += ` ORDER BY nome ASC LIMIT 30`;

  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar pessoas MX: ", err);
      return res.status(500).json({ message: "Erro ao buscar pessoas", error: err });
    }
    res.status(200).json(result);
  });
});

// ==========================================
// Inspeção MX - Failures
// ==========================================
router.get("/getMXFailures", requireScreen, (req, res) => {
  let query = `SELECT failures FROM mydb.mx_insp_screening_failures ORDER BY failures ASC`;

  db.query(query, (err, result) => {
    if (err) {
      console.error("Erro ao buscar failures MX: ", err);
      return res.status(500).json({ message: "Erro ao buscar failures", error: err });
    }
    res.status(200).json(result);
  });
});

// ==========================================
// Inspeção MX - Cores
// ==========================================
router.get("/getMXColors", requireScreen, (req, res) => {
  let query = `SELECT code, cor FROM mydb.mx_insp_screening_collor ORDER BY cor ASC`;

  db.query(query, (err, result) => {
    if (err) {
      console.error("Erro ao buscar cores MX: ", err);
      return res.status(500).json({ message: "Erro ao buscar cores", error: err });
    }
    res.status(200).json(result);
  });
});

// ==========================================
// Inspeção MX - Histórico
// ==========================================
router.get("/getMXInsp", requireScreen, (req, res) => {
  const { dataInicio, dataFim, modelo, tnp } = req.query;

  // Query otimizada que já faz o matching de custos no backend
  // Usando subquery para pegar apenas o primeiro valor de custo unitário de cada part
  let query = `
    SELECT
      i.id,
      i.nome,
      i.modelo,
      i.Halb,
      i.part,
      i.cor,
      i.failure_test,
      i.place,
      i.qty_inspec,
      i.qty_defect,
      i.qrcode,
      DATE_FORMAT(i.data_hora, '%Y-%m-%d %H:%i:%s') as data_hora,
      (SELECT REPLACE(valor_unit, ',', '.') FROM mx_insp_screening_custofront
       WHERE basico = i.modelo AND material = i.part
       LIMIT 1) as custo_unitario
    FROM mx_insp_screening i
    WHERE 1=1
  `;

  const params = [];

  if (dataInicio && dataFim) {
    query += ` AND DATE(i.data_hora) BETWEEN ? AND ?`;
    params.push(dataInicio, dataFim);
  } else {
    // Por padrão, buscar do dia atual
    query += ` AND DATE(i.data_hora) = CURDATE()`;
  }

  if (modelo) {
    query += ` AND i.modelo = ?`;
    params.push(modelo);
  }

  // Filtro TNP/SEC baseado na descrição da tabela de custo
  if (tnp && tnp !== 'todos') {
    if (tnp === 'tnp') {
      query += ` AND EXISTS (SELECT 1 FROM mx_insp_screening_custofront c WHERE c.basico = i.modelo AND c.material = i.part AND UPPER(c.descricao) LIKE '%JDM%')`;
    } else if (tnp === 'sec') {
      query += ` AND NOT EXISTS (SELECT 1 FROM mx_insp_screening_custofront c WHERE c.basico = i.modelo AND c.material = i.part AND UPPER(c.descricao) LIKE '%JDM%')`;
    }
  }

  query += ` ORDER BY i.id DESC`;

  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar histórico MX Insp: ", err);
      return res.status(500).json({ message: "Erro ao buscar histórico", error: err });
    }
    res.status(200).json(result);
  });
});

// ==========================================
// Inspeção MX - Registro
// ==========================================
router.post("/registerMXInsp", requireScreen, (req, res) => {
  const { nome, modelo, Halb, part, cor, failure_test, place, qty_inspec, qty_defect, qrcode, data_hora } = req.body;

  if (!nome || !modelo || !part || !cor || qty_inspec === undefined) {
    return res.status(400).json({ message: "Campos obrigatórios não preenchidos" });
  }

  const query = `INSERT INTO mx_insp_screening (nome, modelo, Halb, part, cor, failure_test, place, qty_inspec, qty_defect, qrcode, data_hora) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(query, [nome, modelo, Halb || '', part, cor, failure_test || '', place || '', qty_inspec, qty_defect || 0, qrcode || '', data_hora], (err, result) => {
    if (err) {
      console.error("Erro ao salvar registro MX Insp: ", err);
      return res.status(500).json({ message: "Erro ao salvar registro", error: err });
    }
    res.status(200).json({ message: "Registro salvo com sucesso", id: result.insertId });
  });
});

// ==========================================
// Inspeção MX - Parts (CRUD)
// ==========================================

// Parts - Listar
router.get("/getMXParts", requireScreen, (req, res) => {
  const query = `SELECT id, part FROM mydb.mx_insp_screening_part ORDER BY part ASC`;

  db.query(query, (err, result) => {
    if (err) {
      console.error("Erro ao buscar parts MX: ", err);
      return res.status(500).json({ message: "Erro ao buscar parts", error: err });
    }
    res.status(200).json(result);
  });
});

// Parts - Listar por modelo
router.get("/getMXPartsByModel", requireScreen, (req, res) => {
  const { modelo } = req.query;

  if (!modelo) {
    return res.status(400).json({ message: "Modelo é obrigatório" });
  }

  // Etapa 1: Tentar matching exato do modelo
  const exactQuery = `
    SELECT DISTINCT material as part
    FROM mydb.mx_insp_screening_custofront
    WHERE basico = ? AND material IS NOT NULL AND material != ''
    ORDER BY material ASC
  `;

  db.query(exactQuery, [modelo], (err, exactResult) => {
    if (err) {
      console.error("Erro ao buscar parts por modelo (exato): ", err);
      return res.status(500).json({ message: "Erro ao buscar parts", error: err });
    }

    // Se encontrou parts com matching exato, retornar
    if (exactResult && exactResult.length > 0) {
      return res.status(200).json(exactResult);
    }

    // Etapa 2: Tentar busca flexível (modelo sem sufixos -T, -B)
    const modeloBase = modelo.replace(/-T$|-B$/i, '');

    const flexQuery = `
      SELECT DISTINCT material as part
      FROM mydb.mx_insp_screening_custofront
      WHERE basico LIKE CONCAT(?, '%') AND material IS NOT NULL AND material != ''
      ORDER BY material ASC
    `;

    db.query(flexQuery, [modeloBase], (err, flexResult) => {
      if (err) {
        console.error("Erro ao buscar parts por modelo (flexível): ", err);
        return res.status(500).json({ message: "Erro ao buscar parts", error: err });
      }

      // Se encontrou parts com busca flexível, retornar
      if (flexResult && flexResult.length > 0) {
        return res.status(200).json(flexResult);
      }

      // Etapa 3: Se não encontrou nada, retornar todos os parts disponíveis
      const allPartsQuery = `
        SELECT id, part FROM mydb.mx_insp_screening_part ORDER BY part ASC
      `;

      db.query(allPartsQuery, (err, allPartsResult) => {
        if (err) {
          console.error("Erro ao buscar todos os parts: ", err);
          return res.status(500).json({ message: "Erro ao buscar parts", error: err });
        }
        res.status(200).json(allPartsResult);
      });
    });
  });
});

// Descrições - Listar por modelo e part
router.get("/getMXDescricoesByModeloPart", requireScreen, (req, res) => {
  const { modelo, part } = req.query;

  if (!modelo) {
    return res.status(400).json({ message: "Modelo é obrigatório" });
  }

  // Buscar descrições filtradas por modelo e part (material)
  const query = `
    SELECT DISTINCT descricao
    FROM mydb.mx_insp_screening_custofront
    WHERE basico = ? AND material = ? AND descricao IS NOT NULL AND descricao != ''
    ORDER BY descricao ASC
  `;

  db.query(query, [modelo, part], (err, result) => {
    if (err) {
      console.error("Erro ao buscar descrições: ", err);
      return res.status(500).json({ message: "Erro ao buscar descrições", error: err });
    }
    res.status(200).json(result);
  });
});

// Modelos - Listar da tabela de custo (basico)
router.get("/getMXModelos", requireScreen, (req, res) => {
  const query = `
    SELECT DISTINCT basico as Basic_Model
    FROM mydb.mx_insp_screening_custofront
    WHERE basico IS NOT NULL AND basico != ''
    ORDER BY basico ASC
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.error("Erro ao buscar modelos: ", err);
      return res.status(500).json({ message: "Erro ao buscar modelos", error: err });
    }
    res.status(200).json(result);
  });
});

module.exports = router;
