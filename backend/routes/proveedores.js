const express   = require("express");
const router    = express.Router();
const { Op, fn, col } = require("sequelize");
const Proveedor = require("../models/proveedor");
const { Compra }= require("../models/compra");
const auth      = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  try {
    const eid = req.empresaId;
    const { search = "", categoria = "" } = req.query;
    const where = { empresa_id: eid };
    if (search) where[Op.or] = [{ nombre: { [Op.like]: `%${search}%` } }, { contacto: { [Op.like]: `%${search}%` } }];
    if (categoria) where.categoria = categoria;

    const proveedores = await Proveedor.findAll({ where, order: [["nombre", "ASC"]] });
    const categorias  = [...new Set(proveedores.map(p => p.categoria).filter(Boolean))];

    const total      = await Proveedor.count({ where: { empresa_id: eid } });
    const mes        = new Date(); mes.setDate(1);
    const comprasMes = await Compra.sum("total", { where: { empresa_id: eid, createdAt: { [Op.gte]: mes } } }) || 0;
    const porPagar   = await Compra.sum("total", { where: { empresa_id: eid, estado: "pendiente" } }) || 0;

    const ids = proveedores.map(p => p.id);
    const totalesRaw = await Compra.findAll({
      where: { empresa_id: eid, proveedor_id: ids },
      attributes: ["proveedor_id", [fn("SUM", col("total")), "total_compras"]],
      group: ["proveedor_id"], raw: true,
    });
    const saldosRaw = await Compra.findAll({
      where: { empresa_id: eid, proveedor_id: ids, estado: "pendiente" },
      attributes: ["proveedor_id", [fn("SUM", col("total")), "saldo"]],
      group: ["proveedor_id"], raw: true,
    });
    const totMap = {}; totalesRaw.forEach(c => { totMap[c.proveedor_id] = parseFloat(c.total_compras || 0); });
    const salMap = {}; saldosRaw.forEach(c => { salMap[c.proveedor_id]  = parseFloat(c.saldo || 0); });

    const data = proveedores.map(p => ({ ...p.toJSON(), total_compras: totMap[p.id] || 0, saldo_pendiente: salMap[p.id] || 0 }));
    res.json({ proveedores: data, categorias, stats: { total, comprasMes, porPagar } });
  } catch (err) { console.error(err); res.status(500).json({ error: "Error al obtener proveedores" }); }
});

router.post("/", auth, async (req, res) => {
  try {
    const p = await Proveedor.create({ ...req.body, empresa_id: req.empresaId });
    res.status(201).json(p);
  } catch (err) { res.status(500).json({ error: "Error al crear proveedor" }); }
});

router.put("/:id", auth, async (req, res) => {
  try {
    await Proveedor.update(req.body, { where: { id: req.params.id, empresa_id: req.empresaId } });
    res.json(await Proveedor.findByPk(req.params.id));
  } catch (err) { res.status(500).json({ error: "Error al actualizar proveedor" }); }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    await Proveedor.destroy({ where: { id: req.params.id, empresa_id: req.empresaId } });
    res.json({ mensaje: "Proveedor eliminado" });
  } catch (err) { res.status(500).json({ error: "Error al eliminar proveedor" }); }
});

module.exports = router;