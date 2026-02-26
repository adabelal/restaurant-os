"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import jsPDF from "jspdf"
import "jspdf-autotable"

export function ExportShiftsPDF({ employee, shifts, monthLabel, totalHours, totalGross }: any) {
    const exportPDF = () => {
        const doc = new jsPDF() as any

        doc.setFontSize(20)
        doc.text(`Relevé d'Heures - ${employee.name}`, 14, 22)

        doc.setFontSize(12)
        doc.text(`Période : ${monthLabel}`, 14, 32)
        doc.text(`Total Heures : ${totalHours.toFixed(1)}h`, 14, 40)
        doc.text(`Total Brut : ${totalGross.toFixed(2)}€`, 14, 48)

        const tableData = shifts.map((s: any) => {
            const diff = s.endTime ? s.endTime.getTime() - s.startTime.getTime() : 0
            const h = (diff / 1000 / 3600) - (s.breakMinutes / 60)
            return [
                s.startTime.toLocaleDateString('fr-FR'),
                s.startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                s.endTime?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) || '-',
                `${s.breakMinutes}m`,
                `${h.toFixed(1)}h`,
                `${(h * Number(s.hourlyRate)).toFixed(2)}€`
            ]
        })

        doc.autoTable({
            startY: 55,
            head: [['Date', 'Début', 'Fin', 'Pause', 'Total', 'Brut']],
            body: tableData,
        })

        doc.save(`Heures_${employee.name.replace(/\s+/g, '_')}_${monthLabel.replace(/\s+/g, '_')}.pdf`)
    }

    return (
        <Button variant="outline" size="sm" className="gap-2" onClick={exportPDF}>
            <Download className="h-4 w-4" /> Export PDF
        </Button>
    )
}
