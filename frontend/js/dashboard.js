// API Base URL
const API_URL = "http://localhost:3000/api"

// Verificar autenticación al cargar
checkAuth()

// Elementos del DOM
const loadingOverlay = document.getElementById("loadingOverlay")
const statsContainer = document.getElementById("statsContainer")
const topRoomsTable = document.getElementById("topRoomsTable")
const upcomingReservationsTable = document.getElementById("upcomingReservationsTable")
const logsTable = document.getElementById("logsTable")
const logoutBtn = document.getElementById("logoutBtn")
const userNameDisplay = document.getElementById("userNameDisplay")
const userRoleDisplay = document.getElementById("userRoleDisplay")
const usersLink = document.getElementById("usersLink")
const currentDateTime = document.getElementById("currentDateTime")

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

    // Mostrar información del usuario
    userNameDisplay.textContent = data.user.name
    userRoleDisplay.textContent = data.user.role

    // Mostrar enlace de usuarios solo para ADMIN
    if (data.user.role === "ADMIN") {
      usersLink.style.display = "flex"
    }

    // Cargar datos del dashboard
    loadDashboardData()
  } catch (error) {
    console.error("Error al verificar autenticación:", error)
    window.location.href = "/login.html"
  }
}

// Cerrar sesión
logoutBtn.addEventListener("click", async () => {
  try {
    showLoading(true)

    const response = await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    })

    const data = await response.json()

    if (data.success) {
      localStorage.removeItem("user")
      window.location.href = "/login.html"
    }
  } catch (error) {
    console.error("Error al cerrar sesión:", error)
    alert("Error al cerrar sesión")
  } finally {
    showLoading(false)
  }
})

// Cargar datos del dashboard
async function loadDashboardData() {
  try {
    showLoading(true)

    // Cargar estadísticas
    const statsResponse = await fetch(`${API_URL}/dashboard/stats`, {
      credentials: "include",
    })
    const statsData = await statsResponse.json()

    if (statsData.success) {
      renderStats(statsData.statistics)
      renderTopRooms(statsData.statistics.topRooms)
    }

    // Cargar próximas reservas
    const reservationsResponse = await fetch(`${API_URL}/reservations?status=Activa`, {
      credentials: "include",
    })
    const reservationsData = await reservationsResponse.json()

    if (reservationsData.success) {
      renderUpcomingReservations(reservationsData.reservations)
    }

    // Cargar logs
    const logsResponse = await fetch(`${API_URL}/dashboard/logs?limit=10`, {
      credentials: "include",
    })
    const logsData = await logsResponse.json()

    if (logsData.success) {
      renderLogs(logsData.logs)
    }
  } catch (error) {
    console.error("Error al cargar datos:", error)
    alert("Error al cargar datos del dashboard")
  } finally {
    showLoading(false)
  }
}

// Renderizar estadísticas
function renderStats(stats) {
  statsContainer.innerHTML = `
    <div class="stat-card">
      <div class="stat-icon primary">🏫</div>
      <div class="stat-info">
        <h3>${stats.totalRooms}</h3>
        <p>Total de Aulas</p>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon success">✓</div>
      <div class="stat-info">
        <h3>${stats.freeRooms}</h3>
        <p>Aulas Libres</p>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon danger">⚠</div>
      <div class="stat-info">
        <h3>${stats.occupiedRooms}</h3>
        <p>Aulas Ocupadas</p>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon primary">📅</div>
      <div class="stat-info">
        <h3>${stats.activeReservations}</h3>
        <p>Reservas Activas</p>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon warning">📆</div>
      <div class="stat-info">
        <h3>${stats.todayReservations}</h3>
        <p>Reservas Hoy</p>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon danger">🔧</div>
      <div class="stat-info">
        <h3>${stats.damagedResources}</h3>
        <p>Recursos Dañados</p>
      </div>
    </div>
  `
}

// Renderizar aulas más reservadas
function renderTopRooms(topRooms) {
  if (!topRooms || topRooms.length === 0) {
    topRoomsTable.innerHTML = '<tr><td colspan="3" class="text-center">No hay datos</td></tr>'
    return
  }

  topRoomsTable.innerHTML = topRooms
    .map(
      (room) => `
    <tr>
      <td>${room.nombre}</td>
      <td>${room.modulo}</td>
      <td><span class="badge badge-info">${room.total_reservas}</span></td>
    </tr>
  `,
    )
    .join("")
}

// Renderizar próximas reservas
function renderUpcomingReservations(reservations) {
  if (!reservations || reservations.length === 0) {
    upcomingReservationsTable.innerHTML = '<tr><td colspan="3" class="text-center">No hay reservas próximas</td></tr>'
    return
  }

  const upcoming = reservations
    .filter((r) => new Date(r.fecha) >= new Date())
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    .slice(0, 5)

  upcomingReservationsTable.innerHTML = upcoming
    .map(
      (reservation) => `
    <tr>
      <td>${reservation.aula}</td>
      <td>${formatDate(reservation.fecha)}</td>
      <td>${reservation.hora_inicio}</td>
    </tr>
  `,
    )
    .join("")
}

// Renderizar logs
function renderLogs(logs) {
  if (!logs || logs.length === 0) {
    logsTable.innerHTML = '<tr><td colspan="4" class="text-center">No hay registros</td></tr>'
    return
  }

  logsTable.innerHTML = logs
    .map(
      (log) => `
    <tr>
      <td>${formatDateTime(log.created_at)}</td>
      <td>${log.user_name || "Sistema"}</td>
      <td><span class="badge badge-gray">${log.action}</span></td>
      <td>${log.details || "-"}</td>
    </tr>
  `,
    )
    .join("")
}

// Actualizar fecha y hora
function updateDateTime() {
  const now = new Date()
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }
  currentDateTime.textContent = now.toLocaleDateString("es-ES", options)
}

updateDateTime()
setInterval(updateDateTime, 60000) // Actualizar cada minuto

// Funciones auxiliares
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("es-ES")
}

function formatDateTime(dateTimeString) {
  const date = new Date(dateTimeString)
  return date.toLocaleString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function showLoading(show) {
  loadingOverlay.classList.toggle("active", show)
}

// Recargar datos cada 30 segundos
setInterval(loadDashboardData, 30000)
