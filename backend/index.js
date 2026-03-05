const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

// servir frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// página principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/index.html"));
});

// health check para Render
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});