import { GoogleGenerativeAI } from "@google/generative-ai";
import { InvoicesResponseSchema, InvoicesResponse } from "./validations/invoice";

function getGenAI() {
  // Verify API Key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }
  return new GoogleGenerativeAI(apiKey);
}

const SYSTEM_INSTRUCTION = `Tu es un expert-comptable spécialisé dans l'analyse de factures pour la SARL SIWA, un restaurant.
Ton rôle est d'analyser chaque document (PDF ou image) fourni, d'identifier toutes les factures distinctes qu'il contient, et d'en extraire le MAXIMUM d'informations avec une précision absolue.

RÈGLES IMPORTANTES :
- La SARL SIWA est TOUJOURS l'ACHETEUR. Le fournisseur est l'autre entité sur la facture.
- Extrais le montant HT (Hors Taxes), le taux de TVA, le montant de TVA, ET le montant TTC séparément.
- Identifie le mode de règlement : CB, VIREMENT, PRELEVEMENT, CHEQUE, ESPECES. Si non visible, utilise "NON_IDENTIFIE".
- Extrais TOUTES les lignes d'articles avec description, quantité, prix unitaire et total.
- Pour le résumé (Resume), sois EXTRÊMEMENT détaillé : liste TOUS les produits avec leurs quantités et prix. Ce texte sera utilisé pour de la recherche sémantique.
- Utilise "NON_IDENTIFIE" pour tout champ textuel non trouvé et "0.00" pour tout montant non trouvé.
- Le score de confiance (confidence) doit refléter honnêtement la lisibilité du document.`;

export async function extractInvoicesFromPdf(pdfBytes: Uint8Array, mimeType = "application/pdf"): Promise<InvoicesResponse> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  const prompt = `Analyse ce document (facture fournisseur adressée à la SARL SIWA).
Trouve TOUTES les factures distinctes. S'il y a plusieurs factures collées dans un document multipage, délimite-les par page.

Pour chaque facture, extrais :

1. IDENTIFICATION :
   - invoiceNumber : le numéro de facture tel qu'imprimé (ex: "FA-2024-0142")
   - Date : format YYYY-MM-DD strict
   - dueDate : date d'échéance si visible

2. FOURNISSEUR (le vendeur, PAS la SARL SIWA) :
   - Tiers : nom en MAJUSCULES_AVEC_UNDERSCORES (ex: METRO, PROMOCASH)
   - supplierSiret : SIRET ou SIREN du fournisseur
   - supplierAddress : adresse complète du fournisseur

3. MONTANTS (extraire séparément) :
   - amountHT : total Hors Taxes
   - vatRate : taux de TVA principal (si plusieurs taux, prendre le principal)
   - vatAmount : montant total de TVA
   - Montant : total TTC (la somme finale à payer)

4. REGLEMENT :
   - paymentMethod : CB | VIREMENT | PRELEVEMENT | CHEQUE | ESPECES | NON_IDENTIFIE
   - paymentReference : référence bancaire ou de paiement

5. LIGNES D'ARTICLES (TOUTES, c'est CRUCIAL) :
   - Pour chaque produit/service : description, quantité, prix unitaire, total ligne
   - Inclure les mentions de poids/conditionnement dans la description (ex: "Citron jaune colis 4.5kg")

6. METADONNEES IA :
   - confidence : score de 0.0 à 1.0 (1.0 = parfaitement lisible, 0.5 = partiellement lisible, < 0.3 = très incertain)
   - Resume : paragraphe TRES détaillé listant TOUS les produits avec quantités et prix. Exemple : "Facture METRO du 15/03/2024 pour 232.50€ TTC. Achats : 2 colis citrons jaunes 4.5kg à 12.50€, 5kg tomates grappe à 3.80€/kg, 3 cartons lait demi-écrémé 6x1L à 8.90€..."
   - Start_Page / End_Page : pages de début et fin

Réponds uniquement en JSON structuré.`;

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
      responseSchema: {
        type: "object",
        properties: {
          invoices: {
            type: "array",
            items: {
              type: "object",
              properties: {
                invoiceNumber: { type: "string" },
                Date: { type: "string" },
                dueDate: { type: "string" },
                Tiers: { type: "string" },
                supplierSiret: { type: "string" },
                supplierAddress: { type: "string" },
                amountHT: { type: "string" },
                vatRate: { type: "string" },
                vatAmount: { type: "string" },
                Montant: { type: "string" },
                paymentMethod: { type: "string" },
                paymentReference: { type: "string" },
                lineItems: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      description: { type: "string" },
                      quantity: { type: "string" },
                      unitPrice: { type: "string" },
                      totalPrice: { type: "string" }
                    },
                    required: ["description", "quantity", "unitPrice", "totalPrice"]
                  }
                },
                confidence: { type: "number" },
                Resume: { type: "string" },
                Start_Page: { type: "integer" },
                End_Page: { type: "integer" }
              },
              required: [
                "invoiceNumber", "Date", "dueDate", "Tiers", "supplierSiret", "supplierAddress",
                "amountHT", "vatRate", "vatAmount", "Montant",
                "paymentMethod", "paymentReference", "lineItems",
                "confidence", "Resume", "Start_Page", "End_Page"
              ]
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
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  const embedding = result.embedding;
  return embedding.values;
}

/**
 * Build a rich text for embedding that maximizes semantic search quality.
 */
export function buildEmbeddingText(invoiceData: any): string {
  const parts: string[] = [];
  
  parts.push(`Date: ${invoiceData.Date}.`);
  parts.push(`Fournisseur: ${invoiceData.Tiers}.`);
  parts.push(`N° Facture: ${invoiceData.invoiceNumber}.`);
  parts.push(`Montant HT: ${invoiceData.amountHT}€. TVA ${invoiceData.vatRate}%: ${invoiceData.vatAmount}€. TTC: ${invoiceData.Montant}€.`);
  parts.push(`Règlement: ${invoiceData.paymentMethod}.`);
  
  if (invoiceData.lineItems && invoiceData.lineItems.length > 0) {
    const itemsText = invoiceData.lineItems
      .map((item: any) => `${item.description} (x${item.quantity}) à ${item.unitPrice}€ = ${item.totalPrice}€`)
      .join('; ');
    parts.push(`Articles: ${itemsText}.`);
  }
  
  parts.push(`Résumé: ${invoiceData.Resume}`);
  
  return parts.join(' ');
}
