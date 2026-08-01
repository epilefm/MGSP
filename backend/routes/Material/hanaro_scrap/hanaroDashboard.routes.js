const express = require("express");
const router = express.Router();
const db = require("../../../config/db");

const { buildFilterConditions } = require("./filterConditions");

// ==========================================
// Dashboard Hanaro - Rota com Filtros (Total do Período)
// ==========================================
// Apenas registros APROVADOS (igual ao histórico)
router.get("/api/hanaro-dashboard-hoje", (req, res) => {
  const { dataInicio, dataFim, modelo, origem } = req.query;
  
  let query = `
    SELECT 
      SUM(custo_total) as total_valor,
      SUM(qty) as total_qtd,
      COUNT(*) as total_registros
    FROM hanaro_scrap
    WHERE status = 'Aprovado'
  `;
  
  const params = [];
  const conditions = [];
  
  // Filtro de data
  if (dataInicio && dataFim) {
    conditions.push("DATE(data_hora) BETWEEN ? AND ?");
    params.push(dataInicio, dataFim);
  } else {
    // Padrão: data de hoje
    const hoje = new Date().toISOString().split('T')[0];
    conditions.push("DATE(data_hora) >= ?");
    params.push(hoje);
  }
  
  // Filtro de modelo
  if (modelo) {
    conditions.push("modelo_nome = ?");
    params.push(modelo);
  }
  
  // Filtro de origem
  if (origem) {
    conditions.push("origem_nome = ?");
    params.push(origem);
  }
  
  if (conditions.length > 0) {
    query += " AND " + conditions.join(" AND ");
  }
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar dashboard: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar dados do dashboard",
        error: err.message 
      });
    }
    
    const data = result[0] || { total_valor: 0, total_qtd: 0, total_registros: 0 };
    const dataConsulta = dataInicio || new Date().toISOString().split('T')[0];
    
    res.json({ 
      success: true, 
      data: {
        totalValor: parseFloat(data.total_valor) || 0,
        totalQtd: parseInt(data.total_qtd) || 0,
        totalRegistros: parseInt(data.total_registros) || 0,
        data: dataConsulta
      }
    });
  });
});

// ==========================================
// Dashboard Hanaro - Scraps por Modelo (Gráfico)
// ==========================================
// Apenas registros APROVADOS, agrupados por modelo
// ACEITA TODOS OS FILTROS: data, modelo, origem, equipamento, causa, linha, fase, turno, responsavel, tipo_scrap
router.get("/api/hanaro-dashboard-por-modelo", (req, res) => {
  const { conditions, params } = buildFilterConditions(req);
  
  let query = `
    SELECT 
      modelo_nome as modelo,
      SUM(qty) as total_qtd,
      SUM(custo_total) as total_valor,
      COUNT(*) as total_registros
    FROM hanaro_scrap
    WHERE status = 'Aprovado' AND modelo_nome IS NOT NULL AND modelo_nome != ''
      AND ${conditions.join(' AND ')}
    GROUP BY modelo_nome ORDER BY total_qtd DESC
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar dashboard por modelo: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar dados do dashboard por modelo",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({
        modelo: item.modelo || 'N/A',
        totalQtd: parseInt(item.total_qtd) || 0,
        totalValor: parseFloat(item.total_valor) || 0,
        totalRegistros: parseInt(item.total_registros) || 0
      }))
    });
  });
});

// ==========================================
// Dashboard Hanaro - Scraps por Origem (Gráfico)
// ==========================================
// Apenas registros APROVADOS, agrupados por origem
// ACEITA TODOS OS FILTROS: data, modelo, origem, equipamento, causa, linha, fase, turno, responsavel, tipo_scrap
router.get("/api/hanaro-dashboard-por-origem", (req, res) => {
  const { conditions, params } = buildFilterConditions(req);
  
  let query = `
    SELECT 
      origem_nome as origem,
      SUM(qty) as total_qtd,
      SUM(custo_total) as total_valor,
      COUNT(*) as total_registros
    FROM hanaro_scrap
    WHERE status = 'Aprovado' AND origem_nome IS NOT NULL AND origem_nome != ''
      AND ${conditions.join(' AND ')}
    GROUP BY origem_nome ORDER BY total_qtd DESC
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar dashboard por origem: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar dados do dashboard por origem",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({
        origem: item.origem || 'N/A',
        totalQtd: parseInt(item.total_qtd) || 0,
        totalValor: parseFloat(item.total_valor) || 0,
        totalRegistros: parseInt(item.total_registros) || 0
      }))
    });
  });
});

// ==========================================
// Dashboard Hanaro - Scraps por Equipamento (Gráfico)
// ==========================================
// Apenas registros APROVADOS, agrupados por equipamento
// ACEITA TODOS OS FILTROS: data, modelo, origem, equipamento, causa, linha, fase, turno, responsavel, tipo_scrap
router.get("/api/hanaro-dashboard-por-equipamento", (req, res) => {
  const { conditions, params } = buildFilterConditions(req);
  
  let query = `
    SELECT 
      equipamento_nome as equipamento,
      SUM(qty) as total_qtd,
      SUM(custo_total) as total_valor,
      COUNT(*) as total_registros
    FROM hanaro_scrap
    WHERE status = 'Aprovado' AND equipamento_nome IS NOT NULL AND equipamento_nome != ''
      AND ${conditions.join(' AND ')}
    GROUP BY equipamento_nome ORDER BY total_qtd DESC
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar dashboard por equipamento: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar dados do dashboard por equipamento",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({
        equipamento: item.equipamento || 'N/A',
        totalQtd: parseInt(item.total_qtd) || 0,
        totalValor: parseFloat(item.total_valor) || 0,
        totalRegistros: parseInt(item.total_registros) || 0
      }))
    });
  });
});

// ==========================================
// Dashboard Hanaro - Scraps por Causa (Gráfico)
// ==========================================
// Apenas registros APROVADOS, agrupados por causa
// ACEITA TODOS OS FILTROS: data, modelo, origem, equipamento, causa, linha, fase, turno, responsavel, tipo_scrap
router.get("/api/hanaro-dashboard-por-causa", (req, res) => {
  const { conditions, params } = buildFilterConditions(req);
  
  let query = `
    SELECT 
      causa_nome as causa,
      SUM(qty) as total_qtd,
      SUM(custo_total) as total_valor,
      COUNT(*) as total_registros
    FROM hanaro_scrap
    WHERE status = 'Aprovado' AND causa_nome IS NOT NULL AND causa_nome != ''
      AND ${conditions.join(' AND ')}
    GROUP BY causa_nome ORDER BY total_qtd DESC
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar dashboard por causa: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar dados do dashboard por causa",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({
        causa: item.causa || 'N/A',
        totalQtd: parseInt(item.total_qtd) || 0,
        totalValor: parseFloat(item.total_valor) || 0,
        totalRegistros: parseInt(item.total_registros) || 0
      }))
    });
  });
});

// ==========================================
// Dashboard Hanaro - Scraps por Linha (Gráfico)
// ==========================================
// Apenas registros APROVADOS, agrupados por linha
// ACEITA TODOS OS FILTROS: data, modelo, origem, equipamento, causa, linha, fase, turno, responsavel, tipo_scrap
router.get("/api/hanaro-dashboard-por-linha", (req, res) => {
  const { conditions, params } = buildFilterConditions(req);
  
  let query = `
    SELECT 
      linha_nome as linha,
      SUM(qty) as total_qtd,
      SUM(custo_total) as total_valor,
      COUNT(*) as total_registros
    FROM hanaro_scrap
    WHERE status = 'Aprovado' AND linha_nome IS NOT NULL AND linha_nome != ''
      AND ${conditions.join(' AND ')}
    GROUP BY linha_nome ORDER BY total_qtd DESC
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar dashboard por linha: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar dados do dashboard por linha",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({
        linha: item.linha || 'N/A',
        totalQtd: parseInt(item.total_qtd) || 0,
        totalValor: parseFloat(item.total_valor) || 0,
        totalRegistros: parseInt(item.total_registros) || 0
      }))
    });
  });
});

// ==========================================
// Dashboard Hanaro - Scraps por Fase/Tipo Placa (Gráfico)
// ==========================================
// Apenas registros APROVADOS, agrupados por tipo_placa
// ACEITA TODOS OS FILTROS: data, modelo, origem, equipamento, causa, linha, fase, turno, responsavel, tipo_scrap
router.get("/api/hanaro-dashboard-por-fase", (req, res) => {
  const { conditions, params } = buildFilterConditions(req);
  
  let query = `
    SELECT 
      tipo_placa as fase,
      SUM(qty) as total_qtd,
      SUM(custo_total) as total_valor,
      COUNT(*) as total_registros
    FROM hanaro_scrap
    WHERE status = 'Aprovado' AND tipo_placa IS NOT NULL AND tipo_placa != ''
      AND ${conditions.join(' AND ')}
    GROUP BY tipo_placa ORDER BY total_qtd DESC
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar dashboard por fase: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar dados do dashboard por fase",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({
        fase: item.fase || 'N/A',
        totalQtd: parseInt(item.total_qtd) || 0,
        totalValor: parseFloat(item.total_valor) || 0,
        totalRegistros: parseInt(item.total_registros) || 0
      }))
    });
  });
});

// ==========================================
// Dashboard Hanaro - Scraps por Turno (Gráfico)
// ==========================================
// Apenas registros APROVADOS, agrupados por turno
// ACEITA TODOS OS FILTROS: data, modelo, origem, equipamento, causa, linha, fase, turno, responsavel, tipo_scrap
router.get("/api/hanaro-dashboard-por-turno", (req, res) => {
  const { conditions, params } = buildFilterConditions(req);
  
  let query = `
    SELECT 
      turno,
      SUM(qty) as total_qtd,
      SUM(custo_total) as total_valor,
      COUNT(*) as total_registros
    FROM hanaro_scrap
    WHERE status = 'Aprovado' AND turno IS NOT NULL AND turno != ''
      AND ${conditions.join(' AND ')}
    GROUP BY turno ORDER BY CASE turno WHEN '1T' THEN 1 WHEN '2T' THEN 2 WHEN '3T' THEN 3 ELSE 4 END
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar dashboard por turno: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar dados do dashboard por turno",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({
        turno: item.turno || 'N/A',
        totalQtd: parseInt(item.total_qtd) || 0,
        totalValor: parseFloat(item.total_valor) || 0,
        totalRegistros: parseInt(item.total_registros) || 0
      }))
    });
  });
});

// ==========================================
// Dashboard Hanaro - Scraps por Responsável (Gráfico)
// ==========================================
// Apenas registros APROVADOS, agrupados por responsavel (matricula/nome)
// ACEITA TODOS OS FILTROS: data, modelo, origem, equipamento, causa, linha, fase, turno, responsavel, tipo_scrap
router.get("/api/hanaro-dashboard-por-responsavel", (req, res) => {
  const { conditions, params } = buildFilterConditions(req);
  
  let query = `
    SELECT 
      matricula,
      nome_operador as responsavel,
      SUM(qty) as total_qtd,
      SUM(custo_total) as total_valor,
      COUNT(*) as total_registros
    FROM hanaro_scrap
    WHERE status = 'Aprovado' AND matricula IS NOT NULL AND matricula != ''
      AND ${conditions.join(' AND ')}
    GROUP BY matricula, nome_operador ORDER BY total_qtd DESC
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar dashboard por responsavel: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar dados do dashboard por responsavel",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({
        responsavel: item.responsavel || item.matricula || 'N/A',
        matricula: item.matricula || '',
        totalQtd: parseInt(item.total_qtd) || 0,
        totalValor: parseFloat(item.total_valor) || 0,
        totalRegistros: parseInt(item.total_registros) || 0
      }))
    });
  });
});

// ==========================================
// Dashboard Hanaro - Scraps por Tipo de Scrap (Gráfico)
// ==========================================
// Apenas registros APROVADOS, agrupados por tipo_scrap
// ACEITA TODOS OS FILTROS: data, modelo, origem, equipamento, causa, linha, fase, turno, responsavel, tipo_scrap
router.get("/api/hanaro-dashboard-por-tipo-scrap", (req, res) => {
  const { conditions, params } = buildFilterConditions(req);
  
  let query = `
    SELECT 
      tipo_scrap,
      SUM(qty) as total_qtd,
      SUM(custo_total) as total_valor,
      COUNT(*) as total_registros
    FROM hanaro_scrap
    WHERE status = 'Aprovado' AND tipo_scrap IS NOT NULL AND tipo_scrap != ''
      AND ${conditions.join(' AND ')}
    GROUP BY tipo_scrap ORDER BY total_qtd DESC
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar dashboard por tipo scrap: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar dados do dashboard por tipo scrap",
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.map(item => ({
        tipo_scrap: item.tipo_scrap || 'N/A',
        totalQtd: parseInt(item.total_qtd) || 0,
        totalValor: parseFloat(item.total_valor) || 0,
        totalRegistros: parseInt(item.total_registros) || 0
      }))
    });
  });
});

// ==========================================
// Dashboard Hanaro - Evolução por PERÍODO (Custo + Qty)
// ==========================================
// Gráfico estilo STOCKS: Area (custo) + Bar (quantidade)
// ACEITA TODOS OS FILTROS: data, modelo, origem, equipamento, causa, linha, fase, turno, responsavel, tipo_scrap
router.get("/api/hanaro-dashboard-por-periodo", (req, res) => {
  const { dataInicio, dataFim, modelo, origem, equipamento, causa, linha, fase, turno, responsavel, tipo_scrap } = req.query;
  
  const conditions = ["status = 'Aprovado'"];
  const params = [];
  
  // Filtro de data - usar dataInicio/dataFim se fornecidos, senão usar hoje
  if (dataInicio && dataFim) {
    conditions.push("DATE(data_hora) BETWEEN ? AND ?");
    params.push(dataInicio, dataFim);
  } else {
    const hoje = new Date().toISOString().split('T')[0];
    conditions.push("DATE(data_hora) >= ?");
    params.push(hoje);
  }
  
  // Adicionar outros filtros se fornecidos
  if (modelo) { conditions.push("modelo_nome = ?"); params.push(modelo); }
  if (origem) { conditions.push("origem_nome = ?"); params.push(origem); }
  if (equipamento) { conditions.push("equipamento_nome = ?"); params.push(equipamento); }
  if (causa) { conditions.push("causa_nome = ?"); params.push(causa); }
  if (linha) { conditions.push("linha_nome = ?"); params.push(linha); }
  if (fase) { conditions.push("tipo_placa = ?"); params.push(fase); }
  if (turno) { conditions.push("turno = ?"); params.push(turno); }
  if (responsavel) { conditions.push("nome_operador = ?"); params.push(responsavel); }
  if (tipo_scrap) { conditions.push("tipo_scrap = ?"); params.push(tipo_scrap); }
  
  let query = `
    SELECT 
      DATE(data_hora) as data,
      SUM(custo_total) as total_valor,
      SUM(qty) as total_qtd,
      COUNT(*) as total_registros
    FROM hanaro_scrap
    WHERE ${conditions.join(' AND ')}
    GROUP BY DATE(data_hora)
    ORDER BY data ASC
  `;
  
  // console.log("Query período:", query);
  // console.log("Params período:", params);
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar dashboard por período: ", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar dados do dashboard por período",
        error: err.message 
      });
    }
    
    // console.log("Resultado período:", result);
    
    res.json({ 
      success: true, 
      data: result.map(item => ({
        data: item.data ? new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'N/A',
        periodo: item.data ? new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'N/A',
        totalQtd: parseInt(item.total_qtd) || 0,
        totalValor: parseFloat(item.total_valor) || 0,
        totalRegistros: parseInt(item.total_registros) || 0
      }))
    });
  });
});

// Função auxiliar para agrupar dados (MOVIDA PARA ANTES DO ENDPOINT)
function agruparPorCampo(dados, campo) {
  return dados.reduce((acc, item) => {
    const key = item[campo] || 'Não informado';
    if (!acc[key]) {
      acc[key] = { quantidade: 0, valor: 0, registros: 0 };
    }
    // Tratamento seguro para valores numéricos
    const qty = parseFloat(item.qty) || 0;
    const custo = parseFloat(item.custo_total) || 0;
    acc[key].quantidade += qty;
    acc[key].valor += custo;
    acc[key].registros += 1;
    return acc;
  }, {});
}

// Endpoint para IA - Buscar dados completos para análise (COM DADOS TEMPORAIS)
router.get("/api/hanaro_scrap_dados_ia", (req, res) => {
  const { limite } = req.query;
  const limiteQtd = limite ? parseInt(limite) : 1000; // Default 1000 registros
  
  console.log('[API Hanaro IA] Buscando dados, limite:', limiteQtd);
  
  // Buscar últimos registros com todos os detalhes
  const query = `
    SELECT 
      h.id,
      h.data_hora,
      h.turno,
      h.linha_nome as linha,
      h.modelo_nome as modelo,
      h.tipo_placa as placa,
      h.halb,
      h.qty,
      h.custo_unitario,
      h.custo_total,
      h.origem_nome as origem,
      h.equipamento_nome as equipamento,
      h.causa_nome as causa,
      h.causa_raiz,
      h.acao_corretiva,
      h.contramedida,
      h.matricula,
      h.nome_operador as operador,
      h.status,
      h.cn,
      h.tipo_scrap
    FROM hanaro_scrap h
    ORDER BY h.data_hora DESC
    LIMIT ?
  `;
  
  db.query(query, [limiteQtd], (err, result) => {
    if (err) {
      console.error('[API Hanaro IA] Erro SQL:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao buscar dados',
        error: err.message 
      });
    }
    
    console.log('[API Hanaro IA] Registros encontrados:', result ? result.length : 0);
    
    if (!result || result.length === 0) {
      return res.json({ 
        success: true, 
        registros: [],
        estatisticas: {
          totalRegistros: 0,
          totalValor: 0,
          totalQtd: 0,
          periodoInicio: null,
          periodoFim: null,
          modelosUnicos: [],
          causasUnicas: [],
          equipamentosUnicos: [],
          linhasUnicas: [],
          turnosUnicos: [],
          origensUnicas: [],
          porModelo: {},
          porCausa: {},
          porEquipamento: {},
          porLinha: {},
          porTurno: {},
          porOrigem: {},
          porDia: {},
          porSemana: {},
          porMes: {},
          ultimos7Dias: [],
          amostraRegistros: []
        }
      });
    }
    
    try {
      // Calcular período coberto pelos dados
      const datas = result.map(r => new Date(r.data_hora)).filter(d => !isNaN(d.getTime()));
      const dataMaisAntiga = datas.length > 0 ? new Date(Math.min(...datas)) : null;
      const dataMaisRecente = datas.length > 0 ? new Date(Math.max(...datas)) : null;
      
      // Formatando datas para exibição
      const formatarData = (d) => {
        if (!d || isNaN(d.getTime())) return 'N/A';
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      };
      const formatarDataHora = (d) => {
        if (!d || isNaN(d.getTime())) return 'N/A';
        return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      };
      
      // Agrupar por DIA
      const porDia = {};
      result.forEach(r => {
        const data = new Date(r.data_hora);
        if (isNaN(data.getTime())) return;
        const dia = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        if (!porDia[dia]) {
          porDia[dia] = { quantidade: 0, valor: 0, registros: 0, data: dia };
        }
        porDia[dia].quantidade += parseInt(r.qty) || 0;
        porDia[dia].valor += parseFloat(r.custo_total) || 0;
        porDia[dia].registros += 1;
      });
      
      // Agrupar por SEMANA (ISO week)
      const getSemanaAno = (data) => {
        const d = new Date(data);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return `${weekNo}/${d.getFullYear()}`;
      };
      const porSemana = {};
      result.forEach(r => {
        const data = new Date(r.data_hora);
        if (isNaN(data.getTime())) return;
        const semana = getSemanaAno(data);
        if (!porSemana[semana]) {
          porSemana[semana] = { quantidade: 0, valor: 0, registros: 0, semana: semana };
        }
        porSemana[semana].quantidade += parseInt(r.qty) || 0;
        porSemana[semana].valor += parseFloat(r.custo_total) || 0;
        porSemana[semana].registros += 1;
      });
      
      // Agrupar por MÊS
      const porMes = {};
      result.forEach(r => {
        const data = new Date(r.data_hora);
        if (isNaN(data.getTime())) return;
        const mes = data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        if (!porMes[mes]) {
          porMes[mes] = { quantidade: 0, valor: 0, registros: 0, mes: mes };
        }
        porMes[mes].quantidade += parseInt(r.qty) || 0;
        porMes[mes].valor += parseFloat(r.custo_total) || 0;
        porMes[mes].registros += 1;
      });
      
      // Últimos 7 dias (apenas registros com data)
      const hoje = new Date();
      const seteDiasAtras = new Date(hoje);
      seteDiasAtras.setDate(hoje.getDate() - 7);
      const ultimos7Dias = result
        .filter(r => {
          const data = new Date(r.data_hora);
          return !isNaN(data.getTime()) && data >= seteDiasAtras;
        })
        .map(r => ({
          id: r.id,
          data: formatarDataHora(new Date(r.data_hora)),
          modelo: r.modelo,
          causa: r.causa,
          linha: r.linha,
          turno: r.turno,
          quantidade: parseInt(r.qty) || 0,
          valor: parseFloat(r.custo_total) || 0
        }));
      
      // Amostra de registros recentes (para a IA citar exemplos)
      const amostraRegistros = result.slice(0, 10).map(r => ({
        id: r.id,
        data: formatarDataHora(new Date(r.data_hora)),
        modelo: r.modelo,
        placa: r.placa,
        causa: r.causa,
        equipamento: r.equipamento,
        linha: r.linha,
        turno: r.turno,
        quantidade: parseInt(r.qty) || 0,
        valor: parseFloat(r.custo_total) || 0,
        operador: r.operador
      }));
      
      // Estatísticas resumidas com tratamento seguro
      const estatisticas = {
        totalRegistros: result.length,
        totalValor: result.reduce((sum, r) => {
          const val = parseFloat(r.custo_total);
          return sum + (isNaN(val) ? 0 : val);
        }, 0),
        totalQtd: result.reduce((sum, r) => {
          const val = parseInt(r.qty);
          return sum + (isNaN(val) ? 0 : val);
        }, 0),
        
        // DADOS TEMPORAIS (NOVO!)
        periodoInicio: formatarData(dataMaisAntiga),
        periodoFim: formatarData(dataMaisRecente),
        periodoInicioRaw: dataMaisAntiga ? dataMaisAntiga.toISOString() : null,
        periodoFimRaw: dataMaisRecente ? dataMaisRecente.toISOString() : null,
        
        // Agrupamentos temporais
        porDia: porDia,
        porSemana: porSemana,
        porMes: porMes,
        ultimos7Dias: ultimos7Dias,
        amostraRegistros: amostraRegistros,
        
        // Listas únicas (existente)
        modelosUnicos: [...new Set(result.map(r => r.modelo || 'N/A').filter(v => v !== null))],
        causasUnicas: [...new Set(result.map(r => r.causa || 'N/A').filter(v => v !== null))],
        equipamentosUnicos: [...new Set(result.map(r => r.equipamento || 'N/A').filter(v => v !== null))],
        linhasUnicas: [...new Set(result.map(r => r.linha || 'N/A').filter(v => v !== null))],
        turnosUnicos: [...new Set(result.map(r => r.turno || 'N/A').filter(v => v !== null))],
        origensUnicas: [...new Set(result.map(r => r.origem || 'N/A').filter(v => v !== null))],
        
        // Agrupamentos por categoria (existente)
        porModelo: agruparPorCampo(result, 'modelo'),
        porCausa: agruparPorCampo(result, 'causa'),
        porEquipamento: agruparPorCampo(result, 'equipamento'),
        porLinha: agruparPorCampo(result, 'linha'),
        porTurno: agruparPorCampo(result, 'turno'),
        porOrigem: agruparPorCampo(result, 'origem')
      };
      
      console.log('[API Hanaro IA] Dados processados com sucesso, período:', estatisticas.periodoInicio, 'até', estatisticas.periodoFim);
      
      res.json({ 
        success: true, 
        registros: result,
        estatisticas 
      });
    } catch (procErr) {
      console.error('[API Hanaro IA] Erro ao processar dados:', procErr);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao processar dados',
        error: procErr.message 
      });
    }
  });
});








module.exports = router;
