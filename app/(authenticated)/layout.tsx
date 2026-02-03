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

            <div className="flex-1 flex flex-col md:pl-72 h-full overflow-y-auto w-full relative">
                {/* Mobile Header */}
                <MobileHeader />

                {/* Decorative Background Elements */}
                <div className="fixed top-0 right-0 -z-10 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="fixed bottom-0 left-72 -z-10 w-[400px] h-[400px] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />

                <main className="flex-1 w-full max-w-[1600px] mx-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
