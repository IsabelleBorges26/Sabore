document.addEventListener('DOMContentLoaded', () => {
  const user = api.getUser();
  if (!user) {
    window.location.href = "../../login/index.html";
    return;
  }

  const navAvatar = document.querySelector('.user-avatar');
  if (navAvatar && user.foto) navAvatar.src = user.foto;
  const navName = document.querySelector('.user-name');
  if (navName && user.nome) api.renderUserName(navName, user);

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
      const avatarSrc = r.foto || '../../assets/branding/LOGO SABORÉ.png';
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

  /* =====================================================================
     GESTÃO ADMINISTRATIVA: DESAFIOS SEMANAIS
  ===================================================================== */
  let todosDesafiosAdmin = [];

  const btnToggleFormDesafio = document.getElementById('btn-toggle-form-desafio');
  const formDesafioWrap = document.getElementById('admin-form-desafio-wrap');
  const formDesafio = document.getElementById('admin-form-desafio');
  const btnCancelarDesafio = document.getElementById('adm-desafio-cancelar');

  if (btnToggleFormDesafio && formDesafioWrap) {
    btnToggleFormDesafio.addEventListener('click', () => {
      formDesafio.reset();
      document.getElementById('adm-desafio-id').value = '';
      document.getElementById('admin-form-desafio-title').innerHTML = '<i class="fa-solid fa-calendar-plus"></i> Cadastrar / Agendar Desafio';
      formDesafioWrap.style.display = formDesafioWrap.style.display === 'none' ? 'block' : 'none';
    });
  }
  if (btnCancelarDesafio && formDesafioWrap) {
    btnCancelarDesafio.addEventListener('click', () => { formDesafioWrap.style.display = 'none'; });
  }

  if (formDesafio) {
    formDesafio.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('adm-desafio-id').value;
      const titulo = document.getElementById('adm-desafio-titulo').value.trim();
      const hashtag = document.getElementById('adm-desafio-hashtag').value.trim();
      const tema = document.getElementById('adm-desafio-tema').value.trim();
      const imagem = document.getElementById('adm-desafio-imagem').value.trim();
      const inicioEm = document.getElementById('adm-desafio-inicio').value;
      const fimEm = document.getElementById('adm-desafio-fim').value;
      const descricao = document.getElementById('adm-desafio-descricao').value.trim();

      try {
        await api.post('/desafios/semanal/admin/salvar', {
          id: id ? Number(id) : undefined,
          titulo, hashtag, tema, imagem, inicioEm, fimEm, descricao
        });
        alert('Desafio semanal salvo com sucesso!');
        formDesafioWrap.style.display = 'none';
        carregarDesafiosAdmin();
      } catch (err) {
        alert('Erro ao salvar desafio: ' + err.message);
      }
    });
  }

  async function carregarDesafiosAdmin() {
    try {
      const lista = await api.get('/desafios/semanal/programados');
      todosDesafiosAdmin = Array.isArray(lista) ? lista : [];
      renderizarTabelaDesafios(todosDesafiosAdmin);
      carregarParticipacoesAdmin();
    } catch (err) {
      console.warn('Erro ao listar desafios:', err);
    }
  }

  function renderizarTabelaDesafios(desafios) {
    const tbody = document.getElementById('admin-desafios-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!desafios || desafios.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 25px;">Nenhum desafio encontrado.</td></tr>';
      return;
    }

    const agora = Date.now();

    desafios.forEach(d => {
      const tr = document.createElement('tr');
      const ini = new Date(d.inicioEm).getTime();
      const fim = new Date(d.fimEm).getTime();
      let statusHtml = '<span class="status-badge-active">Ativo</span>';
      if (!d.ativo || agora > fim) {
        statusHtml = '<span class="status-badge-expired">Encerrado</span>';
      } else if (agora < ini) {
        statusHtml = '<span style="background: rgba(240,213,182,0.2); color: #F0D5B6; padding: 3px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 700;">Em Breve</span>';
      }

      const iniStr = new Date(d.inicioEm).toLocaleDateString('pt-BR');
      const fimStr = new Date(d.fimEm).toLocaleDateString('pt-BR');

      tr.innerHTML = `
        <td style="font-size: 0.85rem; color: rgba(242,244,243,0.7);">${iniStr} a ${fimStr}</td>
        <td><strong style="color: #fff;">${d.titulo}</strong><br><span style="font-size: 0.75rem; color: rgba(242,244,243,0.5);">${d.tema}</span></td>
        <td><span style="color: var(--secondary); font-family: monospace; font-weight: 700;">${d.hashtag}</span></td>
        <td><strong style="color: var(--accent);">+${d.pontosRecompensa || 30} pts</strong></td>
        <td>${statusHtml}</td>
        <td style="text-align: right;">
          <button type="button" class="btn-editar-desafio" data-id="${d.id}" style="padding: 5px 10px; border-radius: 6px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; cursor: pointer; margin-right: 5px;">
            <i class="fa-solid fa-pen"></i>
          </button>
          ${d.ativo && agora <= fim ? `
            <button type="button" class="btn-encerrar-desafio" data-id="${d.id}" style="padding: 5px 10px; border-radius: 6px; background: rgba(224,133,122,0.2); border: 1px solid rgba(224,133,122,0.4); color: var(--accent); cursor: pointer;" title="Encerrar Desafio">
              <i class="fa-solid fa-stop"></i>
            </button>
          ` : ''}
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-editar-desafio').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.id);
        const item = todosDesafiosAdmin.find(x => x.id === id);
        if (item && formDesafioWrap) {
          document.getElementById('adm-desafio-id').value = item.id;
          document.getElementById('adm-desafio-titulo').value = item.titulo || '';
          document.getElementById('adm-desafio-hashtag').value = item.hashtag || '';
          document.getElementById('adm-desafio-tema').value = item.tema || '';
          document.getElementById('adm-desafio-imagem').value = item.imagem || '';
          document.getElementById('adm-desafio-inicio').value = item.inicioEm ? item.inicioEm.slice(0, 16) : '';
          document.getElementById('adm-desafio-fim').value = item.fimEm ? item.fimEm.slice(0, 16) : '';
          document.getElementById('adm-desafio-descricao').value = item.descricao || '';
          document.getElementById('admin-form-desafio-title').innerHTML = `<i class="fa-solid fa-pen"></i> Editar Desafio: "${item.titulo}"`;
          formDesafioWrap.style.display = 'block';
          formDesafioWrap.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    tbody.querySelectorAll('.btn-encerrar-desafio').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.dataset.id);
        if (confirm('Deseja encerrar este desafio semanal antecipadamente?')) {
          try {
            await api.post(`/desafios/semanal/admin/${id}/encerrar`);
            alert('Desafio encerrado com sucesso!');
            carregarDesafiosAdmin();
          } catch (err) {
            alert('Erro ao encerrar desafio: ' + err.message);
          }
        }
      });
    });
  }

  async function carregarParticipacoesAdmin() {
    const tbody = document.getElementById('admin-participacoes-tbody');
    if (!tbody) return;
    try {
      const parts = await api.get('/desafios/semanal/admin/participacoes');
      if (!parts || parts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 25px;">Nenhuma participação registrada até o momento.</td></tr>';
        return;
      }
      tbody.innerHTML = parts.map(p => {
        const dStr = new Date(p.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        return `
          <tr>
            <td style="font-size: 0.8rem; color: rgba(242,244,243,0.6);">${dStr}</td>
            <td><strong style="color: #fff;">${p.usuarioNome}</strong><br><span style="font-size: 0.75rem; color: rgba(242,244,243,0.5);">${p.usuarioEmail}</span></td>
            <td><span style="color: var(--secondary);">${p.desafioTitulo}</span></td>
            <td><strong style="color: #fff;">${p.receitaTitulo}</strong></td>
            <td><strong style="color: var(--accent);">+${p.pontosConcedidos || 30} pts</strong></td>
            <td><span class="status-badge-active"><i class="fa-solid fa-check"></i> ${p.status || 'Concluído'}</span></td>
          </tr>
        `;
      }).join('');
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 25px; color: rgba(242,244,243,0.5);">Nenhuma participação registrada no momento.</td></tr>';
    }
  }

  /* =====================================================================
     GESTÃO ADMINISTRATIVA: EVENTOS ESPECIAIS & COMPETIÇÕES
  ===================================================================== */
  let currentAdminEventoId = 1;
  let currentAdminEventoData = null;

  const eventoSelector = document.getElementById('admin-evento-selector');
  const btnToggleFormEvento = document.getElementById('btn-toggle-form-evento');
  const formEventoWrap = document.getElementById('admin-form-evento-wrap');
  const formEvento = document.getElementById('admin-form-evento');
  const btnCancelarEvento = document.getElementById('adm-evento-cancelar');

  if (eventoSelector) {
    eventoSelector.addEventListener('change', () => {
      currentAdminEventoId = Number(eventoSelector.value);
      carregarEventoAdmin(currentAdminEventoId);
    });
  }

  if (btnToggleFormEvento && formEventoWrap) {
    btnToggleFormEvento.addEventListener('click', () => {
      if (currentAdminEventoData) {
        document.getElementById('adm-evento-id').value = currentAdminEventoData.id;
        document.getElementById('adm-evento-titulo').value = currentAdminEventoData.titulo || '';
        document.getElementById('adm-evento-hashtag').value = currentAdminEventoData.hashtag || '';
        document.getElementById('adm-evento-emblema').value = currentAdminEventoData.emblema || '';
        document.getElementById('adm-evento-moldura').value = currentAdminEventoData.molduraPerfil || '';
        document.getElementById('adm-evento-insc-ini').value = currentAdminEventoData.inscricoesIniciaEm ? currentAdminEventoData.inscricoesIniciaEm.slice(0, 16) : '';
        document.getElementById('adm-evento-insc-fim').value = currentAdminEventoData.inscricoesEncerraEm ? currentAdminEventoData.inscricoesEncerraEm.slice(0, 16) : '';
        document.getElementById('adm-evento-vot-ini').value = currentAdminEventoData.votacaoIniciaEm ? currentAdminEventoData.votacaoIniciaEm.slice(0, 16) : '';
        document.getElementById('adm-evento-vot-fim').value = currentAdminEventoData.votacaoEncerraEm ? currentAdminEventoData.votacaoEncerraEm.slice(0, 16) : '';
        document.getElementById('adm-evento-descricao').value = currentAdminEventoData.descricao || '';
        document.getElementById('admin-form-evento-title').innerHTML = `<i class="fa-solid fa-pen-nib"></i> Editar Evento: "${currentAdminEventoData.titulo}"`;
      } else {
        formEvento.reset();
        document.getElementById('adm-evento-id').value = '';
      }
      formEventoWrap.style.display = formEventoWrap.style.display === 'none' ? 'block' : 'none';
    });
  }
  if (btnCancelarEvento && formEventoWrap) {
    btnCancelarEvento.addEventListener('click', () => { formEventoWrap.style.display = 'none'; });
  }

  if (formEvento) {
    formEvento.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('adm-evento-id').value;
      const payload = {
        id: id ? Number(id) : undefined,
        titulo: document.getElementById('adm-evento-titulo').value.trim(),
        hashtag: document.getElementById('adm-evento-hashtag').value.trim(),
        emblema: document.getElementById('adm-evento-emblema').value.trim(),
        molduraPerfil: document.getElementById('adm-evento-moldura').value.trim(),
        inscricoesIniciaEm: document.getElementById('adm-evento-insc-ini').value,
        inscricoesEncerraEm: document.getElementById('adm-evento-insc-fim').value,
        votacaoIniciaEm: document.getElementById('adm-evento-vot-ini').value,
        votacaoEncerraEm: document.getElementById('adm-evento-vot-fim').value,
        descricao: document.getElementById('adm-evento-descricao').value.trim(),
        comecaEm: document.getElementById('adm-evento-insc-ini').value,
        encerraEm: document.getElementById('adm-evento-vot-fim').value
      };

      try {
        if (id) {
          await api.put(`/desafios/eventos/${id}`, payload);
        } else {
          await api.post('/desafios/eventos', payload);
        }
        alert('Evento salvo com sucesso!');
        formEventoWrap.style.display = 'none';
        carregarEventoAdmin(currentAdminEventoId);
      } catch (err) {
        alert('Erro ao salvar evento: ' + err.message);
      }
    });
  }

  async function carregarEventoAdmin(eventoId) {
    try {
      const evento = await api.get(`/desafios/eventos/${eventoId}`);
      currentAdminEventoData = evento;

      const faseEl = document.getElementById('adm-ev-fase');
      const totalInscEl = document.getElementById('adm-ev-total-inscricoes');
      const totalVotosEl = document.getElementById('adm-ev-total-votos');
      const vencedorEl = document.getElementById('adm-ev-vencedor');

      if (faseEl) faseEl.textContent = evento.fase || '--';
      if (totalInscEl) totalInscEl.textContent = evento.participantesCount || 0;
      if (totalVotosEl) totalVotosEl.textContent = evento.totalVotos || 0;
      if (vencedorEl) {
        if (evento.resultadoConfirmado && evento.vencedor) {
          vencedorEl.innerHTML = `<span style="color:#27C93F;"><i class="fa-solid fa-trophy"></i> ${evento.vencedor.autorNome}</span>`;
        } else {
          vencedorEl.textContent = evento.fase === 'ENCERRADO' ? 'Pendente Confirmação' : 'Aguardando Término';
        }
      }

      carregarEntradasModeracao(eventoId);
      carregarAuditoriaEventos();
    } catch (err) {
      console.warn('Erro ao carregar detalhes do evento:', err);
    }
  }

  async function carregarEntradasModeracao(eventoId) {
    const tbody = document.getElementById('admin-entradas-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Carregando inscrições...</td></tr>';

    try {
      const entradas = await api.get(`/desafios/eventos/${eventoId}/admin/entradas`);
      if (!entradas || entradas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 25px;">Nenhuma inscrição cadastrada para este evento.</td></tr>';
        return;
      }

      tbody.innerHTML = entradas.map(ent => {
        const dtStr = new Date(ent.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        const statusBadge = ent.status === 'APROVADA'
          ? '<span class="status-badge-active"><i class="fa-solid fa-circle-check"></i> Aprovada</span>'
          : (ent.status === 'REJEITADA'
            ? `<span class="status-badge-expired" title="${ent.motivoRejeicao || ''}"><i class="fa-solid fa-circle-xmark"></i> Rejeitada</span>`
            : '<span style="background: rgba(240,213,182,0.2); color: #F0D5B6; padding: 3px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 700;">Pendente</span>');

        return `
          <tr>
            <td>
              <div style="display: flex; align-items: center; gap: 10px;">
                ${ent.imagem ? `<img src="${ent.imagem}" style="width: 38px; height: 38px; border-radius: 6px; object-fit: cover;">` : '<div style="width:38px;height:38px;border-radius:6px;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-utensils"></i></div>'}
                <strong style="color: #fff; font-size: 0.88rem;">${ent.titulo}</strong>
              </div>
            </td>
            <td>${ent.autor?.nome || 'Chef'} <span class="plan-table-pill ${ent.autor?.plano === 'PRO' ? 'pro' : 'free'}">${ent.autor?.plano || 'FREE'}</span></td>
            <td><strong style="color: #FFD700;"><i class="fa-solid fa-check-to-slot"></i> ${ent.votos}</strong></td>
            <td>${ent.denuncias > 0 ? `<span style="color: #E0857A; font-weight: 700;"><i class="fa-solid fa-triangle-exclamation"></i> ${ent.denuncias}</span>` : '<span style="color: rgba(242,244,243,0.4);">0</span>'}</td>
            <td style="font-size: 0.8rem; color: rgba(242,244,243,0.6);">${dtStr}</td>
            <td>${statusBadge}</td>
            <td style="text-align: right;">
              <button type="button" class="btn-aprovar-entrada" data-id="${ent.id}" style="padding: 5px 9px; border-radius: 6px; background: rgba(39,201,63,0.2); border: 1px solid rgba(39,201,63,0.4); color: #27C93F; cursor: pointer; margin-right: 4px;" title="Aprovar Inscrição">
                <i class="fa-solid fa-check"></i>
              </button>
              <button type="button" class="btn-rejeitar-entrada" data-id="${ent.id}" style="padding: 5px 9px; border-radius: 6px; background: rgba(224,133,122,0.2); border: 1px solid rgba(224,133,122,0.4); color: var(--accent); cursor: pointer;" title="Rejeitar Inscrição">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </td>
          </tr>
        `;
      }).join('');

      tbody.querySelectorAll('.btn-aprovar-entrada').forEach(btn => {
        btn.addEventListener('click', async () => {
          const entradaId = Number(btn.dataset.id);
          try {
            await api.post(`/desafios/eventos/${eventoId}/entradas/${entradaId}/moderar`, { status: 'APROVADA' });
            alert('Inscrição aprovada para a galeria de votação.');
            carregarEntradasModeracao(eventoId);
          } catch (err) {
            alert('Erro ao aprovar inscrição: ' + err.message);
          }
        });
      });

      tbody.querySelectorAll('.btn-rejeitar-entrada').forEach(btn => {
        btn.addEventListener('click', async () => {
          const entradaId = Number(btn.dataset.id);
          const motivo = prompt('Informe o motivo da rejeição da receita (ex: não condiz com as regras ou foto inadequada):');
          if (motivo !== null) {
            try {
              await api.post(`/desafios/eventos/${eventoId}/entradas/${entradaId}/moderar`, { status: 'REJEITADA', motivo: motivo || 'Não atende aos critérios do concurso.' });
              alert('Inscrição rejeitada e registrada em auditoria.');
              carregarEntradasModeracao(eventoId);
            } catch (err) {
              alert('Erro ao rejeitar inscrição: ' + err.message);
            }
          }
        });
      });
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: rgba(242,244,243,0.5);">Erro ao carregar inscrições.</td></tr>';
    }
  }

  // Encerrar Votação
  const btnEncerrarVotacao = document.getElementById('btn-adm-encerrar-votacao');
  if (btnEncerrarVotacao) {
    btnEncerrarVotacao.addEventListener('click', async () => {
      if (confirm('Deseja encerrar o período de votação deste evento agora? Novos votos serão imediatamente bloqueados.')) {
        try {
          await api.post(`/desafios/eventos/${currentAdminEventoId}/encerrar-votacao`);
          alert('Votação encerrada com sucesso!');
          carregarEventoAdmin(currentAdminEventoId);
        } catch (err) {
          alert('Erro ao encerrar votação: ' + err.message);
        }
      }
    });
  }

  // Confirmar Resultado & Conceder Premiações
  const btnConfirmarResultado = document.getElementById('btn-adm-confirmar-resultado');
  if (btnConfirmarResultado) {
    btnConfirmarResultado.addEventListener('click', async () => {
      const confirmou = confirm('Deseja apurar e confirmar o resultado oficial deste evento? O sistema selecionará a receita mais votada (com desempate pela inscrição aprovada mais antiga), concederá o emblema e moldura exclusiva ao vencedor, e registrará auditoria permanente.');
      if (!confirmou) return;

      btnConfirmarResultado.disabled = true;
      try {
        const res = await api.post(`/desafios/eventos/${currentAdminEventoId}/confirmar-resultado`);
        alert(res.mensagem || 'Resultado confirmado com sucesso!');
        carregarEventoAdmin(currentAdminEventoId);
      } catch (err) {
        alert('Erro ao confirmar resultado: ' + err.message);
      } finally {
        btnConfirmarResultado.disabled = false;
      }
    });
  }

  async function carregarAuditoriaEventos() {
    const tbody = document.getElementById('admin-auditoria-eventos-tbody');
    if (!tbody) return;
    try {
      const data = await api.get('/desafios/eventos/auditoria');
      const auditoria = data?.auditoria || [];
      if (auditoria.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">Nenhum registro de auditoria.</td></tr>';
        return;
      }
      tbody.innerHTML = auditoria.slice(0, 30).map(item => {
        const dt = new Date(item.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        const detStr = typeof item.detalhes === 'object' ? JSON.stringify(item.detalhes) : (item.detalhes || '—');
        return `
          <tr>
            <td style="font-size: 0.8rem; color: rgba(242,244,243,0.6);">${dt}</td>
            <td><strong style="color: var(--secondary);">${item.acao}</strong></td>
            <td><span class="plan-table-pill free">${item.alvoTipo} #${item.alvoId || ''}</span></td>
            <td style="font-size: 0.82rem; color: rgba(242,244,243,0.85);">${detStr}</td>
          </tr>
        `;
      }).join('');
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">Nenhum registro de auditoria.</td></tr>';
    }
  }

  // Inicializa abas admin de desafios e eventos quando ativadas
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.tab === 'tab-desafios-semanais') {
        carregarDesafiosAdmin();
      } else if (btn.dataset.tab === 'tab-eventos-especiais') {
        carregarEventoAdmin(currentAdminEventoId);
      }
    });
  });

  carregarDashboardAdmin();
});
