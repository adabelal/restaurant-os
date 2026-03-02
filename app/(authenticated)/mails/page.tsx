import { Metadata } from 'next';
import { Mail, Download, ShieldCheck, MailOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
    title: 'Mails Traités | Restaurant-OS',
    description: 'Historique des factures reçues par mail',
};

export default function MailsPage() {
    return (
        <div className="flex flex-col gap-6 md:gap-8 max-w-7xl mx-auto p-4 md:p-8 font-sans">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
                    <Mail className="h-8 w-8 text-blue-500" />
                    Mails Traités & Fichiers
                </h1>
                <p className="text-muted-foreground">
                    Ici s'affichent les emails interceptés par notre bot (n8n/Gmail) et les factures/fichiers téléchargés automatiquement.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-sm border-border">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <MailOpen className="h-5 w-5 text-blue-500" />
                        <CardTitle className="text-xl">Derniers Mails Analysés</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-muted-foreground italic text-sm text-center py-8">
                            (Aucun mail récent. En attente du webhook d'automatisation.)
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-border">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <Download className="h-5 w-5 text-indigo-500" />
                        <CardTitle className="text-xl">Fichiers DDL Extraits</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-muted-foreground italic text-sm text-center py-8">
                            (Aucune pièce jointe récupérée pour le moment.)
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
