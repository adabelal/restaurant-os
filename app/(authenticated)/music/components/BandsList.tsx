"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Mail } from "lucide-react"

export function BandsList({ initialBands }: { initialBands: any[] }) {
    if (!initialBands || initialBands.length === 0) {
        return (
            <div className="text-center p-12 border rounded-lg border-dashed bg-muted/10">
                <p className="text-muted-foreground">Aucun groupe enregistré.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-3 animate-in fade-in duration-500">
            {initialBands.map((band) => (
                <Card key={band.id} className="overflow-hidden group hover:shadow-md transition-all border-l-4 border-l-muted-foreground hover:border-l-primary">
                    <div className="flex flex-col md:flex-row items-center p-4 gap-4">
                        <div className="flex-shrink-0">
                            <div className="h-14 w-14 bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors rounded-xl flex items-center justify-center text-primary font-bold text-2xl font-oswald shadow-inner">
                                {band.name.charAt(0).toUpperCase()}
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg md:text-xl truncate group-hover:text-primary transition-colors">{band.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="font-normal text-[10px] uppercase tracking-wider">{band.genre || "Divers"}</Badge>
                                {band.contact && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Mail className="h-3 w-3" /> {band.contact}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 border-t md:border-t-0 md:border-l border-border/40 pt-3 md:pt-0 pl-0 md:pl-4 mt-2 md:mt-0 w-full md:w-auto">
                            <div className="flex flex-col items-center justify-center px-4 py-2 bg-muted/30 rounded-lg min-w-[100px]">
                                <span className="font-black text-2xl text-primary">{band.events?.length || 0}</span>
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
                                    <Users className="h-3 w-3" /> Concerts
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    )
}
