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
                    <TabsContent value="legal" className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            {/* Checklist Onboarding */}
                            <Card className="border-border shadow-sm bg-indigo-500/5">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5 text-indigo-500" />
                                        Conformité Onboarding
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        {[
                                            { label: "Contrat Signé", type: "CONTRACT" },
                                            { label: "Carte Identité / Passeport", type: "ID_CARD" },
                                            { label: "Titre de Séjour / Autoris.", type: "RESIDENCE_PERMIT" },
                                            { label: "Mutuelle / RIB", type: "INSURANCE" }
                                        ].map((item, i) => {
                                            const isPresent = employee.documents.some((d: any) => d.type === item.type);
                                            const isLikelyPresent = isPresent || employee.documents.some((d: any) => d.name.toLowerCase().includes(item.type === 'ID_CARD' ? 'identi' : item.type === 'CONTRACT' ? 'contrat' : 'titre'));

                                            return (
                                                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${isLikelyPresent ? 'bg-card border-emerald-500/50 shadow-sm' : 'bg-muted/30 border-border border-dashed opacity-70'}`}>
                                                    <div className={`h-6 w-6 rounded-full flex items-center justify-center border ${isLikelyPresent ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-transparent border-border'}`}>
                                                        {isLikelyPresent && <Check className="h-3 w-3" />}
                                                    </div>
                                                    <span className={`text-xs font-bold leading-tight ${isLikelyPresent ? 'text-foreground' : 'text-muted-foreground'}`}>{item.label}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-border shadow-sm bg-card">
                                <CardHeader className="bg-muted/20 border-b border-border">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-lg text-foreground">Fiches de Paie</CardTitle>
                                        <Badge className="bg-blue-600 text-white border-none">{employee.documents.filter((d: any) => d.type === "PAYSLIP").length}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-1 p-2">
                                        {employee.documents.filter((d: any) => d.type === "PAYSLIP").length === 0 ? (
                                            <div className="col-span-full p-8 text-center text-muted-foreground text-sm">Prêt pour import N8N...</div>
                                        ) : (
                                            employee.documents.filter((d: any) => d.type === "PAYSLIP").map((doc: any) => (
                                                <div key={doc.id} className="relative group">
                                                    <a href={doc.url} target="_blank" className="p-4 border border-border rounded-lg hover:border-blue-500/50 hover:bg-blue-500/5 transition-all flex flex-col items-center gap-2">
                                                        <div className="h-10 w-10 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><FileText className="h-5 w-5" /></div>
                                                        <span className="text-[10px] font-bold text-center uppercase tracking-tighter text-foreground truncate w-full">{doc.month}/{doc.year || 'PAIE'}</span>
                                                        <Download className="h-3 w-3 text-muted-foreground" />
                                                    </a>
                                                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-6 w-6 text-red-400 hover:text-red-500 bg-background shadow-sm border border-border"
                                                            onClick={() => handleDeleteDocument(doc.id)}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Contrats — composant dédié avec historique */}
                            <ContractManager
                                employeeId={employee.id}
                                employeeName={employee.name}
                                contractType={employee.contractType || 'CDI'}
                                contractDuration={employee.contractDuration || 'FULL_TIME'}
                                documents={employee.documents}
                            />
                        </div>

                        <div className="space-y-6">
                            <Card className="border-blue-500/20 bg-blue-500/5 shadow-sm overflow-hidden">
                                <CardHeader className="pb-3 border-b border-blue-500/10">
                                    <CardTitle className="text-sm text-blue-500 flex items-center gap-2">
                                        <Plus className="h-4 w-4" />
                                        Uploader vers Google Drive
                                    </CardTitle>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                        Rangement auto : <span className="font-semibold text-foreground">RH / {employee.name} / Type</span>
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-3 pt-4">

                                    {/* Zone Drag & Drop */}
                                    <div
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center backdrop-blur-sm transition-all cursor-pointer select-none ${droppedFile
                                            ? 'border-emerald-500 bg-emerald-500/10'
                                            : isDragging
                                                ? 'border-blue-500 bg-blue-500/10 scale-[1.02]'
                                                : 'border-blue-500/20 bg-background/50 hover:bg-background/80 hover:border-blue-500/40'
                                            }`}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                        {droppedFile ? (
                                            <>
                                                <div className="h-10 w-10 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-2">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[180px]">{droppedFile.name}</p>
                                                <p className="text-[9px] text-muted-foreground mt-0.5">{(droppedFile.size / 1024).toFixed(0)} Ko · Cliquez pour changer</p>
                                            </>
                                        ) : (
                                            <>
                                                <Plus className={`h-8 w-8 mb-2 transition-colors ${isDragging ? 'text-blue-600' : 'text-blue-400'}`} />
                                                <p className="text-xs text-foreground font-medium">
                                                    {isDragging ? 'Relâchez ici...' : 'Glissez un fichier ou cliquez'}
                                                </p>
                                                <p className="text-[9px] text-muted-foreground mt-1">PDF, JPG, PNG, DOCX · max 20 Mo</p>
                                            </>
                                        )}
                                    </div>

                                    {/* Formulaire */}
                                    <div className="space-y-2">
                                        <Input
                                            placeholder="Nom du document"
                                            className="text-xs h-8"
                                            value={docName}
                                            onChange={(e) => setDocName(e.target.value)}
                                        />
                                        <select
                                            value={docType}
                                            onChange={(e) => setDocType(e.target.value)}
                                            className="w-full text-[10px] uppercase font-bold border border-input rounded p-1.5 h-8 bg-background text-foreground"
                                        >
                                            <option value="ID_CARD">🪪 Carte Identité / Passeport</option>
                                            <option value="CONTRACT">📋 Contrat de Travail</option>
                                            <option value="PAYSLIP">💶 Fiche de Paie</option>
                                            <option value="RESIDENCE_PERMIT">📄 Titre de Séjour</option>
                                            <option value="INSURANCE">🏥 Mutuelle / RIB</option>
                                            <option value="OTHER">📁 Autre document</option>
                                        </select>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                type="number" min="1" max="12"
                                                placeholder="Mois (ex: 3)"
                                                className="h-8 text-xs bg-background"
                                                value={docMonth}
                                                onChange={(e) => setDocMonth(e.target.value)}
                                            />
                                            <Input
                                                type="number" min="2000" max="2100"
                                                placeholder="Année (ex: 2026)"
                                                className="h-8 text-xs bg-background"
                                                value={docYear}
                                                onChange={(e) => setDocYear(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Barre de progression */}
                                    {isUploading && (
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[10px] text-muted-foreground">
                                                <span>Upload en cours…</span>
                                                <span>{uploadProgress}%</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-1.5">
                                                <div
                                                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                                    style={{ width: `${uploadProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Bouton upload */}
                                    <Button
                                        onClick={handleUpload}
                                        disabled={isUploading || !droppedFile}
                                        className="w-full h-9 text-xs font-bold gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                                    >
                                        {isUploading ? (
                                            <>
                                                <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Upload vers Drive…
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="h-3.5 w-3.5" />
                                                Envoyer vers Google Drive
                                            </>
                                        )}
                                    </Button>

                                    {/* Info rangement */}
                                    {docType && (
                                        <p className="text-[9px] text-muted-foreground text-center">
                                            📂 Drive → <strong>RH - Restaurant OS</strong> / <strong>{employee.name}</strong> / <strong>{{
                                                ID_CARD: 'Identité',
                                                CONTRACT: 'Contrats',
                                                PAYSLIP: 'Fiches de paie',
                                                RESIDENCE_PERMIT: 'Titre de séjour',
                                                INSURANCE: 'Mutuelle & RIB',
                                                OTHER: 'Autres documents',
                                            }[docType] || docType}</strong>
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
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
