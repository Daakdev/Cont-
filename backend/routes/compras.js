const express    = require("express");
const router     = express.Router();
const { Op }     = require("sequelize");
const { Compra, DetalleCompra } = require("../models/compra");
const Proveedor  = require("../models/proveedor");
const Producto   = require("../models/producto");
const auth       = require("../middleware/auth");

async function generarNumero() {
  const last = await Compra.findOne({ order: [["id", "DESC"]] });
  const num  = last ? parseInt(last.numero?.replace("OC-", "") || 0) + 1 : 1;
  return `OC-${String(num).padStart(5, "0")}`;
}

// GET /api/compras
router.get("/", auth, async (req, res) => {
  try {
    const { search = "", estado = "" } = req.query;
    const where = {};
    if (estado) where.estado = estado;

    const compras = await Compra.findAll({
      where,
      include: [
        { model: Proveedor, as: "proveedor", attributes: ["id", "nombre"] },
        { model: DetalleCompra, as: "detalles", include: [{ model: Producto, as: "producto", attributes: ["id", "nombre"] }] },
      ],
      order: [["createdAt", "DESC"]],
    });

    const filtradas = search
      ? compras.filter(c => c.numero?.toLowerCase().includes(search.toLowerCase()) || c.proveedor?.nombre?.toLowerCase().includes(search.toLowerCase()))
      : compras;

    const mes      = new Date(); mes.setDate(1);
    const ordenes  = await Compra.count({ where: { createdAt: { [Op.gte]: mes } } });
    const monto    = await Compra.sum("total", { where: { createdAt: { [Op.gte]: mes } } });
    const recibir  = await Compra.count({ where: { estado: { [Op.in]: ["pendiente", "transito"] } } });
    const pagar    = await Compra.sum("total", { where: { estado: "pendiente" } });

    res.json({ compras: filtradas, stats: { ordenes, monto: monto||0, recibir, pagar: pagar||0 } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener compras" });
  }
});

// POST /api/compras
router.post("/", auth, async (req, res) => {
  try {
    const { proveedor_id, detalles, notas = "", estado = "pendiente" } = req.body;
    if (!detalles || detalles.length === 0)
      return res.status(400).json({ error: "La orden debe tener al menos un producto" });

    let total = 0;
    for (const d of detalles) {
      const producto = await Producto.findByPk(d.producto_id);
      if (!producto) return res.status(400).json({ error: `Producto ${d.producto_id} no encontrado` });
      d.precio   = parseFloat(producto.precio_costo);
      d.subtotal = d.precio * d.cantidad;
      total     += d.subtotal;
    }

    const numero = await generarNumero();
    const compra = await Compra.create({ numero, proveedor_id, total, estado, notas });

    for (const d of detalles) {
      await DetalleCompra.create({ compra_id: compra.id, ...d });
      // Si está recibido, aumentar stock
      if (estado === "recibido")
        await Producto.increment("stock", { by: d.cantidad, where: { id: d.producto_id } });
    }

    res.status(201).json(await Compra.findByPk(compra.id, {
      include: [{ model: Proveedor, as: "proveedor" }, { model: DetalleCompra, as: "detalles" }],
    }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear compra" });
  }
});

// PUT /api/compras/:id — cambiar estado (si pasa a recibido, suma stock)
router.put("/:id", auth, async (req, res) => {
  try {
    const compra = await Compra.findByPk(req.params.id, { include: [{ model: DetalleCompra, as: "detalles" }] });
    if (!compra) return res.status(404).json({ error: "Compra no encontrada" });

    // Si cambia a recibido y antes no lo era → sumar stock
    if (req.body.estado === "recibido" && compra.estado !== "recibido") {
      for (const d of compra.detalles)
        await Producto.increment("stock", { by: d.cantidad, where: { id: d.producto_id } });
    }

    await Compra.update(req.body, { where: { id: req.params.id } });
    res.json(await Compra.findByPk(req.params.id, { include: [{ model: Proveedor, as: "proveedor" }] }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar compra" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    await Compra.destroy({ where: { id: req.params.id } });
    res.json({ mensaje: "Compra eliminada" });
  } catch (err) { res.status(500).json({ error: "Error al eliminar compra" }); }
});

module.exports = router;