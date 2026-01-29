import Link from "next/link"
import { Users, ShoppingCart, ChefHat, BarChart3, Package, Wallet } from "lucide-react"
import { ModeToggle } from "@/components/ModeToggle"

export function Sidebar() {
    return (
        <div className="hidden border-r bg-card md:block w-64 min-h-screen fixed left-0 top-0 bottom-0 transition-colors duration-300">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-[80px] items-center justify-between border-b px-6">
                    <Link className="flex items-center gap-2 font-bold" href="/">
                        <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                            <ChefHat className="h-5 w-5" />
                        </div>
                        <span className="text-foreground tracking-tight">RestoOS</span>
                    </Link>
                    <ModeToggle />
                </div>
                <div className="flex-1 overflow-auto py-6">
                    <nav className="grid items-start px-4 text-sm font-medium gap-1">
                        <Link
                            className="flex items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground transition-all hover:text-foreground hover:bg-muted dark:hover:bg-zinc-800/50"
                            href="/"
                        >
                            <BarChart3 className="h-4 w-4" />
                            Tableau de Bord
                        </Link>
                        <Link
                            className="flex items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground transition-all hover:text-foreground hover:bg-muted dark:hover:bg-zinc-800/50"
                            href="/rh"
                        >
                            <Users className="h-4 w-4" />
                            RH & Équipe
                        </Link>
                        <Link
                            className="flex items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground transition-all hover:text-foreground hover:bg-muted dark:hover:bg-zinc-800/50"
                            href="/stock"
                        >
                            <Package className="h-4 w-4" />
                            Stock & Ingrédients
                        </Link>
                        <Link
                            className="flex items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground transition-all hover:text-foreground hover:bg-muted dark:hover:bg-zinc-800/50"
                            href="/achats"
                        >
                            <ShoppingCart className="h-4 w-4" />
                            Achats & Factures
                        </Link>
                        <Link
                            className="flex items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground transition-all hover:text-foreground hover:bg-muted dark:hover:bg-zinc-800/50"
                            href="/caisse"
                        >
                            <Wallet className="h-4 w-4" />
                            Caisse
                        </Link>
                    </nav>
                </div>
                <div className="p-4 border-t mt-auto">
                    <div className="bg-muted dark:bg-zinc-900/50 p-4 rounded-xl">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Espace</p>
                        <p className="text-xs font-bold text-foreground">Restaurant Principal</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
