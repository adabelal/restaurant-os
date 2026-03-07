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
import { ChevronLeft, ChevronRight, Music, Info } from "lucide-react"
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
        <div className="bg-card rounded-xl border border-border/40 shadow-sm overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-muted/10">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-xl font-bold font-oswald uppercase tracking-wide text-primary capitalize">
                        {format(currentMonth, dateFormat, { locale: fr })}
                    </h2>
                    <Button variant="outline" size="icon" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCompactWeek(!isCompactWeek)}
                    className="h-9 gap-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 hidden sm:flex"
                >
                    <ChevronRight className={cn("h-4 w-4 transition-transform", isCompactWeek ? "rotate-180" : "")} />
                    <span className="font-bold uppercase text-[10px] tracking-wider">
                        {isCompactWeek ? "Semaine complète" : "Focus Weekend"}
                    </span>
                </Button>
            </div>

            {/* Calendar Days Header */}
            <div className={cn(
                "grid border-b border-border/40 bg-muted/5",
                isCompactWeek ? "grid-cols-[repeat(3,0.6fr)_repeat(4,2fr)]" : "grid-cols-7"
            )}>
                {eachDayOfInterval({ start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date(), { weekStartsOn: 1 }) }).map((day, idx) => {
                    const isHotDay = idx >= 3; // Jeudi à Dimanche
                    return (
                        <div
                            key={day.toString()}
                            className={cn(
                                "py-2 text-center text-[10px] font-bold uppercase tracking-wider",
                                isCompactWeek && !isHotDay ? "text-muted-foreground/40" : "text-muted-foreground"
                            )}
                        >
                            {format(day, weekDaysFormat, { locale: fr }).substring(0, 3)}
                        </div>
                    )
                })}
            </div>

            {/* Calendar Grid */}
            <div className={cn(
                "grid auto-rows-[120px]",
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
                                "border-b border-r border-border/40 p-2 transition-colors hover:bg-muted/5 relative group",
                                !isSelectedMonth && "bg-muted/10 text-muted-foreground",
                                isToday(day) && "bg-primary/5",
                                dayIdx % 7 === 6 && "border-r-0",
                                isCompactWeek && !isHotDay && "brightness-95 saturate-50 contrast-75 overflow-hidden"
                            )}
                        >
                            <div className="flex justify-between items-start">
                                <span className={cn(
                                    "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                                    isToday(day) ? "bg-primary text-primary-foreground" : "text-foreground",
                                    !isSelectedMonth && "text-muted-foreground/50"
                                )}>
                                    {format(day, dayFormat)}
                                </span>
                            </div>

                            <div className="mt-2 space-y-1.5 overflow-y-auto max-h-[75px] custom-scrollbar pr-1">
                                {dayEvents.map((evt) => (
                                    <AddEventDialog
                                        key={evt.id}
                                        bands={bands}
                                        eventToEdit={evt}
                                        trigger={
                                            <div
                                                className={cn(
                                                    "text-[10px] md:text-xs p-1 rounded border-l-4 truncate flex items-center gap-1 shadow-sm cursor-pointer transition-all",
                                                    // Bordure = Paiement
                                                    (evt.isFree || evt.paymentMethod === 'CASH' || evt.invoiceStatus === 'PAID') ? "border-l-emerald-500" :
                                                        evt.paymentMethod === 'TRANSFER' ? "border-l-blue-500" :
                                                            evt.paymentMethod === 'TBD' ? "border-l-orange-500" : "border-l-muted-foreground",
                                                    // Fond = Facture
                                                    (evt.invoiceStatus === 'RECEIVED' || evt.invoiceStatus === 'PAID' || evt.isFree) ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" :
                                                        (evt.status === 'COMPLETED') ? "bg-destructive/10 text-destructive animate-pulse" : "bg-muted/30 text-muted-foreground"
                                                )}
                                                title={`${evt.band.name} - ${evt.startTime}${evt.invoiceStatus === 'PENDING' ? ' (Facture attendue)' : ''}`}
                                            >
                                                <Music className="w-2.5 h-2.5 shrink-0" />
                                                <span className="font-semibold truncate">{evt.band.name}</span>
                                            </div>
                                        }
                                    />
                                ))}
                                {dayEvents.length > 2 && (
                                    <div className="text-[9px] text-muted-foreground text-center pt-1 font-medium">
                                        + {dayEvents.length - 2} autres
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
