
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { moveFileToFolder } from '@/lib/google-drive'

// This is a temporary route for migration. It should be deleted after use.

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes

async function getAccessToken() {
    // Re-implementing simplified access token logic to avoid dependency issues in this temp script
    // Or we can import it if lib/google-drive.ts exports it
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET
    const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId!,
            client_secret: clientSecret!,
            refresh_token: refreshToken!,
            grant_type: 'refresh_token',
        }),
    })
    const data = await res.json()
    return data.access_token
}

async function listFiles(token: string, query: string) {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,parents)`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    return data.files || []
}

async function findFolderId(token: string, name: string, parentId: string | null = null) {
    const query = parentId
        ? `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
        : `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
    const files = await listFiles(token, query)
    return files.length > 0 ? files[0].id : null
}

async function createFolder(token: string, name: string, parentId: string | null = null) {
    const body: any = { name, mimeType: 'application/vnd.google-apps.folder' }
    if (parentId) body.parents = [parentId]
    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })
    const data = await res.json()
    return data.id
}

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'ADMIN') {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const logs: string[] = []
    const log = (msg: string) => {
        console.log(`[Migration] ${msg}`)
        logs.push(msg)
    }

    try {
        const token = await getAccessToken()
        log("Token obtained.")

        const rootId = await findFolderId(token, 'RESSOURCES_HUMAINES')
        if (!rootId) {
            return NextResponse.json({ error: "Dossier 'RESSOURCES_HUMAINES' non trouvé. Veuillez d'abord uploader un document pour le créer." }, { status: 400 })
        }

        // 1. Move from old RH folder
        const oldRhId = await findFolderId(token, 'RH - Restaurant OS')
        if (oldRhId) {
            log(`Migrating 'RH - Restaurant OS' (${oldRhId})...`)
            const empFolders = await listFiles(token, `'${oldRhId}' in parents and mimeType='application/vnd.google-apps.folder'`)

            for (const empF of empFolders) {
                log(`Processing: ${empF.name}`)
                const newEmpFolderId = await findFolderId(token, empF.name, rootId) || await createFolder(token, empF.name, rootId)

                const typeFolders = await listFiles(token, `'${empF.id}' in parents and mimeType='application/vnd.google-apps.folder'`)
                for (const typeF of typeFolders) {
                    const newTypeFolderId = await findFolderId(token, typeF.name, newEmpFolderId) || await createFolder(token, typeF.name, newEmpFolderId)
                    const files = await listFiles(token, `'${typeF.id}' in parents and trashed=false`)
                    for (const file of files) {
                        log(`  Moving ${file.name} to ${empF.name}/${typeF.name}`)
                        await moveFileToFolder(file.id, newTypeFolderId)
                    }
                }
            }
        }

        // 2. Move Contracts from ADMINISTRATION
        const adminId = await findFolderId(token, 'ADMINISTRATION')
        if (adminId) {
            const contractsId = await findFolderId(token, 'Contrats', adminId)
            if (contractsId) {
                log(`Migrating 'ADMINISTRATION/Contrats'...`)
                const yearFolders = await listFiles(token, `'${contractsId}' in parents and mimeType='application/vnd.google-apps.folder'`)

                const employees = await prisma.user.findMany({ select: { id: true, name: true } })

                for (const yearF of yearFolders) {
                    const files = await listFiles(token, `'${yearF.id}' in parents and trashed=false`)
                    for (const file of files) {
                        const nameMatch = file.name.match(/Contrat_(.+)\.pdf/i)
                        if (nameMatch) {
                            const shortName = nameMatch[1].toUpperCase()
                            const employee = employees.find(e => {
                                const clean = e.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                                return clean.includes(shortName.toLowerCase())
                            })

                            if (employee) {
                                const newEmpFolderId = await findFolderId(token, employee.name, rootId) || await createFolder(token, employee.name, rootId)
                                const contractFolderId = await findFolderId(token, 'Contrats', newEmpFolderId) || await createFolder(token, 'Contrats', newEmpFolderId)
                                log(`  Moving contract ${file.name} to ${employee.name}/Contrats`)
                                await moveFileToFolder(file.id, contractFolderId)
                            } else {
                                log(`  Warning: No employee match for ${file.name}`)
                            }
                        }
                    }
                }
            }
        }

        return NextResponse.json({ success: true, logs })
    } catch (e: any) {
        log(`FATAL ERROR: ${e.message}`)
        return NextResponse.json({ error: e.message, logs }, { status: 500 })
    }
}
