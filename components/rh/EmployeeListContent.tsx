'use client'

import React, { useState } from 'react'
import { LayoutGrid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { CreateEmployeeDialog } from "./CreateEmployeeDialog"

interface EmployeeListContentProps {
    activeEmployees: any[]
    archivedEmployees: any[]
    activeTab: string
}

export function EmployeeListContent({ activeEmployees, archivedEmployees, activeTab }: EmployeeListContentProps) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
    const list = activeTab === 'active' ? activeEmployees : archivedEmployees

    if (list.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card/50 backdrop-blur-md">
                <div className="mx-auto size-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <List className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Aucun employé</h3>
                <p className="text-muted-foreground text-sm max-w-[200px] mx-auto mt-1">
                    La liste est vide pour le moment dans cette section.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* View Mode Toggle - Hidden on mobile, we use mobile-specific cards there */}
            <div className="hidden sm:flex justify-end gap-2">
                <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="gap-2 rounded-xl"
                >
                    <LayoutGrid className="h-4 w-4" /> Grille
                </Button>
                <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="gap-2 rounded-xl"
                >
                    <List className="h-4 w-4" /> Liste
                </Button>
            </div>

            {/* Mobile View - Cards Layout */}
            <div className="sm:hidden space-y-4">
                {list.map((emp: any) => (
                    <Link href={`/rh/${emp.id}`} key={emp.id} className="block active:scale-[0.98] transition-transform">
                        <Card className="p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 bg-card">
                            <div className="relative">
                                <div className="size-14 rounded-full bg-cover bg-center ring-2 ring-primary/20 bg-muted flex items-center justify-center font-bold text-lg text-muted-foreground">
                                    {emp.name.charAt(0).toUpperCase()}
                                </div>
                                {emp.isActive && (
                                    <div className="absolute bottom-0.5 right-0.5 size-3.5 bg-primary border-2 border-background rounded-full shadow-sm"></div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate">{emp.name}</h3>
                                    {emp.contractType === 'EXTRA' && (
                                        <Badge variant="secondary" className="px-1.5 py-0 bg-primary/10 text-primary text-[9px] font-bold rounded-full uppercase border-none">
                                            Extra
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                    {emp.role.toLowerCase()} • {emp.contractType || 'CDI'}
                                </p>
                            </div>
                            <div className="text-slate-300 dark:text-slate-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                            </div>
                        </Card>
                    </Link>
                ))}

                {activeTab === 'active' && (
                    <div className="pt-2">
                        <CreateEmployeeDialog />
                    </div>
                )}
            </div>

            {/* Desktop Grid View */}
            <div className={`hidden sm:${viewMode === 'grid' ? 'grid' : 'none'} gap-6 md:grid-cols-2 lg:grid-cols-3`}>
                {list.map((emp: any) => (
                    <Link href={`/rh/${emp.id}`} key={emp.id} className="block h-full group">
                        <Card className="h-full overflow-hidden border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card cursor-pointer relative rounded-2xl">
                            <div className={`h-1.5 w-full ${emp.role === 'ADMIN' ? 'bg-purple-600' :
                                emp.role === 'MANAGER' ? 'bg-blue-500' : 'bg-primary'
                                }`} />

                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-xl border border-border text-muted-foreground font-bold shadow-sm ring-2 ring-primary/5">
                                            {emp.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{emp.name}</CardTitle>
                                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">{emp.role}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent>
                                <div className="space-y-5">
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="secondary" className="text-[10px] uppercase font-black text-muted-foreground bg-muted/60 border-none px-2 rounded-lg">
                                            {emp.contractType || 'CDI'}
                                        </Badge>
                                        <Badge variant="secondary" className="text-[10px] uppercase font-black text-muted-foreground bg-muted/60 border-none px-2 rounded-lg">
                                            {emp.contractDuration === 'PART_TIME' ? 'Temps Partiel' : 'Temps Plein'}
                                        </Badge>
                                    </div>

                                    <div className="space-y-3 p-3 bg-muted/30 rounded-xl border border-border/50">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-tight">Taux Horaire</span>
                                            <span className="font-bold text-foreground">
                                                {Number(emp.hourlyRate).toFixed(2)} €/h
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-tight">Documents</span>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${(emp._count?.documents || 0) < 4 ? 'bg-amber-500/10 text-amber-600' : 'bg-primary/10 text-primary'
                                                }`}>
                                                {emp._count?.documents || 0} / 4 REQUIS
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-2 flex justify-between items-center text-[11px]">
                                        <span className={(emp._count?.documents || 0) < 4 ? "text-amber-600 font-bold flex items-center gap-1.5" : "text-primary font-bold flex items-center gap-1.5"}>
                                            {(emp._count?.documents || 0) < 4 ? <span className="size-1.5 rounded-full bg-amber-500 animate-pulse"></span> : <span className="size-1.5 rounded-full bg-primary"></span>}
                                            {(emp._count?.documents || 0) < 4 ? 'Dossier incomplet' : 'Dossier à jour'}
                                        </span>
                                        <span className="text-primary font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">Détails <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg></span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Desktop List View */}
            <div className={`hidden sm:${viewMode === 'list' ? 'block' : 'none'} bg-card border border-border rounded-2xl overflow-hidden shadow-sm`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/50 border-b border-border">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Employé</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rôle & Contrat</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Taux</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {list.map((emp: any) => (
                                <tr key={emp.id} className="hover:bg-muted/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground border border-border shadow-sm ring-2 ring-primary/5">
                                                {emp.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-bold text-foreground group-hover:text-primary transition-colors">{emp.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1.5">
                                            <Badge variant="outline" className={`w-fit text-[10px] font-black px-2 py-0 border-none ${emp.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-600' :
                                                emp.role === 'MANAGER' ? 'bg-blue-500/10 text-blue-600' :
                                                    'bg-primary/10 text-primary'
                                                }`}>
                                                {emp.role}
                                            </Badge>
                                            <div className="flex items-center gap-1.5 px-0.5">
                                                <span className="text-[10px] font-black text-muted-foreground uppercase">{emp.contractType || 'CDI'}</span>
                                                <span className="text-[10px] text-muted-foreground/40">•</span>
                                                <span className="text-[10px] text-muted-foreground/60 font-medium">{emp.contractDuration === 'PART_TIME' ? 'Partiel' : 'Plein'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-sm text-foreground">
                                        {Number(emp.hourlyRate).toFixed(2)} <span className="text-xs font-normal text-muted-foreground">€/h</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link href={`/rh/${emp.id}`}>
                                            <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/10 rounded-lg">
                                                Gérer →
                                            </Button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {activeTab === 'active' && (
                <div className="hidden sm:flex justify-center pt-4">
                    <CreateEmployeeDialog />
                </div>
            )}
        </div>
    )
}
