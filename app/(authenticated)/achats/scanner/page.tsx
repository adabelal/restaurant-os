"use client"

import React, { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Camera, FileSearch, X, AlertCircle, Loader2, Save, ShoppingCart
} from "lucide-react"
import { processInvoice, saveScannedInvoice } from "../actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

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
        <div className="flex flex-col min-h-screen bg-slate-50/50 p-6 gap-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                        <ShoppingCart className="h-6 w-6 text-blue-600" /> Scanner Intelligent
                    </h1>
                    <p className="text-sm text-slate-500">Posez votre facture à plat et capturez-la</p>
                </div>
            </header>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Zone de Capture */}
                <Card className="border-none shadow-sm overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
                    {!image ? (
                        <div className="p-12 text-center space-y-6">
                            <div className="h-20 w-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                                <Camera className="h-10 w-10" />
                            </div>
                            <div className="space-y-2">
                                <p className="font-bold text-slate-900">Pas encore d'image</p>
                                <p className="text-sm text-slate-500">Cliquez pour photographier une facture</p>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                            <Button size="lg" className="bg-blue-600 w-full gap-2 rounded-xl" onClick={() => fileInputRef.current?.click()}>
                                <Camera className="h-5 w-5" /> Photographier
                            </Button>
                        </div>
                    ) : (
                        <div className="relative w-full h-full group min-h-[400px]">
                            <img src={image} className="w-full h-full object-contain bg-slate-900" alt="Scan" />
                            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="destructive" size="sm" onClick={() => { setImage(null); setResults(null) }} className="gap-2 w-full">
                                    <X className="h-4 w-4" /> Annuler & Refaire
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Zone de Résultats */}
                <Card className="border-none shadow-sm overflow-hidden flex flex-col">
                    <CardHeader className="bg-white border-b py-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Informations Extraites</CardTitle>
                            {isAnalyzing && (
                                <span className="flex items-center gap-2 text-xs font-bold text-blue-600 animate-pulse">
                                    <Loader2 className="h-3 w-3 animate-spin" /> IA en action...
                                </span>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 flex-1">
                        {isAnalyzing ? (
                            <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400 py-20">
                                <FileSearch className="h-12 w-12 animate-bounce" />
                                <p className="text-sm">Gemini 1.5 Flash déchiffre le document...</p>
                            </div>
                        ) : results ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase font-bold text-slate-400">Fournisseur</Label>
                                        <Input value={results.supplierName || ''} onChange={(e) => setResults({ ...results, supplierName: e.target.value })} className="font-bold border-none bg-slate-100/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase font-bold text-slate-400">N° Facture</Label>
                                        <Input value={results.invoiceNo || ''} onChange={(e) => setResults({ ...results, invoiceNo: e.target.value })} className="border-none bg-slate-100/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase font-bold text-slate-400">Date</Label>
                                        <Input type="date" value={results.date || ''} onChange={(e) => setResults({ ...results, date: e.target.value })} className="border-none bg-slate-100/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase font-bold text-slate-400">Total TTC</Label>
                                        <Input type="number" step="0.01" value={results.totalAmount || 0} onChange={(e) => setResults({ ...results, totalAmount: parseFloat(e.target.value) })} className="font-black text-blue-600 text-lg border-none bg-blue-50" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-bold text-slate-400">Articles détectés</Label>
                                    <div className="border rounded-xl divide-y bg-white overflow-hidden max-h-[250px] overflow-y-auto">
                                        {results.items?.length > 0 ? (
                                            results.items.map((item: any, i: number) => (
                                                <div key={i} className="p-3 text-[11px] flex items-center justify-between hover:bg-slate-50">
                                                    <span className="font-medium text-slate-700 truncate w-2/3">{item.name}</span>
                                                    <span className="font-bold text-slate-900">{(item.totalPrice || 0).toFixed(2)}€</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-slate-400 text-xs italic">Aucun article détaillé.</div>
                                        )}
                                    </div>
                                </div>

                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 rounded-xl gap-2 font-bold shadow-lg shadow-emerald-100 transition-all active:scale-95" onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                    Valider & Enregistrer l'Achat
                                </Button>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-300 py-20">
                                <AlertCircle className="h-10 w-10" />
                                <p className="text-sm">Uploadez une image pour débuter l'analyse</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
