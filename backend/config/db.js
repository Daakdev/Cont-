const { Sequelize } = require("sequelize");

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL no está definida");
  process.exit(1);
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "mysql",
  dialectOptions: {
    ssl: {
      rejectUnauthorized: false
    }
  },
  logging: false
});

module.exports = sequelize;