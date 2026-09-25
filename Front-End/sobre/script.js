// Custom Cursor
const cursor = document.getElementById('cursor');
if (cursor) {
  document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });
  document.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });
}

// Navbar scroll
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });
}

// Hamburger
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const mobileClose = document.getElementById('mobileClose');
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => mobileMenu.classList.add('open'));
  mobileClose?.addEventListener('click', () => mobileMenu.classList.remove('open'));
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => mobileMenu.classList.remove('open'));
  });
}

// Reveal on scroll
const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
revealEls.forEach(el => revealObserver.observe(el));
const loadAboutStats = async () => {
  const users = document.getElementById('about-stat-users');
  const recipes = document.getElementById('about-stat-recipes');
  const rating = document.getElementById('about-stat-rating');
  if (!users || !recipes || !rating || typeof api === 'undefined') return;
  try {
    const data = await api.get('/estatisticas/publicas');
    users.textContent = Number(data.usuarios || 0).toLocaleString('pt-BR');
    recipes.textContent = Number(data.receitas || 0).toLocaleString('pt-BR');
    rating.innerHTML = data.avaliacaoMedia === null
      ? 'Sem avaliações'
      : `${data.avaliacaoMedia.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <i class="fa-solid fa-star" aria-label="estrelas"></i>`;
  } catch {
    users.textContent = recipes.textContent = rating.textContent = '—';
  }
};
loadAboutStats();
window.setInterval(loadAboutStats, 60000);
