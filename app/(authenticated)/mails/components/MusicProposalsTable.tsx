"use client"

import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Music, Trash2, Mail, Phone, User as UserIcon, ExternalLink, RefreshCw, Edit2, Check, X, Youtube, Instagram, Music2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { deleteProposal, updateProposalStyle, triggerHistoricalScan } from "../actions"
import { useState } from "react"

interface MusicBandProposal {
    id: string
    bandName: string
    style: string | null
    contactName: string | null
    contactEmail: string | null
    contactPhone: string | null
    videoLinks: string[]
    fullDescription: string | null
    emailDate: Date
    status: string
    messageId: string
}

interface MusicProposalsTableProps {
    initialProposals: MusicBandProposal[]
}

export function MusicProposalsTable({ initialProposals }: MusicProposalsTableProps) {
    const [proposals, setProposals] = useState(initialProposals)
    const [isSyncing, setIsSyncing] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValue, setEditValue] = useState("")

    const handleSync = async () => {
        setIsSyncing(true)
        const result = await triggerHistoricalScan()
        if (result.success) {
            toast.success(result.message)
        } else {
            toast.error(result.error)
        }
        setIsSyncing(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer cette proposition ?")) return

        const result = await deleteProposal(id)
        if (result.success) {
            setProposals(proposals.filter(p => p.id !== id))
            toast.success("Proposition supprimée")
        } else {
            toast.error(result.error || "Erreur lors de la suppression")
        }
    }

    const handleStartEdit = (id: string, currentStyle: string | null) => {
        setEditingId(id)
        setEditValue(currentStyle || "")
    }

    const handleSaveStyle = async (id: string) => {
        const result = await updateProposalStyle(id, editValue)
        if (result.success) {
            setProposals(proposals.map(p => p.id === id ? { ...p, style: editValue } : p))
            setEditingId(null)
            toast.success("Style mis à jour")
        } else {
            toast.error(result.error)
        }
    }

    const getLinkIcon = (url: string) => {
        const u = url.toLowerCase()
        if (u.includes('youtube') || u.includes('youtu.be')) return <Youtube className="h-3 w-3" />
        if (u.includes('instagram')) return <Instagram className="h-3 w-3" />
        if (u.includes('spotify')) return <Music2 className="h-3 w-3" />
        return <ExternalLink className="h-3 w-3" />
    }

    const getLinkLabel = (url: string) => {
        const u = url.toLowerCase()
        if (u.includes('youtube') || u.includes('youtu.be')) return "Youtube"
        if (u.includes('instagram')) return "Instagram"
        if (u.includes('spotify')) return "Spotify"
        if (u.includes('soundcloud')) return "Soundcloud"
        return "Lien"
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/10">
                <div className="text-xs text-muted-foreground italic">
                    {proposals.length} proposition(s) en attente
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="h-8 gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                    {isSyncing ? "Synchronisation..." : "Synchroniser l'historique"}
                </Button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/30 text-muted-foreground font-medium">
                            <th className="text-left py-3 px-4 w-[120px]">Date</th>
                            <th className="text-left py-3 px-4 min-w-[200px]">Groupe / Style / Vidéos</th>
                            <th className="text-left py-3 px-4">Contacts</th>
                            <th className="text-right py-3 px-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {proposals.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-12 text-center text-muted-foreground italic">
                                    Aucune nouvelle proposition de groupe.
                                </td>
                            </tr>
                        ) : (
                            proposals.map((item) => (
                                <tr key={item.id} className="hover:bg-muted/10 transition-colors group">
                                    <td className="py-4 px-4 whitespace-nowrap align-top">
                                        <div className="font-medium text-slate-900 dark:text-slate-100 italic">
                                            {format(new Date(item.emailDate), 'dd MMM yyyy', { locale: fr })}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-tight mt-1 flex items-center gap-1">
                                            <Mail className="h-2.5 w-2.5 text-indigo-400" />
                                            Email reçu
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 align-top">
                                        <div className="flex flex-col gap-2">
                                            <div className="font-bold text-lg flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                                                <Music className="h-4 w-4" />
                                                {item.bandName}
                                            </div>

                                            {/* Style section with inline editing */}
                                            <div className="flex items-center gap-2">
                                                {editingId === item.id ? (
                                                    <div className="flex items-center gap-1 w-full max-w-[200px]">
                                                        <Input
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            className="h-7 text-xs px-2"
                                                            placeholder="Style (ex: Pop/Rock)"
                                                            autoFocus
                                                        />
                                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600" onClick={() => handleSaveStyle(item.id)}>
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setEditingId(null)}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 group/style">
                                                        <div className="text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2.5 py-1 rounded-md w-fit font-medium border border-indigo-100 dark:border-indigo-900/50">
                                                            {item.style || "Style inconnu"}
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 opacity-0 group-hover/style:opacity-100 transition-opacity"
                                                            onClick={() => handleStartEdit(item.id, item.style)}
                                                        >
                                                            <Edit2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>

                                            {item.videoLinks && item.videoLinks.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {item.videoLinks.map((link, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-[11px] bg-muted/50 text-muted-foreground dark:bg-muted/10 px-2 py-0.5 rounded border border-border hover:bg-muted transition-colors"
                                                        >
                                                            {getLinkIcon(link)}
                                                            {getLinkLabel(link)}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}

                                            {item.fullDescription && (
                                                <div className="text-[11px] text-muted-foreground mt-1 line-clamp-3 bg-muted/20 p-2 rounded border border-dotted border-border italic leading-relaxed">
                                                    "{item.fullDescription.substring(0, 200)}..."
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 align-top">
                                        <div className="flex flex-col gap-2 text-xs">
                                            {item.contactName && (
                                                <div className="flex items-center gap-2 text-foreground font-semibold">
                                                    <UserIcon className="h-3.5 w-3.5 text-indigo-500" />
                                                    {item.contactName}
                                                </div>
                                            )}
                                            {item.contactEmail && (
                                                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline">
                                                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                                                    <a href={`mailto:${item.contactEmail}`}>{item.contactEmail}</a>
                                                </div>
                                            )}
                                            {item.contactPhone && (
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                                                    {item.contactPhone}
                                                </div>
                                            )}
                                            {!item.contactEmail && !item.contactPhone && !item.contactName && (
                                                <span className="text-muted-foreground italic">Coordonnées non extraites</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-right align-top">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                asChild
                                                variant="outline"
                                                size="sm"
                                                className="h-9 gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-400 dark:border-indigo-800 dark:hover:bg-indigo-900/20"
                                            >
                                                <a href={`https://mail.google.com/mail/u/0/#search/id%3A${item.messageId}`} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="h-4 w-4" />
                                                    Voir l'email
                                                </a>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(item.id)}
                                                className="h-9 w-9 text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
