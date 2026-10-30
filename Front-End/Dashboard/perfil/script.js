document.addEventListener('DOMContentLoaded', () => {
  const user = api.getUser();
  if (!user) {
    window.location.href = "../../login/index.html";
    return;
  }
  let userState = {
    isPro: false,
    bio: localStorage.getItem('sabore_user_bio') || '',
    preferences: localStorage.getItem('sabore_user_preferences') ? JSON.parse(localStorage.getItem('sabore_user_preferences')) : [],
    featuredCreations: JSON.parse(localStorage.getItem(`sabore_profile_creations_${user.id}`) || '[]')
  };
  const customCursor = document.createElement('div');
  customCursor.className = 'custom-cursor';
  document.body.appendChild(customCursor);
  document.addEventListener('mousemove', (e) => {
    customCursor.style.left = e.clientX + 'px';
    customCursor.style.top = e.clientY + 'px';
  });
  function updateCursorHoverListeners() {
    const interactives = document.querySelectorAll('a, button, input, select, textarea, [role="button"], option, .pref-tag-chip');
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
  const largeAvatarEl = document.querySelector('.large-user-avatar');
  const removeAvatarBtn = document.getElementById('btn-remove-avatar');
  const avatarContainer = document.querySelector('.avatar-container');
  const avatarInput = document.getElementById('avatar-upload-input');
  function applyAvatarToPage(url) {
    const navAvatar = document.querySelector('.user-avatar');
    if (navAvatar) {
      const wrap = navAvatar.parentElement;
      if (url) { 
        navAvatar.src = url; 
        navAvatar.style.display = 'block'; 
        if (wrap) {
          const ph = wrap.querySelector('.user-avatar-placeholder');
          if (ph) ph.remove();
        }
      } else { 
        navAvatar.style.display = 'none'; 
        if (wrap) {
          let ph = wrap.querySelector('.user-avatar-placeholder');
          if (!ph) {
            ph = document.createElement('div');
            ph.className = 'user-avatar-placeholder';
            ph.style.cssText = 'width:32px;height:32px;border-radius:50%;background:var(--accent);color:var(--dark-deep);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.9rem;user-select:none;';
            wrap.insertBefore(ph, wrap.firstChild);
          }
          ph.textContent = user.nome ? user.nome.charAt(0).toUpperCase() : 'U';
        }
      }
    }
    if (largeAvatarEl) {
      if (url) {
        largeAvatarEl.src = url;
        largeAvatarEl.style.display = 'block';
        const ph = largeAvatarEl.parentElement ? largeAvatarEl.parentElement.querySelector('.large-avatar-placeholder') : null;
        if (ph) ph.remove();
      } else {
        largeAvatarEl.style.display = 'none';
        const wrap = largeAvatarEl.parentElement;
        if (wrap) {
          let ph = wrap.querySelector('.large-avatar-placeholder');
          if (!ph) {
            ph = document.createElement('div');
            ph.className = 'large-avatar-placeholder';
            wrap.insertBefore(ph, wrap.firstChild);
          }
          ph.textContent = user.nome ? user.nome.charAt(0).toUpperCase() : 'U';
        }
      }
    }
    if (removeAvatarBtn) {
      removeAvatarBtn.style.display = url ? 'inline-flex' : 'none';
    }
  }
  const savedAvatar = (user && user.foto) || null;
  applyAvatarToPage(savedAvatar);
  if (avatarContainer && avatarInput) {
    avatarContainer.addEventListener('click', () => avatarInput.click());
    avatarInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          const MAX = 400;
          const scale = Math.min(1, MAX / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          applyAvatarToPage(dataUrl);
          try {
            const updated = await api.put(`/usuarios/atualizar/${user.id}`, { foto: dataUrl });
            const newUser = { ...api.getUser(), foto: updated.foto };
            api.setUser(newUser);
          } catch (err) {
            alert('Não foi possível salvar a foto: ' + err.message);
          }
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }
  if (removeAvatarBtn) {
    removeAvatarBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm('Deseja remover sua foto de perfil?')) return;
      if (avatarInput) avatarInput.value = '';
      applyAvatarToPage(null);
      try {
        const updated = await api.put(`/usuarios/atualizar/${user.id}`, { foto: null });
        const newUser = { ...api.getUser(), foto: null };
        api.setUser(newUser);
      } catch (err) {
        alert('Não foi possível remover a foto: ' + err.message);
      }
    });
  }
  function updatePlanUI() {
    const navbarPlanTag = document.getElementById('navbar-plan-tag');
    const profilePlanBadge = document.getElementById('profile-plan-badge');
    const sidebarUpgradeBtn = document.getElementById('sidebar-upgrade-btn');
    if (userState.isPro) {
      if (navbarPlanTag) {
        navbarPlanTag.textContent = 'PRO';
        navbarPlanTag.className = 'user-plan-tag pro';
      }
      if (profilePlanBadge) {
        profilePlanBadge.textContent = 'Saboré PRO';
        profilePlanBadge.className = 'plan-badge-large pro';
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
      if (profilePlanBadge) {
        profilePlanBadge.textContent = 'Membro Grátis';
        profilePlanBadge.className = 'plan-badge-large free';
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
  document.getElementById('open-publications-list')?.addEventListener('click', () => {
    document.querySelector('.creations-grid')?.closest('.setup-widget')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  window.addEventListener('sabore:follow-changed', async () => {
    try {
      const social = await api.get('/social/meu-resumo');
      document.getElementById('profile-followers-count').textContent = social.seguidores;
      document.getElementById('profile-following-count').textContent = social.seguindo;
      document.getElementById('profile-recipes-count').textContent = social.receitasPublicas;
      if (document.getElementById('followers-modal')?.classList.contains('open')) {
        loadSocialTab(currentSocialTab);
      }
    } catch {}
  });
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      window.location.href = '../configuracoes/index.html';
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
  const btnEditBio = document.getElementById('btn-edit-bio');
  const bioDisplay = document.getElementById('user-bio-display');
  const editBlock = document.getElementById('bio-edit-block');
  const bioTextarea = document.getElementById('bio-textarea');
  const btnCancelBio = document.getElementById('btn-cancel-bio');
  const btnSaveBio = document.getElementById('btn-save-bio');
  if (btnEditBio && bioDisplay && editBlock && bioTextarea) {
    bioDisplay.textContent = userState.bio;
    btnEditBio.addEventListener('click', () => {
      bioDisplay.classList.add('hidden');
      btnEditBio.classList.add('hidden');
      editBlock.classList.remove('hidden');
      bioTextarea.value = userState.bio;
      bioTextarea.focus();
    });
    btnCancelBio.addEventListener('click', () => {
      editBlock.classList.add('hidden');
      bioDisplay.classList.remove('hidden');
      btnEditBio.classList.remove('hidden');
    });
    btnSaveBio.addEventListener('click', () => {
      const newBio = bioTextarea.value.trim();
      if (newBio) {
        userState.bio = newBio;
        localStorage.setItem('sabore_user_bio', newBio);
        bioDisplay.textContent = newBio;
      }
      editBlock.classList.add('hidden');
      bioDisplay.classList.remove('hidden');
      btnEditBio.classList.remove('hidden');
    });
  }
  const tagsContainer = document.getElementById('pref-tags-container');
  const addPrefInput = document.getElementById('add-pref-input');
  const btnAddPref = document.getElementById('btn-add-pref');
  function renderPrefTags() {
    if (!tagsContainer) return;
    tagsContainer.innerHTML = '';
    userState.preferences.forEach(pref => {
      const chip = document.createElement('span');
      chip.className = 'pref-tag-chip';
      chip.innerHTML = `
        ${pref}
        <button class="btn-remove-pref"><i class="fa-solid fa-xmark"></i></button>
      `;
      chip.querySelector('.btn-remove-pref').addEventListener('click', () => {
        removePreferenceTag(pref);
      });
      tagsContainer.appendChild(chip);
    });
    updateCursorHoverListeners();
  }
  function addPreferenceTag() {
    if (!addPrefInput) return;
    let text = addPrefInput.value.trim();
    if (!text) return;
    text = text.charAt(0).toUpperCase() + text.slice(1);
    if (!userState.preferences.includes(text)) {
      userState.preferences.push(text);
      localStorage.setItem('sabore_user_preferences', JSON.stringify(userState.preferences));
      renderPrefTags();
    }
    addPrefInput.value = '';
  }
  function removePreferenceTag(name) {
    userState.preferences = userState.preferences.filter(t => t !== name);
    localStorage.setItem('sabore_user_preferences', JSON.stringify(userState.preferences));
    renderPrefTags();
  }
  if (btnAddPref && addPrefInput) {
    btnAddPref.addEventListener('click', addPreferenceTag);
    addPrefInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addPreferenceTag();
      }
    });
  }
  // Estado de criações e abas estilo Instagram
  userState.creations = [];
  userState.activeTab = 'todas';

  // Configuração das abas estilo Instagram
  const tabButtons = document.querySelectorAll('.insta-tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      if (!targetTab || userState.activeTab === targetTab) return;
      userState.activeTab = targetTab;
      tabButtons.forEach(b => {
        const isActive = b.dataset.tab === targetTab;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      renderInstagramFeed();
    });
  });

  const closeInstaModalBtn = document.getElementById('close-insta-modal');
  if (closeInstaModalBtn) {
    closeInstaModalBtn.addEventListener('click', () => closeModal('insta-post-modal'));
  }

  function getCuisineIcon(category = '') {
    const cat = category.toLowerCase();
    if (cat.includes('sobremesa') || cat.includes('doce') || cat.includes('bolo')) return 'fa-solid fa-cake-candles';
    if (cat.includes('café') || cat.includes('bebida') || cat.includes('drink')) return 'fa-solid fa-mug-hot';
    if (cat.includes('massa') || cat.includes('macarrão') || cat.includes('italiana')) return 'fa-solid fa-bowl-food';
    if (cat.includes('pizza')) return 'fa-solid fa-pizza-slice';
    if (cat.includes('carne') || cat.includes('churrasco')) return 'fa-solid fa-drumstick-bite';
    if (cat.includes('vegano') || cat.includes('vegetariano') || cat.includes('salada') || cat.includes('fitness')) return 'fa-solid fa-leaf';
    if (cat.includes('peixe') || cat.includes('frutos')) return 'fa-solid fa-fish';
    return 'fa-solid fa-utensils';
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>'"]/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    })[char]);
  }

  function openInstagramPostModal(rec) {
    const modalContent = document.getElementById('insta-modal-content');
    if (!modalContent) return;

    const authorName = rec.author || user.nome || 'Chef Saboré';
    const authorInitial = authorName.charAt(0).toUpperCase();
    const avatarUrl = rec.authorAvatar || user.foto || localStorage.getItem('sabore_user_avatar');

    const ingredientsList = (rec.ingredients && rec.ingredients.length > 0)
      ? rec.ingredients.map(ing => `<li><i class="fa-solid fa-circle-check"></i> <span>${escapeHtml(ing)}</span></li>`).join('')
      : '<li><i class="fa-solid fa-info-circle"></i> <span>Nenhum ingrediente cadastrado para esta receita.</span></li>';

    const stepsList = (rec.steps && rec.steps.length > 0)
      ? rec.steps.map(step => `<li>${escapeHtml(step)}</li>`).join('')
      : '<li>Modo de preparo não informado.</li>';

    const mediaHtml = rec.image
      ? `<img src="${rec.image}" alt="${escapeHtml(rec.title)}">`
      : `
        <div class="insta-art-cover">
          <div class="insta-art-icon"><i class="${getCuisineIcon(rec.category)}"></i></div>
          <span class="insta-art-title">${escapeHtml(rec.title)}</span>
          <span style="font-size: 0.72rem; color: var(--secondary); opacity: 0.8; margin-top: 4px;">Receita Autoral</span>
        </div>
      `;

    modalContent.innerHTML = `
      <div class="insta-modal-media-side">
        ${mediaHtml}
      </div>
      <div class="insta-modal-info-side">
        <div class="insta-modal-author-header">
          <div class="insta-modal-author-info">
            ${avatarUrl
              ? `<img src="${avatarUrl}" alt="${escapeHtml(authorName)}" class="insta-modal-author-avatar">`
              : `<div class="insta-modal-avatar-ph">${authorInitial}</div>`
            }
            <div class="insta-modal-author-meta">
              <h4>${escapeHtml(authorName)}</h4>
              <span>${rec.criadaPorIA ? 'Criada com auxílio do Chef IA' : 'Receita Original'}</span>
            </div>
          </div>
          <span class="insta-status-pill ${rec.public ? 'public' : 'private'}">
            <i class="fa-solid ${rec.public ? 'fa-globe' : 'fa-lock'}"></i>
            ${rec.public ? 'Na Comunidade' : 'Privada'}
          </span>
        </div>

        <div class="insta-modal-scrollable">
          <h2>${escapeHtml(rec.title)}</h2>
          ${rec.description ? `<p class="insta-modal-desc">${escapeHtml(rec.description)}</p>` : ''}

          <div class="insta-modal-quick-meta">
            <span class="insta-quick-chip"><i class="fa-regular fa-clock"></i> ${rec.time || 15} min</span>
            <span class="insta-quick-chip"><i class="fa-solid fa-gauge-simple"></i> ${escapeHtml(rec.difficulty || 'Fácil')}</span>
            <span class="insta-quick-chip"><i class="fa-solid fa-tag"></i> ${escapeHtml(rec.category || 'Geral')}</span>
            <span class="insta-quick-chip"><i class="fa-solid fa-heart" style="color: #ff5b6e;"></i> ${rec.likes || 0} curtidas</span>
          </div>

          <div>
            <h4 class="insta-modal-section-title"><i class="fa-solid fa-basket-shopping"></i> Ingredientes</h4>
            <ul class="insta-ingredients-checklist">
              ${ingredientsList}
            </ul>
          </div>

          <div>
            <h4 class="insta-modal-section-title"><i class="fa-solid fa-list-ol"></i> Modo de Preparo</h4>
            <ol class="insta-steps-numbered">
              ${stepsList}
            </ol>
          </div>
        </div>

        <div class="insta-modal-actions-bar">
          <div class="insta-actions-row">
            <button class="btn-insta-toggle-pub ${rec.public ? 'is-published' : ''}" id="modal-btn-toggle-pub" type="button">
              <i class="fa-solid ${rec.public ? 'fa-eye-slash' : 'fa-globe'}"></i>
              <span>${rec.public ? 'Ocultar da Comunidade' : 'Publicar na Comunidade'}</span>
            </button>
            <button class="btn-insta-share" id="modal-btn-share-post" type="button" title="Compartilhar link da receita">
              <i class="fa-solid fa-share-nodes"></i> Compartilhar
            </button>
            <button class="btn-insta-delete" id="modal-btn-delete-post" type="button" title="Excluir receita permanentemente">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    // Ação: Publicar / Ocultar da Comunidade
    const togglePubBtn = document.getElementById('modal-btn-toggle-pub');
    if (togglePubBtn) {
      togglePubBtn.addEventListener('click', async () => {
        try {
          const newStatus = !rec.public;
          togglePubBtn.disabled = true;
          togglePubBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Atualizando...';
          const updated = await api.put(`/receitas/atualizar/${rec.id}`, { public: newStatus });
          rec.public = updated.public;
          if (window.SaboreNotify) {
            window.SaboreNotify(newStatus ? 'Receita publicada na comunidade!' : 'Receita tornada privada.', 'success');
          }
          openInstagramPostModal(rec);
          renderInstagramFeed();
        } catch (err) {
          alert('Erro ao atualizar status da publicação: ' + err.message);
          openInstagramPostModal(rec);
        }
      });
    }

    // Ação: Compartilhar
    const shareBtn = document.getElementById('modal-btn-share-post');
    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
        const publicUrl = `${window.location.origin}/receita/index.html?id=${rec.id}`;
        try {
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(publicUrl);
            if (window.SaboreNotify) {
              window.SaboreNotify('Link da receita copiado para a área de transferência!', 'success');
            } else {
              alert('Link copiado: ' + publicUrl);
            }
          } else {
            prompt('Copie o link da receita:', publicUrl);
          }
        } catch {
          prompt('Copie o link da receita:', publicUrl);
        }
      });
    }

    // Ação: Excluir receita (dados indesejados ou testes antigos)
    const deleteBtn = document.getElementById('modal-btn-delete-post');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        const confirmDelete = confirm(`Deseja realmente excluir a receita "${rec.title}"?\n\nEsta ação é permanente e removerá a publicação do seu perfil.`);
        if (!confirmDelete) return;

        deleteBtn.disabled = true;
        deleteBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        try {
          await api.delete(`/receitas/excluir/${rec.id}`);
          userState.creations = userState.creations.filter(item => item.id !== rec.id);
          closeModal('insta-post-modal');
          if (window.SaboreNotify) {
            window.SaboreNotify('Receita excluída com sucesso.', 'success');
          }
          renderInstagramFeed();
        } catch (err) {
          alert('Não foi possível excluir a receita: ' + err.message);
          deleteBtn.disabled = false;
          deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        }
      });
    }

    openModal('insta-post-modal');
    updateCursorHoverListeners();
  }

  function renderInstagramFeed() {
    const container = document.getElementById('creations-grid');
    if (!container) return;

    // Atualiza contadores das abas
    const countAll = userState.creations.length;
    const countPublic = userState.creations.filter(r => r.public).length;
    const countPrivate = userState.creations.filter(r => !r.public).length;

    const elCountAll = document.getElementById('count-all-creations');
    const elCountPub = document.getElementById('count-public-creations');
    const elCountPriv = document.getElementById('count-private-creations');

    if (elCountAll) elCountAll.textContent = countAll;
    if (elCountPub) elCountPub.textContent = countPublic;
    if (elCountPriv) elCountPriv.textContent = countPrivate;

    // Atualiza o contador de receitas no topo do perfil com dados reais!
    const profileRecipesCount = document.getElementById('profile-recipes-count');
    if (profileRecipesCount) {
      profileRecipesCount.textContent = countAll;
    }

    // Filtra pela aba selecionada
    let filtered = userState.creations;
    if (userState.activeTab === 'publicas') {
      filtered = userState.creations.filter(r => r.public);
    } else if (userState.activeTab === 'privadas') {
      filtered = userState.creations.filter(r => !r.public);
    }

    container.innerHTML = '';

    if (filtered.length === 0) {
      let emptyTitle = 'Ainda não há publicações';
      let emptyDesc = 'Quando você criar receitas ou salvá-las nos seus livros, suas publicações aparecerão aqui no seu feed.';
      if (userState.activeTab === 'publicas') {
        emptyTitle = 'Nenhuma receita pública';
        emptyDesc = 'Você ainda não compartilhou nenhuma das suas criações com a comunidade do Saboré.';
      } else if (userState.activeTab === 'privadas') {
        emptyTitle = 'Nenhuma receita privada';
        emptyDesc = 'Todas as suas criações atuais estão publicadas na comunidade.';
      }

      container.innerHTML = `
        <div class="insta-empty-feed">
          <div class="insta-empty-icon-ring">
            <i class="fa-solid fa-camera"></i>
          </div>
          <h4>${emptyTitle}</h4>
          <p>${emptyDesc}</p>
          <a href="../chefIA/index.html" class="btn-insta-empty-action">
            <i class="fa-solid fa-robot"></i> Criar com Chef IA
          </a>
        </div>
      `;
      return;
    }

    filtered.forEach(rec => {
      const card = document.createElement('article');
      card.className = 'insta-post-card';
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Abrir receita ${rec.title}`);

      const mediaHtml = rec.image
        ? `<img src="${rec.image}" alt="${escapeHtml(rec.title)}" class="insta-post-img" loading="lazy">`
        : `
          <div class="insta-art-cover">
            <div class="insta-art-icon"><i class="${getCuisineIcon(rec.category)}"></i></div>
            <span class="insta-art-title">${escapeHtml(rec.title)}</span>
          </div>
        `;

      const badgesHtml = `
        <div class="insta-post-badges">
          ${rec.public
            ? '<span class="insta-mini-badge public" title="Pública na comunidade"><i class="fa-solid fa-globe"></i></span>'
            : '<span class="insta-mini-badge private" title="Receita privada"><i class="fa-solid fa-lock"></i></span>'
          }
          ${rec.criadaPorIA
            ? '<span class="insta-mini-badge ai" title="Criada com Chef IA"><i class="fa-solid fa-wand-magic-sparkles"></i></span>'
            : ''
          }
        </div>
      `;

      card.innerHTML = `
        ${mediaHtml}
        ${badgesHtml}
        <div class="insta-post-overlay">
          <span class="insta-overlay-title">${escapeHtml(rec.title)}</span>
          <div class="insta-overlay-stats">
            <span><i class="fa-solid fa-heart heart-icon"></i> ${rec.likes || 0}</span>
            <span><i class="fa-regular fa-clock"></i> ${rec.time || 15}m</span>
          </div>
          <span class="insta-overlay-btn"><i class="fa-solid fa-eye"></i> Ver Post</span>
        </div>
      `;

      card.addEventListener('click', () => openInstagramPostModal(rec));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openInstagramPostModal(rec);
        }
      });

      container.appendChild(card);
    });

    updateCursorHoverListeners();
  }

  async function loadCreations() {
    try {
      const container = document.getElementById('creations-grid');
      if (!container) return;

      // Chama a rota de receitas do usuário autenticado no backend
      const data = await api.get('/receitas/listar');
      userState.creations = Array.isArray(data) ? data : [];
      renderInstagramFeed();
    } catch (err) {
      console.error('Erro ao carregar criações:', err);
      const container = document.getElementById('creations-grid');
      if (container) {
        container.innerHTML = `
          <div class="insta-empty-feed">
            <div class="insta-empty-icon-ring" style="border-color: rgba(255, 95, 86, 0.4); color: var(--danger); background: rgba(255, 95, 86, 0.1);">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h4>Erro ao carregar suas publicações</h4>
            <p>${escapeHtml(err.message || 'Verifique se o backend do Saboré está ativo.')}</p>
            <button class="btn-insta-empty-action" id="btn-retry-creations" type="button">
              <i class="fa-solid fa-rotate-right"></i> Tentar novamente
          </div>
        `;
        const retryBtn = document.getElementById('btn-retry-creations');
        if (retryBtn) retryBtn.addEventListener('click', loadCreations);
      }
    }
  }

  async function loadProfileData() {
    try {
      const profileData = await api.get("/usuarios/perfil");
      userState.isPro = profileData.plano === "PRO";
      updatePlanUI();
      const profileName = document.querySelector('.perfil-user-card h2');
      if (profileName && user.nome) {
        profileName.textContent = user.nome;
      }
      const navUserName = document.querySelector('.user-name');
      if (navUserName && user.nome) {
        navUserName.textContent = user.nome.split(' ')[0];
      }
      const savedBio = localStorage.getItem('sabore_user_bio') || profileData.bio || 'Amante da gastronomia, sempre testando novas receitas saudáveis e pratos rápidos com auxílio do Chef IA Saboré.';
      userState.bio = savedBio;
      const bioDisplay = document.getElementById('user-bio-display');
      if (bioDisplay) bioDisplay.textContent = savedBio;
      const followersVal = document.getElementById('profile-followers-count');
      const followingVal = document.getElementById('profile-following-count');
      const recipesVal = document.getElementById('profile-recipes-count');
      const social = await api.get('/social/meu-resumo');
      if (followersVal) followersVal.textContent = social.seguidores;
      if (followingVal) followingVal.textContent = social.seguindo;
      if (recipesVal) recipesVal.textContent = social.receitasPublicas;
    } catch (err) {
      console.error("Erro ao carregar dados do perfil:", err);
    }
  }
  let currentSocialTab = 'followers';

  async function loadSocialTab(tab) {
    currentSocialTab = tab;
    const tabFollowersBtn = document.getElementById('tab-followers-btn');
    const tabFollowingBtn = document.getElementById('tab-following-btn');
    const panelFollowers = document.getElementById('social-followers-panel');
    const panelFollowing = document.getElementById('social-following-panel');
    const followersList = document.getElementById('followers-list');
    const followingList = document.getElementById('following-list');

    if (tab === 'followers') {
      if (tabFollowersBtn) tabFollowersBtn.classList.add('active');
      if (tabFollowingBtn) tabFollowingBtn.classList.remove('active');
      if (panelFollowers) panelFollowers.classList.add('active');
      if (panelFollowing) panelFollowing.classList.remove('active');

      if (followersList) {
        followersList.innerHTML = '<div class="book-detail-empty" style="padding:24px;text-align:center">Carregando seguidores...</div>';
      }
      try {
        const followers = await api.get('/social/meus-seguidores');
        const badge = document.getElementById('modal-followers-badge');
        if (badge) badge.textContent = followers.length;
        const profileBadge = document.getElementById('profile-followers-count');
        if (profileBadge) profileBadge.textContent = followers.length;

        if (!followers.length) {
          followersList.innerHTML = `
            <div class="book-detail-empty" style="padding:30px 16px;text-align:center">
              <i class="fa-solid fa-user-group" style="font-size:1.8rem;color:rgba(242,244,243,0.25);margin-bottom:8px;display:block"></i>
              <p style="margin:0;font-size:0.85rem;color:rgba(242,244,243,0.6)">Você ainda não tem seguidores.</p>
              <span style="font-size:0.75rem;color:rgba(242,244,243,0.4)">Compartilhe suas receitas na comunidade para atrair novos fãs!</span>
            </div>`;
        } else {
          followersList.innerHTML = followers.map(item => `
            <div class="social-item-row" data-user-id="${item.id}">
              <div class="social-user-details">
                ${item.foto ? `<img src="${item.foto}" alt="${item.nome}" class="social-user-avatar">` : `<div class="social-user-placeholder">${(item.nome || 'U').charAt(0).toUpperCase()}</div>`}
                <div class="social-user-names">
                  <h4>${item.nome}</h4>
                  <span>Seguindo você desde ${new Date(item.desde || Date.now()).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
              <button class="btn-social-action btn-remove-follower" data-id="${item.id}" type="button" title="Remover este usuário dos seus seguidores">
                <i class="fa-solid fa-user-xmark"></i> Remover
              </button>
            </div>
          `).join('');

          followersList.querySelectorAll('.btn-remove-follower').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              e.stopPropagation();
              const targetId = btn.dataset.id;
              if (!confirm('Deseja realmente remover este seguidor?')) return;
              try {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                await api.delete(`/social/remover-seguidor/${targetId}`);
                loadSocialTab('followers');
                const res = await api.get('/social/meu-resumo');
                const fCount = document.getElementById('profile-followers-count');
                if (fCount) fCount.textContent = res.seguidores;
              } catch (err) {
                alert('Erro ao remover seguidor: ' + err.message);
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-user-xmark"></i> Remover';
              }
            });
          });
        }
      } catch (err) {
        if (followersList) {
          followersList.innerHTML = '<div class="book-detail-empty" style="padding:20px;text-align:center">Não foi possível carregar os seguidores.</div>';
        }
      }
    } else {
      if (tabFollowingBtn) tabFollowingBtn.classList.add('active');
      if (tabFollowersBtn) tabFollowersBtn.classList.remove('active');
      if (panelFollowing) panelFollowing.classList.add('active');
      if (panelFollowers) panelFollowers.classList.remove('active');

      if (followingList) {
        followingList.innerHTML = '<div class="book-detail-empty" style="padding:24px;text-align:center">Carregando quem você segue...</div>';
      }
      try {
        const following = await api.get('/social/meus-seguindo');
        const badge = document.getElementById('modal-following-badge');
        if (badge) badge.textContent = following.length;
        const profileBadge = document.getElementById('profile-following-count');
        if (profileBadge) profileBadge.textContent = following.length;

        if (!following.length) {
          followingList.innerHTML = `
            <div class="book-detail-empty" style="padding:30px 16px;text-align:center">
              <i class="fa-solid fa-compass" style="font-size:1.8rem;color:rgba(242,244,243,0.25);margin-bottom:8px;display:block"></i>
              <p style="margin:0;font-size:0.85rem;color:rgba(242,244,243,0.6)">Você ainda não está seguindo ninguém.</p>
              <span style="font-size:0.75rem;color:rgba(242,244,243,0.4)">Visite a página <strong>Explorar</strong> para descobrir chefs e criações incríveis!</span>
            </div>`;
        } else {
          followingList.innerHTML = following.map(item => `
            <div class="social-item-row" data-user-id="${item.id}">
              <div class="social-user-details">
                ${item.foto ? `<img src="${item.foto}" alt="${item.nome}" class="social-user-avatar">` : `<div class="social-user-placeholder">${(item.nome || 'U').charAt(0).toUpperCase()}</div>`}
                <div class="social-user-names">
                  <h4>${item.nome}</h4>
                  <span>${item.receitasPublicas !== undefined ? `${item.receitasPublicas} receitas publicadas` : 'Membro da comunidade'}</span>
                </div>
              </div>
              <button class="btn-social-action unfollow btn-unfollow-user" data-id="${item.id}" type="button" title="Deixar de seguir este usuário">
                <i class="fa-solid fa-user-minus"></i> Deixar de seguir
              </button>
            </div>
          `).join('');

          followingList.querySelectorAll('.btn-unfollow-user').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              e.stopPropagation();
              const targetId = btn.dataset.id;
              if (!confirm('Deseja deixar de seguir este usuário?')) return;
              try {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                await api.delete(`/social/seguir/${targetId}`);
                loadSocialTab('following');
                const res = await api.get('/social/meu-resumo');
                const fCount = document.getElementById('profile-following-count');
                if (fCount) fCount.textContent = res.seguindo;
              } catch (err) {
                alert('Erro ao deixar de seguir: ' + err.message);
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-user-minus"></i> Deixar de seguir';
              }
            });
          });
        }
      } catch (err) {
        if (followingList) {
          followingList.innerHTML = '<div class="book-detail-empty" style="padding:20px;text-align:center">Não foi possível carregar quem você segue.</div>';
        }
      }
    }
  }

  function openSocialConnectionsModal(initialTab = 'followers') {
    openModal('followers-modal');
    loadSocialTab(initialTab);
  }

  const closeFollowersBtn = document.getElementById('close-followers-modal');
  if (closeFollowersBtn) {
    closeFollowersBtn.addEventListener('click', () => closeModal('followers-modal'));
  }
  const tabFollowersBtn = document.getElementById('tab-followers-btn');
  if (tabFollowersBtn) {
    tabFollowersBtn.addEventListener('click', () => loadSocialTab('followers'));
  }
  const tabFollowingBtn = document.getElementById('tab-following-btn');
  if (tabFollowingBtn) {
    tabFollowingBtn.addEventListener('click', () => loadSocialTab('following'));
  }

  const followersCount = document.getElementById('profile-followers-count');
  if (followersCount) {
    const followersCard = followersCount.closest('.p-stat-item');
    if (followersCard) {
      followersCard.tabIndex = 0;
      followersCard.style.cursor = 'pointer';
      followersCard.title = 'Ver seguidores';
      followersCard.addEventListener('click', () => openSocialConnectionsModal('followers'));
      followersCard.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') openSocialConnectionsModal('followers'); });
    }
  }

  const followingCount = document.getElementById('profile-following-count');
  if (followingCount) {
    const followingCard = followingCount.closest('.p-stat-item');
    if (followingCard) {
      followingCard.tabIndex = 0;
      followingCard.style.cursor = 'pointer';
      followingCard.title = 'Ver quem estou seguindo';
      followingCard.addEventListener('click', () => openSocialConnectionsModal('following'));
      followingCard.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') openSocialConnectionsModal('following'); });
    }
  }

  renderPrefTags();
  loadProfileData();
  loadCreations();
});
