/* ═══════════════════════════════════════════════════════
   scriptDev.js — Panel Desarrollador Cont+
   Conectado al backend real: https://cont-backend.onrender.com
═══════════════════════════════════════════════════════ */

const API_URL = 'https://cont-backend.onrender.com/api';

/* ──────────────────────────────
   UTILIDADES GENERALES
────────────────────────────── */
function getToken() {
  return localStorage.getItem('token');
}

function getUsuario() {
  try { return JSON.parse(localStorage.getItem('usuario')) || {}; } catch { return {}; }
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

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = '/index.html';
}

function fmt(n) {
  if (n === undefined || n === null) return '—';
  return Number(n).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtMoney(n) {
  if (n === undefined || n === null) return '—';
  return '$' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 0 });
}

/* ──────────────────────────────
   SIDEBAR & MÓDULOS
────────────────────────────── */
const MODULE_TITLES = {
  inicio: 'Inicio',
  panel: 'Panel Técnico',
  modulos: 'Módulos',
  usuarios: 'Usuarios',
  logs: 'Logs del Sistema',
  config: 'Configuración del Sistema'
};

function showModule(name, el) {
  document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
  const mod = document.getElementById('mod-' + name);
  if (mod) mod.classList.add('active');
  document.getElementById('topbar-title').textContent = MODULE_TITLES[name] || name;
  if (el) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
  }
  addLog('INFO', `Módulo "${MODULE_TITLES[name] || name}" abierto`);

  // Cargar datos del módulo al abrirlo
  if (name === 'panel')    cargarPanel();
  if (name === 'usuarios') cargarUsuarios();
  if (name === 'logs')     actualizarStatsLog();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}

/* ──────────────────────────────
   LOG SYSTEM
────────────────────────────── */
let logData = [];

function addLog(level, msg) {
  const ts = new Date().toLocaleTimeString('es-CO');
  logData.push({ ts, level, msg });

  const term = document.getElementById('log-terminal');
  if (!term) return;

  const cls = { OK: 'ok', INFO: 'info', WARN: 'warn', ERROR: 'error' }[level] || 'info';
  const div = document.createElement('div');
  div.className = 'log-line';
  div.dataset.level = cls;
  div.innerHTML = `<span class="log-ts">${ts}</span><span class="log-lvl ${cls}">${level}</span><span class="log-msg">${msg}</span>`;
  term.appendChild(div);
  term.scrollTop = term.scrollHeight;

  actualizarStatsLog();
}

function actualizarStatsLog() {
  const total  = logData.length;
  const errors = logData.filter(l => l.level === 'ERROR').length;
  const warns  = logData.filter(l => l.level === 'WARN').length;
  const info   = logData.filter(l => l.level === 'INFO' || l.level === 'OK').length;

  const el = (id) => document.getElementById(id);
  if (el('log-total'))  el('log-total').textContent  = total;
  if (el('log-errores')) {
    el('log-errores').textContent = errors;
    el('log-errores').style.color = errors > 0 ? '#ef4444' : '#22c55e';
    if (el('log-errores-sub')) el('log-errores-sub').textContent = errors > 0 ? 'Revisar errores' : 'Sin errores';
  }
  if (el('log-warns'))  el('log-warns').textContent  = warns;
  if (el('log-info'))   el('log-info').textContent   = info;

  // Punto rojo en topbar si hay errores
  const dot = document.getElementById('notif-dot');
  if (dot) dot.style.display = errors > 0 ? 'block' : 'none';

  // Stat errores en inicio
  const iniErr = document.getElementById('ini-errores');
  if (iniErr) {
    iniErr.textContent = errors;
    iniErr.style.color = errors > 0 ? '#ef4444' : '#22c55e';
  }
}

function limpiarLogs() {
  logData = [];
  const term = document.getElementById('log-terminal');
  if (term) term.innerHTML = '';
  addLog('OK', 'Logs limpiados por el desarrollador');
}

function exportarLogs() {
  const lines = logData.map(l => `[${l.ts}] [${l.level}] ${l.msg}`).join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([lines], { type: 'text/plain' })),
    download: 'contmas_logs_' + new Date().toISOString().slice(0, 10) + '.txt'
  });
  a.click();
  addLog('OK', 'Logs exportados como archivo .txt');
}

function filtrarLog(tipo) {
  document.querySelectorAll('#log-terminal .log-line').forEach(l => {
    if (tipo === 'all') { l.style.display = ''; return; }
    l.style.display = l.dataset.level === tipo ? '' : 'none';
  });
}

/* ──────────────────────────────
   VERIFICAR BACKEND
────────────────────────────── */
let backendOnline = false;

async function verificarBackend() {
  addLog('INFO', `Verificando backend: ${API_URL.replace('/api', '')}`);
  try {
    const res = await fetch(API_URL.replace('/api', '') + '/health', { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      backendOnline = true;
      addLog('OK', 'Backend online — /health respondió 200');
      actualizarEstadoBackend(true);
    } else {
      backendOnline = false;
      addLog('WARN', `Backend respondió con status ${res.status}`);
      actualizarEstadoBackend(false, res.status);
    }
  } catch (e) {
    backendOnline = false;
    addLog('ERROR', 'Backend no responde — ' + e.message);
    actualizarEstadoBackend(false);
  }
}

function actualizarEstadoBackend(online, status) {
  // Inicio
  const iniBack    = document.getElementById('ini-backend');
  const iniBackSub = document.getElementById('ini-backend-sub');
  if (iniBack) {
    iniBack.textContent = online ? '🟢' : '🔴';
    iniBack.style.fontSize = '22px';
  }
  if (iniBackSub) iniBackSub.textContent = online ? 'Conectado' : (status ? 'Error ' + status : 'Sin respuesta');

  // Barra perf inicio
  const fill = document.getElementById('perf-backend-fill');
  const pct  = document.getElementById('perf-backend-pct');
  if (fill) { fill.style.width = online ? '100%' : '5%'; fill.style.background = online ? '#22c55e' : '#ef4444'; }
  if (pct)  { pct.textContent = online ? '100%' : 'N/A'; pct.style.color = online ? '#22c55e' : '#ef4444'; }

  // Timestamp
  const check = document.getElementById('ini-last-check');
  if (check) check.textContent = 'Último chequeo: ' + new Date().toLocaleTimeString('es-CO');

  // Hero banner
  const heroEnv  = document.getElementById('hero-env');
  const heroUp   = document.getElementById('hero-uptime');
  if (heroEnv) heroEnv.textContent = online ? '🟢 Backend Online' : '🔴 Backend Offline';
  if (heroUp)  heroUp.textContent  = online ? 'Todos los servicios activos · Backend conectado' : 'Backend no disponible · Modo sin conexión';

  // Panel técnico
  const panelHeroStatus = document.getElementById('panel-hero-status');
  const panelBdEstado   = document.getElementById('panel-bd-estado');
  const panelBdSub      = document.getElementById('panel-bd-sub');
  const panelPerfFill   = document.getElementById('panel-perf-backend');
  const panelPerfPct    = document.getElementById('panel-perf-backend-pct');
  if (panelHeroStatus) panelHeroStatus.textContent = online ? '🟢 Online' : '🔴 Offline';
  if (panelBdEstado)   { panelBdEstado.textContent = online ? '🟢' : '🔴'; panelBdEstado.style.fontSize = '22px'; }
  if (panelBdSub)      panelBdSub.textContent = online ? 'MySQL / Aiven · Conectado' : 'Sin conexión';
  if (panelPerfFill)   { panelPerfFill.style.width = online ? '100%' : '5%'; panelPerfFill.style.background = online ? '#22c55e' : '#ef4444'; }
  if (panelPerfPct)    { panelPerfPct.textContent = online ? '100%' : 'N/A'; panelPerfPct.style.color = online ? '#22c55e' : '#ef4444'; }

  // Config BD estado
  const cfgDbEstado = document.getElementById('cfg-db-estado');
  if (cfgDbEstado) cfgDbEstado.value = online ? '✅ Conectado' : '❌ Sin conexión';
}

/* ──────────────────────────────
   VERIFICAR ENDPOINTS
────────────────────────────── */
async function verificarEndpoints() {
  const endpoints = [
    { path: '/api/auth/login',  method: 'POST', body: JSON.stringify({ email: 'test@test.com', contrasena: 'test' }) },
    { path: '/api/clientes',    method: 'GET' },
    { path: '/api/inventario',  method: 'GET' },
    { path: '/api/ventas',      method: 'GET' },
    { path: '/api/gastos',      method: 'GET' },
    { path: '/api/proveedores', method: 'GET' },
    { path: '/api/empleados',   method: 'GET' },
    { path: '/api/compras',     method: 'GET' },
    { path: '/api/nomina',      method: 'GET' },
  ];

  const tbody = document.getElementById('panel-endpoints');
  if (!tbody) return;

  // Resetear
  tbody.querySelectorAll('td:last-child span').forEach(s => {
    s.className = 'badge badge-orange';
    s.textContent = 'Verificando';
  });

  const token = getToken();
  const rows = tbody.querySelectorAll('tr');

  for (let i = 0; i < endpoints.length; i++) {
    const ep = endpoints[i];
    const badge = rows[i]?.querySelector('td:last-child span');
    if (!badge) continue;

    try {
      const opts = {
        method: ep.method,
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': 'Bearer ' + token } : {}) },
        signal: AbortSignal.timeout(6000)
      };
      if (ep.body) opts.body = ep.body;

      const res = await fetch(API_URL.replace('/api', '') + ep.path, opts);

      if (res.status === 200 || res.status === 201 || res.status === 400 || res.status === 401) {
        // 400/401 en login significa que llega pero rechaza — endpoint existe
        badge.className = 'badge badge-green';
        badge.textContent = '✅ ' + res.status;
        addLog('OK', `${ep.method} ${ep.path} → ${res.status}`);
      } else {
        badge.className = 'badge badge-orange';
        badge.textContent = '⚠️ ' + res.status;
        addLog('WARN', `${ep.method} ${ep.path} → ${res.status}`);
      }
    } catch (e) {
      badge.className = 'badge badge-red';
      badge.textContent = '❌ Error';
      addLog('ERROR', `${ep.method} ${ep.path} → ${e.message}`);
    }

    // Pequeña pausa entre requests
    await new Promise(r => setTimeout(r, 300));
  }
}

/* ──────────────────────────────
   CARGAR PANEL TÉCNICO
────────────────────────────── */
async function cargarPanel() {
  const apiEl = document.getElementById('panel-api-url');
  if (apiEl) apiEl.textContent = API_URL;
  await verificarEndpoints();
}

/* ──────────────────────────────
   CARGAR USUARIOS
────────────────────────────── */
let usuariosData = [];

async function cargarUsuarios() {
  const tbody = document.getElementById('usr-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;padding:30px;">Cargando...</td></tr>';

  if (!backendOnline) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#ef4444;padding:30px;">⚠️ Backend no disponible</td></tr>';
    addLog('WARN', 'No se pudieron cargar usuarios — backend offline');
    return;
  }

  try {
    const res = await apiFetch('/usuarios-dev');
    if (!res || !res.ok) {
      // Si no existe el endpoint dev, mostrar datos del token actual
      mostrarUsuarioActual();
      return;
    }
    const data = await res.json();
    usuariosData = data;
    renderUsuarios(data);
  } catch (e) {
    mostrarUsuarioActual();
    addLog('WARN', 'Endpoint /usuarios-dev no disponible — mostrando usuario actual');
  }
}

function mostrarUsuarioActual() {
  const usuario = getUsuario();
  if (!usuario || !usuario.nombre) {
    document.getElementById('usr-tbody').innerHTML =
      '<tr><td colspan="5" style="text-align:center;color:#999;padding:30px;">Sin datos de usuario</td></tr>';
    return;
  }
  usuariosData = [usuario];
  renderUsuarios([usuario]);
}

function renderUsuarios(lista) {
  const tbody = document.getElementById('usr-tbody');
  if (!tbody) return;

  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;padding:30px;">Sin usuarios registrados</td></tr>';
    return;
  }

  tbody.innerHTML = lista.map(u => {
    const inicial = (u.nombre || u.email || '?').charAt(0).toUpperCase();
    const rolClass = { admin: 'admin', empleado: 'emp', desarrollador: 'dev' }[u.rol] || 'emp';
    const rolLabel = { admin: 'Administrador', empleado: 'Empleado', desarrollador: 'Desarrollador' }[u.rol] || u.rol || '—';
    return `
      <tr>
        <td><div class="usr-info"><div class="usr-avatar ${rolClass}">${inicial}</div><strong>${u.nombre || '—'}</strong></div></td>
        <td>${u.email || '—'}</td>
        <td>${u.empresa_nombre || u.empresa_id || '—'}</td>
        <td><span class="rp ${rolClass}">${rolLabel}</span></td>
        <td><span style="color:#22c55e;font-weight:700;">● Activo</span></td>
      </tr>
    `;
  }).join('');

  // Stats
  const total   = lista.length;
  const admins  = lista.filter(u => u.rol === 'admin').length;
  const emps    = lista.filter(u => u.rol === 'empleado').length;
  const empIds  = [...new Set(lista.map(u => u.empresa_id).filter(Boolean))].length;

  const el = id => document.getElementById(id);
  if (el('usr-total'))   el('usr-total').textContent   = total;
  if (el('usr-admins'))  el('usr-admins').textContent  = admins;
  if (el('usr-emps'))    el('usr-emps').textContent    = emps;
  if (el('usr-empresas'))el('usr-empresas').textContent= empIds || '—';
  if (el('usr-count'))   el('usr-count').textContent   = total + ' usuario' + (total !== 1 ? 's' : '');

  // Stat inicio
  const iniUsr = document.getElementById('ini-usuarios');
  const iniUsrSub = document.getElementById('ini-usuarios-sub');
  if (iniUsr) iniUsr.textContent = total;
  if (iniUsrSub) iniUsrSub.textContent = total + ' en BD';

  addLog('OK', `${total} usuario(s) cargados`);
}

function filtrarUsuarios() {
  const q = document.getElementById('usr-search')?.value.toLowerCase() || '';
  const filtrados = usuariosData.filter(u =>
    (u.nombre || '').toLowerCase().includes(q) ||
    (u.email  || '').toLowerCase().includes(q)
  );
  renderUsuarios(filtrados);
}

function crearUsuario() {
  const nombre = prompt('Nombre del nuevo usuario:');
  if (!nombre) return;
  const rol = prompt('Rol (admin / empleado / desarrollador):') || 'empleado';
  addLog('WARN', `Crear usuario "${nombre}" (${rol}) — función disponible desde users.html`);
  alert('Para crear usuarios, usa el módulo de Configuración en el panel principal (users.html).');
}

/* ──────────────────────────────
   MÓDULOS — TOGGLE
────────────────────────────── */
function toggleModulo(el) {
  const eraOn = el.classList.contains('on');
  el.classList.toggle('on');
  el.classList.toggle('off');
  const nombre = el.closest('tr')?.querySelector('strong')?.textContent || 'Módulo';
  const estado = eraOn ? 'desactivado' : 'activado';
  addLog('INFO', `${nombre} ${estado}`);
}

function guardarModulos() {
  const toggles = document.querySelectorAll('#mod-modulos .toggle-pill');
  const estado = [...toggles].map((t, i) => ({
    indice: i,
    activo: t.classList.contains('on')
  }));
  localStorage.setItem('dev_modulos', JSON.stringify(estado));
  addLog('OK', `Configuración de módulos guardada (${toggles.length} módulos)`);
  alert('✅ Configuración guardada en LocalStorage.');
}

/* ──────────────────────────────
   CONFIG SISTEMA
────────────────────────────── */
function aplicarConfig() {
  const modo   = document.getElementById('cfg-modo')?.value;
  const apiUrl = document.getElementById('cfg-api-url')?.value;

  if (apiUrl) {
    addLog('INFO', `API URL actualizada: ${apiUrl}`);
  }
  addLog('OK', `Configuración aplicada — Modo: ${modo}`);
  alert('✅ Configuración aplicada.');
}

async function testConexion() {
  addLog('INFO', 'Probando conexión con backend...');
  const cfgDbEstado = document.getElementById('cfg-db-estado');
  if (cfgDbEstado) cfgDbEstado.value = 'Probando...';

  await verificarBackend();

  if (cfgDbEstado) cfgDbEstado.value = backendOnline ? '✅ Conectado' : '❌ Sin conexión';
}

/* ──────────────────────────────
   RECARGAR MÉTRICAS (topbar btn)
────────────────────────────── */
async function recargarMetricas() {
  addLog('INFO', 'Recargando métricas del sistema...');
  await verificarBackend();
  addLog('OK', 'Métricas actualizadas');
}

/* ──────────────────────────────
   INICIALIZACIÓN
────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  // Verificar sesión
  const token = getToken();
  const usuario = getUsuario();

  if (!token) {
    window.location.href = '/index.html';
    return;
  }

  // Mostrar nombre de usuario
  const nombre = usuario.nombre || usuario.email || 'Desarrollador';
  document.querySelectorAll('.nombreUsuario').forEach(el => el.textContent = nombre);
  document.querySelectorAll('.usuario-login').forEach(el => el.textContent = nombre);
  document.querySelectorAll('.inicialUsuario').forEach(el => el.textContent = nombre.charAt(0).toUpperCase());

  // Logs iniciales
  addLog('OK', 'Panel desarrollador iniciado');
  addLog('INFO', `Sesión activa — usuario: ${nombre}`);
  addLog('INFO', `API URL configurada: ${API_URL}`);
  addLog('INFO', 'Verificando backend...');

  // Verificar backend
  await verificarBackend();

  // Stat módulos inicio
  const iniMod = document.getElementById('ini-modulos');
  if (iniMod) iniMod.textContent = '9';

  // API URL en config
  const cfgApiUrl = document.getElementById('cfg-api-url');
  if (cfgApiUrl) cfgApiUrl.value = API_URL;

  addLog('OK', 'Inicialización completa');
});