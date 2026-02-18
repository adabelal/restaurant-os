'use client'

import React, { useState } from 'react'
import { LayoutGrid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

interface EmployeeListContentProps {
    activeEmployees: any[]
    archivedEmployees: any[]
    activeTab: string
}

export function EmployeeListContent({ activeEmployees, archivedEmployees, activeTab }: EmployeeListContentProps) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const list = activeTab === 'active' ? activeEmployees : archivedEmployees

    if (list.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 p-12 text-center bg-white/50 dark:bg-zinc-900/50">
                <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-zinc-100">Aucun employé</h3>
                <p className="text-slate-500 dark:text-zinc-400 text-sm">La liste est vide pour le moment.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end gap-2">
                <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="gap-2"
                >
                    <LayoutGrid className="h-4 w-4" /> Grille
                </Button>
                <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="gap-2"
                >
                    <List className="h-4 w-4" /> Liste
                </Button>
            </div>

            {viewMode === 'grid' ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {list.map((emp: any) => (
                        <Link href={`/rh/${emp.id}`} key={emp.id} className="block h-full">
                            <Card className="h-full group overflow-hidden border-slate-200 dark:border-zinc-800 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card cursor-pointer relative">
                                <div className={`h-2 w-full ${emp.role === 'ADMIN' ? 'bg-purple-600' :
                                    emp.role === 'MANAGER' ? 'bg-blue-500' : 'bg-emerald-500'
                                    }`} />

                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 font-bold shadow-sm">
                                                {emp.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{emp.name}</CardTitle>
                                                <p className="text-sm text-muted-foreground">{emp.role}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="secondary" className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100">
                                                {emp.contractType || 'CDI'}
                                            </Badge>
                                            <Badge variant="secondary" className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100">
                                                {emp.contractDuration === 'PART_TIME' ? 'Temps Partiel' : 'Temps Plein'}
                                            </Badge>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground text-xs uppercase font-medium">Taux Horaire</span>
                                                <span className="font-bold text-foreground bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">
                                                    {Number(emp.hourlyRate).toFixed(2)} €/h
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground text-xs uppercase font-medium">Documents</span>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${(emp._count?.documents || 0) < 3 ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                                                    }`}>
                                                    {emp._count?.documents || 0} / 3 requis
                                                </span>
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t border-dashed flex justify-between items-center text-xs">
                                            <span className={(emp._count?.documents || 0) < 3 ? "text-amber-600 font-medium flex items-center gap-1" : "text-emerald-600 font-medium flex items-center gap-1"}>
                                                {(emp._count?.documents || 0) < 3 ? '⚠️ Dossier incomplet' : '✅ Dossier à jour'}
                                            </span>
                                            <span className="text-primary font-bold group-hover:translate-x-1 transition-transform">Gérer →</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="bg-card border dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-zinc-900 border-b dark:border-zinc-800">
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Employé</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Rôle</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground hide-mobile">Contact</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Taux</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-zinc-800">
                                {list.map((emp: any) => (
                                    <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-zinc-400">
                                                    {emp.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-semibold text-foreground">{emp.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <Badge variant="outline" className={`${emp.role === 'ADMIN' ? 'border-purple-200 text-purple-700 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800' :
                                                    emp.role === 'MANAGER' ? 'border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' :
                                                        'border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'
                                                    }`}>
                                                    {emp.role}
                                                </Badge>
                                                <div className="flex items-center gap-1.5 px-1">
                                                    <span className="text-[10px] font-black text-muted-foreground uppercase">{emp.contractType || 'CDI'}</span>
                                                    <span className="text-[10px] text-muted-foreground/60">•</span>
                                                    <span className="text-[10px] text-muted-foreground/60">{emp.contractDuration === 'PART_TIME' ? 'Partiel' : 'Plein'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hide-mobile text-sm text-muted-foreground truncate max-w-[200px]">
                                            {emp.email}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-sm text-foreground">
                                            {Number(emp.hourlyRate).toFixed(2)}€/h
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href={`/rh/${emp.id}`}>
                                                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                                                    Dossier →
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
