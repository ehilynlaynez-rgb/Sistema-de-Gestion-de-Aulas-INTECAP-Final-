// API Base URL
const API_URL = "sistema-de-gestion-de-aulas-intecap-final-production.up.railway.app"

// Verificar autenticación
checkAuth()

// Elementos del DOM
const loadingOverlay = document.getElementById("loadingOverlay")
const usersTable = document.getElementById("usersTable")
const logoutBtn = document.getElementById("logoutBtn")
const userNameDisplay = document.getElementById("userNameDisplay")
const userRoleDisplay = document.getElementById("userRoleDisplay")
const openNewUserBtn = document.getElementById("openNewUserBtn")
const userModal = document.getElementById("userModal")
const modalTitle = document.getElementById("modalTitle")
const closeModalBtn = document.getElementById("closeModalBtn")
const cancelModalBtn = document.getElementById("cancelModalBtn")
const userForm = document.getElementById("userForm")
const submitUserBtn = document.getElementById("submitUserBtn")
const passwordGroup = document.getElementById("passwordGroup")
const activeGroup = document.getElementById("activeGroup")

let isEditMode = false

// Verificar autenticación y permisos
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

    // Verificar que sea ADMIN
    if (data.user.role !== "ADMIN") {
      alert("Acceso denegado. Solo administradores.")
      window.location.href = "/dashboard.html"
      return
    }

    userNameDisplay.textContent = data.user.name
    userRoleDisplay.textContent = data.user.role

    loadUsers()
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

// Cargar usuarios
async function loadUsers() {
  try {
    showLoading(true)

    const response = await fetch(`${API_URL}/users`, {
      credentials: "include",
    })

    const data = await response.json()

    if (data.success) {
      renderUsers(data.users)
    } else {
      alert("Error al cargar usuarios")
    }
  } catch (error) {
    console.error("Error:", error)
    alert("Error al cargar usuarios")
  } finally {
    showLoading(false)
  }
}

// Renderizar usuarios
function renderUsers(users) {
  if (!users || users.length === 0) {
    usersTable.innerHTML = '<tr><td colspan="7" class="text-center">No hay usuarios registrados</td></tr>'
    return
  }

  usersTable.innerHTML = users
    .map(
      (user) => `
    <tr>
      <td>${user.id}</td>
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td>
        <span class="badge ${user.role === "ADMIN" ? "badge-danger" : "badge-info"}">
          ${user.role}
        </span>
      </td>
      <td>
        <span class="badge ${user.active ? "badge-success" : "badge-gray"}">
          ${user.active ? "Activo" : "Inactivo"}
        </span>
      </td>
      <td>${formatDate(user.created_at)}</td>
      <td>
        <button class="btn btn-primary btn-sm" onclick="editUser(${user.id}, '${user.name}', '${user.email}', '${user.role}', ${user.active})">
          Editar
        </button>
        <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id})">
          Eliminar
        </button>
      </td>
    </tr>
  `,
    )
    .join("")
}

// Abrir modal para nuevo usuario
openNewUserBtn.addEventListener("click", () => {
  isEditMode = false
  modalTitle.textContent = "Nuevo Usuario"
  userForm.reset()
  passwordGroup.style.display = "block"
  document.getElementById("password").required = true
  activeGroup.style.display = "none"
  userModal.classList.add("active")
})

// Editar usuario
function editUser(id, name, email, role, active) {
  isEditMode = true
  modalTitle.textContent = "Editar Usuario"
  document.getElementById("userId").value = id
  document.getElementById("name").value = name
  document.getElementById("email").value = email
  document.getElementById("role").value = role
  document.getElementById("active").checked = active
  passwordGroup.style.display = "none"
  document.getElementById("password").required = false
  activeGroup.style.display = "block"
  userModal.classList.add("active")
}

// Cerrar modal
closeModalBtn.addEventListener("click", () => {
  userModal.classList.remove("active")
  userForm.reset()
})

cancelModalBtn.addEventListener("click", () => {
  userModal.classList.remove("active")
  userForm.reset()
})

// Guardar usuario (crear o actualizar)
submitUserBtn.addEventListener("click", async () => {
  const name = document.getElementById("name").value.trim()
  const email = document.getElementById("email").value.trim()
  const password = document.getElementById("password").value
  const role = document.getElementById("role").value
  const active = document.getElementById("active").checked

  if (!name || !email || !role) {
    alert("Por favor complete todos los campos obligatorios")
    return
  }

  if (!isEditMode && !password) {
    alert("La contraseña es obligatoria para nuevos usuarios")
    return
  }

  try {
    showLoading(true)

    let url, method, body

    if (isEditMode) {
      // Actualizar usuario
      const userId = document.getElementById("userId").value
      url = `${API_URL}/users/${userId}`
      method = "PUT"
      body = JSON.stringify({ name, email, role, active })
    } else {
      // Crear usuario
      url = `${API_URL}/users`
      method = "POST"
      body = JSON.stringify({ name, email, password, role })
    }

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body,
    })

    const data = await response.json()

    if (data.success) {
      alert(isEditMode ? "Usuario actualizado exitosamente" : "Usuario creado exitosamente")
      userModal.classList.remove("active")
      userForm.reset()
      loadUsers()
    } else {
      alert(data.message || "Error al guardar usuario")
    }
  } catch (error) {
    console.error("Error:", error)
    alert("Error al guardar usuario")
  } finally {
    showLoading(false)
  }
})

// Eliminar usuario
async function deleteUser(userId) {
  if (!confirm("¿Está seguro que desea eliminar este usuario? Esta acción lo desactivará.")) {
    return
  }

  try {
    showLoading(true)

    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: "DELETE",
      credentials: "include",
    })

    const data = await response.json()

    if (data.success) {
      alert("Usuario desactivado exitosamente")
      loadUsers()
    } else {
      alert(data.message || "Error al eliminar usuario")
    }
  } catch (error) {
    console.error("Error:", error)
    alert("Error al eliminar usuario")
  } finally {
    showLoading(false)
  }
}

// Funciones auxiliares
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

function showLoading(show) {
  loadingOverlay.classList.toggle("active", show)
}
