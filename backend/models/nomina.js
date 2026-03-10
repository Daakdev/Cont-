const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Empleado  = require("./empleado");

const Nomina = sequelize.define("Nomina", {
  id:           { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  empresa_id:   { type: DataTypes.INTEGER, allowNull: false },
  empleado_id:  { type: DataTypes.INTEGER, references: { model: Empleado, key: "id" } },
  mes:          { type: DataTypes.STRING(7) },
  sueldo_base:  { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
  horas_extra:  { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
  descuentos:   { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
  neto:         { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
  estado:       { type: DataTypes.ENUM("pendiente","pagado"), defaultValue: "pendiente" },
}, { tableName: "nomina", timestamps: true });

Nomina.belongsTo(Empleado, { foreignKey: "empleado_id", as: "empleado" });

module.exports = Nomina;