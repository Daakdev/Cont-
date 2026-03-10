const express  = require("express");
const router   = express.Router();
const { Op, fn, col, literal } = require("sequelize");
const { Venta, DetalleVenta } = require("../models/venta");
const Producto = require("../models/producto");
const Cliente  = require("../models/cliente");
const auth     = require("../middleware/auth");

// Generar número de factura único
async function generarNumero() {
  const last = await Venta.findOne({ order: [["id", "DESC"]] });
  const num  = last ? parseInt(last.numero?.replace("FAC-", "") || 0) + 1 : 1;
  return `FAC-${String(num).padStart(5, "0")}`;
}

// GET /api/ventas
router.get("/", auth, async (req, res) => {
  try {
    const { search = "", estado = "" } = req.query;
    const where = {};
    if (estado) where.estado = estado;

    const ventas = await Venta.findAll({
      where,
      include: [
        { model: Cliente, as: "cliente", attributes: ["id", "nombre"] },
        { model: DetalleVenta, as: "detalles", include: [{ model: Producto, as: "producto", attributes: ["id", "nombre"] }] },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Filtro por búsqueda (cliente o número)
    const filtradas = search
      ? ventas.filter(v =>
          v.numero?.toLowerCase().includes(search.toLowerCase()) ||
          v.cliente?.nombre?.toLowerCase().includes(search.toLowerCase())
        )
      : ventas;

    // Stats
    const hoy     = new Date(); hoy.setHours(0,0,0,0);
    const mes     = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ventasHoy = await Venta.sum("total", { where: { estado: "pagado", createdAt: { [Op.gte]: hoy } } });
    const ventasMes = await Venta.sum("total", { where: { estado: "pagado", createdAt: { [Op.gte]: mes } } });
    const pendientes= await Venta.count({ where: { estado: "pendiente" } });
    const ticketRaw = await Venta.findOne({ attributes: [[fn("AVG", col("total")), "avg"]], where: { estado: "pagado" }, raw: true });

    res.json({
      ventas: filtradas,
      stats: {
        hoy:       ventasHoy || 0,
        mes:       ventasMes || 0,
        pendientes,
        ticket:    parseFloat(ticketRaw?.avg || 0).toFixed(2),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener ventas" });
  }
});

// POST /api/ventas — crear venta con detalles
router.post("/", auth, async (req, res) => {
  try {
    const { cliente_id, detalles, impuesto = 0, notas = "", estado = "pendiente" } = req.body;

    if (!detalles || detalles.length === 0)
      return res.status(400).json({ error: "La venta debe tener al menos un producto" });

    // Calcular totales y validar stock
    let subtotal = 0;
    for (const d of detalles) {
      const producto = await Producto.findByPk(d.producto_id);
      if (!producto) return res.status(400).json({ error: `Producto ${d.producto_id} no encontrado` });
      if (producto.stock < d.cantidad) return res.status(400).json({ error: `Stock insuficiente para ${producto.nombre}` });
      d.precio   = parseFloat(producto.precio_venta);
      d.subtotal = d.precio * d.cantidad;
      subtotal  += d.subtotal;
    }

    const total  = subtotal + parseFloat(impuesto);
    const numero = await generarNumero();

    const venta = await Venta.create({ numero, cliente_id, subtotal, impuesto, total, estado, notas });

    for (const d of detalles) {
      await DetalleVenta.create({ venta_id: venta.id, ...d });
      // Descontar stock
      await Producto.decrement("stock", { by: d.cantidad, where: { id: d.producto_id } });
    }

    const ventaCompleta = await Venta.findByPk(venta.id, {
      include: [
        { model: Cliente, as: "cliente", attributes: ["id", "nombre"] },
        { model: DetalleVenta, as: "detalles", include: [{ model: Producto, as: "producto" }] },
      ],
    });

    res.status(201).json(ventaCompleta);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear venta" });
  }
});

// PUT /api/ventas/:id — actualizar estado
router.put("/:id", auth, async (req, res) => {
  try {
    await Venta.update(req.body, { where: { id: req.params.id } });
    const updated = await Venta.findByPk(req.params.id, {
      include: [{ model: Cliente, as: "cliente", attributes: ["id", "nombre"] }],
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar venta" });
  }
});

// DELETE /api/ventas/:id — anular venta (no borra, cambia estado)
router.delete("/:id", auth, async (req, res) => {
  try {
    await Venta.update({ estado: "anulado" }, { where: { id: req.params.id } });
    res.json({ mensaje: "Venta anulada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al anular venta" });
  }
});

module.exports = router;