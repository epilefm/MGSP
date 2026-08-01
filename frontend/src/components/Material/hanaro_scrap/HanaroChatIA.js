import { API_URL } from '../../../config/api';
import React, { useState, useEffect, useRef } from 'react';
import { Send, Square, Bot, Sparkles, Maximize2, Minus, User, RefreshCw } from 'lucide-react';

// ============================================
// FUNÇÕES UTILITÁRIAS PARA FORMATAÇÃO DE RESPOSTAS DA IA
// ============================================

// Formatar valor monetário
const formatarMoeda = (valor) => {
  if (valor === undefined || valor === null) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
};

// Formatar número com separadores
const formatarNumero = (numero, casasDecimais = 0) => {
  if (numero === undefined || numero === null) return '0';
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: casasDecimais, maximumFractionDigits: casasDecimais }).format(numero);
};

// Detectar e extrair tabelas Markdown do texto
const extrairTabelasMarkdown = (texto) => {
  const tabelas = [];
  const linhas = texto.split('\n');
  let tabelaAtual = [];
  let emTabela = false;
  let cabecalhoIndex = -1;

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    
    if (linha.startsWith('|') && linha.endsWith('|')) {
      if (!emTabela) {
        emTabela = true;
        cabecalhoIndex = tabelaAtual.length;
      }
      const celulas = linha.split('|').filter((_, idx, arr) => idx !== 0 && idx !== arr.length - 1).map(c => c.trim());
      tabelaAtual.push(celulas);
    } else if (linha.startsWith('|-') || linha.startsWith('| :')) {
      continue;
    } else {
      if (emTabela && tabelaAtual.length > 0) {
        tabelas.push({
          cabecalho: tabelaAtual[0] || [],
          dados: tabelaAtual.slice(1).filter(row => row.length > 0 && !row.every(c => c.startsWith('-') || c.startsWith(':')))
        });
        tabelaAtual = [];
        emTabela = false;
        cabecalhoIndex = -1;
      }
    }
  }

  if (emTabela && tabelaAtual.length > 0) {
    tabelas.push({
      cabecalho: tabelaAtual[0] || [],
      dados: tabelaAtual.slice(1).filter(row => row.length > 0 && !row.every(c => c.startsWith('-') || c.startsWith(':')))
    });
  }

  return tabelas;
};

// Detectar e extrair títulos Markdown (###, ##, #)
const extrairTitulos = (texto) => {
  const titulos = [];
  const linhas = texto.split('\n');
  
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    const matchTitulo = linha.match(/^(#{1,6})\s+(.+)/);
    if (matchTitulo) {
      titulos.push({
        nivel: matchTitulo[1].length,
        texto: matchTitulo[2],
        linhaIndex: i
      });
    }
  }
  
  return titulos;
};

// Detectar e extrair listas do texto
const extrairListas = (texto) => {
  const listas = [];
  const linhas = texto.split('\n');
  let listaAtual = [];
  let emLista = false;

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    const matchLista = linha.match(/^(\s*)([-*•]|\d+\.)\s+(.*)/);
    
    if (matchLista) {
      if (!emLista) {
        emLista = true;
        listaAtual = [];
      }
      listaAtual.push({
        texto: matchLista[3],
        nivel: matchLista[1].length / 2
      });
    } else {
      if (emLista && listaAtual.length > 0) {
        listas.push(listaAtual);
        listaAtual = [];
        emLista = false;
      }
    }
  }

  if (emLista && listaAtual.length > 0) {
    listas.push(listaAtual);
  }

  return listas;
};

// Detectar cards de destaque
const extrairCards = (texto) => {
  const cards = [];
  const linhas = texto.split('\n');
  
  for (const linha of linhas) {
    const matchCard = linha.match(/\*\*([^*]+)\*\*:\s*(.+)/);
    if (matchCard) {
      cards.push({
        titulo: matchCard[1].trim(),
        valor: matchCard[2].trim()
      });
    }
    
    const matchEmoji = linha.match(/^([📊📈📉💰🔴🟢🟡⚠️✅❌📌🎯🏆👤📅🕐🏭🔧📱])\s*(.+)/);
    if (matchEmoji) {
      cards.push({
        emoji: matchEmoji[1],
        texto: matchEmoji[2].trim()
      });
    }
  }
  
  return cards;
};

// Componente de Tabela Formatada
const TabelaIA = ({ cabecalho, dados }) => {
  if (!cabecalho || cabecalho.length === 0) return null;
  
  return (
    <div style={{
      margin: '12px 0',
      border: '1px solid var(--border)',
      borderRadius: 8,
      overflow: 'hidden'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: cabecalho.map(() => '1fr').join(' '),
        background: 'var(--accent)',
        padding: '10px 12px',
        fontSize: 12,
        fontWeight: 700,
        color: '#fff',
        textAlign: 'center'
      }}>
        {cabecalho.map((col, idx) => (
          <div key={idx}>{col}</div>
        ))}
      </div>
      {dados && dados.map((linha, idxLinha) => (
        <div key={idxLinha} style={{
          display: 'grid',
          gridTemplateColumns: cabecalho.map(() => '1fr').join(' '),
          padding: '10px 12px',
          fontSize: 13,
          textAlign: 'center',
          color: 'var(--text-primary)',
          borderBottom: idxLinha < dados.length - 1 ? '1px solid var(--border)' : 'none',
          background: idxLinha % 2 === 0 ? 'var(--card-bg)' : 'var(--hover-bg)'
        }}>
          {linha.map((celula, idxCelula) => {
            const matchMoeda = celula.match(/R\$\s*([\d.,]+)/);
            if (matchMoeda) {
              return (
                <div key={idxCelula} style={{ fontWeight: 600, color: 'var(--success)' }}>
                  {formatarMoeda(parseFloat(matchMoeda[1].replace('.', '').replace(',', '.')))}
                </div>
              );
            }
            if (!isNaN(parseFloat(celula.replace('.', '').replace(',', '.')))) {
              return (
                <div key={idxCelula} style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>
                  {celula}
                </div>
              );
            }
            // Remover ** do texto para não mostrar visualmente
            const celulaLimpa = celula.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');
            return <div key={idxCelula}>{celulaLimpa}</div>;
          })}
        </div>
      ))}
    </div>
  );
};

// Componente de Título Formatado
const TituloIA = ({ nivel, texto }) => {
  const estilos = {
    1: { fontSize: 18, color: 'var(--accent)', fontWeight: 800, marginTop: 16, marginBottom: 12 },
    2: { fontSize: 16, color: 'var(--text-primary)', fontWeight: 700, marginTop: 14, marginBottom: 10 },
    3: { fontSize: 14, color: 'var(--text-primary)', fontWeight: 600, marginTop: 12, marginBottom: 8 },
    4: { fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, marginTop: 10, marginBottom: 6 },
  };
  
  const estilo = estilos[nivel] || estilos[3];
  
  return (
    <h3 style={{
      ...estilo,
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }}>
      <div style={{
        width: 4,
        height: nivel <= 2 ? 20 : 16,
        background: nivel <= 2 ? 'var(--accent)' : 'var(--accent)60',
        borderRadius: 2
      }} />
      {texto}
    </h3>
  );
};

// Componente de Lista Formatada
const ListaIA = ({ itens }) => {
  if (!itens || itens.length === 0) return null;
  
  const primeiraLinha = itens[0]?.texto || '';
  const eNumerada = /^\d+\./.test(primeiraLinha);
  
  return (
    <div style={{
      margin: '10px 0',
      paddingLeft: 8
    }}>
      {itens.map((item, idx) => (
        <div key={idx} style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          marginBottom: 8,
          padding: '10px 14px',
          background: 'var(--hover-bg)',
          borderRadius: 8,
          borderLeft: eNumerada 
            ? '3px solid var(--success)' 
            : '3px solid var(--accent)',
          transition: 'all 0.2s'
        }}>
          <div style={{
            minWidth: 24,
            height: 24,
            borderRadius: '50%',
            background: eNumerada ? 'var(--success)20' : 'var(--accent)20',
            color: eNumerada ? 'var(--success)' : 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "'DM Mono', monospace"
          }}>
            {eNumerada ? (idx + 1) : '•'}
          </div>
          <div style={{
            flex: 1,
            fontSize: 13,
            lineHeight: 1.6,
            color: 'var(--text-primary)'
          }}>
            {item.texto.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')}
          </div>
        </div>
      ))}
    </div>
  );
};

// Componente de Card de Destaque
const CardDestaqueIA = ({ titulo, valor, emoji, cor = 'var(--accent)' }) => {
  return (
    <div style={{
      display: 'inline-block',
      margin: '6px 8px 6px 0',
      padding: '10px 16px',
      background: `${cor}10`,
      border: `1px solid ${cor}40`,
      borderRadius: 10,
      boxShadow: `0 2px 8px ${cor}20`
    }}>
      <div style={{ fontSize: 11, color: cor, fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
        {emoji && <span>{emoji}</span>}
        {titulo}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'DM Mono', monospace" }}>
        {valor}
      </div>
    </div>
  );
};

// Componente principal para formatar resposta da IA
const FormatarRespostaIA = ({ conteudo }) => {
  if (!conteudo) return null;
  
  const titulos = extrairTitulos(conteudo);
  const tabelas = extrairTabelasMarkdown(conteudo);
  const listas = extrairListas(conteudo);
  const cards = extrairCards(conteudo);
  
  const processarTexto = (texto) => {
    return texto
      .replace(/^#{1,6}\s+(.+)/gm, '')
      .replace(/^\d+\.\s+(.+)/gm, '')
      .replace(/^[-*•]\s+(.+)/gm, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/^\s*$/gm, '')
      .trim();
  };
  
  const renderizarTextoFormatado = (texto) => {
    // Simplesmente remove ** e * do texto - a formatação visual já é feita pelos componentes
    return texto.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');
  };
  
  const paragrafos = conteudo
    .split(/\n\n+/)
    .filter(p => {
      const pLimpo = p.trim();
      return pLimpo && 
             !pLimpo.match(/^#{1,6}\s+/) && 
             !pLimpo.match(/^\d+\./) && 
             !pLimpo.match(/^[-*•]/) &&
             !pLimpo.startsWith('|');
    });
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {titulos.map((titulo, idx) => (
        <TituloIA key={idx} nivel={titulo.nivel} texto={titulo.texto} />
      ))}
      
      {cards.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '8px 0' }}>
          {cards.map((card, idx) => (
            <CardDestaqueIA
              key={idx}
              titulo={card.titulo || card.texto}
              valor={card.valor}
              emoji={card.emoji}
            />
          ))}
        </div>
      )}
      
      {tabelas.map((tabela, idx) => (
        <TabelaIA key={idx} cabecalho={tabela.cabecalho} dados={tabela.dados} />
      ))}
      
      {listas.length > 0 && listas.map((lista, idx) => (
        <ListaIA key={idx} itens={lista} />
      ))}
      
      {paragrafos.map((paragrafo, idx) => {
        const textoProcessado = processarTexto(paragrafo);
        if (!textoProcessado) return null;
        
        return (
          <p key={idx} style={{
            margin: 0,
            fontSize: 14,
            lineHeight: 1.7,
            color: 'var(--text-primary)',
            textAlign: 'justify'
          }}>
            {renderizarTextoFormatado(textoProcessado)}
          </p>
        );
      })}
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL DO CHAT IA
// ============================================

const HanaroChatIA = ({ 
  historicoData, 
  iaDadosCompletos, 
  setIaDadosCompletos,
  message 
}) => {
  // Estados
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: 'Olá! Sou o assistente de análise de scraps do Hanaro. Posso ajudar você a entender melhor os dados de scraps registrados. Faça uma pergunta sobre o histórico de scraps!',
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatController, setChatController] = useState(null);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [iaDadosLoading, setIaDadosLoading] = useState(false);
  
  const chatEndRef = useRef(null);

  // Função para buscar dados completos do banco para IA
  const buscarDadosParaIA = async () => {
    if (iaDadosCompletos) return iaDadosCompletos;
    
    setIaDadosLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/hanaro_scrap_dados_ia?limite=500`);
      const result = await response.json();
      
      if (result.success) {
        setIaDadosCompletos(result);
        console.log('[IA Dados] Dados completos carregados:', {
          totalRegistros: result.estatisticas?.totalRegistros,
          totalValor: result.estatisticas?.totalValor,
          modelosUnicos: result.estatisticas?.modelosUnicos?.length,
          causasUnicas: result.estatisticas?.causasUnicas?.length
        });
        return result;
      }
      return null;
    } catch (error) {
      console.error('[IA Dados] Erro ao buscar dados:', error);
      return null;
    } finally {
      setIaDadosLoading(false);
    }
  };

  // Função para chamar API do Gauss
  const callGaussAPI = async (message) => {
    const dadosCompletos = await buscarDadosParaIA();
    
    const historicoResumo = dadosCompletos?.estatisticas || {
      totalRegistros: historicoData.length,
      totalValor: historicoData.reduce((sum, item) => sum + (item.valor || 0), 0),
      totalQtd: historicoData.reduce((sum, item) => sum + (item.qtd || 0), 0),
      modelosUnicos: [...new Set(historicoData.map(item => item.modelo))],
      causasUnicas: [...new Set(historicoData.map(item => item.causa))],
      equipamentosUnicos: [...new Set(historicoData.map(item => item.equipamento))],
      linhasUnicas: [...new Set(historicoData.map(item => item.linha))],
      turnosUnicos: [...new Set(historicoData.map(item => item.turno))],
      origensUnicas: [...new Set(historicoData.map(item => item.origem))],
      porModelo: {},
      porCausa: {},
      porEquipamento: {},
      porLinha: {},
      porTurno: {},
      porOrigem: {}
    };

    console.log('[Gauss API] Dados completos do banco:', historicoResumo);

    // Obter data atual formatada
    const dataAtual = new Date();
    const dataFormatada = dataAtual.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const ontem = new Date(dataAtual);
    ontem.setDate(ontem.getDate() - 1);
    const ontemFormatado = ontem.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const systemPrompt = `Você é um assistente especializado em análise de dados de scraps industriais da Samsung. 
Você tem acesso aos seguintes dados do sistema Hanaro Scrap:

📅 DATA ATUAL: ${dataFormatada}
📅 ONTEM: ${ontemFormatado}

📊 RESUMO DOS DADOS:
- Total de registros: ${historicoResumo.totalRegistros || 0}
- Valor total em scraps: R$ ${(historicoResumo.totalValor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Quantidade total de peças: ${historicoResumo.totalQtd || 0}
- Modelos únicos: ${historicoResumo.modelosUnicos?.length > 0 ? historicoResumo.modelosUnicos.join(', ') : 'Nenhum registro'}
- Causas únicas: ${historicoResumo.causasUnicas?.length > 0 ? historicoResumo.causasUnicas.join(', ') : 'Nenhuma registrada'}
- Equipamentos únicos: ${historicoResumo.equipamentosUnicos?.length > 0 ? historicoResumo.equipamentosUnicos.join(', ') : 'Nenhum registro'}
- Linhas únicas: ${historicoResumo.linhasUnicas?.length > 0 ? historicoResumo.linhasUnicas.join(', ') : 'Nenhuma registrada'}
- Turnos únicos: ${historicoResumo.turnosUnicos?.length > 0 ? historicoResumo.turnosUnicos.join(', ') : 'Nenhum registrado'}

INSTRUÇÕES DE RESPOSTA:
- Responda SEMPRE em português brasileiro (pt-BR)
- Seja claro e objetivo
- Use os dados acima para fundamentar suas respostas
- Se não houver dados suficientes, informe ao usuário
- Você pode sugerir análises e insights baseados nos dados
- Formate números como moeda brasileira (R$ 1.234,56)
- ⚠️ IMPORTANTE: Considere SEMPRE a DATA ATUAL (${dataFormatada}) como referência para "hoje", "ontem", "esta semana", etc.
- Você PODE usar **asteriscos** para destacar termos importantes (ex: **Componente Faltando**)
- Você PODE usar emojis para organizar seções (ex: 📊, 🔴, ✅)

DADOS DISPONÍVEIS PARA ANÁLISE:
${JSON.stringify(historicoResumo, null, 2)}`;

    const payload = {
      input_type: 'chat',
      output_type: 'chat',
      input_value: `${systemPrompt}\n\n=== PERGUNTA DO USUÁRIO ===\n${message}`
    };

    console.log('[Gauss API] Enviando requisição:', payload);

    try {
      const controller = new AbortController();
      setChatController(controller);

      const response = await fetch('https://agent.sec.samsung.net/api/v1/run/ChatGauss-Hanaro?stream=false', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'sk-L6d36cORFh5iMzCZjF5L42FkLixzEf7hZvhr62O8K3g'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      console.log('[Gauss API] Status da resposta:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Gauss API] Erro na resposta:', errorText);
        throw new Error(`Erro na API: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('[Gauss API] Resposta completa:', JSON.stringify(result, null, 2));
      
      let resposta = '';
      
      if (result?.outputs?.[0]?.outputs?.[0]?.results?.message?.text) {
        resposta = result.outputs[0].outputs[0].results.message.text;
      }
      else if (result?.outputs?.[0]?.outputs?.[0]?.results?.message) {
        const msg = result.outputs[0].outputs[0].results.message;
        resposta = msg.text || msg.content || '';
      }
      else if (result?.outputs?.[0]?.outputs?.[0]) {
        const rawOutput = result.outputs[0].outputs[0];
        resposta = rawOutput.text 
          || rawOutput.content 
          || (rawOutput.results && (rawOutput.results.text || rawOutput.results.content))
          || (rawOutput.message && (rawOutput.message.text || rawOutput.message.content))
          || '';
      }
      else if (result?.outputs?.[0]?.outputs?.[0]?.text) {
        resposta = String(result.outputs[0].outputs[0].text);
      }
      else if (result?.outputs?.[0]?.message?.text) {
        resposta = String(result.outputs[0].message.text);
      }
      else {
        console.warn('[Gauss API] Não foi possível extrair resposta.');
        resposta = 'Desculpe, ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.';
      }
      
      if (typeof resposta !== 'string') {
        resposta = String(resposta);
      }
      
      console.log('[Gauss API] Resposta final:', resposta.substring(0, 200) + '...');
      
      if (!resposta || resposta.trim() === '') {
        return `Olá! Sou o assistente de análise de scraps. 
          
📊 DADOS CARREGADOS:
- Total de registros: ${historicoResumo.totalRegistros || 0}
- Valor total: R$ ${(historicoResumo.totalValor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Quantidade: ${historicoResumo.totalQtd || 0} peças
- Modelos: ${(historicoResumo.modelosUnicos || []).length} únicos
- Causas: ${(historicoResumo.causasUnicas || []).length} únicas

⚠️ A IA Gauss não respondeu. Isso pode ser um problema de conexão ou timeout. Tente novamente ou faça uma pergunta mais específica.`;
      }
      
      return resposta;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('[Gauss API] Requisição cancelada pelo usuário');
        return null;
      }
      console.error('[Gauss API] Erro completo:', error);
      throw error;
    }
  };

  // Função para enviar mensagem no chat
  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    
    setChatMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    setChatLoading(true);

    try {
      const response = await callGaussAPI(userMessage);
      
      if (response) {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: response,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.',
        timestamp: new Date(),
        error: true
      }]);
      if (message) message.error('Erro ao conectar com IA');
    } finally {
      setChatLoading(false);
      setChatController(null);
    }
  };

  // Função para parar geração
  const handleStopGeneration = () => {
    if (chatController) {
      chatController.abort();
      setChatController(null);
      setChatLoading(false);
    }
  };

  // Auto-scroll para última mensagem
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // CSS Variables
  const cssVars = {
    '--bg': '#f6f8fa',
    '--card-bg': '#ffffff',
    '--border': '#d0d7de',
    '--text-primary': '#1f2328',
    '--text-secondary': '#656d76',
    '--text-muted': '#9198a1',
    '--accent': '#0969da',
    '--accent-hover': '#0550ae',
    '--hover-bg': '#f6f8fa',
    '--ring-bg': '#eaeef2',
    '--success': '#22c55e',
    '--warning': '#f59e0b',
    '--error': '#ef4444',
    '--info': '#3b82f6',
  };

  return (
    <div style={{ 
      ...cssVars,
      background: 'var(--card-bg)',
      border: chatExpanded ? 'none' : '1px solid var(--border)',
      borderRadius: chatExpanded ? 0 : 12,
      marginTop: chatExpanded ? 0 : 25,
      padding: chatExpanded ? 20 : 24,
      height: chatExpanded ? 'calc(100vh - 64px)' : 'calc(100vh - 200px)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: chatExpanded ? 'fixed' : 'relative',
      top: chatExpanded ? 64 : 'auto',
      left: chatExpanded ? 0 : 'auto',
      width: chatExpanded ? '100vw' : 'auto',
      maxWidth: chatExpanded ? '100vw' : 'none',
      zIndex: 1000,
      boxShadow: chatExpanded ? '0 -4px 20px rgba(0,0,0,0.1)' : 'none'
    }}>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Sparkles size={16} color="#8b5cf6" />
            Análise IA - Gauss
          </h2>
          <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>Faça perguntas sobre os dados de scraps e receba insights inteligentes</p>
        </div>
        
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setChatExpanded(!chatExpanded)}
            title={chatExpanded ? 'Contrair' : 'Expandir'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: chatExpanded ? 'var(--accent)' : 'var(--hover-bg)',
              border: `1px solid ${chatExpanded ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 8,
              color: chatExpanded ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            {chatExpanded ? <Minus size={14} /> : <Maximize2 size={14} />}
            {chatExpanded ? 'Contrair' : 'Expandir'}
          </button>
          
          {chatLoading && (
            <button
              onClick={handleStopGeneration}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                background: '#ef4444',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              <Square size={16} fill="#fff" />
              Parar
            </button>
          )}
        </div>
      </div>

      {/* Área de Mensagens */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        marginBottom: 16,
        padding: '0 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}>
        {chatMessages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              gap: 12,
              maxWidth: msg.role === 'user' ? '85%' : '90%',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              animation: 'fadeIn 0.3s ease'
            }}
          >
            {msg.role === 'assistant' && (
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)'
              }}>
                <Bot size={20} color="#fff" />
              </div>
            )}
            
            <div style={{
              padding: msg.role === 'user' ? '12px 16px' : '14px 18px',
              borderRadius: 16,
              background: msg.role === 'user' 
                ? 'linear-gradient(135deg, #0969da, #0550ae)'
                : msg.error 
                  ? '#fef2f2'
                  : 'var(--hover-bg)',
              color: msg.role === 'user' ? '#fff' : msg.error ? '#dc2626' : 'var(--text-primary)',
              fontSize: 14,
              lineHeight: 1.5,
              boxShadow: msg.role === 'user' 
                ? '0 2px 8px rgba(9, 105, 218, 0.2)' 
                : '0 1px 3px rgba(0,0,0,0.08)',
              border: msg.error ? '1px solid #fecaca' : 'none'
            }}>
              {msg.role === 'user' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <User size={16} />
                  {msg.content}
                </div>
              ) : (
                <FormatarRespostaIA conteudo={msg.content} />
              )}
              <div style={{
                fontSize: 10,
                opacity: 0.6,
                marginTop: 6,
                textAlign: 'right'
              }}>
                {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {msg.role === 'user' && (
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #0969da, #0550ae)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(9, 105, 218, 0.3)'
              }}>
                <User size={20} color="#fff" />
              </div>
            )}
          </div>
        ))}
        
        {chatLoading && (
          <div style={{
            display: 'flex',
            gap: 12,
            maxWidth: '90%',
            alignSelf: 'flex-start',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)'
            }}>
              <Bot size={20} color="#fff" />
            </div>
            
            <div style={{
              padding: '14px 18px',
              borderRadius: 16,
              background: 'var(--hover-bg)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#8b5cf6',
                animation: 'bounce 1.4s infinite ease-in-out both',
                animationDelay: '0s'
              }} />
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#8b5cf6',
                animation: 'bounce 1.4s infinite ease-in-out both',
                animationDelay: '0.2s'
              }} />
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#8b5cf6',
                animation: 'bounce 1.4s infinite ease-in-out both',
                animationDelay: '0.4s'
              }} />
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>

      {/* Área de Input */}
      <div style={{
        display: 'flex',
        gap: 12,
        alignItems: 'flex-end',
        paddingTop: 16,
        borderTop: '1px solid var(--border)'
      }}>
        <div style={{
          flex: 1,
          position: 'relative'
        }}>
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Faça uma pergunta sobre os scraps... (Ex: Qual modelo teve mais scraps este mês?)"
            rows={1}
            style={{
              width: '100%',
              padding: '14px 16px',
              paddingRight: 50,
              border: '1px solid var(--border)',
              borderRadius: 12,
              background: 'var(--input-bg)',
              color: 'var(--text-primary)',
              fontSize: 14,
              outline: 'none',
              resize: 'none',
              minHeight: 48,
              maxHeight: 120,
              fontFamily: 'inherit',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--accent)';
              e.target.style.boxShadow = '0 0 0 3px rgba(9, 105, 218, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
        
        <button
          onClick={handleSendMessage}
          disabled={chatLoading || !chatInput.trim()}
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: chatLoading || !chatInput.trim()
              ? 'var(--border)'
              : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            border: 'none',
            color: chatLoading || !chatInput.trim() ? 'var(--text-muted)' : '#fff',
            cursor: chatLoading || !chatInput.trim() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            boxShadow: chatLoading || !chatInput.trim()
              ? 'none'
              : '0 2px 8px rgba(139, 92, 246, 0.3)'
          }}
        >
          {chatLoading ? (
            <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Send size={20} />
          )}
        </button>
      </div>
    </div>
  );
};

export default HanaroChatIA;
