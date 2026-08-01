const express = require("express");
const router = express.Router();
const db = require("../../../config/db");
const { authorizeScreen } = require("../../../auth/middleware");
const requireScreen = authorizeScreen('HanaroScrap');

// ==========================================
// Hanaro Scrap - Aprovadores (Chefes/Gerentes)
// ==========================================
// Listar todos os aprovadores
router.get("/api/hanaro-aprovadores", requireScreen, (req, res) => {
  const query = `SELECT * FROM hanaro_aprovadores WHERE ativo = TRUE ORDER BY nome ASC`;
  
  db.query(query, (err, result) => {
    if (err) {
      console.error("Erro ao buscar aprovadores: ", err);
      return res.status(500).json({ success: false, message: "Erro ao buscar aprovadores" });
    }
    res.status(200).json({ success: true, data: result });
  });
});

// Adicionar aprovador
router.post("/api/hanaro-aprovadores", requireScreen, (req, res) => {
  const { matricula, nome, cargo, departamento } = req.body;
  
  if (!matricula || !nome) {
    return res.status(400).json({ success: false, message: "Matrícula e nome são obrigatórios" });
  }
  
  // Verificar se a matrícula existe na tabela de pessoas
  const checkPessoaQuery = `SELECT funcionarios FROM mydb.pessoas WHERE matricula = ?`;
  
  db.query(checkPessoaQuery, [matricula], (err, pessoaResult) => {
    if (err) {
      console.error("Erro ao verificar pessoa: ", err);
      return res.status(500).json({ success: false, message: "Erro ao verificar matrícula" });
    }
    
    // Inserir ou atualizar aprovador
    const insertQuery = `
      INSERT INTO hanaro_aprovadores (matricula, nome, cargo, departamento, ativo)
      VALUES (?, ?, ?, ?, TRUE)
      ON DUPLICATE KEY UPDATE
      nome = VALUES(nome),
      cargo = VALUES(cargo),
      departamento = VALUES(departamento),
      ativo = TRUE,
      updated_at = CURRENT_TIMESTAMP
    `;
    
    const nomeFinal = pessoaResult.length > 0 ? pessoaResult[0].funcionarios : nome;
    
    db.query(insertQuery, [matricula, nomeFinal, cargo || null, departamento || null], (err, result) => {
      if (err) {
        console.error("Erro ao adicionar aprovador: ", err);
        return res.status(500).json({ success: false, message: "Erro ao adicionar aprovador" });
      }
      res.status(200).json({ 
        success: true, 
        message: "Aprovador adicionado com sucesso",
        data: { id: result.insertId, matricula, nome: nomeFinal }
      });
    });
  });
});

// Remover aprovador (desativar)
router.delete("/api/hanaro-aprovadores/:matricula", requireScreen, (req, res) => {
  const { matricula } = req.params;
  
  const query = `UPDATE hanaro_aprovadores SET ativo = FALSE WHERE matricula = ?`;
  
  db.query(query, [matricula], (err, result) => {
    if (err) {
      console.error("Erro ao remover aprovador: ", err);
      return res.status(500).json({ success: false, message: "Erro ao remover aprovador" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Aprovador não encontrado" });
    }
    
    res.status(200).json({ success: true, message: "Aprovador removido com sucesso" });
  });
});

// Verificar se uma matrícula pode aprovar (seguindo padrão de verifyMatricula)
router.get("/verificar-aprovador/:matricula", requireScreen, (req, res) => {
  const { matricula } = req.params;
  
  const query = `
    SELECT a.*, p.funcionarios as nome_completo 
    FROM hanaro_aprovadores a
    LEFT JOIN mydb.pessoas p ON a.matricula = p.matricula
    WHERE a.matricula = ? AND a.ativo = 1
  `;
  
  db.query(query, [matricula], (err, result) => {
    if (err) {
      console.error("Erro ao verificar aprovador: ", err);
      return res.status(500).json({ success: false, message: "Erro ao verificar aprovador" });
    }
    
    if (result.length === 0) {
      return res.json({ 
        success: true, 
        podeAprovar: false, 
        message: "Esta matrícula não tem permissão para aprovar registros" 
      });
    }
    
    res.json({ 
      success: true, 
      podeAprovar: true, 
      aprovador: result[0],
      message: "Matrícula autorizada para aprovação" 
    });
  });
});
module.exports = router;
