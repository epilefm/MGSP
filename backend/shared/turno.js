// Função para determinar o turno com base no horário atual
// Compartilhada entre Production (Gravação CN) e Material (WIP entrada/saída)
function determinarTurno() {
  const agora = new Date();
  const horas = agora.getHours();
  const minutos = agora.getMinutes();
  const segundos = agora.getSeconds();

  // Converter para segundos para facilitar a comparação
  const totalSegundos = horas * 3600 + minutos * 60 + segundos;

  // Definir os limites dos turnos em segundos
  const limite1TInicio = 6 * 3600 + 55 * 60; // 06:55:00 = 24900 segundos
  const limite1TFim = 16 * 3600 + 42 * 60 + 59; // 16:42:59 = 60179 segundos
  const limite2TInicio = 16 * 3600 + 43 * 60; // 16:43:00 = 60180 segundos
  const limite2TFim = 2 * 3600 + 11 * 60 + 55; // 02:11:55 = 7915 segundos (do dia seguinte)
  const limite3TInicio = 2 * 3600 + 12 * 60; // 02:12:00 = 7920 segundos
  const limite3TFim = 6 * 3600 + 54 * 60 + 59; // 06:54:59 = 24899 segundos

  // Determinar o turno com base nos horários
  if (totalSegundos >= limite1TInicio && totalSegundos <= limite1TFim) {
    return '1T';
  } else if (totalSegundos >= limite3TInicio && totalSegundos <= limite3TFim) {
    return '3T';
  } else {
    // Para o turno 2T, que cruza a meia-noite
    // Se for antes das 02:11:55 da manhã, é 2T do dia anterior
    // Se for depois das 16:43:00, é 2T do mesmo dia
    if (totalSegundos <= limite2TFim || totalSegundos >= limite2TInicio) {
      return '2T';
    }
  }

  // Padrão para 1T caso não se encaixe em nenhuma condição (não deve acontecer)
  return '1T';
}

module.exports = { determinarTurno };
