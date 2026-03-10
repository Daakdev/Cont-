const express = require("express");
const router  = express.Router();
const { Op, fn, col } = require("sequelize");
const Gasto   = require("../models/gasto");
const auth    = require("../middleware/auth");

// GET /api/gastos
router.get("/", auth, async (req, res) => {
  try {
    const gastos = await Gasto.findAll({ order: [["fecha", "DESC"], ["createdAt", "DESC"]] });

    const hoy = new Date().toISOString().split("T")[0];
    const mes = new Date(); mes.setDate(1);

    const gasMes  = await Gasto.sum("monto", { where: { fecha: { [Op.gte]: mes.toISOString().split("T")[0] } } });
    const gasHoy  = await Gasto.sum("monto", { where: { fecha: hoy } });
    const mayorRaw= await Gasto.findOne({ order: [["monto", "DESC"]] });

    // Agrupar por categoría
    const porCategoria = await Gasto.findAll({
      attributes: ["categoria", [fn("SUM", col("monto")), "total"]],
      group: ["categoria"],
      order: [[fn("SUM", col("monto")), "DESC"]],
      raw: true,
    });

    res.json({
      gastos,
      porCategoria,
      stats: {
        mes:    gasMes  || 0,
        hoy:    gasHoy  || 0,
        mayor:  mayorRaw ? { descripcion: mayorRaw.descripcion, monto: mayorRaw.monto } : null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener gastos" });
  }
});

// POST /api/gastos
router.post("/", auth, async (req, res) => {
  try {
    const gasto = await Gasto.create(req.body);
    res.status(201).json(gasto);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al registrar gasto" });
  }
});

// PUT /api/gastos/:id
router.put("/:id", auth, async (req, res) => {
  try {
    await Gasto.update(req.body, { where: { id: req.params.id } });
    res.json(await Gasto.findByPk(req.params.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar gasto" });
  }
});

// DELETE /api/gastos/:id
router.delete("/:id", auth, async (req, res) => {
  try {
    await Gasto.destroy({ where: { id: req.params.id } });
    res.json({ mensaje: "Gasto eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar gasto" });
  }
});

module.exports = router;