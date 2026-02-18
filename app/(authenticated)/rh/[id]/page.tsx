import React from 'react'
export const dynamic = 'force-dynamic'

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { updateEmployee, addEmployeeDocument, toggleEmployeeStatus, addShift, deleteShift, deleteEmployeeDocument } from "../actions"
import { toast } from "sonner"
import {
    FileText, Save, ArrowLeft, ExternalLink, Archive, UserCheck,
    Phone, MapPin, Mail, Euro, Calendar,
    ShieldCheck, Clock, Download, Plus, ChevronLeft, ChevronRight, Trash2, Check
} from "lucide-react"
import Link from "next/link"
import { EditShiftDialog } from "@/components/rh/EditShiftDialog"
import { HistoryChart } from "@/components/rh/HistoryChart"
import { ExportShiftsPDF } from "@/components/rh/ExportShiftsPDF"
import { ShiftManager } from "@/components/rh/ShiftManager"

export default async function EmployeeDetailPage({
    params,
    searchParams
}: {
    params: { id: string },
    searchParams: { month?: string, year?: string, tab?: string }
}) {
    const employee = (await (prisma.user as any).findUnique({
        where: { id: params.id },
        include: {
            documents: { orderBy: { createdAt: 'desc' } },
            shifts: { orderBy: { startTime: 'desc' } }
        }
    })) as any

    if (!employee) return notFound()

    // Gestion de l'onglet par défaut (si tab=hours passé en URL)
    const defaultTab = searchParams.tab || "stats"

    // Gestion de la période (mois/année) pour les calculs
    const now = new Date()
    const selectedMonth = searchParams.month ? parseInt(searchParams.month) - 1 : now.getMonth()
    const selectedYear = searchParams.year ? parseInt(searchParams.year) : now.getFullYear()

    const periodDate = new Date(selectedYear, selectedMonth)
    const monthLabel = periodDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

    const filteredShifts = employee.shifts.filter((s: any) =>
        s.startTime.getMonth() === selectedMonth &&
        s.startTime.getFullYear() === selectedYear
    )

    // Calcul des stats sur 12 mois pour le graphique
    const last12Months = Array.from({ length: 12 }, (_, i) => {
        const d = new Date()
        d.setMonth(d.getMonth() - (11 - i))
        const m = d.getMonth()
        const y = d.getFullYear()

        const monthShifts = employee.shifts.filter((s: any) =>
            s.startTime.getMonth() === m && s.startTime.getFullYear() === y
        )

        const hours = monthShifts.reduce((acc: number, s: any) => {
            if (!s.endTime) return acc
            return acc + ((s.endTime.getTime() - s.startTime.getTime()) / 3600000) - (s.breakMinutes / 60)
        }, 0)

        return {
            label: d.toLocaleDateString('fr-FR', { month: 'short' }),
            hours: hours
        }
    })

    const maxHours = Math.max(...last12Months.map(m => m.hours), 1)

    const totalHours = filteredShifts.reduce((acc: number, s: any) => {
        if (!s.endTime) return acc
        const diffMs = s.endTime.getTime() - s.startTime.getTime()
        const diffHours = (diffMs / 1000 / 60 / 60) - (s.breakMinutes / 60)
        return acc + diffHours
    }, 0)

    const totalGrossPay = filteredShifts.reduce((acc: number, s: any) => {
        if (!s.endTime) return acc
        const diffMs = s.endTime.getTime() - s.startTime.getTime()
        const diffHours = (diffMs / 1000 / 60 / 60) - (s.breakMinutes / 60)
        return acc + (diffHours * Number(s.hourlyRate))
    }, 0)

    // Navigation mois
    const prevMonth = selectedMonth === 0 ? 12 : selectedMonth
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear
    const nextMonth = selectedMonth === 11 ? 1 : selectedMonth + 2
    const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear

    return (
        <div className="flex min-h-screen flex-col bg-gray-50/50 pb-20">
            {/* Header Pro */}
            <div className="bg-white border-b sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/rh">
                            <Button variant="outline" size="sm" className="gap-2">
                                <ArrowLeft className="h-4 w-4" /> Retour
                            </Button>
                        </Link>
                        <div className="h-8 w-[1px] bg-slate-200 mx-2" />
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 leading-tight">{employee.name}</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Badge className={employee.isActive ? "bg-emerald-500 text-white border-none" : "bg-slate-500 border-none"}>
                                    {employee.isActive ? "Salarié Actif" : "Archivé"}
                                </Badge>
                                <span className="text-xs text-slate-400">• {employee.role}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <form action={async () => {
                            'use server'
                            const res = await toggleEmployeeStatus(employee.id, !employee.isActive)
                            if (res.success) {
                                toast.success("Statut employé mis à jour.")
                            } else {
                                toast.error("Erreur lors de la mise à jour du statut.")
                            }
                        }}>
                            <Button variant={employee.isActive ? "ghost" : "outline"} size="sm" className={employee.isActive ? "text-slate-400 hover:text-red-600" : "text-emerald-600"}>
                                {employee.isActive ? <Archive className="h-4 w-4 mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                                {employee.isActive ? "Archiver" : "Réactiver"}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>

            <main className="max-w-6xl mx-auto w-full px-6 py-8">
                <Tabs defaultValue={defaultTab} className="space-y-8">
                    <TabsList className="bg-white p-1 border shadow-sm">
                        <TabsTrigger value="stats" className="gap-2 px-6"><Calendar className="h-4 w-4" /> Résumé</TabsTrigger>
                        <TabsTrigger value="hours" className="gap-2 px-6"><Clock className="h-4 w-4" /> Heures & Travail</TabsTrigger>
                        <TabsTrigger value="legal" className="gap-2 px-6"><ShieldCheck className="h-4 w-4" /> Dossier Juridique</TabsTrigger>
                        <TabsTrigger value="profile" className="gap-2 px-6"><Mail className="h-4 w-4" /> Profil & Params</TabsTrigger>
                    </TabsList>

                    {/* ONGLET 1: RESUME & STATS */}
                    <TabsContent value="stats" className="grid lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 border-none shadow-sm">
                            <CardHeader className="border-b bg-white">
                                <CardTitle className="text-lg flex items-center justify-between">
                                    <span>Activité du mois</span>
                                    <div className="flex items-center gap-4">
                                        <ExportShiftsPDF
                                            employee={employee}
                                            shifts={filteredShifts}
                                            monthLabel={monthLabel}
                                            totalHours={totalHours}
                                            totalGross={totalGrossPay}
                                        />
                                        <div className="flex items-center gap-2">
                                            <Link href={`/rh/${employee.id}?month=${prevMonth}&year=${prevYear}`}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
                                            </Link>
                                            <span className="text-sm font-medium min-w-[120px] text-center capitalize">{monthLabel}</span>
                                            <Link href={`/rh/${employee.id}?month=${nextMonth}&year=${nextYear}`}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-500 font-medium">Heures travaillées</p>
                                        <div className="text-4xl font-black text-slate-900">{totalHours.toFixed(1)} <span className="text-xl text-slate-400 font-normal">h</span></div>
                                        <p className="text-xs text-slate-400">Total net sur la période</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-500 font-medium">Salaire Brut Estimé</p>
                                        <div className="text-4xl font-black text-blue-600">{totalGrossPay.toFixed(2)} <span className="text-xl text-blue-400 font-normal">€</span></div>
                                        <p className="text-xs text-slate-400">Basé sur {Number(employee.hourlyRate).toFixed(2)}€ / h</p>
                                    </div>
                                </div>

                                <div className="mt-10 border-t pt-8">
                                    <h4 className="text-sm font-bold text-slate-900 mb-2">Historique 12 mois (h)</h4>
                                    <HistoryChart data={last12Months} maxHours={maxHours} />
                                </div>

                                <div className="mt-12">
                                    <h4 className="text-sm font-bold text-slate-900 mb-4">Derniers documents de paie</h4>
                                    <div className="grid gap-3">
                                        {employee.documents.filter((d: any) => d.type === "PAYSLIP").slice(0, 3).map((doc: any) => (
                                            <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded flex items-center justify-center"><FileText className="h-4 w-4" /></div>
                                                    <span className="text-sm font-medium">{doc.name}</span>
                                                </div>
                                                <Button size="sm" variant="ghost" asChild><a href={doc.url} target="_blank"><ExternalLink className="h-4 w-4" /></a></Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm h-fit">
                            <CardHeader className="bg-slate-50 border-b">
                                <CardTitle className="text-sm uppercase tracking-wider text-slate-500 font-bold">Infos Rapides</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex gap-3">
                                    <Phone className="h-4 w-4 text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-bold">Téléphone</p>
                                        <p className="text-sm">{employee.phone || "Non renseigné"}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <MapPin className="h-4 w-4 text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-bold">Adresse</p>
                                        <p className="text-sm">{employee.address || "Non renseignée"}</p>
                                    </div>
                                </div>
                                <div className="border-t pt-4">
                                    <p className="text-xs text-slate-500 uppercase font-bold mb-2">Contrat</p>
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">CDI Temps Plein</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ONGLET 2: HEURES & TRAVAIL */}
                    <TabsContent value="hours">
                        <ShiftManager
                            employee={employee}
                            shifts={filteredShifts}
                            monthLabel={monthLabel}
                            prevMonth={prevMonth}
                            prevYear={prevYear}
                            nextMonth={nextMonth}
                            nextYear={nextYear}
                        />
                    </TabsContent>

                    {/* ONGLET 3: DOSSIER JURIDIQUE */}
                    <TabsContent value="legal" className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            {/* Checklist Onboarding */}
                            <Card className="border-none shadow-sm bg-indigo-50/50">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base font-bold text-indigo-900 flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5 text-indigo-600" />
                                        Conformité Onboarding
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        {[
                                            { label: "Contrat Signé", type: "CONTRACT" },
                                            { label: "Carte Identité / Passeport", type: "ID_CARD" },
                                            { label: "Titre de Séjour / Autoris.", type: "RESIDENCE_PERMIT" }, // Need to map 'OTHER' sometimes
                                            { label: "Mutuelle / RIB", type: "INSURANCE" }
                                        ].map((item, i) => {
                                            const isPresent = employee.documents.some((d: any) => d.type === item.type);
                                            // Fallback logic for ease of use: Check names or generic 'OTHER' if specific type missing
                                            const isLikelyPresent = isPresent || employee.documents.some((d: any) => d.name.toLowerCase().includes(item.type === 'ID_CARD' ? 'identi' : item.type === 'CONTRACT' ? 'contrat' : 'titre'));

                                            return (
                                                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${isLikelyPresent ? 'bg-white border-emerald-200 shadow-sm' : 'bg-white/50 border-slate-200 border-dashed opacity-70'}`}>
                                                    <div className={`h-6 w-6 rounded-full flex items-center justify-center border ${isLikelyPresent ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-transparent border-slate-300'}`}>
                                                        {isLikelyPresent && <Check className="h-3 w-3" />}
                                                    </div>
                                                    <span className={`text-xs font-bold leading-tight ${isLikelyPresent ? 'text-slate-800' : 'text-slate-400'}`}>{item.label}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-none shadow-sm">
                                <CardHeader className="bg-slate-50 border-b">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-lg">Fiches de Paie</CardTitle>
                                        <Badge className="bg-blue-600 border-none">{employee.documents.filter((d: any) => d.type === "PAYSLIP").length}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-1 p-2">
                                        {employee.documents.filter((d: any) => d.type === "PAYSLIP").length === 0 ? (
                                            <div className="col-span-full p-8 text-center text-slate-400 text-sm">Prêt pour import N8N...</div>
                                        ) : (
                                            employee.documents.filter((d: any) => d.type === "PAYSLIP").map((doc: any) => (
                                                <div key={doc.id} className="relative group">
                                                    <a href={doc.url} target="_blank" className="p-4 border rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center gap-2">
                                                        <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><FileText className="h-5 w-5" /></div>
                                                        <span className="text-[10px] font-bold text-center uppercase tracking-tighter truncate w-full">{doc.month}/{doc.year || 'PAIE'}</span>
                                                        <Download className="h-3 w-3 text-slate-300" />
                                                    </a>
                                                    <form action={async () => {
                                                        'use server'
                                                        const res = await deleteEmployeeDocument(doc.id, employee.id)
                                                        if (res.success) {
                                                            toast.success("Document supprimé.")
                                                        } else {
                                                            toast.error("Erreur lors de la suppression du document.")
                                                        }
                                                    }} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-600 bg-white shadow-sm border"><Trash2 className="h-3 w-3" /></Button>
                                                    </form>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm">
                                <CardHeader className="bg-slate-50 border-b">
                                    <CardTitle className="text-lg">Contrats & Identité</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    {employee.documents.filter((d: any) => d.type === "CONTRACT" || d.type === "ID_CARD" || d.category === "JURIDIQUE").map((doc: any) => (
                                        <div key={doc.id} className="flex items-center justify-between p-3 border-b last:border-0 group">
                                            <div className="flex items-center gap-4">
                                                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                                <div>
                                                    <p className="text-sm font-bold leading-none">{doc.name}</p>
                                                    <p className="text-[10px] text-slate-400 mt-1 uppercase">{doc.type}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button size="sm" variant="ghost" asChild><a href={doc.url} target="_blank"><ExternalLink className="h-4 w-4" /></a></Button>
                                                <form action={async () => {
                                                    'use server'
                                                    await deleteEmployeeDocument(doc.id, employee.id)
                                                }}>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-200 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
                                                </form>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card className="border-blue-200 bg-blue-50 shadow-sm overflow-hidden">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm text-blue-900">Ajouter / Drag-and-Drop</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="border-2 border-dashed border-blue-200 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-white transition-colors">
                                        <Plus className="h-8 w-8 text-blue-400 mb-2" />
                                        <p className="text-xs text-blue-900 font-medium">Collez votre lien ci-dessous</p>
                                        <p className="text-[9px] text-blue-400 mt-1">Google Drive, Dropbox, etc.</p>
                                    </div>
                                    <form action={async (formData: FormData) => {
                                        'use server'
                                        const res = await addEmployeeDocument(formData)
                                        if (res.success) {
                                            toast.success("Document ajouté avec succès.")
                                            // Reset form fields after successful submission
                                            const form = document.getElementById("add-document-form") as HTMLFormElement;
                                            if (form) {
                                                form.reset();
                                            }
                                        } else {
                                            toast.error(res.message || "Erreur lors de l'ajout du document.")
                                        }
                                    }} id="add-document-form" className="space-y-3">
                                        <input type="hidden" name="userId" value={employee.id} />
                                        <Input name="name" placeholder="Nom du document" className="text-xs h-8" required />
                                        <Input name="url" placeholder="Lien URL complet" className="text-xs h-8" required />
                                        <select name="type" className="w-full text-[10px] uppercase font-bold border rounded p-1.5 h-8">
                                            <option value="ID_CARD">Carte Identité / Passeport</option>
                                            <option value="CONTRACT">Contrat de Travail</option>
                                            <option value="PAYSLIP">Fiche de Paie</option>
                                            <option value="OTHER">Autre dossier</option>
                                        </select>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input type="number" name="month" placeholder="Mois" className="h-8 text-xs" />
                                            <Input type="number" name="year" placeholder="Année" className="h-8 text-xs" />
                                        </div>
                                        <Button type="submit" className="w-full h-8 text-xs bg-slate-900 text-white">Lier au dossier</Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* ONGLET 4: PROFIL & PARAMS */}
                    <TabsContent value="profile">
                        <Card className="border-none shadow-sm">
                            <CardHeader className="border-b bg-white">
                                <CardTitle>Identité & Coordonnées</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-8">
                                <form action={async (formData: FormData) => {
                                    'use server'
                                    const res = await updateEmployee(formData)
                                    if (res.success) {
                                        toast.success("Profil employé mis à jour.")
                                    } else {
                                        toast.error(res.message || "Erreur lors de la mise à jour du profil.")
                                    }
                                }} className="grid md:grid-cols-2 gap-6">
                                    <input type="hidden" name="id" value={employee.id} />
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Nom complet</Label>
                                            <div className="relative">
                                                <UserCheck className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                                <Input name="name" defaultValue={employee.name} className="pl-9" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email PRO</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                                <Input name="email" defaultValue={employee.email} className="pl-9" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Téléphone</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                                <Input name="phone" defaultValue={employee.phone || ''} className="pl-9" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Type de Contrat</Label>
                                                <select name="contractType" defaultValue={employee.contractType || 'CDI'} title="Type de contrat" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm appearance-none">
                                                    <option value="CDI">CDI</option>
                                                    <option value="CDD">CDD</option>
                                                    <option value="EXTRA">Extra / Vacataire</option>
                                                    <option value="APPRENTI">Apprentissage</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Temps de travail</Label>
                                                <select name="contractDuration" defaultValue={employee.contractDuration || 'FULL_TIME'} title="Temps de travail" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm appearance-none">
                                                    <option value="FULL_TIME">Temps Plein</option>
                                                    <option value="PART_TIME">Temps Partiel</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Rôle</Label>
                                            <select name="role" defaultValue={employee.role} title="Rôle" className="w-full flex h-10 rounded-md border border-input px-3 py-2 text-sm bg-background appearance-none">
                                                <option value="STAFF">Staff (Standard)</option>
                                                <option value="MANAGER">Manager (Stocks/RH)</option>
                                                <option value="ADMIN">Admin (Complet)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Taux Horaire Brut (€)</Label>
                                            <div className="relative">
                                                <Euro className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                                <Input name="hourlyRate" type="number" step="0.01" defaultValue={Number(employee.hourlyRate)} className="pl-9" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-full pt-6 border-t flex justify-end">
                                        <Button type="submit" className="bg-blue-600 gap-2 px-8"><Save className="h-4 w-4" /> Sauvegarder</Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    )
}
