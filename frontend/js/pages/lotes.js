/**
 * lotes.js — Página de Gestión de Lotes
 * Permite registrar nuevos lotes por producto/proveedor,
 * ver el estado de cada lote y priorizar los próximos a vencer.
 */
import { loteService, productoService } from '../api.js';
import { lucideIcon, escHtml, fmtDate, daysUntil } from '../sidebar.js';

let _lotes = [];
let _filtro = 'todos';   // 'todos' | 'proximos' | 'criticos'
let _search = '';
let _pagination = { page: 1, totalPages: 1, total: 0 };
const PAGE_SIZE = 15;

export async function render(container) {
  container.innerHTML = `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header anim-fade-up">
        <div class="page-header-row">
          <div>
            <h1 class="large-title">Lotes</h1>
            <p class="page-subtitle">Control de ingresos y vencimientos por lote</p>
          </div>
          <button id="btn-nuevo-lote" class="btn btn-primary btn-sm" style="align-self:flex-end; margin-bottom:0.25rem;">
            ${lucideIcon('plus', 14)}
            Registrar Lote
          </button>
        </div>
      </div>

      <!-- Banner vencimientos críticos -->
      <div id="banner-criticos" style="display:none;" class="anim-fade-up"></div>

      <!-- Controles -->
      <div class="glass-card anim-fade-up" style="padding:1rem; margin-bottom:1.25rem;">
        <div style="display:flex; flex-wrap:wrap; gap:0.75rem; align-items:center;">
          <div class="input-icon-wrap" style="flex:1; min-width:14rem;">
            <span class="icon">${lucideIcon('search', 18)}</span>
            <input id="search-input" type="text" class="input" style="padding-left:2.75rem;"
                   placeholder="Buscar por nombre de producto o número de lote..." />
          </div>
          <div class="segmented">
            <button class="segmented-btn active" data-filtro="todos">Todos</button>
            <button class="segmented-btn" data-filtro="proximos">Próx. 90 días</button>
            <button class="segmented-btn" data-filtro="criticos">Críticos ≤30d</button>
          </div>
        </div>
      </div>

      <!-- Tabla -->
      <div class="glass-card anim-fade-up" id="lotes-table" style="overflow:hidden;">
        <div class="page-spinner">
          <span class="spinner spinner-lg" style="color:var(--mint-500);"></span>
          <p>Cargando lotes...</p>
        </div>
      </div>

      <!-- Paginación -->
      <div id="paginacion" style="margin-top:1rem; display:none; justify-content:space-between; align-items:center;">
        <p style="font-size:0.75rem; color:var(--ios-gray);">
          <span id="pag-info"></span>
        </p>
        <div style="display:flex; gap:0.5rem;">
          <button id="btn-prev" class="btn btn-ghost btn-sm">${lucideIcon('chevron-left', 14)} Anterior</button>
          <button id="btn-next" class="btn btn-ghost btn-sm">Siguiente ${lucideIcon('chevron-right', 14)}</button>
        </div>
      </div>
    </div>

    <!-- Modal Registro de Lote -->
    <div id="modal-lote" style="display:none; position:fixed; inset:0; z-index:1000;
         background:rgba(0,0,0,0.4); backdrop-filter:blur(4px);
         align-items:center; justify-content:center; padding:1rem;">
      <div class="glass-card" style="width:100%; max-width:34rem;
           overflow-y:auto; padding:1.5rem; border-radius:1.25rem;">

        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1.25rem;">
          <div>
            <h2 style="font-size:1.125rem; font-weight:700; color:#1c1c1e;">Registrar Lote</h2>
            <p style="font-size:0.75rem; color:var(--ios-gray); margin-top:0.1rem;">
              Ingreso de mercadería del proveedor
            </p>
          </div>
          <button id="btn-cerrar-modal" class="btn btn-ghost btn-sm" style="padding:0.375rem;">
            ${lucideIcon('x-circle', 18)}
          </button>
        </div>

        <form id="form-lote" autocomplete="off">
          <div style="display:grid; gap:1rem;">

            <!-- Buscador de producto -->
            <div>
              <label class="form-label">Producto *</label>
              <div class="input-icon-wrap">
                <span class="icon">${lucideIcon('search', 16)}</span>
                <input id="f-prod-search" type="text" class="input" style="padding-left:2.5rem;"
                       placeholder="Buscar por nombre o código de barras..." autocomplete="off"/>
              </div>
              <div id="prod-sugerencias" style="display:none; margin-top:0.25rem;
                   background:#fff; border:1px solid rgba(0,0,0,0.1); border-radius:0.75rem;
                   box-shadow:0 4px 20px rgba(0,0,0,0.12); max-height:12rem; overflow-y:auto; z-index:10; position:relative;">
              </div>
              <input id="f-producto-id" type="hidden" />
              <div id="prod-seleccionado" style="display:none; margin-top:0.5rem; padding:0.625rem 0.75rem;
                   background:rgba(0,199,190,0.08); border:1px solid rgba(0,199,190,0.2);
                   border-radius:0.75rem; font-size:0.8125rem;">
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
              <div>
                <label class="form-label">Número de Lote *</label>
                <input id="f-numero-lote" type="text" class="input" placeholder="Ej: LOT-2026-001" required />
              </div>
              <div>
                <label class="form-label">Fecha de Vencimiento *</label>
                <input id="f-fecha-venc" type="date" class="input" required />
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
              <div>
                <label class="form-label">Cantidad de Unidades *</label>
                <input id="f-cantidad" type="number" min="1" class="input" placeholder="Ej: 120" required />
              </div>
              <div>
                <label class="form-label">Precio Compra Lote (Bs.)</label>
                <input id="f-precio-lote" type="number" step="0.01" min="0" class="input" placeholder="0.00" />
              </div>
            </div>

            <!-- Info visual de vencimiento -->
            <div id="preview-venc" style="display:none; padding:0.75rem; border-radius:0.75rem;
                 background:rgba(0,0,0,0.03); border:1px solid rgba(0,0,0,0.06);">
              <div style="display:flex; align-items:center; gap:0.5rem; font-size:0.8125rem;">
                <span id="preview-icon"></span>
                <span id="preview-texto" style="font-weight:600;"></span>
              </div>
            </div>

            <div id="form-error" style="display:none; padding:0.625rem 0.875rem;
                 background:rgba(255,59,48,0.08); border:1px solid rgba(255,59,48,0.2);
                 border-radius:0.75rem; font-size:0.8125rem; color:var(--ios-red); font-weight:600;">
            </div>

            <div style="display:flex; gap:0.75rem; justify-content:flex-end; padding-top:0.5rem;">
              <button type="button" id="btn-cancelar" class="btn btn-ghost btn-md">Cancelar</button>
              <button type="submit" id="btn-guardar" class="btn btn-primary btn-md">
                ${lucideIcon('package', 14)} Registrar Lote
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>`;

  await loadLotes();

  // Búsqueda
  let debounceTimer;
  document.getElementById('search-input')?.addEventListener('input', (e) => {
    _search = e.target.value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => { _pagination.page = 1; loadLotes(); }, 350);
  });

  // Segmented
  document.querySelectorAll('.segmented-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.segmented-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _filtro = btn.dataset.filtro;
      _pagination.page = 1;
      loadLotes();
    });
  });

  // Paginación
  document.getElementById('btn-prev')?.addEventListener('click', () => {
    if (_pagination.page > 1) { _pagination.page--; loadLotes(); }
  });
  document.getElementById('btn-next')?.addEventListener('click', () => {
    if (_pagination.page < _pagination.totalPages) { _pagination.page++; loadLotes(); }
  });

  // Nuevo lote
  document.getElementById('btn-nuevo-lote')?.addEventListener('click', abrirModal);
  document.getElementById('btn-cerrar-modal')?.addEventListener('click', cerrarModal);
  document.getElementById('btn-cancelar')?.addEventListener('click', cerrarModal);
  document.getElementById('modal-lote')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-lote')) cerrarModal();
  });

  document.getElementById('form-lote')?.addEventListener('submit', guardarLote);

  // Preview de fecha de vencimiento
  document.getElementById('f-fecha-venc')?.addEventListener('input', actualizarPreviewVenc);
}

async function loadLotes() {
  const tableEl = document.getElementById('lotes-table');
  if (tableEl) tableEl.innerHTML = `
    <div class="page-spinner">
      <span class="spinner spinner-lg" style="color:var(--mint-500);"></span>
      <p>Cargando lotes...</p>
    </div>`;

  try {
    const params = {
      page:  _pagination.page,
      limit: PAGE_SIZE,
    };

    if (_filtro === 'proximos' || _filtro === 'criticos') {
      params.proximosVencer = true;
    }

    const res = await loteService.getAll(params);
    let data = res.data || [];

    // Filtro crítico: ≤ 30 días
    if (_filtro === 'criticos') {
      data = data.filter(l => daysUntil(l.fechaVencimiento) <= 30);
    }

    // Búsqueda local por nombre o número de lote
    if (_search.trim()) {
      const q = _search.toLowerCase();
      data = data.filter(l =>
        l.producto?.nombre?.toLowerCase().includes(q) ||
        l.numeroLote?.toLowerCase().includes(q)
      );
    }

    _lotes = data;
    _pagination = { ..._pagination, ...res.pagination };

    // Banner críticos
    const criticos = data.filter(l => daysUntil(l.fechaVencimiento) <= 30);
    renderBannerCriticos(criticos.length);

  } catch (err) {
    _lotes = [];
    console.error(err);
  }

  renderTabla();
  renderPaginacion();
}

function renderBannerCriticos(count) {
  const banner = document.getElementById('banner-criticos');
  if (!banner) return;
  if (count === 0) { banner.style.display = 'none'; return; }

  banner.style.display = 'block';
  banner.innerHTML = `
    <div style="display:flex; align-items:center; gap:0.75rem; padding:0.75rem 1rem;
                background:rgba(255,59,48,0.08); border:1px solid rgba(255,59,48,0.2);
                border-radius:0.875rem; margin-bottom:1rem; font-size:0.8125rem; font-weight:700; color:var(--ios-red);">
      ${lucideIcon('alert-triangle', 16)}
      <span>${count} lote${count > 1 ? 's' : ''} vence${count === 1 ? '' : 'n'} en ≤ 30 días —
        <strong>priorizar su venta</strong></span>
    </div>`;
}

function renderTabla() {
  const tableEl = document.getElementById('lotes-table');
  if (!tableEl) return;

  if (_lotes.length === 0) {
    tableEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${lucideIcon('package', 24)}</div>
        <h3>No hay lotes registrados</h3>
        <p>Registra el primer lote con el botón "Registrar Lote"</p>
      </div>`;
    return;
  }

  tableEl.innerHTML = `
    <div class="table-header" style="grid-template-columns:2.5fr 1.2fr 1.5fr 0.8fr 0.8fr 1.2fr; display:grid;">
      <span>Producto</span>
      <span>Nº Lote</span>
      <span>Sucursal</span>
      <span style="text-align:center;">Uds.</span>
      <span style="text-align:right;">P.Compra</span>
      <span style="text-align:center;">Vencimiento</span>
    </div>
    <div id="lotes-rows"></div>`;

  const rows = _lotes.map((l, i) => {
    const days    = daysUntil(l.fechaVencimiento);
    const critico = days <= 30;
    const proximo = days <= 90;
    const badgeCls  = critico ? 'badge-red' : proximo ? 'badge-orange' : 'badge-green';
    const rowBg     = critico
      ? 'background:rgba(255,59,48,0.03);'
      : '';

    return `
      <div class="inventory-row cell anim-fade-up delay-${Math.min(i % 6, 5)}"
           style="grid-template-columns:2.5fr 1.2fr 1.5fr 0.8fr 0.8fr 1.2fr; display:grid;
                  align-items:center; ${rowBg}">
        <div>
          <div style="font-weight:600; font-size:0.8125rem; color:#1c1c1e;">
            ${escHtml(l.producto?.nombre || '—')}
          </div>
          <div class="mono" style="font-size:0.6875rem; color:var(--ios-gray);">
            ${escHtml(l.producto?.codigoBarras || '')}
          </div>
        </div>
        <div>
          <span class="mono" style="font-size:0.75rem; background:rgba(0,0,0,0.04);
                color:#555; padding:0.125rem 0.5rem; border-radius:0.375rem;">
            ${escHtml(l.numeroLote)}
          </span>
        </div>
        <div style="font-size:0.8125rem; color:#555;">
          ${escHtml(l.sucursal?.nombre || '—')}
        </div>
        <div style="text-align:center; font-size:0.875rem; font-weight:700;
                    color:${l.cantidad === 0 ? 'var(--ios-gray3)' : '#1c1c1e'};">
          ${l.cantidad}
        </div>
        <div style="text-align:right; font-size:0.8125rem; color:var(--ios-gray2); font-variant-numeric:tabular-nums;">
          ${l.precioCompraLote ? '$' + Number(l.precioCompraLote).toFixed(2) : '—'}
        </div>
        <div style="display:flex; flex-direction:column; align-items:center; gap:0.25rem;">
          <span class="badge ${badgeCls}" style="font-size:0.6875rem;">
            ${critico ? lucideIcon('alert-triangle', 10) : lucideIcon('calendar', 10)}
            ${fmtDate(l.fechaVencimiento)}
          </span>
          <span style="font-size:0.625rem; color:${critico ? 'var(--ios-red)' : 'var(--ios-gray)'}; font-weight:${critico ? '700' : '400'};">
            ${days}d restantes
          </span>
        </div>
      </div>`;
  }).join('');

  document.getElementById('lotes-rows').innerHTML = rows;
}

function renderPaginacion() {
  const pagEl = document.getElementById('paginacion');
  const info  = document.getElementById('pag-info');
  const prev  = document.getElementById('btn-prev');
  const next  = document.getElementById('btn-next');
  if (!pagEl) return;

  pagEl.style.display = _lotes.length > 0 ? 'flex' : 'none';
  if (info) info.textContent = `Página ${_pagination.page} de ${_pagination.totalPages} · ${_pagination.total} lotes`;
  if (prev) prev.disabled = _pagination.page <= 1;
  if (next) next.disabled = _pagination.page >= _pagination.totalPages;
}

// ── Modal ──────────────────────────────────────────────────────

let _productoSeleccionado = null;
let _debounceSearch;

function abrirModal() {
  _productoSeleccionado = null;
  const modal = document.getElementById('modal-lote');
  if (!modal) return;

  // Limpiar campos
  document.getElementById('f-prod-search').value   = '';
  document.getElementById('f-producto-id').value   = '';
  document.getElementById('f-numero-lote').value   = '';
  document.getElementById('f-fecha-venc').value    = '';
  document.getElementById('f-cantidad').value      = '';
  document.getElementById('f-precio-lote').value   = '';
  document.getElementById('prod-seleccionado').style.display = 'none';
  document.getElementById('prod-sugerencias').style.display  = 'none';
  document.getElementById('preview-venc').style.display      = 'none';
  document.getElementById('form-error').style.display        = 'none';

  modal.style.display = 'flex';

  // Buscador de producto con debounce
  const inputSearch = document.getElementById('f-prod-search');
  inputSearch.oninput = () => {
    clearTimeout(_debounceSearch);
    _debounceSearch = setTimeout(() => buscarProducto(inputSearch.value), 300);
  };
}

async function buscarProducto(q) {
  const sugEl = document.getElementById('prod-sugerencias');
  if (!q.trim() || q.trim().length < 2) { sugEl.style.display = 'none'; return; }

  try {
    const res = await productoService.getAll({ search: q, limit: 6, activo: true });
    const items = res.data || [];
    if (items.length === 0) {
      sugEl.innerHTML = `<div style="padding:0.75rem 1rem; font-size:0.8125rem; color:var(--ios-gray);">Sin resultados</div>`;
    } else {
      sugEl.innerHTML = items.map(p => `
        <div class="cell" data-id="${p.id}"
             style="padding:0.625rem 1rem; cursor:pointer; font-size:0.8125rem;">
          <div style="font-weight:600; color:#1c1c1e;">${escHtml(p.nombre)}</div>
          <div style="font-size:0.6875rem; color:var(--ios-gray);">
            ${escHtml(p.codigoBarras)}
            ${p.laboratorio ? ' · ' + escHtml(p.laboratorio.nombre) : ''}
          </div>
        </div>`).join('');

      sugEl.querySelectorAll('[data-id]').forEach(el => {
        el.addEventListener('click', () => {
          const prod = items.find(p => p.id === parseInt(el.dataset.id));
          if (prod) seleccionarProducto(prod);
        });
      });
    }
    sugEl.style.display = 'block';
  } catch (err) {
    sugEl.style.display = 'none';
  }
}

function seleccionarProducto(prod) {
  _productoSeleccionado = prod;
  document.getElementById('f-prod-search').value = prod.nombre;
  document.getElementById('f-producto-id').value = prod.id;
  document.getElementById('prod-sugerencias').style.display = 'none';

  const selEl = document.getElementById('prod-seleccionado');
  selEl.style.display = 'block';
  selEl.innerHTML = `
    <div style="display:flex; align-items:center; gap:0.5rem;">
      <span style="color:var(--mint-600);">${lucideIcon('check-circle-2', 14)}</span>
      <div>
        <div style="font-weight:700; color:#1c1c1e;">${escHtml(prod.nombre)}</div>
        <div style="font-size:0.6875rem; color:var(--ios-gray);">
          ${escHtml(prod.codigoBarras)}
          ${prod.laboratorio ? ' · ' + escHtml(prod.laboratorio.nombre) : ''}
        </div>
      </div>
    </div>`;
}

function actualizarPreviewVenc() {
  const fecha   = document.getElementById('f-fecha-venc').value;
  const preview = document.getElementById('preview-venc');
  if (!fecha) { preview.style.display = 'none'; return; }

  const days = daysUntil(fecha);
  if (days <= 0) {
    preview.innerHTML = `<div style="display:flex;align-items:center;gap:0.5rem;color:var(--ios-red);font-size:0.8125rem;">
      ${lucideIcon('x-circle', 14)} <span style="font-weight:700;">Fecha inválida — debe ser futura</span></div>`;
    preview.style.display = 'block';
    return;
  }
  const color = days <= 30 ? 'var(--ios-red)' : days <= 90 ? 'var(--ios-orange)' : 'var(--ios-green)';
  const ico   = days <= 30 ? 'alert-triangle' : days <= 90 ? 'clock' : 'check-circle-2';
  const msg   = days <= 30 ? `Crítico: vence en ${days} días` : days <= 90 ? `Próximo: vence en ${days} días` : `Vigente: ${days} días de vida útil`;

  preview.innerHTML = `<div style="display:flex;align-items:center;gap:0.5rem;color:${color};font-size:0.8125rem;">
    ${lucideIcon(ico, 14)} <span style="font-weight:700;">${msg}</span></div>`;
  preview.style.display = 'block';
}

function cerrarModal() {
  const modal = document.getElementById('modal-lote');
  if (modal) modal.style.display = 'none';
  _productoSeleccionado = null;
}

async function guardarLote(e) {
  e.preventDefault();
  const errorEl  = document.getElementById('form-error');
  const btnGuard = document.getElementById('btn-guardar');
  errorEl.style.display = 'none';

  const productoId    = parseInt(document.getElementById('f-producto-id').value);
  const numeroLote    = document.getElementById('f-numero-lote').value.trim();
  const fechaVenc     = document.getElementById('f-fecha-venc').value;
  const cantidad      = parseInt(document.getElementById('f-cantidad').value);
  const precioCompra  = parseFloat(document.getElementById('f-precio-lote').value) || undefined;

  if (!productoId) { mostrarError('Selecciona un producto de la lista.'); return; }
  if (!numeroLote)  { mostrarError('El número de lote es obligatorio.'); return; }
  if (!fechaVenc)   { mostrarError('La fecha de vencimiento es obligatoria.'); return; }
  if (daysUntil(fechaVenc) <= 0) { mostrarError('La fecha de vencimiento debe ser futura.'); return; }
  if (!cantidad || cantidad < 1) { mostrarError('La cantidad debe ser mayor a 0.'); return; }

  // Obtener sucursalId del usuario logueado
  const userRaw   = localStorage.getItem('user');
  const user      = userRaw ? JSON.parse(userRaw) : null;
  const sucursalId = user?.sucursalId || user?.sucursal?.id;
  if (!sucursalId) { mostrarError('No se pudo determinar la sucursal del usuario.'); return; }

  btnGuard.disabled = true;
  btnGuard.innerHTML = `<span class="spinner spinner-sm"></span> Registrando...`;

  try {
    await loteService.create({
      productoId,
      sucursalId,
      numeroLote,
      fechaVencimiento: fechaVenc,
      cantidad,
      precioCompraLote: precioCompra,
    });
    cerrarModal();
    _pagination.page = 1;
    await loadLotes();
  } catch (err) {
    mostrarError(err.message || 'Error al registrar el lote.');
  } finally {
    btnGuard.disabled = false;
    btnGuard.innerHTML = `${lucideIcon('package', 14)} Registrar Lote`;
  }
}

function mostrarError(msg) {
  const el = document.getElementById('form-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}
