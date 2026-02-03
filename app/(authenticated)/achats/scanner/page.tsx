"use client"

import React, { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Camera, FileSearch, X, AlertCircle, Loader2, Save, ShoppingCart,
    ChevronLeft, RefreshCcw, Sparkles
} from "lucide-react"
import { processInvoice, saveScannedInvoice } from "../actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function InvoiceScannerPage() {
    const [image, setImage] = useState<string | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [results, setResults] = useState<any>(null)
    const [isSaving, setIsSaving] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setImage(reader.result as string)
                analyzeImage(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const analyzeImage = async (base64: string) => {
        setIsAnalyzing(true)
        setResults(null)
        try {
            const res = await processInvoice(base64)
            if (res.success) {
                setResults(res.data)
                toast.success("Analyse terminée !")
            } else {
                toast.error(res.error || "Erreur lors de l'analyse.")
            }
        } catch (error) {
            toast.error("Une erreur est survenue lors de l'analyse.")
        } finally {
            setIsAnalyzing(false)
        }
    }

    const handleSave = async () => {
        if (!results) return
        setIsSaving(true)
        try {
            const res = await saveScannedInvoice(results)
            if (res.success) {
                toast.success("Facture enregistrée avec succès !")
                router.push("/achats")
                router.refresh()
            } else {
                toast.error(res.error || "Erreur lors de l'enregistrement.")
            }
        } catch (error) {
            toast.error("Erreur d'enregistrement.")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="flex flex-col p-6 md:p-10 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Button variant="ghost" size="sm" className="-ml-3 mb-2 text-muted-foreground hover:text-foreground" asChild>
                        <Link href="/achats">
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Retour
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Camera className="h-8 w-8 text-primary" />
                        </div>
                        Scanner Intelligent
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium">Capturez vos factures, l'intelligence artificielle s'occupe du reste.</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Zone de Capture */}
                <Card className="relative overflow-hidden border-none shadow-2xl bg-card transition-all duration-300 min-h-[500px] flex flex-col group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />

                    {!image ? (
                        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                                <div className="relative h-28 w-28 bg-gradient-to-br from-primary to-blue-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/40 rotate-3 transform transition-transform group-hover:rotate-0 duration-500">
                                    <Camera className="h-12 w-12" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg border-4 border-card">
                                    <Sparkles className="h-5 w-5" />
                                </div>
                            </div>

                            <div className="space-y-3 max-w-xs">
                                <h3 className="text-2xl font-bold">Prêt pour le scan ?</h3>
                                <p className="text-muted-foreground font-medium">Placez votre document bien à plat avec un bon éclairage.</p>
                            </div>

                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />

                            <Button
                                size="lg"
                                onClick={() => fileInputRef.current?.click()}
                                className="h-16 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 group"
                            >
                                <Camera className="mr-3 h-6 w-6 transition-transform group-hover:scale-110" />
                                Photographier maintenant
                            </Button>

                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">ou glissez-déposez un fichier</p>
                        </div>
                    ) : (
                        <div className="relative z-10 flex-1 flex flex-col">
                            <div className="relative flex-1 bg-muted/30 overflow-hidden">
                                <img src={image} className="absolute inset-0 w-full h-full object-contain" alt="Scan" />

                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                                    <Button
                                        variant="secondary"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="rounded-xl font-bold"
                                    >
                                        <RefreshCcw className="mr-2 h-4 w-4" /> Changer l'image
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => { setImage(null); setResults(null) }}
                                        className="rounded-xl font-bold"
                                    >
                                        <X className="mr-2 h-4 w-4" /> Annuler
                                    </Button>
                                </div>
                            </div>
                            {isAnalyzing && (
                                <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-8">
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 animate-pulse" />
                                        <Loader2 className="h-16 w-16 text-primary animate-spin relative" />
                                    </div>
                                    <div className="text-center space-y-2">
                                        <h4 className="text-xl font-bold animate-pulse">Analyse Gemini IA...</h4>
                                        <p className="text-muted-foreground font-medium">Extraction des données en cours</p>
                                    </div>
                                    {/* Scanning Line Animation */}
                                    <div className="absolute top-0 left-0 w-full h-1 bg-primary/40 shadow-[0_0_15px_rgba(var(--primary),0.8)] animate-scan-slow z-30 pointer-events-none" />
                                </div>
                            )}
                        </div>
                    )}
                </Card>

                {/* Zone de Résultats */}
                <Card className={cn(
                    "overflow-hidden border-none shadow-2xl bg-card transition-all duration-500",
                    results ? "opacity-100 translate-y-0" : "opacity-70 translate-y-4"
                )}>
                    <CardHeader className="bg-muted/30 border-b p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-background rounded-lg shadow-sm">
                                    <FileSearch className="h-5 w-5 text-primary" />
                                </div>
                                <CardTitle className="text-xl font-bold">Données Extraites</CardTitle>
                            </div>
                            {results && (
                                <div className="flex items-center gap-1 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-bold ring-1 ring-emerald-500/20">
                                    <Sparkles className="h-3 w-3" /> Confiant
                                </div>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="p-8">
                        {!results && !isAnalyzing ? (
                            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 text-muted-foreground">
                                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                                    <AlertCircle className="h-8 w-8" />
                                </div>
                                <div className="max-w-xs space-y-1">
                                    <p className="font-bold text-foreground">Aucune donnée pour l'instant</p>
                                    <p className="text-sm">Les résultats de l'analyse IA apparaîtront ici après la capture.</p>
                                </div>
                            </div>
                        ) : results ? (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Fournisseur</Label>
                                        <Input
                                            value={results.supplierName || ''}
                                            onChange={(e) => setResults({ ...results, supplierName: e.target.value })}
                                            className="h-12 rounded-xl bg-muted/30 border-none font-bold focus-visible:ring-primary/20 transition-all focus-visible:bg-muted/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Référence Facture</Label>
                                        <Input
                                            value={results.invoiceNo || ''}
                                            onChange={(e) => setResults({ ...results, invoiceNo: e.target.value })}
                                            className="h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20 transition-all focus-visible:bg-muted/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Date d'émission</Label>
                                        <Input
                                            type="date"
                                            value={results.date || ''}
                                            onChange={(e) => setResults({ ...results, date: e.target.value })}
                                            className="h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20 transition-all focus-visible:bg-muted/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Montant Total TTC</Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={results.totalAmount || 0}
                                                onChange={(e) => setResults({ ...results, totalAmount: parseFloat(e.target.value) })}
                                                className="h-12 rounded-xl bg-primary/5 border-none font-black text-primary text-xl pl-4 pr-10 focus-visible:ring-primary/20 transition-all focus-visible:bg-primary/10"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-primary">€</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between ml-1">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Détails des articles</Label>
                                        <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-full">{results.items?.length || 0} détectés</span>
                                    </div>
                                    <div className="rounded-2xl border bg-background/50 backdrop-blur-sm divide-y overflow-hidden shadow-inner max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {results.items?.length > 0 ? (
                                            results.items.map((item: any, i: number) => (
                                                <div key={i} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{item.name}</span>
                                                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Code: {item.code || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-xs font-bold py-1 px-2 bg-muted rounded-lg">{item.quantity} {item.unit}</span>
                                                        <span className="font-black text-sm tabular-nums">{(item.totalPrice || 0).toFixed(2)}€</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center text-muted-foreground text-sm italic">Aucun article détaillé reconnu.</div>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold gap-3 shadow-xl shadow-emerald-500/10 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                            Enregistrement...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-6 w-6" />
                                            Valider & Enregistrer l'Achat
                                        </>
                                    )}
                                </Button>
                            </div>
                        ) : isAnalyzing && (
                            <div className="py-20 flex flex-col items-center justify-center text-center space-y-6 text-muted-foreground animate-pulse">
                                <div className="h-20 w-20 bg-primary/10 rounded-[2rem] flex items-center justify-center">
                                    <FileSearch className="h-10 w-10 text-primary" />
                                </div>
                                <div className="space-y-2">
                                    <p className="font-bold text-foreground">Traitement IA en cours</p>
                                    <p className="text-sm">Veuillez patienter pendant que nous analysons chaque ligne de votre facture.</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
