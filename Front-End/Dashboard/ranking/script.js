document.addEventListener('DOMContentLoaded', () => {
  const user = api.getUser();
  if (!user) {
    window.location.href = "../../login/index.html";
    return;
  }

  // Elementos da Navbar e Perfil
  const navAvatar = document.querySelector('.user-avatar');
  if (navAvatar && user.foto) navAvatar.src = user.foto;
  const navName = document.querySelector('.user-name');
  if (navName && user.nome) navName.textContent = user.nome.split(' ')[0];

  const profileTrigger = document.getElementById('profile-dropdown-trigger');
  if (profileTrigger) {
    profileTrigger.addEventListener('click', () => {
      window.location.href = '../perfil/index.html';
    });
  }

  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      window.location.href = '../configuracoes/index.html';
    });
  }

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

  // Modais
  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
  }
  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
  }

  const rulesTriggers = [
    document.getElementById('btn-open-rules'),
    document.getElementById('btn-show-rules-nav'),
    document.getElementById('btn-quick-rules')
  ];
  rulesTriggers.forEach(btn => {
    if (btn) btn.addEventListener('click', () => openModal('rules-modal'));
  });

  const closeRules = document.getElementById('close-rules-modal');
  if (closeRules) closeRules.addEventListener('click', () => closeModal('rules-modal'));
  const btnCloseRulesAction = document.getElementById('btn-close-rules-action');
  if (btnCloseRulesAction) btnCloseRulesAction.addEventListener('click', () => closeModal('rules-modal'));

  const btnMyHistory = document.getElementById('btn-my-history');
  if (btnMyHistory) {
    btnMyHistory.addEventListener('click', () => {
      openModal('history-modal');
      carregarHistoricoAtividades();
    });
  }
  const closeHistory = document.getElementById('close-history-modal');
  if (closeHistory) closeHistory.addEventListener('click', () => closeModal('history-modal'));

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });

  // Carregamento dos dados do ranking
  async function carregarRanking() {
    try {
      const data = await api.get('/planos/ranking');
      renderizarCountdown(data.periodo, data.mesReferencia);
      renderizarStripUsuario(data.usuarioLogado);
      renderizarPodium(data.top5);
      renderizarTabelaCompleta(data.rankingCompleto, data.usuarioLogado?.usuarioId);
    } catch (err) {
      console.error('Erro ao carregar ranking:', err);
      const podiumGrid = document.getElementById('podium-cards-grid');
      if (podiumGrid) {
        podiumGrid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: rgba(242, 244, 243, 0.6);">
            <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; color: var(--accent); margin-bottom: 12px; display: block;"></i>
            <p>Não foi possível carregar o ranking no momento: ${err.message}</p>
          </div>
        `;
      }
    }
  }

  function renderizarCountdown(periodo, mesReferencia) {
    if (!periodo) return;
    const daysEl = document.getElementById('countdown-days');
    const hoursEl = document.getElementById('countdown-hours');
    const monthLabel = document.getElementById('ranking-month-label');

    if (daysEl) daysEl.textContent = String(periodo.diasRestantes).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(periodo.horasRestantes).padStart(2, '0');
    if (monthLabel) monthLabel.textContent = `Mês de Referência: ${mesReferencia}`;
  }

  function renderizarStripUsuario(usuarioLogado) {
    const stripAvatar = document.getElementById('strip-user-avatar');
    const stripName = document.getElementById('strip-user-name');
    const stripPlan = document.getElementById('strip-plan-pill');
    const stripZone = document.getElementById('strip-zone-pill');
    const stripPos = document.getElementById('strip-user-pos');
    const stripPts = document.getElementById('strip-user-points');
    const stripDesc = document.getElementById('strip-status-desc');
    const navPlan = document.getElementById('navbar-plan-tag');

    if (!usuarioLogado) {
      if (stripName) stripName.textContent = user.nome || 'Você';
      if (stripAvatar) stripAvatar.src = user.foto || '../../assets/LOGO SABORÉ.png';
      return;
    }

    if (stripAvatar) stripAvatar.src = usuarioLogado.foto || '../../assets/LOGO SABORÉ.png';
    if (stripName) stripName.textContent = usuarioLogado.nome;
    if (stripPos) stripPos.textContent = `#${usuarioLogado.posicao}`;
    if (stripPts) stripPts.textContent = `${usuarioLogado.pontos} pts`;

    const isPro = usuarioLogado.plano === 'PRO';
    if (stripPlan) {
      stripPlan.textContent = isPro ? 'PRO' : 'FREE';
      stripPlan.className = `strip-plan-pill ${isPro ? 'pro' : 'free'}`;
    }
    if (navPlan) {
      navPlan.textContent = isPro ? 'PRO' : 'FREE';
      navPlan.className = `user-plan-tag ${isPro ? 'pro' : 'free'}`;
    }

    if (usuarioLogado.naZonaPro) {
      if (stripZone) stripZone.classList.remove('hidden');
      if (stripDesc) stripDesc.textContent = `Parabéns! Você está na 5ª posição ou superior e garantindo o PRO!`;
    } else {
      if (stripZone) stripZone.classList.add('hidden');
      if (stripDesc) stripDesc.textContent = `Participe da comunidade para entrar na zona de classificação dos 5 primeiros!`;
    }
  }

  function renderizarPodium(top5) {
    const grid = document.getElementById('podium-cards-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!top5 || top5.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: rgba(242, 244, 243, 0.6);">
          Nenhum participante pontuou ainda este mês. Seja o primeiro a publicar uma receita!
        </div>
      `;
      return;
    }

    top5.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = `podium-card rank-${idx + 1}`;
      const defaultAvatar = '../../assets/LOGO SABORÉ.png';
      const avatarSrc = item.foto || defaultAvatar;

      card.innerHTML = `
        <div class="podium-rank-badge">${item.posicao}º</div>
        <div class="podium-avatar-wrap">
          <img src="${avatarSrc}" alt="${item.nome}" class="podium-avatar">
          ${item.posicao === 1 ? '<i class="fa-solid fa-crown podium-crown-icon"></i>' : ''}
        </div>
        <h4 class="podium-user-name" title="${item.nome}">${item.nome}</h4>
        <div class="podium-points-tag">${item.pontos} pts</div>
        <div class="podium-recipe-count"><i class="fa-solid fa-utensils"></i> ${item.receitasValidas} receitas no mês</div>
        <span class="podium-pro-target"><i class="fa-solid fa-gem"></i> Zona PRO</span>
      `;
      grid.appendChild(card);
    });
  }

  function renderizarTabelaCompleta(ranking, meuId) {
    const tbody = document.getElementById('ranking-table-body');
    const totalLabel = document.getElementById('total-participants-label');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (totalLabel && ranking) {
      totalLabel.textContent = `${ranking.length} cozinheiros participando do ranking este mês`;
    }

    if (!ranking || ranking.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 30px;">Nenhum usuário classificado ainda.</td></tr>';
      return;
    }

    ranking.forEach(r => {
      const tr = document.createElement('tr');
      const isMe = r.usuarioId === meuId;
      if (isMe) tr.classList.add('current-user-row');
      if (r.naZonaPro) tr.classList.add('zone-pro-row');

      const avatarSrc = r.foto || '../../assets/LOGO SABORÉ.png';
      const crownIcon = r.posicao <= 5 ? '<i class="fa-solid fa-star" style="color: #FFD700; font-size: 0.8rem; margin-left: 4px;" title="Zona PRO"></i>' : '';

      tr.innerHTML = `
        <td>
          <div class="rank-num-cell">
            <span class="rank-num">#${r.posicao}</span>
            ${crownIcon}
          </div>
        </td>
        <td>
          <div class="user-cell">
            <img src="${avatarSrc}" alt="${r.nome}" class="user-cell-avatar">
            <span class="user-cell-name">${r.nome}</span>
            ${isMe ? '<span class="user-cell-me-tag">Você</span>' : ''}
          </div>
        </td>
        <td>
          <span class="plan-table-pill ${r.plano === 'PRO' ? 'pro' : 'free'}">${r.plano || 'FREE'}</span>
        </td>
        <td>
          <i class="fa-solid fa-utensils" style="color: rgba(242, 244, 243, 0.4); margin-right: 4px;"></i>
          ${r.receitasValidas}
        </td>
        <td>
          <span class="points-table-val">${r.pontos} pts</span>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  async function carregarHistoricoAtividades() {
    const container = document.getElementById('history-list-container');
    const totalEl = document.getElementById('history-total-points');
    const subtitle = document.getElementById('history-modal-subtitle');
    if (!container) return;

    container.innerHTML = '<p style="text-align: center; color: rgba(242, 244, 243, 0.5); padding: 20px;">Carregando extrato...</p>';

    try {
      const data = await api.get('/planos/historico-atividades');
      if (subtitle) subtitle.textContent = `Extrato de pontuações de ${data.mesReferencia}:`;
      if (totalEl) totalEl.textContent = `${data.totalPontos} pts`;

      if (!data.atividades || data.atividades.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 30px; color: rgba(242, 244, 243, 0.5);">
            <i class="fa-solid fa-inbox" style="font-size: 2rem; margin-bottom: 8px; display: block;"></i>
            Nenhuma atividade registrada este mês ainda. Publique uma receita ou interaja com a comunidade para acumular pontos!
          </div>
        `;
        return;
      }

      container.innerHTML = '';
      data.atividades.forEach(ativ => {
        const item = document.createElement('div');
        item.className = 'history-item';
        const dateObj = new Date(ativ.createdAt);
        const dataFormatada = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

        item.innerHTML = `
          <div class="history-item-left">
            <span class="history-item-desc">${ativ.descricao || ativ.tipo}</span>
            <span class="history-item-date">${dataFormatada}</span>
          </div>
          <span class="history-item-pts">+${ativ.pontos} pts</span>
        `;
        container.appendChild(item);
      });
    } catch (err) {
      container.innerHTML = `<p style="text-align: center; color: var(--danger); padding: 20px;">Erro ao carregar histórico: ${err.message}</p>`;
    }
  }

  carregarRanking();
});
