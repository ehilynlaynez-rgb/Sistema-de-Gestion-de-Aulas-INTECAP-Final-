const express = require("express")
const router = express.Router()
const reservationsController = require("../controllers/reservationsController")
const { requireAuth } = require("../middleware/auth")

// Todas las rutas requieren autenticación
router.use(requireAuth)

// Rutas de reservas
router.get("/", reservationsController.getReservations)
router.post("/", reservationsController.createReservation)
router.put("/:id/cancel", reservationsController.cancelReservation)
router.get("/check-availability", reservationsController.checkAvailability)

module.exports = router
