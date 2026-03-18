import { google } from 'googleapis';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';

/**
 * GOOGLE DRIVE V2 - UNIFIED SERVICE
 * Handles both Service Account (Invoices) and User OAuth (RH)
 */

// ─── Constants & Paths ───────────────────────────────────────────────────────

const SCOPES = ['https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = path.join(process.cwd(), 'Mail', 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'Mail', 'credentials.json');

// Type labels for Drive folder naming (RH)
export const DOC_TYPE_LABELS: Record<string, string> = {
    CONTRACT: 'Contrats',
    PAYSLIP: 'Fiches de paie',
    ID_CARD: 'Identité',
    RESIDENCE_PERMIT: 'Titre de séjour',
    INSURANCE: 'Mutuelle & RIB',
    OTHER: 'Autres documents',
};

// ─── Section 1: Service Account (Invoices V2) ────────────────────────────────

export async function getGoogleDriveClient() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || "";
  
  // High-resilience parsing for various environment variable managers (Easypanel, Docker, etc.)
  let privateKey = rawKey.trim();
  
  // 1. Remove optional surrounding quotes
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.substring(1, privateKey.length - 1);
  }
  
  // 2. Handle both actual newlines and literal \n sequences
  privateKey = privateKey.split('\\n').join('\n'); 
  
  // 3. Ensure the key is not truncated and has proper PKCS#8 or PKCS#1 format
  if (!privateKey.includes('-----BEGIN') || !privateKey.includes('-----END')) {
    console.error(`[Google Drive] Invalid key format. Length: ${privateKey.length}. Start: ${privateKey.substring(0, 20)}`);
    throw new Error("GOOGLE_PRIVATE_KEY format is invalid (missing BEGIN/END markers or truncated).");
  }

  if (!email) {
    throw new Error("GOOGLE_CLIENT_EMAIL is missing in environment variables.");
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: privateKey,
    },
    scopes: SCOPES,
  });

  return google.drive({ version: 'v3', auth });
}

export async function uploadPdfToDrive(fileName: string, pdfBytes: Uint8Array, specificFolderId?: string) {
  const drive = await getGoogleDriveClient();
  
  // Use specific folder if provided, else use environment variable
  const folderId = specificFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID;
  
  if (!folderId) {
    throw new Error("GOOGLE_DRIVE_FOLDER_ID is not configured and no specific folder provided.");
  }

  const buffer = Buffer.from(pdfBytes);
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  const media = {
    mimeType: 'application/pdf',
    body: stream,
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, webViewLink, webContentLink',
  });

  return {
    id: response.data.id,
    webViewLink: response.data.webViewLink,
    webContentLink: response.data.webContentLink
  };
}

// ─── Section 2: User OAuth (RH - Legacy Support) ─────────────────────────────

let cachedToken: { access_token: string; expiry: number } | null = null;

async function getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 60s margin)
    if (cachedToken && Date.now() < cachedToken.expiry - 60_000) {
        return cachedToken.access_token;
    }

    if (!fs.existsSync(TOKEN_PATH) || !fs.existsSync(CREDENTIALS_PATH)) {
        throw new Error("RH Google Drive credentials (token.json/credentials.json) missing.");
    }

    const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
    const credData = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
    const creds = credData.installed || credData.web;

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: creds.client_id,
            client_secret: creds.client_secret,
            refresh_token: tokenData.refresh_token,
            grant_type: 'refresh_token',
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Failed to refresh token: ${err}`);
    }

    const { access_token, expires_in } = await res.json();

    cachedToken = {
        access_token,
        expiry: Date.now() + expires_in * 1000,
    };

    return access_token;
}

export async function findOrCreateFolder(name: string, parentId?: string): Promise<string> {
    const token = await getAccessToken();
    const escapedName = name.replace(/'/g, "\\'");
    const query = parentId
        ? `name='${escapedName}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
        : `name='${escapedName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

    const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    const { files } = (await searchRes.json()) as any;

    if (files && files.length > 0) {
        return files[0].id;
    }

    const body: any = {
        name,
        mimeType: 'application/vnd.google-apps.folder',
    };
    if (parentId) body.parents = [parentId];

    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    const folder = (await createRes.json()) as any;
    return folder.id;
}

export async function getOrCreateRhFolder(employeeName: string, docType: string): Promise<string> {
    const typeLabel = DOC_TYPE_LABELS[docType] || 'Autres documents';
    const rhFolderId = await findOrCreateFolder('RH - Restaurant OS');
    const empFolderId = await findOrCreateFolder(employeeName, rhFolderId);
    const typeFolderId = await findOrCreateFolder(typeLabel, empFolderId);
    return typeFolderId;
}

export async function uploadFileToDrive(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    folderId: string
): Promise<{ id: string; webViewLink: string; webContentLink: string }> {
    const token = await getAccessToken();
    const boundary = `boundary_${Date.now()}`;
    const metadata = JSON.stringify({ name: fileName, parents: [folderId] });

    const multipartBody = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`),
        Buffer.from(`--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`),
        fileBuffer,
        Buffer.from(`\r\n--${boundary}--`),
    ]);

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
    );

    if (!uploadRes.ok) {
        const err = await uploadRes.text();
        throw new Error(`Drive upload failed: ${err}`);
    }

    const file = (await uploadRes.json()) as any;

    // Set permissions
    await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}/permissions`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    });

    return {
        id: file.id,
        webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
        webContentLink: file.webContentLink || `https://drive.google.com/uc?id=${file.id}`,
    };
}

export async function moveFileToFolder(fileId: string, newFolderId: string): Promise<void> {
    const token = await getAccessToken();
    const getRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=parents`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const getResJson = (await getRes.json()) as any;
    const previousParents = (getResJson.parents || []).join(',');

    const updateRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${newFolderId}&removeParents=${previousParents}`,
        {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (!updateRes.ok) {
        const err = await updateRes.text();
        throw new Error(`Failed to move file ${fileId}: ${err}`);
    }
}

export async function listFilesRecursive(folderId: string): Promise<{ id: string, name: string, webViewLink: string }[]> {
    const token = await getAccessToken();
    let results: { id: string, name: string, webViewLink: string }[] = [];

    async function scan(fId: string) {
        const query = `'${fId}' in parents and trashed=false`;
        const res = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,webViewLink)&pageSize=1000`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = (await res.json()) as any;

        if (data.files) {
            for (const file of data.files) {
                if (file.mimeType === 'application/vnd.google-apps.folder') {
                    await scan(file.id);
                } else {
                    results.push({
                        id: file.id,
                        name: file.name,
                        webViewLink: file.webViewLink
                    });
                }
            }
        }
    }

    await scan(folderId);
    return results;
}

export async function downloadFileFromDrive(fileId: string): Promise<Buffer> {
    const token = await getAccessToken();
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
        throw new Error(`Failed to download file ${fileId}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
}
