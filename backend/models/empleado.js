const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Empleado = sequelize.define("Empleado", {
  id:           { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre:       { type: DataTypes.STRING(150), allowNull: false },
  cargo:        { type: DataTypes.STRING(100) },
  departamento: { type: DataTypes.STRING(100) },
  email:        { type: DataTypes.STRING(150) },
  telefono:     { type: DataTypes.STRING(20) },
  fecha_ingreso:{ type: DataTypes.DATEONLY },
  sueldo_base:  { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  estado:       { type: DataTypes.ENUM("activo", "vacaciones", "inactivo"), defaultValue: "activo" },
}, { tableName: "empleados", timestamps: true });

module.exports = Empleado;