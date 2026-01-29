"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Providers } from "./providers";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {children}
        </TooltipProvider>
      </AuthProvider>
    </Providers>
  );
}
