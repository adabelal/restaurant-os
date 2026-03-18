import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env') });
config({ path: path.resolve(process.cwd(), '.env.local') });

import { getGoogleDriveClient } from '../lib/google-drive';
import { extractInvoicesFromPdf, generateInvoiceEmbedding } from '../lib/gemini-service';
import { prisma } from '../lib/prisma';

const FOLDER_ID = '1Tc1uRVOx-hZsuwUCmuxlEZzQOgAvTRqj';

async function main() {
  console.log('🚀 Démarrage de la synchronisation de l\'historique des factures depuis Google Drive...');
  console.log('📧 Compte de service : ' + process.env.GOOGLE_CLIENT_EMAIL);
  
  const drive = await getGoogleDriveClient();

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
        corpora: 'allDrives' // Works for folders everywhere if they have access
      });
      
      const items = response.data.files || [];
      for (const item of items) {
        if (item.mimeType === 'application/vnd.google-apps.folder') {
          // Si c'est un sous-dossier, on fouille dedans !
          const subFiles = await getFilesInFolder(item.id as string);
          allFiles = allFiles.concat(subFiles);
        } else if (item.mimeType === 'application/pdf' || item.mimeType?.includes('image/')) {
          allFiles.push(item);
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

  for (const file of files) {
    console.log(`\n--- Traitement de : ${file.name} (ID: ${file.id}) ---`);
    
    try {
      const existing = await prisma.$queryRaw`SELECT id FROM "Invoice" WHERE "driveFileId" = ${file.id} LIMIT 1`;
      if (Array.isArray(existing) && existing.length > 0) {
        console.log(`⏭️ Fichier déjà en base de données, ignoré.`);
        continue;
      }
    } catch (e: any) {
      console.error(`❌ Impossible de se connecter à PostgreSQL pour vérifier l'existence de la facture : ${e.message}`);
      console.log("⚠️ Assurez-vous d'être dans un environnement conteneurisé (Docker/Easypanel) ou changez DATABASE_URL vers localhost.");
      return; // Stop tout si la base est morte
    }

    try {
      const fileResponse = await drive.files.get(
        { fileId: file.id as string, alt: 'media', supportsAllDrives: true },
        { responseType: 'arraybuffer' }
      );
      
      const pdfBytes = new Uint8Array(fileResponse.data as ArrayBuffer);
      console.log(`   ➡️ PDF téléchargé (${pdfBytes.byteLength} bytes). Extraction avec Gemini 2.0 Flash...`);

      const extractionResult = await extractInvoicesFromPdf(pdfBytes, 'application/pdf');
      const invoices = extractionResult.invoices;

      if (!invoices || invoices.length === 0) {
        console.log(`   ⚠️ Aucune facture identifiée dans ce document.`);
        failCount++;
        continue;
      }

      console.log(`   ✅ ${invoices.length} facture(s) extraite(s) de ce PDF. Vectorisation et sauvegarde...`);

      for (const invoiceData of invoices) {
         try {
           const textToEmbed = `Date: ${invoiceData.Date}. Fournisseur: ${invoiceData.Tiers}. Montant TTC: ${invoiceData.Montant}€. Résumé: ${invoiceData.Resume}`;
           const embeddingVector = await generateInvoiceEmbedding(textToEmbed);
           const vectorString = `[${embeddingVector.join(',')}]`;

           const dateStr = invoiceData.Date || new Date().toISOString().split('T')[0];

           await prisma.$executeRaw`
             INSERT INTO "Invoice" ("id", "date", "supplierName", "amount", "driveFileId", "driveWebViewUrl", "originalFileName", "status", "embedding", "updatedAt") 
             VALUES (
               gen_random_uuid()::text, 
               ${new Date(dateStr)}::timestamp, 
               ${invoiceData.Tiers}, 
               ${parseFloat(invoiceData.Montant) || 0}, 
               ${file.id}, 
               ${file.webViewLink}, 
               ${file.name}, 
               'PROCESSED'::"InvoiceProcessingStatus",
               ${vectorString}::vector,
               NOW()
             )
           `;
           successCount++;
           console.log(`      ➡️ Sauvegardé : ${invoiceData.Tiers} - ${invoiceData.Montant}€`);
         } catch (dbErr: any) {
           console.error(`      ❌ Erreur DB pour ${invoiceData.Tiers}: `, dbErr.message);
           failCount++;
         }
      }

    } catch (err: any) {
      console.error(`   ❌ Échec du traitement du fichier ${file.name}: `, err.message || err);
      failCount++;
    }
  }

  console.log(`\n🎉 Synchronisation terminée ! ${successCount} factures créées en base, ${failCount} erreurs.`);
}

main().catch(console.error);
