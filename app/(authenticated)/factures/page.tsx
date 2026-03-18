import { prisma } from "@/lib/prisma";
import InvoiceUploadZone from "@/components/invoices/invoice-upload";
import InvoiceTable from "@/components/invoices/invoice-table";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { FileText, Database, Send, Sparkles, AlertTriangle } from "lucide-react";
import { syncHistoricalInvoicesAction } from "@/app/actions/invoices";

export const dynamic = "force-dynamic";

export default async function FacturesPage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const invoices = await prisma.$queryRaw`
    SELECT "id", "date", "supplierName", "amount", "driveWebViewUrl", "status", 
           "isSentToAccountant", "invoiceNumber", "amountHT", "vatRate", "vatAmount",
           "paymentMethod", "confidence", "errorMessage", "createdAt"
    FROM "Invoice"
    ORDER BY "createdAt" DESC
    LIMIT 100
  ` as any[];

  // Safe mapping
  const mappedInvoices = invoices.map((inv: any) => ({
    id: inv.id,
    date: inv.date,
    supplierName: inv.supplierName,
    amount: Number(inv.amount),
    driveWebViewUrl: inv.driveWebViewUrl,
    status: inv.status as "PENDING" | "PROCESSED" | "TO_VALIDATE" | "ERROR",
    isSentToAccountant: inv.isSentToAccountant,
    invoiceNumber: inv.invoiceNumber || null,
    amountHT: inv.amountHT != null ? Number(inv.amountHT) : null,
    vatRate: inv.vatRate != null ? Number(inv.vatRate) : null,
    vatAmount: inv.vatAmount != null ? Number(inv.vatAmount) : null,
    paymentMethod: inv.paymentMethod || null,
    confidence: inv.confidence != null ? Number(inv.confidence) : null,
    errorMessage: inv.errorMessage || null,
    createdAt: inv.createdAt,
  }));

  const totalCount = mappedInvoices.length;
  const processedCount = mappedInvoices.filter((i: any) => i.status === 'PROCESSED').length;
  const toValidateCount = mappedInvoices.filter((i: any) => i.status === 'TO_VALIDATE').length;
  const sentCount = mappedInvoices.filter((i: any) => i.isSentToAccountant).length;

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Factures & IA</h2>
          <p className="text-muted-foreground mt-1">
            Extraction enrichie V2 — HT, TVA, TTC, règlement, articles, confiance IA.
          </p>
        </div>
        <form action={syncHistoricalInvoicesAction}>
           <button type="submit" className="bg-primary hover:bg-primary/90 shadow-sm text-primary-foreground px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2">
             <Database className="w-4 h-4" />
             Lancer la synchro Drive
           </button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 px-1">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 flex flex-col gap-1.5">
           <FileText className="h-4 w-4 text-muted-foreground" />
           <p className="text-2xl font-bold">{totalCount}</p>
           <p className="text-xs text-muted-foreground">Factures traitées</p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 flex flex-col gap-1.5">
           <Sparkles className="h-4 w-4 text-primary" />
           <p className="text-2xl font-bold text-green-600">{processedCount}</p>
           <p className="text-xs text-muted-foreground">Validées (OK)</p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 flex flex-col gap-1.5">
           <AlertTriangle className="h-4 w-4 text-amber-500" />
           <p className="text-2xl font-bold text-amber-600">{toValidateCount}</p>
           <p className="text-xs text-muted-foreground">À vérifier</p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 flex flex-col gap-1.5">
           <Database className="h-4 w-4 text-muted-foreground" />
           <p className="text-2xl font-bold">{processedCount}</p>
           <p className="text-xs text-muted-foreground">Vectorisées</p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 flex flex-col gap-1.5">
           <Send className="h-4 w-4 text-muted-foreground" />
           <p className="text-2xl font-bold">{sentCount}</p>
           <p className="text-xs text-muted-foreground">Env. comptable</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-950 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UploadIcon className="w-5 h-5 text-primary" /> Dropzone Factures
            </h3>
            <p className="text-sm text-gray-500 mb-6 font-medium">
              PDF ou images (JPG, PNG). L'IA extrait HT, TVA, TTC, fournisseur, articles et mode de règlement.
            </p>
            <InvoiceUploadZone />
          </div>
        </div>
        
        <div className="lg:col-span-2 space-y-6">
           <div className="flex flex-col gap-4">
              <h3 className="text-xl font-semibold flex flex-col gap-1">
                 Historique des Factures
                 <span className="text-sm font-medium text-gray-400">Cliquez sur ✏️ pour corriger les données extraites par l'IA.</span>
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
