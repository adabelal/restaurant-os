
import crypto from 'crypto';

const APP_ID = process.env.ENABLE_BANKING_APP_ID;
const PRIVATE_KEY = process.env.ENABLE_BANKING_PRIVATE_KEY; // PEM format
const REDIRECT_URL = process.env.ENABLE_BANKING_REDIRECT_URL || 'https://app.siwa-bleury.fr/api/finance/bank/callback';

/**
 * Generates a JWT token for Enable Banking API (RS256)
 * We use the built-in crypto module to avoid external dependencies if npm install fails.
 */
function generateJWT() {
    if (!APP_ID || !PRIVATE_KEY) {
        throw new Error('Enable Banking credentials missing in environment variables');
    }

    // Sanitize the private key: handle cases where newlines are escaped or replaced by spaces
    let cleanKey = PRIVATE_KEY.replace(/\\n/g, '\n');

    // If the key is all on one line (common in some ENV systems), reconstruct it
    if (!cleanKey.includes('\n')) {
        const header = '-----BEGIN PRIVATE KEY-----';
        const footer = '-----END PRIVATE KEY-----';
        const body = cleanKey.replace(header, '').replace(footer, '').trim().replace(/\s/g, '');
        // Split body into 64-character lines
        const lines = body.match(/.{1,64}/g) || [];
        cleanKey = `${header}\n${lines.join('\n')}\n${footer}`;
    }

    const header = {
        alg: 'RS256',
        typ: 'JWT',
        kid: APP_ID
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: APP_ID,
        aud: 'api.enablebanking.com',
        iat: now,
        exp: now + 3600 // 1 hour
    };

    const base64UrlEncode = (obj: any) => {
        return Buffer.from(JSON.stringify(obj))
            .toString('base64')
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
    };

    const encodedHeader = base64UrlEncode(header);
    const encodedPayload = base64UrlEncode(payload);

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(encodedHeader + '.' + encodedPayload);
    const signature = signer.sign(cleanKey, 'base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export async function getAuthUrl(bankData?: { name: string, country: string }) {
    const token = generateJWT();

    // EnableBanking requiert obligatoirement le nom et le pays de la banque
    const aspsp = bankData || {
        name: 'Banque Populaire Bourgogne Franche Comté',
        country: 'FR'
    };

    const response = await fetch('https://api.enablebanking.com/auth', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            redirect_url: REDIRECT_URL,
            aspsp: aspsp,
            state: 'restaurant-os-auth',
            access: {
                valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
            }
        })
    });

    if (!response.ok) {
        const err = await response.text();
        console.error('Enable Banking Auth Error:', err);
        throw new Error('Failed to initiate bank connection');
    }

    const data = await response.json();
    return data.url; // The URL to redirect the user to
}

export async function createSession(code: string) {
    const token = generateJWT();

    const response = await fetch('https://api.enablebanking.com/sessions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            code: code
        })
    });

    if (!response.ok) {
        const err = await response.text();
        console.error('Enable Banking Session Error:', err);
        throw new Error(`Failed to create bank session: ${err}`);
    }

    return await response.json();
}

export async function fetchTransactions(accountUid: string, sessionId: string) {
    const token = generateJWT();

    const response = await fetch(`https://api.enablebanking.com/accounts/${accountUid}/transactions`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'X-Session-ID': sessionId
        }
    });

    if (!response.ok) {
        const err = await response.text();
        console.error('Enable Banking Transactions Error:', err);
        throw new Error('Failed to fetch transactions');
    }

    return await response.json();
}
