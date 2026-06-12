/* SABORÉ — Control Center Dashboard Scripts */

document.addEventListener('DOMContentLoaded', () => {

  // ─── USER STATE MANAGEMENT ───
  let userState = {
    isPro: false,
    plan: 'Gratuito',
    ingredients: ['Ovo', 'Tomate', 'Queijo', 'Arroz', 'Frango'],
    books: [
      { id: 1, title: 'Café da Manhã', count: 12, emoji: 'fa-solid fa-mug-hot', tag: 'Pessoal' },
      { id: 2, title: 'Fitness', count: 31, emoji: 'fa-solid fa-leaf', tag: 'PRO' },
      { id: 3, title: 'Sobremesas', count: 18, emoji: 'fa-solid fa-cake-candles', tag: 'Favorito' },
      { id: 4, title: 'Favoritas', count: 42, emoji: 'fa-solid fa-heart', tag: 'Público' },
      { id: 5, title: 'Receitas Rápidas', count: 24, emoji: 'fa-solid fa-bolt', tag: 'Pessoal' }
    ],
    activities: [
      { text: 'Você gerou: <strong>Lasanha Fitness</strong>', time: 'há 2 horas' },
      { text: 'Você salvou: <strong>Bolo de Cenoura</strong>', time: 'ontem' },
      { text: 'Criou o livro: <strong>Café da Manhã</strong>', time: 'há 3 dias' }
    ],
    stats: {
      saved: 48,
      created: 12,
      aiGenerated: 27,
      booksCount: 5
    }
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
    const interactives = document.querySelectorAll('a, button, input, select, textarea, [role="button"], .quick-action-card, .recipe-card, .trending-card, .recommend-card, .book-card-item, .ingredient-checkbox, .shortcut-card, .upload-zone');
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
    const upgradeWidget = document.getElementById('upgrade-pro-section');
    const sidebarUpgradeBtn = document.getElementById('sidebar-upgrade-btn');
    
    if (userState.isPro) {
      if (navbarPlanTag) {
        navbarPlanTag.textContent = 'PRO';
        navbarPlanTag.className = 'user-plan-tag pro';
      }
      if (upgradeWidget) upgradeWidget.style.display = 'none';
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
      if (upgradeWidget) upgradeWidget.style.display = 'block';
      if (sidebarUpgradeBtn) {
        sidebarUpgradeBtn.textContent = '🚀 Virar PRO';
        sidebarUpgradeBtn.style.background = 'var(--secondary)';
        sidebarUpgradeBtn.style.color = 'var(--dark-deep)';
      }
    }
  }

  // ─── NAVBAR SCROLL BLUR ───
  const dashboardBody = document.querySelector('.dashboard-body');
  const navbar = document.querySelector('.navbar');
  
  if (dashboardBody && navbar) {
    dashboardBody.addEventListener('scroll', () => {
      if (dashboardBody.scrollTop > 10) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  // ─── MOBILE MENU TOGGLE ───
  const mobileToggle = document.getElementById('mobile-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('active');
    });
    
    // Close sidebar clicking outside
    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && !mobileToggle.contains(e.target)) {
        sidebar.classList.remove('active');
      }
    });
  }

  // ─── RANGE SLIDER SYNC ───
  const timeSlider = document.getElementById('ai-time');
  const timeVal = document.getElementById('ai-time-val');
  if (timeSlider && timeVal) {
    timeSlider.addEventListener('input', () => {
      timeVal.textContent = timeSlider.value + ' min';
    });
  }

  // ─── GLOBAL SEARCH FILTER ───
  const searchInput = document.getElementById('global-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase().trim();
      
      // Filter recipe cards
      const recipeCards = document.querySelectorAll('.recipe-card');
      recipeCards.forEach(card => {
        const title = card.dataset.title.toLowerCase();
        const category = card.dataset.category ? card.dataset.category.toLowerCase() : '';
        if (title.includes(query) || category.includes(query)) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });

      // Filter trending cards
      const trendingCards = document.querySelectorAll('.trending-card');
      trendingCards.forEach(card => {
        const title = card.dataset.title.toLowerCase();
        const category = card.dataset.category ? card.dataset.category.toLowerCase() : '';
        if (title.includes(query) || category.includes(query)) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });

      // Filter book items
      const bookCards = document.querySelectorAll('.book-card-item');
      bookCards.forEach(card => {
        const title = card.querySelector('h4').textContent.toLowerCase();
        if (title.includes(query)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }

  // Shortcut key triggers search focus
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (searchInput) searchInput.focus();
    }
  });

  // ─── MODALS TRIGGER SYSTEM ───
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('open');
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
  }

  // General closeModal on overlay click
  const modals = document.querySelectorAll('.modal-overlay');
  modals.forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
      }
    });
  });

  // Attach Close Actions
  const closeTriggers = [
    { btn: 'close-ai-modal', modal: 'ai-generator-modal' },
    { btn: 'close-book-modal', modal: 'add-book-modal' },
    { btn: 'close-photo-modal', modal: 'photo-modal' },
    { btn: 'close-video-modal', modal: 'video-modal' },
    { btn: 'close-notif-modal', modal: 'notifications-modal' },
    { btn: 'close-celebration-btn', modal: 'celebration-modal' }
  ];

  closeTriggers.forEach(trigger => {
    const btn = document.getElementById(trigger.btn);
    if (btn) {
      btn.addEventListener('click', () => closeModal(trigger.modal));
    }
  });

  // Connect Shortcut actions
  const qaAiBtn = document.getElementById('qa-generate-ia');
  if (qaAiBtn) qaAiBtn.addEventListener('click', () => {
    // Reset modal view states to show inputs form
    const formContainer = document.getElementById('ai-form-container');
    const loadingContainer = document.getElementById('ai-loading-container');
    const resultContainer = document.getElementById('ai-result-container');
    
    if (formContainer) formContainer.classList.remove('hidden');
    if (loadingContainer) loadingContainer.classList.add('hidden');
    if (resultContainer) resultContainer.classList.add('hidden');
    
    openModal('ai-generator-modal');
    setTimeout(() => {
      const aiIngredientsInput = document.getElementById('ai-ingredients');
      if (aiIngredientsInput) aiIngredientsInput.focus();
    }, 300);
  });

  const qaPhotoBtn = document.getElementById('qa-analyze-photo');
  const shortcutPhotoBtn = document.getElementById('shortcut-photo-btn');
  const actionPhotoTriggers = [qaPhotoBtn, shortcutPhotoBtn];
  actionPhotoTriggers.forEach(btn => {
    if (btn) btn.addEventListener('click', () => {
      window.location.href = '../iaFotos/index.html';
    });
  });

  const qaImportBtn = document.getElementById('qa-import-video');
  const shortcutVideoBtn = document.getElementById('shortcut-video-btn');
  const actionVideoTriggers = [qaImportBtn, shortcutVideoBtn];
  actionVideoTriggers.forEach(btn => {
    if (btn) btn.addEventListener('click', () => {
      window.location.href = '../importVideo/index.html';
    });
  });

  const notifBtn = document.getElementById('notifications-btn');
  if (notifBtn) notifBtn.addEventListener('click', () => {
    openModal('notifications-modal');
    // Clear badge
    const badge = notifBtn.querySelector('.badge-dot');
    if (badge) badge.style.display = 'none';
  });

  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      window.location.href = '../configuracoes/index.html';
    });
  }

  const profileTrigger = document.getElementById('profile-dropdown-trigger');
  if (profileTrigger) {
    profileTrigger.addEventListener('click', () => {
      window.location.href = '../perfil/index.html';
    });
  }

  // ─── UPGRADE CELEBRATION PROCESS ───
  const upgradeBtnCompact = document.getElementById('sidebar-upgrade-btn');
  const upgradeBtnWidget = document.getElementById('dashboard-upgrade-action-btn');
  const proMenuLink = document.querySelector('[data-target="pro"]');

  const upgradeTriggers = [upgradeBtnCompact, upgradeBtnWidget, proMenuLink];
  upgradeTriggers.forEach(trigger => {
    if (trigger) {
      trigger.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          await api.put("/planos/atualizar", { plano: "PRO" });
          userState.isPro = true;
          updatePlanUI();
          openModal('celebration-modal');
          triggerCelebrationEffects();
        } catch (err) {
          alert("Erro ao assinar plano PRO: " + err.message);
        }
      });
    }
  });

  function triggerCelebrationEffects() {
    // Add small timeline activity log
    addActivity('Seu plano foi atualizado para o <strong>Saboré PRO</strong>! 💎', 'agora');
    // Update Stats visual
    userState.stats.saved += 10; // add mock benefit
    updateStatsUI();
  }

  // ─── INGREDIENTS LIST CONTROLLER ───
  const ingContainer = document.getElementById('widget-ingredients-container');
  const addIngInput = document.getElementById('add-ing-input');
  const addIngBtn = document.getElementById('add-ing-btn');

  function renderIngredients() {
    if (!ingContainer) return;
    ingContainer.innerHTML = '';
    
    userState.ingredients.forEach(ing => {
      const label = document.createElement('label');
      label.className = 'ingredient-checkbox';
      label.innerHTML = `
        <input type="checkbox" checked value="${ing}">
        <span class="custom-chk"></span>
        <span class="ing-name">${ing}</span>
        <button class="ing-delete-btn"><i class="fa-solid fa-xmark"></i></button>
      `;
      
      // Bind delete button
      const delBtn = label.querySelector('.ing-delete-btn');
      delBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        removeIngredient(ing);
      });
      
      ingContainer.appendChild(label);
    });
    updateCursorHoverListeners();
  }

  async function addIngredient(name) {
    name = name.trim();
    if (!name) return;
    // Capitalize first letter
    name = name.charAt(0).toUpperCase() + name.slice(1);
    
    try {
      await api.post("/ingredientes-disponiveis/cadastrar", { nome: name });
      if (!userState.ingredients.includes(name)) {
        userState.ingredients.push(name);
        renderIngredients();
      }
    } catch (err) {
      alert("Erro ao adicionar ingrediente: " + err.message);
    }
  }

  async function removeIngredient(name) {
    try {
      await api.delete(`/ingredientes-disponiveis/excluir/${name}`);
      userState.ingredients = userState.ingredients.filter(ing => ing !== name);
      renderIngredients();
    } catch (err) {
      alert("Erro ao remover ingrediente: " + err.message);
    }
  }

  if (addIngBtn && addIngInput) {
    addIngBtn.addEventListener('click', () => {
      addIngredient(addIngInput.value);
      addIngInput.value = '';
    });

    addIngInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        addIngredient(addIngInput.value);
        addIngInput.value = '';
      }
    });
  }

  const manageIngBtn = document.getElementById('manage-ingredients-btn');
  if (manageIngBtn) {
    manageIngBtn.addEventListener('click', () => {
      alert(`Você tem atualmente ${userState.ingredients.length} ingredientes na despensa:\n\n${userState.ingredients.join(', ')}`);
    });
  }

  // Checklist generator link
  const generateDispensaBtn = document.getElementById('generate-dispensa-btn');
  if (generateDispensaBtn) {
    generateDispensaBtn.addEventListener('click', () => {
      // Get all checked ingredients
      const checkedIngs = [];
      const checkboxes = ingContainer.querySelectorAll('input[type="checkbox"]:checked');
      checkboxes.forEach(chk => checkedIngs.push(chk.value));
      
      if (checkedIngs.length === 0) {
        alert('Por favor, selecione pelo menos um ingrediente na despensa.');
        return;
      }

      // Reset modal view states to show inputs form
      const formContainer = document.getElementById('ai-form-container');
      const loadingContainer = document.getElementById('ai-loading-container');
      const resultContainer = document.getElementById('ai-result-container');
      
      if (formContainer) formContainer.classList.remove('hidden');
      if (loadingContainer) loadingContainer.classList.add('hidden');
      if (resultContainer) resultContainer.classList.add('hidden');

      const aiInput = document.getElementById('ai-ingredients');
      if (aiInput) {
        aiInput.value = checkedIngs.join(', ');
      }
      
      openModal('ai-generator-modal');
      setTimeout(() => {
        if (aiInput) aiInput.focus();
      }, 300);
    });
  }

  // ─── BOOK CARD DYNAMIC CREATION ───
  const newBookBtn = document.getElementById('new-book-btn');
  const newBookForm = document.getElementById('new-book-form');
  const booksContainer = document.getElementById('books-list-container');

  if (newBookBtn) newBookBtn.addEventListener('click', () => openModal('add-book-modal'));

  if (newBookForm) {
    newBookForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('book-title').value;
      const emoji = document.getElementById('book-emoji-select').value;
      const visibility = document.getElementById('book-visibility').value;

      try {
        const response = await api.post("/livros/cadastrar", {
          titulo: title,
          emoji: emoji,
          tag: visibility
        });

        const newBook = {
          id: response.id,
          title: response.titulo,
          count: 0,
          emoji: response.emoji,
          tag: response.tag
        };
        
        userState.books.push(newBook);
        userState.stats.booksCount = userState.books.length;
        updateStatsUI();
        
        // Render
        renderBooks();
        closeModal('add-book-modal');
        newBookForm.reset();
        
        addActivity(`Criou o livro: <strong>${title}</strong>`, 'agora');
      } catch (err) {
        alert("Erro ao criar livro: " + err.message);
      }
    });
  }

  function renderBooks() {
    if (!booksContainer) return;
    booksContainer.innerHTML = '';
    
    userState.books.forEach(book => {
      const card = document.createElement('div');
      card.className = `book-card-item b-${book.id % 5 || 5}`;
      
      let badgeClass = '';
      if (book.tag === 'PRO') badgeClass = 'pro';
      else if (book.tag === 'Favorito') badgeClass = 'fav';
      else if (book.tag === 'Público') badgeClass = 'public';
      
      card.innerHTML = `
        <div class="book-cover"><i class="${book.emoji}"></i></div>
        <div class="book-info-area">
          <h4>${book.title}</h4>
          <p>${book.count} receitas</p>
        </div>
        <span class="book-badge ${badgeClass}">${book.tag}</span>
      `;
      booksContainer.appendChild(card);
    });
    updateCursorHoverListeners();
  }

  // ─── STATS AND ACTIVITIES TIMELINE ───
  const statsBubbles = document.querySelectorAll('.stat-count-num');
  function updateStatsUI() {
    if (statsBubbles.length >= 4) {
      statsBubbles[0].textContent = userState.stats.saved;
      statsBubbles[1].textContent = userState.stats.created;
      statsBubbles[2].textContent = userState.stats.aiGenerated;
      statsBubbles[3].textContent = userState.stats.booksCount;
    }
  }

  const activityFeed = document.querySelector('.activity-feed-timeline');
  function renderActivities() {
    if (!activityFeed) return;
    activityFeed.innerHTML = '';
    userState.activities.forEach((act, idx) => {
      const item = document.createElement('div');
      item.className = 'activity-item';
      item.innerHTML = `
        <span class="activity-dot ${idx === 0 ? 'active' : ''}"></span>
        <div class="activity-detail">
          <p>${act.text}</p>
          <span class="activity-time">${act.time}</span>
        </div>
      `;
      activityFeed.appendChild(item);
    });
  }

  function addActivity(text, time = 'agora') {
    userState.activities.unshift({ text, time });
    if (userState.activities.length > 5) userState.activities.pop(); // keep top 5
    renderActivities();
  }

  // ─── PHOTO UPLOAD PREVIEW ───
  const photoUploadZone = document.getElementById('photo-upload-zone');
  const photoFileInput = document.getElementById('photo-file-input');
  const photoPreviewContainer = document.getElementById('photo-preview-container');
  const photoPreviewImg = document.getElementById('photo-preview-img');
  const removePhotoBtn = document.getElementById('remove-photo-btn');
  const analyzePhotoActionBtn = document.getElementById('analyze-photo-action-btn');

  if (photoUploadZone && photoFileInput) {
    photoUploadZone.addEventListener('click', () => photoFileInput.click());
    
    // Handle drop
    photoUploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      photoUploadZone.style.borderColor = 'var(--accent)';
    });

    photoUploadZone.addEventListener('dragleave', () => {
      photoUploadZone.style.borderColor = 'rgba(242, 244, 243, 0.15)';
    });

    photoUploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      photoUploadZone.style.borderColor = 'rgba(242, 244, 243, 0.15)';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        showPhotoPreview(e.dataTransfer.files[0]);
      }
    });

    photoFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        showPhotoPreview(e.target.files[0]);
      }
    });
  }

  function showPhotoPreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      photoPreviewImg.src = e.target.result;
      photoUploadZone.classList.add('hidden');
      photoPreviewContainer.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }

  if (removePhotoBtn) {
    removePhotoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      photoPreviewImg.src = '';
      photoFileInput.value = '';
      photoPreviewContainer.classList.add('hidden');
      photoUploadZone.classList.remove('hidden');
    });
  }

  if (analyzePhotoActionBtn) {
    analyzePhotoActionBtn.addEventListener('click', async () => {
      if (!photoPreviewImg.src) {
        alert('Por favor, faça o upload de uma foto primeiro.');
        return;
      }
      closeModal('photo-modal');
      // Reset upload area
      photoPreviewImg.src = '';
      photoFileInput.value = '';
      photoPreviewContainer.classList.add('hidden');
      photoUploadZone.classList.remove('hidden');
      
      try {
        simulateAiGenerationLoading();
        const responseRecipe = await api.post("/ia/gerar", { prompt: "Salada César" });
        showRecipeResult(responseRecipe.title, responseRecipe.ingredients, responseRecipe.steps, responseRecipe.time, responseRecipe.difficulty, responseRecipe.diet);
      } catch (err) {
        alert("Erro ao analisar foto com IA: " + err.message);
      }
    });
  }

  // ─── VIDEO IMPORT SUBMIT ───
  const videoForm = document.getElementById('video-import-form');
  if (videoForm) {
    videoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = document.getElementById('video-url').value;
      closeModal('video-modal');
      videoForm.reset();

      try {
        simulateAiGenerationLoading();
        const responseRecipe = await api.post("/importacao/importar", { url });
        showRecipeResult(responseRecipe.title, responseRecipe.ingredients, responseRecipe.steps, responseRecipe.time, responseRecipe.difficulty, responseRecipe.diet);
      } catch (err) {
        alert("Erro ao importar vídeo: " + err.message);
      }
    });
  }

  // ─── AI RECIPE GENERATOR ───
  const aiForm = document.getElementById('ai-recipe-form');
  const aiModal = document.getElementById('ai-generator-modal');
  const loadingContainer = document.getElementById('ai-loading-container');
  const loadingStepText = document.getElementById('ai-loading-step');
  const resultContainer = document.getElementById('ai-result-container');
  const saveRecipeBtn = document.getElementById('save-recipe-btn');
  const regenerateRecipeBtn = document.getElementById('regenerate-recipe-btn');

  let currentGeneratedRecipe = null; // store current recipe details for saving

  if (aiForm) {
    aiForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const ingredientsInput = document.getElementById('ai-ingredients').value;
      const maxTime = parseInt(document.getElementById('ai-time').value);
      const diet = document.getElementById('ai-diet').value;

      try {
        simulateAiGenerationLoading();
        const responseRecipe = await api.post("/ia/gerar", {
          prompt: ingredientsInput,
          ingredients: ingredientsInput,
          maxTime,
          diet
        });
        showRecipeResult(responseRecipe.title, responseRecipe.ingredients, responseRecipe.steps, responseRecipe.time, responseRecipe.difficulty, responseRecipe.diet);
      } catch (err) {
        alert("Erro ao gerar receita por IA: " + err.message);
      }
    });
  }

  function simulateAiGenerationLoading() {
    currentGeneratedRecipe = null;
    const formContainer = document.getElementById('ai-form-container');
    if (formContainer) formContainer.classList.add('hidden');
    loadingContainer.classList.remove('hidden');
    resultContainer.classList.add('hidden');
    openModal('ai-generator-modal');

    // Steps list animation texts
    const loadingSteps = [
      'Analisando seus ingredientes...',
      'Buscando combinações de sabores na comunidade...',
      'Calculando valores nutricionais e tempos...',
      'Formatando passo a passo do Chef Saboré...'
    ];

    let currentStep = 0;
    loadingStepText.textContent = loadingSteps[currentStep];

    const stepInterval = setInterval(() => {
      currentStep++;
      if (currentStep < loadingSteps.length) {
        loadingStepText.textContent = loadingSteps[currentStep];
      } else {
        clearInterval(stepInterval);
      }
    }, 450);
  }

  function showRecipeResult(title, ingredients, steps, time, difficulty, diet) {
    currentGeneratedRecipe = { title, ingredients, steps, time, difficulty, diet };
    
    loadingContainer.classList.add('hidden');
    resultContainer.classList.remove('hidden');

    // Populate titles
    document.getElementById('result-recipe-title').textContent = title;
    document.getElementById('result-recipe-time').textContent = time + ' min';
    document.getElementById('result-recipe-difficulty').textContent = difficulty;
    
    const dietTag = document.getElementById('result-recipe-diet-tag');
    if (diet && diet !== 'none') {
      dietTag.style.display = 'inline-flex';
      dietTag.textContent = diet.toUpperCase();
    } else {
      dietTag.style.display = 'none';
    }

    // Populate lists
    const ingList = document.getElementById('result-ingredients-list');
    ingList.innerHTML = '';
    ingredients.forEach(ing => {
      const li = document.createElement('li');
      li.textContent = ing;
      ingList.appendChild(li);
    });

    const stepList = document.getElementById('result-steps-list');
    stepList.innerHTML = '';
    steps.forEach(step => {
      const li = document.createElement('li');
      li.textContent = step;
      stepList.appendChild(li);
    });
  }

  if (regenerateRecipeBtn) {
    regenerateRecipeBtn.addEventListener('click', () => {
      const formContainer = document.getElementById('ai-form-container');
      if (formContainer) formContainer.classList.remove('hidden');
      loadingContainer.classList.add('hidden');
      resultContainer.classList.add('hidden');
      const aiInput = document.getElementById('ai-ingredients');
      if (aiInput) aiInput.focus();
    });
  }

  if (saveRecipeBtn) {
    saveRecipeBtn.addEventListener('click', async () => {
      if (!currentGeneratedRecipe) return;

      try {
        // 1. Save recipe to DB
        const savedRecipe = await api.post("/receitas/cadastrar", {
          titulo: currentGeneratedRecipe.title,
          tempoPreparo: currentGeneratedRecipe.time,
          modoPreparo: currentGeneratedRecipe.steps.join("\n"),
          dificuldade: currentGeneratedRecipe.difficulty,
          criadaPorIA: true,
          ingredientes: currentGeneratedRecipe.ingredients,
          categorias: [currentGeneratedRecipe.diet !== 'none' ? currentGeneratedRecipe.diet : 'Chef IA'],
          publica: false
        });

        // 2. Add to favorites
        await api.post("/favoritos/cadastrar", { receitaId: savedRecipe.id });

        // Reload favorites list on home
        const freshFavs = await api.get("/favoritos/listar");
        renderFavorites(freshFavs);

        // Update stats
        const profileData = await api.get("/usuarios/perfil");
        userState.stats = {
          saved: profileData.stats.saved,
          created: profileData.stats.created,
          aiGenerated: profileData.stats.aiGenerated,
          booksCount: profileData.stats.booksCount
        };
        updateStatsUI();

        // Add activity
        addActivity(`Salvou: <strong>${currentGeneratedRecipe.title}</strong>`, 'agora');

        closeModal('ai-generator-modal');
        alert(`Receita "${currentGeneratedRecipe.title}" salva com sucesso em suas favoritas!`);
      } catch (err) {
        alert("Erro ao salvar receita: " + err.message);
      }
    });
  }

  // ─── FAVORITES / PUBLIC RENDERING ───
  function renderFavorites(favs) {
    const favsContainer = document.getElementById('favorites-container');
    if (!favsContainer) return;
    favsContainer.innerHTML = '';
    
    const displayFavs = favs.slice(0, 6);
    
    if (displayFavs.length === 0) {
      favsContainer.innerHTML = `
        <div class="book-detail-empty" style="grid-column: 1 / -1; padding: 40px 20px;">
          <p>Nenhuma receita favoritada ainda.</p>
        </div>
      `;
      return;
    }

    displayFavs.forEach(rec => {
      const article = document.createElement('article');
      article.className = 'recipe-card';
      article.dataset.title = rec.title;
      article.dataset.category = rec.category;
      
      article.innerHTML = `
        <div class="recipe-image-wrap">
          <img src="${rec.image}" alt="${rec.title}" class="recipe-img">
          <button class="favorite-toggle-btn active"><i class="fa-solid fa-heart"></i></button>
        </div>
        <div class="recipe-content-area">
          <span class="recipe-category">${rec.category}</span>
          <h4>${rec.title}</h4>
          <div class="recipe-meta-bottom">
            <span><i class="fa-regular fa-clock"></i> ${rec.time} min</span>
            <span class="recipe-difficulty easy">${rec.difficulty}</span>
          </div>
        </div>
      `;
      
      article.querySelector('.favorite-toggle-btn').addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          await api.delete(`/favoritos/excluir/${rec.id}`);
          const freshFavs = await api.get("/favoritos/listar");
          renderFavorites(freshFavs);
          
          userState.stats.saved = freshFavs.length;
          updateStatsUI();
        } catch (err) {
          alert("Erro ao remover favorito: " + err.message);
        }
      });
      
      favsContainer.appendChild(article);
    });
    updateCursorHoverListeners();
  }

  function renderTrending(recipes) {
    const trendingContainer = document.getElementById('trending-container');
    if (!trendingContainer) return;
    trendingContainer.innerHTML = '';
    
    const displayRecipes = recipes.slice(0, 8);
    
    if (displayRecipes.length === 0) {
      trendingContainer.innerHTML = `
        <p style="padding: 20px;">Nenhuma receita pública em alta no momento.</p>
      `;
      return;
    }

    displayRecipes.forEach(rec => {
      const article = document.createElement('article');
      article.className = 'trending-card';
      article.dataset.title = rec.title;
      article.dataset.category = rec.category;
      
      article.innerHTML = `
        <div class="trend-image-wrap">
          <img src="${rec.image}" alt="${rec.title}" class="trend-img">
          <div class="trend-likes-badge"><i class="fa-solid fa-thumbs-up"></i> ${rec.likes || 120}</div>
        </div>
        <div class="trend-content-area">
          <h4>${rec.title}</h4>
          <div class="trend-meta">
            <span><i class="fa-regular fa-clock"></i> ${rec.time}m</span> ·
            <span class="difficulty-text">${rec.difficulty}</span>
          </div>
        </div>
      `;
      trendingContainer.appendChild(article);
    });
    updateCursorHoverListeners();
  }

  function renderRecommendations(recipes) {
    const recContainer = document.getElementById('recommendations-container');
    if (!recContainer) return;
    recContainer.innerHTML = '';
    
    const displayRecipes = recipes.slice().reverse().slice(0, 4);
    
    if (displayRecipes.length === 0) {
      recContainer.innerHTML = `
        <p style="padding: 20px;">Nenhuma recomendação no momento.</p>
      `;
      return;
    }

    displayRecipes.forEach(rec => {
      const article = document.createElement('article');
      article.className = 'recommend-card';
      article.dataset.title = rec.title;
      
      article.innerHTML = `
        <img src="${rec.image}" alt="${rec.title}" class="rec-img">
        <div class="rec-overlay">
          <span class="rec-badge">Sugerido por IA</span>
          <h4>${rec.title}</h4>
          <p>${rec.description || 'Uma ótima opção com base nos seus gostos!'}</p>
        </div>
      `;
      recContainer.appendChild(article);
    });
    updateCursorHoverListeners();
  }

  // Load initial data from Back-End API
  async function loadInitialData() {
    const user = api.getUser();
    if (!user) {
      window.location.href = "../../login/index.html";
      return;
    }

    // Update welcome name & avatar
    const welcomeTitle = document.querySelector('.nav-welcome-text h2');
    if (welcomeTitle) welcomeTitle.innerHTML = `Olá, ${user.nome} <i class="fa-solid fa-utensils" style="color: var(--accent); margin-left: 4px; font-size: 1.1rem;"></i>`;
    
    const navAvatar = document.querySelector('.user-avatar');
    if (navAvatar && user.foto) navAvatar.src = user.foto;

    const navName = document.querySelector('.user-name');
    if (navName) navName.textContent = user.nome;

    try {
      // 1. Get user profile & stats & plan
      const profileData = await api.get("/usuarios/perfil");
      userState.isPro = profileData.plano === "PRO";
      userState.stats = {
        saved: profileData.stats.saved,
        created: profileData.stats.created,
        aiGenerated: profileData.stats.aiGenerated,
        booksCount: profileData.stats.booksCount
      };
      updatePlanUI();
      updateStatsUI();

      // 2. Get ingredients in despensa
      const despensa = await api.get("/ingredientes-disponiveis/listar");
      userState.ingredients = despensa;
      renderIngredients();

      // 3. Get books
      const books = await api.get("/livros/listar");
      userState.books = books.map(b => ({
        id: b.id,
        title: b.titulo,
        count: b._count.receitas,
        emoji: b.emoji || 'fa-solid fa-book',
        tag: b.tag
      }));
      renderBooks();

      // 4. Get favorites
      const favorites = await api.get("/favoritos/listar");
      renderFavorites(favorites);

      // 5. Get trending
      const publicRecipes = await api.get("/receitas/publicas");
      renderTrending(publicRecipes);

      // 6. Get recommendations
      renderRecommendations(publicRecipes);

    } catch (err) {
      console.error("Erro ao carregar dados do backend:", err);
    }
  }

  // ─── RUN COMPONENT INITIALIZATION ───
  loadInitialData();
  renderIngredients();
  renderBooks();
  renderActivities();
  updateStatsUI();
});
