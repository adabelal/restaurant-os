"use client";

import { useState, Fragment } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ExternalLink, CheckCircle2, AlertCircle, Clock, AlertTriangle, Trash2, Send, Sparkles, FileText, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import InvoiceEditModal from "./invoice-edit-modal";
import InvoiceSendModal from "./invoice-send-modal";
import { deleteInvoiceAction } from "@/app/actions/invoices";

export type Invoice = {
  id: string;
  date: Date;
  supplierName: string;
  amount: number;
  driveWebViewUrl: string | null;
  driveFileId: string | null;
  status: "PENDING" | "PROCESSED" | "TO_VALIDATE" | "ERROR";
  isSentToAccountant: boolean;
  invoiceNumber: string | null;
  amountHT: number | null;
  vatRate: number | null;
  vatAmount: number | null;
  paymentMethod: string | null;
  confidence: number | null;
  errorMessage: string | null;
  resume: string | null;
  lineItems: any[];
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
  const [sortBy, setSortBy] = useState<'date' | 'createdAt'>('date');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [detailsInvoice, setDetailsInvoice] = useState<Invoice | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

  const toggleSelection = (id: string) => {
    setSelectedInvoices(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Trier par :</span>
            <button
              onClick={() => setSortBy('date')}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${sortBy === 'date' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-600 hover:bg-gray-100 border border-gray-200 dark:border-gray-700'}`}
            >
              Date facture
            </button>
            <button
              onClick={() => setSortBy('createdAt')}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${sortBy === 'createdAt' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-600 hover:bg-gray-100 border border-gray-200 dark:border-gray-700'}`}
            >
              Date extraction
            </button>
          </div>
        </div>

        {selectedInvoices.length > 0 && (
          <InvoiceSendModal 
            selectedIds={selectedInvoices} 
            onSuccess={() => setSelectedInvoices([])}
          />
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-bold border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="px-4 py-3 w-10">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                  onChange={(e) => {
                    if (e.target.checked) setSelectedInvoices(sorted.map(i => i.id));
                    else setSelectedInvoices([]);
                  }}
                  checked={selectedInvoices.length === sorted.length && sorted.length > 0}
                />
              </th>
              <th className="px-4 py-3 w-28">Date</th>
              <th className="px-4 py-3">Fournisseur & Résumé IA</th>
              <th className="px-4 py-3 text-right w-24">TTC</th>
              <th className="px-4 py-3 w-32">Extraction</th>
              <th className="px-4 py-3 w-24">Statut</th>
              <th className="px-4 py-3 w-32">Compta</th>
              <th className="px-4 py-3 text-center w-32">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {sorted.map((inv) => (
              <tr
                key={inv.id}
                className={`group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                  inv.status === 'TO_VALIDATE' ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''
                } ${inv.status === 'ERROR' ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}
                onClick={() => setDetailsInvoice(inv)}
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                    checked={selectedInvoices.includes(inv.id)}
                    onChange={() => toggleSelection(inv.id)}
                  />
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap text-xs font-semibold">
                  {format(new Date(inv.date), "dd/MM/yyyy", { locale: fr })}
                </td>
                <td className="px-4 py-3">
                  <div className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate max-w-[250px]">
                    {inv.supplierName.replace(/_/g, ' ')}
                  </div>
                  {inv.resume && (
                    <div className="text-[10px] text-gray-500 mt-0.5 italic leading-tight truncate max-w-[400px]" title={inv.resume}>
                      {inv.resume}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-bold text-right text-sm">
                  {inv.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
                </td>
                <td className="px-4 py-3 text-gray-400 text-[10px] whitespace-nowrap">
                  {format(new Date(inv.createdAt), "dd/MM à HH:mm", { locale: fr })}
                </td>
                <td className="px-4 py-3">
                  {inv.status === "PROCESSED" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle2 className="w-2.5 h-2.5" /> OK
                    </span>
                  ) : inv.status === "TO_VALIDATE" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                      <AlertTriangle className="w-2.5 h-2.5" /> À VÉRIFIER
                    </span>
                  ) : inv.status === "ERROR" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                      <AlertCircle className="w-2.5 h-2.5" /> ERREUR
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      <Clock className="w-2.5 h-2.5" /> ATTENTE
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {inv.isSentToAccountant ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      <Send className="w-2.5 h-2.5" /> TRANSMIS
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500">
                      <Clock className="w-2.5 h-2.5" /> À ENVOYER
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setDetailsInvoice(inv)}
                      className="text-primary hover:text-primary/80 transition-colors p-1.5 rounded-md hover:bg-primary/10"
                      title="Détails"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                    {inv.driveWebViewUrl && (
                      <button
                        onClick={() => setPreviewUrl(inv.driveWebViewUrl)}
                        className="text-gray-400 hover:text-primary transition-colors p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                        title="Voir PDF"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                    <InvoiceEditModal invoice={{
                      id: inv.id,
                      supplierName: inv.supplierName,
                      date: inv.date,
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
                        className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                        title="Supprimer"
                        onClick={(e) => {
                          if (!confirm('Supprimer cette facture ?')) e.preventDefault();
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      <Dialog.Root open={!!detailsInvoice} onOpenChange={(open) => !open && setDetailsInvoice(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] gap-6 rounded-2xl border bg-white p-8 shadow-2xl dark:bg-gray-950 dark:border-gray-800 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div>
                <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {detailsInvoice?.supplierName.replace(/_/g, ' ')}
                </Dialog.Title>
                <p className="text-sm text-gray-500 mt-1">
                  Facture du {detailsInvoice && format(new Date(detailsInvoice.date), "dd MMMM yyyy", { locale: fr })}
                </p>
              </div>
              <Dialog.Close className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">Résumé de l'IA</h4>
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 italic text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {detailsInvoice?.resume || "Aucun résumé disponible."}
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">Articles détectés</h4>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {detailsInvoice?.lineItems && Array.isArray(detailsInvoice.lineItems) && detailsInvoice.lineItems.length > 0 ? (
                      detailsInvoice.lineItems.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm transition-all hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/5 text-primary text-xs font-bold border border-primary/10">
                              {item.quantity}x
                            </span>
                            <span className="text-sm font-medium">{item.description}</span>
                          </div>
                          <span className="text-xs font-mono text-gray-500">{item.unitPrice}€ / u</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-4 italic">Aucun article détaillé.</p>
                    )}
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">Données financières</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Total HT</p>
                      <p className="text-lg font-mono font-bold mt-1 text-gray-700 dark:text-gray-200">{detailsInvoice?.amountHT || 0}€</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">TVA Total</p>
                      <p className="text-lg font-mono font-bold mt-1 text-gray-700 dark:text-gray-200">{detailsInvoice?.vatAmount || 0}€</p>
                    </div>
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl shadow-sm col-span-2">
                      <p className="text-[10px] text-primary uppercase font-black tracking-widest">Total TTC (Final)</p>
                      <p className="text-2xl font-mono font-black mt-1 text-primary">{detailsInvoice?.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">Informations complémentaires</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm py-2 border-b border-gray-50 dark:border-gray-900">
                      <span className="text-gray-500">N° Facture</span>
                      <span className="font-mono text-gray-900 dark:text-gray-100">{detailsInvoice?.invoiceNumber || "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm py-2 border-b border-gray-50 dark:border-gray-900">
                      <span className="text-gray-500">Mode de règlement</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {detailsInvoice?.paymentMethod ? (PAYMENT_LABELS[detailsInvoice.paymentMethod] || detailsInvoice.paymentMethod) : '—'}
                      </span>
                    </div>
                  </div>
                </section>
                
                <div className="pt-4 flex items-center gap-3">
                  <button 
                    onClick={() => detailsInvoice?.driveWebViewUrl && setPreviewUrl(detailsInvoice.driveWebViewUrl)}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 rounded-xl font-semibold transition-all"
                  >
                    <FileText className="w-4 h-4" /> Voir le document
                  </button>
                </div>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Preview Dialog */}
      <Dialog.Root open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-5xl translate-x-[-50%] translate-y-[-50%] gap-4 rounded-xl border bg-white p-6 shadow-xl dark:bg-gray-950 dark:border-gray-800 h-[90vh]">
            <Dialog.Title className="text-lg font-semibold flex items-center justify-between">
              Aperçu du document
              <Dialog.Close className="text-gray-400 hover:text-gray-600 transition-colors">✕</Dialog.Close>
            </Dialog.Title>
            <div className="w-full h-full bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden relative shadow-inner group">
              {previewUrl && (
                <iframe 
                  src={previewUrl.includes('drive.google.com') 
                    ? `https://drive.google.com/file/d/${detailsInvoice?.driveFileId}/preview` 
                    : previewUrl} 
                  className="absolute inset-0 w-full h-full border-0" 
                  allow="autoplay" 
                />
              )}
              {/* Fallback overlay if iframe is blocked */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <a 
                  href={detailsInvoice?.driveWebViewUrl || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white/90 dark:bg-black/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-bold shadow-xl border dark:border-gray-800 flex items-center gap-2 hover:bg-primary hover:text-white transition-all text-gray-900 dark:text-gray-100"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Ouvrir dans Drive
                </a>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
