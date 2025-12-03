const db = require("../config/db")
const { generateRoomQR } = require("../utils/qr")
const { logAction } = require("../utils/logger")

// Obtener todas las aulas
async function getRooms(req, res) {
  try {
    const [rooms] = await db.execute(`
      SELECT 
        r.*,
        COUNT(DISTINCT res.id) as total_reservas,
        COUNT(DISTINCT CASE WHEN res.status = 'Activa' THEN res.id END) as reservas_activas
      FROM rooms r
      LEFT JOIN reservations res ON r.id = res.room_id
      GROUP BY r.id
      ORDER BY r.modulo, r.nombre
    `)

    res.json({
      success: true,
      rooms,
    })
  } catch (error) {
    console.error("Error al obtener aulas:", error)
    res.status(500).json({
      success: false,
      message: "Error al obtener aulas",
    })
  }
}

// Obtener aula por ID
async function getRoomById(req, res) {
  try {
    const { id } = req.params

    const [rooms] = await db.execute(
      `
      SELECT r.*,
        COUNT(DISTINCT res.id) as total_reservas
      FROM rooms r
      LEFT JOIN reservations res ON r.id = res.room_id
      WHERE r.id = ?
      GROUP BY r.id
    `,
      [id],
    )

    if (rooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Aula no encontrada",
      })
    }

    // Obtener reservas activas del aula
    const [reservations] = await db.execute(
      `
      SELECT * FROM reservations 
      WHERE room_id = ? AND status = 'Activa' 
      ORDER BY fecha ASC, hora_inicio ASC
    `,
      [id],
    )

    res.json({
      success: true,
      room: rooms[0],
      reservations,
    })
  } catch (error) {
    console.error("Error al obtener aula:", error)
    res.status(500).json({
      success: false,
      message: "Error al obtener aula",
    })
  }
}

// Generar código QR para aula
async function generateQR(req, res) {
  try {
    const { id } = req.params

    // Verificar que el aula existe
    const [rooms] = await db.execute("SELECT * FROM rooms WHERE id = ?", [id])

    if (rooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Aula no encontrada",
      })
    }

    const room = rooms[0]

    // Generar QR
    const qrUrl = await generateRoomQR(room.id, room.nombre)

    // Actualizar URL del QR en la base de datos
    await db.execute("UPDATE rooms SET qr_url = ? WHERE id = ?", [qrUrl, id])

    // Registrar en logs
    await logAction(req.session.userId, "GENERATE_QR", `Generó código QR para ${room.nombre}`)

    res.json({
      success: true,
      message: "Código QR generado exitosamente",
      qrUrl,
    })
  } catch (error) {
    console.error("Error al generar QR:", error)
    res.status(500).json({
      success: false,
      message: "Error al generar código QR",
    })
  }
}

module.exports = { getRooms, getRoomById, generateQR }
