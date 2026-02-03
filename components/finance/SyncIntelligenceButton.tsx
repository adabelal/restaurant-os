'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'
import { syncFinanceIntelligence } from '@/app/(authenticated)/finance/actions'
import { toast } from 'sonner'

export function SyncIntelligenceButton() {
    const [isLoading, setIsLoading] = useState(false)

    const handleSync = async () => {
        setIsLoading(true)
        try {
            const result = await syncFinanceIntelligence()
            if (result.success) {
                toast.success("Intelligence synchronisée : Solde recalé, catégories detectées et charges ajoutées !")
            } else {
                toast.error("Erreur lors de la synchronisation")
            }
        } catch (error) {
            toast.error("Erreur réseau")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            onClick={handleSync}
            disabled={isLoading}
            variant="default"
            className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg border-none"
        >
            {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Sparkles className="mr-2 h-4 w-4 text-amber-400" />
            )}
            {isLoading ? "Analyse en cours..." : "Sync Intelligence AI"}
        </Button>
    )
}
