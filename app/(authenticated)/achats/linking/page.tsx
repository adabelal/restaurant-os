import { prisma } from "@/lib/prisma"
import { SmartLinker } from "@/components/achats/SmartLinker"
import { ArrowLeft, Sparkles, Link as LinkIcon } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const dynamic = 'force-dynamic'

export default async function LinkingPage() {
    // 1. Fetch unlinked items (limit to 50 to avoid overloading)
    const unlinkedItems = await prisma.invoiceItem.findMany({
        where: { ingredientId: null },
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
            purchaseOrder: {
                select: {
                    date: true,
                    supplier: { select: { name: true } }
                }
            }
        }
    })

    // 2. Fetch all ingredients for the dropdown
    const ingredients = await prisma.ingredient.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, unit: true }
    })

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 p-6 md:p-10 space-y-8 animate-in fade-in">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Button variant="ghost" size="sm" className="-ml-3 w-fit text-muted-foreground" asChild>
                    <Link href="/achats">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour aux Achats
                    </Link>
                </Button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                                <LinkIcon className="h-8 w-8" />
                            </div>
                            Smart Linking
                        </h1>
                        <p className="text-muted-foreground mt-2 font-medium max-w-2xl">
                            Connectez vos lignes de facture à vos ingrédients pour automatiser le suivi des coûts et des stocks.
                        </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="bg-amber-100 p-2 rounded-full">
                            <Sparkles className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-700">{unlinkedItems.length} éléments en attente</p>
                            <p className="text-xs text-slate-400">Triez-les pour une comptabilité parfaite.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Interface */}
            <div className="flex-1">
                <SmartLinker
                    initialItems={unlinkedItems}
                    ingredients={ingredients}
                />
            </div>
        </div>
    )
}
