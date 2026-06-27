/**
 * composicion.js — Consulta de productos por principio activo (Vendedor)
 *
 * El vendedor escribe un ingrediente activo (ej: "Amoxicilina") y ve todos
 * los productos que lo contienen, con su composición completa, laboratorio,
 * precio de venta y stock disponible. Así puede ofrecer la mejor alternativa.
 */
import { composicionService } from '../api.js';
import { lucideIcon, escHtml, fmtMoney, fmtDate, daysUntil } from '../sidebar.js';

let _resultados   = [];
let _debounceAC;   // autocomplete debounce
let _debounceSearch; // búsqueda principal debounce

export async function render(container) {
  container.innerHTML = `
    <div class="page-container">

      <!-- Header -->
      <div class="page-header anim-fade-up">
        <div>
          <h1 class="large-title">Buscar por Composición</h1>
          <p class="page-subtitle">
            Encuentra todos los productos que contienen un principio activo,
            compara laboratorios y precios
          </p>
        </div>
      </div>

      <!-- Buscador principal -->
      <div class="glass-card anim-fade-up" style="padding:1.5rem; margin-bottom:1.5rem;">
        <div style="max-width:38rem; margin:0 auto;">
          <label class="form-label" style="font-size:0.9375rem; margin-bottom:0.625rem;">
            ${lucideIcon('flask-conical', 16)}
            Principio activo o ingrediente
          </label>
          <div style="position:relative;">
            <div class="input-icon-wrap">
              <span class="icon">${lucideIcon('search', 18)}</span>
              <input id="search-ingrediente"
                     type="text"
                     class="input"
                     style="padding-left:2.75rem; font-size:1rem; height:3rem;"
                     placeholder='Ej: Amoxicilina, Ibuprofeno, Loratadina...'
                     autocomplete="off" />
            </div>
            <!-- Autocomplete dropdown -->
            <div id="ac-dropdown" style="
              display:none; position:absolute; top:calc(100% + 4px); left:0; right:0;
              background:#fff; border:1px solid rgba(0,0,0,0.1); border-radius:0.875rem;
              box-shadow:0 8px 32px rgba(0,0,0,0.12); z-index:50; overflow:hidden;">
            </div>
          </div>
          <p style="font-size:0.75rem; color:var(--ios-gray); margin-top:0.5rem;">
            La búsqueda es parcial: "amox" encuentra "Amoxicilina", "Amoxicilina + Clavulánico", etc.
          </p>
        </div>
      </div>

      <!-- Estado inicial / resultados -->
      <div id="resultados-area">
        <div class="empty-state" style="padding:3rem 1rem;">
          <div class="empty-icon">${lucideIcon('flask-conical', 28)}</div>
          <h3>Ingresa un principio activo</h3>
          <p>Escribe el nombre del ingrediente activo que quieres buscar</p>
        </div>
      </div>

    </div>`;

  const input = document.getElementById('search-ingrediente');

  // ── Autocomplete ──────────────────────────────────────────────────────────
  input?.addEventListener('input', (e) => {
    const q = e.target.value.trim();

    // Disparar búsqueda principal con debounce
    clearTimeout(_debounceSearch);
    _debounceSearch = setTimeout(() => {
      if (q.length >= 2) buscar(q);
      else resetResultados();
    }, 400);

    // Autocomplete con debounce más corto
    clearTimeout(_debounceAC);
    if (q.length < 2) { cerrarAC(); return; }
    _debounceAC = setTimeout(() => cargarAC(q), 220);
  });

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrarAC();
    if (e.key === 'Enter')  { cerrarAC(); }
  });

  // Cerrar autocomplete al hacer click fuera
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#ac-dropdown') && !e.target.closest('#search-ingrediente')) {
      cerrarAC();
    }
  });
}

// ── Autocomplete ──────────────────────────────────────────────────────────────

async function cargarAC(q) {
  try {
    const res  = await composicionService.getIngredientesActivos(q);
    const lista = res.data || [];
    if (!lista.length) { cerrarAC(); return; }

    const dropdown = document.getElementById('ac-dropdown');
    dropdown.innerHTML = lista.map(item => `
      <div class="ac-item" data-val="${escHtml(item)}" style="
        padding:0.625rem 1rem; cursor:pointer; font-size:0.875rem;
        display:flex; align-items:center; gap:0.5rem;
        border-bottom:1px solid rgba(0,0,0,0.04);">
        ${lucideIcon('flask-conical', 13)}
        <span>${resaltarCoincidencia(item, q)}</span>
      </div>`).join('');

    dropdown.querySelectorAll('.ac-item').forEach(el => {
      el.addEventListener('click', () => {
        const val = el.dataset.val;
        document.getElementById('search-ingrediente').value = val;
        cerrarAC();
        buscar(val);
      });
      el.addEventListener('mouseover', () => { el.style.background = 'rgba(0,199,190,0.07)'; });
      el.addEventListener('mouseout',  () => { el.style.background = ''; });
    });

    dropdown.style.display = 'block';
  } catch { cerrarAC(); }
}

function cerrarAC() {
  const dd = document.getElementById('ac-dropdown');
  if (dd) dd.style.display = 'none';
}

function resaltarCoincidencia(texto, query) {
  const re  = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return escHtml(texto).replace(re, `<strong style="color:var(--mint-600);">$1</strong>`);
}

// ── Búsqueda principal ────────────────────────────────────────────────────────

async function buscar(q) {
  const area = document.getElementById('resultados-area');
  area.innerHTML = `
    <div class="page-spinner">
      <span class="spinner spinner-lg" style="color:var(--mint-500);"></span>
      <p>Buscando productos con <strong>${escHtml(q)}</strong>...</p>
    </div>`;

  try {
    const userRaw    = localStorage.getItem('user');
    const sucursalId = userRaw ? JSON.parse(userRaw)?.sucursalId : undefined;
    const res        = await composicionService.buscarPorIngrediente(q, sucursalId);
    _resultados      = res.data || [];
    renderResultados(q);
  } catch (err) {
    area.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${lucideIcon('wifi-off', 24)}</div>
        <h3>Error al buscar</h3>
        <p>${escHtml(err.message || 'Intenta de nuevo')}</p>
      </div>`;
  }
}

function resetResultados() {
  const area = document.getElementById('resultados-area');
  area.innerHTML = `
    <div class="empty-state" style="padding:3rem 1rem;">
      <div class="empty-icon">${lucideIcon('flask-conical', 28)}</div>
      <h3>Ingresa un principio activo</h3>
      <p>Escribe el nombre del ingrediente activo que quieres buscar</p>
    </div>`;
}

// ── Render de resultados ──────────────────────────────────────────────────────

function renderResultados(query) {
  const area = document.getElementById('resultados-area');

  if (_resultados.length === 0) {
    area.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${lucideIcon('search-x', 24)}</div>
        <h3>Sin resultados para "${escHtml(query)}"</h3>
        <p>No hay productos registrados con ese principio activo.
           Verifica la ortografía o registra la composición del producto.</p>
      </div>`;
    return;
  }

  // Encabezado de resultados
  const minPrecio = Math.min(..._resultados.map(p => Number(p.precioVenta)));
  const maxPrecio = Math.max(..._resultados.map(p => Number(p.precioVenta)));

  area.innerHTML = `
    <!-- Resumen de búsqueda -->
    <div class="glass-card anim-fade-up" style="
      padding:1rem 1.25rem; margin-bottom:1.25rem;
      display:flex; flex-wrap:wrap; gap:1.5rem; align-items:center;">
      <div>
        <p style="font-size:0.6875rem; color:var(--ios-gray); font-weight:600; text-transform:uppercase; letter-spacing:.05em;">
          Resultados
        </p>
        <p style="font-size:1.5rem; font-weight:800; color:#1c1c1e; line-height:1;">
          ${_resultados.length}
          <span style="font-size:0.875rem; font-weight:400; color:var(--ios-gray);">
            producto${_resultados.length !== 1 ? 's' : ''}
          </span>
        </p>
      </div>
      <div style="width:1px; height:2.5rem; background:rgba(0,0,0,0.08);"></div>
      <div>
        <p style="font-size:0.6875rem; color:var(--ios-gray); font-weight:600; text-transform:uppercase; letter-spacing:.05em;">
          Rango de precio
        </p>
        <p style="font-size:1rem; font-weight:700; color:#1c1c1e;">
          ${fmtMoney(minPrecio)}
          ${minPrecio !== maxPrecio ? ` — ${fmtMoney(maxPrecio)}` : ''}
        </p>
      </div>
      <div style="width:1px; height:2.5rem; background:rgba(0,0,0,0.08);"></div>
      <div>
        <p style="font-size:0.6875rem; color:var(--ios-gray); font-weight:600; text-transform:uppercase; letter-spacing:.05em;">
          Principio activo buscado
        </p>
        <p style="font-size:1rem; font-weight:700; color:var(--mint-600);">${escHtml(query)}</p>
      </div>
      <div style="margin-left:auto; font-size:0.75rem; color:var(--ios-gray);">
        Ordenado por precio (menor a mayor)
      </div>
    </div>

    <!-- Tarjetas de productos -->
    <div id="cards-grid" style="display:grid; gap:1rem; grid-template-columns:repeat(auto-fill, minmax(22rem, 1fr));">
      ${_resultados.map((p, i) => renderTarjeta(p, i, query, minPrecio)).join('')}
    </div>`;
}

function renderTarjeta(prod, idx, query, minPrecio) {
  const esMasBarato  = Number(prod.precioVenta) === minPrecio && minPrecio > 0;
  const activos      = prod.composicion?.filter(c => c.tipo === 'ACTIVO')    || [];
  const excipientes  = prod.composicion?.filter(c => c.tipo === 'EXCIPIENTE') || [];

  // Stock total del producto
  const stockTotal = prod.inventario?.reduce((s, inv) => s + (inv.stockActual || 0), 0) ?? 0;
  const stockColor = stockTotal === 0 ? 'var(--ios-red)' : stockTotal < 10 ? 'var(--ios-orange)' : 'var(--ios-green)';
  const stockLabel = stockTotal === 0 ? 'Sin stock' : `${stockTotal} unid.`;

  // Lote más próximo a vencer (para prioridad)
  const loteProximo = prod.lotes?.[0];
  const diasVenc    = loteProximo ? daysUntil(loteProximo.fechaVencimiento) : null;

  return `
    <div class="glass-card anim-fade-up delay-${Math.min(idx % 4, 3)}"
         style="padding:1.25rem; display:flex; flex-direction:column; gap:1rem;
                ${esMasBarato ? 'border:2px solid rgba(0,199,190,0.35); box-shadow:0 0 0 3px rgba(0,199,190,0.08);' : ''}">

      <!-- Cabecera: nombre + badge precio -->
      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:0.75rem;">
        <div style="flex:1;">
          <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.25rem;">
            ${esMasBarato ? `
              <span style="font-size:0.625rem; font-weight:800; color:#fff; background:var(--mint-500);
                            padding:0.1rem 0.5rem; border-radius:999px; letter-spacing:.04em; text-transform:uppercase;">
                Mejor precio
              </span>` : ''}
            ${prod.requiereReceta ? `
              <span style="font-size:0.625rem; font-weight:700; color:var(--ios-orange);
                            background:rgba(255,149,0,0.1); padding:0.1rem 0.45rem; border-radius:999px;">
                Receta
              </span>` : ''}
          </div>
          <h3 style="font-size:0.9375rem; font-weight:700; color:#1c1c1e; line-height:1.3;">
            ${escHtml(prod.nombre)}
          </h3>
          <p style="font-size:0.75rem; color:var(--ios-gray); margin-top:0.15rem;">
            ${prod.laboratorio
              ? `${lucideIcon('building-2', 11)} ${escHtml(prod.laboratorio.nombre)}${prod.laboratorio.paisOrigen ? ` · ${escHtml(prod.laboratorio.paisOrigen)}` : ''}`
              : '<span style="color:var(--ios-gray3);">Sin laboratorio</span>'}
          </p>
        </div>
        <div style="text-align:right; flex-shrink:0;">
          <div style="font-size:1.25rem; font-weight:800; color:#1c1c1e; font-variant-numeric:tabular-nums;">
            ${fmtMoney(Number(prod.precioVenta))}
          </div>
          <div style="font-size:0.6875rem; color:var(--ios-gray2); font-variant-numeric:tabular-nums;">
            Compra: ${fmtMoney(Number(prod.precioCompra))}
          </div>
        </div>
      </div>

      <!-- Composición -->
      <div style="background:rgba(0,0,0,0.025); border-radius:0.75rem; padding:0.875rem; display:flex; flex-direction:column; gap:0.625rem;">

        <!-- Activos -->
        <div>
          <p style="font-size:0.625rem; font-weight:800; color:var(--mint-600); text-transform:uppercase;
                    letter-spacing:.07em; margin-bottom:0.375rem; display:flex; align-items:center; gap:0.3rem;">
            ${lucideIcon('zap', 10)} Principios activos
          </p>
          ${activos.length === 0
            ? `<p style="font-size:0.75rem; color:var(--ios-gray3); font-style:italic;">No registrados</p>`
            : activos.map(a => `
                <div style="display:flex; align-items:baseline; justify-content:space-between;
                             gap:0.5rem; padding:0.25rem 0; border-bottom:1px dashed rgba(0,0,0,0.06);">
                  <span style="font-size:0.8125rem; font-weight:600; color:#1c1c1e;">
                    ${resaltarCoincidenciaHTML(a.ingrediente, document.getElementById('search-ingrediente')?.value || query)}
                  </span>
                  ${a.concentracion
                    ? `<span style="font-size:0.75rem; font-weight:700; color:var(--mint-600);
                                    background:rgba(0,199,190,0.1); padding:0.125rem 0.5rem; border-radius:0.375rem;
                                    white-space:nowrap;">
                         ${escHtml(a.concentracion)}
                       </span>`
                    : ''}
                </div>`).join('')}
        </div>

        <!-- Excipientes (colapsados si hay muchos) -->
        ${excipientes.length > 0 ? `
          <div>
            <p style="font-size:0.625rem; font-weight:800; color:var(--ios-gray2); text-transform:uppercase;
                      letter-spacing:.07em; margin-bottom:0.375rem; display:flex; align-items:center; gap:0.3rem;">
              ${lucideIcon('layers', 10)} Excipientes
            </p>
            <p style="font-size:0.75rem; color:#555; line-height:1.5;">
              ${excipientes.map(e =>
                `<span style="display:inline-block; margin-right:0.25rem;">${escHtml(e.ingrediente)}${e.concentracion ? ` <em style="color:var(--ios-gray);">(${escHtml(e.concentracion)})</em>` : ''}</span>`
              ).join('<span style="color:var(--ios-gray3);">&nbsp;·&nbsp;</span>')}
            </p>
          </div>` : ''}
      </div>

      <!-- Stock + Lotes próximos -->
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem;">
        <div style="display:flex; align-items:center; gap:0.375rem;">
          <div style="width:8px; height:8px; border-radius:50%; background:${stockColor};"></div>
          <span style="font-size:0.8125rem; font-weight:700; color:${stockColor};">${stockLabel}</span>
          <span style="font-size:0.75rem; color:var(--ios-gray);">disponible</span>
        </div>
        ${loteProximo && diasVenc !== null ? `
          <div style="display:flex; align-items:center; gap:0.375rem; font-size:0.75rem;
                      color:${diasVenc <= 30 ? 'var(--ios-red)' : diasVenc <= 90 ? 'var(--ios-orange)' : 'var(--ios-gray)'};">
            ${lucideIcon('calendar', 12)}
            <span>Vence ${fmtDate(loteProximo.fechaVencimiento)} <em>(${diasVenc}d)</em></span>
          </div>` : ''}
      </div>

      <!-- Código de barras -->
      <div style="display:flex; align-items:center; gap:0.5rem; padding-top:0.25rem;
                  border-top:1px solid rgba(0,0,0,0.06);">
        ${lucideIcon('barcode', 13)}
        <span class="mono" style="font-size:0.75rem; color:var(--ios-gray2);">${escHtml(prod.codigoBarras)}</span>
        ${prod.categoria ? `
          <span style="margin-left:auto; font-size:0.6875rem; color:var(--ios-gray);
                        background:rgba(0,0,0,0.05); padding:0.1rem 0.5rem; border-radius:999px;">
            ${escHtml(prod.categoria.nombre)}
          </span>` : ''}
      </div>
    </div>`;
}

// Resaltar coincidencia dentro de HTML ya escapado
function resaltarCoincidenciaHTML(texto, query) {
  const safe = escHtml(texto);
  if (!query) return safe;
  const re   = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return safe.replace(re, `<mark style="background:rgba(0,199,190,0.2); color:var(--mint-700); border-radius:3px; padding:0 2px;">$1</mark>`);
}
