const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Usuario = sequelize.define("Usuario", {
  usuario: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  correo: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  }
}, {
  tableName: "usuarios",
  timestamps: true,
  createdAt: "creado_en",
  updatedAt: false
});

module.exports = Usuario;