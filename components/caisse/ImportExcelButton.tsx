'use client'

import React, { useRef, useState } from 'react'
import { Button } from "@/components/ui/button"
import { FileSpreadsheet, Loader2 } from "lucide-react"
import { importCaisseFromExcel } from "@/app/caisse/actions"
import { toast } from "sonner"

export function ImportExcelButton() {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isImporting, setIsImporting] = useState(false)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsImporting(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const result = await importCaisseFromExcel(formData)
            if (result.success) {
                toast.success(`Importation réussie : ${result.count} transactions ajoutées.`)
            } else {
                toast.error(`Erreur lors de l'import : ${result.error}`)
            }
        } catch (error) {
            toast.error("Une erreur inattendue est survenue.")
        } finally {
            setIsImporting(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx"
                className="hidden"
            />
            <Button
                variant="outline"
                className="text-xs h-10 border-dashed hover:bg-slate-50 dark:hover:bg-zinc-800"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
            >
                {isImporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                )}
                {isImporting ? "Importation..." : "Import Excel"}
            </Button>
        </>
    )
}
