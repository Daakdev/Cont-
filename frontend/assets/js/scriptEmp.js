/* ══════════════════════════════════════════
   scriptEmp.js — Panel Empleado Cont+
══════════════════════════════════════════ */

const API_URL = 'https://cont-backend.onrender.com/api';

/* ──────────────────────────────
   UTILIDADES
────────────────────────────── */
function getToken() { return localStorage.getItem('token'); }

function getUsuario() {
  try { return JSON.parse(localStorage.getItem('usuario')) || {}; } catch { return {}; }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = '/index.html';
}

async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const res = await fetch(API_URL + endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
      ...(options.headers || {})
    }
  });
  if (res.status === 401 || res.status === 403) { logout(); return null; }
  return res;
}

/* ──────────────────────────────
   SIDEBAR & MÓDULOS
────────────────────────────── */
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}

function showModule(name, el) {
  document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
  const mod = document.getElementById('mod-' + name);
  if (mod) mod.classList.add('active');
  const titles = {
    inicio: 'Inicio',
    perfil: 'Mi Perfil',
    nomina: 'Mi Nómina',
    horario: 'Mi Horario',
    solicitudes: 'Solicitudes'
  };
  document.getElementById('topbar-title').textContent = titles[name] || name;
  if (el) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
  }
  if (name === 'perfil') cargarPerfil();
  if (name === 'nomina') cargarNominaEmpleado();
}

/* ──────────────────────────────
   INICIALIZACIÓN
────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const token   = getToken();
  const usuario = getUsuario();

  if (!token) { window.location.href = '/index.html'; return; }

  // Verificar que sea empleado
  if (usuario.rol && usuario.rol !== 'empleado') {
    window.location.href = '/users.html';
    return;
  }

  // Mostrar nombre e inicial
  const nombre = usuario.nombre || usuario.email || 'Empleado';
  document.querySelectorAll('.nombreUsuario').forEach(el => el.textContent = nombre);
  document.querySelectorAll('.usuario-login').forEach(el => el.textContent = nombre);
  document.querySelectorAll('.inicialUsuario').forEach(el => el.textContent = nombre.charAt(0).toUpperCase());

  // Guardar en localStorage para compatibilidad
  localStorage.setItem('nombreUsuario', nombre);
  localStorage.setItem('inicialUsuario', nombre.charAt(0).toUpperCase());
});

/* ──────────────────────────────
   PERFIL
────────────────────────────── */
async function cargarPerfil() {
  const usuario = getUsuario();
  const nombre  = usuario.nombre || '—';
  const inicial = nombre.charAt(0).toUpperCase();

  const nombreEl  = document.getElementById('perfil-nombre');
  const avatarEl  = document.getElementById('perfil-avatar');
  if (nombreEl) nombreEl.textContent = nombre;
  if (avatarEl) avatarEl.textContent = inicial;

  // Intentar cargar datos del empleado desde la BD
  try {
    const res = await apiFetch('/empleados');
    if (!res) return;
    const { empleados } = await res.json();
    // Buscar el empleado que coincide con el usuario actual
    const emp = empleados.find(e =>
      e.nombre?.toLowerCase().includes(nombre.toLowerCase()) ||
      e.email === usuario.correo
    );
    if (emp) mostrarDatosEmpleado(emp);
  } catch(e) { /* sin datos de empleado, mostrar placeholders */ }
}

function mostrarDatosEmpleado(emp) {
  const set = (selector, val) => {
    const els = document.querySelectorAll(selector);
    els.forEach(el => { if (el && val) el.value = val; });
  };
  // Actualizar campos del perfil si existen
  const cargo    = document.querySelector('#mod-perfil input[value="Operario de Producción"]');
  const depto    = document.querySelector('#mod-perfil input[value="Producción"]');
  const sueldo   = document.querySelector('#mod-perfil input[value="$1,300,000 COP"]');
  const ingreso  = document.querySelector('#mod-perfil input[value="01/01/2024"]');

  if (cargo   && emp.cargo)           cargo.value   = emp.cargo;
  if (depto   && emp.departamento)    depto.value   = emp.departamento;
  if (sueldo  && emp.sueldo_base)     sueldo.value  = '$' + parseFloat(emp.sueldo_base).toLocaleString('es-CO');
  if (ingreso && emp.fecha_ingreso)   ingreso.value = emp.fecha_ingreso;
}

/* ──────────────────────────────
   NÓMINA DEL EMPLEADO
────────────────────────────── */
async function cargarNominaEmpleado() {
  try {
    const mes = new Date().toISOString().slice(0, 7);
    const res = await apiFetch(`/nomina?mes=${mes}`);
    if (!res) return;
    const { registros } = await res.json();
    if (!registros || !registros.length) return;

    const usuario = getUsuario();
    const nombre  = usuario.nombre || '';

    // Buscar el registro que coincide con este empleado
    const reg = registros.find(r =>
      r.empleado?.nombre?.toLowerCase().includes(nombre.toLowerCase())
    );
    if (!reg) return;

    const fmt = n => '$' + parseFloat(n || 0).toLocaleString('es-CO', { minimumFractionDigits: 0 });

    // Actualizar stats de nómina
    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    // Actualizar resumen en inicio
    const filas = document.querySelectorAll('.nomina-fila .nom-valor');
    if (filas.length >= 4) {
      filas[0].textContent = fmt(reg.sueldo_base);
      filas[1].textContent = '+ ' + fmt(reg.horas_extra);
      filas[2].textContent = '− ' + fmt(reg.descuentos);
      filas[3].textContent = fmt(reg.neto);
    }
  } catch(e) { /* sin nómina disponible */ }
}

/* ──────────────────────────────
   SOLICITUDES
────────────────────────────── */
function enviarSolicitud() {
  const tipo = document.getElementById('sol-tipo').value;
  const ini  = document.getElementById('sol-ini').value;
  const fin  = document.getElementById('sol-fin').value;

  if (!tipo || !ini || !fin) {
    alert('Completa: tipo, fecha inicio y fecha fin.');
    return;
  }

  const dias = Math.max(1, Math.round((new Date(fin) - new Date(ini)) / 86400000) + 1);
  const hoy  = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${tipo}</td>
    <td>${ini} – ${fin}</td>
    <td>${dias}</td>
    <td>${hoy}</td>
    <td><span class="badge badge-orange">⏳ Pendiente</span></td>
  `;
  document.getElementById('sol-tbody').appendChild(row);

  const total = document.getElementById('sol-tbody').rows.length;
  const solTotal = document.getElementById('sol-total');
  const iniSol   = document.getElementById('ini-solicitudes');
  if (solTotal) solTotal.textContent = total + ' solicitud(es)';
  if (iniSol)   iniSol.textContent   = total;

  limpiarSolicitud();
}

function limpiarSolicitud() {
  ['sol-tipo', 'sol-ini', 'sol-fin', 'sol-dias', 'sol-motivo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}