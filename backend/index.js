require("dotenv").config();

const express   = require("express");
const cors      = require("cors");
const sequelize = require("./config/db");

// Modelos
require("./models/empresa");
require("./models/usuario");
require("./models/cliente");
require("./models/producto");
require("./models/venta");
require("./models/gasto");
require("./models/proveedor");
require("./models/empleado");
require("./models/compra");
require("./models/nomina");

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://cont-frontend.onrender.com"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options("*", cors());
app.use(express.json());

app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));
app.get("/",       (req, res) => res.send("API Cont+ funcionando 🚀"));

app.use("/api/auth",        require("./routes/auth"));
app.use("/api/clientes",    require("./routes/clientes"));
app.use("/api/inventario",  require("./routes/inventario"));
app.use("/api/ventas",      require("./routes/ventas"));
app.use("/api/gastos",      require("./routes/gastos"));
app.use("/api/proveedores", require("./routes/proveedores"));
app.use("/api/empleados",   require("./routes/empleados"));
app.use("/api/compras",     require("./routes/compras"));
app.use("/api/nomina",      require("./routes/nomina"));

const PORT = process.env.PORT || 3000;

async function fixTabla(tabla) {
  try {
    // Si la columna no existe, agregarla con DEFAULT NOW()
    await sequelize.query(`
      ALTER TABLE \`${tabla}\` 
      ADD COLUMN \`createdAt\` DATETIME NOT NULL DEFAULT NOW()
    `);
    console.log(`✅ createdAt agregado a ${tabla}`);
  } catch (e) {
    // Ya existe o tabla no existe — ignorar
  }

  try {
    await sequelize.query(`
      ALTER TABLE \`${tabla}\` 
      ADD COLUMN \`updatedAt\` DATETIME NOT NULL DEFAULT NOW()
    `);
    console.log(`✅ updatedAt agregado a ${tabla}`);
  } catch (e) {
    // Ya existe — ignorar
  }

  try {
    // Si existe con valor inválido, corregir
    await sequelize.query(`
      UPDATE \`${tabla}\` 
      SET createdAt = NOW() 
      WHERE createdAt = '0000-00-00 00:00:00' OR createdAt IS NULL
    `);
    await sequelize.query(`
      UPDATE \`${tabla}\` 
      SET updatedAt = NOW() 
      WHERE updatedAt = '0000-00-00 00:00:00' OR updatedAt IS NULL
    `);
  } catch (e) {
    // Ignorar
  }
}

async function iniciar() {
  try {
    const tablas = ["usuarios", "clientes", "productos", "ventas", "gastos",
                    "proveedores", "empleados", "compras", "nomina", "empresas",
                    "detalle_ventas", "detalle_compras"];

    for (const tabla of tablas) {
      await fixTabla(tabla);
    }
    console.log("✅ Fix de fechas completado");

    await sequelize.sync({ alter: true });
    console.log("✅ Base de datos sincronizada");

    app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));
  } catch (err) {
    console.error("❌ Error BD:", err.message);
    process.exit(1);
  }
}

iniciar();