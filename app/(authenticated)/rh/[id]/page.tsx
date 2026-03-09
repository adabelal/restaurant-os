import React from 'react'
export const dynamic = 'force-dynamic'

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import EmployeeDetailClient from "./EmployeeDetailClient"

export default async function EmployeeDetailPage({
    params,
    searchParams
}: {
    params: { id: string },
    searchParams: { month?: string, year?: string, tab?: string }
}) {
    const employee = await (prisma.user as any).findUnique({
        where: { id: params.id },
        include: {
            documents: { orderBy: { createdAt: 'desc' } },
            shifts: { orderBy: { startTime: 'desc' } },
            monthlySalaries: true
        }
    })

    if (!employee) return notFound()

    return <EmployeeDetailClient employee={employee} searchParams={searchParams} />
}
