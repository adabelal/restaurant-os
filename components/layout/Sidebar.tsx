"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, ShoppingCart, ChefHat, BarChart3, Package, Wallet, Camera } from "lucide-react"
import { ModeToggle } from "@/components/ModeToggle"
import { UserMenu } from "@/components/layout/UserMenu"
import { cn } from "@/lib/utils"

export function Sidebar() {
    const pathname = usePathname()

    const navItems = [
        { href: "/", label: "Tableau de Bord", icon: BarChart3 },
        { href: "/rh", label: "RH & Équipe", icon: Users },
        { href: "/stock", label: "Stock & Ingrédients", icon: Package },
        { href: "/achats", label: "Achats & Factures", icon: ShoppingCart },
        { href: "/achats/scanner", label: "Scanner Intelligent", icon: Camera },
        { href: "/caisse", label: "Caisse", icon: Wallet },
    ]

    return (
        <div className="hidden border-r bg-card md:block w-64 min-h-screen fixed left-0 top-0 bottom-0 transition-colors duration-300">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-[80px] items-center justify-between border-b px-6">
                    <Link className="flex items-center gap-2 font-bold" href="/">
                        <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-100">
                            <ChefHat className="h-5 w-5" />
                        </div>
                        <span className="text-foreground tracking-tight">RestoOS</span>
                    </Link>
                    <ModeToggle />
                </div>
                <div className="flex-1 overflow-auto py-6">
                    <nav className="grid items-start px-4 text-sm font-medium gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200",
                                        isActive
                                            ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100/50"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    )}
                                >
                                    <Icon className={cn("h-4 w-4", isActive ? "text-blue-600" : "")} />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>
                </div>
                <div className="p-4 border-t mt-auto">
                    <UserMenu />
                </div>
            </div>
        </div>
    )
}
