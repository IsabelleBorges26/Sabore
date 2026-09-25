(() => {
  const page = document.querySelector('[data-legal-document]');
  if (!page) return;

  const documents = {
    terms: {
      file: 'termos-de-uso.md', title: 'Termos de Uso', accent: 'Uso', icon: 'fa-file-contract'
    },
    privacy: {
      file: 'politica-de-privacidade.md', title: 'Política de Privacidade', accent: 'Privacidade', icon: 'fa-shield-halved'
    },
    cookies: {
      file: 'politica-de-cookies.md', title: 'Política de Cookies', accent: 'Cookies', icon: 'fa-cookie-bite'
    },
    lgpd: {
      file: 'lgpd-e-protecao-de-dados.md', title: 'LGPD e Proteção de Dados', accent: 'Proteção de Dados', icon: 'fa-scale-balanced'
    }
  };

  const config = documents[page.dataset.legalDocument];
  if (!config) return;

  const escapeHtml = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const slugify = (value) => value
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const inline = (value) => {
    let text = escapeHtml(value);
    text = text.replace(/\[([^\]]+)\]\(([^\s)]+)\)/g, (_match, label, href) => {
      const safeHref = /^(https?:|mailto:)/i.test(href) ? href : '#';
      const external = /^https?:/i.test(safeHref) ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${safeHref}"${external}>${label}</a>`;
    });
    return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  };

  const cleanHeading = (heading) => heading.replace(/^\d+[.)]\s*/, '').trim();

  function parseMarkdown(markdown) {
    const sections = [];
    let current = null;
    let paragraph = [];
    let list = null;

    const ensureSection = () => {
      if (!current) {
        current = { title: 'Informações', id: 'informacoes', blocks: [] };
        sections.push(current);
      }
    };
    const flushParagraph = () => {
      if (!paragraph.length) return;
      ensureSection();
      current.blocks.push(`<p>${inline(paragraph.join(' ').replace(/\\$/g, ''))}</p>`);
      paragraph = [];
    };
    const flushList = () => {
      if (!list) return;
      ensureSection();
      current.blocks.push(`<${list.type}>${list.items.map(item => `<li>${inline(item)}</li>`).join('')}</${list.type}>`);
      list = null;
    };
    const flush = () => { flushParagraph(); flushList(); };

    markdown.replace(/^\uFEFF/, '').split(/\r?\n/).forEach((line) => {
      const value = line.trim();
      if (/^#\s+/.test(value)) return;
      if (/^##\s+/.test(value)) {
        flush();
        const title = value.replace(/^##\s+/, '');
        current = { title, id: slugify(cleanHeading(title)), blocks: [] };
        sections.push(current);
        return;
      }
      if (/^###\s+/.test(value)) {
        flush(); ensureSection();
        current.blocks.push(`<h3>${inline(value.replace(/^###\s+/, ''))}</h3>`);
        return;
      }
      if (/^---+$/.test(value)) { flush(); return; }
      const bullet = value.match(/^[-*]\s+(.+)/);
      const ordered = value.match(/^\d+[.)]\s+(.+)/);
      if (bullet || ordered) {
        flushParagraph();
        const type = ordered ? 'ol' : 'ul';
        if (!list || list.type !== type) { flushList(); list = { type, items: [] }; }
        list.items.push((bullet || ordered)[1]);
        return;
      }
      if (!value) { flush(); return; }
      paragraph.push(value);
    });
    flush();
    return sections;
  }

  function render(sections) {
    const date = '25 de setembro de 2026';
    document.title = `${config.title} — Saboré`;
    const content = sections.map((section, index) => `
      <section class="legal-section" id="${section.id}">
        <h2 class="legal-section-title"><span class="section-num">${String(index + 1).padStart(2, '0')}</span> ${inline(cleanHeading(section.title))}</h2>
        ${section.blocks.join('')}
      </section>`).join('');
    const toc = sections.map((section, index) => `<li><a href="#${section.id}">${index + 1}. ${escapeHtml(cleanHeading(section.title))}</a></li>`).join('');
    page.innerHTML = `
      <div class="legal-header">
        <div class="legal-badge"><i class="fa-solid ${config.icon}" aria-hidden="true"></i> Legal</div>
        <h1 class="legal-title">${escapeHtml(config.title.replace(config.accent, ''))}<em>${escapeHtml(config.accent)}</em></h1>
        <p class="legal-meta">Última atualização: <span>${date}</span> · Versão 1.0</p>
      </div>
      <div class="legal-grid">
        <aside class="legal-sidebar"><div class="legal-sidebar-title">Sumário</div><ul class="legal-toc">${toc}</ul></aside>
        <article class="legal-content">${content}</article>
      </div>`;

    const sectionsElements = page.querySelectorAll('.legal-section[id]');
    const tocLinks = page.querySelectorAll('.legal-toc a');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        tocLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    sectionsElements.forEach(section => observer.observe(section));
  }

  fetch(`../conteudo-legal/${config.file}`, { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error('Documento indisponível');
      return response.text();
    })
    .then((markdown) => render(parseMarkdown(markdown)))
    .catch(() => {
      page.innerHTML = '<div class="legal-header"><div class="legal-badge"><i class="fa-solid fa-triangle-exclamation"></i> Legal</div><h1 class="legal-title">Documento indisponível</h1><p class="legal-meta">Não foi possível carregar este documento agora.</p></div>';
    });
})();
