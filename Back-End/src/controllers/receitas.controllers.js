const prisma = require("../data/prisma");
const parseIngredient = (input) => {
    let str = "";
    if (typeof input === "string") {
        str = input;
    } else if (input && typeof input === "object") {
        str = input.nome || input.name || input.ingrediente || String(input);
    } else {
        str = String(input || "");
    }
    const cleanStr = str.trim();
    if (!cleanStr) return { quantidade: "", nome: "" };
    const match = cleanStr.match(/^(\d+(?:\/\d+)?(?:\.\d+)?\s*(?:g|ml|kg|xícara|xícaras|colher|colheres|dente|dentes|folha|folhas|unidade|unidades|fatia|fatias|copo|copos|lata|latas|colher de sopa|colheres de sopa|colher de chá|colheres de chá)?)\s+(.+)$/i);
    if (match) {
        return { quantidade: match[1].trim(), nome: match[2].trim() };
    }
    return { quantidade: "", nome: cleanStr };
};
const formatRecipe = (recipe) => {
    return {
        id: recipe.id,
        title: recipe.titulo,
        description: recipe.descricao,
        difficulty: recipe.dificuldade || "Fácil",
        time: recipe.tempoPreparo || 0,
        public: recipe.publica,
        communityPublished: Boolean(recipe.publicadaEm),
        image: recipe.imagem || null,
        criadaPorIA: recipe.criadaPorIA,
        rascunho: recipe.rascunho,
        linkImportacao: recipe.linkImportacao,
        livroId: recipe.livroId,
        authorId: recipe.usuarioId,
        author: recipe.usuario ? recipe.usuario.nome : "Chef",
        authorAvatar: recipe.usuario?.foto || null,
        likes: recipe._count?.favoritos || 0,
        avaliacoes: recipe._count?.avaliacoes || 0,
        interacoes: (recipe._count?.favoritos || 0) + (recipe._count?.avaliacoes || 0),
        category: recipe.categorias && recipe.categorias.length > 0 ? recipe.categorias[0].categoria.nome : "Geral",
        categories: recipe.categorias ? recipe.categorias.map(rc => rc.categoria.nome) : [],
        ingredients: recipe.ingredientes ? recipe.ingredientes.map(ri => {
            if (ri.quantidade) {
                return `${ri.quantidade} ${ri.ingrediente.nome}`;
            }
            return ri.ingrediente.nome;
        }) : [],
        steps: recipe.modoPreparo ? recipe.modoPreparo.split("\n") : []
    };
};
const cadastrar = async (req, res) => {
    const usuarioId = req.usuario.id;
    const { 
        titulo, 
        descricao, 
        modoPreparo, 
        steps, 
        tempoPreparo, 
        time, 
        publica, 
        public: frontendPublic, 
        imagem, 
        image, 
        dificuldade, 
        criadaPorIA, 
        rascunho, 
        linkImportacao, 
        livroId,
        ingredients, 
        ingredientes, 
        categories, 
        categorias 
    } = req.body;
    if (!titulo) {
        return res.status(400).json({ erro: "O título da receita é obrigatório." });
    }
    const finalSteps = steps || (modoPreparo ? [modoPreparo] : []);
    const prepStepsString = Array.isArray(finalSteps) ? finalSteps.join("\n") : (modoPreparo || "");
    const finalTime = time !== undefined ? Number(time) : (tempoPreparo !== undefined ? Number(tempoPreparo) : 15);
    const finalPublic = frontendPublic !== undefined ? Boolean(frontendPublic) : Boolean(publica);
    const finalImage = image || imagem || null;
    const finalIngredients = ingredients || ingredientes || [];
    const finalCategories = categories || categorias || [];
    let validLivroId = null;
    if (livroId) {
        const parsedLivroId = Number(livroId);
        if (!isNaN(parsedLivroId) && parsedLivroId > 0) {
            const livroExiste = await prisma.livro.findFirst({
                where: { id: parsedLivroId, usuarioId }
            });
            if (livroExiste) {
                validLivroId = parsedLivroId;
            } else {
                return res.status(403).json({ erro: "O livro selecionado não pertence à sua conta ou não existe." });
            }
        }
    }
    try {
        const result = await prisma.$transaction(async (tx) => {
            const recipe = await tx.receita.create({
                data: {
                    titulo,
                    descricao: descricao || "",
                    modoPreparo: prepStepsString,
                    tempoPreparo: finalTime,
                    publica: finalPublic,
                    publicadaEm: finalPublic ? new Date() : null,
                    imagem: finalImage,
                    dificuldade: dificuldade || "Fácil",
                    criadaPorIA: Boolean(criadaPorIA),
                    rascunho: Boolean(rascunho),
                    linkImportacao: linkImportacao || null,
                    usuarioId,
                    livroId: validLivroId
                }
            });
            const createdIngredienteIds = new Set();
            for (const ingStr of finalIngredients) {
                const parsed = parseIngredient(ingStr);
                if (!parsed.nome) continue;
                const ingrediente = await tx.ingrediente.upsert({
                    where: { nome: parsed.nome.toLowerCase() },
                    update: {},
                    create: { nome: parsed.nome.toLowerCase() }
                });
                if (!createdIngredienteIds.has(ingrediente.id)) {
                    createdIngredienteIds.add(ingrediente.id);
                    await tx.receitaIngrediente.create({
                        data: {
                            quantidade: parsed.quantidade || "",
                            receitaId: recipe.id,
                            ingredienteId: ingrediente.id
                        }
                    });
                }
            }
            const createdCategoriaIds = new Set();
            for (const catStr of finalCategories) {
                if (!catStr) continue;
                const catNameClean = (typeof catStr === "string" ? catStr : String(catStr)).trim();
                if (!catNameClean) continue;
                const categoria = await tx.categoria.upsert({
                    where: { nome: catNameClean },
                    update: {},
                    create: { nome: catNameClean }
                });
                if (!createdCategoriaIds.has(categoria.id)) {
                    createdCategoriaIds.add(categoria.id);
                    await tx.receitaCategoria.create({
                        data: {
                            receitaId: recipe.id,
                            categoriaId: categoria.id
                        }
                    });
                }
            }
            return recipe;
        });
        const fullRecipe = await prisma.receita.findUnique({
            where: { id: result.id },
            include: {
                usuario: true,
                ingredientes: {
                    include: { ingrediente: true }
                },
                categorias: {
                    include: { categoria: true }
                },
                _count: { select: { favoritos: true } }
            }
        });
        res.status(201).json(formatRecipe(fullRecipe));
    } catch (error) {
        console.error("[Receitas Controller] Erro ao cadastrar receita:", error);
        res.status(500).json({ erro: "Erro ao cadastrar receita.", detalhe: error.message });
    }
};
const listar = async (req, res) => {
    const usuarioId = req.usuario.id;
    const { livroId } = req.query;
    try {
        const filters = { usuarioId };
        if (livroId) {
            filters.livroId = Number(livroId);
        }
        const receitas = await prisma.receita.findMany({
            where: filters,
            include: {
                usuario: true,
                ingredientes: {
                    include: { ingrediente: true }
                },
                categorias: {
                    include: { categoria: true }
                },
                _count: { select: { favoritos: true } }
            },
            orderBy: { createdAt: "desc" }
        });
        res.status(200).json(receitas.map(formatRecipe));
    } catch (error) {
        res.status(500).json({ erro: "Erro ao listar receitas.", detalhe: error.message });
    }
};
const listarPublicas = async (req, res) => {
    try {
        const receitas = await prisma.receita.findMany({
            where: { publica: true, publicadaEm: { not: null } },
            include: {
                usuario: true,
                ingredientes: {
                    include: { ingrediente: true }
                },
                categorias: {
                    include: { categoria: true }
                },
                _count: { select: { favoritos: true, avaliacoes: true } }
            },
            orderBy: { createdAt: "desc" }
        });
        res.status(200).json(receitas.map(formatRecipe));
    } catch (error) {
        res.status(500).json({ erro: "Erro ao listar receitas públicas.", detalhe: error.message });
    }
};
const buscar = async (req, res) => {
    const { id } = req.params;
    try {
        const recipe = await prisma.receita.findUnique({
            where: { id: Number(id) },
            include: {
                usuario: true,
                ingredientes: {
                    include: { ingrediente: true }
                },
                categorias: {
                    include: { categoria: true }
                }
            }
        });
        if (!recipe) {
            return res.status(404).json({ erro: "Receita não encontrada." });
        }
        res.status(200).json(formatRecipe(recipe));
    } catch (error) {
        res.status(500).json({ erro: "Erro ao buscar receita.", detalhe: error.message });
    }
};
const atualizar = async (req, res) => {
    const { id } = req.params;
    const usuarioId = req.usuario.id;
    const { 
        titulo, 
        descricao, 
        modoPreparo, 
        steps,
        tempoPreparo, 
        time,
        publica, 
        public: frontendPublic,
        imagem, 
        image,
        dificuldade, 
        livroId,
        ingredients,
        ingredientes,
        categories,
        categorias
    } = req.body;
    try {
        const existing = await prisma.receita.findUnique({
            where: { id: Number(id) }
        });
        if (!existing) {
            return res.status(404).json({ erro: "Receita não encontrada." });
        }
        if (existing.usuarioId !== usuarioId) {
            return res.status(403).json({ erro: "Acesso negado. Você não é o dono desta receita." });
        }
        const finalSteps = steps || (modoPreparo ? [modoPreparo] : undefined);
        const prepStepsString = Array.isArray(finalSteps) ? finalSteps.join("\n") : modoPreparo;
        const finalTime = time !== undefined ? Number(time) : (tempoPreparo !== undefined ? Number(tempoPreparo) : undefined);
        const finalPublic = frontendPublic !== undefined ? Boolean(frontendPublic) : (publica !== undefined ? Boolean(publica) : undefined);
        const finalImage = image || imagem;
        const finalIngredients = ingredients || ingredientes;
        const finalCategories = categories || categorias;
        const updated = await prisma.$transaction(async (tx) => {
            const dataToUpdate = {};
            if (titulo) dataToUpdate.titulo = titulo;
            if (descricao !== undefined) dataToUpdate.descricao = descricao;
            if (prepStepsString !== undefined) dataToUpdate.modoPreparo = prepStepsString;
            if (finalTime !== undefined) dataToUpdate.tempoPreparo = finalTime;
            if (finalPublic !== undefined) {
                dataToUpdate.publica = finalPublic;
                dataToUpdate.publicadaEm = finalPublic ? new Date() : null;
            }
            if (finalImage !== undefined) dataToUpdate.imagem = finalImage;
            if (dificuldade) dataToUpdate.dificuldade = dificuldade;
            if (livroId !== undefined) dataToUpdate.livroId = livroId ? Number(livroId) : null;
            const r = await tx.receita.update({
                where: { id: Number(id) },
                data: dataToUpdate
            });
            if (finalIngredients) {
                await tx.receitaIngrediente.deleteMany({
                    where: { receitaId: r.id }
                });
                for (const ingStr of finalIngredients) {
                    const parsed = parseIngredient(ingStr);
                    const ingrediente = await tx.ingrediente.upsert({
                        where: { nome: parsed.nome.toLowerCase() },
                        update: {},
                        create: { nome: parsed.nome.toLowerCase() }
                    });
                    await tx.receitaIngrediente.create({
                        data: {
                            quantidade: parsed.quantidade,
                            receitaId: r.id,
                            ingredienteId: ingrediente.id
                        }
                    });
                }
            }
            if (finalCategories) {
                await tx.receitaCategoria.deleteMany({
                    where: { receitaId: r.id }
                });
                for (const catStr of finalCategories) {
                    const catNameClean = catStr.trim();
                    const categoria = await tx.categoria.upsert({
                        where: { nome: catNameClean },
                        update: {},
                        create: { nome: catNameClean }
                    });
                    await tx.receitaCategoria.create({
                        data: {
                            receitaId: r.id,
                            categoriaId: categoria.id
                        }
                    });
                }
            }
            return r;
        });
        const fullRecipe = await prisma.receita.findUnique({
            where: { id: updated.id },
            include: {
                usuario: true,
                ingredientes: {
                    include: { ingrediente: true }
                },
                categorias: {
                    include: { categoria: true }
                }
            }
        });
        res.status(200).json(formatRecipe(fullRecipe));
    } catch (error) {
        res.status(500).json({ erro: "Erro ao atualizar receita.", detalhe: error.message });
    }
};
const excluir = async (req, res) => {
    const { id } = req.params;
    const usuarioId = req.usuario.id;
    try {
        const recipe = await prisma.receita.findUnique({
            where: { id: Number(id) }
        });
        if (!recipe) {
            return res.status(404).json({ erro: "Receita não encontrada." });
        }
        if (recipe.usuarioId !== usuarioId) {
            return res.status(403).json({ erro: "Acesso negado. Você não é o dono desta receita." });
        }
        await prisma.receita.delete({
            where: { id: Number(id) }
        });
        res.status(200).json({ mensagem: "Receita excluída com sucesso." });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao excluir receita.", detalhe: error.message });
    }
};
const DESAFIOS_SEMANAIS = [
    {
        id: "inverno",
        title: "Receitas de Inverno & Conforto ❄️",
        hashtag: "#DesafioInverno",
        badge: "Chef Invernal",
        description: "Crie um prato quente, sopa encorpada ou bebida cremosa para aquecer a comunidade Saboré!"
    },
    {
        id: "massas",
        title: "Festival de Massas Artesanais 🍝",
        hashtag: "#DesafioMassas",
        badge: "Mestre das Massas",
        description: "Prepare uma massa fresca caseira ou um molho artesanal autêntico da nonna."
    },
    {
        id: "fit",
        title: "Marmita Fit & Alta Performance 🥗",
        hashtag: "#DesafioFit",
        badge: "Chef Saudável",
        description: "Compartilhe uma refeição equilibrada, nutritiva e prática para o dia a dia fitness."
    },
    {
        id: "doces",
        title: "Doces & Sobremesas de Sonho 🍓",
        hashtag: "#DesafioDoces",
        badge: "Confeiteiro Saboré",
        description: "Surpreenda a comunidade com tortas, bolos, mousses ou doces artesanais irresistíveis."
    },
    {
        id: "oriental",
        title: "Uma Viagem à Cozinha Oriental 🥢",
        hashtag: "#DesafioOriental",
        badge: "Chef Oriental",
        description: "Traga o melhor da culinária asiática: sushis, woks, ramens ou yakisobas aromáticos."
    },
    {
        id: "brunch",
        title: "Café da Manhã de Cinema ☕",
        hashtag: "#DesafioBrunch",
        badge: "Mestre do Brunch",
        description: "Pães quentinhos, ovos especiais, panquecas ou tigelas de açaí para começar o dia no topo."
    },
    {
        id: "burger",
        title: "Hambúrguer Gourmet Caseiro 🍔",
        hashtag: "#DesafioBurger",
        badge: "Burger Master",
        description: "Monte um burger autoral: combine seu blend especial, molhos caseiros e queijos derretidos."
    },
    {
        id: "sustentavel",
        title: "Cozinha Sustentável & Zero Desperdício 🌿",
        hashtag: "#DesafioSustentavel",
        badge: "Chef Consciente",
        description: "Use talos, cascas e sobras nobres para criar pratos deliciosos e sustentáveis."
    },
    {
        id: "risotos",
        title: "Mestres do Risoto Cremoso 🍚",
        hashtag: "#DesafioRisoto",
        badge: "Rei do Risoto",
        description: "Acerte no ponto perfeito da textura e emulsão de um risoto sofisticado."
    },
    {
        id: "petiscos",
        title: "Comida de Boteco & Petiscos 🥟",
        hashtag: "#DesafioPetiscos",
        badge: "Chef Boêmio",
        description: "Pastéis, croquetes, bolinhos de arroz e petiscos crocantes para celebrar com amigos."
    },
    {
        id: "brasil",
        title: "Sabores Regionais do Brasil 🥘",
        hashtag: "#DesafioBrasil",
        badge: "Chef Raiz",
        description: "Celebre nossa culinária: moquecas, baião de dois, feijão tropeiro e temperos típicos."
    },
    {
        id: "rapido",
        title: "Prato Incrível em 15 Minutos ⏱️",
        hashtag: "#Desafio15Min",
        badge: "Chef Relâmpago",
        description: "Mostre que agilidade e alto sabor andam juntos em receitas rápidas do dia a dia."
    }
];

const listarHashtagsEmAlta = async (req, res) => {
    try {
        const receitas = await prisma.receita.findMany({
            where: { publica: true, publicadaEm: { not: null } },
            include: {
                categorias: {
                    include: { categoria: true }
                },
                _count: { select: { favoritos: true, avaliacoes: true } }
            }
        });

        const hashtagMap = new Map();

        for (const rec of receitas) {
            const likes = rec._count?.favoritos || 0;
            const avaliacoes = rec._count?.avaliacoes || 0;
            const interacoes = likes + avaliacoes;

            const tags = new Set();
            if (rec.categorias) {
                for (const rc of rec.categorias) {
                    if (rc.categoria && rc.categoria.nome) {
                        const clean = rc.categoria.nome.trim().toLowerCase().replace(/\s+/g, '');
                        if (clean) tags.add(clean.startsWith('#') ? clean : `#${clean}`);
                    }
                }
            }

            const text = `${rec.titulo || ''} ${rec.descricao || ''}`;
            const matches = text.match(/#([a-zA-Z0-9_\u00C0-\u017F]+)/g);
            if (matches) {
                for (const m of matches) {
                    tags.add(m.toLowerCase());
                }
            }

            for (const tag of tags) {
                if (!hashtagMap.has(tag)) {
                    hashtagMap.set(tag, { tag, interacoes: 0, receitas: 0 });
                }
                const entry = hashtagMap.get(tag);
                entry.interacoes += interacoes;
                entry.receitas += 1;
            }
        }

        // Exibir apenas as hashtags que realmente estão em alta (com interações > 0)
        const emAlta = Array.from(hashtagMap.values())
            .filter(item => item.interacoes > 0)
            .sort((a, b) => b.interacoes - a.interacoes || b.receitas - a.receitas);

        res.status(200).json(emAlta);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao buscar hashtags em alta.", detalhe: error.message });
    }
};

const obterDesafioSemanal = async (req, res) => {
    try {
        const now = new Date();
        const target = new Date(now.valueOf());
        const dayNr = (now.getDay() + 6) % 7;
        target.setDate(target.getDate() - dayNr + 3);
        const firstThursday = target.valueOf();
        target.setMonth(0, 1);
        if (target.getDay() !== 4) {
            target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
        }
        const weekNumber = 1 + Math.ceil((firstThursday - target) / 604800000);
        const year = now.getFullYear();

        const dayOfWeek = now.getDay();
        const daysRemaining = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;

        const weekSeed = year * 53 + weekNumber;
        const index = Math.abs(weekSeed) % DESAFIOS_SEMANAIS.length;
        const desafio = DESAFIOS_SEMANAIS[index];

        const cleanTag = desafio.hashtag.replace(/^#/, "").toLowerCase();
        const receitasCount = await prisma.receita.count({
            where: {
                publica: true,
                publicadaEm: { not: null },
                OR: [
                    { categorias: { some: { categoria: { nome: { contains: cleanTag, mode: "insensitive" } } } } },
                    { titulo: { contains: desafio.hashtag, mode: "insensitive" } },
                    { descricao: { contains: desafio.hashtag, mode: "insensitive" } }
                ]
            }
        }).catch(() => 0);

        res.status(200).json({
            ...desafio,
            weekNumber,
            year,
            daysRemaining,
            timeRemainingText: daysRemaining === 0 ? "Termina hoje às 23:59!" : `Termina em ${daysRemaining} dia${daysRemaining > 1 ? "s" : ""}`,
            recipesCount: receitasCount,
            participantsCount: Math.max(receitasCount * 3 + 14, 25)
        });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao obter desafio semanal.", detalhe: error.message });
    }
};

module.exports = {
    cadastrar,
    listar,
    listarPublicas,
    buscar,
    atualizar,
    excluir,
    listarHashtagsEmAlta,
    obterDesafioSemanal
};
