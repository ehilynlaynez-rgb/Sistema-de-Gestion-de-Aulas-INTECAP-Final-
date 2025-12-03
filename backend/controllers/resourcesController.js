const db = require("../config/db")
const { logAction } = require("../utils/logger")

// Obtener recursos con filtros
async function getResources(req, res) {
  try {
    const { aula_id, tipo, estado } = req.query

    let query = `
      SELECT r.*, rm.nombre as aula_nombre, rm.modulo
      FROM resources r
      INNER JOIN rooms rm ON r.aula_id = rm.id
      WHERE 1=1
    `

    const params = []

    if (aula_id) {
      query += " AND r.aula_id = ?"
      params.push(aula_id)
    }

    if (tipo) {
      query += " AND r.tipo LIKE ?"
      params.push(`%${tipo}%`)
    }

    if (estado) {
      query += " AND r.estado = ?"
      params.push(estado)
    }

    query += " ORDER BY r.aula_id, r.tipo, r.codigo"

    const [resources] = await db.execute(query, params)

    res.json({
      success: true,
      resources,
    })
  } catch (error) {
    console.error("Error al obtener recursos:", error)
    res.status(500).json({
      success: false,
      message: "Error al obtener recursos",
    })
  }
}

// Crear recurso
async function createResource(req, res) {
  try {
    const { aula_id, tipo, codigo, estado } = req.body

    if (!aula_id || !tipo || !codigo) {
      return res.status(400).json({
        success: false,
        message: "Aula, tipo y código son requeridos",
      })
    }

    // Verificar que el aula existe
    const [rooms] = await db.execute("SELECT * FROM rooms WHERE id = ?", [aula_id])

    if (rooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Aula no encontrada",
      })
    }

    const [result] = await db.execute("INSERT INTO resources (aula_id, tipo, codigo, estado) VALUES (?, ?, ?, ?)", [
      aula_id,
      tipo,
      codigo,
      estado || "Activo",
    ])

    // Registrar en logs
    await logAction(req.session.userId, "CREATE_RESOURCE", `Creó recurso ${tipo} - ${codigo} en ${rooms[0].nombre}`)

    res.json({
      success: true,
      message: "Recurso creado exitosamente",
      resourceId: result.insertId,
    })
  } catch (error) {
    console.error("Error al crear recurso:", error)
    res.status(500).json({
      success: false,
      message: "Error al crear recurso",
    })
  }
}

// Actualizar estado de recurso (Dañado/Reparado)
async function updateResourceStatus(req, res) {
  try {
    const { id } = req.params
    const { estado } = req.body

    if (!["Activo", "Dañado", "Reparado"].includes(estado)) {
      return res.status(400).json({
        success: false,
        message: "Estado inválido",
      })
    }

    await db.execute("UPDATE resources SET estado = ? WHERE id = ?", [estado, id])

    // Registrar en logs
    await logAction(req.session.userId, "UPDATE_RESOURCE_STATUS", `Cambió estado de recurso ID ${id} a ${estado}`)

    res.json({
      success: true,
      message: "Estado del recurso actualizado exitosamente",
    })
  } catch (error) {
    console.error("Error al actualizar recurso:", error)
    res.status(500).json({
      success: false,
      message: "Error al actualizar recurso",
    })
  }
}

// Eliminar recurso
async function deleteResource(req, res) {
  try {
    const { id } = req.params

    await db.execute("DELETE FROM resources WHERE id = ?", [id])

    // Registrar en logs
    await logAction(req.session.userId, "DELETE_RESOURCE", `Eliminó recurso ID ${id}`)

    res.json({
      success: true,
      message: "Recurso eliminado exitosamente",
    })
  } catch (error) {
    console.error("Error al eliminar recurso:", error)
    res.status(500).json({
      success: false,
      message: "Error al eliminar recurso",
    })
  }
}

module.exports = {
  getResources,
  createResource,
  updateResourceStatus,
  deleteResource,
}
