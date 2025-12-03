const express = require("express")
const router = express.Router()
const usersController = require("../controllers/usersController")
const { requireAuth, requireAdmin } = require("../middleware/auth")

// Todas las rutas requieren autenticación
router.use(requireAuth)

// Rutas de usuarios (solo ADMIN)
router.get("/", requireAdmin, usersController.getUsers)
router.post("/", requireAdmin, usersController.createUser)
router.put("/:id", requireAdmin, usersController.updateUser)
router.delete("/:id", requireAdmin, usersController.deleteUser)

module.exports = router
