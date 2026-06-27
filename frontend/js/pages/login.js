/**
 * login.js — Página de Login
 */
import { authService } from '../api.js';
import { saveSession } from '../auth.js';
import { lucideIcon, escHtml } from '../sidebar.js';

export async function render(container) {
  container.innerHTML = `
    <div id="login-page">
      <!-- Blobs decorativos -->
      <div class="login-blob blob-1"></div>
      <div class="login-blob blob-2"></div>
      <div class="login-blob blob-3"></div>

      <div class="login-card anim-fade-up">
        <div class="glass-card" style="padding:2.5rem 2.25rem;">

          <!-- Logo con halo -->
          <div style="text-align:center; margin-bottom:2rem;">
            <div class="icon-halo" style="display:inline-flex; margin-bottom:1.25rem;">
              <div class="icon-box icon-box-mint">
                ${lucideIcon('heart-pulse', 32)}
              </div>
            </div>
            <h1 class="large-title" style="font-size:1.75rem;">Sistema de Farmacia</h1>
            <p style="color:var(--ios-gray); margin-top:0.5rem; font-size:0.875rem; line-height:1.5;">
              Ingresa tus credenciales para<br>acceder al panel de gestión
            </p>
          </div>

          <!-- Formulario -->
          <form id="login-form" style="display:flex; flex-direction:column; gap:1rem;">

            <!-- Error banner (oculto por defecto) -->
            <div id="login-error" class="alert alert-error anim-scale-in" style="display:none;">
              ${lucideIcon('alert-circle', 16)}
              <span id="login-error-msg"></span>
            </div>

            <!-- Email -->
            <div>
              <label class="login-form-label" for="email">Correo electrónico</label>
              <div class="input-icon-wrap">
                <span class="icon">${lucideIcon('mail', 18)}</span>
                <input id="email" type="email" class="input" placeholder="admin@farmacia.com"
                       required autocomplete="email" />
              </div>
            </div>

            <!-- Password -->
            <div>
              <label class="login-form-label" for="password">Contraseña</label>
              <div class="input-icon-wrap" style="position:relative;">
                <span class="icon">${lucideIcon('lock', 18)}</span>
                <input id="password" type="password" class="input"
                       style="padding-left:2.75rem; padding-right:3rem;"
                       placeholder="••••••••" required autocomplete="current-password" />
                <button type="button" id="toggle-pw"
                  style="position:absolute;right:0.75rem;top:50%;transform:translateY(-50%);
                         background:none;border:none;cursor:pointer;color:var(--ios-gray2);
                         display:flex;align-items:center;padding:0.25rem;border-radius:0.5rem;
                         transition:color 0.15s;">
                  <span id="pw-eye">${lucideIcon('eye', 16)}</span>
                </button>
              </div>
            </div>

            <!-- Submit -->
            <button type="submit" id="login-btn"
              class="btn btn-primary btn-xl btn-full" style="margin-top:0.5rem;">
              <span id="login-btn-label">Iniciar Sesión</span>
              <span id="login-btn-icon">${lucideIcon('arrow-right', 16)}</span>
            </button>
          </form>
        </div>

        <p class="login-footer">
          © ${new Date().getFullYear()} Sistema de Gestión de Farmacias · v1.0
        </p>
      </div>
    </div>
  `;

  // ── Event Listeners ──────────────────────────────────────────

  // Toggle contraseña
  let showPw = false;
  document.getElementById('toggle-pw')?.addEventListener('click', () => {
    showPw = !showPw;
    const pwInput = document.getElementById('password');
    const pwEye   = document.getElementById('pw-eye');
    if (pwInput) pwInput.type = showPw ? 'text' : 'password';
    if (pwEye) pwEye.innerHTML = lucideIcon(showPw ? 'eye-off' : 'eye', 16);
  });

  // Hover toggle-pw
  document.getElementById('toggle-pw')?.addEventListener('mouseenter', (e) => {
    e.currentTarget.style.color = 'var(--mint-600)';
  });
  document.getElementById('toggle-pw')?.addEventListener('mouseleave', (e) => {
    e.currentTarget.style.color = 'var(--ios-gray2)';
  });

  // Submit
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorEl  = document.getElementById('login-error');
    const errorMsg = document.getElementById('login-error-msg');
    const btn      = document.getElementById('login-btn');
    const btnLabel = document.getElementById('login-btn-label');
    const btnIcon  = document.getElementById('login-btn-icon');

    // Reset error
    errorEl.style.display = 'none';

    // Loading state
    btn.disabled = true;
    btnLabel.textContent = 'Iniciando sesión...';
    btnIcon.innerHTML = `<span class="spinner spinner-sm" style="color:#fff;"></span>`;

    try {
      const res = await authService.login(email, password);
      const { accessToken, user } = res.data;
      saveSession(accessToken, user);
      window.location.hash = '#/dashboard';
    } catch (err) {
      errorMsg.textContent = err.message || 'Credenciales incorrectas';
      errorEl.style.display = 'flex';
    } finally {
      btn.disabled = false;
      btnLabel.textContent = 'Iniciar Sesión';
      btnIcon.innerHTML = lucideIcon('arrow-right', 16);
    }
  });

  // Autofocus
  setTimeout(() => document.getElementById('email')?.focus(), 50);
}
