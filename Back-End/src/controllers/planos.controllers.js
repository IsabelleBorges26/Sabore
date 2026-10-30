const prisma = require("../data/prisma");
const {
    obterRankingMensal,
    executarFechamentoMensal,
    getInfoPeriodoAtual,
    getMesReferencia
} = require("../services/engajamento.service");
const { obterConsumoUsuario, LIMITES_IA } = require("../services/iaUsage.service");

// Lista descritiva dos planos com o novo conceito por engajamento
const listarPlanos = async (req, res) => {
    const planos = [
        {
            nome: "FREE",
            tipo: "Gratuito",
            descricao: "Plano padrão disponível para todos os usuários cadastrados.",
            limitesIA: {
                modalidade: "Somente Chat",
                quantidade: LIMITES_IA.FREE.limiteMensalChat,
                periodo: "mensal"
            },
            comoConquistar: "Padrão de entrada no Saboré."
        },
        {
            nome: "PRO",
            tipo: "Conquista Comunitária",
            descricao: "Plano especial concedido mensalmente aos 5 usuários mais engajados da comunidade.",
            limitesIA: {
                modalidade: "Chat, Imagem e Vídeo",
                quantidade: LIMITES_IA.PRO.limiteSemanalTotal,
                periodo: "semanal (compartilhado entre as modalidades)"
            },
            comoConquistar: "Participe da comunidade publicando receitas, avaliando e interagindo para ficar entre os 5 primeiros do ranking mensal."
        }
    ];
    res.status(200).json(planos);
};

// Verifica o plano atual do usuário e status da concessão
const verificar = async (req, res) => {
    const usuarioId = req.usuario.id;
    try {
        const [usuario, concessaoAtiva, consumo] = await Promise.all([
            prisma.usuario.findUnique({
                where: { id: usuarioId },
                select: { id: true, nome: true, plano: true, isAdmin: true }
            }),
            prisma.concessaoPro.findFirst({
                where: {
                    usuarioId,
                    ativo: true,
                    inicioEm: { lte: new Date() },
                    expiraEm: { gte: new Date() }
                },
                orderBy: { expiraEm: "desc" }
            }),
            obterConsumoUsuario(usuarioId)
        ]);

        if (!usuario) {
            return res.status(404).json({ erro: "Usuário não encontrado." });
        }

        res.status(200).json({
            plano: usuario.plano,
            isPro: usuario.plano === "PRO",
            isAdmin: Boolean(usuario.isAdmin),
            concessao: concessaoAtiva ? {
                mesVigencia: concessaoAtiva.mesVigencia,
                posicao: concessaoAtiva.posicao,
                expiraEm: concessaoAtiva.expiraEm
            } : null,
            consumo
        });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao verificar plano.", detalhe: error.message });
    }
};

// Endpoint protegido: O plano PRO não pode ser ativado diretamente pelo usuário via frontend.
const atualizar = async (req, res) => {
    return res.status(403).json({
        erro: "O plano PRO não pode ser ativado manualmente.",
        detalhe: "No Saboré, o plano PRO é concedido gratuitamente e de forma automática aos 5 usuários com maior engajamento do mês no ranking da comunidade."
    });
};

// Retorna o ranking de engajamento mensal
const ranking = async (req, res) => {
    const { mes } = req.query;
    try {
        const dadosRanking = await obterRankingMensal(mes || null);
        const periodo = getInfoPeriodoAtual();

        // Identifica posição do usuário logado se autenticado
        let usuarioLogado = null;
        if (req.usuario?.id) {
            const encontrado = dadosRanking.ranking.find(r => r.usuarioId === req.usuario.id);
            if (encontrado) {
                usuarioLogado = {
                    ...encontrado,
                    posicao: encontrado.posicao,
                    naZonaPro: encontrado.naZonaPro
                };
            }
        }

        res.status(200).json({
            mesReferencia: dadosRanking.mesReferencia,
            totalParticipantes: dadosRanking.totalParticipantes,
            periodo,
            usuarioLogado,
            top5: dadosRanking.ranking.slice(0, 5),
            rankingCompleto: dadosRanking.ranking
        });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao consultar ranking.", detalhe: error.message });
    }
};

// Retorna o histórico de atividades de pontuação do usuário logado
const meuHistoricoAtividades = async (req, res) => {
    const usuarioId = req.usuario.id;
    const { mes } = req.query;
    const mesReferencia = mes || getMesReferencia();

    try {
        const atividades = await prisma.atividadeEngajamento.findMany({
            where: {
                usuarioId,
                mesReferencia
            },
            orderBy: { createdAt: "desc" }
        });

        const totalPontos = atividades.reduce((acc, a) => acc + a.pontos, 0);

        res.status(200).json({
            mesReferencia,
            totalPontos,
            atividades
        });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao carregar histórico de atividades.", detalhe: error.message });
    }
};

// Ação administrativa: Executa fechamento mensal
const adminExecutarFechamento = async (req, res) => {
    const { mesReferencia } = req.body;
    try {
        const resultado = await executarFechamentoMensal(mesReferencia || null, req.usuario.id);
        res.status(200).json(resultado);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao executar fechamento mensal.", detalhe: error.message });
    }
};

// Ação administrativa: Consulta dados gerenciais do sistema de planos e engajamento
const adminDashboard = async (req, res) => {
    try {
        const mesAtual = getMesReferencia();
        const [fechamentos, concessoes, rankingAtual, atividadesRecentes] = await Promise.all([
            prisma.fechamentoMensal.findMany({
                orderBy: { executadoEm: "desc" },
                take: 12,
                include: { executadoPor: { select: { id: true, nome: true, email: true } } }
            }),
            prisma.concessaoPro.findMany({
                orderBy: { createdAt: "desc" },
                take: 20,
                include: { usuario: { select: { id: true, nome: true, email: true } } }
            }),
            obterRankingMensal(mesAtual),
            prisma.atividadeEngajamento.findMany({
                orderBy: { createdAt: "desc" },
                take: 50,
                include: { usuario: { select: { id: true, nome: true, email: true } } }
            })
        ]);

        res.status(200).json({
            mesAtual,
            rankingAtual: rankingAtual.ranking,
            fechamentos,
            concessoes,
            atividadesRecentes
        });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao carregar painel administrativo.", detalhe: error.message });
    }
};

module.exports = {
    listarPlanos,
    verificar,
    atualizar,
    ranking,
    meuHistoricoAtividades,
    adminExecutarFechamento,
    adminDashboard
};