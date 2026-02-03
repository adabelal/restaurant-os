import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Restaurant OS",
    description: "Système de gestion complet pour restaurant",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr" suppressHydrationWarning>
            <body className={inter.className}>
                <AuthProvider>
                    <ThemeProvider defaultTheme="light" storageKey="restaurant-os-theme">
                        {children}
                        <Toaster position="top-center" richColors />
                    </ThemeProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
