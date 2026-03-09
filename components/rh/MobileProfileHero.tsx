'use client'

import React from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Phone, Mail, Check } from "lucide-react"

interface MobileProfileHeroProps {
    employee: any
}

export function MobileProfileHero({ employee }: MobileProfileHeroProps) {
    return (
        <div className="flex p-6 flex-col items-center bg-card shadow-sm border-b border-border/50 sm:hidden">
            <div className="relative">
                <div className="bg-muted aspect-square rounded-full h-28 w-28 border-4 border-primary/20 flex items-center justify-center text-4xl font-bold text-muted-foreground shadow-lg overflow-hidden">
                    {employee.name.charAt(0).toUpperCase()}
                </div>
                {employee.isActive && (
                    <div className="absolute bottom-1 right-1 h-7 w-7 bg-primary border-4 border-card rounded-full flex items-center justify-center shadow-md">
                        <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                )}
            </div>
            <div className="mt-5 flex flex-col items-center text-center space-y-2">
                <h1 className="text-2xl font-black tracking-tight text-foreground">{employee.name}</h1>
                <div className="flex items-center gap-2">
                    <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase px-2 rounded-lg">
                        {employee.isActive ? "Actif" : "Archivé"}
                    </Badge>
                    <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                        {employee.role} • {employee.contractType || 'CDI'}
                    </span>
                </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="mt-8 flex w-full gap-4">
                <Button
                    className="flex-1 rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 h-12 font-bold gap-2"
                    asChild
                >
                    <a href={`tel:${employee.phone}`}>
                        <Phone className="h-4 w-4" />
                        Appeler
                    </a>
                </Button>
                <Button
                    variant="outline"
                    className="flex-1 rounded-2xl border-primary/20 text-primary h-12 font-bold gap-2 bg-background hover:bg-primary/5"
                    asChild
                >
                    <a href={`mailto:${employee.email}`}>
                        <Mail className="h-4 w-4" />
                        Message
                    </a>
                </Button>
            </div>
        </div>
    )
}
