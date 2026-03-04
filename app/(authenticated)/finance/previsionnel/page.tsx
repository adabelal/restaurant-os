import { getForecastData } from "./actions"
import ForecastClient from "./ForecastClient"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Target, Sparkles } from "lucide-react"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: 'Prévisionnel Financier | Restaurant-OS',
    description: 'Anticipez votre trésorerie et vos dépenses futures.',
}

export const dynamic = 'force-dynamic'

export default async function PrevisionnelPage() {
    const forecastData = await getForecastData(3) // Average over last 3 months

    return (
        <div className="flex flex-col min-h-screen bg-[#020617] p-4 md:p-12 space-y-12 max-w-7xl mx-auto font-sans transition-all duration-500">
            {/* Elegant Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-2 w-8 bg-indigo-500 rounded-full" />
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Module Intelligence</span>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-4">
                        Prévisionnel
                        <Sparkles className="h-8 w-8 text-amber-500 animate-pulse" />
                    </h1>
                    <p className="text-slate-500 font-bold text-lg max-w-md leading-tight">
                        Projection intelligente basée sur vos habitudes de dépenses et de revenus.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <Button asChild variant="outline" className="h-14 px-8 rounded-2xl border-2 border-slate-200 dark:border-slate-800 font-black uppercase tracking-widest text-xs hover:bg-slate-950 hover:text-white hover:border-slate-950 transition-all duration-300">
                        <Link href="/finance">
                            <ArrowLeft className="mr-3 h-4 w-4" />
                            Dashboard
                        </Link>
                    </Button>
                    <div className="h-14 px-8 rounded-2xl bg-indigo-600 text-white flex items-center gap-3 shadow-[0_10px_30px_rgba(79,70,229,0.3)]">
                        <Target className="h-5 w-5" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Période Analyse</span>
                            <span className="text-sm font-black leading-none mt-1">Derniers 90 jours</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Interactive UI */}
            <ForecastClient data={forecastData} />

            {/* Footer / Info Section */}
            <div className="pt-12 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-lg ring-1 ring-slate-200/50 dark:ring-white/10">
                        <span className="text-2xl font-black text-indigo-500">OS</span>
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Calcul Dynamique</p>
                        <p className="text-[10px] font-bold text-slate-500 mt-1 max-w-xs">Les données se mettent à jour instantanément suite à un changement de catégorisation ou l'import de nouvelles transactions.</p>
                    </div>
                </div>
                <div className="flex gap-12">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dernière Sync</p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut Algorithme</p>
                        <p className="text-xs font-bold text-emerald-500 mt-1 flex items-center gap-2 justify-end">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                            Optimisé
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
