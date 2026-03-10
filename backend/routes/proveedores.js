const express    = require("express");
const router     = express.Router();
const { Op }     = require("sequelize");
const Proveedor  = require("../models/proveedor");
const { Compra } = require("../models/compra");
const auth       = require("../middleware/auth");

// GET /api/proveedores
router.get("/", auth, async (req, res) => {
  try {
    const { search = "", categoria = "" } = req.query;
    const where = {};
    if (search) where[Op.or] = [
      { nombre:   { [Op.like]: `%${search}%` } },
      { contacto: { [Op.like]: `%${search}%` } },
      { email:    { [Op.like]: `%${search}%` } },
    ];
    if (categoria) where.categoria = categoria;

    const proveedores = await Proveedor.findAll({ where, order: [["nombre", "ASC"]] });
    const categorias  = [...new Set(proveedores.map(p => p.categoria).filter(Boolean))];

    // Stats
    const total      = await Proveedor.count();
    const mes        = new Date(); mes.setDate(1);
    const comprasMes = await Compra.sum("total", { where: { createdAt: { [Op.gte]: mes } } });
    const porPagar   = await Compra.sum("total", { where: { estado: "pendiente" } });

    // Total compras por proveedor
    const ids = proveedores.map(p => p.id);
    const compras = await Compra.findAll({
      where: { proveedor_id: ids },
      attributes: ["proveedor_id", [require("sequelize").fn("SUM", require("sequelize").col("total")), "total_compras"]],
      group: ["proveedor_id"], raw: true,
    });
    const totalesMap = {};
    compras.forEach(c => { totalesMap[c.proveedor_id] = parseFloat(c.total_compras || 0); });

    // Saldo pendiente por proveedor
    const pendientes = await Compra.findAll({
      where: { proveedor_id: ids, estado: "pendiente" },
      attributes: ["proveedor_id", [require("sequelize").fn("SUM", require("sequelize").col("total")), "saldo"]],
      group: ["proveedor_id"], raw: true,
    });
    const saldoMap = {};
    pendientes.forEach(c => { saldoMap[c.proveedor_id] = parseFloat(c.saldo || 0); });

    const data = proveedores.map(p => ({
      ...p.toJSON(),
      total_compras:   totalesMap[p.id] || 0,
      saldo_pendiente: saldoMap[p.id]   || 0,
    }));

    res.json({ proveedores: data, categorias, stats: { total, comprasMes: comprasMes || 0, porPagar: porPagar || 0 } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener proveedores" });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const p = await Proveedor.create(req.body);
    res.status(201).json(p);
  } catch (err) { res.status(500).json({ error: "Error al crear proveedor" }); }
});

router.put("/:id", auth, async (req, res) => {
  try {
    await Proveedor.update(req.body, { where: { id: req.params.id } });
    res.json(await Proveedor.findByPk(req.params.id));
  } catch (err) { res.status(500).json({ error: "Error al actualizar proveedor" }); }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    await Proveedor.destroy({ where: { id: req.params.id } });
    res.json({ mensaje: "Proveedor eliminado" });
  } catch (err) { res.status(500).json({ error: "Error al eliminar proveedor" }); }
});

module.exports = router;