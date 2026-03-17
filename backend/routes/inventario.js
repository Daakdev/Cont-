const express   = require("express");
const router    = express.Router();
const { Op, col } = require("sequelize");
const Producto  = require("../models/producto");
const auth      = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  try {
    const eid = req.empresaId;
    const { search = "", categoria = "", stock = "" } = req.query;
    const where = { empresa_id: eid, estado: "activo" };
    if (search)   where[Op.or] = [{ nombre: { [Op.like]: `%${search}%` } }, { codigo: { [Op.like]: `%${search}%` } }];
    if (categoria) where.categoria = categoria;
    if (stock === "bajo") where.stock = { [Op.lte]: col("stock_minimo") };
    if (stock === "sin")  where.stock = 0;

    const productos  = await Producto.findAll({ where, order: [["nombre", "ASC"]] });
    const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))];
    const total      = productos.length;
    const valor      = productos.reduce((s, p) => s + parseFloat(p.precio_venta || 0) * p.stock, 0);
    const bajo       = productos.filter(p => p.stock > 0 && p.stock <= p.stock_minimo).length;
    const sinStock   = productos.filter(p => p.stock === 0).length;

    res.json({ productos, categorias, stats: { total, valor, bajo, sinStock } });
  } catch (err) {
    console.error("GET /inventario:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const p = await Producto.create({ ...req.body, empresa_id: req.empresaId });
    res.status(201).json(p);
  } catch (err) {
    console.error("POST /inventario:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    await Producto.update(req.body, { where: { id: req.params.id, empresa_id: req.empresaId } });
    res.json(await Producto.findByPk(req.params.id));
  } catch (err) {
    console.error("PUT /inventario:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    await Producto.update({ estado: "inactivo" }, { where: { id: req.params.id, empresa_id: req.empresaId } });
    res.json({ mensaje: "Producto eliminado" });
  } catch (err) {
    console.error("DELETE /inventario:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;