const bcrypt = require("bcrypt")
const db = require("../config/db")
const { logAction } = require("../utils/logger")

// Login
async function login(req, res) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email y contraseña son requeridos",
      })
    }

    // Buscar usuario
    const [users] = await db.execute("SELECT * FROM users WHERE email = ? AND active = 1", [email])

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Credenciales incorrectas",
      })
    }

    const user = users[0]

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Credenciales incorrectas",
      })
    }

    // Crear sesión
    req.session.userId = user.id
    req.session.userName = user.name
    req.session.userEmail = user.email
    req.session.userRole = user.role

    // Registrar en logs
    await logAction(user.id, "LOGIN", `Usuario ${user.email} inició sesión`)

    res.json({
      success: true,
      message: "Inicio de sesión exitoso",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Error en login:", error)
    res.status(500).json({
      success: false,
      message: "Error al iniciar sesión",
    })
  }
}

// Logout
async function logout(req, res) {
  try {
    const userId = req.session.userId

    if (userId) {
      await logAction(userId, "LOGOUT", "Usuario cerró sesión")
    }

    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error al cerrar sesión",
        })
      }
      res.json({
        success: true,
        message: "Sesión cerrada exitosamente",
      })
    })
  } catch (error) {
    console.error("Error en logout:", error)
    res.status(500).json({
      success: false,
      message: "Error al cerrar sesión",
    })
  }
}

// Verificar sesión
function checkSession(req, res) {
  if (req.session && req.session.userId) {
    res.json({
      success: true,
      authenticated: true,
      user: {
        id: req.session.userId,
        name: req.session.userName,
        email: req.session.userEmail,
        role: req.session.userRole,
      },
    })
  } else {
    res.json({
      success: true,
      authenticated: false,
    })
  }
}

module.exports = { login, logout, checkSession }
