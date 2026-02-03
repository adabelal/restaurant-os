'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// FINANCE CATEGORIES
export async function getFinanceCategories() {
    try {
        const categories = await prisma.financeCategory.findMany({
            orderBy: { name: 'asc' }
        })
        return categories
    } catch (error) {
        console.error("Error fetching finance categories:", error)
        return []
    }
}

export async function createFinanceCategory(name: string, type: 'FIXED_COST' | 'VARIABLE_COST' | 'REVENUE' | 'TAX' | 'FINANCIAL' | 'INVESTMENT' | 'SALARY') {
    try {
        const category = await prisma.financeCategory.create({
            data: {
                name,
                type
            }
        })
        revalidatePath('/finance')
        return { success: true, data: category }
    } catch (error) {
        console.error("Error creating finance category:", error)
        return { success: false, error }
    }
}

// FIXED COSTS
export async function getFixedCosts() {
    try {
        const costs = await prisma.fixedCost.findMany({
            include: {
                category: true
            },
            orderBy: { dayOfMonth: 'asc' }
        })
        return costs
    } catch (error) {
        console.error("Error fetching fixed costs:", error)
        return []
    }
}

export async function addFixedCost(data: {
    name: string
    amount: number
    dayOfMonth: number
    frequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
    categoryId: string
}) {
    try {
        const cost = await prisma.fixedCost.create({
            data: {
                name: data.name,
                amount: data.amount,
                dayOfMonth: data.dayOfMonth,
                frequency: data.frequency,
                category: {
                    connect: { id: data.categoryId }
                }
            }
        })
        revalidatePath('/finance/charges')
        return { success: true, data: cost }
    } catch (error) {
        console.error("Error adding fixed cost:", error)
        return { success: false, error }
    }
}

export async function deleteFixedCost(id: string) {
    try {
        await prisma.fixedCost.delete({
            where: { id }
        })
        revalidatePath('/finance/charges')
        return { success: true }
    } catch (error) {
        console.error("Error deleting fixed cost:", error)
        return { success: false, error }
    }
}
