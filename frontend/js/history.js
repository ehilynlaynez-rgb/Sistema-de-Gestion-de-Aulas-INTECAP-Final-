// API Base URL
const API_URL = "sistema-de-gestion-de-aulas-intecap-final-production.up.railway.app"

// Verificar autenticación
checkAuth()

// Elementos del DOM
const loadingOverlay = document.getElementById("loadingOverlay")
const historyTable = document.getElementById("historyTable")
const historyCount = document.getElementById("historyCount")
const logoutBtn = document.getElementById("logoutBtn")
const userNameDisplay = document.getElementById("userNameDisplay")
const userRoleDisplay = document.getElementById("userRoleDisplay")
const usersLink = document.getElementById("usersLink")
const exportBtn = document.getElementById("exportBtn")
const applyFiltersBtn = document.getElementById("applyFiltersBtn")
const filterDateStart = document.getElementById("filterDateStart")
const filterDateEnd = document.getElementById("filterDateEnd")
const filterAction = document.getElementById("filterAction")

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

    loadHistory()
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

// Cargar historial
async function loadHistory() {
  try {
    showLoading(true)

    const dateStart = filterDateStart.value
    const dateEnd = filterDateEnd.value
    const action = filterAction.value

    let url = `${API_URL}/history?`
    if (dateStart) url += `fecha_inicio=${dateStart}&`
    if (dateEnd) url += `fecha_fin=${dateEnd}&`
    if (action) url += `action=${action}&`

    const response = await fetch(url, {
      credentials: "include",
    })

    const data = await response.json()

    if (data.success) {
      renderHistory(data.history)
    } else {
      alert("Error al cargar historial")
    }
  } catch (error) {
    console.error("Error:", error)
    alert("Error al cargar historial")
  } finally {
    showLoading(false)
  }
}

// Renderizar historial
function renderHistory(history) {
  historyCount.textContent = history.length

  if (!history || history.length === 0) {
    historyTable.innerHTML = '<tr><td colspan="9" class="text-center">No hay registros en el historial</td></tr>'
    return
  }

  historyTable.innerHTML = history
    .map(
      (record) => `
    <tr>
      <td>${record.id}</td>
      <td>${record.aula}</td>
      <td>${record.instructor}</td>
      <td>${formatDate(record.fecha)}</td>
      <td>${record.hora_inicio} - ${record.hora_fin}</td>
      <td>
        <span class="badge ${getStatusBadgeClass(record.status)}">
          ${record.status}
        </span>
      </td>
      <td>
        <span class="badge ${getActionBadgeClass(record.action)}">
          ${getActionText(record.action)}
        </span>
      </td>
      <td>${record.user_name}</td>
      <td>${formatDateTime(record.created_at)}</td>
    </tr>
  `,
    )
    .join("")
}

// Obtener clase del badge según el estado
function getStatusBadgeClass(status) {
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

// Obtener clase del badge según la acción
function getActionBadgeClass(action) {
  switch (action) {
    case "CREATED":
      return "badge-success"
    case "COMPLETED":
      return "badge-info"
    case "CANCELLED":
      return "badge-danger"
    default:
      return "badge-gray"
  }
}

// Obtener texto de la acción
function getActionText(action) {
  switch (action) {
    case "CREATED":
      return "Creada"
    case "COMPLETED":
      return "Completada"
    case "CANCELLED":
      return "Cancelada"
    default:
      return action
  }
}

// Aplicar filtros
applyFiltersBtn.addEventListener("click", loadHistory)

// Exportar a Excel
exportBtn.addEventListener("click", async () => {
  try {
    showLoading(true)

    const dateStart = filterDateStart.value
    const dateEnd = filterDateEnd.value

    let url = `${API_URL}/history/export?`
    if (dateStart) url += `fecha_inicio=${dateStart}&`
    if (dateEnd) url += `fecha_fin=${dateEnd}&`

    const response = await fetch(url, {
      credentials: "include",
    })

    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `historial_reservas_${Date.now()}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      alert("Archivo descargado exitosamente")
    } else {
      alert("Error al exportar historial")
    }
  } catch (error) {
    console.error("Error:", error)
    alert("Error al exportar historial")
  } finally {
    showLoading(false)
  }
})

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
