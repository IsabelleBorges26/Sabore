const prisma = require("../data/prisma");

const systemPrompt = `Você é o Chef Saboré IA, um assistente culinário pessoal inteligente.
O usuário enviará uma solicitação de receita ou ingredientes, juntamente com o seu perfil e histórico.
Sua tarefa é gerar uma receita perfeitamente adequada que respeite as restrições e preferências alimentares do usuário, adaptando sua comunicação de forma inteligente.

Você DEVE responder EXCLUSIVAMENTE com um objeto JSON válido, sem qualquer texto adicional antes ou depois. Não use blocos de código de markdown. Não use \`\`\`json no início nem \`\`\` no fim. Retorne apenas o JSON bruto.

O JSON gerado deve seguir exatamente a seguinte estrutura:
{
  "title": "Nome da Receita",
  "description": "Texto em Markdown contendo a introdução do Chef com tom adaptado, seguido de uma tabela nutricional detalhada (Calorias, Proteínas, Carboidratos, Gorduras) formatada como tabela em Markdown (| Macro | Quantidade |), e dicas adicionais baseadas no perfil do usuário.",
  "ingredients": ["Ingrediente 1 com quantidade", "Ingrediente 2 com quantidade", ...],
  "steps": ["Passo 1 do modo de preparo", "Passo 2 do modo de preparo", ...],
  "time": tempo_em_minutos_como_numero,
  "difficulty": "Fácil" ou "Médio" ou "Difícil",
  "category": "Categoria da receita (ex: Fit, Sobremesa, Vegano, Massas, etc.)"
}`;

function parseJSONRecipe(text) {
    text = text.trim();
    
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
        text = match[1].trim();
    }
    
    try {
        return JSON.parse(text);
    } catch (e) {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
            const potentialJson = text.substring(start, end + 1);
            try {
                return JSON.parse(potentialJson);
            } catch (innerErr) {
            }
        }
        throw e;
    }
}

const gerar = async (req, res) => {
    const usuarioId = req.usuario.id;
    const { prompt, ingredients, maxTime, diet, difficulty, servings, userBio, userPrefs } = req.body;

    let userFavorites = [];
    let userBooks = [];

    try {
        const favoritos = await prisma.favorito.findMany({
            where: { usuarioId },
            include: {
                receita: {
                    select: {
                        titulo: true,
                        dificuldade: true,
                        tempoPreparo: true
                    }
                }
            }
        });
        userFavorites = favoritos.map(f => f.receita);

        const livros = await prisma.livro.findMany({
            where: { usuarioId },
            select: {
                titulo: true,
                tag: true,
                _count: {
                    select: { receitas: true }
                }
            }
        });
        userBooks = livros;
    } catch (dbErr) {
    }

    let contextInstructions = "";
    if (userFavorites.length > 0) {
        contextInstructions += `\nReceitas Favoritas do Usuário:\n` + userFavorites.map(f => `- ${f.titulo} (${f.dificuldade || 'Fácil'}, ${f.tempoPreparo || 15} min)`).join("\n");
    }
    if (userBooks.length > 0) {
        contextInstructions += `\nColeções/Livros de Receita do Usuário:\n` + userBooks.map(b => `- ${b.titulo} (Tag: ${b.tag}, contendo ${b._count.receitas} receitas)`).join("\n");
    }
    if (userBio) {
        contextInstructions += `\nObjetivo/Biografia do Usuário: "${userBio}"`;
    }
    if (userPrefs) {
        contextInstructions += `\nPreferências Culinárias: [${userPrefs}]`;
    }

    const userPrompt = `Quero uma receita baseada no seguinte pedido: "${prompt || 'Qualquer receita interessante'}".
Ingredientes adicionais da minha geladeira para usar: [${ingredients || ''}].
Tempo máximo de preparo: ${maxTime || 60} minutos.
Restrição alimentar: ${diet || 'nenhuma'}.
Dificuldade desejada: ${difficulty || 'Qualquer'}.
Porções: ${servings || 2} porções.

INFORMAÇÕES DE PREFERÊNCIAS E HISTÓRICO DO USUÁRIO:${contextInstructions || '\nNenhuma cadastrada ainda.'}

Com base nestes dados do usuário, adapte sua comunicação e a receita criada:
1. Analise se o usuário tem perfil de academia/hipertrofia, dieta light/saudável, vegetariana, intolerâncias ou se prefere receitas práticas. 
2. Adapte o tom do texto do Chef (ex: empático, motivador esportivo, focado em nutrição funcional ou chef gourmet).
3. Preencha o campo "description" com a apresentação do prato, seguido de uma tabela nutricional em formato Markdown contendo estimativas de macros (Calorias, Carboidratos, Proteínas, Gorduras) por porção, e conselhos de Chef baseados nas preferências do usuário.`;

    const modelsToTry = [
        "google/gemma-4-26b-a4b-it:free",
        "openrouter/free"
    ];

    try {
        const { OpenRouter } = await import("@openrouter/sdk");
        const openrouter = new OpenRouter({
            apiKey: process.env.OPENROUTER_API_KEY
        });

        let content = null;
        let lastError = null;

        for (const model of modelsToTry) {
            try {
                const response = await openrouter.chat.send({
                    chatRequest: {
                        model: model,
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: userPrompt }
                        ]
                    }
                });

                content = response.choices[0]?.message?.content;
                if (content) {
                    break;
                }
            } catch (err) {
                lastError = err;
            }
        }

        if (!content) {
            throw new Error(lastError ? lastError.message : "Todos os modelos do OpenRouter falharam.");
        }

        const recipe = parseJSONRecipe(content);
        res.status(200).json(recipe);

    } catch (error) {
        res.status(500).json({ 
            erro: "Erro ao gerar receita por IA.", 
            detalhe: error.message 
        });
    }
};

const analisarFoto = async (req, res) => {
    const { image } = req.body;
    if (!image) {
        return res.status(400).json({ erro: "Imagem não fornecida." });
    }

    try {
        const { OpenRouter } = await import("@openrouter/sdk");
        const openrouter = new OpenRouter({
            apiKey: process.env.OPENROUTER_API_KEY
        });

        const response = await openrouter.chat.send({
            chatRequest: {
                model: "meta-llama/llama-3.2-11b-vision-instruct:free",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `Analise esta imagem de comida. Identifique o prato principal e liste de 3 a 5 ingredientes principais visíveis com uma porcentagem estimada de confiança (ex: entre 80% e 99%).
Retorne a resposta estritamente em formato JSON válido contendo os seguintes campos, sem blocos de código markdown adicionais:
{
  "title": "Nome da receita (ex: Pizza Margherita)",
  "dishName": "Título do prato (ex: Pizza Margherita Identificada!)",
  "detections": [
    { "name": "Ingrediente 1", "percent": 98 },
    { "name": "Ingrediente 2", "percent": 95 }
  ]
}`
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: image
                                }
                            }
                        ]
                    }
                ]
            }
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error("Resposta vazia do OpenRouter");
        }

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Nenhum objeto JSON encontrado na resposta da IA.");
        }
        const parsedData = JSON.parse(jsonMatch[0]);
        res.status(200).json(parsedData);

    } catch (error) {
        res.status(500).json({ 
            erro: "Erro ao analisar imagem por IA.", 
            detalhe: error.message 
        });
    }
};

const gerarReceitaFoto = async (req, res) => {
    const { dishName, ingredientsList, diet, servings } = req.body;
    if (!dishName || !ingredientsList) {
        return res.status(400).json({ erro: "Nome do prato ou ingredientes ausentes." });
    }

    try {
        const { OpenRouter } = await import("@openrouter/sdk");
        const openrouter = new OpenRouter({
            apiKey: process.env.OPENROUTER_API_KEY
        });

        const configRestrictionText = diet || "Nenhuma restrição";
        const numServings = servings || "2";

        const response = await openrouter.chat.send({
            chatRequest: {
                model: "google/gemma-4-26b-a4b-it:free",
                messages: [
                    {
                        role: "system",
                        content: `Você é o Chef Saboré IA. Crie uma receita deliciosa com base no prato identificado e seus ingredientes.

Preferências Culinárias do Usuário:
- Restrições Alimentares: ${configRestrictionText}
- Rendimento Desejado: ${numServings} porções

Diretrizes Importantes:
1. Respeite rigorosamente as restrições alimentares do usuário: ${configRestrictionText}.
2. Ajuste a quantidade de ingredientes para render exatamente ${numServings} porções.
3. NUNCA use ou envie asteriscos (*) ou blocos de crase (\`\`\`) no texto da receita (especialmente nos nomes dos ingredientes ou etapas).
4. Retorne a resposta em formato JSON válido contendo exatamente a seguinte estrutura, sem explicações extras:
{
  "time": 30, (tempo de preparo em minutos como número)
  "servings": 2, (porções como número)
  "difficulty": "Fácil", (Fácil, Médio ou Difícil)
  "diet": "vegetariano", (se aplicável: vegano, vegetariano, lowcarb, glutenfree, fit, ou "none")
  "ingredients": [
    "Ingrediente 1",
    "Ingrediente 2"
  ],
  "steps": [
    "Passo 1",
    "Passo 2"
  ]
}`
                    },
                    {
                        role: "user",
                        content: `Gere a receita para o prato "${dishName}" que contém estes ingredientes principais detectados: ${ingredientsList.join(', ')}.`
                    }
                ]
            }
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error("Resposta vazia do OpenRouter");
        }

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Nenhum objeto JSON encontrado na resposta da IA.");
        }
        const parsedData = JSON.parse(jsonMatch[0]);
        res.status(200).json(parsedData);

    } catch (error) {
        res.status(500).json({ 
            erro: "Erro ao gerar receita por IA.", 
            detalhe: error.message 
        });
    }
};

module.exports = {
    gerar,
    analisarFoto,
    gerarReceitaFoto
};
