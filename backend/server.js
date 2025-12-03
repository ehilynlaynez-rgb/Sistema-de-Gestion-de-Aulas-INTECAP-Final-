const express = require("express")
const session = require("express-session")
const cors = require("cors")
const path = require("path")
require("dotenv").config()

const app = express()
const PORT = process.env.PORT || 3000

// Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:8080",
    credentials: true,
  }),
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Configurar sesiones
app.use(
  session({
    secret: process.env.SESSION_SECRET || "sistema_aulas_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Cambiar a true en producción con HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    },
  }),
)

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, "../frontend")))

// Rutas API
const authRoutes = require("./routes/auth")
const usersRoutes = require("./routes/users")
const roomsRoutes = require("./routes/rooms")
const resourcesRoutes = require("./routes/resources")
const reservationsRoutes = require("./routes/reservations")
const historyRoutes = require("./routes/history")
const dashboardRoutes = require("./routes/dashboard")

app.use("/api/auth", authRoutes)
app.use("/api/users", usersRoutes)
app.use("/api/rooms", roomsRoutes)
app.use("/api/resources", resourcesRoutes)
app.use("/api/reservations", reservationsRoutes)
app.use("/api/history", historyRoutes)
app.use("/api/dashboard", dashboardRoutes)

// Ruta raíz redirige al login
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/login.html"))
})

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error("Error global:", err)
  res.status(500).json({
    success: false,
    message: "Error interno del servidor",
  })
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║   🏫 Sistema de Gestión de Aulas              ║
║   ✅ Servidor iniciado correctamente          ║
║   🌐 Puerto: ${PORT}                             ║
║   📁 Frontend: http://localhost:${PORT}         ║
║   🔌 API: http://localhost:${PORT}/api          ║
╚════════════════════════════════════════════════╝
  `)
})
