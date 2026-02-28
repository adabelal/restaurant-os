import { prisma } from "@/lib/prisma"
export const dynamic = 'force-dynamic'
import { InvoiceUploadButton } from "@/components/achats/InvoiceUploadButton"
import { InvoiceList } from "@/components/achats/InvoiceList"
import { AchatsStats } from "@/components/achats/AchatsStats"
import { ShoppingCart, FileText, Search } from "lucide-react"
import { requireAuthOrRedirect } from "@/lib/auth-utils"

export default async function AchatsPage() {
    await requireAuthOrRedirect()

    const invoices = await prisma.purchaseOrder.findMany({
        orderBy: { date: 'desc' },
        include: {
            supplier: true,
            items: true
        }
    })

    const totalAmount = invoices.reduce((acc, inv) => acc + Number(inv.totalAmount), 0)
    const alertCount = invoices.filter(inv => inv.status === 'ALERT').length
    const unlinkedCount = await prisma.invoiceItem.count({
        where: { ingredientId: null }
    })

    return (
        <main className="flex min-h-screen flex-col bg-[#faf9f6]">
            {/* Premium Emerald Header */}
            <div className="w-full bg-gradient-to-br from-[#064e3b] via-[#065f46] to-[#042f2e] px-4 py-8 md:px-10 md:py-12 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-amber-500/10 blur-[80px]" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-emerald-400/5 blur-[100px]" />

                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10 text-white">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-amber-500/20 rounded-2xl backdrop-blur-md border border-amber-500/20 shadow-inner">
                                <FileText className="h-8 w-8 text-amber-400" />
                            </div>
                            <h1 className="text-4xl font-black tracking-tighter uppercase italic drop-shadow-sm">Achats & Factures</h1>
                        </div>
                        <p className="text-emerald-100/70 font-medium">Digitalisation, suivi des prix et audit fournisseur intelligent.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {unlinkedCount > 0 && (
                            <div className="relative">
                                <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce z-20">
                                    {unlinkedCount}
                                </span>
                                <a href="/achats/linking" className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-lg hover:scale-105 border border-white/10">
                                    <ShoppingCart className="h-5 w-5" />
                                    Smart Link
                                </a>
                            </div>
                        )}
                        <InvoiceUploadButton />
                    </div>
                </div>
            </div>

            <div className="flex-1 px-4 py-6 md:px-8 md:py-10 max-w-7xl mx-auto w-full space-y-8 md:space-y-12">
                {/* Visual Stats Section */}
                <AchatsStats totalAmount={totalAmount} alertCount={alertCount} />

                {/* Main Content Area */}
                <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden ring-1 ring-emerald-900/5 transition-all">
                    <div className="p-6 md:p-10 border-b border-emerald-900/5 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                        <h2 className="text-2xl font-black text-[#064e3b] italic uppercase tracking-tighter">Registre des Facturiers</h2>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-900/40 group-focus-within:text-emerald-700 transition-colors" />
                            <input
                                placeholder="Rechercher un fournisseur ou montant..."
                                className="h-12 w-full md:w-80 pl-12 pr-6 rounded-2xl bg-white border border-emerald-900/5 shadow-sm focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium text-emerald-900 transition-all placeholder:text-emerald-900/20"
                            />
                        </div>
                    </div>
                    <InvoiceList invoices={invoices} />
                </div>
            </div>
        </main>
    )
}
