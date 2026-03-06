import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import crypto from "crypto"

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get("file") as File | null

        if (!file) {
            return NextResponse.json(
                { error: "Aucun fichier fourni" },
                { status: 400 }
            )
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Nettoyer le nom de fichier et ajouter un UUID natif pour éviter les conflits
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
        const fileName = `${crypto.randomUUID()}-${safeName}`

        // Cible le dossier public/uploads/invoices
        const uploadDir = join(process.cwd(), "public/uploads/invoices")

        // S'assurer que le dossier existe
        await mkdir(uploadDir, { recursive: true })

        const filePath = join(uploadDir, fileName)

        // Sauvegarder le fichier
        await writeFile(filePath, buffer)

        // Retourner l'URL publique relative
        const fileUrl = `/uploads/invoices/${fileName}`

        return NextResponse.json({ success: true, url: fileUrl })
    } catch (error) {
        console.error("Erreur lors de l'upload:", error)
        return NextResponse.json(
            { error: "Erreur lors du traitement du fichier" },
            { status: 500 }
        )
    }
}
