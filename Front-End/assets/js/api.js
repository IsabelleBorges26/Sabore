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

const API_BASE_URL = "http://localhost:3000";
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
            throw error;
        }
    },
    get: (endpoint) => api.request(endpoint, { method: "GET" }),
    post: (endpoint, body) => api.request(endpoint, { method: "POST", body: JSON.stringify(body) }),
    put: (endpoint, body) => api.request(endpoint, { method: "PUT", body: JSON.stringify(body) }),
    delete: (endpoint) => api.request(endpoint, { method: "DELETE" })
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
                cursor: none !important;
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
