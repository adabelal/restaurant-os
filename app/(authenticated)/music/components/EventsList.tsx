"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, List, LayoutGrid, Trash2, Edit2, Mail, Info } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { EventsCalendar } from "./EventsCalendar"
import { deleteEvent, sendInvoiceReminder } from "../actions"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { AddEventDialog } from "./AddEventDialog"

export function EventsList({ initialEvents, bands }: { initialEvents: any[], bands: any[] }) {
    const [view, setView] = useState<'calendar' | 'list' | 'grid'>('calendar')
    const [isDeleting, setIsDeleting] = useState<string | null>(null)

    if (!initialEvents || initialEvents.length === 0) {
        return (
            <div className="text-center p-12 border rounded-lg border-dashed bg-muted/10">
                <p className="text-muted-foreground">Aucun concert prévu pour le moment.</p>
            </div>
        )
    }

    async function handleDelete(id: string) {
        setIsDeleting(id)
        const result = await deleteEvent(id)
        if (result && result.error) {
            toast.error(result.error)
        } else {
            toast.success("Concert supprimé avec succès")
        }
        setIsDeleting(null)
    }

    const ColorLegend = () => (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 p-3 bg-muted/20 rounded-xl border border-border/40 text-[10px] sm:text-xs">
            <span className="font-bold text-muted-foreground uppercase tracking-tight mr-1 flex items-center gap-1.5 text-[9px]">
                <Info className="w-3 h-3" /> Nouveau Code Couleur :
            </span>
            <div className="flex items-center gap-3 border-r pr-4 border-border/40">
                <span className="text-muted-foreground font-medium">Contour (Paiement) :</span>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-4 bg-emerald-500 rounded-sm" />
                    <span>Payé / Gratuit</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-4 bg-blue-500 rounded-sm" />
                    <span>Virement</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-4 bg-orange-500 rounded-sm" />
                    <span>À déterminer</span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-muted-foreground font-medium">Fond (Facture) :</span>
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-emerald-500/10 border border-emerald-500/20" />
                    <span>Reçue</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-destructive/10 border border-destructive/20 animate-pulse" />
                    <span>À recevoir (Attente)</span>
                </div>
            </div>
        </div>
    )

    async function handleSendReminder(eventId: string) {
        const result = await sendInvoiceReminder(eventId) as any
        if (result && result.success) {
            toast.success(result.message)
        } else {
            toast.error(result.error || "Erreur lors de l'envoi de la relance")
        }
    }

    const getInvoiceBadge = (event: any) => {
        if (event.isFree || event.invoiceStatus === 'PAID') {
            return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20">
                {event.isFree ? 'Gratuit' : 'Payée'}
            </Badge>
        }
        if (event.invoiceStatus === 'RECEIVED') {
            return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20">
                Reçue
            </Badge>
        }
        return (
            <div className="flex items-center gap-2">
                <Badge variant="destructive" className="animate-pulse">
                    À recevoir
                </Badge>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6 border-destructive/50 text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleSendReminder(event.id);
                    }}
                    title="Envoyer un mail de relance"
                >
                    <Mail className="h-3 w-3" />
                </Button>
            </div>
        )
    }

    const getPaymentBadge = (method: string) => {
        switch (method) {
            case 'CASH':
                return <Badge variant="outline" className="border-purple-500/50 text-purple-500 bg-purple-500/5">ESPÈCES</Badge>
            case 'TRANSFER':
                return <Badge variant="outline" className="border-blue-500/50 text-blue-500 bg-blue-500/5">VIREMENT</Badge>
            case 'GUSO':
                return <Badge variant="outline" className="border-amber-500/50 text-amber-500 bg-amber-500/5">GUSO</Badge>
            default:
                return <Badge variant="outline">{method}</Badge>
        }
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

            <ColorLegend />

            {view === 'calendar' && <EventsCalendar events={initialEvents} bands={bands} />}

            {view === 'grid' && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-500">
                    {initialEvents.map((event) => {
                        const isPaid = event.isFree || event.paymentMethod === 'CASH' || event.invoiceStatus === 'PAID'
                        const isInvoiceReceived = event.invoiceStatus === 'RECEIVED' || event.invoiceStatus === 'PAID' || event.isFree
                        const needsInvoice = !isInvoiceReceived && event.status === 'COMPLETED'

                        // Couleur de la bordure (Paiement)
                        const borderColor = isPaid ? "border-l-emerald-500" :
                            event.paymentMethod === 'TRANSFER' ? "border-l-blue-500" :
                                event.paymentMethod === 'TBD' ? "border-l-orange-500" : "border-l-muted-foreground"

                        return (
                            <Card key={event.id} className={cn(
                                "overflow-hidden border-l-4 hover:shadow-lg transition-all group relative",
                                borderColor,
                                isInvoiceReceived ? "bg-emerald-500/5" :
                                    needsInvoice ? "bg-destructive/5 animate-pulse" : "bg-card"
                            )}>
                                <CardHeader className="relative pb-3">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex gap-2">
                                            <Badge variant={
                                                event.status === 'COMPLETED' ? 'secondary' :
                                                    event.status === 'CANCELLED' ? 'destructive' :
                                                        event.status === 'TENTATIVE' ? 'outline' : 'default'
                                            }>
                                                {event.status === 'SCHEDULED' ? 'Confirmé' :
                                                    event.status === 'TENTATIVE' ? 'Option' :
                                                        event.status === 'COMPLETED' ? 'Terminé' : 'Annulé'}
                                            </Badge>
                                            {event.isFree && <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Libre</Badge>}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <AddEventDialog
                                                bands={bands}
                                                eventToEdit={event}
                                                trigger={
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                }
                                            />
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        disabled={isDeleting === event.id}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Cette action est irréversible. Cela supprimera le concert de "{event.band.name}" du {format(new Date(event.date), "d MMM yyyy", { locale: fr })}.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDelete(event.id)}
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        >
                                                            Supprimer
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
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
                                            <span className="font-bold">
                                                {event.isFree ? '-' : `${Number(event.amount).toFixed(2)} €`}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground">Paiement</span>
                                            <div className="mt-0.5">
                                                {getPaymentBadge(event.paymentMethod)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t">
                                        <span className="text-xs text-muted-foreground">Facture:</span>
                                        {getInvoiceBadge(event)}
                                    </div>

                                    {event.notes && (
                                        <div className="pt-2 border-t bg-muted/20 -mx-6 px-6 pb-2 mb-[-16px]">
                                            <p className="text-xs text-muted-foreground italic line-clamp-2">"{event.notes}"</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {view === 'list' && (
                <div className="flex flex-col gap-3 animate-in fade-in duration-500">
                    {initialEvents.map((event) => {
                        const isPaid = event.isFree || event.paymentMethod === 'CASH' || event.invoiceStatus === 'PAID'
                        const isInvoiceReceived = event.invoiceStatus === 'RECEIVED' || event.invoiceStatus === 'PAID' || event.isFree
                        const needsInvoice = !isInvoiceReceived && event.status === 'COMPLETED'

                        // Couleur de la bordure (Paiement)
                        const borderColor = isPaid ? "border-l-emerald-500" :
                            event.paymentMethod === 'TRANSFER' ? "border-l-blue-500" :
                                event.paymentMethod === 'TBD' ? "border-l-orange-500" : "border-l-muted-foreground"

                        return (
                            <Card key={event.id} className={cn(
                                "overflow-hidden group hover:shadow-md transition-all border-l-4 relative",
                                borderColor,
                                isInvoiceReceived ? "bg-emerald-500/5" :
                                    needsInvoice ? "bg-destructive/5 animate-pulse" : "bg-card"
                            )}>
                                <div className="flex flex-col md:flex-row items-center p-4 gap-4 relative">
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
                                            <span className="font-black text-lg">
                                                {event.isFree ? 'Gratuit' : `${Number(event.amount).toFixed(2)} €`}
                                            </span>
                                            <div className="mt-1">
                                                {getPaymentBadge(event.paymentMethod)}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1.5 items-end">
                                            <Badge variant={
                                                event.status === 'COMPLETED' ? 'secondary' :
                                                    event.status === 'CANCELLED' ? 'destructive' :
                                                        event.status === 'TENTATIVE' ? 'outline' : 'default'
                                            } className="uppercase text-[9px] tracking-wider font-bold h-5">
                                                {event.status === 'SCHEDULED' ? 'Confirmé' :
                                                    event.status === 'TENTATIVE' ? 'Option' :
                                                        event.status === 'COMPLETED' ? 'Terminé' : 'Annulé'}
                                            </Badge>
                                            <div className="scale-90 origin-right">
                                                {getInvoiceBadge(event)}
                                            </div>
                                        </div>

                                        <div className="ml-2 border-l border-border/50 pl-2 flex flex-col gap-1">
                                            <AddEventDialog
                                                bands={bands}
                                                eventToEdit={event}
                                                trigger={
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10">
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                }
                                            />
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                        disabled={isDeleting === event.id}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Cette action est irréversible. Cela supprimera le concert de "{event.band.name}".
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDelete(event.id)}
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        >
                                                            Supprimer
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
