'use client'

import React from 'react'
import { Card } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface MobileStatCardProps {
    icon: LucideIcon
    label: string
    value: string | number
    subLabel?: string
    variant?: 'default' | 'primary' | 'blue'
}

export function MobileStatCard({ icon: Icon, label, value, subLabel, variant = 'default' }: MobileStatCardProps) {
    const colorClasses = {
        default: 'text-muted-foreground bg-muted/50',
        primary: 'text-primary bg-primary/10',
        blue: 'text-blue-500 bg-blue-500/10'
    }

    return (
        <Card className="rounded-2xl bg-card p-4 shadow-sm border border-border/50 hover:border-primary/20 transition-colors">
            <div className="flex items-center gap-2 mb-2.5">
                <div className={`p-1.5 rounded-lg ${colorClasses[variant]}`}>
                    <Icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">{label}</span>
            </div>
            <p className="text-2xl font-black text-foreground tracking-tight">{value}</p>
            {subLabel && (
                <p className="text-[11px] text-muted-foreground mt-1 font-medium opacity-80">{subLabel}</p>
            )}
        </Card>
    )
}
