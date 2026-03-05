const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");

const app = express();

// CORS debe ir ANTES de todo
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

// Manejar preflight requests
app.options("*", cors());

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
});

app.get("/api/test", (req, res) => {
  res.json({ message: "Backend funcionando correctamente" });
});

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});