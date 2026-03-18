const express  = require("express");
const router   = express.Router();
const bcrypt   = require("bcrypt");
const { Op }   = require("sequelize");
const Empleado = require("../models/empleado");
const Usuario  = require("../models/usuario");
const auth     = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  try {
    const eid = req.empresaId;
    const { search = "", departamento = "" } = req.query;
    const where = { empresa_id: eid };
    if (search)      where[Op.or] = [{ nombre: { [Op.like]: `%${search}%` } }, { cargo: { [Op.like]: `%${search}%` } }];
    if (departamento) where.departamento = departamento;

    const empleados     = await Empleado.findAll({ where, order: [["nombre", "ASC"]] });
    const departamentos = [...new Set(empleados.map(e => e.departamento).filter(Boolean))];
    const total         = await Empleado.count({ where: { empresa_id: eid, estado: "activo" } });
    const vacaciones    = await Empleado.count({ where: { empresa_id: eid, estado: "vacaciones" } });
    const deptos        = [...new Set((await Empleado.findAll({ where: { empresa_id: eid }, attributes: ["departamento"], raw: true })).map(e => e.departamento).filter(Boolean))].length;

    res.json({ empleados, departamentos, stats: { total, vacaciones, deptos } });
  } catch (err) {
    console.error("GET /empleados:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { usuario, password, ...datosEmpleado } = req.body;

    // Crear empleado
    const empleado = await Empleado.create({ ...datosEmpleado, empresa_id: req.empresaId });

    // Si viene usuario y password, crear cuenta de acceso
    if (usuario && password) {
      // Verificar que no exista
      const existe = await Usuario.findOne({ where: { usuario } });
      if (existe) {
        return res.status(400).json({ error: `El usuario "${usuario}" ya existe. Empleado creado pero sin cuenta de acceso.` });
      }
      const hash = await bcrypt.hash(password, 10);
      await Usuario.create({
        usuario,
        correo:     datosEmpleado.email || null,
        password:   hash,
        rol:        "empleado",
        empresa_id: req.empresaId
      });
    }

    res.status(201).json({ empleado, mensaje: usuario ? "Empleado y cuenta creados" : "Empleado creado" });
  } catch (err) {
    console.error("POST /empleados:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const { usuario, password, ...datosEmpleado } = req.body;
    await Empleado.update(datosEmpleado, { where: { id: req.params.id, empresa_id: req.empresaId } });

    // Si viene nueva contraseña, actualizarla
    if (usuario && password) {
      const hash = await bcrypt.hash(password, 10);
      await Usuario.update({ password: hash }, { where: { usuario, empresa_id: req.empresaId } });
    }

    res.json(await Empleado.findByPk(req.params.id));
  } catch (err) {
    console.error("PUT /empleados:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const emp = await Empleado.findOne({ where: { id: req.params.id, empresa_id: req.empresaId } });
    if (!emp) return res.status(404).json({ error: "Empleado no encontrado" });

    // Eliminar usuario asociado si existe (por email)
    if (emp.email) {
      await Usuario.destroy({ where: { correo: emp.email, empresa_id: req.empresaId, rol: "empleado" } });
    }

    await emp.destroy();
    res.json({ mensaje: "Empleado eliminado" });
  } catch (err) {
    console.error("DELETE /empleados:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;