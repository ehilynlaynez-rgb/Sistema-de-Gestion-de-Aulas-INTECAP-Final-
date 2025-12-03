const twilio = require("twilio")
require("dotenv").config()

// Configurar cliente de Twilio
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

// Enviar mensaje de WhatsApp al grupo de la clase
async function sendWhatsAppNotification(reservationData, groupWhatsApp) {
  try {
    const { instructor, aula, fecha, hora_inicio, hora_fin, modulo } = reservationData

    const message = `
🔔 *NUEVA RESERVA DE AULA*

📍 *Aula:* ${aula}
📅 *Fecha:* ${fecha}
⏰ *Horario:* ${hora_inicio} - ${hora_fin}
🏫 *Ubicación:* ${modulo}
👨‍🏫 *Instructor:* ${instructor}

Por favor estar puntuales.
    `.trim()

    // Formatear número de WhatsApp (debe incluir código de país)
    const to = groupWhatsApp.startsWith("whatsapp:") ? groupWhatsApp : `whatsapp:${groupWhatsApp}`

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: to,
    })

    console.log("✅ WhatsApp enviado:", result.sid)
    return { success: true, messageSid: result.sid }
  } catch (error) {
    console.error("❌ Error al enviar WhatsApp:", error)
    throw error
  }
}

module.exports = { sendWhatsAppNotification }
