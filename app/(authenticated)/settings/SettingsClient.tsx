'use client'

import React, { useState, useEffect } from 'react'
import {
    User,
    Lock,
    Palette,
    Bell,
    Shield,
    Check,
    Moon,
    Sun,
    Monitor,
    Smartphone,
    Save,
    CheckCircle2,
    RefreshCw,
    ChefHat,
    CircleDashed,
    KeyRound
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { updateProfile, changePassword } from './actions'
import { toast } from 'sonner'
import { useTheme } from '@/components/ThemeProvider'
import { cn } from '@/lib/utils'

type Theme = 'light' | 'dark' | 'system'

const THEME_COLORS = [
    { name: 'Siwa Classic', primary: '0 72% 51%', accent: '37 92% 50%', isDefault: true },
    { name: 'Midnight Blue', primary: '221 83% 53%', accent: '199 89% 48%' },
    { name: 'Emerald', primary: '142 71% 45%', accent: '160 84% 39%' },
    { name: 'Violet', primary: '262 83% 58%', accent: '270 95% 75%' },
    { name: 'Sunset', primary: '12 76% 50%', accent: '43 96% 56%' },
]

type User = {
    id: string
    name: string | null
    email: string | null
    role: string
}

export function SettingsClient({ user }: { user: User }) {
    const { theme, setTheme } = useTheme()
    const [isLoading, setIsLoading] = useState(false)
    const [mounted, setMounted] = useState(false)

    // Appearance State (Sync with ThemeCustomizer)
    const [activeColor, setActiveColor] = useState(THEME_COLORS[0])
    const [radius, setRadius] = useState('0.5rem')

    // Profile state
    const [name, setName] = useState(user.name || '')
    const [email, setEmail] = useState(user.email || '')

    // Password state
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    useEffect(() => {
        setMounted(true)
        const savedColor = localStorage.getItem('restaurant-os-color')
        const savedRadius = localStorage.getItem('restaurant-os-radius')

        if (savedColor) {
            const parsed = JSON.parse(savedColor)
            setActiveColor(parsed)
        }
        if (savedRadius) {
            setRadius(savedRadius)
        }
    }, [])

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            const res = await updateProfile({ name, email })
            if (res && 'error' in res) {
                toast.error(res.error)
            } else {
                toast.success("Profil mis à jour avec succès")
            }
        } catch (error) {
            toast.error("Erreur serveur")
        }
        setIsLoading(false)
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            return toast.error("Les mots de passe ne correspondent pas")
        }
        setIsLoading(true)
        try {
            const res = await changePassword({ currentPassword, newPassword, confirmPassword })
            if (res && 'error' in res) {
                toast.error(res.error)
            } else {
                toast.success("Mot de passe modifié avec succès")
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
            }
        } catch (error) {
            toast.error("Erreur serveur")
        }
        setIsLoading(false)
    }

    const handleColorChange = (color: typeof THEME_COLORS[0]) => {
        setActiveColor(color)
        localStorage.setItem('restaurant-os-color', JSON.stringify(color))

        const root = document.documentElement
        if (color.isDefault) {
            root.style.removeProperty('--primary')
            root.style.removeProperty('--accent')
            root.style.removeProperty('--ring')
        } else {
            root.style.setProperty('--primary', color.primary)
            root.style.setProperty('--accent', color.accent)
            root.style.setProperty('--ring', color.primary)
        }
        toast.success(`Couleur ${color.name} appliquée`)
    }

    const handleRadiusChange = (newRadius: string) => {
        setRadius(newRadius)
        localStorage.setItem('restaurant-os-radius', newRadius)
        document.documentElement.style.setProperty('--radius', newRadius)
        toast.success("Arrondis mis à jour")
    }

    if (!mounted) return null

    return (
        <div className="max-w-6xl mx-auto space-y-12">
            {/* Header with gradient effect */}
            <div className="relative overflow-hidden p-8 md:p-12 bg-white dark:bg-slate-900 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 blur-[60px] rounded-full -ml-20 -mb-20" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 bg-primary/10 rounded-[24px] flex items-center justify-center text-primary shadow-inner">
                                < ChefHat className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase font-oswald">Paramètres</h1>
                                <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">Configuraion & Compte Personnel</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">Statut: Admin</span>
                        </div>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="profil" className="space-y-8">
                <TabsList className="bg-white/50 dark:bg-slate-950/50 p-1.5 rounded-[24px] border border-slate-200/60 dark:border-slate-800 h-auto grid grid-cols-2 md:inline-flex md:flex-wrap gap-1">
                    <TabsTrigger value="profil" className="rounded-2xl py-3 px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-xl data-[state=active]:text-primary font-black uppercase tracking-widest text-[10px] transition-all">
                        <User className="w-4 h-4 mr-2" /> Profil
                    </TabsTrigger>
                    <TabsTrigger value="securite" className="rounded-2xl py-3 px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-xl data-[state=active]:text-primary font-black uppercase tracking-widest text-[10px] transition-all">
                        <Lock className="w-4 h-4 mr-2" /> Sécurité
                    </TabsTrigger>
                    <TabsTrigger value="apparence" className="rounded-2xl py-3 px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-xl data-[state=active]:text-primary font-black uppercase tracking-widest text-[10px] transition-all">
                        <Palette className="w-4 h-4 mr-2" /> Apparence
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="rounded-2xl py-3 px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-xl data-[state=active]:text-primary font-black uppercase tracking-widest text-[10px] transition-all">
                        <Bell className="w-4 h-4 mr-2" /> Notifications
                    </TabsTrigger>
                </TabsList>

                {/* Profil Content */}
                <TabsContent value="profil" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-2xl font-black tracking-tight">Informations de contact</CardTitle>
                            <CardDescription className="text-slate-500 font-medium">Modifiez vos informations personnelles pour la communication interne.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <form onSubmit={handleUpdateProfile} className="space-y-8 max-w-2xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Nom Complet</Label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                            <Input
                                                id="name"
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                className="h-14 pl-12 rounded-2xl bg-slate-50 dark:bg-slate-950 border-slate-200/60 dark:border-slate-800 focus:ring-4 focus:ring-primary/10 font-bold"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Adresse Email</Label>
                                        <div className="relative group">
                                            <RefreshCw className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                            <Input
                                                id="email"
                                                type="email"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                className="h-14 pl-12 rounded-2xl bg-slate-50 dark:bg-slate-950 border-slate-200/60 dark:border-slate-800 focus:ring-4 focus:ring-primary/10 font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <Button disabled={isLoading} className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black shadow-lg shadow-primary/20">
                                    {isLoading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                                    Enregistrer le profil
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Sécurité Content */}
                <TabsContent value="securite" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden">
                                <CardHeader className="p-8 pb-4">
                                    <CardTitle className="text-2xl font-black tracking-tight">Mot de passe</CardTitle>
                                    <CardDescription className="text-slate-500 font-medium">Nous vous recommandons d'utiliser un mot de passe unique que vous n'utilisez nulle part ailleurs.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <form onSubmit={handleChangePassword} className="space-y-8">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="currentPassword" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Mot de passe actuel</Label>
                                                <Input
                                                    id="currentPassword"
                                                    type="password"
                                                    value={currentPassword}
                                                    onChange={e => setCurrentPassword(e.target.value)}
                                                    className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-950 border-slate-200/60 dark:border-slate-800 font-bold"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label htmlFor="newPassword" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Nouveau mot de passe</Label>
                                                    <Input
                                                        id="newPassword"
                                                        type="password"
                                                        value={newPassword}
                                                        onChange={e => setNewPassword(e.target.value)}
                                                        className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-950 border-slate-200/60 dark:border-slate-800 font-bold"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="confirmPassword" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Confirmer le mot de passe</Label>
                                                    <Input
                                                        id="confirmPassword"
                                                        type="password"
                                                        value={confirmPassword}
                                                        onChange={e => setConfirmPassword(e.target.value)}
                                                        className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-950 border-slate-200/60 dark:border-slate-800 font-bold"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <Button disabled={isLoading} className="h-14 px-8 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white hover:bg-slate-800 dark:hover:bg-slate-200 font-black shadow-lg">
                                            {isLoading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <KeyRound className="w-5 h-5 mr-2" />}
                                            Mettre à jour le mot de passe
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="space-y-8">
                            <Card className="border-none shadow-sm bg-primary/10 rounded-[32px] p-8">
                                <h3 className="font-black text-xl text-primary tracking-tight mb-4 flex items-center gap-3">
                                    <Shield className="w-6 h-6" /> Sécurité du compte
                                </h3>
                                <div className="space-y-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                                        <p>Votre compte est protégé par une authentification par session sécurisée.</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                                        <p>Les mots de passe sont hashés avec l'algorithme BCrypt (Rounds: 12).</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CircleDashed className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                                        <p className="opacity-60 text-[10px] uppercase font-bold tracking-widest mt-2">Dernière connexion: Maintenant</p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* Apparence Content */}
                <TabsContent value="apparence" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden">
                            <CardHeader className="p-8 pb-4">
                                <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                                    <Palette className="w-6 h-6 text-primary" /> Calibrage visuel
                                </CardTitle>
                                <CardDescription className="text-slate-500 font-medium">Personnalisez l'ambiance du tableau de bord selon vos envies.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 space-y-10">
                                {/* Theme Selection */}
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Mode d'affichage</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { id: 'light', icon: Sun, label: 'Clair' },
                                            { id: 'dark', icon: Moon, label: 'Sombre' },
                                            { id: 'system', icon: Monitor, label: 'Auto' },
                                        ].map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => setTheme(t.id as Theme)}
                                                className={cn(
                                                    "flex flex-col items-center justify-center gap-3 p-6 rounded-[24px] border-2 transition-all group",
                                                    theme === t.id
                                                        ? "bg-primary/5 border-primary text-primary"
                                                        : "border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200 dark:hover:border-slate-700"
                                                )}
                                            >
                                                <t.icon className={cn("w-6 h-6", theme === t.id ? "animate-in zoom-in" : "group-hover:scale-110 transition-transform")} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Main Color Selection */}
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Teinte Principale</h3>
                                    <div className="flex flex-wrap gap-4">
                                        {THEME_COLORS.map((color) => {
                                            const isActive = activeColor.name === color.name
                                            return (
                                                <button
                                                    key={color.name}
                                                    onClick={() => handleColorChange(color)}
                                                    className={cn(
                                                        "h-12 w-12 rounded-2xl flex items-center justify-center transition-all hover:scale-110 relative outline-none ring-4 ring-offset-4 ring-offset-white dark:ring-offset-slate-900 shadow-lg",
                                                        isActive ? "ring-primary scale-110" : "ring-transparent opacity-60 hover:opacity-100"
                                                    )}
                                                    style={{ backgroundColor: `hsl(${color.primary})` }}
                                                    title={color.name}
                                                >
                                                    {isActive && <Check className="w-5 h-5 text-white animate-in zoom-in" />}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Custom Radius */}
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Arrondis de l'interface</h3>
                                    <div className="grid grid-cols-4 gap-3">
                                        {[
                                            { id: '0rem', label: 'Carre' },
                                            { id: '0.3rem', label: 'Doux' },
                                            { id: '0.5rem', label: 'Siwa' },
                                            { id: '1rem', label: 'Max' },
                                        ].map((r) => (
                                            <button
                                                key={r.id}
                                                onClick={() => handleRadiusChange(r.id)}
                                                className={cn(
                                                    "h-12 rounded-2xl border-2 transition-all text-[10px] font-black uppercase tracking-widest",
                                                    radius === r.id
                                                        ? "bg-primary/5 border-primary text-primary"
                                                        : "border-slate-100 dark:border-slate-800 text-slate-500"
                                                )}
                                                style={{ borderRadius: r.id }}
                                            >
                                                {r.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Preview Card */}
                        <div className="space-y-8">
                            <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[40px] overflow-hidden relative group">
                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="p-10 space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20">
                                            <ChefHat className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-primary">Aperçu du thème</p>
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none">Siwa OS Platinum</h3>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full w-[70%] bg-primary animate-pulse" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 italic">"Design is not just what it looks like and feels like. Design is how it works."</p>
                                    </div>
                                    <div className="pt-4 flex gap-3">
                                        <Button className="rounded-full h-12 px-8 font-black uppercase tracking-widest text-[10px]">Button Primaire</Button>
                                        <Button variant="outline" className="rounded-full h-12 px-8 font-black uppercase tracking-widest text-[10px]">Détails</Button>
                                    </div>
                                </div>
                            </Card>

                            <div className="p-8 bg-slate-100/50 dark:bg-slate-950/50 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center gap-4">
                                <div className="h-14 w-14 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-sm">
                                    <Smartphone className="w-6 h-6 text-slate-400" />
                                </div>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 max-w-xs">Les réglages d'apparence sont synchronisés sur tous vos appareils via votre navigateur.</p>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Notifications Placeholder */}
                <TabsContent value="notifications" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-[32px] p-12 flex flex-col items-center justify-center text-center gap-6">
                        <div className="h-24 w-24 bg-blue-50 dark:bg-blue-900/20 rounded-[32px] flex items-center justify-center text-blue-500">
                            <Bell className="w-12 h-12" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black tracking-tight">Centre de Notifications</h2>
                            <p className="text-slate-500 font-medium max-w-md">Contrôlez les alertes mail et push pour les stocks, les factures et les rapports RH.</p>
                        </div>
                        <Badge variant="outline" className="bg-blue-50/50 dark:bg-blue-900/30 text-blue-600 border-none font-black text-[10px] uppercase tracking-[0.2em] px-4 py-1.5">Prochainement</Badge>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
