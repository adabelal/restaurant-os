
const { PrismaClient } = require("@prisma/client")
const xlsx = require("xlsx")
const fs = require("fs")
const path = require("path")
const { parse } = require("date-fns")
const { fr } = require("date-fns/locale")

const prisma = new PrismaClient()

// Try multiple potential filenames
const POTENTIAL_FILES = [
    "Suivie groupe - Feuille 1.csv",
    "suivie_groupe.csv",
    "music.csv"
]

async function main() {
    let fileToRead = null
    for (const f of POTENTIAL_FILES) {
        if (fs.existsSync(path.join(process.cwd(), f))) {
            fileToRead = path.join(process.cwd(), f)
            break
        }
    }

    if (!fileToRead) {
        console.error(`Could not find any of these files: ${POTENTIAL_FILES.join(", ")}`)
        process.exit(1)
    }

    console.log(`Reading file: ${fileToRead}`)

    const workbook = xlsx.readFile(fileToRead, { type: "file", raw: true })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 })

    console.log(`Found ${rows.length} rows.`)

    let successCount = 0
    let errorCount = 0

    // Iterate rows (skip header if detected)
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        if (!row || row.length < 2) continue

        const rawDate = row[0] ? row[0].toString().trim() : ""
        const bandName = row[1] ? row[1].toString().trim() : ""

        if (!rawDate || !bandName) continue
        if (rawDate.toLowerCase().includes("suivie") || rawDate.toLowerCase().includes("date")) continue

        // Parse Date
        // Expected format: "ven. 20 sept. 2024"
        // Strategy: Remove day name prefix, normalize month, parse "d MMMM yyyy"
        let dateStr = rawDate.toLowerCase()
            // Remove known day prefixes (ven., sam., dim., etc.)
            .replace(/^(lun|mar|mer|jeu|ven|sam|dim)\.?\s*/, "")
            .trim()

        // Normalize months using a safe lookup to avoid double-replacement bugs
        // Remove day name prefix first
        dateStr = dateStr.replace(/^(lun|mar|mer|jeu|ven|sam|dim)([\.\s]+)/i, "").trim()

        const parts = dateStr.split(" ")
        // Expected parts: [Day, Month, Year] e.g. ["20", "sept.", "2024"]

        if (parts.length === 3) {
            const day = parts[0]
            let month = parts[1].toLowerCase().replace(".", "")
            const year = parts[2]

            // Map abbreviations/typos to full valid French months for date-fns
            const monthMap = {
                "janv": "janvier", "jan": "janvier",
                "févr": "février", "fevr": "février", "fev": "février", "fÃ©vr": "février", "fã©vr": "février",
                "mars": "mars", "mar": "mars",
                "avr": "avril", "avril": "avril",
                "mai": "mai",
                "juin": "juin",
                "juil": "juillet", "juillet": "juillet",
                "août": "août", "aout": "août", "aoÃ»t": "août", "aoã»t": "août",
                "sept": "septembre", "septembre": "septembre",
                "oct": "octobre", "octobre": "octobre",
                "nov": "novembre", "novembre": "novembre",
                "déc": "décembre", "dec": "décembre", "dÃ©c": "décembre", "dã©c": "décembre"
            }

            if (monthMap[month]) {
                month = monthMap[month]
            }

            dateStr = `${day} ${month} ${year}`
        }

        // Now convert "20 septembre 2024" -> Date
        let dateVal = parse(dateStr, "d MMMM yyyy", new Date(), { locale: fr })

        if (isNaN(dateVal.getTime())) {
            console.warn(`Row ${i}: Failed to parse date "${rawDate}" -> "${dateStr}"`)
            errorCount++
            continue
        }

        // Upsert Band
        const band = await prisma.musicBand.upsert({
            where: { name: bandName },
            update: {},
            create: { name: bandName },
        })

        // Parse Amounts
        let amount = 0
        if (row[5]) {
            // "185,41" -> 185.41
            let aStr = row[5].toString().replace(",", ".")
            // Remove non-numeric except dot
            aStr = aStr.replace(/[^\d.]/g, "")
            amount = parseFloat(aStr) || 0
        }

        // Payment Method
        let paymentMethod = "TRANSFER" // Default
        const infoCol = row[3] ? row[3].toString().toUpperCase() : ""
        if (infoCol.includes("ESP")) paymentMethod = "CASH"
        else if (infoCol.includes("CHEQUE") || infoCol.includes("CHÈQUE")) paymentMethod = "CHECK"
        else if (infoCol.includes("GUSO")) paymentMethod = "GUSO"

        // Status
        let status = "SCHEDULED"
        const statusBool = row[2] // TRUE/FALSE usually
        const notes = row[4] ? row[4].toString().trim() : ""

        if (infoCol.includes("ANNULÉ") || infoCol.includes("MALADE") || String(statusBool).toUpperCase() === "FALSE") {
            if (infoCol.includes("ANNULÉ") || infoCol.includes("MALADE")) {
                status = "CANCELLED"
            } else {
                // Just FALSE usually means Tentative/Option or Not Confirmed
                // But if amount is missing, assume cancelled/ignored?
                // Let's mark as TENTATIVE
                status = "TENTATIVE"
            }
        } else {
            // If date passed
            if (dateVal < new Date()) status = "COMPLETED"
        }

        // Invoice Status
        let invoiceStatus = "PENDING"
        if (amount > 0 && status === "COMPLETED") {
            // If notes say "Reçu", maybe? Not explicit in CSV.
            // Leave PENDING.
        }

        // Create Event
        try {
            // Idempotency check
            const exists = await prisma.musicEvent.findFirst({
                where: {
                    bandId: band.id,
                    date: {
                        equals: dateVal
                    }
                }
            })

            if (!exists) {
                await prisma.musicEvent.create({
                    data: {
                        bandId: band.id,
                        date: dateVal,
                        amount,
                        paymentMethod,
                        invoiceStatus,
                        status,
                        notes
                    }
                })
                successCount++
                process.stdout.write(".")
            }
        } catch (e) {
            console.error(`Row ${i}: DB Error`, e)
            errorCount++
        }
    }

    console.log(`\nDone. Imported ${successCount} events.`)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
