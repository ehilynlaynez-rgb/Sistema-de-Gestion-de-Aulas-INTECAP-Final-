// API Base URL
const API_URL = "sistema-de-gestion-de-aulas-intecap-final-production.up.railway.app"

// Verificar autenticación
checkAuth()

// Elementos del DOM
const loadingOverlay = document.getElementById("loadingOverlay")
const roomsContainer = document.getElementById("roomsContainer")
const logoutBtn = document.getElementById("logoutBtn")
const userNameDisplay = document.getElementById("userNameDisplay")
const userRoleDisplay = document.getElementById("userRoleDisplay")
const usersLink = document.getElementById("usersLink")
const qrModal = document.getElementById("qrModal")
const qrCodeContainer = document.getElementById("qrCodeContainer")
const closeQrModal = document.getElementById("closeQrModal")
const closeQrModalBtn = document.getElementById("closeQrModalBtn")

// Verificar autenticación
async function checkAuth() {
  try {
    const response = await fetch(`${API_URL}/auth/session`, {
      credentials: "include",
    })

    const data = await response.json()

    if (!data.authenticated) {
      window.location.href = "/login.html"
      return
    }

    userNameDisplay.textContent = data.user.name
    userRoleDisplay.textContent = data.user.role

    if (data.user.role === "ADMIN") {
      usersLink.style.display = "flex"
    }

    loadRooms()
  } catch (error) {
    console.error("Error:", error)
    window.location.href = "/login.html"
  }
}

// Cerrar sesión
logoutBtn.addEventListener("click", async () => {
  try {
    showLoading(true)
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    })
    window.location.href = "/login.html"
  } catch (error) {
    console.error("Error:", error)
  }
})

// Cargar aulas
async function loadRooms() {
  try {
    showLoading(true)

    const response = await fetch(`${API_URL}/rooms`, {
      credentials: "include",
    })

    const data = await response.json()

    if (data.success) {
      renderRooms(data.rooms)
    } else {
      alert("Error al cargar aulas")
    }
  } catch (error) {
    console.error("Error:", error)
    alert("Error al cargar aulas")
  } finally {
    showLoading(false)
  }
}

// Renderizar aulas
function renderRooms(rooms) {
  if (!rooms || rooms.length === 0) {
    roomsContainer.innerHTML = '<p class="text-center">No hay aulas disponibles</p>'
    return
  }

  roomsContainer.innerHTML = rooms
    .map(
      (room) => `
    <div class="room-card ${room.estado === "Libre" ? "free" : "occupied"}">
      <div class="room-card-header">
        <h3 class="room-card-title">${room.nombre}</h3>
        <span class="badge ${room.estado === "Libre" ? "badge-success" : "badge-danger"}">
          ${room.estado}
        </span>
      </div>

      <div class="room-card-body">
        <div class="room-info">
          <div class="room-info-item">
            <strong>Módulo:</strong> ${room.modulo}
          </div>
          ${
            room.ocupado_por
              ? `
            <div class="room-info-item">
              <strong>Ocupado por:</strong> ${room.ocupado_por}
            </div>
          `
              : ""
          }
          <div class="room-info-item">
            <strong>Total Reservas:</strong> ${room.total_reservas || 0}
          </div>
          <div class="room-info-item">
            <strong>Reservas Activas:</strong> ${room.reservas_activas || 0}
          </div>
        </div>
      </div>

      <div class="room-card-footer">
        <button class="btn btn-primary btn-sm" onclick="viewRoomDetails(${room.id})">
          Ver Detalles
        </button>
        <button class="btn btn-secondary btn-sm" onclick="generateQR(${room.id}, '${room.nombre}')">
          Ver QR
        </button>
      </div>
    </div>
  `,
    )
    .join("")
}

// Ver detalles del aula
async function viewRoomDetails(roomId) {
  try {
    showLoading(true)

    const response = await fetch(`${API_URL}/rooms/${roomId}`, {
      credentials: "include",
    })

    const data = await response.json()

    if (data.success) {
      const room = data.room
      const reservations = data.reservations

      let reservationsHTML = ""
      if (reservations && reservations.length > 0) {
        reservationsHTML = reservations
          .map(
            (r) => `
          <li>${formatDate(r.fecha)} - ${r.hora_inicio} a ${r.hora_fin} (${r.instructor})</li>
        `,
          )
          .join("")
      } else {
        reservationsHTML = "<li>No hay reservas activas</li>"
      }

      alert(`
        Detalles del Aula:
        
        Nombre: ${room.nombre}
        Módulo: ${room.modulo}
        Estado: ${room.estado}
        ${room.ocupado_por ? `Ocupado por: ${room.ocupado_por}` : ""}
        Total de Reservas: ${room.total_reservas}
        
        Reservas Activas:
        ${reservations.map((r) => `- ${formatDate(r.fecha)} ${r.hora_inicio}-${r.hora_fin} (${r.instructor})`).join("\n")}
      `)
    }
  } catch (error) {
    console.error("Error:", error)
    alert("Error al cargar detalles del aula")
  } finally {
    showLoading(false)
  }
}

// Generar y mostrar código QR
async function generateQR(roomId, roomName) {
  try {
    showLoading(true)

    // Generar QR
    const response = await fetch(`${API_URL}/rooms/${roomId}/qr`, {
      method: "POST",
      credentials: "include",
    })

    const data = await response.json()

    if (data.success) {
      // Mostrar QR en modal
      qrCodeContainer.innerHTML = `
        <h4>${roomName}</h4>
        <img src="${data.qrUrl}" alt="QR Code ${roomName}">
        <p class="mt-2">Escanea este código para acceder al aula</p>
      `
      qrModal.classList.add("active")
    } else {
      alert("Error al generar código QR")
    }
  } catch (error) {
    console.error("Error:", error)
    alert("Error al generar código QR")
  } finally {
    showLoading(false)
  }
}

// Cerrar modal QR
closeQrModal.addEventListener("click", () => {
  qrModal.classList.remove("active")
})

closeQrModalBtn.addEventListener("click", () => {
  qrModal.classList.remove("active")
})

// Cerrar modal al hacer click fuera
qrModal.addEventListener("click", (e) => {
  if (e.target === qrModal) {
    qrModal.classList.remove("active")
  }
})

// Funciones auxiliares
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("es-ES")
}

function showLoading(show) {
  loadingOverlay.classList.toggle("active", show)
}

// Recargar aulas cada 30 segundos
setInterval(loadRooms, 30000)
