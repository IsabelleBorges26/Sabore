

document.addEventListener('DOMContentLoaded', () => {

  const user = api.getUser();
  if (!user) {
    window.location.href = "../../login/index.html";
    return;
  }

  const savedAvatar = localStorage.getItem('sabore_user_avatar');
  if (savedAvatar) {
    const userAvatars = document.querySelectorAll('.user-avatar, .large-user-avatar');
    userAvatars.forEach(img => img.src = savedAvatar);
  }

  let userState = {
    isPro: false,
    favoritesCount: 6
  };

  const recipesDatabase = {
    "1": {
      title: "Lasanha de Berinjela",
      time: "45 min",
      difficulty: "Fácil",
      category: "Almoço",
      vegetarian: true,
      ingredients: [
        "3 berinjelas grandes fatiadas em lâminas finas",
        "500g de molho de tomate caseiro",
        "300g de queijo muçarela ralado",
        "150g de queijo ricota amassado com ervas",
        "Azeite de oliva extra virgem",
        "Sal e pimenta-do-reino a gosto",
        "Folhas de manjericão fresco"
      ],
      steps: [
        "Grelhe as fatias de berinjela em um fio de azeite até dourarem sutilmente.",
        "Em uma assadeira refratária, comece com uma fina camada de molho de tomate.",
        "Monte as camadas alternando: berinjela grelhada, ricota temperada, molho e muçarela.",
        "Repita o processo finalizando com queijo muçarela e manjericão.",
        "Leve ao forno preaquecido a 200°C por cerca de 20 minutos ou até gratinar."
      ]
    },
    "2": {
      title: "Bolo de Cenoura Fit",
      time: "35 min",
      difficulty: "Médio",
      category: "Sobremesa",
      vegetarian: true,
      ingredients: [
        "3 cenouras médias raladas",
        "3 ovos inteiros orgânicos",
        "1/2 xícara de óleo de coco derretido",
        "1/2 xícara de adoçante xilitol ou açúcar demerara",
        "2 xícaras de farinha de aveia",
        "1 colher de sopa de fermento químico em pó",
        "100g de chocolate amargo 70% picado (para a calda)",
        "1/4 xícara de leite de amêndoas (para a calda)"
      ],
      steps: [
        "Bata no liquidificador as cenouras, os ovos, o óleo de coco e o adoçante até obter um creme liso.",
        "Transfira para um bowl e misture delicadamente a farinha de aveia e o fermento.",
        "Despeje em uma forma untada com óleo de coco e asse em forno a 180°C por 30 minutos.",
        "Derreta o chocolate amargo com o leite de amêndoas para formar a calda.",
        "Desenforme o bolo e despeje a calda quente por cima antes de servir."
      ]
    },
    "3": {
      title: "Omelete de Espinafre",
      time: "15 min",
      difficulty: "Fácil",
      category: "Café da Manhã",
      vegetarian: true,
      ingredients: [
        "3 ovos caipiras",
        "1 xícara de espinafre fresco picado",
        "1/2 cebola roxa picadinha",
        "50g de queijo branco em cubos",
        "1 colher de chá de manteiga ghee",
        "Sal marinho, pimenta-do-reino e orégano a gosto"
      ],
      steps: [
        "Bata os ovos vigorosamente em uma tigela pequena até aerarem levemente.",
        "Adicione o espinafre, a cebola picada, o queijo branco e tempere com sal e pimenta.",
        "Aqueça a frigideira antiaderente com a manteiga ghee em fogo médio.",
        "Despeje a mistura e deixe cozinhar por cerca de 4 a 5 minutos até as bordas firmarem.",
        "Dobre a omelete ao meio com uma espátula e doure por mais 2 minutos."
      ]
    },
    "4": {
      title: "Salmão Grelhado",
      time: "25 min",
      difficulty: "Médio",
      category: "Jantar",
      vegetarian: false,
      ingredients: [
        "2 filés de salmão com pele (aprox. 180g cada)",
        "Suco de 1 maracujá fresco",
        "1 colher de sopa de mel silvestre",
        "1 dente de alho amassado",
        "Azeite de oliva, sal grosso e pimenta-do-reino moída na hora",
        "Alecrim fresco para decorar"
      ],
      steps: [
        "Tempere os filés de salmão com sal grosso, pimenta, alho e um fio de azeite.",
        "Em uma frigideira bem quente, grelhe o salmão com a pele voltada para baixo por 6 minutos.",
        "Vire com cuidado e doure os outros lados por mais 3 a 4 minutos.",
        "Em uma panela pequena, reduza o suco de maracujá com o mel até engrossar levemente.",
        "Sirva os filés regados com o molho de maracujá morno e folhas de alecrim."
      ]
    },
    "5": {
      title: "Panqueca de Banana",
      time: "10 min",
      difficulty: "Fácil",
      category: "Café da Manhã",
      vegetarian: true,
      ingredients: [
        "1 banana madura grande",
        "1 ovo inteiro",
        "2 colheres de sopa de farelo de aveia",
        "1 colher de chá de canela em pó",
        "Mel de abelhas para servir",
        "Morangos frescos fatiados para decorar"
      ],
      steps: [
        "Em um prato fundo, amasse bem a banana com um garfo até virar purê.",
        "Adicione o ovo, a aveia e metade da canela em pó, batendo tudo até homogeneizar.",
        "Aqueça uma frigideira antiaderente pequena untada com gotinhas de óleo de coco.",
        "Despeje porções da massa, dourando por 2 a 3 minutos de cada lado em fogo baixo.",
        "Sirva quente decorada com morangos, mel e polvilhada com o restante da canela."
      ]
    },
    "6": {
      title: "Nhoque de Batata Doce",
      time: "50 min",
      difficulty: "Difícil",
      category: "Massa",
      vegetarian: true,
      ingredients: [
        "2 batatas doces grandes cozidas e descascadas",
        "1 xícara de farinha de trigo integral (ou farinha sem glúten)",
        "1 gema de ovo caipira",
        "Azeite de oliva extra virgem",
        "Sal e noz-moscada ralada na hora a gosto",
        "Molho de tomate com manjericão para acompanhar"
      ],
      steps: [
        "Esprema as batatas doces ainda quentes até obter um purê bem liso e deixe esfriar.",
        "Adicione a gema, o sal, a noz-moscada e incorpore a farinha aos poucos até dar ponto de modelar.",
        "Faça rolinhos finos com porções da massa e corte os nhoques com uma faca.",
        "Cozinhe em água fervente com sal; retire os nhoques assim que subirem à superfície.",
        "Escorra bem e misture ao molho de tomate aquecido, finalizando com queijo de sua preferência."
      ]
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
    const interactives = document.querySelectorAll('a, button, input, select, textarea, [role="button"], option, .recipe-card, .recipe-ingredient-item');
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
        sidebarUpgradeBtn.textContent = '🚀 Virar PRO';
        sidebarUpgradeBtn.style.background = 'var(--secondary)';
        sidebarUpgradeBtn.style.color = 'var(--dark-deep)';
      }
    }
  }
  
  userState.isPro = false; 
  updatePlanUI();

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
    { btn: 'close-details-modal', modal: 'recipe-details-modal' },
    { btn: 'recipe-detail-close-btn', modal: 'recipe-details-modal' },
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

  function updateFavoritesCount() {
    const countLabel = document.getElementById('favorites-count-label');
    const remainingCards = document.querySelectorAll('.recipe-card:not(.removing)');
    userState.favoritesCount = remainingCards.length;
    if (countLabel) {
      countLabel.textContent = userState.favoritesCount;
    }

    const favoritesContainer = document.getElementById('favorites-container');
    if (userState.favoritesCount === 0 && favoritesContainer) {
      favoritesContainer.innerHTML = `
        <div class="empty-favorites-placeholder" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: rgba(242, 244, 243, 0.4);">
          <i class="fa-regular fa-folder-open" style="font-size: 3rem; color: var(--accent); margin-bottom: 15px; display: block;"></i>
          <h3>Sua lista de favoritas está vazia</h3>
          <p style="font-size: 0.85rem; margin-top: 5px;">Explore receitas e clique no ícone de coração para salvá-las aqui!</p>
          <a href="../explorar/index.html" class="filter-tab-btn" style="display: inline-block; margin-top: 15px; text-decoration: none;">Explorar Receitas</a>
        </div>
      `;
      updateCursorHoverListeners();
    }
  }

  const filterButtons = document.querySelectorAll('.filter-tab-btn');
  const recipeCards = document.querySelectorAll('.recipe-card');

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.dataset.filter;

      recipeCards.forEach(card => {
        const cardCategory = card.dataset.category;
        if (filterValue === 'all' || cardCategory === filterValue) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });

  const favoriteToggleButtons = document.querySelectorAll('.favorite-toggle-btn');
  favoriteToggleButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); 
      const card = btn.closest('.recipe-card');
      if (card) {
        btn.classList.remove('active');
        card.classList.add('removing');

        setTimeout(() => {
          card.remove();
          updateFavoritesCount();
        }, 300);
      }
    });
  });

  recipeCards.forEach(card => {
    card.addEventListener('click', () => {
      const recipeId = card.dataset.id;
      const recipeData = recipesDatabase[recipeId];
      if (recipeData) {
        populateRecipeModal(recipeData);
        openModal('recipe-details-modal');
      }
    });
  });

  function populateRecipeModal(data) {
    document.getElementById('recipe-detail-title').textContent = data.title;
    document.getElementById('recipe-detail-time').textContent = data.time;
    document.getElementById('recipe-detail-difficulty').textContent = data.difficulty;

    const dietTag = document.getElementById('recipe-detail-diet-tag');
    if (dietTag) {
      if (data.vegetarian) {
        dietTag.classList.remove('hidden');
        dietTag.innerHTML = `<i class="fa-solid fa-leaf"></i> Vegetariano`;
      } else {
        dietTag.classList.add('hidden');
      }
    }

    const ingredientsList = document.getElementById('recipe-detail-ingredients-list');
    if (ingredientsList) {
      ingredientsList.innerHTML = '';
      data.ingredients.forEach((ing, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
          <label class="recipe-ingredient-item">
            <div class="ingredient-chk-wrap">
              <input type="checkbox" id="fav-ing-chk-${index}">
              <span class="chk-box-custom"></span>
            </div>
            <span class="ing-text-val">${ing}</span>
          </label>
        `;
        ingredientsList.appendChild(li);
      });
    }

    const stepsList = document.getElementById('recipe-detail-steps-list');
    if (stepsList) {
      stepsList.innerHTML = '';
      data.steps.forEach(step => {
        const li = document.createElement('li');
        li.textContent = step;
        stepsList.appendChild(li);
      });
    }

    updateCursorHoverListeners();
  }

});
