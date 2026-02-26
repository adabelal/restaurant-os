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
import { ChevronLeft, ChevronRight, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function EventsCalendar({ events }: { events: any[] }) {
    const [currentMonth, setCurrentMonth] = useState(new Date())

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

            {/* Calendar Days Header */}
            <div className="grid grid-cols-7 border-b border-border/40 bg-muted/5">
                {eachDayOfInterval({ start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date(), { weekStartsOn: 1 }) }).map((day) => (
                    <div key={day.toString()} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {format(day, weekDaysFormat, { locale: fr }).substring(0, 3)}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 auto-rows-[120px]">
                {days.map((day, dayIdx) => {
                    const dayEvents = events.filter((e) => isSameDay(new Date(e.date), day))
                    const isSelectedMonth = isSameMonth(day, monthStart)

                    return (
                        <div
                            key={day.toString()}
                            className={cn(
                                "border-b border-r border-border/40 p-2 transition-colors hover:bg-muted/5 relative group",
                                !isSelectedMonth && "bg-muted/10 text-muted-foreground",
                                isToday(day) && "bg-primary/5",
                                dayIdx % 7 === 6 && "border-r-0"
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
                                    <div
                                        key={evt.id}
                                        className={cn(
                                            "text-xs p-1.5 rounded border border-border/50 truncate flex items-center gap-1.5 shadow-sm group-hover:border-primary/30 transition-colors",
                                            evt.status === 'SCHEDULED' ? 'bg-primary/10 text-primary-foreground dark:text-primary' :
                                                evt.status === 'TENTATIVE' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400' :
                                                    evt.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' :
                                                        'bg-destructive/10 text-destructive'
                                        )}
                                        title={`${evt.band.name} - ${evt.startTime}`}
                                    >
                                        <Music className="w-3 h-3 shrink-0" />
                                        <span className="font-semibold truncate">{evt.band.name}</span>
                                        <span className="ml-auto opacity-70 text-[10px] shrink-0">{evt.startTime}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
