
import { FINANCE_RULES } from "../lib/finance-rules";

// Mock des catégories (simule ce qui est en base de données)
const mockCategoryMap = new Map<string, string>();
FINANCE_RULES.categories.forEach((cat, index) => {
    mockCategoryMap.set(cat.name, `cat_id_${index}`);
});

function testCategorization(description: string) {
    const descUpper = description.toUpperCase();
    let matchedCatId: string | undefined;
    let matchedRuleName: string | undefined;

    for (const catRule of FINANCE_RULES.categories) {
        if (catRule.keywords.some(k => descUpper.includes(k))) {
            matchedCatId = mockCategoryMap.get(catRule.name);
            matchedRuleName = catRule.name;
            break;
        }
    }

    return { description, matchedRuleName, matchedCatId };
}

// Scénarios de Test
const testCases = [
    "PRLV SEPA SCI BAB JANVIER",   // Attendu: Loyer & Charges
    "VIR URSSAF URSSAF",           // Attendu: Social
    "CARREFOUR MARKET 3452",       // Attendu: Achats & Stocks
    "LEROY MERLIN",                // Attendu: Non trouvé (ou à ajouter ?)
    "PRLV ORANGE INTERNET",        // Attendu: Télécom & Tech
    "COTISATION CB",               // Attendu: Frais Bancaires
    "VIREMENT M BELAL SALAIRE"     // Attendu: Salaires & Rémunérations
];

console.log("--- TEST DE CATÉGORISATION FINANCE ---");
let passed = 0;

testCases.forEach(desc => {
    const result = testCategorization(desc);
    const status = result.matchedRuleName ? "✅ MATCH" : "❌ NO MATCH";
    console.log(`${status} | "${desc}" -> ${result.matchedRuleName || "Aucune règle"}`);
    if (result.matchedRuleName) passed++;
});

console.log(`\nRésultat: ${passed}/${testCases.length} transactions catégorisées.`);
