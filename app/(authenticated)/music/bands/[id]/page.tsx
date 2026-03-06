import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { BandProfileClient } from "./BandProfileClient"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function BandPage({ params }: { params: { id: string } }) {
    const band = await prisma.musicBand.findUnique({
        where: { id: params.id },
        include: {
            events: {
                orderBy: { date: 'desc' }
            }
        }
    })

    if (!band) {
        notFound()
    }

    // Convert Decimals to numbers for the client component
    const serializedBand = {
        ...band,
        events: band.events.map(e => ({
            ...e,
            amount: Number(e.amount)
        }))
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center gap-4 mb-4">
                <Link href="/music">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-primary font-oswald uppercase">
                        {band.name}
                    </h2>
                    <p className="text-muted-foreground capitalize">
                        Profil Artiste / Groupe
                    </p>
                </div>
            </div>

            <BandProfileClient band={serializedBand} />
        </div>
    )
}
