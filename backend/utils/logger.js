const db = require("../config/db")

// Registrar acción en la bitácora (logs)
async function logAction(userId, action, details = null) {
  try {
    const query = `
      INSERT INTO logs (user_id, action, details, created_at) 
      VALUES (?, ?, ?, NOW())
    `
    await db.execute(query, [userId, action, details])
  } catch (error) {
    console.error("Error al registrar log:", error)
  }
}

module.exports = { logAction }
