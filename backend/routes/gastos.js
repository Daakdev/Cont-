const express = require("express");
const router  = express.Router();
const { Op, fn, col, literal } = require("sequelize");
const Gasto   = require("../models/gasto");
const auth    = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  try {
    const eid = req.empresaId;
    const gastos = await Gasto.findAll({ where: { empresa_id: eid }, order: [["fecha", "DESC"], ["createdAt", "DESC"]] });

    const hoy = new Date().toISOString().split("T")[0];
    const mes = new Date(); mes.setDate(1); mes.setHours(0,0,0,0);

    const [gastosHoy, gastosMes, mayor] = await Promise.all([
      Gasto.sum("monto", { where: { empresa_id: eid, fecha: hoy } }),
      Gasto.sum("monto", { where: { empresa_id: eid, createdAt: { [Op.gte]: mes } } }),
      Gasto.findOne({ where: { empresa_id: eid }, order: [["monto", "DESC"]] }),
    ]);

    const porCategoria = await Gasto.findAll({
      where: { empresa_id: eid, createdAt: { [Op.gte]: mes } },
      attributes: ["categoria", [fn("SUM", col("monto")), "total"]],
      group: ["categoria"], order: [[literal("total"), "DESC"]], raw: true,
    });

    res.json({ gastos, porCategoria, stats: { hoy: gastosHoy || 0, mes: gastosMes || 0, mayor } });
  } catch (err) { console.error(err); res.status(500).json({ error: "Error al obtener gastos" }); }
});

router.post("/", auth, async (req, res) => {
  try {
    const g = await Gasto.create({ ...req.body, empresa_id: req.empresaId });
    res.status(201).json(g);
  } catch (err) { res.status(500).json({ error: "Error al crear gasto" }); }
});

router.put("/:id", auth, async (req, res) => {
  try {
    await Gasto.update(req.body, { where: { id: req.params.id, empresa_id: req.empresaId } });
    res.json(await Gasto.findByPk(req.params.id));
  } catch (err) { res.status(500).json({ error: "Error al actualizar gasto" }); }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    await Gasto.destroy({ where: { id: req.params.id, empresa_id: req.empresaId } });
    res.json({ mensaje: "Gasto eliminado" });
  } catch (err) { res.status(500).json({ error: "Error al eliminar gasto" }); }
});

module.exports = router;