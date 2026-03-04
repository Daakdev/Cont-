const mysql = require('mysql2/promise');
require('dotenv').config();

// Función para crear la conexión a la base de datos
// Soporta tanto DATABASE_URL (Render) como variables individuales (desarrollo local)
function createDbConnection() {
    let connectionConfig;
    
if (process.env.DATABASE_URL) {
    const dbUrl = new URL(process.env.DATABASE_URL);

    connectionConfig = {
        host: dbUrl.hostname,
        user: dbUrl.username,
        password: dbUrl.password,
        database: dbUrl.pathname.replace('/', ''),
        port: dbUrl.port || 3306,
        ssl: {
            rejectUnauthorized: false
        }
    };

    console.log('🔗 Conectando via DATABASE_URL (Render)');
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
