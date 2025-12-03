const express = require("express")
const router = express.Router()
const historyController = require("../controllers/historyController")
const { requireAuth } = require("../middleware/auth")

// Todas las rutas requieren autenticación
router.use(requireAuth)

// Rutas de historial
router.get("/", historyController.getHistory)
router.get("/export", historyController.exportHistory)

module.exports = router
