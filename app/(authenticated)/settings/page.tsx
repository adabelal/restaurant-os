import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SettingsClient } from "./SettingsClient"
import { prisma } from "@/lib/prisma"

export default async function SettingsPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        redirect("/login")
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        }
    })

    if (!user) {
        redirect("/login")
    }

    return (
        <div className="p-4 md:p-8 lg:p-12 min-h-screen bg-slate-50/10 transition-all duration-300">
            <SettingsClient user={user} />
        </div>
    )
}
