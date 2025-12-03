// API Base URL
const API_URL = "http://localhost:3000/api"

let currentUserRole = ""

// Verificar autenticación
checkAuth()

// Elementos del DOM
const loadingOverlay = document.getElementById("loadingOverlay")
const resourcesTable = document.getElementById("resourcesTable")
const logoutBtn = document.getElementById("logoutBtn")
const userNameDisplay = document.getElementById("userNameDisplay")
const userRoleDisplay = document.getElementById("userRoleDisplay")
const usersLink = document.getElementById("usersLink")
const openNewResourceBtn = document.getElementById("openNewResourceBtn")
const newResourceModal = document.getElementById("newResourceModal")
const closeModalBtn = document.getElementById("closeModalBtn")
const cancelModalBtn = document.getElementById("cancelModalBtn")
const newResourceForm = document.getElementById("newResourceForm")
const submitResourceBtn = document.getElementById("submitResourceBtn")
const applyFiltersBtn = document.getElementById("applyFiltersBtn")
const filterAula = document.getElementById("filterAula")
const filterTipo = document.getElementById("filterTipo")
const filterEstado = document.getElementById("filterEstado")
const resultsSection = document.getElementById("resultsSection")
const resultsCount = document.getElementById("resultsCount")

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
    currentUserRole = data.user.role

    if (data.user.role === "ADMIN") {
      usersLink.style.display = "flex"
      openNewResourceBtn.style.display = "block"
    }

    loadRoomsForFilter()
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

// Cargar aulas para filtro
async function loadRoomsForFilter() {
  try {
    const response = await fetch(`${API_URL}/rooms`, {
      credentials: "include",
    })

    const data = await response.json()

    if (data.success) {
      filterAula.innerHTML =
        '<option value="">Todas las aulas</option>' +
        data.rooms
          .map(
            (room) => `
          <option value="${room.id}">${room.nombre} - ${room.modulo}</option>
        `,
          )
          .join("")
    }
  } catch (error) {
    console.error("Error:", error)
  }
}

// Buscar recursos
applyFiltersBtn.addEventListener("click", async () => {
  try {
    showLoading(true)

    const aulaId = filterAula.value
    const tipo = filterTipo.value.trim()
    const estado = filterEstado.value

    let url = `${API_URL}/resources?`
    if (aulaId) url += `aula_id=${aulaId}&`
    if (tipo) url += `tipo=${tipo}&`
    if (estado) url += `estado=${estado}&`

    const response = await fetch(url, {
      credentials: "include",
    })

    const data = await response.json()

    if (data.success) {
      resultsSection.classList.remove("hidden")
      renderResources(data.resources)
    } else {
      alert("Error al cargar recursos")
    }
  } catch (error) {
    console.error("Error:", error)
    alert("Error al cargar recursos")
  } finally {
    showLoading(false)
  }
})

// Renderizar recursos
function renderResources(resources) {
  resultsCount.textContent = resources.length

  if (!resources || resources.length === 0) {
    resourcesTable.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron recursos</td></tr>'
    return
  }

  resourcesTable.innerHTML = resources
    .map(
      (resource) => `
    <tr>
      <td>${resource.id}</td>
      <td>${resource.aula_nombre}</td>
      <td>${resource.modulo}</td>
      <td>${resource.tipo}</td>
      <td>${resource.codigo}</td>
      <td>
        <span class="badge ${getStateBadgeClass(resource.estado)}">
          ${resource.estado}
        </span>
      </td>
      <td>
        ${
          currentUserRole === "ADMIN"
            ? `
          ${
            resource.estado === "Dañado"
              ? `
            <button class="btn btn-success btn-sm" onclick="markAsRepaired(${resource.id})">
              Reparado
            </button>
          `
              : ""
          }
          ${
            resource.estado === "Activo"
              ? `
            <button class="btn btn-warning btn-sm" onclick="markAsDamaged(${resource.id})">
              Dañado
            </button>
          `
              : ""
          }
          <button class="btn btn-danger btn-sm" onclick="deleteResource(${resource.id})">
            Eliminar
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
function getStateBadgeClass(estado) {
  switch (estado) {
    case "Activo":
      return "badge-success"
    case "Dañado":
      return "badge-danger"
    case "Reparado":
      return "badge-info"
    default:
      return "badge-gray"
  }
}

// Marcar como reparado
async function markAsRepaired(resourceId) {
  if (!confirm("¿Marcar este recurso como reparado?")) {
    return
  }

  await updateResourceStatus(resourceId, "Reparado")
}

// Marcar como dañado
async function markAsDamaged(resourceId) {
  if (!confirm("¿Marcar este recurso como dañado?")) {
    return
  }

  await updateResourceStatus(resourceId, "Dañado")
}

// Actualizar estado del recurso
async function updateResourceStatus(resourceId, estado) {
  try {
    showLoading(true)

    const response = await fetch(`${API_URL}/resources/${resourceId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ estado }),
    })

    const data = await response.json()

    if (data.success) {
      alert("Estado actualizado exitosamente")
      applyFiltersBtn.click() // Recargar resultados
    } else {
      alert(data.message || "Error al actualizar estado")
    }
  } catch (error) {
    console.error("Error:", error)
    alert("Error al actualizar estado")
  } finally {
    showLoading(false)
  }
}

// Eliminar recurso
async function deleteResource(resourceId) {
  if (!confirm("¿Está seguro que desea eliminar este recurso?")) {
    return
  }

  try {
    showLoading(true)

    const response = await fetch(`${API_URL}/resources/${resourceId}`, {
      method: "DELETE",
      credentials: "include",
    })

    const data = await response.json()

    if (data.success) {
      alert("Recurso eliminado exitosamente")
      applyFiltersBtn.click() // Recargar resultados
    } else {
      alert(data.message || "Error al eliminar recurso")
    }
  } catch (error) {
    console.error("Error:", error)
    alert("Error al eliminar recurso")
  } finally {
    showLoading(false)
  }
}

// Abrir modal de nuevo recurso
openNewResourceBtn.addEventListener("click", async () => {
  await loadRoomsForModal()
  newResourceModal.classList.add("active")
})

// Cargar aulas para el modal
async function loadRoomsForModal() {
  try {
    const response = await fetch(`${API_URL}/rooms`, {
      credentials: "include",
    })

    const data = await response.json()

    if (data.success) {
      const aulaSelect = document.getElementById("aula_id")
      aulaSelect.innerHTML =
        '<option value="">Seleccione un aula</option>' +
        data.rooms
          .map(
            (room) => `
          <option value="${room.id}">${room.nombre} - ${room.modulo}</option>
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
  newResourceModal.classList.remove("active")
  newResourceForm.reset()
})

cancelModalBtn.addEventListener("click", () => {
  newResourceModal.classList.remove("active")
  newResourceForm.reset()
})

// Crear recurso
submitResourceBtn.addEventListener("click", async () => {
  const aula_id = document.getElementById("aula_id").value
  const tipo = document.getElementById("tipo").value.trim()
  const codigo = document.getElementById("codigo").value.trim()
  const estado = document.getElementById("estado").value

  if (!aula_id || !tipo || !codigo) {
    alert("Por favor complete todos los campos obligatorios")
    return
  }

  try {
    showLoading(true)

    const response = await fetch(`${API_URL}/resources`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        aula_id,
        tipo,
        codigo,
        estado,
      }),
    })

    const data = await response.json()

    if (data.success) {
      alert("Recurso creado exitosamente")
      newResourceModal.classList.remove("active")
      newResourceForm.reset()
      applyFiltersBtn.click() // Recargar resultados
    } else {
      alert(data.message || "Error al crear recurso")
    }
  } catch (error) {
    console.error("Error:", error)
    alert("Error al crear recurso")
  } finally {
    showLoading(false)
  }
})

function showLoading(show) {
  loadingOverlay.classList.toggle("active", show)
}
