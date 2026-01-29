import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Restaurant OS",
    description: "Système de gestion complet pour restaurant",
};

import { Providers } from "@/components/Providers";
import { AppShell } from "@/components/AppShell";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr" suppressHydrationWarning>
            <body className={inter.className}>
                <Providers>
                    <ThemeProvider defaultTheme="light" storageKey="restaurant-os-theme">
                        <AppShell>
                            {children}
                        </AppShell>
                    </ThemeProvider>
                </Providers>
            </body>
        </html>
    );
}
