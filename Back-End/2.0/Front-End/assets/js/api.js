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
                // Unauthorized - clear token/user and redirect to login if not already there
                api.clearToken();
                api.clearUser();
                
                const currentPath = window.location.pathname;
                if (!currentPath.includes("/login/") && !currentPath.includes("/cadastro/") && !currentPath.endsWith("inicial/index.html") && !currentPath.endsWith("inicial/") && !currentPath.endsWith("Front-End/")) {
                    // Find correct relative path to login
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
                throw new Error(errData.erro || `Erro na requisição: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`API Error on ${endpoint}:`, error);
            throw error;
        }
    },

    get: (endpoint) => api.request(endpoint, { method: "GET" }),
    post: (endpoint, body) => api.request(endpoint, { method: "POST", body: JSON.stringify(body) }),
    put: (endpoint, body) => api.request(endpoint, { method: "PUT", body: JSON.stringify(body) }),
    delete: (endpoint) => api.request(endpoint, { method: "DELETE" })
};

// ─── GLOBAL DASHBOARD HEADER USER INITIALIZATION & DROPDOWN ───
document.addEventListener("DOMContentLoaded", () => {
    const trigger = document.getElementById("profile-dropdown-trigger");
    if (!trigger) return; // Only run on pages that have the profile badge

    const user = api.getUser();
    if (!user) return;

    // 1. Inject Styles for Placeholders & Dropdown Menu
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

    // 2. Setup user initials placeholder instead of hardcoded default face
    const avatarWrap = document.querySelector(".user-avatar-wrap");
    const navAvatar = document.querySelector(".user-avatar");
    const savedAvatar = localStorage.getItem("sabore_user_avatar");
    const avatarUrl = savedAvatar || user.foto;

    // Check for large-user-avatar in profile page
    const largeAvatar = document.querySelector(".large-user-avatar");

    if (avatarUrl) {
        if (navAvatar) {
            navAvatar.src = avatarUrl;
            navAvatar.style.display = "block";
        }
        if (largeAvatar) {
            largeAvatar.src = avatarUrl;
            largeAvatar.style.display = "block";
            const largePlaceholder = document.querySelector(".large-avatar-placeholder");
            if (largePlaceholder) largePlaceholder.style.display = "none";
        }
        const oldPlaceholder = avatarWrap ? avatarWrap.querySelector(".user-avatar-placeholder") : null;
        if (oldPlaceholder) oldPlaceholder.remove();
    } else {
        // No custom avatar -> display initials placeholder
        if (navAvatar) navAvatar.style.display = "none";
        if (avatarWrap) {
            let placeholder = avatarWrap.querySelector(".user-avatar-placeholder");
            if (!placeholder) {
                placeholder = document.createElement("div");
                placeholder.className = "user-avatar-placeholder";
                avatarWrap.insertBefore(placeholder, avatarWrap.firstChild);
            }
            const initial = user.nome ? user.nome.charAt(0).toUpperCase() : "U";
            placeholder.textContent = initial;
        }

        if (largeAvatar) {
            largeAvatar.style.display = "none";
            const largeWrap = largeAvatar.parentElement;
            if (largeWrap) {
                let largePlaceholder = largeWrap.querySelector(".large-avatar-placeholder");
                if (!largePlaceholder) {
                    largePlaceholder = document.createElement("div");
                    largePlaceholder.className = "large-avatar-placeholder";
                    largeWrap.insertBefore(largePlaceholder, largeWrap.firstChild);
                }
                const initial = user.nome ? user.nome.charAt(0).toUpperCase() : "U";
                largePlaceholder.textContent = initial;
            }
        }
    }

    // Update userName text dynamically in header if element exists
    const navName = document.querySelector(".user-name");
    if (navName && user.nome) {
        navName.textContent = user.nome.split(" ")[0];
    }

    // 3. Inject Dropdown menu
    let dropdownMenu = document.getElementById("profile-dropdown-menu");
    if (!dropdownMenu) {
        dropdownMenu = document.createElement("div");
        dropdownMenu.id = "profile-dropdown-menu";
        dropdownMenu.className = "profile-dropdown-menu";
        
        // Resolve paths dynamically based on page location
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

    // 4. Intercept clicks on profile trigger using capture phase to prevent redirection
    trigger.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        dropdownMenu.classList.toggle("open");

        // Position it below trigger
        const rect = trigger.getBoundingClientRect();
        dropdownMenu.style.top = `${rect.bottom + window.scrollY + 8}px`;
        dropdownMenu.style.left = `${rect.right - 180 + window.scrollX}px`; // 180px width
    }, true); // Capture phase listener

    // Close dropdown on click outside
    document.addEventListener("click", (e) => {
        if (!trigger.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove("open");
        }
    });

    // Wire up header logout button
    const logoutBtn = document.getElementById("btn-logout-header");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            if (confirm("Deseja realmente sair da sua conta?")) {
                api.clearToken();
                api.clearUser();
                localStorage.removeItem("sabore_user_avatar");
                
                // Redirect back to login
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
