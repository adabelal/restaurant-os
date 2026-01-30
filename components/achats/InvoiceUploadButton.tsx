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
import { Upload, FileText, Loader2, ScanLine, Bot } from "lucide-react"
import { processUploadedInvoice } from "@/app/achats/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function InvoiceUploadButton() {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [mode, setMode] = useState<'scan' | 'manual'>('scan')
    const router = useRouter()

    const handleFile = async (file: File) => {
        // Validate types (Images or PDF)
        const validTypes = ['application/pdf', 'image/jpeg', 'image/png']
        if (!validTypes.includes(file.type)) {
            toast.error("Format non supporté. Utilisez PDF, JPG ou PNG.")
            return
        }

        setIsLoading(true)
        const formData = new FormData()
        formData.append("file", file)

        try {
            const result = await processUploadedInvoice(formData)
            if (result.success) {
                toast.success(result.message)
                // setIsOpen(false) // Keep open to show results later
                // router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error("Erreur d'envoi")
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
                <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                    <ScanLine className="h-4 w-4" /> Scanner une facture
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-indigo-600" />
                        Analyse Intelligente de Facture
                    </DialogTitle>
                    <DialogDescription>
                        Importez vos factures (PDF, Photo). L'IA extraira automatiquement les produits, prix et quantités.
                    </DialogDescription>
                </DialogHeader>

                <div
                    className={`mt-4 border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all ${dragActive ? "border-indigo-500 bg-indigo-50/50" : "border-slate-200"
                        } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    {isLoading ? (
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
                            <p className="text-sm font-medium animate-pulse text-indigo-600">Lecture de la facture en cours...</p>
                            <p className="text-xs text-slate-400">Extraction des articles et prix...</p>
                        </div>
                    ) : (
                        <>
                            <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4 shadow-sm">
                                <FileText className="h-8 w-8 text-indigo-600" />
                            </div>
                            <p className="text-sm font-bold text-slate-800">Glissez votre facture ici</p>
                            <p className="text-xs text-slate-500 mt-1 mb-4 text-center px-8">
                                Accepte les PDF multipages et les photos (JPG, PNG).
                            </p>

                            <input
                                type="file"
                                className="hidden"
                                id="invoice-upload"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                            />
                            <Button asChild variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                                <label htmlFor="invoice-upload" className="cursor-pointer">Parcourir les fichiers</label>
                            </Button>
                        </>
                    )}
                </div>

                <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-start gap-3">
                        <div className="bg-white p-1.5 rounded-md shadow-sm border">
                            <span className="text-lg">⚡️</span>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Traitement en Lot</h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Vous avez beaucoup de factures ? Contactez-nous pour configurer un dossier Google Drive synchronisé.
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
