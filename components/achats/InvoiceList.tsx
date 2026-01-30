"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Eye, FileText, AlertTriangle, CheckCircle2, Clock } from "lucide-react"

interface InvoiceListProps {
    invoices: any[]
}

export function InvoiceList({ invoices }: InvoiceListProps) {

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'DRAFT':
                return <Badge variant="secondary" className="bg-slate-100 text-slate-600"><Clock className="h-3 w-3 mr-1" /> Brouillon</Badge>
            case 'PROCESSING':
                return <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50 animate-pulse"><Clock className="h-3 w-3 mr-1" /> Analyse en cours</Badge>
            case 'VALIDATED':
                return <Badge variant="default" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" /> Validée</Badge>
            case 'ALERT':
                return <Badge variant="destructive" className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200"><AlertTriangle className="h-3 w-3 mr-1" /> Prix Anormal</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <Card className="border-none shadow-md">
            <CardHeader className="bg-white border-b rounded-t-xl">
                <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-slate-500" /> Historique des Factures
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="w-[120px]">Date</TableHead>
                            <TableHead>Fournisseur</TableHead>
                            <TableHead>Référence</TableHead>
                            <TableHead>Réception</TableHead>
                            <TableHead>Paiement</TableHead>
                            <TableHead className="text-right">Montant TTC</TableHead>
                            <TableHead className="w-[150px] text-center">Statut</TableHead>
                            <TableHead className="w-[80px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.map((invoice) => (
                            <TableRow key={invoice.id} className="cursor-pointer hover:bg-slate-50 transition-colors">
                                <TableCell className="font-medium">
                                    {format(new Date(invoice.date), 'dd MMM yyyy', { locale: fr })}
                                </TableCell>
                                <TableCell>
                                    <span className="font-bold text-slate-700">{invoice.supplier?.name || "Inconnu"}</span>
                                </TableCell>
                                <TableCell className="text-muted-foreground font-mono text-[10px]">
                                    {invoice.invoiceNo || "---"}
                                </TableCell>
                                <TableCell>
                                    {invoice.deliveryMode ? (
                                        <Badge variant="outline" className="text-[10px] font-normal bg-blue-50/50 text-blue-600 border-blue-100">
                                            {invoice.deliveryMode}
                                        </Badge>
                                    ) : "---"}
                                </TableCell>
                                <TableCell>
                                    {invoice.paymentMethod ? (
                                        <div className="text-[11px] text-slate-500 font-medium italic">
                                            {invoice.paymentMethod}
                                        </div>
                                    ) : "---"}
                                </TableCell>
                                <TableCell className="text-right font-bold text-slate-900">
                                    {Number(invoice.totalAmount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                </TableCell>
                                <TableCell className="text-center">
                                    {getStatusBadge(invoice.status)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600 hover:bg-indigo-50">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {invoices.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                    Aucune facture enregistrée pour le moment.
                                    <br />
                                    <span className="text-sm">Commencez par scanner ou importer vos factures.</span>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
