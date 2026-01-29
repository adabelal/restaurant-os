'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Calculator, Euro, Clock, ChevronLeft, ChevronRight } from "lucide-react"

interface RHSummaryTableProps {
    employees: any[]
}

export function RHSummaryTable({ employees }: RHSummaryTableProps) {
    const [currentDate, setCurrentDate] = React.useState(new Date())

    const selectedMonth = currentDate.getMonth()
    const selectedYear = currentDate.getFullYear()

    const monthLabel = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

    const changeMonth = (delta: number) => {
        const nextDate = new Date(selectedYear, selectedMonth + delta, 1)
        setCurrentDate(nextDate)
    }

    const calculateStats = (employee: any) => {
        // FILTRER LES SHIFTS PAR PÉRIODE
        const filteredShifts = employee.shifts.filter((shift: any) => {
            const shiftDate = new Date(shift.startTime)
            return shiftDate.getMonth() === selectedMonth && shiftDate.getFullYear() === selectedYear
        })

        const totalHours = filteredShifts.reduce((acc: number, shift: any) => {
            if (!shift.endTime) return acc
            const start = new Date(shift.startTime)
            const end = new Date(shift.endTime)
            const diffMs = end.getTime() - start.getTime()
            const hours = diffMs / (1000 * 60 * 60)
            return acc + (hours - shift.breakMinutes / 60)
        }, 0)

        const baseGross = totalHours * Number(employee.hourlyRate)
        const paidLeaveComplement = baseGross * 0.10 // 10% congés payés
        const totalGross = baseGross + paidLeaveComplement

        return {
            totalHours,
            baseGross,
            paidLeaveComplement,
            totalGross
        }
    }

    const grandTotal = employees.reduce((acc, emp) => {
        const stats = calculateStats(emp)
        return {
            hours: acc.hours + stats.totalHours,
            gross: acc.gross + stats.totalGross
        }
    }, { hours: 0, gross: 0 })

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-blue-600 border-none text-white shadow-lg overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-20"><Calculator className="h-12 w-12" /></div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-100 uppercase tracking-wider">Total Brut à Verser</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{grandTotal.gross.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</div>
                        <p className="text-xs text-blue-100 mt-1">Incluant 10% CP</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-card text-card-foreground">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Heures Effectives</CardTitle>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{grandTotal.hours.toFixed(1)} h</div>
                        <p className="text-xs text-muted-foreground mt-1">Cumul de l'équipe</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-card text-card-foreground">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Taux Moyen</CardTitle>
                        <Euro className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(grandTotal.gross / (grandTotal.hours || 1)).toFixed(2)} € / h</div>
                        <p className="text-xs text-muted-foreground mt-1">Coût horaire moyen</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-xl bg-card">
                <CardHeader className="border-b dark:border-zinc-800">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div>
                                <CardTitle className="text-xl">Récapitulatif de Paie</CardTitle>
                                <CardDescription className="capitalize">{monthLabel}</CardDescription>
                            </div>
                            <div className="flex items-center bg-muted rounded-lg p-1 border">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeMonth(-1)}><ChevronLeft className="h-4 w-4" /></Button>
                                <span className="text-xs font-bold px-3 min-w-[100px] text-center capitalize">{currentDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}</span>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeMonth(1)}><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                        <Badge variant="outline" className="px-4 py-1 text-sm font-bold border-blue-200 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                            PRÉVISIONNEL
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 dark:bg-zinc-900/50 border-b dark:border-zinc-800">
                                    <TableHead className="font-bold py-4 pl-6">Salarié</TableHead>
                                    <TableHead className="font-bold">Contrat</TableHead>
                                    <TableHead className="font-bold text-center">Total Heures</TableHead>
                                    <TableHead className="font-bold text-center">Taux Horaire</TableHead>
                                    <TableHead className="font-bold text-right">Salaire Base</TableHead>
                                    <TableHead className="font-bold text-right text-blue-600 dark:text-blue-400">+ 10% CP</TableHead>
                                    <TableHead className="font-bold text-right pr-6">TOTAL BRUT</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employees.map((emp) => {
                                    const { totalHours, baseGross, paidLeaveComplement, totalGross } = calculateStats(emp)
                                    return (
                                        <TableRow key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors border-b dark:border-zinc-800">
                                            <TableCell className="font-bold py-4 pl-6">
                                                <Link href={`/rh/${emp.id}?tab=hours`} className="flex items-center gap-2 hover:text-blue-600 transition-colors group">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 group-hover:scale-125 transition-transform"></div>
                                                    {emp.name}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <Badge variant="secondary" className="w-fit text-[10px] uppercase font-black">{emp.contractType || 'CDI'}</Badge>
                                                    <span className="text-[10px] text-muted-foreground">{emp.contractDuration === 'PART_TIME' ? 'Temps Partiel' : 'Temps Plein'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-medium">
                                                {totalHours.toFixed(1)} h
                                            </TableCell>
                                            <TableCell className="text-center text-muted-foreground">
                                                {Number(emp.hourlyRate).toFixed(2)}€
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {baseGross.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                                            </TableCell>
                                            <TableCell className="text-right text-blue-600 dark:text-blue-400 font-medium">
                                                {paidLeaveComplement.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                                            </TableCell>
                                            <TableCell className="text-right font-black pr-6">
                                                {totalGross.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
