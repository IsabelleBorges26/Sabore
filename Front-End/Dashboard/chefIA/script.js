/* SABORÉ — Chef IA Culinário Page Script */

document.addEventListener('DOMContentLoaded', () => {

  // ─── LOAD PERSISTED AVATAR ───
  const savedAvatar = localStorage.getItem('sabore_user_avatar');
  if (savedAvatar) {
    const userAvatars = document.querySelectorAll('.user-avatar, .large-user-avatar');
    userAvatars.forEach(img => img.src = savedAvatar);
  }

  // ─── STATE MANAGEMENT ───
  let userState = {
    isPro: false,
    selectedRecipeToSave: null,
    geladeiraIngredients: ['Frango', 'Brócolis', 'Tomate'],
    books: [
      { id: 1, title: 'Café da Manhã', emoji: 'fa-solid fa-mug-hot', count: 4 },
      { id: 2, title: 'Fitness', emoji: 'fa-solid fa-leaf', count: 3 },
      { id: 3, title: 'Sobremesas', emoji: 'fa-solid fa-cake-candles', count: 2 },
      { id: 4, title: 'Favoritas', emoji: 'fa-solid fa-heart', count: 5 },
      { id: 5, title: 'Receitas Rápidas', emoji: 'fa-solid fa-bolt', count: 3 }
    ]
  };

  // ─── DYNAMIC CUSTOM CURSOR ───
  const customCursor = document.createElement('div');
  customCursor.className = 'custom-cursor';
  document.body.appendChild(customCursor);

  document.addEventListener('mousemove', (e) => {
    customCursor.style.left = e.clientX + 'px';
    customCursor.style.top = e.clientY + 'px';
  });

  function updateCursorHoverListeners() {
    const interactives = document.querySelectorAll('a, button, input, select, textarea, [role="button"], option, .prompt-chip-btn, .ingredient-tag-chip, .save-book-option-item');
    interactives.forEach(el => {
      if (el.dataset.cursorBound) return;
      el.dataset.cursorBound = 'true';
      el.addEventListener('mouseenter', () => customCursor.classList.add('hover'));
      el.addEventListener('mouseleave', () => customCursor.classList.remove('hover'));
    });
  }

  updateCursorHoverListeners();
  setInterval(updateCursorHoverListeners, 1000);

  document.addEventListener('mouseleave', () => {
    customCursor.style.display = 'none';
  });
  document.addEventListener('mouseenter', () => {
    customCursor.style.display = 'block';
  });

  // ─── INITIALIZE PLAN VISUALS ───
  function updatePlanUI() {
    const navbarPlanTag = document.getElementById('navbar-plan-tag');
    const sidebarUpgradeBtn = document.getElementById('sidebar-upgrade-btn');
    
    if (userState.isPro) {
      if (navbarPlanTag) {
        navbarPlanTag.textContent = 'PRO';
        navbarPlanTag.className = 'user-plan-tag pro';
      }
      if (sidebarUpgradeBtn) {
        sidebarUpgradeBtn.textContent = 'Menu PRO';
        sidebarUpgradeBtn.style.background = 'var(--accent-light)';
        sidebarUpgradeBtn.style.color = 'var(--accent)';
      }
    } else {
      if (navbarPlanTag) {
        navbarPlanTag.textContent = 'Gratuito';
        navbarPlanTag.className = 'user-plan-tag free';
      }
      if (sidebarUpgradeBtn) {
        sidebarUpgradeBtn.textContent = '🚀 Virar PRO';
        sidebarUpgradeBtn.style.background = 'var(--secondary)';
        sidebarUpgradeBtn.style.color = 'var(--dark-deep)';
      }
    }
  }
  
  userState.isPro = false; // Start free
  updatePlanUI();

  // ─── LOAD INITIAL AI PREFERENCES FROM CONFIGURATIONS ───
  const savedDifficulty = localStorage.getItem('sabore_ai_difficulty');
  const chefDifficultySelect = document.getElementById('chef-difficulty-select');
  if (savedDifficulty && chefDifficultySelect) {
    chefDifficultySelect.value = savedDifficulty;
  }

  const chefRestrictionSelect = document.getElementById('chef-restriction-select');
  if (chefRestrictionSelect) {
    if (localStorage.getItem('sabore_diet_vegan') === 'true') {
      chefRestrictionSelect.value = 'vegano';
    } else if (localStorage.getItem('sabore_diet_vegetarian') === 'true') {
      chefRestrictionSelect.value = 'vegetariano';
    } else if (localStorage.getItem('sabore_diet_lowcarb') === 'true' || localStorage.getItem('sabore_diet_keto') === 'true') {
      chefRestrictionSelect.value = 'lowcarb';
    } else if (localStorage.getItem('sabore_diet_gluten') === 'true') {
      chefRestrictionSelect.value = 'glutenfree';
    } else {
      chefRestrictionSelect.value = 'none';
    }
  }

  // ─── MOBILE MENU TOGGLE ───
  const mobileToggle = document.getElementById('mobile-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('active');
    });
    
    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && !mobileToggle.contains(e.target)) {
        sidebar.classList.remove('active');
      }
    });
  }

  // ─── MODALS TRIGGER SYSTEM ───
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('open');
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
  }

  const modals = document.querySelectorAll('.modal-overlay');
  modals.forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
      }
    });
  });

  const closeTriggers = [
    { btn: 'close-save-modal', modal: 'save-to-book-modal' },
    { btn: 'close-notif-modal', modal: 'notifications-modal' },
    { btn: 'close-celebration-btn', modal: 'celebration-modal' }
  ];

  closeTriggers.forEach(trigger => {
    const btn = document.getElementById(trigger.btn);
    if (btn) {
      btn.addEventListener('click', () => closeModal(trigger.modal));
    }
  });

  // Sidebar notifications click
  const notifBtn = document.getElementById('notifications-btn');
  if (notifBtn) {
    notifBtn.addEventListener('click', () => {
      openModal('notifications-modal');
      const badge = notifBtn.querySelector('.badge-dot');
      if (badge) badge.style.display = 'none';
    });
  }

  // Settings mock action
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => alert('Configurações simuladas com sucesso!'));
  }

  // ─── UPGRADE CELEBRATION PROCESS ───
  const upgradeBtnCompact = document.getElementById('sidebar-upgrade-btn');
  const proMenuLink = document.querySelector('[data-target="pro"]');

  const upgradeTriggers = [upgradeBtnCompact, proMenuLink];
  upgradeTriggers.forEach(trigger => {
    if (trigger) {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        userState.isPro = true;
        updatePlanUI();
        openModal('celebration-modal');
      });
    }
  });

  // ─── INGREDIENTS GELADEIRA TAG CLOUD ───
  const geladeiraTagsContainer = document.getElementById('geladeira-tags-cloud');
  const geladeiraInput = document.getElementById('geladeira-input');
  const btnAddGeladeiraTag = document.getElementById('btn-add-geladeira-tag');

  function renderGeladeiraTags() {
    if (!geladeiraTagsContainer) return;
    geladeiraTagsContainer.innerHTML = '';

    userState.geladeiraIngredients.forEach(ing => {
      const chip = document.createElement('span');
      chip.className = 'ingredient-tag-chip';
      chip.innerHTML = `
        ${ing}
        <button class="btn-remove-tag"><i class="fa-solid fa-xmark"></i></button>
      `;

      chip.querySelector('.btn-remove-tag').addEventListener('click', () => {
        removeGeladeiraTag(ing);
      });

      geladeiraTagsContainer.appendChild(chip);
    });
    updateCursorHoverListeners();
  }

  function addGeladeiraTag() {
    if (!geladeiraInput) return;
    let text = geladeiraInput.value.trim();
    if (!text) return;
    
    // Capitalize first letter
    text = text.charAt(0).toUpperCase() + text.slice(1);
    
    if (!userState.geladeiraIngredients.includes(text)) {
      userState.geladeiraIngredients.push(text);
      renderGeladeiraTags();
    }
    geladeiraInput.value = '';
  }

  function removeGeladeiraTag(name) {
    userState.geladeiraIngredients = userState.geladeiraIngredients.filter(t => t !== name);
    renderGeladeiraTags();
  }

  if (btnAddGeladeiraTag && geladeiraInput) {
    btnAddGeladeiraTag.addEventListener('click', addGeladeiraTag);
    geladeiraInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addGeladeiraTag();
      }
    });
  }

  // ─── CHAT ENGINE & OPENROUTER INTEGRATION ───
  const chatMessagesContainer = document.getElementById('chat-messages-container');
  const chatTextarea = document.getElementById('chat-textarea');
  const chatSendBtn = document.getElementById('chat-send-btn');
  const clearChatBtn = document.getElementById('clear-chat-btn');
  const typingIndicator = document.getElementById('typing-indicator');

  const OPENROUTER_API_KEY = "";
  const OPENROUTER_MODEL = "google/gemma-4-26b-a4b-it:free";
  let chatHistory = [];

  // Event delegation to capture save recipe button clicks
  if (chatMessagesContainer) {
    chatMessagesContainer.addEventListener('click', (e) => {
      const saveBtn = e.target.closest('.btn-chat-save-recipe');
      if (saveBtn) {
        const recipeTitle = saveBtn.dataset.title;
        const recipeTime = parseInt(saveBtn.dataset.time);
        const recipeDifficulty = saveBtn.dataset.difficulty;
        const recipeCategory = saveBtn.dataset.category;
        
        userState.selectedRecipeToSave = {
          title: recipeTitle,
          time: recipeTime,
          difficulty: recipeDifficulty,
          category: recipeCategory
        };

        renderBookSaveOptions();
        openModal('save-to-book-modal');
      }
    });
  }

  // Trigger Send on click
  if (chatSendBtn && chatTextarea) {
    chatSendBtn.addEventListener('click', () => {
      const msgText = chatTextarea.value.trim();
      if (!msgText) return;
      handleUserMessage(msgText);
    });

    chatTextarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const msgText = chatTextarea.value.trim();
        if (!msgText) return;
        handleUserMessage(msgText);
      }
    });
  }

  // Suggestions prompt triggers
  const promptBtns = document.querySelectorAll('.prompt-chip-btn');
  promptBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const promptText = btn.dataset.prompt;
      handleUserMessage(promptText);
    });
  });

  // Clear Chat Container
  if (clearChatBtn && chatMessagesContainer) {
    clearChatBtn.addEventListener('click', () => {
      if (confirm('Deseja limpar o histórico da conversa com o Chef IA?')) {
        chatHistory = [];
        chatMessagesContainer.innerHTML = `
          <div class="message-bubble assistant">
            <div class="bubble-content">
              <p>Olá, Davi! Histórico limpo. Como posso ajudar você na cozinha hoje? 🍲</p>
            </div>
            <span class="message-time">agora</span>
          </div>
        `;
        updateCursorHoverListeners();
      }
    });
  }

  async function streamOpenRouterResponse(messages, onChunk, onDone, onError) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "Saboré Culinário"
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: messages,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // keep last partial line

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine) continue;
          if (cleanLine === "data: [DONE]") continue;

          if (cleanLine.startsWith("data: ")) {
            try {
              const data = JSON.parse(cleanLine.substring(6));
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              console.warn("Failed to parse chunk:", cleanLine, e);
            }
          }
        }
      }

      if (buffer && buffer.startsWith("data: ")) {
        try {
          const data = JSON.parse(buffer.substring(6));
          const content = data.choices?.[0]?.delta?.content;
          if (content) {
            onChunk(content);
          }
        } catch (e) {}
      }

      onDone();
    } catch (error) {
      onError(error);
    }
  }

  function getSystemPrompt() {
    const restrictionEl = document.getElementById('chef-restriction-select');
    const difficultyEl = document.getElementById('chef-difficulty-select');
    
    const restriction = restrictionEl ? restrictionEl.options[restrictionEl.selectedIndex].text : "Nenhuma restrição";
    const difficulty = difficultyEl ? difficultyEl.options[difficultyEl.selectedIndex].text : "Qualquer complexidade";
    const ingredients = userState.geladeiraIngredients.join(', ') || "Nenhum ingrediente adicionado";

    // Read ALL dietary restrictions saved in configurations (localStorage)
    const activeDiets = [];
    if (localStorage.getItem('sabore_diet_vegan') === 'true') activeDiets.push('Vegano');
    if (localStorage.getItem('sabore_diet_vegetarian') === 'true') activeDiets.push('Vegetariano');
    if (localStorage.getItem('sabore_diet_gluten') === 'true') activeDiets.push('Sem Glúten');
    if (localStorage.getItem('sabore_diet_lactose') === 'true') activeDiets.push('Sem Lactose');
    if (localStorage.getItem('sabore_diet_lowcarb') === 'true') activeDiets.push('Low Carb');
    if (localStorage.getItem('sabore_diet_keto') === 'true') activeDiets.push('Cetogênica');

    const configRestrictionText = activeDiets.length > 0 ? activeDiets.join(', ') : "Nenhuma restrição";
    
    // Read servings preference
    const servings = localStorage.getItem('sabore_ai_servings') || "2";

    return `Você é o Chef Saboré IA, um assistente culinário pessoal inteligente de alto nível da plataforma Saboré.
Seu objetivo é ajudar o usuário com receitas, técnicas culinárias e substituições de ingredientes.

Contexto Atual do Usuário (Configurações Gerais):
- Restrições Alimentares Ativas: ${configRestrictionText}
- Rendimento Padrão Desejado: ${servings} porções

Contexto Selecionado na Página:
- Filtro de Restrição: ${restriction}
- Estilo de Preparo / Dificuldade Selecionada: ${difficulty}
- Ingredientes Disponíveis na Geladeira: ${ingredients}

DIRETRIZES DE RESPOSTA:
1. Seja sempre amigável, entusiasmado, profissional e inspirador.
2. Priorize o uso dos ingredientes listados na geladeira do usuário sempre que apropriado. Se não for apropriado ou se outros ingredientes essenciais forem necessários, mencione-os de forma clara.
3. Respeite rigorosamente todas as restrições alimentares do usuário (tanto as das configurações: ${configRestrictionText}, quanto o filtro da página: ${restriction}).
4. Ajuste a complexidade das receitas propostas ao estilo de preparo configurado.
5. Ajuste a quantidade de ingredientes para render exatamente ${servings} porções por padrão.
6. NUNCA envie ou use asteriscos (como * ou **) nas mensagens de chat normais. Se precisar destacar algo, use apenas formatação textual ou deixe o texto limpo.
7. Sempre que sugerir uma receita detalhada completa, você DEVE formatá-la usando a tag personalizada estruturada <recipe> exatamente como abaixo, para que o sistema possa renderizar o card de receita premium.

FORMATO DA TAG DE RECEITA:
<recipe title="NOME_DA_RECEITA" time="TEMPO_EM_MINUTOS (ex: 20 min)" difficulty="DIFICULDADE (ex: Fácil, Médio, Difícil)" category="CATEGORIA (ex: Almoço, Jantar, Sobremesa, Lanche)">
<ingredients>
- Ingrediente 1
- Ingrediente 2
</ingredients>
<instructions>
1. Passo 1
2. Passo 2
</instructions>
</recipe>

ATENÇÃO:
- NUNCA envolva a tag <recipe> (ou seus blocos internos) em blocos de código markdown (como crases \`\`\`xml ... \`\`\` ou \`\`\`html ... \`\`\`). Escreva a tag <recipe> diretamente no fluxo de texto.
- Não coloque texto adicional ou tags adicionais de formatação dentro da tag <recipe> além dos blocos <ingredients> e <instructions>.
- Qualquer introdução, explicação ou conversa informal deve ficar FORA da tag <recipe>.
- Siga exatamente a sintaxe de atributos e fechamento das tags.
`;
  }

  function formatResponseText(text) {
    // 0. Preprocess: strip markdown code block ticks that wrap/enclose <recipe> tags
    let formatted = text
      .replace(/```(?:xml|html|json)?\s*(<recipe)/gi, '$1')
      .replace(/(<\/recipe>)\s*```/gi, '$1');

    // 1. Process standard recipe tags (fully closed)
    formatted = formatted.replace(/<recipe\s+title="([^"]+)"\s+time="([^"]+)"\s+difficulty="([^"]+)"\s+category="([^"]+)">\s*<ingredients>([\s\S]*?)<\/ingredients>\s*<instructions>([\s\S]*?)<\/instructions>\s*<\/recipe>/gi, 
      (match, title, time, difficulty, category, ingredients, instructions) => {
        const ingListHtml = ingredients.trim().split('\n')
          .map(line => {
            const cleanLine = line.replace(/^\s*[-\*+]\s*/, '').trim();
            return cleanLine ? `<li>${cleanLine}</li>` : '';
          }).join('');
          
        const instListHtml = instructions.trim().split('\n')
          .map(line => {
            const cleanLine = line.replace(/^\s*\d+[\.\)]\s*/, '').trim();
            return cleanLine ? `<li>${cleanLine}</li>` : '';
          }).join('');

        return `
          <div class="chat-recipe-card">
            <div class="chat-recipe-header">
              <h4>${title}</h4>
              <div class="chat-recipe-meta">
                <span><i class="fa-regular fa-clock"></i> ${time}</span>
                <span><i class="fa-solid fa-gauge-simple"></i> ${difficulty}</span>
                <span><i class="fa-solid fa-utensils"></i> ${category}</span>
              </div>
            </div>
            <div class="chat-recipe-section">
              <h5>Ingredientes</h5>
              <ul>
                ${ingListHtml}
              </ul>
            </div>
            <div class="chat-recipe-section">
              <h5>Modo de Preparo</h5>
              <ol>
                ${instListHtml}
              </ol>
            </div>
            <button class="btn-chat-save-recipe" data-title="${title}" data-time="${parseInt(time) || 0}" data-difficulty="${difficulty}" data-category="${category}">
              <i class="fa-solid fa-folder-plus"></i> Salvar esta Receita
            </button>
          </div>
        `;
      });

    // 2. Hide opening tags and block tags if they are incomplete or in progress so they don't leak as raw tags
    formatted = formatted
      .replace(/<recipe[^>]*>/gi, '')
      .replace(/<\/recipe>/gi, '')
      .replace(/<ingredients>/gi, '\nIngredientes:\n')
      .replace(/<\/ingredients>/gi, '')
      .replace(/<instructions>/gi, '\nModo de Preparo:\n')
      .replace(/<\/instructions>/gi, '');

    // 3. Parse markdown
    let parsed;
    if (window.marked && window.marked.parse) {
      parsed = window.marked.parse(formatted);
    } else {
      parsed = formatted
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
    }

    // 4. Strip any remaining raw asterisks (*) from the final parsed HTML to avoid raw markdown leakage
    return parsed.replace(/\*/g, '');
  }

  async function handleUserMessage(msgText) {
    if (!msgText) return;

    // Append User message
    const timeStr = getCurrentTimeFormatted();
    const userBubble = document.createElement('div');
    userBubble.className = 'message-bubble user';
    userBubble.innerHTML = `
      <div class="bubble-content">
        <p>${msgText}</p>
      </div>
      <span class="message-time">${timeStr}</span>
    `;

    chatMessagesContainer.appendChild(userBubble);
    chatTextarea.value = '';
    scrollToBottom();

    // Show Typing Indicator
    if (typingIndicator) typingIndicator.classList.remove('hidden');

    // Create Assistant bubble
    const assistantBubble = document.createElement('div');
    assistantBubble.className = 'message-bubble assistant';
    
    // Initial empty state
    const bubbleContent = document.createElement('div');
    bubbleContent.className = 'bubble-content';
    bubbleContent.innerHTML = '<p>...</p>';
    assistantBubble.appendChild(bubbleContent);

    const messageTime = document.createElement('span');
    messageTime.className = 'message-time';
    messageTime.textContent = getCurrentTimeFormatted();
    assistantBubble.appendChild(messageTime);

    chatMessagesContainer.appendChild(assistantBubble);

    // Save user message to history
    chatHistory.push({ role: "user", content: msgText });

    // Build payload
    const systemMessage = { role: "system", content: getSystemPrompt() };
    const apiMessages = [systemMessage, ...chatHistory];

    let fullResponse = "";

    try {
      await streamOpenRouterResponse(
        apiMessages,
        // onChunk
        (chunk) => {
          if (typingIndicator) typingIndicator.classList.add('hidden');
          fullResponse += chunk;
          bubbleContent.innerHTML = formatResponseText(fullResponse);
          scrollToBottom();
        },
        // onDone
        () => {
          if (typingIndicator) typingIndicator.classList.add('hidden');
          bubbleContent.innerHTML = formatResponseText(fullResponse);
          chatHistory.push({ role: "assistant", content: fullResponse });
          scrollToBottom();
          updateCursorHoverListeners();
        },
        // onError
        (error) => {
          console.error("OpenRouter error:", error);
          if (typingIndicator) typingIndicator.classList.add('hidden');
          
          const fallbackResponse = getMockChefResponse(msgText);
          bubbleContent.innerHTML = fallbackResponse;
          chatHistory.push({ role: "assistant", content: fallbackResponse });
          
          scrollToBottom();
          updateCursorHoverListeners();
        }
      );
    } catch (e) {
      console.error("Critical chat error:", e);
      if (typingIndicator) typingIndicator.classList.add('hidden');
      
      const fallbackResponse = getMockChefResponse(msgText);
      bubbleContent.innerHTML = fallbackResponse;
      chatHistory.push({ role: "assistant", content: fallbackResponse });
      
      scrollToBottom();
      updateCursorHoverListeners();
    }
  }

  function scrollToBottom() {
    if (chatMessagesContainer) {
      chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }
  }

  function getCurrentTimeFormatted() {
    const now = new Date();
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    return hrs + ':' + mins;
  }

  // ─── CHEF INTELLIGENT ROUTINES MOCK ANSWERS ───
  function getMockChefResponse(query) {
    const cleanQuery = query.toLowerCase();
    
    // Check if query is looking for geladeira tags
    if (cleanQuery.includes('geladeira') || cleanQuery.includes('ingredientes salvos') || cleanQuery.includes('ingredientes que tenho') || cleanQuery.includes('ingredientes que salvei')) {
      const ingredientsList = userState.geladeiraIngredients;
      if (ingredientsList.length === 0) {
        return `
          <p>Vejo que você não salvou nenhum ingrediente no painel da geladeira ao lado ainda!</p>
          <p>Por favor, adicione alguns ingredientes (como frango, queijo, cebola ou tomate) na aba **"O que tem na geladeira?"** e me pergunte novamente para eu criar uma receita sob medida.</p>
        `;
      }

      // Generate customized parmegiana/stir fry based on tags
      const title = 'Stir-Fry de ' + ingredientsList.join(' e ');
      const ingredientsLines = ingredientsList.map(i => `<li>${i} (a gosto, cortado em cubos/tiras)</li>`).join('') + 
                               '<li>1 colher de sopa de azeite</li><li>Dente de alho picado</li><li>Sal e pimenta a gosto</li>';

      return `
        <p>Ótimo! Analisei sua geladeira e encontrei: **${ingredientsList.join(', ')}**.</p>
        <p>Com base nisso, sugiro prepararmos um delicioso e prático **${title}**. Aqui está a ficha do prato:</p>
        
        <div class="chat-recipe-card">
          <div class="chat-recipe-header">
            <h4>${title}</h4>
            <div class="chat-recipe-meta">
              <span><i class="fa-regular fa-clock"></i> 15 min</span>
              <span><i class="fa-solid fa-gauge-simple"></i> Fácil</span>
              <span><i class="fa-solid fa-utensils"></i> Almoço</span>
            </div>
          </div>
          <div class="chat-recipe-section">
            <h5>Ingredientes</h5>
            <ul>
              ${ingredientsLines}
            </ul>
          </div>
          <div class="chat-recipe-section">
            <h5>Modo de Preparo</h5>
            <ol>
              <li>Aqueça o azeite em uma frigideira em fogo alto.</li>
              <li>Doure o alho e adicione os ingredientes na ordem de tempo de cozimento.</li>
              <li>Tempere com sal, pimenta e ervas a gosto. Refogue por 10 minutos mexendo sempre até dourar uniformemente.</li>
            </ol>
          </div>
          <button class="btn-chat-save-recipe" data-title="${title}" data-time="15" data-difficulty="Fácil" data-category="Almoço">
            <i class="fa-solid fa-folder-plus"></i> Salvar esta Receita
          </button>
        </div>
      `;
    }

    // Ovos/Manteiga Substitutes
    if (cleanQuery.includes('ovo') || cleanQuery.includes('manteiga') || cleanQuery.includes('substitu')) {
      return `
        <p>Substituir ovos e manteiga em receitas de panificação (como bolos e tortas) é muito comum e fácil! Aqui estão as melhores alternativas saudáveis e veganas:</p>
        <p><strong>Para substituir 1 ovo:</strong></p>
        <ul>
          <li>**Purê de Banana:** 1/2 banana média amassada (acrescenta umidade e doce).</li>
          <li>**Semente de Linhaça ou Chia:** 1 colher de sopa de sementes moídas hidratada em 3 colheres de sopa de água por 10 minutos (forma um gel aglutinante perfeito).</li>
          <li>**Purê de Maçã:** 1/4 de xícara de purê de maçã cozida sem açúcar (ótimo para bolos fofos).</li>
        </ul>
        <p><strong>Para substituir a Manteiga:</strong></p>
        <ul>
          <li>**Óleo de Coco:** Substituição na proporção 1:1 (líquido ou sólido).</li>
          <li>**Purê de Abacate:** Excelente para receitas de chocolate e brownies saudáveis.</li>
          <li>**Azeite de Oliva:** Use 3/4 da quantidade indicada de manteiga (ótimo para massas e bolos rústicos).</li>
        </ul>
        <p>Quer que eu sugira uma receita de bolo fofinho que já use essas substituições?</p>
      `;
    }

    // Jantar Rápido
    if (cleanQuery.includes('jantar') || cleanQuery.includes('pratico') || cleanQuery.includes('rápido')) {
      const title = 'Risoto Rápido de Tomate Cereja com Brócolis';
      return `
        <p>Para um jantar prático e rápido, que tal um saboroso **Risoto Rápido** usando os ingredientes recomendados?</p>
        <p>Ele fica pronto em 20 minutos e usa apenas uma panela (one-pot):</p>
        
        <div class="chat-recipe-card">
          <div class="chat-recipe-header">
            <h4>${title}</h4>
            <div class="chat-recipe-meta">
              <span><i class="fa-regular fa-clock"></i> 20 min</span>
              <span><i class="fa-solid fa-gauge-simple"></i> Fácil</span>
              <span><i class="fa-solid fa-utensils"></i> Jantar</span>
            </div>
          </div>
          <div class="chat-recipe-section">
            <h5>Ingredientes</h5>
            <ul>
              <li>1 xícara de arroz (de preferência arbóreo ou agulhinha cozido)</li>
              <li>1/2 maço de brócolis picado</li>
              <li>1 xícara de tomates cereja cortados ao meio</li>
              <li>1 colher de sopa de requeijão ou creme de ricota</li>
              <li>Sal, azeite e alho a gosto</li>
            </ul>
          </div>
          <div class="chat-recipe-section">
            <h5>Modo de Preparo</h5>
            <ol>
              <li>Refogue o alho picado no azeite e junte os tomates cereja e o brócolis.</li>
              <li>Cozinhe por 5 minutos até os tomates amaciarem.</li>
              <li>Adicione o arroz e misture bem.</li>
              <li>Adicione o creme de ricota para dar cremosidade, tempere com sal e sirva quente.</li>
            </ol>
          </div>
          <button class="btn-chat-save-recipe" data-title="${title}" data-time="20" data-difficulty="Fácil" data-category="Jantar">
            <i class="fa-solid fa-folder-plus"></i> Salvar esta Receita
          </button>
        </div>
      `;
    }

    // Fitness/Proteina
    if (cleanQuery.includes('fit') || cleanQuery.includes('saudavel') || cleanQuery.includes('lanche') || cleanQuery.includes('treino')) {
      const title = 'Smoothie Proteico de Cacau e Aveia';
      return `
        <p>Para o seu lanche ou pós-treino proteico, recomendo este **Smoothie de Cacau**. Ele ajuda na recuperação muscular e é super saboroso:</p>
        
        <div class="chat-recipe-card">
          <div class="chat-recipe-header">
            <h4>${title}</h4>
            <div class="chat-recipe-meta">
              <span><i class="fa-regular fa-clock"></i> 5 min</span>
              <span><i class="fa-solid fa-gauge-simple"></i> Fácil</span>
              <span><i class="fa-solid fa-leaf"></i> Fitness</span>
            </div>
          </div>
          <div class="chat-recipe-section">
            <h5>Ingredientes</h5>
            <ul>
              <li>1 copo de leite de amêndoas ou leite desnatado</li>
              <li>1 banana madura congelada fatiada</li>
              <li>2 colheres de sopa de aveia em flocos</li>
              <li>1 scoop de whey protein de chocolate ou 1 colher de sopa de cacau 100%</li>
              <li>1 colher de sopa de pasta de amendoim integral</li>
            </ul>
          </div>
          <div class="chat-recipe-section">
            <h5>Modo de Preparo</h5>
            <ol>
              <li>Adicione todos os ingredientes no liquidificador.</li>
              <li>Bata em potência máxima por 2 minutos até que fique bem cremoso.</li>
              <li>Sirva imediatamente bem gelado.</li>
            </ol>
          </div>
          <button class="btn-chat-save-recipe" data-title="${title}" data-time="5" data-difficulty="Fácil" data-category="Fitness">
            <i class="fa-solid fa-folder-plus"></i> Salvar esta Receita
          </button>
        </div>
      `;
    }

    // Default Fallback
    const title = 'Salteado Culinário Saboré';
    return `
      <p>Que excelente ideia! Embora eu seja um Chef digital, posso formular receitas incríveis baseadas em sua sugestão.</p>
      <p>Aqui está uma sugestão rápida inspirada na sua mensagem: **"${query}"**:</p>
      
      <div class="chat-recipe-card">
        <div class="chat-recipe-header">
          <h4>${title}</h4>
          <div class="chat-recipe-meta">
            <span><i class="fa-regular fa-clock"></i> 15 min</span>
            <span><i class="fa-solid fa-gauge-simple"></i> Fácil</span>
            <span><i class="fa-solid fa-utensils"></i> Prático</span>
          </div>
        </div>
        <div class="chat-recipe-section">
          <h5>Ingredientes</h5>
          <ul>
            <li>Ingredientes frescos disponíveis (cortados em pedaços)</li>
            <li>1 colher de sopa de manteiga ou azeite</li>
            <li>Sal, pimenta do reino e temperos frescos</li>
          </ul>
        </div>
        <div class="chat-recipe-section">
          <h5>Modo de Preparo</h5>
          <ol>
            <li>Refogue os ingredientes aromáticos no azeite ou manteiga.</li>
            <li>Junte os alimentos principais e salteie em fogo alto até cozinharem.</li>
            <li>Ajuste os temperos ao seu gosto e sirva.</li>
          </ol>
        </div>
        <button class="btn-chat-save-recipe" data-title="${title}" data-time="15" data-difficulty="Fácil" data-category="Prático">
          <i class="fa-solid fa-folder-plus"></i> Salvar esta Receita
        </button>
      </div>
    `;
  }

  // ─── SAVE TO BOOK DIALOG CONTROLLER ───
  const saveOptionsContainer = document.getElementById('save-book-options-container');

  function renderBookSaveOptions() {
    if (!saveOptionsContainer) return;
    saveOptionsContainer.innerHTML = '';

    userState.books.forEach(book => {
      const item = document.createElement('div');
      item.className = 'save-book-option-item';
      
      item.innerHTML = `
        <div class="save-book-info">
          <div class="save-book-icon"><i class="${book.emoji}"></i></div>
          <div class="save-book-meta">
            <h4>${book.title}</h4>
            <p>${book.count} receitas</p>
          </div>
        </div>
        <button class="btn-select-save-book">Salvar</button>
      `;

      item.querySelector('.btn-select-save-book').addEventListener('click', () => {
        book.count += 1;
        closeModal('save-to-book-modal');
        alert('Receita "' + userState.selectedRecipeToSave.title + '" salva com sucesso no livro "' + book.title + '"!');
      });

      saveOptionsContainer.appendChild(item);
    });
    updateCursorHoverListeners();
  }

  // ─── INITIAL RENDERING CALLS ───
  renderGeladeiraTags();
});
