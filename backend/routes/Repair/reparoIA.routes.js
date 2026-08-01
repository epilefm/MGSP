const express = require("express");
const router = express.Router();
const db = require("../../config/db");

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

// ============================================================================
// ======================== ROTAS REPARO TNP IA (APENAS LEITURA) ===============
// ============================================================================

// Rota para buscar estatísticas gerais
router.get("/reparo-ia/stats", (req, res) => {
  const stats = {
    totalEntrada: 0,
    totalProcess: 0,
    totalAnalise: 0,
    taxaSucesso: 0,
    topComponents: [],
    topDefects: []
  };

  // Contar total de entradas
  db.query("SELECT COUNT(*) as total FROM mydb.reparo_entrada", (err, result) => {
    if (!err && result.length > 0) {
      stats.totalEntrada = result[0].total;
    }

    // Contar total de processos
    db.query("SELECT COUNT(*) as total FROM mydb.reparo_process", (err2, result2) => {
      if (!err2 && result2.length > 0) {
        stats.totalProcess = result2[0].total;
      }

      // Buscar top componentes trocados
      db.query(
        `SELECT Troca_Comp as comp, COUNT(*) as n FROM mydb.reparo_process
         WHERE Troca_Comp != '' AND Troca_Comp IS NOT NULL
         GROUP BY Troca_Comp ORDER BY n DESC LIMIT 5`,
        (err3, result3) => {
          if (!err3) {
            stats.topComponents = result3 || [];
          }

          // Buscar top defeitos
          db.query(
            `SELECT Defeito as defeito, COUNT(*) as n FROM mydb.reparo_process
             WHERE Defeito != '' AND Defeito IS NOT NULL
             GROUP BY Defeito ORDER BY n DESC LIMIT 5`,
            (err4, result4) => {
              if (!err4) {
                stats.topDefects = result4 || [];
              }

              // Calcular taxa de sucesso (Conserto OK / Troca OK)
              db.query(
                `SELECT Status, COUNT(*) as n FROM mydb.reparo_process
                 WHERE Status IN ('Conserto OK', 'Troca OK', 'OK')
                 GROUP BY Status`,
                (err5, result5) => {
                  if (!err5 && result5.length > 0) {
                    const successCount = result5.reduce((sum, r) => sum + r.n, 0);
                    stats.taxaSucesso = stats.totalProcess > 0
                      ? Math.round((successCount / stats.totalProcess) * 100)
                      : 0;
                  }

                  res.json(stats);
                }
              );
            }
          );
        }
      );
    });
  });
});

// Rota para buscar casos históricos baseados na mensagem - COM JOIN ENTRE TABELAS
// Suporta filtro por data, técnico, modelo, sintoma, CN, e perguntas genéricas
router.post("/reparo-ia/chat", (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Mensagem não fornecida" });
  }

  // Extrair termos de busca da mensagem
  const searchTerms = [];
  let dateFilter = '';
  let dateParams = [];

  // Tentar extrair modelo (padrões comuns)
  const modelMatch = message.match(/(?:modelo|model)\s*[:\-]?\s*([A-Z0-9\-]+)/i);
  if (modelMatch) {
    searchTerms.push({ field: 'e.Modelo', value: modelMatch[1] });
  }

  // Tentar extrair sintoma
  const symptomMatch = message.match(/(?:sintoma|falha|defeito|problema)\s*[:\-]?\s*(.+)/i);
  if (symptomMatch) {
    searchTerms.push({ field: 'e.Sintoma', value: symptomMatch[1].trim() });
  }

  // Tentar extrair CN
  const cnMatch = message.match(/(?:cn|CN)\s*[:\-]?\s*([A-Z0-9\-]+)/i);
  if (cnMatch) {
    searchTerms.push({ field: 'e.CN_rep', value: cnMatch[1] });
  }

  // Tentar extrair técnico
  const techMatch = message.match(/(?:tecnico|técnico|técnicos)\s*[:\-]?\s*([A-Za-z\s]+)/i);
  if (techMatch) {
    searchTerms.push({ field: 'p.Tecnico', value: techMatch[1].trim() });
  }

  // Detectar filtro de período (ex: "desde abril", "durante o mês de maio", "em maio", "mês de maio")
  const monthNames = {
    'janeiro': '01', 'fevereiro': '02', 'marco': '03', 'março': '03',
    'abril': '04', 'maio': '05', 'junho': '06',
    'julho': '07', 'agosto': '08', 'setembro': '09',
    'outubro': '10', 'novembro': '11', 'dezembro': '12'
  };
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentDay = now.getDate();
  const currentMonthStr = String(currentMonth).padStart(2, '0');

  // Regex melhorado para detectar QUALQUER menção de mês com filtro temporal
  const monthMatch = message.match(/(?:desde|a partir de|durante o|durante|no mês de|mes de| mês de|em|no|no ano de)\s+(janeiro|fevereiro|marco|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i);

  // Detectar "este mês", "esse mês", "mês atual", "desde o início do mês", "desde o inicio do mês"
  const thisMonthMatch = message.match(/(?:este|esse|atual|presente)\s*(?:mês|mes)|desde o início do mês|desde o inicio do mês|desde o começo do mês|início deste mês|inicio deste mês/i);

  if (thisMonthMatch) {
    // Filtro automático para o mês atual (do dia 1 até hoje)
    const startDate = `${currentYear}-${currentMonthStr}-01`;
    const endDate = `${currentYear}-${currentMonthStr}-${String(currentDay).padStart(2, '0')}`;
    dateFilter = ` AND DATE(e.Data) BETWEEN '${startDate}' AND '${endDate}'`;
    dateParams = [];
    console.log('[Reparo IA] Filtro "mês atual" aplicado:', startDate, 'até', endDate, '(hoje é dia', currentDay + ')');
  } else if (monthMatch) {
    const monthNum = monthNames[monthMatch[1].toLowerCase()];
    const startDate = `${currentYear}-${monthNum}-01`;

    // Calcular último dia do mês
    const lastDay = new Date(currentYear, parseInt(monthNum), 0).getDate();
    const endDate = `${currentYear}-${monthNum}-${String(lastDay).padStart(2, '0')}`;

    // Filtro de data com início E fim do mês (BETWEEN)
    dateFilter = ` AND DATE(e.Data) BETWEEN '${startDate}' AND '${endDate}'`;
    dateParams = []; // Já incluído na string SQL
    console.log('[Reparo IA] Filtro de data aplicado:', startDate, 'até', endDate);
  }

  // Detectar perguntas sobre técnicos/retrabalho/processo - busca TODOS os dados
  const isTechQuery = /(?:tecnicos|técnicos|tecnico|técnico|retrabalho|re-trabalho|analise|análise|processo|diagnostico|diagnóstico)/i.test(message);

  // Detectar filtro de LINHA (ex: "linha 5", "SMD-5", "na linha 16", "linhas 5 e 6")
  const lineMatches = message.match(/(?:linha|linhas|smd)[\s\-:]*([0-9]+(?:\s*(?:e|ou)\s*[0-9]+)*)/gi);
  if (lineMatches) {
    lineMatches.forEach(match => {
      const lineNum = match.match(/[0-9]+/)[0];
      searchTerms.push({ field: 'e.Linha', value: `SMD-${lineNum}` });
      console.log('[Reparo IA] Filtro de linha detectado:', `SMD-${lineNum}`);
    });
  }

  // Detectar termos de sintomas/defeitos/componentes para busca em MÚLTIPLAS COLUNAS
  // Isso captura termos que podem estar em: Sintoma, Defeito, Detalhe, Detalhes, Causa, Troca_Comp, Location
  const symptomDefectTerms = [];
  const symptomPatterns = [
    /sintomas?\s*(?:de|do|da|dos|das|:|-)?\s*([A-Za-z0-9\-_\s]+)/i,
    /defeitos?\s*(?:de|do|da|dos|das|:|-)?\s*([A-Za-z0-9\-_\s]+)/i,
    /falhas?\s*(?:de|do|da|dos|das|:|-)?\s*([A-Za-z0-9\-_\s]+)/i,
    /problemas?\s*(?:de|do|da|dos|das|:|-)?\s*([A-Za-z0-9\-_\s]+)/i,
    /erros?\s*(?:de|do|da|dos|das|:|-)?\s*([A-Za-z0-9\-_\s]+)/i,
    /componentes?\s*(?:de|do|da|dos|das|:|-)?\s*([A-Za-z0-9\-_\s]+)/i,
    /partes?\s*(?:de|do|da|dos|das|:|-)?\s*([A-Za-z0-9\-_\s]+)/i,
    /peças?\s*(?:de|do|da|dos|das|:|-)?\s*([A-Za-z0-9\-_\s]+)/i,
  ];

  symptomPatterns.forEach(pattern => {
    const match = message.match(pattern);
    if (match && match[1]) {
      const term = match[1].trim();
      if (term.length >= 3) { // Apenas termos com 3+ letras
        symptomDefectTerms.push(term);
      }
    }
  });

  // Se não encontrou padrões específicos, tentar extrair palavras-chave após preposições
  if (symptomDefectTerms.length === 0) {
    // Extrair termos após "de", "do", "da", "com", "em", "na", "no"
    const keywordMatch = message.match(/(?:de|do|da|dos|das|com|em|na|no|sobre)\s+([A-Za-z0-9\-_]{3,})/i);
    if (keywordMatch && keywordMatch[1]) {
      const term = keywordMatch[1].trim();
      // Ignorar palavras comuns
      const ignoreWords = ['que', 'qual', 'quais', 'como', 'quando', 'onde', 'por', 'para', 'uma', 'um', 'todo', 'toda', 'todos', 'todas'];
      if (!ignoreWords.includes(term.toLowerCase())) {
        symptomDefectTerms.push(term);
      }
    }
  }

  // Construir query de busca com JOIN entre entrada e processo via CN
  let whereClause = [];
  let params = [];

  // Se encontrou termos de sintoma/defeito, buscar em MÚLTIPLAS COLUNAS
  if (symptomDefectTerms.length > 0) {
    symptomDefectTerms.forEach(term => {
      // Buscar em: Sintoma, Defeito, Detalhe, Detalhes, Causa, Troca_Comp, Location (entrada e processo)
      whereClause.push(`(
        e.Sintoma LIKE ? OR
        e.Detalhe LIKE ? OR
        e.Causa LIKE ? OR
        e.Location LIKE ? OR
        p.Defeito LIKE ? OR
        p.Detalhes LIKE ? OR
        p.Troca_Comp LIKE ? OR
        p.Location LIKE ?
      )`);
      // Adicionar o mesmo termo 8 vezes (uma para cada coluna)
      for (let i = 0; i < 8; i++) {
        params.push(`%${term}%`);
      }
    });
  }

  // Adicionar outros termos de busca específicos (modelo, CN, técnico, linha)
  searchTerms.forEach(term => {
    whereClause.push(`${term.field} LIKE ?`);
    params.push(`%${term.value}%`);
  });

  // Se não encontrou termos específicos OU é pergunta sobre técnicos, busca todos
  if (whereClause.length === 0 || isTechQuery) {
    whereClause = ['1=1'];
    params = [];
  }

  // Query COMPLETA com JOIN entre TODAS as tabelas: reparo_entrada, reparo_process e reparo_saida
  // Inclui TODAS as colunas disponíveis para análise completa pela IA
  // Sem limite - retorna todos os casos encontrados para análise completa
  const query = `
    SELECT
      -- TODAS as colunas de reparo_entrada
      e.id as entrada_id,
      e.Data as data_entrada,
      DATE_FORMAT(e.Data, '%Y-%m-%d') as data_registro,
      TIME_FORMAT(e.Data, '%H:%i:%s') as hora_registro,
      e.Halb,
      e.Modelo,
      e.Linha,
      e.Turno as turno_entrada,
      e.Responsavel,
      e.Recebimento,
      e.Processo,
      e.Fase,
      e.Origem_SMD,
      e.Origem_Main,
      e.Causa,
      e.Sintoma,
      e.Detalhe,
      e.Location as location_entrada,
      e.CN_rep,
      e.Data_Feedback,

      -- TODAS as colunas de reparo_process
      p.id as processo_id,
      p.Data as data_processo,
      DATE_FORMAT(p.Data, '%Y-%m-%d') as data_processo_registro,
      TIME_FORMAT(p.Data, '%H:%i:%s') as hora_processo_registro,
      p.Tipo,
      p.Tecnico,
      p.Bancada,
      p.Troca_Comp,
      p.Detalhes as proc_detalhes,
      p.Defeito,
      p.Status,
      p.Location as location_processo,
      p.CN_processo,

      -- TODAS as colunas de reparo_saida (se existir)
      s.id as saida_id,
      s.Data_saida as data_saida,
      DATE_FORMAT(s.Data_saida, '%Y-%m-%d') as data_saida_registro,
      TIME_FORMAT(s.Data_saida, '%H:%i:%s') as hora_saida_registro,
      s.Saida,
      s.Linha_saida,
      s.Resp_saida,
      s.Receb_saida,
      s.CN_saida,
      s.Saida_Processo
    FROM mydb.reparo_entrada e
    LEFT JOIN mydb.reparo_process p ON e.CN_rep = p.CN_processo
    LEFT JOIN mydb.reparo_saida s ON p.CN_processo = s.CN_saida
    WHERE ${whereClause.join(' OR ')}${dateFilter}
    ORDER BY e.Data DESC
  `;

  const allParams = [...params, ...dateParams];
  console.log('[Reparo IA] Query:', query);
  console.log('[Reparo IA] Params:', allParams);

  db.query(query, allParams, (err, results) => {
    if (err) {
      console.error("Erro ao buscar casos:", err);
      return res.status(500).json({ error: "Erro ao buscar casos históricos" });
    }

    console.log('[Reparo IA] Resultados:', results.length);

    // Formatar casos para resposta - dados COMPLETOS das 3 tabelas (entrada, processo, saida)
    // Para perguntas sobre técnicos, incluir TODOS os casos com dados de processo
    const cases = results.map(r => ({
      modelo: r.Modelo,
      halb: r.Halb,
      linha: r.Linha,
      turno: r.Turno,
      sintoma: r.Sintoma,
      causa: r.Causa,
      detalhe: r.Detalhe,
      origem_smd: r.Origem_SMD,
      origem_main: r.Origem_Main,
      defeito: r.Defeito,
      componente: r.Troca_Comp,
      resultado: r.Status,
      tecnico: r.Tecnico,
      bancada: r.Bancada,
      detalhes_processo: r.ProcDetalhes,
      cn: r.CN_rep,
      // DATAS FORMATADAS PARA FILTRO TEMPORAL
      data_entrada: r.data_entrada,
      data_registro: r.data_registro,  // YYYY-MM-DD
      hora_registro: r.hora_registro,  // HH:MM:SS
      data_processo: r.data_processo,
      data_processo_registro: r.data_processo_registro,  // YYYY-MM-DD
      hora_processo: r.hora_processo_registro,  // HH:MM:SS
      data_saida: r.data_saida,
      data_saida_registro: r.data_saida_registro,  // YYYY-MM-DD
      hora_saida: r.hora_saida_registro,  // HH:MM:SS
      // Mes/Ano para filtro
      mes_ano: r.data_registro ? new Date(r.data_registro).toLocaleString('pt-BR', { month: 'long', year: 'numeric' }) : null,
      mes_numero: r.data_registro ? new Date(r.data_registro).getMonth() + 1 : null,
      ano: r.data_registro ? new Date(r.data_registro).getFullYear() : null
    })).filter(c =>
      isTechQuery
        ? (c.tecnico || c.defeito || c.componente || c.resultado)  // Para perguntas de técnico
        : (c.modelo || c.sintoma || c.defeito)  // Para outras perguntas
    );

    // Calcular estatísticas para o prompt
    const totalCases = cases.length;
    const goodCount = cases.filter(c => c.resultado && c.resultado.toLowerCase().includes('good')).length;
    const ngCount = cases.filter(c => c.resultado && c.resultado.toLowerCase().includes('ng')).length;
    const scrapCount = cases.filter(c => c.resultado && c.resultado.toLowerCase().includes('scrap')).length;
    const modelosUnicos = [...new Set(cases.map(c => c.modelo).filter(m => m))];
    const tecnicosUnicos = [...new Set(cases.map(c => c.tecnico).filter(t => t))];
    const mesesUnicos = [...new Set(cases.map(c => c.mes_ano).filter(m => m))];

    // Gerar prompt rico com TODOS os dados encontrados e CONTEXTO TEMPORAL
    const systemPrompt = `Você é um assistente especializado em análise de dados de reparo de placas industriais da Samsung.

=== CONTEXTO TEMPORAL DOS DADOS ===
- Período coberto: ${mesesUnicos.join(', ') || 'N/A'}
- Ano dos dados: ${cases[0]?.ano || new Date().getFullYear()}
- Filtro de data aplicado: ${dateFilter || 'Nenhum'}

=== ESTATÍSTICAS GERAIS ===
- Total de casos encontrados: ${totalCases}
- Casos com resultado GOOD: ${goodCount}
- Casos com resultado NG: ${ngCount}
- Casos com resultado SCRAP: ${scrapCount}
- Taxa de sucesso: ${totalCases > 0 ? Math.round((goodCount / totalCases) * 100) : 0}%

=== DADOS DISPONÍVEIS ===
- Modelos únicos: ${modelosUnicos.join(', ') || 'N/A'}
- Técnicos: ${tecnicosUnicos.join(', ') || 'N/A'}
- CNs analisadas: ${[...new Set(cases.map(c => c.cn).filter(c => c))].slice(0, 10).join(', ')}

=== INSTRUÇÕES DE RESPOSTA ===
1. Responda SEMPRE em português brasileiro (pt-BR)
2. Para perguntas de QUANTIDADE/CONTAGEM, use os valores exatos das estatísticas acima
3. Para perguntas com FILTRO DE MÊS, considere apenas casos com mes_numero correspondente:
   - janeiro=1, fevereiro=2, março=3, abril=4, maio=5, junho=6
   - julho=7, agosto=8, setembro=9, outubro=10, novembro=11, dezembro=12
4. Analise TODOS os casos históricos encontrados (não apenas 10)
5. Identifique padrões em: modelo, sintoma, causa, componente trocado, defeito
6. Use **asteriscos** para destacar termos importantes
7. Forneça valores NUMÉRICOS EXATOS quando perguntado sobre quantidades
8. Se houver múltiplos modelos, mencione todos

=== EXEMPLOS DE RESPOSTAS PARA PERGUNTAS DE CONTAGEM ===
- "Quantas placas good em maio?" → "Foram **${goodCount} placas** com resultado Good no período"
- "Qual quantidade de técnicos?" → "Foram **${tecnicosUnicos.length} técnicos** diferentes"
- "Quantos casos no total?" → "Foram **${totalCases} casos** registrados"

=== CASOS ENCONTRADOS (amostra dos primeiros 30 com DATAS) ===
${JSON.stringify(cases.slice(0, 30).map(c => ({
  cn: c.cn,
  modelo: c.modelo,
  resultado: c.resultado,
  tecnico: c.tecnico,
  defeito: c.defeito,
  componente: c.componente,
  data_registro: c.data_registro,
  mes_ano: c.mes_ano,
  mes_numero: c.mes_numero
})), null, 2)}

=== PERGUNTA DO USUÁRIO ===
${message}`;

    // Chamar API Gauss com timeout de 30 segundos
    const payload = {
      input_type: 'chat',
      output_type: 'chat',
      input_value: systemPrompt
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    fetch('https://agent.sec.samsung.net/api/v1/run/ChatGauss-Hanaro?stream=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'sk-L6d36cORFh5iMzCZjF5L42FkLixzEf7hZvhr62O8K3g'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    })
    .then(response => {
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`Erro na API Gauss: ${response.status}`);
      }
      return response.json();
    })
    .then(result => {
      let reply = '';

      if (result?.outputs?.[0]?.outputs?.[0]?.results?.message?.text) {
        reply = result.outputs[0].outputs[0].results.message.text;
      } else if (result?.outputs?.[0]?.outputs?.[0]) {
        const rawOutput = result.outputs[0].outputs[0];
        reply = rawOutput.text || rawOutput.content ||
                (rawOutput.results && (rawOutput.results.text || rawOutput.results.content)) ||
                (rawOutput.message && (rawOutput.message.text || rawOutput.message.content)) || '';
      }

      if (!reply || reply.trim() === '') {
        reply = gerarRespostaFallback(cases, totalCases, goodCount, ngCount, scrapCount, modelosUnicos, tecnicosUnicos);
      }

      // Calcular estatísticas
      const successCases = cases.filter(c => c.resultado && (c.resultado.includes('OK') || c.resultado.includes('Concluído'))).length;
      const taxaSucesso = totalCases > 0 ? Math.round((successCases / totalCases) * 100) : 0;

      res.json({
        reply,
        cases: cases.slice(0, 100), // Retorna até 100 casos
        stats: {
          total: totalCases,
          taxaSucesso
        }
      });
    })
    .catch(error => {
      console.error("Erro ao chamar Gauss API (usando fallback):", error.message);

      // Resposta fallback SEM IA - dados diretos do banco
      const successCases = cases.filter(c => c.resultado && (c.resultado.includes('OK') || c.resultado.includes('Concluído'))).length;
      const taxaSucesso = totalCases > 0 ? Math.round((successCases / totalCases) * 100) : 0;

      const fallbackReply = gerarRespostaFallback(cases, totalCases, goodCount, ngCount, scrapCount, modelosUnicos, tecnicosUnicos, message);

      res.json({
        reply: fallbackReply,
        cases: cases.slice(0, 100),
        stats: {
          total: totalCases,
          taxaSucesso
        }
      });
    });
  });
})

module.exports = router;
