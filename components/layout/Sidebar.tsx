"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, ShoppingCart, ChefHat, BarChart3, Package, Wallet, Camera, ChevronRight } from "lucide-react"
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
        { href: "/finance", label: "Finance & Pilotage", icon: BarChart3 },
        { href: "/caisse", label: "Caisse", icon: Wallet },
    ]

    return (
        <aside className="hidden md:flex flex-col w-72 h-screen fixed left-0 top-0 border-r border-border bg-background/95 backdrop-blur-md z-50">
            <div className="flex flex-col h-full">
                {/* Logo Section */}
                <div className="h-24 flex items-center px-8 border-b border-border bg-card/50">
                    <Link className="flex items-center gap-3 group" href="/">
                        <div className="h-12 w-12 bg-gradient-to-br from-red-700 via-primary to-red-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:rotate-3 transition-all duration-300">
                            <ChefHat className="h-7 w-7 text-amber-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-oswald font-bold text-xl tracking-wide text-foreground uppercase leading-none">
                                LE <span className="text-primary">SIWA</span>
                            </span>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold mt-1">Resto OS</span>
                        </div>
                    </Link>
                </div>

                {/* Navigation Section */}
                <div className="flex-1 overflow-y-auto py-8 px-4 custom-scrollbar">
                    <nav className="space-y-2">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-oswald font-medium uppercase tracking-wide transition-all duration-300 relative overflow-hidden",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    )}
                                >
                                    {isActive && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
                                    )}
                                    <div className="flex items-center gap-3 relative z-10">
                                        <Icon className={cn("h-5 w-5", isActive ? "text-amber-400" : "text-muted-foreground group-hover:text-primary")} />
                                        <span>{item.label}</span>
                                    </div>
                                    {isActive && (
                                        <ChevronRight className="h-4 w-4 text-amber-400 relative z-10" />
                                    )}
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                {/* Bottom Section */}
                <div className="p-4 mt-auto space-y-4 border-t border-border bg-muted/30">
                    <div className="flex items-center justify-between px-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Système</p>
                        <ModeToggle />
                    </div>
                    <UserMenu />
                </div>
            </div>
        </aside>
    )
}
