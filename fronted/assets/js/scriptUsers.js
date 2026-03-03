function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}
function setActive(el) {
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
}

document.addEventListener("DOMContentLoaded", function() {

    const datosGuardados = JSON.parse(localStorage.getItem("usuarioRegistrado"));

    if (datosGuardados) {

        // 🔹 Poner nombre en todos los lugares
        const elementosNombre = document.querySelectorAll(".nombreUsuario");
        elementosNombre.forEach(el => {
            el.textContent = datosGuardados.usuario;
        });

        // 🔹 Poner inicial en todos los avatares
        const inicial = datosGuardados.usuario.charAt(0).toUpperCase();
        const elementosInicial = document.querySelectorAll(".inicialUsuario");
        elementosInicial.forEach(el => {
            el.textContent = inicial;
        });
    }
});

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('collapsed');
}

function logout() {
  localStorage.removeItem("usuarioRegistrado");
  window.location.href = "index.html";
}