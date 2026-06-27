/**
 * pos.js — Punto de Venta
 */
import { ventaService, productoService } from '../api.js';
import { getUser } from '../auth.js';
import { lucideIcon, escHtml, fmtMoney } from '../sidebar.js';

// Estado del POS
let cart = [];
let metodoPago = 'EFECTIVO';

export async function render(container) {
  const user = getUser();
  cart = [];
  metodoPago = 'EFECTIVO';

  container.innerHTML = `
    <div id="pos-layout">
      <!-- ══ Columna carrito ══ -->
      <div id="pos-cart-col">
        <!-- Header -->
        <div style="margin-bottom:1rem; display:flex; align-items:flex-end; justify-content:space-between;">
          <div>
            <h1 class="large-title" style="font-size:1.75rem;">Punto de Venta</h1>
            <p style="font-size:0.8125rem; color:var(--ios-gray); margin-top:0.25rem;">
              ${escHtml(user?.sucursal?.nombre || '')}
            </p>
          </div>
          <span id="cart-counter" style="display:none;"
            class="badge badge-mint" style="margin-bottom:0.125rem;">
            ${lucideIcon('shopping-cart', 11)} <span id="cart-count">0</span> artículo(s)
          </span>
        </div>

        <!-- Buscador de código -->
        <div style="margin-bottom:0.875rem;">
          <div style="display:flex; gap:0.5rem;">
            <div style="flex:1; position:relative;">
              <span style="position:absolute;left:1rem;top:50%;transform:translateY(-50%);
                           color:var(--mint-500); pointer-events:none;">
                ${lucideIcon('scan-line', 20)}
              </span>
              <input id="barcode-input" type="text"
                style="width:100%; padding:0.875rem 1rem 0.875rem 3rem; font-size:0.9375rem;
                       background:#fff; border:2px solid transparent; border-radius:0.875rem;
                       outline:none; transition:all 0.15s; box-shadow:0 1px 4px rgba(0,0,0,0.06);
                       font-family:inherit;"
                placeholder="Escanear o ingresar código de barras..."
                autocomplete="off" />
            </div>
            <button id="btn-search" class="btn btn-primary btn-md" style="padding:0.75rem 1.25rem;">
              ${lucideIcon('search', 18)}
            </button>
          </div>
          <div id="pos-error" style="display:none; margin-top:0.5rem;"></div>
        </div>

        <!-- Carrito -->
        <div class="glass-card" style="flex:1; overflow:hidden; display:flex; flex-direction:column;">
          <div style="display:flex; align-items:center; justify-content:space-between;
                      padding:0.625rem 1.25rem; border-bottom:1px solid rgba(0,0,0,0.05);
                      background:rgba(0,0,0,0.015);">
            <span style="font-size:0.625rem; font-weight:700; text-transform:uppercase;
                         letter-spacing:0.09em; color:var(--ios-gray2);">Productos</span>
            <button id="btn-clear-cart" style="display:none; font-size:0.6875rem; font-weight:700;
                    color:var(--ios-red); background:none; border:none; cursor:pointer;">
              Limpiar todo
            </button>
          </div>
          <div id="pos-cart-items" style="flex:1; overflow-y:auto;">
            <div id="cart-empty" style="display:flex; flex-direction:column; align-items:center;
                 justify-content:center; height:100%; padding:3rem; text-align:center;
                 color:var(--ios-gray3); min-height:12rem;">
              ${lucideIcon('shopping-cart', 64)}
              <p style="font-size:0.9375rem; font-weight:600; color:var(--ios-gray); margin-top:1rem;">
                Carrito vacío
              </p>
              <p style="font-size:0.8125rem; color:var(--ios-gray2); margin-top:0.25rem;">
                Escanea un código para agregar productos
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ Panel de pago ══ -->
      <div id="pos-payment-col">
        <!-- Header panel -->
        <div style="padding:1rem 1.25rem; border-bottom:1px solid rgba(0,0,0,0.05);
                    background:rgba(0,0,0,0.015);">
          <div style="font-size:0.875rem; font-weight:700; color:#1c1c1e;">Resumen de Pago</div>
          <div style="font-size:0.6875rem; color:var(--ios-gray); margin-top:0.125rem;">
            ${escHtml(user?.sucursal?.nombre || '')}
          </div>
        </div>

        <div style="flex:1; overflow-y:auto; padding:1.25rem;">
          <!-- Subtotales -->
          <div style="display:flex; flex-direction:column; gap:0.625rem; margin-bottom:1.25rem;">
            <div style="display:flex; justify-content:space-between; font-size:0.8125rem;">
              <span style="color:var(--ios-gray);">Artículos</span>
              <span id="pay-qty" style="font-weight:600; color:#1c1c1e; font-variant-numeric:tabular-nums;">0</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.8125rem;">
              <span style="color:var(--ios-gray);">Subtotal</span>
              <span id="pay-sub" style="font-weight:600; color:#1c1c1e; font-variant-numeric:tabular-nums;">$0.00</span>
            </div>
          </div>

          <!-- Total destacado -->
          <div style="background:linear-gradient(135deg, rgba(0,199,190,0.1), rgba(0,199,190,0.04));
                      border:1px solid rgba(0,199,190,0.18); border-radius:1rem;
                      padding:1rem; margin-bottom:1.25rem;">
            <div style="font-size:0.6875rem; font-weight:700; text-transform:uppercase;
                        letter-spacing:0.09em; color:var(--mint-600); margin-bottom:0.25rem;">
              Total a cobrar
            </div>
            <div id="pay-total" style="font-size:2.25rem; font-weight:800; color:#1c1c1e;
                  letter-spacing:-0.04em; line-height:1; font-variant-numeric:tabular-nums;">
              $0.00
            </div>
          </div>

          <!-- Método de pago -->
          <div style="margin-bottom:1rem;">
            <div style="font-size:0.6875rem; font-weight:700; text-transform:uppercase;
                        letter-spacing:0.08em; color:var(--ios-gray2); margin-bottom:0.625rem;">
              Método de Pago
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem;">
              <button data-method="EFECTIVO" class="method-btn method-active"
                style="display:flex; flex-direction:column; align-items:center; gap:0.375rem;
                       padding:0.875rem 0.5rem; border-radius:1rem; font-size:0.75rem;
                       font-weight:700; border:2px solid var(--mint-500); background:rgba(0,199,190,0.08);
                       color:var(--mint-700); cursor:pointer; transition:all 0.15s;">
                ${lucideIcon('banknote', 18)}
                Efectivo
              </button>
              <button data-method="TARJETA_CREDITO" class="method-btn"
                style="display:flex; flex-direction:column; align-items:center; gap:0.375rem;
                       padding:0.875rem 0.5rem; border-radius:1rem; font-size:0.75rem;
                       font-weight:700; border:2px solid transparent; background:rgba(0,0,0,0.04);
                       color:var(--ios-gray); cursor:pointer; transition:all 0.15s;">
                ${lucideIcon('credit-card', 18)}
                Tarjeta
              </button>
            </div>
          </div>

          <!-- Monto recibido -->
          <div id="cash-section" style="margin-bottom:0.5rem;">
            <label style="font-size:0.6875rem; font-weight:700; text-transform:uppercase;
                          letter-spacing:0.08em; color:var(--ios-gray2); display:block; margin-bottom:0.375rem;">
              Monto Recibido
            </label>
            <input id="monto-recibido" type="number" class="input" placeholder="0.00"
                   min="0" step="0.01" style="font-size:0.9375rem;" />
            <div id="cambio-display" style="display:none; margin-top:0.625rem;
                 display:flex; align-items:center; justify-content:space-between;
                 padding:0.625rem 0.875rem; border-radius:0.75rem;
                 background:rgba(0,122,255,0.08); border:1px solid rgba(0,122,255,0.15);">
              <span style="font-size:0.75rem; font-weight:700; color:var(--ios-blue);">Cambio</span>
              <span id="cambio-val" style="font-size:1rem; font-weight:800;
                    color:var(--ios-blue); font-variant-numeric:tabular-nums;">$0.00</span>
            </div>
          </div>
        </div>

        <!-- Botón cobrar -->
        <div style="padding:1rem; border-top:1px solid rgba(0,0,0,0.05);">
          <button id="btn-cobrar" class="btn btn-success btn-full"
            style="padding:1.125rem; font-size:1rem; font-weight:800;" disabled>
            <span id="btn-cobrar-label">Cobrar $0.00</span>
          </button>
          <p id="cart-hint" style="text-align:center; font-size:0.6875rem; color:var(--ios-gray2);
                                   margin-top:0.5rem;">
            Agrega productos al carrito
          </p>
        </div>
      </div>
    </div>`;

  // Focus automático
  const barcodeInput = document.getElementById('barcode-input');
  barcodeInput?.focus();

  // Estilo focus en barcode input
  barcodeInput?.addEventListener('focus', () => {
    barcodeInput.style.borderColor = 'var(--mint-500)';
    barcodeInput.style.boxShadow = '0 0 0 3px rgba(0,199,190,0.15)';
  });
  barcodeInput?.addEventListener('blur', () => {
    barcodeInput.style.borderColor = 'transparent';
    barcodeInput.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
  });

  // Enter en barcode
  barcodeInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchProduct();
  });

  // Botón buscar
  document.getElementById('btn-search')?.addEventListener('click', searchProduct);

  // Limpiar carrito
  document.getElementById('btn-clear-cart')?.addEventListener('click', () => {
    cart = [];
    updateCart();
    barcodeInput?.focus();
  });

  // Método de pago
  document.querySelectorAll('.method-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      metodoPago = btn.dataset.method;
      document.querySelectorAll('.method-btn').forEach(b => {
        const isActive = b.dataset.method === metodoPago;
        b.style.borderColor = isActive ? 'var(--mint-500)' : 'transparent';
        b.style.background  = isActive ? 'rgba(0,199,190,0.08)' : 'rgba(0,0,0,0.04)';
        b.style.color       = isActive ? 'var(--mint-700)' : 'var(--ios-gray)';
      });
      document.getElementById('cash-section').style.display = metodoPago === 'EFECTIVO' ? 'block' : 'none';
      updateTotal();
    });
  });

  // Monto recibido
  document.getElementById('monto-recibido')?.addEventListener('input', updateTotal);

  // Cobrar
  document.getElementById('btn-cobrar')?.addEventListener('click', procesarVenta);
}

async function searchProduct() {
  const input   = document.getElementById('barcode-input');
  const errorEl = document.getElementById('pos-error');
  const code    = input?.value.trim();
  if (!code) return;

  showError('');
  try {
    const res     = await productoService.getByBarcode(code);
    const producto = res.data;
    const existing = cart.find(i => i.productoId === producto.id);

    if (existing) {
      if (existing.cantidad >= existing.stockDisponible) {
        showError('No hay más stock disponible para este producto');
        return;
      }
      existing.cantidad++;
    } else {
      const stock = producto.inventario?.[0]?.stockActual || 0;
      if (stock <= 0) { showError('Producto sin stock disponible'); return; }
      cart.push({
        productoId: producto.id,
        nombre: producto.nombre,
        codigoBarras: producto.codigoBarras,
        precioUnitario: Number(producto.precioVenta),
        cantidad: 1,
        stockDisponible: stock,
        descuento: 0,
      });
    }

    if (input) input.value = '';
    updateCart();
  } catch (err) {
    showError(err.message || 'Producto no encontrado');
  }
}

function showError(msg) {
  const el = document.getElementById('pos-error');
  if (!el) return;
  if (!msg) { el.style.display = 'none'; return; }
  el.style.display = 'flex';
  el.innerHTML = `
    <div class="alert alert-error anim-scale-in" style="width:100%;">
      ${lucideIcon('alert-circle', 16)}
      <span>${escHtml(msg)}</span>
    </div>`;
}

function updateCart() {
  const itemsEl    = document.getElementById('pos-cart-items');
  const emptyEl    = document.getElementById('cart-empty');
  const clearBtn   = document.getElementById('btn-clear-cart');
  const counterEl  = document.getElementById('cart-counter');

  if (!itemsEl) return;

  if (cart.length === 0) {
    if (emptyEl) emptyEl.style.display = 'flex';
    if (clearBtn) clearBtn.style.display = 'none';
    if (counterEl) counterEl.style.display = 'none';
    updateTotal();
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  if (clearBtn) clearBtn.style.display = 'block';
  const totalQty = cart.reduce((s, i) => s + i.cantidad, 0);
  if (counterEl) {
    counterEl.style.display = 'inline-flex';
    const countEl = document.getElementById('cart-count');
    if (countEl) countEl.textContent = totalQty;
  }

  itemsEl.innerHTML = cart.map((item, idx) => `
    <div class="cell" style="display:flex; align-items:center; gap:0.75rem;
         padding:0.875rem 1.25rem; border-bottom:1px solid rgba(0,0,0,0.04);">
      <div style="flex:1; min-width:0;">
        <div style="font-weight:600; font-size:0.8125rem; color:#1c1c1e;
                    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
          ${escHtml(item.nombre)}
        </div>
        <div class="mono" style="font-size:0.6875rem; color:var(--ios-gray); margin-top:0.1rem;">
          ${escHtml(item.codigoBarras)}
        </div>
      </div>
      <!-- Qty controls -->
      <div style="display:flex; align-items:center; gap:0.375rem;
                  background:rgba(0,0,0,0.04); border-radius:9999px; padding:0.25rem;">
        <button onclick="posQty(${idx},-1)" style="width:1.75rem; height:1.75rem; border-radius:50%;
                background:#fff; border:none; cursor:pointer; display:flex; align-items:center;
                justify-content:center; color:#555; box-shadow:0 1px 3px rgba(0,0,0,0.1);
                transition:all 0.12s;" onmouseenter="this.style.color='var(--mint-600)'"
                onmouseleave="this.style.color='#555'">
          ${lucideIcon('minus', 12)}
        </button>
        <span style="width:1.5rem; text-align:center; font-size:0.8125rem; font-weight:700;
                     font-variant-numeric:tabular-nums; color:#1c1c1e;">${item.cantidad}</span>
        <button onclick="posQty(${idx},+1)" ${item.cantidad >= item.stockDisponible ? 'disabled' : ''}
                style="width:1.75rem; height:1.75rem; border-radius:50%;
                background:#fff; border:none; cursor:pointer; display:flex; align-items:center;
                justify-content:center; color:#555; box-shadow:0 1px 3px rgba(0,0,0,0.1);
                transition:all 0.12s;" onmouseenter="this.style.color='var(--mint-600)'"
                onmouseleave="this.style.color='#555'">
          ${lucideIcon('plus', 12)}
        </button>
      </div>
      <!-- Precio -->
      <div style="text-align:right; width:5rem; flex-shrink:0;">
        <div style="font-size:0.875rem; font-weight:700; color:#1c1c1e;
                    font-variant-numeric:tabular-nums;">
          $${(item.precioUnitario * item.cantidad).toFixed(2)}
        </div>
        <div style="font-size:0.625rem; color:var(--ios-gray); font-variant-numeric:tabular-nums;">
          $${item.precioUnitario.toFixed(2)}/u
        </div>
      </div>
      <!-- Eliminar -->
      <button onclick="posRemove(${idx})"
        style="width:1.75rem; height:1.75rem; border-radius:0.5rem; border:none;
               background:none; cursor:pointer; display:flex; align-items:center;
               justify-content:center; color:rgba(255,59,48,0.5); transition:all 0.12s;"
        onmouseenter="this.style.background='rgba(255,59,48,0.1)'; this.style.color='var(--ios-red)'"
        onmouseleave="this.style.background='none'; this.style.color='rgba(255,59,48,0.5)'">
        ${lucideIcon('trash-2', 14)}
      </button>
    </div>
  `).join('');

  // Exponer funciones al ámbito global temporalmente
  window.posQty = (idx, delta) => {
    const item = cart[idx];
    if (!item) return;
    const newQty = item.cantidad + delta;
    if (newQty < 1 || newQty > item.stockDisponible) return;
    item.cantidad = newQty;
    updateCart();
  };
  window.posRemove = (idx) => {
    cart.splice(idx, 1);
    updateCart();
  };

  updateTotal();
}

function updateTotal() {
  const total = cart.reduce((s, i) => s + i.precioUnitario * i.cantidad - i.descuento, 0);
  const qty   = cart.reduce((s, i) => s + i.cantidad, 0);
  const monto = Number(document.getElementById('monto-recibido')?.value || 0);
  const cambio = metodoPago === 'EFECTIVO' ? monto - total : 0;

  const payQty   = document.getElementById('pay-qty');
  const paySub   = document.getElementById('pay-sub');
  const payTotal = document.getElementById('pay-total');
  const cobrar   = document.getElementById('btn-cobrar');
  const cobrarLbl= document.getElementById('btn-cobrar-label');
  const cartHint = document.getElementById('cart-hint');
  const cambioEl = document.getElementById('cambio-display');
  const cambioVal= document.getElementById('cambio-val');

  if (payQty)    payQty.textContent   = qty;
  if (paySub)    paySub.textContent   = fmtMoney(total);
  if (payTotal)  payTotal.textContent = fmtMoney(total);
  if (cobrarLbl) cobrarLbl.textContent= `Cobrar ${fmtMoney(total)}`;

  const canCharge = cart.length > 0 && (metodoPago !== 'EFECTIVO' || monto >= total);
  if (cobrar)    cobrar.disabled = !canCharge;
  if (cartHint)  cartHint.style.display = cart.length > 0 ? 'none' : 'block';

  if (cambioEl && cambioVal) {
    const show = metodoPago === 'EFECTIVO' && monto >= total && total > 0;
    cambioEl.style.display = show ? 'flex' : 'none';
    cambioVal.textContent  = fmtMoney(cambio);
  }
}

async function procesarVenta() {
  const btn      = document.getElementById('btn-cobrar');
  const btnLabel = document.getElementById('btn-cobrar-label');
  if (!btn) return;

  const total = cart.reduce((s, i) => s + i.precioUnitario * i.cantidad - i.descuento, 0);
  const monto = Number(document.getElementById('monto-recibido')?.value || 0);

  if (metodoPago === 'EFECTIVO' && monto < total) {
    showError('El monto recibido es insuficiente');
    return;
  }

  btn.disabled = true;
  btnLabel.innerHTML = `<span class="spinner spinner-sm" style="color:#fff;"></span> Procesando...`;
  showError('');

  try {
    const res = await ventaService.procesarVenta({
      metodoPago,
      montoRecibido: metodoPago === 'EFECTIVO' ? monto : undefined,
      detalles: cart.map(i => ({
        productoId: i.productoId,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
        descuento: i.descuento,
      })),
    });
    renderExito(res.data);
  } catch (err) {
    showError(err.message || 'Error al procesar la venta');
    btn.disabled = false;
    btnLabel.textContent = `Cobrar ${fmtMoney(total)}`;
  }
}

function renderExito(venta) {
  const container = document.getElementById('pos-layout')?.parentElement;
  if (!container) return;

  cart = [];

  container.innerHTML = `
    <div style="height:100%; display:flex; align-items:center; justify-content:center;
                padding:1.5rem; background:var(--ios-gray6);">
      <div class="glass-card anim-scale-in" style="padding:2.5rem; max-width:26rem; width:100%; text-align:center;">
        <!-- Icono con halo -->
        <div class="icon-halo" style="display:inline-flex; margin-bottom:1.5rem;">
          <div class="icon-box icon-box-green">
            ${lucideIcon('check', 36)}
          </div>
        </div>

        <h2 class="large-title" style="font-size:1.75rem; margin-bottom:0.375rem;">¡Venta Exitosa!</h2>
        <p style="color:var(--ios-gray); font-size:0.875rem; margin-bottom:1.5rem;">
          Folio <span class="mono" style="font-weight:700; color:#3a3a3c;
                 background:rgba(0,0,0,0.04); padding:0.125rem 0.5rem; border-radius:0.375rem;">
            ${escHtml(venta.folio || '')}
          </span>
        </p>

        <!-- Recibo -->
        <div style="background:rgba(0,0,0,0.03); border:1px solid rgba(0,0,0,0.05);
                    border-radius:1rem; padding:1.25rem; text-align:left; margin-bottom:1.5rem;">
          <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.75rem;
                      padding-bottom:0.75rem; border-bottom:1px solid rgba(0,0,0,0.05);">
            ${lucideIcon('receipt', 14)}
            <span style="font-size:0.625rem; font-weight:700; text-transform:uppercase;
                         letter-spacing:0.1em; color:var(--ios-gray2);">Detalle del pago</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.5rem;">
            <div style="display:flex; justify-content:space-between; font-size:0.8125rem; color:#555;">
              <span>Subtotal</span>
              <span class="tabular">${fmtMoney(venta.subtotal)}</span>
            </div>
            ${Number(venta.descuento) > 0 ? `
              <div style="display:flex; justify-content:space-between; font-size:0.8125rem; color:var(--ios-green);">
                <span style="display:flex; align-items:center; gap:0.375rem;">
                  ${lucideIcon('tag', 12)} Descuento
                </span>
                <span class="tabular">-${fmtMoney(venta.descuento)}</span>
              </div>` : ''}
            <div style="display:flex; justify-content:space-between; font-size:1rem; font-weight:800;
                        padding-top:0.75rem; border-top:1px solid rgba(0,0,0,0.07);
                        color:#1c1c1e;">
              <span>Total</span>
              <span class="tabular" style="color:var(--mint-700);">${fmtMoney(venta.total)}</span>
            </div>
            ${Number(venta.cambio) > 0 ? `
              <div style="display:flex; justify-content:space-between; font-size:0.875rem; font-weight:700;
                          padding:0.5rem 0.875rem; border-radius:0.75rem;
                          background:rgba(0,122,255,0.08); color:var(--ios-blue);">
                <span>Cambio</span>
                <span class="tabular">${fmtMoney(venta.cambio)}</span>
              </div>` : ''}
          </div>
        </div>

        <button onclick="window.location.hash='#/pos'"
          class="btn btn-primary btn-xl btn-full">
          ${lucideIcon('rotate-ccw', 16)}
          Nueva Venta
        </button>
      </div>
    </div>`;
}
