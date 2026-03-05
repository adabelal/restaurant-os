import React from 'react'
export const dynamic = 'force-dynamic'

import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { CreateEmployeeDialog } from "@/components/rh/CreateEmployeeDialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Archive, BarChart4, Users, Database, ShieldCheck, CalendarDays } from "lucide-react"
import { EmployeeListContent } from "@/components/rh/EmployeeListContent"
import { RHSummaryTable } from "@/components/rh/RHSummaryTable"
import { PayslipBulkUpload } from "@/components/rh/PayslipBulkUpload"
import { ComplianceTab } from "@/components/rh/ComplianceTab"
import { GlobalShiftCalendar } from "@/components/rh/GlobalShiftCalendar"

export default async function RHPage() {
    const employees = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: { select: { documents: true } },
            documents: true,
            shifts: true
        }
    })

    const now = new Date()
    const sortedEmployees = [...employees].sort((a: any, b: any) => {
        // 1. Analyse du contrat actif (basé sur la logique ShiftManager)
        const hasActiveA = a.documents?.some((doc: any) => {
            if (doc.type !== 'CONTRACT') return false
            if (!doc.year) return true
            if (doc.year < now.getFullYear()) return false
            if (doc.year === now.getFullYear() && doc.month && doc.month < now.getMonth() + 1) return false
            return true
        }) || false

        const hasActiveB = b.documents?.some((doc: any) => {
            if (doc.type !== 'CONTRACT') return false
            if (!doc.year) return true
            if (doc.year < now.getFullYear()) return false
            if (doc.year === now.getFullYear() && doc.month && doc.month < now.getMonth() + 1) return false
            return true
        }) || false

        // Tri par contrat actif d'abord (ceux avec contrat en haut)
        if (hasActiveA && !hasActiveB) return -1
        if (!hasActiveA && hasActiveB) return 1

        // 2. Tri par nom de famille (dernier mot du nom complet)
        const getLastName = (fullName: string) => {
            const parts = fullName.trim().split(/\s+/)
            return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : parts[0].toLowerCase()
        }

        const lastNameA = getLastName(a.name)
        const lastNameB = getLastName(b.name)

        return lastNameA.localeCompare(lastNameB)
    })

    const activeEmployees = sortedEmployees.filter((e: any) => e.isActive)
    const archivedEmployees = sortedEmployees.filter((e: any) => !e.isActive)

    return (
        <main className="flex flex-col animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="bg-card/50 backdrop-blur-md border-b px-4 py-6 md:px-10 md:py-8 sticky top-0 z-20 shadow-sm">
                <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                            <h1 className="text-3xl font-oswald font-bold tracking-tight text-foreground sm:text-4xl uppercase">
                                Équipe & RH
                            </h1>
                        </div>
                        <p className="text-muted-foreground text-lg font-medium opacity-80 pl-1">
                            Gérez les talents qui font vivre votre établissement.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <form action={async () => {
                            'use server'
                            const { seedEmployees } = await import("./actions")
                            await seedEmployees()
                        }}>
                            <Button
                                variant="outline"
                                className="rounded-full px-5 border-2 hover:bg-muted font-oswald font-semibold transition-all active:scale-95 group"
                            >
                                <Database className="mr-2 h-4 w-4 text-primary group-hover:rotate-12 transition-transform" />
                                Initialiser
                            </Button>
                        </form>
                        <CreateEmployeeDialog />
                    </div>
                </div>
            </div>

            <div className="p-4 md:p-10 max-w-[1400px] mx-auto w-full space-y-8 md:space-y-10">
                <Tabs defaultValue="active" className="w-full space-y-6 md:space-y-10">
                    <div className="flex items-center justify-center sm:justify-start">
                        <TabsList className="p-1.5 bg-muted/50 rounded-2xl w-full sm:w-auto flex shadow-inner border border-border/50 backdrop-blur-sm overflow-x-auto whitespace-nowrap">
                            <TabsTrigger
                                value="active"
                                className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 gap-2.5 rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all font-oswald font-bold uppercase tracking-wide"
                            >
                                <User className="h-4 w-4 shrink-0" /> <span className="hidden xs:inline">Actifs</span>
                                <span className="ml-1 text-[10px] bg-primary/10 px-2 py-0.5 rounded-full font-sans">{activeEmployees.length}</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="planning"
                                className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 gap-2.5 rounded-xl data-[state=active]:bg-background data-[state=active]:text-indigo-500 data-[state=active]:shadow-lg transition-all font-oswald font-bold uppercase tracking-wide"
                            >
                                <CalendarDays className="h-4 w-4 shrink-0" /> <span className="hidden xs:inline">Planning</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="summary"
                                className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 gap-2.5 rounded-xl data-[state=active]:bg-background data-[state=active]:text-amber-500 data-[state=active]:shadow-lg transition-all font-oswald font-bold uppercase tracking-wide"
                            >
                                <BarChart4 className="h-4 w-4 shrink-0" /> <span className="hidden xs:inline">Paie</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="legal"
                                className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 gap-2.5 rounded-xl data-[state=active]:bg-background data-[state=active]:text-emerald-500 data-[state=active]:shadow-lg transition-all font-oswald font-bold uppercase tracking-wide"
                            >
                                <ShieldCheck className="h-4 w-4 shrink-0" /> <span className="hidden xs:inline">Conformité</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="archived"
                                className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 gap-2.5 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all font-oswald font-bold uppercase tracking-wide"
                            >
                                <Archive className="h-4 w-4 shrink-0" /> <span className="hidden xs:inline">Archives</span>
                                <span className="ml-1 text-[10px] bg-muted px-2 py-0.5 rounded-full font-sans">{archivedEmployees.length}</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="active" className="mt-0 outline-none animate-in slide-in-from-bottom-2 duration-500">
                        <EmployeeListContent
                            activeTab="active"
                            activeEmployees={activeEmployees}
                            archivedEmployees={archivedEmployees}
                        />
                    </TabsContent>

                    <TabsContent value="planning" className="mt-0 outline-none animate-in slide-in-from-bottom-2 duration-500">
                        <GlobalShiftCalendar employees={activeEmployees} />
                    </TabsContent>

                    <TabsContent value="summary" className="mt-0 outline-none animate-in slide-in-from-bottom-2 duration-500 space-y-6">
                        <PayslipBulkUpload employees={activeEmployees.map((e: any) => ({ id: e.id, name: e.name, isActive: e.isActive }))} />
                        <RHSummaryTable employees={activeEmployees} />
                    </TabsContent>

                    <TabsContent value="legal" className="mt-0 outline-none animate-in slide-in-from-bottom-2 duration-500">
                        <ComplianceTab employees={employees} />
                    </TabsContent>

                    <TabsContent value="archived" className="mt-0 outline-none animate-in slide-in-from-bottom-2 duration-500">
                        <EmployeeListContent
                            activeTab="archived"
                            activeEmployees={activeEmployees}
                            archivedEmployees={archivedEmployees}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    )
}
