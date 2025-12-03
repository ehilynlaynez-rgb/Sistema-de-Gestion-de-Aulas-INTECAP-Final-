const QRCode = require("qrcode")
const path = require("path")
const fs = require("fs")

// Generar código QR para un aula
async function generateRoomQR(roomId, roomName) {
  try {
    const qrDir = path.join(__dirname, "../../frontend/qr")

    // Crear directorio si no existe
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true })
    }

    // URL que apunta a la vista del aula
    const url = `${process.env.FRONTEND_URL || "http://localhost:8080"}/rooms.html?id=${roomId}`

    // Generar QR
    const qrPath = path.join(qrDir, `room_${roomId}.png`)
    await QRCode.toFile(qrPath, url, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })

    return `/qr/room_${roomId}.png`
  } catch (error) {
    console.error("Error al generar QR:", error)
    throw error
  }
}

module.exports = { generateRoomQR }
