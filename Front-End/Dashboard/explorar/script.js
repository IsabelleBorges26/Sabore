document.addEventListener('DOMContentLoaded', () => {
  let userState = {
    isPro: false,
    selectedExploreRecipe: null,
    books: [],
    favorites: [],
    chefs: [],
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
  let activeTabFilter = 'all';
  let activeHashtagFilter = null;
  let currentWeeklyChallengeData = null;

  const WEEKLY_CHALLENGES = [
    {
      id: "inverno",
      title: "Receitas de Inverno & Conforto ❄️",
      hashtag: "#DesafioInverno",
      badge: "Chef Invernal",
      description: "Crie um prato quente, sopa encorpada ou bebida cremosa para aquecer a comunidade Saboré!"
    },
    {
      id: "massas",
      title: "Festival de Massas Artesanais 🍝",
      hashtag: "#DesafioMassas",
      badge: "Mestre das Massas",
      description: "Prepare uma massa fresca caseira ou um molho artesanal autêntico da nonna."
    },
    {
      id: "fit",
      title: "Marmita Fit & Alta Performance 🥗",
      hashtag: "#DesafioFit",
      badge: "Chef Saudável",
      description: "Compartilhe uma refeição equilibrada, nutritiva e prática para o dia a dia fitness."
    },
    {
      id: "doces",
      title: "Doces & Sobremesas de Sonho 🍓",
      hashtag: "#DesafioDoces",
      badge: "Confeiteiro Saboré",
      description: "Surpreenda a comunidade com tortas, bolos, mousses ou doces artesanais irresistíveis."
    },
    {
      id: "oriental",
      title: "Uma Viagem à Cozinha Oriental 🥢",
      hashtag: "#DesafioOriental",
      badge: "Chef Oriental",
      description: "Traga o melhor da culinária asiática: sushis, woks, ramens ou yakisobas aromáticos."
    },
    {
      id: "brunch",
      title: "Café da Manhã de Cinema ☕",
      hashtag: "#DesafioBrunch",
      badge: "Mestre do Brunch",
      description: "Pães quentinhos, ovos especiais, panquecas ou tigelas de açaí para começar o dia no topo."
    },
    {
      id: "burger",
      title: "Hambúrguer Gourmet Caseiro 🍔",
      hashtag: "#DesafioBurger",
      badge: "Burger Master",
      description: "Monte um burger autoral: combine seu blend especial, molhos caseiros e queijos derretidos."
    },
    {
      id: "sustentavel",
      title: "Cozinha Sustentável & Zero Desperdício 🌿",
      hashtag: "#DesafioSustentavel",
      badge: "Chef Consciente",
      description: "Use talos, cascas e sobras nobres para criar pratos deliciosos e sustentáveis."
    },
    {
      id: "risotos",
      title: "Mestres do Risoto Cremoso 🍚",
      hashtag: "#DesafioRisoto",
      badge: "Rei do Risoto",
      description: "Acerte no ponto perfeito da textura e emulsão de um risoto sofisticado."
    },
    {
      id: "petiscos",
      title: "Comida de Boteco & Petiscos 🥟",
      hashtag: "#DesafioPetiscos",
      badge: "Chef Boêmio",
      description: "Pastéis, croquetes, bolinhos de arroz e petiscos crocantes para celebrar com amigos."
    },
    {
      id: "brasil",
      title: "Sabores Regionais do Brasil 🥘",
      hashtag: "#DesafioBrasil",
      badge: "Chef Raiz",
      description: "Celebre nossa culinária: moquecas, baião de dois, feijão tropeiro e temperos típicos."
    },
    {
      id: "rapido",
      title: "Prato Incrível em 15 Minutos ⏱️",
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
    // Categorias descrevem a receita; hashtag é uma escolha explícita de quem publica.
    // Não transforme "Importação", "Sobremesa" etc. em hashtag automaticamente.
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
    const addPostToFeed = (recipe) => {
      const categories = recipe.categories || [recipe.category || 'Geral'];
      const tags = extractRecipeTags(recipe);
      userState.recipes.unshift({
        id: recipe.id, title: recipe.title, description: recipe.description || '', time: recipe.time || 0,
        difficulty: recipe.difficulty || 'Fácil', category: recipe.category || categories[0], categories, hashtags: recipe.hashtags || [],
        tags, image: recipe.image || null,
        authorId: recipe.authorId, author: recipe.author || api.getUser()?.nome || 'Você', authorAvatar: recipe.authorAvatar || api.getUser()?.foto || null,
        diet: recipe.category || categories[0], likes: 0, avaliacoes: 0, ingredients: recipe.ingredients || [], steps: recipe.steps || []
      });
      renderRecipes();
      updateTrendingHashtags();
      renderWeeklyChallenge();
    };
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
    button.addEventListener('click', async () => {
      try {
        await loadBookRecipes();
        openModal('create-post-modal');
      } catch (error) {
        alert(`Não foi possível carregar suas receitas salvas: ${error.message}`);
      }
    });
    document.getElementById('close-create-post-modal').addEventListener('click', () => closeModal('create-post-modal'));
    document.getElementById('publish-existing-recipe-btn').addEventListener('click', async () => {
      const recipeId = Number(document.getElementById('post-existing-recipe').value);
      if (!recipeId) return alert('Selecione uma receita de um livro para publicar.');
      try {
        const published = await api.put(`/receitas/atualizar/${recipeId}`, { public: true });
        addPostToFeed(published);
        closeModal('create-post-modal');
        alert('Receita do livro publicada na comunidade.');
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
        const created = await api.post('/receitas/cadastrar', {
          titulo: value('post-title'), descricao: value('post-description'), tempoPreparo: Number(value('post-time')),
          dificuldade: value('post-difficulty'), categorias: [value('post-category')], hashtags, imagem: value('post-image') || null,
          ingredientes: ingredients, modoPreparo: steps.join('\n'), criadaPorIA: false, publica: true
        });
        addPostToFeed(created);
        closeModal('create-post-modal');
        alert('Publicação criada. Ela já está visível para a comunidade.');
        event.target.reset();
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
  const tabBtns = document.querySelectorAll('.feed-filter-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTabFilter = btn.dataset.feed;
      renderRecipes();
    });
  });
  const recipesContainer = document.getElementById('explore-recipes-container');
  function renderRecipes() {
    if (!recipesContainer) return;
    recipesContainer.innerHTML = '';
    const searchQuery = globalSearchInput ? globalSearchInput.value.toLowerCase().trim() : '';
    let filtered = userState.recipes.filter(rec => {
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
      let matchesTab = true;
      if (activeTabFilter === 'fit') {
        matchesTab = rec.diet.toLowerCase().includes('fit') || rec.diet.toLowerCase().includes('sem glúten');
      } else if (activeTabFilter === 'vegetariano') {
        matchesTab = rec.diet.toLowerCase().includes('vegano') || rec.diet.toLowerCase().includes('vegetariano');
      } else if (activeTabFilter === 'doce') {
        matchesTab = rec.diet.toLowerCase().includes('doce') || rec.category.toLowerCase().includes('sobremesa');
      } else if (activeTabFilter === 'facil') {
        matchesTab = rec.difficulty === 'Fácil';
      }
      let matchesHashtag = true;
      if (activeHashtagFilter) {
        matchesHashtag = Array.isArray(rec.tags) && rec.tags.some(t => t.toLowerCase() === activeHashtagFilter.toLowerCase());
      }
      return matchesSearch && matchesCategory && matchesTab && matchesHashtag;
    });
    const interests = (JSON.parse(localStorage.getItem('sabore_user_preferences') || '[]'))
      .map(item => String(item).trim().toLocaleLowerCase('pt-BR'))
      .filter(Boolean);
    if (interests.length) {
      filtered.sort((first, second) => {
        const score = (recipe) => {
          const tags = (recipe.tags || []).join(' ').toLocaleLowerCase('pt-BR');
          const categories = (recipe.categories || []).join(' ').toLocaleLowerCase('pt-BR');
          const text = `${recipe.title || ''} ${recipe.description || ''}`.toLocaleLowerCase('pt-BR');
          return interests.reduce((total, interest) => total
            + (tags.includes(interest) ? 4 : 0)
            + (categories.includes(interest) ? 2 : 0)
            + (text.includes(interest) ? 1 : 0), 0);
        };
        return score(second) - score(first);
      });
    }
    if (filtered.length === 0) {
      recipesContainer.innerHTML = `
        <div class="book-detail-empty" style="grid-column: 1 / -1; padding: 60px 20px;">
          <div class="empty-icon-glow"><i class="fa-solid fa-face-rolling-eyes"></i></div>
          <h3>Nenhuma receita em destaque encontrada</h3>
          <p>Tente redefinir seus filtros ou pesquisar por outro termo.</p>
        </div>
      `;
      return;
    }
    filtered.forEach(rec => {
      const card = document.createElement('article');
      card.className = 'explore-recipe-card';
      let diffClass = 'easy';
      if (rec.difficulty === 'Médio') diffClass = 'medium';
      else if (rec.difficulty === 'Difícil') diffClass = 'hard';
      const isFav = userState.favorites.includes(rec.id);
      card.innerHTML = `
        <div class="explore-image-wrap ${rec.image ? '' : 'without-recipe-image'}">
          ${rec.image ? `<img src="${rec.image}" alt="${rec.title}" class="explore-img">` : '<i class="fa-solid fa-utensils" aria-hidden="true"></i>'}
          <div class="recipe-likes-badge"><i class="fa-solid fa-thumbs-up"></i> ${rec.likes}</div>
          <button class="favorite-toggle-btn ${isFav ? 'active' : ''}" title="Curtir publicação"><i class="fa-solid fa-heart"></i></button>
        </div>
        <div class="explore-content-area">
          <div class="recipe-author-line">
            ${rec.authorAvatar ? `<img src="${rec.authorAvatar}" alt="${rec.author}" class="author-avatar" onerror="this.style.display='none';this.insertAdjacentHTML('afterend','<span class=\\'author-avatar author-avatar-placeholder\\'>${rec.author.charAt(0).toUpperCase()}</span>')">` : `<span class="author-avatar author-avatar-placeholder">${rec.author.charAt(0).toUpperCase()}</span>`}
            <span class="author-name">${rec.author}</span>
          </div>
          <h4>${rec.title}</h4>
          <p class="post-caption">${rec.description || 'Receita compartilhada pela comunidade Saboré.'}</p>
          <div class="explore-meta-bottom">
            <span><i class="fa-regular fa-clock"></i> ${rec.time} min</span>
            <span class="recipe-difficulty ${diffClass}">${rec.difficulty}</span>
          </div>
          <div class="post-social-actions">
            ${rec.authorId && rec.authorId !== api.getUser()?.id ? `<button class="follow-author-btn"><i class="fa-solid fa-user-plus"></i> Seguir</button>` : ''}
            <button class="share-post-btn"><i class="fa-solid fa-share-nodes"></i> Compartilhar</button>
            <button class="whatsapp-post-btn" aria-label="Compartilhar no WhatsApp"><i class="fa-brands fa-whatsapp"></i> WhatsApp</button>
          </div>
        </div>
      `;
      const favBtn = card.querySelector('.favorite-toggle-btn');
      favBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          if (favBtn.classList.contains('active')) {
            await api.delete(`/favoritos/excluir/${rec.id}`);
            favBtn.classList.remove('active');
            userState.favorites = userState.favorites.filter(id => id !== rec.id);
            rec.likes = Math.max(0, (rec.likes || 0) - 1);
          } else {
            await api.post("/favoritos/cadastrar", { receitaId: rec.id });
            favBtn.classList.add('active');
            userState.favorites.push(rec.id);
            rec.likes = (rec.likes || 0) + 1;
          }
          const badge = card.querySelector('.recipe-likes-badge');
          if (badge) badge.innerHTML = `<i class="fa-solid fa-thumbs-up"></i> ${rec.likes}`;
          updateTrendingHashtags();
        } catch (err) {
          alert("Erro ao favoritar receita: " + err.message);
        }
      });
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
            updateFollowButton(following);
          } catch (error) {
            alert(`Não foi possível atualizar o seguimento: ${error.message}`);
          }
        });
      }
      card.querySelector('.share-post-btn').addEventListener('click', async (event) => {
        event.stopPropagation();
        const url = new URL(`../../receita/?id=${rec.id}`, window.location.href).href;
        const shareData = { title: rec.title, text: `Veja a receita ${rec.title}, publicada por ${rec.author} no Saboré.`, url };
        try {
          if (navigator.share) await navigator.share(shareData);
          else if (navigator.clipboard) {
            await navigator.clipboard.writeText(`${shareData.text} ${url}`);
            alert('Link da publicação copiado.');
          }
        } catch (error) {
          if (error.name !== 'AbortError') alert('Não foi possível compartilhar esta publicação.');
        }
      });
      card.querySelector('.whatsapp-post-btn').addEventListener('click', (event) => {
        event.stopPropagation();
        const url = new URL(`../../receita/?id=${rec.id}`, window.location.href).href;
        const message = `Veja a receita ${rec.title}, publicada por ${rec.author} no Saboré. ${url}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
      });
      card.addEventListener('click', () => {
        openRecipeDetailsModal(rec);
      });
      recipesContainer.appendChild(card);
    });
    updateCursorHoverListeners();
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
      nameEl.textContent = chef.name;
      card.appendChild(nameEl);
      const memberEl = document.createElement('p');
      memberEl.textContent = 'Membro da comunidade Saboré';
      card.appendChild(memberEl);
      const followButton = document.createElement('button');
      followButton.className = `btn-follow-chef ${chef.followed ? 'following' : ''}`;
      followButton.textContent = chef.followed ? 'Seguindo' : 'Seguir';
      followButton.addEventListener('click', async () => {
        try {
          const following = !chef.followed;
          await (following ? api.post(`/social/seguir/${chef.id}`, {}) : api.delete(`/social/seguir/${chef.id}`));
          chef.followed = following;
          renderChefs();
          renderRecipes();
        } catch (error) {
          alert(`Não foi possível atualizar o seguimento: ${error.message}`);
        }
      });
      card.appendChild(followButton);
      chefsContainer.appendChild(card);
    });
    updateCursorHoverListeners();
  }
  function formatFollowers(num) {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k seguidores';
    }
    return num + ' seguidores';
  }
  function renderWeeklyChallenge() {
    const card = document.getElementById('weekly-challenge-card');
    if (!card) return;

    const challenge = currentWeeklyChallengeData || getWeeklyChallenge();
    currentWeeklyChallengeData = challenge;

    const titleEl = document.getElementById('challenge-title');
    const descEl = document.getElementById('challenge-description');
    const badgeTextEl = document.getElementById('challenge-badge-text');
    const hashtagEl = document.getElementById('challenge-hashtag');
    const timeLeftEl = document.getElementById('challenge-time-left');
    const participantsEl = document.getElementById('challenge-participants');
    const countEl = document.getElementById('challenge-recipes-count');
    const joinBtn = document.getElementById('challenge-join-btn');

    if (titleEl) titleEl.textContent = challenge.title;
    if (descEl) descEl.textContent = challenge.description;
    if (badgeTextEl) badgeTextEl.textContent = `DESAFIO DA SEMANA • SEMANA ${challenge.weekNumber}`;
    if (hashtagEl) {
      hashtagEl.textContent = challenge.hashtag;
      hashtagEl.onclick = () => {
        const norm = challenge.hashtag.toLowerCase();
        activeHashtagFilter = (activeHashtagFilter === norm) ? null : norm;
        renderTags();
        renderRecipes();
        const grid = document.getElementById('explore-recipes-container');
        if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
    }
    if (timeLeftEl) {
      timeLeftEl.innerHTML = `<i class="fa-regular fa-clock"></i> ${challenge.timeRemainingText}`;
    }

    const matchingRecipes = userState.recipes.filter(rec => {
      const tags = rec.tags || [];
      return tags.some(t => t.toLowerCase() === challenge.hashtag.toLowerCase());
    });
    const distinctLocalAuthors = new Set(matchingRecipes.map(r => r.authorId || r.author).filter(Boolean));
    const recipesCount = typeof challenge.recipesCount === 'number' ? challenge.recipesCount : matchingRecipes.length;
    const participants = typeof challenge.participantsCount === 'number' ? challenge.participantsCount : distinctLocalAuthors.size;

    if (countEl) {
      countEl.innerHTML = `<i class="fa-solid fa-utensils"></i> ${recipesCount} ${recipesCount === 1 ? 'receita criada' : 'receitas criadas'}`;
    }
    if (participantsEl) {
      participantsEl.innerHTML = `<i class="fa-solid fa-user-group"></i> ${participants} ${participants === 1 ? 'participante' : 'participantes'}`;
    }

    if (joinBtn) {
      const user = api.getUser();
      const storageKey = `sabore_challenge_joined_${challenge.id}_${challenge.year}_w${challenge.weekNumber}_${user?.id || 'guest'}`;
      let isJoined = localStorage.getItem(storageKey) === 'true';

      const updateJoinBtnUI = () => {
        if (isJoined) {
          joinBtn.classList.add('joined');
          joinBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Inscrito no Desafio! ✓';
        } else {
          joinBtn.classList.remove('joined');
          joinBtn.innerHTML = '<i class="fa-solid fa-trophy"></i> Participar do Desafio';
        }
      };
      updateJoinBtnUI();

      joinBtn.onclick = () => {
        isJoined = !isJoined;
        if (isJoined) {
          localStorage.setItem(storageKey, 'true');
          updateJoinBtnUI();
          const hashtagsInput = document.getElementById('post-hashtags');
          if (hashtagsInput) {
            if (!hashtagsInput.value.includes(challenge.hashtag)) {
              hashtagsInput.value = hashtagsInput.value ? `${hashtagsInput.value.trim()} ${challenge.hashtag}` : challenge.hashtag;
            }
          }
          if (window.SaboreNotify) {
            window.SaboreNotify(`Inscrição confirmada no ${challenge.title}! Crie suas receitas com a hashtag ${challenge.hashtag}.`, 'success');
          } else {
            alert(`Inscrição confirmada no ${challenge.title}! Compartilhe sua receita com a hashtag ${challenge.hashtag}.`);
          }
        } else {
          localStorage.removeItem(storageKey);
          updateJoinBtnUI();
          if (window.SaboreNotify) {
            window.SaboreNotify(`Inscrição no desafio ${challenge.title} cancelada.`, 'info');
          }
        }
      };
    }
    updateCursorHoverListeners();
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
    userState.trendingTagsData = Array.from(map.values())
      .filter(item => item.interactions > 0)
      .sort((a, b) => b.interactions - a.interactions || b.count - a.count);

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
    userState.selectedExploreRecipe = rec;
    detailAuthorAvatar.src = rec.authorAvatar;
    detailAuthorName.textContent = 'Por ' + rec.author;
    detailTitle.textContent = rec.title;
    detailTime.textContent = rec.time + ' min';
    detailDifficulty.textContent = rec.difficulty;
    detailDietTag.textContent = rec.diet;
    detailIngredientsList.innerHTML = '';
    rec.ingredients.forEach(ing => {
      const li = document.createElement('li');
      li.textContent = ing;
      detailIngredientsList.appendChild(li);
    });
    detailStepsList.innerHTML = '';
    rec.steps.forEach(step => {
      const li = document.createElement('li');
      li.textContent = step;
      detailStepsList.appendChild(li);
    });
    selectedRating = 0;
    updateStarsUI(0);
    if (submitRatingBtn) submitRatingBtn.style.display = 'none';
    api.get(`/avaliacoes/listar?receitaId=${rec.id}`).then(ratings => {
      const currentUser = api.getUser();
      const existing = ratings.find(r => r.usuarioId === currentUser.id);
      if (existing) {
        selectedRating = existing.nota;
        updateStarsUI(existing.nota);
      }
    }).catch(err => {
    });
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
  async function loadInitialData() {
    const user = api.getUser();
    if (!user) {
      window.location.href = "../../login/index.html";
      return;
    }
    const navAvatar = document.querySelector('.user-avatar');
    if (navAvatar && user.foto) navAvatar.src = user.foto;
    const navName = document.querySelector('.user-name');
    if (navName) navName.textContent = user.nome;
    try {
      // Informações secundárias não podem impedir o carregamento das receitas públicas.
      const [profileResult, booksResult, favoritesResult, recipesResult] = await Promise.allSettled([
        api.get("/usuarios/perfil"),
        api.get("/livros/listar"),
        api.get("/favoritos/listar"),
        api.get("/receitas/publicas")
      ]);
      const profileData = profileResult.status === 'fulfilled' ? profileResult.value : null;
      userState.isPro = profileData?.plano === "PRO";
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
      const publicRecipes = recipesResult.value.filter(rec => {
        const title = String(rec.title || rec.titulo || '').trim().toLowerCase();
        const authorId = rec.authorId || rec.usuarioId;
        // Exclui dados mockados/seeds legados e testes
        if (authorId === 1) return false;
        if (title === 'teste' || title.startsWith('teste ') || title === 'cereal') return false;
        return Boolean(title);
      });
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
          diet: rec.category,
          tags,
          hashtags,
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
        const desafioData = await api.get("/receitas/desafio-semanal");
        currentWeeklyChallengeData = desafioData;
      } catch (err) {
        currentWeeklyChallengeData = getWeeklyChallenge();
      }
      renderWeeklyChallenge();
      try {
        const currentUser = api.getUser();
        const usuarios = await api.get("/social/perfis");
        userState.chefs = usuarios
          .filter(u => u.id !== currentUser.id) // Exclui o próprio usuário logado
          .map(u => ({
            id: u.id,
            name: u.nome,
            recipes: 0, // Será preenchido quando houver rota de contagem
            avatar: u.foto || null,
            followed: false,
            recipes: u.receitasPublicas || 0,
            followed: Boolean(u.seguindoVoce)
          }));
      } catch (err) {
      }
      renderChefs();
      // Os cards podem ter sido renderizados antes do retorno dos perfis sociais.
      // Renderize novamente para refletir corretamente quem o usuário já segue.
      renderRecipes();
      renderTags();
    } catch (err) {
    }
  }
  let selectedRating = 0;
  const ratingStarsContainer = document.getElementById('recipe-rating-stars');
  const submitRatingBtn = document.getElementById('recipe-submit-rating');
  function initRatingSystem() {
    if (!ratingStarsContainer || !submitRatingBtn) return;
    const stars = ratingStarsContainer.querySelectorAll('i');
    stars.forEach(star => {
      star.addEventListener('click', () => {
        const rating = parseInt(star.dataset.rating);
        selectedRating = rating;
        updateStarsUI(rating);
        submitRatingBtn.style.display = 'block';
      });
    });
    submitRatingBtn.addEventListener('click', async () => {
      const rec = userState.selectedExploreRecipe;
      if (!rec || selectedRating === 0) return;
      try {
        await api.post("/avaliacoes/cadastrar", {
          receitaId: rec.id,
          nota: selectedRating,
          comentario: ""
        });
        alert("Avaliação enviada com sucesso!");
        submitRatingBtn.style.display = 'none';
        rec.avaliacoes = (rec.avaliacoes || 0) + 1;
        updateTrendingHashtags();
      } catch (err) {
        alert("Erro ao enviar avaliação: " + err.message);
      }
    });
  }
  function updateStarsUI(rating) {
    if (!ratingStarsContainer) return;
    const stars = ratingStarsContainer.querySelectorAll('i');
    stars.forEach(star => {
      const starRating = parseInt(star.dataset.rating);
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
  renderWeeklyChallenge();
  initRatingSystem();
  loadInitialData();
});

