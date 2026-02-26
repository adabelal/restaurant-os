import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { SyncBankButton } from '@/components/finance/SyncBankButton';
import { FetchBankTransactionsButton } from '@/components/finance/FetchBankTransactionsButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Landmark, AlertCircle, ArrowLeft, RefreshCcw, Plus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
    title: 'Synchronisation Bancaire | Restaurant-OS',
    description: 'Gestion des connexions bancaires',
};

export const dynamic = 'force-dynamic';

export default async function BankSyncPage({
    searchParams
}: {
    searchParams: { error?: string, details?: string, sync?: string }
}) {
    const error = searchParams.error;
    const details = searchParams.details;
    const syncSuccess = searchParams.sync === 'success';

    // Récupérer les comptes bancaires connectés
    const accounts = await prisma.bankAccount.findMany({
        orderBy: { updatedAt: 'desc' }
    });

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Synchronisation Bancaire</h1>
                    <p className="text-muted-foreground">
                        Connectez vos comptes bancaires pour importer automatiquement vos transactions grâce à l'Open Banking (EnableBanking).
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" asChild>
                        <Link href="/finance">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour à la Finance
                        </Link>
                    </Button>
                    <SyncBankButton label="Connecter une banque" icon={<Plus className="h-4 w-4" />} />
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erreur de connexion</AlertTitle>
                    <AlertDescription>
                        Impossible de finaliser la connexion avec votre banque.
                        {details && (
                            <div className="mt-2 text-xs opacity-80 break-all p-2 bg-destructive/10 rounded-md shadow-inner">
                                Détails techniques: {details}
                            </div>
                        )}
                        <br /><br />
                        Veuillez réessayer ou contacter le support.
                    </AlertDescription>
                </Alert>
            )}

            {syncSuccess && (
                <Alert className="border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400">
                    <RefreshCcw className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle>Succès !</AlertTitle>
                    <AlertDescription>
                        Votre ou vos comptes bancaires ont été ajoutés et liés avec succès.
                    </AlertDescription>
                </Alert>
            )}

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Comptes liés ({accounts.length})</h2>
                {accounts.length > 0 && (
                    <FetchBankTransactionsButton />
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {accounts.length === 0 ? (
                    <Card className="col-span-full border-dashed">
                        <CardHeader className="text-center pb-4">
                            <CardTitle className="text-xl text-muted-foreground">Aucun compte configuré</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-sm text-muted-foreground mb-6">
                                Pour automatiser votre comptabilité, commencez par lier votre banque.
                            </p>
                            <SyncBankButton label="Connecter une banque" icon={<Plus className="h-4 w-4" />} />
                        </CardContent>
                    </Card>
                ) : (
                    accounts.map((account: any) => (
                        <Card key={account.id} className="relative overflow-hidden transition-all hover:shadow-md border-border/50 bg-gradient-to-br from-background to-muted/20">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Landmark className="w-24 h-24" />
                            </div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <div className="p-2 rounded-md bg-primary/10 text-primary">
                                        <Landmark className="w-5 h-5" />
                                    </div>
                                    {account.aspspName || 'Banque'}
                                </CardTitle>
                                <CardDescription className="font-mono mt-1">
                                    {account.accountName}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Devise</span>
                                        <span className="font-semibold">{account.currency}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Dernière synchro</span>
                                        <span>
                                            {account.lastSyncedAt
                                                ? format(new Date(account.lastSyncedAt), 'PPp', { locale: fr })
                                                : <span className="text-amber-500">Jamais synchronisé</span>}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <div className="mt-8 rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="p-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-primary" />
                        Comment fonctionne la synchronisation ?
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Grâce à la directive européenne PSD2 (DSP2) et notre partenaire tiers de confiance EnableBanking, vos données financières sont importées de manière sécurisée et en lecture seule.
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                        <li>Nous n'avons jamais accès à vos identifiants bancaires.</li>
                        <li>Vous devez renouveler l'autorisation tous les 90 jours (standard de sécurité imposé par les banques).</li>
                        <li>Utilisez le bouton "Rechercher les transactions" pour importer vos derniers mouvements.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
