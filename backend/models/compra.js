const { DataTypes } = require("sequelize");
const sequelize  = require("../config/db");
const Proveedor  = require("./proveedor");
const Producto   = require("./producto");

const Compra = sequelize.define("Compra", {
  id:           { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  numero:       { type: DataTypes.STRING(20), unique: true },
  proveedor_id: { type: DataTypes.INTEGER, references: { model: Proveedor, key: "id" } },
  total:        { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  estado:       { type: DataTypes.ENUM("pendiente", "transito", "recibido"), defaultValue: "pendiente" },
  notas:        { type: DataTypes.TEXT },
}, { tableName: "compras", timestamps: true });

const DetalleCompra = sequelize.define("DetalleCompra", {
  id:           { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  compra_id:    { type: DataTypes.INTEGER, references: { model: Compra, key: "id" } },
  producto_id:  { type: DataTypes.INTEGER, references: { model: Producto, key: "id" } },
  cantidad:     { type: DataTypes.INTEGER, defaultValue: 1 },
  precio:       { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  subtotal:     { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
}, { tableName: "detalle_compras", timestamps: false });

Compra.belongsTo(Proveedor,        { foreignKey: "proveedor_id", as: "proveedor" });
Compra.hasMany(DetalleCompra,      { foreignKey: "compra_id",    as: "detalles" });
DetalleCompra.belongsTo(Compra,    { foreignKey: "compra_id" });
DetalleCompra.belongsTo(Producto,  { foreignKey: "producto_id",  as: "producto" });

module.exports = { Compra, DetalleCompra };