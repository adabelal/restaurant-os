"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, ShoppingCart, ChefHat, BarChart3, Package, Wallet, Camera, ChevronRight, Music } from "lucide-react"
import { ModeToggle } from "@/components/ModeToggle"
import { UserMenu } from "@/components/layout/UserMenu"
import { ThemeCustomizer } from "@/components/ThemeCustomizer"
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
        { href: "/music", label: "Musique & Live", icon: Music },
    ]

    return (
        <aside className="hidden md:flex flex-col w-72 h-screen fixed left-0 top-0 border-r border-border/40 bg-background/80 backdrop-blur-xl z-50 transition-colors duration-500">
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-500 fill-mode-both">
                {/* Logo Section */}
                <div className="h-24 flex items-center px-8">
                    <Link className="flex items-center gap-3 group" href="/">
                        <div className="h-12 w-12 bg-gradient-to-br from-primary via-primary/80 to-accent rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:rotate-3 transition-transform duration-300">
                            <ChefHat className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-oswald font-bold text-xl tracking-wide text-foreground uppercase leading-none transition-colors">
                                LE <span className="text-primary">SIWA</span>
                            </span>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold mt-1">Resto OS</span>
                        </div>
                    </Link>
                </div>

                {/* Navigation Section */}
                <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
                    <nav className="space-y-1.5">
                        {navItems.map((item, index) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-oswald font-medium uppercase tracking-wide transition-all duration-300 relative overflow-hidden",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                            : "text-muted-foreground hover:text-foreground hover:bg-primary/5 dark:hover:bg-primary/10"
                                    )}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    {isActive && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
                                    )}
                                    <div className="flex items-center gap-3 relative z-10 transition-transform group-hover:translate-x-1 duration-300">
                                        <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
                                        <span>{item.label}</span>
                                    </div>
                                    {isActive && (
                                        <div className="h-4 w-4 rounded-full bg-white/20 relative z-10 flex flex-col items-center justify-center animate-in zoom-in duration-300">
                                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                        </div>
                                    )}
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                {/* Bottom Section */}
                <div className="p-4 mt-auto space-y-4 border-t border-border/40 bg-muted/20 backdrop-blur-sm">
                    <div className="flex items-center justify-between px-2 bg-background/50 p-2 rounded-xl backdrop-blur border border-border/30">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] pl-1">Réglages</p>
                        <div className="flex items-center gap-1">
                            <ThemeCustomizer />
                        </div>
                    </div>
                    <UserMenu />
                </div>
            </div>
        </aside>
    )
}
