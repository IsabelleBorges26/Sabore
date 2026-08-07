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
                
                api.clearToken();
                api.clearUser();
                
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
                throw new Error(errData.erro || `Erro na requisição: ${response.statusText}`);
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
