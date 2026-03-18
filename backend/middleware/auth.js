const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
  const header = req.headers["authorization"];
  if (!header) return res.status(401).json({ error: "Token requerido" });

  const token = header.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token inválido" });

  try {
    const decoded     = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario       = decoded;
    req.empresaId     = decoded.empresa_id;
    req.usuarioId     = decoded.id;
    req.rol           = decoded.rol || "admin";

    if (!req.empresaId) {
      console.warn(`⚠️ Usuario ${req.usuarioId} sin empresa_id - usando fallback 1`);
      req.empresaId = 1;  // Fallback global empresa
    }

    next();
  } catch {
    return res.status(403).json({ error: "Token expirado — vuelve a iniciar sesión" });
  }
};