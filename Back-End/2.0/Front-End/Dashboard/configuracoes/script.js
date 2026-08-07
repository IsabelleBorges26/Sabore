

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

  const themes = {
    obsidian: {
      '--dark': '#1B2B27',
      '--dark-deep': '#121F1C',
      '--accent': '#E0857A',
      '--accent-light': 'rgba(224, 133, 122, 0.15)',
      '--secondary': '#F0D5B6'
    },
    emerald: {
      '--dark': '#15362C',
      '--dark-deep': '#0A1C16',
      '--accent': '#6AE0A6',
      '--accent-light': 'rgba(106, 224, 166, 0.15)',
      '--secondary': '#C4F0D7'
    },
    rosegold: {
      '--dark': '#3D2229',
      '--dark-deep': '#241015',
      '--accent': '#E07AA4',
      '--accent-light': 'rgba(224, 122, 164, 0.15)',
      '--secondary': '#F0B6CD'
    }
  };

  function applyTheme(themeName) {
    const themeProps = themes[themeName] || themes.obsidian;
    Object.keys(themeProps).forEach(key => {
      document.documentElement.style.setProperty(key, themeProps[key]);
    });
  }

  const savedTheme = localStorage.getItem('sabore_theme') || 'obsidian';
  applyTheme(savedTheme);
  const themeSelector = document.getElementById('theme-selector');
  if (themeSelector) {
    themeSelector.value = savedTheme;
    themeSelector.addEventListener('change', (e) => {
      applyTheme(e.target.value);
    });
  }

  let userState = {
    isPro: false
  };

  const savedName = localStorage.getItem('sabore_user_name') || 'Davi Moratorio';
  const savedEmail = localStorage.getItem('sabore_user_email') || 'davi.moratorio@sabore.com.br';
  
  const nameInput = document.getElementById('profile-name');
  const emailInput = document.getElementById('profile-email');
  
  if (nameInput) nameInput.value = savedName;
  if (emailInput) emailInput.value = savedEmail;

  const navUserName = document.querySelector('.user-name');
  if (navUserName && savedName) {
    
    navUserName.textContent = savedName.split(' ')[0];
  }

  const savedDifficulty = localStorage.getItem('sabore_ai_difficulty') || 'medium';
  const savedServings = localStorage.getItem('sabore_ai_servings') || '2';
  
  const difficultySelect = document.getElementById('default-difficulty');
  const servingsSelect = document.getElementById('default-servings');
  
  if (difficultySelect) difficultySelect.value = savedDifficulty;
  if (servingsSelect) servingsSelect.value = savedServings;

  const dietCheckboxes = ['vegan', 'vegetarian', 'gluten', 'lactose', 'lowcarb', 'keto'];
  dietCheckboxes.forEach(diet => {
    const cb = document.getElementById(`diet-${diet}`);
    if (cb) {
      const isChecked = localStorage.getItem(`sabore_diet_${diet}`);
      if (isChecked !== null) {
        cb.checked = isChecked === 'true';
      }
    }
  });

  const savedNeonGlow = localStorage.getItem('sabore_neon_glow') !== 'false'; 
  const neonGlowToggle = document.getElementById('neon-glow-toggle');
  if (neonGlowToggle) {
    neonGlowToggle.checked = savedNeonGlow;
  }

  const savedNotifDaily = localStorage.getItem('sabore_notif_daily') !== 'false'; 
  const notifDailyToggle = document.getElementById('notif-daily');
  if (notifDailyToggle) {
    notifDailyToggle.checked = savedNotifDaily;
  }

  const savedNotifWeekly = localStorage.getItem('sabore_notif_weekly') === 'true'; 
  const notifWeeklyToggle = document.getElementById('notif-weekly');
  if (notifWeeklyToggle) {
    notifWeeklyToggle.checked = savedNotifWeekly;
  }

  const customCursor = document.createElement('div');
  customCursor.className = 'custom-cursor';
  document.body.appendChild(customCursor);

  document.addEventListener('mousemove', (e) => {
    customCursor.style.left = e.clientX + 'px';
    customCursor.style.top = e.clientY + 'px';
  });

  function updateCursorHoverListeners() {
    const interactives = document.querySelectorAll('a, button, input, select, textarea, [role="button"], option, .custom-checkbox-wrap, .switch-toggle');
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

  function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <span class="toast-icon"><i class="fa-solid fa-circle-check"></i></span>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    updateCursorHoverListeners();

    setTimeout(() => {
      toast.classList.add('removing');
      toast.addEventListener('animationend', () => {
        toast.remove();
      });
    }, 3000);
  }

  const saveBtn = document.getElementById('btn-save-settings');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      
      const newName = nameInput ? nameInput.value.trim() : '';
      const newEmail = emailInput ? emailInput.value.trim() : '';
      if (newName) localStorage.setItem('sabore_user_name', newName);
      if (newEmail) localStorage.setItem('sabore_user_email', newEmail);

      if (navUserName && newName) {
        navUserName.textContent = newName.split(' ')[0];
      }

      if (difficultySelect) localStorage.setItem('sabore_ai_difficulty', difficultySelect.value);
      if (servingsSelect) localStorage.setItem('sabore_ai_servings', servingsSelect.value);

      dietCheckboxes.forEach(diet => {
        const cb = document.getElementById(`diet-${diet}`);
        if (cb) {
          localStorage.setItem(`sabore_diet_${diet}`, cb.checked ? 'true' : 'false');
        }
      });

      if (themeSelector) localStorage.setItem('sabore_theme', themeSelector.value);
      if (neonGlowToggle) localStorage.setItem('sabore_neon_glow', neonGlowToggle.checked ? 'true' : 'false');

      if (notifDailyToggle) localStorage.setItem('sabore_notif_daily', notifDailyToggle.checked ? 'true' : 'false');
      if (notifWeeklyToggle) localStorage.setItem('sabore_notif_weekly', notifWeeklyToggle.checked ? 'true' : 'false');

      showToast('Configurações salvas com sucesso!');
    });
  }

  const resetCacheBtn = document.getElementById('btn-reset-cache');
  if (resetCacheBtn) {
    resetCacheBtn.addEventListener('click', () => {
      const confirmReset = confirm('Deseja realmente limpar todos os seus dados locais?\n\nIsso irá apagar sua foto de perfil customizada, seu nome editado e as preferências culinárias salvas neste navegador.');
      if (confirmReset) {
        localStorage.removeItem('sabore_user_avatar');
        localStorage.removeItem('sabore_user_name');
        localStorage.removeItem('sabore_user_email');
        localStorage.removeItem('sabore_theme');
        localStorage.removeItem('sabore_neon_glow');
        localStorage.removeItem('sabore_ai_difficulty');
        localStorage.removeItem('sabore_ai_servings');
        dietCheckboxes.forEach(diet => localStorage.removeItem(`sabore_diet_${diet}`));
        
        alert('Dados locais limpos com sucesso!');
        location.reload();
      }
    });
  }

  const deleteAccountBtn = document.getElementById('btn-delete-account');
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', () => {
      const confirmDelete = confirm('Tem certeza absoluta de que deseja desativar sua conta?\n\nEsta ação é irreversível e você perderá o acesso a todas as suas receitas e livros salvos.');
      if (confirmDelete) {
        alert('Sua conta foi desativada temporariamente. Redirecionando para a página inicial...');
        location.href = '../../inicial/index.html';
      }
    });
  }

  const profileTrigger = document.getElementById('profile-dropdown-trigger');
  if (profileTrigger) {
    profileTrigger.addEventListener('click', () => {
      window.location.href = '../perfil/index.html';
    });
  }

});
