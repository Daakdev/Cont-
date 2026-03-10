const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
  const header = req.headers["authorization"];
  if (!header) return res.status(401).json({ error: "Token requerido" });

  const token = header.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token inválido" });

  try {
    const decoded  = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario    = decoded;           // { id, usuario, empresa_id }
    req.empresaId  = decoded.empresa_id;
    next();
  } catch {
    return res.status(403).json({ error: "Token expirado o inválido" });
  }
};