// API Base URL
const API_URL = "http://localhost:3000/api"

// Verificar autenticación
checkAuth()

// Elementos del DOM
const loadingOverlay = document.getElementById("loadingOverlay")
const reservationsTable = document.getElementById("reservationsTable")
const logoutBtn = document.getElementById("logoutBtn")
const userNameDisplay = document.getElementById("userNameDisplay")
const userRoleDisplay = document.getElementById("userRoleDisplay")
const usersLink = document.getElementById("usersLink")
const openNewReservationBtn = document.getElementById("openNewReservationBtn")
const newReservationModal = document.getElementById("newReservationModal")
const closeModalBtn = document.getElementById("closeModalBtn")
const cancelModalBtn = document.getElementById("cancelModalBtn")
const newReservationForm = document.getElementById("newReservationForm")
const submitReservationBtn = document.getElementById("submitReservationBtn")
const filterStatus = document.getElementById("filterStatus")
const filterDate = document.getElementById("filterDate")
const applyFiltersBtn = document.getElementById("applyFiltersBtn")

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

    loadReservations()
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

// Cargar reservas
async function loadReservations() {
  try {
    showLoading(true)

    const status = filterStatus.value
    const fecha = filterDate.value

    let url = `${API_URL}/reservations?`
    if (status) url += `status=${status}&`
    if (fecha) url += `fecha=${fecha}&`

    const response = await fetch(url, {
      credentials: "include",
    })

    const data = await response.json()

    if (data.success) {
      renderReservations(data.reservations)
    } else {
      alert("Error al cargar reservas")
    }
  } catch (error) {
    console.error("Error:", error)
    alert("Error al cargar reservas")
  } finally {
    showLoading(false)
  }
}

// Renderizar reservas
function renderReservations(reservations) {
  if (!reservations || reservations.length === 0) {
    reservationsTable.innerHTML = '<tr><td colspan="8" class="text-center">No hay reservas</td></tr>'
    return
  }

  reservationsTable.innerHTML = reservations
    .map(
      (reservation) => `
    <tr>
      <td>${reservation.id}</td>
      <td>${reservation.aula}</td>
      <td>${reservation.instructor}</td>
      <td>${formatDate(reservation.fecha)}</td>
      <td>${reservation.hora_inicio}</td>
      <td>${reservation.hora_fin}</td>
      <td>
        <span class="badge ${getBadgeClass(reservation.status)}">
          ${reservation.status}
        </span>
      </td>
      <td>
        ${
          reservation.status === "Activa"
            ? `
          <button class="btn btn-danger btn-sm" onclick="cancelReservation(${reservation.id})">
            Cancelar
          </button>
        `
            : "-"
        }
      </td>
    </tr>
  `,
    )
    .join("")
}

// Obtener clase del badge según el estado
function getBadgeClass(status) {
  switch (status) {
    case "Activa":
      return "badge-success"
    case "Completada":
      return "badge-info"
    case "Cancelada":
      return "badge-danger"
    default:
      return "badge-gray"
  }
}

// Abrir modal de nueva reserva
openNewReservationBtn.addEventListener("click", async () => {
  // Cargar aulas disponibles
  await loadRooms()

  // Configurar fecha mínima (hoy) y máxima (7 días)
  const today = new Date()
  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + 7)

  document.getElementById("fecha").min = today.toISOString().split("T")[0]
  document.getElementById("fecha").max = maxDate.toISOString().split("T")[0]

  newReservationModal.classList.add("active")
})

// Cargar aulas para el select
async function loadRooms() {
  try {
    const response = await fetch(`${API_URL}/rooms`, {
      credentials: "include",
    })

    const data = await response.json()

    if (data.success) {
      const roomSelect = document.getElementById("room_id")
      roomSelect.innerHTML =
        '<option value="">Seleccione un aula</option>' +
        data.rooms
          .map(
            (room) => `
          <option value="${room.id}">${room.nombre} - ${room.modulo} (${room.estado})</option>
        `,
          )
          .join("")
    }
  } catch (error) {
    console.error("Error:", error)
  }
}

// Cerrar modal
closeModalBtn.addEventListener("click", () => {
  newReservationModal.classList.remove("active")
  newReservationForm.reset()
})

cancelModalBtn.addEventListener("click", () => {
  newReservationModal.classList.remove("active")
  newReservationForm.reset()
})

// Crear reserva
submitReservationBtn.addEventListener("click", async () => {
  const room_id = document.getElementById("room_id").value
  const instructor = document.getElementById("instructor").value.trim()
  const fecha = document.getElementById("fecha").value
  const hora_inicio = document.getElementById("hora_inicio").value
  const hora_fin = document.getElementById("hora_fin").value
  const grupo_whatsapp = document.getElementById("grupo_whatsapp").value.trim()

  if (!room_id || !instructor || !fecha || !hora_inicio || !hora_fin) {
    alert("Por favor complete todos los campos obligatorios")
    return
  }

  // Validar que hora_fin sea mayor que hora_inicio
  if (hora_fin <= hora_inicio) {
    alert("La hora de fin debe ser mayor que la hora de inicio")
    return
  }

  try {
    showLoading(true)

    const response = await fetch(`${API_URL}/reservations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        room_id,
        instructor,
        fecha,
        hora_inicio,
        hora_fin,
        grupo_whatsapp,
      }),
    })

    const data = await response.json()

    if (data.success) {
      alert("Reserva creada exitosamente. Se han enviado las notificaciones.")
      newReservationModal.classList.remove("active")
      newReservationForm.reset()
      loadReservations()
    } else {
      alert(data.message || "Error al crear reserva")
    }
  } catch (error) {
    console.error("Error:", error)
    alert("Error al crear reserva")
  } finally {
    showLoading(false)
  }
})

// Cancelar reserva
async function cancelReservation(reservationId) {
  if (!confirm("¿Está seguro que desea cancelar esta reserva?")) {
    return
  }

  try {
    showLoading(true)

    const response = await fetch(`${API_URL}/reservations/${reservationId}/cancel`, {
      method: "PUT",
      credentials: "include",
    })

    const data = await response.json()

    if (data.success) {
      alert("Reserva cancelada exitosamente")
      loadReservations()
    } else {
      alert(data.message || "Error al cancelar reserva")
    }
  } catch (error) {
    console.error("Error:", error)
    alert("Error al cancelar reserva")
  } finally {
    showLoading(false)
  }
}

// Aplicar filtros
applyFiltersBtn.addEventListener("click", loadReservations)

// Funciones auxiliares
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("es-ES")
}

function showLoading(show) {
  loadingOverlay.classList.toggle("active", show)
}

// Recargar reservas cada 30 segundos
setInterval(loadReservations, 30000)
