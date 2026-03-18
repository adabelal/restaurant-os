"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ExternalLink, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

type Invoice = {
  id: string;
  date: Date;
  supplierName: string;
  amount: number;
  driveWebViewUrl: string | null;
  status: "PENDING" | "PROCESSED" | "ERROR";
  isSentToAccountant: boolean;
};

export default function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  const [selectedInvoiceUrl, setSelectedInvoiceUrl] = useState<string | null>(null);

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 border border-dashed border-gray-200 rounded-xl dark:bg-gray-800/50 dark:border-gray-700">
        <p className="text-gray-500 font-medium">Aucune facture enregistrée pour le moment.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-medium border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 flex-1">Fournisseur</th>
              <th className="px-6 py-4">Montant TTC</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4">Document</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                  {format(new Date(inv.date), "dd MMM yyyy", { locale: fr })}
                </td>
                <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">
                  {inv.supplierName}
                </td>
                <td className="px-6 py-4 font-mono">
                  {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(inv.amount)}
                </td>
                <td className="px-6 py-4">
                  {inv.status === "PROCESSED" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Enregistré
                    </span>
                  ) : inv.status === "ERROR" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
                      <AlertCircle className="w-3.5 h-3.5" /> Erreur
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
                      <Clock className="w-3.5 h-3.5" /> En attente
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {inv.driveWebViewUrl ? (
                    <button
                      onClick={() => setSelectedInvoiceUrl(inv.driveWebViewUrl!)}
                      className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                    >
                      Facture <ExternalLink className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="text-gray-400 italic text-xs">Indisponible</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog.Root open={!!selectedInvoiceUrl} onOpenChange={(open) => !open && setSelectedInvoiceUrl(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-5xl translate-x-[-50%] translate-y-[-50%] gap-4 rounded-xl border bg-white p-6 shadow-xl dark:bg-gray-950 dark:border-gray-800 h-[90vh]">
            <Dialog.Title className="text-lg font-semibold flex items-center justify-between">
              Création de la facture
              <Dialog.Close className="text-gray-400 hover:text-gray-600 transition-colors">
                ✕
              </Dialog.Close>
            </Dialog.Title>
            <div className="w-full h-full bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden relative">
              {selectedInvoiceUrl && (
                <iframe
                  src={selectedInvoiceUrl}
                  className="absolute inset-0 w-full h-full"
                  allow="autoplay"
                />
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
