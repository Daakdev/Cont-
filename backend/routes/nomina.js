const express  = require("express");
const router   = express.Router();
const Nomina   = require("../models/nomina");
const Empleado = require("../models/empleado");
const auth     = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  try {
    const eid = req.empresaId;
    const mesActual = new Date().toISOString().slice(0, 7);
    const { mes = mesActual } = req.query;

    const registros = await Nomina.findAll({
      where: { empresa_id: eid, mes },
      include: [{ model: Empleado, as: "empleado", attributes: ["id", "nombre", "cargo", "departamento"] }],
      order: [[{ model: Empleado, as: "empleado" }, "nombre", "ASC"]],
    });

    const totalEmpleados = await Empleado.count({ where: { empresa_id: eid, estado: "activo" } });
    const nominaMes      = await Nomina.sum("neto",       { where: { empresa_id: eid, mes } }) || 0;
    const pagado         = await Nomina.sum("neto",       { where: { empresa_id: eid, mes, estado: "pagado" } }) || 0;
    const beneficios     = await Nomina.sum("horas_extra",{ where: { empresa_id: eid, mes } }) || 0;

    res.json({ registros, mes, stats: { totalEmpleados, nominaMes, pagado, beneficios } });
  } catch (err) { console.error(err); res.status(500).json({ error: "Error al obtener nómina" }); }
});

router.post("/generar", auth, async (req, res) => {
  try {
    const eid = req.empresaId;
    const mesActual = new Date().toISOString().slice(0, 7);
    const { mes = mesActual } = req.body;

    const empleados = await Empleado.findAll({ where: { empresa_id: eid, estado: ["activo", "vacaciones"] } });
    const creados = [];
    for (const e of empleados) {
      const existe = await Nomina.findOne({ where: { empresa_id: eid, empleado_id: e.id, mes } });
      if (existe) continue;
      const reg = await Nomina.create({ empresa_id: eid, empleado_id: e.id, mes, sueldo_base: e.sueldo_base, horas_extra: 0, descuentos: 0, neto: parseFloat(e.sueldo_base) });
      creados.push(reg);
    }
    res.status(201).json({ mensaje: `${creados.length} registros generados para ${mes}`, creados });
  } catch (err) { console.error(err); res.status(500).json({ error: "Error al generar nómina" }); }
});

router.post("/pagar", auth, async (req, res) => {
  try {
    const eid = req.empresaId;
    const mesActual = new Date().toISOString().slice(0, 7);
    const { mes = mesActual } = req.body;
    await Nomina.update({ estado: "pagado" }, { where: { empresa_id: eid, mes } });
    res.json({ mensaje: `Nómina de ${mes} marcada como pagada` });
  } catch (err) { console.error(err); res.status(500).json({ error: "Error al procesar pago" }); }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const reg = await Nomina.findOne({ where: { id: req.params.id, empresa_id: req.empresaId } });
    if (!reg) return res.status(404).json({ error: "Registro no encontrado" });
    const sueldo     = parseFloat(req.body.sueldo_base  ?? reg.sueldo_base);
    const horas      = parseFloat(req.body.horas_extra  ?? reg.horas_extra);
    const descuentos = parseFloat(req.body.descuentos   ?? reg.descuentos);
    await reg.update({ ...req.body, sueldo_base: sueldo, horas_extra: horas, descuentos, neto: sueldo + horas - descuentos });
    res.json(await Nomina.findByPk(req.params.id, { include: [{ model: Empleado, as: "empleado" }] }));
  } catch (err) { console.error(err); res.status(500).json({ error: "Error al actualizar nómina" }); }
});

module.exports = router;