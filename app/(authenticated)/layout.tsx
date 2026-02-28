import { Sidebar } from "@/components/layout/Sidebar"
import { MobileHeader } from "@/components/layout/MobileHeader"

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
            {/* Desktop Sidebar */}
            <Sidebar />

            <div className="flex-1 flex flex-col md:pl-72 h-full overflow-y-auto overflow-x-hidden w-full relative">
                {/* Mobile Header */}
                <MobileHeader />

                {/* Decorative Background Elements */}
                <div className="fixed top-0 right-0 -z-10 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-red-600/10 blur-[90px] md:blur-[120px] rounded-full pointer-events-none" />
                <div className="fixed bottom-0 left-0 md:left-72 -z-10 w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-amber-500/10 blur-[80px] md:blur-[100px] rounded-full pointer-events-none" />

                <main className="flex-1 w-full max-w-[1600px] mx-auto flex flex-col pt-4 md:pt-0 pb-16 md:pb-0">
                    {children}
                </main>
            </div>
        </div>
    )
}
