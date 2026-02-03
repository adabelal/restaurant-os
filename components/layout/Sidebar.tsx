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
        { href: "/caisse", label: "Caisse", icon: Wallet },
    ]

    return (
        <aside className="hidden md:flex flex-col w-72 h-screen fixed left-0 top-0 border-r bg-background/50 backdrop-blur-xl transition-all duration-300 z-50">
            <div className="flex flex-col h-full">
                {/* Logo Section */}
                <div className="h-20 flex items-center px-8 border-b border-border/40">
                    <Link className="flex items-center gap-3 group" href="/">
                        <div className="h-10 w-10 bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                            <ChefHat className="h-6 w-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                                RestoOS
                            </span>
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Management</span>
                        </div>
                    </Link>
                </div>

                {/* Navigation Section */}
                <div className="flex-1 overflow-y-auto py-8 px-4 custom-scrollbar">
                    <nav className="space-y-1.5">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 relative",
                                        isActive
                                            ? "bg-primary/10 text-primary shadow-[0_0_0_1px_rgba(var(--primary),0.1)]"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200",
                                            isActive ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-muted group-hover:bg-muted-foreground/10"
                                        )}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <span>{item.label}</span>
                                    </div>
                                    {isActive && (
                                        <ChevronRight className="h-4 w-4 opacity-50" />
                                    )}
                                    {isActive && (
                                        <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
                                    )}
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                {/* Bottom Section */}
                <div className="p-4 mt-auto space-y-4 border-t border-border/40 bg-muted/20">
                    <div className="flex items-center justify-between px-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Préférences</p>
                        <ModeToggle />
                    </div>
                    <UserMenu />
                </div>
            </div>
        </aside>
    )
}
