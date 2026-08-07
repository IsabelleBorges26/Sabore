

document.addEventListener('DOMContentLoaded', () => {

  const user = api.getUser();
  if (!user) {
    window.location.href = "../../login/index.html";
    return;
  }

  let userState = {
    isPro: false,
    bio: localStorage.getItem('sabore_user_bio') || '',
    preferences: localStorage.getItem('sabore_user_preferences') ? JSON.parse(localStorage.getItem('sabore_user_preferences')) : []
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

  const savedAvatar = localStorage.getItem('sabore_user_avatar');
  if (savedAvatar) {
    const userAvatars = document.querySelectorAll('.user-avatar, .large-user-avatar');
    userAvatars.forEach(img => img.src = savedAvatar);
  }

  const avatarContainer = document.querySelector('.avatar-container');
  const avatarInput = document.getElementById('avatar-upload-input');

  if (avatarContainer && avatarInput) {
    avatarContainer.addEventListener('click', () => {
      avatarInput.click();
    });

    avatarInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target.result;

          localStorage.setItem('sabore_user_avatar', dataUrl);

          const userAvatars = document.querySelectorAll('.user-avatar, .large-user-avatar');
          userAvatars.forEach(img => img.src = dataUrl);
        };
        reader.readAsDataURL(file);
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

  // ─── DYNAMIC CREATIONS LOADING FROM API ───
  async function loadCreations() {
    try {
      const container = document.querySelector(".creations-grid");
      if (!container) return;

      const creations = await api.get("/receitas/listar");
      container.innerHTML = "";

      if (creations.length === 0) {
        container.innerHTML = `
          <div class="empty-creations-placeholder" style="grid-column: 1 / -1; text-align: center; padding: 35px; color: rgba(242, 244, 243, 0.45);">
            <i class="fa-solid fa-utensils" style="font-size: 2.5rem; color: var(--accent); margin-bottom: 12px; display: block;"></i>
            <h4>Nenhuma criação ainda</h4>
            <p style="font-size: 0.8rem; margin-top: 5px;">Você ainda não criou nenhuma receita própria.</p>
            <a href="../chefIA/index.html" class="btn-edit-profile" style="display: inline-block; margin-top: 12px; text-decoration: none; padding: 6px 12px; font-size: 0.8rem;"><i class="fa-solid fa-robot"></i> Criar com Chef IA</a>
          </div>
        `;
        return;
      }

      creations.forEach(rec => {
        const card = document.createElement("article");
        card.className = "creation-card";
        card.innerHTML = `
          <div class="creation-img-wrap">
            <img src="${rec.image || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=400&q=80'}" alt="${rec.title}">
            <span class="creation-category">${rec.category}</span>
          </div>
          <div class="creation-info">
            <h4>${rec.title}</h4>
            <div class="creation-meta">
              <span><i class="fa-regular fa-clock"></i> ${rec.time} min</span>
              <span><i class="fa-solid fa-gauge-simple"></i> ${rec.difficulty}</span>
            </div>
          </div>
        `;
        container.appendChild(card);
      });
      updateCursorHoverListeners();
    } catch (err) {
      console.error("Erro ao carregar criações:", err);
    }
  }

  // ─── DYNAMIC PROFILE DATA LOADING FROM API ───
  async function loadProfileData() {
    try {
      const profileData = await api.get("/usuarios/perfil");
      userState.isPro = profileData.plano === "PRO";
      updatePlanUI();

      // Update name
      const profileName = document.querySelector('.perfil-user-card h2');
      if (profileName && user.nome) {
        profileName.textContent = user.nome;
      }

      // Update bio
      const savedBio = localStorage.getItem('sabore_user_bio') || profileData.bio || 'Amante da gastronomia, sempre testando novas receitas saudáveis e pratos rápidos com auxílio do Chef IA Saboré.';
      userState.bio = savedBio;
      const bioDisplay = document.getElementById('user-bio-display');
      if (bioDisplay) bioDisplay.textContent = savedBio;

      // Update stats
      const followersVal = document.getElementById('profile-followers-count');
      const followingVal = document.getElementById('profile-following-count');
      const recipesVal = document.getElementById('profile-recipes-count');

      if (followersVal) followersVal.textContent = "0"; // New users start with 0
      if (followingVal) followingVal.textContent = "0"; // New users start with 0
      if (recipesVal) recipesVal.textContent = profileData.stats.created;

    } catch (err) {
      console.error("Erro ao carregar dados do perfil:", err);
    }
  }

  // Initial rendering
  renderPrefTags();
  loadProfileData();
  loadCreations();

});
