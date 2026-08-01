const express = require("express");
const router = express.Router();
const db = require("../../../config/db");
const { authorizeScreen } = require("../../../auth/middleware");
const requireScreen = authorizeScreen('Monit_Router');

// Rota para análise IA com Gauss (sem auth)
router.post('/router/ai-alerts', requireScreen, async (req, res) => {
  try {
    const { message, grid, date, alerts, linhas, totalOK, totalNG, totalSem, eficiencia } = req.body;

    console.log('[Router IA] Recebida requisição - message:', message ? 'com mensagem' : 'automático', 'linhas:', linhas?.length);

    const GAUSS_API_KEY = "sk-hnb1mbUqCDjbDrvtBi7XjXuBquJePCgH3wqWijKeF5Y";
    const GAUSS_URL = "https://agent.sec.samsung.net/api/v1/run/ChatGauss-Router?stream=false";

    const SYSTEM_PROMPT = `
Você é o assistente de análise de produção do Monitor Router — fábrica de placas SMD Samsung.
Regras obrigatórias:
1. SETUP: registros com tipo="SETUP" são trocas de modelo — não são paradas reais. Exclua da eficiência.
2. Turnos: 1T=07h–16h | 2T=17h–02h | 3T=03h–06h.
3. NG no início do 1T (07h–09h) = intervenção IMEDIATA.
4. Padrão OK→NG→OK→NG alternado = processo instável.
5. Parada real = SEM PLACA ≥3h consecutivas (excluindo SETUP).
6. Eficiência real = OK/(OK+NG+SEM PLACA)×100, excluindo SETUP.
7. Seja direto, linguagem técnica fabril, foque em insights e ações.
`.trim();

    // Build line stats
    const lineStats = linhas?.map(l => {
      const allRecs = Object.values(grid?.[l] || {}).flat();
      const ok    = allRecs.filter(r => r.status === 'OK'        && !r.tipo?.toUpperCase().includes('SETUP')).length;
      const ng    = allRecs.filter(r => r.status === 'NG'        && !r.tipo?.toUpperCase().includes('SETUP')).length;
      const sem   = allRecs.filter(r => r.status === 'SEM PLACA' && !r.tipo?.toUpperCase().includes('SETUP')).length;
      const setup = allRecs.filter(r => r.tipo?.toUpperCase().includes('SETUP')).length;
      const tot   = ok + ng + sem;
      const ef    = tot > 0 ? Math.round((ok / tot) * 100) : null;
      const causas = [...new Set(allRecs.filter(r => r.status === 'NG' && r.cause).map(r => r.cause))];
      return `${l}: OK=${ok} NG=${ng} S/P=${sem} SETUP=${setup} Ef=${ef!=null?ef+'%':'N/D'}${causas.length?' | Causas: '+causas.join(', '):''}`;
    }).join('\n') || '';

    let chatInput = message;

    // Modo automático: diagnóstico ao carregar
    if (!message || message === 'GERAR_ALERTAS_AUTOMATICOS') {
      const nowH = new Date().getHours();
      const turno = nowH >= 7 && nowH <= 16 ? '1T' : nowH >= 17 || nowH <= 2 ? '2T' : '3T';

      const high = alerts?.filter(a => a.severity === 'high') || [];
      const med = alerts?.filter(a => a.severity === 'medium') || [];

      chatInput = `
=== DIAGNÓSTICO AUTOMÁTICO — TURNO ${turno} | ${date} ===

VISÃO GERAL (sem SETUP): Ef=${eficiencia}% | OK=${totalOK} | NG=${totalNG} | S/Placa=${totalSem} | Linhas=${linhas?.length || 0}

ALERTAS CRÍTICOS (${high.length}):
${high.length ? high.map(a => `• [${a.linha}] ${a.type}: ${a.msg}`).join('\n') : 'Nenhum'}

ALERTAS DE ATENÇÃO (${med.length}):
${med.length ? med.map(a => `• [${a.linha}] ${a.type}: ${a.msg}`).join('\n') : 'Nenhum'}

STATUS POR LINHA:
${lineStats}

INSTRUÇÃO: Diagnóstico executivo do turno ${turno}. Identifique 2–3 linhas mais críticas, explique o padrão e liste ações prioritárias numeradas. Máximo 220 palavras.
      `.trim();
    } else {
      chatInput = `=== DADOS DE PRODUÇÃO — ${date} ===
Ef.Geral=${eficiencia}% | OK=${totalOK} | NG=${totalNG} | S/Placa=${totalSem}

STATUS POR LINHA (excluindo SETUP):
${lineStats}

PERGUNTA: ${message}

INSTRUÇÃO: Responda à pergunta acima usando os dados de produção fornecidos. Seja direto, técnico e objetivo. Máximo 200 palavras.`;
    }

    console.log('[Router IA] Enviando para Gauss URL:', GAUSS_URL);
    
    const gauss = await axios.post(
      GAUSS_URL,
      { inputs: { chat_input: chatInput, system_prompt: SYSTEM_PROMPT } },
      { 
        headers: { 
          Authorization: `Bearer ${GAUSS_API_KEY}`, 
          'Content-Type': 'application/json' 
        }, 
        timeout: 35000 
      }
    );

    console.log('[Router IA] Resposta Gauss recebida com sucesso');

    const response = gauss.data?.outputs?.message || gauss.data?.outputs?.output || 'Sem resposta da IA.';
    res.json({ success: true, response });
  } catch (err) {
    console.error('[Router IA] Erro detalhado:', {
      message: err.message,
      code: err.code,
      response: err.response?.data,
      status: err.response?.status
    });
    res.status(500).json({ 
      success: false, 
      error: 'IA indisponível',
      details: err.message,
      code: err.code
    });
  }
});

router.post("/Monit_Router_IA", requireScreen, async (req, res) => {
  try {
    const { message, grid, date, linhas, totalOK, totalNG, totalSem, eficiencia } = req.body;
    
    // API Key Gauss
    const GAUSS_API_KEY = "sk-hnb1mbUqCDjbDrvtBi7XjXuBquJePCgH3wqWijKeF5Y";
    const GAUSS_URL = "https://agent.sec.samsung.net/api/v1/run/ChatGauss-Router?stream=false";
    
    // Calcular estatísticas avançadas por linha
    const statsPorLinha = linhas?.map(l => {
      const lData = grid?.[l] || {};
      const horas = Object.keys(lData);
      const ok = horas.filter(h => lData[h]?.[0]?.status === 'OK').length;
      const ng = horas.filter(h => lData[h]?.[0]?.status === 'NG').length;
      const sem = horas.filter(h => lData[h]?.[0]?.status === 'SEM PLACA').length;
      const total = ok + ng + sem;
      const ef = total > 0 ? Math.round((ok / total) * 100) : 0;
      const causas = horas.filter(h => lData[h]?.[0]?.cause).map(h => lData[h][0].cause).filter(Boolean);
      const causasUnicas = [...new Set(causas)];
      
      // Identificar períodos de parada consecutiva
      let maxParadaConsecutiva = 0;
      let paradaAtual = 0;
      for (let h = 0; h < 24; h++) {
        const status = lData[h]?.[0]?.status;
        if (status === 'SEM PLACA') {
          paradaAtual++;
          maxParadaConsecutiva = Math.max(maxParadaConsecutiva, paradaAtual);
        } else {
          paradaAtual = 0;
        }
      }
      
      return {
        linha: l,
        ok, ng, sem, total, eficiencia: ef,
        causas: causasUnicas,
        maxParadaConsecutiva,
        isCritica: ef < 50 || ng >= 3 || maxParadaConsecutiva >= 3,
        isAtencao: ef >= 50 && ef < 70 || ng >= 2 || maxParadaConsecutiva >= 2
      };
    }) || [];
    
    // Identificar piores linhas automaticamente
    const pioresLinhas = [...statsPorLinha]
      .sort((a, b) => a.eficiencia - b.eficiencia)
      .slice(0, 5);
    
    // Identificar linhas com mais NGs
    const linhasMaisNG = [...statsPorLinha]
      .sort((a, b) => b.ng - a.ng)
      .filter(l => l.ng > 0)
      .slice(0, 5);
    
    // Identificar linhas paradas
    const linhasParadas = statsPorLinha
      .filter(l => l.sem > 0)
      .sort((a, b) => b.sem - a.sem)
      .slice(0, 5);
    
    // Detectar tipo de pergunta
    const msgLower = message.toLowerCase();
    const isGreeting = msgLower.match(/^(ol[aá|o]|oi|bom dia|boa tarde|boa noite|hello|hi|hey|salve)/);
    const isThanks = msgLower.match(/(obrigad|valeu|thanks|agradec)/);
    const isGeneric = message.trim().length <= 3 || isGreeting || isThanks;
    
    // Construir prompt INTELIGENTE e CONTEXTUAL
    let contextoDados = "=== SISTEMA DE ANALISE INTELIGENTE - MONITORAMENTO ROUTER ===\n\n";
    contextoDados += "CONTEXTO: Você é um especialista em análise de produção industrial Samsung. Responda SEMPRE em português brasileiro (pt-BR).\n\n";
    
    contextoDados += "📅 DATA DE REFERÊNCIA: " + date + "\n\n";
    
    contextoDados += "📊 RESUMO GERAL DA PRODUÇÃO:\n";
    contextoDados += "├─ Total de Linhas Monitoradas: " + (linhas?.length || 0) + "\n";
    contextoDados += "├─ Registros OK: " + totalOK + "\n";
    contextoDados += "├─ Registros NG (Divergência): " + totalNG + "\n";
    contextoDados += "├─ Registros SEM PLACA (Parada): " + totalSem + "\n";
    contextoDados += "└─ Eficiência Geral: " + eficiencia + "%\n\n";
    
    // Análise crítica automática
    const linhasCriticas = statsPorLinha.filter(l => l.isCritica);
    const linhasAtencao = statsPorLinha.filter(l => l.isAtencao && !l.isCritica);
    const totalLinhas = statsPorLinha.length;
    const pctCriticas = totalLinhas > 0 ? Math.round((linhasCriticas.length / totalLinhas) * 100) : 0;
    const pctSaudaveis = totalLinhas > 0 ? Math.round(((totalLinhas - linhasCriticas.length) / totalLinhas) * 100) : 0;
    
    contextoDados += "🚨 ANÁLISE DE SAÚDE DA PRODUÇÃO:\n";
    contextoDados += "├─ Linhas CRÍTICAS: " + linhasCriticas.length + " (" + pctCriticas + "%)\n";
    contextoDados += "├─ Linhas com ATENÇÃO: " + linhasAtencao.length + "\n";
    contextoDados += "└─ Linhas SAUDÁVEIS: " + (totalLinhas - linhasCriticas.length - linhasAtencao.length) + " (" + pctSaudaveis + "%)\n\n";
    
    // Detecção de padrões temporais
    const horasPicoNG = {};
    const horasPicoParada = {};
    statsPorLinha.forEach(l => {
      const lData = grid?.[l.linha] || {};
      Object.entries(lData).forEach(([hora, inspections]) => {
        if (!inspections?.length) return;
        const status = inspections[0].status;
        if (status === 'NG') {
          horasPicoNG[hora] = (horasPicoNG[hora] || 0) + 1;
        } else if (status === 'SEM PLACA') {
          horasPicoParada[hora] = (horasPicoParada[hora] || 0) + 1;
        }
      });
    });
    
    const horaPicoNG = Object.entries(horasPicoNG).sort((a,b) => b[1] - a[1])[0];
    const horaPicoParada = Object.entries(horasPicoParada).sort((a,b) => b[1] - a[1])[0];
    
    contextoDados += "⏰ PADRÕES TEMPORAIS DETECTADOS:\n";
    if (horaPicoNG) {
      contextoDados += "├─ Horário com MAIS NGs: " + horaPicoNG[0] + "h (" + horaPicoNG[1] + " ocorrências)\n";
    }
    if (horaPicoParada) {
      contextoDados += "└─ Horário com MAIS Paradas: " + horaPicoParada[0] + "h (" + horaPicoParada[1] + " ocorrências)\n";
    }
    if (!horaPicoNG && !horaPicoParada) {
      contextoDados += "└─ Sem padrões temporais significativos\n";
    }
    contextoDados += "\n";
    
    // Agrupar causas mais comuns
    const todasCausas = {};
    statsPorLinha.forEach(l => {
      l.causas.forEach(c => {
        todasCausas[c] = (todasCausas[c] || 0) + 1;
      });
    });
    const topCausas = Object.entries(todasCausas).sort((a,b) => b[1] - a[1]).slice(0, 5);
    
    contextoDados += "🔍 TOP 5 CAUSAS DE DEFEITOS:\n";
    if (topCausas.length > 0) {
      topCausas.forEach((c, i) => {
        contextoDados += "├─ " + (i+1) + ". " + c[0] + " (" + c[1] + " ocorrências)\n";
      });
    } else {
      contextoDados += "└─ Nenhuma causa registrada\n";
    }
    contextoDados += "\n";
    
    contextoDados += "📉 PIORES LINHAS (Ranking por Eficiência):\n";
    if (pioresLinhas.length > 0) {
      pioresLinhas.forEach((l, i) => {
        contextoDados += "├─ " + (i+1) + ". " + l.linha + ": " + l.eficiencia + "% EF | " + l.ok + "OK | " + l.ng + "NG | " + l.sem + "h parada\n";
        if (l.causas.length > 0) {
          contextoDados += "│   Causas: " + l.causas.join(', ') + "\n";
        }
      });
    } else {
      contextoDados += "└─ Nenhuma linha crítica identificada\n";
    }
    contextoDados += "\n";
    
    contextoDados += "⚠️ LINHAS COM MAIS DEFEITOS (NGs):\n";
    if (linhasMaisNG.length > 0) {
      linhasMaisNG.forEach((l, i) => {
        contextoDados += "├─ " + (i+1) + ". " + l.linha + ": " + l.ng + " defeitos\n";
        if (l.causas.length > 0) {
          contextoDados += "│   Causas: " + l.causas.join(', ') + "\n";
        }
      });
    } else {
      contextoDados += "└─ Nenhum defeito registrado\n";
    }
    contextoDados += "\n";
    
    contextoDados += "🛑 LINHAS PARADAS (Sem Placa):\n";
    if (linhasParadas.length > 0) {
      linhasParadas.forEach((l, i) => {
        contextoDados += "├─ " + (i+1) + ". " + l.linha + ": " + l.sem + "h paradas (máx " + l.maxParadaConsecutiva + "h consecutivo)\n";
      });
    } else {
      contextoDados += "└─ Nenhuma parada registrada\n";
    }
    contextoDados += "\n";
    
    contextoDados += "📋 DETALHAMENTO COMPLETO POR LINHA:\n";
    statsPorLinha.forEach(l => {
      let status = l.isCritica ? '🔴 CRÍTICA' : l.isAtencao ? '🟡 ATENÇÃO' : '🟢 NORMAL';
      contextoDados += "├─ " + l.linha + ": EF=" + l.eficiencia + "% | OK=" + l.ok + " | NG=" + l.ng + " | PARADA=" + l.sem + "h [" + status + "]\n";
    });
    contextoDados += "\n";
    
    contextoDados += "💬 PERGUNTA DO USUÁRIO: \"" + message + "\"\n\n";
    
    // Instruções INTELIGENTES baseadas no tipo de pergunta
    contextoDados += "🧠 INSTRUÇÕES DE RESPOSTA:\n\n";
    
    if (isGreeting) {
      contextoDados += "→ É UMA SAUDAÇÃO! Responda de forma AMIGÁVEL e PROFISSIONAL:\n";
      contextoDados += "  1. Cumprimente de volta de forma breve\n";
      contextoDados += "  2. Apresente-se como assistente de análise Router\n";
      contextoDados += "  3. Mencione o status atual (ex: " + linhasCriticas.length + " linhas críticas, eficiência de " + eficiencia + "%)\n";
      contextoDados += "  4. OFEREÇA AJUDA ESPECÍFICA com exemplos:\n";
      contextoDados += "     - 'Quais linhas estão com problemas?'\n";
      contextoDados += "     - 'Mostre o resumo da produção'\n";
      contextoDados += "     - 'Quais os defeitos mais comuns?'\n";
      contextoDados += "     - 'Análise da linha SMD-XX'\n";
      contextoDados += "  5. NÃO mostre dados detalhados ainda - apenas convide para perguntar\n\n";
    } else if (isThanks) {
      contextoDados += "→ É UM AGRADECIMENTO! Responda de forma CORDIAL:\n";
      contextoDados += "  1. Agradeça de volta brevemente\n";
      contextoDados += "  2. Reforce que está disponível para ajudar\n";
      contextoDados += "  3. Sugira uma próxima ação útil baseada nos dados\n\n";
    } else if (msgLower.match(/(resumo|geral|panorama|overview|tudo)/)) {
      contextoDados += "→ É UM RESUMO GERAL! Estruture assim:\n";
      contextoDados += "  1. Comece com visão macro (total linhas, eficiência)\n";
      contextoDados += "  2. Destaque pontos CRÍTICOS primeiro (linhas vermelhas)\n";
      contextoDados += "  3. Mencione padrões temporais se houver\n";
      contextoDados += "  4. Liste top 3-5 problemas\n";
      contextoDados += "  5. Termine com recomendações de ação\n\n";
    } else if (msgLower.match(/(pior|crítica|problema|defeito|ng|falha)/)) {
      contextoDados += "→ É SOBRE PROBLEMAS! Estruture assim:\n";
      contextoDados += "  1. Liste linhas críticas em ordem de gravidade\n";
      contextoDados += "  2. Para CADA linha: mostre EF%, NGs, causas, horas parada\n";
      contextoDados += "  3. Identifique padrão de causas (ex: mesma causa em múltiplas linhas)\n";
      contextoDados += "  4. Sugira ações corretivas específicas por causa\n";
      contextoDados += "  5. Priorize: o que resolver primeiro e por quê\n\n";
    } else if (msgLower.match(/(linha|smd-|smd\d+)/)) {
      contextoDados += "→ É SOBRE LINHA ESPECÍFICA! Estruture assim:\n";
      contextoDados += "  1. Identifique QUAL linha o usuário quer (ou liste todas se não especificou)\n";
      contextoDados += "  2. Para a linha: mostre todos os dados (OK, NG, paradas, causas, eficiência)\n";
      contextoDados += "  3. Compare com média geral das outras linhas\n";
      contextoDados += "  4. Classifique: está acima/abaixo da média?\n";
      contextoDados += "  5. Sugira ações se necessário\n\n";
    } else if (msgLower.match(/(parada|sem placa|parado|inativo)/)) {
      contextoDados += "→ É SOBRE PARADAS! Estruture assim:\n";
      contextoDados += "  1. Total de horas paradas no dia\n";
      contextoDados += "  2. Linhas paradas ordenadas por tempo\n";
      contextoDados += "  3. Identifique paradas CONSECUTIVAS (mais graves)\n";
      contextoDados += "  4. Horário do dia com mais paradas\n";
      contextoDados += "  5. Sugira investigação de causa raiz\n\n";
    } else if (msgLower.match(/(previs|predi|tendência|tendencia|proximo|próximo|amanh|futur)/)) {
      contextoDados += "→ É PREVISÃO/TENDÊNCIA! Estruture assim:\n";
      contextoDados += "  1. Analise padrões atuais (horários pico, causas recorrentes)\n";
      contextoDados += "  2. Projete riscos para próximo turno/dia baseado em tendências\n";
      contextoDados += "  3. Linhas que podem piorar (eficiência caindo)\n";
      contextoDados += "  4. Recomende ações PREVENTIVAS\n";
      contextoDados += "  5. Use linguagem de probabilidade ('provavelmente', 'risco de')\n\n";
    } else {
      contextoDados += "→ PERGUNTA GENÉRICA! Estruture assim:\n";
      contextoDados += "  1. Interprete a intenção da pergunta\n";
      contextoDados += "  2. Use os dados acima para responder de forma RELEVANTE\n";
      contextoDados += "  3. Seja específico: cite linhas, números, causas\n";
      contextoDados += "  4. Se não entender, peça esclarecimento MAS dê opções\n";
      contextoDados += "  5. Sugira próximas perguntas úteis\n\n";
    }
    
    contextoDados += "📏 REGRAS GERAIS:\n";
    contextoDados += "  • Use emojis moderadamente para destacar (🔴🟡🟢⚠️📊)\n";
    contextoDados += "  • Use **negrito** para números e termos importantes\n";
    contextoDados += "  • NUNCA invente dados - use APENAS os dados fornecidos\n";
    contextoDados += "  • Se não houver dados para algo, diga 'Sem registros'\n";
    contextoDados += "  • Mantenha tom profissional mas acessível\n";
    contextoDados += "  • Responda em português brasileiro (pt-BR)\n";

    // Chamar API Gauss
    const response = await axios.post(GAUSS_URL, {
      input_type: "chat",
      output_type: "chat",
      input_value: contextoDados
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': GAUSS_API_KEY
      }
    });

    // Retornar resposta da IA
    res.json({
      success: true,
      response: response.data?.output_value || response.data?.response || "Sem resposta da IA",
      raw: response.data
    });

  } catch (error) {
    console.error("Erro na API Gauss:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      fallback: true,
      message: "Erro ao conectar com IA. Usando análise local."
    });
  }
});
module.exports = router;
