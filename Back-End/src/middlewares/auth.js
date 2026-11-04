const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const prisma = require("../data/prisma");

const SUPABASE_URL = process.env.SUPABASE_URL || "https://dzumxhfglusinxtyflwb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const fetchSupabaseUser = async (authHeader) => {
    let lastError;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
            return await fetch(`${SUPABASE_URL}/auth/v1/user`, {
                headers: {
                    apikey: SUPABASE_PUBLISHABLE_KEY,
                    Authorization: authHeader
                },
                signal: AbortSignal.timeout(10000)
            });
        } catch (error) {
            lastError = error;
            if (attempt < 3) await wait(attempt * 500);
        }
    }

    throw lastError;
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

    let usuario = await prisma.usuario.findUnique({ where: { email } });
    if (usuario) return usuario;

    const metadata = supabaseUser.user_metadata || {};
    const nome = metadata.full_name || metadata.name || email.split("@")[0];
    const foto = metadata.avatar_url || metadata.picture || null;
    const senha = bcrypt.hashSync(crypto.randomBytes(32).toString("hex"), 10);

    try {
        usuario = await prisma.usuario.create({
            data: {
                nome,
                email,
                foto,
                senha,
                livros: { create: defaultBooks }
            }
        });
    } catch (error) {
        // Duas requisições simultâneas no primeiro login podem tentar criar o mesmo e-mail.
        if (error.code !== "P2002") throw error;
        usuario = await prisma.usuario.findUnique({ where: { email } });
    }
    return usuario;
};

const getLocalSessionUser = async (authHeader) => {
    try {
        const token = authHeader.replace(/^Bearer\s+/i, "");
        const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
        if (!payload?.email || (payload.exp && payload.exp * 1000 <= Date.now())) return null;
        return createLocalUser({ email: payload.email, user_metadata: payload.user_metadata || {} });
    } catch {
        return null;
    }
};

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ erro: "Acesso negado. Token não fornecido." });
    }

    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
        return res.status(500).json({ erro: "Supabase Auth não está configurado no servidor." });
    }

    let response;
    try {
        response = await fetchSupabaseUser(authHeader);
    } catch (error) {
        const reason = error.cause?.code || error.name || "UNKNOWN";
        console.error("[Auth] Falha ao consultar o Supabase Auth:", reason, error.message);
        if (process.env.NODE_ENV !== "production") {
            const usuario = await getLocalSessionUser(authHeader);
            if (usuario) {
                req.usuario = { id: usuario.id, email: usuario.email, nome: usuario.nome };
                req.supabaseUser = { email: usuario.email, user_metadata: {} };
                return next();
            }
        }
        return res.status(503).json({
            erro: "Não foi possível validar a sessão no Supabase.",
            detalhe: `O servidor não conseguiu acessar o Supabase (${reason}).`
        });
    }

    if (!response.ok) {
        return res.status(401).json({ erro: "Token inválido ou expirado." });
    }

    try {
        const supabaseUser = await response.json();
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
