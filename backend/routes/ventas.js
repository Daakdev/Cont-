const express  = require("express");
const router   = express.Router();
const { Op }   = require("sequelize");
const { Venta, DetalleVenta } = require("../models/venta");
const Producto = require("../models/producto");
const Cliente  = require("../models/cliente");
const auth     = require("../middleware/auth");

async function generarNumero(empresaId) {
  const last = await Venta.findOne({ where: { empresa_id: empresaId }, order: [["id", "DESC"]] });
  const num  = last ? parseInt(last.numero?.replace("F-", "") || 0) + 1 : 1;
  return `F-${String(num).padStart(5, "0")}`;
}

router.get("/", auth, async (req, res) => {
  try {
    const eid = req.empresaId;
    const { search = "", estado = "" } = req.query;
    const where = { empresa_id: eid };
    if (estado) where.estado = estado;

    const ventas = await Venta.findAll({
      where,
      include: [
        { model: Cliente,     as: "cliente",  attributes: ["id", "nombre"] },
        { model: DetalleVenta, as: "detalles", include: [{ model: Producto, as: "producto", attributes: ["id", "nombre"] }] },
      ],
      order: [["createdAt", "DESC"]],
    });

    const filtradas = search ? ventas.filter(v => v.numero?.includes(search) || v.cliente?.nombre?.toLowerCase().includes(search.toLowerCase())) : ventas;

    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const mes = new Date(); mes.setDate(1); mes.setHours(0,0,0,0);

    const [ventasHoy, ventasMes, pendientes] = await Promise.all([
      Venta.sum("total", { where: { empresa_id: eid, estado: "pagado", createdAt: { [Op.gte]: hoy } } }),
      Venta.sum("total", { where: { empresa_id: eid, estado: "pagado", createdAt: { [Op.gte]: mes } } }),
      Venta.count({       where: { empresa_id: eid, estado: "pendiente" } }),
    ]);
    const ticket = filtradas.length ? filtradas.reduce((s, v) => s + parseFloat(v.total || 0), 0) / filtradas.length : 0;

    res.json({ ventas: filtradas, stats: { hoy: ventasHoy || 0, mes: ventasMes || 0, pendientes, ticket } });
  } catch (err) { console.error(err); res.status(500).json({ error: "Error al obtener ventas" }); }
});

router.post("/", auth, async (req, res) => {
  try {
    const eid = req.empresaId;
    const { cliente_id, estado = "pendiente", impuesto = 0, detalles } = req.body;
    if (!detalles?.length) return res.status(400).json({ error: "La venta debe tener productos" });

    let subtotal = 0;
    for (const d of detalles) {
      const p = await Producto.findOne({ where: { id: d.producto_id, empresa_id: eid } });
      if (!p) return res.status(400).json({ error: `Producto no encontrado` });
      if (p.stock < d.cantidad) return res.status(400).json({ error: `Stock insuficiente para ${p.nombre}` });
      d.precio   = parseFloat(p.precio_venta);
      d.subtotal = d.precio * d.cantidad;
      subtotal  += d.subtotal;
    }
    const total  = subtotal + parseFloat(impuesto);
    const numero = await generarNumero(eid);
    const venta  = await Venta.create({ empresa_id: eid, numero, cliente_id: cliente_id || null, subtotal, impuesto, total, estado });

    for (const d of detalles) {
      await DetalleVenta.create({ venta_id: venta.id, ...d });
      await Producto.decrement("stock", { by: d.cantidad, where: { id: d.producto_id, empresa_id: eid } });
    }

    res.status(201).json(venta);
  } catch (err) { console.error(err); res.status(500).json({ error: "Error al crear venta" }); }
});

router.put("/:id", auth, async (req, res) => {
  try {
    await Venta.update(req.body, { where: { id: req.params.id, empresa_id: req.empresaId } });
    res.json(await Venta.findByPk(req.params.id));
  } catch (err) { res.status(500).json({ error: "Error al actualizar venta" }); }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    await Venta.update({ estado: "anulado" }, { where: { id: req.params.id, empresa_id: req.empresaId } });
    res.json({ mensaje: "Venta anulada" });
  } catch (err) { res.status(500).json({ error: "Error al anular venta" }); }
});

module.exports = router;