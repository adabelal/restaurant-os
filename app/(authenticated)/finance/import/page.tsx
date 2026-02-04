import { BankImportDropzone } from "@/components/finance/BankImportDropzone"
import { Upload, FileUp } from "lucide-react"

export default function BankImportPage() {
    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 space-y-8 p-8 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 to-slate-900 p-8 shadow-xl text-white">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

                <div className="relative z-10">
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
                        <Upload className="h-8 w-8 text-blue-400" />
                        Import Bancaire
                    </h1>
                    <p className="mt-2 text-slate-300 font-medium max-w-xl text-lg">
                        Synchronisez votre trésorerie en important vos relevés bancaires (PDF, CSV).
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <FileUp className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Zone de dépôt</h2>
                        <p className="text-sm text-slate-500">Formats supportés : PDF (CIC/Crédit Mutuel), CSV.</p>
                    </div>
                </div>
                <BankImportDropzone />
            </div>
        </div>
    )
}
