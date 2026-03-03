function toggleSidebar() {
  document
    .getElementById("sidebar")
    .classList.toggle("collapsed");
}
function setActive(el) {
  document
    .querySelectorAll(".nav-item")
    .forEach((i) => i.classList.remove("active"));
  el.classList.add("active");
}

document.addEventListener("DOMContentLoaded", function () {
  const datosGuardados = JSON.parse(
    localStorage.getItem("usuarioRegistrado"),
  );

  if (datosGuardados) {
    // 🔹 Poner nombre en todos los lugares
    const elementosNombre = document.querySelectorAll(
      ".nombreUsuario",
    );
    elementosNombre.forEach((el) => {
      el.textContent = datosGuardados.usuario;
    });

    // 🔹 Poner inicial en todos los avatares
    const inicial = datosGuardados.usuario
      .charAt(0)
      .toUpperCase();
    const elementosInicial = document.querySelectorAll(
      ".inicialUsuario",
    );
    elementosInicial.forEach((el) => {
      el.textContent = inicial;
    });
  }
});

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("collapsed");
}

function logout() {
  localStorage.removeItem("usuarioRegistrado");
  window.location.href = "index.html";
}

const moduleTitles = {
  inicio: "Dashboard",
  ventas: "Ventas",
  inventario: "Inventario",
  clientes: "Clientes",
  proveedores: "Proveedores",
  nomina: "Nómina",
  compras: "Compras",
  empleados: "Empleados",
  gastos: "Gastos",
  configuracion: "Configuración",
};

function showModule(name, el) {
  document
    .querySelectorAll(".module")
    .forEach((m) => m.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));
  const mod = document.getElementById("mod-" + name);
  if (mod) mod.classList.add("active");
  el.classList.add("active");
  const titleEl = document.getElementById("topbar-title");
  if (titleEl)
    titleEl.textContent = moduleTitles[name] || name;
  // scroll main al inicio al cambiar módulo
  document.querySelector(".main").scrollTop = 0;
}

// toggleSidebar del archivo 1
function toggleSidebar() {
  document
    .getElementById("sidebar")
    .classList.toggle("collapsed");
}

// logout del archivo 1 (placeholder)
function logout() {
  if (typeof window.logoutUser === "function")
    window.logoutUser();
}

// setActive del archivo 1 (compatibilidad)
function setActive(el) {
  /* manejado por showModule */
}
