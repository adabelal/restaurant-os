export const FINANCE_RULES = {
    // Categories to be automatically created if missing
    categories: [
        { name: 'Loyer & Charges', type: 'FIXED_COST', keywords: ['SCI BAB', 'LOYER'] },
        { name: 'Salaires & Rémunérations', type: 'SALARY', keywords: ['BELAL', 'SALAIRE', 'REMUNERATION', 'ROSSE', 'LEROY'] },
        { name: 'Expert Comptable', type: 'FIXED_COST', keywords: ['SC EXPERT', 'COMPTABLE', 'FIDUCIAIRE'] },
        { name: 'Frais Bancaires', type: 'FINANCIAL', keywords: ['COTISATION', 'COMMISSION', 'FRAIS'] },
        { name: 'Assurances', type: 'FIXED_COST', keywords: ['GROUPAMA', 'ASSURANCE', 'AXA', 'MAAF'] },
        { name: 'Télécom & Tech', type: 'FIXED_COST', keywords: ['ORANGE', 'FREE', 'SFR', 'BOUYGUES', 'OVH'] },
        { name: 'Leasing & Crédit', type: 'FINANCIAL', keywords: ['CAPIT', 'LEASE', 'CREDIT', 'LOCAM'] },
        { name: 'Achats & Stocks', type: 'VARIABLE_COST', keywords: ['METRO', 'PROMUS', 'CARREFOUR'] },
        { name: 'Impôts & Taxes', type: 'TAX', keywords: ['DGFIP', 'SIE', 'CFE', 'TVA'] },
        { name: 'Social', type: 'SALARY', keywords: ['URSSAF', 'RETRAITE', 'PREVOYANCE'] },
        { name: 'Énergie', type: 'FIXED_COST', keywords: ['EDF', 'ENGIE', 'TOTAL ENERGIES'] }
    ],

    // Specific rules for detecting recurring fixed costs
    detectionTargets: [
        { catName: 'Loyer & Charges', name: 'Loyer Commercial (SCI BAB)', keyword: 'SCI BAB' },
        { catName: 'Expert Comptable', name: 'Expert Comptable (SC EXPERT)', keyword: 'SC EXPERT' },
        { catName: 'Frais Bancaires', name: 'Frais Tenue de Compte', keyword: 'FRAIS TENUE DE COMPTE' },
        { catName: 'Leasing & Crédit', name: 'Leasing Matériel (CAPIT)', keyword: 'CAPIT' },
        { catName: 'Télécom & Tech', name: 'Abonnement Internet', keyword: 'ORANGE' },
        { catName: 'Assurances', name: 'Assurance Multirisque', keyword: 'GROUPAMA' }
    ],

    // Keywords used to identify salary transactions for specific employees
    salaryKeywords: ['BELAL', 'ROSSE', 'LEROY']
} as const

export const CAISSE_RULES = {
    categoryMapping: {
        "METRO": "Achats",
        "GRAND FRAIS": "Achats",
        "PASCAULT": "Achats",
        "RECETTE": "Recettes",
        "DEPOT": "Banque",
        "MONNAIE": "Monnaie",
        "POURBOIRE": "Social",
        "RETRAIT": "Banque",
        "EDF": "Charges",
        "LOYER": "Charges"
    } as Record<string, string>
} as const
