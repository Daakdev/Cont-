const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api/auth', require('./routes/auth'));

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT} ✅`);
});