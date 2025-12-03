const express = require("express")
const router = express.Router()
const dashboardController = require("../controllers/dashboardController")
const { requireAuth } = require("../middleware/auth")

// Todas las rutas requieren autenticación
router.use(requireAuth)

// Rutas de dashboard
router.get("/stats", dashboardController.getStatistics)
router.get("/logs", dashboardController.getLogs)

module.exports = router
