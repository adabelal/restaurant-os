'use client'

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createEmployee } from "@/app/rh/actions"
import { useState, useRef } from "react"
import { Loader2, Plus, AlertCircle, CheckCircle2, ChevronDown, User, Mail, Briefcase, Euro } from "lucide-react"

export function CreateEmployeeDialog() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const formRef = useRef<HTMLFormElement>(null)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        setMessage(null)

        try {
            const result = await createEmployee(formData)

            if (result?.success) {
                setMessage({ type: 'success', text: result.message || "Employé créé !" })
                formRef.current?.reset()
                // Close after a short delay to show success message
                setTimeout(() => {
                    setOpen(false)
                    setMessage(null)
                }, 1500)
            } else {
                setMessage({ type: 'error', text: result?.message || "Une erreur est survenue." })
            }
        } catch (e) {
            setMessage({ type: 'error', text: "Erreur de connexion." })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all hover:scale-105">
                    <Plus className="mr-2 h-4 w-4" /> Nouvel Employé
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl bg-card text-card-foreground">
                <DialogHeader className="pb-4 border-b dark:border-zinc-800">
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <User className="h-4 w-4" />
                        </div>
                        Ajouter un membre à l'équipe
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Créez le profil de votre nouvel employé. Un mot de passe temporaire sera généré.
                    </DialogDescription>
                </DialogHeader>

                <form ref={formRef} action={handleSubmit} className="grid gap-5 py-6">
                    {message && (
                        <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-600 border border-green-200/20' : 'bg-red-500/10 text-red-600 border border-red-200/20'
                            }`}>
                            {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                            {message.text}
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="name">Nom complet</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input id="name" name="name" placeholder="Ex: Jean Dupont" className="pl-9" required />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email professionnel</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input id="email" name="email" type="email" placeholder="Ex: jean@resto.com" className="pl-9" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="role">Rôle</Label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                <select
                                    id="role"
                                    name="role"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none"
                                >
                                    <option value="STAFF">Staff</option>
                                    <option value="MANAGER">Manager</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground opacity-50 pointer-events-none" />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="hourlyRate">Taux Horaire (€)</Label>
                            <div className="relative">
                                <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="hourlyRate"
                                    name="hourlyRate"
                                    type="number"
                                    step="0.01"
                                    defaultValue="11.65"
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="grid gap-2">
                            <Label htmlFor="contractType">Type de contrat</Label>
                            <select
                                id="contractType"
                                name="contractType"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none"
                            >
                                <option value="CDI">CDI</option>
                                <option value="CDD">CDD</option>
                                <option value="EXTRA">Extra / Vacataire</option>
                                <option value="APPRENTI">Apprentissage</option>
                            </select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="contractDuration">Temps de travail</Label>
                            <select
                                id="contractDuration"
                                name="contractDuration"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none"
                            >
                                <option value="FULL_TIME">Temps Plein</option>
                                <option value="PART_TIME">Temps Partiel</option>
                            </select>
                        </div>
                    </div>

                    <DialogFooter className="pt-6 border-t dark:border-zinc-800">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isLoading}>
                            Annuler
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Création...
                                </>
                            ) : (
                                "Enregistrer l'employé"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
