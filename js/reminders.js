// ==========================================================================
// REMINDERS MODULE (SISTEMA DE LEMBRETES & AVISOS DE ENTRADA)
// ==========================================================================

(function () {
  'use strict';

  function getReminderState() {
    if (window.state && window.state.reminder) {
      return window.state.reminder;
    }
    try {
      const saved = localStorage.getItem('reminder');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (window.state) window.state.reminder = parsed;
        return parsed;
      }
    } catch (e) {
      console.error('Erro ao ler lembrete:', e);
    }
    const defaultReminder = { text: '', active: false, updatedAt: null };
    if (window.state) window.state.reminder = defaultReminder;
    return defaultReminder;
  }

  function saveReminder() {
    const input = document.getElementById('reminderTextInput');
    if (!input) return;

    const text = input.value.trim();
    if (!text) {
      alert('⚠️ Por favor, digite o texto do aviso antes de salvar.');
      return;
    }

    const reminder = {
      text: text,
      active: true,
      updatedAt: new Date().toISOString()
    };

    if (window.state) {
      window.state.reminder = reminder;
    }
    localStorage.setItem('reminder', JSON.stringify(reminder));

    renderRemindersView();

    if (window.showToast) {
      window.showToast('✅ Aviso salvo e ativado! Será exibido toda vez que você entrar no site.', 'success');
    }
  }

  function clearReminder() {
    if (!confirm('Deseja realmente desativar e limpar este aviso?')) return;

    const reminder = {
      text: '',
      active: false,
      updatedAt: null
    };

    if (window.state) {
      window.state.reminder = reminder;
    }
    localStorage.setItem('reminder', JSON.stringify(reminder));

    const input = document.getElementById('reminderTextInput');
    if (input) input.value = '';

    renderRemindersView();

    if (window.showToast) {
      window.showToast('Lembrete desativado com sucesso.', 'info');
    }
  }

  function renderRemindersView() {
    const reminder = getReminderState();
    const input = document.getElementById('reminderTextInput');
    const badge = document.getElementById('reminderStatusBadge');

    if (input && document.activeElement !== input) {
      input.value = reminder.text || '';
    }

    if (badge) {
      if (reminder.active && reminder.text) {
        badge.textContent = '🟢 Ativo na Entrada';
        badge.className = 'status-badge active';
      } else {
        badge.textContent = '⚪ Inativo';
        badge.className = 'status-badge inactive';
      }
    }
  }

  function showReminderAlert(customText) {
    const reminder = getReminderState();
    const textToShow = customText || reminder.text;
    if (!textToShow) return;

    const modal = document.getElementById('reminderAlertModal');
    const body = document.getElementById('reminderAlertBody');

    if (modal && body) {
      body.textContent = textToShow;
      modal.classList.add('active');

      // Processar emojis no modal para aplicar estilos padrão ou customizados
      if (window.processEmojis) {
        window.processEmojis(modal);
      }
    }
  }

  function closeReminderAlert() {
    const modal = document.getElementById('reminderAlertModal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  function testReminderAlert() {
    const input = document.getElementById('reminderTextInput');
    const text = input ? input.value.trim() : '';
    if (!text) {
      alert('⚠️ Digite um aviso para testar a exibição.');
      return;
    }
    showReminderAlert(text);
  }

  /**
   * Disparado toda vez que o usuário entra no site
   */
  function checkEntranceReminder() {
    const reminder = getReminderState();
    if (reminder && reminder.active && reminder.text && reminder.text.trim().length > 0) {
      // Exibir logo após a inicialização (respeitando a splash screen suave)
      setTimeout(() => {
        showReminderAlert(reminder.text);
      }, 950);
    }
  }

  // Exportar para escopo global
  window.saveReminder = saveReminder;
  window.clearReminder = clearReminder;
  window.renderRemindersView = renderRemindersView;
  window.showReminderAlert = showReminderAlert;
  window.closeReminderAlert = closeReminderAlert;
  window.testReminderAlert = testReminderAlert;
  window.checkEntranceReminder = checkEntranceReminder;
})();
