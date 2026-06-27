/**
 * transferencias.js — Gestión de transferencias entre sucursales
 */
import { transferenciaService } from '../api.js';
import { getUser } from '../auth.js';
import { lucideIcon, escHtml, fmtDate, fmtDateShort } from '../sidebar.js';

let _transfers = [];
let _filtro    = 'todas';
let _selected  = null;

const ESTADO = {
  PENDIENTE:   { label: 'Pendiente',   icon: 'clock',        cls: 'badge-orange', dotColor: 'var(--ios-orange)' },
  APROBADA:    { label: 'Aprobada',    icon: 'check-circle', cls: 'badge-blue',   dotColor: 'var(--ios-blue)'   },
  EN_TRANSITO: { label: 'En Tránsito', icon: 'truck',        cls: 'badge-purple', dotColor: 'var(--ios-purple)' },
  RECIBIDA:    { label: 'Recibida',    icon: 'package',      cls: 'badge-green',  dotColor: 'var(--ios-green)'  },
  RECHAZADA:   { label: 'Rechazada',   icon: 'x-circle',     cls: 'badge-red',    dotColor: 'var(--ios-red)'    },
};

const FILTROS = [
  { key: 'todas',       label: 'Todas'       },
  { key: 'PENDIENTE',   label: 'Pendientes'  },
  { key: 'APROBADA',    label: 'Aprobadas'   },
  { key: 'EN_TRANSITO', label: 'En Tránsito' },
  { key: 'RECIBIDA',    label: 'Recibidas'   },
  { key: 'RECHAZADA',   label: 'Rechazadas'  },
];

export async function render(container) {
  _selected = null;
  container.innerHTML = `
    <div class="page-container">
      <div class="page-header anim-fade-up">
        <h1 class="large-title">Transferencias</h1>
        <p class="page-subtitle">Gestión de transferencias entre sucursales</p>
      </div>

      <!-- Filtros -->
      <div class="chip-row anim-fade-up" id="chip-row">
        ${FILTROS.map(f => `
          <button class="chip ${f.key === _filtro ? 'active' : ''}" data-key="${f.key}">
            ${f.label}
          </button>`).join('')}
      </div>

      <!-- Grid lista + detalle -->
      <div class="transfer-grid">
        <div class="glass-card anim-fade-up" id="transfer-list" style="overflow:hidden;">
          <div class="page-spinner">
            <span class="spinner spinner-lg" style="color:var(--mint-500);"></span>
            <p>Cargando transferencias...</p>
          </div>
        </div>
        <div class="glass-card anim-fade-up" id="transfer-detail" style="overflow:hidden; min-height:20rem;">
          ${emptyDetail()}
        </div>
      </div>
    </div>

    <!-- Modal de rechazo -->
    <div id="rechazo-modal" style="display:none;" class="modal-overlay">
      <div class="modal-box anim-scale-in">
        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem;">
          <span class="squircle" style="background:rgba(255,59,48,0.12); color:var(--ios-red);">
            ${lucideIcon('x-circle', 17)}
          </span>
          <div>
            <div style="font-size:0.9375rem; font-weight:700; color:#1c1c1e;">Rechazar Transferencia</div>
            <div style="font-size:0.75rem; color:var(--ios-gray); margin-top:0.1rem;">Indica el motivo del rechazo</div>
          </div>
        </div>
        <textarea id="motivo-input" class="input" placeholder="Ej: Stock insuficiente, producto no disponible..."
          style="min-height:6rem; resize:none; line-height:1.5; font-size:0.875rem; margin-bottom:1rem;"></textarea>
        <div style="display:flex; gap:0.5rem;">
          <button id="btn-cancel-modal" class="btn btn-ghost btn-md" style="flex:1;">Cancelar</button>
          <button id="btn-confirm-rechazo" class="btn btn-danger btn-md" style="flex:1;">
            ${lucideIcon('x-circle', 14)} Rechazar
          </button>
        </div>
      </div>
    </div>`;

  // Filtros chips
  document.getElementById('chip-row')?.addEventListener('click', async (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    _filtro = chip.dataset.key;
    _selected = null;
    document.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c.dataset.key === _filtro));
    await loadTransferencias();
  });

  // Modal
  document.getElementById('btn-cancel-modal')?.addEventListener('click', closeModal);
  document.getElementById('rechazo-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'rechazo-modal') closeModal();
  });
  document.getElementById('btn-confirm-rechazo')?.addEventListener('click', confirmRechazo);

  await loadTransferencias();
}

async function loadTransferencias() {
  const listEl = document.getElementById('transfer-list');
  if (!listEl) return;
  listEl.innerHTML = `<div class="page-spinner">
    <span class="spinner spinner-lg" style="color:var(--mint-500);"></span>
    <p>Cargando...</p>
  </div>`;

  try {
    const params = _filtro !== 'todas' ? { estado: _filtro, limit: 50 } : { limit: 50 };
    const res = await transferenciaService.getAll(params);
    _transfers = res.data || [];
  } catch (err) {
    console.error(err);
    _transfers = [];
  }

  renderList();
  renderDetail();
}

function renderList() {
  const listEl = document.getElementById('transfer-list');
  if (!listEl) return;

  if (_transfers.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${lucideIcon('arrow-left-right', 24)}</div>
        <h3>No hay transferencias</h3>
        <p>No se encontraron registros con el filtro actual</p>
      </div>`;
    return;
  }

  listEl.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between;
                padding:0.625rem 1.25rem; background:rgba(0,0,0,0.02);
                border-bottom:1px solid rgba(0,0,0,0.05);">
      <span style="font-size:0.625rem; font-weight:700; text-transform:uppercase;
                   letter-spacing:0.09em; color:var(--ios-gray2);">
        ${_transfers.length} transferencia(s)
      </span>
      <span style="font-size:0.625rem; color:var(--ios-gray3);">Toca para ver detalles</span>
    </div>
    <div id="transfer-rows"></div>`;

  document.getElementById('transfer-rows').innerHTML = _transfers.map((t, i) => {
    const cfg     = ESTADO[t.estado] || ESTADO.PENDIENTE;
    const isActive = _selected?.id === t.id;
    return `
      <div class="cell transfer-row" data-id="${t.id}"
        style="padding:1rem 1.25rem; border-bottom:1px solid rgba(0,0,0,0.04);
               cursor:pointer; transition:background 0.12s;
               border-left:3px solid ${isActive ? 'var(--mint-500)' : 'transparent'};
               background:${isActive ? 'rgba(0,199,190,0.05)' : 'transparent'};">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.5rem;">
          <div style="display:flex; align-items:center; gap:0.625rem;">
            <span class="mono" style="font-size:0.75rem; font-weight:700; color:#3a3a3c;
                   background:rgba(0,0,0,0.04); padding:0.1rem 0.5rem; border-radius:0.375rem;">
              ${escHtml(t.folio)}
            </span>
            <span class="badge ${cfg.cls}">
              ${lucideIcon(cfg.icon, 11)} ${cfg.label}
            </span>
          </div>
          <span style="font-size:0.6875rem; color:var(--ios-gray); display:flex; align-items:center; gap:0.25rem; flex-shrink:0;">
            ${lucideIcon('calendar', 12)} ${fmtDateShort(t.fechaSolicitud)}
          </span>
        </div>
        <div style="display:flex; align-items:center; gap:0.5rem; font-size:0.8125rem;">
          <span style="display:flex; align-items:center; gap:0.25rem; font-weight:600; color:#1c1c1e;">
            ${lucideIcon('map-pin', 12)} ${escHtml(t.sucursalOrigen.nombre)}
          </span>
          <span style="color:var(--mint-500); flex-shrink:0;">${lucideIcon('arrow-right', 14)}</span>
          <span style="font-weight:600; color:#1c1c1e;">${escHtml(t.sucursalDestino.nombre)}</span>
        </div>
        <div style="font-size:0.6875rem; color:var(--ios-gray); margin-top:0.375rem; margin-left:1rem;">
          ${t.detalles.length} producto(s) · por ${escHtml(t.usuarioSolicita.nombre)} ${escHtml(t.usuarioSolicita.apellido)}
        </div>
      </div>`;
  }).join('');

  // Clicks en filas
  document.querySelectorAll('.transfer-row').forEach(row => {
    row.addEventListener('click', () => {
      const id = Number(row.dataset.id);
      _selected = _selected?.id === id ? null : _transfers.find(t => t.id === id) || null;
      renderList();
      renderDetail();
    });
  });
}

function renderDetail() {
  const detailEl = document.getElementById('transfer-detail');
  if (!detailEl) return;

  if (!_selected) {
    detailEl.innerHTML = emptyDetail();
    return;
  }

  const t   = _selected;
  const cfg = ESTADO[t.estado] || ESTADO.PENDIENTE;
  const user = getUser();
  const isOrigen = t.sucursalOrigen.id === user?.sucursalId;

  const infoRows = [
    { label: 'Estado',  val: `<span class="badge ${cfg.cls}">${cfg.label}</span>` },
    { label: 'Origen',  val: `<strong>${escHtml(t.sucursalOrigen.nombre)}</strong>` },
    { label: 'Destino', val: `<strong>${escHtml(t.sucursalDestino.nombre)}</strong>` },
    { label: 'Solicitó',val: `<strong>${escHtml(t.usuarioSolicita.nombre)} ${escHtml(t.usuarioSolicita.apellido)}</strong>` },
    { label: 'Fecha',   val: `<span style="font-size:0.8125rem; color:#555;">${fmtDate(t.fechaSolicitud)}</span>` },
  ];

  const actionsBtns = buildActions(t, isOrigen);

  detailEl.innerHTML = `
    <div style="display:flex; flex-direction:column; height:100%;">
      <!-- Header detalle -->
      <div style="padding:0.875rem 1.25rem; border-bottom:1px solid rgba(0,0,0,0.05);
                  background:rgba(0,0,0,0.015);">
        <div style="font-size:0.875rem; font-weight:700; color:#1c1c1e;">Detalle</div>
        <div class="mono" style="font-size:0.6875rem; color:var(--ios-gray); margin-top:0.125rem;">
          ${escHtml(t.folio)}
        </div>
      </div>

      <div style="flex:1; overflow-y:auto; padding:1.25rem;">
        <!-- Info grid -->
        <div style="border:1px solid rgba(0,0,0,0.05); border-radius:1rem;
                    overflow:hidden; margin-bottom:1.25rem;">
          ${infoRows.map((r, i) => `
            <div style="display:flex; align-items:center; justify-content:space-between;
                        padding:0.625rem 1rem; background:#fff;
                        ${i < infoRows.length-1 ? 'border-bottom:1px solid rgba(0,0,0,0.04);' : ''}">
              <span style="font-size:0.6875rem; font-weight:700; text-transform:uppercase;
                           letter-spacing:0.07em; color:var(--ios-gray2);">${r.label}</span>
              <span style="font-size:0.8125rem;">${r.val}</span>
            </div>`).join('')}
        </div>

        <!-- Productos -->
        <div style="margin-bottom:1.25rem;">
          <div style="font-size:0.625rem; font-weight:700; text-transform:uppercase;
                      letter-spacing:0.1em; color:var(--ios-gray2); margin-bottom:0.625rem; padding-left:0.25rem;">
            Productos (${t.detalles.length})
          </div>
          <div style="display:flex; flex-direction:column; gap:0.5rem;">
            ${t.detalles.map(d => `
              <div style="background:rgba(0,0,0,0.025); border:1px solid rgba(0,0,0,0.04);
                          border-radius:1rem; padding:0.875rem;">
                <div style="font-weight:700; font-size:0.8125rem; color:#1c1c1e; margin-bottom:0.5rem;">
                  ${escHtml(d.producto.nombre)}
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:0.375rem;">
                  <span style="font-size:0.6875rem; background:rgba(0,0,0,0.05); color:#555;
                               padding:0.1rem 0.5rem; border-radius:9999px; font-weight:600;">
                    Solicitado: ${d.cantidadSolicitada}
                  </span>
                  ${d.cantidadEnviada > 0 ? `
                    <span style="font-size:0.6875rem; background:rgba(0,122,255,0.1); color:var(--ios-blue);
                                 padding:0.1rem 0.5rem; border-radius:9999px; font-weight:600;">
                      Enviado: ${d.cantidadEnviada}
                    </span>` : ''}
                  ${d.cantidadRecibida > 0 ? `
                    <span style="font-size:0.6875rem; background:rgba(52,199,89,0.1); color:var(--ios-green);
                                 padding:0.1rem 0.5rem; border-radius:9999px; font-weight:600;">
                      Recibido: ${d.cantidadRecibida}
                    </span>` : ''}
                </div>
              </div>`).join('')}
          </div>
        </div>

        <!-- Acciones -->
        <div style="display:flex; flex-direction:column; gap:0.5rem;" id="detail-actions">
          ${actionsBtns}
        </div>
      </div>
    </div>`;

  // Bind de acciones
  document.getElementById('btn-aprobar')?.addEventListener('click', async () => {
    await runAction(() => transferenciaService.aprobar(t.id), 'btn-aprobar');
  });
  document.getElementById('btn-rechazar')?.addEventListener('click', () => openModal(t.id));
  document.getElementById('btn-enviar')?.addEventListener('click', async () => {
    await runAction(() => transferenciaService.enviar(t.id, {
      detalles: t.detalles.map(d => ({ detalleId: d.id, cantidadEnviada: d.cantidadSolicitada }))
    }), 'btn-enviar');
  });
  document.getElementById('btn-recibir')?.addEventListener('click', async () => {
    await runAction(() => transferenciaService.recibir(t.id, {
      detalles: t.detalles.map(d => ({ detalleId: d.id, cantidadRecibida: d.cantidadEnviada || d.cantidadSolicitada }))
    }), 'btn-recibir');
  });
}

function buildActions(t, isOrigen) {
  if (t.estado === 'PENDIENTE' && isOrigen) return `
    <button id="btn-aprobar" class="btn btn-success btn-md btn-full">
      ${lucideIcon('check-circle', 15)} Aprobar Transferencia
    </button>
    <button id="btn-rechazar" class="btn btn-danger btn-md btn-full">
      ${lucideIcon('x-circle', 15)} Rechazar
    </button>`;

  if (t.estado === 'APROBADA' && isOrigen) return `
    <button id="btn-enviar" class="btn btn-purple btn-md btn-full">
      ${lucideIcon('truck', 15)} Enviar Mercancía
    </button>`;

  if (t.estado === 'EN_TRANSITO' && !isOrigen) return `
    <button id="btn-recibir" class="btn btn-success btn-md btn-full">
      ${lucideIcon('package', 15)} Recibir Mercancía
    </button>`;

  if (['RECIBIDA', 'RECHAZADA'].includes(t.estado)) return `
    <div class="alert" style="background:rgba(0,0,0,0.03); color:var(--ios-gray); border-color:transparent; font-size:0.8125rem;">
      ${lucideIcon('alert-circle', 15)}
      Esta transferencia ya fue ${t.estado === 'RECIBIDA' ? 'completada' : 'rechazada'} y no requiere más acciones.
    </div>`;

  return '';
}

async function runAction(fn, btnId) {
  const btn = document.getElementById(btnId);
  if (btn) { btn.disabled = true; btn.innerHTML = `<span class="spinner spinner-sm" style="color:#fff;"></span>`; }
  try {
    await fn();
    _selected = null;
    await loadTransferencias();
  } catch (err) {
    console.error(err);
    if (btn) { btn.disabled = false; }
  }
}

// ── Modal de rechazo ──────────────────────────────────────────
let _rechazandoId = null;

function openModal(id) {
  _rechazandoId = id;
  const modal = document.getElementById('rechazo-modal');
  const input = document.getElementById('motivo-input');
  if (modal) modal.style.display = 'flex';
  if (input) { input.value = ''; setTimeout(() => input.focus(), 50); }
}

function closeModal() {
  const modal = document.getElementById('rechazo-modal');
  if (modal) modal.style.display = 'none';
  _rechazandoId = null;
}

async function confirmRechazo() {
  const motivo = document.getElementById('motivo-input')?.value.trim();
  if (!motivo || _rechazandoId === null) return;

  const btn = document.getElementById('btn-confirm-rechazo');
  if (btn) { btn.disabled = true; btn.innerHTML = `<span class="spinner spinner-sm" style="color:#fff;"></span>`; }

  try {
    await transferenciaService.rechazar(_rechazandoId, motivo);
    closeModal();
    _selected = null;
    await loadTransferencias();
  } catch (err) {
    console.error(err);
    if (btn) { btn.disabled = false; btn.innerHTML = `${lucideIcon('x-circle', 14)} Rechazar`; }
  }
}

function emptyDetail() {
  return `
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center;
                height:100%; min-height:20rem; padding:2rem; text-align:center; color:var(--ios-gray3);">
      ${lucideIcon('eye', 56)}
      <div style="font-size:0.9375rem; font-weight:700; color:var(--ios-gray); margin-top:1rem;">
        Sin selección
      </div>
      <div style="font-size:0.8125rem; color:var(--ios-gray2); margin-top:0.375rem; max-width:14rem; line-height:1.5;">
        Selecciona una transferencia de la lista para ver sus detalles y acciones
      </div>
    </div>`;
}
