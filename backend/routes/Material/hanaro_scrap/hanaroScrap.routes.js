const express = require("express");
const router = express.Router();
const db = require("../../../config/db");

const axios = require("axios");

router.get("/getOrigens", (req, res) => {
  let query = `SELECT id, Origem as nome FROM hanaro_origem ORDER BY Origem ASC`;
  
  db.query(query, (err, result) => {
    if (err) {
      console.error("Erro ao buscar origens: ", err);
      return res.status(500).json({ message: "Erro ao buscar origens", error: err });
    }
    res.status(200).json(result);
  });
});

// ==========================================
// Hanaro Scrap - Equipamentos
// ==========================================
router.get("/getEquipamentos", (req, res) => {
  let query = `SELECT id, Equipamentos as nome FROM hanaro_equip ORDER BY Equipamentos ASC`;
  
  db.query(query, (err, result) => {
    if (err) {
      console.error("Erro ao buscar equipamentos: ", err);
      return res.status(500).json({ message: "Erro ao buscar equipamentos", error: err });
    }
    res.status(200).json(result);
  });
});

// ==========================================
// Hanaro Scrap - Causas
// ==========================================
router.get("/getCausas", (req, res) => {
  let query = `SELECT id, Causas as nome FROM hanaro_causas ORDER BY Causas ASC`;
  
  db.query(query, (err, result) => {
    if (err) {
      console.error("Erro ao buscar causas: ", err);
      return res.status(500).json({ message: "Erro ao buscar causas", error: err });
    }
    res.status(200).json(result);
  });
});

// ----------------------------------------Custo de Placas----------------------------------------
router.get("/api/custo-placa", (req, res) => {
  try {
    const { modelo, tipoPlaca } = req.query;
    
    if (!modelo || !tipoPlaca) {
      return res.status(400).json({ error: 'Modelo e tipoPlaca são obrigatórios' });
    }

    // Query otimizada que usa CASE para selecionar a coluna apropriada
    // Faz matching exato do modelo selecionado (sem tratamento adicional)
    const query = `
      SELECT 
        CASE 
          WHEN ? = 'Bot' THEN fase_bottom
          WHEN ? = 'Top' THEN fase_top
          WHEN ? = 'Limpa' THEN placa_limpa
          ELSE NULL
        END AS custo_unitario
      FROM hanaro_halb_custo 
      WHERE modelo = ?
        AND (
          (? = 'Bot' AND fase_bottom IS NOT NULL AND fase_bottom > 0) OR
          (? = 'Top' AND fase_top IS NOT NULL AND fase_top > 0) OR
          (? = 'Limpa' AND placa_limpa IS NOT NULL AND placa_limpa > 0)
        )
      LIMIT 1
    `;

    const params = [
      tipoPlaca, tipoPlaca, tipoPlaca, 
      modelo, // modelo = ? (usa diretamente o modelo selecionado)
      tipoPlaca, tipoPlaca, tipoPlaca
    ];
    
    db.execute(query, params, (err, results) => {
      if (err) {
        console.error('Erro ao buscar custo:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      if (results.length > 0 && results[0].custo_unitario !== null) {
        // Converter string com vírgula para número (formato brasileiro)
        const custoString = results[0].custo_unitario.toString();
        const custoNumerico = parseFloat(custoString.replace(',', '.')) || 0;
        // Garantir que o valor tenha 2 casas decimais
        res.json({ custo_unitario: Number(custoNumerico.toFixed(2)) });
      } else {
        res.json({ custo_unitario: 0 });
      }
    });
  } catch (error) {
    console.error('Erro ao buscar custo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ----------------------------------------Modelos de Custo----------------------------------------
router.get("/api/modelos-custo", (req, res) => {
  try {
    const query = `
      SELECT DISTINCT modelo, halb 
      FROM hanaro_halb_custo 
      WHERE (fase_bottom IS NOT NULL AND fase_bottom > 0) 
         OR (fase_top IS NOT NULL AND fase_top > 0) 
         OR (placa_limpa IS NOT NULL AND placa_limpa > 0)
      ORDER BY modelo ASC
    `;
    
    db.execute(query, (err, results) => {
      if (err) {
        console.error('Erro ao buscar modelos de custo:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      if (!results || results.length === 0) {
        return res.json({ modelos: [] });
      }
      
      const modelos = results.map(row => ({
        modelo: row.modelo || '',
        halb: row.halb || ''
      }));
      
      res.json({ modelos });
    });
  } catch (error) {
    console.error('Erro ao buscar modelos de custo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Função para enviar email via Agent IA quando um scrap for registrado
// OTIMIZADA: Fire-and-forget + timeout de 10s + sem logs
const enviarEmailNotificacaoScrap = async (scrapData) => {
  const API_KEY = process.env.HANARO_SCRAP_AGENT_API_KEY;
  const BASE_URL = process.env.HANARO_SCRAP_AGENT_URL;
  const FLOW_ID = process.env.HANARO_SCRAP_AGENT_FLOW_ID;

  if (!API_KEY || !BASE_URL || !FLOW_ID) {
    return;
  }

  const prompt = `Foi registrado um novo Hanaro Scrap que precisa de aprovação.
    
DADOS DO REGISTRO:
- ID: ${scrapData.id}
- Modelo: ${scrapData.modelo_nome || 'N/A'}
- Linha: ${scrapData.linha_nome || 'N/A'}
- Turno: ${scrapData.turno || 'N/A'}
- Tipo: ${scrapData.tipo_scrap || 'N/A'}
- Quantidade: ${scrapData.qty || 0} unidades
- Custo Unitário: R$ ${parseFloat(scrapData.custo_unitario || 0).toFixed(2)}
- Custo Total: R$ ${parseFloat(scrapData.custo_total || 0).toFixed(2)}
- Registrado por: ${scrapData.nome_operador || 'N/A'} (${scrapData.matricula})
- Data: ${new Date().toLocaleString('pt-BR')}

Por favor, envie um email de notificação para aprovação.
- Aprovador: f.miguel@samsung.com
- Copia (CC): f.jarlenj@samsung.com
- Assunto: Aprovação de Hanaro Scrap - Modelo ${scrapData.modelo_nome || 'N/A'}
- Tom: Formal e profissional
- Incluir todos os dados acima no corpo do email`;

  const url = `${BASE_URL}/api/v1/run/${FLOW_ID}?stream=false`;

  // Fire-and-forget: não espera resposta, timeout de 10s para fila do Agent
  axios.post(url, {
    input_type: "chat",
    output_type: "text",
    input_value: prompt
  }, {
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    timeout: 10000
  }).catch(() => {}); // Silencioso - erros não afetam o registro
};

// Rota para verificar CN duplicada
// Agora suporta múltiplas CNs separadas por ';' no banco de dados
// A busca usa LIKE para encontrar a CN dentro de uma string com múltiplas CNs
router.get("/api/hanaro-scrap/verificar-cn/:cn", (req, res) => {
  const { cn } = req.params;

  if (!cn || cn.length !== 13) {
    return res.status(400).json({ 
      success: false, 
      message: "CN inválida. Deve conter 13 caracteres." 
    });
  }

  // Buscar usando LIKE para encontrar a CN em qualquer posição da string
  // Pode estar sozinha (cn) ou no início (cn;...), meio (...;cn;...) ou fim (...;cn)
  const query = "SELECT id, cn FROM hanaro_scrap WHERE cn = ? OR cn LIKE ? OR cn LIKE ? OR cn LIKE ?";
  const params = [
    cn,                    // CN sozinha: "ABC1234567890"
    `${cn};%`,            // CN no início: "ABC1234567890;XYZ..."
    `%;${cn};%`,          // CN no meio: "...;ABC1234567890;XYZ..."
    `%;${cn}`             // CN no fim: "...;ABC1234567890"
  ];

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Erro ao verificar CN duplicada:', err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao verificar CN duplicada" 
      });
    }

    const duplicada = results && results.length > 0;
    
    res.json({ 
      success: true, 
      duplicada: duplicada,
      message: duplicada ? "CN já registrada" : "CN disponível"
    });
  });
});

// Rota para salvar registro de scrap
router.post("/api/hanaro-scrap", async (req, res) => {
  const {
    matricula,
    nome_operador,
    tipo_scrap,
    tipo_placa,
    modelo_id,
    modelo_nome,
    halb,
    qty,
    custo_unitario,
    custo_total,
    linha_id,
    linha_nome,
    turno,
    planta_id,
    planta_nome,
    origem_id,
    origem_nome,
    equipamento_id,
    equipamento_nome,
    causa_id,
    causa_nome,
    causa_raiz,
    acao_corretiva,
    contramedida,
    cn
  } = req.body;

  // Validação de campos obrigatórios
  if (!matricula || !tipo_scrap || !tipo_placa || !modelo_id || !linha_id || !turno) {
    return res.status(400).json({ 
      success: false, 
      message: "Campos obrigatórios não preenchidos: matricula, tipo_scrap, tipo_placa, modelo_id, linha_id, turno" 
    });
  }

  // Processar CN: pode vir como string única, array de strings, ou string separada por ';'
  let cnFinal = null;
  if (cn) {
    if (Array.isArray(cn)) {
      // Se for array, juntar com ';'
      cnFinal = cn.filter(c => c && c.trim()).join(';') || null;
    } else if (typeof cn === 'string') {
      // Se for string, usar diretamente (já pode conter ';' se vier do frontend)
      cnFinal = cn.trim() || null;
    }
  }

  const query = "INSERT INTO hanaro_scrap SET ?";

  const values = {
    matricula: matricula,
    nome_operador: nome_operador,
    tipo_scrap: tipo_scrap,
    tipo_placa: tipo_placa,
    modelo_id: modelo_id,
    modelo_nome: modelo_nome,
    halb: halb,
    qty: qty || 1,
    custo_unitario: custo_unitario || 0,
    custo_total: custo_total || 0,
    linha_id: linha_id,
    linha_nome: linha_nome,
    turno: turno,
    planta_id: planta_id,
    planta_nome: planta_nome,
    origem_id: origem_id,
    origem_nome: origem_nome,
    equipamento_id: equipamento_id,
    equipamento_nome: equipamento_nome,
    causa_id: causa_id,
    causa_nome: causa_nome,
    causa_raiz: causa_raiz,
    acao_corretiva: acao_corretiva,
    contramedida: contramedida,
    cn: cnFinal,
    status: 'Pendente'
  };

  try {
    const result = await new Promise((resolve, reject) => {
      db.query(query, values, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    // Enviar email de notificação após salvar o registro
    const scrapData = {
      id: result.insertId,
      modelo_nome,
      linha_nome,
      turno,
      tipo_scrap,
      qty,
      custo_unitario,
      custo_total,
      nome_operador,
      matricula
    };

    // Envia email em background (fire-and-forget, silencioso)
    enviarEmailNotificacaoScrap(scrapData);

    res.status(201).json({ 
      success: true, 
      message: "Registro de scrap salvo com sucesso!", 
      id: result.insertId 
    });
  } catch (err) {
    console.error("Erro ao salvar registro de scrap: ", err);
    return res.status(500).json({ 
      success: false, 
      message: "Erro ao salvar registro de scrap", 
      error: err.message 
    });
  }
});

// Rota para buscar histórico de registros de scrap
router.get("/api/hanaro-scrap", (req, res) => {
  const { 
    dataInicio, 
    dataFim, 
    linha, 
    turno, 
    status,
    modelo,
    limit = 100,
    offset = 0
  } = req.query;

  let query = "SELECT * FROM hanaro_scrap WHERE 1=1";
  const params = [];

  if (dataInicio && dataFim) {
    query += " AND DATE(data_hora) BETWEEN ? AND ?";
    params.push(dataInicio, dataFim);
  }

  if (linha) {
    query += " AND linha_id = ?";
    params.push(linha);
  }

  if (turno) {
    query += " AND turno = ?";
    params.push(turno);
  }

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }

  if (modelo) {
    query += " AND modelo_id LIKE ?";
    params.push(`%${modelo}%`);
  }

  query += " ORDER BY data_hora DESC LIMIT ? OFFSET ?";
  params.push(parseInt(limit), parseInt(offset));

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Erro ao buscar registros de scrap: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar registros de scrap", 
        error: err.message 
      });
    }

    // Contar total de registros para paginação
    let countQuery = "SELECT COUNT(*) as total FROM hanaro_scrap WHERE 1=1";
    const countParams = [];

    if (dataInicio && dataFim) {
      countQuery += " AND DATE(data_hora) BETWEEN ? AND ?";
      countParams.push(dataInicio, dataFim);
    }

    if (linha) {
      countQuery += " AND linha_id = ?";
      countParams.push(linha);
    }

    if (turno) {
      countQuery += " AND turno = ?";
      countParams.push(turno);
    }

    if (status) {
      countQuery += " AND status = ?";
      countParams.push(status);
    }

    if (modelo) {
      countQuery += " AND modelo_id LIKE ?";
      countParams.push(`%${modelo}%`);
    }

    db.query(countQuery, countParams, (countErr, countResult) => {
      if (countErr) {
        console.error("Erro ao contar registros: ", countErr);
        return res.status(500).json({ 
          success: false, 
          message: "Erro ao contar registros", 
          error: countErr.message 
        });
      }

      res.status(200).json({
        success: true,
        data: results,
        total: countResult[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    });
  });
});

// Rota para buscar um registro específico por ID
router.get("/api/hanaro-scrap/:id", (req, res) => {
  const { id } = req.params;

  const query = "SELECT * FROM hanaro_scrap WHERE id = ?";

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Erro ao buscar registro de scrap: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar registro de scrap", 
        error: err.message 
      });
    }

    if (results.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Registro não encontrado" 
      });
    }

    res.status(200).json({
      success: true,
      data: results[0]
    });
  });
});

// Rota para atualizar status do registro (aprovar/rejeitar)
router.put("/api/hanaro-scrap/:id/status", (req, res) => {
  const { id } = req.params;
  const { 
    status, 
    aprovado_por, 
    nome_aprovador, 
    observacao 
  } = req.body;

  // Validar status
  if (!['Aprovado', 'Rejeitado', 'Pendente'].includes(status)) {
    return res.status(400).json({ 
      success: false, 
      message: "Status inválido. Use: Aprovado, Rejeitado ou Pendente" 
    });
  }

  // Buscar status anterior
  const getStatusQuery = "SELECT status FROM hanaro_scrap WHERE id = ?";
  
  db.query(getStatusQuery, [id], (getStatusErr, getStatusResult) => {
    if (getStatusErr) {
      console.error("Erro ao buscar status anterior: ", getStatusErr);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar status anterior", 
        error: getStatusErr.message 
      });
    }

    if (getStatusResult.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Registro não encontrado" 
      });
    }

    const statusAnterior = getStatusResult[0].status;

    // Atualizar status
    const updateQuery = `
      UPDATE hanaro_scrap 
      SET status = ?, 
          data_aprovacao = CURRENT_TIMESTAMP, 
          aprovado_por = ?, 
          nome_aprovador = ?
      WHERE id = ?
    `;

    db.query(updateQuery, [status, aprovado_por, nome_aprovador, id], (updateErr, updateResult) => {
      if (updateErr) {
        console.error("Erro ao atualizar status: ", updateErr);
        return res.status(500).json({ 
          success: false, 
          message: "Erro ao atualizar status", 
          error: updateErr.message 
        });
      }

      // Inserir no histórico
      const historicoQuery = `
        INSERT INTO hanaro_scrap_historico 
        (scrap_id, status_anterior, status_novo, alterado_por, nome_alterador, observacao)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.query(historicoQuery, [id, statusAnterior, status, aprovado_por, nome_aprovador, observacao], (histErr) => {
        if (histErr) {
          console.error("Erro ao salvar histórico: ", histErr);
          // Não retorna erro, pois o status já foi atualizado
        }

        res.status(200).json({
          success: true,
          message: `Status atualizado para ${status} com sucesso!`,
          status_anterior: statusAnterior,
          status_novo: status
        });
      });
    });
  });
});



// Rota para buscar registros pendentes de aprovação
router.get("/api/hanaro-scrap/aprovacao/pendentes", (req, res) => {
  const { limit = 50, offset = 0 } = req.query;

  const query = `
    SELECT * FROM hanaro_scrap 
    WHERE status = 'Pendente' 
    ORDER BY data_hora DESC 
    LIMIT ? OFFSET ?
  `;

  db.query(query, [parseInt(limit), parseInt(offset)], (err, results) => {
    if (err) {
      console.error("Erro ao buscar registros pendentes: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar registros pendentes", 
        error: err.message 
      });
    }

    res.status(200).json({
      success: true,
      data: results
    });
  });
});

// Rota para deletar registro de scrap
router.delete("/api/hanaro-scrap/:id", (req, res) => {
  const { id } = req.params;

  // Verificar se o registro existe
  const checkQuery = "SELECT id FROM hanaro_scrap WHERE id = ?";

  db.query(checkQuery, [id], (checkErr, checkResult) => {
    if (checkErr) {
      console.error("Erro ao verificar registro: ", checkErr);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao verificar registro", 
        error: checkErr.message 
      });
    }

    if (checkResult.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Registro não encontrado" 
      });
    }

    // Deletar histórico primeiro
    const deleteHistoricoQuery = "DELETE FROM hanaro_scrap_historico WHERE scrap_id = ?";
    
    db.query(deleteHistoricoQuery, [id], (histErr) => {
      if (histErr) {
        console.error("Erro ao deletar histórico: ", histErr);
        // Continua mesmo com erro
      }

      // Deletar registro
      const deleteQuery = "DELETE FROM hanaro_scrap WHERE id = ?";
      
      db.query(deleteQuery, [id], (deleteErr, deleteResult) => {
        if (deleteErr) {
          console.error("Erro ao deletar registro: ", deleteErr);
          return res.status(500).json({ 
            success: false, 
            message: "Erro ao deletar registro", 
            error: deleteErr.message 
          });
        }

        res.status(200).json({
          success: true,
          message: "Registro deletado com sucesso"
        });
      });
    });
  });
});
module.exports = router;
