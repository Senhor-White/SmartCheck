
let currentCardIndex = 0;
let currentDayTasksForCard = [];

function getCurrentDayNameForCards() {
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return days[new Date().getDay()];
}

/**
 * Retorna as tarefas do dia estritamente na ordem dos blocos de rotina
 * configurados pelo usuário (respeitando a sequência de blocos e tarefas dentro de cada bloco)
 */
function getOrderedRoutineTasks(day) {
  if (!window.state || !window.state.weekData || !window.state.weekData[day]) {
    return [];
  }

  const allTasks = window.state.weekData[day] || [];
  const isMinimal = window.state.routineStates && (window.state.routineStates[day] === 'minimal');

  // Filtrar de acordo com a rotina mínima se aplicável
  const visibleTasks = allTasks.filter(item => {
    if (isMinimal && window.isEssential) {
      return window.isEssential(item, day);
    }
    return true;
  });

  // Obter categorias/blocos na ordem definida pelo usuário
  const categories = window.getDayCategories ? window.getDayCategories(day) : ['Geral'];

  // Agrupar tarefas visíveis por bloco
  const groupedByCat = {};
  categories.forEach(cat => {
    groupedByCat[cat] = [];
  });
  const unassignedTasks = [];

  visibleTasks.forEach(task => {
    const cat = task.category || 'Geral';
    const taskItem = {
      task: task,
      id: task.id || task.text,
      text: task.text || task,
      category: cat
    };

    if (groupedByCat[cat]) {
      groupedByCat[cat].push(taskItem);
    } else {
      unassignedTasks.push(taskItem);
    }
  });

  // Montar lista estritamente sequencial: Bloco 1 -> Tarefas do Bloco 1; Bloco 2 -> Tarefas do Bloco 2...
  const strictSequence = [];
  categories.forEach(cat => {
    if (groupedByCat[cat] && groupedByCat[cat].length > 0) {
      strictSequence.push(...groupedByCat[cat]);
    }
  });

  // Anexar quaisquer tarefas restantes
  if (unassignedTasks.length > 0) {
    strictSequence.push(...unassignedTasks);
  }

  return strictSequence;
}

/**
 * Verifica se uma tarefa está marcada como concluída no checklist
 */
function isTaskDoneInChecklist(day, taskItem) {
  if (!window.state || !window.state.checklist || !window.state.checklist[day]) {
    return false;
  }
  const dayChecklist = window.state.checklist[day];
  const id = taskItem.id || (taskItem.task && taskItem.task.id);
  const text = taskItem.text || (taskItem.task && taskItem.task.text);
  return Boolean((id && dayChecklist[id]) || (text && dayChecklist[text]));
}

function startCardsMode() {
  if (window.showView) {
    window.showView('cards-view');
  } else {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const cv = document.getElementById('cards-view');
    if (cv) cv.classList.add('active');
  }

  const today = getCurrentDayNameForCards();

  // Obter a sequência estrita baseada nos blocos de rotina
  currentDayTasksForCard = getOrderedRoutineTasks(today);

  // Encontrar o primeiro card da sequência estrita que ainda NÃO foi concluído
  const firstPendingIndex = currentDayTasksForCard.findIndex(item => !isTaskDoneInChecklist(today, item));

  if (firstPendingIndex !== -1) {
    currentCardIndex = firstPendingIndex;
  } else if (currentDayTasksForCard.length > 0) {
    // Todas as tarefas de hoje já foram cumpridas
    currentCardIndex = currentDayTasksForCard.length;
  } else {
    currentCardIndex = 0;
  }

  renderCard();
}

function renderCard() {
  const container = document.getElementById('cardsModeContent');
  if (!container) return;

  const today = getCurrentDayNameForCards();

  if (currentCardIndex >= currentDayTasksForCard.length && currentDayTasksForCard.length > 0) {
    container.innerHTML = '';
    setTimeout(() => {
      const hudEnd = document.getElementById('hudEndMode');
      if (hudEnd) hudEnd.classList.add('active');
      window.saveToHistory(today, true, '');
    }, 100);
    return;
  } else if (currentDayTasksForCard.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="text-align:center; padding:30px; color:var(--text-muted);">
        <h3>Nenhuma tarefa pendente para hoje (${today}).</h3>
        <p style="margin-top: 10px; font-size: 0.9rem;">Adicione blocos e tarefas no checklist ou gerenciador de tarefas.</p>
      </div>
    `;
    return;
  }

  const taskItem = currentDayTasksForCard[currentCardIndex];
  const taskText = taskItem.text;
  const taskCat = taskItem.category;
  const isDone = isTaskDoneInChecklist(today, taskItem);

  const isFirst = currentCardIndex === 0;
  const isLast = currentCardIndex === currentDayTasksForCard.length - 1;

  container.innerHTML = `
    <div class="daily-card-single" id="currentDailyCard">
      <div class="card-meta-bar">
        <span class="card-count-badge">Card ${currentCardIndex + 1} de ${currentDayTasksForCard.length}</span>
        <span class="card-cat-badge">📁 Bloco: ${taskCat}</span>
      </div>

      <div class="daily-card-task ${isDone ? 'card-task-done' : ''}">${taskText}</div>

      <div class="card-actions-wrapper">
        <button class="btn-card-complete ${isDone ? 'is-completed-state' : ''}" onclick="window.completeCurrentCard()">
          ${isDone ? '✓ Tarefa Já Concluída (Avançar)' : '✅ Concluir Tarefa'}
        </button>

        <div class="card-nav-row" style="display: flex; gap: 8px; margin-top: 12px; width: 100%;">
          <button class="btn btn-outline-neon" onclick="window.prevCard()" style="flex: 1;" ${isFirst ? 'disabled' : ''}>
            ⬅️ Anterior
          </button>
          <button class="btn btn-outline-neon" onclick="window.nextCard()" style="flex: 1;" ${isLast ? 'disabled' : ''}>
            Próximo ➡️
          </button>
        </div>
      </div>
    </div>
  `;

  // Aplicar estilização de emojis nos cards gerados
  if (window.processEmojis) {
    window.processEmojis(container);
  }
}

function completeCurrentCard() {
  const card = document.getElementById('currentDailyCard');
  if (card) {
    card.classList.add('fade-out');
  }

  const today = getCurrentDayNameForCards();
  const taskItem = currentDayTasksForCard[currentCardIndex];

  if (taskItem && window.state) {
    if (!window.state.checklist[today]) {
      window.state.checklist[today] = {};
    }
    const taskId = taskItem.id || taskItem.text;
    window.state.checklist[today][taskId] = true;
    window.saveState('checklist');
    if (window.performAutoSave) window.performAutoSave();
    if (window.renderChecklist) window.renderChecklist();
  }

  setTimeout(() => {
    // Avançar estritamente para o próximo card da sequência
    currentCardIndex++;
    renderCard();
  }, 250);
}

function nextCard() {
  if (currentCardIndex < currentDayTasksForCard.length - 1) {
    currentCardIndex++;
    renderCard();
  }
}

function prevCard() {
  if (currentCardIndex > 0) {
    currentCardIndex--;
    renderCard();
  }
}

function closeAndResetCardsMode() {
  const hudEnd = document.getElementById('hudEndMode');
  if (hudEnd) hudEnd.classList.remove('active');

  const today = getCurrentDayNameForCards();
  try {
    if (window.state && window.state.checklist[today]) {
      window.state.checklist[today] = {};
      window.saveState('checklist');
      if (window.performAutoSave) window.performAutoSave();
      if (window.renderChecklist) window.renderChecklist();
    }
  } catch (e) {
    console.error(e);
  }

  if (window.showView) window.showView('checklist');
}

function checkResetCardsMode() {
  const currentDateStr = new Date().toLocaleDateString();
  let cardsProgress = JSON.parse(localStorage.getItem('cardsProgress'));
  if (cardsProgress && cardsProgress.date !== currentDateStr) {
    cardsProgress = { date: currentDateStr, completedIndices: [] };
    localStorage.setItem('cardsProgress', JSON.stringify(cardsProgress));
  }
}

window.getCurrentDayNameForCards = getCurrentDayNameForCards;
function getOrderedDayTasks(day) {
  return getOrderedRoutineTasks(day);
}
window.getOrderedDayTasks = getOrderedDayTasks;
window.startCardsMode = startCardsMode;
window.renderCard = renderCard;
window.completeCurrentCard = completeCurrentCard;
window.nextCard = nextCard;
window.prevCard = prevCard;
window.closeAndResetCardsMode = closeAndResetCardsMode;
window.checkResetCardsMode = checkResetCardsMode;
