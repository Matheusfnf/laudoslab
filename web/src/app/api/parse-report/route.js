import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

export async function POST(req) {
    try {
        const body = await req.json();
        const { imageBase64, mimeType } = body;

        if (!imageBase64) {
            return new Response(JSON.stringify({ error: "No image provided" }), { status: 400 });
        }

        // Initialize Gemini 2.5 Flash Model (best for vision tasks)
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
Você é um especialista em extração de dados de laudos laboratoriais e microbiológicos.
Vou te enviar uma imagem de um Laudo Analítico. Sua tarefa é ler a imagem com atenção e extrair todos os dados possíveis.

RETORNE APENAS UM JSON VÁLIDO E ESTRITAMENTE NESTE FORMATO:

{
  "header": {
    "name": "Número do Laudo ou Identificação (ex: Laudo 11475/24)",
    "requester": "Nome do solicitante",
    "property": "Nome da Fazenda ou Propriedade",
    "city": "Município",
    "state": "Estado (Sigla)",
    "collected_by": "Quem coletou",
    "collection_date": "Data de coleta no formato YYYY-MM-DD",
    "delivered_by": "Entregue por",
    "entry_date": "Data de entrada no formato YYYY-MM-DD",
    "issue_date": "Data de emissão no formato YYYY-MM-DD"
  },
  "micros": [
    {
      "code": "Código do microorganismo (ex: 001, 12, P1)",
      "name": "Nome do Microorganismo",
      "ph": "Valor numérico do pH analisado para este microorganismo (ex: 8.44)",
      "commercial_product": "Produto Comercial (se houver)",
      "cfu_per_ml": "UFC/ml (ex: < 1x10⁵)",
      "enterobacteria": "Indicador de Enterobactérias (se houver, ex: Ausência ou o valor numerico)",
      "mold_yeast": "Indicador de Bolor/Levedura (se houver, ex: < 10 UFC/g, Ausência, etc)"
    }
  ]
}

REGRAS CRÍTICAS:
1. DEIXE EM BRANCO (string vazia "") o que você NÃO encontrar na imagem. Não invente dados!
2. É perfeitamente normal que muitos campos venham secos/vazios. O mais importante é capturar o que de fato existe na imagem.
3. Se a imagem não contiver uma tabela de microorganismos, deixe a array "micros" vazia: []
4. Para datas, tente converter o formato encontrado para internacional YYYY-MM-DD para facilitar a integração.
5. O resultado DEVE ser um objeto JSON puro. Não escreva 'Aqui está o JSON' ou marque as cordas como markdown. Exclusivamente texto de JSON válido e escapável, sem as tags \`\`\`json.
    `;

        const imageParts = [
            {
                inlineData: {
                    data: imageBase64,
                    mimeType: mimeType || "image/jpeg",
                },
            },
        ];

        const result = await model.generateContent([prompt, ...imageParts]);
        let text = result.response.text();

        console.log("=== RAW GEMINI OUTPUT ===");
        console.log(text);
        console.log("=========================");

        // Clean potential markdown blocks
        text = text.replace(/```json/gi, '').replace(/```/gi, '').trim();

        try {
            const parsedData = JSON.parse(text);
            return new Response(JSON.stringify(parsedData), { status: 200 });
        } catch (parseError) {
            console.error("Failed to parse Gemini output as JSON.", parseError);
            return new Response(JSON.stringify({ error: "Failed to parse data from AI", raw: text }), { status: 500 });
        }

    } catch (error) {
        console.error("=== FATAL API ERROR ===");
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
