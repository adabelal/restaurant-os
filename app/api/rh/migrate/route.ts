
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { moveFileToFolder, getOrCreateRhFolder } from '@/lib/google-drive'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes

async function getAccessToken() {
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
    if (!res.ok) throw new Error(`Drive list failed: ${JSON.stringify(data)}`)
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

        let rootId = await findFolderId(token, 'RESSOURCES_HUMAINES')
        if (!rootId) {
            log("Root 'RESSOURCES_HUMAINES' not found. Creating it...")
            rootId = await createFolder(token, 'RESSOURCES_HUMAINES')
        }

        const employees = await prisma.user.findMany({ select: { id: true, name: true } })

        // Helper to match employee by name (loose match)
        const findEmployee = (fileName: string) => {
            const cleanFile = fileName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            return employees.find(e => {
                const parts = e.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/)
                // Every part of employee name (e.g., "Laura", "Souchet") must be in filename
                return parts.every(p => cleanFile.includes(p))
            })
        }

        // 1. Source: RH - Restaurant OS (Old structure)
        const oldRhId = await findFolderId(token, 'RH - Restaurant OS')
        if (oldRhId) {
            log(`- Scan Source: 'RH - Restaurant OS'...`)
            const empFolders = await listFiles(token, `'${oldRhId}' in parents and mimeType='application/vnd.google-apps.folder'`)
            for (const empF of empFolders) {
                log(`  - Employé: ${empF.name}`)
                const subFolders = await listFiles(token, `'${empF.id}' in parents and mimeType='application/vnd.google-apps.folder'`)
                for (const subF of subFolders) {
                    const files = await listFiles(token, `'${subF.id}' in parents and trashed=false`)
                    for (const file of files) {
                        // Map old folder name to category
                        let category = 'OTHER'
                        const lowerSub = subF.name.toLowerCase()
                        if (lowerSub.includes('identit')) category = 'ID_CARD'
                        if (lowerSub.includes('dpae')) category = 'DPAE'
                        if (lowerSub.includes('paie')) category = 'PAYSLIP'
                        if (lowerSub.includes('contrat')) category = 'CONTRACT'

                        const targetFolderId = await getOrCreateRhFolder(empF.name, category)
                        log(`    -> Moving ${file.name} to ${empF.name}/${category}`)
                        await moveFileToFolder(file.id, targetFolderId)
                    }
                }
            }
        }

        // 2. Source: ADMINISTRATION / Contrats
        const adminId = await findFolderId(token, 'ADMINISTRATION')
        if (adminId) {
            const contratsId = await findFolderId(token, 'Contrats', adminId)
            if (contratsId) {
                log(`- Scan Source: 'ADMINISTRATION / Contrats'...`)
                const yearFolders = await listFiles(token, `'${contratsId}' in parents and mimeType='application/vnd.google-apps.folder'`)
                for (const yearF of yearFolders) {
                    const files = await listFiles(token, `'${yearF.id}' in parents and trashed=false`)
                    for (const file of files) {
                        const employee = findEmployee(file.name)
                        if (employee) {
                            const targetFolderId = await getOrCreateRhFolder(employee.name, 'CONTRACT')
                            log(`    -> Moving contract ${file.name} to ${employee.name}/Contrats`)
                            await moveFileToFolder(file.id, targetFolderId)
                        } else {
                            log(`    x No match found for contract: ${file.name}`)
                        }
                    }
                }
            }
        }

        // 3. Source: RESSOURCES_HUMAINES / Paie (restructuring current root)
        const paieId = await findFolderId(token, 'Paie', rootId)
        if (paieId) {
            log(`- Scan Source: 'RESSOURCES_HUMAINES / Paie'...`)
            const yearFolders = await listFiles(token, `'${paieId}' in parents and mimeType='application/vnd.google-apps.folder'`)
            for (const yearF of yearFolders) {
                const files = await listFiles(token, `'${yearF.id}' in parents and trashed=false`)
                for (const file of files) {
                    const employee = findEmployee(file.name)
                    if (employee) {
                        const targetFolderId = await getOrCreateRhFolder(employee.name, 'PAYSLIP')
                        log(`    -> Moving payslip ${file.name} to ${employee.name}/Fiches de paie`)
                        await moveFileToFolder(file.id, targetFolderId)
                    } else {
                        log(`    x No match found for payslip: ${file.name}`)
                    }
                }
            }
        }

        // 4. Source: RESSOURCES_HUMAINES / Gestion
        const gestionId = await findFolderId(token, 'Gestion', rootId)
        if (gestionId) {
            log(`- Scan Source: 'RESSOURCES_HUMAINES / Gestion'...`)
            const adminFolderId = await findFolderId(token, 'Administration', rootId) || await createFolder(token, 'Administration', rootId)
            const files = await listFiles(token, `'${gestionId}' in parents and trashed=false`)
            for (const file of files) {
                log(`    -> Moving ${file.name} to Administration`)
                await moveFileToFolder(file.id, adminFolderId)
            }
        }

        return NextResponse.json({ success: true, logs })
    } catch (e: any) {
        log(`FATAL ERROR: ${e.message}`)
        return NextResponse.json({ error: e.message, logs }, { status: 500 })
    }
}
