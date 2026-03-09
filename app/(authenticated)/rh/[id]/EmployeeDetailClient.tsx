'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    updateEmployee,
    addEmployeeDocument,
    toggleEmployeeStatus,
    deleteEmployeeDocument,
    syncEmployeePayslips,
    sendDocumentsEmail
} from "../actions"
import { toast } from "sonner"
import {
    FileText, Save, ArrowLeft, ExternalLink, Archive, UserCheck,
    Phone, MapPin, Mail, Euro, Calendar,
    ShieldCheck, Clock, Download, Plus, ChevronLeft, ChevronRight, Trash2, Check,
    FolderOpen, RefreshCw, Send, Loader2, ListChecks
} from "lucide-react"
import Link from "next/link"
import { HistoryChart } from "@/components/rh/HistoryChart"
import { ExportShiftsPDF } from "@/components/rh/ExportShiftsPDF"
import { ShiftManager } from "@/components/rh/ShiftManager"
import { RateHistoryManager } from "@/components/rh/RateHistoryManager"
import { ContractManager } from "@/components/rh/ContractManager"
import { DocumentAssistantCard } from "@/components/rh/DocumentAssistantCard"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

interface EmployeeDetailClientProps {
    employee: any
    searchParams: { month?: string, year?: string, tab?: string }
}

import { MobileProfileHero } from "@/components/rh/MobileProfileHero"
import { MobileStatCard } from "@/components/rh/MobileStatCard"

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
    const [isSyncing, setIsSyncing] = React.useState(false)
    const [isSendingMail, setIsSendingMail] = React.useState(false)
    const [selectedDocIds, setSelectedDocIds] = React.useState<string[]>([])
    const [isEmailDialogOpen, setIsEmailDialogOpen] = React.useState(false)
    const [customEmailBody, setCustomEmailBody] = React.useState("")
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

    const handleDeleteDocument = async (docId: string) => {
        const res = await deleteEmployeeDocument(docId, employee.id)
        if (!('error' in res)) {
            toast.success("Document supprimé.")
            router.refresh()
        } else {
            toast.error("Erreur lors de la suppression du document.")
        }
    }

    const handleSyncDrive = async () => {
        setIsSyncing(true)
        const res = await syncEmployeePayslips(employee.id)
        setIsSyncing(false)
        if (res && 'success' in res && res.success) {
            toast.success((res as any).message || "Synchronisation terminée")
            router.refresh()
        } else {
            toast.error((res as any).error || "Erreur lors de la synchronisation")
        }
    }

    const handleSendEmail = async () => {
        setIsSendingMail(true)
        const res = await sendDocumentsEmail(selectedDocIds, customEmailBody)
        setIsSendingMail(false)
        if (res && 'success' in res && res.success) {
            toast.success((res as any).message || "Email envoyé avec succès !")
            setIsEmailDialogOpen(false)
            setSelectedDocIds([])
            setCustomEmailBody("")
        } else {
            toast.error((res as any).error || "Erreur lors de l'envoi")
        }
    }

    const toggleDocSelection = (docId: string) => {
        setSelectedDocIds(prev =>
            prev.includes(docId)
                ? prev.filter(id => id !== docId)
                : [...prev, docId]
        )
    }

    const payslips = employee.documents.filter((d: any) => d.type === "PAYSLIP")
    const payslipsByYear = payslips.reduce((acc: Record<number, any[]>, doc: any) => {
        const year = doc.year || new Date(doc.createdAt).getFullYear()
        if (!acc[year]) acc[year] = []
        acc[year].push(doc)
        return acc
    }, {})
    const sortedYears = Object.keys(payslipsByYear).map(Number).sort((a: number, b: number) => b - a)

    return (
        <div className="flex min-h-screen flex-col bg-background pb-20 sm:bg-muted/20">
            {/* Desktop Header */}
            <div className="hidden sm:block bg-card border-b border-border sticky top-0 z-20 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/rh">
                            <Button variant="outline" size="sm" className="gap-2 rounded-xl">
                                <ArrowLeft className="h-4 w-4" /> Retour
                            </Button>
                        </Link>
                        <div className="h-8 w-[1px] bg-border mx-2" />
                        <div>
                            <h1 className="text-xl font-bold text-foreground leading-tight">{employee.name}</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Badge className={employee.isActive ? "bg-primary text-white border-none" : "bg-muted text-muted-foreground border-none"}>
                                    {employee.isActive ? "Salarié Actif" : "Archivé"}
                                </Badge>
                                <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">• {employee.role}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant={employee.isActive ? "ghost" : "outline"}
                            size="sm"
                            className={employee.isActive ? "text-muted-foreground hover:text-red-500 rounded-xl" : "text-primary rounded-xl"}
                            onClick={handleToggleStatus}
                        >
                            {employee.isActive ? <Archive className="h-4 w-4 mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                            {employee.isActive ? "Archiver" : "Réactiver"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Header Navigation */}
            <div className="sm:hidden sticky top-0 z-30 flex items-center bg-card/80 backdrop-blur-md p-4 justify-between border-b border-primary/10">
                <div className="flex items-center gap-3">
                    <Link href="/rh">
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary active:scale-90 transition-transform">
                            <ArrowLeft className="h-5 w-5" />
                        </div>
                    </Link>
                    <h2 className="text-lg font-black leading-tight tracking-tight">Fiche Salarié</h2>
                </div>
                <div className="flex items-center">
                    <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 active:scale-90" onClick={handleToggleStatus}>
                        <Archive className="h-5 w-5 text-muted-foreground" />
                    </Button>
                </div>
            </div>

            {/* Mobile Profile Hero */}
            <MobileProfileHero employee={employee} />

            <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
                <Tabs defaultValue={defaultTab} className="space-y-6 sm:space-y-8">
                    {/* Tabs List with Mobile Horizontal Scroll */}
                    <div className="sticky top-[72px] sm:static z-20 -mx-4 px-4 sm:mx-0 sm:px-0 bg-background sm:bg-transparent border-b border-primary/10 sm:border-none overflow-x-auto no-scrollbar">
                        <TabsList className="bg-transparent sm:bg-card p-0 sm:p-1 border-none sm:border border-border shadow-none sm:shadow-sm justify-start w-max sm:w-auto h-auto sm:h-10">
                            {[
                                { value: 'stats', label: 'Résumé', icon: Calendar },
                                { value: 'hours', label: 'Heures', icon: Clock },
                                { value: 'legal', label: 'Documents', icon: ShieldCheck },
                                { value: 'rates', label: 'Taux & Contrat', icon: Euro },
                                { value: 'profile', label: 'Réglages', icon: Mail }
                            ].map((tab) => (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    className="gap-2 px-6 py-4 sm:py-1.5 border-b-2 sm:border-none border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent sm:data-[state=active]:bg-background data-[state=active]:text-primary sm:data-[state=active]:shadow-lg transition-all rounded-none sm:rounded-lg text-sm font-bold h-full"
                                >
                                    <tab.icon className="h-4 w-4 hidden sm:inline" /> {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    {/* ONGLET 1: RESUME & STATS */}
                    <TabsContent value="stats" className="space-y-6">
                        {/* Mobile Stats View */}
                        <div className="sm:hidden space-y-6">
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-black tracking-tight">Activité du mois</h3>
                                    <span className="text-primary text-xs font-bold uppercase bg-primary/10 px-2 py-0.5 rounded-full">{monthLabel}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <MobileStatCard
                                        icon={Clock}
                                        label="Heures"
                                        value={`${totalHours.toFixed(1)}h`}
                                        subLabel="+12% vs mois dernier"
                                        variant="primary"
                                    />
                                    <MobileStatCard
                                        icon={Euro}
                                        label="Salaire Brut"
                                        value={`${totalGrossPay.toFixed(2)}€`}
                                        subLabel="Estimé (Hors variable)"
                                        variant="blue"
                                    />
                                </div>
                            </section>

                            <section>
                                <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50">
                                    <h4 className="text-sm font-black mb-5 uppercase tracking-widest text-muted-foreground/80">Derniers shifts</h4>
                                    <div className="space-y-4">
                                        {filteredShifts.slice(0, 3).map((shift: any, i: number) => {
                                            const shiftDate = new Date(shift.startTime)
                                            const day = shiftDate.getDate()
                                            const month = shiftDate.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase().replace('.', '')
                                            const duration = shift.endTime ? ((new Date(shift.endTime).getTime() - shiftDate.getTime()) / 3600000 - shift.breakMinutes / 60).toFixed(1) : '?'

                                            return (
                                                <React.Fragment key={shift.id}>
                                                    <div className="flex items-center justify-between active:bg-muted/50 rounded-lg transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className="size-11 rounded-xl bg-muted flex flex-col items-center justify-center text-[10px] font-black border border-border/50">
                                                                <span className="text-primary text-base leading-none mb-0.5">{day}</span>
                                                                <span className="text-muted-foreground opacity-60 leading-none">{month}</span>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-foreground">Shift {shiftDate.getHours() < 17 ? 'Midi' : 'Soir'}</p>
                                                                <p className="text-[11px] text-muted-foreground font-medium">
                                                                    {shiftDate.getHours()}h{shiftDate.getMinutes().toString().padStart(2, '0')} - {shift.endTime ? new Date(shift.endTime).getHours() : '??'}h{shift.endTime ? new Date(shift.endTime).getMinutes().toString().padStart(2, '0') : '??'} ({duration}h)
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                                                    </div>
                                                    {i < 2 && <div className="h-px bg-border/40 ml-14" />}
                                                </React.Fragment>
                                            )
                                        })}
                                    </div>
                                    <Button variant="ghost" className="mt-4 w-full text-primary text-xs font-black uppercase tracking-widest hover:bg-primary/5">
                                        Voir l'historique complet
                                    </Button>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-lg font-black tracking-tight">Informations clés</h3>
                                <div className="rounded-2xl bg-card border border-border/50 divide-y divide-border/20 overflow-hidden">
                                    {[
                                        { icon: Phone, label: "Téléphone", value: employee.phone || "Non renseigné" },
                                        { icon: FileText, label: "Type de contrat", value: `${employee.contractType || 'CDI'} (${employee.contractDuration === 'PART_TIME' ? 'Partiel' : '35h'})` },
                                        { icon: MapPin, label: "Adresse", value: employee.address || "Non renseignée" },
                                    ].map((info, i) => (
                                        <div key={i} className="flex items-center justify-between p-4">
                                            <div className="flex items-center gap-3">
                                                <info.icon className="h-4 w-4 text-primary" />
                                                <span className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">{info.label}</span>
                                            </div>
                                            <span className="text-sm font-bold text-foreground text-right">{info.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Desktop Stats View */}
                        <div className="hidden sm:grid lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-2 border-border shadow-sm bg-card rounded-2xl">
                                <CardHeader className="border-b border-border bg-muted/20">
                                    <CardTitle className="text-lg flex items-center justify-between text-foreground">
                                        <span className="font-bold">Activité du mois</span>
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
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><ChevronLeft className="h-4 w-4" /></Button>
                                                </Link>
                                                <span className="text-sm font-bold min-w-[120px] text-center capitalize">{monthLabel}</span>
                                                <Link href={`/rh/${employee.id}?month=${nextMonth}&year=${nextYear}`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><ChevronRight className="h-4 w-4" /></Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <div className="grid md:grid-cols-2 gap-8 text-center sm:text-left">
                                        <div className="space-y-2 p-4 bg-muted/10 rounded-2xl border border-border/30">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Heures travaillées</p>
                                            <div className="text-4xl font-black text-foreground">{totalHours.toFixed(1)} <span className="text-xl text-muted-foreground font-normal">h</span></div>
                                            <p className="text-xs text-muted-foreground font-medium">Total net sur la période</p>
                                        </div>
                                        <div className="space-y-2 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Salaire Brut Estimé</p>
                                            <div className="text-4xl font-black text-primary">{totalGrossPay.toFixed(2)} <span className="text-xl text-primary/70 font-normal">€</span></div>
                                            <p className="text-xs text-primary/60 font-medium">Basé sur {Number(employee.hourlyRate).toFixed(2)}€ / h</p>
                                        </div>
                                    </div>

                                    <div className="mt-10 border-t border-border pt-8">
                                        <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Historique 12 mois (heures)</h4>
                                        <HistoryChart data={last12Months} maxHours={maxHours} />
                                    </div>

                                    <div className="mt-12">
                                        <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Derniers documents de paie</h4>
                                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {employee.documents.filter((d: any) => d.type === "PAYSLIP").slice(0, 3).map((doc: any) => (
                                                <div key={doc.id} className="flex items-center justify-between p-3 border border-border rounded-xl bg-card hover:border-primary/50 transition-all hover:shadow-md group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                                            <FileText className="h-5 w-5" />
                                                        </div>
                                                        <span className="text-xs font-bold text-foreground truncate max-w-[120px]">{doc.name}</span>
                                                    </div>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" asChild><a href={doc.url} target="_blank"><ExternalLink className="h-4 w-4" /></a></Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-6">
                                <Card className="border-border shadow-sm bg-card rounded-2xl overflow-hidden">
                                    <CardHeader className="bg-muted/30 border-b border-border py-4">
                                        <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">Coordonnées Rapides</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-5 space-y-4">
                                        <div className="flex gap-4">
                                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                <Phone className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tight">Téléphone</p>
                                                <p className="text-sm font-bold text-foreground">{employee.phone || "Non renseigné"}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                <MapPin className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tight">Adresse</p>
                                                <p className="text-sm font-bold text-foreground leading-snug">{employee.address || "Non renseignée"}</p>
                                            </div>
                                        </div>
                                        <div className="border-t border-border pt-4">
                                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tight mb-2">Statut Contrat</p>
                                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold uppercase text-[10px] px-2 rounded-lg">{employee.contractType || 'CDI'} • Temps {employee.contractDuration === 'PART_TIME' ? 'Partiel' : 'Plein'}</Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
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

                    {/* ONGLET 3: DOSSIER RH & DOCUMENTS */}
                    <TabsContent value="legal" className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-black tracking-tight mb-1">Dossier Personnel</h3>
                                <p className="text-sm text-muted-foreground font-medium opacity-80 leading-relaxed uppercase tracking-wider text-[10px]">
                                    Gestion des documents et conformité légale
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                className="gap-2 rounded-xl border-amber-500/20 bg-amber-500/5 text-amber-600 hover:bg-amber-500/10 hover:border-amber-500/40 h-10 font-black uppercase text-[10px] tracking-widest"
                                onClick={handleSyncDrive}
                                disabled={isSyncing}
                            >
                                {isSyncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                                Scanner Drive Local
                            </Button>
                        </div>

                        <Accordion type="multiple" defaultValue={["payslips", "mandatory"]} className="w-full space-y-4">
                            {/* DOSSIER 1: FICHES DE PAIE */}
                            <AccordionItem value="payslips" className="border border-border/50 bg-card rounded-2xl overflow-hidden shadow-sm px-4">
                                <AccordionTrigger className="hover:no-underline py-4 group">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <FolderOpen className="h-5 w-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-black uppercase tracking-tight">Fiches de paie</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Historique des bulletins</p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-6">
                                    <div className="space-y-6 mt-4">
                                        {selectedDocIds.length > 0 && (
                                            <div className="sticky top-0 z-10 bg-primary/10 border border-primary/20 p-3 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2">
                                                <div className="flex items-center gap-2 px-2">
                                                    <ListChecks className="h-4 w-4 text-primary" />
                                                    <span className="text-xs font-black uppercase text-primary">{selectedDocIds.length} sélectionné(s)</span>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    className="bg-primary text-white h-8 font-black uppercase text-[10px] tracking-widest gap-2"
                                                    onClick={() => {
                                                        setCustomEmailBody(`Bonjour ${employee.name},\n\nVeuillez trouver ci-joint vos documents RH.\n\nCordialement,`)
                                                        setIsEmailDialogOpen(true)
                                                    }}
                                                >
                                                    <Send className="h-3 w-3" /> Envoyer la sélection
                                                </Button>
                                            </div>
                                        )}

                                        {sortedYears.length === 0 ? (
                                            <div className="col-span-full py-10 text-center border-2 border-dashed border-muted rounded-xl">
                                                <p className="text-xs font-bold text-muted-foreground uppercase">Aucune fiche de paie trouvée</p>
                                                <Button variant="ghost" className="mt-2 text-[10px] font-black uppercase text-primary" onClick={handleSyncDrive}>Lancer un scan maintenant</Button>
                                            </div>
                                        ) : (
                                            sortedYears.map(year => (
                                                <div key={year} className="space-y-3">
                                                    <h4 className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] pl-2 flex items-center gap-3">
                                                        <span className="w-6 h-[1px] bg-muted-foreground/20"></span>
                                                        {year}
                                                        <span className="flex-1 h-[1px] bg-muted-foreground/20"></span>
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {payslipsByYear[year]
                                                            .sort((a: any, b: any) => (b.month || 0) - (a.month || 0))
                                                            .map((doc: any) => (
                                                                <div
                                                                    key={doc.id}
                                                                    className={`flex items-center justify-between p-3 border rounded-xl transition-all group relative ${selectedDocIds.includes(doc.id) ? 'bg-primary/5 border-primary shadow-sm' : 'bg-muted/10 border-border/40 hover:bg-muted/30'}`}
                                                                >
                                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                                        <Checkbox
                                                                            checked={selectedDocIds.includes(doc.id)}
                                                                            onCheckedChange={() => toggleDocSelection(doc.id)}
                                                                            className="h-4 w-4 rounded border-border/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                                        />
                                                                        <a
                                                                            href={doc.url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex items-center gap-3 overflow-hidden group/file"
                                                                            title="Visualiser le document"
                                                                        >
                                                                            <div className="h-9 w-9 bg-background text-primary rounded-lg flex items-center justify-center shrink-0 shadow-sm group-hover/file:scale-105 group-hover/file:bg-primary/5 transition-all">
                                                                                <FileText className="h-5 w-5" />
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <p className="text-xs font-black truncate group-hover/file:text-primary transition-colors" title={doc.name}>{doc.name}</p>
                                                                                <p className="text-[9px] font-bold text-muted-foreground uppercase">
                                                                                    {doc.month ? new Date(2000, doc.month - 1).toLocaleDateString('fr-FR', { month: 'long' }) : ''}
                                                                                </p>
                                                                            </div>
                                                                        </a>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <Button
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10"
                                                                            asChild
                                                                            title="Ouvrir dans Drive"
                                                                        >
                                                                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                                                                <ExternalLink className="h-4 w-4" />
                                                                            </a>
                                                                        </Button>
                                                                        <Button
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            className="h-8 w-8 rounded-lg text-emerald-500 hover:bg-emerald-500/10"
                                                                            asChild
                                                                            title="Télécharger"
                                                                        >
                                                                            <a href={doc.url?.includes('file/d/') ? `https://drive.google.com/uc?export=download&id=${doc.url.split('file/d/')[1].split('/')[0]}` : doc.url} target="_blank" rel="noopener noreferrer">
                                                                                <Download className="h-4 w-4" />
                                                                            </a>
                                                                        </Button>
                                                                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-500/10" onClick={() => handleDeleteDocument(doc.id)} title="Supprimer">
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* DOSSIER 2: DOCUMENTS OBLIGATOIRES */}
                            <AccordionItem value="mandatory" className="border border-border/50 bg-card rounded-2xl overflow-hidden shadow-sm px-4">
                                <AccordionTrigger className="hover:no-underline py-4 group">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <ShieldCheck className="h-5 w-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-black uppercase tracking-tight">Documents Obligatoires</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Conformité & Juridique</p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-6">
                                    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                                        <DocumentAssistantCard
                                            employeeId={employee.id}
                                            employeeName={employee.name}
                                            documents={employee.documents}
                                            onDeleteDoc={handleDeleteDocument}
                                            docType="CONTRACT"
                                            title="Contrat"
                                            shortDesc="CDI, CDD, Extra..."
                                            assistantHelp={"Le contrat de travail formalise l'embauche. Il doit être signé par les deux parties avant ou le jour de l'embauche."}
                                        />
                                        <DocumentAssistantCard
                                            employeeId={employee.id}
                                            employeeName={employee.name}
                                            documents={employee.documents}
                                            onDeleteDoc={handleDeleteDocument}
                                            docType="ID_CARD"
                                            title="Identité"
                                            shortDesc="CNI, Titre de séjour"
                                            assistantHelp={"Une pièce d'identité en cours de validité est obligatoire. Pour les ressortissants hors UE, un titre de séjour valide est requis."}
                                        />
                                        <DocumentAssistantCard
                                            employeeId={employee.id}
                                            employeeName={employee.name}
                                            documents={employee.documents}
                                            onDeleteDoc={handleDeleteDocument}
                                            docType="DPAE"
                                            title="DPAE"
                                            shortDesc="Déclaration URSSAF"
                                            assistantHelp={"La DPAE doit être faite AVANT l'embauche. C'est l'unique preuve contre le travail dissimulé."}
                                        />
                                        <DocumentAssistantCard
                                            employeeId={employee.id}
                                            employeeName={employee.name}
                                            documents={employee.documents}
                                            onDeleteDoc={handleDeleteDocument}
                                            docType="MEDICAL"
                                            title="Médical"
                                            shortDesc="Fiche d'aptitude"
                                            assistantHelp={"La visite médicale d'information et de prévention (VIP) doit avoir lieu dans les 3 mois suivant l'embauche."}
                                        />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </TabsContent>

                    {/* ONGLET 4: TAUX & CONTRAT */}
                    <TabsContent value="rates">
                        <RateHistoryManager
                            userId={employee.id}
                            currentHistoryJson={employee.address}
                        />
                    </TabsContent>

                    {/* ONGLET 5: PROFIL & PARAMS */}
                    <TabsContent value="profile">
                        <Card className="border-border shadow-sm bg-card rounded-2xl overflow-hidden">
                            <CardHeader className="border-b border-border bg-muted/20">
                                <CardTitle className="text-foreground font-bold">Identité & Coordonnées</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-8 px-4 sm:px-6">
                                <form action={handleProfileUpdate} className="grid md:grid-cols-2 gap-6 pb-2">
                                    <input type="hidden" name="id" value={employee.id} />
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">Nom complet</Label>
                                            <div className="relative">
                                                <UserCheck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input name="name" defaultValue={employee.name} className="pl-10 h-10 bg-muted/20 border-border/50 rounded-xl font-bold" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">Email PRO</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input name="email" defaultValue={employee.email} className="pl-10 h-10 bg-muted/20 border-border/50 rounded-xl font-bold" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">Téléphone</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input name="phone" defaultValue={employee.phone || ''} className="pl-10 h-10 bg-muted/20 border-border/50 rounded-xl font-bold" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">Contrat</Label>
                                                <select name="contractType" defaultValue={employee.contractType || 'CDI'} className="w-full h-10 rounded-xl border-border/50 bg-muted/20 px-3 py-2 text-sm font-bold appearance-none">
                                                    <option value="CDI">CDI</option>
                                                    <option value="CDD">CDD</option>
                                                    <option value="EXTRA">Extra</option>
                                                    <option value="APPRENTI">Apprenti</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">Temps</Label>
                                                <select name="contractDuration" defaultValue={employee.contractDuration || 'FULL_TIME'} className="w-full h-10 rounded-xl border-border/50 bg-muted/20 px-3 py-2 text-sm font-bold appearance-none">
                                                    <option value="FULL_TIME">Plein</option>
                                                    <option value="PART_TIME">Partiel</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">Rôle Applicatif</Label>
                                            <select name="role" defaultValue={employee.role} className="w-full h-10 rounded-xl border-border/50 bg-muted/20 px-3 py-2 text-sm font-bold appearance-none">
                                                <option value="STAFF">Staff (Standard)</option>
                                                <option value="MANAGER">Manager (Stocks/RH)</option>
                                                <option value="ADMIN">Admin (Complet)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">Taux Brut (€/h)</Label>
                                            <div className="relative">
                                                <Euro className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input name="hourlyRate" type="number" step="0.01" defaultValue={Number(employee.hourlyRate)} className="pl-10 h-10 bg-muted/20 border-border/50 rounded-xl font-bold" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-full pt-6 border-t border-border mt-2">
                                        <Button type="submit" className="w-full sm:w-auto bg-primary text-white gap-2 px-10 h-11 font-black uppercase tracking-wider rounded-xl shadow-lg shadow-primary/20">
                                            <Save className="h-4 w-4" /> Enregistrer
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>

            {/* DIALOG: EMAIL PREVIEW */}
            <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                <DialogContent className="sm:max-w-xl rounded-3xl border-none shadow-2xl overflow-hidden p-0">
                    <DialogHeader className="bg-primary p-6 text-white pb-8">
                        <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                            <Send className="h-6 w-6" /> Envoyer les documents
                        </DialogTitle>
                        <DialogDescription className="text-primary-foreground/80 font-medium">
                            Prévisualisez et modifiez le message envoyé à <strong>{employee.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Destinataire</Label>
                            <div className="bg-muted/30 p-3 rounded-xl border border-border/50 text-sm font-bold text-foreground">
                                {employee.email || "⚠️ Aucune adresse email renseignée"}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Corps du message</Label>
                            <Textarea
                                value={customEmailBody}
                                onChange={e => setCustomEmailBody(e.target.value)}
                                className="min-h-[150px] bg-muted/20 border-border/50 rounded-2xl resize-none font-medium text-sm p-4 focus:ring-primary/20"
                                placeholder="Tapez votre message ici..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Documents joints ({selectedDocIds.length})</Label>
                            <div className="max-h-[120px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {employee.documents
                                    .filter((d: any) => selectedDocIds.includes(d.id))
                                    .map((d: any) => (
                                        <div key={d.id} className="text-xs font-bold text-primary bg-primary/5 p-2 rounded-lg flex items-center gap-2 border border-primary/10">
                                            <FileText className="h-3 w-3" /> {d.name}
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="bg-muted/30 p-6 flex flex-col sm:flex-row gap-3">
                        <Button
                            variant="ghost"
                            className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-xs"
                            onClick={() => setIsEmailDialogOpen(false)}
                        >
                            Annuler
                        </Button>
                        <Button
                            className="flex-1 h-12 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs gap-2 shadow-lg shadow-primary/20"
                            onClick={handleSendEmail}
                            disabled={isSendingMail || !employee.email}
                        >
                            {isSendingMail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Envoyer maintenant
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
