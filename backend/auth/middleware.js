const jwt = require("jsonwebtoken");
const db = require("../config/db");
const obterIp = require("./obterIp");

// Throttle em memória: só grava ultimo_ip/ultimo_acesso de um usuário no
// banco de novo depois de passado esse tempo, pra não bater no banco a cada
// requisição de quem está com uma tela de monitoramento aberta atualizando
// sozinha o tempo todo. O valor em si (pra "está online agora?") só precisa
// de precisão de minutos, não de segundo a segundo.
const INTERVALO_MIN_ATUALIZACAO_MS = 60 * 1000;
const ultimaAtualizacaoPorUsuario = new Map();

function registrarAcessoComThrottle(userId, ip) {
  const agora = Date.now();
  const ultima = ultimaAtualizacaoPorUsuario.get(userId) || 0;
  if (agora - ultima < INTERVALO_MIN_ATUALIZACAO_MS) return;
  ultimaAtualizacaoPorUsuario.set(userId, agora);

  db.query(`UPDATE mydb.users SET ultimo_ip = ?, ultimo_acesso = NOW() WHERE id = ?`, [ip, userId], (err) => {
    if (err) console.error("Erro ao atualizar último acesso: ", err);
  });
}

// Valida o token JWT do header Authorization: Bearer <token> e popula req.user.
// req.user = { id, nome, matricula, isAdmin, screens: [slug, ...] }
//
// Nota importante: a lista `screens` fica embutida no token no momento do
// login, para não precisar consultar o banco a cada requisição. Isso significa
// que se o administrador mudar as permissões de um usuário que já está
// logado, a mudança só entra em vigor no próximo login dele (o token expira
// em 12h - ver routes.js). Se isso virar um problema no futuro, dá pra trocar
// por uma consulta ao banco aqui dentro.
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token não fornecido" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({ message: "Token inválido ou expirado" });
    }
    req.user = payload;
    registrarAcessoComThrottle(payload.id, obterIp(req));
    next();
  });
}

// Libera a requisição se o usuário for admin, ou se a tela for pública,
// ou se o usuário tiver a tela (ou uma das telas, se passar uma lista)
// liberada. Use uma lista quando o mesmo arquivo de rotas do backend serve
// mais de uma tela do frontend (ex: variações "HoraHora"/"HoraHora2T").
function authorizeScreen(slugOrSlugs, { public: isPublic = false } = {}) {
  const slugs = Array.isArray(slugOrSlugs) ? slugOrSlugs : [slugOrSlugs];

  return (req, res, next) => {
    if (isPublic) return next();
    if (req.user && req.user.isAdmin) return next();

    const userScreens = (req.user && req.user.screens) || [];
    const allowed = slugs.some((slug) => userScreens.includes(slug));

    if (!allowed) {
      return res.status(403).json({ message: "Sem permissão para acessar esta tela" });
    }
    next();
  };
}

function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: "Apenas administradores podem acessar isto" });
  }
  next();
}

module.exports = { authenticateToken, authorizeScreen, requireAdmin };
