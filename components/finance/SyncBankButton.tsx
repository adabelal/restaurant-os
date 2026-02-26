
"use client"

import { useState, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Landmark, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface SyncBankButtonProps {
    label?: string;
    icon?: ReactNode;
}

export function SyncBankButton({ label = "Sync Banque", icon }: SyncBankButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleConnect = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/finance/bank/connect')
            const data = await res.json()

            if (data.url) {
                // Redirect user to Enable Banking
                window.location.href = data.url
            } else {
                toast.error(data.error || "Impossible de démarrer la connexion")
            }
        } catch (error) {
            toast.error("Erreur technique lors de la connexion")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            onClick={handleConnect}
            disabled={isLoading}
            variant="outline"
            className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 shadow-sm"
        >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (icon || <Landmark className="h-4 w-4" />)}
            <span>{label}</span>
        </Button>
    )
}

