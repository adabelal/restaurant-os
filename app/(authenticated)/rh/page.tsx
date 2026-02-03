import React from 'react'
export const dynamic = 'force-dynamic'

import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { CreateEmployeeDialog } from "@/components/rh/CreateEmployeeDialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Archive, BarChart4, Users } from "lucide-react"
import { EmployeeListContent } from "@/components/rh/EmployeeListContent"
import { RHSummaryTable } from "@/components/rh/RHSummaryTable"

export default async function RHPage() {
    const employees = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: { select: { documents: true } },
            shifts: true
        }
    })

    const activeEmployees = employees.filter((e: any) => e.isActive)
    const archivedEmployees = employees.filter((e: any) => !e.isActive)

    return (
        <main className="flex min-h-screen flex-col bg-background transition-colors duration-300">

            {/* Header Section */}
            <div className="w-full bg-card border-b px-8 py-8 md:px-12 md:py-8 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                            <Users className="h-8 w-8 text-blue-600" />
                            Équipe & RH
                        </h1>
                        <p className="text-muted-foreground mt-1 font-medium">Contrats, plannings et calcul de paie.</p>
                    </div>

                    <div className="flex gap-3">
                        <form action={async () => {
                            'use server'
                            const { seedEmployees } = await import("./actions")
                            await seedEmployees()
                        }}>
                            <Button variant="outline" className="text-xs h-10 border-dashed hover:bg-slate-50 dark:hover:bg-zinc-800">Initialiser la liste</Button>
                        </form>
                        <CreateEmployeeDialog />
                    </div>
                </div>
            </div>

            <div className="flex-1 px-8 py-8 md:px-12 max-w-7xl mx-auto w-full">

                <Tabs defaultValue="active" className="w-full space-y-8">
                    <div className="flex justify-center md:justify-start">
                        <TabsList className="p-1 bg-muted rounded-2xl w-auto inline-flex shadow-inner border border-border/50">
                            <TabsTrigger value="active" className="px-8 py-2.5 gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
                                <User className="h-4 w-4" /> Actifs ({activeEmployees.length})
                            </TabsTrigger>
                            <TabsTrigger value="summary" className="px-8 py-2.5 gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
                                <BarChart4 className="h-4 w-4" /> Récapitulatif Paie
                            </TabsTrigger>
                            <TabsTrigger value="archived" className="px-8 py-2.5 gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
                                <Archive className="h-4 w-4" /> Archives ({archivedEmployees.length})
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="active" className="mt-0 animate-in fade-in-50 duration-500 outline-none">
                        <EmployeeListContent
                            activeTab="active"
                            activeEmployees={activeEmployees}
                            archivedEmployees={archivedEmployees}
                        />
                    </TabsContent>

                    <TabsContent value="summary" className="mt-0 outline-none">
                        <RHSummaryTable employees={activeEmployees} />
                    </TabsContent>

                    <TabsContent value="archived" className="mt-0 animate-in fade-in-50 duration-500 outline-none">
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
