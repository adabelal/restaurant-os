"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Pencil, X } from "lucide-react";
import { updateInvoiceAction } from "@/app/actions/invoices";

type InvoiceForEdit = {
  id: string;
  date: Date;
  supplierName: string;
  amount: number;
  invoiceNumber: string | null;
  amountHT: number | null;
  vatRate: number | null;
  vatAmount: number | null;
  paymentMethod: string | null;
};

export default function InvoiceEditModal({ invoice }: { invoice: InvoiceForEdit }) {
  const [open, setOpen] = useState(false);

  const dateStr = new Date(invoice.date).toISOString().split('T')[0];

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-primary transition-colors font-medium px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Modifier"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-xl border bg-white p-6 shadow-xl dark:bg-gray-950 dark:border-gray-800">
          <Dialog.Title className="text-lg font-semibold flex items-center justify-between mb-6">
            Modifier la facture
            <Dialog.Close className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </Dialog.Title>

          <form action={async (formData) => {
            await updateInvoiceAction(formData);
            setOpen(false);
          }} className="space-y-4">
            <input type="hidden" name="id" value={invoice.id} />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fournisseur</label>
                <input
                  name="supplierName"
                  defaultValue={invoice.supplierName}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                <input
                  name="date"
                  type="date"
                  defaultValue={dateStr}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">N° Facture</label>
                <input
                  name="invoiceNumber"
                  defaultValue={invoice.invoiceNumber || ''}
                  placeholder="FA-2024-0142"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Règlement</label>
                <select
                  name="paymentMethod"
                  defaultValue={invoice.paymentMethod || ''}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                >
                  <option value="">Non identifié</option>
                  <option value="CB">Carte Bancaire</option>
                  <option value="VIREMENT">Virement</option>
                  <option value="PRELEVEMENT">Prélèvement</option>
                  <option value="CHEQUE">Chèque</option>
                  <option value="ESPECES">Espèces</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Montant HT (€)</label>
                <input
                  name="amountHT"
                  type="number"
                  step="0.01"
                  defaultValue={invoice.amountHT ?? ''}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">TVA (%)</label>
                <input
                  name="vatRate"
                  type="number"
                  step="0.1"
                  defaultValue={invoice.vatRate ?? ''}
                  placeholder="20.0"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">TVA (€)</label>
                <input
                  name="vatAmount"
                  type="number"
                  step="0.01"
                  defaultValue={invoice.vatAmount ?? ''}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Montant TTC (€)</label>
              <input
                name="amount"
                type="number"
                step="0.01"
                defaultValue={invoice.amount}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none font-mono text-lg font-bold"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-800">
              <Dialog.Close asChild>
                <button type="button" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">
                  Annuler
                </button>
              </Dialog.Close>
              <button
                type="submit"
                className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
