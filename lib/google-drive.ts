import { google } from 'googleapis';
import { Readable } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive'];

export async function getGoogleDriveClient() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  // Handle newlines in private key correctly
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!email || !privateKey) {
    throw new Error("Google Drive credentials missing in environment variables.");
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
  
  // Use specific folder if provided, else use environment variable, else use hardcoded fallback
  const folderId = specificFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID || '1Tc1uRVOx-hZsuwUCmuxlEZzQOgAvTRqj';
  
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
