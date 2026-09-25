document.addEventListener('DOMContentLoaded', () => {

  const user = api.getUser();

  if (!user) {

    window.location.href = "../../login/index.html";

    return;

  }

  let userState = {

    isPro: false,

    selectedRecipeToSave: null,

    books: [

      { id: 1, title: 'Café da Manhã', emoji: 'fa-solid fa-mug-hot', count: 12 },

      { id: 2, title: 'Fitness', emoji: 'fa-solid fa-leaf', count: 31 },

      { id: 3, title: 'Sobremesas', emoji: 'fa-solid fa-cake-candles', count: 18 },

      { id: 4, title: 'Favoritas', emoji: 'fa-solid fa-heart', count: 42 },

      { id: 5, title: 'Receitas Rápidas', emoji: 'fa-solid fa-bolt', count: 24 }

    ]

  };

  let pageState = {

    platform: 'other',

    url: '',

    isProcessing: false,

    recipe: null

  };

  const mockMediaDatabase = {

    tiktok: {

      title: "Macarrão Cremoso One-Pot (TikTok)",

      platform: "tiktok",

      platformLabel: "<i class=\"fa-brands fa-tiktok\"></i> TikTok Video",

      recipe: {

        time: 15,

        servings: 2,

        difficulty: "Fácil",

        diet: "vegetariano",

        ingredients: [

          "250g de macarrão espaguete ou penne",

          "1 caixinha de tomate cereja (200g)",

          "1 bloco de queijo feta ou queijo minas curado (150g)",

          "4 colheres de sopa de azeite de oliva extra virgem",

          "2 dentes de alho picadinhos",

          "Folhas de manjericão fresco a gosto",

          "Sal e pimenta do reino a gosto"

        ],

        steps: [

          "Em uma assadeira refratária de vidro, posicione o queijo inteiro exatamente no centro.",

          "Distribua os tomates cereja cortados ao meio e o alho picado ao redor do queijo por todo o prato.",

          "Regue generosamente tudo com o azeite de oliva e tempere com sal e pimenta do reino.",

          "Leve ao forno pré-aquecido a 200°C por 20 minutos (ou até que os tomates estejam macios e o queijo levemente dourado).",

          "Enquanto assa, cozinhe o macarrão em água com sal e escorra.",

          "Amasse o queijo assado e os tomates com um garfo até formar um molho espesso e cremoso na própria assadeira.",

          "Adicione a massa cozida por cima, misture bem até incorporar todo o molho e decore com folhas frescas de manjericão."

        ]

      }

    },

    instagram: {

      title: "Bolo de Cenoura Fit (Instagram)",

      platform: "instagram",

      platformLabel: "<i class=\"fa-brands fa-instagram\"></i> Reels",

      recipe: {

        time: 35,

        servings: 8,

        difficulty: "Fácil",

        diet: "fit",

        ingredients: [

          "3 cenouras médias limpas e picadas",

          "3 ovos frescos inteiros",

          "1/2 xícara de óleo de coco extra virgem (líquido)",

          "2 xícaras de farinha de aveia peneirada",

          "1/2 xícara de adoçante xilitol ou açúcar demerara",

          "1 colher de sopa de fermento químico em pó",

          "100g de chocolate amargo 70% derretido (cobertura)"

        ],

        steps: [

          "Coloque as cenouras picadas, os ovos e o óleo de coco no liquidificador e bata por 3 minutos até obter um creme perfeitamente liso.",

          "Transfira a mistura para uma tigela grande, adicione aos poucos a farinha de aveia e o xilitol e mexa com um batedor manual até incorporar.",

          "Adicione o fermento químico em pó e misture delicadamente com uma espátula fazendo movimentos circulares de baixo para cima.",

          "Despeje a massa em uma fôrma de bolo com furo central untada com óleo de coco.",

          "Asse em forno médio (180°C) pré-aquecido por cerca de 30 a 35 minutos. Faça o teste do palito.",

          "Retire do forno, espere amornar, desenforme e cubra com o chocolate amargo derretido antes de cortar."

        ]

      }

    },

    youtube: {

      title: "Suco Verde Detox Antioxidante",

      platform: "youtube",

      platformLabel: "<i class=\"fa-brands fa-youtube\"></i> Shorts",

      recipe: {

        time: 5,

        servings: 2,

        difficulty: "Fácil",

        diet: "vegano",

        ingredients: [

          "2 folhas de couve-manteiga orgânica sem talo",

          "Suco de 1 limão tahiti espremido",

          "1 maçã gala ou verde com casca e sem sementes",

          "1 colher de café de gengibre fresco ralado",

          "300ml de água de coco natural gelada",

          "Folhas de hortelã frescas e pedras de gelo a gosto"

        ],

        steps: [

          "Lave muito bem as folhas de couve, a maçã e o hortelã sob água corrente.",

          "Corte a maçã em quatro partes e remova o miolo contendo as sementes.",

          "Rasgue grosseiramente as folhas de couve com as mãos e adicione-as no liquidificador.",

          "Adicione a maçã picada, o gengibre ralado, o suco de limão, a hortelã, o gelo e a água de coco gelada.",

          "Bata em potência máxima por 2 minutos até que o suco esteja homogêneo e sem pedaços visíveis.",

          "Sirva imediatamente bem gelado. Evite coar para preservar todas as propriedades e fibras da couve e da casca da maçã."

        ]

      }

    },

    other: {

      title: "Prato Prático Simulado Saboré",

      platform: "other",

      platformLabel: "<i class=\"fa-solid fa-globe\"></i> Video Extraído",

      recipe: {

        time: 20,

        servings: 2,

        difficulty: "Fácil",

        diet: "none",

        ingredients: [

          "Ingredientes selecionados mostrados no vídeo",

          "1 colher de sopa de manteiga ou azeite de oliva",

          "Sal refinado e temperos desidratados a gosto",

          "Alho picado e ervas aromáticas para dar sabor"

        ],

        steps: [

          "Assista aos principais frames de preparo e organize os ingredientes sugeridos.",

          "Refogue a base aromática de cebola e alho na manteiga até dourar.",

          "Adicione os ingredientes principais e cozinhe em fogo brando por cerca de 10 minutos.",

          "Finalize com temperos de sua preferência e sirva morno."

        ]

      }

    }

  };

  const customCursor = document.createElement('div');

  customCursor.className = 'custom-cursor';

  document.body.appendChild(customCursor);

  document.addEventListener('mousemove', (e) => {

    customCursor.style.left = e.clientX + 'px';

    customCursor.style.top = e.clientY + 'px';

  });

  function updateCursorHoverListeners() {

    const interactives = document.querySelectorAll('a, button, input, select, textarea, [role="button"], .mock-link-item-btn, .save-book-option-item, .recipe-ingredient-item');

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

        sidebarUpgradeBtn.innerHTML = '<i class="fa-solid fa-rocket" aria-hidden="true"></i> Virar PRO';

        sidebarUpgradeBtn.style.background = 'var(--secondary)';

        sidebarUpgradeBtn.style.color = 'var(--dark-deep)';

      }

    }

  }

  userState.isPro = false;

  async function loadBooks() {
    const books = await api.get('/livros/listar');
    userState.books = books.map(book => ({
      id: book.id,
      title: book.titulo || book.title,
      emoji: book.emoji || 'fa-solid fa-book',
      count: Number(book._count?.receitas ?? book.count ?? 0)
    }));
    return userState.books;
  }

  function showToast(message, type = 'success') {
    const oldToast = document.querySelector('.sabore-toast');
    if (oldToast) oldToast.remove();
    const toast = document.createElement('div');
    toast.className = `sabore-toast ${type}`;
    toast.setAttribute('role', 'status');
    toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i><span>${message}</span>`;
    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 5000);
  }

  // Esta tela usava alertas nativos; convertemos os avisos restantes em notificações do Sabore.
  window.alert = (message) => showToast(
    String(message),
    /não foi possível|erro/i.test(String(message)) ? 'error' : 'success'
  );

  function renderPersonalNotifications() {
    const list = document.querySelector('.notifications-list');
    const dot = document.querySelector('#notifications-btn .badge-dot');
    if (dot) dot.style.display = 'none';
    if (!list) return;
    list.innerHTML = `
      <div class="notif-item">
        <span class="notif-icon"><i class="fa-solid fa-bell"></i></span>
        <div class="notif-info">
          <p><strong class="personal-notification-name"></strong>, suas interações e receitas publicadas aparecerão aqui.</p>
          <span class="notif-time">Sem novidades por enquanto</span>
        </div>
      </div>
    `;
    const name = list.querySelector('.personal-notification-name');
    if (name) name.textContent = user.nome?.split(' ')[0] || 'Você';
  }

  updatePlanUI();
  renderPersonalNotifications();
  loadBooks().catch(() => {
    userState.books = [];
  });

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

  const notifBtn = document.getElementById('notifications-btn');

  if (notifBtn) {

    notifBtn.addEventListener('click', () => {

      openModal('notifications-modal');

      const badge = notifBtn.querySelector('.badge-dot');

      if (badge) badge.style.display = 'none';

    });

  }

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

  const urlForm = document.getElementById('video-url-form');

  const urlInput = document.getElementById('video-url-input');

  const platformIcon = document.getElementById('platform-icon');

  const playerIdle = document.getElementById('player-idle');

  const playerActive = document.getElementById('player-active');

  const videoThumb = document.getElementById('video-thumbnail-img');

  const videoPlayButton = document.getElementById('video-play-button');

  const videoEmbed = document.getElementById('video-embed');

  const watchOnYoutube = document.getElementById('watch-on-youtube');

  const videoProcessingView = document.getElementById('video-processing-view');

  const scannerLine = document.getElementById('scanner-line');

  const audioWaveContainer = document.getElementById('audio-wave-container');

  function clearEmbeddedVideo() {
    if (videoEmbed) {
      videoEmbed.src = '';
      videoEmbed.classList.add('hidden');
    }
    if (videoThumb) videoThumb.classList.remove('hidden');
    if (videoPlayButton) videoPlayButton.classList.remove('hidden');
    if (watchOnYoutube) {
      watchOnYoutube.removeAttribute('href');
      watchOnYoutube.classList.add('hidden');
    }
    if (videoProcessingView) videoProcessingView.classList.add('hidden');
  }

  function showVideoProcessingState() {
    if (videoThumb) {
      videoThumb.removeAttribute('src');
      videoThumb.classList.add('hidden');
    }
    if (videoPlayButton) videoPlayButton.classList.add('hidden');
    if (videoProcessingView) videoProcessingView.classList.remove('hidden');
  }

  function enableEmbeddedVideo(mediaData) {
    if (!mediaData?.embedUrl || !videoEmbed) return;
    videoEmbed.src = mediaData.embedUrl;
    videoEmbed.classList.remove('hidden');
    if (videoProcessingView) videoProcessingView.classList.add('hidden');
    videoThumb.classList.add('hidden');
    videoPlayButton.classList.add('hidden');
    if (watchOnYoutube && pageState.url) {
      watchOnYoutube.href = pageState.url;
      watchOnYoutube.classList.remove('hidden');
    }
  }

  if (videoPlayButton) {
    videoPlayButton.addEventListener('click', () => {
      if (pageState.url) window.open(pageState.url, '_blank', 'noopener,noreferrer');
    });
  }

  if (urlInput && platformIcon) {

    urlInput.addEventListener('input', () => {

      const urlText = urlInput.value.toLowerCase().trim();

      detectAndSetPlatform(urlText);

    });

  }

  function detectAndSetPlatform(urlText) {
    platformIcon.className = 'platform-icon-indicator';
    if (urlText.includes('youtube.com') || urlText.includes('youtu.be')) {

      platformIcon.classList.add('youtube');

      platformIcon.innerHTML = '<i class="fa-brands fa-youtube"></i>';

      pageState.platform = 'youtube';

    } else {
      platformIcon.innerHTML = '<i class="fa-brands fa-youtube"></i>';
      pageState.platform = 'youtube';
    }
  }

  if (urlForm) {
    urlForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const rawUrl = urlInput.value.trim();
      if (!rawUrl) return;
      if (!/(youtube\.com|youtu\.be)/i.test(rawUrl)) {
        alert('No momento, a importação aceita apenas links do YouTube.');
        return;
      }
      triggerMediaProcessing(pageState.platform, rawUrl);
    });

  }

  async function triggerMediaProcessing(platform, urlStr) {
    pageState.platform = platform;
    pageState.url = urlStr;
    pageState.isProcessing = true;
    playerIdle.classList.add('hidden');

    playerActive.classList.remove('hidden');

    clearEmbeddedVideo();

    showVideoProcessingState();

    scannerLine.classList.remove('hidden');

    audioWaveContainer.classList.remove('hidden');

    document.getElementById('state-idle').classList.add('hidden');

    document.getElementById('state-converting').classList.remove('hidden');

    document.getElementById('state-recipe').classList.add('hidden');

    const logs = document.querySelectorAll('.status-line');

    logs.forEach((log, idx) => {
      log.className = 'status-line';

      log.querySelector('i').className = 'fa-regular fa-circle';

      if (idx === 0) {

        log.className = 'status-line active';

        log.querySelector('i').className = 'fa-solid fa-circle-notch fa-spin';

      }
    });
    const importPromise = api.post("/importacao/importar", { url: urlStr });
    let currentStep = 0;
    const processInterval = setInterval(() => {
      logs[currentStep].className = 'status-line done';

      logs[currentStep].querySelector('i').className = 'fa-solid fa-circle-check';

      currentStep++;

      if (currentStep < logs.length) {

        logs[currentStep].className = 'status-line active';

        logs[currentStep].querySelector('i').className = 'fa-solid fa-circle-notch fa-spin';

      } else {
        clearInterval(processInterval);
        importPromise
          .then((data) => finishMediaProcessing(data))
          .catch((error) => failMediaProcessing(error));
      }
    }, 800);
  }
  function finishMediaProcessing(data) {
    pageState.isProcessing = false;
    scannerLine.classList.add('hidden');
    audioWaveContainer.classList.add('hidden');
    pageState.recipe = data;
    if (data.thumbnail) videoThumb.src = data.thumbnail;
    enableEmbeddedVideo(data);
    document.getElementById('state-converting').classList.add('hidden');
    showRecipeOutput(data);
  }
  function failMediaProcessing(error) {
    pageState.isProcessing = false;
    scannerLine.classList.add('hidden');
    audioWaveContainer.classList.add('hidden');
    document.getElementById('state-converting').classList.add('hidden');
    clearEmbeddedVideo();
    playerActive.classList.add('hidden');
    playerIdle.classList.remove('hidden');
    document.getElementById('state-idle').classList.remove('hidden');
    alert(`Não foi possível importar o vídeo: ${error.message || 'erro desconhecido.'}`);
  }
  function showRecipeOutput(mediaData) {

    const stateRecipe = document.getElementById('state-recipe');

    stateRecipe.classList.remove('hidden');

    const platformBadge = document.getElementById('extracted-platform-badge');

    platformBadge.className = `recipe-ai-badge ${mediaData.platform}`;

    platformBadge.innerHTML = mediaData.platformLabel;

    document.getElementById('result-recipe-title').textContent = mediaData.title;

    document.getElementById('result-recipe-time').textContent = mediaData.recipe.time ? `${mediaData.recipe.time} min` : 'Tempo não informado';

    document.getElementById('result-recipe-servings').textContent = mediaData.recipe.servings
      ? `${mediaData.recipe.servings}${mediaData.recipe.servings > 1 ? ' porções' : ' porção'}`
      : 'Porções não informadas';

    document.getElementById('result-recipe-difficulty').textContent = mediaData.recipe.difficulty;

    const description = document.getElementById('result-recipe-description');
    description.textContent = mediaData.description || '';
    description.classList.toggle('hidden', !mediaData.description);

    const dietTag = document.getElementById('result-recipe-diet-tag');

    if (mediaData.recipe.diet !== 'none') {

      dietTag.classList.remove('hidden');

      dietTag.innerHTML = `<i class="fa-solid fa-leaf"></i> ${mediaData.recipe.diet.toUpperCase()}`;

    } else {

      dietTag.classList.add('hidden');

    }

    const ingList = document.getElementById('result-ingredients-list');

    ingList.innerHTML = '';

    mediaData.recipe.ingredients.forEach((ing, index) => {

      const li = document.createElement('li');
      const label = document.createElement('label');
      const checkboxWrap = document.createElement('span');
      const checkbox = document.createElement('input');
      const checkboxVisual = document.createElement('span');
      const ingredientText = document.createElement('span');

      label.className = 'recipe-ingredient-item';
      checkboxWrap.className = 'ingredient-chk-wrap';
      checkbox.type = 'checkbox';
      checkbox.id = `ing-chk-${index}`;
      checkboxVisual.className = 'chk-box-custom';
      ingredientText.className = 'ing-text-val';
      ingredientText.textContent = ing;
      checkbox.addEventListener('change', () => label.classList.toggle('checked', checkbox.checked));

      checkboxWrap.append(checkbox, checkboxVisual);
      label.append(checkboxWrap, ingredientText);
      li.appendChild(label);

      ingList.appendChild(li);

    });

    const stepsList = document.getElementById('result-steps-list');

    stepsList.innerHTML = '';

    mediaData.recipe.steps.forEach(step => {

      const li = document.createElement('li');

      li.textContent = step;

      stepsList.appendChild(li);

    });

    updateCursorHoverListeners();

  }

  const btnClearRecipe = document.getElementById('btn-clear-recipe');

  if (btnClearRecipe) {

    btnClearRecipe.addEventListener('click', () => {

      resetImportVideoPage();

    });

  }

  function resetImportVideoPage() {

    urlInput.value = '';

    detectAndSetPlatform('');

    playerActive.classList.add('hidden');

    playerIdle.classList.remove('hidden');

    videoThumb.src = '';

    clearEmbeddedVideo();

    pageState.recipe = null;

    document.getElementById('state-idle').classList.remove('hidden');

    document.getElementById('state-converting').classList.add('hidden');

    document.getElementById('state-recipe').classList.add('hidden');

  }

  const saveRecipeBtn = document.getElementById('save-recipe-btn');

  const saveOptionsContainer = document.getElementById('save-book-options-container');

  if (saveRecipeBtn) {

    saveRecipeBtn.addEventListener('click', async () => {

      if (!pageState.recipe) return;

      try {
        await loadBooks();
      } catch (error) {
        showToast('Não foi possível carregar seus livros. Verifique sua conexão e tente novamente.', 'error');
        return;
      }

      userState.selectedRecipeToSave = {
        title: pageState.recipe.title,
        description: pageState.recipe.description || `Receita importada de vídeo do ${pageState.recipe.platform || 'YouTube'}.`,
        time: pageState.recipe.recipe.time,
        difficulty: pageState.recipe.recipe.difficulty,
        ingredients: pageState.recipe.recipe.ingredients || [],
        steps: pageState.recipe.recipe.steps || [],
        category: pageState.recipe.recipe.diet && pageState.recipe.recipe.diet !== 'none'
          ? pageState.recipe.recipe.diet
          : 'Importada de vídeo'
      };
      renderBookSaveOptions();

      openModal('save-to-book-modal');

    });

  }

  function renderBookSaveOptions() {

    if (!saveOptionsContainer) return;

    saveOptionsContainer.innerHTML = '';

    if (userState.books.length === 0) {
      saveOptionsContainer.innerHTML = `
        <div class="save-books-empty">
          <i class="fa-solid fa-book-open"></i>
          <p>Você ainda não possui livros. Crie um em <strong>Meus Livros</strong> para salvar esta receita.</p>
        </div>
      `;
      return;
    }

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

      item.querySelector('.btn-select-save-book').addEventListener('click', async () => {
        try {
          const selected = userState.selectedRecipeToSave;
          await api.post("/receitas/cadastrar", {
            titulo: selected.title,
            descricao: selected.description,
            tempoPreparo: Number(selected.time) || 30,
            modoPreparo: selected.steps.join("\n"),
            dificuldade: selected.difficulty,
            criadaPorIA: true,
            ingredientes: selected.ingredients,
            categorias: [selected.category],
            livroId: book.id,
            publica: false
          });
          await loadBooks();
          closeModal('save-to-book-modal');
          showToast(`Receita "${selected.title}" salva no livro "${book.title}".`);
        } catch (error) {
          alert(`Não foi possível salvar a receita: ${error.message || 'erro desconhecido.'}`);
        }
      });
      saveOptionsContainer.appendChild(item);

    });

    updateCursorHoverListeners();

  }

});
