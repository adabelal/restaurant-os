import { Sidebar } from "@/components/layout/Sidebar"

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
            <Sidebar />
            <div className="flex-1 flex flex-col md:pl-64 h-full overflow-y-auto w-full">
                {children}
            </div>
        </div>
    )
}
