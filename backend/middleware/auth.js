const jwt = require("jsonwebtoken");

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
    next();
  });
}

function authorizeDepartment(slug) {
  return (req, res, next) => {
    const departments = (req.user && req.user.departments) || [];
    if (!departments.includes(slug)) {
      return res.status(403).json({ message: "Sem permissão para este departamento" });
    }
    next();
  };
}

module.exports = { authenticateToken, authorizeDepartment };
