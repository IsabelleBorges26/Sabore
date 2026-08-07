const dotenv = require("dotenv");
dotenv.config();
const { OpenRouter } = require("@openrouter/sdk");

async function testImageClassification() {
  console.log("🔍 STEP 1: Baixando imagem de comida...");
  
  const imageUrl = "https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?auto=compress&cs=tinysrgb&w=300";
  
  let imageBuffer;
  try {
    const resp = await fetch(imageUrl);
    imageBuffer = Buffer.from(await resp.arrayBuffer());
    console.log(`✅ Imagem baixada: ${imageBuffer.length} bytes`);
  } catch (e) {
    console.error("Erro ao baixar:", e.message);
    return;
  }

  const hfToken = process.env.HF_TOKEN;
  
  // Try image classification models (widely supported by hf-inference)
  const classificationModels = [
    "google/vit-base-patch16-224",
    "microsoft/resnet-50",
    "nateraw/food",  // food-specific classifier!
    "Kaludi/food-category-classification-v2.0"
  ];

  console.log("\n🧠 STEP 2: Testando modelos de classificação de imagem...");
  
  let bestLabel = null;

  for (const modelId of classificationModels) {
    try {
      const url = `https://router.huggingface.co/hf-inference/models/${modelId}`;
      const hfResponse = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfToken}`,
          "Content-Type": "image/jpeg",
        },
        body: imageBuffer
      });

      const responseText = await hfResponse.text();
      console.log(`\n[${modelId}] Status: ${hfResponse.status}`);
      console.log(`Resposta: ${responseText.substring(0, 200)}`);

      if (hfResponse.ok) {
        const data = JSON.parse(responseText);
        // Classification returns [{ label: "...", score: 0.99 }, ...]
        if (Array.isArray(data) && data.length > 0) {
          const topLabels = data.slice(0, 3).map(d => `${d.label} (${(d.score * 100).toFixed(0)}%)`).join(", ");
          console.log(`✅ Labels: ${topLabels}`);
          bestLabel = data.slice(0, 3).map(d => d.label).join(", ");
          break;
        }
      }
    } catch (err) {
      console.log(`❌ Erro: ${err.message}`);
    }
  }

  if (bestLabel) {
    console.log(`\n🍴 STEP 3: Enviando labels para Gemma: "${bestLabel}"`);
    const openrouter = new OpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
    const prompt = `Você é um chef culinário. Uma IA de visão identificou os seguintes rótulos em uma imagem de comida: "${bestLabel}". Identifique o prato e retorne APENAS JSON bruto sem markdown:\n{"title":"Nome completo em português","dishName":"Nome Identificado!","detections":[{"name":"Ingrediente principal","percent":97},{"name":"Ingrediente 2","percent":92}]}`;
    
    try {
      const resp = await openrouter.chat.send({
        chatRequest: {
          model: "google/gemma-4-26b-a4b-it:free",
          messages: [{ role: "user", content: prompt }]
        }
      });
      console.log("\n✅ RESULTADO FINAL:");
      console.log(resp.choices[0]?.message?.content);
    } catch (err) {
      console.error("❌ Gemma erro:", err.message);
    }
  } else {
    console.log("⚠️ Nenhum modelo funcionou.");
  }
}

testImageClassification();
