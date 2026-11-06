const prisma = require("../data/prisma");
const { getMesReferencia, getSemanaChave, getSaoPauloDate } = require("./engajamento.service");

// Limites configuráveis de utilização de IA
const LIMITES_IA = {
    FREE: {
        limiteMensalChat: 5,
        limiteMensalImagem: 2,
        limiteMensalVideo: 2,
        permiteImagem: true,
        permiteVideo: true
    },
    PRO: {
        ilimitado: true,
        limiteSemanalTotal: null,
        permiteImagem: true,
        permiteVideo: true
    }
};

/**
 * Calcula quando o limite irá renovar
 */
function calcularProximaRenovacao(plano) {
    const sp = getSaoPauloDate();
    if (plano === "PRO") {
        const prox = new Date(sp.getFullYear(), sp.getMonth() + 1, 1, 0, 0, 0, 0);
        return {
            tipo: "ilimitado",
            data: prox.toISOString(),
            texto: `acesso ilimitado vigente no mês (${prox.toLocaleDateString("pt-BR")})`
        };
    } else {
        // FREE renova no dia 1º do próximo mês às 00:00 (America/Sao_Paulo)
        const prox = new Date(sp.getFullYear(), sp.getMonth() + 1, 1, 0, 0, 0, 0);
        return {
            tipo: "mensal",
            data: prox.toISOString(),
            texto: `no 1º dia do próximo mês (${prox.toLocaleDateString("pt-BR")})`
        };
    }
}

/**
 * Consulta o consumo do usuário no período atual
 */
async function obterConsumoUsuario(usuarioId, planoUsuario = null) {
    if (!usuarioId) return null;

    let plano = planoUsuario;
    if (!plano) {
        const u = await prisma.usuario.findUnique({
            where: { id: usuarioId },
            select: { plano: true }
        });
        plano = u?.plano || "FREE";
    }

    const mesReferencia = getMesReferencia();
    const semanaChave = getSemanaChave();

    if (plano === "PRO") {
        const totalUsosMes = await prisma.usoIA.count({
            where: {
                usuarioId,
                mesReferencia
            }
        });

        const renovacao = calcularProximaRenovacao("PRO");

        return {
            plano: "PRO",
            ilimitado: true,
            periodo: "mensal",
            chavePeriodo: mesReferencia,
            limiteTotal: null,
            usados: totalUsosMes,
            restantes: 999,
            restantesChat: 999,
            restantesImagem: 999,
            restantesVideo: 999,
            podeUsar: true,
            modalidadesPermitidas: ["CHAT", "IMAGEM", "VIDEO"],
            proximaRenovacao: renovacao
        };
    } else {
        // FREE: controle separado e independente por modalidade (CHAT, IMAGEM e VIDEO)
        const [totalChatMes, totalImagemMes, totalVideoMes] = await Promise.all([
            prisma.usoIA.count({
                where: {
                    usuarioId,
                    mesReferencia,
                    modalidade: "CHAT"
                }
            }),
            prisma.usoIA.count({
                where: {
                    usuarioId,
                    mesReferencia,
                    modalidade: "IMAGEM"
                }
            }),
            prisma.usoIA.count({
                where: {
                    usuarioId,
                    mesReferencia,
                    modalidade: "VIDEO"
                }
            })
        ]);

        const limiteChat = LIMITES_IA.FREE.limiteMensalChat;
        const limiteImagem = LIMITES_IA.FREE.limiteMensalImagem;
        const limiteVideo = LIMITES_IA.FREE.limiteMensalVideo;
        const restantesChat = Math.max(0, limiteChat - totalChatMes);
        const restantesImagem = Math.max(0, limiteImagem - totalImagemMes);
        const restantesVideo = Math.max(0, limiteVideo - totalVideoMes);
        const podeUsar = restantesChat > 0 || restantesImagem > 0 || restantesVideo > 0;
        const renovacao = calcularProximaRenovacao("FREE");

        return {
            plano: "FREE",
            ilimitado: false,
            periodo: "mensal",
            chavePeriodo: mesReferencia,
            // Mantém campos legados para compatibilidade
            limiteTotal: limiteChat,
            usados: totalChatMes,
            restantes: restantesChat,
            podeUsar,
            // Campos detalhados por modalidade
            totalChatMes,
            restantesChat,
            limiteMensalChat: limiteChat,
            totalImagemMes,
            restantesImagem,
            limiteMensalImagem: limiteImagem,
            totalVideoMes,
            restantesVideo,
            limiteMensalVideo: limiteVideo,
            modalidadesPermitidas: ["CHAT", "IMAGEM", "VIDEO"],
            proximaRenovacao: renovacao
        };
    }
}

/**
 * Valida se o usuário tem permissão para usar uma modalidade específica
 */
async function validarAcessoIA(usuarioId, modalidade) {
    const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: { id: true, plano: true }
    });

    if (!usuario) {
        return {
            permitido: false,
            status: 401,
            erro: "Usuário não autenticado."
        };
    }

    const plano = usuario.plano;
    const modalidadeUpper = String(modalidade).toUpperCase();
    const mesReferencia = getMesReferencia();

    if (plano === "PRO") {
        const consumo = await obterConsumoUsuario(usuario.id, plano);
        return {
            permitido: true,
            plano,
            consumo
        };
    }

    // FREE: verifica o limite mensal independente de cada modalidade
    if (modalidadeUpper === "CHAT") {
        const totalChat = await prisma.usoIA.count({
            where: { usuarioId, mesReferencia, modalidade: "CHAT" }
        });
        if (totalChat >= LIMITES_IA.FREE.limiteMensalChat) {
            const consumo = await obterConsumoUsuario(usuario.id, plano);
            return {
                permitido: false,
                status: 429,
                erro: "Limite mensal de Chat com Chef IA atingido.",
                detalhe: `Você usou todos os ${LIMITES_IA.FREE.limiteMensalChat} chats gratuitos deste mês. Suas utilizações serão renovadas ${consumo.proximaRenovacao.texto}, ou conquiste o plano Saboré PRO no ranking mensal.`,
                requerPro: true,
                consumo
            };
        }
    } else if (modalidadeUpper === "IMAGEM") {
        const totalImagem = await prisma.usoIA.count({
            where: { usuarioId, mesReferencia, modalidade: "IMAGEM" }
        });
        if (totalImagem >= LIMITES_IA.FREE.limiteMensalImagem) {
            const consumo = await obterConsumoUsuario(usuario.id, plano);
            return {
                permitido: false,
                status: 429,
                erro: "Limite mensal de IA de Fotos atingido.",
                detalhe: `Você usou os ${LIMITES_IA.FREE.limiteMensalImagem} créditos gratuitos de IA de Fotos deste mês. Suas utilizações serão renovadas ${consumo.proximaRenovacao.texto}, ou conquiste o plano Saboré PRO no ranking mensal.`,
                requerPro: true,
                consumo
            };
        }
    } else if (modalidadeUpper === "VIDEO") {
        const totalVideo = await prisma.usoIA.count({
            where: { usuarioId, mesReferencia, modalidade: "VIDEO" }
        });
        if (totalVideo >= LIMITES_IA.FREE.limiteMensalVideo) {
            const consumo = await obterConsumoUsuario(usuario.id, plano);
            return {
                permitido: false,
                status: 429,
                erro: "Limite mensal de Importação de Vídeos atingido.",
                detalhe: `Você utilizou seus ${LIMITES_IA.FREE.limiteMensalVideo} créditos gratuitos de importação de vídeos deste mês. Suas utilizações serão renovadas ${consumo.proximaRenovacao.texto}, ou conquiste o plano Saboré PRO no ranking mensal para ter importações ilimitadas!`,
                requerPro: true,
                consumo
            };
        }
    }

    const consumo = await obterConsumoUsuario(usuario.id, plano);
    return {
        permitido: true,
        plano,
        consumo
    };
}

/**
 * Registra o consumo de IA apenas após execução bem-sucedida
 */
async function registrarUsoIASucesso(usuarioId, modalidade, plano) {
    if (!usuarioId) return null;
    const mesReferencia = getMesReferencia();
    const semanaChave = getSemanaChave();

    try {
        return await prisma.usoIA.create({
            data: {
                usuarioId,
                modalidade: String(modalidade).toUpperCase(),
                planoNoUso: plano,
                mesReferencia,
                semanaChave
            }
        });
    } catch (err) {
        console.error("[IA Usage] Erro ao registrar uso:", err.message);
        return null;
    }
}

module.exports = {
    LIMITES_IA,
    obterConsumoUsuario,
    validarAcessoIA,
    registrarUsoIASucesso,
    calcularProximaRenovacao
};
