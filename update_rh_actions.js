const fs = require('fs');
const path = './app/(authenticated)/rh/actions.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
`import { z } from "zod"`,
`import { z } from "zod"\nimport { safeAction } from "@/lib/safe-action"\nimport { cache } from "react"`
);

code = code.replace(
`export async function createEmployee(formData: FormData) {
    // Vérification authentification
    await requireAuth()`,
`export async function createEmployee(formData: FormData) {
    return safeAction(formData, async (input) => {`
).replace(
`        return { success: false, message: "Une erreur est survenue." }
    }
}`,
`        return { success: false, message: "Une erreur est survenue." }
    }
    })
}`
);

// update other functions...

fs.writeFileSync(path, code);
