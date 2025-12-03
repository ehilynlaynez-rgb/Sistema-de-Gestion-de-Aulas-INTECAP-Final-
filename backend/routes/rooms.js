const express = require("express")
const router = express.Router()
const roomsController = require("../controllers/roomsController")
const { requireAuth } = require("../middleware/auth")

// Todas las rutas requieren autenticación
router.use(requireAuth)

// Rutas de aulas
router.get("/", roomsController.getRooms)
router.get("/:id", roomsController.getRoomById)
router.post("/:id/qr", roomsController.generateQR)

module.exports = router
