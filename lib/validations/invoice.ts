import { z } from 'zod';

export const InvoiceResultSchema = z.object({
  Date: z.string().describe("Date of the invoice in YYYY-MM-DD format. If only month and year are known, use YYYY-MM-01."),
  Tiers: z.string().describe("Name of the supplier/company, formatted in uppercase with underscores separating words (e.g., MAISON_CALMUS, LA_POSTE)."),
  Montant: z.string().describe("Total amount including taxes (TTC) of the invoice as a decimal string without the currency symbol (e.g., '24.60'). If not found, use '00.00'."),
  Start_Page: z.number().int().describe("The starting page number of this invoice in the document, starting from 1."),
  End_Page: z.number().int().describe("The ending page number of this invoice in the document, starting from 1. For a single-page invoice, Start_Page = End_Page."),
  Resume: z.string().describe("A comprehensive and detailed summary of the invoice content, including the names of the items purchased, the context of the expense, and any relevant details. This will be used for semantic vector search.")
});

export const InvoicesResponseSchema = z.object({
  invoices: z.array(InvoiceResultSchema).describe("List of invoices extracted from the document.")
});

export type InvoiceResult = z.infer<typeof InvoiceResultSchema>;
export type InvoicesResponse = z.infer<typeof InvoicesResponseSchema>;
