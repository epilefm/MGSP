const express = require("express");
const router = express.Router();
const db = require("../../config/db");

//---------------------------------------------------------------------
// Endpoint LobMounter - Busca dados da tabela lob_npm para monitoramento de LOB
// Parâmetros: data (YYYY-MM-DD), shift (turno), line_name (nome da linha)
//---------------------------------------------------------------------

// Endpoint otimizado LobMounter - Busca dados da tabela lob_npm para monitoramento de LOB
// Parâmetros: data (YYYY-MM-DD), shift (turno), line_name (nome da linha)
// OTIMIZAÇÃO: Usa índice composto (log_date, shift, line_name) para busca rápida
router.get("/LobMounter", (req, res) => {
  const { data, shift, line_name } = req.query;
  
  // Query otimizada com uso de índices
  let mysql = `
    SELECT 
      mc_no, 
      CAST(ctime AS DECIMAL(10,2)) as ctime, 
      line_name, 
      lane, 
      bneck, 
      lot_name 
    FROM mydb.lob_npm 
    WHERE 1=1
  `;
  const params = [];
  
  // Ordem dos filtros é importante para usar o índice composto
  if (data) {
    mysql += " AND log_date = ?";
    params.push(data);
  }
  
  if (shift) {
    mysql += " AND shift = ?";
    params.push(shift);
  }
  
  if (line_name) {
    mysql += " AND line_name = ?";
    params.push(line_name);
  }
  
  // Ordenação otimizada
  mysql += " ORDER BY line_name, mc_no";
  
  // Usar query com promise para melhor performance
  db.query(mysql, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar dados do LobMounter:", err);
      res.status(500).json({ error: "Erro ao buscar dados", message: err.message });
    } else {
      res.json(result);
    }
  });
});


// ==========================================

router.get("/LobMounter/init-indexes", (req, res) => {
  const createIndexQueries = [
    // Índice composto para otimizar as buscas principais
    `CREATE INDEX IF NOT EXISTS idx_lob_npm_date_shift_line ON mydb.lob_npm (log_date, shift, line_name)`,
    // Índice para busca apenas por data
    `CREATE INDEX IF NOT EXISTS idx_lob_npm_date ON mydb.lob_npm (log_date)`,
    // Índice para busca por data e turno
    `CREATE INDEX IF NOT EXISTS idx_lob_npm_date_shift ON mydb.lob_npm (log_date, shift)`,
    // Índice para ordenação
    `CREATE INDEX IF NOT EXISTS idx_lob_npm_line_mc ON mydb.lob_npm (line_name, mc_no)`
  ];
  
  let completed = 0;
  const results = [];
  
  createIndexQueries.forEach((query, index) => {
    db.query(query, (err, result) => {
      if (err) {
        console.error(`Erro ao criar índice ${index + 1}:`, err);
        results.push({ index: index + 1, success: false, error: err.message });
      } else {
        console.log(`Índice ${index + 1} criado/atualizado com sucesso`);
        results.push({ index: index + 1, success: true });
      }
      completed++;
      
      if (completed === createIndexQueries.length) {
        res.json({ 
          message: "Processo de criação de índices concluído",
          results: results
        });
      }
    });
  });
});


///-----------------******************---------------------------------------------------------------------------------------
// ============================================================================
// ======================== ROTAS REPARO TNP IA COMPLETAS =======================
// ============================================================================

// ============================================================================
// ======================== ROTAS REPARO TNP IA (APENAS LEITURA) ===============
// ============================================================================

// Função auxiliar para gerar resposta fallback rica (sem IA)
const gerarRespostaFallback = (cases, totalCases, goodCount, ngCount, scrapCount, modelosUnicos, tecnicosUnicos, message = '') => {
  // Detectar tipo de pergunta
  const isQuantityQuestion = /(?:quantos|quantas|qual quantidade|quantidade|total de|número de|contagem)/i.test(message);
  const isTechQuestion = /(?:tecnicos|técnicos|tecnico|técnico)/i.test(message);
  const isMonthQuestion = /(?:janeiro|fevereiro|marco|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i.test(message);
  
  // Extrair mês mencionado (se houver)
  const monthNames = {
    'janeiro': 1, 'fevereiro': 2, 'marco': 3, 'março': 3,
    'abril': 4, 'maio': 5, 'junho': 6,
    'julho': 7, 'agosto': 8, 'setembro': 9,
    'outubro': 10, 'novembro': 11, 'dezembro': 12
  };
  
  let monthFilter = null;
  Object.keys(monthNames).forEach(month => {
    if (message.toLowerCase().includes(month)) {
      monthFilter = monthNames[month];
    }
  });
  
  // Filtrar casos por mês se necessário
  let filteredCases = cases;
  if (monthFilter) {
    filteredCases = cases.filter(c => c.mes_numero === monthFilter);
  }
  
  // Recalcular estatísticas com filtro
  const filteredTotal = filteredCases.length;
  const filteredGood = filteredCases.filter(c => c.resultado && c.resultado.toLowerCase().includes('good')).length;
  const filteredNg = filteredCases.filter(c => c.resultado && c.resultado.toLowerCase().includes('ng')).length;
  const filteredScrap = filteredCases.filter(c => c.resultado && c.resultado.toLowerCase().includes('scrap')).length;
  const filteredTecnicos = [...new Set(filteredCases.map(c => c.tecnico).filter(t => t))];
  
  // Respostas para perguntas de quantidade
  if (isQuantityQuestion) {
    if (isTechQuestion) {
      return `Foram encontrados **${filteredTecnicos.length} técnicos** diferentes no período.${monthFilter ? ` Em ${Object.keys(monthNames).find(k => monthNames[k] === monthFilter)}: **${filteredTecnicos.length} técnicos**.` : ''}

**Técnicos registrados:**
${filteredTecnicos.map(t => `- ${t}`).join('\n')}

**Distribuição por técnico:**
${filteredTecnicos.map(t => {
  const techCases = filteredCases.filter(c => c.tecnico === t);
  const techGood = techCases.filter(c => c.resultado && c.resultado.toLowerCase().includes('good')).length;
  return `- **${t}**: ${techCases.length} casos (${techGood} good, ${techCases.length - techGood} pendentes)`;
}).join('\n')}`;
    }
    
    if (message.toLowerCase().includes('good') || message.toLowerCase().includes('ok')) {
      return `Foram **${filteredGood} placas** com resultado Good no período.${monthFilter ? ` (${filteredTotal} total no mês)` : ''}`;
    }
    
    if (message.toLowerCase().includes('ng')) {
      return `Foram **${filteredNg} placas** com resultado NG no período.${monthFilter ? ` (${filteredTotal} total no mês)` : ''}`;
    }
    
    if (message.toLowerCase().includes('scrap')) {
      return `Foram **${filteredScrap} placas** com resultado Scrap no período.${monthFilter ? ` (${filteredTotal} total no mês)` : ''}`;
    }
    
    // Pergunta genérica de quantidade
    return `Foram encontrados **${filteredTotal} casos** no total.${monthFilter ? ` no período de ${Object.keys(monthNames).find(k => monthNames[k] === monthFilter)}` : ''}

**Distribuição por resultado:**
- Good: **${filteredGood}**
- NG: **${filteredNg}**
- Scrap: **${filteredScrap}**
- Pendentes: **${filteredTotal - filteredGood - filteredNg - filteredScrap}**`;
  }
  
  // Resposta fallback padrão
  let reply = `Encontrei **${filteredTotal} casos** no histórico de reparos.${monthFilter ? ` (${Object.keys(monthNames).find(k => monthNames[k] === monthFilter)})` : ''}

**Estatísticas:**
- Total: **${filteredTotal} casos**
- Good: **${filteredGood}** (${filteredTotal > 0 ? Math.round((filteredGood / filteredTotal) * 100) : 0}%)
- NG: **${filteredNg}**
- Scrap: **${filteredScrap}**

**Modelos relacionados:** ${modelosUnicos.slice(0, 5).join(', ') || 'N/A'}
**Técnicos:** ${filteredTecnicos.slice(0, 5).join(', ') || 'N/A'}

**Principais defeitos encontrados:**
${[...new Set(filteredCases.map(c => c.defeito).filter(d => d))].slice(0, 5).map(d => `- ${d}`).join('\n') || '- Nenhum defeito registrado'}

**Componentes mais trocados:**
${[...new Set(filteredCases.map(c => c.componente).filter(c => c))].slice(0, 5).map(c => `- ${c}`).join('\n') || '- Nenhuma troca registrada'}

Veja os casos históricos na tabela para mais detalhes.`;

  return reply;
};

module.exports = router;
