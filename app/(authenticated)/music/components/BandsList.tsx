"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Mail, Trash2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { deleteBand } from "../actions"
import { toast } from "sonner"
import { useState } from "react"
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

export function BandsList({ initialBands }: { initialBands: any[] }) {
    const [isDeleting, setIsDeleting] = useState<string | null>(null)

    if (!initialBands || initialBands.length === 0) {
        return (
            <div className="text-center p-12 border rounded-lg border-dashed bg-muted/10">
                <p className="text-muted-foreground">Aucun groupe enregistré.</p>
            </div>
        )
    }

    async function handleDelete(id: string) {
        setIsDeleting(id)
        const result = await deleteBand(id)
        if (result && result.error) {
            toast.error(result.error)
        } else {
            toast.success("Groupe supprimé avec succès")
        }
        setIsDeleting(null)
    }

    return (
        <div className="flex flex-col gap-3 animate-in fade-in duration-500">
            {initialBands.map((band) => (
                <Card key={band.id} className="relative overflow-hidden group hover:shadow-md transition-all border-l-4 border-l-muted-foreground hover:border-l-primary/80">
                    <div className="flex flex-col md:flex-row items-center p-4 gap-4 pr-12">
                        <Link href={`/music/bands/${band.id}`} className="flex-shrink-0 hover:opacity-80 transition-opacity">
                            <div className="h-14 w-14 bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors rounded-xl flex items-center justify-center text-primary font-bold text-2xl font-oswald shadow-inner">
                                {band.name.charAt(0).toUpperCase()}
                            </div>
                        </Link>

                        <div className="flex-1 min-w-0">
                            <Link href={`/music/bands/${band.id}`} className="hover:underline decoration-primary underline-offset-4">
                                <h3 className="font-bold text-lg md:text-xl truncate group-hover:text-primary transition-colors">{band.name}</h3>
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="font-normal text-[10px] uppercase tracking-wider">{band.genre || "Divers"}</Badge>
                                {band.contact || band.email ? (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Mail className="h-3 w-3" /> {band.email || band.contact}
                                    </span>
                                ) : null}
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

                    <div className="absolute right-2 top-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/music/bands/${band.id}`}>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10">
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    disabled={isDeleting === band.id}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Cette action est irréversible. Cela supprimera le groupe "{band.name}".
                                        S'il y a des concerts liés, vous devez d'abord les supprimer.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => handleDelete(band.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        Supprimer
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </Card>
            ))}
        </div>
    )
}
