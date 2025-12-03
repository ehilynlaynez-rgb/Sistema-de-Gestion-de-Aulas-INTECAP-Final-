const express = require("express")
const router = express.Router()
const resourcesController = require("../controllers/resourcesController")
const { requireAuth, requireAdmin } = require("../middleware/auth")

// Todas las rutas requieren autenticación
router.use(requireAuth)

// Rutas de recursos
router.get("/", resourcesController.getResources)
router.post("/", requireAdmin, resourcesController.createResource)
router.put("/:id/status", requireAdmin, resourcesController.updateResourceStatus)
router.delete("/:id", requireAdmin, resourcesController.deleteResource)

module.exports = router
