/**
 * api.js — Fetch wrapper con interceptor de autenticación JWT
 * Reemplaza Axios. Mismo contrato que el servicio anterior.
 */

const BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : 'https://sistema-api-1e7d.onrender.com/api';

/**
 * Petición autenticada con fetch nativo.
 * @param {string} path  — ruta relativa (ej: '/auth/login')
 * @param {RequestInit} options — opciones fetch
 * @returns {Promise<any>} — data del JSON o lanza Error
 */
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(BASE_URL + path, { ...options, headers });

  // Token expirado / inválido
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.hash = '#/login';
    throw new Error('Sesión expirada');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || `Error ${response.status}`);
  }

  return data;
}

// ──────────────────────────────────────────────────────────────
// Servicios (mismas rutas que el backend)
// ──────────────────────────────────────────────────────────────

export const authService = {
  login:      (email, password) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getProfile: ()                => apiFetch('/auth/profile'),
};

export const productoService = {
  getAll:      (params = {}) => apiFetch('/productos?' + new URLSearchParams(params)),
  getById:     (id)          => apiFetch(`/productos/${id}`),
  getByBarcode:(codigo)      => apiFetch(`/productos/barcode/${encodeURIComponent(codigo)}`),
  create:      (data)        => apiFetch('/productos', { method: 'POST', body: JSON.stringify(data) }),
  update:      (id, data)    => apiFetch(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const laboratorioService = {
  getAll: (params = {}) => apiFetch('/laboratorios?' + new URLSearchParams({ limit: 200, ...params })),
};

export const categoriaService = {
  getAll: (params = {}) => apiFetch('/categorias?' + new URLSearchParams({ limit: 200, ...params })),
};

export const inventarioService = {
  getBySucursal: (params = {}) => apiFetch('/inventario?' + new URLSearchParams(params)),
  getStockBajo:  ()            => apiFetch('/inventario/stock-bajo'),
  getSinStock:   ()            => apiFetch('/inventario/sin-stock'),
  getResumen:    ()            => apiFetch('/inventario/resumen'),
};

export const loteService = {
  getAll:            (params = {}) => apiFetch('/lotes?' + new URLSearchParams(params)),
  getProximosVencer: (params = {}) => apiFetch('/lotes/proximos-vencer?' + new URLSearchParams(params)),
  create:            (data)        => apiFetch('/lotes', { method: 'POST', body: JSON.stringify(data) }),
  update:            (id, data)    => apiFetch(`/lotes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const ventaService = {
  procesarVenta: (data)   => apiFetch('/ventas', { method: 'POST', body: JSON.stringify(data) }),
  getDelDia:     ()       => apiFetch('/ventas/del-dia'),
};

export const transferenciaService = {
  getAll:   (params = {})       => apiFetch('/transferencias?' + new URLSearchParams(params)),
  aprobar:  (id, notas = '')    => apiFetch(`/transferencias/${id}/aprobar`, { method: 'PUT', body: JSON.stringify({ notas }) }),
  rechazar: (id, motivo)        => apiFetch(`/transferencias/${id}/rechazar`, { method: 'PUT', body: JSON.stringify({ motivo }) }),
  enviar:   (id, data)          => apiFetch(`/transferencias/${id}/enviar`, { method: 'PUT', body: JSON.stringify(data) }),
  recibir:  (id, data)          => apiFetch(`/transferencias/${id}/recibir`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const composicionService = {
  getByProducto:      (productoId)           => apiFetch(`/composicion/producto/${productoId}`),
  upsert:             (productoId, ingredientes) =>
    apiFetch(`/composicion/producto/${productoId}`, {
      method: 'PUT',
      body: JSON.stringify({ ingredientes }),
    }),
  buscarPorIngrediente: (ingrediente, sucursalId) => {
    const params = new URLSearchParams({ ingrediente });
    if (sucursalId) params.set('sucursalId', sucursalId);
    return apiFetch(`/composicion/buscar?${params}`);
  },
  getIngredientesActivos: (q = '') =>
    apiFetch(`/composicion/ingredientes?q=${encodeURIComponent(q)}`),
};
