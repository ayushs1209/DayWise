import type {Metadata} from 'next';
import { GeistSans } from 'geist/font/sans'; // Correct import for Geist Sans
import { GeistMono } from 'geist/font/mono'; // Correct import for Geist Mono
import './globals.css';
import { cn } from '@/lib/utils'; // Import cn utility

export const metadata: Metadata = {
  title: 'DayWise - Plan Your Day', // Updated Title
  description: 'An app to help you plan your day efficiently with AI-powered schedule suggestions.', // Updated Description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning> {/* Added suppressHydrationWarning */}
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          GeistSans.variable, // Use variable directly
          GeistMono.variable  // Use variable directly
        )}
      >
        {children}
      </body>
    </html>
  );
}
