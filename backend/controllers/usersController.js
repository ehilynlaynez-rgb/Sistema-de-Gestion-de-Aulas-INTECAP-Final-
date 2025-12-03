const bcrypt = require("bcrypt")
const db = require("../config/db")
const { logAction } = require("../utils/logger")

// Obtener todos los usuarios
async function getUsers(req, res) {
  try {
    const [users] = await db.execute(`
      SELECT id, name, email, role, active, created_at 
      FROM users 
      ORDER BY created_at DESC
    `)

    res.json({
      success: true,
      users,
    })
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    res.status(500).json({
      success: false,
      message: "Error al obtener usuarios",
    })
  }
}

// Crear usuario (SOLO ADMIN)
async function createUser(req, res) {
  try {
    const { name, email, password, role } = req.body

    // Validaciones
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son requeridos",
      })
    }

    // Validar rol
    if (!["ADMIN", "USUARIO"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Rol inválido. Solo ADMIN o USUARIO",
      })
    }

    // Verificar si el email ya existe
    const [existing] = await db.execute("SELECT id FROM users WHERE email = ?", [email])

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "El email ya está registrado",
      })
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear usuario
    const [result] = await db.execute("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", [
      name,
      email,
      hashedPassword,
      role,
    ])

    // Registrar en logs
    await logAction(req.session.userId, "CREATE_USER", `Creó usuario: ${name} (${email}) con rol ${role}`)

    res.json({
      success: true,
      message: "Usuario creado exitosamente",
      userId: result.insertId,
    })
  } catch (error) {
    console.error("Error al crear usuario:", error)
    res.status(500).json({
      success: false,
      message: "Error al crear usuario",
    })
  }
}

// Actualizar usuario
async function updateUser(req, res) {
  try {
    const { id } = req.params
    const { name, email, role, active } = req.body

    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: "Nombre, email y rol son requeridos",
      })
    }

    // Validar rol
    if (!["ADMIN", "USUARIO"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Rol inválido",
      })
    }

    await db.execute("UPDATE users SET name = ?, email = ?, role = ?, active = ? WHERE id = ?", [
      name,
      email,
      role,
      active ? 1 : 0,
      id,
    ])

    // Registrar en logs
    await logAction(req.session.userId, "UPDATE_USER", `Actualizó usuario ID ${id}: ${name}`)

    res.json({
      success: true,
      message: "Usuario actualizado exitosamente",
    })
  } catch (error) {
    console.error("Error al actualizar usuario:", error)
    res.status(500).json({
      success: false,
      message: "Error al actualizar usuario",
    })
  }
}

// Eliminar usuario (desactivar)
async function deleteUser(req, res) {
  try {
    const { id } = req.params

    // No permitir eliminar al propio usuario
    if (Number.parseInt(id) === req.session.userId) {
      return res.status(400).json({
        success: false,
        message: "No puede eliminar su propio usuario",
      })
    }

    await db.execute("UPDATE users SET active = 0 WHERE id = ?", [id])

    // Registrar en logs
    await logAction(req.session.userId, "DELETE_USER", `Desactivó usuario ID ${id}`)

    res.json({
      success: true,
      message: "Usuario desactivado exitosamente",
    })
  } catch (error) {
    console.error("Error al eliminar usuario:", error)
    res.status(500).json({
      success: false,
      message: "Error al eliminar usuario",
    })
  }
}

module.exports = { getUsers, createUser, updateUser, deleteUser }
