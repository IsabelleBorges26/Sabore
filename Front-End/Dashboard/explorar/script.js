document.addEventListener("DOMContentLoaded", () => {
  const user = api.getUser();
  if (!user) {
    window.location.href = "../../login/index.html";
    return;
  }

  const state = {
    recipes: [],
    favorites: new Set(),
    books: [],
    users: [],
    selectedRecipe: null,
    category: "all",
    search: ""
  };

  const byId = (id) => document.getElementById(id);
  const searchInput = byId("global-search");
  const recipesContainer = byId("explore-recipes-container");
  const categoriesContainer = byId("categories-carousel-list");
  const chefsContainer = byId("chefs-spotlight-container");
  const tagsContainer = byId("popular-tags-cloud");

  function openModal(id) {
    const modal = byId(id);
    if (modal) modal.classList.add("open");
  }

  function closeModal(id) {
    const modal = byId(id);
    if (modal) modal.classList.remove("open");
  }

  document.querySelectorAll(".modal-overlay").forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) modal.classList.remove("open");
    });
  });

  function updateUserHeader(profile) {
    const name = byId("navbar-plan-tag")?.closest(".user-meta")?.querySelector(".user-name") || document.querySelector(".user-name");
    if (name) name.textContent = profile.nome || user.nome;
    const avatar = document.querySelector(".user-avatar");
    if (avatar && profile.foto) avatar.src = profile.foto;
  }

  function renderCategories() {
    if (!categoriesContainer) return;
    const names = [...new Set(state.recipes.flatMap((recipe) => recipe.categories || [recipe.category]).filter(Boolean))];
    categoriesContainer.innerHTML = "";
    const categories = [{ id: "all", name: "Todas" }, ...names.map((name) => ({ id: name, name }))];
    categories.forEach((category) => {
      const button = document.createElement("button");
      button.className = "category-tile";
      button.textContent = category.name;
      if (state.category === category.id) button.classList.add("active");
      button.addEventListener("click", () => {
        state.category = category.id;
        renderCategories();
        renderRecipes();
      });
      categoriesContainer.appendChild(button);
    });
  }

  function renderTags() {
    if (!tagsContainer) return;
    const tags = [...new Set(state.recipes.flatMap((recipe) => recipe.categories || []).filter(Boolean))];
    tagsContainer.innerHTML = "";
    tags.forEach((tag) => {
      const button = document.createElement("button");
      button.className = "tag-item-chip";
      button.textContent = `#${tag.toLowerCase()}`;
      button.addEventListener("click", () => {
        state.search = tag.toLowerCase();
        if (searchInput) searchInput.value = tag;
        renderRecipes();
      });
      tagsContainer.appendChild(button);
    });
  }

  function filteredRecipes() {
    return state.recipes.filter((recipe) => {
      const haystack = [recipe.title, recipe.author, recipe.category, ...(recipe.categories || [])].join(" ").toLowerCase();
      const matchesSearch = !state.search || haystack.includes(state.search);
      const categories = recipe.categories || [recipe.category];
      const matchesCategory = state.category === "all" || categories.includes(state.category);
      return matchesSearch && matchesCategory;
    });
  }

  function renderRecipes() {
    if (!recipesContainer) return;
    const recipes = filteredRecipes();
    recipesContainer.innerHTML = "";
    if (recipes.length === 0) {
      recipesContainer.innerHTML = '<div class="book-detail-empty" style="grid-column:1/-1;padding:60px 20px;text-align:center"><h3>Nenhuma receita pública encontrada</h3><p>As receitas públicas cadastradas aparecerão aqui.</p></div>';
      return;
    }

    recipes.forEach((recipe) => {
      const card = document.createElement("article");
      card.className = "explore-recipe-card";
      const image = recipe.image || "../../assets/LOGO SABORÉ.png";
      const isFavorite = state.favorites.has(recipe.id);
      card.innerHTML = `
        <div class="explore-image-wrap">
          <img src="${image}" alt="${recipe.title || "Receita"}" class="explore-img">
          <button class="favorite-toggle-btn ${isFavorite ? "active" : ""}" aria-label="Favoritar"><i class="fa-solid fa-heart"></i></button>
        </div>
        <div class="explore-content-area">
          <div class="recipe-author-line"><span class="author-name"></span></div>
          <h4 class="recipe-title"></h4>
          <div class="explore-meta-bottom"><span class="recipe-time"></span><span class="recipe-difficulty"></span></div>
        </div>
      `;
      card.querySelector(".author-name").textContent = recipe.author || "Usuário";
      card.querySelector(".recipe-title").textContent = recipe.title;
      card.querySelector(".recipe-time").textContent = `${recipe.time || 0} min`;
      card.querySelector(".recipe-difficulty").textContent = recipe.difficulty || "Não informado";
      card.querySelector(".favorite-toggle-btn").addEventListener("click", async (event) => {
        event.stopPropagation();
        try {
          if (state.favorites.has(recipe.id)) {
            await api.delete(`/favoritos/excluir/${recipe.id}`);
            state.favorites.delete(recipe.id);
          } else {
            await api.post("/favoritos/cadastrar", { receitaId: recipe.id });
            state.favorites.add(recipe.id);
          }
          renderRecipes();
        } catch (error) {
          alert(`Erro ao atualizar favorito: ${error.message}`);
        }
      });
      card.addEventListener("click", () => openRecipe(recipe));
      recipesContainer.appendChild(card);
    });
  }

  function renderChefs() {
    if (!chefsContainer) return;
    const counts = state.recipes.reduce((map, recipe) => {
      if (recipe.author) map[recipe.author] = (map[recipe.author] || 0) + 1;
      return map;
    }, {});
    chefsContainer.innerHTML = "";
    state.users.filter((item) => item.id !== user.id).forEach((item) => {
      const card = document.createElement("div");
      card.className = "chef-card-item";
      const avatar = item.foto
        ? `<img src="${item.foto}" alt="${item.nome}" class="chef-avatar-large">`
        : `<div class="chef-avatar-large chef-avatar-placeholder">${(item.nome || "U").charAt(0).toUpperCase()}</div>`;
      card.innerHTML = `${avatar}<h4></h4><p></p>`;
      card.querySelector("h4").textContent = item.nome;
      card.querySelector("p").textContent = `${counts[item.nome] || 0} receita(s) pública(s)`;
      chefsContainer.appendChild(card);
    });
    if (state.users.length <= 1) {
      chefsContainer.innerHTML = '<p class="book-detail-empty">Nenhum outro usuário cadastrado.</p>';
    }
  }

  function openRecipe(recipe) {
    state.selectedRecipe = recipe;
    const mapping = {
      "recipe-detail-title": recipe.title,
      "recipe-detail-time": `${recipe.time || 0} min`,
      "recipe-detail-difficulty": recipe.difficulty || "Não informado",
      "recipe-detail-author-name": `Por ${recipe.author || "Usuário"}`
    };
    Object.entries(mapping).forEach(([id, value]) => {
      const element = byId(id);
      if (element) element.textContent = value;
    });
    const ingredients = byId("recipe-detail-ingredients-list");
    const steps = byId("recipe-detail-steps-list");
    if (ingredients) {
      ingredients.innerHTML = "";
      (recipe.ingredients || []).forEach((value) => {
        const item = document.createElement("li");
        item.textContent = value;
        ingredients.appendChild(item);
      });
    }
    if (steps) {
      steps.innerHTML = "";
      (recipe.steps || []).forEach((value) => {
        const item = document.createElement("li");
        item.textContent = value;
        steps.appendChild(item);
      });
    }
    openModal("recipe-details-modal");
  }

  async function renderBookOptions() {
    const container = byId("save-book-options-container");
    if (!container || !state.selectedRecipe) return;
    container.innerHTML = "";
    state.books.forEach((book) => {
      const button = document.createElement("button");
      button.className = "save-book-option-item";
      button.textContent = `${book.titulo} — ${book._count?.receitas || 0} receitas`;
      button.addEventListener("click", async () => {
        try {
          await api.post("/receitas/cadastrar", {
            titulo: state.selectedRecipe.title,
            descricao: state.selectedRecipe.description || "",
            tempoPreparo: state.selectedRecipe.time,
            dificuldade: state.selectedRecipe.difficulty,
            modoPreparo: (state.selectedRecipe.steps || []).join("\n"),
            ingredientes: state.selectedRecipe.ingredients || [],
            categorias: state.selectedRecipe.categories || [state.selectedRecipe.category],
            livroId: book.id,
            publica: false
          });
          closeModal("save-to-book-modal");
          alert("Receita salva no Supabase.");
        } catch (error) {
          alert(`Erro ao salvar receita: ${error.message}`);
        }
      });
      container.appendChild(button);
    });
  }

  byId("recipe-detail-save-btn")?.addEventListener("click", async () => {
    closeModal("recipe-details-modal");
    await renderBookOptions();
    openModal("save-to-book-modal");
  });
  ["close-details-modal", "recipe-detail-close-btn", "close-save-modal", "close-notif-modal", "close-celebration-btn"].forEach((id) => {
    byId(id)?.addEventListener("click", () => closeModal(byId(id)?.closest(".modal-overlay")?.id));
  });

  document.querySelectorAll(".feed-filter-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.search = button.dataset.feed === "all" ? "" : (button.dataset.feed || "").toLowerCase();
      renderRecipes();
    });
  });
  searchInput?.addEventListener("input", () => {
    state.search = searchInput.value.toLowerCase().trim();
    renderRecipes();
  });

  async function loadData() {
    try {
      const [profile, books, favorites, publicRecipes, users] = await Promise.all([
        api.get("/usuarios/perfil"),
        api.get("/livros/listar"),
        api.get("/favoritos/listar"),
        api.get("/receitas/publicas"),
        api.get("/usuarios/listar")
      ]);
      updateUserHeader(profile);
      state.books = books;
      state.favorites = new Set(favorites.map((recipe) => recipe.id));
      state.recipes = publicRecipes;
      state.users = users;
      renderCategories();
      renderTags();
      renderRecipes();
      renderChefs();
    } catch (error) {
      console.error("Erro ao carregar dados do Supabase:", error);
      if (recipesContainer) recipesContainer.innerHTML = `<div class="book-detail-empty" style="grid-column:1/-1;padding:60px 20px;text-align:center"><h3>Não foi possível carregar as receitas</h3><p>${error.message}</p></div>`;
    }
  }

  loadData();
});
