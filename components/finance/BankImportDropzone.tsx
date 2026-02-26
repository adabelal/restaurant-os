'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { uploadBankStatement } from "@/app/(authenticated)/finance/import/actions"

export function BankImportDropzone() {
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')


    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0])
            setStatus('idle')
            setProgress(0)
        }
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.ms-excel': ['.xls', '.xlsx'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
        },
        maxFiles: 1
    })

    const handleUpload = async () => {
        if (!file) return

        setUploading(true)
        setProgress(20) // Fake progress start

        try {
            const formData = new FormData()
            formData.append('file', file)

            // Simulate progress for UX
            const interval = setInterval(() => {
                setProgress(prev => Math.min(prev + 10, 90))
            }, 200)

            const result = await uploadBankStatement(formData)

            clearInterval(interval)
            setProgress(100)

            if (result.success) {
                setStatus('success')
                toast.success(`Import réussi: ${result.count} transactions importées.`)
            } else {
                setStatus('error')
                toast.error(result.error || "Une erreur est survenue lors de l'import.")
            }
        } catch (error) {
            console.error(error)
            setStatus('error')
            toast.error("Erreur de connexion au serveur.")
        } finally {
            setUploading(false)
        }
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return (
        <Card className="w-full max-w-2xl mx-auto border-dashed border-2">
            <CardHeader>
                <CardTitle>Importer un relevé bancaire</CardTitle>
                <CardDescription>
                    Glissez-déposez votre fichier CSV ou Excel ici.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div
                    {...getRootProps()}
                    className={`
                        flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-xl cursor-pointer transition-colors
                        ${isDragActive ? 'border-primary bg-primary/5' : 'border-slate-200 hover:bg-slate-50'}
                    `}
                >
                    <input {...getInputProps()} />

                    {file ? (
                        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                            <FileText className="h-12 w-12 text-primary mb-4" />
                            <p className="text-lg font-medium text-slate-900">{file.name}</p>
                            <p className="text-sm text-slate-500">{formatFileSize(file.size)}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <UploadCloud className="h-12 w-12 text-slate-400 mb-4" />
                            <p className="text-lg font-medium text-slate-700">
                                {isDragActive ? "Déposez le fichier ici" : "Cliquez ou glissez un fichier"}
                            </p>
                            <p className="text-sm text-slate-400 mt-2">
                                CSV, XLS, XLSX acceptés
                            </p>
                        </div>
                    )}
                </div>

                {uploading && (
                    <div className="mt-6 space-y-2">
                        <div className="flex justify-between text-sm text-slate-600">
                            <span>Traitement en cours...</span>
                            <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                )}

                {status === 'success' && !uploading && (
                    <div className="mt-6 flex items-center p-4 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 animate-in slide-in-from-bottom-2">
                        <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                        <div>
                            <p className="font-medium">Import terminé avec succès !</p>
                            <p className="text-sm opacity-90">Vos transactions ont été ajoutées.</p>
                        </div>
                    </div>
                )}

                {status === 'error' && !uploading && (
                    <div className="mt-6 flex items-center p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 animate-in slide-in-from-bottom-2">
                        <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                        <div>
                            <p className="font-medium">Échec de l'import</p>
                            <p className="text-sm opacity-90">Veuillez vérifier le format du fichier.</p>
                        </div>
                    </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                    {status === 'success' && (
                        <Button variant="outline" onClick={() => { setFile(null); setStatus('idle'); }}>
                            Importer un autre
                        </Button>
                    )}
                    <Button
                        onClick={handleUpload}
                        disabled={!file || uploading || status === 'success'}
                        className="w-full sm:w-auto"
                    >
                        {uploading ? "Traitement..." : "Lancer l'analyse"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
