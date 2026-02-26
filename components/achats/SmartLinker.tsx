"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown, ArrowRight, PackagePlus, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { linkItemToIngredient } from "@/app/(authenticated)/achats/linking/actions"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface Item {
    id: string
    rawLabel: string
    quantity: any // decimal
    totalPrice: any
    packaging?: string | null
    purchaseOrder: {
        date: Date
        supplier: { name: string } | null
    }
}

interface Ingredient {
    id: string
    name: string
    unit: string
}

interface SmartLinkerProps {
    initialItems: Item[]
    ingredients: Ingredient[]
}

export function SmartLinker({ initialItems, ingredients }: SmartLinkerProps) {
    const [items, setItems] = useState<Item[]>(initialItems)
    const [loadingId, setLoadingId] = useState<string | null>(null)

    const handleLink = async (itemId: string, ingredientId: string) => {
        setLoadingId(itemId)
        try {
            const result = await linkItemToIngredient(itemId, ingredientId)
            if (result.success) {
                toast.success("Liaison effectuée !")
                // Remove item from list locally
                setItems(prev => prev.filter(i => i.id !== itemId))
            } else {
                toast.error("Erreur, réessayez.")
            }
        } catch (e) {
            toast.error("Erreur réseau")
        } finally {
            setLoadingId(null)
        }
    }

    if (items.length === 0) {
        return (
            <Card className="flex flex-col items-center justify-center p-20 text-center border-dashed">
                <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                    <Check className="h-10 w-10 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Tout est à jour !</h3>
                <p className="text-slate-500 max-w-md mt-2">
                    Toutes vos lignes d'achat sont liées à des ingrédients. Vos coûts de revient sont précis à 100%.
                </p>
                <Button className="mt-8" variant="outline" onClick={() => window.location.reload()}>
                    Actualiser
                </Button>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {items.map((item) => (
                <Card key={item.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all group">
                    <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row items-stretch">
                            {/* Left: Invoice Data */}
                            <div className="flex-1 p-6 flex flex-col justify-center gap-2 bg-white relative">
                                <div className="absolute top-0 left-0 bottom-0 w-1 bg-indigo-500" />
                                <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-wider">
                                    <span>{format(new Date(item.purchaseOrder.date), 'dd MMM', { locale: fr })}</span>
                                    <span>•</span>
                                    <span>{item.purchaseOrder.supplier?.name || "Inconnu"}</span>
                                </div>
                                <h3 className="text-lg font-black text-slate-800 group-hover:text-indigo-600 transition-colors">
                                    {item.rawLabel}
                                </h3>
                                <div className="flex items-center gap-3 mt-1">
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                                        Qte: {Number(item.quantity)} {item.packaging ? `(${item.packaging})` : ''}
                                    </Badge>
                                    <span className="font-bold text-slate-900">
                                        {Number(item.totalPrice).toFixed(2)}€
                                    </span>
                                </div>
                            </div>

                            {/* Center: Arrow Visual */}
                            <div className="hidden md:flex items-center justify-center px-4 bg-slate-50 border-x border-slate-100">
                                <ArrowRight className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                            </div>

                            {/* Right: Action (Ingredient Selector) */}
                            <div className="flex-1 p-6 bg-slate-50/50 flex items-center">
                                <IngredientSelector
                                    ingredients={ingredients}
                                    onSelect={(ingId) => handleLink(item.id, ingId)}
                                    isLoading={loadingId === item.id}
                                    defaultSearch={item.rawLabel}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

function IngredientSelector({
    ingredients,
    onSelect,
    isLoading,
    defaultSearch
}: {
    ingredients: Ingredient[],
    onSelect: (id: string) => void,
    isLoading: boolean,
    defaultSearch: string
}) {
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState("")

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-12 bg-white border-slate-200 hover:bg-white hover:border-indigo-300 text-slate-600 font-medium"
                    disabled={isLoading}
                >
                    {isLoading ? "Liaison en cours..." : (value
                        ? ingredients.find((i) => i.id === value)?.name
                        : "Sélectionner un ingrédient...")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Rechercher un ingrédient..." />
                    <CommandList>
                        <CommandEmpty>
                            <div className="py-6 text-center">
                                <p className="text-sm text-slate-500 mb-4">Aucun ingrédient trouvé.</p>
                                <Button variant="secondary" size="sm" className="gap-2">
                                    <PackagePlus className="h-4 w-4" />
                                    Créer "{defaultSearch.slice(0, 15)}..."
                                </Button>
                            </div>
                        </CommandEmpty>
                        <CommandGroup>
                            {ingredients.map((ingredient) => (
                                <CommandItem
                                    key={ingredient.id}
                                    value={ingredient.name}
                                    onSelect={() => {
                                        setValue(ingredient.id)
                                        setOpen(false)
                                        onSelect(ingredient.id)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === ingredient.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <span className="font-bold">{ingredient.name}</span>
                                    <span className="ml-auto text-xs text-slate-400">{ingredient.unit}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
