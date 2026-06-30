/**
 * productos.js — Página de Gestión de Productos (Admin)
 * Permite listar, crear y editar productos con sus laboratorios y categorías.
 */
import { productoService, laboratorioService, categoriaService, composicionService } from '../api.js';
import { lucideIcon, escHtml, fmtMoney } from '../sidebar.js';

let _productos = [];
let _laboratorios = [];
let _categorias = [];
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
            <h1 class="large-title">Productos</h1>
            <p class="page-subtitle">Catálogo de fármacos por laboratorio</p>
          </div>
          <button id="btn-nuevo-producto" class="btn btn-primary btn-sm" style="align-self:flex-end; margin-bottom:0.25rem;">
            ${lucideIcon('plus', 14)}
            Nuevo Producto
          </button>
        </div>
      </div>

      <!-- Controles -->
      <div class="glass-card anim-fade-up" style="padding:1rem; margin-bottom:1.25rem;">
        <div style="display:flex; flex-wrap:wrap; gap:0.75rem; align-items:center;">
          <div class="input-icon-wrap" style="flex:1; min-width:14rem;">
            <span class="icon">${lucideIcon('search', 18)}</span>
            <input id="search-input" type="text" class="input" style="padding-left:2.75rem;"
                   placeholder="Buscar por nombre, código o principio activo..." />
          </div>
          <select id="filter-lab" class="input" style="width:auto; min-width:10rem;">
            <option value="">Todos los laboratorios</option>
          </select>
          <select id="filter-cat" class="input" style="width:auto; min-width:9rem;">
            <option value="">Todas las categorías</option>
          </select>
        </div>
      </div>

      <!-- Tabla -->
      <div class="glass-card anim-fade-up" id="productos-table" style="overflow:hidden;">
        <div class="page-spinner">
          <span class="spinner spinner-lg" style="color:var(--mint-500);"></span>
          <p>Cargando productos...</p>
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

    <!-- Modal Producto -->
    <div id="modal-producto" style="display:none; position:fixed; inset:0; z-index:1000;
         background:rgba(0,0,0,0.4); backdrop-filter:blur(4px);
         display:none; align-items:center; justify-content:center; padding:1rem;">
      <div class="glass-card" style="width:100%; max-width:36rem; max-height:90vh;
           overflow-y:auto; padding:1.5rem; border-radius:1.25rem;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1.25rem;">
          <h2 id="modal-titulo" style="font-size:1.125rem; font-weight:700; color:#1c1c1e;"></h2>
          <button id="btn-cerrar-modal" class="btn btn-ghost btn-sm" style="padding:0.375rem;">
            ${lucideIcon('x-circle', 18)}
          </button>
        </div>
        <form id="form-producto" autocomplete="off">
          <div style="display:grid; gap:1rem;">

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
              <div>
                <label class="form-label">Código de Barras *</label>
                <input id="f-codigo" type="text" class="input" placeholder="Ej: 7891234567890" required />
              </div>
              <div>
                <label class="form-label">Nombre del Producto *</label>
                <input id="f-nombre" type="text" class="input" placeholder="Ej: Amoxicilina 500mg" required />
              </div>
            </div>

            <div>
              <label class="form-label">Principio Activo</label>
              <input id="f-principio" type="text" class="input" placeholder="Ej: Amoxicilina trihidrato" />
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
              <div>
                <label class="form-label">Laboratorio</label>
                <select id="f-laboratorio" class="input">
                  <option value="">— Sin laboratorio —</option>
                </select>
              </div>
              <div>
                <label class="form-label">Categoría</label>
                <select id="f-categoria" class="input">
                  <option value="">— Sin categoría —</option>
                </select>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
              <div>
                <label class="form-label">Precio Compra (Bs.) *</label>
                <input id="f-precio-compra" type="number" step="0.01" min="0" class="input" placeholder="0.00" required />
              </div>
              <div>
                <label class="form-label">Precio Venta (Bs.) *</label>
                <input id="f-precio-venta" type="number" step="0.01" min="0" class="input" placeholder="0.00" required />
              </div>
            </div>

            <div style="display:flex; align-items:center; gap:0.75rem; padding:0.75rem;
                 background:rgba(0,0,0,0.03); border-radius:0.75rem;">
              <input id="f-receta" type="checkbox" style="width:1.125rem; height:1.125rem; cursor:pointer;" />
              <label for="f-receta" style="font-size:0.875rem; font-weight:500; color:#1c1c1e; cursor:pointer;">
                Requiere receta médica
              </label>
            </div>

            <div>
              <label class="form-label">Descripción</label>
              <textarea id="f-descripcion" class="input" rows="2"
                        style="resize:vertical; min-height:4rem;"
                        placeholder="Indicaciones, presentación, etc."></textarea>
            </div>

            <!-- ── Composición ─────────────────────────────────────────────── -->
            <div style="border-radius:0.875rem; border:1px solid rgba(0,199,190,0.25);
                        background:rgba(0,199,190,0.03); overflow:hidden;">

              <!-- Header de la sección -->
              <div style="display:flex; align-items:center; justify-content:space-between;
                          padding:0.75rem 1rem; border-bottom:1px solid rgba(0,199,190,0.15);
                          background:rgba(0,199,190,0.06);">
                <div style="display:flex; align-items:center; gap:0.5rem;">
                  ${lucideIcon('flask-conical', 15)}
                  <span style="font-size:0.875rem; font-weight:700; color:#1c1c1e;">Composición</span>
                  <span style="font-size:0.6875rem; color:var(--ios-gray); font-weight:400;">
                    (activos + excipientes)
                  </span>
                </div>
                <button type="button" id="btn-add-ingrediente" class="btn btn-ghost btn-sm"
                        style="font-size:0.75rem; padding:0.25rem 0.625rem;">
                  ${lucideIcon('plus', 12)} Agregar
                </button>
              </div>

              <!-- Lista de ingredientes -->
              <div id="composicion-lista" style="padding:0.75rem 1rem; display:flex; flex-direction:column; gap:0.5rem; min-height:3rem;">
                <p id="composicion-vacia" style="font-size:0.8125rem; color:var(--ios-gray); font-style:italic; text-align:center; padding:0.5rem 0;">
                  Sin ingredientes — pulsa "Agregar" para comenzar
                </p>
              </div>

              <!-- Nota informativa -->
              <div style="padding:0.5rem 1rem 0.75rem; font-size:0.6875rem; color:var(--ios-gray2);">
                ${lucideIcon('info', 11)}
                El primer ingrediente <strong>Activo</strong> se usará como principio activo de búsqueda.
              </div>
            </div>

            <div id="form-error" style="display:none; padding:0.625rem 0.875rem;
                 background:rgba(255,59,48,0.08); border:1px solid rgba(255,59,48,0.2);
                 border-radius:0.75rem; font-size:0.8125rem; color:var(--ios-red); font-weight:600;">
            </div>

            <div style="display:flex; gap:0.75rem; justify-content:flex-end; padding-top:0.5rem;">
              <button type="button" id="btn-cancelar" class="btn btn-ghost btn-md">Cancelar</button>
              <button type="submit" id="btn-guardar" class="btn btn-primary btn-md">
                ${lucideIcon('check', 14)} Guardar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>`;

  // Cargar labs y categorías para los selectores
  await loadCatalogos();
  // Cargar lista de productos
  await loadProductos();

  // Búsqueda con debounce
  let debounceTimer;
  document.getElementById('search-input')?.addEventListener('input', (e) => {
    _search = e.target.value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => { _pagination.page = 1; loadProductos(); }, 350);
  });

  // Filtros
  document.getElementById('filter-lab')?.addEventListener('change', () => { _pagination.page = 1; loadProductos(); });
  document.getElementById('filter-cat')?.addEventListener('change', () => { _pagination.page = 1; loadProductos(); });

  // Paginación
  document.getElementById('btn-prev')?.addEventListener('click', () => {
    if (_pagination.page > 1) { _pagination.page--; loadProductos(); }
  });
  document.getElementById('btn-next')?.addEventListener('click', () => {
    if (_pagination.page < _pagination.totalPages) { _pagination.page++; loadProductos(); }
  });

  // Nuevo producto
  document.getElementById('btn-nuevo-producto')?.addEventListener('click', () => abrirModal(null));

  // Cerrar modal
  document.getElementById('btn-cerrar-modal')?.addEventListener('click', cerrarModal);
  document.getElementById('btn-cancelar')?.addEventListener('click', cerrarModal);
  document.getElementById('modal-producto')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-producto')) cerrarModal();
  });

  // Submit form
  document.getElementById('form-producto')?.addEventListener('submit', guardarProducto);
}

async function loadCatalogos() {
  // Cargar laboratorios y categorías de forma independiente
  // para que un fallo en uno no bloquee al otro ni a los productos
  try {
    const res = await laboratorioService.getAll();
    _laboratorios = res.data || [];
    const filterLab = document.getElementById('filter-lab');
    if (filterLab) {
      _laboratorios.forEach(l => {
        filterLab.innerHTML += `<option value="${l.id}">${escHtml(l.nombre)}</option>`;
      });
    }
  } catch (err) {
    console.warn('No se pudieron cargar laboratorios:', err.message);
    _laboratorios = [];
  }

  try {
    const res = await categoriaService.getAll();
    _categorias = res.data || [];
    const filterCat = document.getElementById('filter-cat');
    if (filterCat) {
      _categorias.forEach(c => {
        filterCat.innerHTML += `<option value="${c.id}">${escHtml(c.nombre)}</option>`;
      });
    }
  } catch (err) {
    console.warn('No se pudieron cargar categorías:', err.message);
    _categorias = [];
  }
}

async function loadProductos() {
  const tableEl = document.getElementById('productos-table');
  if (tableEl) tableEl.innerHTML = `
    <div class="page-spinner">
      <span class="spinner spinner-lg" style="color:var(--mint-500);"></span>
      <p>Cargando...</p>
    </div>`;

  const labId = document.getElementById('filter-lab')?.value;
  const catId = document.getElementById('filter-cat')?.value;

  try {
    const params = {
      page:   _pagination.page,
      limit:  PAGE_SIZE,
      search: _search || undefined,
    };
    if (labId) params.laboratorioId = labId;
    if (catId) params.categoriaId   = catId;

    const res = await productoService.getAll(params);
    _productos = res.data || [];
    _pagination = { ..._pagination, ...res.pagination };
  } catch (err) {
    _productos = [];
    console.error(err);
  }

  renderTabla();
  renderPaginacion();
}

function renderTabla() {
  const tableEl = document.getElementById('productos-table');
  if (!tableEl) return;

  if (_productos.length === 0) {
    tableEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${lucideIcon('package', 24)}</div>
        <h3>No se encontraron productos</h3>
        <p>Intenta ajustar los filtros o agrega un nuevo producto</p>
      </div>`;
    return;
  }

  tableEl.innerHTML = `
    <div class="table-scroll-wrap">
      <div class="table-scroll-inner" style="min-width:50rem;">
        <div class="table-header" style="grid-template-columns:2.5fr 1.5fr 1.2fr 1.2fr 0.8fr 1fr 0.6fr; display:grid;">
          <span>Producto</span>
          <span>Código</span>
          <span>Laboratorio</span>
          <span>Categoría</span>
          <span style="text-align:right;">Compra</span>
          <span style="text-align:right;">Venta</span>
          <span style="text-align:center;">Acción</span>
        </div>
        <div id="prod-rows"></div>
      </div>
    </div>`;

  const rows = _productos.map((p, i) => `
    <div class="inventory-row cell anim-fade-up delay-${Math.min(i % 6, 5)}"
         style="grid-template-columns:2.5fr 1.5fr 1.2fr 1.2fr 0.8fr 1fr 0.6fr; display:grid; align-items:center;">
      <div>
        <div style="font-weight:600; font-size:0.8125rem; color:#1c1c1e;">${escHtml(p.nombre)}</div>
        ${p.principioActivo
          ? `<div style="font-size:0.6875rem; color:var(--ios-gray); margin-top:0.1rem;">${escHtml(p.principioActivo)}</div>`
          : ''}
        ${p.requiereReceta
          ? `<span style="font-size:0.625rem; font-weight:700; color:var(--ios-orange); background:rgba(255,149,0,0.1); padding:0.1rem 0.4rem; border-radius:0.3rem;">Receta</span>`
          : ''}
      </div>
      <div>
        <span class="mono" style="font-size:0.6875rem; background:rgba(0,0,0,0.04);
              color:#555; padding:0.125rem 0.5rem; border-radius:0.375rem;">
          ${escHtml(p.codigoBarras)}
        </span>
      </div>
      <div style="font-size:0.8125rem; color:#555;">
        ${p.laboratorio?.nombre ? escHtml(p.laboratorio.nombre) : '<span style="color:var(--ios-gray3);">—</span>'}
      </div>
      <div style="font-size:0.8125rem; color:#555;">
        ${p.categoria?.nombre ? escHtml(p.categoria.nombre) : '<span style="color:var(--ios-gray3);">—</span>'}
      </div>
      <div style="text-align:right; font-size:0.8125rem; color:var(--ios-gray2); font-variant-numeric:tabular-nums;">
        ${fmtMoney(p.precioCompra)}
      </div>
      <div style="text-align:right; font-size:0.8125rem; font-weight:700; color:#1c1c1e; font-variant-numeric:tabular-nums;">
        ${fmtMoney(p.precioVenta)}
      </div>
      <div style="display:flex; justify-content:center;">
        <button class="btn btn-ghost btn-sm btn-edit" data-id="${p.id}" style="padding:0.375rem;" title="Editar">
          ${lucideIcon('edit-2', 14)}
        </button>
      </div>
    </div>`).join('');

  document.getElementById('prod-rows').innerHTML = rows;

  // Eventos de editar
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const prod = _productos.find(p => p.id === parseInt(btn.dataset.id));
      if (prod) abrirModal(prod);
    });
  });
}

function renderPaginacion() {
  const pagEl = document.getElementById('paginacion');
  const info  = document.getElementById('pag-info');
  const prev  = document.getElementById('btn-prev');
  const next  = document.getElementById('btn-next');
  if (!pagEl) return;

  pagEl.style.display = _pagination.total > 0 ? 'flex' : 'none';
  if (info) info.textContent = `Página ${_pagination.page} de ${_pagination.totalPages} · ${_pagination.total} productos`;
  if (prev) prev.disabled = _pagination.page <= 1;
  if (next) next.disabled = _pagination.page >= _pagination.totalPages;
}

// ── Modal ──────────────────────────────────────────────────────

let _editandoId    = null;
// Array en memoria de ingredientes mientras el modal está abierto
// Cada item: { ingrediente, concentracion, tipo: 'ACTIVO'|'EXCIPIENTE' }
let _ingredientes  = [];

async function abrirModal(producto) {
  const modal = document.getElementById('modal-producto');
  if (!modal) return;

  _editandoId   = producto?.id || null;
  _ingredientes = [];

  document.getElementById('modal-titulo').textContent =
    producto ? 'Editar Producto' : 'Nuevo Producto';
  document.getElementById('form-error').style.display = 'none';

  // Selectores de laboratorio y categoría
  const fLab = document.getElementById('f-laboratorio');
  const fCat = document.getElementById('f-categoria');
  fLab.innerHTML = '<option value="">— Sin laboratorio —</option>';
  fCat.innerHTML = '<option value="">— Sin categoría —</option>';
  _laboratorios.forEach(l => { fLab.innerHTML += `<option value="${l.id}">${escHtml(l.nombre)}</option>`; });
  _categorias.forEach(c =>   { fCat.innerHTML += `<option value="${c.id}">${escHtml(c.nombre)}</option>`; });

  // Campos básicos
  document.getElementById('f-codigo').value        = producto?.codigoBarras || '';
  document.getElementById('f-nombre').value        = producto?.nombre || '';
  document.getElementById('f-principio').value     = producto?.principioActivo || '';
  document.getElementById('f-descripcion').value   = producto?.descripcion || '';
  document.getElementById('f-precio-compra').value = producto ? Number(producto.precioCompra).toFixed(2) : '';
  document.getElementById('f-precio-venta').value  = producto ? Number(producto.precioVenta).toFixed(2) : '';
  document.getElementById('f-receta').checked      = producto?.requiereReceta || false;
  if (producto?.laboratorioId) fLab.value = producto.laboratorioId;
  if (producto?.categoriaId)   fCat.value = producto.categoriaId;

  // Cargar composición existente si es edición
  if (_editandoId) {
    try {
      const res = await composicionService.getByProducto(_editandoId);
      _ingredientes = (res.data || []).map(c => ({
        ingrediente:   c.ingrediente,
        concentracion: c.concentracion || '',
        tipo:          c.tipo,
      }));
    } catch {
      _ingredientes = [];
    }
  }

  renderComposicionLista();

  modal.style.display = 'flex';
  document.getElementById('f-nombre').focus();

  // Botón agregar ingrediente
  document.getElementById('btn-add-ingrediente')?.addEventListener('click', agregarIngrediente);
}

function cerrarModal() {
  const modal = document.getElementById('modal-producto');
  if (modal) modal.style.display = 'none';
  _editandoId   = null;
  _ingredientes = [];
}

// ── Composición en el modal ────────────────────────────────────

function renderComposicionLista() {
  const lista = document.getElementById('composicion-lista');
  const vacia = document.getElementById('composicion-vacia');
  if (!lista) return;

  // Limpiar filas anteriores (conservar el párrafo "vacío")
  lista.querySelectorAll('.comp-row').forEach(el => el.remove());

  if (_ingredientes.length === 0) {
    if (vacia) vacia.style.display = 'block';
    return;
  }
  if (vacia) vacia.style.display = 'none';

  _ingredientes.forEach((ing, idx) => {
    const row = document.createElement('div');
    row.className = 'comp-row';
    row.style.cssText = `
      display:grid; grid-template-columns:1fr 7rem 6rem auto;
      gap:0.5rem; align-items:center;
      padding:0.5rem 0.625rem; border-radius:0.625rem;
      background:${ing.tipo === 'ACTIVO' ? 'rgba(0,199,190,0.06)' : 'rgba(0,0,0,0.03)'};
      border:1px solid ${ing.tipo === 'ACTIVO' ? 'rgba(0,199,190,0.2)' : 'rgba(0,0,0,0.07)'};`;

    row.innerHTML = `
      <input class="input comp-nombre" type="text" value="${escHtml(ing.ingrediente)}"
             placeholder="Nombre del ingrediente" style="font-size:0.8125rem; height:2rem; padding:0 0.625rem;" />
      <input class="input comp-conc" type="text" value="${escHtml(ing.concentracion || '')}"
             placeholder="500mg, 5%…" style="font-size:0.8125rem; height:2rem; padding:0 0.625rem;" />
      <select class="input comp-tipo" style="font-size:0.75rem; height:2rem; padding:0 0.375rem;">
        <option value="ACTIVO"     ${ing.tipo === 'ACTIVO'     ? 'selected' : ''}>Activo</option>
        <option value="EXCIPIENTE" ${ing.tipo === 'EXCIPIENTE' ? 'selected' : ''}>Excipiente</option>
      </select>
      <button type="button" class="btn btn-ghost btn-sm comp-del" data-idx="${idx}"
              style="padding:0.25rem; color:var(--ios-red);">
        ${lucideIcon('trash-2', 13)}
      </button>`;

    // Sincronizar cambios en tiempo real con _ingredientes
    row.querySelector('.comp-nombre').addEventListener('input', e => {
      _ingredientes[idx].ingrediente = e.target.value;
    });
    row.querySelector('.comp-conc').addEventListener('input', e => {
      _ingredientes[idx].concentracion = e.target.value;
    });
    row.querySelector('.comp-tipo').addEventListener('change', e => {
      _ingredientes[idx].tipo = e.target.value;
      renderComposicionLista(); // re-render para actualizar colores
    });
    row.querySelector('.comp-del').addEventListener('click', () => {
      _ingredientes.splice(idx, 1);
      renderComposicionLista();
    });

    lista.appendChild(row);
  });
}

function agregarIngrediente() {
  _ingredientes.push({ ingrediente: '', concentracion: '', tipo: 'ACTIVO' });
  renderComposicionLista();
  // Enfocar el último campo de nombre
  const inputs = document.querySelectorAll('.comp-nombre');
  inputs[inputs.length - 1]?.focus();
}

// ── Guardar producto + composición ────────────────────────────

async function guardarProducto(e) {
  e.preventDefault();
  const errorEl  = document.getElementById('form-error');
  const btnGuard = document.getElementById('btn-guardar');
  errorEl.style.display = 'none';

  // Validar ingredientes: nombre no vacío
  const ingConNombreVacio = _ingredientes.some(i => !i.ingrediente.trim());
  if (ingConNombreVacio) {
    mostrarError('Cada ingrediente de la composición debe tener un nombre.');
    return;
  }

  const data = {
    codigoBarras:    document.getElementById('f-codigo').value.trim(),
    nombre:          document.getElementById('f-nombre').value.trim(),
    principioActivo: document.getElementById('f-principio').value.trim() || undefined,
    descripcion:     document.getElementById('f-descripcion').value.trim() || undefined,
    precioCompra:    parseFloat(document.getElementById('f-precio-compra').value),
    precioVenta:     parseFloat(document.getElementById('f-precio-venta').value),
    requiereReceta:  document.getElementById('f-receta').checked,
    laboratorioId:   parseInt(document.getElementById('f-laboratorio').value) || undefined,
    categoriaId:     parseInt(document.getElementById('f-categoria').value)   || undefined,
  };

  if (!data.codigoBarras || !data.nombre || isNaN(data.precioCompra) || isNaN(data.precioVenta)) {
    mostrarError('Completa los campos obligatorios (*).');
    return;
  }
  if (data.precioVenta < data.precioCompra) {
    mostrarError('El precio de venta no puede ser menor al precio de compra.');
    return;
  }

  btnGuard.disabled = true;
  btnGuard.innerHTML = `<span class="spinner spinner-sm"></span> Guardando...`;

  try {
    let productoId = _editandoId;

    if (_editandoId) {
      await productoService.update(_editandoId, data);
    } else {
      const res  = await productoService.create(data);
      productoId = res.data?.id;
    }

    // Guardar composición si hay ingredientes (o si se borraron todos en edición)
    if (productoId && (_ingredientes.length > 0 || _editandoId)) {
      const ingredientesLimpios = _ingredientes
        .filter(i => i.ingrediente.trim())
        .map((i, idx) => ({
          ingrediente:   i.ingrediente.trim(),
          concentracion: i.concentracion.trim() || undefined,
          tipo:          i.tipo,
          orden:         idx,
        }));
      await composicionService.upsert(productoId, ingredientesLimpios);
    }

    cerrarModal();
    _pagination.page = 1;
    await loadProductos();
  } catch (err) {
    mostrarError(err.message || 'Error al guardar el producto.');
  } finally {
    btnGuard.disabled = false;
    btnGuard.innerHTML = `${lucideIcon('check', 14)} Guardar`;
  }
}

function mostrarError(msg) {
  const el = document.getElementById('form-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}
