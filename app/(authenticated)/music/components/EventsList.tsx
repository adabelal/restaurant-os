
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export function EventsList({ initialEvents }: { initialEvents: any[] }) {
    if (!initialEvents || initialEvents.length === 0) {
        return (
            <div className="text-center p-12 border rounded-lg border-dashed bg-muted/10">
                <p className="text-muted-foreground">Aucun concert prévu pour le moment.</p>
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
    )
}
