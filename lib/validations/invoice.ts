import { z } from 'zod';

export const LineItemSchema = z.object({
  description: z.string().describe("Description of the line item (product or service)."),
  quantity: z.string().describe("Quantity of the item as a string (e.g., '2', '4.5'). Use '1' if not specified."),
  unitPrice: z.string().describe("Unit price of the item as a decimal string without currency symbol (e.g., '12.50'). Use '0.00' if not found."),
  totalPrice: z.string().describe("Total price for this line item as a decimal string without currency symbol (e.g., '25.00'). Use '0.00' if not found.")
});

export const InvoiceResultSchema = z.object({
  // Identification
  invoiceNumber: z.string().describe("Invoice number as printed on the document (e.g., 'FA-2024-0142'). Use 'NON_IDENTIFIE' if not found."),
  Date: z.string().describe("Date of the invoice in YYYY-MM-DD format. If only month and year are known, use YYYY-MM-01."),
  dueDate: z.string().describe("Payment due date in YYYY-MM-DD format. Use 'NON_IDENTIFIE' if not found."),

  // Supplier
  Tiers: z.string().describe("Name of the supplier/company, formatted in uppercase with underscores separating words (e.g., METRO, GRAND_FRAIS). This is the seller, NOT SARL SIWA which is the buyer."),
  supplierSiret: z.string().describe("SIRET or SIREN number of the supplier if visible on the document. Use 'NON_IDENTIFIE' if not found."),
  supplierAddress: z.string().describe("Full postal address of the supplier as printed on the document. Use 'NON_IDENTIFIE' if not found."),

  // Amounts
  amountHT: z.string().describe("Total amount excluding taxes (HT) as a decimal string (e.g., '193.75'). Use '0.00' if not found."),
  vatRate: z.string().describe("Main VAT rate as a decimal string (e.g., '20.0', '10.0', '5.5'). Use '0.0' if not found or mixed rates."),
  vatAmount: z.string().describe("Total VAT amount as a decimal string (e.g., '38.75'). Use '0.00' if not found."),
  Montant: z.string().describe("Total amount including all taxes (TTC) as a decimal string without currency symbol (e.g., '232.50'). This is the final amount to pay. If not found, use '0.00'."),

  // Payment
  paymentMethod: z.string().describe("Payment method: CB, VIREMENT, PRELEVEMENT, CHEQUE, ESPECES, or NON_IDENTIFIE if not found."),
  paymentReference: z.string().describe("Payment reference or bank reference if visible. Use 'NON_IDENTIFIE' if not found."),

  // Line items
  lineItems: z.array(LineItemSchema).describe("List of individual products or services on the invoice. Extract as many as possible with descriptions, quantities, unit prices, and totals."),

  // AI Metadata
  confidence: z.number().min(0).max(1).describe("Confidence score from 0.0 to 1.0 indicating how sure you are about the extracted data. Use 0.9+ if clear, 0.5-0.8 if partially readable, below 0.5 if very uncertain."),
  Resume: z.string().describe("A comprehensive, detailed paragraph summarizing the invoice: what was purchased (list ALL items with quantities and prices), the supplier context, and any notable details. This text will be used for semantic vector search, so include maximum detail about the products."),
  
  // Page info
  Start_Page: z.number().int().describe("The starting page number of this invoice in the document, starting from 1."),
  End_Page: z.number().int().describe("The ending page number of this invoice in the document, starting from 1. For a single-page invoice, Start_Page = End_Page.")
});

export const InvoicesResponseSchema = z.object({
  invoices: z.array(InvoiceResultSchema).describe("List of invoices extracted from the document.")
});

export type LineItem = z.infer<typeof LineItemSchema>;
export type InvoiceResult = z.infer<typeof InvoiceResultSchema>;
export type InvoicesResponse = z.infer<typeof InvoicesResponseSchema>;
