import { getGoogleDriveOAuthClient } from '../lib/google-drive';

async function testDriveFolder() {
  try {
    const drive = await getGoogleDriveOAuthClient();
    const res = await drive.files.get({
      fileId: '1Tc1uRVOx-hZsuwUCmuxlEZzQOgAvTRqj',
      fields: 'id, name, mimeType, parents, shortcutDetails',
      supportsAllDrives: true
    });
    console.log("Details for 1Tc1uRVOx-hZsuwUCmuxlEZzQOgAvTRqj:", res.data);
    
    // Let's also search for all folders named 2026 to see if there are others
    const res2 = await drive.files.list({
      q: `name = '2026' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name, parents)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      corpora: 'allDrives'
    });
    console.log("All folders named '2026':", res2.data.files);
    
  } catch (err) {
    console.error("Error:", err);
  }
}

testDriveFolder();
