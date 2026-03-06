"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { updateBandProfile, linkInvoiceToEvent } from "../../actions"
import { Save, UploadCloud, Calendar as CalendarIcon, FileText, CheckCircle2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export function BandProfileClient({ band }: { band: any }) {
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [selectedEventId, setSelectedEventId] = useState<string>("")
    const [file, setFile] = useState<File | null>(null)

    const handleUpdateInfo = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSaving(true)
        const formData = new FormData(e.currentTarget)
        formData.append("id", band.id)

        const result = await updateBandProfile(formData)
        if (result?.error) {
            toast.error(typeof result.error === 'string' ? result.error : "Erreur de validation")
        } else {
            toast.success("Informations du groupe mises à jour")
        }
        setIsSaving(false)
    }

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file || !selectedEventId) {
            toast.error("Veuillez sélectionner un fichier et une date")
            return
        }

        setIsUploading(true)
        const uploadData = new FormData()
        uploadData.append("file", file)

        try {
            // 1. Upload file locally
            const res = await fetch("/api/upload", {
                method: "POST",
                body: uploadData
            })
            const data = await res.json()

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Erreur lors de l'upload")
            }

            // 2. Link the URL to the specified event
            const result = await linkInvoiceToEvent(selectedEventId, data.url)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success("Facture liée avec succès")
                setFile(null)
                setSelectedEventId("")
            }
        } catch (err: any) {
            toast.error(err.message || "Erreur de communication")
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <Tabs defaultValue="infos" className="space-y-4 max-w-5xl">
            <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
                <TabsTrigger value="infos">Informations</TabsTrigger>
                <TabsTrigger value="events">Concerts ({band.events.length})</TabsTrigger>
                <TabsTrigger value="invoices">Factures</TabsTrigger>
            </TabsList>

            <TabsContent value="infos">
                <Card>
                    <CardHeader>
                        <CardTitle>Détails du Groupe</CardTitle>
                        <CardDescription>
                            Modifiez les informations de contact et le style musical.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateInfo} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nom du Groupe</Label>
                                    <Input id="name" name="name" defaultValue={band.name} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="genre">Style Musical</Label>
                                    <Input id="genre" name="genre" defaultValue={band.genre || ""} placeholder="Ex: Pop, Rock, Jazz..." />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email de Contact</Label>
                                    <Input id="email" name="email" type="email" defaultValue={band.email || ""} placeholder="groupe@email.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Téléphone</Label>
                                    <Input id="phone" name="phone" defaultValue={band.phone || ""} placeholder="06 XX XX XX XX" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description Libre</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    defaultValue={band.description || ""}
                                    placeholder="Composition du groupe, particularités techniques, cachets habituels..."
                                    className="min-h-[120px]"
                                />
                            </div>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? "Enregistrement..." : <><Save className="w-4 h-4 mr-2" /> Enregistrer les infos</>}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="events">
                <Card>
                    <CardHeader>
                        <CardTitle>Historique des Concerts</CardTitle>
                        <CardDescription>Toutes les dates attribuées à ce groupe.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {band.events.length === 0 ? (
                            <p className="text-muted-foreground italic">Aucun concert enregistré.</p>
                        ) : (
                            <div className="grid gap-3">
                                {band.events.map((ev: any) => (
                                    <div key={ev.id} className="flex justify-between items-center p-4 rounded-lg border bg-card hover:bg-muted/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-primary/10 p-2 rounded-md">
                                                <CalendarIcon className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <div className="font-bold">{new Date(ev.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                                <div className="text-sm text-muted-foreground">{ev.startTime || '20:30'} </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-right">
                                            <div className="font-black text-lg">{ev.amount} €</div>
                                            <Badge variant={ev.status === "COMPLETED" ? "default" : "secondary"}>
                                                {ev.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="invoices">
                <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Ajouter une Facture</CardTitle>
                            <CardDescription>Glissez-déposez le PDF/Image de la facture et liez-la à une date.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleFileUpload} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Sélectionner le Concert</Label>
                                    <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choisir une date..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {band.events.map((ev: any) => (
                                                <SelectItem key={ev.id} value={ev.id}>
                                                    {new Date(ev.date).toLocaleDateString('fr-FR')} - {ev.amount}€
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Fichier de la facture</Label>
                                    <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 hover:bg-muted/10 transition-colors cursor-pointer relative group">
                                        <input
                                            type="file"
                                            accept="application/pdf,image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        />
                                        <div className="flex flex-col items-center justify-center text-center space-y-2">
                                            <div className="p-3 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform">
                                                <UploadCloud className="w-8 h-8" />
                                            </div>
                                            {file ? (
                                                <p className="text-sm font-medium text-primary line-clamp-1">{file.name}</p>
                                            ) : (
                                                <>
                                                    <p className="text-sm font-medium">Glisser un fichier ou parcourir</p>
                                                    <p className="text-xs text-muted-foreground">PDF, JPG, PNG (Max 5MB)</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full" disabled={!file || !selectedEventId || isUploading}>
                                    {isUploading ? "Upload en cours..." : "Enregistrer la facture"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Factures Liées</CardTitle>
                            <CardDescription>Historique des documents déposés pour ce groupe.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {band.events.filter((e: any) => e.invoiceUrl).length === 0 ? (
                                    <p className="text-muted-foreground italic">Aucune facture n'a encore été rattachée à un concert.</p>
                                ) : (
                                    band.events.filter((e: any) => e.invoiceUrl).map((ev: any) => (
                                        <a href={ev.invoiceUrl} target="_blank" rel="noopener noreferrer" key={ev.id} className="flex items-center gap-3 p-3 rounded-md border hover:bg-muted/30 transition-colors group">
                                            <div className="bg-emerald-500/10 p-2 rounded text-emerald-600">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold group-hover:text-primary transition-colors">Concert du {new Date(ev.date).toLocaleDateString('fr-FR')}</p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Montant : {ev.amount}€
                                                </p>
                                            </div>
                                        </a>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
        </Tabs>
    )
}
