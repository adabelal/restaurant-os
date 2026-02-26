"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCcw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { syncBankTransactions } from "@/app/(authenticated)/finance/actions"

export function FetchBankTransactionsButton() {
    const [isLoading, setIsLoading] = useState(false)

    const handleSync = async () => {
        setIsLoading(true)
        try {
            const res = await syncBankTransactions()

            if (res.success) {
                toast.success(`Synchronisation terminée : ${res.imported} ajouts, ${res.duplicates} doublons évités.`)
            } else {
                toast.error(res.error || "Une erreur est survenue")
            }
        } catch (error) {
            toast.error("Erreur technique lors de la synchronisation")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            onClick={handleSync}
            disabled={isLoading}
            variant="default"
            className="flex items-center gap-2"
        >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            <span>Rechercher les transactions</span>
        </Button>
    )
}
