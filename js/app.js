// ==========================================================================
// SMARTCHECK - MAIN APPLICATION INITIALIZATION
// ==========================================================================

function initApp() {
  // 1. Aplicar Tema
  if (window.applyTheme) {
    const savedTheme = (window.state && window.state.currentTheme) ? window.state.currentTheme : window.NEON_WHITE_THEME;
    window.applyTheme(savedTheme);
  }

  // 2. Renderizar Elementos Iniciais
  if (window.updateCurrentDate) window.updateCurrentDate();
  if (window.renderChecklist) window.renderChecklist();
  if (window.renderPlanning) window.renderPlanning();
  if (window.loadCustomTabs) window.loadCustomTabs();

  // 3. Setup de Listeners
  const taskDaySelect = document.getElementById('taskDaySelect');
  if (taskDaySelect && window.renderTaskManagement) {
    taskDaySelect.addEventListener('change', window.renderTaskManagement);
  }

  // Setup do color picker do tema
  setTimeout(() => {
    if (window.setupThemeListeners) window.setupThemeListeners();
  }, 100);

  // 4. Iniciar Splash Screen
  if (window.initSplash) window.initSplash();

  // 5. Inicializar Processamento Automático de Emojis Padrão (Preto e Branco)
  if (window.initEmojiProcessor) window.initEmojiProcessor();

  // 6. Verificar Reset do modo cards
  if (window.checkResetCardsMode) window.checkResetCardsMode();

  // 7. Mecanismo de Alerta de Entrada (Sistema de Lembretes)
  if (window.checkEntranceReminder) window.checkEntranceReminder();

  console.log('⚡ SmartCheck Modularizado Inicializado com Sucesso.');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
