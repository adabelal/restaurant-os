"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, List, LayoutGrid } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { EventsCalendar } from "./EventsCalendar"

export function EventsList({ initialEvents }: { initialEvents: any[] }) {
    const [view, setView] = useState<'calendar' | 'list' | 'grid'>('calendar')

    if (!initialEvents || initialEvents.length === 0) {
        return (
            <div className="text-center p-12 border rounded-lg border-dashed bg-muted/10">
                <p className="text-muted-foreground">Aucun concert prévu pour le moment.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end gap-2 border-b border-border/40 pb-4">
                <Button
                    variant={view === 'calendar' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setView('calendar')}
                    className={cn("h-9", view === 'calendar' && "shadow-md shadow-primary/20")}
                >
                    <Calendar className="w-4 h-4 mr-2" /> Calendrier
                </Button>
                <Button
                    variant={view === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setView('list')}
                    className={cn("h-9", view === 'list' && "shadow-md shadow-primary/20")}
                >
                    <List className="w-4 h-4 mr-2" /> Liste
                </Button>
                <Button
                    variant={view === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setView('grid')}
                    className={cn("h-9", view === 'grid' && "shadow-md shadow-primary/20 hover:text-primary")}
                >
                    <LayoutGrid className="w-4 h-4" />
                </Button>
            </div>

            {view === 'calendar' && <EventsCalendar events={initialEvents} />}

            {view === 'grid' && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-500">
                    {initialEvents.map((event) => (
                        <Card key={event.id} className="overflow-hidden border-l-4 border-l-primary hover:shadow-md transition-shadow">
                            <CardHeader className="bg-muted/30 pb-3">
                                <div className="flex justify-between items-start mb-1">
                                    <Badge variant={
                                        event.status === 'COMPLETED' ? 'secondary' :
                                            event.status === 'CANCELLED' ? 'destructive' :
                                                event.status === 'TENTATIVE' ? 'outline' : 'default'
                                    }>
                                        {event.status === 'SCHEDULED' ? 'Confirmé' :
                                            event.status === 'TENTATIVE' ? 'Option' :
                                                event.status === 'COMPLETED' ? 'Terminé' : 'Annulé'}
                                    </Badge>
                                    <span className="font-mono text-xs text-muted-foreground">
                                        {event.startTime || "20:00"}
                                    </span>
                                </div>
                                <CardTitle className="text-lg font-bold text-foreground">
                                    {event.band.name}
                                </CardTitle>
                                <p className="text-sm text-primary font-medium capitalize">
                                    {format(new Date(event.date), "EEEE d MMMM yyyy", { locale: fr })}
                                </p>
                            </CardHeader>
                            <CardContent className="pt-4 text-sm space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">Cachet</span>
                                        <span className="font-bold">{Number(event.amount).toFixed(2)} €</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">Paiement</span>
                                        <span className="font-medium">
                                            {event.paymentMethod === 'TRANSFER' ? 'Virement' :
                                                event.paymentMethod === 'Check' ? 'Chèque' :
                                                    event.paymentMethod === 'CASH' ? 'Espèces' : event.paymentMethod}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t">
                                    <span className="text-xs text-muted-foreground">Facture:</span>
                                    <Badge variant={
                                        event.invoiceStatus === 'PAID' ? 'outline' :
                                            event.invoiceStatus === 'RECEIVED' ? 'secondary' : 'destructive'
                                    } className="text-[10px] h-5">
                                        {event.invoiceStatus === 'PENDING' ? 'À recevoir' :
                                            event.invoiceStatus === 'RECEIVED' ? 'Reçue' : 'Payée'}
                                    </Badge>
                                </div>

                                {event.notes && (
                                    <div className="pt-2 border-t bg-muted/20 -mx-6 px-6 pb-2 mb-[-16px]">
                                        <p className="text-xs text-muted-foreground italic line-clamp-2">"{event.notes}"</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {view === 'list' && (
                <div className="flex flex-col gap-3 animate-in fade-in duration-500">
                    {initialEvents.map((event) => (
                        <Card key={event.id} className="overflow-hidden group hover:shadow-md transition-all border-l-4 border-l-primary hover:border-l-primary/80">
                            <div className="flex flex-col md:flex-row items-center p-4 gap-4">
                                <div className="flex-shrink-0 w-32 md:w-48">
                                    <p className="font-bold text-primary font-oswald text-lg md:text-xl capitalize leading-tight">
                                        {format(new Date(event.date), "d MMM yyyy", { locale: fr })}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-muted rounded-full">
                                            {event.startTime || "20:00"}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg md:text-xl truncate group-hover:text-primary transition-colors">{event.band.name}</h3>
                                    {event.notes && <p className="text-xs text-muted-foreground truncate mt-1">Note: {event.notes}</p>}
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex flex-col items-end mr-4">
                                        <span className="font-black text-lg">{Number(event.amount).toFixed(2)} €</span>
                                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                            {event.paymentMethod === 'TRANSFER' ? 'Virement' : event.paymentMethod === 'CASH' ? 'Espèces' : 'Chèque'}
                                        </span>
                                    </div>
                                    <Badge variant={
                                        event.status === 'COMPLETED' ? 'secondary' :
                                            event.status === 'CANCELLED' ? 'destructive' :
                                                event.status === 'TENTATIVE' ? 'outline' : 'default'
                                    } className="uppercase text-[10px] tracking-wider font-bold">
                                        {event.status === 'SCHEDULED' ? 'Confirmé' :
                                            event.status === 'TENTATIVE' ? 'Option' :
                                                event.status === 'COMPLETED' ? 'Terminé' : 'Annulé'}
                                    </Badge>
                                    <Badge variant={
                                        event.invoiceStatus === 'PAID' ? 'outline' :
                                            event.invoiceStatus === 'RECEIVED' ? 'secondary' : 'destructive'
                                    } className="uppercase text-[10px] tracking-wider font-bold bg-background">
                                        {event.invoiceStatus === 'PENDING' ? 'Fact. À recevoir' :
                                            event.invoiceStatus === 'RECEIVED' ? 'Fact. Reçue' : 'Fact. Payée'}
                                    </Badge>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
