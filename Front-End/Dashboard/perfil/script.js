document.addEventListener('DOMContentLoaded', () => {
  const user = api.getUser();
  if (!user) {
    window.location.href = "../../login/index.html";
    return;
  }
  const urlParams = new URLSearchParams(window.location.search);
  const targetUserId = urlParams.get('id');
  const isViewingOther = Boolean(targetUserId && String(targetUserId) !== String(user.id));

  let activeCreationsTab = 'all'; // 'all' | 'public' | 'private'
  let userState = {
    isPro: false,
    bio: !isViewingOther ? (localStorage.getItem('sabore_user_bio') || '') : '',
    preferences: !isViewingOther && localStorage.getItem('sabore_user_preferences') ? JSON.parse(localStorage.getItem('sabore_user_preferences')) : [],
    featuredCreations: JSON.parse(localStorage.getItem(`sabore_profile_creations_${targetUserId || user.id}`) || '[]')
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
      const myAvatarUrl = user.foto || null;
      if (myAvatarUrl) { 
        navAvatar.src = myAvatarUrl; 
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
          const targetName = isViewingOther ? (document.querySelector('.perfil-user-card h2')?.textContent || 'U') : (user.nome || 'U');
          ph.textContent = targetName ? targetName.trim().charAt(0).toUpperCase() : 'U';
        }
      }
    }
    if (removeAvatarBtn) {
      removeAvatarBtn.style.display = (!isViewingOther && url) ? 'inline-flex' : 'none';
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
    if (userState.isPro) {
      if (navbarPlanTag) {
        navbarPlanTag.textContent = 'PRO';
        navbarPlanTag.className = 'user-plan-tag pro';
      }
      if (profilePlanBadge) {
        profilePlanBadge.textContent = 'Saboré PRO';
        profilePlanBadge.className = 'plan-badge-large pro';
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
    { btn: 'close-notif-modal', modal: 'notifications-modal' }
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
  const proMenuLink = document.querySelector('[data-target="pro"]');
  if (proMenuLink) {
    proMenuLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '../ranking/index.html';
    });
  }
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
  userState.creations = [];

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

    // Monta itens de mídia do carrossel (vídeo + fotos até 5)
    const mediaItems = [];
    if (rec.video) {
      mediaItems.push({ type: 'video', src: rec.video });
    }
    const rawPhotos = Array.isArray(rec.fotos) && rec.fotos.length ? rec.fotos : [rec.image].filter(Boolean);
    rawPhotos.slice(0, 5).forEach(img => {
      mediaItems.push({ type: 'image', src: img });
    });

    let mediaHtml = '';
    if (mediaItems.length > 1) {
      mediaHtml = `
        <div class="insta-carousel" id="insta-modal-carousel" data-slide="0">
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
                  <img src="${escapeHtml(item.src)}" alt="${escapeHtml(rec.title)} — foto ${index + 1}">
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
    } else if (mediaItems.length === 1) {
      if (mediaItems[0].type === 'video') {
        mediaHtml = `<video class="insta-post-video" controls preload="metadata" playsinline src="${escapeHtml(mediaItems[0].src)}"></video>`;
      } else {
        mediaHtml = `<img src="${escapeHtml(mediaItems[0].src)}" alt="${escapeHtml(rec.title)}">`;
      }
    } else {
      mediaHtml = `
        <div class="insta-art-cover">
          <div class="insta-art-icon"><i class="${getCuisineIcon(rec.category)}"></i></div>
          <span class="insta-art-title">${escapeHtml(rec.title)}</span>
          <span style="font-size: 0.72rem; color: var(--secondary); opacity: 0.8; margin-top: 4px;">Receita Autoral</span>
        </div>
      `;
    }

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
            ${!isViewingOther ? `
              <button class="btn-insta-toggle-pub ${rec.public ? 'is-published' : ''}" id="modal-btn-toggle-pub" type="button">
                <i class="fa-solid ${rec.public ? 'fa-eye-slash' : 'fa-globe'}"></i>
                <span>${rec.public ? 'Ocultar da Comunidade' : 'Publicar na Comunidade'}</span>
              </button>
              <button class="btn-insta-edit" id="modal-btn-edit-post" type="button" title="Editar receita">
                <i class="fa-solid fa-pen-to-square"></i> Editar
              </button>
            ` : ''}
            <button class="btn-insta-share" id="modal-btn-share-post" type="button" title="Compartilhar link da receita">
              <i class="fa-solid fa-share-nodes"></i> Compartilhar
            </button>
            ${!isViewingOther ? `
              <button class="btn-insta-delete" id="modal-btn-delete-post" type="button" title="Excluir receita permanentemente">
                <i class="fa-solid fa-trash"></i>
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    // Interatividade do Carrossel de Mídia no Modal
    const carouselEl = modalContent.querySelector('.insta-carousel');
    if (carouselEl) {
      const slides = carouselEl.querySelectorAll('.insta-carousel-slide');
      const dots = carouselEl.querySelectorAll('.insta-carousel-dot');
      const prevBtn = carouselEl.querySelector('.insta-carousel-btn.prev');
      const nextBtn = carouselEl.querySelector('.insta-carousel-btn.next');
      let currentSlide = 0;

      const setSlide = (index) => {
        currentSlide = (index + slides.length) % slides.length;
        slides.forEach((s, idx) => s.classList.toggle('active', idx === currentSlide));
        dots.forEach((d, idx) => d.classList.toggle('active', idx === currentSlide));
      };

      prevBtn?.addEventListener('click', (e) => { e.stopPropagation(); setSlide(currentSlide - 1); });
      nextBtn?.addEventListener('click', (e) => { e.stopPropagation(); setSlide(currentSlide + 1); });
      dots.forEach((dot, idx) => dot.addEventListener('click', (e) => { e.stopPropagation(); setSlide(idx); }));
    }

    // Ação: Editar Receita
    const editPostBtn = document.getElementById('modal-btn-edit-post');
    if (editPostBtn) {
      editPostBtn.addEventListener('click', () => {
        closeInstagramModal();
        openEditRecipeModal(rec);
      });
    }

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
          rec.communityPublished = updated.communityPublished ?? updated.public;
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
        const shareUrl = `${window.location.origin}/Dashboard/explorar/index.html?receita=${rec.id}`;
        if (navigator.share) {
          try {
            await navigator.share({ title: rec.title, text: `Confira a receita "${rec.title}" no Saboré!`, url: shareUrl });
            return;
          } catch (e) {}
        }
        try {
          await navigator.clipboard.writeText(shareUrl);
          if (window.SaboreNotify) window.SaboreNotify('Link da receita copiado!', 'success');
          else alert('Link copiado!');
        } catch (e) {
          prompt('Copie o link da receita:', shareUrl);
        }
      });
    }

    // Ação: Excluir
    const deleteBtn = document.getElementById('modal-btn-delete-post');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (!confirm(`Deseja realmente excluir a receita "${rec.title}"? Esta ação não pode ser desfeita.`)) return;
        try {
          deleteBtn.disabled = true;
          await api.delete(`/receitas/excluir/${rec.id}`);
          userState.creations = userState.creations.filter(item => item.id !== rec.id);
          closeInstagramModal();
          renderInstagramFeed();
          if (window.SaboreNotify) window.SaboreNotify('Receita excluída com sucesso.', 'info');
        } catch (err) {
          alert('Erro ao excluir receita: ' + err.message);
          deleteBtn.disabled = false;
        }
      });
    }

    const modal = document.getElementById('insta-post-modal');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeInstagramModal() {
    const modal = document.getElementById('insta-post-modal');
    if (modal) {
      modal.classList.remove('open');
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  // Configuração das Abas de Criações (Todas / Na Comunidade / Privadas)
  function initCreationsTabs() {
    const tabs = ['all', 'public', 'private'];
    tabs.forEach(tab => {
      const btn = document.getElementById(`tab-${tab}-creations`);
      if (btn) {
        btn.onclick = () => {
          activeCreationsTab = tab;
          tabs.forEach(t => document.getElementById(`tab-${t}-creations`)?.classList.toggle('active', t === tab));
          renderInstagramFeed();
        };
      }
    });
  }

  function renderInstagramFeed() {
    const container = document.getElementById('creations-grid');
    if (!container) return;

    if (isViewingOther) {
      const widgetHeader = document.querySelector('.insta-widget-header h3');
      const widgetDesc = document.querySelector('.insta-header-left .setup-widget-desc');
      if (widgetHeader) widgetHeader.innerHTML = '<i class="fa-solid fa-utensils"></i> Publicações';
      if (widgetDesc) widgetDesc.textContent = 'Receitas públicas compartilhadas na comunidade';
    }

    const isCommunityPost = (recipe) => recipe.communityPublished !== undefined
      ? Boolean(recipe.communityPublished)
      : Boolean(recipe.public && !recipe.rascunho);
    const countAll = userState.creations.length;
    const countPublic = userState.creations.filter(isCommunityPost).length;
    const countPrivate = countAll - countPublic;

    const elCountAll = document.getElementById('count-all-creations');
    const elCountPublic = document.getElementById('count-public-creations');
    const elCountPrivate = document.getElementById('count-private-creations');

    if (elCountAll) elCountAll.textContent = countAll;
    if (elCountPublic) elCountPublic.textContent = countPublic;
    if (elCountPrivate) elCountPrivate.textContent = countPrivate;

    const profileRecipesCount = document.getElementById('profile-recipes-count');
    if (profileRecipesCount) {
      profileRecipesCount.textContent = countAll;
    }

    container.innerHTML = '';

    // Filtra de acordo com a aba ativa
    let filteredCreations = userState.creations;
    if (activeCreationsTab === 'public') {
      filteredCreations = userState.creations.filter(isCommunityPost);
    } else if (activeCreationsTab === 'private') {
      filteredCreations = userState.creations.filter(r => !isCommunityPost(r));
    }

    if (filteredCreations.length === 0) {
      let emptyTitle = 'Ainda não há publicações';
      let emptyDesc = 'Quando você criar receitas ou salvá-las nos seus livros, suas publicações aparecerão aqui no seu feed.';
      if (activeCreationsTab === 'public') {
        emptyTitle = 'Nenhuma receita na comunidade';
        emptyDesc = 'Suas receitas públicas compartilhadas com a comunidade Saboré aparecerão nesta aba.';
      } else if (activeCreationsTab === 'private') {
        emptyTitle = 'Nenhuma receita privada';
        emptyDesc = 'Todas as suas receitas estão publicadas na comunidade.';
      }

      container.innerHTML = `
        <div class="insta-empty-feed">
          <div class="insta-empty-icon-ring">
            <i class="fa-solid fa-camera"></i>
          </div>
          <h4>${emptyTitle}</h4>
          <p>${emptyDesc}</p>
          ${!isViewingOther ? `
            <a href="../chefIA/index.html" class="btn-insta-empty-action">
              <i class="fa-solid fa-robot"></i> Criar com Chef IA
            </a>
          ` : ''}
        </div>
      `;
      return;
    }

    filteredCreations.forEach(rec => {
      const card = document.createElement('article');
      card.className = 'insta-post-card';
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Abrir receita ${rec.title}`);

      const hasMultipleMedia = (Array.isArray(rec.fotos) && rec.fotos.length > 1) || Boolean(rec.video);

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
            ? '<span class="insta-mini-badge ai" title="Criada com Chef IA"><i class="fa-solid fa-robot"></i></span>'
            : ''
          }
          ${hasMultipleMedia
            ? '<span class="insta-mini-badge multi-media" title="Carrossel com múltiplas mídias"><i class="fa-solid fa-clone"></i></span>'
            : ''
          }
        </div>
      `;

      const editBtnHtml = !isViewingOther
        ? `<button type="button" class="insta-card-edit-btn" title="Editar publicação" aria-label="Editar receita"><i class="fa-solid fa-pen-to-square"></i></button>`
        : '';

      card.innerHTML = `
        ${mediaHtml}
        ${badgesHtml}
        ${editBtnHtml}
        <div class="insta-post-overlay">
          <div class="insta-overlay-stats">
            <span><i class="fa-solid fa-heart"></i> ${rec.likes || 0}</span>
            <span><i class="fa-regular fa-clock"></i> ${rec.time || 15}m</span>
          </div>
          <span class="insta-overlay-btn"><i class="fa-solid fa-eye"></i> Ver Post</span>
        </div>
      `;

      // Evento de clique para editar no próprio card
      const editBtn = card.querySelector('.insta-card-edit-btn');
      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openEditRecipeModal(rec);
        });
      }

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

  // Gerenciamento do Modal de Edição de Receitas
  let editingRecipePhotos = [];
  let editingRecipeVideo = null;

  function openEditRecipeModal(recipe) {
    if (!recipe) return;
    const modal = document.getElementById('edit-recipe-modal');
    if (!modal) return;

    document.getElementById('edit-recipe-id').value = recipe.id;
    document.getElementById('edit-recipe-title').value = recipe.title || '';
    document.getElementById('edit-recipe-desc').value = recipe.description || '';
    document.getElementById('edit-recipe-time').value = recipe.time || 30;
    document.getElementById('edit-recipe-difficulty').value = recipe.difficulty || 'Fácil';
    document.getElementById('edit-recipe-category').value = recipe.category || 'Geral';
    document.getElementById('edit-recipe-video-file').value = '';
    document.getElementById('edit-recipe-hashtags').value = Array.isArray(recipe.hashtags) ? recipe.hashtags.join(' ') : '';
    document.getElementById('edit-recipe-ingredients').value = Array.isArray(recipe.ingredients) ? recipe.ingredients.join('\n') : '';
    document.getElementById('edit-recipe-steps').value = Array.isArray(recipe.steps) ? recipe.steps.join('\n') : '';
    document.getElementById('edit-recipe-public-toggle').checked = Boolean(recipe.public);

    editingRecipePhotos = Array.isArray(recipe.fotos) && recipe.fotos.length ? [...recipe.fotos] : (recipe.image ? [recipe.image] : []);
    editingRecipeVideo = recipe.video || null;
    renderEditingPhotosPreview();
    renderEditingVideoPreview();

    modal.style.display = 'flex';
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeEditRecipeModal() {
    const modal = document.getElementById('edit-recipe-modal');
    if (modal) {
      modal.classList.remove('open');
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  function renderEditingPhotosPreview() {
    const previewContainer = document.getElementById('edit-recipe-photos-preview');
    if (!previewContainer) return;
    previewContainer.innerHTML = '';
    editingRecipePhotos.forEach((src, idx) => {
      const wrap = document.createElement('div');
      wrap.className = 'edit-photo-thumb-wrap';
      wrap.innerHTML = `
        <img src="${src}" alt="Foto ${idx + 1}" class="edit-photo-thumb">
        <button type="button" class="btn-remove-thumb" title="Remover foto">&times;</button>
      `;
      wrap.querySelector('.btn-remove-thumb').addEventListener('click', (e) => {
        e.stopPropagation();
        editingRecipePhotos.splice(idx, 1);
        renderEditingPhotosPreview();
      });
      previewContainer.appendChild(wrap);
    });
  }

  function renderEditingVideoPreview() {
    const previewContainer = document.getElementById('edit-recipe-video-preview');
    if (!previewContainer) return;
    previewContainer.innerHTML = editingRecipeVideo ? `
      <div class="edit-video-preview-card">
        <video controls preload="metadata" playsinline src="${escapeHtml(editingRecipeVideo)}"></video>
        <span><i class="fa-solid fa-circle-check"></i> Vídeo anexado</span>
        <button type="button" class="btn-remove-video" aria-label="Remover vídeo">Remover vídeo</button>
      </div>
    ` : '<p class="edit-media-empty"><i class="fa-regular fa-circle-play"></i> Nenhum vídeo anexado</p>';
    previewContainer.querySelector('.btn-remove-video')?.addEventListener('click', () => {
      editingRecipeVideo = null;
      const input = document.getElementById('edit-recipe-video-file');
      if (input) input.value = '';
      renderEditingVideoPreview();
    });
  }

  async function processEditingVideoFile(fileInput) {
    const file = fileInput?.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024 || !['video/mp4', 'video/webm'].includes(file.type)) {
      alert('Escolha um vídeo MP4 ou WebM de até 4 MB.');
      fileInput.value = '';
      return;
    }
    try {
      editingRecipeVideo = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Não foi possível ler o vídeo selecionado.'));
        reader.readAsDataURL(file);
      });
      renderEditingVideoPreview();
    } catch (error) {
      alert(error.message);
      fileInput.value = '';
    }
  }

  async function processPhotosFiles(fileInput) {
    const files = Array.from(fileInput?.files || []);
    const remainingSlots = Math.max(0, 5 - editingRecipePhotos.length);
    const selected = files.slice(0, remainingSlots);

    for (const file of selected) {
      if (!file.type.startsWith('image/')) continue;
      const bitmap = await createImageBitmap(file);
      const ratio = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
      canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
      canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const base64 = canvas.toDataURL('image/jpeg', 0.7);
      if (base64.length >= 700000) {
        alert('Uma das fotos ficou grande demais. Escolha uma imagem menor.');
        continue;
      }
      editingRecipePhotos.push(base64);
    }
    renderEditingPhotosPreview();
    if (fileInput) fileInput.value = '';
  }

  function initEditRecipeModal() {
    document.getElementById('close-edit-recipe-modal')?.addEventListener('click', closeEditRecipeModal);

    const fileInput = document.getElementById('edit-recipe-photos-file');
    if (fileInput) {
      fileInput.addEventListener('change', () => processPhotosFiles(fileInput));
    }
    const videoInput = document.getElementById('edit-recipe-video-file');
    videoInput?.addEventListener('change', () => processEditingVideoFile(videoInput));

    const form = document.getElementById('edit-recipe-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const recipeId = document.getElementById('edit-recipe-id').value;
        const saveBtn = document.getElementById('btn-save-edit-recipe');
        if (!recipeId) return;

        const val = (id) => document.getElementById(id)?.value?.trim() || '';
        const title = val('edit-recipe-title');
        const desc = val('edit-recipe-desc');
        const time = Number(val('edit-recipe-time')) || 15;
        const difficulty = val('edit-recipe-difficulty');
        const category = val('edit-recipe-category');
        const singleImg = editingRecipePhotos[0] || null;
        const video = editingRecipeVideo;
        const isPublic = document.getElementById('edit-recipe-public-toggle')?.checked;
        const hashtags = val('edit-recipe-hashtags').split(/\s+/).map(h => h.replace(/^#/, '').trim()).filter(Boolean);
        const ingredients = val('edit-recipe-ingredients').split('\n').map(i => i.trim()).filter(Boolean);
        const steps = val('edit-recipe-steps').split('\n').map(s => s.trim()).filter(Boolean);

        const photos = editingRecipePhotos;

        const payload = {
          titulo: title,
          descricao: desc,
          tempoPreparo: time,
          dificuldade: difficulty,
          categorias: [category],
          imagem: photos[0] || singleImg || null,
          fotos: photos,
          video: video || null,
          hashtags: hashtags,
          ingredientes: ingredients,
          modoPreparo: steps.join('\n'),
          publica: isPublic
        };

        try {
          if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando alterações...';
          }

          const res = await api.put(`/receitas/atualizar/${recipeId}`, payload);

          // Atualiza dados na memória
          const idxInState = userState.creations.findIndex(c => String(c.id) === String(recipeId));
          if (idxInState !== -1) {
            userState.creations[idxInState] = {
              ...userState.creations[idxInState],
              title,
              description: desc,
              time,
              difficulty,
              category,
              image: photos[0] || singleImg || null,
              fotos: photos,
              video: video || null,
              hashtags,
              ingredients,
              steps,
              public: isPublic,
              communityPublished: isPublic
            };
          }

          closeEditRecipeModal();
          renderInstagramFeed();
          if (window.SaboreNotify) {
            window.SaboreNotify(isPublic ? 'Receita atualizada e publicada na comunidade!' : 'Receita atualizada com sucesso!', 'success');
          } else {
            alert('Receita atualizada com sucesso!');
          }
        } catch (err) {
          alert('Erro ao atualizar receita: ' + err.message);
        } finally {
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar alterações na receita';
          }
        }
      });
    }
  }

  initCreationsTabs();
  initEditRecipeModal();
async function loadProfileRanking() {
    try {
      const data = await api.get('/planos/ranking');
      let pontos = 0;
      let postsMes = 0;
      let posicao = '#--';
      let naZonaPro = false;

      if (isViewingOther && targetUserId) {
        const chef = (data.rankingCompleto || []).find(u => String(u.usuarioId) === String(targetUserId));
        if (chef) {
          pontos = chef.pontos || 0;
          postsMes = chef.receitasValidas || 0;
          posicao = `#${chef.posicao}`;
          naZonaPro = chef.posicao <= 5;
        }
      } else {
        if (data.usuarioLogado) {
          pontos = data.usuarioLogado.pontos || 0;
          postsMes = data.usuarioLogado.receitasValidas || 0;
          posicao = data.usuarioLogado.posicao ? `#${data.usuarioLogado.posicao}` : '#--';
          naZonaPro = Boolean(data.usuarioLogado.naZonaPro);
        } else {
          const fallbackUser = (data.rankingCompleto || []).find(u => String(u.usuarioId) === String(user.id));
          if (fallbackUser) {
            pontos = fallbackUser.pontos || 0;
            postsMes = fallbackUser.receitasValidas || 0;
            posicao = `#${fallbackUser.posicao}`;
            naZonaPro = Boolean(fallbackUser.naZonaPro);
          }
        }
      }

      const ptsEl = document.getElementById('profile-points-val');
      const posEl = document.getElementById('profile-rank-pos');
      const postsEl = document.getElementById('profile-month-posts');
      const zoneEl = document.getElementById('profile-zone-info');

      if (ptsEl) ptsEl.textContent = pontos;
      if (posEl) posEl.textContent = posicao;
      if (postsEl) postsEl.textContent = postsMes;
      if (zoneEl) {
        if (naZonaPro) {
          zoneEl.innerHTML = '<span style="color: #FFD700; font-weight: 700;"><i class="fa-solid fa-crown"></i> Está na Zona de Conquista PRO!</span>';
        } else if (pontos > 0) {
          zoneEl.innerHTML = `<span style="color: var(--accent);"><i class="fa-solid fa-chart-line"></i> ${posicao === '#1' ? 'Líder do ranking no mês!' : 'Pontuação ativa no ranking do mês'}</span>`;
        } else {
          zoneEl.innerHTML = '<span>Participe de desafios e eventos para pontuar no ranking!</span>';
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar ranking no perfil:', err);
    }
  }

  async function loadCreations(retryAttempt = false) {
    try {
      const container = document.getElementById('creations-grid');
      if (!container) return;

      const endpoint = isViewingOther ? `/receitas/listar?usuarioId=${targetUserId}` : '/receitas/listar';
      const data = await api.get(endpoint);
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
        if (retryBtn) retryBtn.addEventListener('click', () => loadCreations());
      }
      if (!retryAttempt) setTimeout(() => { if (api.getUser()) loadCreations(true); }, 16_000);
    }
  }

  async function loadProfileData() {
    try {
      const endpoint = isViewingOther ? `/usuarios/perfil?id=${targetUserId}` : "/usuarios/perfil";
      const profileData = await api.get(endpoint);
      userState.isPro = profileData.plano === "PRO";
      updatePlanUI();
      const profileName = document.querySelector('.perfil-user-card h2') || document.getElementById('profile-name-display');
      if (profileName) {
        profileName.innerHTML = api.renderUserIdentity(profileData.nome, profileData.plano);
      }
      const navUserName = document.querySelector('.user-name');
      if (navUserName && user.nome) {
        api.renderUserName(navUserName, user, user.plano);
      }
      if (profileData.foto) {
        applyAvatarToPage(profileData.foto);
      }
      const savedBio = (!isViewingOther ? localStorage.getItem('sabore_user_bio') : null) || profileData.bio || 'Amante da gastronomia, sempre testando novas receitas saudáveis e pratos rápidos com auxílio do Chef IA Saboré.';
      userState.bio = savedBio;
      const bioDisplay = document.getElementById('user-bio-display');
      if (bioDisplay) bioDisplay.textContent = savedBio;

      // Customizações quando visualizando o perfil de outro membro
      if (isViewingOther) {
        // Altera cabeçalho de 'Meu Perfil' para o nome do membro
        const headerTitle = document.querySelector('.nav-welcome-text h2');
        const headerDesc = document.querySelector('.nav-welcome-text p');
        if (headerTitle) {
          headerTitle.innerHTML = `Perfil de ${escapeHtml(profileData.nome || 'Membro')} <i class="fa-solid fa-user-check" style="color: var(--accent); margin-left: 6px; font-size: 1.1rem;"></i>`;
        }
        if (headerDesc) {
          headerDesc.textContent = `Visualizando perfil público na comunidade Saboré`;
        }

        // Remove o destaque laranja do item 'Perfil' no menu lateral
        const profileNavItem = document.querySelector('.sidebar a[href*="perfil"]');
        if (profileNavItem) {
          profileNavItem.classList.remove('active');
          profileNavItem.parentElement?.classList.remove('active');
        }

        // Esconde o painel de preferências culinárias (é privado do dono)
        const prefWidget = document.querySelector('.setup-widget:not(.insta-profile-widget)');
        if (prefWidget) prefWidget.style.display = 'none';

        // Esconde o botão de criar receita no feed de criações
        const createRecipeBtn = document.querySelector('.btn-create-recipe-insta');
        if (createRecipeBtn) createRecipeBtn.style.display = 'none';

        // Desativa clique no container de avatar
        if (avatarContainer) {
          avatarContainer.style.cursor = 'default';
          avatarContainer.onclick = (e) => e.stopPropagation();
        }

        // Esconde botões de edição pessoal
        const btnEditBio = document.getElementById('btn-edit-bio');
        const avatarOverlay = document.querySelector('.avatar-edit-overlay');
        const btnRemoveAvatar = document.getElementById('btn-remove-avatar');
        const settingsBtn = document.getElementById('settings-btn');
        if (btnEditBio) btnEditBio.style.display = 'none';
        if (avatarOverlay) avatarOverlay.style.display = 'none';
        if (btnRemoveAvatar) btnRemoveAvatar.style.display = 'none';
        if (settingsBtn) settingsBtn.style.display = 'none';
      }

      const followersVal = document.getElementById('profile-followers-count');
      const followingVal = document.getElementById('profile-following-count');
      try {
        const socialEndpoint = isViewingOther ? `/social/resumo/${targetUserId}` : '/social/meu-resumo';
        const social = await api.get(socialEndpoint);
        if (followersVal) followersVal.textContent = social.seguidores || 0;
        if (followingVal) followingVal.textContent = social.seguindo || 0;
      } catch (eSoc) {
        if (followersVal) followersVal.textContent = 0;
        if (followingVal) followingVal.textContent = 0;
      }

      try {
        const achievementsEndpoint = isViewingOther ? `/usuarios/conquistas/${targetUserId}` : '/usuarios/conquistas';
        const achievements = await api.get(achievementsEndpoint);
        const achievementsList = document.getElementById('profile-achievements-list');
        const achievementsToShow = Array.isArray(achievements) ? [...achievements] : [];
        if (achievementsList) {
          if (achievementsToShow.length) {
            achievementsList.innerHTML = achievementsToShow.map(item => {
              const nome = item.nome || item.titulo || 'Conquista';
              let imgSrc = item.emblema || '';
              if (imgSrc.startsWith('/assets/')) {
                imgSrc = `../..${imgSrc}`;
              } else if (!imgSrc) {
                const slug = (item.emblemaId || item.id || item.titulo || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                imgSrc = `../../assets/Emblemas/${slug}.png`;
              }
              const data = item.concedidaEm || item.conquiridoEm ? new Date(item.concedidaEm || item.conquiridoEm).toLocaleDateString('pt-BR') : '';
              return `<div class="achievement-badge-card" title="${nome}">
                <img class="achievement-badge-img" src="${imgSrc}" alt="${nome}"
                  onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div style="display:none;width:52px;height:52px;border-radius:50%;background:rgba(240,213,182,0.15);align-items:center;justify-content:center;margin-bottom:8px;">
                  <i class="fa-solid fa-medal" style="font-size:1.5rem;color:#F0D5B6;"></i>
                </div>
                <span class="achievement-badge-name">${nome}</span>
                ${data ? `<span class="achievement-badge-date">${data}</span>` : ''}
              </div>`;
            }).join('');
          } else {
            achievementsList.innerHTML = '<span class="profile-achievements-empty" style="font-size:0.82rem;color:rgba(242,244,243,0.5);grid-column:1/-1;">Suas conquistas em eventos especiais aparecerão aqui.</span>';
          }
        }
      } catch (achievementError) {
        console.warn('Não foi possível carregar as conquistas do perfil:', achievementError);
      }
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
                  <h4>${api.renderUserIdentity(item.nome, item.plano)}</h4>
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
              <span style="font-size:0.75rem;color:rgba(242,244,243,0.4)">Visite a página <strong>Comunidade</strong> para descobrir chefs e criações incríveis!</span>
            </div>`;
        } else {
          followingList.innerHTML = following.map(item => `
            <div class="social-item-row" data-user-id="${item.id}">
              <div class="social-user-details">
                ${item.foto ? `<img src="${item.foto}" alt="${item.nome}" class="social-user-avatar">` : `<div class="social-user-placeholder">${(item.nome || 'U').charAt(0).toUpperCase()}</div>`}
                <div class="social-user-names">
                  <h4>${api.renderUserIdentity(item.nome, item.plano)}</h4>
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
  loadProfileRanking();
});
