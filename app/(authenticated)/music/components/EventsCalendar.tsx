"use client"

import { useState } from "react"
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    format,
    isSameMonth,
    isToday,
    isSameDay,
    addMonths,
    subMonths
} from "date-fns"
import { fr } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Music, Info, LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import { AddEventDialog } from "./AddEventDialog"

export function EventsCalendar({ events, bands }: { events: any[], bands: any[] }) {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [isCompactWeek, setIsCompactWeek] = useState(false)

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // Lundi
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const dateFormat = "MMMM yyyy"
    const dayFormat = "d"
    const weekDaysFormat = "EEEE"

    const days = eachDayOfInterval({ start: startDate, end: endDate })

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            {/* Calendar Header */}
            <div className="flex flex-wrap items-center justify-between px-6 py-5 border-b border-border/40 bg-slate-50/50 dark:bg-slate-800/10 gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black tracking-tight text-foreground capitalize">
                        {format(currentMonth, dateFormat, { locale: fr })}
                    </h2>
                    <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl border border-border/60 p-1 shadow-sm">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={prevMonth}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={nextMonth}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCompactWeek(!isCompactWeek)}
                        className={cn(
                            "h-10 gap-2 px-4 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all",
                            isCompactWeek
                                ? "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                        )}
                    >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        {isCompactWeek ? "Semaine complète" : "Focus Weekend"}
                    </Button>
                </div>
            </div>

            {/* Calendar Days Header */}
            <div className={cn(
                "grid border-b border-border/40 bg-slate-50/30 dark:bg-slate-800/5",
                isCompactWeek ? "grid-cols-[repeat(3,0.6fr)_repeat(4,2fr)]" : "grid-cols-7"
            )}>
                {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day, idx) => {
                    const isHotDay = idx >= 3; // Jeudi à Dimanche
                    return (
                        <div
                            key={day}
                            className={cn(
                                "py-3 text-center text-[10px] font-bold uppercase tracking-widest",
                                isCompactWeek && !isHotDay ? "text-slate-300 dark:text-slate-600" : "text-slate-500"
                            )}
                        >
                            {day}
                        </div>
                    )
                })}
            </div>

            {/* Calendar Grid */}
            <div className={cn(
                "grid auto-rows-[140px]",
                isCompactWeek ? "grid-cols-[repeat(3,minmax(0,1fr))_repeat(4,minmax(0,2.5fr))]" : "grid-cols-7"
            )}>
                {days.map((day, dayIdx) => {
                    const dayEvents = events.filter((e) => isSameDay(new Date(e.date), day))
                    const isSelectedMonth = isSameMonth(day, monthStart)
                    const dayOfWeekIdx = dayIdx % 7
                    const isHotDay = dayOfWeekIdx >= 3 // Jeudi à Dimanche

                    return (
                        <div
                            key={day.toString()}
                            className={cn(
                                "border-b border-r border-border/40 p-2 transition-all duration-200 relative group",
                                !isSelectedMonth ? "bg-slate-50/50 dark:bg-slate-900/50 text-slate-300 dark:text-slate-700" : "bg-white dark:bg-slate-900",
                                isToday(day) && "bg-primary/[0.03] dark:bg-primary/[0.02] ring-1 ring-primary/20 ring-inset z-10",
                                isHotDay && isSelectedMonth && "bg-slate-50/30 dark:bg-slate-800/10",
                                dayIdx % 7 === 6 && "border-r-0",
                                isCompactWeek && !isHotDay && "opacity-40 grayscale-[0.5] scale-[0.98] origin-center"
                            )}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={cn(
                                    "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg transition-colors",
                                    isToday(day) ? "bg-primary text-white shadow-sm shadow-primary/30" : "text-slate-400 group-hover:text-slate-600",
                                    !isSelectedMonth && "opacity-30"
                                )}>
                                    {format(day, dayFormat)}
                                </span>
                                {isToday(day) && (
                                    <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                )}
                            </div>

                            <div className="space-y-1 overflow-y-auto max-h-[95px] custom-scrollbar pr-0.5">
                                {dayEvents.map((evt) => (
                                    <AddEventDialog
                                        key={evt.id}
                                        bands={bands}
                                        eventToEdit={evt}
                                        trigger={
                                            <div
                                                className={cn(
                                                    "text-[10px] p-1.5 rounded-lg border-l-2 truncate flex items-center gap-1.5 shadow-sm cursor-pointer transition-all hover:translate-x-0.5",
                                                    // Bordure = Paiement
                                                    (evt.isFree || evt.paymentMethod === 'CASH' || evt.invoiceStatus === 'PAID') ? "border-l-emerald-500 bg-emerald-50/50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400" :
                                                        evt.paymentMethod === 'TRANSFER' ? "border-l-blue-500 bg-blue-50/50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400" :
                                                            evt.paymentMethod === 'TBD' ? "border-l-orange-500 bg-orange-50/50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400" : "border-l-slate-400 bg-slate-50 text-slate-600",
                                                    // Animation si facture manquante
                                                    (evt.status === 'COMPLETED' && evt.invoiceStatus === 'PENDING' && !evt.isFree) && "ring-1 ring-destructive/30 animate-pulse"
                                                )}
                                                title={`${evt.band.name} - ${evt.startTime}${evt.invoiceStatus === 'PENDING' ? ' (Facture attendue)' : ''}`}
                                            >
                                                <div className="w-1 h-1 rounded-full bg-current opacity-60" />
                                                <span className="font-bold truncate">{evt.band.name}</span>
                                            </div>
                                        }
                                    />
                                ))}
                                {dayEvents.length > 3 && (
                                    <div className="text-[9px] text-slate-400 text-center pt-0.5 font-bold uppercase tracking-tighter">
                                        + {dayEvents.length - 3} plus
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Legend footer */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-6 py-3 bg-muted/5 border-t border-border/40 text-[10px]">
                <div className="flex items-center gap-1.5 mr-2">
                    <Info className="w-3 h-3 text-muted-foreground" />
                    <span className="font-bold text-muted-foreground uppercase">Légende :</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-3 bg-emerald-500 rounded-sm" />
                        <span className="text-muted-foreground">Bordure : Paiement OK</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-3 bg-blue-500 rounded-sm" />
                        <span className="text-muted-foreground">Virement</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30" />
                        <span className="text-muted-foreground">Fond : Facture OK</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-destructive/10 border border-destructive/20 animate-pulse" />
                        <span className="text-destructive font-bold">Relance Facture</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
