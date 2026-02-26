'use client'

import React, { useEffect, useState } from 'react'
import { Check, Palette, Settings2, Minimize2, MoveRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { useTheme } from '@/components/ThemeProvider'
import { cn } from '@/lib/utils'

const THEME_COLORS = [
    { name: 'Siwa Classic', primary: '0 72% 51%', accent: '37 92% 50%', isDefault: true },
    { name: 'Midnight Blue', primary: '221 83% 53%', accent: '199 89% 48%' },
    { name: 'Emerald', primary: '142 71% 45%', accent: '160 84% 39%' },
    { name: 'Violet', primary: '262 83% 58%', accent: '270 95% 75%' },
    { name: 'Sunset', primary: '12 76% 50%', accent: '43 96% 56%' },
]

export function ThemeCustomizer() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [activeColor, setActiveColor] = useState(THEME_COLORS[0])
    const [radius, setRadius] = useState('0.5rem') // 0.5rem is default lg radius

    // Hydration
    useEffect(() => {
        setMounted(true)
        const savedColor = localStorage.getItem('restaurant-os-color')
        const savedRadius = localStorage.getItem('restaurant-os-radius')

        if (savedColor) {
            const parsed = JSON.parse(savedColor)
            setActiveColor(parsed)
            applyColor(parsed.primary, parsed.accent)
        }
        if (savedRadius) {
            setRadius(savedRadius)
            document.documentElement.style.setProperty('--radius', savedRadius)
        }
    }, [])

    const applyColor = (primary: string, accent: string) => {
        const root = document.documentElement
        root.style.setProperty('--primary', primary)
        root.style.setProperty('--accent', accent)
        root.style.setProperty('--ring', primary)
    }

    const handleColorChange = (color: typeof THEME_COLORS[0]) => {
        setActiveColor(color)
        localStorage.setItem('restaurant-os-color', JSON.stringify(color))

        if (color.isDefault) {
            document.documentElement.style.removeProperty('--primary')
            document.documentElement.style.removeProperty('--accent')
            document.documentElement.style.removeProperty('--ring')
        } else {
            applyColor(color.primary, color.accent)
        }
    }

    const handleRadiusChange = (newRadius: string) => {
        setRadius(newRadius)
        localStorage.setItem('restaurant-os-radius', newRadius)
        document.documentElement.style.setProperty('--radius', newRadius)
    }

    if (!mounted) return null

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative group w-9 h-9 overflow-hidden transition-all duration-300 hover:bg-primary/10">
                    <Settings2 className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="sr-only">Personnaliser</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[340px] p-6 bg-background/95 backdrop-blur-xl border-border/40 space-y-8">
                <div>
                    <h2 className="font-oswald uppercase tracking-wider text-xl flex items-center gap-2 mb-2">
                        <Palette className="w-5 h-5 text-primary" />
                        Personnalisation
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Adaptez l'interface à vos préférences. Les changements sont sauvegardés.
                    </p>
                </div>

                <div className="space-y-8 flex-1">
                    {/* Thème (Light/Dark) */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Apparence</h3>
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                variant={theme === 'light' ? 'default' : 'outline'}
                                className={cn("w-full transition-all", theme === 'light' ? 'shadow-lg shadow-primary/20' : '')}
                                size="sm"
                                onClick={() => setTheme('light')}
                            >
                                Clair
                            </Button>
                            <Button
                                variant={theme === 'dark' ? 'default' : 'outline'}
                                className={cn("w-full transition-all", theme === 'dark' ? 'shadow-lg shadow-primary/20' : '')}
                                size="sm"
                                onClick={() => setTheme('dark')}
                            >
                                Sombre
                            </Button>
                            <Button
                                variant={theme === 'system' ? 'default' : 'outline'}
                                className={cn("w-full transition-all", theme === 'system' ? 'shadow-lg shadow-primary/20' : '')}
                                size="sm"
                                onClick={() => setTheme('system')}
                            >
                                Auto
                            </Button>
                        </div>
                    </div>

                    {/* Couleurs */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Couleur Principale</h3>
                        <div className="grid grid-cols-5 gap-3">
                            {THEME_COLORS.map((color) => {
                                const isActive = activeColor.name === color.name
                                return (
                                    <button
                                        key={color.name}
                                        onClick={() => handleColorChange(color)}
                                        className={cn(
                                            "h-10 w-10 rounded-full flex items-center justify-center transition-all hover:scale-110 relative outline-none ring-2 ring-offset-2 ring-offset-background",
                                            isActive ? "ring-primary scale-110 shadow-lg" : "ring-transparent shadow-sm hover:shadow-md"
                                        )}
                                        style={{ backgroundColor: `hsl(${color.primary})` }}
                                        title={color.name}
                                    >
                                        {isActive && <Check className="w-5 h-5 text-white" />}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Rayon des bordures */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Arrondis</h3>
                        <div className="grid grid-cols-4 gap-2">
                            {['0rem', '0.3rem', '0.5rem', '1rem'].map((r) => {
                                const isActive = radius === r
                                return (
                                    <Button
                                        key={r}
                                        variant={isActive ? 'default' : 'outline'}
                                        onClick={() => handleRadiusChange(r)}
                                        className={cn(
                                            "w-full transition-all",
                                            isActive ? "shadow-md shadow-primary/20" : "",
                                            r === '1rem' ? 'rounded-2xl' : r === '0.5rem' ? 'rounded-lg' : r === '0.3rem' ? 'rounded-md' : 'rounded-none'
                                        )}
                                        size="sm"
                                    >
                                        {r === '1rem' ? 'Max' : r === '0.5rem' ? 'Normal' : r === '0.3rem' ? 'Petit' : 'Aucun'}
                                    </Button>
                                )
                            })}
                        </div>
                    </div>

                </div>
            </PopoverContent>
        </Popover>
    )
}
