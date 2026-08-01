const express = require("express");
const router = express.Router();
const db = require("../../config/db");

// ==========================================
// Inspeção MX - Administração (CRUD)
// ==========================================

// Autenticação de administrador
router.post("/admin/login", (req, res) => {
  const { senha } = req.body;

  // Senha de administrador fixa (em produção, usar hash e banco de dados)
  const senhaAdmin = "admin123";

  if (senha === senhaAdmin) {
    res.status(200).json({ message: "Autenticado com sucesso", authenticated: true });
  } else {
    res.status(401).json({ message: "Senha incorreta", authenticated: false });
  }
});

// Pessoas - Listar
router.get("/admin/mx_pessoas", (req, res) => {
  const query = `SELECT id, nome, matricula FROM mydb.mx_pessoas ORDER BY nome ASC`;

  db.query(query, (err, result) => {
    if (err) {
      console.error("Erro ao buscar pessoas MX: ", err);
      return res.status(500).json({ message: "Erro ao buscar pessoas", error: err });
    }
    res.status(200).json(result);
  });
});

// Pessoas - Inserir
router.post("/admin/mx_pessoas", (req, res) => {
  const { nome, matricula } = req.body;

  if (!nome || !matricula) {
    return res.status(400).json({ message: "Nome e matrícula são obrigatórios" });
  }

  const query = `INSERT INTO mydb.mx_pessoas (nome, matricula) VALUES (?, ?)`;

  db.query(query, [nome, matricula], (err, result) => {
    if (err) {
      console.error("Erro ao inserir pessoa MX: ", err);
      return res.status(500).json({ message: "Erro ao inserir pessoa", error: err });
    }
    res.status(200).json({ message: "Pessoa inserida com sucesso", id: result.insertId });
  });
});

// Pessoas - Atualizar
router.put("/admin/mx_pessoas/:id", (req, res) => {
  const { id } = req.params;
  const { nome, matricula } = req.body;

  if (!nome || !matricula) {
    return res.status(400).json({ message: "Nome e matrícula são obrigatórios" });
  }

  const query = `UPDATE mydb.mx_pessoas SET nome = ?, matricula = ? WHERE id = ?`;

  db.query(query, [nome, matricula, id], (err, result) => {
    if (err) {
      console.error("Erro ao atualizar pessoa MX: ", err);
      return res.status(500).json({ message: "Erro ao atualizar pessoa", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Pessoa não encontrada" });
    }
    res.status(200).json({ message: "Pessoa atualizada com sucesso" });
  });
});

// Pessoas - Deletar
router.delete("/admin/mx_pessoas/:id", (req, res) => {
  const { id } = req.params;

  const query = `DELETE FROM mydb.mx_pessoas WHERE id = ?`;

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Erro ao deletar pessoa MX: ", err);
      return res.status(500).json({ message: "Erro ao deletar pessoa", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Pessoa não encontrada" });
    }
    res.status(200).json({ message: "Pessoa deletada com sucesso" });
  });
});

// Failures - Listar
router.get("/admin/mx_failures", (req, res) => {
  const query = `SELECT id, failures FROM mydb.mx_insp_screening_failures ORDER BY failures ASC`;

  db.query(query, (err, result) => {
    if (err) {
      console.error("Erro ao buscar failures MX: ", err);
      return res.status(500).json({ message: "Erro ao buscar failures", error: err });
    }
    res.status(200).json(result);
  });
});

// Failures - Inserir
router.post("/admin/mx_failures", (req, res) => {
  const { failures } = req.body;

  if (!failures) {
    return res.status(400).json({ message: "Failure é obrigatório" });
  }

  const query = `INSERT INTO mydb.mx_insp_screening_failures (failures) VALUES (?)`;

  db.query(query, [failures], (err, result) => {
    if (err) {
      console.error("Erro ao inserir failure MX: ", err);
      return res.status(500).json({ message: "Erro ao inserir failure", error: err });
    }
    res.status(200).json({ message: "Failure inserido com sucesso", id: result.insertId });
  });
});

// Failures - Atualizar
router.put("/admin/mx_failures/:id", (req, res) => {
  const { id } = req.params;
  const { failures } = req.body;

  if (!failures) {
    return res.status(400).json({ message: "Failure é obrigatório" });
  }

  const query = `UPDATE mydb.mx_insp_screening_failures SET failures = ? WHERE id = ?`;

  db.query(query, [failures, id], (err, result) => {
    if (err) {
      console.error("Erro ao atualizar failure MX: ", err);
      return res.status(500).json({ message: "Erro ao atualizar failure", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Failure não encontrado" });
    }
    res.status(200).json({ message: "Failure atualizado com sucesso" });
  });
});

// Failures - Deletar
router.delete("/admin/mx_failures/:id", (req, res) => {
  const { id } = req.params;

  const query = `DELETE FROM mydb.mx_insp_screening_failures WHERE id = ?`;

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Erro ao deletar failure MX: ", err);
      return res.status(500).json({ message: "Erro ao deletar failure", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Failure não encontrado" });
    }
    res.status(200).json({ message: "Failure deletado com sucesso" });
  });
});

// Cores - Listar
router.get("/admin/mx_cores", (req, res) => {
  const query = `SELECT id, code, cor FROM mydb.mx_insp_screening_collor ORDER BY cor ASC`;

  db.query(query, (err, result) => {
    if (err) {
      console.error("Erro ao buscar cores MX: ", err);
      return res.status(500).json({ message: "Erro ao buscar cores", error: err });
    }
    res.status(200).json(result);
  });
});

// Cores - Inserir
router.post("/admin/mx_cores", (req, res) => {
  const { code, cor } = req.body;

  if (!code || !cor) {
    return res.status(400).json({ message: "Code e cor são obrigatórios" });
  }

  const query = `INSERT INTO mydb.mx_insp_screening_collor (code, cor) VALUES (?, ?)`;

  db.query(query, [code, cor], (err, result) => {
    if (err) {
      console.error("Erro ao inserir cor MX: ", err);
      return res.status(500).json({ message: "Erro ao inserir cor", error: err });
    }
    res.status(200).json({ message: "Cor inserida com sucesso", id: result.insertId });
  });
});

// Cores - Atualizar
router.put("/admin/mx_cores/:id", (req, res) => {
  const { id } = req.params;
  const { code, cor } = req.body;

  if (!code || !cor) {
    return res.status(400).json({ message: "Code e cor são obrigatórios" });
  }

  const query = `UPDATE mydb.mx_insp_screening_collor SET code = ?, cor = ? WHERE id = ?`;

  db.query(query, [code, cor, id], (err, result) => {
    if (err) {
      console.error("Erro ao atualizar cor MX: ", err);
      return res.status(500).json({ message: "Erro ao atualizar cor", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Cor não encontrada" });
    }
    res.status(200).json({ message: "Cor atualizada com sucesso" });
  });
});

// Cores - Deletar
router.delete("/admin/mx_cores/:id", (req, res) => {
  const { id } = req.params;

  const query = `DELETE FROM mydb.mx_insp_screening_collor WHERE id = ?`;

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Erro ao deletar cor MX: ", err);
      return res.status(500).json({ message: "Erro ao deletar cor", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Cor não encontrada" });
    }
    res.status(200).json({ message: "Cor deletada com sucesso" });
  });
});

// Parts - Listar (para admin)
router.get("/admin/mx_parts", (req, res) => {
  const query = `SELECT id, part FROM mydb.mx_insp_screening_part ORDER BY part ASC`;

  db.query(query, (err, result) => {
    if (err) {
      console.error("Erro ao buscar parts MX: ", err);
      return res.status(500).json({ message: "Erro ao buscar parts", error: err });
    }
    res.status(200).json(result);
  });
});

// Parts - Inserir
router.post("/admin/mx_parts", (req, res) => {
  const { part } = req.body;

  if (!part) {
    return res.status(400).json({ message: "Part é obrigatório" });
  }

  const query = `INSERT INTO mydb.mx_insp_screening_part (part) VALUES (?)`;

  db.query(query, [part], (err, result) => {
    if (err) {
      console.error("Erro ao inserir part MX: ", err);
      return res.status(500).json({ message: "Erro ao inserir part", error: err });
    }
    res.status(200).json({ message: "Part inserido com sucesso", id: result.insertId });
  });
});

// Parts - Atualizar
router.put("/admin/mx_parts/:id", (req, res) => {
  const { id } = req.params;
  const { part } = req.body;

  if (!part) {
    return res.status(400).json({ message: "Part é obrigatório" });
  }

  const query = `UPDATE mydb.mx_insp_screening_part SET part = ? WHERE id = ?`;

  db.query(query, [part, id], (err, result) => {
    if (err) {
      console.error("Erro ao atualizar part MX: ", err);
      return res.status(500).json({ message: "Erro ao atualizar part", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Part não encontrado" });
    }
    res.status(200).json({ message: "Part atualizado com sucesso" });
  });
});

// Parts - Deletar
router.delete("/admin/mx_parts/:id", (req, res) => {
  const { id } = req.params;

  const query = `DELETE FROM mydb.mx_insp_screening_part WHERE id = ?`;

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Erro ao deletar part MX: ", err);
      return res.status(500).json({ message: "Erro ao deletar part", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Part não encontrado" });
    }
    res.status(200).json({ message: "Part deletado com sucesso" });
  });
});

// Custos - Listar
router.get("/admin/mx_custos", (req, res) => {
  const query = `SELECT id, basico as Basic_Model, material as Part, descricao as Descricao, valor_unit as Valor_Unitario FROM mydb.mx_insp_screening_custofront ORDER BY basico ASC, material ASC`;

  db.query(query, (err, result) => {
    if (err) {
      console.error("Erro ao buscar custos MX: ", err);
      return res.status(500).json({ message: "Erro ao buscar custos", error: err });
    }
    res.status(200).json(result);
  });
});

// Custos - Inserir
router.post("/admin/mx_custos", (req, res) => {
  const { Basic_Model, Part, Descricao, Valor_Unitario } = req.body;

  if (!Basic_Model || !Part || !Descricao || Valor_Unitario === undefined || Valor_Unitario === null) {
    return res.status(400).json({ message: "Todos os campos são obrigatórios" });
  }

  const valorNumerico = parseFloat(Valor_Unitario);
  if (isNaN(valorNumerico) || valorNumerico < 0) {
    return res.status(400).json({ message: "Valor deve ser um número válido e não negativo" });
  }

  const query = `INSERT INTO mydb.mx_insp_screening_custofront (basico, material, descricao, valor_unit) VALUES (?, ?, ?, ?)`;

  db.query(query, [Basic_Model, Part, Descricao, valorNumerico], (err, result) => {
    if (err) {
      console.error("Erro ao inserir custo MX: ", err);
      return res.status(500).json({ message: "Erro ao inserir custo", error: err });
    }
    res.status(200).json({ message: "Custo inserido com sucesso", id: result.insertId });
  });
});

// Custos - Atualizar
router.put("/admin/mx_custos/:id", (req, res) => {
  const { id } = req.params;
  const { Basic_Model, Part, Descricao, Valor_Unitario } = req.body;

  if (!Basic_Model || !Part || !Descricao || Valor_Unitario === undefined || Valor_Unitario === null) {
    return res.status(400).json({ message: "Todos os campos são obrigatórios" });
  }

  const valorNumerico = parseFloat(Valor_Unitario);
  if (isNaN(valorNumerico) || valorNumerico < 0) {
    return res.status(400).json({ message: "Valor deve ser um número válido e não negativo" });
  }

  const query = `UPDATE mydb.mx_insp_screening_custofront SET basico = ?, material = ?, descricao = ?, valor_unit = ? WHERE id = ?`;

  db.query(query, [Basic_Model, Part, Descricao, valorNumerico, id], (err, result) => {
    if (err) {
      console.error("Erro ao atualizar custo MX: ", err);
      return res.status(500).json({ message: "Erro ao atualizar custo", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Custo não encontrado" });
    }
    res.status(200).json({ message: "Custo atualizado com sucesso" });
  });
});

// Custos - Deletar
router.delete("/admin/mx_custos/:id", (req, res) => {
  const { id } = req.params;

  const query = `DELETE FROM mydb.mx_insp_screening_custofront WHERE id = ?`;

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Erro ao deletar custo MX: ", err);
      return res.status(500).json({ message: "Erro ao deletar custo", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Custo não encontrado" });
    }
    res.status(200).json({ message: "Custo deletado com sucesso" });
  });
});

module.exports = router;
