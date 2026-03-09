"use client"

import React, { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Trash2, ExternalLink, FileText, CheckCircle2, AlertTriangle, UploadCloud, Loader2, X, Download, Info, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { markDpaeAsTese } from '@/app/(authenticated)/rh/actions'

interface DocumentAssistantCardProps {
    employeeId: string
    employeeName: string
    docType: string
    documents: any[]
    title: string
    shortDesc?: string
    assistantHelp?: string
    onDeleteDoc: (id: string) => Promise<any>
    onSendEmail?: (docId: string, docName: string) => void
}

export function DocumentAssistantCard({
    employeeId,
    employeeName,
    docType,
    documents,
    title,
    shortDesc = "",
    assistantHelp = "Informations non renseignées.",
    onDeleteDoc,
    onSendEmail
}: DocumentAssistantCardProps) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [droppedFile, setDroppedFile] = useState<File | null>(null)
    const [docName, setDocName] = useState("")
    const [isUploading, setIsUploading] = useState(false)
    const [isMarkingTese, setIsMarkingTese] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Identify if the document is likely present
    const isLikelyPresent = documents.some((d: any) => {
        if (d.type === docType) return true;
        const name = d.name.toLowerCase();
        if (docType === 'ID_CARD' && (d.type === 'RESIDENCE_PERMIT' || name.includes('identi') || name.includes('passeport') || name.includes('titre') || name.includes('séjour') || name.includes('sejour'))) return true;
        if (docType === 'CONTRACT' && name.includes('contrat')) return true;
        if (docType === 'DPAE' && (name.includes('dpae') || name.includes('urssaf'))) return true;
        if (docType === 'MEDICAL' && (name.includes('médical') || name.includes('medical') || name.includes('aptitude'))) return true;
        return false;
    })

    const relevantDocs = documents.filter((d: any) => {
        if (d.type === docType) return true;
        const name = d.name.toLowerCase();
        if (docType === 'ID_CARD' && (d.type === 'RESIDENCE_PERMIT' || name.includes('identi') || name.includes('passeport') || name.includes('titre') || name.includes('séjour') || name.includes('sejour'))) return true;
        if (docType === 'CONTRACT' && name.includes('contrat')) return true;
        if (docType === 'DPAE' && (name.includes('dpae') || name.includes('urssaf'))) return true;
        if (docType === 'MEDICAL' && (name.includes('médical') || name.includes('medical') || name.includes('aptitude'))) return true;
        return false;
    })

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const files = Array.from(e.dataTransfer.files)
        if (files.length > 0) {
            const file = files[0]
            setDroppedFile(file)
            if (!docName) setDocName(file.name.replace(/\.[^.]+$/, ''))
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setDroppedFile(file)
            if (!docName) setDocName(file.name.replace(/\.[^.]+$/, ''))
        }
    }

    const handleUpload = async () => {
        if (!droppedFile || !docName.trim()) {
            toast.error('Sélectionnez un fichier et donnez un nom.')
            return
        }
        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', droppedFile)
            formData.append('userId', employeeId)
            formData.append('name', docName.trim())
            formData.append('type', docType)

            const res = await fetch('/api/rh/upload', {
                method: 'POST',
                body: formData,
            })
            const data = await res.json()
            if (!res.ok || data.error) throw new Error(data.error || 'Erreur serveur')

            toast.success(`✅ Document ajouté.`)
            setDroppedFile(null)
            setDocName('')
            router.refresh()
        } catch (e: any) {
            toast.error(e.message || 'Erreur lors de l\'upload')
        } finally {
            setIsUploading(false)
        }
    }

    const handleMarkTese = async () => {
        setIsMarkingTese(true)
        try {
            const res = await markDpaeAsTese(employeeId)
            if (res && 'success' in res && res.success) {
                toast.success("DPAE validée via TESE")
                router.refresh()
            } else {
                toast.error((res as any)?.error || "Erreur")
            }
        } catch (e) {
            toast.error("Une erreur est survenue")
        } finally {
            setIsMarkingTese(false)
        }
    }

    const handleDelete = async (id: string) => {
        const sure = window.confirm("Supprimer ce document ?")
        if (!sure) return
        await onDeleteDoc(id)
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <div className={`cursor-pointer group relative overflow-hidden flex flex-col items-center gap-3 p-5 rounded-xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${isLikelyPresent ? 'bg-card border-emerald-500/50' : 'bg-muted/30 border-dashed border-amber-500/50 hover:bg-muted/50'}`}>
                    <div className="absolute top-3 right-3">
                        {isLikelyPresent ? (
                            <div className="bg-emerald-500/10 text-emerald-500 p-1 rounded-full">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                        ) : (
                            <div className="bg-amber-500/10 text-amber-500 p-1 rounded-full">
                                <AlertTriangle className="h-4 w-4" />
                            </div>
                        )}
                    </div>

                    <div className={`h-12 w-12 rounded-full flex items-center justify-center border-2 transition-transform duration-500 group-hover:scale-110 ${isLikelyPresent ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-amber-50 border-amber-500 text-amber-600'}`}>
                        {docType === 'ID_CARD' ? <Info className="h-5 w-5" /> :
                            docType === 'DPAE' ? <FileText className="h-5 w-5" /> :
                                docType === 'MEDICAL' ? <span className="text-xl">🏥</span> :
                                    <FileText className="h-5 w-5" />}
                    </div>

                    <div className="text-center space-y-1">
                        <span className={`text-sm font-bold block ${isLikelyPresent ? 'text-foreground' : 'text-amber-700 dark:text-amber-400'}`}>{title}</span>
                        <span className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
                            {relevantDocs.some(d => d.category === 'TESE') ? 'Géré par TESE' : shortDesc}
                        </span>
                    </div>

                    {!isLikelyPresent && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full mt-1">À fournir</span>
                    )}
                </div>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[700px] border-border bg-card shadow-2xl overflow-hidden p-0 gap-0">
                <div className="bg-blue-600/5 border-b border-border p-6 flex flex-col gap-2 relative">
                    <div className="h-12 w-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-inner mb-2">
                        {isLikelyPresent ? <CheckCircle2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                    </div>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-base text-foreground/80">
                        {shortDesc}
                    </DialogDescription>
                </div>

                <div className="p-6 grid md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto">
                    {/* Colonne de gauche: Assistant RH */}
                    <div className="space-y-6">
                        <div className="bg-blue-500/10 text-blue-800 dark:text-blue-300 p-4 rounded-xl text-sm leading-relaxed border border-blue-500/20 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                            <h4 className="font-bold flex items-center gap-2 mb-2 text-blue-700 dark:text-blue-400">
                                <Info className="h-4 w-4" /> L'Assistant RH
                            </h4>
                            <p className="whitespace-pre-line">{assistantHelp}</p>
                        </div>

                        {/* Fichiers déjà présents */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-bold text-foreground flex items-center justify-between">
                                Fichiers enregistrés
                                <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs">{relevantDocs.length}</span>
                            </h4>
                            {relevantDocs.length === 0 ? (
                                <div className="p-4 border border-dashed rounded-lg text-center text-sm text-muted-foreground bg-muted/20">
                                    Aucun fichier présent
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {relevantDocs.map(doc => (
                                        <div key={doc.id} className="flex flex-col gap-2 p-3 bg-card border border-border shadow-sm rounded-lg hover:border-blue-500/50 transition-colors group">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="h-8 w-8 bg-blue-500/10 text-blue-500 rounded flex items-center justify-center shrink-0">
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-foreground truncate" title={doc.name}>{doc.name}</p>
                                                        <p className="text-[10px] text-muted-foreground pr-2">{new Date(doc.createdAt).toLocaleDateString('fr-FR')}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    {onSendEmail && doc.category !== 'TESE' && (
                                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-primary hover:bg-primary/5" onClick={() => onSendEmail(doc.id, doc.name)}>
                                                            <Mail className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 hover:dark:bg-blue-900/40" asChild>
                                                        <a href={doc.url} target="_blank"><Download className="h-3.5 w-3.5" /></a>
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors" onClick={() => handleDelete(doc.id)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {docType === 'DPAE' && relevantDocs.filter(d => d.category === 'TESE').length === 0 && (
                            <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-3">
                                <div className="flex items-start gap-3">
                                    <Info className="h-4 w-4 text-amber-600 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-amber-800">Géré par le TESE ?</p>
                                        <p className="text-[10px] text-amber-700/80 leading-relaxed">Si vous passez par le TESE, ils s'occupent de la DPAE pour vous. Vous pouvez valider cette étape ici sans document.</p>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full h-8 text-[10px] font-black uppercase tracking-widest border-amber-500/30 text-amber-700 hover:bg-amber-500/10"
                                    onClick={handleMarkTese}
                                    disabled={isUploading || isMarkingTese}
                                >
                                    {isMarkingTese ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <CheckCircle2 className="h-3 w-3 mr-2" />}
                                    Valider via TESE
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Colonne de droite: Zone de Drop */}
                    <div className="flex flex-col justify-start space-y-4">
                        <h4 className="font-bold text-sm text-foreground">Ajouter un nouveau fichier</h4>

                        <div
                            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl h-48 flex flex-col items-center justify-center text-center cursor-pointer transition-all select-none ${droppedFile
                                ? 'border-emerald-500 bg-emerald-500/8'
                                : isDragging
                                    ? 'border-blue-500 bg-blue-500/10 scale-[1.02]'
                                    : 'border-border/60 bg-muted/10 hover:bg-muted/30 hover:border-blue-500/50'
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            {droppedFile ? (
                                <>
                                    <div className="h-12 w-12 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-2 shadow-sm">
                                        <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[200px] px-2">
                                        {droppedFile.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {(droppedFile.size / 1024).toFixed(0)} Ko · Cliquez pour changer
                                    </p>
                                </>
                            ) : (
                                <>
                                    <UploadCloud className={`h-10 w-10 mb-3 transition-colors ${isDragging ? 'text-blue-500' : 'text-muted-foreground'}`} />
                                    <p className="text-sm font-bold text-foreground">
                                        {isDragging ? 'Relâchez le document ici...' : 'Glissez votre document ou cliquez'}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-2 max-w-[200px]">
                                        Formats acceptés : PDF, JPG, PNG, DOC (Max: 10 Mo)
                                    </p>
                                </>
                            )}
                        </div>

                        {droppedFile && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="space-y-1">
                                    <label className="text-[11px] uppercase font-bold text-muted-foreground">Nommer ce document</label>
                                    <Input
                                        placeholder="Ex: Titre de séjour recto"
                                        value={docName}
                                        onChange={e => setDocName(e.target.value)}
                                        className="h-10 bg-background"
                                        autoFocus
                                    />
                                </div>
                                <Button
                                    onClick={handleUpload}
                                    disabled={isUploading || !docName.trim()}
                                    className="w-full h-10 font-bold gap-2 text-white bg-blue-600 hover:bg-blue-700 shadow-md"
                                >
                                    {isUploading ? (
                                        <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement Drive...</>
                                    ) : (
                                        <><UploadCloud className="h-4 w-4" /> Envoyer ce document</>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
