
import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()
const PROCESSED_DIR = path.join(process.cwd(), 'processed_invoices')

async function main() {
    console.log("🚀 Démarrage de l'import Prisma...")

    // Check if dir exists
    try {
        await fs.access(PROCESSED_DIR)
    } catch {
        console.log("❌ Dossier 'processed_invoices' introuvable. Lancez le script Python d'abord.")
        return
    }

    const files = await fs.readdir(PROCESSED_DIR)
    const jsonFiles = files.filter(f => f.endsWith('.json'))

    console.log(`📦 ${jsonFiles.length} factures à importer.`)

    for (const file of jsonFiles) {
        try {
            const raw = await fs.readFile(path.join(PROCESSED_DIR, file), 'utf-8')
            const data = JSON.parse(raw)

            // 1. Supplier
            const supplierName = data.supplierName || "INCONNU"
            let supplier = await prisma.supplier.findFirst({
                where: { name: { contains: supplierName, mode: 'insensitive' } }
            })

            if (!supplier) {
                supplier = await prisma.supplier.create({
                    data: { name: supplierName }
                })
                console.log(`   🆕 Fournisseur créé: ${supplierName}`)
            }

            // 2. Check for duplicate
            const existing = await prisma.purchaseOrder.findFirst({
                where: { invoiceNo: data.invoiceNo || `AUTO-${path.basename(file, '.json')}` }
            })
            if (existing) {
                console.log(`   ⏭️ Déjà importé: ${file}`)
                continue
            }

            // 3. Purchase Order
            const order = await prisma.purchaseOrder.create({
                data: {
                    supplierId: supplier.id,
                    date: new Date(data.date || new Date()),
                    invoiceNo: data.invoiceNo || `AUTO-${path.basename(file, '.json')}`,
                    totalAmount: data.totalAmount || 0,
                    status: 'VALIDATED',
                    paymentMethod: data.paymentMethod || 'PRELEVEMENT',
                }
            })

            // 4. Items
            if (data.items && Array.isArray(data.items)) {
                await prisma.invoiceItem.createMany({
                    data: data.items.map((item: any) => ({
                        purchaseOrderId: order.id,
                        rawLabel: item.name || "Article Inconnu",
                        quantity: parseFloat(item.quantity) || 1,
                        unitPrice: parseFloat(item.unitPrice) || 0,
                        totalPrice: parseFloat(item.totalPrice) || 0,
                        packaging: item.unit || null
                    }))
                })
            }

            console.log(`✅ Importé: ${file} (${data.items?.length || 0} lignes)`)

            // Move to 'imported' folder
            const importedDir = path.join(PROCESSED_DIR, 'imported')
            try { await fs.access(importedDir) } catch { await fs.mkdir(importedDir) }
            await fs.rename(path.join(PROCESSED_DIR, file), path.join(importedDir, file))

        } catch (error) {
            console.error(`❌ Erreur sur ${file}:`, error)
        }
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect())
