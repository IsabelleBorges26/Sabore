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
      navbarPlanTag.textContent = 'PRO';
      navbarPlanTag.className = 'user-plan-tag pro';
      if (upgradeWidget) upgradeWidget.style.display = 'none';
      if (sidebarUpgradeBtn) {
        sidebarUpgradeBtn.textContent = 'Menu PRO';
        sidebarUpgradeBtn.style.background = 'var(--accent-light)';
        sidebarUpgradeBtn.style.color = 'var(--accent)';
      }
    } else {
      navbarPlanTag.textContent = 'Gratuito';
      navbarPlanTag.className = 'user-plan-tag free';
      if (upgradeWidget) upgradeWidget.style.display = 'block';
      if (sidebarUpgradeBtn) {
        sidebarUpgradeBtn.textContent = '🚀 Virar PRO';
        sidebarUpgradeBtn.style.background = 'var(--secondary)';
        sidebarUpgradeBtn.style.color = 'var(--dark-deep)';
      }
    }
  }
  // Let's initialize user as FREE so they can explore the upgrade flow!
  userState.isPro = false;
  updatePlanUI();

  // ─── NAVBAR SCROLL BLUR ───
  const mainContent = document.querySelector('.main-content');
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
        const category = card.dataset.category.toLowerCase();
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
        const category = card.dataset.category.toLowerCase();
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
    if (btn) btn.addEventListener('click', () => openModal('photo-modal'));
  });

  const qaImportBtn = document.getElementById('qa-import-video');
  const shortcutVideoBtn = document.getElementById('shortcut-video-btn');
  const actionVideoTriggers = [qaImportBtn, shortcutVideoBtn];
  actionVideoTriggers.forEach(btn => {
    if (btn) btn.addEventListener('click', () => openModal('video-modal'));
  });

  const notifBtn = document.getElementById('notifications-btn');
  if (notifBtn) notifBtn.addEventListener('click', () => {
    openModal('notifications-modal');
    // Clear badge
    const badge = notifBtn.querySelector('.badge-dot');
    if (badge) badge.style.display = 'none';
  });

  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) settingsBtn.addEventListener('click', () => alert('Configurações do sistema simuladas com sucesso!'));

  // ─── UPGRADE CELEBRATION PROCESS ───
  const upgradeBtnCompact = document.getElementById('sidebar-upgrade-btn');
  const upgradeBtnWidget = document.getElementById('dashboard-upgrade-action-btn');
  const proMenuLink = document.querySelector('[data-target="pro"]');

  const upgradeTriggers = [upgradeBtnCompact, upgradeBtnWidget, proMenuLink];
  upgradeTriggers.forEach(trigger => {
    if (trigger) {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        userState.isPro = true;
        updatePlanUI();
        openModal('celebration-modal');
        triggerCelebrationEffects();
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

  function addIngredient(name) {
    name = name.trim();
    if (!name) return;
    // Capitalize first letter
    name = name.charAt(0).toUpperCase() + name.slice(1);
    if (!userState.ingredients.includes(name)) {
      userState.ingredients.push(name);
      renderIngredients();
    }
  }

  function removeIngredient(name) {
    userState.ingredients = userState.ingredients.filter(ing => ing !== name);
    renderIngredients();
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
    newBookForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('book-title').value;
      const emoji = document.getElementById('book-emoji-select').value;
      const visibility = document.getElementById('book-visibility').value;

      const newId = userState.books.length + 1;
      const newBook = { id: newId, title, count: 0, emoji, tag: visibility };
      
      userState.books.push(newBook);
      userState.stats.booksCount = userState.books.length;
      updateStatsUI();
      
      // Render
      renderBooks();
      closeModal('add-book-modal');
      newBookForm.reset();
      
      addActivity(`Criou o livro: <strong>${title}</strong>`, 'agora');
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
    analyzePhotoActionBtn.addEventListener('click', () => {
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
      
      // Trigger AI loader simulator with predefined Photo output!
      simulateAiGeneration('Salada César Crocante', ['Frango Grelhado', 'Alface Americana', 'Croutons', 'Molho César Especial', 'Parmesão Ralado'], [
        'Lave bem as folhas de alface e coloque em um bowl.',
        'Grelhe o peito de frango cortado em tiras e tempere com alho e sal.',
        'Misture o molho césar especial com alface até incorporar.',
        'Adicione o frango por cima, junte os croutons crocantes e rale queijo parmesão para finalizar.'
      ], 15, 'Fácil', 'fit');
    });
  }

  // ─── VIDEO IMPORT SUBMIT ───
  const videoForm = document.getElementById('video-import-form');
  if (videoForm) {
    videoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const url = document.getElementById('video-url').value;
      closeModal('video-modal');
      videoForm.reset();

      // Trigger AI loader simulator with predefined Video recipe!
      simulateAiGeneration('Macarrão Cremoso One-Pot (Tiktok)', ['Macarrão Espaguete', 'Tomate Cereja', 'Queijo Feta', 'Azeite de Oliva', 'Manjericão Fresco'], [
        'Em uma assadeira de vidro, coloque o queijo feta no centro e espalhe os tomates cereja ao redor.',
        'Regue tudo generosamente com azeite de oliva e tempere com sal e pimenta.',
        'Asse em forno médio (200°C) por 25 minutos até o queijo derreter e tomates dourarem.',
        'Cozinhe o espaguete em água com sal.',
        'Amasse o queijo assado com os tomates para formar um creme espesso, misture a massa cozida e finalize com folhas de manjericão.'
      ], 30, 'Fácil', 'vegetariano');
    });
  }


  // ─── AI RECIPE GENERATOR SIMULATOR (MOCK ENGINE) ───
  const aiForm = document.getElementById('ai-recipe-form');
  const aiModal = document.getElementById('ai-generator-modal');
  const loadingContainer = document.getElementById('ai-loading-container');
  const loadingStepText = document.getElementById('ai-loading-step');
  const resultContainer = document.getElementById('ai-result-container');
  const saveRecipeBtn = document.getElementById('save-recipe-btn');
  const regenerateRecipeBtn = document.getElementById('regenerate-recipe-btn');

  // Simulated Recipe Database for Keyword Matching
  const mockRecipesDatabase = [
    {
      keywords: ['frango', 'brócolis'],
      title: 'Frango com Brócolis ao Limão e Alho',
      ingredients: ['Peito de Frango (500g, em cubos)', 'Brócolis (1 maço, picado)', 'Limão Siciliano (suco e raspas)', 'Dentes de Alho (3 unidades)', 'Azeite de Oliva', 'Sal e Pimenta'],
      steps: [
        'Aqueça o azeite em uma frigideira grande e doure os cubos de frango por 8 minutos até cozinharem por completo.',
        'Retire o frango e, na mesma frigideira, adicione o alho picado e o brócolis. Refogue por 5 minutos com um pingo de água.',
        'Volte o frango para a panela, adicione o suco do limão siciliano, as raspas e ajuste o sal e pimenta.',
        'Mexa bem por 2 minutos para incorporar todos os sabores e sirva imediatamente.'
      ],
      time: 20,
      difficulty: 'Fácil',
      diet: 'fit'
    },
    {
      keywords: ['ovo', 'queijo'],
      title: 'Omelete de Queijo Cremosa com Ervas',
      ingredients: ['Ovos Frescos (3 unidades)', 'Queijo Parmesão Ralado (50g)', 'Manteiga (1 colher de sopa)', 'Cebolinha picada', 'Sal e Pimenta'],
      steps: [
        'Bata os ovos em uma tigela com garfo até espumar levemente. Tempere com sal e pimenta.',
        'Aqueça a frigideira antiaderente em fogo médio e derreta a manteiga.',
        'Adicione os ovos batidos e mexa as bordas em direção ao centro para criar camadas cremosas.',
        'Quando estiver quase firme mas ainda úmido no centro, espalhe o queijo e a cebolinha picada.',
        'Dobre a omelete ao meio e deslize suavemente para o prato.'
      ],
      time: 10,
      difficulty: 'Fácil',
      diet: 'none'
    },
    {
      keywords: ['chocolate'],
      title: 'Brownie de Caneca IA',
      ingredients: ['Chocolate em Pó (2 colheres de sopa)', 'Farinha de Trigo (2 colheres de sopa)', 'Açúcar (1.5 colheres de sopa)', 'Leite (2 colheres de sopa)', 'Manteiga Derretida (1 colher de sopa)'],
      steps: [
        'Em uma caneca apta para micro-ondas, junte todos os ingredientes secos e misture bem.',
        'Adicione o leite e a manteiga derretida. Mexa até obter uma massa homogênea.',
        'Leve ao micro-ondas em potência alta por cerca de 60 a 70 segundos.',
        'Deixe esfriar por 2 minutos (ele termina de assar fora do micro-ondas) e delicie-se!'
      ],
      time: 5,
      difficulty: 'Fácil',
      diet: 'vegetarian'
    },
    {
      keywords: ['tomate', 'queijo', 'ovo'],
      title: 'Shakshuka de Queijo e Tomates',
      ingredients: ['Ovos (3 unidades)', 'Tomates Pelados (1 lata)', 'Cebola picada (1/2 unidade)', 'Queijo Parmesão ou Feta (80g)', 'Páprica defumada', 'Sal e Azeite'],
      steps: [
        'Refogue a cebola picada no azeite até murchar. Adicione a páprica defumada e misture.',
        'Despeje os tomates pelados na frigideira e amasse com uma colher. Deixe reduzir em fogo baixo por 8 minutos.',
        'Faça três pequenas cavidades no molho e quebre um ovo dentro de cada uma.',
        'Salpique o queijo por cima de todo o prato, tampe a panela e cozinhe por 5 minutos até os ovos firmarem no ponto desejado.',
        'Finalize com salsinha fresca e coma direto da panela com pão italiano.'
      ],
      time: 25,
      difficulty: 'Fácil',
      diet: 'vegetariano'
    }
  ];

  let currentGeneratedRecipe = null; // store current recipe details for saving

  if (aiForm) {
    aiForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const ingredientsInput = document.getElementById('ai-ingredients').value;
      const maxTime = parseInt(document.getElementById('ai-time').value);
      const diet = document.getElementById('ai-diet').value;

      // Select recipe from mock DB
      const searchKeywords = ingredientsInput.toLowerCase().split(',').map(s => s.trim());
      
      let matchedRecipe = null;
      // Search database for matching keywords
      for (const item of mockRecipesDatabase) {
        const matches = item.keywords.filter(keyword => searchKeywords.some(search => search.includes(keyword)));
        if (matches.length > 0) {
          matchedRecipe = item;
          break;
        }
      }

      // Default fallback recipe
      if (!matchedRecipe) {
        matchedRecipe = {
          title: `Mix Saudável de ${searchKeywords[0] || 'Ingredientes'}`,
          ingredients: searchKeywords.map(k => `${k.charAt(0).toUpperCase() + k.slice(1)} (a gosto)`).concat(['Azeite de oliva', 'Sal e ervas a gosto']),
          steps: [
            `Aqueça uma frigideira com um fio de azeite e doure os ingredientes principais preparados.`,
            `Adicione temperos secos, ervas finas e mexa bem.`,
            `Tampe para abafar por cerca de 10 minutos em fogo brando.`,
            `Sirva quente decorado com folhas frescas.`
          ],
          time: maxTime > 15 ? 15 : maxTime,
          difficulty: 'Fácil',
          diet: diet
        };
      }

      // Match time logic limits
      if (matchedRecipe.time > maxTime) {
        matchedRecipe.time = maxTime;
      }
      
      // Override diet if user selected something else
      if (diet !== 'none') {
        matchedRecipe.diet = diet;
      }

      simulateAiGeneration(matchedRecipe.title, matchedRecipe.ingredients, matchedRecipe.steps, matchedRecipe.time, matchedRecipe.difficulty, matchedRecipe.diet);
    });
  }

  function simulateAiGeneration(title, ingredients, steps, time, difficulty, diet) {
    currentGeneratedRecipe = { title, ingredients, steps, time, difficulty, diet };
    
    // Reset Views
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
        showRecipeResult(title, ingredients, steps, time, difficulty, diet);
      }
    }, 900);
  }

  function showRecipeResult(title, ingredients, steps, time, difficulty, diet) {
    loadingContainer.classList.add('hidden');
    resultContainer.classList.remove('hidden');

    // Populate titles
    document.getElementById('result-recipe-title').textContent = title;
    document.getElementById('result-recipe-time').textContent = time + ' min';
    document.getElementById('result-recipe-difficulty').textContent = difficulty;
    
    const dietTag = document.getElementById('result-recipe-diet-tag');
    if (diet !== 'none') {
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
    saveRecipeBtn.addEventListener('click', () => {
      if (!currentGeneratedRecipe) return;

      // Add to favorites container
      const favsContainer = document.getElementById('favorites-container');
      if (favsContainer) {
        // Create new element
        const article = document.createElement('article');
        article.className = 'recipe-card';
        article.dataset.title = currentGeneratedRecipe.title;
        article.dataset.category = currentGeneratedRecipe.diet !== 'none' ? currentGeneratedRecipe.diet : 'Almoço';

        // Select randomly a placeholder visual food image
        const foodImages = [
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=400&q=80'
        ];
        const randomImg = foodImages[Math.floor(Math.random() * foodImages.length)];

        article.innerHTML = `
          <div class="recipe-image-wrap">
            <img src="${randomImg}" alt="${currentGeneratedRecipe.title}" class="recipe-img">
            <button class="favorite-toggle-btn active"><i class="fa-solid fa-heart"></i></button>
          </div>
          <div class="recipe-content-area">
            <span class="recipe-category">${currentGeneratedRecipe.diet !== 'none' ? currentGeneratedRecipe.diet : 'Chef IA'}</span>
            <h4>${currentGeneratedRecipe.title}</h4>
            <div class="recipe-meta-bottom">
              <span><i class="fa-regular fa-clock"></i> ${currentGeneratedRecipe.time} min</span>
              <span class="recipe-difficulty easy">${currentGeneratedRecipe.difficulty}</span>
            </div>
          </div>
        `;

        // Add toggle behavior
        article.querySelector('.favorite-toggle-btn').addEventListener('click', function() {
          this.classList.toggle('active');
        });

        // Insert at beginning of grid
        if (favsContainer.children.length >= 6) {
          favsContainer.removeChild(favsContainer.lastElementChild); // keep max 6
        }
        favsContainer.insertBefore(article, favsContainer.firstChild);
      }

      // Update States
      userState.stats.saved += 1;
      userState.stats.aiGenerated += 1;
      updateStatsUI();

      // Add to timeline
      addActivity(`Salvou: <strong>${currentGeneratedRecipe.title}</strong>`, 'agora');

      closeModal('ai-generator-modal');
      alert(`Receita "${currentGeneratedRecipe.title}" salva com sucesso em suas favoritas!`);
    });
  }

  // Bind favorite toggle on existing cards
  const favToggleBtns = document.querySelectorAll('.favorite-toggle-btn');
  favToggleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isActive = btn.classList.toggle('active');
      if (isActive) {
        userState.stats.saved += 1;
      } else {
        userState.stats.saved = Math.max(0, userState.stats.saved - 1);
      }
      updateStatsUI();
    });
  });

  // ─── INITIAL RENDERING CALLS ───
  renderIngredients();
  renderBooks();
  renderActivities();
  updateStatsUI();
});
