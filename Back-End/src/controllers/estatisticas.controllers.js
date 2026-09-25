const prisma = require("../data/prisma");

// Dados agregados e públicos da plataforma. Nenhum dado pessoal é exposto.
const publicas = async (_req, res) => {
    try {
        const [usuarios, receitas, avaliacoes] = await Promise.all([
            prisma.usuario.count(),
            prisma.receita.count(),
            prisma.avaliacao.aggregate({ _avg: { nota: true }, _count: { nota: true } })
        ]);

        return res.status(200).json({
            usuarios,
            receitas,
            avaliacaoMedia: avaliacoes._count.nota ? Number(avaliacoes._avg.nota.toFixed(1)) : null,
            totalAvaliacoes: avaliacoes._count.nota
        });
    } catch (error) {
        console.error("[Estatísticas] Erro ao obter indicadores públicos:", error);
        return res.status(503).json({ erro: "Não foi possível atualizar os indicadores agora." });
    }
};

module.exports = { publicas };
