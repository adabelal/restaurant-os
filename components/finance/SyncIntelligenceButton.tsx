'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'
import { syncFinanceIntelligence } from '@/app/(authenticated)/finance/actions'
import { toast } from 'sonner'

export function SyncIntelligenceButton() {
    const [isLoading, setIsLoading] = useState(false)

    const handleSyncAndImport = async () => {
        setIsLoading(true)
        try {
            toast.info("Analyse intelligence en cours...")
            const syncRes = await syncFinanceIntelligence()
            if (syncRes.success) {
                toast.success("Intelligence synchronisée : Solde et catégories OK !")
            } else {
                toast.error("Erreur de synchronisation")
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
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md shadow-lg"
        >
            {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Sparkles className="mr-2 h-4 w-4 text-emerald-300" />
            )}
            {isLoading ? "Synchronisation..." : "Activer l'Intelligence AI"}
        </Button>
    )
}
