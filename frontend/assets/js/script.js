/* ──────────────────────────────
   CONFIGURACIÓN DE API
────────────────────────────── */

// Detectar si estamos en localhost
const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// URL de API según entorno
const API = isLocalhost
  ? "http://localhost:3000/api/auth"
  : "/api/auth";

/* ──────────────────────────────
   INICIALIZACIÓN
────────────────────────────── */

window.addEventListener("load", () => {
  setTimeout(() => {
    const register = document.querySelector(".register");
    if (register) register.classList.remove("no-transition");
  }, 100);
});

document.addEventListener("DOMContentLoaded", () => {

  // Mostrar nombre de usuario si existe
  const usuario = localStorage.getItem("usuario");
  const nombreUsuario = document.getElementById("nombreUsuario");

  if (usuario && nombreUsuario) {
    nombreUsuario.textContent = usuario;
  }

  /* MEDIDOR DE FUERZA DE CONTRASEÑA */

  const passwordInput = document.getElementById("password-register");
  const strengthBar = document.getElementById("strengthBar");

  if (passwordInput && strengthBar) {

    passwordInput.addEventListener("focus", () => {
      strengthBar.classList.add("visible");
    });

    passwordInput.addEventListener("blur", function () {
      if (this.value.length === 0) {
        strengthBar.classList.remove("visible");
      }
    });

    passwordInput.addEventListener("input", function () {

      const password = this.value;

      if (password.length === 0) {
        strengthBar.className = "strength-meter visible";
        return;
      }

      let strength = 0;

      if (password.length >= 8) strength++;
      if (/[A-Z]/.test(password)) strength++;
      if (/[0-9]/.test(password)) strength++;
      if (/[^A-Za-z0-9]/.test(password)) strength++;

      if (strength <= 1)
        strengthBar.className = "strength-meter weak visible";
      else if (strength <= 3)
        strengthBar.className = "strength-meter medium visible";
      else
        strengthBar.className = "strength-meter strong visible";
    });
  }
});

/* ──────────────────────────────
   CAMBIAR ENTRE LOGIN / REGISTER
────────────────────────────── */

function showRegister() {
  const container = document.getElementById("container");
  if (!container) return;

  container.classList.remove("was-register");
  container.classList.add("show-register");
}

function showLogin() {
  const container = document.getElementById("container");
  if (!container) return;

  container.classList.remove("show-register");
  container.classList.add("was-register");
}

/* ──────────────────────────────
   LOGIN
────────────────────────────── */

async function iniciarSesion() {

  const usuario = document.getElementById("usuario-login").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!usuario || !password) {
    alert("Por favor llena todos los campos");
    return;
  }

  try {

    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ usuario, password })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Error al iniciar sesión");
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("usuario", data.usuario);

    window.location.replace("/pages/users.html");

  } catch (error) {
    alert("Error de conexión con el servidor");
  }
}

/* ──────────────────────────────
   REGISTRO
────────────────────────────── */

async function registrarse() {

  const usuario = document.getElementById("usuario-register").value.trim();
  const correo = document.getElementById("correo").value.trim();
  const password = document.getElementById("password-register").value.trim();
  const confirmar = document.getElementById("confirmar-password").value.trim();

  if (!usuario || !correo || !password || !confirmar) {
    mostrarError("Por favor llena todos los campos");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(correo)) {
    mostrarError("El correo no es válido");
    return;
  }

  if (password.length < 8) {
    mostrarError("La contraseña debe tener al menos 8 caracteres");
    return;
  }

  if (password !== confirmar) {
    mostrarError("Las contraseñas no coinciden");
    return;
  }

  try {

    const res = await fetch(`${API}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ usuario, correo, password })
    });

    const data = await res.json();

    if (!res.ok) {
      mostrarError(data.error || "Error al registrarse");
      return;
    }

    document.getElementById("usuario-register").value = "";
    document.getElementById("correo").value = "";
    document.getElementById("password-register").value = "";
    document.getElementById("confirmar-password").value = "";

    mostrarAlerta("success", "¡Registro exitoso! Ya puedes iniciar sesión.");

  } catch (error) {
    mostrarError("Error de conexión con el servidor");
  }
}

/* ──────────────────────────────
   MOSTRAR / OCULTAR CONTRASEÑA
────────────────────────────── */

function togglePassword(id, img) {

  const input = document.getElementById(id);
  if (!input) return;

  if (input.type === "password") {
    input.type = "text";
    img.src = "/assets/img/eyeClosed.svg";
  } else {
    input.type = "password";
    img.src = "/assets/img/eyeOn.png";
  }
}

/* ──────────────────────────────
   MODAL DE ALERTA
────────────────────────────── */

function mostrarAlerta(tipo, mensaje) {

  const icono = document.getElementById("alertIcon");
  const texto = document.getElementById("alertMessage");
  const overlay = document.getElementById("alertOverlay");

  if (!overlay || !texto) return;

  if (tipo === "success") {
    icono.innerHTML =
      '<img src="/assets/img/check.png" style="width:40px;height:40px;">';
  }

  texto.innerText = mensaje;
  overlay.style.display = "flex";
}

function closeAlert() {

  const overlay = document.getElementById("alertOverlay");

  if (overlay) overlay.style.display = "none";

  showLogin();
}

/* ──────────────────────────────
   MENSAJE DE ERROR
────────────────────────────── */

function mostrarError(mensaje) {

  const error = document.getElementById("error-register");
  if (!error) return;

  error.textContent = mensaje;
  error.style.opacity = "1";

  setTimeout(() => {
    error.style.opacity = "0";
  }, 3000);
}

/* ──────────────────────────────
   LOGOUT
────────────────────────────── */

function logout() {

  localStorage.removeItem("token");
  localStorage.removeItem("usuario");

  window.location.replace("/index.html");
}