import { z } from "zod"

// --- UTILISATEURS / RH ---
export const createUserSchema = z.object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
    email: z.string().email("Email invalide"),
    role: z.enum(["ADMIN", "MANAGER", "STAFF"]).default("STAFF"),
    hourlyRate: z.coerce.number().min(0, "Le taux horaire doit être positif").optional(),
    phone: z.string().max(20).optional().nullable(),
    address: z.string().max(255).optional().nullable(),
    contractType: z.enum(["CDI", "CDD"]).optional(),
    contractDuration: z.enum(["FULL_TIME", "PART_TIME"]).optional(),
})

export const updateUserSchema = createUserSchema.partial().extend({
    id: z.string().cuid(),
})

// --- SHIFTS ---
export const createShiftSchema = z.object({
    userId: z.string().cuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)"),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Format d'heure invalide (HH:MM)"),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Format d'heure invalide (HH:MM)"),
    breakMinutes: z.coerce.number().min(0).max(480).default(0),
    notes: z.string().max(500).optional().nullable(),
})

export const updateShiftSchema = createShiftSchema.partial().extend({
    id: z.string().cuid(),
})

// --- STOCK / INGRÉDIENTS ---
export const createIngredientSchema = z.object({
    name: z.string().min(1, "Le nom est requis").max(100),
    category: z.string().min(1, "La catégorie est requise").max(50),
    currentStock: z.coerce.number().min(0).default(0),
    unit: z.enum(["KG", "G", "L", "CL", "ML", "PIECE"]).default("KG"),
    minStock: z.coerce.number().min(0).default(0),
    pricePerUnit: z.coerce.number().min(0),
    supplierId: z.string().cuid().optional().nullable(),
    allergens: z.array(z.string()).default([]),
    lastBatchNo: z.string().max(50).optional().nullable(),
    lastDLC: z.coerce.date().optional().nullable(),
})

export const updateIngredientSchema = createIngredientSchema.partial().extend({
    id: z.string().cuid(),
})

// --- TRANSACTIONS CAISSE ---
export const createCashTransactionSchema = z.object({
    amount: z.coerce.number().positive("Le montant doit être positif"),
    type: z.enum(["IN", "OUT"]),
    description: z.string().min(1, "La description est requise").max(255),
    categoryId: z.string().cuid().optional().nullable(),
    date: z.coerce.date().optional(),
})

export const updateCashTransactionSchema = createCashTransactionSchema.partial().extend({
    id: z.string().cuid(),
})

// --- CATÉGORIES CAISSE ---
export const createCashCategorySchema = z.object({
    name: z.string().min(1, "Le nom est requis").max(50),
    type: z.enum(["IN", "OUT"]),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur invalide").optional().nullable(),
})

// --- DOCUMENTS EMPLOYÉ ---
export const createDocumentSchema = z.object({
    userId: z.string().cuid(),
    name: z.string().min(1, "Le nom est requis").max(100),
    type: z.enum(["CONTRACT", "PAYSLIP", "ID_CARD", "OTHER"]),
    category: z.enum(["JURIDIQUE", "PAIE", "RH", "OTHER"]).default("OTHER"),
    url: z.string().url("URL invalide"),
    month: z.coerce.number().min(1).max(12).optional().nullable(),
    year: z.coerce.number().min(2000).max(2100).optional().nullable(),
})

// Type exports pour TypeScript
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type CreateShiftInput = z.infer<typeof createShiftSchema>
export type CreateIngredientInput = z.infer<typeof createIngredientSchema>
export type CreateCashTransactionInput = z.infer<typeof createCashTransactionSchema>
export type CreateCashCategoryInput = z.infer<typeof createCashCategorySchema>
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>
