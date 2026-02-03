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
    ChevronRight
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
        <header className="md:hidden sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
            <div className="flex h-16 items-center justify-between px-4">
                <Link className="flex items-center gap-2 group" href="/">
                    <div className="h-8 w-8 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                        <ChefHat className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">RestoOS</span>
                </Link>

                <div className="flex items-center gap-2">
                    <ModeToggle />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsOpen(true)}
                        className="rounded-full"
                    >
                        <Menu className="h-6 w-6" />
                    </Button>
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Mobile Sidebar Content */}
            <div className={cn(
                "fixed inset-y-0 right-0 z-50 w-full max-w-xs bg-background border-l shadow-2xl transition-transform duration-300 ease-in-out transform",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    <div className="flex h-16 items-center justify-between px-6 border-b">
                        <span className="font-bold text-lg">Menu</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsOpen(false)}
                            className="rounded-full"
                        >
                            <X className="h-6 w-6" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto py-6 px-4">
                        <nav className="space-y-1.5">
                            {navItems.map((item) => {
                                const Icon = item.icon
                                const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={cn(
                                            "flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-medium transition-all duration-200",
                                            isActive
                                                ? "bg-primary/10 text-primary shadow-[0_0_0_1px_rgba(var(--primary),0.1)]"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "flex items-center justify-center w-9 h-9 rounded-lg",
                                                isActive ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-muted"
                                            )}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <span>{item.label}</span>
                                        </div>
                                        {isActive && <ChevronRight className="h-4 w-4 opacity-50" />}
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>

                    <div className="p-6 border-t bg-muted/20">
                        <UserMenu />
                    </div>
                </div>
            </div>
        </header>
    )
}
