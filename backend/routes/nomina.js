const express  = require("express");
const router   = express.Router();
const { Op }   = require("sequelize");
const Nomina   = require("../models/nomina");
const Empleado = require("../models/empleado");
const auth     = require("../middleware/auth");

// GET /api/nomina
router.get("/", auth, async (req, res) => {
  try {
    const mesActual = new Date().toISOString().slice(0, 7); // "2025-03"
    const { mes = mesActual } = req.query;

    const registros = await Nomina.findAll({
      where: { mes },
      include: [{ model: Empleado, as: "empleado", attributes: ["id", "nombre", "cargo", "departamento"] }],
      order: [[{ model: Empleado, as: "empleado" }, "nombre", "ASC"]],
    });

    const totalEmpleados = await Empleado.count({ where: { estado: "activo" } });
    const nominaMes      = await Nomina.sum("neto",  { where: { mes } }) || 0;
    const pagado         = await Nomina.sum("neto",  { where: { mes, estado: "pagado" } }) || 0;
    const beneficios     = await Nomina.sum("horas_extra", { where: { mes } }) || 0;

    res.json({ registros, mes, stats: { totalEmpleados, nominaMes, pagado, beneficios } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener nómina" });
  }
});

// POST /api/nomina — generar nómina del mes para todos los empleados activos
router.post("/generar", auth, async (req, res) => {
  try {
    const mesActual = new Date().toISOString().slice(0, 7);
    const { mes = mesActual } = req.body;

    const empleados = await Empleado.findAll({ where: { estado: ["activo", "vacaciones"] } });
    const creados = [];

    for (const e of empleados) {
      const existe = await Nomina.findOne({ where: { empleado_id: e.id, mes } });
      if (existe) continue;
      const neto = parseFloat(e.sueldo_base) - 0;
      const reg  = await Nomina.create({ empleado_id: e.id, mes, sueldo_base: e.sueldo_base, horas_extra: 0, descuentos: 0, neto });
      creados.push(reg);
    }

    res.status(201).json({ mensaje: `${creados.length} registros generados para ${mes}`, creados });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al generar nómina" });
  }
});

// PUT /api/nomina/:id — actualizar registro (horas extra, descuentos, estado)
router.put("/:id", auth, async (req, res) => {
  try {
    const reg = await Nomina.findByPk(req.params.id);
    if (!reg) return res.status(404).json({ error: "Registro no encontrado" });

    const sueldo      = parseFloat(req.body.sueldo_base  ?? reg.sueldo_base);
    const horas_extra = parseFloat(req.body.horas_extra  ?? reg.horas_extra);
    const descuentos  = parseFloat(req.body.descuentos   ?? reg.descuentos);
    const neto        = sueldo + horas_extra - descuentos;

    await reg.update({ ...req.body, sueldo_base: sueldo, horas_extra, descuentos, neto });
    res.json(await Nomina.findByPk(req.params.id, { include: [{ model: Empleado, as: "empleado" }] }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar nómina" });
  }
});

// POST /api/nomina/pagar — marcar toda la nómina del mes como pagada
router.post("/pagar", auth, async (req, res) => {
  try {
    const mesActual = new Date().toISOString().slice(0, 7);
    const { mes = mesActual } = req.body;
    await Nomina.update({ estado: "pagado" }, { where: { mes } });
    res.json({ mensaje: `Nómina de ${mes} marcada como pagada` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al procesar pago" });
  }
});

module.exports = router;