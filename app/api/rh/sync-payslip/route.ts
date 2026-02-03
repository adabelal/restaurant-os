import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    // Une clé API simple pour sécuriser l'appel depuis N8N
    const apiKey = req.headers.get("x-api-key")
    if (!process.env.N8N_API_KEY || apiKey !== process.env.N8N_API_KEY) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { employeeName, filename, driveUrl } = body

        if (!employeeName || !filename || !driveUrl) {
            return NextResponse.json({ error: "Missing fields (employeeName, filename, driveUrl)" }, { status: 400 })
        }

        // Format attendu du fichier: Année_Mois_NOM_BdP.pdf
        const parts = filename.split('_')
        if (parts.length < 3) {
            return NextResponse.json({ error: "Invalid filename format. Expected: YYYY_MM_NAME_..." }, { status: 400 })
        }

        const year = parseInt(parts[0])
        const month = parseInt(parts[1])

        // Recherche de l'employé par son nom (insensible à la casse)
        const user = await prisma.user.findFirst({
            where: {
                name: {
                    contains: employeeName,
                    mode: 'insensitive'
                }
            }
        })

        if (!user) {
            return NextResponse.json({ error: `Employee '${employeeName}' not found` }, { status: 404 })
        }

        // Création du lien dans la base de données
        const doc = await prisma.employeeDocument.create({
            data: {
                userId: user.id,
                name: `Fiche de Paie ${month}/${year}`,
                url: driveUrl,
                type: "PAYSLIP",
                category: "PAIE",
                month,
                year
            }
        })

        return NextResponse.json({
            success: true,
            message: `Payslip for ${user.name} linked successfully`,
            docId: doc.id
        })
    } catch (error: any) {
        console.error("API Sync Error:", error)
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
    }
}
