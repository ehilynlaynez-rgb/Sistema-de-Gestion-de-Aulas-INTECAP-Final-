const db = require("../config/db")
const ExcelJS = require("exceljs")

// Obtener historial
async function getHistory(req, res) {
  try {
    const { fecha_inicio, fecha_fin, action } = req.query

    let query = `
      SELECT h.*, u.name as user_name, u.email as user_email
      FROM history h
      INNER JOIN users u ON h.user_id = u.id
      WHERE 1=1
    `

    const params = []

    if (fecha_inicio) {
      query += " AND h.fecha >= ?"
      params.push(fecha_inicio)
    }

    if (fecha_fin) {
      query += " AND h.fecha <= ?"
      params.push(fecha_fin)
    }

    if (action) {
      query += " AND h.action = ?"
      params.push(action)
    }

    query += " ORDER BY h.created_at DESC"

    const [history] = await db.execute(query, params)

    res.json({
      success: true,
      history,
    })
  } catch (error) {
    console.error("Error al obtener historial:", error)
    res.status(500).json({
      success: false,
      message: "Error al obtener historial",
    })
  }
}

// Exportar historial a Excel
async function exportHistory(req, res) {
  try {
    const { fecha_inicio, fecha_fin } = req.query

    let query = `
      SELECT 
        h.id,
        h.instructor,
        h.aula,
        h.modulo,
        h.fecha,
        h.hora_inicio,
        h.hora_fin,
        h.grupo_whatsapp,
        h.status,
        h.action,
        h.created_at,
        u.name as usuario_nombre,
        u.email as usuario_email
      FROM history h
      INNER JOIN users u ON h.user_id = u.id
      WHERE 1=1
    `

    const params = []

    if (fecha_inicio) {
      query += " AND h.fecha >= ?"
      params.push(fecha_inicio)
    }

    if (fecha_fin) {
      query += " AND h.fecha <= ?"
      params.push(fecha_fin)
    }

    query += " ORDER BY h.fecha DESC, h.hora_inicio DESC"

    const [history] = await db.execute(query, params)

    // Crear archivo Excel
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Historial de Reservas")

    // Definir columnas
    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Instructor", key: "instructor", width: 25 },
      { header: "Aula", key: "aula", width: 20 },
      { header: "Módulo", key: "modulo", width: 15 },
      { header: "Fecha", key: "fecha", width: 15 },
      { header: "Hora Inicio", key: "hora_inicio", width: 12 },
      { header: "Hora Fin", key: "hora_fin", width: 12 },
      { header: "WhatsApp", key: "grupo_whatsapp", width: 15 },
      { header: "Estado", key: "status", width: 12 },
      { header: "Acción", key: "action", width: 15 },
      { header: "Usuario", key: "usuario_nombre", width: 25 },
      { header: "Email", key: "usuario_email", width: 30 },
      { header: "Fecha Registro", key: "created_at", width: 20 },
    ]

    // Estilo de encabezados
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "2563EB" },
    }
    worksheet.getRow(1).font = { color: { argb: "FFFFFF" }, bold: true }

    // Agregar datos
    history.forEach((item) => {
      worksheet.addRow({
        ...item,
        fecha: new Date(item.fecha).toLocaleDateString("es-ES"),
        created_at: new Date(item.created_at).toLocaleString("es-ES"),
      })
    })

    // Configurar respuesta
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    res.setHeader("Content-Disposition", `attachment; filename=historial_reservas_${Date.now()}.xlsx`)

    await workbook.xlsx.write(res)
    res.end()
  } catch (error) {
    console.error("Error al exportar historial:", error)
    res.status(500).json({
      success: false,
      message: "Error al exportar historial",
    })
  }
}

module.exports = { getHistory, exportHistory }
