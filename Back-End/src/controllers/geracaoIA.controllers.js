const prisma = require("../data/prisma");
const { MODELS } = require("../services/openrouterModels");
const systemPrompt = `Você é o Chef Saboré IA. Responda exclusivamente com JSON válido, sem Markdown ou texto fora do objeto.
Para conversa, use isRecipe:false e preencha apenas message. Para uma receita solicitada explicitamente, use isRecipe:true e siga este formato:
{"isRecipe":true,"message":"","title":"","description":"","ingredients":[""],"steps":[""],"time":0,"difficulty":"Fácil","category":""}
Regras culinárias obrigatórias quando isRecipe:true:
- A receita deve ser tecnicamente coerente com o prato, ingredientes e método pedido. Nunca use uma técnica incompatível: bolo, massa, cobertura e chocolate são assados, derretidos, batidos ou incorporados; não são grelhados, a menos que o usuário peça isso explicitamente.
- Cada etapa precisa ser executável, em ordem lógica, com verbo claro. Não invente equipamentos, ingredientes, temperaturas, medidas, dietas ou alegações nutricionais sem base no pedido.
- Para um doce assado, inclua preparo da massa, forma, forno e ponto de cozimento; cobertura é feita separadamente quando houver.
- Liste ingredientes com quantidade e unidade quando a medida for conhecida; do contrário, escreva somente o ingrediente ou "a gosto" para temperos.
- Respeite restrições alimentares e porções do usuário. Use dificuldade somente entre Fácil, Médio e Difícil.
- description deve ser um resumo curto e útil, sem tabela nutricional inventada.`;
function parseJSONRecipe(text) {
    let cleanText = text.trim();
    const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
        cleanText = match[1].trim();
    }
    const cleanTrailingCommas = (str) => {
        return str.replace(/,(\s*[\]}])/g, '$1');
    };
    try {
        return JSON.parse(cleanTrailingCommas(cleanText));
    } catch (e) {
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

const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const extractModelContent = (response) => response?.choices?.[0]?.message?.content?.trim() || "";

async function generatePhotoRecipeContent(systemInstruction, userInstruction) {
    const failures = [];

    if (process.env.OPENROUTER_API_KEY) {
        try {
            const sdk = await import("@openrouter/sdk");
            const openrouter = new sdk.OpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
            for (const model of MODELS) {
                for (let attempt = 1; attempt <= 2; attempt += 1) {
                    try {
                        console.log(`[IA Vision Recipe] Tentando OpenRouter: ${model} (tentativa ${attempt})`);
                        const response = await openrouter.chat.send({
                            chatRequest: {
                                model,
                                temperature: 0.25,
                                maxCompletionTokens: 2200,
                                messages: [
                                    { role: "system", content: systemInstruction },
                                    { role: "user", content: userInstruction }
                                ]
                            }
                        });
                        const content = extractModelContent(response);
                        if (!content) throw new Error("O modelo retornou uma resposta vazia.");
                        const parsed = parseJSONRecipe(content);
                        if (!Array.isArray(parsed.ingredients) || !parsed.ingredients.length || !Array.isArray(parsed.steps) || !parsed.steps.length) {
                            throw new Error("O modelo retornou uma receita incompleta.");
                        }
                        return JSON.stringify(parsed);
                    } catch (error) {
                        const detail = error?.message || String(error);
                        failures.push(`OpenRouter/${model}: ${detail}`);
                        console.warn(`[IA Vision Recipe] Falha no ${model}:`, detail);
                        if (attempt < 2) await pause(800);
                    }
                }
            }
        } catch (error) {
            const detail = error?.message || String(error);
            failures.push(`OpenRouter SDK: ${detail}`);
            console.warn("[IA Vision Recipe] OpenRouter indisponível:", detail);
        }
    }

    console.error("[IA Vision Recipe] Nenhum provedor respondeu:", failures);
    throw new Error("Nenhum provedor de IA respondeu no momento. Aguarde alguns segundos e tente novamente.");
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
        console.warn("[Chef IA] Falha ao consultar histórico do usuário no banco:", dbErr);
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
    try {
        const sdk = await import("@openrouter/sdk");
        const openrouter = new sdk.OpenRouter({
            apiKey: process.env.OPENROUTER_API_KEY
        });
        let recipe = null;
        let lastError = null;
        for (const model of MODELS) {
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
                const choice = response.choices?.[0]?.message;
                const content = choice?.content?.trim() || choice?.reasoning?.trim();
                if (!content) {
                    throw new Error("O modelo retornou uma resposta vazia.");
                }
                try {
                    const parsed = parseJSONRecipe(content);
                    if (typeof parsed?.isRecipe !== "boolean") throw new Error("Resposta incompleta do modelo.");
                    if (parsed.isRecipe && (!parsed.title || !Array.isArray(parsed.ingredients) || !parsed.ingredients.length || !Array.isArray(parsed.steps) || !parsed.steps.length)) {
                        throw new Error("Receita incompleta do modelo.");
                    }
                    if (!parsed.isRecipe && !String(parsed.message || "").trim()) throw new Error("Mensagem vazia do modelo.");
                    recipe = parsed;
                    console.log(`[Chef IA] Sucesso com o modelo ${model}!`);
                    break;
                } catch (parseError) {
                    console.warn(`[Chef IA] O modelo ${model} não retornou JSON válido. Tentando o próximo...`);
                    lastError = parseError;
                }
            } catch (err) {
                console.warn(`[Chef IA] Erro com o modelo ${model}:`, err.message || err);
                lastError = err;
            }
        }
        if (!recipe) {
            throw new Error(lastError ? lastError.message : "Todos os modelos do OpenRouter falharam.");
        }
        if (typeof req.consumirQuotaIA === "function") {
            await req.consumirQuotaIA().catch(e => console.error("[IA] Erro ao debitar uso:", e));
        }
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
        console.log("[IA Vision] Enviando imagem para HuggingFace classificação...");
        const imageBuffer = Buffer.from(base64Data, "base64");
        const hfToken = process.env.HF_TOKEN;
        const hfClassificationModels = [
            "nateraw/food",
            "google/vit-base-patch16-224",
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
                        if (Array.isArray(hfData) && hfData.length > 0) {
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
            console.log("[IA Vision] Enviando labels para Gemma via OpenRouter...");
            const gemmaPrompt = `Você é um chef culinário especialista. Uma IA de visão computacional analisou uma foto de comida e identificou os seguintes rótulos em inglês: "${imageCaption}"
Com base nesses rótulos, identifique com precisão o prato culinário e retorne EXCLUSIVAMENTE um objeto JSON válido, sem texto extra, sem markdown, sem blocos de código. Apenas o JSON bruto:
${jsonSchema}`;
            for (const model of MODELS) {
                try {
                    const response = await openrouter.chat.send({
                        chatRequest: {
                            model,
                            messages: [{ role: "user", content: gemmaPrompt }]
                        }
                    });
                    const parsed = parseJSONRecipe(extractModelContent(response));
                    if (!parsed?.title && !parsed?.dishName) throw new Error("Resposta incompleta do modelo.");
                    content = JSON.stringify(parsed);
                    console.log(`[IA Vision] Sucesso via HuggingFace + ${model}!`);
                    break;
                } catch (err) {
                    console.warn(`[IA Vision] Falha com ${model}:`, err.message);
                    lastError = err;
                }
            }
        }
        if (!content) {
            console.log("[IA Vision] Fallback: enviando imagem diretamente para OpenRouter visão...");
            const visionPrompt = `Você é um chef culinário especialista. Identifique o prato culinário na imagem e retorne EXCLUSIVAMENTE um objeto JSON válido, sem texto extra, sem markdown, sem blocos de código. Apenas o JSON bruto:
${jsonSchema}`;
            for (const model of MODELS) {
                try {
                    console.log(`[IA Vision] Tentando modelo de visão: ${model}...`);
                    const fetchRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            model: model,
                            messages: [
                                {
                                    role: "user",
                                    content: [
                                        { type: "text", text: visionPrompt },
                                        { type: "image_url", image_url: { url: imageUrl } }
                                    ]
                                }
                            ]
                        })
                    });
                    if (fetchRes.ok) {
                        const data = await fetchRes.json();
                        const candidate = data.choices?.[0]?.message?.content || data.choices?.[0]?.message?.reasoning;
                        if (candidate) {
                            const parsed = parseJSONRecipe(candidate);
                            if (!parsed?.title && !parsed?.dishName) throw new Error("Resposta incompleta do modelo.");
                            content = JSON.stringify(parsed);
                            console.log(`[IA Vision] Sucesso via visão direta (${model})!`);
                            break;
                        }
                    } else {
                        const errBody = await fetchRes.text();
                        console.warn(`[IA Vision] Modelo ${model} retornou ${fetchRes.status}:`, errBody.substring(0, 150));
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
        console.log("[IA Vision] Resposta bruta da IA:", content.substring(0, 300));
        
        let parsedData = null;
        try {
            parsedData = parseJSONRecipe(content);
        } catch (parseErr) {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const cleanJson = jsonMatch[0].replace(/,(\s*[\]}])/g, '$1');
                try {
                    parsedData = JSON.parse(cleanJson);
                } catch (innerErr) {
                    console.warn("[IA Vision] Falha no regex JSON padrão:", innerErr.message);
                }
            }
        }

        if (!parsedData || typeof parsedData !== "object") {
            const lines = content.split("\n").map(l => l.trim()).filter(Boolean);
            const titleLine = lines.find(l => !l.startsWith("`") && !l.startsWith("{") && l.length > 3) || "Prato Culinário Identificado";
            parsedData = {
                title: titleLine.replace(/^#+\s*/, "").slice(0, 80),
                dishName: `${titleLine.replace(/^#+\s*/, "").slice(0, 40)} Identificado!`,
                detections: [
                    { name: "Ingrediente Principal", percent: 92 },
                    { name: "Tempero ou Acompanhamento", percent: 85 }
                ]
            };
        }

        if (!parsedData.title && parsedData.dishName) parsedData.title = parsedData.dishName.replace(/!$/, "");
        if (!parsedData.dishName && parsedData.title) parsedData.dishName = `${parsedData.title} Identificado!`;
        if (!Array.isArray(parsedData.detections)) parsedData.detections = [];

        if (typeof req.consumirQuotaIA === "function") {
            await req.consumirQuotaIA().catch(e => console.error("[IA] Erro ao debitar uso:", e));
        }

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
        const restrictions = diet || "Nenhuma restrição";
        const portions = Number(servings) || 2;
        const detectedIngredients = Array.isArray(ingredientsList)
            ? ingredientsList.map((item) => String(item).trim()).filter(Boolean).slice(0, 12)
            : [];
        if (!detectedIngredients.length) {
            return res.status(400).json({ erro: "Nenhum ingrediente identificado para gerar a receita." });
        }

        const systemInstruction = `Você é o Chef Saboré IA. Crie uma receita tecnicamente coerente com o prato identificado na foto.
Respeite a restrição alimentar: ${restrictions}. Ajuste o rendimento para ${portions} porções.
Os itens recebidos são apenas pistas visuais: complete somente com ingredientes clássicos, seguros e plausíveis para o prato.
Use técnica adequada: bolo, massa, cobertura, chocolate e granulado devem ser batidos, misturados, assados ou derretidos; nunca grelhados. Para assados, inclua forno, temperatura e teste de ponto. Para outros pratos, não invente forno.
Escreva etapas curtas, cronológicas e executáveis. Não use markdown, asteriscos ou blocos de código.
Responda somente com JSON válido e com exatamente estas chaves: time, servings, difficulty, diet, ingredients, steps.
Exemplo: {"time":40,"servings":2,"difficulty":"Médio","diet":"none","ingredients":["ingrediente"],"steps":["etapa"]}`;
        const userInstruction = `Crie a receita em português para o prato "${String(dishName).trim()}". Pistas visuais identificadas: ${detectedIngredients.join(", ")}.`;
        const generatedContent = await generatePhotoRecipeContent(systemInstruction, userInstruction);
        const generatedJson = generatedContent.match(/\{[\s\S]*\}/);
        if (!generatedJson) {
            throw new Error("Nenhum objeto JSON encontrado na resposta da IA.");
        }
        if (typeof req.consumirQuotaIA === "function") {
            await req.consumirQuotaIA().catch(e => console.error("[IA] Erro ao debitar uso:", e));
        }
        return res.status(200).json(JSON.parse(generatedJson[0].replace(/,(\s*[\]}])/g, '$1')));


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
