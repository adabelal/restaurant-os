'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Mail, Save, Loader2 } from "lucide-react"
import { updateAppSettings } from "@/app/caisse/actions"
import { toast } from "sonner"
import { CategoryManager } from "./CategoryManager"

interface CaisseConfigProps {
    settings: any
    initialCategories: any[]
}

export function CaisseConfig({ settings, initialCategories }: CaisseConfigProps) {
    const [email, setEmail] = useState(settings?.accountantEmail || '')
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        setLoading(true)
        try {
            await updateAppSettings({ accountantEmail: email })
            toast.success("Email de la compta mis à jour")
        } catch (error) {
            toast.error("Erreur lors de la sauvegarde")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8">
            <Card className="border-none shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Mail className="h-5 w-5 text-indigo-500" /> Paramètres d'analyse & Envoi
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4 max-w-md">
                        <div className="space-y-2">
                            <Label htmlFor="compta-email">Email de la Comptabilité</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="compta-email"
                                    type="email"
                                    placeholder="exemple@compta.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="flex-1"
                                />
                                <Button onClick={handleSave} disabled={loading} size="sm">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                </Button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Cet email sera utilisé par défaut lors de l'envoi des rapports de caisse.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <CategoryManager initialCategories={initialCategories} />
        </div>
    )
}
