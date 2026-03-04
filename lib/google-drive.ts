/**
 * Google Drive Helper - Pure fetch, no googleapis lib needed
 * Uses OAuth2 refresh_token from Mail/token.json
 */

import fs from 'fs'
import path from 'path'

const TOKEN_PATH = path.join(process.cwd(), 'Mail', 'token.json')
const CREDENTIALS_PATH = path.join(process.cwd(), 'Mail', 'credentials.json')

// Type labels for Drive folder naming
export const DOC_TYPE_LABELS: Record<string, string> = {
    CONTRACT: 'Contrats',
    PAYSLIP: 'Fiches de paie',
    ID_CARD: 'Identité & Titre Séjour',
    RESIDENCE_PERMIT: 'Titre de séjour',
    INSURANCE: 'Mutuelle & RIB',
    DPAE: 'DPAE & Affiliations',
    MEDICAL: 'Visite Médicale',
    OTHER: 'Autres documents',
}

// ─── OAuth2 Token Management ────────────────────────────────────────────────

let cachedToken: { access_token: string; expiry: number } | null = null

async function getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 60s margin)
    if (cachedToken && Date.now() < cachedToken.expiry - 60_000) {
        return cachedToken.access_token
    }

    let clientId = process.env.GOOGLE_DRIVE_CLIENT_ID
    let clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET
    let refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN

    let tokenFileExists = false

    // Fallback aux fichiers locaux si variables d'environnement manquantes
    if (!clientId || !clientSecret || !refreshToken) {
        try {
            if (fs.existsSync(TOKEN_PATH) && fs.existsSync(CREDENTIALS_PATH)) {
                const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'))
                const credData = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'))
                const creds = credData.installed || credData.web

                clientId = clientId || creds.client_id
                clientSecret = clientSecret || creds.client_secret
                refreshToken = refreshToken || tokenData.refresh_token
                tokenFileExists = true
            } else {
                throw new Error("Missing Mail/ files and env vars")
            }
        } catch (e) {
            console.error("Erreur de lecture des credentials Google Drive :", e)
            throw new Error("Identifiants Google Drive introuvables. Configurez les variables d'environnement.")
        }
    }

    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error("Missing Google Drive OAuth credentials")
    }

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Failed to refresh token: ${err}`)
    }

    const { access_token, expires_in } = await res.json()

    // Persist new access token en mémoire
    cachedToken = {
        access_token,
        expiry: Date.now() + expires_in * 1000,
    }

    // Update file UNIQUEMENT si le fichier existait déjà (local dev)
    if (tokenFileExists) {
        try {
            const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'))
            const updated = { ...tokenData, token: access_token, expiry: new Date(cachedToken.expiry).toISOString() }
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(updated))
        } catch (e) {
            console.warn("Impossible d'écrire dans token.json, mais le token est en mémoire.", e)
        }
    }

    return access_token
}

// ─── Drive Folder Management ─────────────────────────────────────────────────

async function findOrCreateFolder(name: string, parentId?: string): Promise<string> {
    const token = await getAccessToken()

    // Search for existing folder
    const escapedName = name.replace(/'/g, "\\'")
    const query = parentId
        ? `name='${escapedName}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
        : `name='${escapedName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`

    const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
        { headers: { Authorization: `Bearer ${token}` } }
    )
    const { files } = await searchRes.json()

    if (files && files.length > 0) {
        return files[0].id
    }

    // Create new folder
    const body: any = {
        name,
        mimeType: 'application/vnd.google-apps.folder',
    }
    if (parentId) body.parents = [parentId]

    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    })

    const folder = await createRes.json()
    return folder.id
}

/**
 * Get or build the folder hierarchy: RH > {employeeName} > {docTypeLabel}
 * Returns the folder ID where the file should be uploaded
 */
export async function getOrCreateRhFolder(employeeName: string, docType: string): Promise<string> {
    const typeLabel = DOC_TYPE_LABELS[docType] || 'Autres documents'

    // Root RH folder
    const rhFolderId = await findOrCreateFolder('RH - Restaurant OS')
    // Employee sub-folder
    const empFolderId = await findOrCreateFolder(employeeName, rhFolderId)
    // Document type sub-folder
    const typeFolderId = await findOrCreateFolder(typeLabel, empFolderId)

    return typeFolderId
}

// ─── File Upload ─────────────────────────────────────────────────────────────

export async function uploadFileToDrive(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    folderId: string
): Promise<{ id: string; webViewLink: string; webContentLink: string }> {
    const token = await getAccessToken()

    // Use multipart upload
    const boundary = `boundary_${Date.now()}`
    const metadata = JSON.stringify({ name: fileName, parents: [folderId] })

    const multipartBody = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`),
        Buffer.from(`--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`),
        fileBuffer,
        Buffer.from(`\r\n--${boundary}--`),
    ])

    const uploadRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink',
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': `multipart/related; boundary=${boundary}`,
                'Content-Length': multipartBody.length.toString(),
            },
            body: multipartBody,
        }
    )

    if (!uploadRes.ok) {
        const err = await uploadRes.text()
        throw new Error(`Drive upload failed: ${err}`)
    }

    const file = await uploadRes.json()

    // Make the file publicly readable so we can use the URL directly
    await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}/permissions`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    })

    return {
        id: file.id,
        webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
        webContentLink: file.webContentLink || `https://drive.google.com/uc?id=${file.id}`,
    }
}
