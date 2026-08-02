// Extrai o IP de quem fez a requisição, lidando com o prefixo "::ffff:"
// que o Node usa pra representar IPv4 sobre IPv6 (deixa mais legível pro
// administrador, ex: "::ffff:192.168.0.116" vira "192.168.0.116").
function obterIp(req) {
  const encaminhado = req.headers["x-forwarded-for"];
  const bruto = (encaminhado ? encaminhado.split(",")[0].trim() : null) || req.socket?.remoteAddress || req.ip || null;
  return bruto ? bruto.replace(/^::ffff:/, "") : null;
}

module.exports = obterIp;
