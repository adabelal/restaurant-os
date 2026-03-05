"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2, AlertTriangle } from "lucide-react"
import { cleanupPopinaData } from "../actions"
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

export function CleanupPopinaButton() {
    const [isCleaning, setIsCleaning] = useState(false)

    const handleCleanup = async () => {
        setIsCleaning(true)
        try {
            const result = await cleanupPopinaData()
            if (result.success) {
                toast.success("Nettoyage réussi", {
                    description: result.message
                })
            } else {
                toast.error("Échec du nettoyage", {
                    description: result.error
                })
            }
        } catch (error) {
            toast.error("Erreur technique lors du nettoyage")
        } finally {
            setIsCleaning(false)
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Nettoyer Données Popina
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center text-red-600">
                        <AlertTriangle className="mr-2 h-5 w-5" />
                        Confirmer le nettoyage
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Cette action va supprimer toutes les transactions de caisse créées **aujourd'hui** contenant le mot "Popina".
                        Ceci est irréversible. Utilisez ce bouton uniquement pour annuler une importation erronée.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleCleanup}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        disabled={isCleaning}
                    >
                        {isCleaning ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Nettoyage en cours...
                            </>
                        ) : (
                            "Confirmer la suppression"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
