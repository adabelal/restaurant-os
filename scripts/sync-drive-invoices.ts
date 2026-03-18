import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env') });
config({ path: path.resolve(process.cwd(), '.env.local') });

import { getGoogleDriveOAuthClient } from '../lib/google-drive';
import { extractInvoicesFromPdf, generateInvoiceEmbedding, buildEmbeddingText } from '../lib/gemini-service';
import { prisma } from '../lib/prisma';

const FOLDER_ID = '1Tc1uRVOx-hZsuwUCmuxlEZzQOgAvTRqj';

async function main() {
  console.log('🚀 Démarrage de la synchronisation V2 (extraction enrichie) depuis Google Drive...');
  
  const drive = await getGoogleDriveOAuthClient();

  console.log(`📂 Recherche récursive des documents (PDF/Images) dans les sous-dossiers de : ${FOLDER_ID}...`);
  
  async function getFilesInFolder(folderId: string): Promise<any[]> {
    let allFiles: any[] = [];
    try {
      const response = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`, 
        fields: 'files(id, name, mimeType, webViewLink, webContentLink)',
        pageSize: 1000,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        corpora: 'allDrives'
      });
      
      const items = response.data.files || [];
      for (const item of items) {
        if (item.mimeType === 'application/vnd.google-apps.folder') {
          const subFiles = await getFilesInFolder(item.id as string);
          allFiles = allFiles.concat(subFiles);
        } else if (
          item.mimeType === 'application/pdf' || 
          item.mimeType?.startsWith('image/')
        ) {
          allFiles.push(item);
        } else {
          console.log(`   ⚠️ Format non supporté, ignoré : ${item.name} (${item.mimeType})`);
        }
      }
    } catch (err: any) {
      console.warn(`Attention: Impossible de lire le dossier ${folderId}. Message: ${err.message}`);
    }
    return allFiles;
  }

  const files = await getFilesInFolder(FOLDER_ID);

  if (!files || files.length === 0) {
    console.log('✅ Aucun document trouvé, ni ici ni dans les sous-dossiers.');
    return;
  }

  console.log(`✅ ${files.length} fichiers trouvés. Début du traitement séquentiel...`);

  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  for (const file of files) {
    console.log(`\n--- Traitement de : ${file.name} (${file.mimeType}) ---`);
    
    // Check if already processed
    try {
      const existing = await prisma.$queryRaw`SELECT id FROM "Invoice" WHERE "driveFileId" = ${file.id} LIMIT 1`;
      if (Array.isArray(existing) && existing.length > 0) {
        console.log(`⏭️ Fichier déjà en base de données, ignoré.`);
        skipCount++;
        continue;
      }
    } catch (e: any) {
      console.error(`❌ Impossible de se connecter à PostgreSQL : ${e.message}`);
      console.log("⚠️ Assurez-vous d'être dans un environnement conteneurisé (Docker/Easypanel) ou changez DATABASE_URL vers localhost.");
      return;
    }
    try {
      // Download file from Drive
      const fileResponse = await drive.files.get(
        { fileId: file.id as string, alt: 'media', supportsAllDrives: true },
        { responseType: 'arraybuffer' }
      );
      
      const fileBytes = new Uint8Array(fileResponse.data as ArrayBuffer);
      let mimeType = file.mimeType || 'application/pdf';
      let pdfBytesToUpload = fileBytes;

      console.log(`   ➡️ Téléchargé (${fileBytes.byteLength} bytes). Extraction Gemini V2...`);

      // If it's an image, convert to PDF for uniformity (optional but requested)
      if (mimeType.startsWith('image/')) {
        try {
          const { jsPDF } = await import('jspdf');
          const doc = new jsPDF();
          const imgData = Buffer.from(fileBytes).toString('base64');
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          doc.addImage(`data:${mimeType};base64,${imgData}`, 'JPEG', 0, 0, pageWidth, pageHeight);
          pdfBytesToUpload = new Uint8Array(doc.output('arraybuffer'));
        } catch (convErr) {
          console.warn(`      ⚠️ Échec conversion PDF pour ${file.name}, utilisation de l'image brute.`);
        }
      }

      // Extract with Gemini (supports PDF + images)
      const extractionResult = await extractInvoicesFromPdf(fileBytes, mimeType);
      const invoices = extractionResult.invoices;

      if (!invoices || invoices.length === 0) {
        console.log(`   ⚠️ Aucune facture identifiée dans ce document.`);
        failCount++;
        continue;
      }

      console.log(`   ✅ ${invoices.length} facture(s) extraite(s). Vectorisation et sauvegarde...`);

      for (const inv of invoices) {
        try {
          // Build rich embedding text
          const textToEmbed = buildEmbeddingText(inv);
          const embeddingVector = await generateInvoiceEmbedding(textToEmbed);
          const vectorString = `[${embeddingVector.join(',')}]`;

          // Determine status
          const confidence = inv.confidence || 0;
          const ttc = parseFloat(inv.Montant) || 0;
          const status = (confidence < 0.7 || ttc === 0) ? 'TO_VALIDATE' : 'PROCESSED';

          const dateStr = inv.Date || new Date().toISOString().split('T')[0];
          const dueDateStr = inv.dueDate && inv.dueDate !== 'NON_IDENTIFIE' ? inv.dueDate : null;
          const lineItemsJson = JSON.stringify(inv.lineItems || []);

          await prisma.$executeRaw`
            INSERT INTO "Invoice" (
              "id", "date", "supplierName", "amount", "driveFileId", "driveWebViewUrl", 
              "originalFileName", "status", "isSentToAccountant",
              "invoiceNumber", "dueDate", "supplierSiret", "supplierAddress",
              "amountHT", "vatRate", "vatAmount", "paymentMethod", "paymentReference",
              "confidence", "lineItems",
              "embedding", "updatedAt"
            ) VALUES (
              gen_random_uuid()::text, 
              ${new Date(dateStr)}::timestamp, 
              ${inv.Tiers}, 
              ${ttc}, 
              ${file.id}, 
              ${file.webViewLink}, 
              ${file.name}, 
              ${status}::"InvoiceProcessingStatus",
              true,
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
              ${lineItemsJson}::jsonb,
              ${vectorString}::jsonb,
              NOW()
            )
          `;
          successCount++;
          const statusLabel = status === 'TO_VALIDATE' ? '⚠️ À VALIDER' : '✅';
          console.log(`      ${statusLabel} ${inv.Tiers} - HT:${inv.amountHT}€ TVA:${inv.vatAmount}€ TTC:${inv.Montant}€ [${inv.paymentMethod}] (confiance: ${(confidence * 100).toFixed(0)}%)`);
        } catch (dbErr: any) {
          console.error(`      ❌ Erreur DB pour ${inv.Tiers}: `, dbErr.message);
          failCount++;
        }
      }

    } catch (err: any) {
      console.error(`   ❌ Échec du traitement du fichier ${file.name}: `, err.message || err);
      
      // Log error in DB
      try {
        await prisma.$executeRaw`
          INSERT INTO "Invoice" ("id", "date", "supplierName", "amount", "driveFileId", "originalFileName", "status", "errorMessage", "isSentToAccountant", "updatedAt")
          VALUES (gen_random_uuid()::text, NOW(), 'ERREUR_LECTURE', 0, ${file.id}, ${file.name}, 'ERROR'::"InvoiceProcessingStatus", ${err.message || 'Unknown error'}, true, NOW())
        `;
      } catch (_) { /* silently fail */ }
      
      failCount++;
    }
  }

  console.log(`\n🎉 Synchronisation V2 terminée !`);
  console.log(`   ✅ ${successCount} factures créées`);
  console.log(`   ⏭️ ${skipCount} fichiers déjà en base (ignorés)`);
  console.log(`   ❌ ${failCount} erreurs`);
}

main().catch(console.error);
