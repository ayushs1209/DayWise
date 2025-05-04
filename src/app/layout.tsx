import type {Metadata} from 'next';
import { GeistSans } from 'geist/font/sans';
// Removed GeistMono import as it's not found
import './globals.css';
import { cn } from '@/lib/utils'; // Import cn utility
import { ThemeProvider } from '@/components/theme-provider'; // Import ThemeProvider

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
          // Removed GeistMono.variable
        )}
      >
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false} // Disable system preference to default to dark
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
      </body>
    </html>
  );
}
