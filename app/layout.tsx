import type { Metadata } from "next";
import { Inter, Oswald, Open_Sans, Permanent_Marker } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans" });
const permanentMarker = Permanent_Marker({ weight: "400", subsets: ["latin"], variable: "--font-permanent-marker" });

export const metadata: Metadata = {
    title: "Le Siwa | Restaurant OS",
    description: "Système de gestion complet pour Le Siwa",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr" suppressHydrationWarning>
            <body className={`${inter.variable} ${oswald.variable} ${openSans.variable} ${permanentMarker.variable} font-sans antialiased`}>
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
