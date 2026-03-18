"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ExternalLink, CheckCircle2, AlertCircle, Clock, AlertTriangle, Trash2 } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import InvoiceEditModal from "./invoice-edit-modal";
import { deleteInvoiceAction } from "@/app/actions/invoices";

export type Invoice = {
  id: string;
  date: Date;
  supplierName: string;
  amount: number;
  driveWebViewUrl: string | null;
  status: "PENDING" | "PROCESSED" | "TO_VALIDATE" | "ERROR";
  isSentToAccountant: boolean;
  invoiceNumber: string | null;
  amountHT: number | null;
  vatRate: number | null;
  vatAmount: number | null;
  paymentMethod: string | null;
  confidence: number | null;
  errorMessage: string | null;
  createdAt: Date;
};

const PAYMENT_LABELS: Record<string, string> = {
  CB: "CB",
  VIREMENT: "Virement",
  PRELEVEMENT: "Prélèv.",
  CHEQUE: "Chèque",
  ESPECES: "Espèces",
};

export default function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  const [selectedInvoiceUrl, setSelectedInvoiceUrl] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'createdAt'>('date');

  const sorted = [...invoices].sort((a, b) => {
    const dateA = new Date(sortBy === 'date' ? a.date : a.createdAt).getTime();
    const dateB = new Date(sortBy === 'date' ? b.date : b.createdAt).getTime();
    return dateB - dateA;
  });

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 border border-dashed border-gray-200 rounded-xl dark:bg-gray-800/50 dark:border-gray-700">
        <p className="text-gray-500 font-medium">Aucune facture enregistrée pour le moment.</p>
      </div>
    );
  }

  return (
    <>
      {/* Sort controls */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-gray-500 font-medium">Trier par :</span>
        <button
          onClick={() => setSortBy('date')}
          className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${sortBy === 'date' ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'}`}
        >
          Date facture
        </button>
        <button
          onClick={() => setSortBy('createdAt')}
          className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${sortBy === 'createdAt' ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'}`}
        >
          Date extraction
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-medium border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Fournisseur</th>
              <th className="px-4 py-3 text-right">HT</th>
              <th className="px-4 py-3 text-right">TVA</th>
              <th className="px-4 py-3 text-right">TTC</th>
              <th className="px-4 py-3">Règlement</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {sorted.map((inv) => (
              <tr
                key={inv.id}
                className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                  inv.status === 'TO_VALIDATE' ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''
                } ${inv.status === 'ERROR' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}
              >
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap text-xs">
                  {format(new Date(inv.date), "dd MMM yyyy", { locale: fr })}
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                    {inv.supplierName.replace(/_/g, ' ')}
                  </div>
                  {inv.invoiceNumber && (
                    <div className="text-xs text-gray-400 mt-0.5">N° {inv.invoiceNumber}</div>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-right text-xs text-gray-500">
                  {inv.amountHT != null ? `${inv.amountHT.toFixed(2)}€` : '—'}
                </td>
                <td className="px-4 py-3 font-mono text-right text-xs text-gray-400">
                  {inv.vatAmount != null ? (
                    <span title={inv.vatRate != null ? `Taux: ${inv.vatRate}%` : ''}>
                      {inv.vatAmount.toFixed(2)}€
                    </span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 font-mono text-right font-semibold whitespace-nowrap">
                  {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(inv.amount)}
                </td>
                <td className="px-4 py-3">
                  {inv.paymentMethod ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {PAYMENT_LABELS[inv.paymentMethod] || inv.paymentMethod}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {inv.status === "PROCESSED" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle2 className="w-3 h-3" /> OK
                    </span>
                  ) : inv.status === "TO_VALIDATE" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" title={inv.confidence != null ? `Confiance: ${(inv.confidence * 100).toFixed(0)}%` : ''}>
                      <AlertTriangle className="w-3 h-3" /> À vérifier
                    </span>
                  ) : inv.status === "ERROR" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" title={inv.errorMessage || ''}>
                      <AlertCircle className="w-3 h-3" /> Erreur
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                      <Clock className="w-3 h-3" /> Attente
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    {inv.driveWebViewUrl && (
                      <button
                        onClick={() => setSelectedInvoiceUrl(inv.driveWebViewUrl!)}
                        className="text-primary hover:text-primary/80 transition-colors p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                        title="Voir le document"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <InvoiceEditModal invoice={{
                      id: inv.id,
                      date: inv.date,
                      supplierName: inv.supplierName,
                      amount: inv.amount,
                      invoiceNumber: inv.invoiceNumber,
                      amountHT: inv.amountHT,
                      vatRate: inv.vatRate,
                      vatAmount: inv.vatAmount,
                      paymentMethod: inv.paymentMethod,
                    }} />
                    <form action={deleteInvoiceAction}>
                      <input type="hidden" name="id" value={inv.id} />
                      <button
                        type="submit"
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                        title="Supprimer"
                        onClick={(e) => {
                          if (!confirm('Supprimer cette facture ?')) e.preventDefault();
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Preview Dialog */}
      <Dialog.Root open={!!selectedInvoiceUrl} onOpenChange={(open) => !open && setSelectedInvoiceUrl(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-5xl translate-x-[-50%] translate-y-[-50%] gap-4 rounded-xl border bg-white p-6 shadow-xl dark:bg-gray-950 dark:border-gray-800 h-[90vh]">
            <Dialog.Title className="text-lg font-semibold flex items-center justify-between">
              Aperçu du document
              <Dialog.Close className="text-gray-400 hover:text-gray-600 transition-colors">✕</Dialog.Close>
            </Dialog.Title>
            <div className="w-full h-full bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden relative">
              {selectedInvoiceUrl && (
                <iframe src={selectedInvoiceUrl} className="absolute inset-0 w-full h-full" allow="autoplay" />
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
