
'use server'

import { prisma } from "@/lib/prisma"

export async function getDashboardStats() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 1. CAISSE DU JOUR (Recette)
    const todaysRevenue = await prisma.cashTransaction.aggregate({
        where: {
            date: {
                gte: today,
                lt: tomorrow
            },
            type: 'IN', // Only money IN
            amount: { gt: 0 }
        },
        _sum: { amount: true }
    })

    // 2. TRÉSORERIE TOTALE (Banque + Caisse)
    // Bank
    const bankSum = await prisma.bankTransaction.aggregate({ _sum: { amount: true } })
    // Cash
    const cashSum = await prisma.cashTransaction.aggregate({ _sum: { amount: true } }) // Already adjusted (Out is negative)

    const totalTreasury = (Number(bankSum._sum.amount) || 0) + (Number(cashSum._sum.amount) || 0)

    // 3. FACTURES À TRAITER (Draft / Processing / Alert)
    const pendingInvoicesCount = await prisma.purchaseOrder.count({
        where: {
            status: {
                in: ['DRAFT', 'PROCESSING', 'ALERT']
            }
        }
    })

    // 4. DERNIÈRES TRANSACTIONS (Activité Récente mélangée)
    const recentActivity = await prisma.bankTransaction.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        select: { id: true, date: true, description: true, amount: true }
    })

    const employeeCount = await prisma.user.count({
        where: {
            role: { in: ['STAFF', 'MANAGER'] },
            isActive: true
        }
    })

    return {
        dailyRevenue: Number(todaysRevenue._sum.amount) || 0,
        totalTreasury,
        pendingInvoicesCount,
        recentActivity,
        employeeCount
    }
}
