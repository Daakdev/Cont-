function showModule(name, el) {
  document
    .querySelectorAll(".module")
    .forEach((m) => m.classList.remove("active"));
  const mod = document.getElementById("mod-" + name);
  if (mod) mod.classList.add("active");
  const titles = {
    inicio: "Inicio",
    perfil: "Mi Perfil",
    nomina: "Mi Nómina",
    horario: "Mi Horario",
    solicitudes: "Solicitudes",
  };
  document.getElementById("topbar-title").textContent = titles[name] || name;
  if (el) {
    document
      .querySelectorAll(".nav-item")
      .forEach((i) => i.classList.remove("active"));
    el.classList.add("active");
  }
  if (name === "perfil") {
    const nombre = localStorage.getItem("nombreUsuario") || "—";
    const inicial = localStorage.getItem("inicialUsuario") || "?";
    document.getElementById("perfil-nombre").textContent = nombre;
    document.getElementById("perfil-avatar").textContent = inicial;
  }
}

function enviarSolicitud() {
  const tipo = document.getElementById("sol-tipo").value;
  const ini = document.getElementById("sol-ini").value;
  const fin = document.getElementById("sol-fin").value;
  if (!tipo || !ini || !fin) {
    alert("Completa: tipo, fecha inicio y fecha fin.");
    return;
  }
  const dias = Math.max(
    1,
    Math.round((new Date(fin) - new Date(ini)) / 86400000) + 1,
  );
  const hoy = new Date().toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const row = document.createElement("tr");
  row.innerHTML = `<td>${tipo}</td><td>${ini} – ${fin}</td><td>${dias}</td><td>${hoy}</td><td><span class="badge badge-orange">⏳ Pendiente</span></td>`;
  document.getElementById("sol-tbody").appendChild(row);
  document.getElementById("sol-total").textContent =
    document.getElementById("sol-tbody").rows.length + " solicitud(es)";
  document.getElementById("ini-solicitudes").textContent =
    document.getElementById("sol-tbody").rows.length;
  limpiarSolicitud();
}

function limpiarSolicitud() {
  ["sol-tipo", "sol-ini", "sol-fin", "sol-dias", "sol-motivo"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("collapsed");
}

(function () {
  const nombre = localStorage.getItem("nombreUsuario") || "";
  const inicial = localStorage.getItem("inicialUsuario") || "?";
  document
    .querySelectorAll(".nombreUsuario")
    .forEach((el) => (el.textContent = nombre));
  document
    .querySelectorAll(".inicialUsuario")
    .forEach((el) => (el.textContent = inicial));
})();
