const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Proveedor = sequelize.define("Proveedor", {
  id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre:      { type: DataTypes.STRING(150), allowNull: false },
  categoria:   { type: DataTypes.STRING(80) },
  contacto:    { type: DataTypes.STRING(100) },
  email:       { type: DataTypes.STRING(150) },
  telefono:    { type: DataTypes.STRING(20) },
  direccion:   { type: DataTypes.STRING(255) },
  ruc:         { type: DataTypes.STRING(20) },
  estado:      { type: DataTypes.ENUM("activo", "inactivo"), defaultValue: "activo" },
}, { tableName: "proveedores", timestamps: true });

module.exports = Proveedor;