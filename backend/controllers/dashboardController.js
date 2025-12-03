const db = require("../config/db")

// Obtener estadísticas para el dashboard
async function getStatistics(req, res) {
  try {
    // Total de aulas
    const [totalRooms] = await db.execute("SELECT COUNT(*) as total FROM rooms")

    // Aulas ocupadas
    const [occupiedRooms] = await db.execute("SELECT COUNT(*) as total FROM rooms WHERE estado = 'Ocupada'")

    // Total de reservas activas
    const [activeReservations] = await db.execute("SELECT COUNT(*) as total FROM reservations WHERE status = 'Activa'")

    // Reservas de hoy
    const [todayReservations] = await db.execute(
      "SELECT COUNT(*) as total FROM reservations WHERE fecha = CURDATE() AND status = 'Activa'",
    )

    // Reservas próximos 7 días
    const [weekReservations] = await db.execute(`
      SELECT COUNT(*) as total FROM reservations 
      WHERE fecha BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      AND status = 'Activa'
    `)

    // Total de usuarios
    const [totalUsers] = await db.execute("SELECT COUNT(*) as total FROM users WHERE active = 1")

    // Recursos dañados
    const [damagedResources] = await db.execute("SELECT COUNT(*) as total FROM resources WHERE estado = 'Dañado'")

    // Aulas más reservadas (top 5)
    const [topRooms] = await db.execute(`
      SELECT 
        r.nombre, 
        r.modulo,
        COUNT(res.id) as total_reservas
      FROM rooms r
      LEFT JOIN reservations res ON r.id = res.room_id
      GROUP BY r.id
      ORDER BY total_reservas DESC
      LIMIT 5
    `)

    // Reservas por día de la semana
    const [reservationsByDay] = await db.execute(`
      SELECT 
        DAYNAME(fecha) as dia,
        COUNT(*) as total
      FROM reservations
      WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY dia
      ORDER BY FIELD(dia, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
    `)

    res.json({
      success: true,
      statistics: {
        totalRooms: totalRooms[0].total,
        occupiedRooms: occupiedRooms[0].total,
        freeRooms: totalRooms[0].total - occupiedRooms[0].total,
        activeReservations: activeReservations[0].total,
        todayReservations: todayReservations[0].total,
        weekReservations: weekReservations[0].total,
        totalUsers: totalUsers[0].total,
        damagedResources: damagedResources[0].total,
        topRooms,
        reservationsByDay,
      },
    })
  } catch (error) {
    console.error("Error al obtener estadísticas:", error)
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas",
    })
  }
}

// Obtener logs (bitácora)
async function getLogs(req, res) {
  try {
    const { limit = 50, action, user_id } = req.query

    let query = `
      SELECT l.*, u.name as user_name, u.email as user_email
      FROM logs l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE 1=1
    `

    const params = []

    if (action) {
      query += " AND l.action = ?"
      params.push(action)
    }

    if (user_id) {
      query += " AND l.user_id = ?"
      params.push(user_id)
    }

    query += " ORDER BY l.created_at DESC LIMIT ?"
    params.push(Number.parseInt(limit))

    const [logs] = await db.execute(query, params)

    res.json({
      success: true,
      logs,
    })
  } catch (error) {
    console.error("Error al obtener logs:", error)
    res.status(500).json({
      success: false,
      message: "Error al obtener logs",
    })
  }
}

module.exports = { getStatistics, getLogs }
