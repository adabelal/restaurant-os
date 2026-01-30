import { prisma } from "@/lib/prisma"
import { InvoiceUploadButton } from "@/components/achats/InvoiceUploadButton"
import { InvoiceList } from "@/components/achats/InvoiceList"
import { AchatsStats } from "@/components/achats/AchatsStats"
import { ShoppingCart, AlertTriangle, check } from "lucide-react"

export default async function AchatsPage() {
    const invoices = await prisma.purchaseOrder.findMany({
        orderBy: { date: 'desc' },
        include: {
            supplier: true,
            items: true
        }
    })

    // Mock stats calculation
    const totalAmount = invoices.reduce((acc, inv) => acc + Number(inv.totalAmount), 0)
    const alertCount = invoices.filter(inv => inv.status === 'ALERT').length

    return (
        <main className="flex min-h-screen flex-col bg-slate-50/50">
            {/* Header */}
            <div className="w-full bg-white border-b px-8 py-8 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
                            <ShoppingCart className="h-8 w-8 text-indigo-600" />
                            Achats & Factures
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium">Digitalisation, suivi des prix et alertes fournisseurs.</p>
                    </div>

                    <div className="flex gap-3">
                        <InvoiceUploadButton />
                    </div>
                </div>
            </div>

            <div className="flex-1 px-8 py-8 max-w-7xl mx-auto w-full space-y-8">

                {/* Stats Section */}
                <AchatsStats totalAmount={totalAmount} alertCount={alertCount} />

                {/* Invoices List */}
                <InvoiceList invoices={invoices} />

            </div>
        </main>
    )
}
