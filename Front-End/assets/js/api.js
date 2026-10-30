const SABORE_THEMES = {
    obsidian: {
        '--dark': '#1B2B27',
        '--dark-deep': '#121F1C',
        '--accent': '#E0857A',
        '--accent-light': 'rgba(224, 133, 122, 0.15)',
        '--secondary': '#F0D5B6',
        '--secondary-light': 'rgba(240, 213, 182, 0.15)'
    },
    emerald: {
        '--dark': '#15362C',
        '--dark-deep': '#0A1C16',
        '--accent': '#6AE0A6',
        '--accent-light': 'rgba(106, 224, 166, 0.15)',
        '--secondary': '#C4F0D7',
        '--secondary-light': 'rgba(196, 240, 215, 0.15)'
    },
    rosegold: {
        '--dark': '#3D2229',
        '--dark-deep': '#241015',
        '--accent': '#E07AA4',
        '--accent-light': 'rgba(224, 122, 164, 0.15)',
        '--secondary': '#F0B6CD',
        '--secondary-light': 'rgba(240, 182, 205, 0.15)'
    }
};

function applySaboreTheme(themeName) {
    const theme = SABORE_THEMES[themeName] || SABORE_THEMES.obsidian;
    Object.keys(theme).forEach((prop) => {
        document.documentElement.style.setProperty(prop, theme[prop]);
    });
    document.documentElement.setAttribute('data-theme', themeName || 'obsidian');
}

function applySaboreNeonGlow(enabled) {
    const isEnabled = enabled !== false && enabled !== 'false';
    let styleEl = document.getElementById('sabore-neon-glow-style');
    if (!isEnabled) {
        document.documentElement.classList.add('no-neon-glow');
        if (document.body) document.body.classList.add('no-neon-glow');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'sabore-neon-glow-style';
            styleEl.textContent = `
                .no-neon-glow [class*="-glow"],
                .no-neon-glow [class*="glow-"],
                .no-neon-glow .glow,
                .no-neon-glow .fireworks-canvas,
                .no-neon-glow .food-bowl-container::before {
                    display: none !important;
                    opacity: 0 !important;
                    filter: none !important;
                    box-shadow: none !important;
                    animation: none !important;
                }
                .no-neon-glow * {
                    text-shadow: none !important;
                }
                .no-neon-glow .custom-cursor.hover {
                    filter: none !important;
                }
                .no-neon-glow .feature-card:hover,
                .no-neon-glow .btn-primary:hover,
                .no-neon-glow .btn-submit:hover,
                .no-neon-glow .plan-btn-filled:hover {
                    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25) !important;
                }
            `;
            (document.head || document.documentElement).appendChild(styleEl);
        }
    } else {
        document.documentElement.classList.remove('no-neon-glow');
        if (document.body) document.body.classList.remove('no-neon-glow');
        if (styleEl) {
            styleEl.remove();
        }
    }
}

function initSaboreTheme() {
    const savedTheme = localStorage.getItem('sabore_theme') || 'obsidian';
    const savedGlow = localStorage.getItem('sabore_neon_glow');
    applySaboreTheme(savedTheme);
    applySaboreNeonGlow(savedGlow !== 'false');
}

initSaboreTheme();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSaboreTheme);
}

window.addEventListener('storage', (e) => {
    if (e.key === 'sabore_theme') {
        applySaboreTheme(e.newValue);
    } else if (e.key === 'sabore_neon_glow') {
        applySaboreNeonGlow(e.newValue !== 'false');
    }
});

window.SABORE_THEMES = SABORE_THEMES;
window.applySaboreTheme = applySaboreTheme;
window.applySaboreNeonGlow = applySaboreNeonGlow;
window.initSaboreTheme = initSaboreTheme;

// URL base da API do Back-End. Localmente aponta para localhost:3000.
// Na Vercel (mesmo domínio), usa automaticamente window.location.origin.
const API_BASE_URL = window.API_BASE_URL || (
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? (window.location.port === "3000" ? window.location.origin : "http://localhost:3000")
        : window.location.origin
);
const api = {
    getToken: () => localStorage.getItem("sabore_token"),
    setToken: (token) => localStorage.setItem("sabore_token", token),
    clearToken: () => localStorage.removeItem("sabore_token"),
    getUser: () => {
        const user = localStorage.getItem("sabore_user");
        try {
            return user ? JSON.parse(user) : null;
        } catch {
            return null;
        }
    },
    setUser: (user) => localStorage.setItem("sabore_user", JSON.stringify(user)),
    clearUser: () => localStorage.removeItem("sabore_user"),
    clearSession: () => {
        localStorage.removeItem("sabore_token");
        localStorage.removeItem("sabore_user");
        Object.keys(localStorage)
            .filter((key) => key.startsWith("sb-") && key.endsWith("-auth-token"))
            .forEach((key) => localStorage.removeItem(key));
    },
    hasUsableStoredSession: () => {
        const token = api.getToken();
        const user = api.getUser();
        if (!token || !user) return false;
        try {
            const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
            return !payload.exp || payload.exp * 1000 > Date.now();
        } catch {
            return false;
        }
    },
    validateSession: async () => {
        if (!api.hasUsableStoredSession()) {
            api.clearSession();
            return null;
        }
        try {
            const profile = await api.get("/usuarios/perfil");
            const user = { ...api.getUser(), ...profile };
            api.setUser(user);
            return user;
        } catch {
            api.clearSession();
            return null;
        }
    },
    request: async (endpoint, options = {}) => {
        const url = `${API_BASE_URL}${endpoint}`;
        options.headers = options.headers || {};
        options.headers["Content-Type"] = "application/json";
        const token = api.getToken();
        if (token) {
            options.headers["Authorization"] = `Bearer ${token}`;
        }
        try {
            const response = await fetch(url, options);
            if (response.status === 401) {
                api.clearSession();
                const currentPath = window.location.pathname;
                if (!currentPath.includes("/login/") && !currentPath.includes("/cadastro/") && !currentPath.endsWith("inicial/index.html") && !currentPath.endsWith("inicial/") && !currentPath.endsWith("Front-End/")) {
                    if (currentPath.includes("/Dashboard/")) {
                        window.location.href = "../../login/index.html";
                    } else {
                        window.location.href = "../login/index.html";
                    }
                }
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.erro || "Não autorizado.");
            }
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                const errMsg = errData.detalhe ? `${errData.erro} Detalhe: ${errData.detalhe}` : (errData.erro || `Erro na requisição: ${response.statusText}`);
                throw new Error(errMsg);
            }
            return await response.json();
        } catch (error) {
            // Erros de rede não chegam ao back-end e o navegador os descreve apenas
            // como “Failed to fetch”, o que não explica ao usuário o que fazer.
            if (error instanceof TypeError && /failed to fetch|networkerror|load failed/i.test(error.message || "")) {
                throw new Error("Não foi possível conectar ao servidor do Saboré. Abra o arquivo Back-End/iniciar_sabore.bat e mantenha a janela dele aberta enquanto usa o aplicativo.");
            }
            throw error;
        }
    },
    get: (endpoint) => api.request(endpoint, { method: "GET" }),
    post: (endpoint, body) => api.request(endpoint, { method: "POST", body: JSON.stringify(body) }),
    put: (endpoint, body) => api.request(endpoint, { method: "PUT", body: JSON.stringify(body) }),
    delete: (endpoint) => api.request(endpoint, { method: "DELETE" })
};

api.publicationUrl = (recipeId) => `${API_BASE_URL}/publicacao/${encodeURIComponent(recipeId)}`;

window.SaboreShareRecipe = async (recipe = {}, options = {}) => {
    if (!recipe.id) {
        window.SaboreNotify?.("Não foi possível identificar esta receita.", "error");
        return false;
    }

    const url = api.publicationUrl(recipe.id);
    const title = recipe.title || recipe.titulo || "Receita no Saboré";
    const author = recipe.author || recipe.usuario?.nome;
    const text = author
        ? `Veja a receita ${title}, publicada por ${author} no Saboré.`
        : `Veja a receita ${title} no Saboré.`;

    try {
        if (options.platform === "whatsapp") {
            const message = encodeURIComponent(`${text}\n${url}`);
            window.open(`https://wa.me/?text=${message}`, "_blank", "noopener,noreferrer");
            return true;
        }
        if (!options.copyOnly && navigator.share) {
            await navigator.share({ title, text, url });
            return true;
        }
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(url);
        } else {
            const input = document.createElement("textarea");
            input.value = url;
            input.setAttribute("readonly", "");
            input.style.position = "fixed";
            input.style.opacity = "0";
            document.body.appendChild(input);
            input.select();
            const copied = document.execCommand("copy");
            input.remove();
            if (!copied) throw new Error("copy_failed");
        }
        window.SaboreNotify?.("Link da publicação copiado.", "success");
        return true;
    } catch (error) {
        if (error?.name !== "AbortError") {
            window.SaboreNotify?.("Não foi possível compartilhar esta publicação.", "error");
        }
        return false;
    }
};

api.openUserProfile = async (userId) => {
    const id = Number(userId);
    if (!Number.isSafeInteger(id) || id <= 0) return;

    if (!document.getElementById("sabore-profile-modal-style")) {
        const style = document.createElement("style");
        style.id = "sabore-profile-modal-style";
        style.textContent = `
            .sabore-profile-overlay { position: fixed; inset: 0; z-index: 2000000; display: none; place-items: center; padding: 20px; background: rgba(5, 14, 12, .78); backdrop-filter: blur(9px); }
            .sabore-profile-overlay.open { display: grid; }
            .sabore-profile-card { position: relative; width: min(680px, 100%); max-height: min(760px, calc(100vh - 40px)); overflow-y: auto; padding: 28px; border: 1px solid var(--glass-border, rgba(242,244,243,.1)); border-radius: 24px; background: var(--dark-deep, #121f1c); color: var(--light, #f2f4f3); box-shadow: 0 28px 80px rgba(0,0,0,.5); }
            .sabore-profile-close { position: absolute; top: 16px; right: 16px; width: 36px; height: 36px; border: 1px solid var(--glass-border, rgba(242,244,243,.1)); border-radius: 50%; background: rgba(242,244,243,.05); color: inherit; font-size: 1.1rem; }
            .sabore-profile-loading, .sabore-profile-error, .sabore-profile-empty { padding: 50px 16px; text-align: center; color: rgba(242,244,243,.58); }
            .sabore-profile-head { display: grid; grid-template-columns: 76px 1fr auto; gap: 18px; align-items: center; padding-right: 34px; }
            .sabore-profile-avatar { width: 76px; height: 76px; display: grid; place-items: center; overflow: hidden; border-radius: 50%; background: var(--accent-light, rgba(224,133,122,.15)); color: var(--accent, #e0857a); font-size: 1.8rem; font-weight: 800; }
            .sabore-profile-avatar img { width: 100%; height: 100%; object-fit: cover; }
            .sabore-profile-name { margin: 0 0 5px; font-family: 'Playfair Display', serif; font-size: 1.55rem; }
            .sabore-profile-member { margin: 0; color: rgba(242,244,243,.52); font-size: .8rem; }
            .sabore-profile-follow { min-width: 112px; padding: 10px 15px; border: 1px solid var(--accent, #e0857a); border-radius: 999px; background: var(--accent, #e0857a); color: var(--dark-deep, #121f1c); font: inherit; font-size: .8rem; font-weight: 800; }
            .sabore-profile-follow.following { background: transparent; color: var(--accent, #e0857a); }
            .sabore-profile-stats { display: grid; grid-template-columns: repeat(3, 1fr); margin: 24px 0 28px; padding: 16px 0; border-block: 1px solid var(--glass-border, rgba(242,244,243,.1)); text-align: center; }
            .sabore-profile-stat strong, .sabore-profile-stat span { display: block; }
            .sabore-profile-stat strong { font-size: 1.08rem; }
            .sabore-profile-stat span { margin-top: 3px; color: rgba(242,244,243,.5); font-size: .68rem; text-transform: uppercase; }
            .sabore-profile-publications h3 { margin: 0 0 15px; font-size: 1rem; }
            .sabore-profile-recipes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
            .sabore-profile-recipe { display: grid; grid-template-columns: 70px 1fr; min-width: 0; overflow: hidden; border: 1px solid var(--glass-border, rgba(242,244,243,.1)); border-radius: 14px; background: rgba(242,244,243,.035); color: inherit; text-align: left; font: inherit; }
            .sabore-profile-recipe-media { width: 70px; height: 76px; display: grid; place-items: center; overflow: hidden; background: var(--accent-light, rgba(224,133,122,.15)); color: var(--accent, #e0857a); }
            .sabore-profile-recipe-media img { width: 100%; height: 100%; object-fit: cover; }
            .sabore-profile-recipe-info { min-width: 0; padding: 11px; }
            .sabore-profile-recipe-info strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .82rem; }
            .sabore-profile-recipe-info span { display: block; margin-top: 5px; color: rgba(242,244,243,.5); font-size: .68rem; }
            @media (max-width: 620px) { .sabore-profile-card { padding: 22px 18px; } .sabore-profile-head { grid-template-columns: 62px 1fr; } .sabore-profile-avatar { width: 62px; height: 62px; } .sabore-profile-follow { grid-column: 1 / -1; width: 100%; } .sabore-profile-recipes { grid-template-columns: 1fr; } }
        `;
        document.head.appendChild(style);
    }

    let overlay = document.getElementById("sabore-profile-overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "sabore-profile-overlay";
        overlay.className = "sabore-profile-overlay";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-label", "Perfil do usuário");
        overlay.innerHTML = '<div class="sabore-profile-card"><button class="sabore-profile-close" type="button" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button><div class="sabore-profile-body"></div></div>';
        document.body.appendChild(overlay);
        const close = () => overlay.classList.remove("open");
        overlay.querySelector(".sabore-profile-close").addEventListener("click", close);
        overlay.addEventListener("click", (event) => { if (event.target === overlay) close(); });
        document.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); });
    }

    const body = overlay.querySelector(".sabore-profile-body");
    overlay.dataset.userId = String(id);
    overlay.classList.add("open");
    body.innerHTML = '<div class="sabore-profile-loading"><i class="fa-solid fa-spinner fa-spin"></i><p>Carregando perfil…</p></div>';

    try {
        const profile = await api.get(`/social/perfis/${id}`);
        if (overlay.dataset.userId !== String(id)) return;
        body.replaceChildren();

        const head = document.createElement("div");
        head.className = "sabore-profile-head";
        const avatar = document.createElement("div");
        avatar.className = "sabore-profile-avatar";
        avatar.textContent = (profile.nome || "S").charAt(0).toUpperCase();
        if (profile.foto) {
            const image = document.createElement("img");
            image.src = profile.foto;
            image.alt = `Foto de ${profile.nome}`;
            image.addEventListener("error", () => { avatar.textContent = (profile.nome || "S").charAt(0).toUpperCase(); }, { once: true });
            avatar.replaceChildren(image);
        }
        const identity = document.createElement("div");
        const name = document.createElement("h2");
        name.className = "sabore-profile-name";
        name.textContent = profile.nome;
        const member = document.createElement("p");
        member.className = "sabore-profile-member";
        member.textContent = "Membro da comunidade Saboré";
        identity.append(name, member);
        head.append(avatar, identity);

        if (!profile.proprioPerfil) {
            const follow = document.createElement("button");
            follow.type = "button";
            follow.className = `sabore-profile-follow${profile.seguindoVoce ? " following" : ""}`;
            const updateFollow = () => {
                follow.textContent = profile.seguindoVoce ? "Seguindo" : "Seguir";
                follow.classList.toggle("following", profile.seguindoVoce);
            };
            updateFollow();
            follow.addEventListener("click", async () => {
                follow.disabled = true;
                try {
                    const next = !profile.seguindoVoce;
                    await (next ? api.post(`/social/seguir/${profile.id}`, {}) : api.delete(`/social/seguir/${profile.id}`));
                    profile.seguindoVoce = next;
                    profile.seguidores = Math.max(0, profile.seguidores + (next ? 1 : -1));
                    updateFollow();
                    body.querySelector('[data-stat="followers"] strong').textContent = profile.seguidores;
                    window.dispatchEvent(new CustomEvent("sabore:follow-changed", { detail: { userId: profile.id, following: next } }));
                } catch (error) {
                    window.SaboreNotify?.(error.message, "error");
                } finally {
                    follow.disabled = false;
                }
            });
            head.appendChild(follow);
        }
        body.appendChild(head);

        const stats = document.createElement("div");
        stats.className = "sabore-profile-stats";
        [["followers", profile.seguidores, "Seguidores"], ["following", profile.seguindo, "Seguindo"], ["recipes", profile.receitasPublicas, "Publicações"]].forEach(([key, value, label]) => {
            const stat = document.createElement("div");
            stat.className = "sabore-profile-stat";
            stat.dataset.stat = key;
            const number = document.createElement("strong");
            number.textContent = value;
            const caption = document.createElement("span");
            caption.textContent = label;
            stat.append(number, caption);
            stats.appendChild(stat);
        });
        body.appendChild(stats);

        const publications = document.createElement("section");
        publications.className = "sabore-profile-publications";
        const heading = document.createElement("h3");
        heading.textContent = "Publicações";
        publications.appendChild(heading);
        const recipes = document.createElement("div");
        recipes.className = "sabore-profile-recipes";
        if (!profile.receitas.length) {
            const empty = document.createElement("div");
            empty.className = "sabore-profile-empty";
            empty.textContent = "Este usuário ainda não publicou receitas.";
            recipes.appendChild(empty);
        } else {
            profile.receitas.forEach((recipe) => {
                const card = document.createElement("button");
                card.type = "button";
                card.className = "sabore-profile-recipe";
                const media = document.createElement("span");
                media.className = "sabore-profile-recipe-media";
                media.innerHTML = '<i class="fa-solid fa-utensils"></i>';
                if (recipe.image) {
                    const image = document.createElement("img");
                    image.src = recipe.image;
                    image.alt = "";
                    image.addEventListener("error", () => image.remove(), { once: true });
                    media.appendChild(image);
                }
                const info = document.createElement("span");
                info.className = "sabore-profile-recipe-info";
                const title = document.createElement("strong");
                title.textContent = recipe.title;
                const meta = document.createElement("span");
                meta.textContent = `${recipe.time} min · ${recipe.category}`;
                info.append(title, meta);
                card.append(media, info);
                card.addEventListener("click", () => { window.location.href = api.publicationUrl(recipe.id); });
                recipes.appendChild(card);
            });
        }
        publications.appendChild(recipes);
        body.appendChild(publications);
    } catch (error) {
        body.innerHTML = '<div class="sabore-profile-error"><i class="fa-solid fa-circle-exclamation"></i><p>Não foi possível carregar este perfil.</p></div>';
    }
};

(() => {
    const styleId = "sabore-notifications-style";
    const messageType = (message) => /erro|falha|n[aã]o foi poss[ií]vel|inv[aá]lid|negad|indispon[ií]vel/i.test(message)
        ? "error"
        : "success";

    const ensureStyle = () => {
        if (document.getElementById(styleId)) return;
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
            #sabore-notifications { position: fixed; top: 24px; right: 24px; z-index: 2147483647; width: min(390px, calc(100vw - 32px)); display: grid; gap: 12px; pointer-events: none; }
            .sabore-notification { pointer-events: auto; display: grid; grid-template-columns: 42px 1fr 28px; gap: 12px; align-items: start; padding: 14px; color: #f8f4ee; background: linear-gradient(135deg, rgba(24, 48, 42, .98), rgba(15, 32, 28, .98)); border: 1px solid rgba(244, 222, 186, .22); border-radius: 16px; box-shadow: 0 18px 45px rgba(0, 0, 0, .35); backdrop-filter: blur(16px); animation: sabore-notification-in .28s ease-out both; font-family: Inter, system-ui, sans-serif; }
            .sabore-notification.is-leaving { animation: sabore-notification-out .2s ease-in both; }
            .sabore-notification__icon { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 13px; font-size: 1rem; background: rgba(235, 137, 126, .16); color: #ef8d82; }
            .sabore-notification.success .sabore-notification__icon { color: #79d69b; background: rgba(73, 178, 112, .16); }
            .sabore-notification__content { min-width: 0; padding-top: 1px; }
            .sabore-notification__title { margin: 0 0 4px; font-size: .88rem; font-weight: 800; letter-spacing: .01em; }
            .sabore-notification__message { margin: 0; color: rgba(248, 244, 238, .76); font-size: .82rem; line-height: 1.45; word-break: break-word; }
            .sabore-notification__close { width: 28px; height: 28px; padding: 0; border: 0; border-radius: 9px; color: rgba(248, 244, 238, .75); background: transparent; font: inherit; font-size: 1.1rem; cursor: pointer; }
            .sabore-notification__close:hover { color: #fff; background: rgba(255,255,255,.1); }
            @keyframes sabore-notification-in { from { opacity: 0; transform: translateY(-10px) translateX(12px); } to { opacity: 1; transform: translateY(0) translateX(0); } }
            @keyframes sabore-notification-out { to { opacity: 0; transform: translateY(-8px) translateX(12px); } }
            @media (max-width: 600px) { #sabore-notifications { top: 14px; right: 16px; } }
        `;
        document.head.appendChild(style);
    };

    window.SaboreNotify = (message, type = messageType(String(message))) => {
        ensureStyle();
        let container = document.getElementById("sabore-notifications");
        if (!container) {
            container = document.createElement("div");
            container.id = "sabore-notifications";
            container.setAttribute("aria-live", "polite");
            (document.body || document.documentElement).appendChild(container);
        }

        const notification = document.createElement("article");
        notification.className = `sabore-notification ${type === "error" ? "error" : "success"}`;
        const icon = document.createElement("span");
        icon.className = "sabore-notification__icon";
        icon.innerHTML = `<i class="fa-solid ${type === "error" ? "fa-circle-exclamation" : "fa-circle-check"}"></i>`;
        const content = document.createElement("div");
        content.className = "sabore-notification__content";
        const title = document.createElement("p");
        title.className = "sabore-notification__title";
        title.textContent = type === "error" ? "Algo não saiu como esperado" : "Tudo certo";
        const description = document.createElement("p");
        description.className = "sabore-notification__message";
        description.textContent = String(message);
        content.append(title, description);
        const close = document.createElement("button");
        close.className = "sabore-notification__close";
        close.type = "button";
        close.setAttribute("aria-label", "Fechar notificação");
        close.innerHTML = "&times;";

        let timer;
        const dismiss = () => {
            window.clearTimeout(timer);
            notification.classList.add("is-leaving");
            window.setTimeout(() => notification.remove(), 220);
        };
        close.addEventListener("click", dismiss);
        notification.append(icon, content, close);
        container.appendChild(notification);
        timer = window.setTimeout(dismiss, type === "error" ? 8000 : 5000);
        return notification;
    };

    const styledAlert = (message) => window.SaboreNotify(message);
    window.alert = styledAlert;
    window.addEventListener("load", () => { window.alert = styledAlert; });
})();

api.normalizeRecipeSteps = (steps) => (Array.isArray(steps) ? steps : String(steps || "").split(/\r?\n/))
    .map((step) => String(step).trim()
        .replace(/^\s*(?:passo\s*)?(?:\d+\s*[.\):\-–]\s*)+/i, "")
        .trim())
    .filter(Boolean);

api.normalizeRenderedRecipeSteps = (root = document) => {
    const selectors = [
        "#result-steps-list",
        "#recipe-detail-steps-list",
        "#photo-recipe-steps-list",
        ".recipe-steps-side ol",
        ".chat-recipe-section ol",
        ".recipe-steps-list"
    ].join(", ");
    root.querySelectorAll?.(selectors).forEach((list) => {
        list.start = 1;
        Array.from(list.children).forEach((item) => {
            if (item.tagName !== "LI") return;
            item.removeAttribute("value");
            const cleaned = api.normalizeRecipeSteps([item.textContent])[0];
            if (cleaned && item.textContent !== cleaned) item.textContent = cleaned;
        });
    });
};

(() => {
    const icons = {
        seguidor: "fa-user-plus",
        receita: "fa-utensils",
        favorito: "fa-heart",
        avaliacao: "fa-star",
        recomendacao: "fa-wand-magic-sparkles"
    };
    let notifications = [];
    let loadingPromise = null;
    const selectedIds = new Set();

    const readStorageKey = () => {
        const user = api.getUser();
        return user ? `sabore_notifications_read_${user.id}` : null;
    };
    const getReadIds = () => {
        const key = readStorageKey();
        if (!key) return new Set();
        try {
            return new Set(JSON.parse(localStorage.getItem(key) || "[]"));
        } catch {
            return new Set();
        }
    };
    const deletedStorageKey = () => {
        const user = api.getUser();
        return user ? `sabore_notifications_deleted_${user.id}` : null;
    };
    const getDeletedIds = () => {
        const key = deletedStorageKey();
        if (!key) return new Set();
        try {
            const ids = JSON.parse(localStorage.getItem(key) || "[]");
            return new Set(Array.isArray(ids) ? ids : []);
        } catch {
            return new Set();
        }
    };
    const formatRelativeTime = (value) => {
        const timestamp = new Date(value).getTime();
        if (!Number.isFinite(timestamp)) return "Agora";
        const seconds = Math.round((timestamp - Date.now()) / 1000);
        const intervals = [
            ["year", 31536000],
            ["month", 2592000],
            ["day", 86400],
            ["hour", 3600],
            ["minute", 60]
        ];
        const formatter = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
        for (const [unit, size] of intervals) {
            if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
        }
        return "Agora";
    };
    const visibleNotifications = () => {
        const deletedIds = getDeletedIds();
        return notifications.filter((item) => !deletedIds.has(item.id) && (
            item.tipo !== "recomendacao" || localStorage.getItem("sabore_notif_daily") !== "false"
        ));
    };
    const ensureSelectionControls = (list) => {
        let toolbar = list.parentElement.querySelector(".notification-actions");
        if (toolbar) return toolbar;

        if (!document.getElementById("notification-selection-style")) {
            const style = document.createElement("style");
            style.id = "notification-selection-style";
            style.textContent = `
                .notification-actions { display:flex; align-items:center; justify-content:space-between; gap:12px; margin:0 0 14px; }
                .notification-actions[hidden] { display:none; }
                .notification-actions label { display:inline-flex; align-items:center; gap:8px; font-size:.78rem; color:var(--light); cursor:pointer; }
                .notification-actions input, .notification-item-select { width:16px; height:16px; accent-color:var(--accent); cursor:pointer; flex-shrink:0; }
                .notification-actions button { padding:7px 10px; border:1px solid rgba(255,95,86,.35); border-radius:8px; background:rgba(255,95,86,.12); color:var(--light); font:inherit; font-size:.75rem; cursor:pointer; }
                .notification-actions button:disabled { opacity:.45; cursor:not-allowed; }
                .notif-item.is-selected { border-color:rgba(224,133,122,.4); background:var(--accent-light); }
                .notification-item-select { align-self:center; }
                .notification-item-main { display:flex; align-items:flex-start; gap:12px; flex:1; min-width:0; }
                .notification-item-main[role="link"] { cursor:pointer; }
                .notification-item-main .notif-info { flex:1; min-width:0; }
            `;
            document.head.appendChild(style);
        }

        toolbar = document.createElement("div");
        toolbar.className = "notification-actions";
        const label = document.createElement("label");
        const selectAll = document.createElement("input");
        selectAll.type = "checkbox";
        selectAll.setAttribute("aria-label", "Selecionar todas as notificações");
        label.append(selectAll, document.createTextNode("Selecionar todas"));
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Excluir";
        toolbar.append(label, deleteButton);
        list.before(toolbar);

        selectAll.addEventListener("change", () => {
            visibleNotifications().forEach((item) => {
                if (selectAll.checked) selectedIds.add(item.id);
                else selectedIds.delete(item.id);
            });
            renderNotifications();
        });
        deleteButton.addEventListener("click", () => {
            if (!selectedIds.size) return;
            const key = deletedStorageKey();
            if (!key) return;
            const deletedIds = getDeletedIds();
            selectedIds.forEach((id) => deletedIds.add(id));
            try {
                localStorage.setItem(key, JSON.stringify(Array.from(deletedIds).slice(-1000)));
            } catch {
                window.SaboreNotify?.("Não foi possível excluir as notificações.", "error");
                return;
            }
            selectedIds.clear();
            renderNotifications();
        });
        return toolbar;
    };
    const updateSelectionControls = (toolbar, items) => {
        const selectAll = toolbar.querySelector('input[type="checkbox"]');
        const deleteButton = toolbar.querySelector("button");
        toolbar.hidden = items.length === 0;
        selectAll.checked = items.length > 0 && selectedIds.size === items.length;
        selectAll.indeterminate = selectedIds.size > 0 && selectedIds.size < items.length;
        deleteButton.disabled = selectedIds.size === 0;
        deleteButton.textContent = selectedIds.size ? `Excluir (${selectedIds.size})` : "Excluir";
    };
    const renderNotifications = () => {
        const list = document.querySelector("#notifications-modal .notifications-list");
        const button = document.getElementById("notifications-btn");
        const dot = button?.querySelector(".badge-dot");
        if (!list || !button) return;

        const toolbar = ensureSelectionControls(list);
        const readIds = getReadIds();
        const items = visibleNotifications();
        const visibleIds = new Set(items.map((item) => item.id));
        selectedIds.forEach((id) => { if (!visibleIds.has(id)) selectedIds.delete(id); });
        list.innerHTML = "";
        if (!items.length) {
            const empty = document.createElement("div");
            empty.className = "book-detail-empty";
            empty.style.cssText = "padding:24px;text-align:center;color:rgba(242,244,243,.55)";
            empty.innerHTML = '<i class="fa-regular fa-bell-slash" style="display:block;font-size:1.5rem;margin-bottom:10px"></i><p>Nenhuma notificação no momento.</p>';
            list.appendChild(empty);
        } else {
            items.forEach((item) => {
                const row = document.createElement("article");
                row.className = `notif-item${readIds.has(item.id) ? "" : " unread"}`;
                row.classList.toggle("is-selected", selectedIds.has(item.id));
                const actionable = Boolean(item.receitaId || item.usuarioId);
                const select = document.createElement("input");
                select.type = "checkbox";
                select.className = "notification-item-select";
                select.checked = selectedIds.has(item.id);
                select.setAttribute("aria-label", `Selecionar notificação: ${item.titulo || "Novidade"}`);
                select.addEventListener("change", () => {
                    if (select.checked) selectedIds.add(item.id);
                    else selectedIds.delete(item.id);
                    row.classList.toggle("is-selected", select.checked);
                    updateSelectionControls(toolbar, items);
                });

                const main = document.createElement("div");
                main.className = "notification-item-main";
                if (actionable) {
                    main.setAttribute("role", "link");
                    main.tabIndex = 0;
                }

                const icon = document.createElement("span");
                icon.className = "notif-icon";
                icon.innerHTML = `<i class="fa-solid ${icons[item.tipo] || "fa-bell"}"></i>`;
                const info = document.createElement("div");
                info.className = "notif-info";
                const message = document.createElement("p");
                const title = document.createElement("strong");
                title.textContent = item.titulo || "Novidade";
                message.append(title, document.createTextNode(` ${item.texto || ""}`));
                const time = document.createElement("span");
                time.className = "notif-time";
                time.textContent = formatRelativeTime(item.createdAt);
                info.append(message, time);
                main.append(icon, info);
                row.append(select, main);

                if (actionable) {
                    const openTarget = () => {
                        if (item.receitaId) window.location.href = api.publicationUrl(item.receitaId);
                        else api.openUserProfile(item.usuarioId);
                    };
                    main.addEventListener("click", openTarget);
                    main.addEventListener("keydown", (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openTarget();
                        }
                    });
                }
                list.appendChild(row);
            });
        }

        updateSelectionControls(toolbar, items);
        const unreadCount = items.filter((item) => !readIds.has(item.id)).length;
        if (dot) dot.style.display = unreadCount ? "block" : "none";
        button.title = unreadCount ? `Notificações (${unreadCount} novas)` : "Notificações";
    };
    const markVisibleAsRead = () => {
        const key = readStorageKey();
        if (!key) return;
        const ids = getReadIds();
        visibleNotifications().forEach((item) => ids.add(item.id));
        localStorage.setItem(key, JSON.stringify(Array.from(ids).slice(-200)));
        renderNotifications();
    };
    const loadNotifications = async () => {
        if (loadingPromise) return loadingPromise;
        loadingPromise = api.get("/social/notificacoes")
            .then((items) => {
                notifications = Array.isArray(items) ? items : [];
                renderNotifications();
                if (document.getElementById("notifications-modal")?.classList.contains("open")) {
                    markVisibleAsRead();
                }
            })
            .catch(() => {
                notifications = [];
                renderNotifications();
            })
            .finally(() => { loadingPromise = null; });
        return loadingPromise;
    };

    document.addEventListener("DOMContentLoaded", () => {
        if (!window.location.pathname.includes("/Dashboard/") || !api.getUser()) return;
        const button = document.getElementById("notifications-btn");
        if (!button) return;
        loadNotifications();
        button.addEventListener("click", async () => {
            await loadNotifications();
            markVisibleAsRead();
        });
        window.addEventListener("storage", (event) => {
            if (event.key === deletedStorageKey()) selectedIds.clear();
            if (event.key === readStorageKey() || event.key === deletedStorageKey() || event.key === "sabore_notif_daily") renderNotifications();
        });
    });
})();

document.addEventListener("DOMContentLoaded", () => {
    api.normalizeRenderedRecipeSteps();
    const recipesObserver = new MutationObserver(() => api.normalizeRenderedRecipeSteps());
    recipesObserver.observe(document.body, { childList: true, subtree: true });
    if (window.location.pathname.includes("/Dashboard/")) {
        document.querySelectorAll('a[href*="inicial/"]').forEach((link) => {
            link.addEventListener("click", () => api.clearSession());
        });
    }
    const cursorStyleId = "sabore-cursor-global-style";
    if (!document.getElementById(cursorStyleId)) {
        const style = document.createElement("style");
        style.id = cursorStyleId;
        style.textContent = `
            .custom-cursor {
                z-index: 999999999 !important;
                pointer-events: none !important;
            }
        `;
        document.head.appendChild(style);
    }
    const user = api.getUser();
    if (!user) return;
    const avatarWrapGlobal = document.querySelector(".user-avatar-wrap");
    const navAvatarGlobal = document.querySelector(".user-avatar");
    const avatarUrlGlobal = user.foto || null;
    if (navAvatarGlobal) {
        if (avatarUrlGlobal) {
            navAvatarGlobal.src = avatarUrlGlobal;
            navAvatarGlobal.style.display = "block";
            navAvatarGlobal.onerror = () => {
                navAvatarGlobal.style.display = "none";
                if (avatarWrapGlobal) {
                    let ph = avatarWrapGlobal.querySelector(".user-avatar-placeholder");
                    if (!ph) {
                        ph = document.createElement("div");
                        ph.className = "user-avatar-placeholder";
                        ph.style.cssText = "width:32px;height:32px;border-radius:50%;background:var(--accent);color:var(--dark-deep);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.9rem;user-select:none;";
                        avatarWrapGlobal.insertBefore(ph, avatarWrapGlobal.firstChild);
                    }
                    ph.textContent = user.nome ? user.nome.charAt(0).toUpperCase() : "U";
                }
            };
            const oldPh = avatarWrapGlobal ? avatarWrapGlobal.querySelector(".user-avatar-placeholder") : null;
            if (oldPh) oldPh.remove();
        } else {
            navAvatarGlobal.style.display = "none";
            if (avatarWrapGlobal) {
                let ph = avatarWrapGlobal.querySelector(".user-avatar-placeholder");
                if (!ph) {
                    ph = document.createElement("div");
                    ph.className = "user-avatar-placeholder";
                    ph.style.cssText = "width:32px;height:32px;border-radius:50%;background:var(--accent);color:var(--dark-deep);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.9rem;user-select:none;";
                    avatarWrapGlobal.insertBefore(ph, avatarWrapGlobal.firstChild);
                }
                ph.textContent = user.nome ? user.nome.charAt(0).toUpperCase() : "U";
            }
        }
    }
    const navNameGlobal = document.querySelector(".user-name");
    if (navNameGlobal && user.nome) {
        navNameGlobal.textContent = user.nome.split(" ")[0];
    }
    const trigger = document.getElementById("profile-dropdown-trigger");
    if (!trigger) return;
    const styleId = "sabore-header-injected-styles";
    if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
            .custom-cursor {
                z-index: 999999999 !important;
            }
            .user-avatar-placeholder {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background-color: var(--accent);
                color: var(--dark-deep) !important;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 0.9rem;
                user-select: none;
                border: 1px solid var(--glass-border);
            }
            .large-avatar-placeholder {
                width: 150px;
                height: 150px;
                border-radius: 50%;
                background-color: var(--accent);
                color: var(--dark-deep) !important;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 3.2rem;
                user-select: none;
                border: 3px solid var(--glass-border);
                margin: 0 auto 15px auto;
            }
            .profile-dropdown-menu {
                position: absolute;
                width: 180px;
                background: var(--dark-deep);
                border: 1px solid var(--glass-border);
                border-radius: 12px;
                padding: 6px;
                display: none;
                flex-direction: column;
                gap: 4px;
                z-index: 999999;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(12px);
                transition: opacity 0.2s;
            }
            .profile-dropdown-menu.open {
                display: flex;
            }
            .profile-dropdown-menu .dropdown-item {
                padding: 8px 12px;
                border-radius: 8px;
                font-size: 0.85rem;
                color: var(--light);
                display: flex;
                align-items: center;
                gap: 8px;
                transition: background 0.2s, color 0.2s;
                border: none;
                background: transparent;
                text-align: left;
                width: 100%;
                font-family: inherit;
            }
            .profile-dropdown-menu .dropdown-item:hover {
                background: var(--glass-hover);
                color: var(--accent);
            }
            .profile-dropdown-menu .dropdown-divider {
                border: none;
                border-top: 1px solid var(--glass-border);
                margin: 4px 0;
            }
            .profile-dropdown-menu .logout-btn {
                color: var(--danger) !important;
            }
            .profile-dropdown-menu .logout-btn:hover {
                background: rgba(255, 95, 86, 0.1) !important;
            }
        `;
        document.head.appendChild(style);
    }
    const navName = document.querySelector(".user-name");
    if (navName && user.nome) {
        navName.textContent = user.nome.split(" ")[0];
    }
    let dropdownMenu = document.getElementById("profile-dropdown-menu");
    if (!dropdownMenu) {
        dropdownMenu = document.createElement("div");
        dropdownMenu.id = "profile-dropdown-menu";
        dropdownMenu.className = "profile-dropdown-menu";
        const pathPrefix = window.location.pathname.includes("/Dashboard/perfil/") || 
                             window.location.pathname.includes("/Dashboard/configuracoes/") ||
                             window.location.pathname.includes("/Dashboard/chefIA/") ||
                             window.location.pathname.includes("/Dashboard/home/") ||
                             window.location.pathname.includes("/Dashboard/explorar/") ||
                             window.location.pathname.includes("/Dashboard/livros/") ||
                             window.location.pathname.includes("/Dashboard/favoritos/") ||
                             window.location.pathname.includes("/Dashboard/importVideo/") ||
                             window.location.pathname.includes("/Dashboard/iaFotos/") 
                             ? "../" : "";
        dropdownMenu.innerHTML = `
            <a href="${pathPrefix}perfil/index.html" class="dropdown-item"><i class="fa-solid fa-user"></i> Meu Perfil</a>
            <a href="${pathPrefix}configuracoes/index.html" class="dropdown-item"><i class="fa-solid fa-gear"></i> Configurações</a>
            <hr class="dropdown-divider">
            <button class="dropdown-item logout-btn" id="btn-logout-header"><i class="fa-solid fa-right-from-bracket"></i> Sair da Conta</button>
        `;
        document.body.appendChild(dropdownMenu);
    }
    trigger.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        dropdownMenu.classList.toggle("open");
        const rect = trigger.getBoundingClientRect();
        dropdownMenu.style.top = `${rect.bottom + window.scrollY + 8}px`;
        dropdownMenu.style.left = `${rect.right - 180 + window.scrollX}px`;
    }, true);
    document.addEventListener("click", (e) => {
        if (!trigger.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove("open");
        }
    });
    const logoutBtn = document.getElementById("btn-logout-header");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            if (confirm("Deseja realmente sair da sua conta?")) {
                api.clearSession();
                const currentPath = window.location.pathname;
                if (currentPath.includes("/Dashboard/")) {
                    window.location.href = "../../login/index.html";
                } else {
                    window.location.href = "../login/index.html";
                }
            }
        });
    }
});
