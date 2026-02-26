
import { PrismaClient } from "@prisma/client"
import * as xlsx from "xlsx"
import fs from "fs"
import path from "path"
import { parse } from "date-fns"
import { fr } from "date-fns/locale"

const prisma = new PrismaClient()

const FILE_PATH = path.join(process.cwd(), "Suivie groupe - Feuille 1.csv")

async function main() {
    console.log(`Reading file from ${FILE_PATH}`)

    if (!fs.existsSync(FILE_PATH)) {
        console.error("File not found!")
        process.exit(1)
    }

    // Read CSV using XLSX
    const workbook = xlsx.readFile(FILE_PATH, { type: "file", raw: true }) // raw: true to keep dates as strings if possible
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]

    // Convert to JSON array of arrays
    const rows: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 })

    console.log(`Found ${rows.length} rows.`)

    let successCount = 0
    let errorCount = 0

    // Start at index 1 to skip header "SUIVIE GROUPE" or checking content
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i]

        // Quick validation: Need at least a date and a name
        if (row.length < 2 || !row[0] || !row[1]) {
            console.log(`Skipping row ${i}: Invalid or empty`, row)
            continue
        }

        const dateStr = row[0].toString().trim()
        const bandName = row[1].toString().trim().toUpperCase() // Standardize names
        const statusBool = row[2] // TRUE/FALSE
        const col3 = row[3] ? row[3].toString().trim() : "" // Payment Method or "Annulé"
        const col4 = row[4] ? row[4].toString().trim() : "" // Notes / Payee
        const amountStr = row[5] ? row[5].toString().replace(",", ".").replace(/[^\d.]/g, "") : "0"

        // Skip header row if strictly equal to title
        if (dateStr.includes("SUIVIE GROUPE")) continue

        // DATE PARSING
        // Format: "ven. 20 sept. 2024"
        // Clean up dots in months for date-fns if needed, but 'fr' locale might expect strictness
        // Easier manual map for French months if date-fns fails on abbreviations
        let date: Date | null = null
        try {
            // Try parsing with standard format
            // Removing "ven. ", "sam. " etc might help standard JS Date parse, but date-fns is better
            // The pattern seems to be "EEEE d MMMM yyyy" but months are abbr.
            // clean string: replace "sept." with "septembre", "janv." with "janvier" etc?

            const cleanDateStr = normalizeFrenchDate(dateStr)
            date = parse(cleanDateStr, "EEEE d MMMM yyyy", new Date(), { locale: fr })

            if (isNaN(date.getTime())) {
                // Fallback: try parsing just the date part without day name "20 sept. 2024"
                const parts = cleanDateStr.split(" ")
                if (parts.length >= 4) {
                    const newStr = parts.slice(1).join(" ")
                    date = parse(newStr, "d MMMM yyyy", new Date(), { locale: fr })
                }
            }
        } catch (e) {
            console.error(`Row ${i}: Failed to parse date "${dateStr}"`)
            errorCount++
            continue
        }

        if (!date || isNaN(date.getTime())) {
            console.error(`Row ${i}: Invalid date "${dateStr}"`)
            errorCount++
            continue
        }

        // BAND CREATION / FETCH
        let band
        try {
            band = await prisma.musicBand.upsert({
                where: { name: bandName },
                update: {},
                create: { name: bandName },
            })
        } catch (e) {
            console.error(`Row ${i}: Failed to upsert band "${bandName}"`, e)
            errorCount++
            continue
        }

        // DETERMINING EVENT FIELDS
        let paymentMethod = "TRANSFER" // Default
        let status = "SCHEDULED"
        let invoiceStatus = "PENDING"
        let notes = col4
        const amount = parseFloat(amountStr) || 0

        // Analyze Col 3 (Payment/Status)
        const infoCol = col3.toUpperCase()
        if (infoCol.includes("ESP")) paymentMethod = "CASH"
        else if (infoCol.includes("VIR")) paymentMethod = "TRANSFER"
        else if (infoCol.includes("CHÈQUE") || infoCol.includes("CHEQUE")) paymentMethod = "CHECK"
        else if (infoCol.includes("GUSO")) paymentMethod = "GUSO"

        // Status Logic
        if (infoCol.includes("ANNULÉ") || infoCol.includes("MALADE")) {
            status = "CANCELLED"
        } else if (statusBool === "FALSE" || statusBool === false) {
            // FALSE often means Tentative or Cancelled depending on context
            // If no cancellation text, assume Tentative/Option
            status = "TENTATIVE"
            if (infoCol === "") status = "CANCELLED" // Empirically from data, blank often means dropped
        }

        // Create Event
        try {
            await prisma.musicEvent.create({
                data: {
                    bandId: band.id,
                    date: date,
                    amount: amount,
                    paymentMethod: paymentMethod,
                    invoiceStatus: invoiceStatus,
                    status: status,
                    notes: notes,
                }
            })
            successCount++
            process.stdout.write(".")
        } catch (e) {
            console.error(`Row ${i}: Failed to create event`, e)
            errorCount++
        }
    }

    console.log("\nImport completed!")
    console.log(`Success: ${successCount}`)
    console.log(`Errors: ${errorCount}`)
}

function normalizeFrenchDate(str: string): string {
    // Basic normalization for common abbrevs in this file
    return str.toLowerCase()
        .replace("janv.", "janvier")
        .replace("févr.", "février")
        .replace("avr.", "avril")
        .replace("juil.", "juillet")
        .replace("sept.", "septembre")
        .replace("oct.", "octobre")
        .replace("nov.", "novembre")
        .replace("déc.", "décembre")
    // Handle full dots if they exist or missing dots
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
