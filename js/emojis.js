// ==========================================================================
// EMOJI PROCESSOR MODULE (SMARTCHECK)
// Estilização automática de emojis padrão para preto e branco (monocromático)
// Exceção crítica: Emojis com estilos customizados mantêm suas cores originais
// ==========================================================================

(function () {
  'use strict';

  // Expressão regular abrangente para detecção de emojis Unicode
  const EMOJI_REGEX = /(?:\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Emoji}\uFE0F|[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F1E6}-\u{1F1FF}]{2})/u;
  const EMOJI_GLOBAL_REGEX = /(?:\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Emoji}\uFE0F|[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F1E6}-\u{1F1FF}]{2})/gu;

  // Tags HTML onde o conteúdo de texto nunca deve ser alterado/envolvido por spans
  const IGNORED_TAGS = new Set([
    'SCRIPT',
    'STYLE',
    'TEXTAREA',
    'INPUT',
    'SELECT',
    'OPTION',
    'CODE',
    'PRE',
    'HEAD',
    'TITLE',
    'META'
  ]);

  /**
   * Verifica se um elemento ou seus ancestrais possuem estilos customizados
   * que devem isentar os emojis de ficarem preto e branco.
   */
  function hasCustomStyle(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;

    let current = element;
    while (current && current !== document.body) {
      // 1. Classes explícitas de customização
      if (
        current.classList && (
          current.classList.contains('emoji-custom') ||
          current.classList.contains('keep-color') ||
          current.classList.contains('colored-emoji') ||
          current.classList.contains('custom-color') ||
          current.classList.contains('no-bw')
        )
      ) {
        return true;
      }

      // 2. Atributos explícitos de dados
      if (
        current.hasAttribute('data-emoji-custom') ||
        current.getAttribute('data-emoji-style') === 'custom' ||
        current.getAttribute('data-keep-color') === 'true'
      ) {
        return true;
      }

      // 3. Estilos inline aplicados diretamente (ex: style="color: ...", style="filter: ...")
      const styleAttr = current.getAttribute('style');
      if (styleAttr) {
        const lowerStyle = styleAttr.toLowerCase();
        if (
          lowerStyle.includes('color:') ||
          lowerStyle.includes('filter:') ||
          lowerStyle.includes('text-shadow:')
        ) {
          // Se possui cor inline explícita (como botões coloridos, alertas coloridos, badges)
          return true;
        }
      }

      current = current.parentElement;
    }

    return false;
  }

  /**
   * Processa nós de texto para envolver emojis padrão com a classe monocromática
   */
  function processTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    if (!node.nodeValue || !EMOJI_REGEX.test(node.nodeValue)) return;

    const parent = node.parentElement;
    if (!parent) return;

    // Ignorar tags protegidas
    if (IGNORED_TAGS.has(parent.tagName)) return;

    // Se já estiver envolvido em um span de emoji, não processar novamente
    if (parent.classList.contains('emoji-bw') || parent.classList.contains('emoji-custom')) {
      return;
    }

    // Verificar se o elemento pai ou ancestral possui estilização customizada
    const isCustom = hasCustomStyle(parent);
    if (isCustom) {
      // Exceção crítica: manter cor original (não aplicar preto e branco)
      return;
    }

    // Substituir emojis padrão por spans com a classe monocromática
    const text = node.nodeValue;
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let match;

    EMOJI_GLOBAL_REGEX.lastIndex = 0;
    while ((match = EMOJI_GLOBAL_REGEX.exec(text)) !== null) {
      const matchIndex = match.index;
      const emoji = match[0];

      // Adicionar texto antes do emoji
      if (matchIndex > lastIndex) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex, matchIndex)));
      }

      // Criar span monocromático padrão
      const span = document.createElement('span');
      span.className = 'emoji-bw';
      span.setAttribute('data-emoji-standard', 'true');
      span.textContent = emoji;
      fragment.appendChild(span);

      lastIndex = matchIndex + emoji.length;
    }

    // Adicionar restante do texto após o último emoji
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
    }

    // Substituir o nó de texto original pelo fragmento com os spans
    parent.replaceChild(fragment, node);
  }

  /**
   * Percorre a árvore DOM a partir de uma raiz e processa todos os nós de texto
   */
  let isProcessing = false;

  function processElement(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      processTextNode(root);
      return;
    }

    if (root.nodeType !== Node.ELEMENT_NODE) return;
    if (IGNORED_TAGS.has(root.tagName)) return;

    // Se o elemento inteiro tiver estilo customizado explícito, ignorar seus filhos
    if (hasCustomStyle(root)) {
      return;
    }

    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (node) {
          const parent = node.parentElement;
          if (!parent || IGNORED_TAGS.has(parent.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.classList.contains('emoji-bw') || parent.classList.contains('emoji-custom')) {
            return NodeFilter.FILTER_REJECT;
          }
          if (EMOJI_REGEX.test(node.nodeValue)) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        }
      },
      false
    );

    const nodesToProcess = [];
    while (walker.nextNode()) {
      nodesToProcess.push(walker.currentNode);
    }

    nodesToProcess.forEach(processTextNode);
  }

  /**
   * Processamento geral com controle de concorrência
   */
  function processEmojis(container = document.body) {
    if (isProcessing) return;
    try {
      isProcessing = true;
      processElement(container);
    } finally {
      isProcessing = false;
    }
  }

  /**
   * Inicializa o observador de mutações para aplicar automaticamente
   * em novos elementos renderizados dinamicamente (cards, tarefas, lembretes, modais)
   */
  let observer = null;

  function initEmojiProcessor() {
    // Processamento inicial
    processEmojis(document.body);

    if (observer) {
      observer.disconnect();
    }

    observer = new MutationObserver((mutations) => {
      if (isProcessing) return;

      let shouldProcess = false;
      const nodesToCheck = [];

      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Se for um elemento interno criado pelo próprio processador, ignorar
              if (node.classList && (node.classList.contains('emoji-bw') || node.classList.contains('emoji-custom'))) {
                continue;
              }
              nodesToCheck.push(node);
              shouldProcess = true;
            } else if (node.nodeType === Node.TEXT_NODE && EMOJI_REGEX.test(node.nodeValue)) {
              nodesToCheck.push(node);
              shouldProcess = true;
            }
          }
        }
      }

      if (shouldProcess) {
        isProcessing = true;
        try {
          nodesToCheck.forEach(node => processElement(node));
        } finally {
          isProcessing = false;
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Exportar para escopo global
  window.processEmojis = processEmojis;
  window.initEmojiProcessor = initEmojiProcessor;
  window.hasCustomStyle = hasCustomStyle;

  // Auto-inicialização quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmojiProcessor);
  } else {
    initEmojiProcessor();
  }
})();
