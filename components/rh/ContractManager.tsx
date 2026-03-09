'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    FileText, Plus, Loader2, ExternalLink, Trash2,
    CheckCircle2, Clock, AlertCircle, Edit2, Save, X
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ContractDoc {
    id: string
    name: string
    url: string
    type: string
    month: number | null
    year: number | null
    createdAt: string
}

interface ContractManagerProps {
    employeeId: string
    employeeName: string
    contractType: string   // CDI, CDD, EXTRA, APPRENTI
    contractDuration: string // FULL_TIME, PART_TIME
    documents: ContractDoc[]
}

// Tente de parser infos depuis le nom du fichier
function parseContractName(fileName: string): {
    type?: string
    startYear?: string
    startMonth?: string
    label?: string
} {
    const lower = fileName.toLowerCase()
    const result: ReturnType<typeof parseContractName> = {}

    if (lower.includes('cdi')) result.type = 'CDI'
    else if (lower.includes('cdd')) result.type = 'CDD'
    else if (lower.includes('extra')) result.type = 'EXTRA'
    else if (lower.includes('apprenti') || lower.includes('alternance')) result.type = 'APPRENTI'

    // Chercher une année 20xx
    const yearMatch = fileName.match(/20\d{2}/)
    if (yearMatch) result.startYear = yearMatch[0]

    // Chercher un mois
    const monthMatch = fileName.match(/[_\-\/\s](0?[1-9]|1[0-2])[_\-\/\s]/)
    if (monthMatch) result.startMonth = monthMatch[1].padStart(2, '0')

    // Label propre
    result.label = fileName.replace(/\.[^.]+$/, '').replace(/[_\-]/g, ' ').trim()

    return result
}

type ContractStatus = 'ACTIF' | 'EXPIRE' | 'SUSPENDU'

function getContractStatus(doc: ContractDoc): ContractStatus {
    if (!doc.year) return 'ACTIF'
    const docYear = doc.year
    const now = new Date()
    if (docYear < now.getFullYear()) return 'EXPIRE'
    if (docYear === now.getFullYear() && doc.month && doc.month < now.getMonth() + 1) return 'EXPIRE'
    return 'ACTIF'
}

const CONTRACT_TYPE_LABELS: Record<string, string> = {
    CDI: 'CDI', CDD: 'CDD', EXTRA: 'Extra', APPRENTI: 'Apprentissage', OTHER: 'Autre'
}

export function ContractManager({
    employeeId, employeeName, contractType, contractDuration, documents
}: ContractManagerProps) {
    const router = useRouter()

    const [isDragging, setIsDragging] = React.useState(false)
    const [droppedFile, setDroppedFile] = React.useState<File | null>(null)
    const [isUploading, setIsUploading] = React.useState(false)
    const [showForm, setShowForm] = React.useState(false)
    const [editingId, setEditingId] = React.useState<string | null>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    // Form state — pré-rempli en drop
    const [formLabel, setFormLabel] = React.useState('')
    const [formType, setFormType] = React.useState(contractType || 'CDI')
    const [formStartMonth, setFormStartMonth] = React.useState('')
    const [formStartYear, setFormStartYear] = React.useState(new Date().getFullYear().toString())
    const [formEndMonth, setFormEndMonth] = React.useState('')
    const [formEndYear, setFormEndYear] = React.useState('')
    const [formStatus, setFormStatus] = React.useState<ContractStatus>('ACTIF')

    const contracts = documents.filter(d => d.type === 'CONTRACT')

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const files = Array.from(e.dataTransfer.files)
        if (files.length > 0) {
            const file = files[0]
            setDroppedFile(file)
            prefillFromFile(file)
            setShowForm(true)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setDroppedFile(file)
            prefillFromFile(file)
            setShowForm(true)
        }
    }

    const prefillFromFile = (file: File) => {
        const parsed = parseContractName(file.name)
        if (parsed.label) setFormLabel(parsed.label)
        if (parsed.type) setFormType(parsed.type)
        if (parsed.startYear) setFormStartYear(parsed.startYear)
        if (parsed.startMonth) setFormStartMonth(parsed.startMonth)
    }

    const handleUpload = async () => {
        if (!droppedFile) { toast.error('Sélectionnez un fichier'); return }
        if (!formLabel.trim()) { toast.error('Donnez un nom au contrat'); return }

        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', droppedFile)
            formData.append('userId', employeeId)
            formData.append('name', `${formLabel} (${formType})`)
            formData.append('type', 'CONTRACT')
            if (formStartMonth) formData.append('month', formStartMonth)
            if (formStartYear) formData.append('year', formStartYear)

            const res = await fetch('/api/rh/upload', { method: 'POST', body: formData })
            const data = await res.json()
            if (!res.ok || data.error) throw new Error(data.error)

            toast.success(`✅ Contrat "${formLabel}" ajouté → Drive`)
            resetForm()
            router.refresh()
        } catch (e: any) {
            toast.error(e.message || 'Erreur upload')
        } finally {
            setIsUploading(false)
        }
    }

    const resetForm = () => {
        setDroppedFile(null)
        setShowForm(false)
        setFormLabel('')
        setFormType(contractType || 'CDI')
        setFormStartMonth('')
        setFormStartYear(new Date().getFullYear().toString())
        setFormEndMonth('')
        setFormEndYear('')
        setFormStatus('ACTIF')
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const statusBadge = (status: ContractStatus) => {
        const map = {
            ACTIF: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
            EXPIRE: 'bg-muted text-muted-foreground border-border',
            SUSPENDU: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
        }
        const icons = {
            ACTIF: <CheckCircle2 className="h-3 w-3" />,
            EXPIRE: <Clock className="h-3 w-3" />,
            SUSPENDU: <AlertCircle className="h-3 w-3" />,
        }
        return (
            <Badge className={`text-[10px] flex items-center gap-1 border ${map[status]}`}>
                {icons[status]} {status}
            </Badge>
        )
    }

    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

    return (
        <div className="space-y-4">
            {/* ─── Historique des contrats ── */}
            <Card className="border-border shadow-sm bg-card">
                <CardHeader className="bg-muted/20 border-b border-border pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-bold text-foreground">
                            Historique des contrats
                        </CardTitle>
                        <Badge className="bg-blue-600 text-white border-none text-[10px]">
                            {contracts.length}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {contracts.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            Aucun contrat enregistré — déposez un fichier ci-dessous
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {contracts
                                .sort((a, b) => (b.year || 0) - (a.year || 0))
                                .map(doc => {
                                    const status = getContractStatus(doc)
                                    const dateLabel = doc.year
                                        ? `${doc.month ? monthNames[doc.month - 1] + ' ' : ''}${doc.year}`
                                        : 'Date inconnue'
                                    return (
                                        <div
                                            key={doc.id}
                                            className={`flex items-center gap-3 p-3 group hover:bg-muted/30 transition-colors ${status === 'ACTIF' ? 'bg-emerald-500/3' : ''
                                                }`}
                                        >
                                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${status === 'ACTIF' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'
                                                }`}>
                                                <FileText className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-foreground truncate">{doc.name}</p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    Depuis {dateLabel}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {statusBadge(status)}
                                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" asChild>
                                                    <a href={doc.url} target="_blank"><ExternalLink className="h-3.5 w-3.5" /></a>
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ─── Zone Upload nouveau contrat ── */}
            <Card className="border-indigo-500/20 bg-indigo-500/5 shadow-sm">
                <CardHeader className="pb-3 border-b border-indigo-500/10">
                    <CardTitle className="text-sm text-indigo-500 flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Ajouter un contrat
                    </CardTitle>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                        Glissez le PDF → les infos seront pré-remplies depuis le nom du fichier
                    </p>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                    {/* Drop zone */}
                    <div
                        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all select-none ${droppedFile
                            ? 'border-emerald-500 bg-emerald-500/8'
                            : isDragging
                                ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                                : 'border-indigo-500/20 bg-background/50 hover:bg-background/80 hover:border-indigo-500/40'
                            }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        {droppedFile ? (
                            <>
                                <FileText className="h-6 w-6 text-emerald-500 mb-1.5" />
                                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[200px]">
                                    {droppedFile.name}
                                </p>
                                <p className="text-[9px] text-muted-foreground mt-0.5">
                                    {(droppedFile.size / 1024).toFixed(0)} Ko · Cliquez pour changer
                                </p>
                            </>
                        ) : (
                            <>
                                <Plus className={`h-7 w-7 mb-1.5 ${isDragging ? 'text-indigo-500' : 'text-indigo-400'}`} />
                                <p className="text-xs font-medium text-foreground">
                                    {isDragging ? 'Relâchez ici...' : 'Glissez le contrat signé'}
                                </p>
                                <p className="text-[9px] text-muted-foreground mt-0.5">
                                    PDF, DOC, DOCX · Nommez le fichier avec : CDI_2026_Laura.pdf
                                </p>
                            </>
                        )}
                    </div>

                    {/* Formulaire — visible après drop ou clic */}
                    {(showForm || droppedFile) && (
                        <div className="space-y-2 border border-border rounded-xl p-3 bg-background/50">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                                    Informations du contrat
                                </p>
                                <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            <Input
                                placeholder="Libellé (ex: CDI Temps plein — début 03/2026)"
                                value={formLabel}
                                onChange={e => setFormLabel(e.target.value)}
                                className="h-8 text-xs bg-background"
                            />

                            <select
                                value={formType}
                                onChange={e => setFormType(e.target.value)}
                                className="w-full h-8 text-[11px] font-bold border border-input rounded px-2 bg-background text-foreground"
                            >
                                <option value="CDI">📋 CDI — Contrat à Durée Indéterminée</option>
                                <option value="CDD">📋 CDD — Contrat à Durée Déterminée</option>
                                <option value="EXTRA">📋 Extra / Vacataire</option>
                                <option value="APPRENTI">📋 Apprentissage / Alternance</option>
                                <option value="OTHER">📁 Autre</option>
                            </select>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <p className="text-[9px] text-muted-foreground mb-1 font-semibold uppercase">Début</p>
                                    <div className="grid grid-cols-2 gap-1">
                                        <Input
                                            type="number" min="1" max="12" placeholder="Mois"
                                            value={formStartMonth}
                                            onChange={e => setFormStartMonth(e.target.value)}
                                            className="h-7 text-[11px] bg-background"
                                        />
                                        <Input
                                            type="number" min="2000" max="2100" placeholder="Année"
                                            value={formStartYear}
                                            onChange={e => setFormStartYear(e.target.value)}
                                            className="h-7 text-[11px] bg-background"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[9px] text-muted-foreground mb-1 font-semibold uppercase">
                                        Fin <span className="font-normal normal-case">(CDD uniquement)</span>
                                    </p>
                                    <div className="grid grid-cols-2 gap-1">
                                        <Input
                                            type="number" min="1" max="12" placeholder="Mois"
                                            value={formEndMonth}
                                            onChange={e => setFormEndMonth(e.target.value)}
                                            className="h-7 text-[11px] bg-background"
                                        />
                                        <Input
                                            type="number" min="2000" max="2100" placeholder="Année"
                                            value={formEndYear}
                                            onChange={e => setFormEndYear(e.target.value)}
                                            className="h-7 text-[11px] bg-background"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Statut manuel */}
                            <div className="flex gap-2">
                                {(['ACTIF', 'EXPIRE', 'SUSPENDU'] as ContractStatus[]).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setFormStatus(s)}
                                        className={`flex-1 h-7 text-[10px] font-bold border rounded transition-all ${formStatus === s
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-background border-border text-muted-foreground hover:border-primary/50'
                                            }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>

                            {/* Résumé rangement */}
                            <p className="text-[9px] text-muted-foreground text-center">
                                📂 Drive → <strong>RESSOURCES_HUMAINES</strong> / <strong>{employeeName}</strong> / <strong>Contrats</strong>
                            </p>
                        </div>
                    )}

                    {/* Bouton upload */}
                    <Button
                        onClick={handleUpload}
                        disabled={isUploading || !droppedFile || !formLabel.trim()}
                        className="w-full h-9 text-xs font-bold gap-2 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                    >
                        {isUploading ? (
                            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enregistrement…</>
                        ) : (
                            <><Plus className="h-3.5 w-3.5" /> Enregistrer le contrat → Drive</>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
