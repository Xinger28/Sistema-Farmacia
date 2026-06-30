/**
 * router.js — Hash-based SPA router con soporte responsive
 */
import { isLoggedIn } from './auth.js';
import { renderSidebar, updateSidebarActive, openMobileSidebar } from './sidebar.js';

const ROUTES = {
  '#/login':          () => import('./pages/login.js'),
  '#/dashboard':      () => import('./pages/dashboard.js'),
  '#/inventario':     () => import('./pages/inventario.js'),
  '#/productos':      () => import('./pages/productos.js'),
  '#/lotes':          () => import('./pages/lotes.js'),
  '#/composicion':    () => import('./pages/composicion.js'),
  '#/pos':            () => import('./pages/pos.js'),
  '#/transferencias': () => import('./pages/transferencias.js'),
};

const PUBLIC_ROUTES = new Set(['#/login']);

async function navigate() {
  const hash    = window.location.hash || '#/dashboard';
  const sidebar = document.getElementById('sidebar');
  const content = document.getElementById('content');
  const topbar  = document.getElementById('mobile-topbar');

  // Guard: no logueado → login
  if (!isLoggedIn() && !PUBLIC_ROUTES.has(hash)) {
    window.location.hash = '#/login';
    return;
  }

  // Guard: logueado → dashboard
  if (isLoggedIn() && hash === '#/login') {
    window.location.hash = '#/dashboard';
    return;
  }

  if (PUBLIC_ROUTES.has(hash)) {
    // Ocultar sidebar y topbar en login
    sidebar.style.display  = 'none';
    if (topbar) topbar.style.display = 'none';
  } else {
    // Renderizar sidebar (solo 1ª vez, las siguientes solo actualiza activo)
    renderSidebar();
    // Mostrar topbar móvil
    if (topbar) topbar.style.display = 'flex';
  }

  // Spinner mientras carga
  content.innerHTML = `
    <div class="page-spinner">
      <span class="spinner spinner-lg" style="color:var(--mint-500);"></span>
      <p>Cargando...</p>
    </div>`;

  const loader = ROUTES[hash];
  if (!loader) {
    window.location.hash = isLoggedIn() ? '#/dashboard' : '#/login';
    return;
  }

  try {
    const mod = await loader();
    await mod.render(content);
  } catch (err) {
    console.error('Error rendering page:', err);
    content.innerHTML = `
      <div class="page-spinner">
        <p style="color:var(--ios-red);">Error al cargar la página</p>
        <button class="btn btn-primary btn-md" onclick="window.location.hash='#/dashboard'">
          Volver al inicio
        </button>
      </div>`;
  }
}

window.addEventListener('hashchange', navigate);
navigate();
