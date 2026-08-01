// ==========================================
// Hanaro - Valores Disponíveis para Filtros Correlacionados
// ==========================================
// Helper para construir condições WHERE dinâmicas
// Aplica TODOS os filtros recebidos (comportamento de segmentação de dados do Excel)
const buildFilterConditions = (req) => {
  const conditions = [];
  const params = [];
  const { dataInicio, dataFim, modelo, origem, equipamento, causa, linha, fase, turno, responsavel, tipo_scrap } = req.query;
  
  // Sempre filtra por status Aprovado e data
  conditions.push("status = 'Aprovado'");
  if (dataInicio && dataFim) {
    conditions.push("DATE(data_hora) BETWEEN ? AND ?");
    params.push(dataInicio, dataFim);
  } else {
    const hoje = new Date().toISOString().split('T')[0];
    conditions.push("DATE(data_hora) >= ?");
    params.push(hoje);
  }
  
  // Adiciona TODOS os filtros (incluindo o do próprio gráfico)
  // Isso faz com que cada gráfico mostre apenas os dados filtrados por TODOS os campos selecionados
  if (modelo) {
    conditions.push("modelo_nome = ?");
    params.push(modelo);
  }
  if (origem) {
    conditions.push("origem_nome = ?");
    params.push(origem);
  }
  if (equipamento) {
    conditions.push("equipamento_nome = ?");
    params.push(equipamento);
  }
  if (causa) {
    conditions.push("causa_nome = ?");
    params.push(causa);
  }
  if (linha) {
    conditions.push("linha_nome = ?");
    params.push(linha);
  }
  if (fase) {
    conditions.push("tipo_placa = ?");
    params.push(fase);
  }
  if (turno) {
    conditions.push("turno = ?");
    params.push(turno);
  }
  if (responsavel) {
    conditions.push("nome_operador = ?");
    params.push(responsavel);
  }
  if (tipo_scrap) {
    conditions.push("tipo_scrap = ?");
    params.push(tipo_scrap);
  }
  
  return { conditions, params };
};

module.exports = { buildFilterConditions };
