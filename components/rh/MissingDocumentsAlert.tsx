"use client"

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertTriangle, CheckCircle2, ChevronRight, FileText, Fingerprint, Stethoscope, Briefcase } from "lucide-react"
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface MissingDocumentsAlertProps {
    employees: any[]
}

type MissingDocType = 'ID_CARD' | 'CONTRACT' | 'DPAE' | 'MEDICAL'

interface EmployeeMissingDocs {
    id: string
    name: string
    role: string
    missing: MissingDocType[]
}

const DOC_CONFIG = {
    ID_CARD: { label: "Pièce d'identité", icon: Fingerprint, color: "text-blue-500", bg: "bg-blue-500/10" },
    CONTRACT: { label: "Contrat", icon: Briefcase, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    DPAE: { label: "DPAE / TESE", icon: FileText, color: "text-amber-500", bg: "bg-amber-500/10" },
    MEDICAL: { label: "Visite médicale", icon: Stethoscope, color: "text-emerald-500", bg: "bg-emerald-500/10" }
}

export function MissingDocumentsAlert({ employees }: MissingDocumentsAlertProps) {
    const missingData = useMemo(() => {
        const activeEmployees = employees.filter(e => e.isActive)
        const results: EmployeeMissingDocs[] = []

        for (const emp of activeEmployees) {
            const docs = emp.documents || []
            const missing: MissingDocType[] = []

            // Check ID
            const hasId = docs.some((d: any) => {
                if (d.type === 'ID_CARD') return true
                const name = d.name.toLowerCase()
                return d.type === 'RESIDENCE_PERMIT' || name.includes('identi') || name.includes('passeport') || name.includes('titre') || name.includes('séjour') || name.includes('sejour')
            })
            if (!hasId) missing.push('ID_CARD')

            // Check Contract
            const hasContract = docs.some((d: any) => {
                if (d.type === 'CONTRACT') return true
                return d.name.toLowerCase().includes('contrat')
            })
            if (!hasContract) missing.push('CONTRACT')

            // Check DPAE
            const hasDpae = docs.some((d: any) => {
                if (d.type === 'DPAE' || d.category === 'TESE') return true
                const name = d.name.toLowerCase()
                return name.includes('dpae') || name.includes('urssaf') || name.includes('tese')
            })
            if (!hasDpae) missing.push('DPAE')

            // Check Medical
            const hasMedical = docs.some((d: any) => {
                if (d.type === 'MEDICAL') return true
                const name = d.name.toLowerCase()
                return name.includes('médical') || name.includes('medical') || name.includes('aptitude')
            })
            if (!hasMedical) missing.push('MEDICAL')

            if (missing.length > 0) {
                results.push({
                    id: emp.id,
                    name: emp.lastName && emp.firstName ? `${emp.firstName} ${emp.lastName}` : emp.name,
                    role: emp.role === 'ADMIN' ? 'Gérant' : emp.role === 'MANAGER' ? 'Manager' : 'Employé',
                    missing
                })
            }
        }
        
        // Sort by number of missing documents (most first)
        return results.sort((a, b) => b.missing.length - a.missing.length)
    }, [employees])

    if (missingData.length === 0) {
        return (
            <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-sm rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                <CardContent className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-emerald-800 dark:text-emerald-400">Dossiers complets</h3>
                        <p className="text-sm text-emerald-700/80 dark:text-emerald-500/80">Aucun document obligatoire ne manque pour vos salariés actifs.</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-red-500/20 shadow-sm rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 bg-gradient-to-br from-card to-red-50/50 dark:to-red-950/10">
            <CardHeader className="border-b border-red-500/10 bg-red-500/5 pb-4 px-4 sm:px-6">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-red-600 dark:text-red-400">
                            Documents Obligatoires Manquants
                        </CardTitle>
                        <CardDescription className="text-xs font-semibold text-red-600/70 dark:text-red-400/70 mt-1">
                            {missingData.length} salarié{missingData.length > 1 ? 's ont' : ' a'} des dossiers incomplets en cas de contrôle.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-border/50 max-h-[400px] overflow-y-auto">
                    {missingData.map((emp) => (
                        <div key={emp.id} className="p-4 sm:p-6 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-foreground text-sm">{emp.name}</h4>
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{emp.role}</span>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {emp.missing.map((doc) => {
                                        const config = DOC_CONFIG[doc];
                                        const Icon = config.icon;
                                        return (
                                            <div key={doc} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-background/5 ${config.bg} ${config.color}`}>
                                                <Icon className="h-3 w-3" />
                                                {config.label}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                            <Button variant="outline" size="sm" className="h-9 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-background hover:bg-muted" asChild>
                                <Link href={`/rh/${emp.id}?tab=legal`}>
                                    Compléter <ChevronRight className="h-4 w-4 ml-1 opacity-50" />
                                </Link>
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
