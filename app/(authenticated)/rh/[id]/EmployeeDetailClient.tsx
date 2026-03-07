'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { updateEmployee, addEmployeeDocument, toggleEmployeeStatus, deleteEmployeeDocument } from "../actions"
import { toast } from "sonner"
import {
    FileText, Save, ArrowLeft, ExternalLink, Archive, UserCheck,
    Phone, MapPin, Mail, Euro, Calendar,
    ShieldCheck, Clock, Download, Plus, ChevronLeft, ChevronRight, Trash2, Check
} from "lucide-react"
import Link from "next/link"
import { HistoryChart } from "@/components/rh/HistoryChart"
import { ExportShiftsPDF } from "@/components/rh/ExportShiftsPDF"
import { ShiftManager } from "@/components/rh/ShiftManager"
import { RateHistoryManager } from "@/components/rh/RateHistoryManager"
import { ContractManager } from "@/components/rh/ContractManager"
import { DocumentAssistantCard } from "@/components/rh/DocumentAssistantCard"
import { useRouter } from "next/navigation"

interface EmployeeDetailClientProps {
    employee: any
    searchParams: { month?: string, year?: string, tab?: string }
}

export default function EmployeeDetailClient({ employee, searchParams }: EmployeeDetailClientProps) {
    const router = useRouter()

    // États pour le drag & drop et l'upload Drive
    const [isDragging, setIsDragging] = React.useState(false)
    const [droppedFile, setDroppedFile] = React.useState<File | null>(null)
    const [docName, setDocName] = React.useState("")
    const [docType, setDocType] = React.useState("OTHER")
    const [docMonth, setDocMonth] = React.useState("")
    const [docYear, setDocYear] = React.useState("")
    const [isUploading, setIsUploading] = React.useState(false)
    const [uploadProgress, setUploadProgress] = React.useState(0)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    // Gestion de l'onglet par défaut (si tab=hours passé en URL)
    const defaultTab = searchParams.tab || "stats"

    // Gestion de la période (mois/année) pour les calculs
    const now = new Date()
    const selectedMonth = searchParams.month ? parseInt(searchParams.month) - 1 : now.getMonth()
    const selectedYear = searchParams.year ? parseInt(searchParams.year) : now.getFullYear()

    const periodDate = new Date(selectedYear, selectedMonth)
    const monthLabel = periodDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

    const filteredShifts = employee.shifts.filter((s: any) => {
        const d = new Date(s.startTime)
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear
    })

    // Calcul des stats sur 12 mois pour le graphique
    const last12Months = Array.from({ length: 12 }, (_, i) => {
        const d = new Date()
        d.setMonth(d.getMonth() - (11 - i))
        const m = d.getMonth()
        const y = d.getFullYear()

        const monthShifts = employee.shifts.filter((s: any) => {
            const sd = new Date(s.startTime)
            return sd.getMonth() === m && sd.getFullYear() === y
        })

        const hours = monthShifts.reduce((acc: number, s: any) => {
            if (!s.endTime) return acc
            const start = new Date(s.startTime)
            const end = new Date(s.endTime)
            return acc + ((end.getTime() - start.getTime()) / 3600000) - (s.breakMinutes / 60)
        }, 0)

        return {
            label: d.toLocaleDateString('fr-FR', { month: 'short' }),
            hours: hours
        }
    })

    const maxHours = Math.max(...last12Months.map(m => m.hours), 1)

    const totalHours = filteredShifts.reduce((acc: number, s: any) => {
        if (!s.endTime) return acc
        const start = new Date(s.startTime)
        const end = new Date(s.endTime)
        const diffMs = end.getTime() - start.getTime()
        const diffHours = (diffMs / 1000 / 60 / 60) - (s.breakMinutes / 60)
        return acc + diffHours
    }, 0)

    const totalGrossPay = filteredShifts.reduce((acc: number, s: any) => {
        if (!s.endTime) return acc
        const start = new Date(s.startTime)
        const end = new Date(s.endTime)
        const diffMs = end.getTime() - start.getTime()
        const diffHours = (diffMs / 1000 / 60 / 60) - (s.breakMinutes / 60)
        return acc + (diffHours * Number(s.hourlyRate))
    }, 0)

    // Navigation mois
    const prevMonth = selectedMonth === 0 ? 12 : selectedMonth
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear
    const nextMonth = selectedMonth === 11 ? 1 : selectedMonth + 2
    const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear

    const handleProfileUpdate = async (formData: FormData) => {
        const res = await updateEmployee(formData)
        if (!('error' in res)) {
            toast.success("Profil employé mis à jour.")
            router.refresh()
        } else {
            toast.error((res as any).error || "Erreur lors de la mise à jour du profil.")
        }
    }

    const handleToggleStatus = async () => {
        const res = await toggleEmployeeStatus(employee.id, !employee.isActive)
        if (!('error' in res)) {
            toast.success("Statut employé mis à jour.")
            router.refresh()
        } else {
            toast.error("Erreur lors de la mise à jour du statut.")
        }
    }

    const handleAddDocument = async (formData: FormData) => {
        const res = await addEmployeeDocument(formData)
        if (!('error' in res)) {
            toast.success("Document ajouté avec succès.")
            const form = document.getElementById("add-document-form") as HTMLFormElement
            if (form) form.reset()
            setDocName("")
            router.refresh()
        } else {
            toast.error((res as any).error || "Erreur lors de l'ajout du document.")
        }
    }

    const handleDeleteDocument = async (docId: string) => {
        const res = await deleteEmployeeDocument(docId, employee.id)
        if (!('error' in res)) {
            toast.success("Document supprimé.")
            router.refresh()
        } else {
            toast.error("Erreur lors de la suppression du document.")
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const files = Array.from(e.dataTransfer.files)
        if (files.length > 0) {
            const file = files[0]
            setDroppedFile(file)
            if (!docName) setDocName(file.name.replace(/\.[^.]+$/, ''))
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setDroppedFile(file)
            if (!docName) setDocName(file.name.replace(/\.[^.]+$/, ''))
        }
    }

    const handleUpload = async () => {
        if (!droppedFile || !docName.trim()) {
            toast.error('Veuillez sélectionner un fichier et nommer le document.')
            return
        }
        setIsUploading(true)
        setUploadProgress(10)

        try {
            const formData = new FormData()
            formData.append('file', droppedFile)
            formData.append('userId', employee.id)
            formData.append('name', docName.trim())
            formData.append('type', docType)
            if (docMonth) formData.append('month', docMonth)
            if (docYear) formData.append('year', docYear)

            setUploadProgress(30)

            const res = await fetch('/api/rh/upload', {
                method: 'POST',
                body: formData,
            })

            setUploadProgress(80)
            const data = await res.json()

            if (!res.ok || data.error) {
                throw new Error(data.error || 'Erreur serveur')
            }

            setUploadProgress(100)
            toast.success(`✅ ${data.message}`)

            // Reset
            setDroppedFile(null)
            setDocName('')
            setDocMonth('')
            setDocYear('')
            if (fileInputRef.current) fileInputRef.current.value = ''
            router.refresh()
        } catch (e: any) {
            toast.error(e.message || 'Erreur lors de l\'upload')
        } finally {
            setIsUploading(false)
            setUploadProgress(0)
        }
    }

    return (
        <div className="flex min-h-screen flex-col bg-muted/20 pb-20">
            {/* Header Pro */}
            <div className="bg-card border-b border-border sticky top-0 z-20 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/rh">
                            <Button variant="outline" size="sm" className="gap-2">
                                <ArrowLeft className="h-4 w-4" /> Retour
                            </Button>
                        </Link>
                        <div className="h-8 w-[1px] bg-border mx-2" />
                        <div>
                            <h1 className="text-xl font-bold text-foreground leading-tight">{employee.name}</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Badge className={employee.isActive ? "bg-emerald-500 text-white border-none" : "bg-muted text-muted-foreground border-none"}>
                                    {employee.isActive ? "Salarié Actif" : "Archivé"}
                                </Badge>
                                <span className="text-xs text-muted-foreground">• {employee.role}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant={employee.isActive ? "ghost" : "outline"}
                            size="sm"
                            className={employee.isActive ? "text-muted-foreground hover:text-red-500" : "text-emerald-500"}
                            onClick={handleToggleStatus}
                        >
                            {employee.isActive ? <Archive className="h-4 w-4 mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                            {employee.isActive ? "Archiver" : "Réactiver"}
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-6xl mx-auto w-full px-6 py-8">
                <Tabs defaultValue={defaultTab} className="space-y-8">
                    <TabsList className="bg-card p-1 border border-border shadow-sm">
                        <TabsTrigger value="stats" className="gap-2 px-6"><Calendar className="h-4 w-4" /> Résumé</TabsTrigger>
                        <TabsTrigger value="hours" className="gap-2 px-6"><Clock className="h-4 w-4" /> Heures & Travail</TabsTrigger>
                        <TabsTrigger value="legal" className="gap-2 px-6"><ShieldCheck className="h-4 w-4" /> Dossier Juridique</TabsTrigger>
                        <TabsTrigger value="rates" className="gap-2 px-6"><Euro className="h-4 w-4" /> Taux & Contrat</TabsTrigger>
                        <TabsTrigger value="profile" className="gap-2 px-6"><Mail className="h-4 w-4" /> Profil & Params</TabsTrigger>
                    </TabsList>

                    {/* ONGLET 1: RESUME & STATS */}
                    <TabsContent value="stats" className="grid lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 border-border shadow-sm bg-card">
                            <CardHeader className="border-b border-border bg-muted/20">
                                <CardTitle className="text-lg flex items-center justify-between text-foreground">
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
                                        <p className="text-sm text-muted-foreground font-medium">Heures travaillées</p>
                                        <div className="text-4xl font-black text-foreground">{totalHours.toFixed(1)} <span className="text-xl text-muted-foreground font-normal">h</span></div>
                                        <p className="text-xs text-muted-foreground">Total net sur la période</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground font-medium">Salaire Brut Estimé</p>
                                        <div className="text-4xl font-black text-blue-500">{totalGrossPay.toFixed(2)} <span className="text-xl text-blue-400 font-normal">€</span></div>
                                        <p className="text-xs text-muted-foreground">Basé sur {Number(employee.hourlyRate).toFixed(2)}€ / h</p>
                                    </div>
                                </div>

                                <div className="mt-10 border-t border-border pt-8">
                                    <h4 className="text-sm font-bold text-foreground mb-2">Historique 12 mois (h)</h4>
                                    <HistoryChart data={last12Months} maxHours={maxHours} />
                                </div>

                                <div className="mt-12">
                                    <h4 className="text-sm font-bold text-foreground mb-4">Derniers documents de paie</h4>
                                    <div className="grid gap-3">
                                        {employee.documents.filter((d: any) => d.type === "PAYSLIP").slice(0, 3).map((doc: any) => (
                                            <div key={doc.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/20 hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 bg-blue-500/10 text-blue-500 rounded flex items-center justify-center"><FileText className="h-4 w-4" /></div>
                                                    <span className="text-sm font-medium text-foreground">{doc.name}</span>
                                                </div>
                                                <Button size="sm" variant="ghost" asChild><a href={doc.url} target="_blank"><ExternalLink className="h-4 w-4" /></a></Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border shadow-sm h-fit bg-card">
                            <CardHeader className="bg-muted/20 border-b border-border">
                                <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground font-bold">Infos Rapides</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex gap-3">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-bold">Téléphone</p>
                                        <p className="text-sm text-foreground">{employee.phone || "Non renseigné"}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-bold">Adresse</p>
                                        <p className="text-sm text-foreground">{employee.address || "Non renseignée"}</p>
                                    </div>
                                </div>
                                <div className="border-t border-border pt-4">
                                    <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Contrat</p>
                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400">CDI Temps Plein</Badge>
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
                    <TabsContent value="legal" className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
                        <div>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                                            <ShieldCheck className="h-5 w-5 text-indigo-500" />
                                        </div>
                                        <h3 className="text-xl font-bold text-foreground tracking-tight">Assistant RH & Conformité</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1.5 font-medium">
                                        Gérez les documents obligatoires. Cliquez sur chaque dossier pour vérifier sa conformité ou déposer un fichier.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <DocumentAssistantCard
                                    employeeId={employee.id}
                                    employeeName={employee.name}
                                    documents={employee.documents}
                                    onDeleteDoc={handleDeleteDocument}
                                    docType="CONTRACT"
                                    title="Contrat de Travail"
                                    shortDesc="CDI, CDD, Extra..."
                                    assistantHelp={"Le contrat de travail formalise l'embauche. Il doit être signé par les deux parties avant ou le jour de l'embauche.\n\nEn cas d'inspection de l'URSSAF ou du travail, l'original numérique ou papier certifié doit pouvoir être présenté immédiatement sur demande."}
                                />
                                <DocumentAssistantCard
                                    employeeId={employee.id}
                                    employeeName={employee.name}
                                    documents={employee.documents}
                                    onDeleteDoc={handleDeleteDocument}
                                    docType="ID_CARD"
                                    title="Identité / Séjour"
                                    shortDesc="CNI, Passeport, Titre"
                                    assistantHelp={"Une pièce d'identité en cours de validité (CNI ou Passeport) est obligatoire pour vérifier l'identité du salarié à l'embauche.\n\nS'il est de nationalité étrangère (hors UE), un Titre de Séjour valant autorisation de travail valide est strictement obligatoire (Amende pour emploi d'étranger en délicatesse)."}
                                />
                                <DocumentAssistantCard
                                    employeeId={employee.id}
                                    employeeName={employee.name}
                                    documents={employee.documents}
                                    onDeleteDoc={handleDeleteDocument}
                                    docType="DPAE"
                                    title="DPAE"
                                    shortDesc="Accusé URSSAF"
                                    assistantHelp={"La Déclaration Préalable À l'Embauche (DPAE) doit être transmise à l'URSSAF AVANT la prise de poste effective du salarié (au plus tôt 8 jours avant, et jusqu'à 30 secondes avant que le salarié commence à travailler).\n\nL'accusé de réception est l'unique preuve permettant d'éviter l'amende pour travail dissimulé !"}
                                />
                                <DocumentAssistantCard
                                    employeeId={employee.id}
                                    employeeName={employee.name}
                                    documents={employee.documents}
                                    onDeleteDoc={handleDeleteDocument}
                                    docType="MEDICAL"
                                    title="Visite Médicale"
                                    shortDesc="Fiche d'aptitude"
                                    assistantHelp={"La VIP (Visite d'Information et de Prévention) doit se faire au maximum 3 mois après l'embauche.\n\nLa fiche d'aptitude médicale atteste que le salarié est apte à travailler dans les conditions prévues sans danger pour sa santé. Un pilier en santé."}
                                />
                            </div>
                        </div>

                        {/* Fiches de paie et autres */}
                        <div className="pt-8 border-t border-border">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-blue-500/10 rounded-lg">
                                            <FileText className="h-5 w-5 text-blue-500" />
                                        </div>
                                        <h3 className="text-xl font-bold text-foreground tracking-tight">Gestion Courante</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1.5 font-medium">
                                        Retrouvez l'historique financier et les correspondances générales.
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <DocumentAssistantCard
                                    employeeId={employee.id}
                                    employeeName={employee.name}
                                    documents={employee.documents}
                                    onDeleteDoc={handleDeleteDocument}
                                    docType="PAYSLIP"
                                    title="Fiches de Paie"
                                    shortDesc="Historique mensuel"
                                    assistantHelp={"Retrouvez ici toutes les fiches de paie du salarié. \n\nElles doivent être conservées et tenues à disposition des administrations ou en cas de demande du salarié (Droit à la conservation longue durée des documents sociaux)."}
                                />
                                <DocumentAssistantCard
                                    employeeId={employee.id}
                                    employeeName={employee.name}
                                    documents={employee.documents}
                                    onDeleteDoc={handleDeleteDocument}
                                    docType="OTHER"
                                    title="Autres documents"
                                    shortDesc="RIB, Mutuelle, Arrêts..."
                                    assistantHelp={"Déposez ici tout type de document annexe qui viendrait enrichir le dossier du salarié.\n\n- Rib (Pour virements).\n- Attestation Mutuelle HCR.\n- Justificatifs de domicile.\n- Arrêts maladie et IJSS.\n- Avertissements et courriers RH."}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    {/* ONGLET 4: TAUX & CONTRAT */}
                    <TabsContent value="rates" className="space-y-6">
                        <RateHistoryManager
                            userId={employee.id}
                            currentHistoryJson={employee.address}
                        />
                    </TabsContent>

                    {/* ONGLET 5: PROFIL & PARAMS */}
                    <TabsContent value="profile">
                        <Card className="border-border shadow-sm bg-card">
                            <CardHeader className="border-b border-border bg-muted/20">
                                <CardTitle className="text-foreground">Identité & Coordonnées</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-8">
                                <form action={handleProfileUpdate} className="grid md:grid-cols-2 gap-6">
                                    <input type="hidden" name="id" value={employee.id} />
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Nom complet</Label>
                                            <div className="relative">
                                                <UserCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input name="name" defaultValue={employee.name} className="pl-9 bg-background" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email PRO</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input name="email" defaultValue={employee.email} className="pl-9 bg-background" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Téléphone</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input name="phone" defaultValue={employee.phone || ''} className="pl-9 bg-background" />
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
                                            <select name="role" defaultValue={employee.role} title="Rôle" className="w-full flex h-10 rounded-md border border-input px-3 py-2 text-sm bg-background text-foreground appearance-none">
                                                <option value="STAFF">Staff (Standard)</option>
                                                <option value="MANAGER">Manager (Stocks/RH)</option>
                                                <option value="ADMIN">Admin (Complet)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Taux Horaire Brut (€)</Label>
                                            <div className="relative">
                                                <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input name="hourlyRate" type="number" step="0.01" defaultValue={Number(employee.hourlyRate)} className="pl-9 bg-background" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Rémunération Net (€)</Label>
                                            <div className="relative">
                                                <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input name="netRemuneration" type="number" step="0.01" defaultValue={Number(employee.netRemuneration || '')} placeholder="Saisie manuelle" className="pl-9 bg-background" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-full pt-6 border-t border-border flex justify-end">
                                        <Button type="submit" className="bg-primary text-primary-foreground gap-2 px-8 hover:bg-primary/90"><Save className="h-4 w-4" /> Sauvegarder</Button>
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
