import { getGoogleDriveOAuthClient } from '../lib/google-drive';

async function testDrive() {
  try {
    const drive = await getGoogleDriveOAuthClient();
    console.log("Token obtained. Listing files...");
    const response = await drive.files.list({
      q: `'1Tc1uRVOx-hZsuwUCmuxlEZzQOgAvTRqj' in parents and trashed=false`,
      fields: 'files(id, name, mimeType)',
      pageSize: 10,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      corpora: 'allDrives'
    });
    console.log("Files inside main folder:", response.data.files);
    
    const res2 = await drive.files.list({
      q: `name = '2026' and trashed=false`,
      fields: 'files(id, name, mimeType)',
      pageSize: 5,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      corpora: 'allDrives'
    });
    console.log("Any folder named '2026'?:", res2.data.files);
    
  } catch (err) {
    console.error("Error:", err);
  }
}

testDrive();
