'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Download, Mail, FileText, FileSpreadsheet, Send } from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import * as XLSX from 'xlsx'
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import { toast } from "sonner"
import { sendExportEmail } from "@/app/caisse/actions"

interface ExportDialogProps {
    transactions: any[]
    accountantEmail: string | null
}

export function ExportDialog({ transactions, accountantEmail }: ExportDialogProps) {
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
    const [formatType, setFormatType] = useState('xlsx')
    const [isExporting, setIsExporting] = useState(false)

    const getFilteredData = () => {
        const start = new Date(startDate)
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)

        return transactions.filter(t => {
            const d = new Date(t.date)
            return d >= start && d <= end
        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }

    const generateExcelBuffer = (data: any[]) => {
        const worksheetData = data.map(t => ({
            'Date': format(new Date(t.date), 'dd/MM/yyyy'),
            'Type': t.type === 'IN' ? 'Entrée' : 'Sortie',
            'Description': t.description,
            'Catégorie': t.category?.name || 'Sans catégorie',
            'Montant (€)': Number(t.amount).toFixed(2)
        }))

        const workbook = XLSX.utils.book_new()
        const worksheet = XLSX.utils.json_to_sheet(worksheetData)
        
        // Ajustement des largeurs de colonnes pour une meilleure lisibilité
        worksheet['!cols'] = [
            { wch: 14 }, // Date
            { wch: 12 }, // Type
            { wch: 45 }, // Description
            { wch: 25 }, // Catégorie
            { wch: 16 }  // Montant (€)
        ]

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions')
        return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    }

    const exportToExcel = (data: any[]) => {
        const buffer = generateExcelBuffer(data)
        const blob = new Blob([buffer], { type: 'application/octet-stream' })
        const fileName = `Export_Caisse_${startDate}_au_${endDate}.xlsx`
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = fileName
        link.click()
    }

    const exportToCSV = (data: any[]) => {
        const worksheetData = data.map(t => ({
            'Date': format(new Date(t.date), 'dd/MM/yyyy'),
            'Type': t.type === 'IN' ? 'Entrée' : 'Sortie',
            'Description': t.description,
            'Catégorie': t.category?.name || 'Sans catégorie',
            'Montant': Number(t.amount).toFixed(2)
        }))
        const worksheet = XLSX.utils.json_to_sheet(worksheetData)
        const csv = XLSX.utils.sheet_to_csv(worksheet)
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = `Export_Caisse_${startDate}_au_${endDate}.csv`
        link.click()
    }

    const exportToPDF = (data: any[]) => {
        const doc = new jsPDF() as any
        doc.text(`Export Caisse - Période du ${format(new Date(startDate), 'dd/MM/yyyy')} au ${format(new Date(endDate), 'dd/MM/yyyy')}`, 14, 15)

        const tableBody = data.map(t => [
            format(new Date(t.date), 'dd/MM/yyyy'),
            t.type === 'IN' ? 'Entrée' : 'Sortie',
            t.description,
            t.category?.name || '-',
            `${Number(t.amount).toFixed(2)} €`
        ])

        const totalIn = data.filter(t => t.type === 'IN').reduce((acc, t) => acc + Number(t.amount), 0)
        const totalOut = data.filter(t => t.type === 'OUT').reduce((acc, t) => acc + Number(t.amount), 0)

        doc.autoTable({
            startY: 25,
            head: [['Date', 'Type', 'Description', 'Catégorie', 'Montant']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [99, 102, 241], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [249, 250, 251] },
            styles: { fontSize: 10, cellPadding: 5 },
        })

        const finalY = (doc as any).lastAutoTable.finalY || 30
        doc.text(`Total Entrées: ${totalIn.toFixed(2)} €`, 14, finalY + 10)
        doc.text(`Total Sorties: ${totalOut.toFixed(2)} €`, 14, finalY + 17)
        doc.text(`Solde: ${(totalIn - totalOut).toFixed(2)} €`, 14, finalY + 24)

        doc.save(`Export_Caisse_${startDate}_au_${endDate}.pdf`)
    }

    const handleExport = () => {
        const data = getFilteredData()
        if (data.length === 0) {
            toast.error("Aucune transaction sur cette période.")
            return
        }

        if (formatType === 'xlsx') exportToExcel(data)
        else if (formatType === 'csv') exportToCSV(data)
        else if (formatType === 'pdf') exportToPDF(data)

        toast.success("Export terminé.")
    }

    const handleEmail = async () => {
        if (!accountantEmail) {
            toast.error("Veuillez configurer l'email de la comptabilité dans l'onglet Config.")
            return
        }

        const data = getFilteredData()
        if (data.length === 0) {
            toast.error("Aucune transaction sur cette période.")
            return
        }

        setIsExporting(true)
        try {
            const excelBuffer = generateExcelBuffer(data);
            const binaryString = Array.prototype.map.call(new Uint8Array(excelBuffer), function (ch) {
                return String.fromCharCode(ch);
            }).join('');
            const base64Content = btoa(binaryString);
            const fileName = `Export_Caisse_${startDate}_au_${endDate}.xlsx`;
            const subject = `Export Caisse du ${format(new Date(startDate), 'dd/MM/yyyy')} au ${format(new Date(endDate), 'dd/MM/yyyy')}`;

            const res = await sendExportEmail(accountantEmail, subject, fileName, base64Content)

            if (res.success) {
                toast.success(`Export envoyé à ${accountantEmail}.`)
            } else {
                toast.error(res.error || "Erreur lors de l'envoi de l'export.")
            }
        } catch (error: any) {
            console.error("Error sending email:", error)
            toast.error(`Erreur inattendue: ${error.message || String(error)}`)
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 bg-primary/10 hover:bg-primary/20 border-primary/20 text-primary font-bold">
                    <Download className="h-4 w-4" /> Export / Envoi Compta
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-indigo-500" /> Exportation des données
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Du</Label>
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Au</Label>
                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Format</Label>
                        <Select value={formatType} onValueChange={setFormatType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                                <SelectItem value="csv">CSV (.csv)</SelectItem>
                                <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                        <Button onClick={handleExport} className="w-full gap-2">
                            <Download className="h-4 w-4" /> Télécharger l'export
                        </Button>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t"></span></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Ou envoyer par mail</span></div>
                        </div>
                        <Button
                            variant="secondary"
                            onClick={handleEmail}
                            disabled={isExporting}
                            className="w-full gap-2 border-primary/20 hover:bg-primary/5 text-primary font-bold"
                        >
                            {isExporting ? <span className="animate-spin">🌀</span> : <Send className="h-4 w-4" />}
                            Envoyer à la comptabilité
                        </Button>
                        {accountantEmail ? (
                            <p className="text-[10px] text-center text-muted-foreground">Destinataire : {accountantEmail}</p>
                        ) : (
                            <p className="text-[10px] text-center text-rose-500 font-medium">⚠️ Aucun email configuré pour la compta.</p>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
