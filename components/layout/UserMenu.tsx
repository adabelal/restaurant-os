"use client"

import { signOut, useSession } from "next-auth/react"
import { LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"

export function UserMenu() {
    const { data: session, status } = useSession()

    if (status === "loading") {
        return (
            <div className="bg-muted dark:bg-zinc-900/50 p-4 rounded-xl animate-pulse">
                <div className="h-3 w-16 bg-muted-foreground/20 rounded mb-2" />
                <div className="h-4 w-24 bg-muted-foreground/20 rounded" />
            </div>
        )
    }

    if (!session?.user) {
        return null
    }

    return (
        <div className="bg-muted dark:bg-zinc-900/50 p-2 sm:p-4 rounded-xl space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-9 sm:w-9 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0 hidden xs:block">
                    <p className="text-sm font-medium text-foreground truncate">
                        {session.user.name}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate opacity-70">
                        {session.user.email}
                    </p>
                </div>
            </div>
            <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start sm:justify-center lg:justify-start text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 sm:h-9 px-2"
                onClick={() => signOut({ callbackUrl: "/login" })}
            >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="xs:inline hidden">Déconnexion</span>
            </Button>
        </div>
    )
}
