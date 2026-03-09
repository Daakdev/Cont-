const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Gasto = sequelize.define("Gasto", {
  id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  descripcion: { type: DataTypes.STRING(200), allowNull: false },
  categoria:   { type: DataTypes.STRING(80) },
  monto:       { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  fecha:       { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  notas:       { type: DataTypes.TEXT },
}, { tableName: "gastos", timestamps: true });

module.exports = Gasto;