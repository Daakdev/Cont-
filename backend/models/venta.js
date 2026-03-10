const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Cliente   = require("./cliente");
const Producto  = require("./producto");

const Venta = sequelize.define("Venta", {
  id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  empresa_id:  { type: DataTypes.INTEGER, allowNull: false },
  numero:      { type: DataTypes.STRING(20) },
  cliente_id:  { type: DataTypes.INTEGER, references: { model: Cliente, key: "id" } },
  subtotal:    { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
  impuesto:    { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
  total:       { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
  estado:      { type: DataTypes.ENUM("pendiente","pagado","anulado"), defaultValue: "pendiente" },
}, { tableName: "ventas", timestamps: true });

const DetalleVenta = sequelize.define("DetalleVenta", {
  id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  venta_id:    { type: DataTypes.INTEGER, references: { model: Venta, key: "id" } },
  producto_id: { type: DataTypes.INTEGER, references: { model: Producto, key: "id" } },
  cantidad:    { type: DataTypes.INTEGER, defaultValue: 1 },
  precio:      { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
  subtotal:    { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
}, { tableName: "detalle_ventas", timestamps: false });

Venta.belongsTo(Cliente,       { foreignKey: "cliente_id",  as: "cliente" });
Venta.hasMany(DetalleVenta,    { foreignKey: "venta_id",    as: "detalles" });
DetalleVenta.belongsTo(Venta,  { foreignKey: "venta_id" });
DetalleVenta.belongsTo(Producto,{ foreignKey: "producto_id", as: "producto" });

module.exports = { Venta, DetalleVenta };