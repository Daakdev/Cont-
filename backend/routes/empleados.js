const express  = require("express");
const router   = express.Router();
const { Op }   = require("sequelize");
const Empleado = require("../models/empleado");
const auth     = require("../middleware/auth");

// GET /api/empleados
router.get("/", auth, async (req, res) => {
  try {
    const { search = "", departamento = "" } = req.query;
    const where = {};
    if (search) where[Op.or] = [
      { nombre:       { [Op.like]: `%${search}%` } },
      { cargo:        { [Op.like]: `%${search}%` } },
      { departamento: { [Op.like]: `%${search}%` } },
    ];
    if (departamento) where.departamento = departamento;

    const empleados     = await Empleado.findAll({ where, order: [["nombre", "ASC"]] });
    const departamentos = [...new Set(empleados.map(e => e.departamento).filter(Boolean))];

    const total      = await Empleado.count({ where: { estado: "activo" } });
    const vacaciones = await Empleado.count({ where: { estado: "vacaciones" } });
    const deptos     = await Empleado.findAll({ attributes: [[require("sequelize").fn("DISTINCT", require("sequelize").col("departamento")), "departamento"]], raw: true });

    res.json({ empleados, departamentos, stats: { total, vacaciones, deptos: deptos.filter(d => d.departamento).length } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener empleados" });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const e = await Empleado.create(req.body);
    res.status(201).json(e);
  } catch (err) { res.status(500).json({ error: "Error al crear empleado" }); }
});

router.put("/:id", auth, async (req, res) => {
  try {
    await Empleado.update(req.body, { where: { id: req.params.id } });
    res.json(await Empleado.findByPk(req.params.id));
  } catch (err) { res.status(500).json({ error: "Error al actualizar empleado" }); }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    await Empleado.destroy({ where: { id: req.params.id } });
    res.json({ mensaje: "Empleado eliminado" });
  } catch (err) { res.status(500).json({ error: "Error al eliminar empleado" }); }
});

module.exports = router;