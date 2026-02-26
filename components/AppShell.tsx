"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isLoginPage = pathname === "/login"

    if (isLoginPage) {
        return <>{children}</>
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar />
            <div className="flex-1 flex flex-col md:pl-64 h-full overflow-y-auto w-full">
                {children}
            </div>
        </div>
    )
}
