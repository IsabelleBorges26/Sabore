/* SABORÉ — Recipe Books Dashboard Script */

document.addEventListener('DOMContentLoaded', () => {

  // ─── STATE MANAGEMENT ───
  let userState = {
    isPro: false,
    selectedBookId: null,
    books: [
      { id: 1, title: 'Café da Manhã', emoji: 'fa-solid fa-mug-hot', tag: 'Pessoal', count: 4 },
      { id: 2, title: 'Fitness', emoji: 'fa-solid fa-leaf', tag: 'PRO', count: 3 },
      { id: 3, title: 'Sobremesas', emoji: 'fa-solid fa-cake-candles', tag: 'Favorito', count: 2 },
      { id: 4, title: 'Favoritas', emoji: 'fa-solid fa-heart', tag: 'Público', count: 5 },
      { id: 5, title: 'Receitas Rápidas', emoji: 'fa-solid fa-bolt', tag: 'Pessoal', count: 3 }
    ],
    recipes: {
      1: [ // Café da Manhã
        { 
          id: 101, 
          title: 'Omelete de Espinafre', 
          time: 15, 
          difficulty: 'Fácil', 
          category: 'Café da Manhã', 
          ingredients: ['3 ovos frescos', '1 xícara de espinafre picado', '1 colher de manteiga', 'Sal e pimenta a gosto'], 
          steps: ['Bata os ovos vigorosamente em uma tigela com sal e pimenta.', 'Aqueça a manteiga na frigideira e refogue o espinafre por 2 minutos.', 'Despeje os ovos batidos sobre o espinafre e cozinhe em fogo baixo.', 'Quando as bordas começarem a soltar, dobre ao meio e deixe por mais 1 minuto.'] 
        },
        { 
          id: 102, 
          title: 'Panqueca de Banana', 
          time: 10, 
          difficulty: 'Fácil', 
          category: 'Fitness', 
          ingredients: ['1 banana madura', '1 ovo fresco', '3 colheres de farelo de aveia', 'Canela em pó a gosto'], 
          steps: ['Amasse bem a banana com um garfo até virar um purê.', 'Adicione o ovo e bata bem com a banana.', 'Incorpore o farelo de aveia e a canela até formar uma massa homogênea.', 'Aqueça uma frigideira antiaderente levemente untada.', 'Despeje porções da massa e vire quando começar a formar bolhas.'] 
        },
        { 
          id: 103, 
          title: 'Tapioca com Queijo Coalho', 
          time: 8, 
          difficulty: 'Fácil', 
          category: 'Café da Manhã', 
          ingredients: ['4 colheres de sopa de goma de tapioca hidratada', '2 fatias finas de queijo coalho'], 
          steps: ['Peneire a goma de tapioca diretamente sobre uma frigideira fria.', 'Ligue o fogo em temperatura média e espere a goma se unir por 2 minutos.', 'Coloque as fatias de queijo de um lado da tapioca e dobre.', 'Doure ambos os lados da tapioca até que o queijo fique macio e derretido.'] 
        },
        { 
          id: 104, 
          title: 'Smoothie Termogênico de Cacau', 
          time: 5, 
          difficulty: 'Fácil', 
          category: 'Bebida', 
          ingredients: ['1 copo de leite de amêndoas gelado', '1 banana congelada fatiada', '1 colher de sopa de cacau em pó 100%', '1 pitada de pimenta caiena'], 
          steps: ['Coloque todos os ingredientes no copo do liquidificador.', 'Bata em potência alta por 2 minutos até obter um creme sedoso.', 'Sirva imediatamente decorado com nibs de cacau ou canela.'] 
        }
      ],
      2: [ // Fitness
        { 
          id: 201, 
          title: 'Salada César Crocante', 
          time: 15, 
          difficulty: 'Fácil', 
          category: 'Fitness', 
          ingredients: ['150g de peito de frango grelhado em tiras', '2 xícaras de alface americana lavada', '1/2 xícara de croutons integrais', '3 colheres de sopa de molho césar fit', 'Lascas de queijo parmesão ralado'], 
          steps: ['Disponha as folhas de alface rasgadas em uma saladeira média.', 'Tempere com o molho césar especial, misturando bem.', 'Espalhe as tiras quentes de frango por cima.', 'Decore com croutons crocantes e finalize salpicando as lascas de parmesão.'] 
        },
        { 
          id: 202, 
          title: 'Salmão Grelhado com Aspargos', 
          time: 25, 
          difficulty: 'Médio', 
          category: 'Jantar', 
          ingredients: ['1 filé grosso de salmão fresco (200g)', '100g de aspargos verdes frescos', '1 colher de azeite de oliva extra virgem', 'Suco de limão siciliano, sal e pimenta preta'], 
          steps: ['Tempere o filé de salmão com suco de limão, sal e pimenta moída na hora.', 'Aqueça o azeite em uma frigideira de fundo grosso.', 'Grelhe o salmão com a pele virada para baixo por 6 minutos.', 'Vire o peixe e coloque os aspargos lavados nas laterais da frigideira.', 'Grelhe por mais 5 minutos mexendo os aspargos até ficarem tenros.'] 
        },
        { 
          id: 203, 
          title: 'Bowl de Quinoa com Legumes Grelhados', 
          time: 20, 
          difficulty: 'Fácil', 
          category: 'Fitness', 
          ingredients: ['1 xícara de quinoa branca cozida', '1/2 abobrinha cortada em rodelas', '1/2 cenoura fatiada', '1/2 pimentão vermelho', 'Tempero verde fresco, sal e azeite'], 
          steps: ['Cozinhe a quinoa em água fervente com sal por 12 minutos e reserve.', 'Em um grill, grelhe a abobrinha, a cenoura e o pimentão com um fio de azeite.', 'Em um bowl fundo, monte a quinoa de um lado e os legumes grelhados do outro.', 'Regue com azeite extra virgem e tempere com ervas aromáticas finas.'] 
        }
      ],
      3: [ // Sobremesas
        { 
          id: 301, 
          title: 'Brownie de Chocolate Belga', 
          time: 25, 
          difficulty: 'Fácil', 
          category: 'Sobremesa', 
          ingredients: ['200g de chocolate amargo 70%', '100g de manteiga sem sal', '3 ovos caipiras', '1 xícara de açúcar demerara', '1/2 xícara de farinha de trigo peneirada'], 
          steps: ['Derreta o chocolate amargo picado com a manteiga em banho-maria.', 'Em outra tigela, bata levemente os ovos com o açúcar até clarear.', 'Adicione o chocolate derretido na mistura de ovos e mexa bem.', 'Incorpore a farinha de trigo aos poucos com uma espátula, sem bater excessivamente.', 'Asse em forma untada por 20 minutos a 180°C (o centro deve continuar úmido).'] 
        },
        { 
          id: 302, 
          title: 'Bolo de Cenoura Fit com Cobertura', 
          time: 35, 
          difficulty: 'Médio', 
          category: 'Sobremesa', 
          ingredients: ['3 cenouras orgânicas médias', '3 ovos', '1/2 xícara de óleo de coco líquido', '2 xícaras de farinha de aveia fina', '1/2 xícara de xilitol ou eritritol', '1 colher de sopa de fermento químico', '100g de chocolate 70% derretido (cobertura)'], 
          steps: ['Bata no liquidificador as cenouras picadas, os ovos e o óleo de coco até obter um creme liso.', 'Transfira para um recipiente e adicione o adoçante e a farinha de aveia.', 'Mexa delicadamente e adicione o fermento por último.', 'Despeje em uma forma de silicone e asse por 30 minutos em forno pré-aquecido a 180°C.', 'Cubra com o chocolate derretido ainda quente antes de servir.'] 
        }
      ],
      4: [ // Favoritas
        { 
          id: 401, 
          title: 'Lasanha de Berinjela', 
          time: 45, 
          difficulty: 'Médio', 
          category: 'Almoço', 
          ingredients: ['2 berinjelas grandes fatiadas finas longitudinalmente', '400g de carne moída magra refogada', '250g de queijo muçarela ralado', '2 xícaras de molho de tomate artesanal', 'Sal, azeite e orégano'], 
          steps: ['Disponha as fatias de berinjela em uma chapa com azeite até dourarem.', 'Em uma travessa refratária, espalhe um pouco de molho de tomate no fundo.', 'Faça uma camada de berinjela, seguida de carne moída, molho e queijo.', 'Repita as camadas até preencher a travessa, finalizando com bastante queijo e orégano.', 'Asse por 30 minutos em forno médio até borbulhar.'] 
        },
        { 
          id: 402, 
          title: 'Nhoque de Batata Doce Integral', 
          time: 50, 
          difficulty: 'Difícil', 
          category: 'Massa', 
          ingredients: ['500g de batata doce cozida e amassada', '1 ovo fresco', '1.5 xícaras de farinha de trigo integral', 'Sal e noz-moscada a gosto', 'Molho de tomate fresco e manjericão'], 
          steps: ['Amasse as batatas doces ainda quentes até virar purê.', 'Misture com o ovo, o sal e a noz-moscada ralada na hora.', 'Vá adicionando a farinha integral aos poucos até obter uma massa que desgrude das mãos.', 'Molde cordões de massa em superfície enfarinhada e corte em pedaços.', 'Cozinhe em água fervente até subirem à superfície. Sirva com molho quente e manjericão.'] 
        },
        { 
          id: 403, 
          title: 'Bolo de Cenoura Fit', 
          time: 35, 
          difficulty: 'Médio', 
          category: 'Sobremesa', 
          ingredients: ['3 cenouras médias', '3 ovos', '1/2 xícara de azeite de coco', '2 xícaras de aveia', '1/2 xícara de xilitol', '1 colher de fermento'], 
          steps: ['Bata cenoura, ovos e azeite no liquidificador.', 'Incorpore farinha de aveia, adoçante e fermento.', 'Asse por 30 minutos a 180 graus.'] 
        },
        { 
          id: 404, 
          title: 'Omelete de Espinafre', 
          time: 15, 
          difficulty: 'Fácil', 
          category: 'Café da Manhã', 
          ingredients: ['3 ovos', '1 xícara de espinafre fresco', '1 colher de manteiga', 'Sal e pimenta'], 
          steps: ['Bata os ovos.', 'Refogue o espinafre na manteiga.', 'Despeje os ovos na frigideira e cozinhe por completo.'] 
        },
        { 
          id: 405, 
          title: 'Salmão Grelhado', 
          time: 25, 
          difficulty: 'Médio', 
          category: 'Jantar', 
          ingredients: ['1 filé de salmão fresco', '1 colher de azeite', 'Suco de limão siciliano', 'Sal e pimenta preta'], 
          steps: ['Tempere o peixe e grelhe em frigideira bem quente por 5 minutos de cada lado.'] 
        }
      ],
      5: [ // Receitas Rápidas
        { 
          id: 501, 
          title: 'Wrap de Frango Expresso', 
          time: 10, 
          difficulty: 'Fácil', 
          category: 'Lanches', 
          ingredients: ['1 folha de tortilha integral (wrap)', '80g de peito de frango desfiado temperado', '2 colheres de creme de ricota light', 'Folhas de alface e fatias de tomate'], 
          steps: ['Aqueça a folha de tortilha em uma frigideira por 30 segundos.', 'Espalhe o creme de ricota uniformemente na massa.', 'Distribua o frango desfiado, o tomate picado e as folhas de alface.', 'Dobre as laterais inferiores e enrole firmemente. Corte ao meio e sirva.'] 
        },
        { 
          id: 502, 
          title: 'Macarrão Alho e Óleo Express', 
          time: 12, 
          difficulty: 'Fácil', 
          category: 'Massa', 
          ingredients: ['100g de espaguete grano duro', '3 dentes de alho cortados em lâminas finas', '3 colheres de sopa de azeite de oliva extra virgem', 'Pimenta calabresa desidratada e salsinha picada'], 
          steps: ['Cozinhe o espaguete em abundante água salgada pelo tempo da embalagem.', 'Enquanto cozinha, aqueça o azeite e doure lentamente as lâminas de alho.', 'Desligue o fogo antes do alho escurecer e junte uma pitada de pimenta calabresa.', 'Escorra a massa, misture-a no azeite aromatizado e finalize com salsinha fresca picada.'] 
        },
        { 
          id: 503, 
          title: 'Suco Verde Detox Energético', 
          time: 5, 
          difficulty: 'Fácil', 
          category: 'Bebida', 
          ingredients: ['1 folha grande de couve manteiga (sem o talo grosso)', 'Suco de 1 limão tahiti espremido', '1 rodela fina de gengibre fresco', '1 rodela de abacaxi maduro', '150ml de água de coco natural gelada'], 
          steps: ['Lave muito bem as folhas de couve.', 'Pique a rodela de abacaxi e o gengibre.', 'Adicione todos os ingredientes no liquidificador.', 'Bata muito bem por 2 minutos em velocidade máxima. Sirva gelado sem coar.'] 
        }
      ]
    }
  };

  // Active filter state
  let currentFilter = 'all';

  // ─── DYNAMIC CUSTOM CURSOR ───
  const customCursor = document.createElement('div');
  customCursor.className = 'custom-cursor';
  document.body.appendChild(customCursor);

  document.addEventListener('mousemove', (e) => {
    customCursor.style.left = e.clientX + 'px';
    customCursor.style.top = e.clientY + 'px';
  });

  function updateCursorHoverListeners() {
    const interactives = document.querySelectorAll('a, button, input, select, textarea, [role="button"], option, .book-card-item, .recipe-item-card');
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
  
  userState.isPro = false; // Initialize as free
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

  // ─── GLOBAL SEARCH (FILTERS BOOKS LIST) ───
  const globalSearchInput = document.getElementById('global-search');
  if (globalSearchInput) {
    globalSearchInput.addEventListener('input', () => {
      renderBooks();
    });
  }

  // Focus Search Shortcut
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (globalSearchInput) globalSearchInput.focus();
    }
  });

  // ─── SORT AND FILTER TABS ───
  const filterBtns = document.querySelectorAll('.filter-tab-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderBooks();
    });
  });

  const sortSelect = document.getElementById('books-sort');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      renderBooks();
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
    { btn: 'close-book-modal', modal: 'add-book-modal' },
    { btn: 'close-recipe-modal', modal: 'add-recipe-modal' },
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
        renderBooks();
        openModal('celebration-modal');
      });
    }
  });

  // ─── RENDER BOOKS (Pinterest/Spotify Grid) ───
  const booksContainer = document.getElementById('books-grid-container');

  function renderBooks() {
    if (!booksContainer) return;
    booksContainer.innerHTML = '';

    const searchQuery = globalSearchInput ? globalSearchInput.value.toLowerCase().trim() : '';

    // Filter books
    let filteredBooks = userState.books.filter(book => {
      // Search input filter
      const matchesSearch = book.title.toLowerCase().includes(searchQuery);
      
      // Category Tab filter
      let matchesFilter = true;
      if (currentFilter !== 'all') {
        matchesFilter = (book.tag === currentFilter);
      }

      return matchesSearch && matchesFilter;
    });

    // Sort books
    const sortVal = sortSelect ? sortSelect.value : 'recipes-desc';
    filteredBooks.sort((a, b) => {
      if (sortVal === 'name') {
        return a.title.localeCompare(b.title);
      } else if (sortVal === 'recipes-desc') {
        return b.count - a.count;
      } else if (sortVal === 'recipes-asc') {
        return a.count - b.count;
      }
      return 0;
    });

    if (filteredBooks.length === 0) {
      booksContainer.innerHTML = `
        <div class="book-detail-empty" style="grid-column: 1 / -1; padding: 60px 20px;">
          <div class="empty-icon-glow"><i class="fa-solid fa-face-rolling-eyes"></i></div>
          <h3>Nenhuma coleção encontrada</h3>
          <p>Tente ajustar seus termos de pesquisa ou crie um novo livro de receitas.</p>
        </div>
      `;
      return;
    }

    filteredBooks.forEach((book, index) => {
      const card = document.createElement('div');
      
      // Staggered colors based on index modulo for variety
      const styleIndex = (book.id % 5) || 5;
      card.className = `book-card-item b-${styleIndex}`;
      if (userState.selectedBookId === book.id) {
        card.classList.add('selected');
      }

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

      card.addEventListener('click', () => {
        // PRO Lock check
        if (book.tag === 'PRO' && !userState.isPro) {
          const upgradeNow = confirm('A coleção "' + book.title + '" é um recurso PRO.\n\nDeseja atualizar sua conta para PRO agora para liberar este livro de receitas?');
          if (upgradeNow) {
            userState.isPro = true;
            updatePlanUI();
            userState.selectedBookId = book.id;
            renderBooks();
            showBookDetail(book.id);
            openModal('celebration-modal');
          }
          return;
        }

        userState.selectedBookId = book.id;
        
        // Remove selection style from other cards
        document.querySelectorAll('.book-card-item').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        showBookDetail(book.id);
      });

      booksContainer.appendChild(card);
    });

    updateCursorHoverListeners();
  }

  // ─── BOOK DETAIL PANEL MANAGER ───
  const bookDetailEmpty = document.getElementById('book-detail-empty');
  const bookDetailActive = document.getElementById('book-detail-active');
  const activeBookCover = document.getElementById('active-book-cover');
  const activeBookBadge = document.getElementById('active-book-badge');
  const activeBookTitle = document.getElementById('active-book-title');
  const activeBookCount = document.getElementById('active-book-count');
  const activeRecipesList = document.getElementById('active-book-recipes-list');
  const recipeSearchInput = document.getElementById('recipe-search-input');

  function showBookDetail(bookId) {
    const book = userState.books.find(b => b.id === bookId);
    if (!book) {
      showEmptyState();
      return;
    }

    bookDetailEmpty.classList.add('hidden');
    bookDetailActive.classList.remove('hidden');

    // Fill Header
    activeBookCover.innerHTML = `<i class="${book.emoji}"></i>`;
    activeBookTitle.textContent = book.title;
    activeBookCount.textContent = book.count + (book.count === 1 ? ' receita salva' : ' receitas salvas');
    
    // Badge Class
    activeBookBadge.textContent = book.tag;
    activeBookBadge.className = 'book-badge';
    if (book.tag === 'PRO') activeBookBadge.classList.add('pro');
    else if (book.tag === 'Favorito') activeBookBadge.classList.add('fav');
    else if (book.tag === 'Público') activeBookBadge.classList.add('public');

    renderBookRecipes();
  }

  function showEmptyState() {
    userState.selectedBookId = null;
    bookDetailActive.classList.add('hidden');
    bookDetailEmpty.classList.remove('hidden');
    // Clear selections
    document.querySelectorAll('.book-card-item').forEach(c => c.classList.remove('selected'));
  }

  // Filter and Render Recipes in Detail list
  function renderBookRecipes() {
    const bookId = userState.selectedBookId;
    if (!bookId) return;

    activeRecipesList.innerHTML = '';
    const searchVal = recipeSearchInput ? recipeSearchInput.value.toLowerCase().trim() : '';

    const list = userState.recipes[bookId] || [];

    // Filter recipes based on inner search
    const filteredRecipes = list.filter(rec => rec.title.toLowerCase().includes(searchVal));

    if (filteredRecipes.length === 0) {
      activeRecipesList.innerHTML = `
        <div class="book-detail-empty" style="padding: 30px 10px;">
          <i class="fa-solid fa-bowl-rice" style="font-size: 1.5rem; color: rgba(242, 244, 243, 0.2); margin-bottom: 8px;"></i>
          <p style="font-size: 0.75rem; color: rgba(242, 244, 243, 0.4);">Nenhuma receita salva neste livro.</p>
        </div>
      `;
      return;
    }

    filteredRecipes.forEach(rec => {
      const card = document.createElement('div');
      card.className = 'recipe-item-card';

      // Pick index icon based on category
      let catIcon = 'fa-solid fa-utensils';
      const cat = rec.category.toLowerCase();
      if (cat.includes('doce') || cat.includes('sobremesa')) catIcon = 'fa-solid fa-cake-candles';
      else if (cat.includes('saud') || cat.includes('fit') || cat.includes('vegano') || cat.includes('vegetariano')) catIcon = 'fa-solid fa-leaf';
      else if (cat.includes('caf') || cat.includes('manh')) catIcon = 'fa-solid fa-mug-hot';
      else if (cat.includes('mass') || cat.includes('pasta') || cat.includes('pizza')) catIcon = 'fa-solid fa-pizza-slice';
      else if (cat.includes('bebida') || cat.includes('drink') || cat.includes('suco')) catIcon = 'fa-solid fa-martini-glass-citrus';
      else if (cat.includes('lanche') || cat.includes('burger')) catIcon = 'fa-solid fa-burger';

      let diffClass = 'easy';
      if (rec.difficulty === 'Médio') diffClass = 'medium';
      else if (rec.difficulty === 'Difícil') diffClass = 'hard';

      card.innerHTML = `
        <div class="recipe-item-info">
          <div class="recipe-item-icon"><i class="${catIcon}"></i></div>
          <div class="recipe-item-meta">
            <h5>${rec.title}</h5>
            <p>🕐 ${rec.time} min · <span class="diff ${diffClass}">${rec.difficulty}</span></p>
          </div>
        </div>
        <div class="recipe-item-actions">
          <button class="btn-recipe-view" title="Ver Receita"><i class="fa-solid fa-eye"></i></button>
          <button class="btn-recipe-delete" title="Excluir da Coleção"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      `;

      // View recipe details modal
      card.querySelector('.btn-recipe-view').addEventListener('click', () => {
        openRecipeDetailsModal(rec);
      });

      // Delete recipe from book
      card.querySelector('.btn-recipe-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Deseja realmente remover "' + rec.title + '" desta coleção?')) {
          deleteRecipeFromBook(bookId, rec.id);
        }
      });

      activeRecipesList.appendChild(card);
    });

    updateCursorHoverListeners();
  }

  if (recipeSearchInput) {
    recipeSearchInput.addEventListener('input', () => {
      renderBookRecipes();
    });
  }

  // ─── ACTION: EXCLUIR LIVRO ───
  const deleteBookBtn = document.getElementById('detail-delete-book-btn');
  if (deleteBookBtn) {
    deleteBookBtn.addEventListener('click', () => {
      const bookId = userState.selectedBookId;
      if (!bookId) return;

      const book = userState.books.find(b => b.id === bookId);
      if (confirm('Tem certeza de que deseja excluir o livro "' + book.title + '"?\n\nTodas as receitas salvas nele serão perdidas definitivamente.')) {
        userState.books = userState.books.filter(b => b.id !== bookId);
        delete userState.recipes[bookId];
        showEmptyState();
        renderBooks();
      }
    });
  }

  // ─── ACTION: DYNAMIC BOOK CREATION ───
  const newBookBtnMain = document.getElementById('new-book-btn');
  const newBookForm = document.getElementById('new-book-form');

  if (newBookBtnMain) {
    newBookBtnMain.addEventListener('click', () => openModal('add-book-modal'));
  }

  if (newBookForm) {
    newBookForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('book-title').value.trim();
      const emoji = document.getElementById('book-emoji-select').value;
      const visibility = document.getElementById('book-visibility').value;

      if (!title) return;

      const newId = userState.books.length > 0 ? Math.max(...userState.books.map(b => b.id)) + 1 : 1;
      const newBook = {
        id: newId,
        title: title,
        emoji: emoji,
        tag: visibility,
        count: 0
      };

      userState.books.push(newBook);
      userState.recipes[newId] = []; // Initialize empty list of recipes
      
      closeModal('add-book-modal');
      newBookForm.reset();
      
      // Auto select the new book
      userState.selectedBookId = newId;
      renderBooks();
      showBookDetail(newId);
    });
  }

  // ─── ACTION: ADD RECIPE MANUALLY ───
  const detailAddRecipeBtn = document.getElementById('detail-add-recipe-btn');
  const newRecipeForm = document.getElementById('new-recipe-form');

  if (detailAddRecipeBtn) {
    detailAddRecipeBtn.addEventListener('click', () => openModal('add-recipe-modal'));
  }

  if (newRecipeForm) {
    newRecipeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const bookId = userState.selectedBookId;
      if (!bookId) return;

      const title = document.getElementById('recipe-title-input').value.trim();
      const time = parseInt(document.getElementById('recipe-time-input').value);
      const difficulty = document.getElementById('recipe-difficulty-input').value;
      const category = document.getElementById('recipe-category-input').value.trim();
      const ingredientsText = document.getElementById('recipe-ingredients-input').value.trim();
      const stepsText = document.getElementById('recipe-steps-input').value.trim();

      if (!title || !ingredientsText || !stepsText) return;

      // Format ingredients and steps into lists
      const ingredients = ingredientsText.split('\n').map(l => l.trim().replace(/^[-*•\d.]\s*/, '')).filter(l => l !== '');
      const steps = stepsText.split('\n').map(l => l.trim().replace(/^\d+[\s.)]*/, '')).filter(l => l !== '');

      const recipesList = userState.recipes[bookId] || [];
      const newRecipeId = recipesList.length > 0 ? Math.max(...recipesList.map(r => r.id)) + 1 : bookId * 1000 + 1;

      const newRecipe = {
        id: newRecipeId,
        title,
        time,
        difficulty,
        category,
        ingredients,
        steps
      };

      userState.recipes[bookId].push(newRecipe);
      
      // Increment count
      const book = userState.books.find(b => b.id === bookId);
      if (book) {
        book.count = userState.recipes[bookId].length;
      }

      closeModal('add-recipe-modal');
      newRecipeForm.reset();

      renderBooks();
      showBookDetail(bookId);
    });
  }

  // ─── DELETE RECIPE LOGIC ───
  function deleteRecipeFromBook(bookId, recipeId) {
    userState.recipes[bookId] = userState.recipes[bookId].filter(rec => rec.id !== recipeId);
    
    // Decrement count
    const book = userState.books.find(b => b.id === bookId);
    if (book) {
      book.count = userState.recipes[bookId].length;
    }

    renderBooks();
    showBookDetail(bookId);
  }

  // ─── RECIPE DETAILS POPUP VIEWER ───
  const recipeDetailTitle = document.getElementById('recipe-detail-title');
  const recipeDetailBadge = document.getElementById('recipe-detail-badge');
  const recipeDetailTime = document.getElementById('recipe-detail-time');
  const recipeDetailDifficulty = document.getElementById('recipe-detail-difficulty');
  const recipeDetailDietTag = document.getElementById('recipe-detail-diet-tag');
  const recipeDetailIngredients = document.getElementById('recipe-detail-ingredients-list');
  const recipeDetailSteps = document.getElementById('recipe-detail-steps-list');

  function openRecipeDetailsModal(rec) {
    recipeDetailTitle.textContent = rec.title;
    
    const activeBook = userState.books.find(b => b.id === userState.selectedBookId);
    recipeDetailBadge.innerHTML = `<i class="fa-solid fa-bookmark"></i> Livro: ${activeBook ? activeBook.title : 'Coleção'}`;
    
    recipeDetailTime.textContent = rec.time + ' min';
    recipeDetailDifficulty.textContent = rec.difficulty;
    
    // Show category tag
    recipeDetailDietTag.style.display = 'inline-flex';
    recipeDetailDietTag.textContent = rec.category;

    // Fill ingredients
    recipeDetailIngredients.innerHTML = '';
    rec.ingredients.forEach(ing => {
      const li = document.createElement('li');
      li.textContent = ing;
      recipeDetailIngredients.appendChild(li);
    });

    // Fill steps
    recipeDetailSteps.innerHTML = '';
    rec.steps.forEach(step => {
      const li = document.createElement('li');
      li.textContent = step;
      recipeDetailSteps.appendChild(li);
    });

    openModal('recipe-details-modal');
  }

  // ─── INITIAL RENDERING CALLS ───
  renderBooks();
  showEmptyState();
});
