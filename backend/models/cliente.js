const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Cliente = sequelize.define("Cliente", {
  id:         { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  empresa_id: { type: DataTypes.INTEGER, allowNull: false },
  nombre:     { type: DataTypes.STRING(150), allowNull: false },
  tipo:       { type: DataTypes.ENUM("natural", "empresa"), defaultValue: "natural" },
  ruc_ci:     { type: DataTypes.STRING(20) },
  email:      { type: DataTypes.STRING(150) },
  telefono:   { type: DataTypes.STRING(20) },
  direccion:  { type: DataTypes.STRING(255) },
  estado:     { type: DataTypes.ENUM("activo", "inactivo"), defaultValue: "activo" },
}, { tableName: "clientes", timestamps: true });

module.exports = Cliente;