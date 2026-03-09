require("dotenv").config();

const express    = require("express");
const cors       = require("cors");
const sequelize  = require("./config/db");
const authRoutes = require("./routes/auth");

// Importar modelos para que Sequelize los registre
require("./models/Cliente");
require("./models/Producto");
require("./models/Venta");
require("./models/Gasto");

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

// Rutas
app.get("/health",    (req, res) => res.status(200).json({ status: "ok" }));
app.get("/",          (req, res) => res.send("API Cont+ funcionando 🚀"));

app.use("/api/auth",       authRoutes);
app.use("/api/clientes",   require("./routes/clientes"));
app.use("/api/inventario", require("./routes/inventario"));
app.use("/api/ventas",     require("./routes/ventas"));
app.use("/api/gastos",     require("./routes/gastos"));

const PORT = process.env.PORT || 3000;

sequelize.sync({ alter: true })
  .then(() => {
    console.log("✅ Base de datos sincronizada");
    app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
  })
  .catch(err => {
    console.error("❌ Error conectando a la BD:", err);
    process.exit(1);
  });