
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Database, Loader2 } from "lucide-react"
import { importMusicDataV2 } from "../actions"
import { toast } from "sonner"

export function ImportMusicButton({ csvContent }: { csvContent: string }) {
    const [loading, setLoading] = useState(false)

    const handleImport = async () => {
        if (!confirm("Voulez-vous vraiment importer les données ? Cela écrasera les concerts existants.")) return

        setLoading(true)
        try {
            const result = await importMusicDataV2(csvContent)
            if (result.success) {
                toast.success(`Importation réussie ! ${result.eventCount} concerts ajoutés.`)
                window.location.reload()
            } else {
                toast.error(`Erreur: ${result.error}`)
            }
        } catch (e) {
            toast.error("Une erreur imprévue est survenue.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleImport}
            disabled={loading}
            className="text-xs bg-amber-500/10 hover:bg-amber-500 hover:text-white border-amber-500/30 transition-all font-bold"
        >
            {loading ? (
                <>
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    Importation...
                </>
            ) : (
                <>
                    <Database className="w-3 h-3 mr-2" />
                    Synchroniser CSV
                </>
            )}
        </Button>
    )
}
