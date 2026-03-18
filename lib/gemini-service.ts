import { GoogleGenerativeAI } from "@google/generative-ai";
import { InvoiceResultSchema, InvoicesResponseSchema, InvoicesResponse } from "./validations/invoice";

// Verify API Key
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not configured in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey);

export async function extractInvoicesFromPdf(pdfBytes: Uint8Array, mimeType = "application/pdf"): Promise<InvoicesResponse> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: "Tu es un expert en comptabilité d'entreprise. Ton rôle est d'analyser le document fourni, d'identifier s'il contient une seule ou plusieurs factures, et d'en extraire les informations de façon stricte.",
  });

  const prompt = `
Voici un document (PDF ou Image) qui peut contenir une ou plusieurs factures.
Analyse le document dans son intégralité. Trouve toutes les factures distinctes.
S'il s'agit d'un document multipage et qu'il y a plusieurs factures collées, délimite les factures par page.

Pour chaque facture, extrais les informations suivantes:
- Date: exactemenent au format YYYY-MM-DD
- Tiers: le fournisseur en MAJUSCULES_AVEC_UNDERSCORES (ex: METRO, GRAND_FRAIS_CHOLET)
- Montant: le TTC exact avec décimales (ex: 231.50)
- Start_Page: la page de début de la facture 
- End_Page: la page de fin de la facture
- Resume: un texte très descriptif et riche d'un paragraphe résumant la facture (achats, produits, contexte).

Réponds uniquement en suivant la structure JSON définie.
`;

  // Provide the document inline as Base64 format
  const base64Data = Buffer.from(pdfBytes).toString("base64");
  
  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { text: prompt },
        { 
          inlineData: {
             data: base64Data,
             mimeType: mimeType
          }
        }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
      // Enforce output using Zod JSON Schema conversion provided by Gemini Server helpers
      // If zodResponseFormat isn't working as intended in this SDK version, we fallback to just JSON mimeType.
      // But let's use the object structure mapping.
      responseSchema: {
        type: "object",
        properties: {
          invoices: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Date: { type: "string" },
                Tiers: { type: "string" },
                Montant: { type: "string" },
                Start_Page: { type: "integer" },
                End_Page: { type: "integer" },
                Resume: { type: "string" }
              },
              required: ["Date", "Tiers", "Montant", "Start_Page", "End_Page", "Resume"]
            }
          }
        },
        required: ["invoices"]
      } as any
    }
  });

  const responseText = result.response.text();
  
  try {
    const jsonParsed = JSON.parse(responseText);
    const validated = InvoicesResponseSchema.parse(jsonParsed);
    return validated;
  } catch (error) {
    console.error("Failed to parse or validate Gemini extraction:", responseText);
    throw new Error("Failed to parse invoice data from document");
  }
}

export async function generateInvoiceEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  const embedding = result.embedding;
  return embedding.values;
}
