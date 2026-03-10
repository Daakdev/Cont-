const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Empresa = sequelize.define("Empresa", {
  id:     { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING(150), allowNull: false },
  plan:   { type: DataTypes.ENUM("free", "pro"), defaultValue: "free" },
}, { tableName: "empresas", timestamps: true });

module.exports = Empresa;
