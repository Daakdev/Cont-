const mysql = require('mysql2');
require('dotenv').config();

// Función para crear la conexión a la base de datos
// Soporta tanto DATABASE_URL (Render) como variables individuales (desarrollo local)
function createDbConnection() {
    let connectionConfig;
    
    if (process.env.DATABASE_URL) {
        // Render proporciona DATABASE_URL en formato mysql://user:password@host:port/database
        connectionConfig = process.env.DATABASE_URL;
        console.log('🔗 Conectando via DATABASE_URL (Aiven/Render)');
    } else {
        // Variables individuales para desarrollo local
        connectionConfig = {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        };
        console.log('🔗 Conectando via variables locales');
    }
    
    // Usar createPool en lugar de createConnection para mejor manejo de conexiones
    const pool = mysql.createPool(connectionConfig);
    
    // Verificar la conexión
    pool.getConnection()
        .then(connection => {
            console.log('✅ MySQL conectado exitosamente');
            connection.release();
        })
        .catch(err => {
            console.error('❌ Error de conexión a BD:', err.message);
            // No salir del proceso - dejar que index.js maneje el error
        });
    
    return pool;
}

// Crear y exportar la conexión
const db = createDbConnection();

module.exports = db;
