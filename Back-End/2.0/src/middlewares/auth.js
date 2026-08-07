const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "sabore-secret-key-12345";

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ erro: "Acesso negado. Token não fornecido." });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.usuario = decoded; 
        next();
    } catch (error) {
        return res.status(401).json({ erro: "Token inválido ou expirado." });
    }
};

module.exports = authMiddleware;
