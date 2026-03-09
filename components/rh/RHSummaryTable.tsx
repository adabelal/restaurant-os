'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Calculator, Euro, Clock, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { updateEmployeeNet } from "@/app/(authenticated)/rh/actions"
import { toast } from "sonner"
import { getApplicableRate } from "@/lib/rh-utils"
import { Info } from "lucide-react"

const EMPLOYEE_COLORS_MAP = [
    { id: 'rose', bg: 'bg-rose-500/20', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
    { id: 'sky', bg: 'bg-sky-500/20', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500' },
    { id: 'emerald', bg: 'bg-emerald-500/20', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    { id: 'amber', bg: 'bg-amber-500/20', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
    { id: 'indigo', bg: 'bg-indigo-500/20', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
    { id: 'orange', bg: 'bg-orange-500/20', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
    { id: 'teal', bg: 'bg-teal-500/20', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500' },
    { id: 'purple', bg: 'bg-purple-500/20', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
    { id: 'lime', bg: 'bg-lime-500/20', text: 'text-lime-700', border: 'border-lime-200', dot: 'bg-lime-500' },
    { id: 'pink', bg: 'bg-pink-500/20', text: 'text-pink-700', border: 'border-pink-200', dot: 'bg-pink-500' },
    { id: 'cyan', bg: 'bg-cyan-500/20', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500' },
    { id: 'red', bg: 'bg-red-500/20', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
    { id: 'violet', bg: 'bg-violet-500/20', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500' },
    { id: 'yellow', bg: 'bg-yellow-500/20', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500' },
    { id: 'blue', bg: 'bg-blue-500/20', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
    { id: 'fuchsia', bg: 'bg-fuchsia-500/20', text: 'text-fuchsia-700', border: 'border-fuchsia-200', dot: 'bg-fuchsia-500' },
    { id: 'slate', bg: 'bg-slate-500/20', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-500' },
]

function getEmployeeColorData(id: string, name: string = "") {
    if (name.toLowerCase().includes('benjamin')) return EMPLOYEE_COLORS_MAP[7] // Purple
    if (name.toLowerCase().includes('adam')) return EMPLOYEE_COLORS_MAP[4] // Indigo

    let hash = 0
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % EMPLOYEE_COLORS_MAP.length
    return EMPLOYEE_COLORS_MAP[index]
}

function getEmployeeDotColor(id: string, name: string = "") {
    const data = getEmployeeColorData(id, name)
    return data.dot
}

function NetRemunerationInput({ emp, totalNet, selectedMonth, selectedYear }: any) {
    const [saving, setSaving] = React.useState(false)
    const timeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined)
    const [value, setValue] = React.useState(totalNet !== null ? String(totalNet) : "")

    React.useEffect(() => {
        setValue(totalNet !== null ? String(totalNet) : "")
    }, [totalNet])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setValue(val)

        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(async () => {
            const numVal = val === "" ? null : parseFloat(val)
            if (numVal === totalNet) return
            setSaving(true)
            const res = await updateEmployeeNet(emp.id, numVal, selectedMonth + 1, selectedYear)
            setSaving(false)
            if (res.success) toast.success(`${emp.name} mis à jour`)
            else toast.error("Erreur mise à jour")
        }, 800)
    }

    return (
        <div className="relative group flex items-center justify-end">
            <Input
                type="number"
                step="0.01"
                placeholder="0.00 €"
                value={value}
                onChange={handleChange}
                className="h-8 w-24 text-right font-bold bg-emerald-500/5 border-emerald-500/20 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all pr-1"
            />
            {saving && (
                <div className="absolute -left-6">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                </div>
            )}
        </div>
    )
}

interface RHSummaryTableProps {
    employees: any[]
}

export function RHSummaryTable({ employees }: RHSummaryTableProps) {
    const [currentDate, setCurrentDate] = React.useState(new Date())
    const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc')

    const selectedMonth = currentDate.getMonth()
    const selectedYear = currentDate.getFullYear()

    const currentDateLabel = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

    const [savingId, setSavingId] = React.useState<string | null>(null)

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

        const applicableRate = getApplicableRate(employee.address, Number(employee.hourlyRate), selectedMonth, selectedYear)
        const baseGross = totalHours * applicableRate
        const paidLeaveComplement = baseGross * 0.10 // 10% congés payés
        const totalGross = baseGross + paidLeaveComplement

        // Récupérer la rémunération nette pour le mois/année sélectionné
        const monthlySalary = employee.monthlySalaries?.find((s: any) =>
            s.month === selectedMonth + 1 && s.year === selectedYear
        )
        const totalNet = monthlySalary?.netRemuneration ? Number(monthlySalary.netRemuneration) : null

        // Vérifier si un contrat est actif pour le mois sélectionné
        const hasActiveContract = employee.documents?.some((doc: any) => {
            if (doc.type !== 'CONTRACT') return false
            if (!doc.year) return true

            // Si le contrat a une date, il doit être dans le futur ou en cours
            const docDate = new Date(doc.year, (doc.month || 1) - 1, 1)
            const viewDate = new Date(selectedYear, selectedMonth, 1)

            // On considère actif si l'année du contrat <= année affichée
            // (Logique simplifiée : un contrat CDI de 2024 est toujours actif en 2026)
            if (doc.year < selectedYear) return true
            if (doc.year === selectedYear && (doc.month || 1) <= selectedMonth + 1) return true
            return false
        }) || false

        return {
            totalHours,
            baseGross,
            paidLeaveComplement,
            totalGross,
            totalNet,
            hasActiveContract,
            applicableRate
        }
    }

    const sortedEmployees = [...employees].sort((a, b) => {
        const getLastName = (name: string) => {
            const parts = name.trim().split(/\s+/)
            return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : parts[0].toLowerCase()
        }
        const nameA = getLastName(a.name)
        const nameB = getLastName(b.name)
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    })

    const grandTotal = sortedEmployees
        .filter(emp => emp.role !== 'ADMIN') // Les gérants ne comptent pas dans la paie effective
        .reduce((acc, emp) => {
            const stats = calculateStats(emp)
            return {
                hours: acc.hours + stats.totalHours,
                gross: acc.gross + stats.totalGross,
                net: stats.totalNet !== null ? acc.net + stats.totalNet : acc.net
            }
        }, { hours: 0, gross: 0, net: 0 })

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Stats Cards - Responsive Grid */}
            <div className="grid gap-4 grid-cols-1 xs:grid-cols-2 md:grid-cols-4">
                <Card className="bg-primary border-none text-primary-foreground shadow-lg overflow-hidden relative">
                    <div className="absolute -top-2 -right-2 p-4 opacity-10"><Calculator className="h-16 w-16" /></div>
                    <CardHeader className="pb-1 px-4 pt-4">
                        <CardTitle className="text-[10px] font-black text-primary-foreground/70 uppercase tracking-widest">Total Brut + CP</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-2xl font-black truncate">{grandTotal.gross.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} €</div>
                        <div className="h-1 w-8 bg-white/20 rounded-full mt-2"></div>
                    </CardContent>
                </Card>

                <Card className="bg-emerald-600 border-none text-white shadow-lg overflow-hidden relative">
                    <div className="absolute -top-2 -right-2 p-4 opacity-10"><Euro className="h-16 w-16" /></div>
                    <CardHeader className="pb-1 px-4 pt-4">
                        <CardTitle className="text-[10px] font-black text-emerald-100/70 uppercase tracking-widest">Net Estimé</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-2xl font-black truncate">{grandTotal.net.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} €</div>
                        <div className="h-1 w-8 bg-white/20 rounded-full mt-2"></div>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-sm bg-card text-card-foreground overflow-hidden">
                    <CardHeader className="pb-1 px-4 pt-4">
                        <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-blue-500" /> Heures Équipe
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-2xl font-black">{grandTotal.hours.toFixed(0)}h</div>
                        <div className="text-[9px] font-bold text-muted-foreground mt-1 uppercase">Effectives</div>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-sm bg-card text-card-foreground overflow-hidden">
                    <CardHeader className="pb-1 px-4 pt-4">
                        <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <Euro className="h-3 w-3 text-emerald-500" /> Taux Moyen
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-2xl font-black">{(grandTotal.gross / (grandTotal.hours || 1)).toFixed(2)}€</div>
                        <div className="text-[9px] font-bold text-muted-foreground mt-1 uppercase">Brut / h</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-border shadow-xl bg-card rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-border bg-muted/20 px-4 sm:px-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-black uppercase tracking-tight">Récapitulatif de Paie</CardTitle>
                                <CardDescription className="text-xs font-bold uppercase text-primary/70">{currentDateLabel}</CardDescription>
                            </div>
                            <div className="flex items-center bg-background rounded-xl p-1 border border-border/50 shadow-inner">
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => changeMonth(-1)}><ChevronLeft className="h-4 w-4" /></Button>
                                <span className="text-[10px] font-black px-2 min-w-[70px] text-center uppercase">{currentDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}</span>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => changeMonth(1)}><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Desktop Table View */}
                    <div className="hidden lg:block overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30 border-b border-border">
                                    <TableHead
                                        className="font-black py-4 pl-6 text-[10px] uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-primary transition-colors select-none"
                                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                    >
                                        Salarié {sortOrder === 'asc' ? '↑' : '↓'}
                                    </TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Contrat</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-center text-muted-foreground">Appoint</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-center text-muted-foreground">Taux</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-right text-muted-foreground">Base</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-right text-blue-500">+10% CP</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-right text-foreground">BRUT</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-right pr-6 text-emerald-600">REM NET</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedEmployees.map((emp) => {
                                    const { totalHours, baseGross, paidLeaveComplement, totalGross, totalNet, hasActiveContract, applicableRate } = calculateStats(emp)
                                    const isManager = emp.role === 'ADMIN'
                                    const isGrayedOut = !isManager && !hasActiveContract
                                    const isHistorical = applicableRate !== Number(emp.hourlyRate)

                                    return (
                                        <TableRow
                                            key={emp.id}
                                            className={`hover:bg-primary/[0.02] transition-colors border-b border-border/50 ${isManager ? 'bg-muted/10 opacity-70' : ''} ${isGrayedOut ? 'grayscale opacity-30 bg-muted/20' : ''}`}
                                        >
                                            <TableCell className="font-bold py-4 pl-6">
                                                <div className="flex items-center gap-2">
                                                    <Link href={`/rh/${emp.id}?tab=hours&month=${selectedMonth + 1}&year=${selectedYear}`} className="flex items-center gap-2 text-foreground hover:text-blue-500 transition-colors group">
                                                        <div className={`w-2 h-2 rounded-full ${isManager ? 'bg-slate-400' : getEmployeeDotColor(emp.id, emp.name)} group-hover:scale-125 transition-transform`}></div>
                                                        {(() => {
                                                            const parts = emp.name.trim().split(/\s+/)
                                                            const last = parts.length > 1 ? parts[parts.length - 1] : ""
                                                            const first = parts.length > 1 ? parts.slice(0, -1).join(' ') : emp.name
                                                            return (
                                                                <span className="whitespace-nowrap">
                                                                    <span className="uppercase font-black text-xs mr-1">{last}</span>
                                                                    <span className="font-semibold text-xs text-muted-foreground">{first}</span>
                                                                </span>
                                                            )
                                                        })()}
                                                    </Link>
                                                    {isManager && <Badge variant="outline" className="text-[8px] h-3.5 px-1 py-0 uppercase tracking-tighter opacity-60">Gérant</Badge>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase tracking-tighter text-foreground/80">{isManager ? 'BÉNÉVOLE' : (emp.contractType || 'CDI')}</span>
                                                    <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">{isManager ? 'Gérance' : (emp.contractDuration === 'PART_TIME' ? 'P-TIME' : 'FULL')}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-black text-xs">
                                                {totalHours.toFixed(1)}h
                                            </TableCell>
                                            <TableCell className="text-center text-[10px] font-bold text-muted-foreground uppercase">
                                                {isManager ? '-' : (
                                                    <div className="flex flex-col items-center justify-center gap-0.5">
                                                        <span className={isHistorical ? "text-amber-600 font-black" : ""}>
                                                            {applicableRate.toFixed(2)}€
                                                        </span>
                                                        {isHistorical && (
                                                            <span className="text-[8px] bg-amber-100 text-amber-700 px-1 rounded flex items-center gap-0.5 font-black">
                                                                <Info className="h-2 w-2" /> AJUSTÉ
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-xs">
                                                {isManager ? '-' : `${baseGross.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€`}
                                            </TableCell>
                                            <TableCell className="text-right text-blue-500/80 font-bold text-xs">
                                                {isManager ? '-' : `${paidLeaveComplement.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€`}
                                            </TableCell>
                                            <TableCell className="text-right font-black text-xs text-foreground">
                                                {isManager ? '-' : `${totalGross.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€`}
                                            </TableCell>
                                            <TableCell className="text-right font-black pr-6 text-emerald-600 min-w-[130px]">
                                                {isManager ? (
                                                    <div className="flex justify-end pr-4 text-muted-foreground opacity-30">-</div>
                                                ) : (
                                                    <NetRemunerationInput
                                                        emp={emp}
                                                        totalNet={totalNet}
                                                        selectedMonth={selectedMonth}
                                                        selectedYear={selectedYear}
                                                    />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile List View */}
                    <div className="lg:hidden divide-y divide-border/50">
                        {sortedEmployees.map((emp) => {
                            const { totalHours, totalGross, totalNet, hasActiveContract } = calculateStats(emp)
                            const isManager = emp.role === 'ADMIN'
                            const isGrayedOut = !isManager && !hasActiveContract

                            return (
                                <div key={emp.id} className={`p-4 space-y-3 ${isManager ? 'bg-muted/5 opacity-80' : ''} ${isGrayedOut ? 'grayscale opacity-30 bg-muted/20' : ''}`}>
                                    <div className="flex items-center justify-between">
                                        <Link href={`/rh/${emp.id}?tab=hours&month=${selectedMonth + 1}&year=${selectedYear}`} className="flex items-center gap-2">
                                            <div className={`w-2.5 h-2.5 rounded-full ${isManager ? 'bg-slate-400' : getEmployeeDotColor(emp.id, emp.name)}`}></div>
                                            {(() => {
                                                const parts = emp.name.trim().split(/\s+/)
                                                const last = parts.length > 1 ? parts[parts.length - 1] : ""
                                                const first = parts.length > 1 ? parts.slice(0, -1).join(' ') : emp.name
                                                return (
                                                    <span className="flex items-center gap-1">
                                                        <span className="uppercase font-black text-sm">{last}</span>
                                                        <span className="font-bold text-xs text-muted-foreground">{first}</span>
                                                    </span>
                                                )
                                            })()}
                                            {isManager && <Badge variant="outline" className="text-[8px] h-3.5 px-1 py-0 uppercase tracking-tighter">Gérant</Badge>}
                                        </Link>
                                        <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest h-5 px-2 bg-muted/50 border-border/50">
                                            {isManager ? 'BÉNÉVOLE' : (emp.contractType || 'CDI')}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/30">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Heures</span>
                                            <span className="text-sm font-black text-foreground">{totalHours.toFixed(1)}h</span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Rem Brut</span>
                                            <span className="text-sm font-black text-foreground">{isManager ? '-' : `${totalGross.toFixed(0)}€`}</span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">+10% CP</span>
                                            <span className="text-sm font-black text-blue-600">{isManager ? '-' : `${(totalGross * 0.1).toFixed(0)}€`}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                        <div className="flex items-center gap-1.5 p-1 px-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Rem Net à verser</span>
                                        </div>
                                        <div className="w-28">
                                            {isManager ? (
                                                <div className="text-right text-muted-foreground opacity-30 text-xs">-</div>
                                            ) : (
                                                <NetRemunerationInput
                                                    emp={emp}
                                                    totalNet={totalNet}
                                                    selectedMonth={selectedMonth}
                                                    selectedYear={selectedYear}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
