/* ══════════════════════════════════════════
   CONFIGURACIÓN
══════════════════════════════════════════ */
const API_URL = "https://cont-backend.onrender.com/api";

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
  img.src = isHidden ? "/assets/img/eyeOff.svg" : "/assets/img/eyeOn.png";
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
      window.location.href = "/desarrollador.html";
    } else if (rol === "empleado") {
      window.location.href = "/empleado.html";
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

// ─── OLVIDASTE CONTRASEÑA ───────────────────────────────────────
let fpToken = '';
let fpTimerInterval;

function showForgot() {
  fpReset();
  document.getElementById('forgotOverlay').style.display = 'flex';
}

function closeForgot() {
  document.getElementById('forgotOverlay').style.display = 'none';
  fpReset();
}

function fpReset() {
  ['fp-step1','fp-step2','fp-step3'].forEach((id, i) =>
    document.getElementById(id).style.display = i === 0 ? 'block' : 'none'
  );
  ['fp-error1','fp-error2','fp-error3'].forEach(id =>
    document.getElementById(id).textContent = ''
  );
  document.getElementById('fp-correo').value = '';
  for (let i = 0; i < 6; i++) document.getElementById('fp-d'+i).value = '';
  document.getElementById('fp-pw1').value = '';
  document.getElementById('fp-pw2').value = '';
  clearInterval(fpTimerInterval);
}

// Paso 1: enviar código
async function fpEnviarCodigo() {
  const correo = document.getElementById('fp-correo').value.trim();
  if (!correo) return document.getElementById('fp-error1').textContent = 'Ingresa tu correo.';

  try {
    const res = await fetch('/api/password/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo })
    });
    // Siempre avanza (respuesta genérica del backend)
    document.getElementById('fp-correo-shown').textContent = correo;
    document.getElementById('fp-step1').style.display = 'none';
    document.getElementById('fp-step2').style.display = 'block';
    document.getElementById('fp-d0').focus();
    fpStartTimer();
  } catch {
    document.getElementById('fp-error1').textContent = 'Error de conexión. Intenta de nuevo.';
  }
}

// Paso 2: verificar código
async function fpVerificarCodigo() {
  const correo = document.getElementById('fp-correo').value.trim();
  const code = [0,1,2,3,4,5].map(i => document.getElementById('fp-d'+i).value).join('');

  if (code.length < 6) return document.getElementById('fp-error2').textContent = 'Ingresa los 6 dígitos.';

  try {
    const res = await fetch('/api/password/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, code })
    });
    const data = await res.json();

    if (!res.ok) return document.getElementById('fp-error2').textContent = data.error;

    fpToken = data.token;
    clearInterval(fpTimerInterval);
    document.getElementById('fp-step2').style.display = 'none';
    document.getElementById('fp-step3').style.display = 'block';
  } catch {
    document.getElementById('fp-error2').textContent = 'Error de conexión. Intenta de nuevo.';
  }
}

// Paso 3: cambiar contraseña
async function fpCambiarPassword() {
  const correo = document.getElementById('fp-correo').value.trim();
  const pw1 = document.getElementById('fp-pw1').value;
  const pw2 = document.getElementById('fp-pw2').value;

  if (pw1.length < 8) return document.getElementById('fp-error3').textContent = 'Mínimo 8 caracteres.';
  if (pw1 !== pw2) return document.getElementById('fp-error3').textContent = 'Las contraseñas no coinciden.';

  try {
    const res = await fetch('/api/password/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, token: fpToken, newPassword: pw1 })
    });
    const data = await res.json();

    if (!res.ok) return document.getElementById('fp-error3').textContent = data.error;

    closeForgot();
    showAlert('success', '¡Contraseña actualizada! Ya puedes iniciar sesión.'); // usa tu función de alertas
  } catch {
    document.getElementById('fp-error3').textContent = 'Error de conexión. Intenta de nuevo.';
  }
}

// Helpers de código
function fpMoveNext(el, next) {
  if (el.value && next >= 0) document.getElementById('fp-d'+next).focus();
}
function fpMovePrev(e, idx) {
  if (e.key === 'Backspace' && !e.target.value && idx > 0)
    document.getElementById('fp-d'+(idx-1)).focus();
}

// Timer reenvío
function fpStartTimer() {
  let secs = 59;
  const el = document.getElementById('fp-timer');
  const btn = document.getElementById('fp-resend-btn');
  btn.style.pointerEvents = 'none';
  btn.style.opacity = '0.5';
  el.textContent = '(0:59)';
  clearInterval(fpTimerInterval);
  fpTimerInterval = setInterval(() => {
    secs--;
    el.textContent = secs > 0 ? `(0:${secs < 10 ? '0'+secs : secs})` : '';
    if (secs <= 0) {
      clearInterval(fpTimerInterval);
      btn.style.pointerEvents = 'auto';
      btn.style.opacity = '1';
      el.textContent = '';
    }
  }, 1000);
}

function fpReenviar() {
  fpEnviarCodigo();
}

// Medidor de fortaleza
function fpCheckStrength() {
  const pw = document.getElementById('fp-pw1').value;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const bar = document.getElementById('fp-strength');
  const colors = ['', '#ef4444', '#f97316', '#84cc16', '#22c55e'];
  const widths = ['0%', '25%', '50%', '75%', '100%'];
  bar.style.background = `linear-gradient(to right, ${colors[score]} ${widths[score]}, #e5e7eb ${widths[score]})`;
}