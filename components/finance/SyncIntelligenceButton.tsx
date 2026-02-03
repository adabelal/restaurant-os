'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, Database } from 'lucide-react'
import { syncFinanceIntelligence, importFromJsonFile } from '@/app/(authenticated)/finance/actions'
import { toast } from 'sonner'

export function SyncIntelligenceButton() {
    const [isLoading, setIsLoading] = useState(false)

    const handleSyncAndImport = async () => {
        setIsLoading(true)
        try {
            toast.info("Importation de l'historique complet...")
            const importRes = await importFromJsonFile()

            if (importRes.success) {
                toast.success(`${importRes.count} transactions importées. Analyse en cours...`)
                const syncRes = await syncFinanceIntelligence()
                if (syncRes.success) {
                    toast.success("Intelligence synchronisée : Solde et catégories OK !")
                }
            } else {
                toast.error("Erreur import : " + importRes.error)
            }
        } catch (error) {
            toast.error("Erreur technique")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            onClick={handleSyncAndImport}
            disabled={isLoading}
            variant="default"
            className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg"
        >
            {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Sparkles className="mr-2 h-4 w-4 text-amber-400" />
            )}
            {isLoading ? "Synchronisation..." : "Réparer Solde & Catégories"}
        </Button>
    )
}
