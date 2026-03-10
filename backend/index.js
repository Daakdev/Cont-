require("dotenv").config();

const express   = require("express");
const cors      = require("cors");
const sequelize = require("./config/db");

// Modelos — orden importante: empresa y usuario primero
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

sequelize.sync({ alter: true })
  .then(() => {
    console.log("✅ Base de datos sincronizada");
    app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));
  })
  .catch(err => {
    console.error("❌ Error BD:", err);
    process.exit(1);
  });

  // RUTA TEMPORAL DE FIX — eliminar después
app.get("/fix-db", async (req, res) => {
  try {
    await sequelize.query("UPDATE usuarios SET createdAt = NOW() WHERE createdAt = '0000-00-00 00:00:00'");
    await sequelize.query("UPDATE usuarios SET updatedAt = NOW() WHERE updatedAt = '0000-00-00 00:00:00'");
    res.json({ ok: true, mensaje: "Fix aplicado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});