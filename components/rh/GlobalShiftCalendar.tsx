'use client'

import React, { useState, useMemo, useEffect, FormEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, MoreVertical, Plus, UserPlus, Clock, ChefHat, UtensilsCrossed, Wine, Droplets, ShieldCheck } from "lucide-react"
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
import { moveShift, updateShiftPosition, autoFillManagerShifts, addShift } from "@/app/(authenticated)/rh/actions"

interface GlobalShiftCalendarProps {
    employees: any[]
}

export const POSITIONS = [
    { id: 'CUISINE', label: 'Cuisine', icon: ChefHat },
    { id: 'SALLE', label: 'Salle', icon: UtensilsCrossed },
    { id: 'BAR', label: 'Bar', icon: Wine },
    { id: 'PLONGE', label: 'Plonge', icon: Droplets },
    { id: 'SECURITE', label: 'Sécurité', icon: ShieldCheck },
]

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
    // Couleurs fixes pour les gérants pour éviter tout doublon avec les autres
    if (name.toLowerCase().includes('benjamin')) return EMPLOYEE_COLORS_MAP[7] // Purple
    if (name.toLowerCase().includes('adam')) return EMPLOYEE_COLORS_MAP[4] // Indigo

    let hash = 0
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % EMPLOYEE_COLORS_MAP.length
    return EMPLOYEE_COLORS_MAP[index]
}

function getEmployeeColorClass(id: string, name: string = "") {
    const data = getEmployeeColorData(id, name)
    return `${data.bg} ${data.text} ${data.border}`
}

function getEmployeeDotColor(id: string, name: string = "") {
    const data = getEmployeeColorData(id, name)
    return data.dot
}

function formatName(fullName: string) {
    const parts = fullName.trim().split(/\s+/)
    if (parts.length === 1) return parts[0]
    const first = parts[0]
    const last = parts[parts.length - 1]
    const shortenedFirst = first.length > 5 ? first.substring(0, 5) + '.' : first
    return `${shortenedFirst} ${last.charAt(0)}.`
}

function ShiftItem({ s, isDragging, onDragStart, onEdit, onUpdatePosition }: any) {
    const startStr = format(new Date(s.startTime), 'HH:mm')
    const endStr = s.endTime ? format(new Date(s.endTime), 'HH:mm') : '?'
    const colorClass = getEmployeeColorClass(s.employee.id, s.employee.name)

    return (
        <div
            onClick={(e) => {
                e.stopPropagation()
                onEdit()
            }}
            className={`group relative flex items-center justify-between rounded-lg border transition-all cursor-pointer ${colorClass} ${isDragging ? 'opacity-20 grayscale' : ''} hover:brightness-95 shadow-sm`}
        >
            <div
                draggable
                onDragStart={(e) => {
                    e.stopPropagation()
                    onDragStart(e, s.id)
                }}
                className="flex-1 py-1 px-1.5 cursor-move overflow-hidden flex items-center gap-1.5"
                title={`${s.employee.name}${!(s.employee.name.toLowerCase().includes('adam') || s.employee.name.toLowerCase().includes('benjamin')) ? ` : ${startStr} - ${endStr}` : ''}`}
            >
                <div className={`shrink-0 w-2 h-2 rounded-full ${getEmployeeDotColor(s.employee.id, s.employee.name)}`} />
                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-x-1.5">
                    <div className="text-[10px] font-black truncate leading-tight flex-1">{formatName(s.employee.name)}</div>
                    <div className="flex items-center gap-1">
                        {s.position && (() => {
                            const pos = POSITIONS.find(p => p.id === s.position)
                            if (pos) {
                                const Icon = pos.icon
                                return <span title={pos.label}><Icon className="h-3 w-3 shrink-0 opacity-70" /></span>
                            }
                            return null
                        })()}
                        {!(s.employee.name.toLowerCase().includes('adam') || s.employee.name.toLowerCase().includes('benjamin')) && (
                            <div className="text-[8.5px] font-black opacity-80 shrink-0 leading-tight hidden sm:block font-mono">{startStr}-{endStr}</div>
                        )}
                    </div>
                    {!(s.employee.name.toLowerCase().includes('adam') || s.employee.name.toLowerCase().includes('benjamin')) && (
                        <div className="text-[8.5px] font-black opacity-80 shrink-0 leading-tight sm:hidden font-mono mt-0.5">{startStr}-{endStr}</div>
                    )}
                </div>
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-full px-1 py-0 hover:bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36 rounded-xl border-border shadow-xl">
                    <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/70">Assigner Poste</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {POSITIONS.map(p => {
                        const Icon = p.icon
                        return (
                            <DropdownMenuItem
                                key={p.id}
                                className="text-xs font-bold flex items-center gap-2 cursor-pointer focus:bg-primary/10 focus:text-primary rounded-lg mx-1"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onUpdatePosition(s.id, p.id)
                                }}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {p.label}
                            </DropdownMenuItem>
                        )
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

export function GlobalShiftCalendar({ employees }: GlobalShiftCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [localShifts, setLocalShifts] = useState<any[]>([])
    const [isDragging, setIsDragging] = useState<string | null>(null)

    // Ajout d'un shift
    const [selectedDateForShift, setSelectedDateForShift] = useState<Date | null>(null)
    const [isAddingShift, setIsAddingShift] = useState(false)
    // Navigation et Affichage
    const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
    const [selectedUserIdForAdd, setSelectedUserIdForAdd] = useState<string>("")
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set())
    const [isCompactWeek, setIsCompactWeek] = useState(false)

    // Édition d'un shift existant
    const [editingShift, setEditingShift] = useState<any | null>(null)
    const [isEditingShift, setIsEditingShift] = useState(false)

    useEffect(() => {
        const allShifts = employees.flatMap(emp =>
            (emp.shifts || []).map((s: any) => ({ ...s, employee: emp }))
        )
        setLocalShifts(allShifts)
    }, [employees])

    const nextPeriod = () => {
        if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1))
        else {
            const nextWeek = new Date(currentDate)
            nextWeek.setDate(nextWeek.getDate() + 7)
            setCurrentDate(nextWeek)
        }
    }
    const prevPeriod = () => {
        if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1))
        else {
            const lastWeek = new Date(currentDate)
            lastWeek.setDate(lastWeek.getDate() - 7)
            setCurrentDate(lastWeek)
        }
    }

    const days = useMemo(() => {
        if (viewMode === 'month') {
            const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
            const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
            return eachDayOfInterval({ start, end })
        } else {
            const start = startOfWeek(currentDate, { weekStartsOn: 1 })
            const end = endOfWeek(currentDate, { weekStartsOn: 1 })
            return eachDayOfInterval({ start, end })
        }
    }, [currentDate, viewMode])

    const shiftsByDay = useMemo(() => {
        const map: Record<string, any[]> = {}
        const filteredShifts = selectedEmployeeIds.size === 0
            ? localShifts
            : localShifts.filter(s => selectedEmployeeIds.has(s.userId))

        filteredShifts.forEach(item => {
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
    }, [localShifts, selectedEmployeeIds])

    const employeeHours = useMemo(() => {
        const result = employees.map(emp => {
            const empShifts = localShifts.filter(s =>
                s.userId === emp.id &&
                isSameMonth(new Date(s.startTime), currentDate)
            )
            const totalHours = empShifts.reduce((acc, s) => {
                if (!s.endTime) return acc
                const diff = new Date(s.endTime).getTime() - new Date(s.startTime).getTime()
                return acc + Math.max(0, (diff / 1000 / 3600) - ((s.breakMinutes || 0) / 60))
            }, 0)
            return {
                ...emp,
                totalHours
            }
        }).filter(emp => emp.totalHours > 0 || emp.name.toLowerCase().includes('adam') || emp.name.toLowerCase().includes('benjamin'))

        result.sort((a, b) => b.totalHours - a.totalHours)
        return result
    }, [localShifts, currentDate, employees])

    console.log("localshifts", localShifts)

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

    const handleAddShiftSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!selectedDateForShift) return

        const formData = new FormData(e.currentTarget)
        const userId = formData.get("userId") as string
        const startTimeStr = formData.get("startTime") as string
        const endTimeStr = formData.get("endTime") as string
        const breakMinutes = parseInt(formData.get("breakMinutes") as string) || 0

        setIsAddingShift(true)

        try {
            const dateStr = format(selectedDateForShift, 'yyyy-MM-dd')
            formData.set("date", dateStr)

            let start = new Date(`${dateStr}T${startTimeStr}:00`)
            let end = new Date(`${dateStr}T${endTimeStr}:00`)
            if (end <= start) end.setDate(end.getDate() + 1)

            formData.set("isoStart", start.toISOString())
            formData.set("isoEnd", end.toISOString())

            const result = await addShift(formData) as any
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success("Shift ajouté avec succès")

                // Optimistic UI update
                const employee = employees.find(emp => emp.id === userId)

                const newShift = {
                    id: Math.random().toString(), // fake ID until refresh
                    userId,
                    startTime: start.toISOString(),
                    endTime: end.toISOString(),
                    breakMinutes,
                    position: null,
                    employee
                }

                setLocalShifts(prev => [...prev, newShift])
                setSelectedDateForShift(null)
            }
        } catch (err) {
            toast.error("Erreur lors de l'ajout")
        } finally {
            setIsAddingShift(false)
        }
    }

    const handleEditShiftSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!editingShift) return

        const formData = new FormData(e.currentTarget)
        const startTimeStr = formData.get("startTime") as string
        const endTimeStr = formData.get("endTime") as string
        const breakMinutes = parseInt(formData.get("breakMinutes") as string) || 0

        setIsEditingShift(true)

        try {
            const dateStr = format(new Date(editingShift.startTime), 'yyyy-MM-dd')
            formData.set("shiftId", editingShift.id)
            formData.set("userId", editingShift.userId)
            formData.set("date", dateStr)

            let start = new Date(`${dateStr}T${startTimeStr}:00`)
            let end = new Date(`${dateStr}T${endTimeStr}:00`)
            if (end <= start) end.setDate(end.getDate() + 1)

            formData.set("isoStart", start.toISOString())
            formData.set("isoEnd", end.toISOString())

            // L'action server updateShift est utilisée, nous supposons qu'elle est bien exportée depuis actions.ts
            toast.info("Modification du shift...")
            const { updateShift } = await import("@/app/(authenticated)/rh/actions")
            const result = await updateShift(formData) as any

            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success("Shift modifié avec succès")

                // Optimistic UI update

                setLocalShifts(prev => prev.map(s =>
                    s.id === editingShift.id
                        ? { ...s, startTime: start.toISOString(), endTime: end.toISOString(), breakMinutes }
                        : s
                ))
                setEditingShift(null)
            }
        } catch (err) {
            toast.error("Erreur lors de la modification")
        } finally {
            setIsEditingShift(false)
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
                window.location.reload()
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
                                Planning {viewMode === 'month' ? 'Mensuel' : 'Hebdo'}
                            </CardTitle>
                            <CardDescription className="hidden sm:block">Vue globale (Gérants inclus)</CardDescription>
                        </div>
                        <div className="flex items-center justify-between sm:justify-center bg-muted rounded-lg p-1 border">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background" onClick={prevPeriod}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-xs sm:text-sm font-bold px-2 sm:px-4 min-w-[120px] sm:min-w-[140px] text-center capitalize">
                                {viewMode === 'month'
                                    ? format(currentDate, 'MMMM yyyy', { locale: fr })
                                    : `Sem. ${format(currentDate, 'w')} - ${format(currentDate, 'MMM', { locale: fr })}`
                                }
                            </span>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background" onClick={nextPeriod}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                        <div className="flex bg-muted rounded-full p-1 border shadow-inner">
                            <Button
                                variant={viewMode === 'month' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="rounded-full h-7 sm:h-8 px-3 sm:px-4 text-[10px] sm:text-xs font-bold"
                                onClick={() => setViewMode('month')}
                            >
                                Mois
                            </Button>
                            <Button
                                variant={viewMode === 'week' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="rounded-full h-7 sm:h-8 px-3 sm:px-4 text-[10px] sm:text-xs font-bold"
                                onClick={() => setViewMode('week')}
                            >
                                Semaine
                            </Button>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsCompactWeek(!isCompactWeek)}
                            className="h-7 sm:h-8 gap-1.5 border-primary/20 hover:border-primary/40 text-[10px] sm:text-xs"
                        >
                            <ChevronRight className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform ${isCompactWeek ? 'rotate-180' : ''}`} />
                            <span className="hidden lg:inline">{isCompactWeek ? "Semaine complète" : "Focus WE"}</span>
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            onClick={handleAutoFill}
                            className="h-7 sm:h-8 rounded-full shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 font-bold uppercase text-[9px] sm:text-[10px] tracking-wider px-3 sm:px-4 shrink-0"
                        >
                            <span className="hidden sm:inline">Remplissage Gérants</span>
                            <UserPlus className="h-3.5 w-3.5 sm:hidden" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0 flex flex-col xl:flex-row">
                {/* Sidebar des Heures */}
                <div className="w-full xl:w-64 shrink-0 border-b xl:border-b-0 xl:border-r border-border bg-muted/10 p-4">
                    <div className="flex items-center justify-between gap-2 mb-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <h3 className="font-bold text-xs uppercase tracking-wider">Heures du mois</h3>
                        </div>
                        {selectedEmployeeIds.size > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedEmployeeIds(new Set())}
                                className="h-6 text-[10px] px-2 text-primary"
                            >
                                Tout voir
                            </Button>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 max-h-[300px] xl:max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                        {employeeHours.map(emp => {
                            const isGerant = emp.name.toLowerCase().includes('adam') || emp.name.toLowerCase().includes('benjamin')
                            const displayHours = isGerant ? "Gérant" : `${emp.totalHours.toFixed(1)}h`
                            const isSelected = selectedEmployeeIds.has(emp.id)

                            const toggleFilter = () => {
                                const newSet = new Set(selectedEmployeeIds)
                                if (newSet.has(emp.id)) newSet.delete(emp.id)
                                else newSet.add(emp.id)
                                setSelectedEmployeeIds(newSet)
                            }

                            return (
                                <div
                                    key={emp.id}
                                    onClick={toggleFilter}
                                    className={`
                                        flex items-center justify-between p-2 rounded-lg cursor-pointer border transition-all shadow-sm
                                        ${isSelected ? 'bg-primary/10 border-primary ring-1 ring-primary/20' : 'bg-card border-border hover:border-primary/30'}
                                    `}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className={`shrink-0 w-3 h-3 rounded-full ${getEmployeeDotColor(emp.id, emp.name)} shadow-sm`} />
                                        <span className={`text-xs truncate ${isSelected ? 'font-bold' : 'font-semibold'}`} title={emp.name}>{formatName(emp.name)}</span>
                                    </div>
                                    <Badge variant={isGerant ? "outline" : (isSelected ? "default" : "secondary")} className={`text-[10px] ${isGerant ? 'font-normal border-primary/20 text-primary' : 'font-bold'}`}>
                                        {displayHours}
                                    </Badge>
                                </div>
                            )
                        })}
                        {employeeHours.length === 0 && (
                            <p className="text-xs text-muted-foreground italic text-center py-4">Aucune heure enregistrée ce mois-ci.</p>
                        )}
                    </div>
                </div>

                {/* Calendrier / Contenu Principal */}
                <div className="flex-1 min-w-0">
                    {/* Header des Jours (Desktop uniquement) */}
                    <div className={`hidden md:grid border-b border-border bg-muted/30 ${isCompactWeek ? 'grid-cols-[repeat(3,0.6fr)_repeat(4,2fr)]' : 'grid-cols-7'} text-[10px] sm:text-xs`}>
                        {weekDays.map((day, dIdx) => {
                            const isHotDay = dIdx >= 3;
                            return (
                                <div
                                    key={day}
                                    className={`
                                        py-3 text-center font-black text-muted-foreground uppercase tracking-widest border-r border-border/50 last:border-r-0
                                        ${isCompactWeek && !isHotDay ? 'bg-muted/5 opacity-50' : 'bg-primary/5 text-primary'}
                                    `}
                                >
                                    {day}
                                </div>
                            )
                        })}
                    </div>

                    {/* Desktop Grid View */}
                    <div className={`hidden md:grid auto-rows-[minmax(120px,auto)] ${isCompactWeek ? 'grid-cols-[repeat(3,minmax(0,1fr))_repeat(4,minmax(0,2.5fr))]' : 'grid-cols-7'}`}>
                        {days.map((day, idx) => {
                            const dateKey = format(day, 'yyyy-MM-dd')
                            const isCurrentMonth = isSameMonth(day, currentDate)
                            const today = isToday(day)
                            const dayShifts = shiftsByDay[dateKey] || []
                            const dayOfWeekIdx = idx % 7
                            const isHotDay = dayOfWeekIdx >= 3

                            return (
                                <div
                                    key={day.toISOString()}
                                    onDragOver={onDragOver}
                                    onDrop={(e) => onDrop(e, day)}
                                    className={`
                                        min-h-[120px] p-2 border-r border-b border-border/50 flex flex-col gap-1 transition-all group/day relative
                                        ${!isCurrentMonth ? 'bg-muted/10 opacity-60' : 'bg-card hover:bg-muted/30'}
                                        ${idx % 7 === 6 ? 'border-r-0' : ''}
                                        ${isCompactWeek && !isHotDay ? 'brightness-90 saturate-50 contrast-75 overflow-hidden' : ''}
                                    `}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-sm font-black w-7 h-7 flex items-center justify-center rounded-full
                                                    ${today ? 'bg-primary text-primary-foreground shadow-lg' : 'text-foreground'}`}>
                                                    {format(day, 'd')}
                                                </span>
                                                {viewMode === 'week' && (
                                                    <span className="text-[10px] font-black text-muted-foreground uppercase">{format(day, 'EEE', { locale: fr })}</span>
                                                )}
                                            </div>
                                            {isCurrentMonth && (
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-6 w-6 rounded-lg opacity-0 group-hover/day:opacity-100 transition-all border-primary/20 hover:bg-primary/5"
                                                    onClick={() => setSelectedDateForShift(day)}
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                        {dayShifts.length > 0 && (
                                            <Badge variant="secondary" className="text-[9px] font-black h-4 px-1 bg-muted/50">
                                                {dayShifts.length}
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1 flex-1 overflow-y-auto max-h-[200px] custom-scrollbar pr-1">
                                        {dayShifts.map((s, i) => (
                                            <ShiftItem
                                                key={s.id || i}
                                                s={s}
                                                isDragging={isDragging === s.id}
                                                onDragStart={onDragStart}
                                                onEdit={() => setEditingShift(s)}
                                                onUpdatePosition={handleUpdatePosition}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Mobile List View */}
                    <div className="md:hidden bg-muted/5 divide-y divide-border/50">
                        {days.filter(d => viewMode === 'week' || isSameMonth(d, currentDate)).map((day) => {
                            const dateKey = format(day, 'yyyy-MM-dd')
                            const dayShifts = shiftsByDay[dateKey] || []
                            const today = isToday(day)

                            // On affiche tous les jours en mode semaine, mais seulement ceux avec des shifts en mois
                            if (viewMode === 'month' && dayShifts.length === 0) return null

                            return (
                                <div key={day.toISOString()} className={`p-4 ${today ? 'bg-primary/[0.03]' : ''}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center border shadow-sm
                                                ${today ? 'bg-primary border-primary text-primary-foreground shadow-primary/20' : 'bg-card border-border'}`}>
                                                <span className="text-[10px] font-black uppercase opacity-70 leading-none mb-0.5">{format(day, 'EEE', { locale: fr })}</span>
                                                <span className="text-sm font-black leading-none">{format(day, 'd')}</span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-widest text-foreground">{format(day, 'MMMM yyyy', { locale: fr })}</p>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase">{dayShifts.length} Shift{dayShifts.length > 1 ? 's' : ''}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 rounded-xl border-primary/20 text-primary bg-primary/5 active:scale-95 transition-transform"
                                            onClick={() => setSelectedDateForShift(day)}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        {dayShifts.length === 0 ? (
                                            <p className="text-[10px] font-medium text-muted-foreground italic pl-1.5 opacity-60">Aucun shift planifié</p>
                                        ) : (
                                            dayShifts.map((s, i) => (
                                                <div
                                                    key={s.id || i}
                                                    onClick={() => setEditingShift(s)}
                                                    className={`
                                                        flex items-center justify-between p-3 rounded-2xl border bg-card shadow-sm active:scale-[0.98] transition-all
                                                        ${getEmployeeColorClass(s.employee.id, s.employee.name)}
                                                    `}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-8 rounded-full ${getEmployeeDotColor(s.employee.id, s.employee.name)} opacity-50`} />
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-black uppercase">{s.employee.name}</span>
                                                                {s.position && (() => {
                                                                    const pos = POSITIONS.find(p => p.id === s.position)
                                                                    if (pos) {
                                                                        const Icon = pos.icon
                                                                        return <Icon className="h-3 w-3 opacity-60" />
                                                                    }
                                                                    return null
                                                                })()}
                                                            </div>
                                                            {!(s.employee.name.toLowerCase().includes('adam') || s.employee.name.toLowerCase().includes('benjamin')) && (
                                                                <div className="flex items-center gap-1.5 mt-0.5 opacity-70">
                                                                    <Clock className="h-2.5 w-2.5" />
                                                                    <span className="text-[10px] font-bold font-mono tracking-tighter">
                                                                        {format(new Date(s.startTime), 'HH:mm')} - {s.endTime ? format(new Date(s.endTime), 'HH:mm') : '?'}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {(s.employee.name.toLowerCase().includes('adam') || s.employee.name.toLowerCase().includes('benjamin')) && (
                                                                <Badge variant="outline" className="text-[8px] h-3.5 px-1 uppercase tracking-tighter mt-1 border-current opacity-40">Gérant</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="h-4 w-4 opacity-30" />
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                        {viewMode === 'month' && days.filter(d => isSameMonth(d, currentDate) && (shiftsByDay[format(d, 'yyyy-MM-dd')] || []).length > 0).length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                                <div className="size-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                                    <CalendarIcon className="h-8 w-8 text-muted-foreground/40" />
                                </div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-1">Mois vide</h3>
                                <p className="text-xs text-muted-foreground/60 max-w-[200px]">Aucun shift n'a été planifié pour cette période.</p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>

            {/* Dialog d'ajout rapide */}
            <Dialog open={!!selectedDateForShift} onOpenChange={(open) => !open && setSelectedDateForShift(null)}>
                <DialogContent className="w-[95vw] sm:max-w-[425px] p-4 sm:p-6 rounded-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Ajouter un shift</DialogTitle>
                        <CardDescription>
                            {selectedDateForShift && format(selectedDateForShift, 'EEEE d MMMM yyyy', { locale: fr })}
                        </CardDescription>
                    </DialogHeader>

                    <form onSubmit={handleAddShiftSubmit} className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="userId">Employé</Label>
                            <select
                                name="userId"
                                id="userId"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                required
                                value={selectedUserIdForAdd}
                                onChange={(e) => setSelectedUserIdForAdd(e.target.value)}
                            >
                                <option value="">Sélectionner un employé...</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Masquer les horaires si Gérant */}
                        {(!selectedUserIdForAdd || !employees.find(e => e.id === selectedUserIdForAdd)?.name.toLowerCase().includes('adam') && !employees.find(e => e.id === selectedUserIdForAdd)?.name.toLowerCase().includes('benjamin')) && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="startTime">Début</Label>
                                        <Input type="time" id="startTime" name="startTime" defaultValue="18:00" step={900} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="endTime">Fin</Label>
                                        <Input type="time" id="endTime" name="endTime" defaultValue="23:30" step={900} required />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="breakMinutes">Temps de pause (en minutes) - non payé</Label>
                                    <Input type="number" id="breakMinutes" name="breakMinutes" defaultValue={0} step={10} min={0} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="position">Poste (optionnel)</Label>
                                    <select
                                        id="position"
                                        name="position"
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        defaultValue=""
                                    >
                                        <option value="">-- Sans poste spécifique --</option>
                                        {POSITIONS.map(p => (
                                            <option key={p.id} value={p.id}>{p.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}

                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => setSelectedDateForShift(null)}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={isAddingShift}>
                                {isAddingShift ? "Ajout..." : "Ajouter le shift"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog d'édition rapide */}
            <Dialog open={!!editingShift} onOpenChange={(open) => !open && setEditingShift(null)}>
                <DialogContent className="w-[95vw] sm:max-w-[425px] p-4 sm:p-6 rounded-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Modifier le shift</DialogTitle>
                        <CardDescription>
                            {editingShift?.employee?.name} - {editingShift && format(new Date(editingShift.startTime), 'EEEE d MMMM yyyy', { locale: fr })}
                        </CardDescription>
                    </DialogHeader>

                    <form onSubmit={handleEditShiftSubmit} className="grid gap-4 py-4">
                        {/* Masquer les horaires si Gérant */}
                        {editingShift && !(editingShift.employee.name.toLowerCase().includes('adam') || editingShift.employee.name.toLowerCase().includes('benjamin')) ? (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="editStartTime">Début</Label>
                                        <Input type="time" id="editStartTime" name="startTime" defaultValue={format(new Date(editingShift.startTime), 'HH:mm')} step={900} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="editEndTime">Fin</Label>
                                        <Input type="time" id="editEndTime" name="endTime" defaultValue={editingShift.endTime ? format(new Date(editingShift.endTime), 'HH:mm') : '23:30'} step={900} required />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="editBreakMinutes">Temps de pause (en minutes) - non payé</Label>
                                    <Input type="number" id="editBreakMinutes" name="breakMinutes" defaultValue={editingShift.breakMinutes || 0} step={10} min={0} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="editPosition">Poste (optionnel)</Label>
                                    <select
                                        id="editPosition"
                                        name="position"
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        defaultValue={editingShift.position || ""}
                                    >
                                        <option value="">-- Sans poste spécifique --</option>
                                        {POSITIONS.map(p => (
                                            <option key={p.id} value={p.id}>{p.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-center text-muted-foreground my-4">Les options horaires sont masquées pour les gérants.</p>
                        )}

                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => setEditingShift(null)}>
                                Annuler
                            </Button>
                            {editingShift && !(editingShift.employee.name.toLowerCase().includes('adam') || editingShift.employee.name.toLowerCase().includes('benjamin')) && (
                                <Button type="submit" disabled={isEditingShift}>
                                    {isEditingShift ? "Modification..." : "Enregistrer"}
                                </Button>
                            )}
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Card >
    )
}
