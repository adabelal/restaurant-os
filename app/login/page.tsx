"use client"

import { Suspense, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2, UtensilsCrossed } from "lucide-react"

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get("callbackUrl") || "/"

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError("Email ou mot de passe incorrect")
                setIsLoading(false)
                return
            }

            router.push(callbackUrl)
            router.refresh()
        } catch {
            setError("Une erreur est survenue")
            setIsLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-md shadow-xl border-0">
            <CardHeader className="space-y-4 text-center pb-8">
                <div className="mx-auto h-14 w-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                    <UtensilsCrossed className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                    <CardTitle className="text-2xl font-bold">Restaurant OS</CardTitle>
                    <CardDescription className="mt-2">
                        Connectez-vous pour accéder au système
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="votre@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Mot de passe</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            disabled={isLoading}
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Connexion...
                            </>
                        ) : (
                            "Se connecter"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

function LoginFormFallback() {
    return (
        <Card className="w-full max-w-md shadow-xl border-0">
            <CardHeader className="space-y-4 text-center pb-8">
                <div className="mx-auto h-14 w-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                    <UtensilsCrossed className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                    <CardTitle className="text-2xl font-bold">Restaurant OS</CardTitle>
                    <CardDescription className="mt-2">
                        Chargement...
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="h-10 bg-muted animate-pulse rounded" />
                    <div className="h-10 bg-muted animate-pulse rounded" />
                    <div className="h-10 bg-muted animate-pulse rounded" />
                </div>
            </CardContent>
        </Card>
    )
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
            <Suspense fallback={<LoginFormFallback />}>
                <LoginForm />
            </Suspense>
        </div>
    )
}
