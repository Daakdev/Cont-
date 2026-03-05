const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

const frontendPath = path.join(__dirname, "../frontend");

// servir archivos estáticos
app.use(express.static(frontendPath));

// página principal
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "pages/index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});