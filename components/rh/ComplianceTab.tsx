"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShieldCheck, Download, AlertTriangle, FileText, FileSearch, CheckCircle2 } from "lucide-react"
import jsPDF from "jspdf"
import "jspdf-autotable"

export function ComplianceTab({ employees }: { employees: any[] }) {

    const exportRUP = () => {
        const doc = new jsPDF() as any

        doc.setFontSize(22)
        doc.text("Registre Unique du Personnel (RUP)", 14, 22)

        doc.setFontSize(12)
        doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR')}`, 14, 32)
        doc.text(`Nombre de salariés : ${employees.length}`, 14, 40)

        const tableData = employees.map((e) => {
            const contractType = e.contractType || "Non renseigné"
            const role = e.role === "ADMIN" ? "Gérant" : e.role === "MANAGER" ? "Manager" : "Employé"
            const entryDate = new Date(e.createdAt).toLocaleDateString('fr-FR')
            const status = e.isActive ? "Actif" : "Sorti"

            return [
                e.name,
                "Non renseignée", // Nationalité not tracked yet
                contractType,
                role,
                entryDate,
                status
            ]
        })

        doc.autoTable({
            startY: 50,
            head: [['Nom Prénom', 'Nationalité', 'Type Contrat', 'Qualification', 'Date Entrée', 'Statut']],
            body: tableData,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [41, 128, 185] }
        })

        doc.save(`RUP_Restaurant_${new Date().toISOString().split('T')[0]}.pdf`)
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-border shadow-sm bg-card rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-border bg-muted/20 pb-4 px-4 sm:px-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                                    <FileSearch className="h-4 w-4 text-blue-500" />
                                    Registre Unique (RUP)
                                </CardTitle>
                                <CardDescription className="mt-2 text-[10px] font-bold uppercase text-muted-foreground/60 leading-relaxed">
                                    Obligatoire dès le 1er salarié. Doit être présenté immédiatement en cas de contrôle.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                        <Button onClick={exportRUP} className="w-full gap-2 bg-primary text-white h-11 font-black uppercase tracking-wider rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95" variant="default">
                            <Download className="h-4 w-4" />
                            Générer le RUP (PDF)
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-sm bg-card rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-border bg-muted/20 pb-4 px-4 sm:px-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    DUERP
                                </CardTitle>
                                <CardDescription className="mt-2 text-[10px] font-bold uppercase text-muted-foreground/60 leading-relaxed">
                                    Document Unique d'Évaluation des Risques. Mise à jour annuelle obligatoire.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col gap-4">
                            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[10px] font-bold uppercase tracking-tight text-amber-700 dark:text-amber-400 leading-normal">
                                Le DUERP doit être stocké en lieu sûr et accessible par tous les employés.
                            </div>
                            <Button disabled className="w-full h-11 gap-2 font-black uppercase tracking-wider rounded-xl opacity-50" variant="outline">
                                <FileText className="h-4 w-4" />
                                Importer DUERP
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-emerald-500/10 bg-emerald-500/[0.02] shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="px-4 sm:px-6 pt-6">
                    <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                        <ShieldCheck className="h-4 w-4" />
                        Checklist Inspection du Travail
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 px-4 sm:px-6 pb-6">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/50 shadow-sm transition-all hover:shadow-md">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-tighter">1. RUP</p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Dates entrée/sortie à jour.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/50 shadow-sm transition-all hover:shadow-md">
                        <CheckCircle2 className="h-4 w-4 text-amber-500 mt-0.5" />
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-tighter">2. DUERP</p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Santé & Sécurité au travail.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/50 shadow-sm transition-all hover:shadow-md">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-tighter">3. Relevés d'heures</p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Signés mensuellement.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/50 shadow-sm transition-all hover:shadow-md">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-tighter">4. DPAE</p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Accusés de réception URSSAF.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/50 shadow-sm transition-all hover:shadow-md">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-tighter">5. Contrats</p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Dossier papier complet.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/50 shadow-sm transition-all hover:shadow-md">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-tighter">6. Suivi Médical</p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Visites d'aptitudes à jour.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
