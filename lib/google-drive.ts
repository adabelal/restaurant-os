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
    ID_CARD: 'Identité',
    RESIDENCE_PERMIT: 'Titre de séjour',
    INSURANCE: 'Mutuelle & RIB',
    OTHER: 'Autres documents',
}

// ─── OAuth2 Token Management ────────────────────────────────────────────────

let cachedToken: { access_token: string; expiry: number } | null = null

async function getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 60s margin)
    if (cachedToken && Date.now() < cachedToken.expiry - 60_000) {
        return cachedToken.access_token
    }

    const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'))
    const credData = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'))
    const creds = credData.installed || credData.web

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: creds.client_id,
            client_secret: creds.client_secret,
            refresh_token: tokenData.refresh_token,
            grant_type: 'refresh_token',
        }),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Failed to refresh token: ${err}`)
    }

    const { access_token, expires_in } = await res.json()

    // Persist new access token
    cachedToken = {
        access_token,
        expiry: Date.now() + expires_in * 1000,
    }

    // Update file with new token for other scripts
    const updated = { ...tokenData, token: access_token, expiry: new Date(cachedToken.expiry).toISOString() }
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(updated))

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
