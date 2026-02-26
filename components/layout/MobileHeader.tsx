"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Users,
    ShoppingCart,
    ChefHat,
    BarChart3,
    Package,
    Wallet,
    Camera,
    Menu,
    X,
    ChevronRight,
    UtensilsCrossed,
    Music
} from "lucide-react"
import { ModeToggle } from "@/components/ModeToggle"
import { UserMenu } from "@/components/layout/UserMenu"
import { ThemeCustomizer } from "@/components/ThemeCustomizer"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function MobileHeader() {
    const [isOpen, setIsOpen] = useState(false)
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
        <>
            <header className="md:hidden sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl transition-colors duration-500">
                <div className="flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsOpen(true)}
                            className="mr-1 -ml-2 text-muted-foreground hover:text-primary transition-colors"
                        >
                            <Menu className="h-6 w-6" />
                        </Button>
                        <Link className="flex items-center gap-2 group" href="/">
                            <div className="h-8 w-8 bg-gradient-to-br from-primary via-primary/80 to-accent rounded-lg flex items-center justify-center text-white shadow-md shadow-primary/20 group-hover:rotate-3 transition-transform duration-300">
                                <ChefHat className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-oswald font-bold text-lg tracking-wide uppercase">
                                LE <span className="text-primary">SIWA</span>
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <ThemeCustomizer />
                        <UserMenu />
                    </div>
                </div>
            </header>

            {/* Mobile Sidebar Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Mobile Sidebar Content */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 w-full max-w-[280px] bg-background/95 backdrop-blur-xl border-r border-border/40 shadow-2xl transition-transform duration-300 ease-in-out transform md:hidden",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    <div className="flex h-16 items-center justify-between px-6 border-b border-border/40">
                        <span className="font-oswald font-bold text-lg uppercase tracking-wide">Menu</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsOpen(false)}
                            className="rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
                        <nav className="space-y-1.5">
                            {navItems.map((item, index) => {
                                const Icon = item.icon
                                const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={cn(
                                            "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-oswald font-medium uppercase tracking-wide transition-all duration-300 relative overflow-hidden",
                                            isActive
                                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                                : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
                                        )}
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <div className="flex items-center gap-3 relative z-10">
                                            <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
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

                    <div className="p-4 mt-auto border-t border-border/40 bg-muted/20 backdrop-blur-sm">
                        <div className="flex items-center justify-between px-2 bg-background/50 p-2 rounded-xl backdrop-blur border border-border/30">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] pl-1">Thème Global</p>
                            <ModeToggle />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
