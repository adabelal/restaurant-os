
'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react"
import { importBankCsvAction } from '@/app/(authenticated)/finance/actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function ImportBankCsvDialog() {
    const [file, setFile] = useState<File | null>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<{ imported: number, duplicates: number } | null>(null)
    const router = useRouter()

    async function handleImport() {
        if (!file) return

        setIsLoading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const result = await importBankCsvAction(formData)
            if (result.success && result.data) {
                setResult(result.data)
                toast.success(`Import terminé : ${result.data.imported} nouvelles, ${result.data.duplicates} doublons ignorés.`)
                router.refresh()
            } else {
                toast.error("Erreur lors de l'import : " + result.error)
            }
        } catch (e) {
            toast.error("Erreur système lors de l'import")
        } finally {
            setIsLoading(false)
        }
    }

    const reset = () => {
        setFile(null)
        setResult(null)
        setIsOpen(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="default" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-semibold">
                    <Upload className="mr-2 h-4 w-4" />
                    Import CSV (Banque)
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-6 w-6 text-indigo-600" />
                        Importer Relevé CSV
                    </DialogTitle>
                    <DialogDescription>
                        Fichier exporté depuis votre banque (max 90 jours).
                        <br />
                        <span className="text-xs text-slate-500">Le système détectera et ignorera automatiquement les doublons.</span>
                    </DialogDescription>
                </DialogHeader>

                {!result ? (
                    <div className="space-y-4 py-4">
                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                            <Input
                                type="file"
                                accept=".csv"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                            {file ? (
                                <>
                                    <FileSpreadsheet className="h-10 w-10 text-emerald-500 mb-2" />
                                    <p className="text-sm font-medium text-slate-900">{file.name}</p>
                                    <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                                </>
                            ) : (
                                <>
                                    <Upload className="h-10 w-10 text-slate-300 mb-2" />
                                    <p className="text-sm font-medium text-slate-600">Glissez ou cliquez pour sélectionner</p>
                                    <p className="text-xs text-slate-400">Format .CSV uniquement</p>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="py-6 space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                            <CheckCircle className="h-5 w-5" />
                            <div>
                                <p className="font-bold">{result.imported} transactions importées</p>
                                <p className="text-xs opacity-80">Nouvelles lignes ajoutées.</p>
                            </div>
                        </div>
                        {result.duplicates > 0 && (
                            <div className="flex items-center gap-3 p-4 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
                                <AlertCircle className="h-5 w-5" />
                                <div>
                                    <p className="font-bold">{result.duplicates} doublons ignorés</p>
                                    <p className="text-xs opacity-80">Déjà présents en base.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter className="sm:justify-between items-center">
                    {!result ? (
                        <>
                            <Button variant="ghost" onClick={() => setIsOpen(false)}>Annuler</Button>
                            <Button onClick={handleImport} disabled={!file || isLoading} className="bg-indigo-600">
                                {isLoading ? "Analyse en cours..." : "Lancer l'Import"}
                            </Button>
                        </>
                    ) : (
                        <Button onClick={reset} className="w-full bg-slate-900 text-white">Fermer</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
