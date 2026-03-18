import { prisma } from "@/lib/prisma";
import InvoiceUploadZone from "@/components/invoices/invoice-upload";
import InvoiceTable from "@/components/invoices/invoice-table";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { FileText, Database, Send, Sparkles, AlertTriangle, Upload } from "lucide-react";
import { syncHistoricalInvoicesAction } from "@/app/actions/invoices";

export const dynamic = "force-dynamic";

export default async function FacturesPage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const invoices = await prisma.$queryRaw`
    SELECT "id", "date", "supplierName", "amount", "driveWebViewUrl", "driveFileId", "status", 
           "isSentToAccountant", "invoiceNumber", "amountHT", "vatRate", "vatAmount",
           "paymentMethod", "confidence", "errorMessage", "createdAt", "resume", "lineItems"
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
    driveFileId: inv.driveFileId,
    status: inv.status as "PENDING" | "PROCESSED" | "TO_VALIDATE" | "ERROR",
    isSentToAccountant: inv.isSentToAccountant,
    invoiceNumber: inv.invoiceNumber || null,
    amountHT: inv.amountHT != null ? Number(inv.amountHT) : null,
    vatRate: inv.vatRate != null ? Number(inv.vatRate) : null,
    vatAmount: inv.vatAmount != null ? Number(inv.vatAmount) : null,
    paymentMethod: inv.paymentMethod || null,
    confidence: inv.confidence != null ? Number(inv.confidence) : null,
    errorMessage: inv.errorMessage || null,
    resume: inv.resume || null,
    lineItems: inv.lineItems || [],
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

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Colonne de statistiques à gauche */}
        <div className="md:col-span-4 space-y-3">
          <div className="bg-white dark:bg-gray-950 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg"><FileText className="h-4 w-4 text-gray-500" /></div>
               <span className="text-sm font-medium">Total traitées</span>
             </div>
             <p className="text-lg font-bold">{totalCount}</p>
          </div>

          <div className="bg-white dark:bg-gray-950 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg"><Sparkles className="h-4 w-4 text-green-600" /></div>
               <span className="text-sm font-medium">Validées (OK)</span>
             </div>
             <p className="text-lg font-bold text-green-600">{processedCount}</p>
          </div>

          <div className="bg-white dark:bg-gray-950 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg"><AlertTriangle className="h-4 w-4 text-amber-500" /></div>
               <span className="text-sm font-medium">À vérifier</span>
             </div>
             <p className="text-lg font-bold text-amber-600">{toValidateCount}</p>
          </div>

          <div className="bg-white dark:bg-gray-950 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg"><Database className="h-4 w-4 text-blue-500" /></div>
               <span className="text-sm font-medium">Vectorisées</span>
             </div>
             <p className="text-lg font-bold text-blue-600">{processedCount}</p>
          </div>

          <div className="bg-white dark:bg-gray-950 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg"><Send className="h-4 w-4 text-gray-500" /></div>
               <span className="text-sm font-medium">Env. comptable</span>
             </div>
             <p className="text-lg font-bold">{sentCount}</p>
          </div>
        </div>

        {/* Dropzone à droite */}
        <div className="md:col-span-8 bg-white dark:bg-gray-950 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm h-full flex flex-col justify-center">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" /> Scanner Intelligent
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">IA Powered</span>
          </div>
          <InvoiceUploadZone />
          <p className="text-[10px] text-center text-gray-400 mt-4 leading-relaxed">
            Format PDF ou Images supportés. Découpage automatique des lots multi-pages.
          </p>
        </div>
      </div>

        {/* Historique pleine largeur */}
        <div className="bg-white dark:bg-gray-950 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex flex-col gap-1 mb-6">
            <h3 className="text-xl font-semibold">Historique des Factures</h3>
            <p className="text-sm font-medium text-gray-500">
              Gérez vos justificatifs et suivez l'état des transmissions comptables.
            </p>
          </div>
          <InvoiceTable invoices={mappedInvoices} />
      </div>
    </div>
  );
}
