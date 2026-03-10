const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Gasto = sequelize.define("Gasto", {
  id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  empresa_id:  { type: DataTypes.INTEGER, allowNull: false },
  descripcion: { type: DataTypes.STRING(255), allowNull: false },
  categoria:   { type: DataTypes.STRING(80) },
  monto:       { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
  fecha:       { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  notas:       { type: DataTypes.TEXT },
}, { tableName: "gastos", timestamps: true });

module.exports = Gasto;