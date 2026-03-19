"use client"

import { useState } from "react"
import { ExternalLink, Search, FileText, CalendarDays } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface ExternalDocument {
    id: string
    fileName: string
    driveFileId: string
    driveWebViewUrl: string | null
    month: number | null
    year: number | null
    processed: boolean
    createdAt: Date
    updatedAt: Date
}

export function ExternalDocumentsTab({ documents }: { documents: ExternalDocument[] }) {
    const [searchQuery, setSearchQuery] = useState("")

    // Filtrer les documents par nom
    const filteredDocs = documents.filter(doc => 
        doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="bg-card/40 backdrop-blur-sm border border-border/50 rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                    <div>
                        <h2 className="text-xl font-oswald uppercase font-bold text-foreground">Documents Externes & Intermittents</h2>
                        <p className="text-muted-foreground text-sm mt-1 max-w-2xl leading-relaxed">
                            Retrouvez ici tous les documents PDF scannés dans le dossier Paie (GUSO, déclarations, factures pro) qui n'appartiennent à aucun collaborateur en base.
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1 group max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Rechercher (ex: LUQUIN, GUSO...)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-background/50 border-border/50 focus:bg-background transition-all rounded-xl h-11"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-card/40 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-muted/50 text-muted-foreground font-oswald tracking-wider border-b border-border/50">
                            <tr>
                                <th className="px-6 py-4 font-medium">Nom du Document</th>
                                <th className="px-6 py-4 font-medium">Période détectée</th>
                                <th className="px-6 py-4 font-medium">Ajouté le</th>
                                <th className="px-6 py-4 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filteredDocs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                        <FileText className="h-8 w-8 mx-auto mb-3 opacity-20" />
                                        <p>Aucun document trouvé.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredDocs.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-foreground">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                <span className="truncate max-w-[200px] sm:max-w-xs block" title={doc.fileName}>
                                                    {doc.fileName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {doc.month && doc.year ? (
                                                <span className="flex items-center gap-1.5">
                                                    <CalendarDays className="h-4 w-4 opacity-50" />
                                                    {doc.month.toString().padStart(2, '0')}/{doc.year}
                                                </span>
                                            ) : (
                                                <span className="opacity-50 italic">Non détectée</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                                            {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {doc.driveWebViewUrl ? (
                                                <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <a href={doc.driveWebViewUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:text-primary">
                                                        Ouvrir
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                    </a>
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">Pas de lien dispo</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
