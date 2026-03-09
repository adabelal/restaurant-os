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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {initialBands.map((band) => (
                <Card key={band.id} className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border border-border/50 bg-white dark:bg-slate-900 rounded-2xl flex flex-col">
                    <div className="p-6 flex flex-col items-center text-center flex-1">
                        <Link href={`/music/bands/${band.id}`} className="mb-4 relative">
                            <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300 rounded-3xl flex items-center justify-center text-slate-400 group-hover:scale-110 font-black text-3xl font-oswald shadow-inner relative">
                                {band.name.charAt(0).toUpperCase()}
                                <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-white dark:bg-slate-900 rounded-full border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center">
                                    <div className="h-2 w-2 bg-primary rounded-full" />
                                </div>
                            </div>
                        </Link>

                        <div className="space-y-1 mb-6">
                            <Link href={`/music/bands/${band.id}`} className="block group-hover:text-primary transition-colors">
                                <h3 className="font-black text-xl tracking-tight leading-tight">{band.name}</h3>
                            </Link>
                            <div className="flex flex-wrap justify-center gap-2 pt-1">
                                <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[9px] uppercase tracking-widest border-none">
                                    {band.genre || "Divers"}
                                </Badge>
                            </div>
                        </div>

                        <div className="w-full grid grid-cols-2 gap-4 pt-6 border-t border-border/40">
                            <div className="flex flex-col items-center">
                                <span className="font-black text-lg text-foreground">{band.events?.length || 0}</span>
                                <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Concerts</span>
                            </div>
                            <div className="flex flex-col items-center border-l border-border/40">
                                <span className="font-black text-lg text-foreground">
                                    {band.email || band.contact ? (
                                        <Mail className="h-4 w-4 text-primary" />
                                    ) : (
                                        <span className="text-slate-300">-</span>
                                    )}
                                </span>
                                <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Contact</span>
                            </div>
                        </div>
                    </div>

                    <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-8 w-8 rounded-xl bg-white dark:bg-slate-800 shadow-md text-slate-400 hover:text-destructive hover:bg-destructive/10"
                                    disabled={isDeleting === band.id}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Supprimer l'artiste ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Cette action supprimera définitivement "{band.name}".
                                        S'il y a des concerts programmés, vous devrez d'abord les retirer de l'agenda.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => handleDelete(band.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                                    >
                                        Confirmer la suppression
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <Link href={`/music/bands/${band.id}`}>
                            <Button variant="secondary" size="icon" className="h-8 w-8 rounded-xl bg-white dark:bg-slate-800 shadow-md text-slate-400 hover:text-primary hover:bg-primary/10">
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>

                    <Link href={`/music/bands/${band.id}`} className="p-3 bg-slate-50 dark:bg-slate-800/50 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:bg-primary hover:text-white transition-colors border-t border-border/40">
                        Voir le profil complet
                    </Link>
                </Card>
            ))}
        </div>
    )
}
