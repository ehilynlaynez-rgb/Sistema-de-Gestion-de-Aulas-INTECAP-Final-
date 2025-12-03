const express = require("express")
const router = express.Router()
const authController = require("../controllers/authController")
const { requireAuth } = require("../middleware/auth")

// Rutas de autenticación
router.post("/login", authController.login)
router.post("/logout", requireAuth, authController.logout)
router.get("/session", authController.checkSession)

module.exports = router
