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
        <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-border shadow-sm">
                    <CardHeader className="border-b border-border bg-muted/20 pb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileSearch className="h-5 w-5 text-blue-500" />
                                    Registre Unique du Personnel
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    Obligatoire dès le 1er salarié. Doit être présenté immédiatement en cas de contrôle de l'Inspection du Travail. Amende : jusqu'à 750€ par salarié manquant.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <Button onClick={exportRUP} className="w-full gap-2" variant="default">
                            <Download className="h-4 w-4" />
                            Générer le RUP (PDF)
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-sm">
                    <CardHeader className="border-b border-border bg-muted/20 pb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                                    DUERP
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    Document Unique d'Évaluation des Risques Professionnels. Obligatoire. Doit être mis à jour au moins une fois par an.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="flex flex-col gap-4">
                            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700 dark:text-amber-400">
                                Le DUERP doit être stocké en lieu sûr et accessible. Il répertorie les risques et les actions de prévention.
                            </div>
                            <Button disabled className="w-full gap-2" variant="outline">
                                <FileText className="h-4 w-4" />
                                Importer DUERP (Bientôt)
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                        <ShieldCheck className="h-5 w-5" />
                        Checklist Inspection du Travail & URSSAF
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold">1. RUP</p>
                            <p className="text-xs text-muted-foreground">À jour avec les dates d'entrée/sortie.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                        <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold">2. DUERP</p>
                            <p className="text-xs text-muted-foreground">Obligatoire pour la Santé/Sécurité.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold">3. Relevés d'heures</p>
                            <p className="text-xs text-muted-foreground">À exporter depuis les fiches salariés.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold">4. DPAE</p>
                            <p className="text-xs text-muted-foreground">Accusé URSSAF dans le dossier salarié.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold">5. Contrats</p>
                            <p className="text-xs text-muted-foreground">Signés, dans le dossier salarié.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold">6. Suivi Médical</p>
                            <p className="text-xs text-muted-foreground">Fiche d'aptitude médicale listée.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
