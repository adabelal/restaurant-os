"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Send, X, Mail, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { sendInvoicesToAccountant } from "@/app/actions/invoices";
import { toast } from "sonner";

interface InvoiceSendModalProps {
  selectedIds: string[];
  onSuccess: () => void;
}

export default function InvoiceSendModal({ selectedIds, onSuccess }: InvoiceSendModalProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("compta@exemple.com"); // Placeholder or default
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!email) {
      toast.error("Veuillez saisir une adresse email");
      return;
    }

    setIsSending(true);
    try {
      const result = await sendInvoicesToAccountant(selectedIds, email);
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        onSuccess();
      } else {
        toast.error(result.message);
      }
    } catch (e) {
      toast.error("Erreur technique lors de l'envoi");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button 
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95"
        >
          <Send className="w-4 h-4" />
          Envoyer {selectedIds.length} factures à la compta
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl border bg-white p-6 shadow-2xl dark:bg-gray-950 dark:border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-bold flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" /> Transmission Comptable
            </Dialog.Title>
            <Dialog.Close className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <div className="space-y-6">
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-bold text-primary">Prêt pour l'envoi</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedIds.length} documents vont être téléchargés depuis Google Drive et envoyés en pièces jointes.
                </p>
              </div>
            </div>

            {selectedIds.length > 8 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                <p className="text-[11px] text-amber-700 leading-tight">
                  <strong>Attention :</strong> Vous envoyez beaucoup de fichiers ({selectedIds.length}). 
                  Si la taille totale dépasse 10Mo, l'envoi pourrait échouer. Privilégiez des envois par lots de 5-8 factures.
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Email du comptable</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="compta@votre-entreprise.com"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={handleSend}
                disabled={isSending}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl font-bold shadow-lg shadow-primary/20 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Confirmer l'envoi
                  </>
                )}
              </button>
            </div>
            
            <p className="text-center text-[10px] text-gray-400">
              Le statut des factures passera à "Envoyé" une fois l'opération terminée.
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
