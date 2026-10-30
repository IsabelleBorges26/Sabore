document.addEventListener('DOMContentLoaded', () => {
  const user = api.getUser();
  if (!user) {
    window.location.href = "../../login/index.html";
    return;
  }

  const navAvatar = document.querySelector('.user-avatar');
  if (navAvatar && user.foto) navAvatar.src = user.foto;
  const navName = document.querySelector('.user-name');
  if (navName && user.nome) navName.textContent = user.nome.split(' ')[0];

  const monthInput = document.getElementById('fechamento-mes-input');
  if (monthInput) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    monthInput.value = `${y}-${m}`;
  }

  // Abas
  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.dataset.tab;
      const targetEl = document.getElementById(targetId);
      if (targetEl) targetEl.classList.add('active');
    });
  });

  // Carrega dados da área administrativa
  async function carregarDashboardAdmin() {
    try {
      const data = await api.get('/planos/admin/dashboard');

      // Atualiza cards
      const statTotalUsuarios = document.getElementById('stat-total-usuarios');
      const statPontosLider = document.getElementById('stat-pontos-lider');
      const statTotalConcessoes = document.getElementById('stat-total-concessoes');
      const statTotalFechamentos = document.getElementById('stat-total-fechamentos');

      if (statTotalUsuarios) statTotalUsuarios.textContent = data.rankingAtual ? data.rankingAtual.length : 0;
      if (statPontosLider) {
        const lider = data.rankingAtual && data.rankingAtual[0];
        statPontosLider.textContent = lider ? `${lider.pontos} pts` : '0 pts';
      }
      if (statTotalConcessoes) statTotalConcessoes.textContent = data.concessoes ? data.concessoes.length : 0;
      if (statTotalFechamentos) statTotalFechamentos.textContent = data.fechamentos ? data.fechamentos.length : 0;

      // Renderiza tabelas
      renderizarAdminRanking(data.rankingAtual);
      renderizarAdminFechamentos(data.fechamentos);
      renderizarAdminConcessoes(data.concessoes);
      renderizarAdminAtividades(data.atividadesRecentes);
    } catch (err) {
      console.error('Erro ao carregar dados administrativos:', err);
      if (err.message && err.message.includes('403')) {
        alert('Acesso negado: Você precisa ter permissão de administrador para visualizar esta área.');
        window.location.href = '../home/index.html';
      }
    }
  }

  function renderizarAdminRanking(ranking) {
    const tbody = document.getElementById('admin-ranking-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!ranking || ranking.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;">Nenhum usuário no ranking.</td></tr>';
      return;
    }

    ranking.forEach(r => {
      const tr = document.createElement('tr');
      const avatarSrc = r.foto || '../../assets/LOGO SABORÉ.png';
      tr.innerHTML = `
        <td><strong class="rank-num">#${r.posicao}</strong> ${r.posicao <= 5 ? '<i class="fa-solid fa-crown" style="color: #FFD700; margin-left: 4px;"></i>' : ''}</td>
        <td>
          <div class="user-cell">
            <img src="${avatarSrc}" alt="${r.nome}" class="user-cell-avatar">
            <span class="user-cell-name">${r.nome}</span>
          </div>
        </td>
        <td><span style="color: rgba(242, 244, 243, 0.6);">${r.email || '—'}</span></td>
        <td><span class="plan-table-pill ${r.plano === 'PRO' ? 'pro' : 'free'}">${r.plano}</span></td>
        <td>${r.receitasValidas}</td>
        <td><span class="points-table-val">${r.pontos} pts</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderizarAdminFechamentos(fechamentos) {
    const tbody = document.getElementById('admin-fechamentos-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!fechamentos || fechamentos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px;">Nenhum fechamento arquivado ainda.</td></tr>';
      return;
    }

    fechamentos.forEach(f => {
      const tr = document.createElement('tr');
      const dataFormatada = new Date(f.executadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const topList = Array.isArray(f.topUsuarios) ? f.topUsuarios.map(u => `${u.nome} (${u.pontos} pts)`).join(', ') : '—';

      tr.innerHTML = `
        <td><strong style="color: var(--secondary);">${f.mesReferencia}</strong></td>
        <td>${dataFormatada}</td>
        <td>${f.executadoPor ? f.executadoPor.nome : 'Automático / Sistema'}</td>
        <td>${f.totalApurado} pts</td>
        <td style="font-size: 0.82rem; color: rgba(242, 244, 243, 0.85);">${topList}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderizarAdminConcessoes(concessoes) {
    const tbody = document.getElementById('admin-concessoes-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!concessoes || concessoes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 30px;">Nenhuma concessão de PRO registrada.</td></tr>';
      return;
    }

    const agora = new Date();

    concessoes.forEach(c => {
      const tr = document.createElement('tr');
      const expira = new Date(c.expiraEm);
      const isValido = c.ativo && expira >= agora;
      const dataFim = expira.toLocaleDateString('pt-BR');

      tr.innerHTML = `
        <td>
          <div class="user-cell">
            <span class="user-cell-name">${c.usuario ? c.usuario.nome : `Usuário #${c.usuarioId}`}</span>
          </div>
        </td>
        <td><strong class="rank-num">#${c.posicao}</strong></td>
        <td>${c.pontos} pts</td>
        <td>${c.mesReferencia}</td>
        <td><strong style="color: var(--secondary);">${c.mesVigencia}</strong></td>
        <td>${dataFim}</td>
        <td><span class="${isValido ? 'status-badge-active' : 'status-badge-expired'}">${isValido ? 'Ativo' : 'Expirado'}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderizarAdminAtividades(atividades) {
    const tbody = document.getElementById('admin-atividades-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!atividades || atividades.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;">Nenhuma atividade recente registrada.</td></tr>';
      return;
    }

    atividades.forEach(a => {
      const tr = document.createElement('tr');
      const dataFormatada = new Date(a.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

      tr.innerHTML = `
        <td style="font-size: 0.8rem; color: rgba(242, 244, 243, 0.6);">${dataFormatada}</td>
        <td>${a.usuario ? a.usuario.nome : `Usuário #${a.usuarioId}`}</td>
        <td><span class="plan-table-pill free">${a.tipo}</span></td>
        <td><strong style="color: var(--accent);">+${a.pontos} pts</strong></td>
        <td style="font-size: 0.85rem;">${a.descricao || '—'}</td>
        <td><span class="code-pill">${a.chaveUnica || 'sem chave'}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Executar fechamento mensal
  const btnExecutar = document.getElementById('btn-executar-fechamento');
  if (btnExecutar) {
    btnExecutar.addEventListener('click', async () => {
      const mesRef = monthInput ? monthInput.value.trim() : '';
      if (!mesRef) {
        alert('Informe o mês de referência no formato YYYY-MM.');
        return;
      }

      const confirmou = confirm(`Tem certeza que deseja apurar e executar o fechamento do mês ${mesRef}? Os 5 usuários com maior pontuação conquistarão o plano PRO para o mês seguinte.`);
      if (!confirmou) return;

      btnExecutar.disabled = true;
      btnExecutar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processando Fechamento...';

      try {
        const res = await api.post('/planos/admin/fechamento', { mesReferencia: mesRef });
        if (res.jaExecutado) {
          alert(`Atenção: ${res.mensagem}`);
        } else {
          alert(`Fechamento do mês ${mesRef} concluído com sucesso! ${res.vencedores?.length || 0} usuários foram premiados com o plano PRO para vigência ${res.mesVigencia}.`);
        }
        await carregarDashboardAdmin();
      } catch (err) {
        alert('Erro ao executar fechamento: ' + err.message);
      } finally {
        btnExecutar.disabled = false;
        btnExecutar.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Executar Fechamento Agora';
      }
    });
  }

  carregarDashboardAdmin();
});
