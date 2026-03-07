import { Metadata } from 'next';
import { Mail, Download, MailOpen, Receipt, Info, ShieldCheck, Music, ListFilter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MusicProposalsTable } from './components/MusicProposalsTable';
import { ProcessedMailsTable } from './components/ProcessedMailsTable';
import { SyncButton } from './components/SyncButton';
import { CleanupPopinaButton } from './components/CleanupPopinaButton';
import { getBandProposals, triggerHistoricalScan } from './actions';

export const metadata: Metadata = {
    title: 'Mails Traités | Restaurant-OS',
    description: 'Historique des factures et rapports reçus par mail',
};

export const dynamic = 'force-dynamic';

export default async function MailsPage() {
    // 1. Récupérer les mails explicitement enregistrés dans ProcessedMail
    let explicitMails = [];
    try {
        explicitMails = await (prisma as any).processedMail.findMany({
            take: 50,
            orderBy: { date: 'desc' }
        });
    } catch (e) {
        console.warn("Table ProcessedMail non trouvée, exécutez prisma db push.");
    }

    // 2. Récupérer les factures (PurchaseOrder)
    const invoices = await prisma.purchaseOrder.findMany({
        take: 50,
        orderBy: { date: 'desc' },
        include: { supplier: true }
    });

    // 3. Récupérer les rapports Popina
    const popinaReports = await prisma.cashTransaction.findMany({
        where: {
            description: { contains: 'Popina' }
        },
        take: 50,
        orderBy: { date: 'desc' }
    });

    // 4. Récupérer les propositions de groupes
    const bandProposals = await getBandProposals();

    // 5. Fusionner et dédoublonner pour l'onglet principal
    const processedIds = new Set(explicitMails.map((m: any) => m.targetId).filter(Boolean));

    const allProcessed: any[] = [
        ...explicitMails.map((m: any) => ({
            id: m.id,
            date: m.date,
            type: (m.type === 'INVOICE' ? 'Facture' : (m.type === 'POPINA_REPORT' ? 'Rapport Popina' : 'Document')) as any,
            source: m.sender,
            amount: Number(m.amount || 0),
            status: m.status,
            fileUrl: m.fileUrl,
            description: m.subject,
            fileName: m.fileName
        })),
        ...invoices.filter((inv: any) => !processedIds.has(inv.id)).map((inv: any) => ({
            id: inv.id,
            date: inv.date,
            type: 'Facture' as const,
            source: inv.supplier?.name || "Fournisseur inconnu",
            amount: Number(inv.totalAmount),
            status: inv.status,
            fileUrl: inv.scannedUrl,
            description: inv.invoiceNo ? `Facture N° ${inv.invoiceNo}` : 'Achat fournisseur',
            fileName: null
        })),
        ...popinaReports.filter((pop: any) => !processedIds.has(pop.id)).map((pop: any) => ({
            id: pop.id,
            date: pop.date,
            type: 'Rapport Popina' as const,
            source: "Popina (Caisse)",
            amount: Number(pop.amount),
            status: 'VALIDATED',
            fileUrl: null,
            description: pop.description,
            fileName: null
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
                        Gestion centralisée des données extraites de vos emails.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <CleanupPopinaButton />
                    <SyncButton />
                    <Badge variant="outline" className="flex items-center gap-1 py-1 px-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Bot Actif
                    </Badge>
                </div>
            </div>

            <Tabs defaultValue="processing" className="space-y-6">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="processing" className="flex items-center gap-2 py-2 px-4">
                        <Receipt className="h-4 w-4" />
                        Factures & Rapports
                    </TabsTrigger>
                    <TabsTrigger value="music" className="flex items-center gap-2 py-2 px-4">
                        <div className="relative">
                            <Music className="h-4 w-4" />
                            {bandProposals.length > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 h-3 w-3 bg-red-500 rounded-full border-2 border-background animate-pulse" />
                            )}
                        </div>
                        Propositions Groupes
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="processing" className="space-y-6">
                    <Card className="shadow-sm border-border">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MailOpen className="h-5 w-5 text-blue-500" />
                                <CardTitle className="text-xl">Flux de traitement récent</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ProcessedMailsTable initialItems={allProcessed} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="music" className="space-y-6">
                    <Card className="shadow-sm border-border">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Music className="h-5 w-5 text-purple-500" />
                                <CardTitle className="text-xl">Propositions de Groupes</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <MusicProposalsTable initialProposals={bandProposals as any} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

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
                            Les propositions de groupes peuvent être validées pour devenir des groupes officiels.
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
                            Le bot analyse les emails archivés et les nouvelles propositions reçues sur vos deux boîtes mail.
                            L'IA Gemini résume automatiquement les styles de musique pour plus de clarté.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
