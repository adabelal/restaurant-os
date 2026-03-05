'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isToday,
    startOfWeek,
    endOfWeek
} from 'date-fns'
import { fr } from 'date-fns/locale'

interface GlobalShiftCalendarProps {
    employees: any[]
}

// Fonction utilitaire pour attribuer une couleur selon le "supposé" poste du salarié
// (basé sur l'historique de tes salariés)
function getRoleColor(name: string) {
    const n = name.toLowerCase()
    if (n.includes('laura') || n.includes('laetitia')) return 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400' // Cuisine
    if (n.includes('amelie') || n.includes('noélie') || n.includes('noelie') || n.includes('virginie')) return 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400' // Salle
    if (n.includes('sarah') || n.includes('jules') || n.includes('prudencia')) return 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400' // Bar
    if (n.includes('florence') || n.includes('jenifer') || n.includes('jennifer') || n.includes('micheline')) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400' // Plonge
    return 'bg-muted text-muted-foreground border-border' // Défaut
}

// Abréviation du prénom + Initiale Nom (ex: "Laur. S")
function formatName(fullName: string) {
    const parts = fullName.trim().split(/\s+/)
    if (parts.length === 1) return parts[0]
    const first = parts[0]
    const last = parts[parts.length - 1]
    const shortenedFirst = first.length > 4 ? first.substring(0, 4) + '.' : first
    return `${shortenedFirst} ${last.charAt(0)}.`
}

export function GlobalShiftCalendar({ employees }: GlobalShiftCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date())

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

    // Construire la grille du mois (incluant les jours des mois adjacents pour compléter les semaines)
    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }) // Commence Lundi
        const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
        return eachDayOfInterval({ start, end })
    }, [currentDate])

    // Mapper tous les shifts de tous les employés actifs
    // Structure: Record<FormatDate (yyyy-MM-dd), Array<{employee, shift}>>
    const shiftsByDay = useMemo(() => {
        const map: Record<string, any[]> = {}
        employees.forEach(emp => {
            emp.shifts?.forEach((shift: any) => {
                const d = new Date(shift.startTime)
                const dateKey = format(d, 'yyyy-MM-dd')
                if (!map[dateKey]) map[dateKey] = []
                map[dateKey].push({
                    employee: emp,
                    shift: shift
                })
            })
        })

        // Trier les shifts de chaque jour (par heure de début puis par poste supposé)
        Object.keys(map).forEach(key => {
            map[key].sort((a, b) => {
                const timeA = new Date(a.shift.startTime).getTime()
                const timeB = new Date(b.shift.startTime).getTime()
                return timeA - timeB
            })
        })

        return map
    }, [employees])

    const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

    return (
        <Card className="border-border shadow-xl bg-card overflow-hidden">
            <CardHeader className="border-b border-border bg-muted/20">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5 text-primary" />
                                Planning des Équipes
                            </CardTitle>
                            <CardDescription className="capitalize">Vue globale</CardDescription>
                        </div>
                        <div className="flex justify-center items-center bg-muted rounded-lg p-1 border">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background" onClick={prevMonth}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-bold px-4 min-w-[140px] text-center capitalize">
                                {format(currentDate, 'MMMM yyyy', { locale: fr })}
                            </span>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background" onClick={nextMonth}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    {/* Légende */}
                    <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase">
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">Cuisine</Badge>
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Salle</Badge>
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">Bar</Badge>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Plonge</Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="grid grid-cols-7 border-b border-border bg-muted/30">
                    {weekDays.map(day => (
                        <div key={day} className="py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 auto-rows-[minmax(120px,auto)]">
                    {days.map((day, idx) => {
                        const dateKey = format(day, 'yyyy-MM-dd')
                        const isCurrentMonth = isSameMonth(day, currentDate)
                        const today = isToday(day)
                        const dayShifts = shiftsByDay[dateKey] || []

                        return (
                            <div
                                key={day.toISOString()}
                                className={`
                                    min-h-[120px] p-2 border-r border-b border-border/50 flex flex-col gap-1 transition-colors
                                    ${!isCurrentMonth ? 'bg-muted/10 opacity-60' : 'bg-card hover:bg-muted/30'}
                                    ${idx % 7 === 6 ? 'border-r-0' : ''}
                                `}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full
                                        ${today ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>
                                        {format(day, 'd')}
                                    </span>
                                    {dayShifts.length > 0 && (
                                        <span className="text-[9px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">
                                            {dayShifts.length}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1 flex-1 overflow-y-auto max-h-[180px] custom-scrollbar pr-1">
                                    {dayShifts.map((s, i) => {
                                        const startStr = format(new Date(s.shift.startTime), 'HH:mm')
                                        const endStr = s.shift.endTime ? format(new Date(s.shift.endTime), 'HH:mm') : '?'
                                        const colorClass = getRoleColor(s.employee.name)

                                        return (
                                            <div
                                                key={s.shift.id || i}
                                                className={`text-[10px] px-1.5 py-1 rounded truncate border ${colorClass}`}
                                                title={`${s.employee.name} : ${startStr} - ${endStr}`}
                                            >
                                                <span className="font-bold">{formatName(s.employee.name)}</span>
                                                <span className="opacity-70 ml-1 block xs:inline">{startStr}-{endStr}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
