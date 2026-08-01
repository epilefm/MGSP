const express = require("express");
const router = express.Router();
const db = require("../../../config/db");
const { authorizeScreen } = require("../../../auth/middleware");
const requireScreen = authorizeScreen('HoraDropW');

router.get("/drop_worst/current", requireScreen, async (req, res) => {
  let tempTableName = null;
  
  try {
    // Obter as datas da query string ou usar a data de hoje
    const startDate = req.query.startDate ? req.query.startDate.replace(/-/g, '') : new Date().toISOString().replace(/-/g, '').slice(0, 8);
    const endDate = req.query.endDate ? req.query.endDate.replace(/-/g, '') : startDate;
    
    // URL da API com as datas especificadas
    const apiUrl = `http://105.103.2.25/json/smd-material-tracking/?context=mxsmd-worstdrop&from=${startDate}&to=${endDate}`;
    
   // console.log(`Fetching drop worst data from: ${apiUrl}`);
    
    // Fazer requisição para a API com retry
    let response;
    try {
      response = await fetchWithRetry(apiUrl);
    } catch (error) {
      console.error('Erro de conexão com a API:', error.message);
      return res.status(503).json({
        success: false,
        message: 'Erro de conexão com a API de dados',
        error: error.message
      });
    }
    
    // Verificar se a resposta tem o formato esperado
    if (response.data && Array.isArray(response.data)) {
      // Criar tabela temporária com nome único para evitar conflitos em ambiente multiusuário
      tempTableName = generateTempTableName();
      const createTempTableQuery = `
        CREATE TEMPORARY TABLE ${tempTableName} (
          PLANT_CODE VARCHAR(255),
          LINE_NM VARCHAR(255),
          MODEL_CODE VARCHAR(255),
          LINE_EQSEQ VARCHAR(255),
          LOC VARCHAR(255),
          MATR_CODE VARCHAR(255),
          FEEDER VARCHAR(255),
          DROP_ERR INT,
          SUMR_YMD DATE
        )
      `;
      
      try {
        await db.promise().query(createTempTableQuery);
      } catch (error) {
        console.error('Erro ao criar tabela temporária:', error.message);
        return res.status(500).json({
          success: false,
          message: 'Erro ao criar tabela temporária',
          error: error.message
        });
      }
      
      // Inserir dados da API na tabela temporária
      if (response.data.length > 0) {
        const values = response.data.map(item => [
          item.PLANT_CODE || '',
          item.LINE_NM || '',
          item.MODEL_CODE || '',
          item.LINE_EQSEQ || '',
          item.LOC || '',
          item.MATR_CODE || '',
          item.FEEDER || '',
          item.DROP_ERR || 0,
          item.SUMR_YMD || new Date().toISOString().replace(/-/g, '').slice(0, 8)
        ]);
        
        // Construir query de inserção
        const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',');
        const insertQuery = `INSERT INTO ${tempTableName} (PLANT_CODE, LINE_NM, MODEL_CODE, LINE_EQSEQ, LOC, MATR_CODE, FEEDER, DROP_ERR, SUMR_YMD) VALUES ${placeholders}`;
        
        // Achatar o array de valores
        const flatValues = values.flat();
        try {
          await db.promise().query(insertQuery, flatValues);
        } catch (error) {
          console.error('Erro ao inserir dados na tabela temporária:', error.message);
          // Tentar dropar a tabela temporária em caso de erro
          try {
            await db.promise().query(`DROP TEMPORARY TABLE IF EXISTS ${tempTableName}`);
          } catch (dropError) {
            console.error('Erro ao dropar tabela temporária:', dropError.message);
          }
          return res.status(500).json({
            success: false,
            message: 'Erro ao inserir dados na tabela temporária',
            error: error.message
          });
        }
      }
      
      // Obter o limite dos parâmetros da query ou usar 50 como padrão
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const validLimits = [50, 100, 500, 1000, 999999]; // 999999 representa "tudo"
      const actualLimit = validLimits.includes(limit) ? limit : 50;
      
      // Fazer JOIN com a tabela de preços para obter os valores
      let joinQuery = `
        SELECT 
          a.PLANT_CODE,
          a.LINE_NM as Line,
          a.MODEL_CODE as Model,
          a.LINE_EQSEQ as Equipment,
          a.LOC as Slot,
          a.MATR_CODE as PartCode,
          a.FEEDER as Feeder,
          CASE 
            WHEN ROUND(b.price_decimal/b.price_unit_decimal, 2) >= 5.00 THEN 'A'
            WHEN ROUND(b.price_decimal/b.price_unit_decimal, 2) BETWEEN 2.00 AND 4.99 THEN 'B'
            WHEN ROUND(b.price_decimal/b.price_unit_decimal, 2) BETWEEN 0.00 AND 1.99 THEN 'C'
            ELSE 'Outra Classe' 
          END AS Classe,
          SUM(a.DROP_ERR) as Errors,
          ROUND(b.price_decimal/b.price_unit_decimal, 2) AS valor,
          ROUND(SUM(a.DROP_ERR) * b.price_decimal/b.price_unit_decimal, 2) AS Total,
          ROUND(SUM(a.DROP_ERR) * b.price_decimal/b.price_unit_decimal, 2) AS TotalNumerico
        FROM ${tempTableName} a
        LEFT JOIN (
          SELECT DISTINCT material, plant, price_decimal, price_unit_decimal
          FROM price_comp_convertido
        ) b ON a.MATR_CODE = b.material AND a.PLANT_CODE = b.plant
        GROUP BY a.PLANT_CODE, a.LINE_NM, a.MODEL_CODE, a.LINE_EQSEQ, a.LOC, a.MATR_CODE, a.FEEDER, b.price_decimal, b.price_unit_decimal
        ORDER BY Total DESC
      `;
      
      // Adicionar limite apenas se não for "tudo" (999999)
      if (actualLimit !== 999999) {
        joinQuery += ` LIMIT ${actualLimit}`;
      }
      
      let processedData;
      try {
        [processedData] = await db.promise().query(joinQuery);
      } catch (error) {
        console.error('Erro ao executar query de JOIN:', error.message);
        // Tentar dropar a tabela temporária em caso de erro
        try {
          await db.promise().query(`DROP TEMPORARY TABLE IF EXISTS ${tempTableName}`);
        } catch (dropError) {
          console.error('Erro ao dropar tabela temporária:', dropError.message);
        }
        return res.status(500).json({
          success: false,
          message: 'Erro ao processar dados',
          error: error.message
        });
      }
      
      // Calcular o total geral
      const totalGeral = processedData.reduce((sum, item) => sum + (parseFloat(item.TotalNumerico) || 0), 0);
      
      // Adicionar linha de total
      const finalData = [
        ...processedData,
        {
          PLANT_CODE: null,
          Line: null,
          Model: null,
          Equipment: null,
          Slot: null,
          PartCode: null,
          Feeder: null,
          Classe: 'TOTAL',
          Errors: null,
          valor: null,
          Total: totalGeral.toFixed(2),
          TotalNumerico: totalGeral
        }
      ];
      
      // Dropar tabela temporária
      try {
        await db.promise().query(`DROP TEMPORARY TABLE IF EXISTS ${tempTableName}`);
      } catch (error) {
        console.error('Erro ao dropar tabela temporária:', error.message);
        // Não retornar erro aqui pois os dados já foram processados com sucesso
      }
      
      res.json({
        success: true,
        data: finalData,
        count: finalData.length - 1 // Excluir a linha de total
      });
    } else {
      console.error('Formato de dados inesperado da API:', response.data);
      // Tentar dropar a tabela temporária em caso de erro
      if (tempTableName) {
        try {
          await db.promise().query(`DROP TEMPORARY TABLE IF EXISTS ${tempTableName}`);
        } catch (dropError) {
          console.error('Erro ao dropar tabela temporária:', dropError.message);
        }
      }
      res.status(500).json({
        success: false,
        message: 'Formato de dados inesperado da API'
      });
    }
  } catch (error) {
    console.error('Erro ao buscar dados atuais do Drop Worst:', error.message);
    // Tentar dropar a tabela temporária em caso de erro
    if (tempTableName) {
      try {
        await db.promise().query(`DROP TEMPORARY TABLE IF EXISTS ${tempTableName}`);
      } catch (dropError) {
        console.error('Erro ao dropar tabela temporária:', dropError.message);
      }
    }
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados atuais do Drop Worst',
      error: error.message
    });
  }
});

// Endpoint para obter dados históricos do Drop Worst (entre datas)
router.get("/drop_worst/history", requireScreen, async (req, res) => {
  try {
    const { from, to } = req.query;
    
    // Validar datas
    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Parâmetros "from" e "to" são obrigatórios'
      });
    }
    
    // Formatar datas removendo traços
    const fromDate = from.replace(/-/g, '');
    const toDate = to.replace(/-/g, '');
    
    // Verificar se a data final é maior ou igual à data inicial
    if (toDate < fromDate) {
      return res.status(400).json({
        success: false,
        message: 'A data final deve ser maior ou igual à data inicial'
      });
    }
    
    // URL da API com as datas especificadas
    const apiUrl = `http://105.103.2.25/json/smd-material-tracking/?context=mxsmd-worstdrop&from=${fromDate}&to=${toDate}`;
    
    console.log(`Fetching historical drop worst data from: ${apiUrl}`);
    
    // Fazer requisição para a API
    const response = await axios.get(apiUrl);
    
    // Verificar se a resposta tem o formato esperado
    if (response.data && Array.isArray(response.data)) {
      // Criar tabela temporária para armazenar os dados da API
      const createTempTableQuery = `
        CREATE TEMPORARY TABLE temp_drop_worst_data (
          PLANT_CODE VARCHAR(255),
          LINE_NM VARCHAR(255),
          MODEL_CODE VARCHAR(255),
          LINE_EQSEQ VARCHAR(255),
          LOC VARCHAR(255),
          MATR_CODE VARCHAR(255),
          FEEDER VARCHAR(255),
          DROP_ERR INT,
          SUMR_YMD DATE
        )
      `;
      
      await db.promise().query(createTempTableQuery);
      
      // Inserir dados da API na tabela temporária
      if (response.data.length > 0) {
        const values = response.data.map(item => [
          item.PLANT_CODE || '',
          item.LINE_NM || '',
          item.MODEL_CODE || '',
          item.LINE_EQSEQ || '',
          item.LOC || '',
          item.MATR_CODE || '',
          item.FEEDER || '',
          item.DROP_ERR || 0,
          item.SUMR_YMD || new Date().toISOString().replace(/-/g, '').slice(0, 8)
        ]);
        
        // Construir query de inserção
        const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',');
        const insertQuery = `INSERT INTO temp_drop_worst_data (PLANT_CODE, LINE_NM, MODEL_CODE, LINE_EQSEQ, LOC, MATR_CODE, FEEDER, DROP_ERR, SUMR_YMD) VALUES ${placeholders}`;
        
        // Achatar o array de valores
        const flatValues = values.flat();
        await db.promise().query(insertQuery, flatValues);
      }
      
      // Fazer JOIN com a tabela de preços para obter os valores
      const joinQuery = `
        SELECT 
          a.PLANT_CODE,
          a.LINE_NM as Line,
          a.MODEL_CODE as Model,
          a.LINE_EQSEQ as Equipment,
          a.LOC as Slot,
          a.MATR_CODE as PartCode,
          a.FEEDER as Feeder,
          CASE 
            WHEN ROUND(b.price_decimal/b.price_unit_decimal, 2) >= 5.00 THEN 'A'
            WHEN ROUND(b.price_decimal/b.price_unit_decimal, 2) BETWEEN 2.00 AND 4.99 THEN 'B'
            WHEN ROUND(b.price_decimal/b.price_unit_decimal, 2) BETWEEN 0.00 AND 1.99 THEN 'C'
            ELSE 'Outra Classe' 
          END AS Classe,
          SUM(a.DROP_ERR) as Errors,
          ROUND(b.price_decimal/b.price_unit_decimal, 2) AS valor,
          ROUND(SUM(a.DROP_ERR) * b.price_decimal/b.price_unit_decimal, 2) AS Total,
          ROUND(SUM(a.DROP_ERR) * b.price_decimal/b.price_unit_decimal, 2) AS TotalNumerico
        FROM temp_drop_worst_data a
        LEFT JOIN (
          SELECT DISTINCT material, plant, price_decimal, price_unit_decimal
          FROM price_comp_convertido
        ) b ON a.MATR_CODE = b.material AND a.PLANT_CODE = b.plant
        GROUP BY a.PLANT_CODE, a.LINE_NM, a.MODEL_CODE, a.LINE_EQSEQ, a.LOC, a.MATR_CODE, a.FEEDER, b.price_decimal, b.price_unit_decimal
        ORDER BY Total DESC
        LIMIT 50
      `;
      
      const [processedData] = await db.promise().query(joinQuery);
      
      // Calcular o total geral
      const totalGeral = processedData.reduce((sum, item) => sum + (parseFloat(item.TotalNumerico) || 0), 0);
      
      // Adicionar linha de total
      const finalData = [
        ...processedData,
        {
          PLANT_CODE: null,
          Line: null,
          Model: null,
          Equipment: null,
          Slot: null,
          PartCode: null,
          Feeder: null,
          Classe: 'TOTAL',
          Errors: null,
          valor: null,
          Total: totalGeral.toFixed(2),
          TotalNumerico: totalGeral
        }
      ];
      
      // Dropar tabela temporária
      await db.promise().query('DROP TEMPORARY TABLE temp_drop_worst_data');
      
      res.json({
        success: true,
        data: finalData,
        count: finalData.length - 1 // Excluir a linha de total
      });
    } else {
      console.error('Formato de dados inesperado da API:', response.data);
      res.status(500).json({
        success: false,
        message: 'Formato de dados inesperado da API'
      });
    }
  } catch (error) {
    console.error('Erro ao buscar dados históricos do Drop Worst:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados históricos do Drop Worst',
      error: error.message
    });
  }
});

// ===================== DROP WORST - POR HORA ENDPOINT =======================

// Endpoint para buscar dados do Drop Worst por hora (para tela HoraDropW - aba Por Hora)
// Nova estrutura: cada part tem 1 registro por dia com colunas h00-h23
router.get('/drop_worst/por_hora', requireScreen, async (req, res) => {
  try {
    const { startDate, endDate, data } = req.query;
    
    // Suporta tanto o novo formato (startDate/endDate) quanto o antigo (data)
    let dateCondition;
    let queryParams = [];
    
    if (startDate && endDate) {
      // Novo formato: período de datas
      dateCondition = `WHERE data_coleta BETWEEN ? AND ?`;
      queryParams = [startDate, endDate];
    } else {
      // Formato antigo: data única (para retrocompatibilidade)
      const dataFilter = data || new Date().toISOString().split('T')[0];
      dateCondition = `WHERE data_coleta = ?`;
      queryParams = [dataFilter];
    }
    
    // Query direta na nova estrutura (um registro por part por dia)
    // TTL (valor_total) = soma de todas as horas * valor_unitario
    const query = `
      SELECT 
        line,
        model,
        equipment,
        slot,
        part_code,
        feeder,
        classe,
        total_erros,
        valor_unitario,
        total,
        total_numerico,
        -- Calcula TTL (valor_total) = soma das horas * valor_unitario
        (COALESCE(h00, 0) + COALESCE(h01, 0) + COALESCE(h02, 0) + COALESCE(h03, 0) + 
         COALESCE(h04, 0) + COALESCE(h05, 0) + COALESCE(h06, 0) + COALESCE(h07, 0) + 
         COALESCE(h08, 0) + COALESCE(h09, 0) + COALESCE(h10, 0) + COALESCE(h11, 0) + 
         COALESCE(h12, 0) + COALESCE(h13, 0) + COALESCE(h14, 0) + COALESCE(h15, 0) + 
         COALESCE(h16, 0) + COALESCE(h17, 0) + COALESCE(h18, 0) + COALESCE(h19, 0) + 
         COALESCE(h20, 0) + COALESCE(h21, 0) + COALESCE(h22, 0) + COALESCE(h23, 0)) 
         * COALESCE(valor_unitario, 0) as valor_total,
        -- Retorna cada hora individualmente
        COALESCE(h00, 0) as h00,
        COALESCE(h01, 0) as h01,
        COALESCE(h02, 0) as h02,
        COALESCE(h03, 0) as h03,
        COALESCE(h04, 0) as h04,
        COALESCE(h05, 0) as h05,
        COALESCE(h06, 0) as h06,
        COALESCE(h07, 0) as h07,
        COALESCE(h08, 0) as h08,
        COALESCE(h09, 0) as h09,
        COALESCE(h10, 0) as h10,
        COALESCE(h11, 0) as h11,
        COALESCE(h12, 0) as h12,
        COALESCE(h13, 0) as h13,
        COALESCE(h14, 0) as h14,
        COALESCE(h15, 0) as h15,
        COALESCE(h16, 0) as h16,
        COALESCE(h17, 0) as h17,
        COALESCE(h18, 0) as h18,
        COALESCE(h19, 0) as h19,
        COALESCE(h20, 0) as h20,
        COALESCE(h21, 0) as h21,
        COALESCE(h22, 0) as h22,
        COALESCE(h23, 0) as h23
      FROM drop_class_a_worst
      ${dateCondition}
      ORDER BY total_numerico DESC
    `;
    
    const [rows] = await db.promise().query(query, queryParams);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Erro ao buscar dados por hora:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// COLETOR DROP WORST - INSERT/UPDATE (ESTRATÉGIA DE ACUMULADO POR HORA)
// ============================================================================
// CONCEITO:
// - API retorna valor ACUMULADO do dia (ex: 100 erros até agora)
// - Cada part tem 1 ÚNICO registro por dia (INSERT/UPDATE)
// - Quando muda a hora: calcula diferença e salva na coluna da hora
// - Exemplo:
//   * 7h: part=123abc, API=4 → UPDATE: total=4, h07=4
//   * 7h: part=123abc, API=6 → UPDATE: total=6, h07=6 (ainda na mesma hora)
//   * 10h: part=123abc, API=8 → UPDATE: total=8, h07=6, h10=2 (8-6=2)
// ============================================================================

const DROP_API_URL = 'http://105.103.2.25/json/smd-material-tracking/';
let dropTimerId = null;

// Armazena último valor acumulado de cada item (para calcular diferença)
// Chave: "line|model|equipment|slot|part_code|feeder"
// Valor: { errors: numero, hora: numero }
const ultimoSnapshot = new Map();

// Gera chave única para identificar um item
function gerarChaveItem(item) {
  return `${item.Line||''}|${item.Model||''}|${item.Equipment||''}|${item.Slot||''}|${item.PartCode||''}|${item.Feeder||''}`;
}

// Busca dados da API - MESMO ENDPOINT da tela drop_worst/current
async function dropWorstFetch() {
  const data = new Date().toISOString().split('T')[0].replace(/-/g, '');
  try {
    const response = await axios.get(`${DROP_API_URL}?context=mxsmd-worstdrop&from=${data}&to=${data}`, { timeout: 30000 });
    return response.data && Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    return [];
  }
}

// Processa dados com preços - EXATAMENTE como a tela drop_worst/current
async function dropWorstProcessar(dados) {
  if (!dados || dados.length === 0) return [];
  const tempTable = `temp_drop_${Date.now()}`;
  await db.promise().query(`CREATE TEMPORARY TABLE ${tempTable} (PLANT_CODE VARCHAR(255), LINE_NM VARCHAR(255), MODEL_CODE VARCHAR(255), LINE_EQSEQ VARCHAR(255), LOC VARCHAR(255), MATR_CODE VARCHAR(255), FEEDER VARCHAR(255), DROP_ERR INT, SUMR_YMD DATE)`);
  
  // Inserir dados brutos da API
  const values = dados.map(i => [
    i.PLANT_CODE||'', 
    i.LINE_NM||'', 
    i.MODEL_CODE||'', 
    i.LINE_EQSEQ||'', 
    i.LOC||'', 
    i.MATR_CODE||'', 
    i.FEEDER||'', 
    i.DROP_ERR||0,
    i.SUMR_YMD || new Date().toISOString().replace(/-/g, '').slice(0, 8)
  ]);
  
  await db.promise().query(`INSERT INTO ${tempTable} VALUES ${values.map(()=> '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',')}`, values.flat());
  
  // Query EXATA da tela drop_worst/current - com JOIN na tabela de preços
  const [result] = await db.promise().query(`
    SELECT 
      a.PLANT_CODE,
      a.LINE_NM as Line,
      a.MODEL_CODE as Model,
      a.LINE_EQSEQ as Equipment,
      a.LOC as Slot,
      a.MATR_CODE as PartCode,
      a.FEEDER as Feeder,
      CASE 
        WHEN ROUND(b.price_decimal/b.price_unit_decimal, 2) >= 5.00 THEN 'A'
        WHEN ROUND(b.price_decimal/b.price_unit_decimal, 2) BETWEEN 2.00 AND 4.99 THEN 'B'
        WHEN ROUND(b.price_decimal/b.price_unit_decimal, 2) BETWEEN 0.00 AND 1.99 THEN 'C'
        ELSE 'Outra Classe' 
      END AS Classe,
      SUM(a.DROP_ERR) as Errors,
      ROUND(b.price_decimal/b.price_unit_decimal, 2) AS valor,
      ROUND(SUM(a.DROP_ERR) * b.price_decimal/b.price_unit_decimal, 2) AS Total,
      ROUND(SUM(a.DROP_ERR) * b.price_decimal/b.price_unit_decimal, 2) AS TotalNumerico
    FROM ${tempTable} a
    LEFT JOIN (
      SELECT DISTINCT material, plant, price_decimal, price_unit_decimal
      FROM price_comp_convertido
    ) b ON a.MATR_CODE = b.material AND a.PLANT_CODE = b.plant
    GROUP BY a.PLANT_CODE, a.LINE_NM, a.MODEL_CODE, a.LINE_EQSEQ, a.LOC, a.MATR_CODE, a.FEEDER, b.price_decimal, b.price_unit_decimal
    ORDER BY Total DESC
  `);
  
  await db.promise().query(`DROP TEMPORARY TABLE IF EXISTS ${tempTable}`);
  return result;
}

// Salva com estratégia INSERT/UPDATE - um registro por part por dia
// LÓGICA CORRETA:
// - API retorna valor ACUMULADO do dia (ex: 100 erros até agora)
// - PRIMEIRA coleta da HORA: salva o acumulado na coluna da hora
// - Coletas subsequentes na MESMA hora: NÃO atualiza a coluna da hora (mantém primeiro valor)
// - HORA DIFERENTE: calcula diferença (atual - ultimo_acumulado) e salva na nova coluna
// Exemplo:
//   7h00: API=5 → h07=5, total=5
//   7h30: API=5 → h07=5, total=5 (não muda)
//   8h00: API=7 → h07=5, h08=2, total=7 (7-5=2)
async function dropWorstSalvar(dados) {
  if (!dados || dados.length === 0) return { inseridos: 0, atualizados: 0 };
  
  const dataColeta = new Date().toISOString().split('T')[0];
  const horaColeta = new Date().getHours();
  const agora = new Date();
  let inseridos = 0, atualizados = 0;
  
  for (const item of dados) {
    const chave = gerarChaveItem(item);
    const errorsAcumulado = parseInt(item.Errors) || 0;
    
    // Busca último snapshot deste item na memória
    const ultimo = ultimoSnapshot.get(chave);
    
    let errorsParaSalvar = 0;  // Valor que vai na coluna da hora (h00-h23)
    let deveAtualizarHora = false;
    
    if (!ultimo) {
      // PRIMEIRA coleta do dia: salva valor acumulado na coluna da hora
      errorsParaSalvar = errorsAcumulado;
      deveAtualizarHora = true;
    } else if (ultimo.hora !== horaColeta) {
      // MUDOU A HORA: calcula diferença entre acumulado atual e último acumulado
      errorsParaSalvar = Math.max(0, errorsAcumulado - ultimo.errors);
      deveAtualizarHora = true;
    } else {
      // MESMA HORA: NÃO atualiza a coluna da hora (mantém o primeiro valor da hora)
      // Apenas o total_erros será atualizado com valor mais recente
      errorsParaSalvar = 0;
      deveAtualizarHora = false;
    }
    
    // Atualiza snapshot com valor acumulado atual
    ultimoSnapshot.set(chave, {
      errors: errorsAcumulado,
      hora: horaColeta,
      data: dataColeta
    });
    
    const horaFormatada = String(horaColeta).padStart(2, '0');
    
    try {
      let query = 'INSERT INTO drop_class_a_worst SET ';
      query += 'data_coleta = ?, plant_code = ?, line = ?, model = ?, equipment = ?, slot = ?, part_code = ?, feeder = ?, classe = ?, ';
      query += 'total_erros = ?, ' + 'h' + horaFormatada + ' = ?, valor_unitario = ?, total = ?, total_numerico = ?, ';
      query += 'ultima_hora_atualizada = ?, ultimo_total_acumulado = ?, horario_atualizacao = ? ';
      query += 'ON DUPLICATE KEY UPDATE ';
      query += 'total_erros = VALUES(total_erros), ';
      
      // Só atualiza a coluna da hora se mudou a hora OU é primeira coleta
      if (deveAtualizarHora) {
        query += 'h' + horaFormatada + ' = VALUES(h' + horaFormatada + '), ';
      } else {
        // Mantém valor existente da hora (não sobrescreve)
        query += 'h' + horaFormatada + ' = h' + horaFormatada + ', ';
      }
      
      query += 'valor_unitario = VALUES(valor_unitario), total = VALUES(total), total_numerico = VALUES(total_numerico), ';
      query += 'ultima_hora_atualizada = VALUES(ultima_hora_atualizada), ultimo_total_acumulado = VALUES(ultimo_total_acumulado), horario_atualizacao = VALUES(horario_atualizacao)';
      
      const params = [
        dataColeta,
        item.PLANT_CODE||'',
        item.Line||'',
        item.Model||'',
        item.Equipment||'',
        item.Slot||'',
        item.PartCode||'',
        item.Feeder||'',
        item.Classe||'',
        errorsAcumulado,      // total_erros = valor EXATO da API
        errorsParaSalvar,     // hXX = primeiro valor da hora OU diferença (hora nova)
        item.valor||0,
        item.Total||0,
        item.Total||0,
        horaColeta,
        errorsAcumulado,
        agora
      ];
      
      await db.promise().query(query, params);
      
      if (errorsParaSalvar > 0) atualizados++;
    } catch (err) {
      // Erro silencioso
    }
  }
  
  return { inseridos, atualizados };
}

// Coleta principal
async function dropWorstColetar() {
  const dadosBrutos = await dropWorstFetch();
  const processados = await dropWorstProcessar(dadosBrutos);
  const resultado = await dropWorstSalvar(processados);
  return resultado;
}

// Inicia coletor automático (a cada 1 minuto)
function dropWorstIniciar() {
  if (dropTimerId) clearInterval(dropTimerId);
  ultimoSnapshot.clear();
  dropWorstColetar();
  dropTimerId = setInterval(dropWorstColetar, 60000);
}

// Para coletor
function dropWorstParar() {
  if (dropTimerId) { 
    clearInterval(dropTimerId); 
    dropTimerId = null; 
  }
}

// Inicia automaticamente ao carregar servidor
dropWorstIniciar();

// Endpoints
router.get('/drop_worst/coletar', requireScreen, async (req, res) => { 
  res.json(await dropWorstColetar()); 
});

router.get('/drop_worst/status', requireScreen, (req, res) => { 
  res.json({ 
    ativo: dropTimerId !== null,
    snapshotsMemoria: ultimoSnapshot.size
  }); 
});

router.post('/drop_worst/toggle', requireScreen, (req, res) => { 
  const { ativo } = req.body; 
  if (ativo) dropWorstIniciar(); 
  else dropWorstParar(); 
  res.json({ success: true, message: ativo ? 'Coletor iniciado' : 'Coletor parado' }); 
});

// Endpoint para LIMPAR snapshots e começar do zero (útil para testes)
router.get('/drop_worst/reset', requireScreen, (req, res) => {
  ultimoSnapshot.clear();
  res.json({ success: true, message: 'Snapshots limpos. Próxima coleta inicia do zero.' });
});










// [Rotas migradas para backend/routes/Quality/]






//////////---------------------------------------------------------------------

module.exports = router;
