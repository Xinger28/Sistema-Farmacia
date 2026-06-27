/**
 * dashboard.js — Página de Dashboard
 */
import { inventarioService, ventaService, loteService } from '../api.js';
import { getUser } from '../auth.js';
import { lucideIcon, escHtml, fmtMoney, fmtDateShort, daysUntil } from '../sidebar.js';

export async function render(container) {
  const user = getUser();

  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  // Skeleton inicial
  container.innerHTML = `
    <div class="page-container">
      <div class="page-header anim-fade-up">
        <p class="page-eyebrow">${today}</p>
        <h1 class="large-title">Hola, ${escHtml(user?.nombre || '')} 👋</h1>
        <p class="page-subtitle">
          <span id="sucursal-badge" style="
            display:inline-flex; align-items:center; gap:0.375rem;
            background:rgba(0,199,190,0.1); color:var(--mint-700);
            padding:0.1875rem 0.625rem; border-radius:9999px;
            font-size:0.75rem; font-weight:700;">
            <span style="width:6px;height:6px;border-radius:50%;
                         background:var(--mint-500);" class="anim-pulse"></span>
            ${escHtml(user?.sucursal?.nombre || 'Sucursal')}
          </span>
          &nbsp;·&nbsp;Resumen del día
        </p>
      </div>

      <!-- Stats -->
      <div class="stats-grid" id="stats-grid">
        ${[0,1,2,3].map(i => `
          <div class="stat-card delay-${i+1} anim-fade-up" style="background:#fff; min-height:7rem;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div class="squircle" style="background:var(--ios-gray5);"></div>
            </div>
            <div style="height:1.75rem; background:var(--ios-gray5); border-radius:0.5rem; margin-top:1rem; width:3.5rem;"></div>
            <div style="height:0.75rem; background:var(--ios-gray5); border-radius:0.5rem; margin-top:0.5rem; width:5rem;"></div>
          </div>
        `).join('')}
      </div>

      <!-- Panels -->
      <div class="two-col">
        <div class="glass-card anim-fade-up delay-4" id="panel-vencimiento" style="overflow:hidden;">
          <div class="page-spinner"><span class="spinner spinner-md" style="color:var(--mint-500);"></span></div>
        </div>
        <div class="glass-card anim-fade-up delay-5" id="panel-ventas" style="overflow:hidden;">
          <div class="page-spinner"><span class="spinner spinner-md" style="color:var(--mint-500);"></span></div>
        </div>
      </div>
    </div>`;

  // Cargar datos en paralelo
  let resumen = null, ventas = null, vencimientos = [];
  try {
    const [r, v, ve] = await Promise.all([
      inventarioService.getResumen(),
      ventaService.getDelDia(),
      loteService.getProximosVencer({ dias: 90 }),
    ]);
    resumen     = r.data;
    ventas      = v.data;
    vencimientos = ve.data || [];
  } catch (err) {
    console.error('Dashboard data error:', err);
  }

  // Renderizar stats
  const statsData = [
    { label: 'Con Stock',   value: resumen?.productosConStock || 0, sub: 'productos disponibles', cls: 'stat-mint',   sq: 'sq-mint',   icon: 'package' },
    { label: 'Sin Stock',   value: resumen?.sinStock || 0,           sub: 'agotados',              cls: 'stat-red',    sq: 'sq-red',    icon: 'alert-triangle' },
    { label: 'Stock Bajo',  value: resumen?.stockBajo || 0,          sub: 'por reponer',            cls: 'stat-orange', sq: 'sq-orange', icon: 'trending-down' },
    { label: 'Ventas Hoy', value: ventas?.totalVentas || 0,          sub: 'transacciones',          cls: 'stat-green',  sq: 'sq-green',  icon: 'shopping-cart' },
  ];

  document.getElementById('stats-grid').innerHTML = statsData.map((s, i) => `
    <div class="stat-card ${s.cls} delay-${i+1} anim-fade-up">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <span class="squircle ${s.sq}">${lucideIcon(s.icon, 17)}</span>
        <span style="color:var(--ios-gray3);">${lucideIcon('trending-up', 14)}</span>
      </div>
      <div class="stat-value tabular">${s.value}</div>
      <div class="stat-name" style="color:#3a3a3c;">${s.label}</div>
      <div class="stat-sub">${s.sub}</div>
    </div>
  `).join('');

  // Panel vencimientos
  const panelVenc = document.getElementById('panel-vencimiento');
  panelVenc.innerHTML = `
    <div style="display:flex; align-items:center; gap:0.75rem; padding:1rem 1.5rem;
                border-bottom:1px solid rgba(0,0,0,0.05);">
      <span class="squircle sq-soft-orange">${lucideIcon('calendar-clock', 17)}</span>
      <div style="flex:1;">
        <div style="font-size:0.875rem; font-weight:700; color:#1c1c1e;">Próximos a Vencer</div>
        <div style="font-size:0.6875rem; color:var(--ios-gray); margin-top:0.1rem;">Siguientes 90 días</div>
      </div>
      ${vencimientos.length > 0 ? `<span class="badge badge-orange">${vencimientos.length}</span>` : ''}
    </div>
    <div style="padding:0.75rem;">
      ${vencimientos.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon" style="background:rgba(52,199,89,0.1); color:var(--ios-green);">
            ${lucideIcon('check-circle-2', 24)}
          </div>
          <h3 style="font-size:0.875rem;">Todo en orden</h3>
          <p>No hay productos próximos a vencer</p>
        </div>
      ` : vencimientos.slice(0, 6).map((lote, i) => {
        const days = daysUntil(lote.fechaVencimiento);
        const isUrgent = days <= 30;
        return `
          <div class="cell" style="display:flex; align-items:center; justify-content:space-between;
                                   padding:0.625rem 0.5rem; border-radius:0.75rem;">
            <div style="min-width:0; flex:1;">
              <div style="font-weight:600; font-size:0.8125rem; color:#1c1c1e;
                          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${escHtml(lote.producto?.nombre || '—')}
              </div>
              <div class="mono" style="font-size:0.6875rem; color:var(--ios-gray); margin-top:0.1rem;">
                Lote ${escHtml(lote.numeroLote || '')}
              </div>
            </div>
            <div style="text-align:right; margin-left:0.75rem; flex-shrink:0;">
              <span class="badge ${isUrgent ? 'badge-red' : 'badge-orange'}">
                ${fmtDateShort(lote.fechaVencimiento)}
              </span>
              <div style="font-size:0.625rem; color:var(--ios-gray); margin-top:0.25rem;">
                ${days}d · ${lote.cantidad} uds
              </div>
            </div>
          </div>`;
      }).join('')}
    </div>`;

  // Panel ventas
  document.getElementById('panel-ventas').innerHTML = `
    <div style="display:flex; align-items:center; gap:0.75rem; padding:1rem 1.5rem;
                border-bottom:1px solid rgba(0,0,0,0.05);">
      <span class="squircle sq-soft-green">${lucideIcon('dollar-sign', 17)}</span>
      <div>
        <div style="font-size:0.875rem; font-weight:700; color:#1c1c1e;">Ventas de Hoy</div>
        <div style="font-size:0.6875rem; color:var(--ios-gray); margin-top:0.1rem;">Total recaudado</div>
      </div>
    </div>
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center;
                padding:2.5rem 1.5rem; min-height:14rem; text-align:center;">
      <div style="font-size:0.6875rem; font-weight:700; text-transform:uppercase;
                  letter-spacing:0.1em; color:var(--ios-gray2); margin-bottom:0.625rem;">
        Total
      </div>
      <div style="font-size:3.25rem; font-weight:800; color:#1c1c1e;
                  letter-spacing:-0.04em; line-height:1; font-variant-numeric:tabular-nums;">
        <span style="font-size:2rem; color:var(--ios-green); vertical-align:top; margin-top:0.4rem; display:inline-block;">$</span>${Number(ventas?.montoTotal || 0).toFixed(2)}
      </div>
      <div style="display:inline-flex; align-items:center; gap:0.5rem;
                  margin-top:1.25rem; padding:0.5rem 1rem; border-radius:9999px;
                  background:rgba(52,199,89,0.1); border:1px solid rgba(52,199,89,0.15);">
        ${lucideIcon('shopping-cart', 14)}
        <span style="font-size:0.8125rem; font-weight:700; color:var(--ios-green);">
          ${ventas?.totalVentas || 0} ${ventas?.totalVentas === 1 ? 'venta realizada' : 'ventas realizadas'}
        </span>
      </div>
      <div style="display:flex; align-items:center; gap:0.375rem; margin-top:0.875rem;">
        <span style="width:6px; height:6px; border-radius:50%; background:var(--ios-green);" class="anim-pulse"></span>
        <span style="font-size:0.6875rem; color:var(--ios-gray);">Sistema activo</span>
      </div>
    </div>`;
}
