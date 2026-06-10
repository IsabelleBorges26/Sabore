const prisma = require("../data/prisma");

const mockRecipesDatabase = [
    {
        title: 'Frango com Brócolis ao Limão e Alho',
        ingredients: ['Peito de Frango (500g, em cubos)', 'Brócolis (1 maço, picado)', 'Limão Siciliano (suco e raspas)', 'Dentes de Alho (3 unidades)', 'Azeite de Oliva', 'Sal e Pimenta'],
        steps: [
            'Aqueça o azeite em uma frigideira grande e doure os cubos de frango por 8 minutos até cozinharem por completo.',
            'Retire o frango e, na mesma frigideira, adicione o alho picado e o brócolis. Refogue por 5 minutos com um pingo de água.',
            'Volte o frango para a panela, adicione o suco do limão siciliano, as raspas e ajuste o sal e pimenta.',
            'Mexa bem por 2 minutos para incorporar todos os sabores e sirva imediatamente.'
        ],
        time: 20,
        difficulty: 'Fácil',
        diet: 'fit'
    },
    {
        title: 'Omelete de Queijo Cremosa com Ervas',
        ingredients: ['Ovos Frescos (3 unidades)', 'Queijo Parmesão Ralado (50g)', 'Manteiga (1 colher de sopa)', 'Cebolinha picada', 'Sal e Pimenta'],
        steps: [
            'Bata os ovos em uma tigela com garfo até espumar levemente. Tempere com sal e pimenta.',
            'Aqueça a frigideira antiaderente em fogo médio e derreta a manteiga.',
            'Adicione os ovos batidos e mexa as bordas em direção ao centro para criar camadas cremosas.',
            'Quando estiver quase firme mas ainda úmido no centro, espalhe o queijo e a cebolinha picada.',
            'Dobre a omelete ao meio e deslize suavemente para o prato.'
        ],
        time: 10,
        difficulty: 'Fácil',
        diet: 'none'
    },
    {
        title: 'Brownie de Caneca IA',
        ingredients: ['Chocolate em Pó (2 colheres de sopa)', 'Farinha de Trigo (2 colheres de sopa)', 'Açúcar (1.5 colheres de sopa)', 'Leite (2 colheres de sopa)', 'Manteiga Derretida (1 colher de sopa)'],
        steps: [
            'Em uma caneca apta para micro-ondas, junte todos os ingredientes secos e misture bem.',
            'Adicione o leite e a manteiga derretida. Mexa até obter uma massa homogênea.',
            'Leve ao micro-ondas em potência alta por cerca de 60 a 70 segundos.',
            'Deixe esfriar por 2 minutos (ele termina de assar fora do micro-ondas) e delicie-se!'
        ],
        time: 5,
        difficulty: 'Fácil',
        diet: 'vegetarian'
    },
    {
        title: 'Shakshuka de Queijo e Tomates',
        ingredients: ['Ovos (3 unidades)', 'Tomates Pelados (1 lata)', 'Cebola picada (1/2 unidade)', 'Queijo Parmesão ou Feta (80g)', 'Páprica defumada', 'Sal e Azeite'],
        steps: [
            'Refogue a cebola picada no azeite até murchar. Adicione a páprica defumada e misture.',
            'Despeje os tomates pelados na frigideira e amasse com uma colher. Deixe reduzir em fogo baixo por 8 minutos.',
            'Faça três pequenas cavidades no molho e quebre um ovo dentro de cada uma.',
            'Salpique o queijo por cima de todo o prato, tampe a panela e cozinhe por 5 minutos até os ovos firmarem no ponto desejado.',
            'Finalize com salsinha fresca e coma direto da panela com pão italiano.'
        ],
        time: 25,
        difficulty: 'Fácil',
        diet: 'vegetariano'
    }
];

const gerar = async (req, res) => {
    const { prompt, ingredients, maxTime, diet } = req.body;

    const searchStr = (prompt || ingredients || "").toLowerCase();
    const limitTime = Number(maxTime) || 30;

    try {
        let matched = null;

        // Try to find a match in the mock database using keyword matching
        for (const recipe of mockRecipesDatabase) {
            const matches = recipe.ingredients.some(ing => searchStr.includes(ing.split(' ')[0].toLowerCase()));
            if (matches) {
                matched = { ...recipe };
                break;
            }
        }

        if (!matched) {
            // Create a smart custom recipe based on the prompt/ingredients
            const cleanIngs = (ingredients || prompt || "Ingredientes")
                .split(",")
                .map(i => i.trim())
                .filter(i => i.length > 0);

            matched = {
                title: `Mix Saudável de ${cleanIngs[0] || 'Ingredientes'}`,
                ingredients: cleanIngs.map(k => `${k.charAt(0).toUpperCase() + k.slice(1)} (a gosto)`).concat(['Azeite de oliva', 'Sal e ervas a gosto']),
                steps: [
                    `Prepare e corte os ingredientes principais em pedaços pequenos.`,
                    `Aqueça uma frigideira com um fio de azeite e doure os ingredientes preparados.`,
                    `Adicione temperos secos, ervas finas e mexa bem.`,
                    `Tampe para abafar por cerca de 10 minutos em fogo brando.`,
                    `Sirva quente decorado com folhas frescas.`
                ],
                time: Math.min(limitTime, 15),
                difficulty: 'Fácil',
                diet: diet || 'none'
            };
        }

        // Adjust constraints
        if (matched.time > limitTime) {
            matched.time = limitTime;
        }

        if (diet && diet !== 'none') {
            matched.diet = diet;
        }

        res.status(200).json(matched);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao gerar receita por IA.", detalhe: error.message });
    }
};

module.exports = {
    gerar
};