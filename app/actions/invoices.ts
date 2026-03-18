import { PDFDocument } from 'pdf-lib';
import { extractInvoicesFromPdf, generateInvoiceEmbedding } from '@/lib/gemini-service';
import { uploadPdfToDrive } from '@/lib/google-drive';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { exec } from 'child_process';
// Define the response that will be sent back to the client
export type ProcessInvoiceState = {
  success: boolean;
  message: string;
  errors?: string[];
  processedCount?: number;
};

export async function processInvoiceDocument(
  prevState: ProcessInvoiceState | null,
  formData: FormData
): Promise<ProcessInvoiceState> {
  const session = await getServerSession();
  
  if (!session?.user) {
    return { success: false, message: "Unauthorized: Please log in." };
  }

  try {
    const file = formData.get('file') as File | null;
    if (!file) {
      return { success: false, message: "No file provided" };
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);

    // 1. Send to Gemini for intelligent extraction
    const extractionResult = await extractInvoicesFromPdf(pdfBytes, file.type);
    const invoices = extractionResult.invoices;

    if (!invoices || invoices.length === 0) {
       return { success: false, message: "No invoices found in the document." };
    }

    // 2. Load the original PDF to slice it
    let pdfDoc: PDFDocument | null = null;
    if (file.type === 'application/pdf') {
       pdfDoc = await PDFDocument.load(pdfBytes);
    }

    const processedInvoices = await Promise.all(
      invoices.map(async (invoiceData, index) => {
        try {
          let slicedPdfBytes = pdfBytes; // fallback to full if not PDF or slicing fails
          let isSliced = false;

          // Slice PDF if it's a PDF and pages are specified properly
          if (pdfDoc && invoiceData.Start_Page && invoiceData.End_Page && invoiceData.Start_Page <= invoiceData.End_Page) {
            try {
              const newPdf = await PDFDocument.create();
              const startIdx = invoiceData.Start_Page - 1;
              const endIdx = invoiceData.End_Page - 1;
              const indices = Array.from({ length: endIdx - startIdx + 1 }, (_, i) => startIdx + i);
              
              const copiedPages = await newPdf.copyPages(pdfDoc, indices);
              copiedPages.forEach(p => newPdf.addPage(p));
              const pdfResult = await newPdf.save();
              slicedPdfBytes = new Uint8Array(pdfResult);
              isSliced = true;
            } catch (err) {
              console.warn("Could not slice PDF for invoice, uploading full.", err);
            }
          }

          // Generate file name
          const dateStr = invoiceData.Date || new Date().toISOString().split('T')[0];
          const fileName = `${dateStr}_${invoiceData.Tiers}_${invoiceData.Montant}.pdf`;

          // 3. Upload sliced PDF to Google Drive
          // It will use the environment folder ID or the one hardcoded if missing
          const driveResult = await uploadPdfToDrive(fileName, slicedPdfBytes);

          // 4. Generate Semantic Embedding
          const textToEmbed = `Date: ${invoiceData.Date}. Fournisseur: ${invoiceData.Tiers}. Montant TTC: ${invoiceData.Montant}€. Résumé: ${invoiceData.Resume}`;
          const embeddingVector = await generateInvoiceEmbedding(textToEmbed);
          const vectorString = `[${embeddingVector.join(',')}]`;

          // 5. Store in Prisma Database
          // Using executeRaw because Prisma doesn't officially support direct vector insertion in standard create without extensions typed this way in older versions.
          // In Prisma 5.2x with preview feature postgresqlExtensions, typical syntax: embedding: embeddingVector
          
          await prisma.$executeRaw`
             INSERT INTO "Invoice" ("id", "date", "supplierName", "amount", "driveFileId", "driveWebViewUrl", "originalFileName", "status", "embedding", "updatedAt") 
             VALUES (
               gen_random_uuid()::text, 
               ${new Date(invoiceData.Date)}::timestamp, 
               ${invoiceData.Tiers}, 
               ${parseFloat(invoiceData.Montant)}, 
               ${driveResult.id}, 
               ${driveResult.webViewLink}, 
               ${file.name}, 
               'PROCESSED'::"InvoiceProcessingStatus",
               ${vectorString}::vector,
               NOW()
             )
          `;

          return { success: true, data: invoiceData };
        } catch (error) {
          console.error(`Failed processing invoice ${index} (${invoiceData.Tiers}):`, error);
          
          // Log failed attempt in DB if possible
          try {
             await prisma.invoice.create({
               data: {
                 date: new Date(),
                 supplierName: invoiceData.Tiers || "UNKNOWN",
                 amount: parseFloat(invoiceData.Montant) || 0,
                 status: "ERROR",
                 originalFileName: file.name,
                 errorMessage: error instanceof Error ? error.message : "Unknown processing error"
               }
             });
          } catch (e) {
             console.error("Could not write error to DB", e);
          }

          return { success: false, error: String(error) };
        }
      })
    );

    const successful = processedInvoices.filter(i => i.success).length;

    return { 
      success: true, 
      message: `Traitement terminé avec succès. ${successful} facture(s) traitée(s).`,
      processedCount: successful
    };

  } catch (error) {
    console.error("Critical error in processInvoiceDocument:", error);
    return { success: false, message: "An unexpected error occurred during processing." };
  }
}

export async function syncHistoricalInvoicesAction(formData: FormData): Promise<void> {
  console.log("🚀 Lancement asynchrone du script de synchronisation d'historique...");
  
  exec('npx tsx scripts/sync-drive-invoices.ts', (error, stdout, stderr) => {
    if (error) {
      console.error(`Erreur de synchronisation Drive: ${error instanceof Error ? error.message : error}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr de synchronisation Drive: ${stderr}`);
      return;
    }
    console.log(`Stdout de synchronisation Drive: ${stdout}`);
  });
}
