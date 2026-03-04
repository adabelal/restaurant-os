import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOrCreateRhFolder, uploadFileToDrive } from '@/lib/google-drive'
import { revalidatePath } from 'next/cache'

export const runtime = 'nodejs'
export const maxDuration = 60

// Allowed MIME types & their extensions
const ALLOWED_TYPES: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
}

const MAX_SIZE_MB = 20

export async function POST(req: NextRequest) {
    // 1. Auth check
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    try {
        const formData = await req.formData()

        const file = formData.get('file') as File | null
        const userId = formData.get('userId') as string
        const docName = formData.get('name') as string
        const docType = formData.get('type') as string
        const monthStr = formData.get('month') as string
        const yearStr = formData.get('year') as string

        // 2. Validate inputs
        if (!file || !userId || !docName || !docType) {
            return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
        }

        // 3. Check file type
        if (!ALLOWED_TYPES[file.type]) {
            return NextResponse.json(
                { error: `Type de fichier non autorisé : ${file.type}` },
                { status: 400 }
            )
        }

        // 4. Check file size
        const sizeMB = file.size / (1024 * 1024)
        if (sizeMB > MAX_SIZE_MB) {
            return NextResponse.json(
                { error: `Fichier trop volumineux (max ${MAX_SIZE_MB} MB)` },
                { status: 400 }
            )
        }

        // 5. Get employee info for folder naming
        const employee = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true }
        })
        if (!employee) {
            return NextResponse.json({ error: 'Employé introuvable' }, { status: 404 })
        }

        // 6. Build a clean filename: {YYYY-MM}_{OriginalName} or {docType}_{OriginalName}
        const month = monthStr ? parseInt(monthStr).toString().padStart(2, '0') : null
        const year = yearStr ? yearStr : null
        const prefix = (year && month)
            ? `${year}-${month}`
            : new Date().toISOString().slice(0, 7)

        const ext = ALLOWED_TYPES[file.type]
        const safeName = docName.trim().replace(/[^a-zA-Z0-9_\-\. ]/g, '_')
        const fileName = `${prefix}_${safeName}.${ext}`

        // 7. Get or create Drive folder: RH > {Employé} > {Type}
        const folderId = await getOrCreateRhFolder(employee.name, docType)

        // 8. Upload to Google Drive
        const fileBuffer = Buffer.from(await file.arrayBuffer())
        const driveFile = await uploadFileToDrive(fileBuffer, fileName, file.type, folderId)

        // 9. Save document to DB
        await prisma.employeeDocument.create({
            data: {
                userId,
                name: `${docName} (${prefix})`,
                url: driveFile.webViewLink,
                type: docType as any,
                category: docType === 'PAYSLIP' ? 'PAIE' : 'JURIDIQUE',
                month: monthStr ? parseInt(monthStr) : null,
                year: yearStr ? parseInt(yearStr) : null,
            }
        })

        revalidatePath(`/rh/${userId}`)

        return NextResponse.json({
            success: true,
            driveId: driveFile.id,
            url: driveFile.webViewLink,
            fileName,
            message: `Fichier uploadé → Drive/RH/${employee.name}/${docType}`,
        })

    } catch (e: any) {
        console.error('[RH Upload Error]', e)
        return NextResponse.json(
            { error: e.message || 'Erreur lors de l\'upload' },
            { status: 500 }
        )
    }
}
