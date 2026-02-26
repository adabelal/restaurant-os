
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const { parse } = require('date-fns')
const { fr } = require('date-fns/locale')

const prisma = new PrismaClient()

async function main() {
    console.log('--- Cleaning up existing music data ---')
    await prisma.musicEvent.deleteMany()
    await prisma.musicBand.deleteMany()
    console.log('Cleanup complete.')

    const csvPath = path.join(process.cwd(), 'Suivie groupe - Feuille 1.csv')
    const content = fs.readFileSync(csvPath, 'utf-8')
    const lines = content.split('\n')

    const dataLines = lines.slice(1)

    let bandsCount = 0
    let eventsCount = 0

    for (const line of dataLines) {
        if (!line.trim()) continue

        const parts = []
        let currentPart = ''
        let inQuotes = false

        for (let i = 0; i < line.length; i++) {
            const char = line[i]
            if (char === '"') {
                inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
                parts.push(currentPart.trim())
                currentPart = ''
            } else {
                currentPart += char
            }
        }
        parts.push(currentPart.trim())

        const dateStr = parts[0]
        const bandName = parts[1]
        const isConfirmed = parts[2] ? parts[2].toString().toUpperCase() === 'TRUE' : false
        const paymentMethodRaw = parts[3]
        const recipient = parts[4]
        const amountStr = parts[5] ? parts[5].replace('€', '').replace('OO', '00').replace(',', '.').replace(' ', '') : '0'

        if (!dateStr || !bandName || dateStr === 'SUIVIE GROUPE') continue

        try {
            const cleanDateStr = dateStr.replace(/^(lun|mar|mer|jeu|ven|sam|dim)\.\s+/i, '')
            const date = parse(cleanDateStr, 'd MMMM yyyy', new Date(), { locale: fr })

            if (isNaN(date.getTime())) continue

            let band = await prisma.musicBand.findUnique({ where: { name: bandName } })
            if (!band) {
                band = await prisma.musicBand.create({
                    data: {
                        name: bandName,
                        genre: 'Live Music',
                    }
                })
                bandsCount++
            }

            let method = 'TRANSFER'
            if (paymentMethodRaw && paymentMethodRaw.toUpperCase().includes('ESP')) method = 'CASH'
            if (paymentMethodRaw && paymentMethodRaw.toUpperCase().includes('CHE')) method = 'CHECK'
            if (recipient && recipient.toUpperCase().includes('GIP')) method = 'GUSO'

            const amount = parseFloat(amountStr) || 0

            let status = 'SCHEDULED'
            if (!isConfirmed) status = 'TENTATIVE'
            if (paymentMethodRaw && paymentMethodRaw.toUpperCase().includes('ANNUL')) status = 'CANCELLED'
            if (date < new Date() && status === 'SCHEDULED') status = 'COMPLETED'

            let invoiceStatus = 'PENDING'
            if (recipient && recipient.toUpperCase().includes('PAS DE FACT')) invoiceStatus = 'RECEIVED'

            await prisma.musicEvent.create({
                data: {
                    bandId: band.id,
                    date: date,
                    amount: amount,
                    paymentMethod: method,
                    status: status,
                    invoiceStatus: invoiceStatus,
                    notes: recipient ? `Règlement : ${recipient}` : null,
                    startTime: "20:30"
                }
            })
            eventsCount++

        } catch (e) {
            console.error(`Error processing line: ${line}`, e.message)
        }
    }

    console.log(`Import finished: ${bandsCount} bands created, ${eventsCount} events imported.`)
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
