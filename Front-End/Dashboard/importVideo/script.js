document.addEventListener("DOMContentLoaded", () => {
  const user = api.getUser();
  if (!user) {
    window.location.href = "../../login/index.html";
    return;
  }

  const state = {
    books: [],
    recipe: null,
    platform: "other"
  };

  const $ = (selector) => document.querySelector(selector);
  const byId = (id) => document.getElementById(id);

  function setView(view) {
    ["state-idle", "state-converting", "state-recipe"].forEach((id) => {
      const element = byId(id);
      if (element) element.classList.toggle("hidden", id !== view);
    });
  }

  function detectPlatform(url) {
    const value = url.toLowerCase();
    if (value.includes("tiktok")) return "tiktok";
    if (value.includes("instagram") || value.includes("instagr.am")) return "instagram";
    if (value.includes("youtube") || value.includes("youtu.be")) return "youtube";
    return "other";
  }

  function renderRecipe(recipe) {
    state.recipe = recipe;
    setView("state-recipe");

    const title = byId("result-recipe-title");
    const time = byId("result-recipe-time");
    const difficulty = byId("result-recipe-difficulty");
    const ingredients = byId("result-ingredients-list");
    const steps = byId("result-steps-list");

    if (title) title.textContent = recipe.title || "Receita importada";
    if (time) time.textContent = `${recipe.time || 0} min`;
    if (difficulty) difficulty.textContent = recipe.difficulty || "Não informado";

    if (ingredients) {
      ingredients.innerHTML = "";
      (recipe.ingredients || []).forEach((ingredient) => {
        const item = document.createElement("li");
        item.textContent = ingredient;
        ingredients.appendChild(item);
      });
    }

    if (steps) {
      steps.innerHTML = "";
      (recipe.steps || []).forEach((step) => {
        const item = document.createElement("li");
        item.textContent = step;
        steps.appendChild(item);
      });
    }
  }

  async function loadBooks() {
    try {
      const books = await api.get("/livros/listar");
      state.books = books.map((book) => ({
        id: book.id,
        title: book.titulo,
        emoji: book.emoji || "fa-solid fa-book",
        count: book._count?.receitas || 0
      }));
    } catch (error) {
      state.books = [];
      console.error("Erro ao carregar livros do banco:", error);
    }
  }

  function renderBookOptions() {
    const container = byId("save-book-options-container");
    if (!container) return;
    container.innerHTML = "";

    if (state.books.length === 0) {
      container.innerHTML = "<p>Nenhum livro cadastrado para salvar esta receita.</p>";
      return;
    }

    state.books.forEach((book) => {
      const item = document.createElement("div");
      item.className = "save-book-option-item";
      item.innerHTML = `
        <div class="save-book-info">
          <div class="save-book-icon"><i class="${book.emoji}"></i></div>
          <div class="save-book-meta">
            <h4>${book.title}</h4>
            <p>${book.count} receitas</p>
          </div>
        </div>
        <button class="btn-select-save-book">Salvar</button>
      `;
      item.querySelector("button").addEventListener("click", async () => {
        try {
          await api.post("/receitas/cadastrar", {
            titulo: state.recipe.title,
            descricao: state.recipe.description || "",
            tempoPreparo: Number(state.recipe.time) || 0,
            dificuldade: state.recipe.difficulty || "Fácil",
            modoPreparo: (state.recipe.steps || []).join("\n"),
            ingredientes: state.recipe.ingredients || [],
            categorias: state.recipe.category ? [state.recipe.category] : [],
            livroId: book.id,
            publica: false
          });
          closeModal("save-to-book-modal");
          alert("Receita salva no Supabase com sucesso.");
          await loadBooks();
        } catch (error) {
          alert(`Erro ao salvar receita: ${error.message}`);
        }
      });
      container.appendChild(item);
    });
  }

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

  const form = byId("video-url-form");
  const urlInput = byId("video-url-input");
  const platformIcon = byId("platform-icon");

  if (urlInput && platformIcon) {
    urlInput.addEventListener("input", () => {
      state.platform = detectPlatform(urlInput.value);
      platformIcon.innerHTML = `<i class="fa-solid fa-link"></i>`;
    });
  }

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const url = urlInput?.value.trim();
      if (!url) return;

      setView("state-converting");
      try {
        const recipe = await api.post("/importacao/importar", { url });
        renderRecipe(recipe);
      } catch (error) {
        setView("state-idle");
        alert(error.message);
      }
    });
  }

  const saveButton = byId("save-recipe-btn");
  if (saveButton) {
    saveButton.addEventListener("click", () => {
      if (!state.recipe) return;
      renderBookOptions();
      openModal("save-to-book-modal");
    });
  }

  const clearButton = byId("btn-clear-recipe");
  if (clearButton) {
    clearButton.addEventListener("click", () => {
      state.recipe = null;
      if (urlInput) urlInput.value = "";
      setView("state-idle");
    });
  }

  ["close-save-modal", "close-notif-modal", "close-celebration-btn"].forEach((buttonId) => {
    const button = byId(buttonId);
    if (button) button.addEventListener("click", () => closeModal(button.closest(".modal-overlay")?.id));
  });

  loadBooks();
  document.querySelectorAll(".mock-link-item-btn").forEach((button) => button.remove());
});
