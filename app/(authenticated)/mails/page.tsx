import { Metadata } from 'next';
import { Mail, Download, MailOpen, Receipt, Info, ExternalLink, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
    title: 'Mails Traités | Restaurant-OS',
    description: 'Historique des factures et rapports reçus par mail',
};

export const dynamic = 'force-dynamic';

export default async function MailsPage() {
    // 1. Récupérer les mails explicitement enregistrés dans ProcessedMail (avec sécurité si table absente)
    let explicitMails = [];
    try {
        explicitMails = await (prisma as any).processedMail.findMany({
            take: 50,
            orderBy: { date: 'desc' }
        });
    } catch (e) {
        console.warn("Table ProcessedMail non trouvée, exécutez prisma db push.");
    }

    // 2. Récupérer les factures (PurchaseOrder) pour compatibilité
    const invoices = await prisma.purchaseOrder.findMany({
        take: 50,
        orderBy: { date: 'desc' },
        include: { supplier: true }
    });

    // 3. Récupérer les rapports Popina (CashTransaction) pour compatibilité
    const popinaReports = await prisma.cashTransaction.findMany({
        where: {
            description: { contains: 'Popina' }
        },
        take: 50,
        orderBy: { date: 'desc' }
    });

    // 4. Fusionner et dédoublonner (par messageId ou par targetId)
    // On privilégie ProcessedMail si disponible
    const processedIds = new Set(explicitMails.map((m: any) => m.targetId).filter(Boolean));

    const allProcessed = [
        ...explicitMails.map((m: any) => ({
            id: m.id,
            date: m.date,
            type: (m.type === 'INVOICE' ? 'Facture' : 'Rapport Popina') as 'Facture' | 'Rapport Popina',
            source: m.sender,
            amount: Number(m.amount || 0),
            status: m.status,
            fileUrl: m.fileUrl,
            description: m.subject
        })),
        ...invoices.filter((inv: any) => !processedIds.has(inv.id)).map((inv: any) => ({
            id: inv.id,
            date: inv.date,
            type: 'Facture' as const,
            source: inv.supplier?.name || "Fournisseur inconnu",
            amount: Number(inv.totalAmount),
            status: inv.status,
            fileUrl: inv.scannedUrl,
            description: inv.invoiceNo ? `Facture N° ${inv.invoiceNo}` : 'Achat fournisseur'
        })),
        ...popinaReports.filter((pop: any) => !processedIds.has(pop.id)).map((pop: any) => ({
            id: pop.id,
            date: pop.date,
            type: 'Rapport Popina' as const,
            source: "Popina (Caisse)",
            amount: Number(pop.amount),
            status: 'VALIDATED',
            fileUrl: null,
            description: pop.description
        }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    return (
        <div className="flex flex-col gap-6 md:gap-8 max-w-7xl mx-auto p-4 md:p-8 font-sans">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
                        <Mail className="h-8 w-8 text-blue-500" />
                        Emails et Automates
                    </h1>
                    <p className="text-muted-foreground">
                        Historique des données extraites automatiquement de vos emails (Popina, Factures).
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1 py-1 px-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Bot Actif
                    </Badge>
                </div>
            </div>

            <Card className="shadow-sm border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MailOpen className="h-5 w-5 text-blue-500" />
                        <CardTitle className="text-xl">Flux de traitement récent</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/30 text-muted-foreground font-medium">
                                    <th className="text-left py-3 px-4">Date</th>
                                    <th className="text-left py-3 px-4">Type</th>
                                    <th className="text-left py-3 px-4">Origine</th>
                                    <th className="text-left py-3 px-4">Montant</th>
                                    <th className="text-left py-3 px-4">Statut</th>
                                    <th className="text-right py-3 px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {allProcessed.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-muted-foreground italic">
                                            Aucun email traité récemment.
                                        </td>
                                    </tr>
                                ) : (
                                    allProcessed.map((item) => (
                                        <tr key={`${item.type}-${item.id}`} className="hover:bg-muted/30 transition-colors group">
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <div className="font-medium">
                                                    {format(item.date, 'dd MMM yyyy', { locale: fr })}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    {format(item.date, 'HH:mm')}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    {item.type === 'Facture' ? (
                                                        <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
                                                            <Receipt className="h-4 w-4" />
                                                        </div>
                                                    ) : (
                                                        <div className="p-1.5 rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                                                            <MailOpen className="h-4 w-4" />
                                                        </div>
                                                    )}
                                                    <span className="font-medium">{item.type}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="font-medium text-foreground">{item.source}</div>
                                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                    {item.description}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 font-bold">
                                                {item.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge
                                                    variant={item.status === 'ALERT' ? 'destructive' : 'secondary'}
                                                    className={item.status === 'VALIDATED' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' : ''}
                                                >
                                                    {item.status === 'VALIDATED' ? 'Succès' :
                                                        item.status === 'ALERT' ? 'Alerte' :
                                                            item.status === 'PROCESSING' ? 'En cours' : item.status}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {item.fileUrl && (
                                                        <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-indigo-500">
                                                            <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" title="Voir le document">
                                                                <Download className="h-4 w-4" />
                                                            </a>
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                                        <Info className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-sm border-blue-100 bg-blue-50/20 dark:border-blue-900/30 dark:bg-blue-950/10">
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-blue-700 dark:text-blue-400">
                            <Info className="h-4 w-4" />
                            Aide à la vérification
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground leading-relaxed">
                        <p>
                            Tous les éléments de cette liste ont été créés automatiquement depuis vos emails.
                            Les Factures sont ajoutées à l'économat et les Rapports Popina sont ajoutés à la caisse.
                            En cas d'erreur de montant, vous pouvez modifier l'entrée directement dans la section correspondante (Finance → Banque ou Finance → Caisse).
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-amber-100 bg-amber-50/20 dark:border-amber-900/30 dark:bg-amber-950/10">
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
                            <ShieldCheck className="h-4 w-4" />
                            Provenance des données
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground leading-relaxed">
                        <p>
                            Le bot analyse les emails archivés sous le dossier <strong>Google Drive / 01_ARCHIVES / Factures / 2026</strong>.
                            Les rapports Popina sont lus directement pour extraire la ligne "Espèces" et synchroniser le cash-flow journalier de manière transparente.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
