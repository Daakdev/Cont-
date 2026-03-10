const express  = require("express");
const router   = express.Router();
const { Op }   = require("sequelize");
const Cliente  = require("../models/cliente");
const { Venta }= require("../models/venta");
const auth     = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  try {
    const eid = req.empresaId;
    const { search = "", tipo = "" } = req.query;
    const where = { empresa_id: eid };
    if (search) where[Op.or] = [{ nombre: { [Op.like]: `%${search}%` } }, { email: { [Op.like]: `%${search}%` } }, { ruc_ci: { [Op.like]: `%${search}%` } }];
    if (tipo) where.tipo = tipo;

    const clientes = await Cliente.findAll({ where, order: [["nombre", "ASC"]] });

    const total      = await Cliente.count({ where: { empresa_id: eid } });
    const frecuentes = await Venta.count({ where: { empresa_id: eid, estado: "pagado" }, distinct: true, col: "cliente_id" });
    const deuda      = await Venta.sum("total", { where: { empresa_id: eid, estado: "pendiente" } }) || 0;

    const comprasPorCliente = await Venta.findAll({
      where: { empresa_id: eid, estado: "pagado" },
      attributes: ["cliente_id", [require("sequelize").fn("SUM", require("sequelize").col("total")), "total_compras"]],
      group: ["cliente_id"], raw: true,
    });
    const comprasMap = {};
    comprasPorCliente.forEach(v => { comprasMap[v.cliente_id] = parseFloat(v.total_compras || 0); });

    const data = clientes.map(c => ({ ...c.toJSON(), total_compras: comprasMap[c.id] || 0 }));
    res.json({ clientes: data, stats: { total, frecuentes, deuda } });
  } catch (err) { console.error(err); res.status(500).json({ error: "Error al obtener clientes" }); }
});

router.post("/", auth, async (req, res) => {
  try {
    const c = await Cliente.create({ ...req.body, empresa_id: req.empresaId });
    res.status(201).json(c);
  } catch (err) { res.status(500).json({ error: "Error al crear cliente" }); }
});

router.put("/:id", auth, async (req, res) => {
  try {
    await Cliente.update(req.body, { where: { id: req.params.id, empresa_id: req.empresaId } });
    res.json(await Cliente.findByPk(req.params.id));
  } catch (err) { res.status(500).json({ error: "Error al actualizar cliente" }); }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    await Cliente.destroy({ where: { id: req.params.id, empresa_id: req.empresaId } });
    res.json({ mensaje: "Cliente eliminado" });
  } catch (err) { res.status(500).json({ error: "Error al eliminar cliente" }); }
});

module.exports = router;