'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { sendDocumentsToEmail, syncAllEmployeePayslips } from "@/app/(authenticated)/rh/actions"
import { FileText, Send, Mail, Loader2, Calendar, HardDriveDownload } from "lucide-react"

interface AccountingExportTabProps {
    employees: any[]
}

const MONTHS = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' }
]

export function AccountingExportTab({ employees }: AccountingExportTabProps) {
    const today = new Date()
    const currentMonth = today.getMonth() + 1
    const currentYear = today.getFullYear()

    // Default to previous month if we are in the first few days of the month, otherwise current month
    const defaultMonth = today.getDate() < 10 ? (currentMonth === 1 ? 12 : currentMonth - 1) : currentMonth
    const defaultYear = today.getDate() < 10 && currentMonth === 1 ? currentYear - 1 : currentYear

    const [selectedMonth, setSelectedMonth] = useState<number>(defaultMonth)
    const [selectedYear, setSelectedYear] = useState<number>(defaultYear)

    const [targetEmail, setTargetEmail] = useState("")
    const [emailSubject, setEmailSubject] = useState("")
    const [emailBody, setEmailBody] = useState("")

    const [selectedDocIds, setSelectedDocIds] = useState<string[]>([])
    const [isSending, setIsSending] = useState(false)
    const [isScanning, setIsScanning] = useState(false)

    // Load defaults from local storage
    useEffect(() => {
        const savedEmail = localStorage.getItem('compta_email') || ""
        const savedSubject = localStorage.getItem('compta_subject') || "Fiches de paie [Mois Année] - Restaurant OS"
        const savedBody = localStorage.getItem('compta_body') || "Bonjour,\n\nVeuillez trouver ci-joint les fiches de paie pour la période écoulée.\n\nCordialement,"

        setTargetEmail(savedEmail)
        setEmailSubject(savedSubject.replace('[Mois Année]', `${MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear}`))
        setEmailBody(savedBody)
    }, [])

    // Update subject dynamic part when month/year changes
    useEffect(() => {
        if (emailSubject) {
            const regex = /Fiches de paie .* - Restaurant OS/i;
            if (regex.test(emailSubject)) {
                setEmailSubject(`Fiches de paie ${MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear} - Restaurant OS`)
            }
        }
    }, [selectedMonth, selectedYear])

    // Compute payslips for the selected period
    const payslips = React.useMemo(() => {
        const docs: any[] = []
        employees.forEach(emp => {
            if (emp.documents) {
                emp.documents.forEach((doc: any) => {
                    if (doc.type === 'PAYSLIP' && doc.month === selectedMonth && doc.year === selectedYear) {
                        docs.push({ ...doc, employeeName: emp.name })
                    }
                })
            }
        })
        return docs.sort((a, b) => a.employeeName.localeCompare(b.employeeName))
    }, [employees, selectedMonth, selectedYear])

    // Auto-select all when payslips change
    useEffect(() => {
        setSelectedDocIds(payslips.map(p => p.id))
    }, [payslips])

    const toggleSelection = (id: string) => {
        setSelectedDocIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    const toggleAll = () => {
        if (selectedDocIds.length === payslips.length) {
            setSelectedDocIds([])
        } else {
            setSelectedDocIds(payslips.map(p => p.id))
        }
    }

    const handleSend = async () => {
        if (!targetEmail) {
            toast.error("Veuillez renseigner l'adresse email du destinataire.")
            return
        }
        if (selectedDocIds.length === 0) {
            toast.error("Veuillez sélectionner au moins une fiche de paie.")
            return
        }

        // Save preference for next time
        localStorage.setItem('compta_email', targetEmail)
        localStorage.setItem('compta_subject', emailSubject)
        localStorage.setItem('compta_body', emailBody)

        setIsSending(true)
        const result = await sendDocumentsToEmail(selectedDocIds, targetEmail, emailSubject, emailBody)
        setIsSending(false)

        if (result && 'success' in result && result.success) {
            toast.success(result.message || "Envoi réussi")
        } else {
            toast.error((result as any)?.error || "Erreur lors de l'envoi")
        }
    }

    const handleGlobalScan = async () => {
        setIsScanning(true)
        const result = await syncAllEmployeePayslips()
        setIsScanning(false)
        if (result && 'success' in result && result.success) {
            toast.success(result.message || "Scan terminé avec succès")
        } else {
            toast.error((result as any)?.error || "Erreur lors du scan")
        }
    }

    const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

    return (
        <div className="grid md:grid-cols-12 gap-6 h-full min-h-[500px]">
            <div className="md:col-span-8 space-y-6">
                <Card className="rounded-2xl border-border shadow-sm">
                    <CardHeader className="bg-muted/10 border-b pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-xl flex items-center gap-3">
                                    Fiches de Paie
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={handleGlobalScan} 
                                        disabled={isScanning}
                                        className="h-8 rounded-full border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-xs shadow-sm font-bold"
                                    >
                                        {isScanning ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <HardDriveDownload className="w-3.5 h-3.5 mr-1.5" />}
                                        {isScanning ? "Scan en cours..." : "Scanner Drive"}
                                    </Button>
                                </CardTitle>
                                <CardDescription className="mt-1">Sélectionnez la période à exporter</CardDescription>
                            </div>
                            <div className="flex items-center gap-3">
                                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                                    <SelectTrigger className="w-[140px] rounded-xl font-bold bg-background">
                                        <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MONTHS.map(m => (
                                            <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                                    <SelectTrigger className="w-[100px] rounded-xl font-bold bg-background">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map(y => (
                                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {payslips.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                                <FileText className="h-10 w-10 opacity-20 mb-3" />
                                <p className="font-bold">Aucune fiche de paie trouvée pour cette période.</p>
                                <p className="text-sm opacity-70">Assurez-vous qu'elles ont été synchronisées depuis le Drive.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/50 max-h-[500px] overflow-y-auto no-scrollbar">
                                <div className="flex items-center p-3 bg-muted/5 sticky top-0 z-10 border-b border-border/50 backdrop-blur-md">
                                    <Checkbox 
                                        checked={selectedDocIds.length > 0 && selectedDocIds.length === payslips.length} 
                                        onCheckedChange={toggleAll}
                                        className="mr-4"
                                    />
                                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                        Tout sélectionner ({selectedDocIds.length}/{payslips.length})
                                    </span>
                                </div>
                                {payslips.map(doc => (
                                    <div key={doc.id} className="flex items-center p-4 hover:bg-muted/10 transition-colors cursor-pointer" onClick={() => toggleSelection(doc.id)}>
                                        <Checkbox 
                                            checked={selectedDocIds.includes(doc.id)}
                                            onCheckedChange={() => toggleSelection(doc.id)}
                                            className="mr-4"
                                        />
                                        <div className="flex-1 min-w-0 flex items-center gap-3">
                                            <div className="h-10 w-10 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center shrink-0">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-foreground truncate">{doc.employeeName}</p>
                                                <p className="text-xs text-muted-foreground truncate" title={doc.name}>{doc.name}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="md:col-span-4 space-y-6">
                <Card className="rounded-2xl border-border shadow-sm sticky top-24">
                    <CardHeader className="bg-muted/10 border-b pb-4">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Send className="h-5 w-5 text-primary" /> Envoi Comptable
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-5">
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Email du destinataire</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="compta@exemple.fr" 
                                    className="pl-10 rounded-xl bg-muted/20 border-border/50"
                                    value={targetEmail}
                                    onChange={e => setTargetEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Sujet de l'email</Label>
                            <Input 
                                className="rounded-xl bg-muted/20 border-border/50"
                                value={emailSubject}
                                onChange={e => setEmailSubject(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Message (Optionnel)</Label>
                            <Textarea 
                                className="rounded-xl bg-muted/20 border-border/50 min-h-[120px] resize-none"
                                value={emailBody}
                                onChange={e => setEmailBody(e.target.value)}
                            />
                        </div>

                        <Button 
                            className="w-full h-12 rounded-xl font-bold gap-2 text-white bg-primary hover:bg-primary/90"
                            onClick={handleSend}
                            disabled={isSending || payslips.length === 0 || selectedDocIds.length === 0}
                        >
                            {isSending ? (
                                <><Loader2 className="h-5 w-5 animate-spin" /> Envoi en cours...</>
                            ) : (
                                <><Send className="h-5 w-5" /> Envoyer {selectedDocIds.length} fiche(s)</>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
