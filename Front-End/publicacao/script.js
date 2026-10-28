document.addEventListener('DOMContentLoaded', () => {
  const publication = document.getElementById('publication');
  const status = document.getElementById('publication-status');
  const retryButton = document.getElementById('retry-button');
  const shareButton = document.getElementById('share-button');
  const whatsappButton = document.getElementById('whatsapp-button');
  const copyButton = document.getElementById('copy-button');
  const recipeId = Number(window.location.pathname.match(/^\/publicacao\/(\d+)\/?$/)?.[1]);
  let recipe;

  if (api.hasUsableStoredSession()) {
    document.getElementById('community-link').href = '/Dashboard/explorar/index.html';
    document.getElementById('community-link').textContent = 'Explorar receitas';
    document.getElementById('explore-link').href = '/Dashboard/explorar/index.html';
  }

  function safeImage(value) {
    if (!value) return null;
    if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(value)) return value;
    try {
      const url = new URL(value, window.location.origin);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
    } catch { return null; }
  }

  function addTag(text, icon) {
    const tag = document.createElement('span');
    tag.className = 'recipe-tag';
    const symbol = document.createElement('i');
    symbol.className = `fa-solid ${icon}`;
    symbol.setAttribute('aria-hidden', 'true');
    tag.append(symbol, document.createTextNode(text));
    document.getElementById('recipe-tags').appendChild(tag);
  }

  function renderList(id, values, emptyId) {
    const list = document.getElementById(id);
    list.replaceChildren();
    values.forEach(value => {
      const item = document.createElement('li');
      item.textContent = value;
      list.appendChild(item);
    });
    document.getElementById(emptyId).hidden = values.length > 0;
  }

  async function loadRecipe() {
    retryButton.hidden = true;
    status.hidden = false;
    publication.hidden = true;
    document.getElementById('status-title').textContent = 'Preparando sua receita…';
    document.getElementById('status-description').textContent = 'Carregando esta publicação da comunidade.';
    try {
      if (!Number.isSafeInteger(recipeId) || recipeId <= 0) throw new Error('not-found');
      // A publicação é pública, inclusive quando existe uma sessão expirada no navegador.
      const response = await fetch(`${API_BASE_URL}/receitas/publicas/${recipeId}`, { cache: 'no-store' });
      if (response.status === 404) throw new Error('not-found');
      if (!response.ok) throw new Error('load-failed');
      recipe = await response.json();
      document.title = `${recipe.title} — Saboré`;
      document.getElementById('recipe-title').textContent = recipe.title;
      document.getElementById('recipe-description').textContent = recipe.description || '';
      document.getElementById('author-name').textContent = recipe.author || 'Chef Saboré';
      const avatar = document.getElementById('author-avatar');
      const initial = (recipe.author || 'S').trim().charAt(0).toUpperCase();
      avatar.textContent = initial;
      const avatarUrl = safeImage(recipe.authorAvatar);
      if (avatarUrl) {
        const image = document.createElement('img');
        image.src = avatarUrl;
        image.alt = '';
        image.addEventListener('error', () => { avatar.textContent = initial; }, { once: true });
        avatar.replaceChildren(image);
      }
      const date = new Date(recipe.publishedAt);
      const dateElement = document.getElementById('publication-date');
      dateElement.hidden = !recipe.publishedAt || Number.isNaN(date.getTime());
      if (!dateElement.hidden) {
        dateElement.dateTime = date.toISOString();
        dateElement.textContent = `Publicado em ${date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
      }
      document.getElementById('recipe-tags').replaceChildren();
      if (recipe.time > 0) addTag(`${recipe.time} min`, 'fa-clock');
      if (recipe.difficulty) addTag(recipe.difficulty, 'fa-gauge-simple');
      (recipe.categories || []).forEach(category => addTag(category, 'fa-tag'));
      if (recipe.criadaPorIA) addTag('Criada com IA', 'fa-wand-magic-sparkles');
      const cover = document.getElementById('recipe-image');
      const coverUrl = safeImage(recipe.image);
      cover.hidden = !coverUrl;
      cover.onerror = () => { cover.hidden = true; };
      if (coverUrl) {
        cover.alt = recipe.title;
        cover.src = coverUrl;
      }
      renderList('ingredients-list', recipe.ingredients || [], 'ingredients-empty');
      renderList('steps-list', api.normalizeRecipeSteps(recipe.steps), 'steps-empty');
      status.hidden = true;
      publication.hidden = false;
    } catch (error) {
      const missing = error.message === 'not-found';
      document.title = missing ? 'Publicação indisponível — Saboré' : 'Publicação — Saboré';
      document.getElementById('status-title').textContent = missing ? 'Esta publicação não está disponível' : 'Não foi possível carregar a receita';
      document.getElementById('status-description').textContent = missing
        ? 'O link pode estar incorreto, ou o autor removeu a receita ou a tornou privada.'
        : 'Confira sua conexão e tente novamente em instantes.';
      retryButton.hidden = missing;
    }
  }

  async function share(options = {}) {
    if (!recipe) return;
    shareButton.disabled = true;
    whatsappButton.disabled = true;
    copyButton.disabled = true;
    try { await window.SaboreShareRecipe(recipe, options); }
    finally {
      shareButton.disabled = false;
      whatsappButton.disabled = false;
      copyButton.disabled = false;
    }
  }
  shareButton.addEventListener('click', () => share());
  whatsappButton.addEventListener('click', () => share({ platform: 'whatsapp' }));
  copyButton.addEventListener('click', () => share({ copyOnly: true }));
  retryButton.addEventListener('click', loadRecipe);
  loadRecipe();
});
