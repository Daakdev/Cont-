const express  = require("express");
const router   = express.Router();
const { Op }   = require("sequelize");
const { Compra, DetalleCompra } = require("../models/compra");
const Proveedor = require("../models/proveedor");
const Producto  = require("../models/producto");
const auth      = require("../middleware/auth");

async function generarNumero(empresaId) {
  const last = await Compra.findOne({ where: { empresa_id: empresaId }, order: [["id", "DESC"]] });
  const num  = last ? parseInt(last.numero?.replace("OC-", "") || 0) + 1 : 1;
  return `OC-${String(num).padStart(5, "0")}`;
}

router.get("/", auth, async (req, res) => {
  try {
    const eid = req.empresaId;
    const { search = "", estado = "" } = req.query;
    const where = { empresa_id: eid };
    if (estado) where.estado = estado;

    const compras = await Compra.findAll({
      where,
      include: [
        { model: Proveedor,    as: "proveedor", attributes: ["id", "nombre"] },
        { model: DetalleCompra, as: "detalles", include: [{ model: Producto, as: "producto", attributes: ["id", "nombre"] }] },
      ],
      order: [["createdAt", "DESC"]],
    });

    const filtradas = search ? compras.filter(c => c.numero?.includes(search) || c.proveedor?.nombre?.toLowerCase().includes(search.toLowerCase())) : compras;

    const mes      = new Date(); mes.setDate(1);
    const ordenes  = await Compra.count({ where: { empresa_id: eid, createdAt: { [Op.gte]: mes } } });
    const monto    = await Compra.sum("total", { where: { empresa_id: eid, createdAt: { [Op.gte]: mes } } }) || 0;
    const recibir  = await Compra.count({ where: { empresa_id: eid, estado: { [Op.in]: ["pendiente", "transito"] } } });
    const pagar    = await Compra.sum("total", { where: { empresa_id: eid, estado: "pendiente" } }) || 0;

    res.json({ compras: filtradas, stats: { ordenes, monto, recibir, pagar } });
  } catch (err) { console.error(err); res.status(500).json({ error: "Error al obtener compras" }); }
});

router.post("/", auth, async (req, res) => {
  try {
    const eid = req.empresaId;
    const { proveedor_id, detalles, notas = "", estado = "pendiente" } = req.body;
    if (!detalles?.length) return res.status(400).json({ error: "La orden debe tener productos" });

    let total = 0;
    for (const d of detalles) {
      const p = await Producto.findOne({ where: { id: d.producto_id, empresa_id: eid } });
      if (!p) return res.status(400).json({ error: `Producto no encontrado` });
      d.precio   = parseFloat(p.precio_costo);
      d.subtotal = d.precio * d.cantidad;
      total     += d.subtotal;
    }

    const numero = await generarNumero(eid);
    const compra = await Compra.create({ empresa_id: eid, numero, proveedor_id, total, estado, notas });

    for (const d of detalles) {
      await DetalleCompra.create({ compra_id: compra.id, ...d });
      if (estado === "recibido")
        await Producto.increment("stock", { by: d.cantidad, where: { id: d.producto_id, empresa_id: eid } });
    }

    res.status(201).json(compra);
  } catch (err) { console.error(err); res.status(500).json({ error: "Error al crear compra" }); }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const eid   = req.empresaId;
    const compra = await Compra.findOne({ where: { id: req.params.id, empresa_id: eid }, include: [{ model: DetalleCompra, as: "detalles" }] });
    if (!compra) return res.status(404).json({ error: "Compra no encontrada" });

    if (req.body.estado === "recibido" && compra.estado !== "recibido") {
      for (const d of compra.detalles)
        await Producto.increment("stock", { by: d.cantidad, where: { id: d.producto_id, empresa_id: eid } });
    }

    await Compra.update(req.body, { where: { id: req.params.id, empresa_id: eid } });
    res.json(await Compra.findByPk(req.params.id, { include: [{ model: Proveedor, as: "proveedor" }] }));
  } catch (err) { console.error(err); res.status(500).json({ error: "Error al actualizar compra" }); }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    await Compra.destroy({ where: { id: req.params.id, empresa_id: req.empresaId } });
    res.json({ mensaje: "Compra eliminada" });
  } catch (err) { res.status(500).json({ error: "Error al eliminar compra" }); }
});

module.exports = router;