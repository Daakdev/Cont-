/* ══════════════════════════════════════════
   CONFIGURACIÓN
══════════════════════════════════════════ */
const API_URL = "https://cont-backend.onrender.com/api";

/* ══════════════════════════════════════════
   UTILIDAD — fetch autenticado con JWT
   Úsala para cualquier llamada al backend
══════════════════════════════════════════ */
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  // Si el token expiró o es inválido → logout automático
  if (res.status === 401 || res.status === 403) {
    logout();
    return null;
  }

  return res;
}

/* ══════════════════════════════════════════
   INICIALIZACIÓN — cargar datos del usuario
══════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", function () {
  const token   = localStorage.getItem("token");
  const usuario = localStorage.getItem("usuario");

  // Sin sesión → redirigir al login
  if (!token || !usuario) {
    window.location.href = "index.html";
    return;
  }

  // Verificar que el token no haya expirado (sin librería extra)
  try {
    const payload  = JSON.parse(atob(token.split(".")[1]));
    const expirado = payload.exp && Date.now() / 1000 > payload.exp;
    if (expirado) { logout(); return; }
  } catch {
    logout();
    return;
  }

  const inicial = usuario.charAt(0).toUpperCase();

  // Saludo en el dashboard: "Buenos días, Juan 👋"
  document.querySelectorAll(".nombreUsuario").forEach(el => {
    el.textContent = usuario;
  });

  // Nombre en el sidebar bajo el avatar
  document.querySelectorAll(".usuario-login").forEach(el => {
    el.textContent = usuario;
  });

  // Inicial en el avatar circular del sidebar
  document.querySelectorAll(".inicialUsuario").forEach(el => {
    el.textContent = inicial;
  });
});

/* ══════════════════════════════════════════
   SIDEBAR — colapsar / expandir
══════════════════════════════════════════ */
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("collapsed");
}

/* ══════════════════════════════════════════
   MÓDULOS — navegación entre secciones
══════════════════════════════════════════ */
const moduleTitles = {
  inicio:        "Dashboard",
  ventas:        "Ventas",
  inventario:    "Inventario",
  clientes:      "Clientes",
  proveedores:   "Proveedores",
  nomina:        "Nómina",
  compras:       "Compras",
  empleados:     "Empleados",
  gastos:        "Gastos",
  configuracion: "Configuración",
};

function showModule(name, el) {
  // Ocultar todos los módulos y quitar activo de nav
  document.querySelectorAll(".module").forEach(m => m.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));

  // Activar módulo y nav-item seleccionado
  const mod = document.getElementById("mod-" + name);
  if (mod) mod.classList.add("active");
  if (el)  el.classList.add("active");

  // Actualizar título del topbar
  const titleEl = document.getElementById("topbar-title");
  if (titleEl) titleEl.textContent = moduleTitles[name] || name;

  // Volver al tope al cambiar módulo
  const main = document.querySelector(".main");
  if (main) main.scrollTop = 0;
}

/* ══════════════════════════════════════════
   LOGOUT
══════════════════════════════════════════ */
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  window.location.href = "index.html";
}