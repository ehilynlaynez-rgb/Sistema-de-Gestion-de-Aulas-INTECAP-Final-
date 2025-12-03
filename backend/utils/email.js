const nodemailer = require("nodemailer")
require("dotenv").config()

// Configurar transporte de correo (Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

// Enviar correo de confirmación de reserva
async function sendReservationEmail(reservationData, instructorEmail, adminEmail) {
  try {
    const { instructor, aula, fecha, hora_inicio, hora_fin } = reservationData

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: instructorEmail,
      cc: adminEmail, // Copia al admin
      subject: `Confirmación de Reserva - ${aula}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
            .info-label { font-weight: bold; color: #475569; }
            .info-value { color: #1e293b; }
            .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Reserva Confirmada</h1>
            </div>
            <div class="content">
              <p>Estimado/a <strong>${instructor}</strong>,</p>
              <p>Su reserva ha sido registrada exitosamente en el sistema.</p>
              
              <div class="info-box">
                <h3 style="margin-top: 0; color: #1e293b;">Detalles de la Reserva</h3>
                <div class="info-row">
                  <span class="info-label">Aula:</span>
                  <span class="info-value">${aula}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Fecha:</span>
                  <span class="info-value">${fecha}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Hora de Inicio:</span>
                  <span class="info-value">${hora_inicio}</span>
                </div>
                <div class="info-row" style="border-bottom: none;">
                  <span class="info-label">Hora de Fin:</span>
                  <span class="info-value">${hora_fin}</span>
                </div>
              </div>

              <p><strong>Importante:</strong> Por favor llegue puntualmente al aula.</p>
              
              <div class="footer">
                <p>Sistema de Gestión de Aulas</p>
                <p>Este es un correo automático, por favor no responder.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("✅ Correo enviado:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("❌ Error al enviar correo:", error)
    throw error
  }
}

module.exports = { sendReservationEmail }
