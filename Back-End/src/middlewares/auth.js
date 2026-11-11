const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { withDirectDatabaseFallback } = require("../data/databaseFallback");

const SUPABASE_URL = process.env.SUPABASE_URL || "https://dzumxhfglusinxtyflwb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
const verifiedSessions = new Map();
const pendingChecks = new Map();
const recentFailures = new Map();
const FRESH_SESSION_MS = 60_000;
const STALE_SESSION_MS = 5 * 60_000;
const FAILURE_RETRY_MS = 15_000;

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const tokenKey = (authHeader) => crypto.createHash("sha256").update(authHeader).digest("hex");

const getVerifiedSession = (key, allowStale = false) => {
    const session = verifiedSessions.get(key);
    if (!session) return null;
    if (session.expiresAt <= Date.now()) {
        verifiedSessions.delete(key);
        return null;
    }
    return allowStale || session.freshUntil > Date.now() ? session.user : null;
};

const rememberVerifiedSession = (key, authHeader, user) => {
    const now = Date.now();
    let expiresAt = now + STALE_SESSION_MS;
    try {
        const token = authHeader.replace(/^Bearer\s+/i, "");
        const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
        if (Number.isFinite(Number(payload.exp))) expiresAt = Math.min(expiresAt, Number(payload.exp) * 1000);
    } catch {}
    if (expiresAt <= now) return;
    if (verifiedSessions.size >= 500) verifiedSessions.delete(verifiedSessions.keys().next().value);
    verifiedSessions.set(key, { user, expiresAt, freshUntil: Math.min(expiresAt, now + FRESH_SESSION_MS) });
};

const getRecentFailure = (key) => {
    const failure = recentFailures.get(key);
    if (!failure) return null;
    if (failure.retryAt > Date.now()) return failure;
    recentFailures.delete(key);
    return null;
};

const rememberFailure = (key, reason) => {
    if (recentFailures.size >= 500) recentFailures.delete(recentFailures.keys().next().value);
    recentFailures.set(key, { reason, retryAt: Date.now() + FAILURE_RETRY_MS });
};

const unavailableResponse = (res, reason) => res.status(503).json({
    erro: "Não foi possível validar a sessão no Supabase.",
    detalhe: `O servidor não conseguiu acessar o Supabase (${reason}).`
});

const fetchSupabaseUser = async (authHeader) => {
    const key = tokenKey(authHeader);
    if (pendingChecks.has(key)) return pendingChecks.get(key);
    const check = (async () => {
        let lastError;
        for (let attempt = 1; attempt <= 2; attempt += 1) {
            try {
                const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
                    headers: {
                        apikey: SUPABASE_PUBLISHABLE_KEY,
                        Authorization: authHeader
                    },
                    signal: AbortSignal.timeout(6000)
                });
                return { status: response.status, user: response.ok ? await response.json() : null };
            } catch (error) {
                lastError = error;
                if (attempt === 1) await wait(250);
            }
        }
        throw lastError;
    })();
    pendingChecks.set(key, check);
    check.then(() => pendingChecks.delete(key), () => pendingChecks.delete(key));
    return check;
};

const defaultBooks = [
    { titulo: "Café da Manhã", emoji: "fa-solid fa-mug-hot", tag: "Coleção" },
    { titulo: "Fitness", emoji: "fa-solid fa-leaf", tag: "Coleção" },
    { titulo: "Sobremesas", emoji: "fa-solid fa-cake-candles", tag: "Coleção" },
    { titulo: "Favoritas", emoji: "fa-solid fa-heart", tag: "Coleção" },
    { titulo: "Receitas Rápidas", emoji: "fa-solid fa-bolt", tag: "Coleção" }
];

const createLocalUser = async (supabaseUser) => {
    const email = supabaseUser.email?.toLowerCase();
    if (!email) return null;
    return withDirectDatabaseFallback(async (db) => {
        let usuario = await db.usuario.findUnique({ where: { email } });
        if (usuario) return usuario;

        const metadata = supabaseUser.user_metadata || {};
        const nome = metadata.full_name || metadata.name || email.split("@")[0];
        const foto = metadata.avatar_url || metadata.picture || null;
        const senha = bcrypt.hashSync(crypto.randomBytes(32).toString("hex"), 10);

        try {
            usuario = await db.usuario.create({
                data: {
                    nome,
                    email,
                    foto,
                    senha,
                    livros: { create: defaultBooks }
                }
            });
        } catch (error) {
            if (error.code !== "P2002") throw error;
            usuario = await db.usuario.findUnique({ where: { email } });
        }
        return usuario;
    }, "sincronizar usuário", { write: true });
};

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ erro: "Acesso negado. Token não fornecido." });
    }

    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
        return res.status(500).json({ erro: "Supabase Auth não está configurado no servidor." });
    }

    const key = tokenKey(authHeader);
    let supabaseUser = getVerifiedSession(key);
    if (!supabaseUser) {
        const recentFailure = getRecentFailure(key);
        if (recentFailure) {
            supabaseUser = getVerifiedSession(key, true);
            if (!supabaseUser) return unavailableResponse(res, recentFailure.reason);
        } else {
            try {
                const verification = await fetchSupabaseUser(authHeader);
                if (verification.status === 401 || verification.status === 403) {
                    verifiedSessions.delete(key);
                    return res.status(401).json({ erro: "Token inválido ou expirado." });
                }
                if (verification.status < 200 || verification.status >= 300) {
                    throw new Error(`Supabase Auth HTTP ${verification.status}`);
                }
                supabaseUser = verification.user;
                rememberVerifiedSession(key, authHeader, supabaseUser);
                recentFailures.delete(key);
            } catch (error) {
                const reason = error.cause?.code || error.name || "UNKNOWN";
                supabaseUser = getVerifiedSession(key, true);
                if (!getRecentFailure(key)) {
                    rememberFailure(key, reason);
                    console.error("[Auth] Falha ao consultar o Supabase Auth:", reason);
                }
                if (!supabaseUser) return unavailableResponse(res, reason);
            }
        }
    }

    try {
        const usuario = await createLocalUser(supabaseUser);
        if (!usuario) {
            return res.status(401).json({ erro: "A conta autenticada não possui e-mail." });
        }

        req.usuario = { id: usuario.id, email: usuario.email, nome: usuario.nome };
        req.supabaseUser = supabaseUser;
        next();
    } catch (error) {
        console.error("[Auth] Falha ao sincronizar o usuário no banco:", error.code || error.message || error);
        return res.status(503).json({ 
            erro: "Não foi possível acessar os dados da sua conta no banco.",
            detalhe: error.message || "Erro de conexão com o banco de dados."
        });
    }
};

module.exports = authMiddleware;
