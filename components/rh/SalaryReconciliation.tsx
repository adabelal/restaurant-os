'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Loader2,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    Landmark,
    ArrowRight,
    ListChecks,
    MoreHorizontal,
    Trash2,
    UserPlus,
    CornerUpRight
} from "lucide-react"
import {
    getEmployeeSalaryReconciliation,
    removeReconciliationTransaction,
    moveReconciliationTransaction,
    getMinifiedEmployees
} from "@/app/(authenticated)/rh/actions"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
    DropdownMenuSubContent
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

interface Props {
    employeeId: string
    month: number
    year: number
    employeeName: string
}

export function SalaryReconciliation({ employeeId, month, year, employeeName }: Props) {
    const [data, setData] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(true)
    const [employees, setEmployees] = React.useState<any[]>([])
    const [processingId, setProcessingId] = React.useState<string | null>(null)

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        const res = await getEmployeeSalaryReconciliation(employeeId, month, year)
        setData(res)
        setLoading(false)
    }, [employeeId, month, year])

    const fetchEmployees = React.useCallback(async () => {
        const list = await getMinifiedEmployees()
        setEmployees(list.filter((e: any) => e.id !== employeeId))
    }, [employeeId])

    React.useEffect(() => {
        fetchData()
        fetchEmployees()
    }, [fetchData, fetchEmployees])

    const handleRemove = async (txId: string) => {
        if (!confirm("Voulez-vous retirer cette transaction de la liste des rémunérations ? (Elle restera en banque mais sera dé-catégorisée)")) return

        setProcessingId(txId)
        const res = await removeReconciliationTransaction(txId)
        if (res.success) {
            toast.success("Transaction retirée")
            fetchData()
        } else {
            toast.error(res.error || "Une erreur est survenue")
        }
        setProcessingId(null)
    }

    const handleMove = async (txId: string, targetName: string) => {
        setProcessingId(txId)
        const res = await moveReconciliationTransaction(txId, targetName)
        if (res.success) {
            toast.success(`Transaction transférée à ${targetName}`)
            fetchData()
        } else {
            toast.error(res.error || "Une erreur est survenue")
        }
        setProcessingId(null)
    }

    if (loading && !data) {
        return (
            <Card className="border-border/40 shadow-sm bg-card/50">
                <CardContent className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                    <span className="text-sm text-muted-foreground">Analyse des paiements bancaires...</span>
                </CardContent>
            </Card>
        )
    }

    if (!data) return null

    const diff = data.expected - data.actual
    const isMatched = Math.abs(diff) < 1 // tolerance for rounding
    const hasOverpaid = diff < -1

    return (
        <Card className="border-border/40 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Landmark className="h-5 w-5 text-indigo-500" />
                            Lettrage & Pointage Salaire
                        </CardTitle>
                        <CardDescription>
                            Vérification du versement bancaire par rapport à la fiche de paie
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" aria-label="Actualiser" onClick={fetchData} disabled={loading} className="h-8 w-8">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-b border-border/40">
                    <div className="p-4 flex flex-col items-center justify-center bg-blue-50/50 dark:bg-blue-950/10">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Attendu (Net)</span>
                        <div className="text-xl font-black text-foreground">
                            {data.expected.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                    </div>
                    <div className="p-4 flex flex-col items-center justify-center bg-emerald-50/50 dark:bg-emerald-950/10">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Versé (Banque)</span>
                        <div className="text-xl font-black text-foreground">
                            {data.actual.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                    </div>
                    <div className="p-4 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/50">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Écart</span>
                        <div className={`text-xl font-black ${isMatched ? 'text-emerald-500' : hasOverpaid ? 'text-amber-500' : 'text-rose-500'}`}>
                            {diff === 0 ? '✓ Soldé' : `${(hasOverpaid ? '+' : '-')}${Math.abs(diff).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`}
                        </div>
                    </div>
                </div>

                <div className="p-4">
                    <h4 className="text-[11px] font-black uppercase text-muted-foreground tracking-widest mb-3 flex items-center gap-2">
                        <ListChecks className="h-3 w-3" />
                        Détail des transactions détectées
                    </h4>

                    {data.transactions.length > 0 ? (
                        <div className="space-y-2">
                            {data.transactions.map((tx: any) => (
                                <div key={tx.id} className="flex items-center justify-between p-2 rounded-lg border border-border/40 bg-card/50 text-sm hover:border-border transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-500 text-xs font-bold">
                                            {format(new Date(tx.date), 'dd')}
                                        </div>
                                        <div className="flex flex-col overflow-hidden max-w-[200px] sm:max-w-[350px]">
                                            <span className="font-semibold text-foreground truncate leading-none mb-1" title={tx.description}>
                                                {tx.description}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground uppercase">
                                                {format(new Date(tx.date), 'MMMM yyyy', { locale: fr })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-3 font-mono font-bold text-foreground pr-2">
                                            {tx.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
                                            <ArrowRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-emerald-500 transition-colors" />
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" aria-label="Options de la transaction" className="h-8 w-8" disabled={processingId === tx.id}>
                                                    {processingId === tx.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56">
                                                <DropdownMenuLabel>Gestion de l'attribution</DropdownMenuLabel>
                                                <DropdownMenuSeparator />

                                                <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger>
                                                        <CornerUpRight className="h-4 w-4 mr-2" />
                                                        Transférer à...
                                                    </DropdownMenuSubTrigger>
                                                    <DropdownMenuPortal>
                                                        <DropdownMenuSubContent className="max-h-[300px] overflow-y-auto">
                                                            {employees.length > 0 ? (
                                                                employees.map((emp) => (
                                                                    <DropdownMenuItem key={emp.id} onClick={() => handleMove(tx.id, emp.name)}>
                                                                        <UserPlus className="h-4 w-4 mr-2" />
                                                                        {emp.name}
                                                                    </DropdownMenuItem>
                                                                ))
                                                            ) : (
                                                                <DropdownMenuItem disabled>Aucun autre employé</DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuPortal>
                                                </DropdownMenuSub>

                                                <DropdownMenuItem onClick={() => handleRemove(tx.id)} className="text-rose-500 focus:text-rose-500">
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Retirer la transaction
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 px-4 border-2 border-dashed border-border/40 rounded-xl">
                            <AlertCircle className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground font-medium">Aucun virement détecté par l'algorithme pour ce mois.</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1 uppercase tracking-tighter">Vérifiez le nom de l'employé ou la période.</p>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-muted/20 border-t border-border/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {isMatched ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 py-0.5 px-2">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Pointage OK
                            </Badge>
                        ) : (
                            <Badge variant="outline" className={`${hasOverpaid ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'} py-0.5 px-2`}>
                                <AlertCircle className="h-3 w-3 mr-1" /> {hasOverpaid ? 'Trop-perçu / Avance' : 'Reliquat à payer'}
                            </Badge>
                        )}
                    </div>
                    {isMatched && (
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">Le salaire a été intégralement versé.</span>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
