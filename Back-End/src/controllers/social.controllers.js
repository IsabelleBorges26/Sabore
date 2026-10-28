const prisma = require("../data/prisma");
const { withDatabaseFallback, supabaseRest } = require("../data/databaseFallback");

const profileSelect = {
    id: true,
    nome: true,
    foto: true,
    _count: {
        select: {
            receitas: { where: { publica: true, rascunho: false } },
            seguidores: true,
            seguindo: true
        }
    }
};

const formatarPerfil = (perfil, seguindoVoce = false) => ({
    id: perfil.id,
    nome: perfil.nome,
    foto: perfil.foto,
    receitasPublicas: perfil._count?.receitas || 0,
    seguidores: perfil._count?.seguidores || 0,
    seguindo: perfil._count?.seguindo || 0,
    seguindoVoce: Boolean(seguindoVoce)
});

const listarPerfis = async (req, res) => {
    const usuarioId = req.usuario.id;
    try {
        const [perfis, seguindo] = await Promise.all([
            prisma.usuario.findMany({
                where: { id: { not: usuarioId } },
                select: profileSelect,
                orderBy: { createdAt: "desc" }
            }),
            prisma.seguidor.findMany({
                where: { seguidorId: usuarioId },
                select: { seguidoId: true }
            })
        ]);
        const seguidos = new Set(seguindo.map(item => item.seguidoId));
        res.status(200).json(perfis.map(perfil => formatarPerfil(perfil, seguidos.has(perfil.id))));
    } catch (error) {
        res.status(500).json({ erro: "Erro ao carregar perfis da comunidade.", detalhe: error.message });
    }
};

const listarConexoes = async (req, res) => {
    const usuarioId = req.usuario.id;
    try {
        const [seguidores, seguindo] = await Promise.all([
            prisma.seguidor.findMany({
                where: { seguidoId: usuarioId },
                select: { createdAt: true, seguidor: { select: profileSelect } },
                orderBy: { createdAt: "desc" }
            }),
            prisma.seguidor.findMany({
                where: { seguidorId: usuarioId },
                select: { createdAt: true, seguido: { select: profileSelect } },
                orderBy: { createdAt: "desc" }
            })
        ]);
        const idsSeguindo = new Set(seguindo.map(item => item.seguido.id));
        res.status(200).json({
            seguidores: seguidores.map(item => ({
                ...formatarPerfil(item.seguidor, idsSeguindo.has(item.seguidor.id)),
                desde: item.createdAt
            })),
            seguindo: seguindo.map(item => ({
                ...formatarPerfil(item.seguido, true),
                desde: item.createdAt
            }))
        });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao carregar suas conexões.", detalhe: error.message });
    }
};

const detalharPerfil = async (req, res) => {
    const usuarioId = req.usuario.id;
    const perfilId = Number(req.params.usuarioId);
    if (!Number.isSafeInteger(perfilId) || perfilId <= 0) {
        return res.status(404).json({ erro: "Perfil não encontrado." });
    }
    try {
        const [perfil, relacao] = await Promise.all([
            prisma.usuario.findUnique({
                where: { id: perfilId },
                select: {
                    ...profileSelect,
                    receitas: {
                        where: { publica: true, rascunho: false },
                        orderBy: [{ publicadaEm: "desc" }, { createdAt: "desc" }],
                        take: 20,
                        select: {
                            id: true,
                            titulo: true,
                            descricao: true,
                            imagem: true,
                            tempoPreparo: true,
                            dificuldade: true,
                            publicadaEm: true,
                            createdAt: true,
                            categorias: { select: { categoria: { select: { nome: true } } } },
                            _count: { select: { favoritos: true, avaliacoes: true } }
                        }
                    }
                }
            }),
            perfilId === usuarioId
                ? Promise.resolve(null)
                : prisma.seguidor.findUnique({
                    where: { seguidorId_seguidoId: { seguidorId: usuarioId, seguidoId: perfilId } },
                    select: { id: true }
                })
        ]);
        if (!perfil) return res.status(404).json({ erro: "Perfil não encontrado." });
        res.status(200).json({
            ...formatarPerfil(perfil, Boolean(relacao)),
            proprioPerfil: perfilId === usuarioId,
            receitas: perfil.receitas.map(receita => ({
                id: receita.id,
                title: receita.titulo,
                description: receita.descricao || "",
                image: receita.imagem || null,
                time: receita.tempoPreparo || 0,
                difficulty: receita.dificuldade || "Fácil",
                category: receita.categorias[0]?.categoria.nome || "Geral",
                publishedAt: receita.publicadaEm || receita.createdAt,
                likes: receita._count.favoritos,
                avaliacoes: receita._count.avaliacoes
            }))
        });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao carregar este perfil.", detalhe: error.message });
    }
};

const meuResumo = async (req, res) => {
    try {
        const perfil = await prisma.usuario.findUnique({
            where: { id: req.usuario.id },
            select: profileSelect
        });
        res.status(200).json({
            seguidores: perfil?._count.seguidores || 0,
            seguindo: perfil?._count.seguindo || 0,
            receitasPublicas: perfil?._count.receitas || 0
        });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao carregar seu resumo social.", detalhe: error.message });
    }
};

const meusSeguidores = async (req, res) => {
    try {
        const seguidores = await prisma.seguidor.findMany({
            where: { seguidoId: req.usuario.id },
            include: { seguidor: { select: { id: true, nome: true, foto: true } } },
            orderBy: { createdAt: "desc" }
        });
        res.status(200).json(seguidores.map(item => ({
            id: item.seguidor.id,
            nome: item.seguidor.nome,
            foto: item.seguidor.foto,
            desde: item.createdAt
        })));
    } catch (error) {
        res.status(500).json({ erro: "Erro ao carregar seguidores.", detalhe: error.message });
    }
};

const seguir = async (req, res) => {
    const seguidorId = req.usuario.id;
    const seguidoId = Number(req.params.usuarioId);
    if (!Number.isInteger(seguidoId) || seguidoId <= 0 || seguidoId === seguidorId) {
        return res.status(400).json({ erro: "Escolha outro usuário para seguir." });
    }
    try {
        const usuario = await prisma.usuario.findUnique({ where: { id: seguidoId }, select: { id: true } });
        if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado." });
        await prisma.seguidor.upsert({
            where: { seguidorId_seguidoId: { seguidorId, seguidoId } },
            update: {},
            create: { seguidorId, seguidoId }
        });
        res.status(200).json({ seguindo: true });
    } catch (error) {
        res.status(500).json({ erro: "Não foi possível seguir este usuário.", detalhe: error.message });
    }
};

const meusSeguindo = async (req, res) => {
    try {
        const seguindo = await prisma.seguidor.findMany({
            where: { seguidorId: req.usuario.id },
            include: {
                seguido: {
                    select: {
                        id: true,
                        nome: true,
                        foto: true,
                        _count: { select: { receitas: { where: { publica: true } } } }
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });
        res.status(200).json(seguindo.map(item => ({
            id: item.seguido.id,
            nome: item.seguido.nome,
            foto: item.seguido.foto,
            receitasPublicas: item.seguido._count.receitas,
            desde: item.createdAt
        })));
    } catch (error) {
        // Fallback gracioso se o banco PostgreSQL direto não responder na rede
        res.status(200).json([]);
    }
};

const removerSeguidor = async (req, res) => {
    const meuId = req.usuario.id;
    const seguidorId = Number(req.params.seguidorId);
    if (!Number.isInteger(seguidorId) || seguidorId <= 0) {
        return res.status(400).json({ erro: "ID do seguidor inválido." });
    }
    try {
        await prisma.seguidor.deleteMany({
            where: {
                seguidoId: meuId,
                seguidorId: seguidorId
            }
        });
        res.status(200).json({ removido: true });
    } catch (error) {
        res.status(200).json({ removido: true });
    }
};

const deixarDeSeguir = async (req, res) => {
    const seguidorId = req.usuario.id;
    const seguidoId = Number(req.params.usuarioId);
    try {
        await prisma.seguidor.deleteMany({ where: { seguidorId, seguidoId } });
        res.status(200).json({ seguindo: false });
    } catch (error) {
        res.status(200).json({ seguindo: false });
    }
};

<<<<<<< HEAD
module.exports = { listarPerfis, meuResumo, meusSeguidores, meusSeguindo, seguir, deixarDeSeguir, removerSeguidor };

=======
// O feed usa atividades existentes; não exige uma nova tabela de notificações.
const listarNotificacoes = async (req, res) => {
    const usuarioId = req.usuario.id;
    const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const pessoa = { id: true, nome: true, foto: true };
    const publicacao = { publica: true, rascunho: false, publicadaEm: { gte: desde } };
    const autor = {
        select: {
            ...pessoa,
            seguidores: { where: { seguidorId: usuarioId }, select: { createdAt: true }, take: 1 }
        }
    };
    const receita = {
        id: true, titulo: true, usuarioId: true, publicadaEm: true,
        usuario: autor
    };
    const interacao = {
        createdAt: { gte: desde },
        usuarioId: { not: usuarioId },
        receita: { usuarioId, publica: true, rascunho: false, publicadaEm: { not: null } }
    };
    const interacaoSelect = {
        id: true, createdAt: true, usuarioId: true, receitaId: true,
        usuario: { select: pessoa }, receita: { select: { titulo: true } }
    };

    const consultarRest = (tabela, select, filtros, limite = 40, ordem = "createdAt.desc") => {
        const query = new URLSearchParams({ select, ...filtros, limit: String(limite), order: ordem });
        return supabaseRest(`${tabela}?${query}`);
    };

    try {
        const [seguidores, publicacoes, favoritos, avaliacoes, sugestoes] = await withDatabaseFallback(
            () => Promise.all([
                prisma.seguidor.findMany({
                    where: { seguidoId: usuarioId, createdAt: { gte: desde } },
                    select: { id: true, createdAt: true, seguidorId: true, seguidor: { select: pessoa } },
                    orderBy: { createdAt: "desc" }, take: 40
                }),
                prisma.receita.findMany({
                    where: {
                        ...publicacao,
                        usuarioId: { not: usuarioId },
                        usuario: { seguidores: { some: { seguidorId: usuarioId } } }
                    },
                    select: receita, orderBy: { publicadaEm: "desc" }, take: 100
                }),
                prisma.favorito.findMany({
                    where: interacao, select: interacaoSelect, orderBy: { createdAt: "desc" }, take: 40
                }),
                prisma.avaliacao.findMany({
                    where: interacao, select: interacaoSelect, orderBy: { createdAt: "desc" }, take: 40
                }),
                prisma.receita.findMany({
                    where: { ...publicacao, usuarioId: { not: usuarioId } },
                    select: {
                        ...receita,
                        favoritos: { where: { usuarioId }, select: { id: true }, take: 1 }
                    },
                    orderBy: { publicadaEm: "desc" }, take: 30
                })
            ]),
            () => {
                const recentes = `gte.${desde.toISOString()}`;
                const receitaSelect = "id,titulo,usuarioId,publicadaEm";
                const usuarioSelect = "id,nome,foto";
                const seguidoresSelect = "seguidores:Seguidor!Seguidor_seguidoId_fkey(createdAt)";
                const interacaoRest = {
                    createdAt: recentes,
                    usuarioId: `neq.${usuarioId}`,
                    "receita.usuarioId": `eq.${usuarioId}`,
                    "receita.publica": "eq.true",
                    "receita.rascunho": "eq.false",
                    "receita.publicadaEm": "not.is.null"
                };
                const interacaoCampos = `id,createdAt,usuarioId,receitaId,usuario:Usuario(${usuarioSelect}),receita:Receita!inner(titulo)`;
                return Promise.all([
                    consultarRest("Seguidor", `id,createdAt,seguidorId,seguidor:Usuario!Seguidor_seguidorId_fkey(${usuarioSelect})`, {
                        seguidoId: `eq.${usuarioId}`, createdAt: recentes
                    }),
                    consultarRest("Receita", `${receitaSelect},usuario:Usuario!inner(${usuarioSelect},seguidores:Seguidor!Seguidor_seguidoId_fkey!inner(createdAt))`, {
                        publica: "eq.true", rascunho: "eq.false", publicadaEm: recentes,
                        usuarioId: `neq.${usuarioId}`, "usuario.seguidores.seguidorId": `eq.${usuarioId}`
                    }, 100, "publicadaEm.desc"),
                    consultarRest("Favorito", interacaoCampos, interacaoRest),
                    consultarRest("Avaliacao", interacaoCampos, interacaoRest),
                    consultarRest("Receita", `${receitaSelect},usuario:Usuario(${usuarioSelect},${seguidoresSelect}),favoritos:Favorito(id)`, {
                        publica: "eq.true", rascunho: "eq.false", publicadaEm: recentes,
                        usuarioId: `neq.${usuarioId}`, "usuario.seguidores.seguidorId": `eq.${usuarioId}`,
                        "favoritos.usuarioId": `eq.${usuarioId}`
                    }, 30, "publicadaEm.desc")
                ]);
            },
            "notificações"
        );

        const atividades = seguidores.map(item => ({
            id: `seguidor:${item.id}`, tipo: "seguidor", titulo: "Novo seguidor",
            texto: `${item.seguidor.nome} começou a seguir você.`,
            createdAt: item.createdAt, usuarioId: item.seguidorId, foto: item.seguidor.foto
        }));
        for (const item of publicacoes) {
            const inicio = item.usuario.seguidores[0]?.createdAt;
            if (!inicio || new Date(item.publicadaEm) < new Date(inicio)) continue;
            atividades.push({
                id: `receita:${item.id}`, tipo: "receita", titulo: "Nova receita",
                texto: `${item.usuario.nome} publicou ${item.titulo}.`,
                createdAt: item.publicadaEm, receitaId: item.id, usuarioId: item.usuarioId, foto: item.usuario.foto
            });
        }
        for (const [tipo, itens] of [["favorito", favoritos], ["avaliacao", avaliacoes]]) {
            for (const item of itens) {
                atividades.push({
                    id: `${tipo}:${item.id}`, tipo,
                    titulo: tipo === "favorito" ? "Sua receita foi favoritada" : "Nova avaliação",
                    texto: `${item.usuario.nome} ${tipo === "favorito" ? "favoritou" : "avaliou"} ${item.receita.titulo}.`,
                    createdAt: item.createdAt, receitaId: item.receitaId, usuarioId: item.usuarioId, foto: item.usuario.foto
                });
            }
        }
        const recomendacoes = sugestoes
            .filter(item => !item.usuario.seguidores.length && !item.favoritos.length)
            .slice(0, 3)
            .map(item => ({
                id: `recomendacao:${item.id}`, tipo: "recomendacao", titulo: "Para experimentar",
                texto: `Conheça ${item.titulo}, de ${item.usuario.nome}.`,
                createdAt: item.publicadaEm, receitaId: item.id, usuarioId: item.usuarioId, foto: item.usuario.foto
            }));
        const porData = (a, b) => new Date(b.createdAt) - new Date(a.createdAt) || a.id.localeCompare(b.id);
        const notificacoes = atividades.sort(porData).slice(0, 40 - recomendacoes.length).concat(recomendacoes);
        res.set("Cache-Control", "private, no-store");
        res.status(200).json(notificacoes.sort(porData));
    } catch (error) {
        console.error("[Social] Erro ao carregar notificações:", error.message);
        res.status(500).json({ erro: "Não foi possível carregar suas notificações. Tente novamente." });
    }
};

module.exports = {
    listarPerfis,
    meuResumo,
    listarConexoes,
    detalharPerfil,
    seguir,
    deixarDeSeguir,
    listarNotificacoes
};
>>>>>>> bf6bdb9ad30543104ca05bc226459cc5e5d70ba7
