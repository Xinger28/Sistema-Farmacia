/**
 * inventario.js — Página de Inventario
 */
import { inventarioService } from '../api.js';
import { lucideIcon, escHtml } from '../sidebar.js';

let _all = [];   // cache de todos los items
let _filtro = 'todos';
let _search = '';

export async function render(container) {
  container.innerHTML = `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header anim-fade-up">
        <div class="page-header-row">
          <div>
            <h1 class="large-title">Inventario</h1>
            <p class="page-subtitle">Gestión de stock de la sucursal</p>
          </div>
          <button id="btn-refresh" class="btn btn-ghost btn-sm" style="align-self:flex-end; margin-bottom:0.25rem;">
            <span id="refresh-icon">${lucideIcon('refresh-cw', 14)}</span>
            Actualizar
          </button>
        </div>
      </div>

      <!-- Banners de alerta (se llenan después) -->
      <div id="alert-banners" class="anim-fade-up" style="display:flex; flex-wrap:wrap; gap:0.625rem; margin-bottom:1.25rem;"></div>

      <!-- Controles -->
      <div class="glass-card anim-fade-up" style="padding:1rem; margin-bottom:1.25rem;">
        <div style="display:flex; flex-wrap:wrap; gap:0.75rem; align-items:center;">
          <div class="input-icon-wrap" style="flex:1; min-width:14rem;">
            <span class="icon">${lucideIcon('search', 18)}</span>
            <input id="search-input" type="text" class="input" style="padding-left:2.75rem;"
                   placeholder="Buscar por nombre o código de barras..." />
          </div>
          <div class="segmented">
            <button class="segmented-btn active" data-filtro="todos">Todos</button>
            <button class="segmented-btn"         data-filtro="stockBajo">Stock Bajo</button>
            <button class="segmented-btn"         data-filtro="sinStock">Sin Stock</button>
          </div>
        </div>
      </div>

      <!-- Tabla -->
      <div class="glass-card anim-fade-up" id="inventory-table" style="overflow:hidden;">
        <div class="page-spinner">
          <span class="spinner spinner-lg" style="color:var(--mint-500);"></span>
          <p>Cargando inventario...</p>
        </div>
      </div>

      <!-- Footer contador -->
      <div id="inv-footer" style="margin-top:0.875rem; display:none;
           display:flex; align-items:center; justify-content:space-between;">
        <p style="font-size:0.75rem; color:var(--ios-gray);">
          Mostrando <span id="inv-count" style="font-weight:700; color:#3a3a3c;">0</span> producto(s)
        </p>
        <button id="btn-clear-search" class="hidden"
          style="font-size:0.75rem; color:var(--mint-600); font-weight:700; background:none;
                 border:none; cursor:pointer;">
          Limpiar búsqueda
        </button>
      </div>
    </div>`;

  // Cargar datos
  await loadInventario();

  // Búsqueda
  document.getElementById('search-input')?.addEventListener('input', (e) => {
    _search = e.target.value;
    renderTable();
  });

  // Segmented
  document.querySelectorAll('.segmented-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.segmented-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _filtro = btn.dataset.filtro;
      await loadInventario();
    });
  });

  // Refresh
  document.getElementById('btn-refresh')?.addEventListener('click', loadInventario);

  // Clear search
  document.getElementById('btn-clear-search')?.addEventListener('click', () => {
    _search = '';
    document.getElementById('search-input').value = '';
    renderTable();
  });
}

async function loadInventario() {
  const refreshIcon = document.getElementById('refresh-icon');
  const tableEl     = document.getElementById('inventory-table');
  if (refreshIcon) refreshIcon.innerHTML = `<span class="spinner spinner-sm" style="color:var(--ios-gray);"></span>`;
  if (tableEl) tableEl.innerHTML = `
    <div class="page-spinner">
      <span class="spinner spinner-lg" style="color:var(--mint-500);"></span>
      <p>Cargando inventario...</p>
    </div>`;

  try {
    let res;
    if (_filtro === 'stockBajo')     res = await inventarioService.getStockBajo();
    else if (_filtro === 'sinStock') res = await inventarioService.getSinStock();
    else                             res = await inventarioService.getBySucursal({ limit: 200 });
    _all = res.data || [];
  } catch (err) {
    console.error(err);
    _all = [];
  }

  if (refreshIcon) refreshIcon.innerHTML = lucideIcon('refresh-cw', 14);
  renderAlertBanners();
  renderTable();
}

function renderAlertBanners() {
  const el = document.getElementById('alert-banners');
  if (!el) return;
  const sinStock  = _all.filter(p => p.stockActual === 0).length;
  const stockBajo = _all.filter(p => p.stockActual > 0 && p.stockActual <= p.stockMinimo).length;
  const banners = [];
  if (sinStock > 0)  banners.push(`
    <div style="display:flex;align-items:center;gap:0.5rem;
         background:rgba(255,59,48,0.08); border:1px solid rgba(255,59,48,0.16);
         color:var(--ios-red); padding:0.5rem 0.875rem; border-radius:0.75rem;
         font-size:0.75rem; font-weight:700;">
      ${lucideIcon('x-circle', 14)} ${sinStock} sin stock
    </div>`);
  if (stockBajo > 0) banners.push(`
    <div style="display:flex;align-items:center;gap:0.5rem;
         background:rgba(255,149,0,0.08); border:1px solid rgba(255,149,0,0.16);
         color:var(--ios-orange); padding:0.5rem 0.875rem; border-radius:0.75rem;
         font-size:0.75rem; font-weight:700;">
      ${lucideIcon('alert-triangle', 14)} ${stockBajo} con stock bajo
    </div>`);
  el.innerHTML = banners.join('');
  el.style.display = banners.length ? 'flex' : 'none';
}

function renderTable() {
  const tableEl    = document.getElementById('inventory-table');
  const footerEl   = document.getElementById('inv-footer');
  const countEl    = document.getElementById('inv-count');
  const clearBtn   = document.getElementById('btn-clear-search');
  if (!tableEl) return;

  const filtered = _all.filter(p =>
    p.producto.nombre.toLowerCase().includes(_search.toLowerCase()) ||
    p.producto.codigoBarras.includes(_search)
  );

  if (countEl) countEl.textContent = filtered.length;
  if (clearBtn) clearBtn.classList.toggle('hidden', !_search);
  if (footerEl) footerEl.style.display = filtered.length > 0 ? 'flex' : 'none';

  if (filtered.length === 0) {
    tableEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${lucideIcon('package', 24)}</div>
        <h3>No se encontraron productos</h3>
        <p>Intenta ajustar la búsqueda o selecciona otro filtro</p>
      </div>`;
    return;
  }

  tableEl.innerHTML = `
    <div class="table-scroll-wrap">
      <div class="table-scroll-inner">
        <div class="table-header" style="grid-template-columns:3fr 1.5fr 1.5fr 0.75fr 0.75fr 1fr; display:grid;">
          <span>Producto</span><span>Código</span><span>Laboratorio</span>
          <span style="text-align:center;">Stock</span>
          <span style="text-align:right;">Precio</span>
          <span style="text-align:center;">Estado</span>
        </div>
        <div id="inv-rows"></div>
      </div>
    </div>`;

  const rows = filtered.map((item, i) => {
    const sinStock  = item.stockActual === 0;
    const bajo      = item.stockActual > 0 && item.stockActual <= item.stockMinimo;
    const badgeCls  = sinStock ? 'badge-red' : bajo ? 'badge-orange' : 'badge-green';
    const stockBg   = sinStock
      ? 'background:rgba(255,59,48,0.1);color:var(--ios-red);'
      : bajo
      ? 'background:rgba(255,149,0,0.1);color:var(--ios-orange);'
      : 'background:rgba(52,199,89,0.1);color:var(--ios-green);';
    const statusIcon   = sinStock ? 'x-circle' : bajo ? 'alert-triangle' : 'check-circle-2';
    const statusLabel  = sinStock ? 'Sin Stock' : bajo ? 'Stock Bajo' : 'Normal';

    return `
      <div class="inventory-row cell anim-fade-up delay-${Math.min(i % 6, 5)}">
        <!-- Producto -->
        <div>
          <div style="font-weight:600; font-size:0.8125rem; color:#1c1c1e;">${escHtml(item.producto.nombre)}</div>
          ${item.producto.categoria ? `<div style="font-size:0.6875rem; color:var(--ios-gray); margin-top:0.1rem;">${escHtml(item.producto.categoria.nombre)}</div>` : ''}
        </div>
        <!-- Código -->
        <div>
          <span class="mono" style="font-size:0.6875rem; background:rgba(0,0,0,0.04);
                color:#555; padding:0.125rem 0.5rem; border-radius:0.375rem;">
            ${escHtml(item.producto.codigoBarras)}
          </span>
        </div>
        <!-- Lab -->
        <div style="font-size:0.8125rem; color:#555;">
          ${item.producto.laboratorio?.nombre ? escHtml(item.producto.laboratorio.nombre) : '<span style="color:var(--ios-gray3);">—</span>'}
        </div>
        <!-- Stock -->
        <div style="display:flex; justify-content:center;">
          <span style="display:inline-flex; align-items:center; justify-content:center;
                       min-width:2rem; height:1.875rem; padding:0 0.625rem;
                       border-radius:0.5rem; font-size:0.8125rem; font-weight:700;
                       font-variant-numeric:tabular-nums; ${stockBg}">
            ${item.stockActual}
          </span>
        </div>
        <!-- Precio -->
        <div style="text-align:right; font-size:0.8125rem; font-weight:700; color:#1c1c1e;
                    font-variant-numeric:tabular-nums;">
          $${Number(item.producto.precioVenta).toFixed(2)}
        </div>
        <!-- Estado -->
        <div style="display:flex; justify-content:center;">
          <span class="badge ${badgeCls}">
            ${lucideIcon(statusIcon, 11)}
            ${statusLabel}
          </span>
        </div>
      </div>`;
  }).join('');

  document.getElementById('inv-rows').innerHTML = rows;
}
