import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

export async function GET() {
    try {
        // Cette commande va synchroniser le schéma avec la base de données de production
        // On utilise db push car on est en phase de développement rapide
        // On fixe la version pour éviter que npx ne télécharge la v7 (breaking changes)
        console.log("Démarrage de la synchronisation Prisma (v5.22.0)...")
        const output = execSync('npx prisma@5.22.0 db push --accept-data-loss', {
            encoding: 'utf-8',
            env: { ...process.env }
        })
        console.log("Résultat Prisma:", output)

        return NextResponse.json({
            success: true,
            message: "La base de données a été synchronisée avec succès.",
            output: output
        })
    } catch (error: any) {
        console.error("Erreur de synchronisation Prisma:", error)
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}
