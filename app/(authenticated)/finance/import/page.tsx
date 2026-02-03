
import { BankImportDropzone } from "@/components/finance/BankImportDropzone"

export default function BankImportPage() {
    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 space-y-8 p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 border-b pb-4">
                Import Relevé Bancaire
            </h1>
            <p className="text-slate-500 font-medium max-w-2xl">
                Importez vos fichiers CSV ou Excel (QIF à venir) pour synchroniser votre trésorerie et faire le rapprochement automatique.
            </p>
            <BankImportDropzone />
        </div>
    )
}
