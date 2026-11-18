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
  let specialEventsList = [];
  let feedRotationSeed = Math.floor(Math.random() * 100) + 1;
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

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);

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

  async function readEventPhotos(files) {
    const selected = Array.from(files || []);
    if (selected.length > 5) throw new Error('Escolha no máximo 5 fotos.');
    const photos = [];
    for (const file of selected) {
      if (!file.type.startsWith('image/')) throw new Error('Escolha apenas arquivos de imagem.');
      const bitmap = await createImageBitmap(file);
      const ratio = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
      canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
      canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const photo = canvas.toDataURL('image/jpeg', 0.7);
      if (photo.length >= 700000) throw new Error('Uma das fotos é grande demais. Escolha uma imagem menor.');
      photos.push(photo);
    }
    return photos;
  }

  async function readRecipeVideo(fileInput) {
    const file = fileInput?.files?.[0];
    if (!file) return null;
    if (file.size > 4 * 1024 * 1024 || !['video/mp4', 'video/webm'].includes(file.type)) {
      throw new Error('Escolha um vídeo MP4 ou WebM de até 4 MB.');
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Não foi possível ler o vídeo selecionado.'));
      reader.readAsDataURL(file);
    });
  }

  function previewImageFiles(input, container) {
    if (!input || !container) return;
    container.querySelectorAll('img').forEach((image) => {
      if (image.src.startsWith('blob:')) URL.revokeObjectURL(image.src);
    });
    container.replaceChildren();
    Array.from(input.files || []).slice(0, 5).forEach((file) => {
      const image = document.createElement('img');
      image.src = URL.createObjectURL(file);
      image.alt = `Prévia de ${file.name}`;
      image.className = 'recipe-media-preview-image';
      container.appendChild(image);
    });
  }

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
            <label id="post-event-photos-wrap" class="pilot-photo-upload">Fotos da receita (até 5)<input id="post-event-photos" type="file" accept="image/*" multiple><span>Escolha fotos do seu dispositivo. Elas serão exibidas em carrossel.</span></label>
            <div id="post-photos-preview" class="recipe-media-preview-strip" aria-live="polite"></div>
            <label class="pilot-photo-upload">Vídeo da receita (opcional)<input id="post-video" type="file" accept="video/mp4,video/webm"><span>Envie um arquivo MP4 ou WebM de até 4 MB.</span></label>
            <label>Hashtags<input id="post-hashtags" maxlength="150" placeholder="#bolo #sobremesa #receitafacil"></label>
            <label>Ingredientes — um por linha<textarea id="post-ingredients" required placeholder="2 xícaras de farinha&#10;1 xícara de leite"></textarea></label>
            <label>Modo de preparo — um passo por linha<textarea id="post-steps" required placeholder="Misture os ingredientes.&#10;Asse até dourar."></textarea></label>
            <button type="submit" class="btn-primary-modal-full"><i class="fa-solid fa-paper-plane"></i> Publicar na comunidade</button>
          </form>
        </div>
      </div>
    `);
    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal-overlay" id="publish-book-media-modal">
        <div class="modal-card community-composer-card">
          <button class="modal-close-btn" id="close-book-media-modal" type="button" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>
          <div class="modal-header-simple"><h3><i class="fa-solid fa-images"></i> Publicar receita do livro</h3><p>Adicione até 5 fotos e um vídeo. As mídias são opcionais e podem ser incluídas depois pela edição.</p></div>
          <label class="pilot-photo-upload">Fotos da receita (até 5)<input id="book-publish-photos" type="file" accept="image/*" multiple><span>Escolha as fotos no seu dispositivo.</span></label>
          <div id="book-publish-photos-preview" class="recipe-media-preview-strip" aria-live="polite"></div>
          <label class="pilot-photo-upload">Vídeo da receita (opcional)<input id="book-publish-video" type="file" accept="video/mp4,video/webm"><span>MP4 ou WebM, até 4 MB.</span></label>
          <button type="button" id="confirm-book-publish" class="btn-primary-modal-full"><i class="fa-solid fa-paper-plane"></i> Publicar na comunidade</button>
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
        option.dataset.hashtags = JSON.stringify(recipe.hashtags || []);
        option.textContent = `${recipe.title} · ${recipe.category || 'Geral'}`;
        select.appendChild(option);
      });
    };
    openCommunityComposer = async (challenge = null) => {
      await loadBookRecipes();
      challengePublicationContext = challenge;
      const eventPhotosWrap = document.getElementById('post-event-photos-wrap');
      // fotos sempre liberadas
      if (eventPhotosWrap) eventPhotosWrap.hidden = false;
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
    document.getElementById('post-event-photos')?.addEventListener('change', (event) => previewImageFiles(event.currentTarget, document.getElementById('post-photos-preview')));
    document.getElementById('book-publish-photos')?.addEventListener('change', (event) => previewImageFiles(event.currentTarget, document.getElementById('book-publish-photos-preview')));
    document.getElementById('close-book-media-modal')?.addEventListener('click', () => closeModal('publish-book-media-modal'));
    document.getElementById('publish-existing-recipe-btn').addEventListener('click', () => {
      const recipeId = Number(document.getElementById('post-existing-recipe').value);
      if (!recipeId) return alert('Selecione uma receita de um livro para publicar.');
      openModal('publish-book-media-modal');
    });
    document.getElementById('confirm-book-publish').addEventListener('click', async (event) => {
      const recipeId = Number(document.getElementById('post-existing-recipe').value);
      if (!recipeId) return alert('Selecione uma receita de um livro para publicar.');
      const publishButton = event.currentTarget;
      try {
        const select = document.getElementById('post-existing-recipe');
        const selectedOption = select.options[select.selectedIndex];
        const eventId = challengePublicationContext?.eventoId;
        const eventPhotos = await readEventPhotos(document.getElementById('book-publish-photos')?.files);
        const video = await readRecipeVideo(document.getElementById('book-publish-video'));
        const hashtags = JSON.parse(selectedOption?.dataset.hashtags || '[]');
        if (eventId && challengePublicationContext?.hashtag && !hashtags.includes(challengePublicationContext.hashtag)) {
          hashtags.push(challengePublicationContext.hashtag);
        }
        const updatePayload = { publica: true };
        if (eventId) updatePayload.hashtags = hashtags;
        if (eventPhotos.length) {
          updatePayload.fotos = eventPhotos;
          updatePayload.imagem = eventPhotos[0];
        }
        if (video) updatePayload.video = video;
        publishButton.disabled = true;
        const resUpdate = await api.put(`/receitas/atualizar/${recipeId}`, updatePayload);
        let eventEnrollmentError = null;
        if (eventId) {
          try {
            await api.post(`/desafios/eventos/${eventId}/inscrever`, { receitaId: recipeId, fotos: eventPhotos });
          } catch (error) {
            eventEnrollmentError = error;
          }
        }
        closeModal('create-post-modal');
        closeModal('publish-book-media-modal');
        document.getElementById('book-publish-photos').value = '';
        document.getElementById('book-publish-video').value = '';
        document.getElementById('book-publish-photos-preview').replaceChildren();
        challengePublicationContext = null;
        if (eventEnrollmentError) {
          alert(`A receita foi publicada, mas não entrou no evento: ${eventEnrollmentError.message}`);
        } else if (eventId) {
          if (window.SaboreNotify) window.SaboreNotify('Receita publicada e inscrita no evento.', 'success');
          else alert('Receita publicada e inscrita no evento.');
        } else if (resUpdate?.desafioInfo?.concluiuDesafio) {
          if (window.SaboreNotify) window.SaboreNotify('🎉 +30 pontos conquistados no Ranking Mensal! Desafio concluído com sucesso.', 'success');
          else alert('🎉 +30 pontos conquistados no Ranking Mensal! Desafio concluído com sucesso.');
        } else {
          alert('Receita do livro publicada na comunidade.');
        }
        await refreshExploreFeed(false);
        await loadDesafioOfTheWeek();
        if (eventId) await loadSpecialEventsView(eventId);
      } catch (error) {
        publishButton.disabled = false;
        alert(`Não foi possível publicar a receita do livro: ${error.message}`);
      }
    });
    document.getElementById('create-post-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const value = (id) => document.getElementById(id).value.trim();
      const ingredients = value('post-ingredients').split('\n').map(item => item.trim()).filter(Boolean);
      const steps = value('post-steps').split('\n').map(item => item.trim()).filter(Boolean);
      const hashtags = value('post-hashtags').split(/\s+/).map(item => item.replace(/^#/, '').trim()).filter(Boolean);
      if (challengePublicationContext?.hashtag) {
        const ctxNorm = challengePublicationContext.hashtag.replace(/^#/, '').trim();
        if (ctxNorm && !hashtags.some(h => h.toLowerCase() === ctxNorm.toLowerCase())) {
          hashtags.push(ctxNorm);
        }
      }
      try {
        const eventPhotos = await readEventPhotos(document.getElementById('post-event-photos')?.files);
        const video = await readRecipeVideo(document.getElementById('post-video'));
        const createdRecipe = await api.post('/receitas/cadastrar', {
          titulo: value('post-title'), descricao: value('post-description'), tempoPreparo: Number(value('post-time')),
          dificuldade: value('post-difficulty'), categorias: [value('post-category')], hashtags, imagem: eventPhotos[0] || null, fotos: eventPhotos, video,
          ingredientes: ingredients, modoPreparo: steps.join('\n'), criadaPorIA: false, publica: true
        });
        const eventId = challengePublicationContext?.eventoId;
        let eventEnrollmentError = null;
        if (eventId) {
          try {
            await api.post(`/desafios/eventos/${eventId}/inscrever`, { receitaId: createdRecipe.id, fotos: eventPhotos });
          } catch (error) {
            eventEnrollmentError = error;
          }
        }
        closeModal('create-post-modal');
        challengePublicationContext = null;
        if (eventEnrollmentError) {
          alert(`A publicação foi criada, mas não entrou no evento: ${eventEnrollmentError.message}`);
        } else if (eventId) {
          if (window.SaboreNotify) window.SaboreNotify('Receita publicada e inscrita no evento.', 'success');
          else alert('Receita publicada e inscrita no evento.');
        } else if (createdRecipe?.desafioInfo?.concluiuDesafio) {
          if (window.SaboreNotify) window.SaboreNotify('🎉 +30 pontos conquistados no Ranking Mensal! Desafio concluído com sucesso.', 'success');
          else alert('🎉 +30 pontos conquistados no Ranking Mensal! Desafio concluído com sucesso.');
        } else {
          alert('Publicação criada. Ela já está visível para a comunidade.');
        }
        event.target.reset();
        document.getElementById('post-photos-preview')?.replaceChildren();
        await refreshExploreFeed(false);
        await loadDesafioOfTheWeek();
        if (eventId) await loadSpecialEventsView(eventId);
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
  if (recipesContainer && !recipesContainer.dataset.recipeDetailsBound) {
    recipesContainer.dataset.recipeDetailsBound = 'true';
    recipesContainer.addEventListener('click', (event) => {
      const button = event.target.closest('.view-recipe-details-btn');
      if (!button || !recipesContainer.contains(button)) return;
      event.preventDefault();
      const recipe = button.closest('.explore-recipe-card')?._recipe;
      if (recipe) openRecipeDetailsModal(recipe);
    });
  }
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
    filtered.sort((first, second) => {
      if (activeFeedMode === 'recent') {
        return new Date(second.publishedAt || 0).getTime() - new Date(first.publishedAt || 0).getTime();
      }
      // Rotação dinâmica de feed social:
      // Combina a relevância da receita (plano PRO, avaliações, curtidas) com rotação dinâmica
      // para que a cada atualização ou retorno ao site, receitas de diferentes usuários ganhem destaque no topo.
      const calcDynamicScore = (recipe) => {
        const isPro = String(recipe.authorPlan || '').toUpperCase() === 'PRO' ? 12 : 0;
        const socialInteractions = (Number(recipe.avaliacoes) || 0) * 3 + (Number(recipe.comentarios) || 0) * 2 + (Number(recipe.likes) || 0);
        const numId = Math.abs(Number(recipe.id) || 0) || 7;
        const seedVariance = ((numId * 41 + feedRotationSeed * 89) % 37);
        return isPro + socialInteractions + seedVariance;
      };

      const diff = calcDynamicScore(second) - calcDynamicScore(first);
      if (diff !== 0) return diff;
      return new Date(second.publishedAt || 0).getTime() - new Date(first.publishedAt || 0).getTime()
        || Number(second.id) - Number(first.id);
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
    const visibleRecipes = filtered.slice(0, feedCurrentCount);

    visibleRecipes.forEach(rec => {
      seenRecipeIds.add(String(rec.id));
      const card = document.createElement('article');
      card.className = 'explore-recipe-card';
      card._recipe = rec;
      let diffClass = 'easy';
      if (rec.difficulty === 'Médio') diffClass = 'medium';
      else if (rec.difficulty === 'Difícil') diffClass = 'hard';

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
              <i class="fa-regular fa-comment-dots"></i> ${rec.comentarios || 0}
            </button>
          </div>
          <button type="button" class="view-recipe-details-btn">
            <i class="fa-solid fa-book-open"></i> Ver receita, fotos e vÃ­deos
          </button>
          <div class="post-social-actions">
            ${rec.authorId && rec.authorId !== api.getUser()?.id ? `<button class="follow-author-btn"><i class="fa-solid fa-user-plus"></i> Seguir</button>` : ''}
            <button class="share-post-btn"><i class="fa-solid fa-share-nodes"></i> Compartilhar</button>
            <button class="share-post-btn share-whatsapp-btn whatsapp-post-btn" aria-label="Compartilhar no WhatsApp"><i class="fa-brands fa-whatsapp"></i> WhatsApp</button>
          </div>
        </div>
      `;
      const viewRecipeButton = card.querySelector('.view-recipe-details-btn');
      if (viewRecipeButton) {
        viewRecipeButton.innerHTML = '<i class="fa-solid fa-book-open" aria-hidden="true"></i> Ver receita';
      }
      showAuthorAvatar(card.querySelector('.author-avatar'), rec);

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

      const bookmarkBtn = card.querySelector('.bookmark-toggle-btn');
      bookmarkBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userState.selectedExploreRecipe = rec;
        renderBookSaveOptions();
        openModal('save-to-book-modal');
      });

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
          if (await window.SaboreShareRecipe(rec)) renderRecipes();
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

      card.querySelector('.whatsapp-post-btn').addEventListener('click', async (event) => {
        event.stopPropagation();
        if (window.SaboreShareRecipe) {
          if (await window.SaboreShareRecipe(rec, { platform: 'whatsapp' })) renderRecipes();
          return;
        }
        const url = new URL(`../../receita/?id=${rec.id}`, window.location.href).href;
        const message = `Veja a receita ${rec.title}, publicada por ${rec.author} no Saboré. ${url}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
      });

      card.addEventListener('click', (event) => {
        if (event.target.closest('button, a, input, select, textarea, .recipe-author-line')) return;
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
    const maxBytes = 10 * 1024 * 1024;
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
    (userState.recipes || []).forEach(rec => {
      const interactions = (Number(rec.likes) || 0) + (Number(rec.avaliacoes) || 0) + (Number(rec.comentarios) || 0);
      const tags = rec.tags || extractRecipeTags(rec);
      tags.forEach(tag => {
        const norm = normalizeHashtag(tag);
        if (!norm) return;
        const key = norm.toLowerCase();
        if (!map.has(key)) {
          map.set(key, { name: norm, interactions: 0, count: 0, official: false, type: 'community' });
        }
        const item = map.get(key);
        item.interactions += interactions;
        item.count += 1;
      });
    });

    // Adiciona hashtags oficiais de eventos especiais (como #NatalSabore2026, #ReveillonSabore2027, etc.)
    (specialEventsList || []).forEach(ev => {
      if (ev.hashtag) {
        const norm = normalizeHashtag(ev.hashtag);
        if (norm) {
          const key = norm.toLowerCase();
          if (!map.has(key)) {
            map.set(key, { name: norm, interactions: 0, count: 0, official: true, type: 'event', title: ev.titulo });
          } else {
            const item = map.get(key);
            item.official = true;
            item.type = 'event';
            item.title = ev.titulo;
          }
        }
      }
    });

    // Adiciona hashtag oficial do desafio semanal ativo
    const officialChallengeTag = normalizeHashtag(currentWeeklyChallengeData?.desafio?.hashtag || currentWeeklyChallengeData?.hashtag);
    if (officialChallengeTag) {
      const key = officialChallengeTag.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { name: officialChallengeTag, interactions: 0, count: 0, official: true, type: 'challenge' });
      } else {
        const item = map.get(key);
        item.official = true;
        item.type = 'challenge';
      }
    }

    // Exibe qualquer hashtag oficial OU com receitas publicadas (count > 0) OU com interações
    userState.trendingTagsData = Array.from(map.values())
      .filter(item => item.official || item.count > 0 || item.interactions > 0)
      .sort((a, b) => {
        if (b.official !== a.official) return Number(Boolean(b.official)) - Number(Boolean(a.official));
        const scoreA = (a.interactions * 3) + (a.count * 2);
        const scoreB = (b.interactions * 3) + (b.count * 2);
        if (scoreB !== scoreA) return scoreB - scoreA;
        return b.count - a.count;
      });

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
      if (item.official) {
        chip.classList.add('tag-official');
      }
      if (activeHashtagFilter && activeHashtagFilter.toLowerCase() === item.name.toLowerCase()) {
        chip.classList.add('active');
      }

      let iconHtml = '<i class="fa-solid fa-hashtag"></i>';
      let badgeLabel = '';
      if (item.type === 'event') {
        iconHtml = '<i class="fa-solid fa-trophy" style="color: #F0D5B6;"></i>';
        badgeLabel = '<span class="tag-official-badge"><i class="fa-solid fa-star"></i> Evento</span>';
      } else if (item.type === 'challenge') {
        iconHtml = '<i class="fa-solid fa-medal" style="color: var(--accent);"></i>';
        badgeLabel = '<span class="tag-official-badge"><i class="fa-solid fa-star"></i> Desafio</span>';
      }

      let metaHtml = '';
      if (item.count > 0) {
        metaHtml += `<span class="tag-recipes-count" title="${item.count} receitas com esta hashtag"><i class="fa-solid fa-utensils"></i> ${item.count}</span>`;
      }
      if (item.interactions > 0) {
        metaHtml += `<span class="tag-fire-count" title="${item.interactions} interações dos usuários"><i class="fa-solid fa-fire"></i> ${item.interactions}</span>`;
      }

      chip.innerHTML = `
        ${iconHtml}
        <span>${item.name}</span>
        ${badgeLabel}
        ${metaHtml}
      `;

      chip.addEventListener('click', () => {
        if (activeHashtagFilter && activeHashtagFilter.toLowerCase() === item.name.toLowerCase()) {
          activeHashtagFilter = null;
        } else {
          activeHashtagFilter = item.name;
        }
        renderTags();
        renderRecipes();

        // Se estiver na tela de eventos, alterna para o feed para visualizar as receitas filtradas
        const feedView = document.getElementById('view-comunidade-feed');
        const evView = document.getElementById('view-comunidade-eventos');
        if (feedView && evView && evView.style.display !== 'none') {
          evView.style.display = 'none';
          feedView.style.display = '';
          document.getElementById('btn-tab-feed')?.classList.add('active');
          document.getElementById('btn-tab-eventos')?.classList.remove('active');
        }

        // Rolagem suave até a lista de receitas
        recipesContainer?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    selectedRating = 0;
    ratingEdited = false;
    currentRating = null;
    updateStarsUI(0);
    if (submitRatingBtn) submitRatingBtn.hidden = true;
    if (deleteRatingBtn) deleteRatingBtn.hidden = true;
    if (ownRatingStatus) ownRatingStatus.textContent = 'Carregando sua avaliação...';
    if (commentsCountBadge) commentsCountBadge.textContent = Number(rec.comentarios) || 0;
    const ratingsCountBadge = document.getElementById('recipe-ratings-count');
    if (ratingsCountBadge) ratingsCountBadge.textContent = Number(rec.avaliacoes) || 0;
    loadRecipeComments(rec.id);
    loadRecipeRating(rec.id);
    
    const carouselContainer = document.getElementById('recipe-detail-carousel-container');
    if (carouselContainer) {
      const mediaItems = [];
      if (rec.video) {
        mediaItems.push({ type: 'video', src: rec.video });
      }
      const rawPhotos = Array.isArray(rec.fotos) && rec.fotos.length ? rec.fotos : [rec.image].filter(Boolean);
      rawPhotos.slice(0, 5).forEach(img => {
        mediaItems.push({ type: 'image', src: img });
      });

      if (mediaItems.length > 1) {
        carouselContainer.style.display = 'block';
        carouselContainer.innerHTML = `
          <div class="insta-carousel" style="border-radius: 14px; min-height: 280px; max-height: 380px; margin-bottom: 14px;">
            <div class="insta-carousel-track">
              ${mediaItems.map((item, index) => {
                if (item.type === 'video') {
                  return `
                    <div class="insta-carousel-slide ${index === 0 ? 'active' : ''}" data-slide-index="${index}">
                      <video class="insta-post-video" controls preload="metadata" playsinline src="${escapeHtml(item.src)}"></video>
                    </div>
                  `;
                }
                return `
                  <div class="insta-carousel-slide ${index === 0 ? 'active' : ''}" data-slide-index="${index}">
                    <img src="${escapeHtml(item.src)}" alt="${escapeHtml(rec.title)} — foto ${index + 1}" style="width: 100%; height: 100%; object-fit: cover;">
                  </div>
                `;
              }).join('')}
            </div>
            <button type="button" class="insta-carousel-btn prev" aria-label="Anterior"><i class="fa-solid fa-chevron-left"></i></button>
            <button type="button" class="insta-carousel-btn next" aria-label="Próximo"><i class="fa-solid fa-chevron-right"></i></button>
            <div class="insta-carousel-dots">
              ${mediaItems.map((_, i) => `<span class="insta-carousel-dot ${i === 0 ? 'active' : ''}" data-dot-index="${i}"></span>`).join('')}
            </div>
          </div>
        `;
        const slides = carouselContainer.querySelectorAll('.insta-carousel-slide');
        const dots = carouselContainer.querySelectorAll('.insta-carousel-dot');
        const prevBtn = carouselContainer.querySelector('.insta-carousel-btn.prev');
        const nextBtn = carouselContainer.querySelector('.insta-carousel-btn.next');
        let currentSlide = 0;
        const setSlide = (index) => {
          currentSlide = (index + slides.length) % slides.length;
          slides.forEach((s, idx) => s.classList.toggle('active', idx === currentSlide));
          dots.forEach((d, idx) => d.classList.toggle('active', idx === currentSlide));
        };
        prevBtn?.addEventListener('click', (e) => { e.stopPropagation(); setSlide(currentSlide - 1); });
        nextBtn?.addEventListener('click', (e) => { e.stopPropagation(); setSlide(currentSlide + 1); });
        dots.forEach((dot, idx) => dot.addEventListener('click', (e) => { e.stopPropagation(); setSlide(idx); }));
      } else if (mediaItems.length === 1) {
        carouselContainer.style.display = 'block';
        if (mediaItems[0].type === 'video') {
          carouselContainer.innerHTML = `<video class="insta-post-video" style="border-radius: 14px; max-height: 380px; width: 100%; margin-bottom: 14px;" controls preload="metadata" playsinline src="${escapeHtml(mediaItems[0].src)}"></video>`;
        } else {
          carouselContainer.innerHTML = `<img src="${escapeHtml(mediaItems[0].src)}" alt="${escapeHtml(rec.title)}" style="width: 100%; max-height: 380px; object-fit: cover; border-radius: 14px; border: 1px solid var(--glass-border); margin-bottom: 14px;">`;
        }
      } else {
        carouselContainer.style.display = 'none';
        carouselContainer.innerHTML = '';
      }
    }
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
          publicRecipes = userState.recipes.map(recipe => ({
            id: recipe.id, title: recipe.title, description: recipe.description,
            time: recipe.time, difficulty: recipe.difficulty, category: recipe.category,
            likes: recipe.likes, avaliacoes: recipe.avaliacoes, comentarios: recipe.comentarios,
            compartilhamentos: recipe.compartilhamentos, image: recipe.image,
            fotos: recipe.fotos, video: recipe.video,
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
          comentarios: Number(rec.comentarios) || 0,
          compartilhamentos: Number(rec.compartilhamentos) || 0,
          image: rec.image,
          fotos: Array.isArray(rec.fotos) ? rec.fotos : (rec.image ? [rec.image] : []),
          video: rec.video || null,
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
          .filter(u => u.id !== currentUser.id)
          .map(u => ({
            id: u.id,
            name: u.nome,
            plan: u.plano,
            recipes: 0,
            avatar: u.foto || null,
            followed: false,
            recipes: u.receitasPublicas || 0,
            followed: userState.followingIds.has(String(u.id))
          }));
      } catch (err) {
      }
      if (!isCurrentFeedLoad()) return;
      renderChefs();
      renderRecipes();
      renderTags();
      return { ok: true, newPostsCount };
    } catch (err) {
      console.error('NÃ£o foi possÃ­vel atualizar o feed da comunidade:', err);
      if (isCurrentFeedLoad() && userState.recipes.length === 0) {
        const container = document.getElementById('explore-recipes-container');
        if (container) {
          container.innerHTML = '<div class="book-detail-empty" style="grid-column: 1 / -1; padding: 60px 20px;"><div class="empty-icon-glow"><i class="fa-solid fa-triangle-exclamation"></i></div><h3>Não foi possível carregar as publicações</h3><p>Verifique sua conexão e tente novamente.</p><button type="button" id="retry-community-feed" class="feed-filter-btn">Tentar novamente</button></div>';
          container.querySelector('#retry-community-feed')?.addEventListener('click', () => loadInitialData());
        }
        if (!options.retryAttempt) {
          setTimeout(() => { if (api.getUser() && isCurrentFeedLoad()) loadInitialData({ retryAttempt: true }); }, 16_000);
        }
      }
      return { ok: false, newPostsCount: 0, error: err };
    }
  }
  let selectedRating = 0;
  let ratingEdited = false;
  let currentRating = null;
  const ratingStarsContainer = document.getElementById('recipe-rating-stars');
  const submitRatingBtn = document.getElementById('recipe-submit-rating');
  const deleteRatingBtn = document.getElementById('recipe-delete-rating');
  const ownRatingStatus = document.getElementById('recipe-own-rating-status');
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
        ratingEdited = true;
        updateStarsUI(rating);
        if (submitRatingBtn) {
          submitRatingBtn.textContent = currentRating ? 'Salvar alteração' : 'Enviar avaliação';
          submitRatingBtn.hidden = false;
        }
      });
    });

    if (submitRatingBtn) {
      submitRatingBtn.addEventListener('click', async () => {
        const rec = userState.selectedExploreRecipe;
        if (!rec || !selectedRating || submitRatingBtn.disabled) return;
        submitRatingBtn.disabled = true;
        submitRatingBtn.textContent = 'Salvando...';
        try {
          currentRating = await api.post('/avaliacoes/cadastrar', { receitaId: rec.id, nota: selectedRating });
          submitRatingBtn.hidden = true;
          if (deleteRatingBtn) deleteRatingBtn.hidden = false;
          ratingEdited = false;
          await loadRecipeRating(rec.id);
          await refreshRecipeEngagement(rec);
          if (ownRatingStatus) ownRatingStatus.textContent = `Sua avaliação foi salva: ${selectedRating} de 5 estrelas.`;
        } catch (err) {
          alert('Não foi possível salvar a avaliação: ' + err.message);
        } finally {
          submitRatingBtn.disabled = false;
          submitRatingBtn.textContent = currentRating ? 'Salvar alteração' : 'Enviar avaliação';
        }
      });
    }

    if (deleteRatingBtn) {
      deleteRatingBtn.addEventListener('click', async () => {
        const rec = userState.selectedExploreRecipe;
        if (!rec || !currentRating || deleteRatingBtn.disabled) return;
        if (!confirm('Excluir sua avaliação desta receita? Seus comentários continuarão publicados.')) return;
        deleteRatingBtn.disabled = true;
        try {
          await api.delete(`/avaliacoes/excluir/${rec.id}`);
          currentRating = null;
          selectedRating = 0;
          ratingEdited = false;
          updateStarsUI(0);
          deleteRatingBtn.hidden = true;
          if (submitRatingBtn) submitRatingBtn.hidden = true;
          await loadRecipeRating(rec.id);
          await refreshRecipeEngagement(rec);
          if (ownRatingStatus) ownRatingStatus.textContent = 'Sua avaliação foi excluída.';
        } catch (err) {
          alert('Não foi possível excluir sua avaliação: ' + err.message);
        } finally {
          deleteRatingBtn.disabled = false;
        }
      });
    }

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
          await api.post('/comentarios/cadastrar', { receitaId: rec.id, texto: text });

          if (commentInput) commentInput.value = '';
          if (commentFeedbackStatus) {
            commentFeedbackStatus.textContent = 'Comentário publicado!';
            commentFeedbackStatus.style.display = 'inline';
            setTimeout(() => { if (commentFeedbackStatus) commentFeedbackStatus.style.display = 'none'; }, 3000);
          }

          await loadRecipeComments(rec.id);
          await refreshRecipeEngagement(rec);
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

  async function refreshRecipeEngagement(rec) {
    try {
      const updatedRecipe = await api.get(`/receitas/publicas/${rec.id}`);
      rec.avaliacoes = Number(updatedRecipe.avaliacoes) || 0;
      rec.comentarios = Number(updatedRecipe.comentarios) || 0;
    } catch {
      const commentsCount = Number(commentsCountBadge?.textContent);
      const ratingsCount = Number(document.getElementById('recipe-ratings-count')?.textContent);
      if (Number.isFinite(commentsCount)) rec.comentarios = commentsCount;
      if (Number.isFinite(ratingsCount)) rec.avaliacoes = ratingsCount;
    }
    if (commentsCountBadge) commentsCountBadge.textContent = rec.comentarios;
    const ratingsCountBadge = document.getElementById('recipe-ratings-count');
    if (ratingsCountBadge) ratingsCountBadge.textContent = rec.avaliacoes;
    renderRecipes();
    updateTrendingHashtags();
  }

  async function loadRecipeRating(recipeId) {
    if (!ratingStarsContainer) return;
    try {
      const ratings = await api.get(`/avaliacoes/listar?receitaId=${recipeId}`);
      if (String(userState.selectedExploreRecipe?.id) !== String(recipeId)) return;
      const list = Array.isArray(ratings) ? ratings : [];
      const ratingsCountBadge = document.getElementById('recipe-ratings-count');
      if (ratingsCountBadge) ratingsCountBadge.textContent = list.length;
      const currentUser = api.getUser();
      const userRating = list.find(item => String(item.usuarioId) === String(currentUser?.id));
      currentRating = userRating || null;
      if (deleteRatingBtn) deleteRatingBtn.hidden = !currentRating;
      if (ownRatingStatus) ownRatingStatus.textContent = currentRating
        ? `Sua avaliação atual: ${currentRating.nota} de 5 estrelas.`
        : 'Você ainda não avaliou esta receita.';
      if (ratingEdited) {
        if (submitRatingBtn) submitRatingBtn.textContent = currentRating ? 'Salvar alteração' : 'Enviar avaliação';
        return;
      }
      selectedRating = userRating ? userRating.nota : 0;
      updateStarsUI(selectedRating);
      ratingStarsContainer.title = '';
      if (submitRatingBtn) submitRatingBtn.hidden = true;
    } catch {
      if (String(userState.selectedExploreRecipe?.id) !== String(recipeId)) return;
      ratingStarsContainer.title = 'Não foi possível carregar sua avaliação. Tente novamente.';
      if (ownRatingStatus) ownRatingStatus.textContent = 'Não foi possível verificar sua avaliação agora.';
    }
  }

  async function loadRecipeComments(recipeId) {
    if (!commentsListContainer) return;
    commentsListContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 10px;">Carregando comentários...</div>';

    try {
      const comments = await api.get(`/comentarios/listar?receitaId=${recipeId}`);
      if (String(userState.selectedExploreRecipe?.id) !== String(recipeId)) return;
      const list = Array.isArray(comments) ? comments : [];

      if (commentsCountBadge) {
        commentsCountBadge.textContent = list.length;
      }

      if (list.length === 0) {
        commentsListContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 14px;">Nenhum comentário ainda. Seja o primeiro a compartilhar sua opinião!</div>';
        return;
      }

      commentsListContainer.innerHTML = '';
      list.forEach(item => {
        const commentCard = document.createElement('div');
        commentCard.className = 'recipe-comment-item';

        const userName = item.usuario?.nome || 'Usuário da Comunidade';
        commentCard.innerHTML = `
          <span class="comment-author-avatar" aria-hidden="true"></span>
          <div class="recipe-comment-body">
            <div class="recipe-comment-header">
              <span class="recipe-comment-author">${api.renderUserIdentity(userName, item.usuario?.plano)}</span>
            </div>
            <p class="recipe-comment-text"></p>
          </div>
        `;
        commentCard.querySelector('.recipe-comment-text').textContent = item.texto || '';
        showAuthorAvatar(commentCard.querySelector('.comment-author-avatar'), {
          author: userName,
          authorAvatar: item.usuario?.foto,
        });
        commentsListContainer.appendChild(commentCard);
      });
    } catch (err) {
      if (String(userState.selectedExploreRecipe?.id) !== String(recipeId)) return;
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

  async function refreshExploreFeed(showFeedback = true) {
    const refreshBtn = document.getElementById('btn-refresh-feed');
    if (refreshBtn && showFeedback) {
      refreshBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate fa-spin"></i> Atualizando...';
      refreshBtn.disabled = true;
    }

    feedCurrentCount = feedPageLimit;
    // Rotaciona a semente do feed social para trazer novas publicações de outros usuários para o topo
    feedRotationSeed++;

    try {
      await loadInitialData({ forceRotate: true });

      // Aplica animação de transição suave nos cards recarregados
      const cards = document.querySelectorAll('#recipes-container .recipe-card');
      cards.forEach((card, idx) => {
        card.classList.remove('feed-refreshed');
        card.style.animationDelay = `${Math.min(idx * 0.04, 0.4)}s`;
        void card.offsetWidth;
        card.classList.add('feed-refreshed');
      });

      if (refreshBtn && showFeedback) {
        refreshBtn.innerHTML = '<i class="fa-solid fa-check" style="color: #4cd137;"></i> Feed atualizado!';
      }
    } catch (err) {
      if (refreshBtn && showFeedback) {
        refreshBtn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Falha ao atualizar';
      }
    } finally {
      if (refreshBtn && showFeedback) {
        setTimeout(() => {
          refreshBtn.disabled = false;
          refreshBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Atualizar';
        }, 1500);
      }
    }
  }

  const refreshFeedBtn = document.getElementById('btn-refresh-feed');
  if (refreshFeedBtn) {
    refreshFeedBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      refreshExploreFeed(true);
    });
  }

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

  window.addEventListener('focus', () => {
    refreshExploreFeed(false);
  });


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
      renderRecipes();
      renderTags();
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


  let currentEventData = null;
  let currentEventId = null;
  let pilotActiveTab = 'all'; // 'all' | 'ranking' | 'saved'
  let pilotShowSavedOnly = false;
  let pendingVoteEntradaId = null;
  let specialEventsSelectorLoaded = false;
  let pilotCountdownInterval = null;

  async function loadSpecialEventsSelector() {
    const selectorBar = document.getElementById('event-selector-bar');
    if (!selectorBar || specialEventsSelectorLoaded) return null;
    const events = await api.get('/desafios/eventos');
    specialEventsList = Array.isArray(events) ? events : [];
    updateTrendingHashtags();
    const sortedEvents = (Array.isArray(events) ? events : []).sort((a, b) => Number(Boolean(b.temporario)) - Number(Boolean(a.temporario)));
    selectorBar.replaceChildren();
    sortedEvents.forEach(event => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'event-tab-pill';
      button.dataset.eventId = event.id;
      const icon = document.createElement('i');
      icon.className = `fa-solid ${event.temporario ? 'fa-flask' : 'fa-trophy'}`;
      button.append(icon, document.createTextNode(event.temporario ? ' Evento piloto · Teste' : ` ${event.titulo || 'Evento especial'}`));
      selectorBar.append(button);
    });
    specialEventsSelectorLoaded = true;
    return sortedEvents.find(event => event.temporario)?.id || sortedEvents[0]?.id || null;
  }

  function initSpecialEvents() {
    const openEntryBtn = document.getElementById('btn-open-event-entry-modal');
    if (openEntryBtn) {
      openEntryBtn.addEventListener('click', () => {
        if (currentEventData?.temporario && !currentEventData.participando) {
          joinPilotEvent(openEntryBtn);
          return;
        }
        openEventEntryModal();
      });
    }

    document.getElementById('pilot-feed-create')?.addEventListener('click', () => openEventEntryModal());
    document.getElementById('btn-replace-my-competing')?.addEventListener('click', () => openEventEntryModal());
    document.getElementById('btn-feed-filter-all')?.addEventListener('click', () => {
      pilotActiveTab = 'all';
      pilotShowSavedOnly = false;
      document.getElementById('btn-feed-filter-all')?.classList.add('active');
      document.getElementById('btn-feed-filter-ranking')?.classList.remove('active');
      document.getElementById('btn-feed-filter-saved')?.classList.remove('active');
      if (currentEventData) renderSpecialEvent(currentEventData);
    });
    document.getElementById('btn-feed-filter-ranking')?.addEventListener('click', () => {
      pilotActiveTab = 'ranking';
      pilotShowSavedOnly = false;
      document.getElementById('btn-feed-filter-ranking')?.classList.add('active');
      document.getElementById('btn-feed-filter-all')?.classList.remove('active');
      document.getElementById('btn-feed-filter-saved')?.classList.remove('active');
      if (currentEventData) renderSpecialEvent(currentEventData);
    });
    document.getElementById('btn-feed-filter-saved')?.addEventListener('click', () => {
      pilotActiveTab = 'saved';
      pilotShowSavedOnly = true;
      document.getElementById('btn-feed-filter-saved')?.classList.add('active');
      document.getElementById('btn-feed-filter-all')?.classList.remove('active');
      document.getElementById('btn-feed-filter-ranking')?.classList.remove('active');
      if (currentEventData) renderSpecialEvent(currentEventData);
    });
    document.getElementById('btn-refresh-ranking')?.addEventListener('click', async () => {
      const btn = document.getElementById('btn-refresh-ranking');
      if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Atualizando...';
        btn.disabled = true;
      }
      await loadSpecialEventsView(currentEventId);
      if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-rotate"></i> Atualizar';
        btn.disabled = false;
      }
    });

    // Abas do Modal de Inscrição
    document.getElementById('tab-btn-choose-book')?.addEventListener('click', () => {
      document.getElementById('tab-btn-choose-book')?.classList.add('active');
      document.getElementById('tab-btn-create-new')?.classList.remove('active');
      const pBook = document.getElementById('panel-choose-book');
      const pCreate = document.getElementById('panel-create-new');
      if (pBook) pBook.style.display = '';
      if (pCreate) pCreate.style.display = 'none';
    });
    document.getElementById('tab-btn-create-new')?.addEventListener('click', () => {
      document.getElementById('tab-btn-create-new')?.classList.add('active');
      document.getElementById('tab-btn-choose-book')?.classList.remove('active');
      const pBook = document.getElementById('panel-choose-book');
      const pCreate = document.getElementById('panel-create-new');
      if (pBook) pBook.style.display = 'none';
      if (pCreate) pCreate.style.display = '';
    });

    // Preview de fotos selecionadas
    document.getElementById('pilot-create-photos-input')?.addEventListener('change', (e) => {
      const container = document.getElementById('pilot-create-photo-previews');
      if (!container) return;
      container.innerHTML = '';
      const files = Array.from(e.target.files || []).slice(0, 5);
      files.forEach(file => {
        const url = URL.createObjectURL(file);
        const img = document.createElement('img');
        img.className = 'pilot-preview-thumb';
        img.src = url;
        container.appendChild(img);
      });
    });
    document.getElementById('pilot-entry-photos')?.addEventListener('change', (e) => {
      const container = document.getElementById('pilot-book-photo-previews');
      if (!container) return;
      container.innerHTML = '';
      const files = Array.from(e.target.files || []).slice(0, 5);
      files.forEach(file => {
        const url = URL.createObjectURL(file);
        const img = document.createElement('img');
        img.className = 'pilot-preview-thumb';
        img.src = url;
        container.appendChild(img);
      });
    });

    // Formulário de Criação de Receita do Evento
    document.getElementById('pilot-recipe-create-form')?.addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const submit = form.querySelector('[type="submit"]');
      const error = document.getElementById('pilot-recipe-create-error');
      if (error) error.hidden = true;
      submit.disabled = true;
      try {
        const values = new FormData(form);
        const videoFile = values.get('video');
        let video = null;
        if (videoFile?.size) {
          if (videoFile.size > 4 * 1024 * 1024 || !['video/mp4', 'video/webm'].includes(videoFile.type)) throw new Error('Escolha um vídeo MP4 ou WebM de até 4 MB.');
          video = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Não foi possível ler o vídeo.'));
            reader.readAsDataURL(videoFile);
          });
        }
        const fotos = await readEventPhotos(form.querySelector('[name="fotos"]')?.files);
        if (!fotos.length) throw new Error('Selecione pelo menos uma foto para a receita.');

        const payload = {
          titulo: values.get('titulo'),
          tempoPreparo: Number(values.get('tempoPreparo')),
          ingredientes: values.get('ingredientes'),
          modoPreparo: values.get('modoPreparo'),
          fotos,
          video
        };

        if (currentEventData?.minhaEntrada) {
          pendingReplaceAction = { type: 'create', payload };
          const replaceModal = document.getElementById('event-replace-confirm-modal');
          const replaceMsg = document.getElementById('replace-confirm-message');
          if (replaceMsg) {
            replaceMsg.innerHTML = `Você já possui a receita <strong>"${escapeDesafioHtml(currentEventData.minhaEntrada.titulo || 'sua receita atual')}"</strong> concorrendo oficialmente neste evento.<br><br>Tem certeza de que deseja substituí-la por <strong>"${escapeDesafioHtml(payload.titulo)}"</strong>?<br><br><small style="color:#e0857a;">Atenção: A receita anterior deixará de concorrer e os comentários/avaliações serão reiniciados para manter a competição justa.</small>`;
          }
          if (replaceModal) replaceModal.classList.add('open');
          return;
        }

        await executeCreateEnrollment(payload);
      } catch (err) {
        if (error) { error.textContent = err.message || 'Não foi possível inscrever a receita.'; error.hidden = false; }
      } finally { submit.disabled = false; }
    });

    // Modal de Confirmação de Substituição de Receita
    const replaceModal = document.getElementById('event-replace-confirm-modal');
    document.getElementById('btn-cancel-replace')?.addEventListener('click', () => {
      pendingReplaceAction = null;
      if (replaceModal) replaceModal.classList.remove('open');
    });
    document.getElementById('btn-execute-replace')?.addEventListener('click', async () => {
      if (!pendingReplaceAction) return;
      const action = pendingReplaceAction;
      pendingReplaceAction = null;
      if (replaceModal) replaceModal.classList.remove('open');
      if (action.type === 'book') {
        await executeBookEnrollment(action.receitaId);
      } else if (action.type === 'create') {
        await executeCreateEnrollment(action.payload);
      }
    });

    const closeEntryModal = document.getElementById('close-event-entry-modal');
    const entryModal = document.getElementById('event-entry-modal');
    if (closeEntryModal && entryModal) {
      const resetEntryModal = () => {
        entryModal.classList.remove('open');
        // Resetar step 2 ao fechar
        const pBook = document.getElementById('panel-choose-book');
        const pMedia = document.getElementById('panel-book-media-step');
        if (pBook) pBook.style.display = '';
        if (pMedia) pMedia.style.display = 'none';
        const btnConfirm = document.getElementById('btn-confirm-book-entry');
        if (btnConfirm) { btnConfirm.disabled = false; btnConfirm.innerHTML = '<i class="fa-solid fa-trophy"></i> Confirmar Inscrição no Evento'; }
      };
      closeEntryModal.addEventListener('click', resetEntryModal);
      entryModal.addEventListener('click', (e) => { if (e.target === entryModal) resetEntryModal(); });
    }

    const closeRecipeModal = document.getElementById('close-event-recipe-modal');
    const recipeModal = document.getElementById('event-recipe-detail-modal');
    if (closeRecipeModal && recipeModal) {
      closeRecipeModal.addEventListener('click', () => recipeModal.classList.remove('open'));
      recipeModal.addEventListener('click', (e) => { if (e.target === recipeModal) recipeModal.classList.remove('open'); });
    }

    const cancelVoteBtn = document.getElementById('btn-cancel-vote');
    const voteModal = document.getElementById('event-vote-confirm-modal');
    if (cancelVoteBtn && voteModal) {
      cancelVoteBtn.addEventListener('click', () => { pendingVoteEntradaId = null; voteModal.classList.remove('open'); });
      voteModal.addEventListener('click', (e) => { if (e.target === voteModal) { pendingVoteEntradaId = null; voteModal.classList.remove('open'); } });
    }

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
          if (window.SaboreNotify) window.SaboreNotify('Seu voto foi registrado! Obrigado por participar.', 'success');
          else alert('Seu voto foi registrado! Obrigado por participar.');
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

    const openCreateBtn = document.getElementById('btn-open-create-for-event');
    if (openCreateBtn) {
      openCreateBtn.addEventListener('click', () => {
        if (entryModal) entryModal.classList.remove('open');
        if (openCommunityComposer && currentEventData) {
          openCommunityComposer({ hashtag: currentEventData.hashtag, eventoId: currentEventData.id });
        }
      });
    }
  }

  async function joinPilotEvent(button) {
    if (!currentEventId || button.disabled) return;
    button.disabled = true;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Entrando...';
    try {
      await api.post(`/desafios/eventos/${currentEventId}/entrar`, {});
      await loadSpecialEventsView(currentEventId);
      button.disabled = false;
      showEventJoinCelebration();
    } catch (error) {
      if (window.SaboreNotify) window.SaboreNotify(error.message || 'Não foi possível entrar no evento.', 'error');
      else alert(error.message || 'Não foi possível entrar no evento.');
      button.disabled = false;
      button.innerHTML = '<i class="fa-solid fa-plus-circle"></i> Participar do Evento';
    }
  }

  function showEventJoinCelebration() {
    const layer = document.getElementById('event-join-celebration');
    if (!layer) return;
    layer.replaceChildren();
    const message = document.createElement('div');
    message.className = 'event-join-message';
    message.innerHTML = '<i class="fa-solid fa-circle-check"></i><strong>Você está participando!</strong><span>A galeria do evento já está liberada.</span>';
    const confetti = document.createElement('div');
    confetti.className = 'event-join-confetti';
    const colors = ['#F0D5B6', '#E0857A', '#70D99B', '#8FC9D8', '#E5C85B'];
    for (let i = 0; i < 32; i += 1) {
      const piece = document.createElement('span');
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.backgroundColor = colors[i % colors.length];
      piece.style.animationDelay = `${Math.random() * 0.45}s`;
      piece.style.setProperty('--fall-duration', `${1.4 + Math.random() * 0.8}s`);
      confetti.appendChild(piece);
    }
    layer.append(message, confetti);
    layer.hidden = false;
    requestAnimationFrame(() => layer.classList.add('show'));
    window.setTimeout(() => {
      layer.classList.remove('show');
      window.setTimeout(() => { layer.hidden = true; }, 250);
    }, 2200);
  }

  function updatePilotEventGuide() {
    const steps = [
      ['Entre no evento', 'Clique em Participar do Evento. A galeria será liberada na hora.'],
      ['Inscreva uma receita', 'Essa etapa é opcional no início. Você pode enviar ou trocar sua receita até a votação.'],
      ['Acompanhe o feed', 'Veja apenas as receitas concorrentes, com fotos, preparo e comentários.'],
      ['Vote e veja o resultado', 'Na votação, escolha uma receita. Depois, acompanhe o anúncio do vencedor.']
    ];
    document.querySelectorAll('#event-guide-modal .event-howto-step').forEach((step, index) => {
      if (!steps[index]) return;
      const [title, description] = steps[index];
      const heading = step.querySelector('h5');
      const paragraph = step.querySelector('p');
      if (heading) heading.textContent = title;
      if (paragraph) paragraph.textContent = description;
    });
    const rules = [
      ['Acesso à galeria', 'É preciso participar do evento para ver as receitas inscritas.'],
      ['Uma receita oficial', 'Cada participante pode publicar uma receita exclusiva do evento para concorrer.'],
      ['Troca de receita', 'Você pode trocar sua receita enquanto as inscrições estiverem abertas.'],
      ['Voto único', 'Quem participa pode votar uma vez durante a votação.'],
      ['Voto justo', 'Não é permitido votar na própria receita.'],
      ['Quem vence', 'Ganha a receita com mais votos válidos.'],
      ['Em caso de empate', 'Vence a inscrição aprovada primeiro.']
    ];
    document.querySelectorAll('#event-guide-modal .event-rule-list li').forEach((rule, index) => {
      if (!rules[index]) return;
      const [title, description] = rules[index];
      const strong = rule.querySelector('strong');
      const span = rule.querySelector('span');
      if (strong) strong.textContent = title;
      if (span) span.textContent = description;
    });
  }

  async function loadSpecialEventsView(eventId) {
    const selectorBar = document.getElementById('event-selector-bar');
    let defaultEventId = null;
    if (selectorBar && !specialEventsSelectorLoaded) {
      try {
        defaultEventId = await loadSpecialEventsSelector();
      } catch (err) {
        console.error('Erro ao carregar eventos especiais:', err);
      }
    }
    if (!eventId && selectorBar) {
      const firstPill = selectorBar.querySelector(`[data-event-id="${defaultEventId}"]`) || selectorBar.querySelector('[data-event-id]');
      if (firstPill) {
        eventId = firstPill.dataset.eventId;
        firstPill.classList.add('active');
      }
    }
    if (!eventId) eventId = 1;
    if (String(currentEventId) !== String(eventId)) pilotShowSavedOnly = false;
    currentEventId = eventId;

    try {
      const user = api.getUser();
      const url = user?.id ? `/desafios/eventos/${eventId}?usuarioId=${user.id}` : `/desafios/eventos/${eventId}`;
      const data = await api.get(url);
      if (data.temporario && data.participando) data.feedPosts = (data.galeria || []).map(entry => ({ ...entry, oficial: true })).sort((a, b) => new Date(b.inscritoEm || 0) - new Date(a.inscritoEm || 0));
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
    const isPilot = data.tema === 'piloto' || data.temporario === true;
    const participando = Boolean(data.participando);
    const eventsView = document.getElementById('view-comunidade-eventos');
    if (eventsView) eventsView.dataset.participating = isPilot && participando ? 'true' : 'false';
    const feedShell = document.getElementById('pilot-feed-shell');
    if (feedShell) feedShell.hidden = !(isPilot && participando) || (isPilot && fase === 'ENCERRADO');
    const feedTitle = document.getElementById('pilot-feed-title');
    if (feedTitle && isPilot) feedTitle.textContent = (data.titulo || 'Evento piloto').split('—')[0].trim();
    const feedCreate = document.getElementById('pilot-feed-create');
    const feedActionsWrap = document.getElementById('pilot-feed-actions-wrap');
    if (feedCreate) {
      if (minhaEntrada) {
        // Se já possui receita concorrendo, esconde o botão duplicado de cima
        // mantendo apenas o botão do card de destaque "Sua Receita Concorrente"
        if (feedActionsWrap) feedActionsWrap.style.display = 'none';
        feedCreate.hidden = true;
      } else {
        if (feedActionsWrap) feedActionsWrap.style.display = '';
        feedCreate.hidden = !isPilot || !participando || fase !== 'INSCRICOES';
        feedCreate.innerHTML = '<i class="fa-solid fa-trophy"></i> Inscrever receita no evento';
      }
    }

    const myCompetingCard = document.getElementById('pilot-my-competing-card');
    const myCompetingTitle = document.getElementById('pilot-my-competing-title');
    const myCompetingSub = document.getElementById('pilot-my-competing-sub');
    const myCompetingImg = document.getElementById('pilot-my-competing-img');
    const myCompetingPlaceholder = document.getElementById('pilot-my-competing-placeholder');
    const btnReplaceCompeting = document.getElementById('btn-replace-my-competing');

    if (myCompetingCard) {
      if (isPilot && participando && minhaEntrada) {
        myCompetingCard.style.display = 'flex';
        if (myCompetingTitle) myCompetingTitle.textContent = minhaEntrada.titulo || 'Sua Receita Concorrente';
        if (myCompetingSub) {
          myCompetingSub.textContent = fase === 'VOTACAO'
            ? 'Fase de votação em andamento · Receita bloqueada para votos comunitários'
            : (fase === 'ENCERRADO' ? 'Competição encerrada' : 'Inscrita oficialmente no evento · Você pode substituí-la durante o período de inscrições');
        }
        if (minhaEntrada.imagem) {
          if (myCompetingImg) { myCompetingImg.src = minhaEntrada.imagem; myCompetingImg.style.display = 'block'; }
          if (myCompetingPlaceholder) myCompetingPlaceholder.style.display = 'none';
        } else {
          if (myCompetingImg) myCompetingImg.style.display = 'none';
          if (myCompetingPlaceholder) myCompetingPlaceholder.style.display = 'grid';
        }
        if (btnReplaceCompeting) {
          btnReplaceCompeting.style.display = (fase === 'INSCRICOES' && (!minhaEntrada.votos || minhaEntrada.votos === 0)) ? 'inline-flex' : 'none';
        }
      } else {
        myCompetingCard.style.display = 'none';
      }
    }

    const badgeCountAll = document.getElementById('badge-count-all');
    const badgeCountSaved = document.getElementById('badge-count-saved');
    const badgeCountRanking = document.getElementById('badge-count-ranking');
    if (badgeCountAll) badgeCountAll.textContent = galeria.length;
    if (badgeCountSaved) badgeCountSaved.textContent = galeria.filter(e => e.salvoPorMim).length;
    if (badgeCountRanking) badgeCountRanking.textContent = galeria.length;

    const btnFilterAll = document.getElementById('btn-feed-filter-all');
    const btnFilterSaved = document.getElementById('btn-feed-filter-saved');
    const btnFilterRanking = document.getElementById('btn-feed-filter-ranking');
    if (btnFilterAll) btnFilterAll.classList.toggle('active', pilotActiveTab === 'all');
    if (btnFilterRanking) btnFilterRanking.classList.toggle('active', pilotActiveTab === 'ranking');
    if (btnFilterSaved) btnFilterSaved.classList.toggle('active', pilotActiveTab === 'saved');

    // Exibição e atualização do painel de ranking
    const rankingContainer = document.getElementById('pilot-ranking-container');
    const gallerySection = document.getElementById('event-gallery-section');
    if (rankingContainer) {
      if (isPilot && participando && pilotActiveTab === 'ranking') {
        rankingContainer.style.display = 'block';
        if (gallerySection) gallerySection.style.display = 'none';
        renderPilotRanking(galeria, fase, meuVoto);
      } else {
        rankingContainer.style.display = 'none';
        if (gallerySection) gallerySection.style.display = '';
      }
    }

    // Inicia / atualiza cronômetro de votação em tempo real
    startPilotCountdown(data.votacaoFimEm || data.votacaoEncerraEm, fase);

    if (isPilot) updatePilotEventGuide();
    const banner = document.getElementById('event-banner-card');
    if (banner) {
      banner.dataset.theme = isPilot ? 'piloto' : (isNewYear ? 'reveillon' : 'natal');
      const eventsView = document.getElementById('view-comunidade-eventos');
      if (eventsView) eventsView.dataset.eventTheme = banner.dataset.theme;
    }

    const statusPill = document.getElementById('event-status-pill');
    if (statusPill) {
      const labels = { EM_BREVE: 'Inscrições em breve', INSCRICOES: 'Inscrições abertas', VOTACAO: 'Votação aberta', ENCERRADO: 'Evento encerrado' };
      statusPill.textContent = labels[fase] || fase;
      statusPill.className = `event-status-pill status-${(fase || '').toLowerCase()}`;
    }
    const votingIndicator = document.getElementById('event-voting-indicator');
    if (votingIndicator) {
      if (fase === 'EM_BREVE') {
        votingIndicator.style.display = 'none';
      } else {
        votingIndicator.style.display = '';
        const indicator = fase === 'VOTACAO'
          ? (meuVoto ? ['fa-solid fa-check', 'Você já votou'] : ['fa-solid fa-check-to-slot', 'Votação aberta'])
          : fase === 'ENCERRADO'
            ? [data.resultado ? 'fa-solid fa-trophy' : 'fa-regular fa-clock', data.resultado ? 'Resultado anunciado' : 'Resultado em breve']
            : ['fa-regular fa-clock', 'Votação em breve'];
        votingIndicator.innerHTML = `<i class="${indicator[0]}"></i> ${indicator[1]}`;
        votingIndicator.dataset.phase = String(fase || '').toLowerCase();
      }
    }

    const bannerTitle = document.getElementById('event-banner-title');
    const bannerDesc = document.getElementById('event-banner-desc');
    const hashtagBadge = document.getElementById('event-hashtag-badge');
    const periodText = document.getElementById('event-period-text');
    const participantsCount = document.getElementById('event-participants-count');
    const votesCount = document.getElementById('event-votes-count');

    if (bannerTitle) bannerTitle.textContent = isPilot
      ? (data.titulo || 'Evento piloto').split('—')[0].trim()
      : (data.titulo || (isNewYear ? 'Réveillon Saboré 2027' : 'Natal Saboré 2026'));
    if (bannerDesc && (data.descricao || isNewYear)) {
      bannerDesc.textContent = isNewYear
        ? (data.descricao || 'Celebre a virada com sua receita especial e concorra ao emblema da comunidade.')
        : data.descricao;
    }
    if (hashtagBadge) {
      hashtagBadge.textContent = data.hashtag || '';
      hashtagBadge.title = 'Clique para ver todas as publicações com esta hashtag no feed';
      hashtagBadge.style.cursor = 'pointer';
      hashtagBadge.onclick = (e) => {
        e.stopPropagation();
        if (data.hashtag) {
          activeHashtagFilter = (activeHashtagFilter === data.hashtag) ? null : data.hashtag;
          renderTags();
          renderRecipes();
          const feedView = document.getElementById('view-comunidade-feed');
          const evView = document.getElementById('view-comunidade-eventos');
          if (feedView && evView) {
            evView.style.display = 'none';
            feedView.style.display = '';
            document.getElementById('btn-tab-feed')?.classList.add('active');
            document.getElementById('btn-tab-eventos')?.classList.remove('active');
          }
          recipesContainer?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      };
      const hashtagIcon = hashtagBadge.closest('.event-meta-item')?.querySelector('i');
      if (hashtagIcon) hashtagIcon.className = isPilot ? 'fa-solid fa-link' : 'fa-solid fa-hashtag';
    }
    const hashtagHelp = document.getElementById('event-hashtag-help');
    if (hashtagHelp) hashtagHelp.hidden = !isPilot;
    const dtInicio = data.inicioEm || data.comecaEm;
    const dtFim = data.fimEm || data.encerraEm;
    const dtInscInicio = data.inscricoesInicioEm || data.inscricoesIniciaEm;
    const dtInscFim = data.inscricoesFimEm || data.inscricoesEncerraEm;
    const dtVotInicio = data.votacaoInicioEm || data.votacaoIniciaEm;
    const dtVotFim = data.votacaoFimEm || data.votacaoEncerraEm;

    if (periodText) periodText.textContent = dtInicio && dtFim ? `${formatEventDate(dtInicio)} a ${formatEventDate(dtFim)}/${new Date(dtFim).getFullYear()}` : '';
    if (participantsCount) participantsCount.textContent = `${participantesCount} ${participantesCount === 1 ? 'participante' : 'participantes'}`;
    if (votesCount) votesCount.textContent = `${totalVotos} ${totalVotos === 1 ? 'voto computado' : 'votos computados'}`;
    const votesMeta = document.getElementById('event-votes-meta');
    if (votesMeta) votesMeta.hidden = isPilot && fase !== 'VOTACAO' && fase !== 'ENCERRADO';

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

    [stepInscricoes, stepVotacao, stepResultado].forEach(s => s?.classList.remove('active'));
    if (fase === 'INSCRICOES' && stepInscricoes) stepInscricoes.classList.add('active');
    else if (fase === 'VOTACAO' && stepVotacao) stepVotacao.classList.add('active');
    else if (fase === 'ENCERRADO' && stepResultado) stepResultado.classList.add('active');

    const prizeBadgeName = document.getElementById('event-prize-badge-name');
    const nomeEmblema = data.emblema || data.emblemaId || 'Emblema Especial';
    if (prizeBadgeName) prizeBadgeName.textContent = nomeEmblema;

    const actionCard = document.getElementById('event-user-action-card');
    const actionInfo = document.getElementById('event-user-action-info');
    const openEntryBtn = document.getElementById('btn-open-event-entry-modal');
    if (gallerySection && pilotActiveTab !== 'ranking') {
      gallerySection.style.display = isPilot && !data.acessoLiberado ? 'none' : '';
    }
    if (actionCard) {
      if (isPilot) {
        if (fase === 'ENCERRADO') {
          actionCard.style.display = participando ? 'none' : '';
          if (actionInfo && !participando) actionInfo.innerHTML = '<h3>Evento encerrado</h3><p>Este evento já terminou.</p>';
          if (openEntryBtn) openEntryBtn.style.display = 'none';
        } else if (fase === 'EM_BREVE') {
          actionCard.style.display = '';
          if (actionInfo) actionInfo.innerHTML = '<h3>Evento em breve</h3><p>Entre quando as inscrições começarem.</p>';
          if (openEntryBtn) openEntryBtn.style.display = 'none';
        } else if (!participando) {
          actionCard.style.display = '';
          if (actionInfo) actionInfo.innerHTML = '<h3>Entre para acompanhar o evento</h3><p>Ao participar, você libera a galeria e poderá enviar uma receita ou votar na etapa de votação.</p>';
          if (openEntryBtn) {
            openEntryBtn.style.display = '';
            openEntryBtn.innerHTML = '<i class="fa-solid fa-plus-circle"></i> Participar do Evento';
          }
        } else if (fase === 'VOTACAO') {
          actionCard.style.display = '';
          if (actionInfo) actionInfo.innerHTML = meuVoto
            ? '<h3><i class="fa-solid fa-circle-check"></i> Você já votou</h3><p>Acompanhe os resultados na galeria.</p>'
            : '<h3>Você está participando</h3><p>Escolha sua receita favorita na galeria para registrar seu voto.</p>';
          if (openEntryBtn) openEntryBtn.style.display = 'none';
        } else {
          actionCard.style.display = '';
          if (actionInfo) actionInfo.innerHTML = minhaEntrada
            ? '<h3><i class="fa-solid fa-circle-check"></i> Você está no evento</h3><p>Sua receita está concorrendo. Você pode trocá-la até começar a votação.</p>'
            : '<h3>Você está no evento</h3><p>Acompanhe as receitas ou inscreva uma sua quando quiser.</p>';
          if (openEntryBtn) {
            openEntryBtn.style.display = '';
            openEntryBtn.innerHTML = minhaEntrada
              ? '<i class="fa-solid fa-rotate"></i> Trocar minha receita'
              : '<i class="fa-solid fa-utensils"></i> Inscrever uma receita';
          }
        }
      } else if (fase === 'EM_BREVE') {
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
        actionCard.style.display = 'none';
      }
    }

    const winnerCard = document.getElementById('event-winner-card');
    if (winnerCard) {
      if (fase === 'ENCERRADO' && data.resultado) {
        winnerCard.style.display = 'flex';
        const r = data.resultado;
        const titleEl = document.getElementById('event-winner-recipe-title');
        const authorEl = document.getElementById('event-winner-author');
        const votesEl = document.getElementById('event-winner-votes');
        const profileBtn = document.getElementById('event-winner-profile-btn');
        const authorLink = document.getElementById('event-winner-author-link');
        const emblemaImg = document.getElementById('event-winner-emblem');
        if (titleEl) titleEl.textContent = r.tituloReceita || 'Receita Campeã';
        if (authorEl) authorEl.textContent = r.nomeAutor || 'Chef Vencedor';
        if (votesEl) votesEl.textContent = r.totalVotos || 0;
        const perfilUrl = `../perfil/index.html?id=${r.usuarioId || ''}`;
        if (profileBtn) {
          profileBtn.href = perfilUrl;
          profileBtn.onclick = null;
        }
        if (authorLink) {
          authorLink.href = perfilUrl;
          authorLink.onclick = null;
        }
        if (emblemaImg && data.evento && data.evento.emblemaImg) emblemaImg.src = data.evento.emblemaImg;

        // Timeline: ativa o passo 4 "Encerrado"
        const stepEncerrado = document.getElementById('step-encerrado');
        const arrowEncerrado = document.getElementById('timeline-arrow-encerrado');
        const winnerLink = document.getElementById('step-encerrado-winner-link');
        if (stepEncerrado) stepEncerrado.style.display = '';
        if (arrowEncerrado) arrowEncerrado.style.display = '';
        if (winnerLink) {
          winnerLink.textContent = `Vencedor: ${r.nomeAutor || 'Chef Vencedor'}`;
          winnerLink.href = perfilUrl;
          winnerLink.onclick = null;
        }
        document.getElementById('step-resultado')?.classList.remove('active');
        stepEncerrado?.classList.add('active');

        // Se o usuário logado for o campeão, exibe pop-up de celebração com confetes
        checkAndShowWinnerCelebration(data, r);
      } else {
        winnerCard.style.display = 'none';
        // Oculta passo encerrado se não aplicável
        const stepEncerrado = document.getElementById('step-encerrado');
        const arrowEncerrado = document.getElementById('timeline-arrow-encerrado');
        if (stepEncerrado) stepEncerrado.style.display = 'none';
        if (arrowEncerrado) arrowEncerrado.style.display = 'none';
      }
    }

    const galleryHeading = document.querySelector('#event-gallery-section .title-details h3');
    if (galleryHeading) galleryHeading.textContent = isPilot && participando ? 'Publicações do evento' : 'Galeria de Receitas Inscritas';
    const eventPosts = isPilot && participando ? (data.feedPosts || galeria) : galeria;

    if (pilotActiveTab === 'ranking') {
      const container = document.getElementById('event-gallery-grid');
      if (container) container.innerHTML = '';
      if (gallerySection) gallerySection.style.display = 'none';
      if (rankingContainer) {
        rankingContainer.style.display = 'block';
        renderPilotRanking(galeria, fase, meuVoto);
      }
    } else {
      if (rankingContainer) rankingContainer.style.display = 'none';
      // Se o evento estiver EM_BREVE, não faz sentido exibir galeria vazia
      if (fase === 'EM_BREVE') {
        if (gallerySection) gallerySection.style.display = 'none';
      } else {
        if (gallerySection) gallerySection.style.display = '';
        renderEventGallery(isPilot && pilotShowSavedOnly ? eventPosts.filter(entry => entry.salvoPorMim) : eventPosts, fase, meuVoto, data.id || currentEventId);
      }
    }
  }

  function checkAndShowWinnerCelebration(eventData, resultado) {
    const user = api.getUser();
    if (!user || !resultado) return;

    // Verifica se o usuário logado é o vencedor
    const isWinner = String(user.id) === String(resultado.usuarioId);
    if (!isWinner) return;

    // Evita exibir repetidamente se o usuário já viu permanentemente
    const celebrationSeenKey = `sabore_winner_celebrated_ev_${eventData.id || currentEventId}_u_${user.id}`;
    if (localStorage.getItem(celebrationSeenKey) || sessionStorage.getItem(celebrationSeenKey)) return;

    const modal = document.getElementById('event-winner-celebration-modal');
    if (!modal) return;

    const badgeImg = document.getElementById('winner-modal-badge-img');
    const badgeTitle = document.getElementById('winner-modal-badge-title');
    const modalDesc = document.getElementById('winner-modal-desc');

    if (badgeImg && eventData.emblemaImg) badgeImg.src = eventData.emblemaImg;
    if (badgeTitle && eventData.emblema) badgeTitle.textContent = eventData.emblema;
    if (modalDesc && resultado.tituloReceita) {
      modalDesc.innerHTML = `Sua receita <strong>"${escapeDesafioHtml(resultado.tituloReceita)}"</strong> conquistou <strong>${resultado.totalVotos} votos válidos</strong> e foi a grande campeã oficial do evento!`;
    }

    // Dispara chuva de confetes animados
    generateConfetti('celebration-confetti');

    modal.style.display = 'flex';
    modal.classList.add('open');

    const closeBtn = document.getElementById('close-winner-celebration-modal');
    const acceptBtn = document.getElementById('btn-celebrate-accept');

    const dismissCelebration = () => {
      modal.classList.remove('open');
      modal.style.display = 'none';
      localStorage.setItem(celebrationSeenKey, 'true');
      sessionStorage.setItem(celebrationSeenKey, 'true');
    };

    if (closeBtn) closeBtn.onclick = dismissCelebration;
    if (acceptBtn) {
      acceptBtn.onclick = () => {
        dismissCelebration();
        window.location.href = '../perfil/index.html';
      };
    }
  }

  function generateConfetti(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    const colors = ['#FFD700', '#F0D5B6', '#27C93F', '#E0857A', '#FFFFFF', '#6AD1B2'];
    for (let i = 0; i < 48; i++) {
      const piece = document.createElement('div');
      piece.className = 'celebration-confetti-piece';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = `${Math.random() * 2.5}s`;
      piece.style.animationDuration = `${2.2 + Math.random() * 2}s`;
      piece.style.transform = `scale(${0.6 + Math.random() * 0.8})`;
      container.appendChild(piece);
    }
  }

  function startPilotCountdown(endDateIso, fase) {
    if (pilotCountdownInterval) {
      clearInterval(pilotCountdownInterval);
      pilotCountdownInterval = null;
    }
    const timerEl = document.getElementById('pilot-countdown-timer');
    if (!timerEl) return;

    if (fase === 'ENCERRADO') {
      timerEl.textContent = 'VOTAÇÃO ENCERRADA';
      timerEl.style.color = '#e0857a';
      return;
    }

    if (!endDateIso) {
      timerEl.textContent = '--:--:--';
      return;
    }

    const endTarget = new Date(endDateIso).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = endTarget - now;
      if (diff <= 0) {
        timerEl.textContent = 'ENCERRADA';
        timerEl.style.color = '#e0857a';
        clearInterval(pilotCountdownInterval);
        pilotCountdownInterval = null;
        // Recarrega automaticamente a view para apurar o vencedor em tempo real
        loadSpecialEventsView(currentEventId);
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      timerEl.textContent = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      timerEl.style.color = diff < 600000 ? '#e0857a' : '#ffd700'; // Vermelho nos últimos 10 min
    };

    updateTimer();
    pilotCountdownInterval = setInterval(updateTimer, 1000);
  }

  function renderPilotRanking(galeria, fase, meuVoto) {
    const listEl = document.getElementById('pilot-ranking-list');
    if (!listEl) return;

    if (!galeria || galeria.length === 0) {
      listEl.innerHTML = '<p class="gallery-empty-state"><i class="fa-solid fa-trophy"></i><br>Nenhuma receita concorrendo no momento.</p>';
      return;
    }

    // Ordena decrescente por votos
    const sorted = [...galeria].sort((a, b) => (b.votos || 0) - (a.votos || 0) || new Date(a.inscritoEm || 0) - new Date(b.inscritoEm || 0));
    const user = api.getUser();
    const podeVotar = fase === 'VOTACAO' && !meuVoto;

    listEl.innerHTML = sorted.map((entry, index) => {
      const rankPos = index + 1;
      const rankClass = rankPos === 1 ? 'rank-1' : (rankPos === 2 ? 'rank-2' : (rankPos === 3 ? 'rank-3' : ''));
      const badgeIcon = rankPos === 1 ? '🥇' : (rankPos === 2 ? '🥈' : (rankPos === 3 ? '🥉' : `${rankPos}º`));
      const isOwn = user && String(entry.autor?.id) === String(user.id);
      const myVoteHere = meuVoto && meuVoto.entradaId === entry.id;
      const title = escapeDesafioHtml(entry.titulo || 'Receita Concorrente');
      const photo = (Array.isArray(entry.fotos) && entry.fotos[0]) || entry.imagem || null;

      return `
        <div class="pilot-rank-item ${rankClass}" data-entry-id="${entry.id}">
          <div class="pilot-rank-badge">${badgeIcon}</div>
          ${photo ? `<img class="pilot-rank-thumb" src="${escapeDesafioHtml(photo)}" alt="${title}">` : '<div class="pilot-rank-thumb-placeholder"><i class="fa-solid fa-utensils"></i></div>'}
          <div class="pilot-rank-info">
            <h4 class="pilot-rank-title">${title}</h4>
            <div class="pilot-rank-author">
              <span>Chef: <strong>${api.renderUserIdentity(entry.autor?.nome || 'Chef', entry.autor?.plano)}</strong></span>
              ${isOwn ? '<span style="color:#f0d5b6;font-weight:700;">(Sua Receita)</span>' : ''}
              ${myVoteHere ? '<span style="color:#ffd700;font-weight:700;"><i class="fa-solid fa-circle-check"></i> Seu Voto</span>' : ''}
            </div>
          </div>
          <div class="pilot-rank-score-box">
            <div class="pilot-rank-votes">
              <i class="fa-solid fa-check-to-slot"></i>
              <span>${entry.votos || 0}</span>
              <small>${entry.votos === 1 ? 'voto' : 'votos'}</small>
            </div>
            <div style="display:flex;gap:6px;justify-content:flex-end;">
              <button type="button" class="pilot-rank-item-btn btn-gallery-view" data-entry-id="${entry.id}">
                <i class="fa-solid fa-book-open"></i> Ver
              </button>
              ${podeVotar && !isOwn ? `
                <button type="button" class="pilot-rank-item-btn btn-rank-vote" data-entry-id="${entry.id}" data-entry-title="${title}" style="background:#f0d5b6;color:#14352f;font-weight:700;">
                  <i class="fa-solid fa-check-to-slot"></i> Votar
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Reanexa handlers para o botão de votar a partir do ranking
    listEl.querySelectorAll('.btn-rank-vote').forEach(btn => {
      btn.addEventListener('click', () => {
        const entId = Number(btn.dataset.entryId);
        const title = btn.dataset.entryTitle;
        openVoteConfirmModal(entId, title);
      });
    });

    // Reanexa handlers para o botão de ver receita completa a partir do ranking
    listEl.querySelectorAll('.btn-gallery-view').forEach(btn => {
      btn.addEventListener('click', () => {
        const entId = Number(btn.dataset.entryId);
        const item = galeria.find(g => g.id === entId);
        if (item) openEventRecipeModal(item);
      });
    });
  }

  function renderEventGallery(galeria, fase, meuVoto, eventoId) {
    const container = document.getElementById('event-gallery-grid');
    const subtitle = document.getElementById('event-gallery-subtitle');
    if (!container) return;
    container.classList.toggle('pilot-feed-list', Boolean(currentEventData?.temporario && currentEventData?.participando));

    if (!galeria || galeria.length === 0) {
      container.innerHTML = currentEventData?.temporario
        ? `<div class="gallery-empty-state"><i class="fa-solid fa-camera"></i><p>${pilotShowSavedOnly ? 'Você ainda não salvou nenhuma receita deste evento.' : 'Ainda não há receitas inscritas neste evento. Seja o primeiro a publicar.'}</p></div>`
        : '<div class="gallery-empty-state"><i class="fa-solid fa-utensils"></i><p>Nenhuma receita inscrita ainda. Seja o primeiro a participar!</p></div>';
      if (subtitle) subtitle.textContent = currentEventData?.temporario ? 'Apenas receitas inscritas no evento aparecem aqui.' : 'Apenas inscrições oficiais aprovadas aparecem na votação.';
      return;
    }

    const user = api.getUser();
    const podeVotar = fase === 'VOTACAO' && !meuVoto;

    if (subtitle) {
      if (currentEventData?.temporario) subtitle.textContent = `${galeria.length} ${galeria.length === 1 ? 'receita concorrente' : 'receitas concorrentes'} no evento.`;
      else if (fase === 'VOTACAO') subtitle.textContent = podeVotar
        ? `${galeria.length} ${galeria.length === 1 ? 'receita disputando' : 'receitas disputando'} — Vote na sua favorita!`
        : `${galeria.length} ${galeria.length === 1 ? 'receita' : 'receitas'} — Votação em andamento.`;
      else if (fase === 'ENCERRADO') subtitle.textContent = `${galeria.length} ${galeria.length === 1 ? 'receita participou' : 'receitas participaram'} do evento.`;
      else subtitle.textContent = `${galeria.length} ${galeria.length === 1 ? 'receita inscrita' : 'receitas inscritas'} oficialmente.`;
    }

    container.innerHTML = galeria.map(entry => {
      const isOwn = user && String(entry.autor?.id) === String(user.id);
      const myVoteHere = meuVoto && meuVoto.entradaId === entry.id;
      const canVoteThis = podeVotar && !isOwn && (!currentEventData?.temporario || entry.oficial);

      const authorInitial = String(entry.autor?.nome || 'S').trim().charAt(0).toUpperCase();

      if (currentEventData?.temporario) {
        const title = escapeDesafioHtml(entry.titulo || 'Receita participante');
        const rawPhotos = Array.isArray(entry.fotos) && entry.fotos.length ? entry.fotos : [entry.imagem].filter(Boolean);
        
        // Monta os itens de mídia do carrossel (se tiver vídeo, vem primeiro como solicitado pelo usuário)
        const mediaItems = [];
        if (entry.video) {
          mediaItems.push({ type: 'video', src: entry.video });
        }
        rawPhotos.slice(0, 5).forEach(photo => {
          mediaItems.push({ type: 'image', src: photo });
        });

        return `
          <article class="pilot-feed-post" data-entry-id="${entry.id}">
            <div class="pilot-post-author">
              <span class="gallery-author-avatar" aria-hidden="true">${escapeDesafioHtml(authorInitial)}</span>
              <div class="pilot-post-author-copy">
                <strong>${api.renderUserIdentity(entry.autor?.nome || 'Chef', entry.autor?.plano)}</strong>
                <small>
                  <span class="pilot-concorrente-pill"><i class="fa-solid fa-trophy"></i> Concorrente Oficial</span>
                  ${isOwn ? '<span style="color:#f0d5b6;font-weight:700;">· Sua receita</span>' : ''}
                </small>
              </div>
              <span class="pilot-post-tag"><i class="fa-solid fa-hashtag"></i> ${escapeDesafioHtml(currentEventData.hashtag || 'Evento')}</span>
            </div>
            
            <!-- Carrossel de Mídia Estilo Instagram (Vídeo + Fotos integrados em proporção quadrada 1:1) -->
            <div class="pilot-carousel ${mediaItems.length ? '' : 'is-empty'}" data-slide="0">
              <div class="pilot-carousel-track">
                ${mediaItems.length ? mediaItems.map((item, index) => {
                  if (item.type === 'video') {
                    return `
                      <div class="pilot-carousel-slide" data-slide-index="${index}" ${index ? 'hidden' : ''}>
                        <video class="pilot-post-video" controls preload="metadata" playsinline src="${escapeDesafioHtml(item.src)}"></video>
                      </div>
                    `;
                  }
                  return `
                    <div class="pilot-carousel-slide" data-slide-index="${index}" ${index ? 'hidden' : ''}>
                      <img src="${escapeDesafioHtml(item.src)}" alt="${title} — mídia ${index + 1}" loading="lazy">
                    </div>
                  `;
                }).join('') : '<div class="pilot-carousel-empty"><i class="fa-solid fa-utensils"></i><span>Receita do evento</span></div>'}
              </div>
              ${mediaItems.length > 1 ? `
                <button type="button" class="pilot-carousel-prev" aria-label="Anterior"><i class="fa-solid fa-chevron-left"></i></button>
                <button type="button" class="pilot-carousel-next" aria-label="Próximo"><i class="fa-solid fa-chevron-right"></i></button>
                <div class="pilot-carousel-dots">
                  ${mediaItems.map((_, i) => `<span class="pilot-dot ${i === 0 ? 'active' : ''}"></span>`).join('')}
                </div>
                <span class="pilot-carousel-count">1 / ${mediaItems.length}</span>
              ` : ''}
            </div>

            <div class="pilot-post-content">
              <div class="pilot-post-header-row">
                <h4>${title}</h4>
                <div class="pilot-post-meta-badges">
                  ${entry.tempoPreparo ? `<span class="pilot-meta-pill"><i class="fa-regular fa-clock"></i> ${Number(entry.tempoPreparo)} min</span>` : ''}
                  ${fase !== 'INSCRICOES' && entry.votos !== undefined ? `<span class="pilot-meta-pill" style="color:#ffd700;border-color:rgba(255,215,0,0.3);"><i class="fa-solid fa-check-to-slot"></i> ${entry.votos} ${entry.votos === 1 ? 'voto' : 'votos'}</span>` : ''}
                </div>
              </div>

              <div class="pilot-post-actions">
                <div class="pilot-actions-left">
                  <button type="button" class="btn-pilot-view-recipe btn-gallery-view" data-entry-id="${entry.id}">
                    <i class="fa-solid fa-book-open"></i> Ver receita completa
                  </button>
                  <button type="button" class="btn-pilot-action-chip pilot-post-save ${entry.salvoPorMim ? 'is-saved' : ''}" data-entry-id="${entry.id}" title="${entry.salvoPorMim ? 'Remover dos salvos' : 'Salvar nas suas receitas salvas do evento'}">
                    <i class="${entry.salvoPorMim ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i>
                    <span>${entry.salvoPorMim ? 'Salva' : 'Salvar'}</span>
                  </button>
                  <button type="button" class="btn-pilot-action-chip pilot-post-comment-toggle" data-entry-id="${entry.id}">
                    <i class="fa-regular fa-comment"></i>
                    <span>${entry.comentarios?.length || 0} comentários</span>
                  </button>
                </div>

                <div class="pilot-actions-right">
                  <div class="pilot-post-rating-wrap" title="${isOwn ? 'Média das avaliações da sua receita' : 'Clique nas estrelas para avaliar esta receita'}">
                    <div class="pilot-post-stars" data-entry-id="${entry.id}" data-is-own="${isOwn}">
                      ${[1, 2, 3, 4, 5].map(n => {
                        const isFilled = (entry.minhaAvaliacao && entry.minhaAvaliacao >= n) || (!entry.minhaAvaliacao && entry.avaliacaoMedia && Math.round(entry.avaliacaoMedia) >= n);
                        return `<i class="${isFilled ? 'fa-solid' : 'fa-regular'} fa-star ${isFilled ? 'filled' : ''}" data-star="${n}"></i>`;
                      }).join('')}
                    </div>
                    <div class="pilot-rating-summary">
                      <span class="pilot-rating-score">${entry.avaliacaoMedia ? `★ ${entry.avaliacaoMedia}` : 'Sem nota'}</span>
                      <span class="pilot-rating-count">(${entry.avaliacoesCount || 0})${entry.minhaAvaliacao ? `<span class="pilot-own-rating-indicator">${entry.minhaAvaliacao}★</span>` : ''}</span>
                    </div>
                  </div>

                  ${canVoteThis ? `<button type="button" class="btn-pilot-vote btn-gallery-vote" data-entry-id="${entry.id}" data-entry-title="${title}"><i class="fa-solid fa-check-to-slot"></i> Votar</button>` : ''}
                  ${myVoteHere ? '<span class="vote-already-pill"><i class="fa-solid fa-circle-check"></i> Seu voto</span>' : ''}
                </div>
              </div>

              <div class="pilot-post-comments" hidden>
                <div class="pilot-post-comment-list">
                  ${(entry.comentarios || []).map(comment => `<p><strong>${escapeDesafioHtml(comment.autor)}:</strong> ${escapeDesafioHtml(comment.texto)}</p>`).join('') || '<p style="text-align:center;color:rgba(242,244,243,0.5);">Seja o primeiro a deixar um comentário!</p>'}
                </div>
                <form class="pilot-post-comment-form" data-entry-id="${entry.id}">
                  <input name="texto" required minlength="2" maxlength="500" placeholder="Escreva seu comentário ou dica...">
                  <button type="submit"><i class="fa-solid fa-paper-plane"></i> Enviar</button>
                </form>
              </div>
            </div>
          </article>
        `;
      }

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

    container.querySelectorAll('.pilot-carousel').forEach(carousel => {
      const slides = Array.from(carousel.querySelectorAll('.pilot-carousel-slide'));
      if (slides.length < 2) return;
      const dots = Array.from(carousel.querySelectorAll('.pilot-dot'));
      const counter = carousel.querySelector('.pilot-carousel-count');

      const change = step => {
        const currentIdx = Number(carousel.dataset.slide || 0);
        const currentSlide = slides[currentIdx];
        const currentVideo = currentSlide?.querySelector('video');
        if (currentVideo) currentVideo.pause();

        const index = (currentIdx + step + slides.length) % slides.length;
        slides.forEach((slide, idx) => {
          slide.hidden = idx !== index;
        });
        dots.forEach((dot, idx) => {
          dot.classList.toggle('active', idx === index);
        });
        carousel.dataset.slide = String(index);
        if (counter) counter.textContent = `${index + 1} / ${slides.length}`;
      };

      carousel.querySelector('.pilot-carousel-prev')?.addEventListener('click', (e) => {
        e.stopPropagation();
        change(-1);
      });
      carousel.querySelector('.pilot-carousel-next')?.addEventListener('click', (e) => {
        e.stopPropagation();
        change(1);
      });
    });

    container.querySelectorAll('.gallery-author-avatar[data-src]').forEach(el => {
    });

    container.querySelectorAll('.btn-gallery-view').forEach(btn => {
      btn.addEventListener('click', () => {
        const entryId = Number(btn.dataset.entryId);
        const entry = galeria.find(e => e.id === entryId);
        if (entry) openEventRecipeModal(entry);
      });
    });

    container.querySelectorAll('.pilot-post-save').forEach(btn => btn.addEventListener('click', async () => {
      btn.disabled = true;
      try {
        const res = await api.post(`/desafios/eventos/${eventoId}/receitas/${btn.dataset.entryId}/salvar`, {});
        if (window.SaboreNotify) window.SaboreNotify(res.mensagem || 'Receita salva com sucesso!', 'success');
        await loadSpecialEventsView(eventoId);
      } catch (err) {
        alert(err.message || 'Não foi possível salvar.');
        btn.disabled = false;
      }
    }));

    container.querySelectorAll('.pilot-post-stars').forEach(starsWrap => {
      const isOwn = starsWrap.dataset.isOwn === 'true';
      if (isOwn) return;
      const entryId = starsWrap.dataset.entryId;
      const stars = starsWrap.querySelectorAll('i[data-star]');

      stars.forEach(star => {
        star.addEventListener('mouseenter', () => {
          const rating = Number(star.dataset.star);
          stars.forEach(s => {
            const val = Number(s.dataset.star);
            s.className = (val <= rating ? 'fa-solid' : 'fa-regular') + ' fa-star' + (val <= rating ? ' active' : '');
          });
        });
        star.addEventListener('mouseleave', () => {
          const entry = galeria.find(e => e.id === Number(entryId));
          const currentNota = entry?.minhaAvaliacao || (entry?.avaliacaoMedia ? Math.round(entry.avaliacaoMedia) : 0);
          stars.forEach(s => {
            const val = Number(s.dataset.star);
            const isFilled = val <= currentNota;
            s.className = (isFilled ? 'fa-solid' : 'fa-regular') + ' fa-star' + (isFilled ? ' filled' : '');
          });
        });
        star.addEventListener('click', async () => {
          const rating = Number(star.dataset.star);
          try {
            await api.post(`/desafios/eventos/${eventoId}/receitas/${entryId}/avaliar`, { nota: rating });
            if (window.SaboreNotify) window.SaboreNotify(`Sua avaliação de ${rating} estrelas foi registrada!`, 'success');
            await loadSpecialEventsView(eventoId);
          } catch (err) {
            alert(err.message || 'Não foi possível avaliar a receita.');
          }
        });
      });
    });

    container.querySelectorAll('.pilot-post-comment-toggle').forEach(btn => btn.addEventListener('click', () => {
      const comments = btn.closest('.pilot-post-content')?.querySelector('.pilot-post-comments');
      if (comments) comments.hidden = !comments.hidden;
    }));
    container.querySelectorAll('.pilot-post-comment-form').forEach(form => form.addEventListener('submit', async event => {
      event.preventDefault();
      const btn = form.querySelector('button');
      btn.disabled = true;
      try {
        await api.post(`/desafios/eventos/${eventoId}/receitas/${form.dataset.entryId}/comentario`, { texto: form.elements.texto.value });
        await loadSpecialEventsView(eventoId);
      } catch (err) { alert(err.message); btn.disabled = false; }
    }));

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

    modal.classList.toggle('pilot-recipe-modal', Boolean(currentEventData?.temporario));

    if (currentEventData?.temporario) {
      const title = escapeDesafioHtml(entry.titulo || 'Receita participante');
      const description = escapeDesafioHtml(entry.descricao || 'Uma receita participante do evento.');
      const author = escapeDesafioHtml(entry.autor?.nome || 'Chef Saboré');
      const initial = escapeDesafioHtml(author.charAt(0).toUpperCase());
      const ingredients = Array.isArray(entry.ingredientes) && entry.ingredientes.length
        ? entry.ingredientes.map(ingredient => {
            const name = ingredient.ingrediente?.nome || ingredient.nome || ingredient;
            return `<li>${escapeDesafioHtml([ingredient.quantidade, ingredient.unidade, name].filter(Boolean).join(' '))}</li>`;
          }).join('')
        : '<li>Ingredientes não informados.</li>';
      const steps = String(entry.modoPreparo || '').split('\n').map(step => step.trim()).filter(Boolean);
      const preparation = steps.length
        ? steps.map((step, index) => {
            const cleanStep = step.replace(/^\d{1,2}(?:[.)-]\s*|\s+(?=[A-Za-zÀ-ÿ])|(?=[A-ZÀ-Ý]))/, '').trim();
            return `<li><span class="pilot-step-number">${index + 1}</span><span>${escapeDesafioHtml(cleanStep || step)}</span></li>`;
          }).join('')
        : '<li>Modo de preparo não informado.</li>';
      content.innerHTML = `
        <div class="pilot-recipe-hero ${entry.imagem ? 'has-image' : 'no-image'}">
          ${entry.imagem ? `<img src="${escapeDesafioHtml(entry.imagem)}" alt="${title}">` : '<div class="pilot-recipe-hero-mark"><i class="fa-solid fa-utensils"></i><span>Receita do evento</span></div>'}
        </div>
        <div class="pilot-recipe-content">
          <span class="pilot-card-eyebrow">Competição Culinária · ${escapeDesafioHtml(currentEventData?.titulo || 'Evento')}</span>
          <h2>${title}</h2>
          <div class="pilot-recipe-byline"><span class="gallery-author-avatar">${initial}</span><span>Receita de <strong>${author}</strong></span>${entry.tempoPreparo ? `<span class="pilot-recipe-time"><i class="fa-regular fa-clock"></i> ${Number(entry.tempoPreparo)} min</span>` : ''}</div>
          <div class="pilot-recipe-sections">
            <section class="pilot-recipe-section"><h3><i class="fa-solid fa-basket-shopping"></i> Ingredientes</h3><ul class="pilot-ingredient-list">${ingredients}</ul></section>
            <section class="pilot-recipe-section"><h3><i class="fa-solid fa-fire-burner"></i> Modo de preparo</h3><ol class="pilot-preparation-list">${preparation}</ol></section>
          </div>
        </div>
      `;
      modal.classList.add('open');
      return;
    }

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

    const alertEl = document.getElementById('event-entry-modal-alert');
    if (alertEl) alertEl.style.display = 'none';

    // Garante que o painel inicial seja o do Livro de Receitas
    const btnTabBook = document.getElementById('tab-btn-choose-book');
    const btnTabCreate = document.getElementById('tab-btn-create-new');
    const panelBook = document.getElementById('panel-choose-book');
    const panelCreate = document.getElementById('panel-create-new');
    if (btnTabBook && btnTabCreate && panelBook && panelCreate) {
      btnTabBook.classList.add('active');
      btnTabCreate.classList.remove('active');
      panelBook.style.display = '';
      panelCreate.style.display = 'none';
    }

    const listEl = document.getElementById('entry-existing-recipes-list');
    if (listEl) {
      listEl.innerHTML = '<p style="color:rgba(242,244,243,.6);font-size:.85rem;padding:12px;text-align:center;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando suas receitas do livro...</p>';
      try {
        const minhas = await api.get('/receitas/listar');
        const listaReceitas = Array.isArray(minhas) ? minhas : (minhas?.receitas || []);
        if (listaReceitas.length === 0) {
          listEl.innerHTML = '<p class="event-entry-empty" style="padding:15px;text-align:center;color:rgba(242,244,243,.7);">Você ainda não tem receitas cadastradas no seu livro. Crie uma na aba "Criar Nova Receita"!</p>';
        } else {
          listEl.innerHTML = listaReceitas.map(r => {
            const title = escapeDesafioHtml(r.titulo || r.title || 'Receita sem título');
            const img = r.imagem || r.image || null;
            const time = r.tempoPreparo || r.time || null;
            const isCurrent = currentEventData.minhaEntrada && String(currentEventData.minhaEntrada.receitaId) === String(r.id);
            return `
              <div class="entry-recipe-pick-item ${isCurrent ? 'is-current' : ''}">
                ${img ? `<img src="${escapeDesafioHtml(img)}" alt="${title}">` : '<div class="entry-recipe-pick-thumb no-img"><i class="fa-solid fa-utensils"></i></div>'}
                <div class="entry-pick-info">
                  <strong>${title}</strong>
                  <span>${time ? `<i class="fa-regular fa-clock"></i> ${time} min` : 'Receita do livro'}${isCurrent ? ' · 🏆 Sua escolha atual' : ''}</span>
                </div>
                <button type="button" class="btn-confirm-entry btn-select-entry" data-recipe-id="${r.id}" data-recipe-title="${title}" ${isCurrent ? 'disabled' : ''}>
                  ${isCurrent ? 'Inscrita' : (currentEventData.minhaEntrada ? 'Substituir' : 'Escolher')}
                </button>
              </div>
            `;
          }).join('');

          // Variável para guardar a receita selecionada no step 2
          let _pendingBookReceitaId = null;

          listEl.querySelectorAll('.btn-select-entry').forEach(btn => {
            btn.addEventListener('click', () => {
              const receitaId = Number(btn.dataset.recipeId);
              const recipeTitle = btn.dataset.recipeTitle;

              if (currentEventData.minhaEntrada) {
                pendingReplaceAction = { type: 'book', receitaId, title: recipeTitle };
                const replaceModal = document.getElementById('event-replace-confirm-modal');
                const replaceMsg = document.getElementById('replace-confirm-message');
                if (replaceMsg) {
                  replaceMsg.innerHTML = `Você já possui a receita <strong>"${escapeDesafioHtml(currentEventData.minhaEntrada.titulo || 'sua receita atual')}"</strong> concorrendo oficialmente neste evento.<br><br>Tem certeza de que deseja substituí-la por <strong>"${escapeDesafioHtml(recipeTitle)}"</strong>?<br><br><small style="color:#e0857a;">Atenção: A receita anterior deixará de concorrer e os comentários/avaliações serão reiniciados para manter a competição justa.</small>`;
                }
                if (replaceModal) replaceModal.classList.add('open');
                return;
              }

              // Avançar para step 2 de mídia
              _pendingBookReceitaId = receitaId;
              const infoEl = document.getElementById('book-media-selected-recipe-info');
              if (infoEl) infoEl.textContent = `📖 ${recipeTitle}`;

              // Limpar campos e preview do step anterior
              const photosInput = document.getElementById('pilot-entry-photos');
              if (photosInput) photosInput.value = '';
              const videoInput = document.getElementById('pilot-entry-video');
              if (videoInput) videoInput.value = '';
              const prevEl = document.getElementById('pilot-book-photo-previews');
              if (prevEl) prevEl.innerHTML = '';
              const vidPrev = document.getElementById('pilot-book-video-preview');
              if (vidPrev) vidPrev.innerHTML = '';
              const errEl = document.getElementById('book-media-step-error');
              if (errEl) errEl.style.display = 'none';

              document.getElementById('panel-choose-book').style.display = 'none';
              document.getElementById('panel-book-media-step').style.display = '';
            });
          });

          // Botão voltar ao passo 1
          const btnBack = document.getElementById('btn-back-to-book-list');
          if (btnBack) {
            btnBack.onclick = () => {
              document.getElementById('panel-book-media-step').style.display = 'none';
              document.getElementById('panel-choose-book').style.display = '';
            };
          }

          // Preview de fotos no step 2
          const photosInputStep2 = document.getElementById('pilot-entry-photos');
          if (photosInputStep2) {
            photosInputStep2.addEventListener('change', () => {
              const prevEl = document.getElementById('pilot-book-photo-previews');
              if (!prevEl) return;
              prevEl.innerHTML = '';
              Array.from(photosInputStep2.files).slice(0, 5).forEach(f => {
                const img = document.createElement('img');
                img.style.cssText = 'width:60px;height:60px;object-fit:cover;border-radius:8px;margin:4px;';
                img.src = URL.createObjectURL(f);
                prevEl.appendChild(img);
              });
            });
          }

          // Preview de vídeo no step 2
          const videoInputStep2 = document.getElementById('pilot-entry-video');
          if (videoInputStep2) {
            videoInputStep2.addEventListener('change', () => {
              const vidPrev = document.getElementById('pilot-book-video-preview');
              if (!vidPrev) return;
              vidPrev.innerHTML = '';
              if (videoInputStep2.files[0]) {
                const v = document.createElement('video');
                v.src = URL.createObjectURL(videoInputStep2.files[0]);
                v.controls = true;
                v.style.cssText = 'max-width:100%;border-radius:10px;max-height:160px;';
                vidPrev.appendChild(v);
              }
            });
          }

          // Botão confirmar inscrição no step 2
          const btnConfirm = document.getElementById('btn-confirm-book-entry');
          if (btnConfirm) {
            btnConfirm.onclick = async () => {
              if (!_pendingBookReceitaId) return;
              const errEl = document.getElementById('book-media-step-error');
              const photos = document.getElementById('pilot-entry-photos');
              const videoInp = document.getElementById('pilot-entry-video');
              try {
                btnConfirm.disabled = true;
                btnConfirm.textContent = 'Inscrevendo...';
                let fotos = [];
                if (photos?.files?.length) fotos = await readEventPhotos(photos.files);
                let video = null;
                if (videoInp?.files?.length) {
                  const vf = videoInp.files[0];
                  if (vf.size > 20 * 1024 * 1024) throw new Error('Vídeo muito grande. Máximo 20 MB.');
                  video = await new Promise((res, rej) => {
                    const r = new FileReader();
                    r.onload = e => res(e.target.result);
                    r.onerror = rej;
                    r.readAsDataURL(vf);
                  });
                }
                await executeBookEnrollment(_pendingBookReceitaId, fotos, video);
              } catch (err) {
                btnConfirm.disabled = false;
                btnConfirm.innerHTML = '<i class="fa-solid fa-trophy"></i> Confirmar Inscrição no Evento';
                if (errEl) { errEl.textContent = err.message || 'Erro ao inscrever.'; errEl.style.display = ''; }
              }
            };
          }
        }
      } catch (err) {
        listEl.innerHTML = `<p class="event-entry-empty">Não foi possível carregar as receitas do livro: ${escapeDesafioHtml(err.message || '')}</p>`;
      }
    }

    modal.classList.add('open');
  }

  async function executeBookEnrollment(receitaId, fotos = [], video = null) {
    const modal = document.getElementById('event-entry-modal');
    const alertEl = document.getElementById('event-entry-modal-alert');
    try {
      await api.post(`/desafios/eventos/${currentEventId}/inscrever`, { receitaId, fotos, video });
      if (modal) modal.classList.remove('open');
      // Resetar step 2 para próxima vez
      const pBook = document.getElementById('panel-choose-book');
      const pMedia = document.getElementById('panel-book-media-step');
      if (pBook) pBook.style.display = '';
      if (pMedia) pMedia.style.display = 'none';
      const btnConfirm = document.getElementById('btn-confirm-book-entry');
      if (btnConfirm) { btnConfirm.disabled = false; btnConfirm.innerHTML = '<i class="fa-solid fa-trophy"></i> Confirmar Inscrição no Evento'; }
      if (window.SaboreNotify) window.SaboreNotify('Receita inscrita com sucesso no evento!', 'success');
      else alert('Receita inscrita com sucesso no evento!');
      await loadSpecialEventsView(currentEventId);
    } catch (err) {
      if (alertEl) { alertEl.textContent = err.message || 'Erro ao inscrever receita.'; alertEl.style.display = ''; }
      else alert(err.message || 'Erro ao inscrever receita.');
      throw err;
    }
  }

  async function executeCreateEnrollment(payload) {
    const modal = document.getElementById('event-entry-modal');
    const errorEl = document.getElementById('pilot-recipe-create-error');
    try {
      await api.post(`/desafios/eventos/${currentEventId}/receitas`, payload);
      document.getElementById('pilot-recipe-create-form')?.reset();
      const previews = document.getElementById('pilot-create-photo-previews');
      if (previews) previews.innerHTML = '';
      if (modal) modal.classList.remove('open');
      if (window.SaboreNotify) window.SaboreNotify('Sua receita foi criada e inscrita com sucesso no evento!', 'success');
      else alert('Sua receita foi criada e inscrita com sucesso no evento!');
      await loadSpecialEventsView(currentEventId);
    } catch (err) {
      if (errorEl) { errorEl.textContent = err.message || 'Não foi possível inscrever a receita.'; errorEl.hidden = false; }
      else alert(err.message || 'Não foi possível inscrever a receita.');
    }
  }

  window.addEventListener('focus', () => {
    refreshExploreFeed(false);
  });
});

