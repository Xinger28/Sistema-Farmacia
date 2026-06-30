/**
 * sidebar.js — Sidebar renderizado UNA SOLA VEZ.
 * El router solo llama updateSidebarActive() en navegaciones posteriores.
 */
import { getUser, clearSession } from './auth.js';

const NAV_ITEMS = [
  { hash: '#/dashboard',      label: 'Dashboard',       iconColor: 'sq-mint',   icon: 'layout-dashboard' },
  { hash: '#/inventario',     label: 'Inventario',      iconColor: 'sq-blue',   icon: 'package' },
  { hash: '#/productos',      label: 'Productos',       iconColor: 'sq-indigo', icon: 'pill' },
  { hash: '#/lotes',          label: 'Lotes',           iconColor: 'sq-orange', icon: 'calendar-clock' },
  { hash: '#/composicion',    label: 'Composición',     iconColor: 'sq-teal',   icon: 'flask-conical' },
  { hash: '#/pos',            label: 'Punto de Venta',  iconColor: 'sq-green',  icon: 'shopping-cart' },
  { hash: '#/transferencias', label: 'Transferencias',  iconColor: 'sq-purple', icon: 'arrow-left-right' },
];

let _sidebarReady = false;

/**
 * Renderiza el sidebar completo SOLO la primera vez.
 * En llamadas posteriores solo actualiza el item activo.
 */
export function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const user = getUser();
  if (!user) { sidebar.style.display = 'none'; return; }

  sidebar.style.display = 'flex';

  // Si ya está renderizado, solo actualizar activo
  if (_sidebarReady) {
    updateSidebarActive();
    return;
  }

  const initials = ((user.nombre?.[0] || '') + (user.apellido?.[0] || '')).toUpperCase();

  sidebar.innerHTML = `
    <!-- Botón hamburguesa (solo móvil) -->
    <button id="sidebar-close" class="sidebar-close-btn" aria-label="Cerrar menú">
      ${lucideIcon('x', 20)}
    </button>

    <!-- Brand -->
    <div class="sidebar-brand">
      <div class="sidebar-brand-inner">
        <div class="sidebar-logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
        <div>
          <div class="sidebar-brand-name">Farmacia</div>
          <div class="sidebar-brand-sub">${escHtml(user.sucursal?.nombre || 'Sucursal')}</div>
        </div>
      </div>
      <div class="sidebar-divider" style="margin-top:1rem;"></div>
    </div>

    <!-- Nav -->
    <nav class="sidebar-nav">
      <span class="sidebar-nav-label">Menú Principal</span>
      ${NAV_ITEMS.map((item, i) => `
        <a href="${item.hash}"
           class="sidebar-item anim-slide-right delay-${i + 1}"
           data-hash="${item.hash}">
          <span class="squircle nav-icon ${item.iconColor}">
            ${lucideIcon(item.icon, 17)}
          </span>
          <span class="nav-label">${item.label}</span>
          <span class="nav-chevron">${lucideIcon('chevron-right', 14)}</span>
        </a>
      `).join('')}
    </nav>

    <!-- User block -->
    <div class="sidebar-user">
      <div class="sidebar-user-inner">
        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.625rem;">
          <div class="user-avatar">${initials}</div>
          <div style="min-width:0;">
            <div class="user-name">${escHtml(user.nombre)} ${escHtml(user.apellido)}</div>
            <div class="user-role">${escHtml((user.rol || '').replace(/_/g, ' ').toLowerCase())}</div>
          </div>
        </div>
        <button id="btn-logout"
          class="btn btn-ghost btn-sm btn-full"
          style="color:var(--ios-red); font-size:0.75rem;">
          ${lucideIcon('log-out', 14)}
          Cerrar Sesión
        </button>
      </div>
      <div class="sidebar-version">v1.0.0</div>
    </div>
  `;

  // Cerrar sidebar en móvil al hacer click en un item
  sidebar.querySelectorAll('.sidebar-item').forEach(el => {
    el.addEventListener('click', () => {
      if (window.innerWidth < 768) closeMobileSidebar();
    });
  });

  // Botón X para cerrar en móvil
  document.getElementById('sidebar-close')?.addEventListener('click', closeMobileSidebar);

  // Logout
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    clearSession();
    _sidebarReady = false;
    window.location.hash = '#/login';
  });

  _sidebarReady = true;
  updateSidebarActive();
}

/** Solo actualiza la clase active — sin tocar el DOM del sidebar */
export function updateSidebarActive() {
  const currentHash = window.location.hash || '#/dashboard';
  document.querySelectorAll('.sidebar-item').forEach(el => {
    el.classList.toggle('active', el.dataset.hash === currentHash);
  });
}

/** Resetea el flag para que se re-renderice tras logout */
export function resetSidebar() {
  _sidebarReady = false;
}

// ── Hamburguesa (móvil) ───────────────────────────────────────

export function openMobileSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebar-overlay');
  sidebar?.classList.add('sidebar-open');
  if (overlay) overlay.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

export function closeMobileSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebar-overlay');
  sidebar?.classList.remove('sidebar-open');
  if (overlay) overlay.style.display = 'none';
  document.body.style.overflow = '';
}

// ──────────────────────────────────────────────────────────────
// Helpers exportados (usados por pages)
// ──────────────────────────────────────────────────────────────

export function lucideIcon(name, size = 18) {
  const icons = {
    'layout-dashboard': `<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>`,
    'package':          `<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>`,
    'shopping-cart':    `<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>`,
    'arrow-left-right': `<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>`,
    'chevron-right':    `<path d="m9 18 6-6-6-6"/>`,
    'chevron-left':     `<path d="m15 18-6-6 6-6"/>`,
    'log-out':          `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>`,
    'x':                `<path d="M18 6 6 18"/><path d="m6 6 12 12"/>`,
    'menu':             `<line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/>`,
    'heart-pulse':      `<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>`,
    'search':           `<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>`,
    'scan-line':        `<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/>`,
    'alert-triangle':   `<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><circle cx="12" cy="17" r="1" fill="currentColor"/>`,
    'alert-circle':     `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="1" fill="currentColor"/>`,
    'check-circle-2':   `<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>`,
    'x-circle':         `<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>`,
    'trending-down':    `<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>`,
    'trending-up':      `<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>`,
    'dollar-sign':      `<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>`,
    'calendar-clock':   `<path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h5"/><circle cx="17.5" cy="17.5" r="4.5"/><path d="M17.5 15v2.5l1.5 1.5"/>`,
    'calendar':         `<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>`,
    'map-pin':          `<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>`,
    'arrow-right':      `<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>`,
    'clock':            `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,
    'check-circle':     `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>`,
    'truck':            `<path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect x="9" y="11" width="14" height="10" rx="2"/><circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>`,
    'eye':              `<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>`,
    'eye-off':          `<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/>`,
    'mail':             `<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>`,
    'lock':             `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`,
    'arrow-right-circle': `<circle cx="12" cy="12" r="10"/><path d="M12 8l4 4-4 4"/><path d="M8 12h8"/>`,
    'trash-2':          `<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>`,
    'plus':             `<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`,
    'minus':            `<line x1="5" y1="12" x2="19" y2="12"/>`,
    'credit-card':      `<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>`,
    'banknote':         `<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>`,
    'check':            `<polyline points="20 6 9 17 4 12"/>`,
    'rotate-ccw':       `<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>`,
    'receipt':          `<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>`,
    'tag':              `<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>`,
    'refresh-cw':       `<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>`,
    'pill':             `<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>`,
    'edit-2':           `<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>`,
    'flask-conical':    `<path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/>`,
    'barcode':          `<path d="M3 5v14"/><path d="M8 5v14"/><path d="M12 5v14"/><path d="M17 5v14"/><path d="M21 5v14"/>`,
    'zap':              `<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>`,
    'search-x':         `<path d="m13.5 8.5-5 5"/><path d="m8.5 8.5 5 5"/><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>`,
    'building-2':       `<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>`,
    'layers':           `<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>`,
    'info':             `<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>`,
    'wifi-off':         `<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 4.72-2.37"/><path d="M22.58 9a16 16 0 0 0-4.72-2.37"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/><line x1="2" y1="2" x2="22" y2="22"/>`,
    'check-circle':     `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>`,
    'package-plus':     `<path d="M16 16h6"/><path d="M19 13v6"/><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/><path d="m3.29 7 8.71 5 8.7-5"/><path d="M12 22V12"/>`,
  };
  const paths = icons[name] || `<circle cx="12" cy="12" r="10"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
    style="display:block;flex-shrink:0;">${paths}</svg>`;
}

export function escHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function fmtMoney(val) {
  return 'Bs. ' + Number(val || 0).toFixed(2);
}

export function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtDateShort(iso) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

export function daysUntil(iso) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}
