// ==========================================================================
// UI MODULE (INTERFACE, VIEWS, HUD, MODAIS & NOTIFICAÇÕES TOAST)
// ==========================================================================

function toggleHUD() {
  const menu = document.getElementById('hudMenu');
  const overlay = document.querySelector('.hud-overlay');
  if (menu && overlay) {
    menu.classList.toggle('active');
    overlay.classList.toggle('active');
  }
}

function showView(viewName) {
  const menu = document.getElementById('hudMenu');
  const overlay = document.querySelector('.hud-overlay');
  if (menu) menu.classList.remove('active');
  if (overlay) overlay.classList.remove('active');

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById(viewName);
  if (target) {
    target.classList.add('active');
  }

  document.querySelectorAll('.hud-item').forEach(item => {
    const fn = item.getAttribute('onclick');
    if (fn && fn.includes(`'${viewName}'`)) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  if (viewName === 'checklist' && window.renderChecklist) window.renderChecklist();
  if (viewName === 'history' && window.renderHistory) window.renderHistory();
  if (viewName === 'reflection' && window.renderErrors) window.renderErrors();
  if (viewName === 'habits' && window.renderHabits) window.renderHabits();
  if (viewName === 'planning' && window.renderPlanning) window.renderPlanning();
  if (viewName === 'themes' && window.loadThemeInputs) window.loadThemeInputs();
  if (viewName === 'manage-tasks' && window.renderTaskManagement) window.renderTaskManagement();
  if (viewName === 'reminders' && window.renderRemindersView) window.renderRemindersView();

  if (target && window.processEmojis) {
    window.processEmojis(target);
  }
}

function updateCurrentDate() {
  const el = document.getElementById('currentDate');
  if (el) {
    const now = new Date();
    el.textContent = now.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

function showToast(message, type = 'info') {
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    document.body.appendChild(toast);
  }

  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.classList.add('visible');

  clearTimeout(toast._hideTimeout);
  toast._hideTimeout = setTimeout(() => {
    toast.classList.remove('visible');
  }, 3200);
}

function initSplash() {
  const splash = document.createElement('div');
  splash.id = 'splashScreen';
  splash.className = 'neon-splash-screen';
  splash.innerHTML = `
    <div class="splash-logo-box">
      <div class="splash-neon-check">⚡</div>
      <h2 class="splash-title">SmartCheck</h2>
      <p class="splash-subtitle">Evolução & Alta Performance</p>
    </div>
  `;
  document.body.appendChild(splash);

  setTimeout(() => {
    splash.classList.add('hide');
    setTimeout(() => {
      splash.remove();
      
    }, 400);
  }, 900);
}

window.toggleHUD = toggleHUD;
window.showView = showView;
window.updateCurrentDate = updateCurrentDate;
window.showToast = showToast;
window.initSplash = initSplash;
