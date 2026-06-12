/* SABORÉ — Explore Recipes Page Script */

document.addEventListener('DOMContentLoaded', () => {

  // ─── STATE MANAGEMENT ───
  let userState = {
    isPro: false,
    selectedExploreRecipe: null,
    books: [],
    favorites: [],
    chefs: [
      { id: 1, name: 'Ana Silva', recipes: 12, followers: 1420, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80', followed: false },
      { id: 2, name: 'Carlos Rocha', recipes: 31, followers: 4210, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', followed: false },
      { id: 3, name: 'Helena Costa', recipes: 18, followers: 852, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', followed: false },
      { id: 4, name: 'Pedro Santos', recipes: 24, followers: 2150, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', followed: false }
    ],
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
    hashtags: ['#fit', '#vegano', '#rapido', '#massas', '#sobremesa', '#facil', '#jantar', '#entrada', '#oriental']
  };

  let activeCategoryFilter = 'all';
  let activeTabFilter = 'all';
  let activeHashtagFilter = null;

  // ─── DYNAMIC CUSTOM CURSOR ───
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
  
  userState.isPro = false;
  updatePlanUI();

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

  // ─── GLOBAL SEARCH ───
  const globalSearchInput = document.getElementById('global-search');
  if (globalSearchInput) {
    globalSearchInput.addEventListener('input', () => {
      renderRecipes();
    });
  }

  // Focus Search Shortcut
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (globalSearchInput) globalSearchInput.focus();
    }
  });

  // ─── MODALS SYSTEM ───
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

  // ─── RENDER CATEGORIES CAROUSEL ───
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
          activeCategoryFilter = 'all'; // toggle off
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

  // ─── FEED CONTROL TABS ───
  const tabBtns = document.querySelectorAll('.feed-filter-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTabFilter = btn.dataset.feed;
      renderRecipes();
    });
  });

  // ─── RENDER RECIPES GRID ───
  const recipesContainer = document.getElementById('explore-recipes-container');

  function renderRecipes() {
    if (!recipesContainer) return;
    recipesContainer.innerHTML = '';

    const searchQuery = globalSearchInput ? globalSearchInput.value.toLowerCase().trim() : '';

    let filtered = userState.recipes.filter(rec => {
      // 1. Search filter
      const matchesSearch = rec.title.toLowerCase().includes(searchQuery) || 
                            rec.author.toLowerCase().includes(searchQuery) ||
                            rec.category.toLowerCase().includes(searchQuery);

      // 2. Category Carousel Filter
      let matchesCategory = true;
      if (activeCategoryFilter !== 'all') {
        const queryVal = activeCategoryFilter.toLowerCase();
        matchesCategory = rec.title.toLowerCase().includes(queryVal) ||
                          rec.category.toLowerCase().includes(queryVal) ||
                          rec.diet.toLowerCase().includes(queryVal);
      }

      // 3. Tab Filter
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

      // 4. Hashtag Filter
      let matchesHashtag = true;
      if (activeHashtagFilter) {
        matchesHashtag = rec.tags.includes(activeHashtagFilter);
      }

      return matchesSearch && matchesCategory && matchesTab && matchesHashtag;
    });

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
        <div class="explore-image-wrap">
          <img src="${rec.image}" alt="${rec.title}" class="explore-img">
          <div class="recipe-likes-badge"><i class="fa-solid fa-thumbs-up"></i> ${rec.likes}</div>
          <button class="favorite-toggle-btn ${isFav ? 'active' : ''}"><i class="fa-solid fa-heart"></i></button>
        </div>
        <div class="explore-content-area">
          <div class="recipe-author-line">
            <img src="${rec.authorAvatar}" alt="${rec.author}" class="author-avatar">
            <span class="author-name">${rec.author}</span>
          </div>
          <h4>${rec.title}</h4>
          <div class="explore-meta-bottom">
            <span><i class="fa-regular fa-clock"></i> ${rec.time} min</span>
            <span class="recipe-difficulty ${diffClass}">${rec.difficulty}</span>
          </div>
        </div>
      `;

      // Favorite heart action
      const favBtn = card.querySelector('.favorite-toggle-btn');
      favBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          if (favBtn.classList.contains('active')) {
            await api.delete(`/favoritos/excluir/${rec.id}`);
            favBtn.classList.remove('active');
            userState.favorites = userState.favorites.filter(id => id !== rec.id);
          } else {
            await api.post("/favoritos/cadastrar", { receitaId: rec.id });
            favBtn.classList.add('active');
            userState.favorites.push(rec.id);
          }
        } catch (err) {
          alert("Erro ao favoritar receita: " + err.message);
        }
      });

      // View details modal
      card.addEventListener('click', () => {
        openRecipeDetailsModal(rec);
      });

      recipesContainer.appendChild(card);
    });

    updateCursorHoverListeners();
  }

  // ─── CHEFS SPOTLIGHT ROW ───
  const chefsContainer = document.getElementById('chefs-spotlight-container');

  function renderChefs() {
    if (!chefsContainer) return;
    chefsContainer.innerHTML = '';

    userState.chefs.forEach(chef => {
      const card = document.createElement('div');
      card.className = 'chef-card-item';
      
      card.innerHTML = `
        <img src="${chef.avatar}" alt="${chef.name}" class="chef-avatar-large">
        <h4>${chef.name}</h4>
        <p>${chef.recipes} receitas · <span class="followers-count">${formatFollowers(chef.followers)}</span></p>
        <button class="btn-follow-chef ${chef.followed ? 'following' : ''}">
          ${chef.followed ? 'Seguindo' : '<i class="fa-solid fa-plus"></i> Seguir'}
        </button>
      `;

      const followBtn = card.querySelector('.btn-follow-chef');
      followBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        chef.followed = !chef.followed;
        if (chef.followed) {
          chef.followers += 1;
        } else {
          chef.followers -= 1;
        }
        renderChefs();
      });

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

  // ─── WEEKLY CHALLENGE ───
  const joinBtn = document.getElementById('challenge-join-btn');
  if (joinBtn) {
    joinBtn.addEventListener('click', () => {
      const isJoined = joinBtn.classList.toggle('joined');
      if (isJoined) {
        joinBtn.textContent = 'Inscrito no Desafio! ✓';
        alert('Parabéns! Você se inscreveu no Desafio Saboré de Inverno. Crie sua receita temática e compartilhe na comunidade com a hashtag #DesafioInverno.');
      } else {
        joinBtn.textContent = 'Participar do Desafio';
      }
    });
  }

  // ─── RENDER HASHTAGS TAG CLOUD ───
  const tagCloud = document.getElementById('popular-tags-cloud');

  function renderTags() {
    if (!tagCloud) return;
    tagCloud.innerHTML = '';

    userState.hashtags.forEach(tag => {
      const chip = document.createElement('button');
      chip.className = 'tag-item-chip';
      if (activeHashtagFilter === tag) {
        chip.classList.add('active');
      }

      chip.textContent = tag;

      chip.addEventListener('click', () => {
        if (activeHashtagFilter === tag) {
          activeHashtagFilter = null; // deselect
        } else {
          activeHashtagFilter = tag;
        }
        renderTags();
        renderRecipes();
      });

      tagCloud.appendChild(chip);
    });
    updateCursorHoverListeners();
  }

  // ─── RECIPE DETAILS POPUP ───
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

    // Load ingredients
    detailIngredientsList.innerHTML = '';
    rec.ingredients.forEach(ing => {
      const li = document.createElement('li');
      li.textContent = ing;
      detailIngredientsList.appendChild(li);
    });

    // Load steps
    detailStepsList.innerHTML = '';
    rec.steps.forEach(step => {
      const li = document.createElement('li');
      li.textContent = step;
      detailStepsList.appendChild(li);
    });

    // Reset and load rating
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
      console.error("Erro ao carregar avaliações da receita:", err);
    });

    openModal('recipe-details-modal');
  }

  // ─── SAVE TO BOOK ROUTINE ───
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
      const profileData = await api.get("/usuarios/perfil");
      userState.isPro = profileData.plano === "PRO";
      updatePlanUI();

      const books = await api.get("/livros/listar");
      userState.books = books.map(b => ({
        id: b.id,
        title: b.titulo,
        count: b._count.receitas,
        emoji: b.emoji || 'fa-solid fa-book',
        tag: b.tag
      }));

      const favorites = await api.get("/favoritos/listar");
      userState.favorites = favorites.map(f => f.id);

      const publicRecipes = await api.get("/receitas/publicas");
      userState.recipes = publicRecipes.map(rec => {
        const categoriesList = rec.categories || [];
        return {
          id: rec.id,
          title: rec.title,
          time: rec.time,
          difficulty: rec.difficulty,
          category: rec.category,
          likes: rec.likes || '120',
          image: rec.image,
          author: rec.author,
          authorAvatar: rec.authorAvatar,
          diet: rec.category,
          tags: categoriesList.map(c => '#' + c.toLowerCase()),
          ingredients: rec.ingredients,
          steps: rec.steps,
          categories: categoriesList
        };
      });

      renderRecipes();
      renderChefs();
      renderTags();
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    }
  }

  // ─── RATING SYSTEM ───
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

  // ─── RUN COMPONENT INITIALIZATION ───
  renderCategories();
  initRatingSystem();
  loadInitialData();
});
