/* ══════════════════════════════════════════
   CONFIG & UTILIDADES
══════════════════════════════════════════ */
const API_URL = "https://cont-backend.onrender.com/api";

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, ...(options.headers || {}) },
  });
  if (res.status === 401 || res.status === 403) { logout(); return null; }
  return res;
}

const fmt     = n  => "$" + parseFloat(n || 0).toLocaleString("es-CO", { minimumFractionDigits: 0 });
const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

function badgeEstado(estado) {
  const map = { activo:"badge-green", inactivo:"badge-red", vacaciones:"badge-blue", pagado:"badge-green", pendiente:"badge-orange", anulado:"badge-red", recibido:"badge-green", transito:"badge-blue" };
  return `<span class="badge ${map[estado]||"badge-blue"}">${estado}</span>`;
}

/* ══════════════════════════════════════════
   INICIALIZACIÓN
══════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  const usuario = localStorage.getItem("usuario");
  if (!token || !usuario) { window.location.href = "index.html"; return; }
  try {
    const p = JSON.parse(atob(token.split(".")[1]));
    if (p.exp && Date.now() / 1000 > p.exp) { logout(); return; }
  } catch { logout(); return; }

  document.querySelectorAll(".nombreUsuario").forEach(el => el.textContent = usuario);
  document.querySelectorAll(".usuario-login").forEach(el => el.textContent = usuario);
  document.querySelectorAll(".inicialUsuario").forEach(el => el.textContent = usuario.charAt(0).toUpperCase());

  cargarDashboard();

  // Botones "Nuevo"
  document.querySelector("#mod-clientes .btn-primary")?.addEventListener("click", () =>
    abrirModal("Nuevo Cliente", formCliente(), () => guardarCliente(recogerFormCliente())));
  document.querySelector("#mod-inventario .btn-primary")?.addEventListener("click", () =>
    abrirModal("Nuevo Producto", formProducto(), () => guardarProducto(recogerFormProducto())));
  document.querySelector("#mod-ventas .btn-primary")?.addEventListener("click", abrirModalNuevaVenta);
  document.querySelector("#mod-gastos .btn-primary")?.addEventListener("click", () =>
    abrirModal("Registrar Gasto", formGasto(), () => guardarGasto(recogerFormGasto())));
  document.querySelector("#mod-proveedores .btn-primary")?.addEventListener("click", () =>
    abrirModal("Nuevo Proveedor", formProveedor(), () => guardarProveedor(recogerFormProveedor())));
  document.querySelector("#mod-empleados .btn-primary")?.addEventListener("click", () =>
    abrirModal("Nuevo Empleado", formEmpleado(), () => guardarEmpleado(recogerFormEmpleado())));
  document.querySelector("#mod-compras .btn-primary")?.addEventListener("click", abrirModalNuevaCompra);
  document.querySelector("#mod-nomina .btn-secondary")?.addEventListener("click", generarNomina);
  document.querySelector("#mod-nomina .btn-primary")?.addEventListener("click", procesarPagoNomina);

  // Filtros
  document.getElementById("cli-search")?.addEventListener("input", cargarClientes);
  document.getElementById("cli-tipo")?.addEventListener("change", cargarClientes);
  document.getElementById("inv-search")?.addEventListener("input", cargarInventario);
  document.getElementById("inv-categoria")?.addEventListener("change", cargarInventario);
  document.getElementById("inv-stock-filtro")?.addEventListener("change", cargarInventario);
  document.getElementById("v-search")?.addEventListener("input", cargarVentas);
  document.getElementById("v-estado")?.addEventListener("change", cargarVentas);
  document.getElementById("prov-search")?.addEventListener("input", cargarProveedores);
  document.getElementById("prov-categoria")?.addEventListener("change", cargarProveedores);
  document.getElementById("emp-search")?.addEventListener("input", cargarEmpleados);
  document.getElementById("emp-depto")?.addEventListener("change", cargarEmpleados);
  document.getElementById("comp-search")?.addEventListener("input", cargarCompras);
  document.getElementById("comp-estado")?.addEventListener("change", cargarCompras);
});

/* ══════════════════════════════════════════
   SIDEBAR & NAVEGACIÓN
══════════════════════════════════════════ */
function toggleSidebar() { document.getElementById("sidebar").classList.toggle("collapsed"); }
function logout() { localStorage.removeItem("token"); localStorage.removeItem("usuario"); window.location.href = "index.html"; }

const moduleTitles = { inicio:"Dashboard", ventas:"Ventas", inventario:"Inventario", clientes:"Clientes", proveedores:"Proveedores", nomina:"Nómina", compras:"Compras", empleados:"Empleados", gastos:"Gastos", configuracion:"Configuración" };

function showModule(name, el) {
  document.querySelectorAll(".module").forEach(m => m.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  document.getElementById("mod-" + name)?.classList.add("active");
  el?.classList.add("active");
  setText("topbar-title", moduleTitles[name] || name);
  document.querySelector(".main").scrollTop = 0;
  const loaders = { clientes: cargarClientes, inventario: cargarInventario, ventas: cargarVentas, gastos: cargarGastos, proveedores: cargarProveedores, empleados: cargarEmpleados, compras: cargarCompras, nomina: cargarNomina };
  if (loaders[name]) loaders[name]();
}

/* ══════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════ */
async function cargarDashboard() {
  try {
    const [rV, rI, rC, rG, rP, rE] = await Promise.all([
      apiFetch("/ventas"), apiFetch("/inventario"), apiFetch("/clientes"),
      apiFetch("/gastos"), apiFetch("/proveedores"), apiFetch("/empleados"),
    ]);
    if (!rV || !rI || !rC || !rG || !rP || !rE) return;
    const { ventas, stats: sv } = await rV.json();
    const { stats: si } = await rI.json();
    const { stats: sc } = await rC.json();
    const { stats: sg } = await rG.json();
    const { stats: sp } = await rP.json();
    const { stats: se } = await rE.json();

    setText("dash-ventas", fmt(sv.mes));        setText("dash-ventas-change",      `Hoy: ${fmt(sv.hoy)}`);
    setText("dash-inventario", si.total+" prod"); setText("dash-inventario-change", `Bajo stock: ${si.bajo}`);
    setText("dash-clientes", sc.total);          setText("dash-clientes-change",    `Frecuentes: ${sc.frecuentes}`);
    setText("dash-proveedores", sp.total);        setText("dash-proveedores-change", `Por pagar: ${fmt(sp.porPagar)}`);
    setText("dash-empleados", se.total);          setText("dash-empleados-change",   `Departamentos: ${se.deptos}`);
    setText("dash-gastos", fmt(sg.mes));          setText("dash-gastos-change",      `Hoy: ${fmt(sg.hoy)}`);

    document.getElementById("dash-ventas-recientes").innerHTML = ventas.slice(0, 5).length
      ? `<table style="width:100%;border-collapse:collapse"><thead><tr>
          <th style="padding:8px;font-size:11px;color:#aaa;text-align:left">#</th>
          <th style="padding:8px;font-size:11px;color:#aaa;text-align:left">Cliente</th>
          <th style="padding:8px;font-size:11px;color:#aaa;text-align:right">Total</th>
          <th style="padding:8px;font-size:11px;color:#aaa;text-align:center">Estado</th>
        </tr></thead><tbody>${ventas.slice(0,5).map(v=>`
          <tr>
            <td style="padding:8px;font-size:13px">${v.numero}</td>
            <td style="padding:8px;font-size:13px">${v.cliente?.nombre||"—"}</td>
            <td style="padding:8px;font-size:13px;text-align:right">${fmt(v.total)}</td>
            <td style="padding:8px;text-align:center">${badgeEstado(v.estado)}</td>
          </tr>`).join("")}</tbody></table>`
      : `<p style="text-align:center;color:#999;padding:24px">Sin ventas aún</p>`;

    const porMes = Array(6).fill(0);
    const mesActual = new Date().getMonth();
    ventas.forEach(v => {
      const idx = 5 - (mesActual - new Date(v.createdAt).getMonth() + 12) % 12;
      if (idx >= 0 && idx < 6) porMes[idx] += parseFloat(v.total || 0);
    });
    const maxVal = Math.max(...porMes, 1);
    document.querySelectorAll("#dash-chart-ventas .bar").forEach((b, i) => { b.style.height = Math.round(porMes[i] / maxVal * 100) + "%"; });
  } catch (err) { console.error("Error dashboard:", err); }
}

/* ══════════════════════════════════════════
   CLIENTES
══════════════════════════════════════════ */
let clientesData = [];
async function cargarClientes() {
  const search = document.getElementById("cli-search")?.value || "";
  const tipo   = document.getElementById("cli-tipo")?.value   || "";
  const res = await apiFetch(`/clientes?search=${encodeURIComponent(search)}&tipo=${tipo}`);
  if (!res) return;
  const { clientes, stats } = await res.json();
  clientesData = clientes;
  setText("cli-total", stats.total); setText("cli-total-change", "Total registrados");
  setText("cli-frecuentes", stats.frecuentes); setText("cli-frecuentes-sub", "Con compras pagadas");
  setText("cli-deuda", fmt(stats.deuda)); setText("cli-deuda-sub", "Facturas pendientes");
  document.getElementById("cli-tbody").innerHTML = clientes.length
    ? clientes.map(c=>`<tr>
        <td><strong>${c.nombre}</strong></td>
        <td>${c.tipo==="empresa"?"🏢 Empresa":"👤 Natural"}</td>
        <td>${c.ruc_ci||"—"}</td><td>${c.email||"—"}</td><td>${c.telefono||"—"}</td>
        <td>${fmt(c.total_compras)}</td><td>${badgeEstado(c.estado)}</td>
        <td>
          <button class="btn btn-secondary" style="padding:4px 10px;font-size:12px" onclick="editarCliente(${c.id})">✏️</button>
          <button class="btn btn-secondary" style="padding:4px 10px;font-size:12px;margin-left:4px" onclick="eliminarCliente(${c.id})">🗑️</button>
        </td></tr>`).join("")
    : `<tr><td colspan="8" style="text-align:center;color:#999;padding:30px">Sin clientes</td></tr>`;
}
async function guardarCliente(datos, id=null) {
  const res = await apiFetch(id?`/clientes/${id}`:"/clientes",{method:id?"PUT":"POST",body:JSON.stringify(datos)});
  if(!res)return; await cargarClientes(); cerrarModal();
}
async function eliminarCliente(id) {
  if(!confirm("¿Eliminar este cliente?"))return;
  await apiFetch(`/clientes/${id}`,{method:"DELETE"}); cargarClientes();
}
function editarCliente(id) {
  const c=clientesData.find(x=>x.id===id); if(!c)return;
  abrirModal("Editar Cliente",formCliente(c),()=>guardarCliente(recogerFormCliente(),id));
}
function formCliente(c={}) {
  return `<div class="form-grid">
    <div class="form-group full"><label>Nombre *</label><input id="m-nombre" value="${c.nombre||""}" placeholder="Nombre completo"/></div>
    <div class="form-group"><label>Tipo</label><select id="m-tipo"><option value="natural" ${c.tipo==="natural"?"selected":""}>Persona Natural</option><option value="empresa" ${c.tipo==="empresa"?"selected":""}>Empresa</option></select></div>
    <div class="form-group"><label>RUC/CI</label><input id="m-ruc" value="${c.ruc_ci||""}" placeholder="0000000000"/></div>
    <div class="form-group"><label>Email</label><input id="m-email" type="email" value="${c.email||""}" placeholder="email@ejemplo.com"/></div>
    <div class="form-group"><label>Teléfono</label><input id="m-telefono" value="${c.telefono||""}" placeholder="300 000 0000"/></div>
    <div class="form-group full"><label>Dirección</label><input id="m-direccion" value="${c.direccion||""}" placeholder="Dirección"/></div>
  </div>`;
}
function recogerFormCliente() {
  return {nombre:document.getElementById("m-nombre").value,tipo:document.getElementById("m-tipo").value,ruc_ci:document.getElementById("m-ruc").value,email:document.getElementById("m-email").value,telefono:document.getElementById("m-telefono").value,direccion:document.getElementById("m-direccion").value};
}

/* ══════════════════════════════════════════
   INVENTARIO
══════════════════════════════════════════ */
let inventarioData = [];
async function cargarInventario() {
  const search    = document.getElementById("inv-search")?.value     || "";
  const categoria = document.getElementById("inv-categoria")?.value  || "";
  const stock     = document.getElementById("inv-stock-filtro")?.value|| "";
  const res = await apiFetch(`/inventario?search=${encodeURIComponent(search)}&categoria=${encodeURIComponent(categoria)}&stock=${stock}`);
  if(!res)return;
  const {productos,categorias,stats}=await res.json();
  inventarioData=productos;
  setText("inv-total",stats.total); setText("inv-total-sub","Productos activos");
  setText("inv-valor",fmt(stats.valor)); setText("inv-valor-change","Valor en stock");
  setText("inv-bajo",stats.bajo); setText("inv-bajo-sub","Requieren reposición");
  setText("inv-sin",stats.sinStock); setText("inv-sin-sub","Agotados");
  const sel=document.getElementById("inv-categoria");
  if(sel){const cur=sel.value;sel.innerHTML=`<option value="">Todas las categorías</option>`+categorias.map(c=>`<option value="${c}" ${c===cur?"selected":""}>${c}</option>`).join("");}
  document.getElementById("inv-tbody").innerHTML=productos.length
    ?productos.map(p=>{const sb=p.stock===0?`<span class="badge badge-red">Sin Stock</span>`:p.stock<=p.stock_minimo?`<span class="badge badge-orange">Stock Bajo</span>`:`<span class="badge badge-green">Normal</span>`;
      return`<tr><td>${p.codigo||"—"}</td><td><strong>${p.nombre}</strong></td><td>${p.categoria||"—"}</td><td><strong>${p.stock}</strong></td><td>${fmt(p.precio_costo)}</td><td>${fmt(p.precio_venta)}</td><td>${sb}</td>
        <td><button class="btn btn-secondary" style="padding:4px 10px;font-size:12px" onclick="editarProducto(${p.id})">✏️</button><button class="btn btn-secondary" style="padding:4px 10px;font-size:12px;margin-left:4px" onclick="eliminarProducto(${p.id})">🗑️</button></td></tr>`;}).join("")
    :`<tr><td colspan="8" style="text-align:center;color:#999;padding:30px">Sin productos</td></tr>`;
}
async function guardarProducto(datos,id=null){const res=await apiFetch(id?`/inventario/${id}`:"/inventario",{method:id?"PUT":"POST",body:JSON.stringify(datos)});if(!res)return;await cargarInventario();cerrarModal();}
async function eliminarProducto(id){if(!confirm("¿Eliminar?"))return;await apiFetch(`/inventario/${id}`,{method:"DELETE"});cargarInventario();}
function editarProducto(id){const p=inventarioData.find(x=>x.id===id);if(!p)return;abrirModal("Editar Producto",formProducto(p),()=>guardarProducto(recogerFormProducto(),id));}
function formProducto(p={}){return`<div class="form-grid"><div class="form-group full"><label>Nombre *</label><input id="m-nombre" value="${p.nombre||""}" placeholder="Nombre del producto"/></div><div class="form-group"><label>Código</label><input id="m-codigo" value="${p.codigo||""}" placeholder="SKU-001"/></div><div class="form-group"><label>Categoría</label><input id="m-categoria" value="${p.categoria||""}" placeholder="Electrónica..."/></div><div class="form-group"><label>Stock</label><input id="m-stock" type="number" value="${p.stock||0}" min="0"/></div><div class="form-group"><label>Stock Mínimo</label><input id="m-stock-min" type="number" value="${p.stock_minimo||5}" min="0"/></div><div class="form-group"><label>Precio Costo</label><input id="m-costo" type="number" value="${p.precio_costo||0}" min="0" step="0.01"/></div><div class="form-group"><label>Precio Venta</label><input id="m-venta" type="number" value="${p.precio_venta||0}" min="0" step="0.01"/></div><div class="form-group full"><label>Descripción</label><textarea id="m-desc">${p.descripcion||""}</textarea></div></div>`;}
function recogerFormProducto(){return{nombre:document.getElementById("m-nombre").value,codigo:document.getElementById("m-codigo").value,categoria:document.getElementById("m-categoria").value,stock:parseInt(document.getElementById("m-stock").value)||0,stock_minimo:parseInt(document.getElementById("m-stock-min").value)||5,precio_costo:parseFloat(document.getElementById("m-costo").value)||0,precio_venta:parseFloat(document.getElementById("m-venta").value)||0,descripcion:document.getElementById("m-desc").value};}

/* ══════════════════════════════════════════
   VENTAS
══════════════════════════════════════════ */
let ventasData=[], productosCache=[];
async function cargarVentas(){
  const search=document.getElementById("v-search")?.value||"";
  const estado=document.getElementById("v-estado")?.value||"";
  const res=await apiFetch(`/ventas?search=${encodeURIComponent(search)}&estado=${estado}`);
  if(!res)return;
  const{ventas,stats}=await res.json();
  ventasData=ventas;
  setText("v-hoy",fmt(stats.hoy));setText("v-hoy-change","Pagadas hoy");
  setText("v-mes",fmt(stats.mes));setText("v-mes-change","Pagadas este mes");
  setText("v-pendientes",stats.pendientes);setText("v-pendientes-sub","Por cobrar");
  setText("v-ticket",fmt(stats.ticket));setText("v-ticket-change","Promedio por venta");
  setText("v-total-registros",`${ventas.length} registros`);
  document.getElementById("v-tbody").innerHTML=ventas.length
    ?ventas.map(v=>`<tr><td><strong>${v.numero}</strong></td><td>${new Date(v.createdAt).toLocaleDateString("es-CO")}</td><td>${v.cliente?.nombre||"Sin cliente"}</td><td>${v.detalles?.length||0} item(s)</td><td><strong>${fmt(v.total)}</strong></td><td>${badgeEstado(v.estado)}</td>
      <td><button class="btn btn-secondary" style="padding:4px 10px;font-size:12px" onclick="cambiarEstadoVenta(${v.id},'${v.estado}')">✏️</button><button class="btn btn-secondary" style="padding:4px 10px;font-size:12px;margin-left:4px" onclick="anularVenta(${v.id})">🗑️</button></td></tr>`).join("")
    :`<tr><td colspan="7" style="text-align:center;color:#999;padding:30px">Sin ventas</td></tr>`;
}
async function anularVenta(id){if(!confirm("¿Anular?"))return;await apiFetch(`/ventas/${id}`,{method:"DELETE"});cargarVentas();}
function cambiarEstadoVenta(id,est){
  abrirModal("Cambiar Estado",`<div class="form-group"><label>Nuevo Estado</label><select id="m-estado"><option value="pendiente" ${est==="pendiente"?"selected":""}>Pendiente</option><option value="pagado" ${est==="pagado"?"selected":""}>Pagado</option><option value="anulado" ${est==="anulado"?"selected":""}>Anulado</option></select></div>`,
    async()=>{await apiFetch(`/ventas/${id}`,{method:"PUT",body:JSON.stringify({estado:document.getElementById("m-estado").value})});await cargarVentas();cerrarModal();});
}
async function abrirModalNuevaVenta(){
  const[rC,rI]=await Promise.all([apiFetch("/clientes"),apiFetch("/inventario")]);
  if(!rC||!rI)return;
  const{clientes}=await rC.json();const{productos}=await rI.json();
  productosCache=productos;
  const html=`<div class="form-grid">
    <div class="form-group full"><label>Cliente</label><select id="m-cliente"><option value="">Sin cliente</option>${clientes.map(c=>`<option value="${c.id}">${c.nombre}</option>`).join("")}</select></div>
    <div class="form-group"><label>Estado</label><select id="m-estado"><option value="pendiente">Pendiente</option><option value="pagado">Pagado</option></select></div>
    <div class="form-group"><label>IVA ($)</label><input id="m-iva" type="number" value="0" min="0" step="0.01" oninput="calcularTotalVenta()"/></div>
  </div>
  <div style="margin-top:16px"><label style="font-size:11px;font-weight:700;color:#999;text-transform:uppercase">Productos</label>
  <div id="m-detalles" style="margin-top:8px"></div>
  <button type="button" class="btn btn-secondary" style="margin-top:8px;width:100%" onclick="agregarItemVenta()">+ Agregar Producto</button></div>
  <div style="margin-top:12px;text-align:right;font-size:16px;font-weight:800">Total: <span id="m-total">$0</span></div>`;
  abrirModal("Nueva Venta",html,async()=>{
    const detalles=[...document.querySelectorAll(".item-venta")].map(row=>({producto_id:parseInt(row.querySelector(".item-prod").value),cantidad:parseInt(row.querySelector(".item-cant").value)})).filter(d=>d.producto_id&&d.cantidad>0);
    const res=await apiFetch("/ventas",{method:"POST",body:JSON.stringify({cliente_id:document.getElementById("m-cliente").value||null,estado:document.getElementById("m-estado").value,impuesto:parseFloat(document.getElementById("m-iva").value)||0,detalles})});
    if(!res)return;const data=await res.json();if(data.error){alert(data.error);return;}await cargarVentas();cerrarModal();
  });
  agregarItemVenta();
}
function agregarItemVenta(){
  const cont=document.getElementById("m-detalles");if(!cont)return;
  const div=document.createElement("div");div.className="item-venta";div.style.cssText="display:flex;gap:8px;margin-bottom:8px;align-items:center";
  div.innerHTML=`<select class="item-prod" style="flex:2;padding:8px;border:1.5px solid #e8eaf2;border-radius:8px;font-family:Nunito,sans-serif"><option value="">Seleccionar...</option>${productosCache.map(p=>`<option value="${p.id}" data-precio="${p.precio_venta}">${p.nombre} (Stock:${p.stock})</option>`).join("")}</select><input class="item-cant" type="number" value="1" min="1" style="width:70px;padding:8px;border:1.5px solid #e8eaf2;border-radius:8px;font-family:Nunito,sans-serif"/><button type="button" onclick="this.parentElement.remove();calcularTotalVenta()" style="background:#ffe8e8;border:none;border-radius:8px;padding:8px 10px;cursor:pointer;color:#dc2626;font-weight:700">✕</button>`;
  div.querySelector(".item-cant").addEventListener("input",calcularTotalVenta);
  div.querySelector(".item-prod").addEventListener("change",calcularTotalVenta);
  cont.appendChild(div);
}
function calcularTotalVenta(){
  let total=0;
  document.querySelectorAll(".item-venta").forEach(row=>{const sel=row.querySelector(".item-prod");const precio=parseFloat(sel.options[sel.selectedIndex]?.dataset?.precio||0);total+=precio*(parseInt(row.querySelector(".item-cant").value)||0);});
  const el=document.getElementById("m-total");if(el)el.textContent=fmt(total+(parseFloat(document.getElementById("m-iva")?.value)||0));
}

/* ══════════════════════════════════════════
   GASTOS
══════════════════════════════════════════ */
let gastosData=[];
async function cargarGastos(){
  const res=await apiFetch("/gastos");if(!res)return;
  const{gastos,porCategoria,stats}=await res.json();gastosData=gastos;
  setText("gas-mes",fmt(stats.mes));setText("gas-mes-change","Gastos del mes");
  setText("gas-mayor",stats.mayor?fmt(stats.mayor.monto):"—");setText("gas-mayor-sub",stats.mayor?.descripcion||"Sin datos");
  setText("gas-hoy",fmt(stats.hoy));setText("gas-hoy-sub","Registrados hoy");
  setText("gas-presupuesto","—");setText("gas-presupuesto-sub","Sin presupuesto definido");
  const maxCat=Math.max(...porCategoria.map(c=>parseFloat(c.total)),1);
  document.getElementById("gas-categorias").innerHTML=porCategoria.length
    ?porCategoria.map(c=>`<div style="margin-bottom:14px"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:13px;font-weight:600">${c.categoria||"Sin categoría"}</span><span style="font-size:13px;font-weight:700">${fmt(c.total)}</span></div><div class="progress-bar"><div class="progress-fill" style="width:${Math.round(parseFloat(c.total)/maxCat*100)}%;background:var(--blue)"></div></div></div>`).join("")
    :`<p style="color:#999;text-align:center;padding:20px">Sin gastos</p>`;
  document.getElementById("gas-tbody").innerHTML=gastos.slice(0,10).length
    ?gastos.slice(0,10).map(g=>`<tr><td>${g.descripcion}</td><td>${g.categoria||"—"}</td><td><strong>${fmt(g.monto)}</strong></td><td><button class="btn btn-secondary" style="padding:4px 10px;font-size:12px" onclick="editarGasto(${g.id})">✏️</button><button class="btn btn-secondary" style="padding:4px 10px;font-size:12px;margin-left:4px" onclick="eliminarGasto(${g.id})">🗑️</button></td></tr>`).join("")
    :`<tr><td colspan="4" style="text-align:center;color:#999;padding:30px">Sin gastos</td></tr>`;
}
async function guardarGasto(datos,id=null){const res=await apiFetch(id?`/gastos/${id}`:"/gastos",{method:id?"PUT":"POST",body:JSON.stringify(datos)});if(!res)return;await cargarGastos();cerrarModal();}
async function eliminarGasto(id){if(!confirm("¿Eliminar?"))return;await apiFetch(`/gastos/${id}`,{method:"DELETE"});cargarGastos();}
function editarGasto(id){const g=gastosData.find(x=>x.id===id);if(!g)return;abrirModal("Editar Gasto",formGasto(g),()=>guardarGasto(recogerFormGasto(),id));}
function formGasto(g={}){return`<div class="form-grid"><div class="form-group full"><label>Descripción *</label><input id="m-desc" value="${g.descripcion||""}" placeholder="Ej: Pago arriendo"/></div><div class="form-group"><label>Categoría</label><input id="m-categoria" value="${g.categoria||""}" placeholder="Servicios, Arriendo..."/></div><div class="form-group"><label>Monto *</label><input id="m-monto" type="number" value="${g.monto||""}" min="0" step="0.01"/></div><div class="form-group"><label>Fecha</label><input id="m-fecha" type="date" value="${g.fecha||new Date().toISOString().split("T")[0]}"/></div><div class="form-group full"><label>Notas</label><textarea id="m-notas">${g.notas||""}</textarea></div></div>`;}
function recogerFormGasto(){return{descripcion:document.getElementById("m-desc").value,categoria:document.getElementById("m-categoria").value,monto:parseFloat(document.getElementById("m-monto").value)||0,fecha:document.getElementById("m-fecha").value,notas:document.getElementById("m-notas").value};}

/* ══════════════════════════════════════════
   PROVEEDORES
══════════════════════════════════════════ */
let proveedoresData=[];
async function cargarProveedores(){
  const search=document.getElementById("prov-search")?.value||"";
  const categoria=document.getElementById("prov-categoria")?.value||"";
  const res=await apiFetch(`/proveedores?search=${encodeURIComponent(search)}&categoria=${encodeURIComponent(categoria)}`);
  if(!res)return;
  const{proveedores,categorias,stats}=await res.json();proveedoresData=proveedores;
  setText("prov-total",stats.total);setText("prov-total-sub","Total registrados");
  setText("prov-compras",fmt(stats.comprasMes));setText("prov-compras-change","Este mes");
  setText("prov-pagar",fmt(stats.porPagar));setText("prov-pagar-sub","Órdenes pendientes");
  const sel=document.getElementById("prov-categoria");
  if(sel){const cur=sel.value;sel.innerHTML=`<option value="">Todas las categorías</option>`+categorias.map(c=>`<option value="${c}" ${c===cur?"selected":""}>${c}</option>`).join("");}
  document.getElementById("prov-tbody").innerHTML=proveedores.length
    ?proveedores.map(p=>`<tr><td><strong>${p.nombre}</strong></td><td>${p.categoria||"—"}</td><td>${p.contacto||"—"}</td><td>${p.email||"—"}</td><td>${fmt(p.total_compras)}</td><td>${fmt(p.saldo_pendiente)}</td><td>${badgeEstado(p.estado)}</td>
      <td><button class="btn btn-secondary" style="padding:4px 10px;font-size:12px" onclick="editarProveedor(${p.id})">✏️</button><button class="btn btn-secondary" style="padding:4px 10px;font-size:12px;margin-left:4px" onclick="eliminarProveedor(${p.id})">🗑️</button></td></tr>`).join("")
    :`<tr><td colspan="8" style="text-align:center;color:#999;padding:30px">Sin proveedores</td></tr>`;
}
async function guardarProveedor(datos,id=null){const res=await apiFetch(id?`/proveedores/${id}`:"/proveedores",{method:id?"PUT":"POST",body:JSON.stringify(datos)});if(!res)return;await cargarProveedores();cerrarModal();}
async function eliminarProveedor(id){if(!confirm("¿Eliminar?"))return;await apiFetch(`/proveedores/${id}`,{method:"DELETE"});cargarProveedores();}
function editarProveedor(id){const p=proveedoresData.find(x=>x.id===id);if(!p)return;abrirModal("Editar Proveedor",formProveedor(p),()=>guardarProveedor(recogerFormProveedor(),id));}
function formProveedor(p={}){return`<div class="form-grid"><div class="form-group full"><label>Nombre *</label><input id="m-nombre" value="${p.nombre||""}" placeholder="Nombre del proveedor"/></div><div class="form-group"><label>Categoría</label><input id="m-categoria" value="${p.categoria||""}" placeholder="Tecnología, Alimentos..."/></div><div class="form-group"><label>Contacto</label><input id="m-contacto" value="${p.contacto||""}" placeholder="Nombre del contacto"/></div><div class="form-group"><label>Email</label><input id="m-email" type="email" value="${p.email||""}" placeholder="proveedor@email.com"/></div><div class="form-group"><label>Teléfono</label><input id="m-telefono" value="${p.telefono||""}" placeholder="300 000 0000"/></div><div class="form-group"><label>RUC</label><input id="m-ruc" value="${p.ruc||""}" placeholder="0000000000001"/></div><div class="form-group full"><label>Dirección</label><input id="m-direccion" value="${p.direccion||""}" placeholder="Dirección"/></div></div>`;}
function recogerFormProveedor(){return{nombre:document.getElementById("m-nombre").value,categoria:document.getElementById("m-categoria").value,contacto:document.getElementById("m-contacto").value,email:document.getElementById("m-email").value,telefono:document.getElementById("m-telefono").value,ruc:document.getElementById("m-ruc").value,direccion:document.getElementById("m-direccion").value};}

/* ══════════════════════════════════════════
   EMPLEADOS
══════════════════════════════════════════ */
let empleadosData=[];
async function cargarEmpleados(){
  const search=document.getElementById("emp-search")?.value||"";
  const depto=document.getElementById("emp-depto")?.value||"";
  const res=await apiFetch(`/empleados?search=${encodeURIComponent(search)}&departamento=${encodeURIComponent(depto)}`);
  if(!res)return;
  const{empleados,departamentos,stats}=await res.json();empleadosData=empleados;
  setText("emp-total",stats.total);setText("emp-total-sub","Empleados activos");
  setText("emp-deptos",stats.deptos);setText("emp-deptos-sub","Departamentos");
  setText("emp-vacaciones",stats.vacaciones);setText("emp-vacaciones-sub","En vacaciones");
  const sel=document.getElementById("emp-depto");
  if(sel){const cur=sel.value;sel.innerHTML=`<option value="">Todos los departamentos</option>`+departamentos.map(d=>`<option value="${d}" ${d===cur?"selected":""}>${d}</option>`).join("");}
  document.getElementById("emp-tbody").innerHTML=empleados.length
    ?empleados.map(e=>`<tr><td><strong>${e.nombre}</strong></td><td>${e.cargo||"—"}</td><td>${e.departamento||"—"}</td><td>${e.email||"—"}</td><td>${e.telefono||"—"}</td><td>${e.fecha_ingreso||"—"}</td><td>${badgeEstado(e.estado)}</td>
      <td><button class="btn btn-secondary" style="padding:4px 10px;font-size:12px" onclick="editarEmpleado(${e.id})">✏️</button><button class="btn btn-secondary" style="padding:4px 10px;font-size:12px;margin-left:4px" onclick="eliminarEmpleado(${e.id})">🗑️</button></td></tr>`).join("")
    :`<tr><td colspan="8" style="text-align:center;color:#999;padding:30px">Sin empleados</td></tr>`;
}
async function guardarEmpleado(datos,id=null){const res=await apiFetch(id?`/empleados/${id}`:"/empleados",{method:id?"PUT":"POST",body:JSON.stringify(datos)});if(!res)return;await cargarEmpleados();cerrarModal();}
async function eliminarEmpleado(id){if(!confirm("¿Eliminar?"))return;await apiFetch(`/empleados/${id}`,{method:"DELETE"});cargarEmpleados();}
function editarEmpleado(id){const e=empleadosData.find(x=>x.id===id);if(!e)return;abrirModal("Editar Empleado",formEmpleado(e),()=>guardarEmpleado(recogerFormEmpleado(),id));}
function formEmpleado(e={}){return`<div class="form-grid"><div class="form-group full"><label>Nombre *</label><input id="m-nombre" value="${e.nombre||""}" placeholder="Nombre completo"/></div><div class="form-group"><label>Cargo</label><input id="m-cargo" value="${e.cargo||""}" placeholder="Desarrollador, Contador..."/></div><div class="form-group"><label>Departamento</label><input id="m-depto" value="${e.departamento||""}" placeholder="Tecnología, Finanzas..."/></div><div class="form-group"><label>Email</label><input id="m-email" type="email" value="${e.email||""}" placeholder="empleado@email.com"/></div><div class="form-group"><label>Teléfono</label><input id="m-telefono" value="${e.telefono||""}" placeholder="300 000 0000"/></div><div class="form-group"><label>Fecha Ingreso</label><input id="m-ingreso" type="date" value="${e.fecha_ingreso||""}"/></div><div class="form-group"><label>Sueldo Base</label><input id="m-sueldo" type="number" value="${e.sueldo_base||0}" min="0" step="0.01"/></div><div class="form-group"><label>Estado</label><select id="m-estado"><option value="activo" ${e.estado==="activo"?"selected":""}>Activo</option><option value="vacaciones" ${e.estado==="vacaciones"?"selected":""}>Vacaciones</option><option value="inactivo" ${e.estado==="inactivo"?"selected":""}>Inactivo</option></select></div></div>`;}
function recogerFormEmpleado(){return{nombre:document.getElementById("m-nombre").value,cargo:document.getElementById("m-cargo").value,departamento:document.getElementById("m-depto").value,email:document.getElementById("m-email").value,telefono:document.getElementById("m-telefono").value,fecha_ingreso:document.getElementById("m-ingreso").value,sueldo_base:parseFloat(document.getElementById("m-sueldo").value)||0,estado:document.getElementById("m-estado").value};}

/* ══════════════════════════════════════════
   COMPRAS
══════════════════════════════════════════ */
let comprasData=[], proveedoresCache=[];
async function cargarCompras(){
  const search=document.getElementById("comp-search")?.value||"";
  const estado=document.getElementById("comp-estado")?.value||"";
  const res=await apiFetch(`/compras?search=${encodeURIComponent(search)}&estado=${estado}`);
  if(!res)return;
  const{compras,stats}=await res.json();comprasData=compras;
  setText("comp-ordenes",stats.ordenes);setText("comp-ordenes-sub","Este mes");
  setText("comp-monto",fmt(stats.monto));setText("comp-monto-change","Comprado este mes");
  setText("comp-recibir",stats.recibir);setText("comp-recibir-sub","Órdenes en camino");
  setText("comp-pagar",fmt(stats.pagar));setText("comp-pagar-sub","Facturas pendientes");
  document.getElementById("comp-tbody").innerHTML=compras.length
    ?compras.map(c=>`<tr><td><strong>${c.numero}</strong></td><td>${new Date(c.createdAt).toLocaleDateString("es-CO")}</td><td>${c.proveedor?.nombre||"—"}</td><td>${c.detalles?.length||0} item(s)</td><td><strong>${fmt(c.total)}</strong></td><td>${badgeEstado(c.estado)}</td>
      <td><button class="btn btn-secondary" style="padding:4px 10px;font-size:12px" onclick="cambiarEstadoCompra(${c.id},'${c.estado}')">✏️</button><button class="btn btn-secondary" style="padding:4px 10px;font-size:12px;margin-left:4px" onclick="eliminarCompra(${c.id})">🗑️</button></td></tr>`).join("")
    :`<tr><td colspan="7" style="text-align:center;color:#999;padding:30px">Sin órdenes de compra</td></tr>`;
}
async function eliminarCompra(id){if(!confirm("¿Eliminar?"))return;await apiFetch(`/compras/${id}`,{method:"DELETE"});cargarCompras();}
function cambiarEstadoCompra(id,est){
  abrirModal("Cambiar Estado",`<div class="form-group"><label>Nuevo Estado</label><select id="m-estado"><option value="pendiente" ${est==="pendiente"?"selected":""}>Pendiente</option><option value="transito" ${est==="transito"?"selected":""}>En tránsito</option><option value="recibido" ${est==="recibido"?"selected":""}>Recibido</option></select></div>`,
    async()=>{await apiFetch(`/compras/${id}`,{method:"PUT",body:JSON.stringify({estado:document.getElementById("m-estado").value})});await cargarCompras();cerrarModal();});
}
async function abrirModalNuevaCompra(){
  const[rP,rI]=await Promise.all([apiFetch("/proveedores"),apiFetch("/inventario")]);
  if(!rP||!rI)return;
  const{proveedores}=await rP.json();const{productos}=await rI.json();
  proveedoresCache=proveedores;productosCache=productos;
  const html=`<div class="form-grid">
    <div class="form-group full"><label>Proveedor</label><select id="m-proveedor"><option value="">Sin proveedor</option>${proveedores.map(p=>`<option value="${p.id}">${p.nombre}</option>`).join("")}</select></div>
    <div class="form-group"><label>Estado</label><select id="m-estado"><option value="pendiente">Pendiente</option><option value="transito">En tránsito</option><option value="recibido">Recibido</option></select></div>
    <div class="form-group full"><label>Notas</label><input id="m-notas" placeholder="Notas adicionales"/></div>
  </div>
  <div style="margin-top:16px"><label style="font-size:11px;font-weight:700;color:#999;text-transform:uppercase">Productos</label>
  <div id="m-detalles" style="margin-top:8px"></div>
  <button type="button" class="btn btn-secondary" style="margin-top:8px;width:100%" onclick="agregarItemCompra()">+ Agregar Producto</button></div>
  <div style="margin-top:12px;text-align:right;font-size:16px;font-weight:800">Total: <span id="m-total">$0</span></div>`;
  abrirModal("Nueva Orden de Compra",html,async()=>{
    const detalles=[...document.querySelectorAll(".item-compra")].map(row=>({producto_id:parseInt(row.querySelector(".item-prod").value),cantidad:parseInt(row.querySelector(".item-cant").value)})).filter(d=>d.producto_id&&d.cantidad>0);
    const res=await apiFetch("/compras",{method:"POST",body:JSON.stringify({proveedor_id:document.getElementById("m-proveedor").value||null,estado:document.getElementById("m-estado").value,notas:document.getElementById("m-notas").value,detalles})});
    if(!res)return;const data=await res.json();if(data.error){alert(data.error);return;}await cargarCompras();cerrarModal();
  });
  agregarItemCompra();
}
function agregarItemCompra(){
  const cont=document.getElementById("m-detalles");if(!cont)return;
  const div=document.createElement("div");div.className="item-compra";div.style.cssText="display:flex;gap:8px;margin-bottom:8px;align-items:center";
  div.innerHTML=`<select class="item-prod" style="flex:2;padding:8px;border:1.5px solid #e8eaf2;border-radius:8px;font-family:Nunito,sans-serif"><option value="">Seleccionar...</option>${productosCache.map(p=>`<option value="${p.id}" data-precio="${p.precio_costo}">${p.nombre}</option>`).join("")}</select><input class="item-cant" type="number" value="1" min="1" style="width:70px;padding:8px;border:1.5px solid #e8eaf2;border-radius:8px;font-family:Nunito,sans-serif"/><button type="button" onclick="this.parentElement.remove();calcularTotalCompra()" style="background:#ffe8e8;border:none;border-radius:8px;padding:8px 10px;cursor:pointer;color:#dc2626;font-weight:700">✕</button>`;
  div.querySelector(".item-cant").addEventListener("input",calcularTotalCompra);
  div.querySelector(".item-prod").addEventListener("change",calcularTotalCompra);
  cont.appendChild(div);
}
function calcularTotalCompra(){
  let total=0;
  document.querySelectorAll(".item-compra").forEach(row=>{const sel=row.querySelector(".item-prod");const precio=parseFloat(sel.options[sel.selectedIndex]?.dataset?.precio||0);total+=precio*(parseInt(row.querySelector(".item-cant").value)||0);});
  const el=document.getElementById("m-total");if(el)el.textContent=fmt(total);
}

/* ══════════════════════════════════════════
   NÓMINA
══════════════════════════════════════════ */
let nominaData=[];
async function cargarNomina(){
  const mes=new Date().toISOString().slice(0,7);
  const res=await apiFetch(`/nomina?mes=${mes}`);if(!res)return;
  const{registros,stats}=await res.json();nominaData=registros;
  setText("nom-empleados",stats.totalEmpleados);setText("nom-empleados-sub","Empleados activos");
  setText("nom-total",fmt(stats.nominaMes));setText("nom-fecha",`Mes: ${mes}`);
  setText("nom-pagado",fmt(stats.pagado));setText("nom-pagado-sub","Procesado este mes");
  setText("nom-beneficios",fmt(stats.beneficios));setText("nom-beneficios-sub","Total horas extra");
  const badge=registros.length&&registros.every(r=>r.estado==="pagado")?`<span class="badge badge-green">Pagada</span>`:`<span class="badge badge-orange">Pendiente</span>`;
  setText("nom-estado-badge","");const badgeEl=document.getElementById("nom-estado-badge");if(badgeEl)badgeEl.innerHTML=badge;
  document.getElementById("nom-tbody").innerHTML=registros.length
    ?registros.map(r=>`<tr><td><strong>${r.empleado?.nombre||"—"}</strong></td><td>${r.empleado?.cargo||"—"}</td><td>${r.empleado?.departamento||"—"}</td><td>${fmt(r.sueldo_base)}</td><td>${fmt(r.horas_extra)}</td><td>${fmt(r.descuentos)}</td><td><strong>${fmt(r.neto)}</strong></td>
      <td><button class="btn btn-secondary" style="padding:4px 10px;font-size:12px" onclick="editarNomina(${r.id})">✏️</button></td></tr>`).join("")
    :`<tr><td colspan="8" style="text-align:center;color:#999;padding:30px">Sin registros — click en "Generar Roles"</td></tr>`;
}
async function generarNomina(){
  if(!confirm("¿Generar nómina para todos los empleados activos de este mes?"))return;
  const res=await apiFetch("/nomina/generar",{method:"POST",body:JSON.stringify({})});
  if(!res)return;const data=await res.json();alert(data.mensaje);cargarNomina();
}
async function procesarPagoNomina(){
  if(!confirm("¿Marcar toda la nómina de este mes como PAGADA?"))return;
  const res=await apiFetch("/nomina/pagar",{method:"POST",body:JSON.stringify({})});
  if(!res)return;const data=await res.json();alert(data.mensaje);cargarNomina();
}
function editarNomina(id){
  const r=nominaData.find(x=>x.id===id);if(!r)return;
  abrirModal("Editar Registro Nómina",`<div class="form-grid">
    <div class="form-group"><label>Horas Extra ($)</label><input id="m-horas" type="number" value="${r.horas_extra||0}" min="0" step="0.01"/></div>
    <div class="form-group"><label>Descuentos ($)</label><input id="m-desc" type="number" value="${r.descuentos||0}" min="0" step="0.01"/></div>
    <div class="form-group"><label>Estado</label><select id="m-estado"><option value="pendiente" ${r.estado==="pendiente"?"selected":""}>Pendiente</option><option value="pagado" ${r.estado==="pagado"?"selected":""}>Pagado</option></select></div>
  </div>`,
    async()=>{await apiFetch(`/nomina/${id}`,{method:"PUT",body:JSON.stringify({horas_extra:parseFloat(document.getElementById("m-horas").value)||0,descuentos:parseFloat(document.getElementById("m-desc").value)||0,estado:document.getElementById("m-estado").value})});await cargarNomina();cerrarModal();});
}

/* ══════════════════════════════════════════
   MODAL GENÉRICO
══════════════════════════════════════════ */
function abrirModal(titulo,htmlContenido,onGuardar){
  let modal=document.getElementById("modal-global");
  if(!modal){modal=document.createElement("div");modal.id="modal-global";modal.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px";document.body.appendChild(modal);}
  modal.innerHTML=`<div style="background:#fff;border-radius:16px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.2)"><div style="padding:20px 24px;border-bottom:1px solid #f0f2f8;display:flex;justify-content:space-between;align-items:center"><span style="font-size:16px;font-weight:800;color:#1a1f36">${titulo}</span><button onclick="cerrarModal()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#999">✕</button></div><div style="padding:24px">${htmlContenido}</div><div style="padding:16px 24px;border-top:1px solid #f0f2f8;display:flex;justify-content:flex-end;gap:10px"><button class="btn btn-secondary" onclick="cerrarModal()">Cancelar</button><button class="btn btn-primary" id="modal-guardar-btn">Guardar</button></div></div>`;
  modal.style.display="flex";
  document.getElementById("modal-guardar-btn").onclick=onGuardar;
}
function cerrarModal(){const m=document.getElementById("modal-global");if(m)m.style.display="none";}
function toggleNotif(el){el.classList.toggle("on");el.classList.toggle("off");}