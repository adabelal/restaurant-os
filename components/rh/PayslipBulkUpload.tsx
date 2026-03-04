'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FileText, Upload, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp, Users } from 'lucide-react'
import { toast } from 'sonner'

interface Employee {
    id: string
    name: string
    isActive: boolean
}

interface PayslipBulkUploadProps {
    employees: Employee[]
}

type FileStatus = 'pending' | 'matched' | 'uploading' | 'done' | 'error' | 'unmatched'

interface FileEntry {
    file: File
    status: FileStatus
    matchedEmployee: Employee | null
    errorMsg?: string
    driveUrl?: string
}

// Tente de matcher un nom de fichier avec un employé
function matchFileToEmployee(fileName: string, employees: Employee[]): Employee | null {
    const lower = fileName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    for (const emp of employees) {
        const nameParts = emp.name.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .split(' ')
        // Si tous les mots du nom sont dans le fichier → match
        const allMatch = nameParts.every(part => lower.includes(part))
        if (allMatch) return emp
    }
    return null
}

export function PayslipBulkUpload({ employees }: PayslipBulkUploadProps) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [isDragging, setIsDragging] = React.useState(false)
    const [files, setFiles] = React.useState<FileEntry[]>([])
    const [bulkMonth, setBulkMonth] = React.useState(new Date().getMonth().toString())
    const [bulkYear, setBulkYear] = React.useState(new Date().getFullYear().toString())
    const [isUploading, setIsUploading] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const activeEmployees = employees.filter(e => e.isActive)

    const processFiles = (newFiles: File[]) => {
        const entries: FileEntry[] = newFiles.map(file => {
            const matched = matchFileToEmployee(file.name, activeEmployees)
            return {
                file,
                status: matched ? 'matched' : 'unmatched',
                matchedEmployee: matched,
            }
        })
        setFiles(prev => [...prev, ...entries])
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const dropped = Array.from(e.dataTransfer.files).filter(f =>
            ['application/pdf', 'image/jpeg', 'image/png'].includes(f.type)
        )
        processFiles(dropped)
    }

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) processFiles(Array.from(e.target.files))
    }

    const removeFile = (idx: number) => {
        setFiles(prev => prev.filter((_, i) => i !== idx))
    }

    const reassign = (idx: number, empId: string) => {
        const emp = activeEmployees.find(e => e.id === empId) || null
        setFiles(prev => prev.map((f, i) => i === idx
            ? { ...f, matchedEmployee: emp, status: emp ? 'matched' : 'unmatched' }
            : f
        ))
    }

    const uploadAll = async () => {
        const toUpload = files.filter(f => f.matchedEmployee && f.status !== 'done')
        if (toUpload.length === 0) {
            toast.error('Aucun fichier avec employé associé à uploader')
            return
        }
        setIsUploading(true)

        for (let i = 0; i < files.length; i++) {
            const entry = files[i]
            if (!entry.matchedEmployee || entry.status === 'done') continue

            setFiles(prev => prev.map((f, idx) =>
                idx === i ? { ...f, status: 'uploading' } : f
            ))

            try {
                const formData = new FormData()
                formData.append('file', entry.file)
                formData.append('userId', entry.matchedEmployee.id)
                formData.append('name', `Fiche de paie`)
                formData.append('type', 'PAYSLIP')
                formData.append('month', (parseInt(bulkMonth) + 1).toString())
                formData.append('year', bulkYear)

                const res = await fetch('/api/rh/upload', { method: 'POST', body: formData })
                const data = await res.json()

                if (!res.ok || data.error) throw new Error(data.error)

                setFiles(prev => prev.map((f, idx) =>
                    idx === i ? { ...f, status: 'done', driveUrl: data.url } : f
                ))
            } catch (e: any) {
                setFiles(prev => prev.map((f, idx) =>
                    idx === i ? { ...f, status: 'error', errorMsg: e.message } : f
                ))
            }
        }

        setIsUploading(false)
        const doneCount = files.filter(f => f.status === 'done').length
        toast.success(`${toUpload.length} fiche(s) uploadée(s) vers Google Drive ✅`)
    }

    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

    const statusColor = {
        pending: 'bg-muted text-muted-foreground',
        matched: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        uploading: 'bg-amber-500/10 text-amber-500',
        done: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        error: 'bg-red-500/10 text-red-500',
        unmatched: 'bg-orange-500/10 text-orange-500',
    }

    const matchedCount = files.filter(f => f.matchedEmployee).length
    const unmatchedCount = files.filter(f => !f.matchedEmployee).length
    const doneCount = files.filter(f => f.status === 'done').length

    return (
        <Card className="border-amber-500/20 bg-amber-500/5 shadow-sm">
            <CardHeader
                className="pb-3 cursor-pointer select-none"
                onClick={() => setIsOpen(v => !v)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-amber-500/20 text-amber-500 rounded-lg flex items-center justify-center">
                            <Users className="h-4 w-4" />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-bold text-foreground">
                                Envoi mensuel des fiches de paie
                            </CardTitle>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                Déposez toutes les fiches d'un coup — association automatique par nom
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {files.length > 0 && (
                            <Badge className="bg-amber-500 text-white border-none text-[10px]">
                                {files.length} fichier{files.length > 1 ? 's' : ''}
                            </Badge>
                        )}
                        {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                </div>
            </CardHeader>

            {isOpen && (
                <CardContent className="space-y-4 pt-0">
                    {/* Sélecteur période */}
                    <div className="flex gap-2">
                        <select
                            value={bulkMonth}
                            onChange={e => setBulkMonth(e.target.value)}
                            className="flex-1 h-8 text-xs border border-input rounded px-2 bg-background text-foreground"
                        >
                            {monthNames.map((m, i) => (
                                <option key={i} value={i.toString()}>{m}</option>
                            ))}
                        </select>
                        <Input
                            type="number" min="2000" max="2100"
                            value={bulkYear}
                            onChange={e => setBulkYear(e.target.value)}
                            className="w-24 h-8 text-xs bg-background"
                            placeholder="Année"
                        />
                    </div>

                    {/* Zone Drag & Drop */}
                    <div
                        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all select-none ${isDragging
                                ? 'border-amber-500 bg-amber-500/10 scale-[1.01]'
                                : 'border-amber-500/20 bg-background/50 hover:bg-background/80 hover:border-amber-500/40'
                            }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={handleFileInput}
                        />
                        <Upload className={`h-7 w-7 mb-2 ${isDragging ? 'text-amber-500' : 'text-amber-400'}`} />
                        <p className="text-xs font-medium text-foreground">
                            {isDragging ? 'Relâchez pour ajouter...' : 'Glissez toutes les fiches'}
                        </p>
                        <p className="text-[9px] text-muted-foreground mt-1">
                            PDF, JPG · Nommez les fichiers avec le nom du salarié pour auto-association
                        </p>
                    </div>

                    {/* Stats */}
                    {files.length > 0 && (
                        <div className="flex gap-3 text-[10px] font-bold">
                            <span className="text-blue-500">{matchedCount} associé{matchedCount > 1 ? 's' : ''}</span>
                            {unmatchedCount > 0 && <span className="text-orange-500">{unmatchedCount} non identifié{unmatchedCount > 1 ? 's' : ''}</span>}
                            {doneCount > 0 && <span className="text-emerald-500">{doneCount} uploadé{doneCount > 1 ? 's' : ''}</span>}
                        </div>
                    )}

                    {/* Liste des fichiers */}
                    {files.length > 0 && (
                        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                            {files.map((entry, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-2 p-2 border border-border rounded-lg bg-background text-xs"
                                >
                                    {/* Icône statut */}
                                    <div className="shrink-0">
                                        {entry.status === 'done' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                        {entry.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                                        {entry.status === 'uploading' && <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />}
                                        {(entry.status === 'matched' || entry.status === 'pending') && <FileText className="h-4 w-4 text-blue-400" />}
                                        {entry.status === 'unmatched' && <FileText className="h-4 w-4 text-orange-400" />}
                                    </div>

                                    {/* Nom fichier */}
                                    <span className="truncate flex-1 font-medium text-foreground" title={entry.file.name}>
                                        {entry.file.name}
                                    </span>

                                    {/* Association employé */}
                                    {entry.status !== 'done' ? (
                                        <select
                                            value={entry.matchedEmployee?.id || ''}
                                            onChange={e => reassign(i, e.target.value)}
                                            className="h-6 text-[10px] border border-input rounded px-1 bg-background text-foreground max-w-[120px]"
                                        >
                                            <option value="">-- Non associé --</option>
                                            {activeEmployees.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <Badge className="text-[9px] bg-emerald-500/10 text-emerald-600 border-none">
                                            {entry.matchedEmployee?.name}
                                        </Badge>
                                    )}

                                    {/* Lien drive si done */}
                                    {entry.status === 'done' && entry.driveUrl && (
                                        <a href={entry.driveUrl} target="_blank" className="text-[9px] text-blue-500 hover:underline shrink-0">
                                            Drive
                                        </a>
                                    )}

                                    {/* Supprimer */}
                                    {entry.status !== 'done' && entry.status !== 'uploading' && (
                                        <button
                                            onClick={() => removeFile(i)}
                                            className="shrink-0 text-muted-foreground hover:text-red-500 transition-colors"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Boutton global upload */}
                    {files.length > 0 && (
                        <Button
                            onClick={uploadAll}
                            disabled={isUploading || matchedCount === 0}
                            className="w-full h-9 text-xs font-bold gap-2 bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50"
                        >
                            {isUploading ? (
                                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Upload en cours…</>
                            ) : (
                                <><Upload className="h-3.5 w-3.5" /> Envoyer {matchedCount} fiche{matchedCount > 1 ? 's' : ''} → Drive</>
                            )}
                        </Button>
                    )}
                </CardContent>
            )}
        </Card>
    )
}
