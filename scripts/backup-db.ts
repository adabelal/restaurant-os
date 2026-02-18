
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupDir = path.join(process.cwd(), 'backups', timestamp)

    // Create backup directory
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true })
    }

    console.log(`🚀 Starting backup to ${backupDir}...`)

    const models = [
        'user',
        'ingredient',
        'recipe',
        'recipeIngredient',
        'stockMovement',
        'supplier',
        'purchaseOrder',
        'invoiceItem',
        'bankTransaction',
        'financeCategory',
        'cashTransaction',
        'cashCategory',
        'shift',
        'employeeDocument',
        'haccpLog'
    ]

    for (const modelKey of models) {
        try {
            // @ts-ignore
            if (!prisma[modelKey]) {
                console.warn(`⚠️ Model ${modelKey} not found in Prisma Client`)
                continue
            }

            // @ts-ignore
            const data = await prisma[modelKey].findMany()
            const filePath = path.join(backupDir, `${modelKey}.json`)

            fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
            console.log(`✅ ${modelKey}: ${data.length} records saved.`)
        } catch (error) {
            console.error(`❌ Error backing up ${modelKey}:`, error)
        }
    }

    console.log(`\n✨ Backup completed successfully in ${backupDir}`)
}

backup()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
