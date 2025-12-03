// API Base URL
const API_URL = "sistema-de-gestion-de-aulas-intecap-final-production.up.railway.app"

// Elementos del DOM
const loginForm = document.getElementById("loginForm")
const loginBtn = document.getElementById("loginBtn")
const alertContainer = document.getElementById("alertContainer")
const loadingOverlay = document.getElementById("loadingOverlay")

// Verificar si ya hay sesión activa
checkExistingSession()

async function checkExistingSession() {
  try {
    const response = await fetch(`${API_URL}/auth/session`, {
      credentials: "include",
    })

    const data = await response.json()

    if (data.authenticated) {
      // Redirigir al dashboard si ya está autenticado
      window.location.href = "/dashboard.html"
    }
  } catch (error) {
    console.error("Error al verificar sesión:", error)
  }
}

// Manejar envío del formulario
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault()

  const email = document.getElementById("email").value.trim()
  const password = document.getElementById("password").value

  if (!email || !password) {
    showAlert("Por favor complete todos los campos", "danger")
    return
  }

  try {
    showLoading(true)
    loginBtn.disabled = true

    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (data.success) {
      showAlert("Inicio de sesión exitoso. Redirigiendo...", "success")

      // Guardar datos del usuario en localStorage
      localStorage.setItem("user", JSON.stringify(data.user))

      // Redirigir al dashboard después de 1 segundo
      setTimeout(() => {
        window.location.href = "/dashboard.html"
      }, 1000)
    } else {
      showAlert(data.message || "Error al iniciar sesión", "danger")
      loginBtn.disabled = false
    }
  } catch (error) {
    console.error("Error:", error)
    showAlert("Error de conexión. Por favor intente nuevamente.", "danger")
    loginBtn.disabled = false
  } finally {
    showLoading(false)
  }
})

// Función para mostrar alertas
function showAlert(message, type = "info") {
  alertContainer.innerHTML = `
    <div class="alert alert-${type}">
      ${message}
    </div>
  `

  // Ocultar alerta después de 5 segundos
  setTimeout(() => {
    alertContainer.innerHTML = ""
  }, 5000)
}

// Función para mostrar/ocultar loading
function showLoading(show) {
  loadingOverlay.classList.toggle("active", show)
}
