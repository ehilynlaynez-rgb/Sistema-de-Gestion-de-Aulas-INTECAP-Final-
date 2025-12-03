const db = require("../config/db")
const { sendReservationEmail } = require("../utils/email")
const { sendWhatsAppNotification } = require("../utils/whatsapp")
const { logAction } = require("../utils/logger")

// Obtener reservas
async function getReservations(req, res) {
  try {
    const { status, fecha } = req.query

    let query = `
      SELECT r.*, u.name as user_name, u.email as user_email, rm.nombre as room_name
      FROM reservations r
      INNER JOIN users u ON r.user_id = u.id
      INNER JOIN rooms rm ON r.room_id = rm.id
      WHERE 1=1
    `

    const params = []

    if (status) {
      query += " AND r.status = ?"
      params.push(status)
    }

    if (fecha) {
      query += " AND r.fecha = ?"
      params.push(fecha)
    }

    query += " ORDER BY r.fecha DESC, r.hora_inicio DESC"

    const [reservations] = await db.execute(query, params)

    res.json({
      success: true,
      reservations,
    })
  } catch (error) {
    console.error("Error al obtener reservas:", error)
    res.status(500).json({
      success: false,
      message: "Error al obtener reservas",
    })
  }
}

// Verificar disponibilidad
async function checkAvailability(req, res) {
  try {
    const { room_id, fecha, hora_inicio, hora_fin } = req.query

    if (!room_id || !fecha || !hora_inicio || !hora_fin) {
      return res.status(400).json({
        success: false,
        message: "Todos los parámetros son requeridos",
      })
    }

    // Verificar que la fecha no sea mayor a 7 días
    const today = new Date()
    const reservationDate = new Date(fecha)
    const diffTime = Math.abs(reservationDate - today)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays > 7) {
      return res.json({
        success: true,
        available: false,
        message: "No se pueden hacer reservas a más de 7 días",
      })
    }

    // Verificar cruces de horarios
    const [conflicts] = await db.execute(
      `
      SELECT * FROM reservations
      WHERE room_id = ? 
        AND fecha = ?
        AND status = 'Activa'
        AND (
          (hora_inicio < ? AND hora_fin > ?) OR
          (hora_inicio < ? AND hora_fin > ?) OR
          (hora_inicio >= ? AND hora_fin <= ?)
        )
    `,
      [room_id, fecha, hora_fin, hora_inicio, hora_fin, hora_inicio, hora_inicio, hora_fin],
    )

    if (conflicts.length > 0) {
      return res.json({
        success: true,
        available: false,
        message: "El aula ya está reservada en ese horario",
        conflicts,
      })
    }

    res.json({
      success: true,
      available: true,
      message: "El aula está disponible",
    })
  } catch (error) {
    console.error("Error al verificar disponibilidad:", error)
    res.status(500).json({
      success: false,
      message: "Error al verificar disponibilidad",
    })
  }
}

// Crear reserva
async function createReservation(req, res) {
  try {
    const { room_id, instructor, fecha, hora_inicio, hora_fin, grupo_whatsapp } = req.body

    // Validaciones
    if (!room_id || !instructor || !fecha || !hora_inicio || !hora_fin) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son requeridos",
      })
    }

    // Verificar restricción de 7 días
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const reservationDate = new Date(fecha)
    const diffTime = reservationDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return res.status(400).json({
        success: false,
        message: "No se pueden hacer reservas en fechas pasadas",
      })
    }

    if (diffDays > 7) {
      return res.status(400).json({
        success: false,
        message: "No se pueden hacer reservas a más de 7 días",
      })
    }

    // Verificar cruces de horarios
    const [conflicts] = await db.execute(
      `
      SELECT * FROM reservations
      WHERE room_id = ? 
        AND fecha = ?
        AND status = 'Activa'
        AND (
          (hora_inicio < ? AND hora_fin > ?) OR
          (hora_inicio < ? AND hora_fin > ?) OR
          (hora_inicio >= ? AND hora_fin <= ?)
        )
    `,
      [room_id, fecha, hora_fin, hora_inicio, hora_fin, hora_inicio, hora_inicio, hora_fin],
    )

    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: "El aula ya está reservada en ese horario",
      })
    }

    // Obtener información del aula
    const [rooms] = await db.execute("SELECT * FROM rooms WHERE id = ?", [room_id])

    if (rooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Aula no encontrada",
      })
    }

    const room = rooms[0]

    // Crear reserva
    const [result] = await db.execute(
      `
      INSERT INTO reservations 
      (user_id, room_id, instructor, aula, modulo, fecha, hora_inicio, hora_fin, grupo_whatsapp, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Activa')
    `,
      [req.session.userId, room_id, instructor, room.nombre, room.modulo, fecha, hora_inicio, hora_fin, grupo_whatsapp],
    )

    // Actualizar estado del aula
    await db.execute("UPDATE rooms SET estado = ?, ocupado_por = ? WHERE id = ?", ["Ocupada", instructor, room_id])

    const reservationData = {
      instructor,
      aula: room.nombre,
      modulo: room.modulo,
      fecha,
      hora_inicio,
      hora_fin,
    }

    // Enviar correo (asíncrono, no bloqueante)
    const userEmail = req.session.userEmail
    const [admins] = await db.execute("SELECT email FROM users WHERE role = 'ADMIN' LIMIT 1")
    const adminEmail = admins.length > 0 ? admins[0].email : null

    sendReservationEmail(reservationData, userEmail, adminEmail).catch((err) =>
      console.error("Error al enviar correo:", err),
    )

    // Enviar WhatsApp (asíncrono, no bloqueante)
    if (grupo_whatsapp) {
      sendWhatsAppNotification(reservationData, grupo_whatsapp).catch((err) =>
        console.error("Error al enviar WhatsApp:", err),
      )
    }

    // Registrar en logs
    await logAction(
      req.session.userId,
      "CREATE_RESERVATION",
      `Reservó ${room.nombre} para ${fecha} ${hora_inicio}-${hora_fin}`,
    )

    res.json({
      success: true,
      message: "Reserva creada exitosamente",
      reservationId: result.insertId,
    })
  } catch (error) {
    console.error("Error al crear reserva:", error)
    res.status(500).json({
      success: false,
      message: "Error al crear reserva",
    })
  }
}

// Cancelar reserva
async function cancelReservation(req, res) {
  try {
    const { id } = req.params

    // Obtener reserva
    const [reservations] = await db.execute("SELECT * FROM reservations WHERE id = ?", [id])

    if (reservations.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Reserva no encontrada",
      })
    }

    const reservation = reservations[0]

    // Actualizar estado de reserva
    await db.execute("UPDATE reservations SET status = 'Cancelada' WHERE id = ?", [id])

    // Liberar aula si no tiene más reservas activas
    const [activeReservations] = await db.execute(
      `
      SELECT * FROM reservations 
      WHERE room_id = ? AND status = 'Activa' AND id != ?
    `,
      [reservation.room_id, id],
    )

    if (activeReservations.length === 0) {
      await db.execute("UPDATE rooms SET estado = ?, ocupado_por = NULL WHERE id = ?", ["Libre", reservation.room_id])
    }

    // Registrar en logs
    await logAction(req.session.userId, "CANCEL_RESERVATION", `Canceló reserva ID ${id} - ${reservation.aula}`)

    res.json({
      success: true,
      message: "Reserva cancelada exitosamente",
    })
  } catch (error) {
    console.error("Error al cancelar reserva:", error)
    res.status(500).json({
      success: false,
      message: "Error al cancelar reserva",
    })
  }
}

module.exports = {
  getReservations,
  checkAvailability,
  createReservation,
  cancelReservation,
}
