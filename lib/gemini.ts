import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function summarizeBandProposal(description: string): Promise<string> {
    if (!description || description.length < 50) return description;

    try {
        const prompt = `Résume cette proposition de groupe de musique en 5 à 10 mots maximum (ex: "Jazz manouche énergique, idéal pour soirées"). Texte: ${description}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("Gemini Summarization Error:", error);
        return description.substring(0, 50) + "...";
    }
}
