import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
    try {
        const txs = await prisma.bankTransaction.findMany({ take: 5, orderBy: { date: 'desc' } })
        return NextResponse.json(txs)
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 })
    }
}
