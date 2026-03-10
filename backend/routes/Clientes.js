const express  = require("express");
const router   = express.Router();
const { Op }   = require("sequelize");
const Cliente  = require("../models/cliente");
const { Venta }= require("../models/venta");
const auth     = require("../middleware/auth");

// GET /api/clientes — listar con búsqueda y filtros
router.get("/", auth, async (req, res) => {
  try {
    const { search = "", tipo = "" } = req.query;
    const where = {};
    if (search) where[Op.or] = [
      { nombre:  { [Op.like]: `%${search}%` } },
      { ruc_ci:  { [Op.like]: `%${search}%` } },
      { email:   { [Op.like]: `%${search}%` } },
    ];
    if (tipo) where.tipo = tipo;

    const clientes = await Cliente.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    // Contar total de compras por cliente
    const ids = clientes.map(c => c.id);
    const ventas = await Venta.findAll({
      where: { cliente_id: ids, estado: "pagado" },
      attributes: ["cliente_id", [require("sequelize").fn("SUM", require("sequelize").col("total")), "total_compras"]],
      group: ["cliente_id"],
      raw: true,
    });
    const totalesMap = {};
    ventas.forEach(v => { totalesMap[v.cliente_id] = parseFloat(v.total_compras || 0); });

    const data = clientes.map(c => ({
      ...c.toJSON(),
      total_compras: totalesMap[c.id] || 0,
    }));

    // Stats
    const total      = await Cliente.count();
    const frecuentes = await Venta.count({ where: { estado: "pagado" }, distinct: true, col: "cliente_id" });
    const deudaRaw   = await Venta.sum("total", { where: { estado: "pendiente" } });

    res.json({ clientes: data, stats: { total, frecuentes, deuda: deudaRaw || 0 } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener clientes" });
  }
});

// POST /api/clientes — crear
router.post("/", auth, async (req, res) => {
  try {
    const cliente = await Cliente.create(req.body);
    res.status(201).json(cliente);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear cliente" });
  }
});

// PUT /api/clientes/:id — editar
router.put("/:id", auth, async (req, res) => {
  try {
    await Cliente.update(req.body, { where: { id: req.params.id } });
    const updated = await Cliente.findByPk(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar cliente" });
  }
});

// DELETE /api/clientes/:id — eliminar
router.delete("/:id", auth, async (req, res) => {
  try {
    await Cliente.destroy({ where: { id: req.params.id } });
    res.json({ mensaje: "Cliente eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar cliente" });
  }
});

module.exports = router;