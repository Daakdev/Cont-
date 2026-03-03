const express = require('express');
const cors    = require('cors');
require('dotenv').config();

// Validar variables de entorno requeridas
const requiredEnvVars = ['JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.warn(`⚠️  Advertencia: Las siguientes variables de entorno no están definidas: ${missingEnvVars.join(', ')}`);
}

const app  = express();
const PORT = process.env.PORT || 3000;

// Configuración de CORS para producción
const corsOptions = {
    origin: function (origin, callback) {
        // Permitir solicitudes sin origen (como Postman/móvil)
        // En producción, reemplazar con tu dominio de Render
        const allowedOrigins = [
            'http://localhost:8080',
            'http://localhost:3000',
            'https://cont-frontend.onrender.com'  // Cambiar por tu URL de producción
        ];
        
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/auth', require('./routes/auth'));

// Endpoint de salud para verificar que el servidor está corriendo
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT} ✅`);
    console.log(`📋 Entorno: ${process.env.NODE_ENV || 'development'}`);
});
