const mysql = require("mysql2/promise")
require("dotenv").config()

const pool = mysql.createPool({
  host: process.env.MYSQLHOST || process.env.DB_HOST || "localhost",
  user: process.env.MYSQLUSER || process.env.DB_USER || "root",
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || "",
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || "sistema_aulas",
  port: process.env.MYSQLPORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// Verificar conexión
pool
  .getConnection()
  .then((connection) => {
    console.log("✅ Conexión a MySQL establecida correctamente")
    console.log(`📊 Base de datos: ${process.env.MYSQLDATABASE || process.env.DB_NAME || "sistema_aulas"}`)
    console.log(`🖥️  Host: ${process.env.MYSQLHOST || process.env.DB_HOST || "localhost"}`)
    connection.release()
  })
  .catch((err) => {
    console.error("❌ Error al conectar a MySQL:", err.message)
  })

module.exports = pool
