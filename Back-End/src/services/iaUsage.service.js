const prisma = require("../data/prisma");
const { getMesReferencia, getSemanaChave, getSaoPauloDate } = require("./engajamento.service");

// Limites configuráveis de utilização de IA
const LIMITES_IA = {
    FREE: {
        limiteMensalChat: 5,
        limiteMensalImagem: 2,
        permiteImagem: true, // agora FREE pode usar, mas tem limite mensal
        permiteVideo: false
    },
    PRO: {
        limiteSemanalTotal: 10,
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
        // Renova na próxima segunda-feira às 00:00 (America/Sao_Paulo)
        const diaSemana = sp.getDay(); // 0 = domingo, 1 = segunda
        const diasAteSegunda = ((8 - diaSemana) % 7) || 7;
        const prox = new Date(sp.getTime() + diasAteSegunda * 24 * 60 * 60 * 1000);
        prox.setHours(0, 0, 0, 0);
        return {
            tipo: "semanal",
            data: prox.toISOString(),
            texto: `na próxima segunda-feira (${prox.toLocaleDateString("pt-BR")})`
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
        const totalUsosSemana = await prisma.usoIA.count({
            where: {
                usuarioId,
                semanaChave
            }
        });

        const limite = LIMITES_IA.PRO.limiteSemanalTotal;
        const restantes = Math.max(0, limite - totalUsosSemana);
        const podeUsar = restantes > 0;
        const renovacao = calcularProximaRenovacao("PRO");

        return {
            plano: "PRO",
            periodo: "semanal",
            chavePeriodo: semanaChave,
            limiteTotal: limite,
            usados: totalUsosSemana,
            restantes,
            podeUsar,
            modalidadesPermitidas: ["CHAT", "IMAGEM", "VIDEO"],
            proximaRenovacao: renovacao
        };
    } else {
        // FREE: controle separado por modalidade, ambos mensais
        const totalChatMes = await prisma.usoIA.count({
            where: {
                usuarioId,
                mesReferencia,
                modalidade: "CHAT"
            }
        });

        const totalImagemMes = await prisma.usoIA.count({
            where: {
                usuarioId,
                mesReferencia,
                modalidade: "IMAGEM"
            }
        });

        const limiteChat = LIMITES_IA.FREE.limiteMensalChat;
        const limiteImagem = LIMITES_IA.FREE.limiteMensalImagem;
        const restantesChat = Math.max(0, limiteChat - totalChatMes);
        const restantesImagem = Math.max(0, limiteImagem - totalImagemMes);
        const podeUsar = restantesChat > 0 || restantesImagem > 0;
        const renovacao = calcularProximaRenovacao("FREE");

        return {
            plano: "FREE",
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
            modalidadesPermitidas: ["CHAT", "IMAGEM"],
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

    // Verificação de modalidade por plano
    if (plano === "FREE") {
        if (modalidadeUpper === "VIDEO") {
            return {
                permitido: false,
                status: 403,
                erro: "Recurso exclusivo do plano Saboré PRO.",
                detalhe: "A geração de vídeo é exclusiva do plano PRO. Participe do ranking mensal para conquistar o plano PRO gratuitamente!",
                requerPro: true
            };
        }
        // CHAT e IMAGEM são permitidos para FREE, mas sujeitos a limites mensais
    }

    // Verificação de cota por modalidade
    const mesReferencia = getMesReferencia();
    const semanaChave = getSemanaChave();

    if (plano === "PRO") {
        const totalUsosSemana = await prisma.usoIA.count({
            where: { usuarioId, semanaChave }
        });
        const limite = LIMITES_IA.PRO.limiteSemanalTotal;
        if (totalUsosSemana >= limite) {
            const consumo = await obterConsumoUsuario(usuario.id, plano);
            return {
                permitido: false,
                status: 429,
                erro: "Limite semanal de utilização de IA atingido.",
                detalhe: `Você consumiu suas ${limite} utilizações desta semana. Suas utilizações serão renovadas ${consumo.proximaRenovacao.texto}.`,
                consumo
            };
        }
    } else {
        // FREE: verifica o limite da modalidade específica
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
                    detalhe: `Você usou todos os ${LIMITES_IA.FREE.limiteMensalChat} chats deste mês. Suas utilizações serão renovadas ${consumo.proximaRenovacao.texto}.`,
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
                    detalhe: `Você usou os ${LIMITES_IA.FREE.limiteMensalImagem} créditos de IA de Fotos deste mês. Suas utilizações serão renovadas ${consumo.proximaRenovacao.texto}.`,
                    consumo
                };
            }
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
