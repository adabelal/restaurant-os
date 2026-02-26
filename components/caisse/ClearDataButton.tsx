'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { clearCaisseData } from "@/app/caisse/actions"
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

export function ClearDataButton() {
    const [isClearing, setIsClearing] = useState(false)

    const handleClear = async () => {
        setIsClearing(true)
        try {
            const result = await clearCaisseData()
            if (result.success) {
                toast.success("Base de données vidée.")
            }
        } catch (error) {
            toast.error("Erreur lors de la suppression.")
        } finally {
            setIsClearing(false)
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">
                    <Trash2 className="h-4 w-4 mr-2" /> Vider
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Cela supprimera TOUTES les transactions de caisse. Cette action est irréversible.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClear} className="bg-rose-600 hover:bg-rose-700">
                        {isClearing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmer"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
