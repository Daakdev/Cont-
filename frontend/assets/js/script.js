/* ══════════════════════════════════════════
   CONFIGURACIÓN
══════════════════════════════════════════ */
const API_URL = "https://cont-backend.onrender.com";

/* ══════════════════════════════════════════
   TOGGLE UI: LOGIN ↔ REGISTER
══════════════════════════════════════════ */
function showRegister() {
  const c = document.getElementById("container");
  c.classList.remove("was-register");
  c.classList.add("show-register");
}

function showLogin() {
  const c = document.getElementById("container");
  c.classList.remove("show-register");
  c.classList.add("was-register");
}

/* ══════════════════════════════════════════
   TOGGLE OJO CONTRASEÑA
══════════════════════════════════════════ */
function togglePassword(id, img) {
  const input = document.getElementById(id);
  const isHidden = input.type === "password";
  input.type = isHidden ? "text" : "password";
  img.src = isHidden ? "/assets/img/eyeOff.png" : "/assets/img/eyeOn.png";
}

/* ══════════════════════════════════════════
   ALERT PERSONALIZADO
══════════════════════════════════════════ */
function showAlert(message, type = "success") {
  const overlay = document.getElementById("alertOverlay");
  const icon    = document.getElementById("alertIcon");
  const msg     = document.getElementById("alertMessage");

  icon.textContent = type === "success" ? "✅" : "❌";
  msg.textContent  = message;
  overlay.style.display = "flex";
}

function closeAlert() {
  document.getElementById("alertOverlay").style.display = "none";
}

/* ══════════════════════════════════════════
   REGISTER
══════════════════════════════════════════ */
async function registrarse() {
  const usuario  = document.getElementById("usuario-register").value.trim();
  const correo   = document.getElementById("correo").value.trim();
  const password = document.getElementById("password-register").value;
  const confirmar = document.getElementById("confirmar-password").value;
  const errorEl  = document.getElementById("error-register");

  errorEl.textContent = "";

  // Validaciones frontend
  if (!usuario || !correo || !password || !confirmar) {
    errorEl.textContent = "Todos los campos son obligatorios.";
    return;
  }
  if (password !== confirmar) {
    errorEl.textContent = "Las contraseñas no coinciden.";
    return;
  }
  if (password.length < 6) {
    errorEl.textContent = "La contraseña debe tener al menos 6 caracteres.";
    return;
  }

  try {
    const res  = await fetch(`${API_URL}/auth/register`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ usuario, correo, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.error || "Error al registrarse.";
      return;
    }

    showAlert("¡Registro exitoso! Ahora inicia sesión.", "success");
    setTimeout(() => { closeAlert(); showLogin(); }, 2000);

  } catch (err) {
    console.error("Error en registro:", err);
    errorEl.textContent = "No se pudo conectar al servidor.";
  }
}

/* ══════════════════════════════════════════
   LOGIN
══════════════════════════════════════════ */
async function iniciarSesion() {
  const usuario  = document.getElementById("usuario-login").value.trim();
  const password = document.getElementById("password").value;

  if (!usuario || !password) {
    showAlert("Completa todos los campos.", "error");
    return;
  }

  try {
    const res  = await fetch(`${API_URL}/auth/login`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ usuario, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      showAlert(data.error || "Credenciales incorrectas.", "error");
      return;
    }

    // Guardar token y datos del usuario
    localStorage.setItem("token", data.token);
    localStorage.setItem("usuario", JSON.stringify(data.usuario));

    // Redirigir según rol
    const rol = data.usuario?.rol;
    if (rol === "desarrollador") {
      window.location.href = "/developer.html";
    } else {
      window.location.href = "/users.html";
    }

  } catch (err) {
    console.error("Error en login:", err);
    showAlert("No se pudo conectar al servidor.", "error");
  }
}

/* ══════════════════════════════════════════
   MEDIDOR DE CONTRASEÑA
══════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  const passInput = document.getElementById("password-register");
  const bar       = document.getElementById("strengthBar");

  if (passInput && bar) {
    passInput.addEventListener("input", () => {
      const val = passInput.value;
      bar.classList.remove("visible", "weak", "medium", "strong");

      if (!val) return;

      bar.classList.add("visible");
      const strong = /[A-Z]/.test(val) && /[0-9]/.test(val) && /[^A-Za-z0-9]/.test(val) && val.length >= 8;
      const medium = val.length >= 6 && (/[A-Z]/.test(val) || /[0-9]/.test(val));

      if (strong)      bar.classList.add("strong");
      else if (medium) bar.classList.add("medium");
      else             bar.classList.add("weak");
    });
  }
});