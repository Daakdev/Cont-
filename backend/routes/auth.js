const express  = require("express");
const router   = express.Router();
const bcrypt   = require("bcrypt");
const jwt      = require("jsonwebtoken");
const Usuario  = require("../models/usuario");
const Empresa  = require("../models/empresa");

// POST /api/auth/register  →  crea cuenta admin normal
router.post("/register", async (req, res) => {
  const { usuario, correo, password, nombreEmpresa } = req.body;
  try {
    const existe = await Usuario.findOne({ where: { usuario } });
    if (existe) return res.status(400).json({ error: "El usuario ya existe" });

    const empresa = await Empresa.create({ nombre: nombreEmpresa || `Empresa de ${usuario}` });
    const hash    = await bcrypt.hash(password, 10);
    await Usuario.create({ usuario, correo, password: hash, rol: "admin", empresa_id: empresa.id });

    res.json({ mensaje: "Registro exitoso" });
  } catch (err) {
    console.error("Error en /register:", err);
    res.status(500).json({ error: "Error en servidor" });
  }
});

// POST /api/auth/register-dev  →  crea cuenta desarrollador (requiere DEV_SECRET)
router.post("/register-dev", async (req, res) => {
  const { usuario, correo, password, dev_secret } = req.body;

  if (!dev_secret || dev_secret !== process.env.DEV_SECRET) {
    return res.status(403).json({ error: "No autorizado" });
  }

  try {
    const existe = await Usuario.findOne({ where: { usuario } });
    if (existe) return res.status(400).json({ error: "El usuario ya existe" });

    // El dev comparte una empresa global o crea la suya
    let empresa = await Empresa.findOne({ where: { nombre: "Cont+ Dev" } });
    if (!empresa) empresa = await Empresa.create({ nombre: "Cont+ Dev" });

    const hash = await bcrypt.hash(password, 10);
    const nuevoUsuario = await Usuario.create({
      usuario, correo, password: hash,
      rol: "desarrollador",
      empresa_id: empresa.id
    });

    res.json({ mensaje: "Desarrollador creado", usuario: nuevoUsuario.usuario });
  } catch (err) {
    console.error("Error en /register-dev:", err);
    res.status(500).json({ error: "Error en servidor" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { usuario, password } = req.body;
  try {
    const user = await Usuario.findOne({
      where: { usuario },
      include: [{ model: Empresa, as: "empresa" }]
    });
    if (!user) return res.status(400).json({ error: "Usuario no encontrado" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign(
      { id: user.id, usuario: user.usuario, empresa_id: user.empresa_id, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      usuario: {
        id:       user.id,
        nombre:   user.usuario,
        correo:   user.correo,
        rol:      user.rol || "admin",
        empresa_id: user.empresa_id
      },
      empresa: user.empresa?.nombre
    });
  } catch (err) {
    console.error("Error en /login:", err);
    res.status(500).json({ error: "Error en servidor" });
  }
});


// POST /api/auth/fix-empresa  →  crea y asigna empresa a usuarios sin empresa_id
// Endpoint temporal — eliminar en producción final
router.post("/fix-empresa", async (req, res) => {
  const { dev_secret } = req.body;
  if (!dev_secret || dev_secret !== process.env.DEV_SECRET) {
    return res.status(403).json({ error: "No autorizado" });
  }
  try {
    const usuarios = await Usuario.findAll({ where: { empresa_id: null } });
    const resultados = [];
    for (const u of usuarios) {
      let empresa = await Empresa.findOne({ where: { nombre: `Empresa de ${u.usuario}` } });
      if (!empresa) empresa = await Empresa.create({ nombre: `Empresa de ${u.usuario}` });
      await u.update({ empresa_id: empresa.id });
      resultados.push({ usuario: u.usuario, empresa_id: empresa.id });
    }
    res.json({ mensaje: `${resultados.length} usuario(s) corregidos`, resultados });
  } catch (err) {
    console.error("Error en /fix-empresa:", err.message);
    res.status(500).json({ error: err.message });
  }
});


// POST /api/auth/listar-usuarios  →  ver todos los usuarios
router.post("/listar-usuarios", async (req, res) => {
  const { dev_secret } = req.body;
  if (!dev_secret || dev_secret !== process.env.DEV_SECRET) {
    return res.status(403).json({ error: "No autorizado" });
  }
  try {
    const usuarios = await Usuario.findAll({
      attributes: ["id", "usuario", "correo", "rol", "empresa_id"],
      include: [{ model: Empresa, as: "empresa", attributes: ["nombre"] }]
    });
    res.json({ usuarios });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/eliminar-usuario  →  eliminar usuario por id
router.post("/eliminar-usuario", async (req, res) => {
  const { dev_secret, id } = req.body;
  if (!dev_secret || dev_secret !== process.env.DEV_SECRET) {
    return res.status(403).json({ error: "No autorizado" });
  }
  if (!id) return res.status(400).json({ error: "Falta el id" });
  try {
    const u = await Usuario.findByPk(id);
    if (!u) return res.status(404).json({ error: "Usuario no encontrado" });
    await u.destroy();
    res.json({ mensaje: `Usuario ${u.usuario} eliminado` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// POST /api/auth/limpiar-bd  →  elimina todos los datos de todas las tablas
router.post("/limpiar-bd", async (req, res) => {
  const { dev_secret } = req.body;
  if (!dev_secret || dev_secret !== process.env.DEV_SECRET) {
    return res.status(403).json({ error: "No autorizado" });
  }
  try {
    const sequelize = require("../config/db");
    const tablas = [
      "detalle_ventas", "detalle_compras",
      "ventas", "compras", "nomina",
      "clientes", "productos", "gastos",
      "proveedores", "empleados"
    ];
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    for (const tabla of tablas) {
      try {
        await sequelize.query(`TRUNCATE TABLE \`${tabla}\``);
      } catch(e) { /* tabla no existe, ignorar */ }
    }
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
    res.json({ mensaje: "Base de datos limpiada correctamente", tablas });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;