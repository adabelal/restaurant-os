
"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function BandsList({ initialBands }: { initialBands: any[] }) {
    if (!initialBands || initialBands.length === 0) {
        return (
            <div className="text-center p-12 border rounded-lg border-dashed bg-muted/10">
                <p className="text-muted-foreground">Aucun groupe enregistré.</p>
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {initialBands.map((band) => (
                <Card key={band.id} className="hover:shadow-md transition-all group overflow-hidden border-muted-foreground/20">
                    <CardHeader className="bg-gradient-to-br from-card to-muted/50 pb-4">
                        <div className="flex justify-between items-start mb-2">
                            <div className="h-12 w-12 bg-primary/10 group-hover:bg-primary/20 transition-colors rounded-full flex items-center justify-center text-primary font-bold text-xl font-oswald shadow-sm">
                                {band.name.charAt(0).toUpperCase()}
                            </div>
                            <Badge variant="secondary" className="font-normal">{band.genre || "Divers"}</Badge>
                        </div>
                        <CardTitle className="pt-1 text-xl tracking-tight">{band.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <div className="text-sm space-y-1">
                            <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Contact</p>
                            <p className="font-medium text-sm truncate select-all">{band.contact || "Non renseigné"}</p>
                        </div>

                        <div className="pt-3 border-t flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Concerts enregistrés</span>
                            <div className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-md min-w-[24px] text-center">
                                {band.events?.length || 0}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
