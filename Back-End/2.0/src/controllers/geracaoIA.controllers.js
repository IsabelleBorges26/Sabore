const prisma = require("../data/prisma");

// System Prompt for Recipe Generation & Conversation
const systemPrompt = `Você é o Chef Saboré IA, um assistente culinário pessoal inteligente e amigável.
O usuário pode interagir com você de duas formas:
1. Conversando ou tirando dúvidas culinárias gerais (ex: "Olá", "Como conservar manjericão?", "Como faço para substituir ovos em um bolo?").
2. Solicitando uma receita específica ou fornecendo ingredientes e pedindo sugestão de prato.

Sua tarefa é analisar o pedido do usuário e responder adequadamente em formato JSON.

Você DEVE responder EXCLUSIVAMENTE com um objeto JSON válido, sem qualquer texto adicional antes ou depois. Não use blocos de código de markdown. Não use \`\`\`json no início nem \`\`\` no fim. Retorne apenas o JSON bruto.

O JSON gerado deve seguir exatamente a seguinte estrutura:
{
  "isRecipe": true (APENAS se o usuário pedir explicitamente para detalhar a receita, os ingredientes ou o passo a passo de um prato específico) ou false (se for saudação, tirar dúvidas teóricas, ou pedir sugestões, ideias de receitas ou listas de opções de prato),
  "message": "Sua resposta de texto/conversa para o usuário. Use este campo para saudações, responder dúvidas, dar conselhos de cozinha ou listar sugestões/ideias de pratos. (Obrigatório se isRecipe for false. Deixe em branco \"\" se isRecipe for true)",
  "title": "Nome da Receita (Obrigatório se isRecipe for true. Deixe em branco \"\" se isRecipe for false)",
  "description": "Texto em Markdown contendo a introdução do Chef com tom adaptado, seguido de uma tabela nutricional detalhada (Calorias, Proteínas, Carboidratos, Gorduras) formatada como tabela em Markdown (| Macro | Quantidade |), e dicas adicionais baseadas no perfil do usuário. (Obrigatório se isRecipe for true. Deixe em branco \"\" se isRecipe for false)",
  "ingredients": ["Ingrediente 1 com quantidade", "Ingrediente 2 com quantidade", ...], (Obrigatório se isRecipe for true. Deixe vazio [] se isRecipe for false)
  "steps": ["Passo 1 do modo de preparo", "Passo 2 do modo de preparo", ...], (Obrigatório se isRecipe for true. Deixe vazio [] se isRecipe for false)
  "time": tempo_em_minutos_como_numero, (Obrigatório se isRecipe for true. Deixe como 0 se isRecipe for false)
  "difficulty": "Fácil" ou "Médio" ou "Difícil", (Obrigatório se isRecipe for true. Deixe em branco \"\" se isRecipe for false)
  "category": "Categoria da receita (ex: Fit, Sobremesa, Vegano, Massas, etc.)" (Obrigatório se isRecipe for true. Deixe em branco \"\" se isRecipe for false)
}`;

// Robust parser function for LLM JSON output that handles trailing commas
function parseJSONRecipe(text) {
    let cleanText = text.trim();
    
    // Check if it's wrapped in markdown JSON code block
    const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
        cleanText = match[1].trim();
    }
    
    // Function to strip trailing commas in objects and arrays
    const cleanTrailingCommas = (str) => {
        return str.replace(/,(\s*[\]}])/g, '$1');
    };
    
    try {
        return JSON.parse(cleanTrailingCommas(cleanText));
    } catch (e) {
        // If JSON.parse fails, try to extract first '{' to last '}'
        const start = cleanText.indexOf('{');
        const end = cleanText.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
            const potentialJson = cleanText.substring(start, end + 1);
            try {
                return JSON.parse(cleanTrailingCommas(potentialJson));
            } catch (innerErr) {
                console.error("Inner JSON parsing failed:", innerErr);
            }
        }
        throw e;
    }
}

const gerar = async (req, res) => {
    const usuarioId = req.usuario.id;
    const { prompt, ingredients, maxTime, diet, difficulty, servings, userBio, userPrefs } = req.body;

    // Fetch user context from database: Favorite recipes and books
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
        console.warn("[Chef IA] Falha ao consultar histórico do usuário no banco:", dbErr);
    }

    // Build the personalized context
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

    const userPrompt = `Mensagem ou pedido do usuário: "${prompt || ''}".
Ingredientes disponíveis na geladeira: [${ingredients || ''}].
Configurações/Filtros do usuário:
- Tempo máximo de preparo: ${maxTime || 60} minutos.
- Restrição alimentar: ${diet || 'nenhuma'}.
- Dificuldade desejada: ${difficulty || 'Qualquer'}.
- Porções: ${servings || 2} porções.

INFORMAÇÕES DE PREFERÊNCIAS E HISTÓRICO DO USUÁRIO:${contextInstructions || '\nNenhuma cadastrada ainda.'}

Diretrizes de resposta:
1. Se a mensagem do usuário for uma saudação, dúvida culinária, bate-papo geral OU solicitação de ideias, opções, sugestões ou listas de receitas (ex: "me dê ideias do que cozinhar com frango", "quais receitas posso fazer?"), defina "isRecipe" como false. Interaja amigavelmente e liste as sugestões/ideias no campo "message" como texto conversacional estruturado (usando listas com '-' ou '1.'). Não monte uma receita estruturada.
2. Se o usuário pedir explicitamente para criar, detalhar os ingredientes e passo a passo de uma receita específica (ex: "me dê a receita de frango grelhado", "monte uma receita com os ingredientes da geladeira"), defina "isRecipe" como true e preencha os respectivos campos de receita ("title", "description", "ingredients", "steps", etc.).
3. Adapte o tom da conversa ("message" ou "description") com base no perfil e preferências do usuário.`;

    const modelsToTry = [
        "google/gemma-4-26b-a4b-it:free",
        "openrouter/free"
    ];

    try {
        // Dynamic import of OpenRouter SDK (CommonJS compatibility)
        const sdk = await import("@openrouter/sdk");
        const openrouter = new sdk.OpenRouter({
            apiKey: process.env.OPENROUTER_API_KEY
        });

        let content = null;
        let lastError = null;

        for (const model of modelsToTry) {
            try {
                console.log(`[Chef IA] Enviando requisição para o modelo ${model}...`);
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
                    console.log(`[Chef IA] Sucesso com o modelo ${model}!`);
                    break;
                }
            } catch (err) {
                console.warn(`[Chef IA] Erro com o modelo ${model}:`, err.message || err);
                lastError = err;
            }
        }

        if (!content) {
            throw new Error(lastError ? lastError.message : "Todos os modelos do OpenRouter falharam.");
        }

        const recipe = parseJSONRecipe(content);
        res.status(200).json(recipe);

    } catch (error) {
        console.error("[Chef IA] Erro ao gerar receita com IA:", error);
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
        // ─── STEP 1: Extract base64 data and mimeType ───
        let mimeType = "image/jpeg";
        let base64Data = image;

        if (image.startsWith("data:")) {
            const matches = image.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
                mimeType = matches[1];
                base64Data = matches[2];
            }
        }

        const imageUrl = image.startsWith("data:") ? image : `data:${mimeType};base64,${base64Data}`;

        // ─── STEP 2: HuggingFace — Image classification via router ───
        console.log("[IA Vision] Enviando imagem para HuggingFace classificação...");

        const imageBuffer = Buffer.from(base64Data, "base64");
        const hfToken = process.env.HF_TOKEN;

        // NOTE: Kaludi/food-category-classification-v2.0 foi removido pelo HuggingFace (deprecated em agosto/2026)
        const hfClassificationModels = [
            "nateraw/food",               // food-specific classifier (melhor)
            "google/vit-base-patch16-224", // classificador geral (fallback)
        ];

        let imageCaption = null;

        if (hfToken) {
            for (const modelId of hfClassificationModels) {
                try {
                    const hfResponse = await fetch(
                        `https://router.huggingface.co/hf-inference/models/${modelId}`,
                        {
                            method: "POST",
                            headers: {
                                "Authorization": `Bearer ${hfToken}`,
                                "Content-Type": mimeType,
                            },
                            body: imageBuffer
                        }
                    );

                    if (hfResponse.ok) {
                        const hfData = await hfResponse.json();
                        // Classification returns [{ label: "...", score: 0.99 }, ...]
                        if (Array.isArray(hfData) && hfData.length > 0) {
                            // Get top 3 labels with score > 0.05
                            const topLabels = hfData
                                .filter(d => d.score > 0.05)
                                .slice(0, 3)
                                .map(d => d.label);

                            if (topLabels.length > 0) {
                                imageCaption = topLabels.join(", ");
                                console.log(`[IA Vision] HuggingFace (${modelId}) labels: "${imageCaption}"`);
                                break;
                            }
                        }
                    } else {
                        const errText = await hfResponse.text();
                        console.warn(`[IA Vision] HuggingFace ${modelId} falhou (${hfResponse.status}):`, errText.substring(0, 200));
                    }
                } catch (hfErr) {
                    console.warn(`[IA Vision] Erro HuggingFace ${modelId}:`, hfErr.message);
                }
            }
        } else {
            console.warn("[IA Vision] HF_TOKEN não configurado, pulando classificação HuggingFace.");
        }

        // ─── STEP 3: Build OpenRouter analysis ───
        const sdk = await import("@openrouter/sdk");
        const openrouter = new sdk.OpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

        const jsonSchema = `{
  "title": "Nome completo e descritivo do prato em português (ex: Bolo de Cenoura com Cobertura de Chocolate)",
  "dishName": "Nome curto do prato identificado seguido de exclamação (ex: Bolo de Cenoura Identificado!)",
  "detections": [
    { "name": "Ingrediente principal visível em português", "percent": 97 },
    { "name": "Segundo ingrediente principal", "percent": 93 },
    { "name": "Terceiro ingrediente", "percent": 88 },
    { "name": "Quarto ingrediente (se houver)", "percent": 83 }
  ]
}`;

        let content = null;
        let lastError = null;

        if (imageCaption) {
            // ─── STEP 3a: HuggingFace teve sucesso — Gemma interpreta os labels (texto puro) ───
            console.log("[IA Vision] Enviando labels para Gemma via OpenRouter...");
            const gemmaPrompt = `Você é um chef culinário especialista. Uma IA de visão computacional analisou uma foto de comida e identificou os seguintes rótulos em inglês: "${imageCaption}"

Com base nesses rótulos, identifique com precisão o prato culinário e retorne EXCLUSIVAMENTE um objeto JSON válido, sem texto extra, sem markdown, sem blocos de código. Apenas o JSON bruto:
${jsonSchema}`;

            try {
                const gemmaResponse = await openrouter.chat.send({
                    chatRequest: {
                        model: "google/gemma-4-26b-a4b-it:free",
                        messages: [{ role: "user", content: gemmaPrompt }]
                    }
                });
                content = gemmaResponse.choices[0]?.message?.content;
                if (content) console.log("[IA Vision] Sucesso via HuggingFace + Gemma!");
            } catch (err) {
                console.warn("[IA Vision] Gemma falhou, tentando visão direta:", err.message);
                lastError = err;
            }
        }

        if (!content) {
            // ─── STEP 3b: Fallback — Envia a imagem diretamente para modelo de visão ───
            console.log("[IA Vision] Fallback: enviando imagem diretamente para OpenRouter visão...");
            const visionPrompt = `Você é um chef culinário especialista. Identifique o prato culinário na imagem e retorne EXCLUSIVAMENTE um objeto JSON válido, sem texto extra, sem markdown, sem blocos de código. Apenas o JSON bruto:
${jsonSchema}`;

            const visionModels = ["openrouter/free", "google/gemini-2.5-flash"];
            for (const model of visionModels) {
                try {
                    console.log(`[IA Vision] Tentando modelo de visão: ${model}...`);
                    const response = await openrouter.chat.send({
                        chatRequest: {
                            model: model,
                            messages: [
                                {
                                    role: "user",
                                    content: [
                                        { type: "text", text: visionPrompt },
                                        { type: "image_url", imageUrl: { url: imageUrl } }
                                    ]
                                }
                            ]
                        }
                    });
                    content = response.choices[0]?.message?.content;
                    if (content) {
                        console.log(`[IA Vision] Sucesso via visão direta (${model})!`);
                        break;
                    }
                } catch (err) {
                    console.warn(`[IA Vision] Erro visão direta (${model}):`, err.message);
                    lastError = err;
                }
            }
        }

        if (!content) {
            throw new Error(lastError ? lastError.message : "Todos os modelos de análise de imagem falharam.");
        }

        console.log("[IA Vision] Resposta da IA:", content);

        // Robust JSON extraction
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Nenhum objeto JSON encontrado na resposta da IA.");
        }
        const cleanJson = jsonMatch[0].replace(/,(\s*[\]}])/g, '$1');
        const parsedData = JSON.parse(cleanJson);
        res.status(200).json(parsedData);

    } catch (error) {
        console.error("[IA Vision] Erro ao analisar imagem:", error);
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
        const sdk = await import("@openrouter/sdk");
        const openrouter = new sdk.OpenRouter({
            apiKey: process.env.OPENROUTER_API_KEY
        });

        const configRestrictionText = diet || "Nenhuma restrição";
        const numServings = servings || "2";

        console.log(`[IA Vision Recipe] Gerando receita para o prato: ${dishName}...`);
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

        // Robust JSON extraction using regex
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Nenhum objeto JSON encontrado na resposta da IA.");
        }
        const cleanJson = jsonMatch[0].replace(/,(\s*[\]}])/g, '$1');
        const parsedData = JSON.parse(cleanJson);
        res.status(200).json(parsedData);

    } catch (error) {
        console.error("[IA Vision Recipe] Erro ao gerar receita a partir da foto:", error);
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
