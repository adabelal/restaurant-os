'use server';

import { PDFDocument } from 'pdf-lib';
import { extractInvoicesFromPdf, generateInvoiceEmbedding, buildEmbeddingText } from '@/lib/gemini-service';
import { uploadPdfToDrive } from '@/lib/google-drive';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { exec } from 'child_process';
import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import { downloadFileFromDrive } from '@/lib/google-drive';

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── Types ──────────────────────────────────────────────────────────────────────
export type ProcessInvoiceState = {
  success: boolean;
  message: string;
  errors?: string[];
  processedCount?: number;
};

// ─── Process New Invoice Upload ─────────────────────────────────────────────────
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

    // 1. Send to Gemini for intelligent extraction (V2 enriched)
    const extractionResult = await extractInvoicesFromPdf(pdfBytes, file.type);
    const invoices = extractionResult.invoices;

    if (!invoices || invoices.length === 0) {
       return { success: false, message: "No invoices found in the document." };
    }

    // 2. Load or convert to PDF
    let pdfBytesToUpload = pdfBytes;
    let pdfDoc: PDFDocument | null = null;

    if (file.type.startsWith('image/')) {
      // Convert image to PDF using jsPDF
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const imgData = Buffer.from(pdfBytes).toString('base64');
      
      // Basic heuristic: fill the page
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.addImage(`data:${file.type};base64,${imgData}`, 'JPEG', 0, 0, pageWidth, pageHeight);
      
      const pdfArrayBuffer = doc.output('arraybuffer');
      pdfBytesToUpload = new Uint8Array(pdfArrayBuffer);
    } else if (file.type === 'application/pdf') {
       pdfDoc = await PDFDocument.load(pdfBytes);
    }

    const processedInvoices = await Promise.all(
      invoices.map(async (inv, index) => {
        try {
          let slicedPdfBytes = pdfBytesToUpload;

          // Slice PDF if applicable (only if it was originally a PDF)
          if (pdfDoc && inv.Start_Page && inv.End_Page && inv.Start_Page <= inv.End_Page) {
            try {
              const newPdf = await PDFDocument.create();
              const startIdx = inv.Start_Page - 1;
              const endIdx = inv.End_Page - 1;
              const indices = Array.from({ length: endIdx - startIdx + 1 }, (_, i) => startIdx + i);
              const copiedPages = await newPdf.copyPages(pdfDoc, indices);
              copiedPages.forEach(p => newPdf.addPage(p));
              const pdfResult = await newPdf.save();
              slicedPdfBytes = new Uint8Array(pdfResult);
            } catch (err) {
              console.warn("Could not slice PDF for invoice, uploading full.", err);
            }
          }

          // Generate file name
          const dateStr = inv.Date || new Date().toISOString().split('T')[0];
          const fileName = `${dateStr}_${inv.Tiers}_${inv.Montant}.pdf`;

          // 3. Upload to Google Drive
          const driveResult = await uploadPdfToDrive(fileName, slicedPdfBytes);

          // 4. Generate Semantic Embedding (enriched V2)
          const textToEmbed = buildEmbeddingText(inv);
          const embeddingVector = await generateInvoiceEmbedding(textToEmbed);
          const vectorString = `[${embeddingVector.join(',')}]`;

          // 5. Determine status
          const confidence = inv.confidence || 0;
          const ttc = parseFloat(inv.Montant) || 0;
          const status = (confidence < 0.7 || ttc === 0) ? 'TO_VALIDATE' : 'PROCESSED';

          const dueDateStr = inv.dueDate && inv.dueDate !== 'NON_IDENTIFIE' ? inv.dueDate : null;
          const lineItemsJson = JSON.stringify(inv.lineItems || []);

          // 6. Store in PostgreSQL with all enriched fields
          await prisma.$executeRaw`
            INSERT INTO "Invoice" (
              "id", "date", "supplierName", "amount", "driveFileId", "driveWebViewUrl", 
              "originalFileName", "status", "isSentToAccountant",
              "invoiceNumber", "dueDate", "supplierSiret", "supplierAddress",
              "amountHT", "vatRate", "vatAmount", "paymentMethod", "paymentReference",
              "confidence", "resume", "lineItems",
              "embedding", "updatedAt"
            ) VALUES (
              gen_random_uuid()::text, 
              ${new Date(dateStr)}::timestamp, 
              ${inv.Tiers}, 
              ${ttc}, 
              ${driveResult.id}, 
              ${driveResult.webViewLink}, 
              ${file.name}, 
              ${status}::"InvoiceProcessingStatus",
              false,
              ${inv.invoiceNumber !== 'NON_IDENTIFIE' ? inv.invoiceNumber : null},
              ${dueDateStr ? new Date(dueDateStr) : null}::timestamp,
              ${inv.supplierSiret !== 'NON_IDENTIFIE' ? inv.supplierSiret : null},
              ${inv.supplierAddress !== 'NON_IDENTIFIE' ? inv.supplierAddress : null},
              ${parseFloat(inv.amountHT) || null},
              ${parseFloat(inv.vatRate) || null},
              ${parseFloat(inv.vatAmount) || null},
              ${inv.paymentMethod !== 'NON_IDENTIFIE' ? inv.paymentMethod : null},
              ${inv.paymentReference !== 'NON_IDENTIFIE' ? inv.paymentReference : null},
              ${confidence},
              ${inv.Resume || null},
              ${lineItemsJson}::jsonb,
              ${vectorString}::jsonb,
              NOW()
            )
          `;

          return { success: true, data: inv };
        } catch (error) {
          console.error(`Failed processing invoice ${index} (${inv.Tiers}):`, error);
          
          try {
            await prisma.$executeRaw`
              INSERT INTO "Invoice" ("id", "date", "supplierName", "amount", "status", "originalFileName", "errorMessage", "updatedAt")
              VALUES (gen_random_uuid()::text, NOW(), ${inv.Tiers || 'UNKNOWN'}, ${parseFloat(inv.Montant) || 0}, 'ERROR'::"InvoiceProcessingStatus", ${file.name}, ${error instanceof Error ? error.message : 'Unknown error'}, NOW())
            `;
          } catch (e) {
            console.error("Could not write error to DB", e);
          }

          return { success: false, error: String(error) };
        }
      })
    );

    const successful = processedInvoices.filter(i => i.success).length;

    revalidatePath('/factures');
    
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

// ─── Update Invoice (Manual Edit) ───────────────────────────────────────────────
export async function updateInvoiceAction(formData: FormData): Promise<void> {
  const session = await getServerSession();
  if (!session?.user) return;

  const id = formData.get('id') as string;
  const supplierName = formData.get('supplierName') as string;
  const date = formData.get('date') as string;
  const invoiceNumber = formData.get('invoiceNumber') as string | null;
  const amountHT = formData.get('amountHT') as string | null;
  const vatRate = formData.get('vatRate') as string | null;
  const vatAmount = formData.get('vatAmount') as string | null;
  const amount = formData.get('amount') as string;
  const paymentMethod = formData.get('paymentMethod') as string | null;

  if (!id || !supplierName || !date || !amount) return;

  await prisma.$executeRaw`
    UPDATE "Invoice" SET
      "supplierName" = ${supplierName},
      "date" = ${new Date(date)}::timestamp,
      "invoiceNumber" = ${invoiceNumber || null},
      "amountHT" = ${amountHT ? parseFloat(amountHT) : null},
      "vatRate" = ${vatRate ? parseFloat(vatRate) : null},
      "vatAmount" = ${vatAmount ? parseFloat(vatAmount) : null},
      "amount" = ${parseFloat(amount)},
      "paymentMethod" = ${paymentMethod || null},
      "status" = 'PROCESSED'::"InvoiceProcessingStatus",
      "updatedAt" = NOW()
    WHERE "id" = ${id}
  `;

  revalidatePath('/factures');
}

// ─── Delete Invoice ─────────────────────────────────────────────────────────────
export async function deleteInvoiceAction(formData: FormData): Promise<void> {
  const session = await getServerSession();
  if (!session?.user) return;

  const id = formData.get('id') as string;
  if (!id) return;

  await prisma.$executeRaw`DELETE FROM "Invoice" WHERE "id" = ${id}`;
  
  revalidatePath('/factures');
}

// ─── Send to Accountant ────────────────────────────────────────────────────────
export async function sendInvoicesToAccountant(invoiceIds: string[], recipientEmail: string): Promise<{ success: boolean; message: string }> {
  const session = await getServerSession();
  if (!session?.user) return { success: false, message: "Non autorisé" };

  if (!process.env.RESEND_API_KEY) {
    return { success: false, message: "Clé API Resend manquante" };
  }

  try {
    // 1. Fetch invoices
    const invoices = await (prisma as any).invoice.findMany({
      where: { id: { in: invoiceIds } },
      select: { id: true, supplierName: true, amount: true, date: true, driveFileId: true, originalFileName: true }
    }) as any[];

    if (invoices.length === 0) return { success: false, message: "Aucune facture trouvée" };

    // 2. Download files from Drive
    const attachments = await Promise.all(
      invoices.map(async (inv) => {
        if (!inv.driveFileId) return null;
        try {
          const content = await downloadFileFromDrive(inv.driveFileId);
          return {
            filename: inv.originalFileName || `${inv.supplierName}_${inv.id.substring(0, 5)}.pdf`,
            content: content
          };
        } catch (e) {
          console.error(`Failed to download ${inv.driveFileId}`, e);
          return null;
        }
      })
    );

    const validAttachments = attachments.filter((a): a is { filename: string; content: Buffer } => a !== null);

    if (validAttachments.length === 0) {
      return { success: false, message: "Impossible de récupérer les fichiers sur Google Drive" };
    }

    // 3. Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'Restaurant OS <invoices@resend.dev>', // Replace with your domain if configured
      to: [recipientEmail],
      subject: `[Comptabilité] Transmission de ${invoices.length} factures - Restaurant OS`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #0F172A;">Transmission de factures</h2>
          <p>Bonjour,</p>
          <p>Veuillez trouver ci-joint <strong>${invoices.length} factures</strong> pour un montant total de <strong>${invoices.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0).toFixed(2)}€</strong>.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748B;">Envoyé automatiquement depuis Restaurant OS.</p>
        </div>
      `,
      attachments: validAttachments
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, message: `Erreur d'envoi : ${error.message}` };
    }

    // 4. Update status in DB
    await (prisma as any).invoice.updateMany({
      where: { id: { in: invoiceIds } },
      data: { isSentToAccountant: true }
    });

    revalidatePath('/factures');
    return { success: true, message: `${invoices.length} factures envoyées avec succès.` };

  } catch (error) {
    console.error("Critical error in sendInvoicesToAccountant:", error);
    return { success: false, message: "Une erreur inattendue est survenue." };
  }
}

// ─── Sync Historical from Drive ─────────────────────────────────────────────────
export async function syncHistoricalInvoicesAction(formData: FormData): Promise<void> {
  console.log("🚀 Lancement asynchrone du script de synchronisation V2...");
  
  exec('npx tsx scripts/sync-drive-invoices.ts', (error, stdout, stderr) => {
    if (error) {
      console.error(`Erreur de synchronisation Drive: ${error instanceof Error ? error.message : error}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }
    console.log(`Stdout: ${stdout}`);
  });
}
