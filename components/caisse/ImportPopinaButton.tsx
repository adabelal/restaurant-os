"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { importPopinaExcel } from "@/app/caisse/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function ImportPopinaButton() {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const router = useRouter()

    const handleFile = async (file: File) => {
        if (!file.name.endsWith('.xlsx')) {
            toast.error("Veuillez sélectionner un fichier .xlsx")
            return
        }

        setIsLoading(true)
        const formData = new FormData()
        formData.append("file", file)

        try {
            const result = await importPopinaExcel(formData)
            if (result.success) {
                toast.success(`${result.count} transactions importées avec succès !`)
                setIsOpen(false)
                router.refresh()
            } else {
                toast.error(result.error || "Une erreur est survenue lors de l'import")
            }
        } catch (error) {
            toast.error("Erreur de connexion au serveur")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0])
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 transition-all">
                    <FileSpreadsheet className="h-4 w-4" /> Import Popina
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5 text-emerald-600" />
                        Importation automatique Popina
                    </DialogTitle>
                    <DialogDescription>
                        Glissez votre fichier export Popina (XLSX) pour importer automatiquement les recettes en espèces jour par jour.
                    </DialogDescription>
                </DialogHeader>

                <div
                    className={`mt-4 border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all ${dragActive ? "border-emerald-500 bg-emerald-50/50" : "border-slate-200"
                        } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    {isLoading ? (
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
                            <p className="text-sm font-medium animate-pulse">Analyse du fichier en cours...</p>
                        </div>
                    ) : (
                        <>
                            <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                                <FileSpreadsheet className="h-7 w-7 text-emerald-600" />
                            </div>
                            <p className="text-sm font-semibold text-slate-900">Cliquez ou glissez le fichier</p>
                            <p className="text-xs text-slate-500 mt-1">Format accepté : .xlsx uniquement</p>
                            <input
                                type="file"
                                className="hidden"
                                id="popina-upload"
                                accept=".xlsx"
                                onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                            />
                            <Button asChild variant="secondary" className="mt-6" size="sm">
                                <label htmlFor="popina-upload" className="cursor-pointer">Sélectionner un fichier</label>
                            </Button>
                        </>
                    )}
                </div>

                <div className="mt-4 p-4 bg-slate-50 border rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Ce qui sera importé
                    </div>
                    <ul className="text-xs text-slate-600 space-y-1 ml-5 list-disc">
                        <li>Date de fin de shift (heure de clôture)</li>
                        <li>Montant total des <strong>Espèces</strong> (Recettes)</li>
                        <li>Les doublons (même date/montant) seront ignorés</li>
                    </ul>
                </div>
            </DialogContent>
        </Dialog>
    )
}
