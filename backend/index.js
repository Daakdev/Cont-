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

async function limpiarIndices() {
  // Eliminar índices duplicados acumulados por alter:true
  const tablas = ["usuarios", "clientes", "productos", "ventas", "gastos",
                  "proveedores", "empleados", "compras", "nomina", "empresas",
                  "detalle_ventas", "detalle_compras"];

  for (const tabla of tablas) {
    try {
      // Obtener índices de la tabla
      const [indices] = await sequelize.query(
        `SELECT INDEX_NAME FROM information_schema.STATISTICS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${tabla}'
         AND INDEX_NAME != 'PRIMARY'
         GROUP BY INDEX_NAME
         HAVING COUNT(*) >= 1`
      );

      // Mapear nombres y eliminar duplicados (dejar solo uno por nombre)
      const nombres = {};
      for (const idx of indices) {
        const name = idx.INDEX_NAME;
        if (!nombres[name]) {
          nombres[name] = 0;
        }
        nombres[name]++;
      }

      // Eliminar índices que no sean necesarios para el modelo
      // Solo eliminamos los índices automáticos de Sequelize (patron: tabla_campo_*)
      const [allIdx] = await sequelize.query(
        `SHOW INDEX FROM \`${tabla}\``
      );

      const seen = new Set();
      for (const idx of allIdx) {
        if (idx.Key_name === 'PRIMARY') continue;
        if (seen.has(idx.Key_name)) {
          // Índice duplicado — eliminar
          try {
            await sequelize.query(`ALTER TABLE \`${tabla}\` DROP INDEX \`${idx.Key_name}\``);
          } catch(e) { /* ignorar */ }
        } else {
          seen.add(idx.Key_name);
        }
      }
    } catch(e) { /* tabla no existe, ignorar */ }
  }
}

async function fixTabla(tabla) {
  try {
    await sequelize.query(
      `ALTER TABLE \`${tabla}\` ADD COLUMN \`createdAt\` DATETIME NOT NULL DEFAULT NOW()`
    );
  } catch (e) { /* ya existe */ }

  try {
    await sequelize.query(
      `ALTER TABLE \`${tabla}\` ADD COLUMN \`updatedAt\` DATETIME NOT NULL DEFAULT NOW()`
    );
  } catch (e) { /* ya existe */ }

  try {
    await sequelize.query(
      `UPDATE \`${tabla}\` SET createdAt = NOW() WHERE createdAt = '0000-00-00 00:00:00' OR createdAt IS NULL`
    );
    await sequelize.query(
      `UPDATE \`${tabla}\` SET updatedAt = NOW() WHERE updatedAt = '0000-00-00 00:00:00' OR updatedAt IS NULL`
    );
  } catch (e) { /* ignorar */ }
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

    // Agregar columna rol si no existe
    try {
      await sequelize.query(
        `ALTER TABLE \`usuarios\` ADD COLUMN \`rol\` ENUM('admin','empleado','desarrollador') NOT NULL DEFAULT 'admin'`
      );
      console.log("✅ Columna rol agregada");
    } catch (e) { /* ya existe */ }

    // Limpiar índices duplicados antes del sync
    await limpiarIndices();
    console.log("✅ Índices limpiados");

    // Usar force:false para no modificar estructura — solo crear tablas faltantes
    await sequelize.sync({ force: false });
    console.log("✅ Base de datos sincronizada");

    app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));
  } catch (err) {
    console.error("❌ Error BD:", err.message);
    process.exit(1);
  }
}

iniciar();