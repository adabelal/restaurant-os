import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("Setting up categories and fixed costs...")

    const categories = [
        { name: 'Loyer & Charges', type: 'FIXED_COST' },
        { name: 'Assurances', type: 'FIXED_COST' },
        { name: 'Télécom & Tech', type: 'FIXED_COST' },
        { name: 'Achats Matières', type: 'VARIABLE_COST' },
        { name: 'Social & URSSAF', type: 'VARIABLE_COST' },
        { name: 'Énergie', type: 'FIXED_COST' }
    ]

    const catMap = {}
    for (const c of categories) {
        const created = await prisma.financeCategory.upsert({
            where: { name: c.name },
            update: {},
            create: { name: c.name, type: c.type }
        })
        catMap[c.name] = created.id
    }

    const fixedCosts = [
        { name: 'Loyer Local', amount: 3600, dayOfMonth: 5, category: 'Loyer & Charges' },
        { name: 'Abonnement Orange', amount: 63.60, dayOfMonth: 10, category: 'Télécom & Tech' },
        { name: 'Loyer TPE', amount: 37.69, dayOfMonth: 1, category: 'Loyer & Charges' },
        { name: 'Assurance Groupama', amount: 30.15, dayOfMonth: 1, category: 'Assurances' }
    ]

    for (const fc of fixedCosts) {
        await prisma.fixedCost.upsert({
            where: { name: fc.name },
            update: { amount: fc.amount, dayOfMonth: fc.dayOfMonth, categoryId: catMap[fc.category] },
            create: {
                name: fc.name,
                amount: fc.amount,
                dayOfMonth: fc.dayOfMonth,
                frequency: 'MONTHLY',
                isActive: true,
                categoryId: catMap[fc.category]
            }
        })
    }

    console.log("Categorizing transactions...")
    const rules = [
        { pattern: 'METRO', category: 'Achats Matières' },
        { pattern: 'URSSAF', category: 'Social & URSSAF' },
        { pattern: 'GROUPAMA', category: 'Assurances' },
        { pattern: 'ORANGE', category: 'Télécom & Tech' },
        { pattern: 'LOYER', category: 'Loyer & Charges' },
        { pattern: 'EDF', category: 'Énergie' },
        { pattern: 'ENGIE', category: 'Énergie' },
        { pattern: 'REMISE CB', category: 'Revenue' }
    ]

    const revCat = await prisma.financeCategory.upsert({
        where: { name: 'Ventes CB' },
        update: {},
        create: { name: 'Ventes CB', type: 'REVENUE' }
    })
    catMap['Revenue'] = revCat.id

    for (const rule of rules) {
        const targetCatId = rule.category === 'Revenue' ? revCat.id : catMap[rule.category]
        if (!targetCatId) continue

        const count = await prisma.bankTransaction.updateMany({
            where: {
                description: { contains: rule.pattern, mode: 'insensitive' },
                categoryId: null
            },
            data: { categoryId: targetCatId }
        })
        console.log(`Matched ${count.count} for ${rule.pattern}`)
    }

    console.log("Setup complete!")
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(async () => { await prisma.$disconnect() })
