// ==========================================================================
// CHECKLIST MODULE (VIEW SEMANAL COM BLOCOS CATEGORIZADOS & PROGRESSO NEON)
// ==========================================================================

function toggleTask(day, taskIdOrIndex) {
  if (!window.state) return;
  if (!window.state.checklist[day]) window.state.checklist[day] = {};
  window.state.checklist[day][taskIdOrIndex] = !window.state.checklist[day][taskIdOrIndex];
  window.saveState('checklist');
  if (window.performAutoSave) window.performAutoSave();
  renderChecklist();
}

function completeDay(day) {
  if (!window.state) return;
  const isMinimal = window.state.routineStates[day] === 'minimal';
  const tasks = window.state.weekData[day] || [];

  const visibleTasks = tasks.filter(t => !isMinimal || (window.isEssential && window.isEssential(t, day)));
  const total = visibleTasks.length;
  const completedCount = visibleTasks.filter(t => window.state.checklist[day]?.[t.id] || window.state.checklist[day]?.[t.text]).length;

  if (completedCount === total && total > 0) {
    if (window.saveToHistory) {
      window.saveToHistory(day, true, isMinimal ? 'Rotina Mínima Cumprida' : '');
    }
  } else {
    window.state.pendingDay = day;
    const modal = document.getElementById('justificationModal');
    if (modal) modal.classList.add('active');
  }
}

function resetChecklist() {
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const today = days[new Date().getDay()];

  if (confirm(`Resetar todas as tarefas do dia de hoje (${today})?`)) {
    if (window.state) {
      window.state.checklist[today] = {};
      window.saveState('checklist');
      if (window.performAutoSave) window.performAutoSave();
      renderChecklist();
      if (window.showToast) window.showToast(`🔄 Tarefas de ${today} resetadas com sucesso.`, 'info');
    }
  }
}

function toggleRoutine(day) {
  if (!window.state) return;
  window.state.pendingRoutineDay = day;
  const current = window.state.routineStates[day] || 'normal';
  const modal = document.getElementById('routineModal');
  const title = document.getElementById('routineModalTitle');
  const icon = document.getElementById('routineModalIcon');

  if (modal && title && icon) {
    if (current === 'normal') {
      title.textContent = `Deseja ativar a rotina mínima para ${day}?`;
      icon.textContent = '🍃';
    } else {
      title.textContent = `Deseja retornar para a rotina comum completa de ${day}?`;
      icon.textContent = '🔥';
    }
    modal.classList.add('active');
  }
}

function closeRoutineModal() {
  const modal = document.getElementById('routineModal');
  if (modal) modal.classList.remove('active');
  if (window.state) window.state.pendingRoutineDay = null;
}

function confirmRoutineChange() {
  if (!window.state || !window.state.pendingRoutineDay) return;
  const day = window.state.pendingRoutineDay;
  const current = window.state.routineStates[day] || 'normal';
  window.state.routineStates[day] = current === 'normal' ? 'minimal' : 'normal';
  window.saveState('routineStates');
  if (window.performAutoSave) window.performAutoSave();
  renderChecklist();
  closeRoutineModal();

  const isMin = window.state.routineStates[day] === 'minimal';
  if (window.showToast) {
    window.showToast(isMin ? `🍃 Rotina Mínima ativada para ${day}.` : `🔥 Rotina Completa ativada para ${day}.`, 'info');
  }
}

/**
 * Remove um bloco de rotina diretamente pela interface
 */
function removeBlockFromRoutine(day, category) {
  if (!window.state) return;

  const msg = `Deseja realmente remover o bloco "${category}" de ${day}? Todas as tarefas vinculadas a este bloco serão excluídas.`;
  if (!confirm(msg)) return;

  // 1. Remover categoria da lista do dia
  if (window.state.dayCategories && window.state.dayCategories[day]) {
    window.state.dayCategories[day] = window.state.dayCategories[day].filter(c => c !== category);
    window.saveState('dayCategories');
  }

  // 2. Remover tarefas que pertencem a este bloco
  if (window.state.weekData && window.state.weekData[day]) {
    const remainingTasks = [];
    window.state.weekData[day].forEach(task => {
      const taskCat = task.category || 'Geral';
      if (taskCat === category) {
        // Limpar do checklist
        const taskId = task.id || task.text;
        if (window.state.checklist && window.state.checklist[day] && window.state.checklist[day][taskId] !== undefined) {
          delete window.state.checklist[day][taskId];
        }
        // Limpar das essenciais
        if (window.state.essentialTasks && window.state.essentialTasks[day]) {
          window.state.essentialTasks[day] = window.state.essentialTasks[day].filter(t => t !== task.text && t !== task.id);
        }
      } else {
        remainingTasks.push(task);
      }
    });

    window.state.weekData[day] = remainingTasks;
    window.saveState('weekData');
    window.saveState('checklist');
    window.saveState('essentialTasks');
  }

  if (window.performAutoSave) window.performAutoSave();

  renderChecklist();
  if (window.renderTaskManagement) window.renderTaskManagement();

  if (window.showToast) {
    window.showToast(`🗑️ Bloco "${category}" e suas tarefas foram removidos com sucesso.`, 'info');
  }
}

function renderChecklist() {
  const container = document.getElementById('weekContainer');
  if (!container || !window.state) return;
  container.innerHTML = '';

  const dayKeys = Object.keys(window.state.weekData);

  dayKeys.forEach(day => {
    const dayCard = document.createElement('div');
    dayCard.className = 'day-card';

    const isMinimal = window.state.routineStates[day] === 'minimal';
    const allTasks = window.state.weekData[day] || [];

    const visibleTasks = allTasks.filter(item => !isMinimal || (window.isEssential && window.isEssential(item, day)));

    const total = visibleTasks.length;
    const completed = visibleTasks.filter(item => window.state.checklist[day]?.[item.id] || window.state.checklist[day]?.[item.text]).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    const categoriesInDay = {};
    visibleTasks.forEach(task => {
      const cat = task.category || 'Geral';
      if (!categoriesInDay[cat]) categoriesInDay[cat] = [];
      categoriesInDay[cat].push(task);
    });

    const configuredCategories = window.getDayCategories ? window.getDayCategories(day) : Object.keys(categoriesInDay);
    const orderedActiveCats = configuredCategories.filter(cat => categoriesInDay[cat] && categoriesInDay[cat].length > 0);

    let blocksHtml = '';

    if (orderedActiveCats.length === 0) {
      blocksHtml = `
        <div class="empty-day-message" style="text-align:center; padding:20px; color:var(--text-muted);">
          <span>Sem tarefas programadas. Abra o menu ☰ e vá em "Gerenciar Tarefas & Blocos" para adicionar atividades.</span>
        </div>
      `;
    } else {
      orderedActiveCats.forEach(cat => {
        const catTasks = categoriesInDay[cat];
        const catCompleted = catTasks.filter(t => window.state.checklist[day]?.[t.id] || window.state.checklist[day]?.[t.text]).length;
        const catTotal = catTasks.length;
        const isCatDone = catTotal > 0 && catCompleted === catTotal;

        blocksHtml += `
          <div class="checklist-category-block ${isCatDone ? 'all-done' : ''}">
            <div class="checklist-cat-header">
              <div class="checklist-cat-title">
                <span class="cat-dot"></span>
                <strong>${cat}</strong>
              </div>
              <div class="checklist-cat-actions">
                <span class="cat-progress-count">${catCompleted}/${catTotal}</span>
                <button class="btn-remove-block" onclick="window.removeBlockFromRoutine('${day}', '${cat}')" title="Remover bloco da rotina">
                  🗑️
                </button>
              </div>
            </div>
            <div class="task-list">
              ${catTasks.map(task => {
                const taskId = task.id || task.text;
                const isChecked = Boolean(window.state.checklist[day]?.[taskId] || (task.text && window.state.checklist[day]?.[task.text]));
                const isEss = window.isEssential && window.isEssential(task, day);

                return `
                  <div class="task-item ${isChecked ? 'completed' : ''}" onclick="if (event.target.type !== 'checkbox') window.toggleTask('${day}', '${task.id || task.text}')">
                    <label class="neon-checkbox-label">
                      <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="window.toggleTask('${day}', '${task.id || task.text}')">
                      <span class="neon-custom-checkbox"></span>
                    </label>
                    <span class="task-text">${task.text || task}</span>
                    ${isEss ? '<span class="mini-leaf" title="Rotina Mínima">🍃</span>' : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      });
    }

    dayCard.innerHTML = `
      <div class="day-header">
        <div class="day-title">
          <span class="day-title-text">📅 ${day}</span>
          <!-- Ícone de Rotina Mínima posicionado diretamente no componente do dia -->
          <button class="routine-toggle-btn ${isMinimal ? 'minimal-active' : ''}" onclick="window.toggleRoutine('${day}')" title="${isMinimal ? 'Rotina Mínima ativa (Clique para alternar)' : 'Ativar Rotina Mínima'}">
            <span class="routine-icon">${isMinimal ? '🍃' : '🔥'}</span>
            <span class="routine-text">${isMinimal ? 'Mínima' : 'Completa'}</span>
          </button>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar">
            <div class="progress-fill ${percentage === 100 ? 'done' : ''}" style="width: ${percentage}%"></div>
          </div>
          <div class="progress-count ${percentage === 100 ? 'is-complete' : ''}">${completed}/${total} (${percentage}%)</div>
        </div>
      </div>

      <div class="day-categories-container">
        ${blocksHtml}
      </div>

      <button class="complete-day-btn ${completed === total && total > 0 ? 'btn-ready' : ''}" onclick="window.completeDay('${day}')">
        ✅ Finalizar ${day}
      </button>
    `;

    container.appendChild(dayCard);
  });

  // Aplicar estilização de emojis nos elementos renderizados
  if (window.processEmojis) {
    window.processEmojis(container);
  }
}

window.toggleTask = toggleTask;
window.completeDay = completeDay;
window.resetChecklist = resetChecklist;
window.toggleRoutine = toggleRoutine;
window.closeRoutineModal = closeRoutineModal;
window.confirmRoutineChange = confirmRoutineChange;
window.removeBlockFromRoutine = removeBlockFromRoutine;
window.renderChecklist = renderChecklist;
