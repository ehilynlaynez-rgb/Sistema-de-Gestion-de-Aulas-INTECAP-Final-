// Middleware de autenticación
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      message: "No autorizado. Por favor inicie sesión.",
    })
  }
  next()
}

// Middleware para verificar rol de administrador
const requireAdmin = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      message: "No autorizado. Por favor inicie sesión.",
    })
  }

  if (req.session.userRole !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Acceso denegado. Solo administradores.",
    })
  }
  next()
}

module.exports = { requireAuth, requireAdmin }
