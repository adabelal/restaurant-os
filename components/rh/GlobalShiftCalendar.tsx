'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, MoreVertical, Plus, UserPlus } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
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

import { toast } from "sonner"
import { moveShift, updateShiftPosition, addManagerShift, autoFillManagerShifts } from "@/app/(authenticated)/rh/actions"

interface GlobalShiftCalendarProps {
    employees: any[]
}

const POSITIONS = [
    { id: 'CUISINE', label: 'Cuisine', color: 'bg-amber-500' },
    { id: 'SALLE', label: 'Salle', color: 'bg-blue-500' },
    { id: 'BAR', label: 'Bar', color: 'bg-purple-500' },
    { id: 'PLONGE', label: 'Plonge', color: 'bg-emerald-500' },
    { id: 'SECURITE', label: 'Sécurité', color: 'bg-slate-500' },
]

function getRoleColor(name: string, position?: string) {
    const pos = position?.toUpperCase()

    // Priorité au poste assigné au shift
    if (pos === 'CUISINE') return 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400'
    if (pos === 'SALLE') return 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400'
    if (pos === 'BAR') return 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400'
    if (pos === 'PLONGE') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
    if (pos === 'SECURITE') return 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400'

    // Repli sur le nom (détection automatique)
    const n = name.toLowerCase()
    if (n.includes('adam') || n.includes('benjamin')) return 'bg-primary/10 text-primary border-primary/20' // Gérants
    if (n.includes('sylvain')) return 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400'
    if (n.includes('laura') || n.includes('laetitia')) return 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400'
    if (n.includes('amelie') || n.includes('noélie') || n.includes('noelie') || n.includes('virginie') || n.includes('lysea')) return 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400'
    if (n.includes('sarah') || n.includes('jules') || n.includes('prudencia') || n.includes('marie') || n.includes('manon')) return 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400'
    if (n.includes('florence') || n.includes('jenifer') || n.includes('jennifer') || n.includes('micheline') || n.includes('julien') || n.includes('xavier')) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'

    return 'bg-muted text-muted-foreground border-border'
}

function formatName(fullName: string) {
    const parts = fullName.trim().split(/\s+/)
    if (parts.length === 1) return parts[0]
    const first = parts[0]
    const last = parts[parts.length - 1]
    const shortenedFirst = first.length > 5 ? first.substring(0, 5) + '.' : first
    return `${shortenedFirst} ${last.charAt(0)}.`
}

export function GlobalShiftCalendar({ employees }: GlobalShiftCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [localShifts, setLocalShifts] = useState<any[]>([])
    const [isDragging, setIsDragging] = useState<string | null>(null)

    // Filtrer les gérants pour l'ajout rapide
    const managers = useMemo(() => employees.filter(e => e.role === 'ADMIN' && (e.name.includes('Adam') || e.name.includes('Benjamin'))), [employees])

    useEffect(() => {
        const allShifts = employees.flatMap(emp =>
            (emp.shifts || []).map((s: any) => ({ ...s, employee: emp }))
        )
        setLocalShifts(allShifts)
    }, [employees])

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
        const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
        return eachDayOfInterval({ start, end })
    }, [currentDate])

    const shiftsByDay = useMemo(() => {
        const map: Record<string, any[]> = {}
        localShifts.forEach(item => {
            const dateKey = format(new Date(item.startTime), 'yyyy-MM-dd')
            if (!map[dateKey]) map[dateKey] = []
            map[dateKey].push(item)
        })

        Object.keys(map).forEach(key => {
            map[key].sort((a, b) =>
                new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            )
        })
        return map
    }, [localShifts])

    const onDragStart = (e: React.DragEvent, shiftId: string) => {
        e.dataTransfer.setData("shiftId", shiftId)
        setIsDragging(shiftId)
        e.dataTransfer.effectAllowed = "move"
    }

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
    }

    const onDrop = async (e: React.DragEvent, targetDate: Date) => {
        e.preventDefault()
        const shiftId = e.dataTransfer.getData("shiftId")
        setIsDragging(null)

        const targetDateStr = format(targetDate, 'yyyy-MM-dd')
        const shiftToMove = localShifts.find(s => s.id === shiftId)

        if (!shiftToMove) return
        if (format(new Date(shiftToMove.startTime), 'yyyy-MM-dd') === targetDateStr) return

        const originalShifts = [...localShifts]

        const newStart = new Date(targetDate)
        const oldStart = new Date(shiftToMove.startTime)
        const oldEnd = new Date(shiftToMove.endTime)
        const duration = oldEnd.getTime() - oldStart.getTime()

        newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0)
        const newEnd = new Date(newStart.getTime() + duration)

        setLocalShifts(prev => prev.map(s =>
            s.id === shiftId
                ? { ...s, startTime: newStart.toISOString(), endTime: newEnd.toISOString() }
                : s
        ))

        toast.info("Déplacement du shift...")

        try {
            const result = await moveShift(shiftId, targetDateStr)
            if (result?.error) {
                toast.error(result.error)
                setLocalShifts(originalShifts)
            } else {
                toast.success("Shift déplacé")
            }
        } catch (err) {
            toast.error("Erreur de connexion")
            setLocalShifts(originalShifts)
        }
    }

    const handleUpdatePosition = async (shiftId: string, newPos: string) => {
        const originalShifts = [...localShifts]

        // Optimistic UI
        setLocalShifts(prev => prev.map(s =>
            s.id === shiftId ? { ...s, position: newPos } : s
        ))

        try {
            const result = await updateShiftPosition(shiftId, newPos)
            if (result?.error) {
                toast.error(result.error)
                setLocalShifts(originalShifts)
            } else {
                toast.success(`Poste mis à jour : ${newPos}`)
            }
        } catch (err) {
            toast.error("Erreur de connexion")
            setLocalShifts(originalShifts)
        }
    }

    const handleQuickManagerShift = async (managerId: string, date: Date, position: string) => {
        toast.info("Ajout du shift gérant...")
        try {
            const dateStr = format(date, 'yyyy-MM-dd')
            const result = await addManagerShift(managerId, dateStr, position)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success("Shift gérant ajouté. Rechargez la page pour voir les gérants.")
                // Note: Revalidation will handle the sync usually, but localShifts doesn't have the new full object 
                // easily since it's created on server. Revalidation in Next.js 15 is good.
            }
        } catch (err) {
            toast.error("Erreur de connexion")
        }
    }

    const handleAutoFill = async () => {
        toast.info("Remplissage automatique en cours...")
        try {
            const result = await autoFillManagerShifts() as any
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success(`Terminé ! ${result.createdCount || 0} shifts créés.`)
                window.location.reload() // On force la recharge pour voir les nouveaux shifts RSC
            }
        } catch (err) {
            toast.error("Erreur de connexion")
        }
    }

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
                            <CardDescription className="capitalize">Vue globale (Gérants inclus)</CardDescription>
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
                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            variant="default"
                            size="sm"
                            onClick={handleAutoFill}
                            className="rounded-full shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 font-bold uppercase text-[10px] tracking-wider px-4"
                        >
                            <UserPlus className="h-3.5 w-3.5 mr-2" />
                            Remplissage Auto
                        </Button>
                        <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase">
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">Cuisine</Badge>
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Salle</Badge>
                            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">Bar</Badge>
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Plonge</Badge>
                            <Badge variant="outline" className="bg-slate-500/10 text-slate-600 border-slate-500/20">Sécurité</Badge>
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Gérants</Badge>
                        </div>
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
                                onDragOver={onDragOver}
                                onDrop={(e) => onDrop(e, day)}
                                className={`
                                    min-h-[120px] p-2 border-r border-b border-border/50 flex flex-col gap-1 transition-colors group/day
                                    ${!isCurrentMonth ? 'bg-muted/10 opacity-60' : 'bg-card hover:bg-muted/30'}
                                    ${idx % 7 === 6 ? 'border-r-0' : ''}
                                `}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex flex-col gap-1">
                                        <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full
                                            ${today ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>
                                            {format(day, 'd')}
                                        </span>

                                        {/* Bouton rapide d'ajout de gérant */}
                                        {isCurrentMonth && managers.length > 0 && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" size="icon" className="h-6 w-6 rounded-md opacity-0 group-hover/day:opacity-100 transition-opacity">
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="w-48">
                                                    <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Ajouter un Gérant</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    {managers.map(m => (
                                                        <DropdownMenu key={m.id}>
                                                            <DropdownMenuTrigger className="w-full">
                                                                <DropdownMenuItem className="text-xs flex items-center gap-2 cursor-pointer w-full">
                                                                    <UserPlus className="h-3 w-3" /> {m.name}
                                                                </DropdownMenuItem>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent side="right">
                                                                {POSITIONS.map(p => (
                                                                    <DropdownMenuItem
                                                                        key={p.id}
                                                                        className="text-xs flex items-center gap-2 cursor-pointer"
                                                                        onClick={() => handleQuickManagerShift(m.id, day, p.id)}
                                                                    >
                                                                        <div className={`h-2 w-2 rounded-full ${p.color}`} />
                                                                        {p.label}
                                                                    </DropdownMenuItem>
                                                                ))}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>

                                    {dayShifts.length > 0 && (
                                        <span className="text-[9px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">
                                            {dayShifts.length}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1 flex-1 overflow-y-auto max-h-[220px] custom-scrollbar pr-1">
                                    {dayShifts.map((s, i) => {
                                        const startStr = format(new Date(s.startTime), 'HH:mm')
                                        const endStr = s.endTime ? format(new Date(s.endTime), 'HH:mm') : '?'
                                        const colorClass = getRoleColor(s.employee.name, s.position)

                                        return (
                                            <div
                                                key={s.id || i}
                                                className={`group relative flex items-center justify-between rounded border transition-all cursor-default ${colorClass} ${isDragging === s.id ? 'opacity-20 grayscale' : ''}`}
                                            >
                                                <div
                                                    draggable
                                                    onDragStart={(e) => onDragStart(e, s.id)}
                                                    className="flex-1 py-1 px-1.5 cursor-move overflow-hidden"
                                                    title={`${s.employee.name} ${s.position ? `(${s.position})` : ''}${!(s.employee.name.toLowerCase().includes('adam') || s.employee.name.toLowerCase().includes('benjamin')) ? ` : ${startStr} - ${endStr}` : ''}`}
                                                >
                                                    <div className="text-[10px] font-bold truncate">{formatName(s.employee.name)}</div>
                                                    {!(s.employee.name.toLowerCase().includes('adam') || s.employee.name.toLowerCase().includes('benjamin')) && (
                                                        <div className="text-[9px] opacity-70 truncate">{startStr}-{endStr}</div>
                                                    )}
                                                </div>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-full px-1 py-0 hover:bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <MoreVertical className="h-3 w-3" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-36">
                                                        <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Assigner Poste</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        {POSITIONS.map(p => (
                                                            <DropdownMenuItem
                                                                key={p.id}
                                                                className="text-xs flex items-center gap-2 cursor-pointer"
                                                                onClick={() => handleUpdatePosition(s.id, p.id)}
                                                            >
                                                                <div className={`h-2 w-2 rounded-full ${p.color}`} />
                                                                {p.label}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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
