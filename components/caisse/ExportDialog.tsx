'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
    const [emailDestinataire, setEmailDestinataire] = useState(accountantEmail || '')
    const [emailBody, setEmailBody] = useState(`Bonjour,\n\nVeuillez trouver ci-joint l'export de la caisse.\n\nCordialement,`)

    useEffect(() => {
        if (accountantEmail) {
            setEmailDestinataire(accountantEmail)
        }
    }, [accountantEmail])

    const getFilteredData = () => {
        const start = new Date(startDate)
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)

        return transactions.filter(t => {
            const d = new Date(t.date)
            return d >= start && d <= end
        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }

    const generateExcelBuffer = async (data: any[]) => {
        const ExcelJS = (await import('exceljs')).default;
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Siwa-OS';
        workbook.created = new Date();
        
        const worksheet = workbook.addWorksheet('Transactions', {
            views: [{ state: 'frozen', ySplit: 1 }]
        });

        worksheet.columns = [
            { header: 'Date', key: 'date', width: 14 },
            { header: 'Type', key: 'type', width: 12 },
            { header: 'Description', key: 'description', width: 45 },
            { header: 'Catégorie', key: 'category', width: 25 },
            { header: 'Montant', key: 'amount', width: 15, style: { numFmt: '#,##0.00 €' } }
        ];

        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
        worksheet.getRow(1).alignment = { horizontal: 'center' };

        data.forEach((t, index) => {
            const dateStr = format(new Date(t.date), 'dd/MM/yyyy');
            
            const isEntree = t.type === 'IN';
            const amountVal = isEntree ? Number(t.amount) : -Number(t.amount);

            const row = worksheet.addRow({
                date: dateStr,
                type: isEntree ? 'Entrée' : 'Sortie',
                description: t.description,
                category: t.category?.name || 'Sans catégorie',
                amount: amountVal
            });

            if (index % 2 === 0) {
                row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
            }

            const amountCell = row.getCell('amount');
            amountCell.font = { color: { argb: isEntree ? 'FF16A34A' : 'FFDC2626' } };
        });

        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;
    }

    const exportToExcel = async (data: any[]) => {
        const buffer = await generateExcelBuffer(data)
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const fileName = `Export_Caisse_${startDate}_au_${endDate}.xlsx`
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = fileName
        link.click()
    }

    const exportToCSV = (data: any[]) => {
        const worksheetData = data.map((t) => {
            const dateStr = format(new Date(t.date), 'dd/MM/yyyy');
            return {
                'Date': dateStr,
                'Type': t.type === 'IN' ? 'Entrée' : 'Sortie',
                'Description': t.description,
                'Catégorie': t.category?.name || 'Sans catégorie',
                'Montant': t.type === 'IN' ? Number(t.amount).toFixed(2) : `-${Number(t.amount).toFixed(2)}`
            }
        })
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

        const tableBody = data.map((t) => {
            const dateStr = format(new Date(t.date), 'dd/MM/yyyy');

            return [
                dateStr,
                t.type === 'IN' ? 'Entrée' : 'Sortie',
                t.description,
                t.category?.name || '-',
                t.type === 'IN' ? `${Number(t.amount).toFixed(2)} €` : `-${Number(t.amount).toFixed(2)} €`
            ]
        })

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

    const handleExport = async () => {
        const data = getFilteredData()
        if (data.length === 0) {
            toast.error("Aucune transaction sur cette période.")
            return
        }

        if (formatType === 'xlsx') await exportToExcel(data)
        else if (formatType === 'csv') exportToCSV(data)
        else if (formatType === 'pdf') exportToPDF(data)

        toast.success("Export terminé.")
    }

    const handleEmail = async () => {
        if (!emailDestinataire) {
            toast.error("Veuillez saisir un email destinataire.")
            return
        }

        const data = getFilteredData()
        if (data.length === 0) {
            toast.error("Aucune transaction sur cette période.")
            return
        }

        setIsExporting(true)
        try {
            const excelBuffer = await generateExcelBuffer(data);
            const binaryString = Array.prototype.map.call(new Uint8Array(excelBuffer as ArrayBuffer), function (ch) {
                return String.fromCharCode(ch);
            }).join('');
            const base64Content = btoa(binaryString);
            const fileName = `Export_Caisse_${startDate}_au_${endDate}.xlsx`;
            const subject = `Export Caisse du ${format(new Date(startDate), 'dd/MM/yyyy')} au ${format(new Date(endDate), 'dd/MM/yyyy')}`;

            const res = await sendExportEmail(emailDestinataire, subject, fileName, base64Content, emailBody)

            if (res.error) {
                toast.error(res.error || "Erreur lors de l'envoi de l'export.")
            } else {
                toast.success(`Export envoyé à ${emailDestinataire}.`)
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
                        <div className="space-y-1.5 pt-1">
                            <Label className="text-xs text-muted-foreground hidden">Email destinataire</Label>
                            <Input 
                                type="email" 
                                value={emailDestinataire} 
                                onChange={(e) => setEmailDestinataire(e.target.value)}
                                placeholder="Email de la comptabilité"
                                className="h-9 text-xs"
                            />
                        </div>
                        <div className="space-y-1.5 pt-1">
                            <Label className="text-xs text-muted-foreground hidden">Corps du mail</Label>
                            <Textarea 
                                value={emailBody}
                                onChange={(e) => setEmailBody(e.target.value)}
                                placeholder="Votre message..."
                                className="min-h-[80px] text-xs resize-none"
                            />
                        </div>
                        <Button
                            variant="secondary"
                            onClick={handleEmail}
                            disabled={isExporting || !emailDestinataire}
                            className="w-full gap-2 border-primary/20 hover:bg-primary/5 text-primary font-bold"
                        >
                            {isExporting ? <span className="animate-spin">🌀</span> : <Send className="h-4 w-4" />}
                            Envoyer à la comptabilité
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
