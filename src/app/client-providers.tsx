"use client";

import React, { useState } from 'react';
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/auth-context";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  // Create a new QueryClient instance for each request on the client side.
  // Note: It's important that this QueryClient instance is stable across renders.
  // Using useState ensures it's created only once per component instance.
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark" // Default to dark theme
          enableSystem={false} // Disable system preference detection
          disableTransitionOnChange // Optional: Improve performance
        >
          {children}
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
