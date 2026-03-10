const express   = require("express");
const router    = express.Router();
const { Op, fn, col, literal } = require("sequelize");
const Producto  = require("../models/producto");
const auth      = require("../middleware/auth");

// GET /api/inventario
router.get("/", auth, async (req, res) => {
  try {
    const { search = "", categoria = "", stock: stockFiltro = "" } = req.query;
    const where = {};

    if (search) where[Op.or] = [
      { nombre:   { [Op.like]: `%${search}%` } },
      { codigo:   { [Op.like]: `%${search}%` } },
      { categoria:{ [Op.like]: `%${search}%` } },
    ];
    if (categoria) where.categoria = categoria;
    if (stockFiltro === "sin")   where.stock = 0;
    if (stockFiltro === "bajo")  where.stock = { [Op.gt]: 0, [Op.lte]: literal("`stock_minimo`") };
    if (stockFiltro === "normal")where.stock = { [Op.gt]: literal("`stock_minimo`") };

    const productos = await Producto.findAll({ where, order: [["nombre", "ASC"]] });

    // Categorías únicas para el filtro
    const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))];

    // Stats
    const total   = await Producto.count();
    const sinStock= await Producto.count({ where: { stock: 0 } });
    const bajoProd= await Producto.findAll({ where: { stock: { [Op.gt]: 0 } } });
    const bajo    = bajoProd.filter(p => p.stock <= p.stock_minimo).length;
    const valorRaw= await Producto.findAll({ attributes: [[fn("SUM", literal("`stock` * `precio_costo`")), "valor"]], raw: true });
    const valor   = parseFloat(valorRaw[0]?.valor || 0);

    res.json({ productos, categorias, stats: { total, sinStock, bajo, valor } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener inventario" });
  }
});

// POST /api/inventario
router.post("/", auth, async (req, res) => {
  try {
    const producto = await Producto.create(req.body);
    res.status(201).json(producto);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear producto" });
  }
});

// PUT /api/inventario/:id
router.put("/:id", auth, async (req, res) => {
  try {
    await Producto.update(req.body, { where: { id: req.params.id } });
    const updated = await Producto.findByPk(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar producto" });
  }
});

// DELETE /api/inventario/:id
router.delete("/:id", auth, async (req, res) => {
  try {
    await Producto.destroy({ where: { id: req.params.id } });
    res.json({ mensaje: "Producto eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar producto" });
  }
});

module.exports = router;