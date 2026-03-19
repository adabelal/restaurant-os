import { getGoogleDriveOAuthClient } from '../lib/google-drive';

async function testDriveParents() {
  try {
    const drive = await getGoogleDriveOAuthClient();
    const res = await drive.files.get({
      fileId: '1JNZe5dLZTXTA9h7srCbiFvlBaip_zK0H',
      fields: 'id, name, parents',
      supportsAllDrives: true
    });
    console.log("Details for 2026 folder:", res.data);
    
  } catch (err) {
    console.error("Error:", err);
  }
}

testDriveParents();
