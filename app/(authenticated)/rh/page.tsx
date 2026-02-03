import React from 'react'
export const dynamic = 'force-dynamic'

import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { CreateEmployeeDialog } from "@/components/rh/CreateEmployeeDialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Archive, BarChart4, Users, Database } from "lucide-react"
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
        <main className="flex flex-col animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="bg-card/50 backdrop-blur-md border-b px-6 py-8 md:px-10 sticky top-0 z-20 shadow-sm">
                <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
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
                                className="rounded-full px-5 border-2 hover:bg-muted font-semibold transition-all active:scale-95 group"
                            >
                                <Database className="mr-2 h-4 w-4 text-blue-500 group-hover:rotate-12 transition-transform" />
                                Initialiser
                            </Button>
                        </form>
                        <CreateEmployeeDialog />
                    </div>
                </div>
            </div>

            <div className="p-6 md:p-10 max-w-[1400px] mx-auto w-full space-y-10">
                <Tabs defaultValue="active" className="w-full space-y-10">
                    <div className="flex items-center justify-center sm:justify-start">
                        <TabsList className="p-1.5 bg-muted/50 rounded-2xl w-full sm:w-auto flex shadow-inner border border-border/50 backdrop-blur-sm">
                            <TabsTrigger
                                value="active"
                                className="flex-1 sm:flex-none px-6 py-2.5 gap-2.5 rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all font-bold"
                            >
                                <User className="h-4 w-4" /> Actifs
                                <span className="ml-1 text-[10px] bg-primary/10 px-2 py-0.5 rounded-full">{activeEmployees.length}</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="summary"
                                className="flex-1 sm:flex-none px-6 py-2.5 gap-2.5 rounded-xl data-[state=active]:bg-background data-[state=active]:text-indigo-600 data-[state=active]:shadow-lg transition-all font-bold"
                            >
                                <BarChart4 className="h-4 w-4" /> Paie
                            </TabsTrigger>
                            <TabsTrigger
                                value="archived"
                                className="flex-1 sm:flex-none px-6 py-2.5 gap-2.5 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all font-bold"
                            >
                                <Archive className="h-4 w-4" /> Archives
                                <span className="ml-1 text-[10px] bg-muted px-2 py-0.5 rounded-full">{archivedEmployees.length}</span>
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

                    <TabsContent value="summary" className="mt-0 outline-none animate-in slide-in-from-bottom-2 duration-500">
                        <RHSummaryTable employees={activeEmployees} />
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
