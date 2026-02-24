  function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('collapsed');
  }
  function setActive(el) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
  }

  document.addEventListener("DOMContentLoaded", function() {

    const datosGuardados = JSON.parse(localStorage.getItem("usuarioRegistrado"));

    if (datosGuardados && document.getElementById("nombreUsuario")) {
        document.getElementById("nombreUsuario").textContent = datosGuardados.usuario;
    }

});

function logout() {
    localStorage.removeItem("usuarioRegistrado");
    window.location.href = "index.html";
}