const prisma = require("../data/prisma");

/**
 * Middleware para restringir rotas exclusivamente a usuários administradores.
 */
const adminMiddleware = async (req, res, next) => {
    const usuarioId = req.usuario?.id;
    if (!usuarioId) {
        return res.status(401).json({ erro: "Acesso negado. Usuário não autenticado." });
    }

    try {
        const usuario = await prisma.usuario.findUnique({
            where: { id: usuarioId },
            select: { id: true, isAdmin: true, email: true }
        });

        if (!usuario || !usuario.isAdmin) {
            return res.status(403).json({
                erro: "Acesso restrito. Somente administradores autorizados podem realizar esta operação."
            });
        }

        req.adminUsuario = usuario;
        next();
    } catch (error) {
        console.error("[AdminMiddleware] Erro ao verificar privilégios:", error);
        return res.status(500).json({ erro: "Erro ao verificar permissão de administrador." });
    }
};

module.exports = adminMiddleware;
