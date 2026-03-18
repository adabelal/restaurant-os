import { prisma } from "@/lib/prisma";
import InvoiceUploadZone from "@/components/invoices/invoice-upload";
import InvoiceTable from "@/components/invoices/invoice-table";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { FileText, Database, Send, Sparkles } from "lucide-react";
import { syncHistoricalInvoicesAction } from "@/app/actions/invoices";

export const dynamic = "force-dynamic";

export default async function FacturesPage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  // Safe mapping to match UI expectations
  const mappedInvoices = invoices.map((inv: any) => ({
    id: inv.id,
    date: inv.date,
    supplierName: inv.supplierName,
    amount: Number(inv.amount), // Convert Decimal to normal number
    driveWebViewUrl: inv.driveWebViewUrl,
    status: inv.status as "PENDING" | "PROCESSED" | "ERROR",
    isSentToAccountant: inv.isSentToAccountant,
  }));

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Factures & IA</h2>
          <p className="text-muted-foreground mt-1">
            Gérez vos factures intelligemment. Glissez-les, l'IA les découpe et les analyse.
          </p>
        </div>
        <form action={syncHistoricalInvoicesAction}>
           <button type="submit" className="bg-primary hover:bg-primary/90 shadow-sm text-primary-foreground px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2">
             <Database className="w-4 h-4" />
             Lancer la synchro Drive (Arrière-plan)
           </button>
        </form>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 px-1">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col gap-2">
           <FileText className="h-4 w-4 text-muted-foreground" />
           <p className="text-2xl font-bold">{invoices.length}</p>
           <p className="text-xs text-muted-foreground">Factures traîtées au total</p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col gap-2">
           <Sparkles className="h-4 w-4 text-primary" />
           <p className="text-2xl font-bold text-primary">Gemini 2.0</p>
           <p className="text-xs text-muted-foreground">Modèle d'extraction actif</p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col gap-2">
           <Database className="h-4 w-4 text-muted-foreground" />
           <p className="text-2xl font-bold">{mappedInvoices.filter((i: any) => i.status === 'PROCESSED').length}</p>
           <p className="text-xs text-muted-foreground">Vectorisées & Stockées</p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col gap-2">
           <Send className="h-4 w-4 text-muted-foreground" />
           <p className="text-2xl font-bold">{mappedInvoices.filter((i: any) => i.isSentToAccountant).length}</p>
           <p className="text-xs text-muted-foreground">Envoyées à la comptable</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-950 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UploadIcon className="w-5 h-5 text-primary" /> Dropzone Factures
            </h3>
            <p className="text-sm text-gray-500 mb-6 font-medium">
              Importez un ou plusieurs PDF contenant des dizaines de factures. L'IA s'occupe de les découper par page et de trouver le fournisseur.
            </p>
            <InvoiceUploadZone />
          </div>
        </div>
        
        <div className="lg:col-span-2 space-y-6">
           <div className="flex flex-col gap-4">
              <h3 className="text-xl font-semibold flex flex-col gap-1">
                 Historique Récent 
                 <span className="text-sm font-medium text-gray-400">Recherche sémantique bientôt disponible.</span>
              </h3>
              <InvoiceTable invoices={mappedInvoices} />
           </div>
        </div>
      </div>
    </div>
  );
}

function UploadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  );
}
