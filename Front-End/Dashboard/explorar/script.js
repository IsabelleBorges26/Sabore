document.addEventListener('DOMContentLoaded', () => {
  let userState = {
    isPro: false,
    selectedExploreRecipe: null,
    books: [],
    favorites: [],
    chefs: [],
    followingIds: new Set(),
    categories: [
      { id: 'all', name: 'Todas', emoji: 'fa-solid fa-utensils' },
      { id: 'massa', name: 'Massas', emoji: 'fa-solid fa-pizza-slice' },
      { id: 'fit', name: 'Fitness', emoji: 'fa-solid fa-leaf' },
      { id: 'doce', name: 'Sobremesas', emoji: 'fa-solid fa-cake-candles' },
      { id: 'matinal', name: 'Café da Manhã', emoji: 'fa-solid fa-mug-hot' },
      { id: 'bebida', name: 'Bebidas', emoji: 'fa-solid fa-martini-glass-citrus' },
      { id: 'lanche', name: 'Lanches', emoji: 'fa-solid fa-burger' }
    ],
    recipes: [],
    trendingTagsData: []
  };
  let activeCategoryFilter = 'all';
  let activeFeedMode = 'for-you';
  let activeHashtagFilter = null;
  let currentWeeklyChallengeData = null;
  let openCommunityComposer = null;
  let challengePublicationContext = null;
  let feedPageLimit = 12;
  let feedCurrentCount = 12;
  let isInfiniteScrollActive = false;
  let latestFeedLoad = 0;
  let seenRecipeIds = new Set();
  let refreshedRecipeIds = new Set();
  const isOwnRecipe = (recipe) => {
    const userId = api.getUser()?.id;
    const authorId = recipe?.authorId ?? recipe?.usuarioId;
    return userId != null && authorId != null && String(authorId) === String(userId);
  };

  const showAuthorAvatar = (element, recipe) => {
    if (!element) return;
    const initial = String(recipe.author || 'S').trim().charAt(0).toUpperCase() || 'S';
    element.textContent = initial;
    if (recipe.authorAvatar) {
      const image = document.createElement('img');
      image.src = recipe.authorAvatar;
      image.alt = '';
      image.addEventListener('error', () => { element.textContent = initial; }, { once: true });
      element.replaceChildren(image);
    }
  };

  const WEEKLY_CHALLENGES = [
    {
      id: "inverno",
      title: "Receitas de Inverno & Conforto",
      hashtag: "#DesafioInverno",
      badge: "Chef Invernal",
      description: "Crie um prato quente, sopa encorpada ou bebida cremosa para aquecer a comunidade Saboré!"
    },
    {
      id: "massas",
      title: "Festival de Massas Artesanais",
      hashtag: "#DesafioMassas",
      badge: "Mestre das Massas",
      description: "Prepare uma massa fresca caseira ou um molho artesanal autêntico da nonna."
    },
    {
      id: "fit",
      title: "Marmita Fit & Alta Performance",
      hashtag: "#DesafioFit",
      badge: "Chef Saudável",
      description: "Compartilhe uma refeição equilibrada, nutritiva e prática para o dia a dia fitness."
    },
    {
      id: "doces",
      title: "Doces & Sobremesas de Sonho",
      hashtag: "#DesafioDoces",
      badge: "Confeiteiro Saboré",
      description: "Surpreenda a comunidade com tortas, bolos, mousses ou doces artesanais irresistíveis."
    },
    {
      id: "oriental",
      title: "Uma Viagem à Cozinha Oriental",
      hashtag: "#DesafioOriental",
      badge: "Chef Oriental",
      description: "Traga o melhor da culinária asiática: sushis, woks, ramens ou yakisobas aromáticos."
    },
    {
      id: "brunch",
      title: "Café da Manhã de Cinema",
      hashtag: "#DesafioBrunch",
      badge: "Mestre do Brunch",
      description: "Pães quentinhos, ovos especiais, panquecas ou tigelas de açaí para começar o dia no topo."
    },
    {
      id: "burger",
      title: "Hambúrguer Gourmet Caseiro",
      hashtag: "#DesafioBurger",
      badge: "Burger Master",
      description: "Monte um burger autoral: combine seu blend especial, molhos caseiros e queijos derretidos."
    },
    {
      id: "sustentavel",
      title: "Cozinha Sustentável & Zero Desperdício",
      hashtag: "#DesafioSustentavel",
      badge: "Chef Consciente",
      description: "Use talos, cascas e sobras nobres para criar pratos deliciosos e sustentáveis."
    },
    {
      id: "risotos",
      title: "Mestres do Risoto Cremoso",
      hashtag: "#DesafioRisoto",
      badge: "Rei do Risoto",
      description: "Acerte no ponto perfeito da textura e emulsão de um risoto sofisticado."
    },
    {
      id: "petiscos",
      title: "Comida de Boteco & Petiscos",
      hashtag: "#DesafioPetiscos",
      badge: "Chef Boêmio",
      description: "Pastéis, croquetes, bolinhos de arroz e petiscos crocantes para celebrar com amigos."
    },
    {
      id: "brasil",
      title: "Sabores Regionais do Brasil",
      hashtag: "#DesafioBrasil",
      badge: "Chef Raiz",
      description: "Celebre nossa culinária: moquecas, baião de dois, feijão tropeiro e temperos típicos."
    },
    {
      id: "rapido",
      title: "Prato Incrível em 15 Minutos",
      hashtag: "#Desafio15Min",
      badge: "Chef Relâmpago",
      description: "Mostre que agilidade e alto sabor andam juntos em receitas rápidas do dia a dia."
    }
  ];

  function getWeeklyChallenge() {
    const now = new Date();
    const target = new Date(now.valueOf());
    const dayNr = (now.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    const weekNumber = 1 + Math.ceil((firstThursday - target) / 604800000);
    const year = now.getFullYear();
    const dayOfWeek = now.getDay();
    const daysRemaining = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    const weekSeed = year * 53 + weekNumber;
    const index = Math.abs(weekSeed) % WEEKLY_CHALLENGES.length;
    const challenge = WEEKLY_CHALLENGES[index];
    return {
      ...challenge,
      weekNumber,
      year,
      daysRemaining,
      timeRemainingText: daysRemaining === 0 ? "Termina hoje às 23:59!" : `Termina em ${daysRemaining} dia${daysRemaining > 1 ? "s" : ""}`
    };
  }

  function normalizeHashtag(str) {
    if (!str) return '';
    const clean = String(str).trim().toLowerCase().replace(/^#+/, '').replace(/\s+/g, '');
    return clean ? `#${clean}` : '';
  }

  function extractRecipeTags(recipe) {
    const tagsSet = new Set();
    (Array.isArray(recipe.hashtags) ? recipe.hashtags : []).forEach(value => {
      const tag = normalizeHashtag(typeof value === 'string' ? value : value?.nome);
      if (tag) tagsSet.add(tag);
    });
    const text = `${recipe.title || ''} ${recipe.description || ''}`;
    const matches = text.match(/#([a-zA-Z0-9_\u00C0-\u017F]+)/g);
    if (matches) {
      matches.forEach(m => {
        const tag = normalizeHashtag(m);
        if (tag) tagsSet.add(tag);
      });
    }
    return Array.from(tagsSet);
  }

  const customCursor = document.createElement('div');
  customCursor.className = 'custom-cursor';
  document.body.appendChild(customCursor);
  document.addEventListener('mousemove', (e) => {
    customCursor.style.left = e.clientX + 'px';
    customCursor.style.top = e.clientY + 'px';
  });
  function updateCursorHoverListeners() {
    const interactives = document.querySelectorAll('a, button, input, select, textarea, [role="button"], option, .category-tile, .explore-recipe-card, .tag-item-chip, .chef-card-item');
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
    if (userState.isPro) {
      if (navbarPlanTag) {
        navbarPlanTag.textContent = 'PRO';
        navbarPlanTag.className = 'user-plan-tag pro';
      }
    } else {
      if (navbarPlanTag) {
        navbarPlanTag.textContent = 'Gratuito';
        navbarPlanTag.className = 'user-plan-tag free';
      }
    }
  }
  userState.isPro = false;
  updatePlanUI();

  function setupCommunityComposer() {
    const heroContent = document.querySelector('.explore-hero-content');
    if (!heroContent || document.getElementById('create-post-btn')) return;
    const button = document.createElement('button');
    button.id = 'create-post-btn';
    button.className = 'btn-create-post';
    button.innerHTML = '<i class="fa-solid fa-square-plus"></i> Criar publicação';
    heroContent.appendChild(button);
    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal-overlay" id="create-post-modal">
        <div class="modal-card community-composer-card">
          <button class="modal-close-btn" id="close-create-post-modal"><i class="fa-solid fa-xmark"></i></button>
          <div class="modal-header-simple"><h3><i class="fa-solid fa-square-plus"></i> Nova publicação</h3><p>Compartilhe uma receita real com a comunidade.</p></div>
          <form id="create-post-form" class="community-composer-form">
            <div class="publish-from-book">
              <div><strong>Já tem uma receita em um livro?</strong><span>Publique-a sem precisar preencher tudo outra vez.</span></div>
              <select id="post-existing-recipe"><option value="">Selecione uma receita salva</option></select>
              <button type="button" id="publish-existing-recipe-btn"><i class="fa-solid fa-book-open"></i> Publicar receita do livro</button>
            </div>
            <label>Título da receita<input id="post-title" required maxlength="100" placeholder="Ex.: Bolo de chocolate da vovó"></label>
            <label>Descrição<textarea id="post-description" required maxlength="400" placeholder="Conte o que torna esta receita especial."></textarea></label>
            <div class="composer-row"><label>Tempo (min)<input id="post-time" type="number" min="1" value="30" required></label><label>Dificuldade<select id="post-difficulty"><option>Fácil</option><option>Médio</option><option>Difícil</option></select></label><label>Categoria<input id="post-category" required placeholder="Sobremesas"></label></div>
            <label>Imagem da receita (opcional)<input id="post-image" type="url" placeholder="https://..."></label>
            <label>Hashtags<input id="post-hashtags" maxlength="150" placeholder="#bolo #sobremesa #receitafacil"></label>
            <label>Ingredientes — um por linha<textarea id="post-ingredients" required placeholder="2 xícaras de farinha&#10;1 xícara de leite"></textarea></label>
            <label>Modo de preparo — um passo por linha<textarea id="post-steps" required placeholder="Misture os ingredientes.&#10;Asse até dourar."></textarea></label>
            <button type="submit" class="btn-primary-modal-full"><i class="fa-solid fa-paper-plane"></i> Publicar na comunidade</button>
          </form>
        </div>
      </div>
    `);
    const loadBookRecipes = async () => {
      const select = document.getElementById('post-existing-recipe');
      const recipes = await api.get('/receitas/listar');
      select.innerHTML = '<option value="">Selecione uma receita salva</option>';
      recipes.filter(recipe => !recipe.communityPublished).forEach(recipe => {
        const option = document.createElement('option');
        option.value = recipe.id;
        option.textContent = `${recipe.title} · ${recipe.category || 'Geral'}`;
        select.appendChild(option);
      });
    };
    openCommunityComposer = async (challenge = null) => {
      await loadBookRecipes();
      challengePublicationContext = challenge;
      const hashtagsInput = document.getElementById('post-hashtags');
      if (challenge?.hashtag && hashtagsInput && !hashtagsInput.value.includes(challenge.hashtag)) {
        hashtagsInput.value = `${hashtagsInput.value.trim()} ${challenge.hashtag}`.trim();
      }
      openModal('create-post-modal');
    };
    button.addEventListener('click', async () => {
      try {
        await openCommunityComposer();
      } catch (error) {
        alert(`Não foi possível carregar suas receitas salvas: ${error.message}`);
      }
    });
    document.getElementById('close-create-post-modal').addEventListener('click', () => closeModal('create-post-modal'));
    document.getElementById('publish-existing-recipe-btn').addEventListener('click', async () => {
      const recipeId = Number(document.getElementById('post-existing-recipe').value);
      if (!recipeId) return alert('Selecione uma receita de um livro para publicar.');
      try {
        const resUpdate = await api.put(`/receitas/atualizar/${recipeId}`, { publica: true });
        closeModal('create-post-modal');
        if (resUpdate?.desafioInfo?.concluiuDesafio) {
          if (window.SaboreNotify) window.SaboreNotify('🎉 +30 pontos conquistados no Ranking Mensal! Desafio concluído com sucesso.', 'success');
          else alert('🎉 +30 pontos conquistados no Ranking Mensal! Desafio concluído com sucesso.');
        } else {
          alert('Receita do livro publicada na comunidade.');
        }
        await refreshExploreFeed(false);
        await loadDesafioOfTheWeek();
      } catch (error) {
        alert(`Não foi possível publicar a receita do livro: ${error.message}`);
      }
    });
    document.getElementById('create-post-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const value = (id) => document.getElementById(id).value.trim();
      const ingredients = value('post-ingredients').split('\n').map(item => item.trim()).filter(Boolean);
      const steps = value('post-steps').split('\n').map(item => item.trim()).filter(Boolean);
      const hashtags = value('post-hashtags').split(/\s+/).map(item => item.replace(/^#/, '').trim()).filter(Boolean);
      try {
        const createdRecipe = await api.post('/receitas/cadastrar', {
          titulo: value('post-title'), descricao: value('post-description'), tempoPreparo: Number(value('post-time')),
          dificuldade: value('post-difficulty'), categorias: [value('post-category')], hashtags, imagem: value('post-image') || null,
          ingredientes: ingredients, modoPreparo: steps.join('\n'), criadaPorIA: false, publica: true
        });
        closeModal('create-post-modal');
        challengePublicationContext = null;
        if (createdRecipe?.desafioInfo?.concluiuDesafio) {
          if (window.SaboreNotify) window.SaboreNotify('🎉 +30 pontos conquistados no Ranking Mensal! Desafio concluído com sucesso.', 'success');
          else alert('🎉 +30 pontos conquistados no Ranking Mensal! Desafio concluído com sucesso.');
        } else {
          alert('Publicação criada. Ela já está visível para a comunidade.');
        }
        event.target.reset();
        await refreshExploreFeed(false);
        await loadDesafioOfTheWeek();
      } catch (error) {
        alert(`Não foi possível publicar: ${error.message}`);
      }
    });
  }
  setupCommunityComposer();
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
  const globalSearchInput = document.getElementById('global-search');
  if (globalSearchInput) {
    globalSearchInput.addEventListener('input', () => {
      renderRecipes();
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
    { btn: 'close-details-modal', modal: 'recipe-details-modal' },
    { btn: 'recipe-detail-close-btn', modal: 'recipe-details-modal' },
    { btn: 'close-save-modal', modal: 'save-to-book-modal' },
    { btn: 'close-notif-modal', modal: 'notifications-modal' },
    { btn: 'close-event-guide-modal', modal: 'event-guide-modal' }
  ];
  closeTriggers.forEach(trigger => {
    const btn = document.getElementById(trigger.btn);
    if (btn) {
      btn.addEventListener('click', () => closeModal(trigger.modal));
    }
  });
  const eventGuideModal = document.getElementById('event-guide-modal');
  const eventGuideOpen = document.getElementById('btn-open-event-guide');
  const eventGuideClose = document.getElementById('close-event-guide-modal');
  if (eventGuideOpen && eventGuideModal) {
    eventGuideOpen.addEventListener('click', () => {
      eventGuideModal.setAttribute('aria-hidden', 'false');
      openModal('event-guide-modal');
      eventGuideClose?.focus();
    });
    eventGuideModal.addEventListener('click', (event) => {
      if (event.target === eventGuideModal) eventGuideModal.setAttribute('aria-hidden', 'true');
    });
    eventGuideClose?.addEventListener('click', () => eventGuideModal.setAttribute('aria-hidden', 'true'));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && eventGuideModal.classList.contains('open')) {
        closeModal('event-guide-modal');
        eventGuideModal.setAttribute('aria-hidden', 'true');
        eventGuideOpen.focus();
      }
    });
  }
  const notifBtn = document.getElementById('notifications-btn');
  if (notifBtn) {
    const initialBadge = notifBtn.querySelector('.badge-dot');
    if (initialBadge) initialBadge.style.display = 'none';
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
  const proMenuLink = document.querySelector('[data-target="pro"]');
  if (proMenuLink) {
    proMenuLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '../ranking/index.html';
    });
  }
  const categoriesContainer = document.getElementById('categories-carousel-list');
  function renderCategories() {
    if (!categoriesContainer) return;
    categoriesContainer.innerHTML = '';
    userState.categories.forEach(cat => {
      const tile = document.createElement('button');
      tile.className = 'category-tile';
      if (activeCategoryFilter === cat.id) {
        tile.style.borderColor = 'var(--accent)';
        tile.style.background = 'var(--accent-light)';
      }
      tile.innerHTML = `
        <i class="${cat.emoji}"></i>
        <span>${cat.name}</span>
      `;
      tile.addEventListener('click', () => {
        if (activeCategoryFilter === cat.id) {
          activeCategoryFilter = 'all';
        } else {
          activeCategoryFilter = cat.id;
        }
        renderCategories();
        renderRecipes();
      });
      categoriesContainer.appendChild(tile);
    });
    updateCursorHoverListeners();
  }
  const tabBtns = document.querySelectorAll('[data-feed-mode]');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFeedMode = btn.dataset.feedMode || 'for-you';
      renderRecipes();
    });
  });
  const recipesContainer = document.getElementById('explore-recipes-container');
  function renderRecipes() {
    if (!recipesContainer) return;
    recipesContainer.innerHTML = '';
    const searchQuery = globalSearchInput ? globalSearchInput.value.toLowerCase().trim() : '';
    let filtered = userState.recipes.filter(rec => {
      if (isOwnRecipe(rec)) return false;
      const matchesSearch = rec.title.toLowerCase().includes(searchQuery) ||
        rec.author.toLowerCase().includes(searchQuery) ||
        rec.category.toLowerCase().includes(searchQuery);
      let matchesCategory = true;
      if (activeCategoryFilter !== 'all') {
        const queryVal = activeCategoryFilter.toLowerCase();
        matchesCategory = rec.title.toLowerCase().includes(queryVal) ||
          rec.category.toLowerCase().includes(queryVal) ||
          rec.diet.toLowerCase().includes(queryVal);
      }
      const matchesFeedMode = activeFeedMode !== 'following'
        || userState.followingIds.has(String(rec.authorId));
      let matchesHashtag = true;
      if (activeHashtagFilter) {
        matchesHashtag = Array.isArray(rec.tags) && rec.tags.some(t => t.toLowerCase() === activeHashtagFilter.toLowerCase());
      }
      return matchesSearch && matchesCategory && matchesFeedMode && matchesHashtag;
    });
    // ALGORITMO SOCIAL DO FEED SABORÉ (ESTILO REDE SOCIAL)
    // Ranqueamento inteligente: Likes (peso 4) + Avaliações/Comentários (peso 5) + Interesses + Seguidos
    const interests = (JSON.parse(localStorage.getItem('sabore_user_preferences') || '[]'))
      .map(item => String(item).trim().toLocaleLowerCase('pt-BR'))
      .filter(Boolean);

    // ALGORITMO SOCIAL DO FEED SABORÉ DINÂMICO
    // Ponderação: Engajamento (Likes x4, Avaliações x5, Interesses) + Variação Dinâmica Real por Visita/Atualização
    filtered.sort((first, second) => {
      const firstIsFresh = refreshedRecipeIds.has(String(first.id));
      const secondIsFresh = refreshedRecipeIds.has(String(second.id));
      if (firstIsFresh !== secondIsFresh) return firstIsFresh ? -1 : 1;
      if (activeFeedMode === 'recent') {
        return new Date(second.publishedAt || 0).getTime() - new Date(first.publishedAt || 0).getTime();
      }
      const calculateSocialScore = (recipe) => {
        const likesScore = (Number(recipe.likes) || 0) * 4;
        const reviewsScore = (Number(recipe.avaliacoes) || 0) * 5;
        
        let interestScore = 0;
        if (interests.length) {
          const tags = (recipe.tags || []).join(' ').toLocaleLowerCase('pt-BR');
          const categories = (recipe.categories || []).join(' ').toLocaleLowerCase('pt-BR');
          const text = `${recipe.title || ''} ${recipe.description || ''}`.toLocaleLowerCase('pt-BR');
          interestScore = interests.reduce((total, interest) => total
            + (tags.includes(interest) ? 5 : 0)
            + (categories.includes(interest) ? 3 : 0)
            + (text.includes(interest) ? 1 : 0), 0);
        }

        const followingBonus = userState.followingIds.has(String(recipe.authorId)) ? 12 : 0;

        const publishedAt = new Date(recipe.publishedAt || 0).getTime();
        const ageInHours = publishedAt ? Math.max(0, (Date.now() - publishedAt) / 3600000) : Infinity;
        const recencyScore = Math.max(0, 60 - ageInHours);
        return likesScore + reviewsScore + interestScore + followingBonus + recencyScore;
      };

      return calculateSocialScore(second) - calculateSocialScore(first);
    });
    if (filtered.length === 0) {
      const emptyTitle = userState.recipes.length ? 'Nenhuma publicação corresponde aos filtros' : 'Ainda não há publicações disponíveis';
      const emptyText = userState.recipes.length ? 'Mude a categoria, a hashtag ou o modo do feed para ver outras publicações.' : 'Quando alguém da comunidade publicar uma receita pública, ela aparecerá aqui.';
      recipesContainer.innerHTML = `
        <div class="book-detail-empty" style="grid-column: 1 / -1; padding: 60px 20px;">
          <div class="empty-icon-glow"><i class="fa-solid fa-face-rolling-eyes"></i></div>
          <h3>${emptyTitle}</h3>
          <p>${emptyText}</p>
        </div>
      `;
      return;
    }
    // Feed Contínuo (Infinite Scroll): fatiar para renderizar progressivamente
    const visibleRecipes = filtered.slice(0, feedCurrentCount);

    visibleRecipes.forEach(rec => {
      seenRecipeIds.add(String(rec.id));
      const card = document.createElement('article');
      card.className = 'explore-recipe-card';
      let diffClass = 'easy';
      if (rec.difficulty === 'Médio') diffClass = 'medium';
      else if (rec.difficulty === 'Difícil') diffClass = 'hard';

      // Checa se o usuário curtiu (usando favorites)
      const isLiked = userState.favorites.includes(rec.id);
      const isSaved = false;

      card.innerHTML = `
        <div class="explore-image-wrap ${rec.image ? '' : 'without-recipe-image'}">
          ${rec.image ? `<img src="${rec.image}" alt="${rec.title}" class="explore-img">` : '<i class="fa-solid fa-utensils" aria-hidden="true"></i>'}
          <div class="recipe-likes-badge"><i class="fa-solid fa-heart" style="color:#ff4757;"></i> ${rec.likes}</div>
          <div class="card-top-actions">
            <button class="like-toggle-btn ${isLiked ? 'active' : ''}" title="${isLiked ? 'Descurtir receita' : 'Curtir publicação'}">
              <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
            </button>
            <button class="bookmark-toggle-btn ${isSaved ? 'active' : ''}" title="Salvar no meu Livro de Receitas">
              <i class="fa-regular fa-bookmark"></i>
            </button>
          </div>
        </div>
        <div class="explore-content-area">
          <div class="recipe-author-line">
            <span class="author-avatar author-avatar-placeholder" aria-hidden="true"></span>
            <span class="author-name">${api.renderUserIdentity(rec.author || 'Membro da Comunidade', rec.authorPlan)}</span>
          </div>
          <h4>${rec.title}</h4>
          <p class="post-caption">${rec.description || 'Receita compartilhada pela comunidade Saboré.'}</p>
          <div class="explore-meta-bottom">
            <span><i class="fa-regular fa-clock"></i> ${rec.time || 30} min</span>
            <span class="recipe-difficulty ${diffClass}">${rec.difficulty || 'Fácil'}</span>
            <button type="button" class="card-comment-action-btn" title="Ver comentários">
              <i class="fa-regular fa-comment-dots"></i> ${rec.avaliacoes || 0}
            </button>
          </div>
          <div class="post-social-actions">
            ${rec.authorId && rec.authorId !== api.getUser()?.id ? `<button class="follow-author-btn"><i class="fa-solid fa-user-plus"></i> Seguir</button>` : ''}
            <button class="share-post-btn"><i class="fa-solid fa-share-nodes"></i> Compartilhar</button>
            <button class="share-post-btn share-whatsapp-btn whatsapp-post-btn" aria-label="Compartilhar no WhatsApp"><i class="fa-brands fa-whatsapp"></i> WhatsApp</button>
          </div>
        </div>
      `;
      showAuthorAvatar(card.querySelector('.author-avatar'), rec);

      // 1. CURTIR (LIKE COM CORAÇÃO)
      const likeBtn = card.querySelector('.like-toggle-btn');
      likeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          if (likeBtn.classList.contains('active')) {
            await api.delete(`/favoritos/excluir/${rec.id}`);
            likeBtn.classList.remove('active');
            likeBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
            likeBtn.title = 'Curtir publicação';
            userState.favorites = userState.favorites.filter(id => id !== rec.id);
            rec.likes = Math.max(0, (rec.likes || 0) - 1);
          } else {
            await api.post("/favoritos/cadastrar", { receitaId: rec.id });
            likeBtn.classList.add('active');
            likeBtn.innerHTML = '<i class="fa-solid fa-heart"></i>';
            likeBtn.title = 'Descurtir receita';
            userState.favorites.push(rec.id);
            rec.likes = (rec.likes || 0) + 1;
          }
          const badge = card.querySelector('.recipe-likes-badge');
          if (badge) badge.innerHTML = `<i class="fa-solid fa-heart" style="color:#ff4757;"></i> ${rec.likes}`;
          updateTrendingHashtags();
        } catch (err) {
          alert("Erro ao curtir receita: " + err.message);
        }
      });

      // 2. SALVAR NO LIVRO (ÍCONE DE SALVAR / BOOKMARK)
      const bookmarkBtn = card.querySelector('.bookmark-toggle-btn');
      bookmarkBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userState.selectedExploreRecipe = rec;
        renderBookSaveOptions();
        openModal('save-to-book-modal');
      });

      // 3. COMENTÁRIOS DO CARD
      const commentCardBtn = card.querySelector('.card-comment-action-btn');
      if (commentCardBtn) {
        commentCardBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openRecipeDetailsModal(rec);
          setTimeout(() => {
            const commentsSec = document.getElementById('recipe-comments-section') || document.querySelector('.recipe-social-section');
            if (commentsSec) commentsSec.scrollIntoView({ behavior: 'smooth' });
          }, 250);
        });
      }

      const authorLine = card.querySelector('.recipe-author-line');
      if (authorLine && rec.authorId) {
        authorLine.setAttribute('role', 'button');
        authorLine.tabIndex = 0;
        const openAuthorProfile = (event) => {
          event.stopPropagation();
          api.openUserProfile(rec.authorId);
        };
        authorLine.addEventListener('click', openAuthorProfile);
        authorLine.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openAuthorProfile(event);
          }
        });
      }

      const followAuthorBtn = card.querySelector('.follow-author-btn');
      if (followAuthorBtn) {
        const chef = userState.chefs.find(item => item.id === rec.authorId);
        const updateFollowButton = (following) => {
          followAuthorBtn.innerHTML = following
            ? '<i class="fa-solid fa-user-check"></i> Seguindo'
            : '<i class="fa-solid fa-user-plus"></i> Seguir';
          followAuthorBtn.classList.toggle('following', following);
        };
        updateFollowButton(Boolean(chef?.followed));
        followAuthorBtn.addEventListener('click', async (event) => {
          event.stopPropagation();
          try {
            const following = !chef?.followed;
            await (following ? api.post(`/social/seguir/${rec.authorId}`, {}) : api.delete(`/social/seguir/${rec.authorId}`));
            if (chef) chef.followed = following;
            if (following) userState.followingIds.add(String(rec.authorId));
            else userState.followingIds.delete(String(rec.authorId));
            updateFollowButton(following);
          } catch (error) {
            alert(`Não foi possível atualizar o seguimento: ${error.message}`);
          }
        });
      }

      card.querySelector('.share-post-btn').addEventListener('click', async (event) => {
        event.stopPropagation();
        if (window.SaboreShareRecipe) {
          await window.SaboreShareRecipe(rec);
        } else {
          const url = new URL(`../../receita/?id=${rec.id}`, window.location.href).href;
          const shareData = { title: rec.title, text: `Veja a receita ${rec.title}, publicada por ${rec.author} no Saboré.`, url };
          if (navigator.share) await navigator.share(shareData);
          else if (navigator.clipboard) {
            await navigator.clipboard.writeText(`${shareData.text} ${url}`);
            alert('Link da publicação copiado.');
          }
        }
      });

      card.querySelector('.whatsapp-post-btn').addEventListener('click', (event) => {
        event.stopPropagation();
        const url = new URL(`../../receita/?id=${rec.id}`, window.location.href).href;
        const message = `Veja a receita ${rec.title}, publicada por ${rec.author} no Saboré. ${url}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
      });

      // ABRIR PUBLICAÇÃO COMPLETA AO CLICAR NO CARD
      card.addEventListener('click', () => {
        openRecipeDetailsModal(rec);
      });

      recipesContainer.appendChild(card);
    });

    if (visibleRecipes.length < filtered.length) {
      const scrollTrigger = document.createElement('div');
      scrollTrigger.className = 'infinite-scroll-trigger';
      scrollTrigger.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Carregando mais publicações da comunidade...';
      recipesContainer.appendChild(scrollTrigger);
    }

    setupInfiniteFeedObserver(filtered.length);
    updateCursorHoverListeners();
  }

  function setupInfiniteFeedObserver(totalAvailable) {
    if (isInfiniteScrollActive) return;
    const trigger = document.querySelector('.infinite-scroll-trigger');
    const scrollContainer = document.querySelector('.dashboard-body') || window;
    
    const handleScroll = () => {
      if (feedCurrentCount >= totalAvailable) return;
      const targetEl = document.querySelector('.infinite-scroll-trigger');
      if (!targetEl) return;
      const rect = targetEl.getBoundingClientRect();
      if (rect.top <= window.innerHeight + 150) {
        feedCurrentCount += feedPageLimit;
        renderRecipes();
      }
    };

    if (scrollContainer === window) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    } else {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    }
    isInfiniteScrollActive = true;
  }

  const chefsContainer = document.getElementById('chefs-spotlight-container');
  function renderChefs() {
    if (!chefsContainer) return;
    chefsContainer.innerHTML = '';
    if (userState.chefs.length === 0) {
      chefsContainer.innerHTML = `
        <div class="book-detail-empty" style="padding: 40px 20px; text-align: center; width: 100%;">
          <i class="fa-solid fa-users" style="font-size: 2rem; color: var(--accent); margin-bottom: 10px; display: block;"></i>
          <p>Nenhum chef cadastrado ainda. Seja o primeiro!</p>
        </div>
      `;
      return;
    }
    userState.chefs.forEach(chef => {
      const card = document.createElement('div');
      card.className = 'chef-card-item';
      card.setAttribute('role', 'button');
      card.tabIndex = 0;
      const avatarInitial = chef.name.charAt(0).toUpperCase();
      const placeholderStyle = 'display:flex;align-items:center;justify-content:center;background:var(--accent-light);color:var(--accent);font-size:2rem;font-weight:700;border-radius:50%;';
      let avatarEl;
      if (chef.avatar) {
        avatarEl = document.createElement('img');
        avatarEl.src = chef.avatar;
        avatarEl.alt = chef.name;
        avatarEl.className = 'chef-avatar-large';
        avatarEl.onerror = () => {
          const placeholder = document.createElement('div');
          placeholder.className = 'chef-avatar-large chef-avatar-placeholder';
          placeholder.setAttribute('style', placeholderStyle);
          placeholder.textContent = avatarInitial;
          avatarEl.replaceWith(placeholder);
        };
      } else {
        avatarEl = document.createElement('div');
        avatarEl.className = 'chef-avatar-large chef-avatar-placeholder';
        avatarEl.setAttribute('style', placeholderStyle);
        avatarEl.textContent = avatarInitial;
      }
      card.appendChild(avatarEl);
      const nameEl = document.createElement('h4');
      nameEl.innerHTML = api.renderUserIdentity(chef.name, chef.plan);
      card.appendChild(nameEl);
      const memberEl = document.createElement('p');
      memberEl.textContent = 'Membro da comunidade Saboré';
      card.appendChild(memberEl);
      const followButton = document.createElement('button');
      followButton.className = `btn-follow-chef ${chef.followed ? 'following' : ''}`;
      followButton.textContent = chef.followed ? 'Seguindo' : 'Seguir';
      followButton.addEventListener('click', async (event) => {
        event.stopPropagation();
        try {
          const following = !chef.followed;
          await (following ? api.post(`/social/seguir/${chef.id}`, {}) : api.delete(`/social/seguir/${chef.id}`));
          chef.followed = following;
          if (following) userState.followingIds.add(String(chef.id));
          else userState.followingIds.delete(String(chef.id));
          renderChefs();
          renderRecipes();
        } catch (error) {
          alert(`Não foi possível atualizar o seguimento: ${error.message}`);
        }
      });
      card.appendChild(followButton);
      card.addEventListener('click', () => api.openUserProfile(chef.id));
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          api.openUserProfile(chef.id);
        }
      });
      chefsContainer.appendChild(card);
    });
    updateCursorHoverListeners();
  }
  window.addEventListener('sabore:follow-changed', (event) => {
    const chef = userState.chefs.find(item => item.id === event.detail?.userId);
    if (!chef) return;
    chef.followed = Boolean(event.detail.following);
    if (chef.followed) userState.followingIds.add(String(chef.id));
    else userState.followingIds.delete(String(chef.id));
    renderChefs();
    renderRecipes();
  });
  function formatFollowers(num) {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k seguidores';
    }
    return num + ' seguidores';
  }
  // Desafio da Semana (sistema culinário com participação, pontos e histórico)
  let selectedDesafioPhotoDataUrl = null;
  let desafioPhotoProcessing = false;

  function escapeDesafioHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function formatDesafioTimeLeft(fimEm) {
    const diff = new Date(fimEm).getTime() - Date.now();
    if (!Number.isFinite(diff) || diff <= 0) return 'Desafio encerrado';
    const dias = Math.floor(diff / 86400000);
    const horas = Math.floor((diff % 86400000) / 3600000);
    return dias > 0 ? `Termina em ${dias}d ${horas}h` : `Termina em ${horas}h`;
  }

  function validateDesafioPhotoFile(file) {
    if (!file) return { valid: true };
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const validExt = /\.(jpe?g|png|webp|gif)$/i.test(file.name || '');
    if (!validTypes.includes(String(file.type || '').toLowerCase()) && !validExt) {
      return {
        valid: false,
        error: 'Formato de arquivo inválido. Selecione uma imagem JPG, PNG, WEBP ou GIF.'
      };
    }
    if (file.size <= 0) {
      return {
        valid: false,
        error: 'O arquivo selecionado está vazio. Escolha outra imagem.'
      };
    }
    const maxBytes = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxBytes) {
      return {
        valid: false,
        error: 'A imagem selecionada excede 10 MB. Escolha uma foto menor.'
      };
    }
    return { valid: true };
  }

  function readDesafioPhoto(file) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve(null);
      const validation = validateDesafioPhotoFile(file);
      if (!validation.valid) {
        return reject(new Error(validation.error));
      }
      const reader = new FileReader();
      reader.onload = () => {
        const rawDataUrl = typeof reader.result === 'string' ? reader.result : null;
        if (!rawDataUrl) {
          return reject(new Error('Não foi possível ler o arquivo de imagem selecionado.'));
        }
        const img = new Image();
        img.onload = () => {
          try {
            const max = 900;
            const ratio = Math.min(1, max / Math.max(img.width || 1, img.height || 1));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(img.width * ratio));
            canvas.height = Math.max(1, Math.round(img.height * ratio));
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } catch (canvasErr) {
            resolve(rawDataUrl);
          }
        };
        img.onerror = () => {
          reject(new Error('O arquivo selecionado não pôde ser carregado como uma imagem válida.'));
        };
        img.src = rawDataUrl;
      };
      reader.onerror = () => reject(new Error('Falha ao ler a imagem do seu dispositivo. Tente novamente.'));
      reader.readAsDataURL(file);
    });
  }

  function resetDesafioPhotoSelection() {
    selectedDesafioPhotoDataUrl = null;
    desafioPhotoProcessing = false;
    const fileInput = document.getElementById('desafio-recipe-photo');
    const fileNameEl = document.getElementById('desafio-file-name');
    const previewWrap = document.getElementById('desafio-photo-preview-wrap');
    const previewImg = document.getElementById('desafio-photo-preview');
    const errorEl = document.getElementById('desafio-photo-error');
    if (fileInput) fileInput.value = '';
    if (fileNameEl) {
      fileNameEl.textContent = 'Nenhum arquivo selecionado';
      fileNameEl.style.color = 'rgba(242, 244, 243, 0.65)';
    }
    if (previewImg) previewImg.src = '';
    if (previewWrap) previewWrap.style.display = 'none';
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    }
  }

  function showDesafioPhotoError(msg) {
    const errorEl = document.getElementById('desafio-photo-error');
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.style.display = msg ? 'block' : 'none';
    }
  }

  function renderDesafioModal(data) {
    const desafio = data.desafio;
    const participou = data.participacaoUsuario;
    const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    setText('desafio-modal-title', desafio.titulo);
    setText('desafio-modal-theme', `Tema: ${desafio.tema} • +${desafio.pontosRecompensa} pontos`);
    setText('desafio-modal-desc', desafio.descricao);
    setText('desafio-modal-guide', desafio.orientacoes);

    const done = document.getElementById('desafio-modal-done');
    const form = document.getElementById('desafio-form');
    if (done && form) {
      if (participou) {
        done.style.display = 'block';
        done.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;gap:10px;">
            <div><i class="fa-solid fa-circle-check"></i> Você já participou com <strong>"${escapeDesafioHtml(participou.nomeReceita)}"</strong> e ganhou <strong>+${participou.pontosConcedidos} pontos</strong>!</div>
            ${participou.foto ? `<img src="${escapeDesafioHtml(participou.foto)}" alt="Foto enviada" style="width:100%;max-width:260px;max-height:170px;object-fit:cover;border-radius:10px;border:1px solid rgba(39,201,63,0.35);">` : ''}
          </div>
        `;
        form.style.display = 'none';
      } else if (!desafio.ativo || new Date(desafio.fimEm).getTime() < Date.now()) {
        done.style.display = 'block';
        done.textContent = 'Este desafio já foi encerrado.';
        form.style.display = 'none';
      } else {
        done.style.display = 'none';
        form.style.display = 'flex';
      }
    }

    const list = document.getElementById('desafio-participations');
    if (list) {
      const itens = desafio.participacoes || [];
      list.innerHTML = itens.length ? itens.map((p) => `
        <div style="display:flex;gap:12px;align-items:center;background:rgba(242,244,243,0.04);border:1px solid rgba(242,244,243,0.06);border-radius:10px;padding:10px 12px;">
          ${p.foto ? `<img src="${escapeDesafioHtml(p.foto)}" alt="Foto de ${escapeDesafioHtml(p.nomeReceita)}" style="width:52px;height:52px;border-radius:8px;object-fit:cover;flex-shrink:0;">` : '<div style="width:52px;height:52px;border-radius:8px;background:rgba(240,213,182,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fa-solid fa-utensils" style="opacity:.65;color:var(--secondary);"></i></div>'}
          <div style="min-width:0;flex:1;">
            <strong style="font-size:0.84rem;display:block;">${escapeDesafioHtml(p.nomeReceita)}</strong>
            <div style="font-size:0.74rem;opacity:.65;">por ${escapeDesafioHtml(p.usuario?.nome || 'Cozinheiro')} • +${p.pontosConcedidos || 30} pts</div>
          </div>
        </div>`).join('') : '<p style="font-size:0.78rem;opacity:.55;">Seja o primeiro a participar!</p>';
    }
  }

  async function loadDesafioHistory() {
    const box = document.getElementById('desafio-history');
    if (!box) return;
    try {
      const historico = await api.get('/desafios/historico');
      box.innerHTML = (historico || []).length ? historico.map((d) => `
        <div style="display:flex;justify-content:space-between;gap:8px;">
          <span>${escapeDesafioHtml(d.titulo)}</span>
          <span style="opacity:.6;">${d._count?.participacoes ?? 0} participações</span>
        </div>`).join('') : '<p style="opacity:.55;">Ainda não há desafios anteriores.</p>';
    } catch (err) {
      box.innerHTML = '<p style="opacity:.55;">Histórico indisponível no momento.</p>';
    }
  }

  function renderWeeklyChallenge() {
    const card = document.getElementById('weekly-challenge-card');
    if (!card) return;

    const data = currentWeeklyChallengeData;
    const titleEl = document.getElementById('challenge-title');
    const descEl = document.getElementById('challenge-description');
    const badgeTextEl = document.getElementById('challenge-badge-text');
    const hashtagEl = document.getElementById('challenge-hashtag');
    const timeLeftEl = document.getElementById('challenge-time-left');
    const participantsEl = document.getElementById('challenge-participants');
    const countEl = document.getElementById('challenge-recipes-count');
    const joinBtn = document.getElementById('challenge-join-btn');
    const submitBtn = document.getElementById('challenge-submit-btn');
    if (submitBtn) submitBtn.hidden = true;
    const communityPanel = document.getElementById('challenge-community-panel');
    if (communityPanel) communityPanel.style.display = 'none';

    if (!data || !data.desafio) {
      if (titleEl) titleEl.textContent = 'Desafio indisponível';
      if (descEl) descEl.textContent = 'Não foi possível carregar o desafio desta semana. Tente novamente em instantes.';
      if (joinBtn) joinBtn.style.display = 'none';
      return;
    }

    const desafio = data.desafio;
    const participou = Boolean(data.participacaoUsuario);

    const isAtivo = desafio.statusTempo === 'ATIVO' || !desafio.statusTempo;
    const isEncerrado = desafio.statusTempo === 'ENCERRADO';
    const isEmBreve = desafio.statusTempo === 'EM_BREVE';

    const coverImg = document.getElementById('challenge-cover-img');
    if (coverImg) {
      const officialChallengeImages = {
        1: '/assets/community/desafio-despensa.jpg',
        2: '/assets/community/desafio-apresentacao.jpg',
        3: '/assets/community/desafio-mundo.jpg',
        4: '/assets/community/desafio-doces.jpg',
        5: '/assets/community/desafio-zero-desperdicio.jpg',
        6: '/assets/community/desafio-chef.jpg',
        7: '/assets/community/desafio-natal.jpg',
        8: '/assets/community/desafio-ceia.jpg',
        9: '/assets/community/desafio-retrospectiva.jpg'
      };
      const imagemDesafio = officialChallengeImages[Number(desafio.id)] || desafio.imagem || '../../assets/community/desafio-inverno.jpg';
      coverImg.src = imagemDesafio.startsWith('http') || imagemDesafio.startsWith('../../')
        ? imagemDesafio
        : `../..${imagemDesafio.startsWith('/') ? imagemDesafio : `/${imagemDesafio}`}`;
      coverImg.style.display = 'block';
      coverImg.onerror = () => {
        coverImg.onerror = null;
        coverImg.src = '../../assets/community/desafio-inverno.jpg';
      };
    }

    if (titleEl) titleEl.textContent = desafio.titulo;
    if (descEl) {
      const summary = String(desafio.descricao || '').trim();
      descEl.textContent = summary.length > 112 ? `${summary.slice(0, 109).trimEnd()}…` : summary;
    }
    
    if (badgeTextEl) {
      if (isEncerrado) {
        badgeTextEl.textContent = `DESAFIO ENCERRADO • ${desafio.tema.toUpperCase()}`;
      } else if (isEmBreve) {
        badgeTextEl.textContent = `EM BREVE • ${desafio.tema.toUpperCase()}`;
      } else {
        badgeTextEl.textContent = `DESAFIO DA SEMANA • ${desafio.tema.toUpperCase()}`;
      }
    }

    if (hashtagEl) {
      hashtagEl.textContent = desafio.hashtag || '';
      hashtagEl.title = 'Clique para filtrar o feed por esta hashtag';
      hashtagEl.onclick = () => {
        activeHashtagFilter = (activeHashtagFilter === desafio.hashtag) ? null : desafio.hashtag;
        renderTags();
        renderRecipes();
        // Switch to feed tab if on events tab
        const feedView = document.getElementById('view-comunidade-feed');
        const evView = document.getElementById('view-comunidade-eventos');
        if (feedView && evView && evView.style.display !== 'none') {
          evView.style.display = 'none';
          feedView.style.display = '';
          document.getElementById('btn-tab-feed')?.classList.add('active');
          document.getElementById('btn-tab-eventos')?.classList.remove('active');
        }
      };
    }

    if (timeLeftEl) {
      if (isEncerrado) {
        timeLeftEl.innerHTML = `<i class="fa-solid fa-lock"></i> Desafio Encerrado`;
      } else if (isEmBreve) {
        timeLeftEl.innerHTML = `<i class="fa-regular fa-clock"></i> Inicia em ${new Date(desafio.inicioEm).toLocaleDateString('pt-BR')}`;
      } else {
        timeLeftEl.innerHTML = `<i class="fa-regular fa-clock"></i> ${formatDesafioTimeLeft(desafio.fimEm)}`;
      }
    }

    if (countEl) countEl.innerHTML = `<i class="fa-solid fa-star"></i> +${desafio.pontosRecompensa || 30} pontos no ranking`;
    if (participantsEl) {
      const total = desafio.totalParticipacoes || 0;
      participantsEl.innerHTML = `<i class="fa-solid fa-user-group"></i> ${total} ${total === 1 ? 'participante' : 'participantes'}`;
    }

    // Show/hide completed banner
    const completedBanner = document.getElementById('challenge-completed-banner');
    if (completedBanner) completedBanner.style.display = participou ? '' : 'none';

    if (joinBtn) {
      if (participou || !isAtivo) {
        joinBtn.style.display = 'none';
      } else {
        joinBtn.style.display = '';
        joinBtn.classList.remove('joined');
        joinBtn.innerHTML = '<i class="fa-solid fa-square-plus"></i> Participar do Desafio';
        joinBtn.onclick = () => {
          if (openCommunityComposer) {
            openCommunityComposer({ hashtag: desafio.hashtag, databaseId: desafio.id });
          } else {
            renderDesafioModal(currentWeeklyChallengeData);
            loadDesafioHistory();
            const modal = document.getElementById('desafio-modal');
            if (modal) modal.classList.add('open');
          }
        };
      }
    }

    bindDesafioModalEvents();
    updateCursorHoverListeners();
  }

  function bindDesafioModalEvents() {
    const modal = document.getElementById('desafio-modal');
    const closeBtn = document.getElementById('close-desafio-modal');
    if (modal && !modal.dataset.bound) {
      modal.dataset.bound = 'true';
      modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });
      if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('open'));

      const fileInput = document.getElementById('desafio-recipe-photo');
      const chooseFileBtn = document.getElementById('desafio-choose-file-btn');
      const removePhotoBtn = document.getElementById('desafio-remove-photo-btn');
      const fileNameEl = document.getElementById('desafio-file-name');
      const previewWrap = document.getElementById('desafio-photo-preview-wrap');
      const previewImg = document.getElementById('desafio-photo-preview');

      if (chooseFileBtn && fileInput) {
        chooseFileBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          fileInput.click();
        });
      }

      if (removePhotoBtn) {
        removePhotoBtn.addEventListener('click', (e) => {
          e.preventDefault();
          resetDesafioPhotoSelection();
        });
      }

      if (fileInput) {
        fileInput.addEventListener('change', async () => {
          showDesafioPhotoError('');
          const file = fileInput.files && fileInput.files[0];
          if (!file) {
            resetDesafioPhotoSelection();
            return;
          }
          const sizeKB = Math.max(1, Math.round(file.size / 1024));
          const sizeText = sizeKB >= 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
          if (fileNameEl) {
            fileNameEl.textContent = `Carregando "${file.name}" (${sizeText})...`;
            fileNameEl.style.color = 'var(--secondary)';
          }
          desafioPhotoProcessing = true;
          try {
            const dataUrl = await readDesafioPhoto(file);
            selectedDesafioPhotoDataUrl = dataUrl;
            if (fileNameEl) {
              fileNameEl.textContent = `${file.name} (${sizeText})`;
              fileNameEl.style.color = '#27C93F';
            }
            if (previewImg && dataUrl) {
              previewImg.src = dataUrl;
            }
            if (previewWrap && dataUrl) {
              previewWrap.style.display = 'flex';
            }
          } catch (err) {
            selectedDesafioPhotoDataUrl = null;
            fileInput.value = '';
            if (fileNameEl) {
              fileNameEl.textContent = 'Nenhum arquivo selecionado';
              fileNameEl.style.color = 'rgba(242, 244, 243, 0.65)';
            }
            if (previewWrap) previewWrap.style.display = 'none';
            showDesafioPhotoError(err.message || 'Erro ao processar a imagem selecionada.');
            if (window.SaboreNotify) window.SaboreNotify(err.message || 'Erro ao carregar a imagem.', 'error');
          } finally {
            desafioPhotoProcessing = false;
          }
        });
      }

      const form = document.getElementById('desafio-form');
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          showDesafioPhotoError('');
          const submitBtnEl = document.getElementById('desafio-submit-btn');
          const nomeReceita = document.getElementById('desafio-recipe-name').value.trim();
          const descricaoPreparacao = document.getElementById('desafio-recipe-desc').value.trim();
          if (!nomeReceita || !descricaoPreparacao) {
            showDesafioPhotoError('Preencha o nome do prato e a descrição do preparo.');
            return;
          }
          if (desafioPhotoProcessing) {
            showDesafioPhotoError('Aguarde o carregamento da foto terminar antes de publicar.');
            return;
          }
          const originalBtnHtml = submitBtnEl ? submitBtnEl.innerHTML : '';
          if (submitBtnEl) {
            submitBtnEl.disabled = true;
            submitBtnEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Publicando...';
          }
          try {
            let foto = selectedDesafioPhotoDataUrl;
            if (!foto && fileInput && fileInput.files && fileInput.files[0]) {
              foto = await readDesafioPhoto(fileInput.files[0]);
            }
            const resultado = await api.post('/desafios/publicar', {
              desafioId: currentWeeklyChallengeData.desafio.id,
              nomeReceita,
              descricaoPreparacao,
              foto
            });
            if (window.SaboreNotify) window.SaboreNotify(resultado.mensagem || 'Participação publicada com sucesso!', 'success');
            form.reset();
            resetDesafioPhotoSelection();
            const atualizado = await api.get('/desafios/atual');
            currentWeeklyChallengeData = atualizado;
            renderWeeklyChallenge();
            renderDesafioModal(atualizado);
          } catch (err) {
            const msg = err.message || 'Não foi possível publicar sua participação. Verifique sua conexão e tente novamente.';
            showDesafioPhotoError(msg);
            if (window.SaboreNotify) window.SaboreNotify(msg, 'error'); else alert(msg);
          } finally {
            if (submitBtnEl) {
              submitBtnEl.disabled = false;
              submitBtnEl.innerHTML = originalBtnHtml || '<i class="fa-solid fa-trophy"></i> Publicar participação';
            }
          }
        });
      }
    }
  }
  bindDesafioModalEvents();

  function renderChallengeCommunityPanel() {
    const content = document.getElementById('challenge-community-content');
    const challenge = currentWeeklyChallengeData;
    if (!content || !challenge) return;

    const user = api.getUser();
    const storageKey = `sabore_challenge_joined_${challenge.id}_${challenge.year}_w${challenge.weekNumber}_${user?.id || 'guest'}`;
    const joined = Boolean(challenge.inscrito || challenge.isJoined)
      || (!challenge.databaseId && localStorage.getItem(storageKey) === 'true');
    const entries = Array.isArray(challenge.entradas) && challenge.entradas.length
      ? challenge.entradas.map(entry => ({
          challengeEntryId: entry.id,
          title: entry.receita?.titulo || entry.receita?.title || 'Receita do desafio',
          author: entry.autor?.nome || 'Membro da comunidade',
          authorId: entry.autor?.id,
          votes: Number(entry.votos) || 0,
          voted: Boolean(entry.meuVoto)
        }))
      : userState.recipes
        .filter(recipe => (recipe.tags || []).some(tag => tag.toLowerCase() === challenge.hashtag.toLowerCase()))
        .map(recipe => ({ ...recipe, votes: (recipe.likes || 0) + (recipe.avaliacoes || 0) }))
        .sort((first, second) => second.votes - first.votes);

    const isVoting = (challenge.fase || challenge.status) === 'VOTACAO';
    const status = isVoting
      ? '<i class="fa-solid fa-check-to-slot"></i> VotaÃ§Ã£o aberta: participantes inscritos podem votar em outra receita.'
      : joined
      ? '<i class="fa-solid fa-circle-check"></i> Você está inscrito. Publique com a hashtag oficial para entrar no ranking.'
      : '<i class="fa-solid fa-compass"></i> Inscreva-se para acompanhar e participar deste desafio.';
    const ranking = entries.slice(0, 10).map((recipe, index) => `
      <div class="challenge-ranking-item">
        <span class="challenge-ranking-position">${index + 1}º</span>
        <span class="challenge-ranking-name">${recipe.author || 'Membro da comunidade'}${recipe.title ? ` - ${recipe.title}` : ''}</span>
        <span class="challenge-ranking-score">${recipe.votes} ${isVoting ? 'votos' : 'pts'}</span>
        ${isVoting && joined && String(recipe.authorId) !== String(user?.id) && recipe.challengeEntryId ? `<button type="button" class="challenge-vote-btn" data-entry-id="${recipe.challengeEntryId}" ${recipe.voted ? 'disabled' : ''}>${recipe.voted ? 'Seu voto' : 'Votar'}</button>` : ''}
      </div>
    `).join('');

    content.innerHTML = `
      <div class="challenge-status-line">${status}</div>
      <div class="challenge-ranking-list">
        ${ranking || '<p class="challenge-ranking-empty">O ranking começa quando a comunidade publicar receitas com a hashtag do desafio.</p>'}
      </div>
    `;
    content.querySelectorAll('.challenge-vote-btn').forEach(button => {
      button.addEventListener('click', async () => {
        button.disabled = true;
        try {
          await api.post('/desafios/votar', { entradaId: Number(button.dataset.entryId) });
          currentWeeklyChallengeData = await api.get('/desafios/ativo?_t=' + Date.now());
          renderWeeklyChallenge();
        } catch (error) {
          button.disabled = false;
          alert(`NÃ£o foi possÃ­vel registrar seu voto: ${error.message}`);
        }
      });
    });
  }

  function updateTrendingHashtags() {
    const map = new Map();
    userState.recipes.forEach(rec => {
      const interactions = (Number(rec.likes) || 0) + (Number(rec.avaliacoes) || 0);
      const tags = rec.tags || extractRecipeTags(rec);
      tags.forEach(tag => {
        const norm = tag.toLowerCase();
        if (!map.has(norm)) {
          map.set(norm, { name: norm, interactions: 0, count: 0 });
        }
        const item = map.get(norm);
        item.interactions += interactions;
        item.count += 1;
      });
    });

    // Exibir APENAS as hashtags que realmente estão em alta com base nas interações dos usuários (> 0)
    const officialChallengeTag = normalizeHashtag(currentWeeklyChallengeData?.desafio?.hashtag || currentWeeklyChallengeData?.hashtag);
    if (officialChallengeTag && !map.has(officialChallengeTag.toLowerCase())) {
      map.set(officialChallengeTag.toLowerCase(), { name: officialChallengeTag.toLowerCase(), interactions: 0, count: 0, official: true });
    }

    userState.trendingTagsData = Array.from(map.values())
      .filter(item => item.interactions > 0 || item.name === officialChallengeTag.toLowerCase())
      .sort((a, b) => Number(Boolean(b.official)) - Number(Boolean(a.official)) || b.interactions - a.interactions || b.count - a.count);

    renderTags();
  }

  const tagCloud = document.getElementById('popular-tags-cloud');
  function renderTags() {
    if (!tagCloud) return;
    tagCloud.innerHTML = '';

    if (!userState.trendingTagsData || userState.trendingTagsData.length === 0) {
      tagCloud.innerHTML = `
        <div class="tags-empty-state">
          <i class="fa-solid fa-arrow-trend-up"></i>
          <span>Nenhuma hashtag com interações suficientes no momento. Curta e avalie receitas da comunidade para impulsionar as tendências culinárias!</span>
        </div>
      `;
      return;
    }

    userState.trendingTagsData.forEach(item => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'tag-item-chip';
      if (activeHashtagFilter === item.name) {
        chip.classList.add('active');
      }
      chip.innerHTML = `
        <span>${item.name}</span>
        <span class="tag-fire-count" title="${item.interactions} interações dos usuários"><i class="fa-solid fa-fire"></i> ${item.interactions}</span>
      `;
      chip.addEventListener('click', () => {
        if (activeHashtagFilter === item.name) {
          activeHashtagFilter = null;
        } else {
          activeHashtagFilter = item.name;
        }
        renderTags();
        renderRecipes();
      });
      tagCloud.appendChild(chip);
    });
    updateCursorHoverListeners();
  }
  const detailAuthorAvatar = document.getElementById('recipe-detail-author-avatar');
  const detailAuthorName = document.getElementById('recipe-detail-author-name');
  const detailTitle = document.getElementById('recipe-detail-title');
  const detailTime = document.getElementById('recipe-detail-time');
  const detailDifficulty = document.getElementById('recipe-detail-difficulty');
  const detailDietTag = document.getElementById('recipe-detail-diet-tag');
  const detailIngredientsList = document.getElementById('recipe-detail-ingredients-list');
  const detailStepsList = document.getElementById('recipe-detail-steps-list');
  const detailSaveBtn = document.getElementById('recipe-detail-save-btn');
  function openRecipeDetailsModal(rec) {
    if (!rec) return;
    userState.selectedExploreRecipe = rec;
    showAuthorAvatar(detailAuthorAvatar, rec);
    if (detailAuthorName) {
      detailAuthorName.innerHTML = 'Por ' + api.renderUserIdentity(rec.author || 'Comunidade Saboré', rec.authorPlan);
    }
    if (detailTitle) {
      detailTitle.textContent = rec.title || 'Sem título';
    }
    if (detailTime) {
      detailTime.textContent = (rec.time || 30) + ' min';
    }
    if (detailDifficulty) {
      detailDifficulty.textContent = rec.difficulty || 'Fácil';
    }
    if (detailDietTag) {
      detailDietTag.textContent = rec.diet || rec.category || 'Geral';
    }
    if (detailIngredientsList) {
      detailIngredientsList.innerHTML = '';
      const ings = Array.isArray(rec.ingredients) ? rec.ingredients : [];
      if (ings.length === 0) {
        detailIngredientsList.innerHTML = '<li>Ingredientes a gosto.</li>';
      } else {
        ings.forEach(ing => {
          const li = document.createElement('li');
          li.textContent = ing;
          detailIngredientsList.appendChild(li);
        });
      }
    }
    if (detailStepsList) {
      detailStepsList.innerHTML = '';
      const steps = Array.isArray(rec.steps) ? rec.steps : [];
      if (steps.length === 0) {
        detailStepsList.innerHTML = '<li>Modo de preparo livre.</li>';
      } else {
        steps.forEach(step => {
          const li = document.createElement('li');
          li.textContent = step;
          detailStepsList.appendChild(li);
        });
      }
    }
    selectedRating = 5;
    updateStarsUI(5);
    loadRecipeCommentsAndRatings(rec.id);
    openModal('recipe-details-modal');
  }
  const saveOptionsContainer = document.getElementById('save-book-options-container');
  if (detailSaveBtn) {
    detailSaveBtn.addEventListener('click', () => {
      closeModal('recipe-details-modal');
      renderBookSaveOptions();
      openModal('save-to-book-modal');
    });
  }
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
      item.querySelector('.btn-select-save-book').addEventListener('click', async () => {
        if (!userState.selectedExploreRecipe) return;
        try {
          await api.post("/receitas/cadastrar", {
            titulo: userState.selectedExploreRecipe.title,
            tempoPreparo: userState.selectedExploreRecipe.time,
            modoPreparo: userState.selectedExploreRecipe.steps.join("\n"),
            dificuldade: userState.selectedExploreRecipe.difficulty,
            criadaPorIA: userState.selectedExploreRecipe.criadaPorIA || false,
            ingredientes: userState.selectedExploreRecipe.ingredients,
            categorias: userState.selectedExploreRecipe.categories || [userState.selectedExploreRecipe.category],
            livroId: book.id,
            publica: false
          });
          book.count += 1;
          closeModal('save-to-book-modal');
          alert('Receita "' + userState.selectedExploreRecipe.title + '" salva com sucesso no livro "' + book.title + '"!');
        } catch (err) {
          alert("Erro ao salvar receita no livro: " + err.message);
        }
      });
      saveOptionsContainer.appendChild(item);
    });
    updateCursorHoverListeners();
  }
  async function loadInitialData(options = {}) {
    const user = api.getUser();
    if (!user) {
      window.location.href = "../../login/index.html";
      return;
    }
    const navAvatar = document.querySelector('.user-avatar');
    if (navAvatar && user.foto) navAvatar.src = user.foto;
    const navName = document.querySelector('.user-name');
    if (navName) api.renderUserName(navName, user);
    const feedLoadId = ++latestFeedLoad;
    const isCurrentFeedLoad = () => feedLoadId === latestFeedLoad;
    try {
      // Informações secundárias não podem impedir o carregamento das receitas públicas.
      const [profileResult, booksResult, favoritesResult, recipesResult] = await Promise.allSettled([
        api.get("/usuarios/perfil"),
        api.get("/livros/listar"),
        api.get("/favoritos/listar"),
        api.get("/receitas/publicas?_t=" + Date.now())
      ]);
      if (!isCurrentFeedLoad()) return;
      const profileData = profileResult.status === 'fulfilled' ? profileResult.value : null;
      userState.isPro = profileData?.plano === "PRO";
      if (navName) api.renderUserName(navName, user, profileData?.plano);
      updatePlanUI();
      const books = booksResult.status === 'fulfilled' ? booksResult.value : [];
      userState.books = books.map(b => ({
        id: b.id,
        title: b.titulo,
        count: b._count.receitas,
        emoji: b.emoji || 'fa-solid fa-book',
        tag: b.tag
      }));
      const favorites = favoritesResult.status === 'fulfilled' ? favoritesResult.value : [];
      userState.favorites = favorites.map(f => f.id);
      if (recipesResult.status !== 'fulfilled') throw recipesResult.reason;
      let publicRecipes = recipesResult.value.filter(rec => {
        const title = String(rec.title || rec.titulo || '').trim().toLowerCase();
        if (title === 'teste' || title === 'teste 123') return false;
        return Boolean(title) && !isOwnRecipe(rec);
      });
      let newPostsCount = 0;
      if (options.onlyNew) refreshedRecipeIds = new Set();
      if (options.onlyNew && seenRecipeIds.size > 0) {
        const freshRecipes = publicRecipes.filter(recipe => !seenRecipeIds.has(String(recipe.id)));
        const relevantFreshRecipes = activeFeedMode === 'following'
          ? freshRecipes.filter(recipe => userState.followingIds.has(String(recipe.authorId ?? recipe.usuarioId)))
          : freshRecipes;
        if (relevantFreshRecipes.length) {
          newPostsCount = relevantFreshRecipes.length;
          refreshedRecipeIds = new Set(relevantFreshRecipes.map(recipe => String(recipe.id)));
          const freshIds = new Set(relevantFreshRecipes.map(recipe => String(recipe.id)));
          publicRecipes = [...relevantFreshRecipes, ...userState.recipes.filter(recipe => !freshIds.has(String(recipe.id)))];
        } else if (userState.recipes.length) {
          // Uma atualização sem posts novos mantém o feed visível; não transforma
          // uma resposta válida da API em um estado vazio.
          publicRecipes = userState.recipes.map(recipe => ({
            id: recipe.id, title: recipe.title, description: recipe.description,
            time: recipe.time, difficulty: recipe.difficulty, category: recipe.category,
            likes: recipe.likes, avaliacoes: recipe.avaliacoes, image: recipe.image,
            authorId: recipe.authorId, author: recipe.author, authorAvatar: recipe.authorAvatar,
            authorPlan: recipe.authorPlan,
            publishedAt: recipe.publishedAt, ingredients: recipe.ingredients, steps: recipe.steps,
            categories: recipe.categories, hashtags: recipe.hashtags
          }));
        }
      }
      userState.recipes = publicRecipes.map(rec => {
        const categoriesList = rec.categories || [];
        const hashtags = Array.isArray(rec.hashtags) ? rec.hashtags : [];
        const tags = extractRecipeTags({ ...rec, categories: categoriesList, hashtags });
        return {
          id: rec.id,
          title: rec.title,
          description: rec.description || '',
          time: rec.time,
          difficulty: rec.difficulty,
          category: rec.category,
          likes: Number(rec.likes) || 0,
          avaliacoes: Number(rec.avaliacoes) || 0,
          image: rec.image,
          authorId: rec.authorId,
          author: rec.author,
          authorAvatar: rec.authorAvatar,
          authorPlan: rec.authorPlan,
          diet: rec.category,
          tags,
          hashtags,
          publishedAt: rec.publishedAt,
          ingredients: rec.ingredients,
          steps: rec.steps,
          categories: categoriesList
        };
      });
      const communityCategories = [...new Set(userState.recipes.flatMap(recipe => recipe.categories).filter(Boolean))];
      userState.categories = [
        { id: 'all', name: 'Todas', emoji: 'fa-solid fa-utensils' },
        ...communityCategories.map(name => ({
          id: name.toLocaleLowerCase('pt-BR'),
          name,
          emoji: 'fa-solid fa-tag'
        }))
      ];
      renderCategories();
      renderRecipes();
      updateTrendingHashtags();
      try {
        currentWeeklyChallengeData = await api.get("/desafios/semanal/atual");
      } catch (err) {
        currentWeeklyChallengeData = null;
      }
      renderWeeklyChallenge();
      updateTrendingHashtags();
      try {
        const currentUser = api.getUser();
        const [usuarios, seguindo] = await Promise.all([
          api.get("/social/perfis"),
          api.get("/social/meus-seguindo")
        ]);
        userState.followingIds = new Set((seguindo || []).map(item => String(item.id)));
        userState.chefs = usuarios
          .filter(u => u.id !== currentUser.id) // Exclui o próprio usuário logado
          .map(u => ({
            id: u.id,
            name: u.nome,
            plan: u.plano,
            recipes: 0, // Será preenchido quando houver rota de contagem
            avatar: u.foto || null,
            followed: false,
            recipes: u.receitasPublicas || 0,
            followed: userState.followingIds.has(String(u.id))
          }));
      } catch (err) {
      }
      if (!isCurrentFeedLoad()) return;
      renderChefs();
      // Os cards podem ter sido renderizados antes do retorno dos perfis sociais.
      // Renderize novamente para refletir corretamente quem o usuário já segue.
      renderRecipes();
      renderTags();
      return { ok: true, newPostsCount };
    } catch (err) {
      console.error('NÃ£o foi possÃ­vel atualizar o feed da comunidade:', err);
      return { ok: false, newPostsCount: 0, error: err };
    }
  }
  let selectedRating = 5;
  const ratingStarsContainer = document.getElementById('recipe-rating-stars');
  const commentForm = document.getElementById('recipe-comment-form');
  const commentInput = document.getElementById('recipe-comment-input');
  const commentsListContainer = document.getElementById('recipe-comments-list');
  const commentsCountBadge = document.getElementById('recipe-comments-count');
  const commentFeedbackStatus = document.getElementById('comment-feedback-status');

  function initRatingSystem() {
    if (!ratingStarsContainer) return;
    const stars = ratingStarsContainer.querySelectorAll('i');
    stars.forEach(star => {
      star.addEventListener('click', () => {
        const rating = parseInt(star.dataset.rating) || 5;
        selectedRating = rating;
        updateStarsUI(rating);
      });
    });

    if (commentForm) {
      commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rec = userState.selectedExploreRecipe;
        if (!rec) return;
        const text = commentInput ? commentInput.value.trim() : '';
        if (!text) return;

        const submitBtn = document.getElementById('btn-submit-comment');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';
        }

        try {
          await api.post("/avaliacoes/cadastrar", {
            receitaId: rec.id,
            nota: selectedRating || 5,
            comentario: text
          });

          if (commentInput) commentInput.value = '';
          rec.avaliacoes = (rec.avaliacoes || 0) + 1;
          
          if (commentFeedbackStatus) {
            commentFeedbackStatus.textContent = 'Comentário publicado!';
            commentFeedbackStatus.style.display = 'inline';
            setTimeout(() => { if (commentFeedbackStatus) commentFeedbackStatus.style.display = 'none'; }, 3000);
          }

          // Atualizar lista de comentários e receita em tempo real
          await loadRecipeCommentsAndRatings(rec.id);
          renderRecipes();
          updateTrendingHashtags();
        } catch (err) {
          alert("Não foi possível enviar o comentário: " + err.message);
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane" style="margin-right: 5px;"></i> Publicar';
          }
        }
      });
    }
  }

  async function loadRecipeCommentsAndRatings(recipeId) {
    if (!commentsListContainer) return;
    commentsListContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 10px;">Carregando comentários...</div>';
    
    try {
      const ratings = await api.get(`/avaliacoes/listar?receitaId=${recipeId}`);
      const list = Array.isArray(ratings) ? ratings : [];
      
      if (commentsCountBadge) {
        commentsCountBadge.textContent = list.length;
      }

      const currentUser = api.getUser();
      const userRating = list.find(r => r.usuarioId === currentUser?.id);
      if (userRating) {
        selectedRating = userRating.nota || 5;
        updateStarsUI(selectedRating);
      } else {
        selectedRating = 5;
        updateStarsUI(5);
      }

      if (list.length === 0) {
        commentsListContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 14px;">Nenhum comentário ainda. Seja o primeiro a compartilhar sua opinião!</div>';
        return;
      }

      commentsListContainer.innerHTML = '';
      list.forEach(item => {
        const commentCard = document.createElement('div');
        commentCard.className = 'recipe-comment-item';
        commentCard.style.cssText = 'display: flex; gap: 10px; background: rgba(255, 255, 255, 0.02); padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05); align-items: flex-start;';
        
        const userName = item.usuario?.nome || 'Usuário da Comunidade';
        const starsHtml = Array.from({ length: 5 }, (_, i) => 
          `<i class="fa-solid fa-star" style="font-size: 0.75rem; color: ${i < item.nota ? 'var(--accent)' : 'rgba(255,255,255,0.2)'};"></i>`
        ).join('');

        commentCard.innerHTML = `
          <span class="comment-author-avatar" aria-hidden="true"></span>
          <div style="flex: 1; display: flex; flex-direction: column; gap: 3px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 600; font-size: 0.88rem; color: #fff; display: inline-flex; align-items: center; gap: 4px;">${api.renderUserIdentity(userName, item.usuario?.plano)}</span>
              <div style="display: flex; gap: 2px;">${starsHtml}</div>
            </div>
            <p style="margin: 0; font-size: 0.84rem; color: #d4d4d8; line-height: 1.4;">${item.comentario || 'Deixou uma avaliação.'}</p>
          </div>
        `;
        showAuthorAvatar(commentCard.querySelector('.comment-author-avatar'), {
          author: userName,
          authorAvatar: item.usuario?.foto,
        });
        commentsListContainer.appendChild(commentCard);
      });
    } catch (err) {
      commentsListContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 10px;">Não foi possível carregar os comentários.</div>';
    }
  }

  function updateStarsUI(rating) {
    if (!ratingStarsContainer) return;
    const stars = ratingStarsContainer.querySelectorAll('i');
    stars.forEach(star => {
      const starRating = parseInt(star.dataset.rating) || 0;
      if (starRating <= rating) {
        star.className = 'fa-solid fa-star';
        star.style.color = 'var(--accent)';
      } else {
        star.className = 'fa-regular fa-star';
        star.style.color = '';
      }
    });
  }
  renderCategories();
  initRatingSystem();
  loadInitialData();
  initSpecialEvents();
  initCommunityTabs();

  // Função central para reembaralhar e recarregar o feed imediatamente
  async function refreshExploreFeed(showFeedback = true) {
    const refreshBtn = document.getElementById('btn-refresh-feed');
    if (refreshBtn && showFeedback) {
      refreshBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate fa-spin"></i> Atualizando...';
      refreshBtn.disabled = true;
    }

    feedCurrentCount = feedPageLimit;

    try {
      const result = await loadInitialData({ onlyNew: showFeedback });
      if (refreshBtn && showFeedback) {
        refreshBtn.innerHTML = result?.ok
          ? (result.newPostsCount > 0 ? `<i class="fa-solid fa-check"></i> ${result.newPostsCount} nova(s)` : '<i class="fa-solid fa-arrows-rotate"></i> Sem novidades')
          : '<i class="fa-solid fa-triangle-exclamation"></i> Falha ao atualizar';
      }
    } finally {
      if (refreshBtn && showFeedback) {
        refreshBtn.disabled = false;
        setTimeout(() => {
          refreshBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Atualizar';
        }, 1500);
      }
    }
  }

  // Botão de Atualizar Feed Manual
  const refreshFeedBtn = document.getElementById('btn-refresh-feed');
  if (refreshFeedBtn) {
    refreshFeedBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      refreshExploreFeed(true);
    });
  }

  // Recarregar feed sempre que o usuário retornar à página (pageshow sem restrição persisted)
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      refreshExploreFeed(false);
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      refreshExploreFeed(false);
    }
  });

  // Atualizar quando a janela ganha foco
  window.addEventListener('focus', () => {
    refreshExploreFeed(false);
  });

  /* =====================================================================
     COMMUNITY TABS – Feed ↔ Eventos Especiais
  ===================================================================== */
  function initCommunityTabs() {
    const btnFeed = document.getElementById('btn-tab-feed');
    const btnEventos = document.getElementById('btn-tab-eventos');
    const viewFeed = document.getElementById('view-comunidade-feed');
    const viewEventos = document.getElementById('view-comunidade-eventos');
    if (!btnFeed || !btnEventos || !viewFeed || !viewEventos) return;
    const communityGrid = viewFeed.closest('.dashboard-grid');

    function showFeedTab() {
      viewFeed.style.display = '';
      viewEventos.style.display = 'none';
      communityGrid?.classList.remove('events-mode');
      document.body.classList.remove('community-events-mode');
      btnFeed.classList.add('active');
      btnEventos.classList.remove('active');
    }
    function showEventosTab() {
      viewFeed.style.display = 'none';
      viewEventos.style.display = '';
      communityGrid?.classList.add('events-mode');
      document.body.classList.add('community-events-mode');
      btnFeed.classList.remove('active');
      btnEventos.classList.add('active');
      loadSpecialEventsView();
    }
    btnFeed.addEventListener('click', showFeedTab);
    btnEventos.addEventListener('click', showEventosTab);
  }

  /* =====================================================================
     SPECIAL EVENTS – Eventos Especiais
  ===================================================================== */
  let currentEventData = null;
  let currentEventId = null;
  let pendingVoteEntradaId = null;

  function initSpecialEvents() {
    // Entry Modal – tab switching
    const btnExisting = document.getElementById('btn-choice-existing');
    const btnCreate = document.getElementById('btn-choice-create');
    const panelExisting = document.getElementById('entry-panel-existing');
    const panelCreate = document.getElementById('entry-panel-create');
    if (btnExisting && btnCreate) {
      btnExisting.addEventListener('click', () => {
        btnExisting.classList.add('active'); btnCreate.classList.remove('active');
        if (panelExisting) panelExisting.style.display = '';
        if (panelCreate) panelCreate.style.display = 'none';
      });
      btnCreate.addEventListener('click', () => {
        btnCreate.classList.add('active'); btnExisting.classList.remove('active');
        if (panelCreate) panelCreate.style.display = '';
        if (panelExisting) panelExisting.style.display = 'none';
      });
    }

    // Open Entry Modal button
    const openEntryBtn = document.getElementById('btn-open-event-entry-modal');
    if (openEntryBtn) {
      openEntryBtn.addEventListener('click', () => openEventEntryModal());
    }

    // Close Entry Modal
    const closeEntryModal = document.getElementById('close-event-entry-modal');
    const entryModal = document.getElementById('event-entry-modal');
    if (closeEntryModal && entryModal) {
      closeEntryModal.addEventListener('click', () => entryModal.classList.remove('open'));
      entryModal.addEventListener('click', (e) => { if (e.target === entryModal) entryModal.classList.remove('open'); });
    }

    // Close Recipe Detail Modal
    const closeRecipeModal = document.getElementById('close-event-recipe-modal');
    const recipeModal = document.getElementById('event-recipe-detail-modal');
    if (closeRecipeModal && recipeModal) {
      closeRecipeModal.addEventListener('click', () => recipeModal.classList.remove('open'));
      recipeModal.addEventListener('click', (e) => { if (e.target === recipeModal) recipeModal.classList.remove('open'); });
    }

    // Vote Confirm Modal – Cancel
    const cancelVoteBtn = document.getElementById('btn-cancel-vote');
    const voteModal = document.getElementById('event-vote-confirm-modal');
    if (cancelVoteBtn && voteModal) {
      cancelVoteBtn.addEventListener('click', () => { pendingVoteEntradaId = null; voteModal.classList.remove('open'); });
      voteModal.addEventListener('click', (e) => { if (e.target === voteModal) { pendingVoteEntradaId = null; voteModal.classList.remove('open'); } });
    }

    // Vote Confirm Modal – Execute
    const executeVoteBtn = document.getElementById('btn-execute-vote');
    if (executeVoteBtn) {
      executeVoteBtn.addEventListener('click', async () => {
        if (!pendingVoteEntradaId || !currentEventId) return;
        executeVoteBtn.disabled = true;
        executeVoteBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registrando...';
        try {
          await api.post(`/desafios/eventos/${currentEventId}/votar`, { entradaId: pendingVoteEntradaId });
          if (voteModal) voteModal.classList.remove('open');
          pendingVoteEntradaId = null;
          // Show success message
          if (window.SaboreNotify) window.SaboreNotify('Seu voto foi registrado! Obrigado por participar.', 'success');
          else alert('Seu voto foi registrado! Obrigado por participar.');
          // Reload event data
          await loadSpecialEventsView(currentEventId);
        } catch (err) {
          if (window.SaboreNotify) window.SaboreNotify(err.message || 'Não foi possível registrar seu voto.', 'error');
          else alert(err.message || 'Não foi possível registrar seu voto.');
        } finally {
          executeVoteBtn.disabled = false;
          executeVoteBtn.innerHTML = '<i class="fa-solid fa-check"></i> Sim, Confirmar Voto';
        }
      });
    }

    // Event selector pills
    const selectorBar = document.getElementById('event-selector-bar');
    if (selectorBar) {
      selectorBar.addEventListener('click', (e) => {
        const pill = e.target.closest('[data-event-id]');
        if (!pill) return;
        selectorBar.querySelectorAll('.event-tab-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        loadSpecialEventsView(pill.dataset.eventId);
      });
    }

    // "Open composer for event" button inside entry modal
    const openCreateBtn = document.getElementById('btn-open-create-for-event');
    if (openCreateBtn) {
      openCreateBtn.addEventListener('click', () => {
        if (entryModal) entryModal.classList.remove('open');
        if (openCommunityComposer && currentEventData) {
          openCommunityComposer({ hashtag: currentEventData.hashtag });
        }
      });
    }
  }

  async function loadSpecialEventsView(eventId) {
    // Default to first event if none specified
    const selectorBar = document.getElementById('event-selector-bar');
    if (!eventId && selectorBar) {
      const firstPill = selectorBar.querySelector('[data-event-id]');
      if (firstPill) eventId = firstPill.dataset.eventId;
    }
    if (!eventId) eventId = 1;
    currentEventId = eventId;

    try {
      const user = api.getUser();
      const url = user?.id ? `/desafios/eventos/${eventId}?usuarioId=${user.id}` : `/desafios/eventos/${eventId}`;
      const data = await api.get(url);
      currentEventData = data;
      renderSpecialEvent(data);
    } catch (err) {
      console.error('Erro ao carregar evento especial:', err);
    }
  }

  function formatEventDate(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  function renderSpecialEvent(data) {
    if (!data) return;
    const { fase, galeria = [], participantesCount = 0, totalVotos = 0, minhaEntrada, meuVoto } = data;
    const isNewYear = String(currentEventId || data.id) === '2' || /réveillon|reveillon/i.test(data.nome || data.titulo || '');
    const banner = document.getElementById('event-banner-card');
    if (banner) {
      banner.dataset.theme = isNewYear ? 'reveillon' : 'natal';
      const eventsView = document.getElementById('view-comunidade-eventos');
      if (eventsView) eventsView.dataset.eventTheme = banner.dataset.theme;
    }

    // Status pill
    const statusPill = document.getElementById('event-status-pill');
    if (statusPill) {
      const labels = { EM_BREVE: 'Inscrições em breve', INSCRICOES: 'Inscrições abertas', VOTACAO: 'Votação aberta', ENCERRADO: 'Evento encerrado' };
      statusPill.textContent = labels[fase] || fase;
      statusPill.className = `event-status-pill status-${(fase || '').toLowerCase()}`;
    }
    const votingIndicator = document.getElementById('event-voting-indicator');
    if (votingIndicator) {
      const indicator = fase === 'VOTACAO'
        ? (meuVoto ? ['fa-solid fa-check', 'Você já votou'] : ['fa-solid fa-check-to-slot', 'Votação aberta'])
        : fase === 'ENCERRADO'
          ? [data.resultado ? 'fa-solid fa-trophy' : 'fa-regular fa-clock', data.resultado ? 'Resultado anunciado' : 'Resultado em breve']
          : ['fa-regular fa-clock', 'Votação em breve'];
      votingIndicator.innerHTML = `<i class="${indicator[0]}"></i> ${indicator[1]}`;
      votingIndicator.dataset.phase = String(fase || '').toLowerCase();
    }

    // Banner content
    const bannerTitle = document.getElementById('event-banner-title');
    const bannerDesc = document.getElementById('event-banner-desc');
    const hashtagBadge = document.getElementById('event-hashtag-badge');
    const periodText = document.getElementById('event-period-text');
    const participantsCount = document.getElementById('event-participants-count');
    const votesCount = document.getElementById('event-votes-count');

    if (bannerTitle) bannerTitle.textContent = isNewYear ? 'Réveillon Saboré 2027' : 'Natal Saboré 2026';
    if (bannerDesc) {
      bannerDesc.textContent = isNewYear
        ? 'Celebre a virada com sua receita especial e concorra ao emblema da comunidade.'
        : 'Compartilhe sua melhor receita natalina e concorra ao emblema exclusivo do evento.';
    }
    if (hashtagBadge) hashtagBadge.textContent = data.hashtag || '';
    const dtInicio = data.inicioEm || data.comecaEm;
    const dtFim = data.fimEm || data.encerraEm;
    const dtInscInicio = data.inscricoesInicioEm || data.inscricoesIniciaEm;
    const dtInscFim = data.inscricoesFimEm || data.inscricoesEncerraEm;
    const dtVotInicio = data.votacaoInicioEm || data.votacaoIniciaEm;
    const dtVotFim = data.votacaoFimEm || data.votacaoEncerraEm;

    if (periodText) periodText.textContent = dtInicio && dtFim ? `${formatEventDate(dtInicio)} a ${formatEventDate(dtFim)}/${new Date(dtFim).getFullYear()}` : '';
    if (participantsCount) participantsCount.textContent = `${participantesCount} ${participantesCount === 1 ? 'participante' : 'participantes'}`;
    if (votesCount) votesCount.textContent = `${totalVotos} ${totalVotos === 1 ? 'voto computado' : 'votos computados'}`;

    // Timeline
    const stepInscricoes = document.getElementById('step-inscricoes');
    const stepVotacao = document.getElementById('step-votacao');
    const stepResultado = document.getElementById('step-resultado');
    const stepInscricoesDates = document.getElementById('step-inscricoes-dates');
    const stepVotacaoDates = document.getElementById('step-votacao-dates');
    const stepResultadoDates = document.getElementById('step-resultado-dates');

    if (stepInscricoesDates && dtInscInicio && dtInscFim) {
      stepInscricoesDates.textContent = `${formatEventDate(dtInscInicio)} a ${formatEventDate(dtInscFim)}`;
    }
    if (stepVotacaoDates && dtVotInicio && dtVotFim) {
      stepVotacaoDates.textContent = `${formatEventDate(dtVotInicio)} a ${formatEventDate(dtVotFim)}`;
    }
    if (stepResultadoDates && dtVotFim) {
      const nextDay = new Date(dtVotFim);
      nextDay.setDate(nextDay.getDate() + 1);
      stepResultadoDates.textContent = formatEventDate(nextDay.toISOString());
    }

    // Highlight active step
    [stepInscricoes, stepVotacao, stepResultado].forEach(s => s?.classList.remove('active'));
    if (fase === 'INSCRICOES' && stepInscricoes) stepInscricoes.classList.add('active');
    else if (fase === 'VOTACAO' && stepVotacao) stepVotacao.classList.add('active');
    else if (fase === 'ENCERRADO' && stepResultado) stepResultado.classList.add('active');

    // Prize names
    const prizeBadgeName = document.getElementById('event-prize-badge-name');
    const nomeEmblema = data.emblema || data.emblemaId || 'Emblema Especial';
    if (prizeBadgeName) prizeBadgeName.textContent = nomeEmblema;

    // User action card
    const actionCard = document.getElementById('event-user-action-card');
    const actionInfo = document.getElementById('event-user-action-info');
    const openEntryBtn = document.getElementById('btn-open-event-entry-modal');
    if (actionCard) {
      if (fase === 'EM_BREVE') {
        actionCard.style.display = '';
        if (actionInfo) actionInfo.innerHTML = '<h3>Inscrições em breve</h3><p>Confira o período do evento acima.</p>';
        if (openEntryBtn) openEntryBtn.style.display = 'none';
      } else if (fase === 'INSCRICOES') {
        actionCard.style.display = '';
        if (openEntryBtn) openEntryBtn.style.display = '';
        if (minhaEntrada) {
          if (actionInfo) actionInfo.innerHTML = `<h3><i class="fa-solid fa-circle-check"></i> Você já está participando</h3><p>Sua receita está na galeria. Você pode trocá-la até o início da votação.</p>`;
          if (openEntryBtn) openEntryBtn.innerHTML = '<i class="fa-solid fa-rotate"></i> Substituir Inscrição';
        } else {
          if (actionInfo) actionInfo.innerHTML = '<h3>Inscreva sua receita</h3><p>Concorra ao emblema exclusivo e ao destaque de vencedor.</p>';
          if (openEntryBtn) openEntryBtn.innerHTML = '<i class="fa-solid fa-plus-circle"></i> Participar do Evento';
        }
      } else if (fase === 'VOTACAO') {
        actionCard.style.display = '';
        if (openEntryBtn) openEntryBtn.style.display = 'none';
        if (meuVoto) {
          if (actionInfo) actionInfo.innerHTML = '<h3><i class="fa-solid fa-circle-check"></i> Você já votou</h3><p>Acompanhe a contagem na galeria.</p>';
        } else {
          if (actionInfo) actionInfo.innerHTML = '<h3>Votação aberta</h3><p>Escolha sua receita favorita. Seu voto é único.</p>';
        }
      } else {
        // ENCERRADO
        actionCard.style.display = 'none';
      }
    }

    // Winner card
    const winnerCard = document.getElementById('event-winner-card');
    if (winnerCard) {
      if (fase === 'ENCERRADO' && data.resultado) {
        winnerCard.style.display = '';
        const r = data.resultado;
        const titleEl = document.getElementById('event-winner-recipe-title');
        const authorEl = document.getElementById('event-winner-author');
        const votesEl = document.getElementById('event-winner-votes');
        if (titleEl) titleEl.textContent = r.tituloReceita || 'Receita Campeã';
        if (authorEl) authorEl.textContent = r.nomeAutor || 'Chef Vencedor';
        if (votesEl) votesEl.textContent = r.totalVotos || 0;
      } else {
        winnerCard.style.display = 'none';
      }
    }

    // Render voting gallery
    renderEventGallery(galeria, fase, meuVoto, data.id || currentEventId);
  }

  function renderEventGallery(galeria, fase, meuVoto, eventoId) {
    const container = document.getElementById('event-gallery-grid');
    const subtitle = document.getElementById('event-gallery-subtitle');
    if (!container) return;

    if (!galeria || galeria.length === 0) {
      container.innerHTML = '<div class="gallery-empty-state"><i class="fa-solid fa-utensils"></i><p>Nenhuma receita inscrita ainda. Seja o primeiro a participar!</p></div>';
      if (subtitle) subtitle.textContent = 'Apenas inscrições oficiais aprovadas aparecem na votação.';
      return;
    }

    const user = api.getUser();
    const podeVotar = fase === 'VOTACAO' && !meuVoto;

    if (subtitle) {
      if (fase === 'VOTACAO') subtitle.textContent = podeVotar ? `${galeria.length} receitas disputando — Vote na sua favorita!` : `${galeria.length} receitas — Votação em andamento.`;
      else if (fase === 'ENCERRADO') subtitle.textContent = `${galeria.length} receitas participaram do evento.`;
      else subtitle.textContent = `${galeria.length} receitas inscritas oficialmente.`;
    }

    container.innerHTML = galeria.map(entry => {
      const isOwn = user && String(entry.autor?.id) === String(user.id);
      const myVoteHere = meuVoto && meuVoto.entradaId === entry.id;
      const canVoteThis = podeVotar && !isOwn;

      const authorInitial = String(entry.autor?.nome || 'S').trim().charAt(0).toUpperCase();

      return `
        <div class="event-gallery-card" data-entry-id="${entry.id}">
          <div class="gallery-card-image ${entry.imagem ? '' : 'no-img'}">
            ${entry.imagem ? `<img src="${entry.imagem}" alt="${entry.titulo}" loading="lazy">` : '<i class="fa-solid fa-utensils"></i>'}
            <div class="gallery-vote-pill">${entry.votos} ${entry.votos === 1 ? 'voto' : 'votos'}</div>
            ${myVoteHere ? '<div class="my-vote-indicator"><i class="fa-solid fa-check-to-slot"></i> Meu voto</div>' : ''}
          </div>
          <div class="gallery-card-body">
            <div class="gallery-author-line">
              <div class="gallery-author-avatar" aria-hidden="true">${authorInitial}</div>
              <div class="gallery-author-info">
                <span class="gallery-author-name">${api.renderUserIdentity(entry.autor?.nome || 'Chef', entry.autor?.plano)}</span>
                ${isOwn ? '<span class="own-entry-pill">Sua inscrição</span>' : ''}
              </div>
            </div>
            <h4 class="gallery-recipe-title">${entry.titulo}</h4>
            <div class="gallery-card-actions">
              <button type="button" class="btn-gallery-view" data-entry-id="${entry.id}">
                <i class="fa-solid fa-eye"></i> Ver Receita
              </button>
              ${canVoteThis ? `<button type="button" class="btn-gallery-vote" data-entry-id="${entry.id}" data-entry-title="${entry.titulo}">
                <i class="fa-solid fa-check-to-slot"></i> Votar
              </button>` : ''}
              ${isOwn && fase === 'VOTACAO' ? '<span class="vote-own-lock"><i class="fa-solid fa-lock"></i> Não pode votar na própria receita</span>' : ''}
              ${meuVoto && !myVoteHere && !isOwn && fase === 'VOTACAO' ? '<span class="vote-already-pill"><i class="fa-solid fa-check"></i> Já votou</span>' : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Load author avatars
    container.querySelectorAll('.gallery-author-avatar[data-src]').forEach(el => {
      // avatars are rendered as initials, upgrade if photo available
    });

    // Bind "Ver Receita" buttons
    container.querySelectorAll('.btn-gallery-view').forEach(btn => {
      btn.addEventListener('click', () => {
        const entryId = Number(btn.dataset.entryId);
        const entry = galeria.find(e => e.id === entryId);
        if (entry) openEventRecipeModal(entry);
      });
    });

    // Bind "Votar" buttons
    container.querySelectorAll('.btn-gallery-vote').forEach(btn => {
      btn.addEventListener('click', () => {
        const entryId = Number(btn.dataset.entryId);
        const entryTitle = btn.dataset.entryTitle;
        openVoteConfirmModal(entryId, entryTitle);
      });
    });
  }

  function openEventRecipeModal(entry) {
    const modal = document.getElementById('event-recipe-detail-modal');
    const content = document.getElementById('event-recipe-modal-content');
    if (!modal || !content) return;

    const ingredientesHtml = Array.isArray(entry.ingredientes) && entry.ingredientes.length > 0
      ? entry.ingredientes.map(ing => {
          const nome = ing.ingrediente?.nome || ing.nome || ing;
          const qtd = ing.quantidade || '';
          const unid = ing.unidade || '';
          return `<li>${[qtd, unid, nome].filter(Boolean).join(' ')}</li>`;
        }).join('')
      : '<li>Ingredientes não informados.</li>';

    const passosHtml = entry.modoPreparo
      ? entry.modoPreparo.split('\n').filter(p => p.trim()).map((passo, i) => `<li><span class="step-num">${i + 1}</span>${passo}</li>`).join('')
      : '<li>Modo de preparo não informado.</li>';

    const authorInitial = String(entry.autor?.nome || 'S').trim().charAt(0).toUpperCase();

    content.innerHTML = `
      ${entry.imagem ? `<div class="event-recipe-modal-banner"><img src="${entry.imagem}" alt="${entry.titulo}"></div>` : ''}
      <div class="event-recipe-modal-header">
        <div class="gallery-author-line" style="margin-bottom: 10px;">
          <div class="gallery-author-avatar" style="width:40px;height:40px;font-size:1.1rem;">${authorInitial}</div>
          <span class="gallery-author-name">${api.renderUserIdentity(entry.autor?.nome || 'Chef', entry.autor?.plano)}</span>
        </div>
        <h2 style="font-family: 'Playfair Display', serif; color: var(--secondary); margin: 0 0 6px;">${entry.titulo}</h2>
        ${entry.descricao ? `<p style="color: rgba(242,244,243,.75); font-size: 0.9rem;">${entry.descricao}</p>` : ''}
        <div class="event-recipe-meta-row">
          ${entry.tempoPreparo ? `<span><i class="fa-regular fa-clock"></i> ${entry.tempoPreparo} min</span>` : ''}
          <span><i class="fa-solid fa-check-to-slot"></i> <strong>${entry.votos}</strong> ${entry.votos === 1 ? 'voto' : 'votos'}</span>
        </div>
      </div>
      <div class="event-recipe-modal-body">
        <div class="recipe-section">
          <h4><i class="fa-solid fa-list-ul"></i> Ingredientes</h4>
          <ul class="ingredient-list">${ingredientesHtml}</ul>
        </div>
        <div class="recipe-section">
          <h4><i class="fa-solid fa-pot-food"></i> Modo de Preparo</h4>
          <ol class="steps-list steps-modal">${passosHtml}</ol>
        </div>
      </div>
    `;

    modal.classList.add('open');
  }

  function openVoteConfirmModal(entradaId, entryTitle) {
    pendingVoteEntradaId = entradaId;
    const modal = document.getElementById('event-vote-confirm-modal');
    const msgEl = document.getElementById('vote-confirm-message');
    if (msgEl) msgEl.innerHTML = `Deseja confirmar seu voto em <strong>"${entryTitle}"</strong>? Cada usuário tem direito a 1 voto único por evento especial, que não poderá ser alterado após confirmação.`;
    if (modal) modal.classList.add('open');
  }

  async function openEventEntryModal() {
    if (!currentEventData) return;
    const modal = document.getElementById('event-entry-modal');
    if (!modal) return;

    const titleEl = document.getElementById('event-entry-modal-title');
    const alertEl = document.getElementById('event-entry-modal-alert');
    if (titleEl) titleEl.textContent = `Inscrição Oficial – ${currentEventData.nome || currentEventData.titulo || 'Evento'}`;
    if (alertEl) alertEl.style.display = 'none';

    // Load user's public recipes
    const listEl = document.getElementById('entry-existing-recipes-list');
    if (listEl) {
      listEl.innerHTML = '<p style="color:rgba(242,244,243,.6);font-size:.85rem;">Carregando suas receitas...</p>';
      try {
        const minhas = await api.get('/receitas/minhas');
        const publicas = (minhas || []).filter(r => r.publica || r.isPublic || r.publicada);
        if (publicas.length === 0) {
          listEl.innerHTML = '<p style="color:rgba(242,244,243,.6);font-size:.85rem;">Você não possui receitas públicas. Crie uma nova publicação e inscreva-a.</p>';
        } else {
          listEl.innerHTML = publicas.map(r => `
            <div class="entry-recipe-pick-item">
              ${r.imagem ? `<img src="${r.imagem}" alt="${r.titulo}">` : '<div class="entry-recipe-pick-thumb no-img"><i class="fa-solid fa-utensils"></i></div>'}
              <div class="entry-pick-info">
                <strong>${r.titulo}</strong>
                <span>${r.tempoPreparo ? r.tempoPreparo + ' min' : ''}</span>
              </div>
              <button type="button" class="btn-confirm-entry btn-select-entry" data-recipe-id="${r.id}" data-recipe-title="${r.titulo}">
                <i class="fa-solid fa-check"></i> Inscrever
              </button>
            </div>
          `).join('');

          // Bind inscription buttons
          listEl.querySelectorAll('.btn-select-entry').forEach(btn => {
            btn.addEventListener('click', async () => {
              const receitaId = Number(btn.dataset.recipeId);
              btn.disabled = true;
              btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
              try {
                await api.post(`/desafios/eventos/${currentEventId}/inscrever`, { receitaId });
                modal.classList.remove('open');
                if (window.SaboreNotify) window.SaboreNotify('Receita inscrita com sucesso! Aguarde aprovação.', 'success');
                else alert('Receita inscrita com sucesso! Aguarde aprovação.');
                await loadSpecialEventsView(currentEventId);
              } catch (err) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Inscrever';
                if (alertEl) { alertEl.textContent = err.message || 'Erro ao inscrever receita.'; alertEl.style.display = ''; }
              }
            });
          });
        }
      } catch (err) {
        listEl.innerHTML = '<p style="color:rgba(242,244,243,.6);font-size:.85rem;">Não foi possível carregar suas receitas. Tente criar uma nova publicação.</p>';
      }
    }

    modal.classList.add('open');
  }

  // Atualizar quando a janela ganha foco
  window.addEventListener('focus', () => {
    refreshExploreFeed(false);
  });
});

