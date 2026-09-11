document.addEventListener("DOMContentLoaded", () => {
  const user = api.getUser();
  if (!user) {
    window.location.href = "../../login/index.html";
    return;
  }

  const state = { image: null, analysis: null, recipe: null, books: [] };
  const byId = (id) => document.getElementById(id);

  function showState(id) {
    ["state-idle", "state-scanning", "state-results", "state-recipe"].forEach((stateId) => {
      const element = byId(stateId);
      if (element) element.classList.toggle("hidden", stateId !== id);
    });
  }

  function resizeImage(dataUrl, maxSize = 768) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      image.onerror = () => resolve(dataUrl);
      image.src = dataUrl;
    });
  }

  function renderAnalysis(data) {
    state.analysis = data;
    showState("state-results");
    const title = byId("detected-food-title");
    if (title) title.textContent = data.dishName || data.title || "Prato identificado";
    const list = byId("detection-results-list");
    if (!list) return;
    list.innerHTML = "";
    (data.detections || []).forEach((detection) => {
      const item = document.createElement("div");
      item.className = "detection-item";
      item.innerHTML = '<div class="detection-meta"><span class="detection-name"></span><span class="detection-percent"></span></div><div class="detection-bar-bg"><div class="detection-bar-fill"></div></div>';
      item.querySelector(".detection-name").textContent = detection.name;
      item.querySelector(".detection-percent").textContent = `${detection.percent || 0}%`;
      item.querySelector(".detection-bar-fill").style.width = `${detection.percent || 0}%`;
      list.appendChild(item);
    });
  }

  function renderRecipe(recipe) {
    state.recipe = recipe;
    showState("state-recipe");
    const title = byId("result-recipe-title");
    const time = byId("result-recipe-time");
    const servings = byId("result-recipe-servings");
    const difficulty = byId("result-recipe-difficulty");
    if (title) title.textContent = recipe.title || "Receita gerada";
    if (time) time.textContent = `${recipe.time || 0} min`;
    if (servings) servings.textContent = `${recipe.servings || 0} porções`;
    if (difficulty) difficulty.textContent = recipe.difficulty || "Não informado";

    const ingredients = byId("result-ingredients-list");
    const steps = byId("result-steps-list");
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
  }

  async function analyze() {
    if (!state.image) return;
    showState("state-scanning");
    try {
      const image = await resizeImage(state.image);
      const result = await api.post("/ia/analisar-foto", { image });
      renderAnalysis(result);
    } catch (error) {
      showState("state-idle");
      alert(`Não foi possível analisar a imagem: ${error.message}`);
    }
  }

  async function generateRecipe() {
    if (!state.analysis) return;
    showState("state-scanning");
    try {
      const recipe = await api.post("/ia/gerar-receita-foto", {
        dishName: state.analysis.title || state.analysis.dishName,
        ingredientsList: (state.analysis.detections || []).map((item) => item.name),
        diet: "none",
        servings: 2
      });
      renderRecipe(recipe);
    } catch (error) {
      showState("state-results");
      alert(`Não foi possível gerar a receita: ${error.message}`);
    }
  }

  function reset() {
    state.image = null;
    state.analysis = null;
    state.recipe = null;
    const input = byId("photo-file-input");
    const preview = byId("photo-preview-img");
    if (input) input.value = "";
    if (preview) preview.src = "";
    byId("photo-preview-container")?.classList.add("hidden");
    byId("photo-upload-zone")?.classList.remove("hidden");
    showState("state-idle");
  }

  const uploadZone = byId("photo-upload-zone");
  const input = byId("photo-file-input");
  const preview = byId("photo-preview-img");
  if (uploadZone && input) {
    uploadZone.addEventListener("click", () => input.click());
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        state.image = reader.result;
        if (preview) preview.src = state.image;
        uploadZone.classList.add("hidden");
        byId("photo-preview-container")?.classList.remove("hidden");
        analyze();
      };
      reader.readAsDataURL(file);
    });
  }

  byId("remove-photo-btn")?.addEventListener("click", reset);
  byId("btn-reset-scan")?.addEventListener("click", reset);
  byId("btn-generate-recipe")?.addEventListener("click", generateRecipe);
  byId("btn-back-to-results")?.addEventListener("click", () => showState("state-results"));

  async function loadBooks() {
    try {
      state.books = await api.get("/livros/listar");
    } catch (error) {
      state.books = [];
      console.error("Erro ao carregar livros:", error);
    }
  }

  byId("save-recipe-btn")?.addEventListener("click", async () => {
    if (!state.recipe) return;
    const container = byId("save-book-options-container");
    if (!container) return;
    container.innerHTML = "";
    state.books.forEach((book) => {
      const button = document.createElement("button");
      button.className = "save-book-option-item";
      button.textContent = `${book.titulo} — ${book._count?.receitas || 0} receitas`;
      button.addEventListener("click", async () => {
        try {
          await api.post("/receitas/cadastrar", {
            titulo: state.recipe.title,
            descricao: state.recipe.description || "",
            tempoPreparo: state.recipe.time,
            dificuldade: state.recipe.difficulty,
            modoPreparo: (state.recipe.steps || []).join("\n"),
            ingredientes: state.recipe.ingredients || [],
            categorias: state.recipe.category ? [state.recipe.category] : [],
            criadaPorIA: true,
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
    openModal("save-to-book-modal");
  });

  function openModal(id) { byId(id)?.classList.add("open"); }
  function closeModal(id) { byId(id)?.classList.remove("open"); }
  ["close-save-modal", "close-notif-modal", "close-celebration-btn"].forEach((id) => {
    byId(id)?.addEventListener("click", () => closeModal(byId(id)?.closest(".modal-overlay")?.id));
  });
  document.querySelectorAll(".modal-overlay").forEach((modal) => modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.classList.remove("open");
  }));

  loadBooks();
});
