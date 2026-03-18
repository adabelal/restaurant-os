import * as fs from 'fs';
import * as path from 'path';

async function testWebhook() {
    const filePath = "/Users/adambelal/Desktop/restaurant-os/exemple popina/popina_export_accounting_40116_20250401_20260315_8df9a693.xlsx";
    const fileBuffer = fs.readFileSync(filePath);
    const base64 = fileBuffer.toString('base64');

    const payload = {
        excelBase64: base64,
        messageId: "test-message-id-" + Date.now(),
        subject: "Test Rapport Popina",
        sender: "Popina Test"
    };

    const apiKey = "super-secret-key-12345"; // From .env

    console.log("Sending request to /api/webhooks/popina...");
    
    try {
        const response = await fetch("http://localhost:3002/api/webhooks/popina", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log("Response:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Fetch Error:", error);
    }
}

testWebhook();
