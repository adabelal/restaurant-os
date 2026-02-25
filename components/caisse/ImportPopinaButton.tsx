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
            const result = await importPopinaExcel(formData) as any
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
                <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/10 hover:text-primary transition-all">
                    <FileSpreadsheet className="h-4 w-4" /> Import Popina
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-foreground">
                        <Upload className="h-5 w-5 text-primary" />
                        Importation automatique Popina
                    </DialogTitle>
                    <DialogDescription>
                        Glissez votre fichier export Popina (XLSX) pour importer automatiquement les recettes en espèces jour par jour.
                    </DialogDescription>
                </DialogHeader>

                <div
                    className={`mt-4 border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all ${dragActive ? "border-primary bg-primary/5" : "border-border"
                        } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    {isLoading ? (
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-10 w-10 text-primary animate-spin" />
                            <p className="text-sm font-medium animate-pulse text-foreground">Analyse du fichier en cours...</p>
                        </div>
                    ) : (
                        <>
                            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <FileSpreadsheet className="h-7 w-7 text-primary" />
                            </div>
                            <p className="text-sm font-semibold text-foreground">Cliquez ou glissez le fichier</p>
                            <p className="text-xs text-muted-foreground mt-1">Format accepté : .xlsx uniquement</p>
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

                <div className="mt-4 p-4 bg-muted/30 border border-border rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        <CheckCircle2 className="h-3 w-3 text-primary" /> Ce qui sera importé
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-5 list-disc">
                        <li>Date de fin de shift (heure de clôture)</li>
                        <li>Montant total des <strong>Espèces</strong> (Recettes)</li>
                        <li>Les doublons (même date/montant) seront ignorés</li>
                    </ul>
                </div>
            </DialogContent>
        </Dialog>
    )
}
