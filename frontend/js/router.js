/**
 * router.js — Hash-based SPA router
 * Rutas: #/login  #/dashboard  #/inventario  #/pos  #/transferencias
 */
import { isLoggedIn } from './auth.js';
import { renderSidebar, updateSidebarActive } from './sidebar.js';

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
  const hash = window.location.hash || '#/dashboard';
  const sidebar = document.getElementById('sidebar');
  const content = document.getElementById('content');

  // Guard: si no está logueado y la ruta es privada → login
  if (!isLoggedIn() && !PUBLIC_ROUTES.has(hash)) {
    window.location.hash = '#/login';
    return;
  }

  // Guard: si está logueado y va a /login → dashboard
  if (isLoggedIn() && hash === '#/login') {
    window.location.hash = '#/dashboard';
    return;
  }

  // Mostrar / ocultar sidebar
  if (PUBLIC_ROUTES.has(hash)) {
    sidebar.style.display = 'none';
  } else {
    renderSidebar();
    updateSidebarActive();
  }

  // Mostrar spinner mientras carga la página
  content.innerHTML = `
    <div class="page-spinner">
      <span class="spinner spinner-lg" style="color:var(--mint-500);"></span>
      <p>Cargando...</p>
    </div>`;

  // Cargar módulo de página
  const loader = ROUTES[hash];
  if (!loader) {
    // Ruta no encontrada → dashboard
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

// Escuchar cambios de hash
window.addEventListener('hashchange', navigate);

// Navegación inicial
navigate();
