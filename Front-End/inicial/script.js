const customCursor = document.createElement('div');
customCursor.className = 'custom-cursor';
document.body.appendChild(customCursor);
document.addEventListener('mousemove', (e) => {
  customCursor.style.left = e.clientX + 'px';
  customCursor.style.top = e.clientY + 'px';
});
function updateCursorHoverListeners() {
  const interactives = document.querySelectorAll('a, button, input, select, textarea, [role="button"], .social-btn, .plan-btn, .hamburger, .mobile-close');
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
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const mobileClose = document.getElementById('mobileClose');
hamburger.addEventListener('click', () => {
  mobileMenu.classList.add('open');
  document.body.style.overflow = 'hidden';
});
mobileClose.addEventListener('click', () => {
  mobileMenu.classList.remove('open');
  document.body.style.overflow = '';
});
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  });
});
const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      const siblings = entry.target.parentElement.querySelectorAll('.reveal, .reveal-left, .reveal-right');
      let delay = 0;
      siblings.forEach((sib, idx) => {
        if (sib === entry.target) delay = idx * 80;
      });
      const existingDelay = entry.target.style.transitionDelay;
      if (!existingDelay) {
        entry.target.style.transitionDelay = delay + 'ms';
      }
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.12,
  rootMargin: '0px 0px -40px 0px'
});
revealElements.forEach(el => revealObserver.observe(el));
const faqList = document.querySelector('.faq-list');
if (faqList) {
  const faqs = [
    ['O que posso fazer com o Saboré?', 'No Saboré, você pode descobrir, criar, salvar e organizar receitas de forma simples. A plataforma permite explorar diferentes opções, personalizar receitas e encontrar inspirações para suas refeições.'],
    ['Como encontro receitas usando os ingredientes que já tenho?', 'Informe os ingredientes disponíveis e encontre receitas que utilizem esses itens, facilitando o aproveitamento dos alimentos que você já possui em casa.'],
    ['A IA consegue criar receitas para mim?', 'Sim. A IA pode criar sugestões de receitas de acordo com os ingredientes, preferências e necessidades informadas por você, oferecendo novas ideias para suas refeições.'],
    ['Posso adaptar uma receita para minhas preferências?', 'Sim. As receitas podem ser adaptadas de acordo com suas preferências, permitindo modificar ingredientes e características da receita.'],
    ['Como salvo e organizo minhas receitas favoritas?', 'Você pode salvar suas receitas favoritas para acessá-las posteriormente, mantendo suas opções preferidas organizadas e de fácil acesso.'],
    ['Posso compartilhar minhas receitas com outras pessoas?', 'Sim. O sistema permite compartilhar receitas com outras pessoas, facilitando a troca de ideias e experiências culinárias.']
  ];
  faqList.replaceChildren(...faqs.map(([question, answer]) => {
    const item = document.createElement('div');
    item.className = 'faq-item';
    const questionElement = document.createElement('div');
    questionElement.className = 'faq-question';
    questionElement.append(document.createTextNode(question));
    const icon = document.createElement('span');
    icon.className = 'faq-icon';
    icon.textContent = '+';
    questionElement.append(icon);
    const answerElement = document.createElement('div');
    answerElement.className = 'faq-answer';
    answerElement.textContent = answer;
    item.append(questionElement, answerElement);
    return item;
  }));
}

const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach(item => {
  const question = item.querySelector('.faq-question');
  question.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    faqItems.forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});
const formatPlatformCount = (value) => Number(value || 0).toLocaleString('pt-BR');
const loadPlatformStats = async () => {
  const users = document.getElementById('stat-users');
  const recipes = document.getElementById('stat-recipes');
  const rating = document.getElementById('stat-rating');
  if (!users || !recipes || !rating || typeof api === 'undefined') return;

  try {
    const data = await api.get('/estatisticas/publicas');
    users.textContent = formatPlatformCount(data.usuarios);
    recipes.textContent = formatPlatformCount(data.receitas);
    rating.innerHTML = data.avaliacaoMedia === null
      ? 'Sem avaliações'
      : `${data.avaliacaoMedia.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <i class="fa-solid fa-star" aria-label="estrelas"></i>`;
  } catch {
    users.textContent = '—';
    recipes.textContent = '—';
    rating.textContent = '—';
  }
};
loadPlatformStats();
window.setInterval(loadPlatformStats, 60000);

// A importação pública acompanha o suporte atual do produto: somente YouTube.
const importFlow = document.querySelector('.import-flow');
if (importFlow) {
  importFlow.querySelectorAll('.import-source, .import-arrow').forEach((element) => {
    if (element.classList.contains('import-source') && /youtube/i.test(element.textContent)) return;
    element.remove();
  });
  const result = importFlow.querySelector('.import-result');
  if (result) {
    const arrow = document.createElement('div');
    arrow.className = 'import-arrow';
    arrow.innerHTML = '<div class="arrow-line"><span class="arrow-dot"></span><span class="arrow-dot"></span><span class="arrow-dot"></span><span class="arrow-dot"></span><span class="arrow-dot"></span></div><span class="arrow-label">importar</span>';
    importFlow.insertBefore(arrow, result);
  }
}
document.querySelectorAll('.feature-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotateX = ((y - cy) / cy) * -6;
    const rotateY = ((x - cx) / cx) * 6;
    card.style.transform = `translateY(-6px) perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});
document.querySelectorAll('.plan-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--gx', x + '%');
    card.style.setProperty('--gy', y + '%');
    card.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(224,133,122,0.08) 0%, rgba(242,244,243,0.03) 60%)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.background = '';
  });
});
const typingDots = document.querySelector('.typing-indicator');
if (typingDots) {
  setInterval(() => {
    typingDots.style.opacity = '0';
    setTimeout(() => { typingDots.style.opacity = '1'; }, 300);
  }, 4000);
}
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      const scrolled = window.scrollY;
      const heroVisual = document.querySelector('.hero-visual');
      if (heroVisual && scrolled < window.innerHeight) {
        heroVisual.style.transform = `translateY(${scrolled * 0.08}px)`;
      }
      ticking = false;
    });
    ticking = true;
  }
});
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');
const activeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => link.style.color = '');
      const id = entry.target.getAttribute('id');
      const activeLink = document.querySelector(`.nav-links a[href="#${id}"]`);
      if (activeLink) activeLink.style.color = 'var(--light)';
    }
  });
}, { threshold: 0.5 });
sections.forEach(sec => activeObserver.observe(sec));
const cursorGlow = document.createElement('div');
cursorGlow.style.cssText = `
  position: fixed;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(224, 133, 122, 0.06) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
  transform: translate(-50%, -50%);
  transition: left 0.15s ease, top 0.15s ease;
`;
document.body.appendChild(cursorGlow);
document.addEventListener('mousemove', (e) => {
  cursorGlow.style.left = e.clientX + 'px';
  cursorGlow.style.top = e.clientY + 'px';
});
const auth = window.supabaseClient;
const navCta = document.getElementById('navCta');
const mobileSignup = document.getElementById('mobileSignup');
const mobileLogin = document.getElementById('mobileLogin');
const renderGuestNavigation = () => {
  if (navCta) {
    navCta.innerHTML = `
      <a href="../login/index.html" class="btn-nav-login">Entrar</a>
      <a href="../cadastro/index.html" class="btn-nav-signup">Criar Conta</a>
    `;
  }
  if (mobileSignup && mobileLogin) {
    mobileSignup.textContent = 'Criar Conta';
    mobileSignup.href = '../cadastro/index.html';
    mobileLogin.textContent = 'Entrar';
    mobileLogin.href = '../login/index.html';
  }
};

const signOutFromLanding = () => {
  api.clearSession();
  if (!auth) return window.location.reload();
  return auth.auth.signOut().catch(() => undefined).finally(() => window.location.reload());
};

const renderNavigation = async () => {
const localUser = await api.validateSession();
if (localUser) {
  const displayName = localUser.nome || 'Cozinheiro';
  if (navCta) {
    navCta.innerHTML = `
      <span class="user-greeting" style="font-size: 0.9rem; font-weight: 500; color: var(--light); margin-right: 15px;">Olá, ${displayName}!</span>
      <a href="../Dashboard/home/index.html" class="btn-nav-login" style="margin-right: 10px; text-decoration: none; border: 1px solid var(--accent); color: var(--accent); padding: 8px 18px; border-radius: 40px; cursor: none;">Dashboard</a>
      <button id="btnLogout" class="btn-nav-signup" style="background: transparent; border: 1px solid rgba(242,244,243,0.2); color: var(--light) !important; padding: 8px 18px; cursor: none;">Sair</button>
    `;
    document.getElementById('btnLogout').addEventListener('click', () => {
      signOutFromLanding();
    });
  }
  if (mobileSignup && mobileLogin) {
    mobileSignup.textContent = `Olá, ${displayName}!`;
    mobileSignup.href = '../Dashboard/home/index.html';
    mobileLogin.textContent = 'Sair';
    mobileLogin.href = '#';
    mobileLogin.addEventListener('click', (e) => {
      e.preventDefault();
      signOutFromLanding();
    });
  }
} else {
  renderGuestNavigation();
}
};

renderGuestNavigation();
// A landing é pública. Ao sair do dashboard para ela, a sessão não deve
// permanecer no navegador nem alterar os botões de acesso da página.
api.clearSession();

if (auth) {
  auth.auth.getSession().then(({ data }) => {
    if (data.session) auth.auth.signOut();
  });
}
