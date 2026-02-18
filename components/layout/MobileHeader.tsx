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
    UtensilsCrossed
} from "lucide-react"
import { ModeToggle } from "@/components/ModeToggle"
import { UserMenu } from "@/components/layout/UserMenu"
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
        { href: "/caisse", label: "Caisse", icon: Wallet },
    ]

    return (
        <>
            <header className="md:hidden sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsOpen(true)}
                            className="mr-2 -ml-2 text-muted-foreground hover:text-primary"
                        >
                            <Menu className="h-6 w-6" />
                        </Button>
                        <Link className="flex items-center gap-2 group" href="/">
                            <div className="h-8 w-8 bg-gradient-to-br from-red-700 via-primary to-red-900 rounded-lg flex items-center justify-center text-white shadow-md shadow-primary/20">
                                <ChefHat className="h-5 w-5 text-amber-400" />
                            </div>
                            <span className="font-oswald font-bold text-lg tracking-wide uppercase">
                                LE <span className="text-primary">SIWA</span>
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2">
                        <ModeToggle />
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
                "fixed inset-y-0 left-0 z-50 w-full max-w-[280px] bg-background border-r shadow-2xl transition-transform duration-300 ease-in-out transform md:hidden",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    <div className="flex h-16 items-center justify-between px-6 border-b bg-card/50">
                        <span className="font-oswald font-bold text-lg uppercase tracking-wide">Menu</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsOpen(false)}
                            className="rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
                        <nav className="space-y-2">
                            {navItems.map((item) => {
                                const Icon = item.icon
                                const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={cn(
                                            "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-oswald font-medium uppercase tracking-wide transition-all duration-200 relative overflow-hidden",
                                            isActive
                                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 relative z-10">
                                            <Icon className={cn("h-5 w-5", isActive ? "text-amber-400" : "text-muted-foreground")} />
                                            <span>{item.label}</span>
                                        </div>
                                        {isActive && <ChevronRight className="h-4 w-4 text-amber-400 relative z-10" />}
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>

                    <div className="p-6 border-t bg-muted/20">
                        <p className="text-xs text-center text-muted-foreground font-oswald tracking-widest uppercase">
                            Le Siwa Resto OS
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}
