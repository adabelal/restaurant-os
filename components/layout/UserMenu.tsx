"use client"

import { signOut, useSession } from "next-auth/react"
import { LogOut, User, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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
        <div className="bg-muted dark:bg-zinc-900/50 p-2 sm:p-4 rounded-xl space-y-3">
            <div className="flex items-center gap-2 sm:gap-3 px-1">
                <div className="h-9 w-9 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                    <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0 hidden xs:block">
                    <p className="text-sm font-black text-foreground truncate uppercase font-oswald tracking-tight">
                        {session.user.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate opacity-70 font-bold uppercase tracking-widest">
                        {session.user.role || 'Admin'}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Link href="/settings" className="flex-1">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="w-full h-9 rounded-lg shadow-sm border border-border/50 hover:bg-primary/10 hover:text-primary transition-all duration-300"
                        title="Réglages"
                    >
                        <Settings2 className="h-4 w-4" />
                    </Button>
                </Link>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 rounded-lg shrink-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-300 border border-transparent hover:border-red-100"
                    title="Déconnexion"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                >
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
