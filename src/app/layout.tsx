import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/auth-context"; // Import AuthProvider
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // Import React Query
import ClientProviders from "./client-providers"; // Import the new client provider wrapper

export const metadata: Metadata = {
  title: "DayWise - Plan Your Day",
  description: "An app to help you plan your day efficiently with AI-powered schedule suggestions.",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          GeistSans.variable
        )}
      >
        <ClientProviders>
            {children}
        </ClientProviders>
      </body>
    </html>
  );
}
