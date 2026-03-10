const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Producto = sequelize.define("Producto", {
  id:           { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  empresa_id:   { type: DataTypes.INTEGER, allowNull: false },
  codigo:       { type: DataTypes.STRING(50) },
  nombre:       { type: DataTypes.STRING(150), allowNull: false },
  descripcion:  { type: DataTypes.TEXT },
  categoria:    { type: DataTypes.STRING(80) },
  stock:        { type: DataTypes.INTEGER, defaultValue: 0 },
  stock_minimo: { type: DataTypes.INTEGER, defaultValue: 5 },
  precio_costo: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
  precio_venta: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
  estado:       { type: DataTypes.ENUM("activo","inactivo"), defaultValue: "activo" },
}, { tableName: "productos", timestamps: true });

module.exports = Producto;