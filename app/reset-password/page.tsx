"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"

function ResetPasswordContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get("token") || ""

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setMessage("")

        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.")
            return
        }

        if (password.length < 8) {
            setError("Le mot de passe doit contenir au moins 8 caractères.")
            return
        }

        setIsLoading(true)

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Une erreur est survenue")
            }

            setMessage("Votre mot de passe a été réinitialisé avec succès.")
            setTimeout(() => {
                router.push("/login")
            }, 2000)

        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-500">Lien invalide</CardTitle>
                        <CardDescription>
                            Ce lien de réinitialisation est manquant ou invalide.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => router.push("/forgot-password")} className="w-full">
                            Demander un nouveau lien
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Réinitialiser le mot de passe</CardTitle>
                    <CardDescription>
                        Entrez votre nouveau mot de passe.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}
                        {message && (
                            <div className="flex items-center gap-2 p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-md">
                                <CheckCircle className="h-4 w-4" />
                                {message}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="password">Nouveau mot de passe</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Mise à jour...
                                </>
                            ) : (
                                "Mettre à jour"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    )
}
