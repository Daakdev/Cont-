const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Empresa   = require("./empresa");

const Usuario = sequelize.define("Usuario", {
  id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  usuario:     { type: DataTypes.STRING(80), allowNull: false, unique: true },
  correo:      { type: DataTypes.STRING(150) },
  password:    { type: DataTypes.STRING(255), allowNull: false },
  empresa_id:  { type: DataTypes.INTEGER, references: { model: Empresa, key: "id" } },
}, { tableName: "usuarios", timestamps: true });

Usuario.belongsTo(Empresa, { foreignKey: "empresa_id", as: "empresa" });

module.exports = Usuario;