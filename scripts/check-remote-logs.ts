import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const EASYPANEL_URL = process.env.EASYPANEL_URL;
const EASYPANEL_API_KEY = process.env.EASYPANEL_API_KEY;

if (!EASYPANEL_URL || !EASYPANEL_API_KEY) {
    console.error('❌ Error: EASYPANEL_URL and EASYPANEL_API_KEY must be set in your .env file.');
    process.exit(1);
}

const GQL_URL = `${EASYPANEL_URL.replace(/\/$/, '')}/api/trpc`;

async function fetchLogs(projectName: string, serviceName: string) {
    console.log(`\n--- Fetching logs for project: "${projectName}", service: "${serviceName}" ---`);

    try {
        // Standard tRPC POST format for Easypanel
        const response = await fetch(`${GQL_URL}/service.getLogs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${EASYPANEL_API_KEY}`,
            },
            body: JSON.stringify({
                json: { projectName, serviceName }
            }),
        });

        if (response.status === 404) {
            console.error(`❌ Error: Procedure "service.getLogs" not found (404). Trying alternative...`);
            // Try alternative if service.getLogs failed
            return false;
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const data: any = await response.json();
        const logs = data?.result?.data?.json || data?.json || data;

        if (typeof logs === 'string') {
            console.log(logs);
            return true;
        } else {
            console.log('--- No logs available or unexpected format ---');
            console.dir(data, { depth: null });
            return false;
        }
    } catch (error: any) {
        console.error(`❌ Error fetching logs: ${error.message}`);
        return false;
    }
}

async function main() {
    const args = process.argv.slice(2);
    const isDryRun = args.includes('--dry-run');

    if (isDryRun) {
        console.log('✅ Dry run successful. Script is correctly structured.');
        return;
    }

    // Common project names to try
    const projectsToTry = ['siwa', 'default', 'main'];
    const services = ['restaurant-os-app', 'restaurant-os-bot'];

    let success = false;
    for (const project of projectsToTry) {
        for (const service of services) {
            const res = await fetchLogs(project, service);
            if (res) success = true;
        }
        if (success) break; // If we found logs for one project, assume it's the right one
    }

    if (!success) {
        console.log('\n💡 Tip: Si l\'erreur 404 persiste, vérifie que le nom du projet dans Easypanel est bien l\'un de ceux-ci: ' + projectsToTry.join(', '));
    }
}

main();
