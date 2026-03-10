const express  = require("express");
const router   = express.Router();
const { Op, fn, col } = require("sequelize");
const Empleado = require("../models/empleado");
const auth     = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  try {
    const eid = req.empresaId;
    const { search = "", departamento = "" } = req.query;
    const where = { empresa_id: eid };
    if (search) where[Op.or] = [{ nombre: { [Op.like]: `%${search}%` } }, { cargo: { [Op.like]: `%${search}%` } }];
    if (departamento) where.departamento = departamento;

    const empleados     = await Empleado.findAll({ where, order: [["nombre", "ASC"]] });
    const departamentos = [...new Set(empleados.map(e => e.departamento).filter(Boolean))];

    const total      = await Empleado.count({ where: { empresa_id: eid, estado: "activo" } });
    const vacaciones = await Empleado.count({ where: { empresa_id: eid, estado: "vacaciones" } });
    const deptos     = [...new Set((await Empleado.findAll({ where: { empresa_id: eid }, attributes: ["departamento"], raw: true })).map(e => e.departamento).filter(Boolean))].length;

    res.json({ empleados, departamentos, stats: { total, vacaciones, deptos } });
  } catch (err) { console.error(err); res.status(500).json({ error: "Error al obtener empleados" }); }
});

router.post("/", auth, async (req, res) => {
  try {
    const e = await Empleado.create({ ...req.body, empresa_id: req.empresaId });
    res.status(201).json(e);
  } catch (err) { res.status(500).json({ error: "Error al crear empleado" }); }
});

router.put("/:id", auth, async (req, res) => {
  try {
    await Empleado.update(req.body, { where: { id: req.params.id, empresa_id: req.empresaId } });
    res.json(await Empleado.findByPk(req.params.id));
  } catch (err) { res.status(500).json({ error: "Error al actualizar empleado" }); }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    await Empleado.destroy({ where: { id: req.params.id, empresa_id: req.empresaId } });
    res.json({ mensaje: "Empleado eliminado" });
  } catch (err) { res.status(500).json({ error: "Error al eliminar empleado" }); }
});

module.exports = router;