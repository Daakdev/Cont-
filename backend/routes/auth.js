const express  = require("express");
const router   = express.Router();
const bcrypt   = require("bcrypt");
const jwt      = require("jsonwebtoken");
const Usuario  = require("../models/usuario");
const Empresa  = require("../models/empresa");

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { usuario, correo, password, nombreEmpresa } = req.body;
  try {
    const existe = await Usuario.findOne({ where: { usuario } });
    if (existe) return res.status(400).json({ error: "El usuario ya existe" });

    // Crear empresa para este usuario
    const empresa = await Empresa.create({ nombre: nombreEmpresa || `Empresa de ${usuario}` });

    const hash = await bcrypt.hash(password, 10);
    await Usuario.create({ usuario, correo, password: hash, empresa_id: empresa.id });

    res.json({ mensaje: "Registro exitoso" });
  } catch (err) {
    console.error("Error en /register:", err);
    res.status(500).json({ error: "Error en servidor" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { usuario, password } = req.body;
  try {
    const user = await Usuario.findOne({ where: { usuario }, include: [{ model: Empresa, as: "empresa" }] });
    if (!user) return res.status(400).json({ error: "Usuario no encontrado" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign(
      { id: user.id, usuario: user.usuario, empresa_id: user.empresa_id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, usuario: user.usuario, empresa: user.empresa?.nombre });
  } catch (err) {
    console.error("Error en /login:", err);
    res.status(500).json({ error: "Error en servidor" });
  }
});

module.exports = router;