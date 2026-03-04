const mysql = require('mysql2/promise');
require('dotenv').config();

function createDbConnection() {
    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL no está definida en Render");
        process.exit(1);
    }

    const dbUrl = new URL(process.env.DATABASE_URL);

    const connectionConfig = {
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

    const pool = mysql.createPool(connectionConfig);

    return pool;
}

module.exports = createDbConnection();
