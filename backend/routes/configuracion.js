const express  = require("express");
const router   = express.Router();
const Empresa  = require("../models/empresa");
const Usuario  = require("../models/usuario");
const auth     = require("../middleware/auth");

// GET /api/configuracion  →  obtener config de la empresa
router.get("/", auth, async (req, res) => {
  try {
    const empresa  = await Empresa.findByPk(req.empresaId);
    if (!empresa) return res.status(404).json({ error: "Empresa no encontrada" });
    const usuarios = await Usuario.findAll({
      where: { empresa_id: req.empresaId },
      attributes: ["id", "usuario", "correo", "rol"]
    });
    res.json({ empresa, usuarios });
  } catch (err) {
    console.error("GET /configuracion:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/configuracion  →  guardar config de la empresa
router.put("/", auth, async (req, res) => {
  try {
    const { nombre, rut, telefono, direccion, email, web,
            moneda, iva, retencion, stock_min_alerta, formato_factura } = req.body;
    await Empresa.update(
      { nombre, rut, telefono, direccion, email, web,
        moneda, iva, retencion, stock_min_alerta, formato_factura },
      { where: { id: req.empresaId } }
    );
    const empresa = await Empresa.findByPk(req.empresaId);
    res.json({ mensaje: "Configuración guardada", empresa });
  } catch (err) {
    console.error("PUT /configuracion:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;