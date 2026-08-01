const express = require("express");
const router = express.Router();
const db = require("../../config/db");
const { authorizeScreen } = require("../../auth/middleware");
const requireScreen = authorizeScreen(['ListaEntradaWIP', 'InputScreenEntrada']);
const { determinarTurno } = require("../../shared/turno");

////----------------------------------------------------------------------------------------*********
// Nova Tela de Entrada e saida de material para o WIP
// ********

router.post("/saveEntradawip", requireScreen, (req, res) => {
  const { products, line, prodOrder, model, halb, plant, keep, planQty } = req.body;

  console.log('Recebendo requisição para salvar produtos:', { products, line, prodOrder, model, halb, plant, keep, planQty });

  // Verificar se products é um array
  if (!Array.isArray(products)) {
    console.log('Erro: Products não é um array');
    return res.status(400).json({ error: "Products deve ser um array" });
  }

  // Obter a data atual no formato YYYY-MM-DD
  const currentDate = new Date().toISOString().split('T')[0];

  // Determinar o turno automaticamente com base no horário atual
  const turnoAtual = determinarTurno();

  // Preparar os dados para inserção
  const values = products.map(product => [
    currentDate,  // date
    line,  // line (valor do plano de produção)
    prodOrder,  // prod_order (valor do plano de produção)
    model,  // model (valor do plano de produção)
    halb,  // halb (valor do plano de produção)
    plant,  // plant (valor do plano de produção)
    keep,  // keep (valor do plano de produção)
    planQty,  // plan_qty (valor do plano de produção)
    product.reelId,
    product.barcode,
    product.partNumber,
    product.quantity,
    turnoAtual  // Turno determinado automaticamente
  ]);

  console.log('Dados preparados para inserção:', values);

  // Query para inserção dos dados
  const query = `INSERT INTO entradawip2 (date, line, prod_order, model, halb, plant, keep, plan_qty, reel_id, barcode, part_number, qty, shift) VALUES ?`;

  db.query(query, [values], (err, result) => {
    if (err) {
      console.error("Erro ao salvar dados: ", err);
      return res.status(500).json({ error: "Erro ao salvar dados", details: err.message });
    }
    console.log('Dados salvos com sucesso:', result);
    res.status(200).json({ message: "Dados salvos com sucesso", result, turno: turnoAtual });
  });
});

// Rota alternativa para salvar dados da tela EntMaterial2
router.post("/saveEntradawipAlternative", requireScreen, (req, res) => {
  const { products, turno } = req.body;

  // Verificar se products é um array
  if (!Array.isArray(products)) {
    return res.status(400).json({ error: "Products deve ser um array" });
  }

  // Preparar os dados para inserção
  const values = products.map(product => [
    product.reelId,
    product.barcode,
    product.partNumber,
    product.quantity,
    turno,  // Usar o turno do corpo da requisição
    product.shift || '1T'  // Usar o shift do produto ou '1T' como padrão
  ]);

  // Query para inserção dos dados
  const query = `INSERT INTO entradawip2 (reel_id, barcode, part_number, qty, turno, shift) VALUES ?`;

  db.query(query, [values], (err, result) => {
    if (err) {
      console.error("Erro ao salvar dados (alternativo): ", err);
      return res.status(500).json({ error: "Erro ao salvar dados", details: err.message });
    }
    res.status(200).json({ message: "Dados salvos com sucesso", result });
  });
});

// Rota para verificar se o Reel ID já existe no banco de dados
router.get("/checkReelId/:reelId", requireScreen, (req, res) => {
  const { reelId } = req.params;

  // Query para verificar se o Reel ID existe
  const query = `SELECT COUNT(*) AS count FROM entradawip2 WHERE reel_id = ?`;

  db.query(query, [reelId], (err, result) => {
    if (err) {
      console.error("Erro ao verificar Reel ID: ", err);
      return res.status(200).json({ exists: false }); // Retornar false em vez de erro
    }

    const exists = result[0].count > 0;
    res.status(200).json({ exists });
  });
});

// Rota para buscar todos os registros da tabela entradawip2
router.get("/getEntradawip", requireScreen, (req, res) => {
  // Query para buscar todos os registros
  const query = `SELECT * FROM entradawip2 ORDER BY created_at DESC`;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar registros: ", err);
      return res.status(500).json({ error: "Erro ao buscar registros" });
    }

    res.status(200).json(results);
  });
});

// Rota para confirmar a saída de registros
router.post("/confirmExit", requireScreen, (req, res) => {
  const { recordIds } = req.body;

  // Verificar se recordIds é um array válido
  if (!Array.isArray(recordIds) || recordIds.length === 0) {
    return res.status(400).json({ success: false, error: "Nenhum ID de registro fornecido" });
  }

  // Query para atualizar o status de confirmação de saída
  const query = `UPDATE entradawip2 SET confirmed_exit = TRUE WHERE id IN (?)`;

  db.query(query, [recordIds], (err, results) => {
    if (err) {
      console.error("Erro ao confirmar saída dos registros: ", err);
      return res.status(500).json({ success: false, error: "Erro ao confirmar saída dos registros" });
    }

    res.status(200).json({ success: true, message: `Saída confirmada para ${results.affectedRows} registro(s)` });
  });
});

module.exports = router;
